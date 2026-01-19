using Core.DTO.General;
using Core.Enum;
using Core.Helpers;
using Core.Interface.Repo;
using Core.MISAAttribute;
using Dapper;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Infra.Repo
{
    public abstract class BaseRepo<T> : IBaseRepo<T> where T : class
    {
        private readonly string _connectionString;

        /**
         * Khởi tạo repository cơ sở và chọn chuỗi kết nối theo môi trường (Dev/Prod).
         * Điều kiện: appsettings phải có `ConnectionStrings:DevConnectionString/ProdConnectionString`.
         * Created By DatND (15/1/2026)
         */
        public BaseRepo(IConfiguration configuration, IHostEnvironment env)
        {
            if (env.IsProduction())
            {
                _connectionString = configuration.GetConnectionString("ProdConnectionString")
                    ?? throw new InvalidOperationException("Thiếu ProdConnectionString trong cấu hình.");
            }
            else
            {
                _connectionString = configuration.GetConnectionString("DevConnectionString")
                    ?? throw new InvalidOperationException("Thiếu DevConnectionString trong cấu hình.");
            }
        }

        // Chuỗi kết nối DB
        protected string ConnectionString => _connectionString;

        /**
         * Lấy tên bảng từ attribute `MISATableName`, nếu không có thì dùng tên class.
         * Điều kiện: entity có thể khai báo `[MISATableName("...")]` để map tên bảng.
         * Created By DatND (15/1/2026)
         */
        private string GetTableName()
        {
            var tableName = typeof(T).Name;
            var tableAttr = typeof(T).GetCustomAttribute<MISATableName>();
            return tableAttr != null ? tableAttr.TableName : tableName;
        }

        /**
         * Xác định property khoá chính theo attribute `MISAKey`.
         * Nếu không có thì fallback theo convention: `{TypeName}Id` hoặc `Id`.
         * Created By DatND (16/1/2026)
         */
        private static PropertyInfo GetKeyProperty()
        {
            var props = typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance);

            // 1) Ưu tiên [MISAKey]
            var keyProp = props.FirstOrDefault(p => p.GetCustomAttribute<MISAKey>() != null);
            if (keyProp != null) return keyProp;

            // 2) Fallback dùng {TypeName}Id
            var typeName = typeof(T).Name;
            var candidate1 = $"{typeName}Id";
            keyProp = props.FirstOrDefault(p => string.Equals(p.Name, candidate1, StringComparison.OrdinalIgnoreCase));
            if (keyProp != null) return keyProp;

            // 3) Fallback dùng luôn Id
            keyProp = props.FirstOrDefault(p => string.Equals(p.Name, "Id", StringComparison.OrdinalIgnoreCase));
            if (keyProp != null) return keyProp;

            throw new InvalidOperationException(
                $"Không xác định được khoá chính cho {typeof(T).Name}. Hãy dùng `[MISAKey]` hoặc property '{candidate1}' / 'Id'.");
        }

        /**
         * Lấy tên cột DB cho property.
         * Rule: dùng `[MISAColumnName]` nếu có, nếu không thì dùng tên property.
         * Created By DatND (16/1/2026)
         */
        private static string GetColumnName(PropertyInfo property)
        {
            var colAttr = property.GetCustomAttribute<MISAColumnName>();
            return colAttr != null ? colAttr.ColumnName : property.Name;
        }

        /**
         * Lấy danh sách tất cả bản ghi của bảng tương ứng.
         * Created By DatND (15/1/2026)
         */
        public virtual async Task<IEnumerable<T>> GetAllAsync()
        {
            using (var connection = new MySqlConnection(_connectionString))
            {
                var data = await connection.QueryAsync<T>($"SELECT * FROM {GetTableName()}");
                return data;
            }
        }

        /**
         * Lấy 1 bản ghi theo id:
         * - Key: xác định bằng `[MISAKey]` (ưu tiên) hoặc convention.
         * - Column name: theo `[MISAColumnName]` (ưu tiên) hoặc tên property.
         * Created By DatND (16/1/2026)
         */
        public virtual async Task<T?> GetByIdAsync(Guid id)
        {
            var keyProperty = GetKeyProperty();
            var keyColumn = GetColumnName(keyProperty);
            var paramName = keyProperty.Name;

            var sql = $"SELECT * FROM {GetTableName()} WHERE {keyColumn} = @{paramName}";

            using (var connection = new MySqlConnection(_connectionString))
            {
                var data = await connection.QuerySingleOrDefaultAsync<T>(sql, new Dictionary<string, object>
                {
                    [paramName] = id
                });
                return data;
            }
        }

        /**
         * Thêm mới bản ghi: insert các property có `[MISAColumnName]`.
         * Created By DatND (15/1/2026)
         */
        public virtual async Task<T> InsertAsync(T entity)
        {
            if (entity == null) throw new ArgumentNullException(nameof(entity));

            using (var connection = new MySqlConnection(_connectionString))
            {
                var properties = typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance);

                var columns = new List<string>();
                var values = new List<string>();
                var parameters = new DynamicParameters();

                foreach (var property in properties)
                {
                    var colAttr = property.GetCustomAttribute<MISAColumnName>();
                    if (colAttr == null) continue; // rule: chỉ insert các cột được map

                    columns.Add(colAttr.ColumnName);
                    values.Add("@" + property.Name);
                    parameters.Add("@" + property.Name, property.GetValue(entity));
                }

                if (columns.Count == 0)
                {
                    throw new InvalidOperationException(
                        $"Entity {typeof(T).Name} chưa khai báo `[MISAColumnName]` cho các property cần insert.");
                }

                var insertQuery =
                    $"INSERT INTO {GetTableName()} ({string.Join(", ", columns)}) VALUES ({string.Join(", ", values)})";

                await connection.ExecuteAsync(insertQuery, parameters);
                return entity;
            }
        }

        /**
         * Cập nhật bản ghi theo khoá chính:
         * - Key: `[MISAKey]` (ưu tiên) hoặc convention.
         * - Update columns: các property có `[MISAColumnName]` (trừ khoá chính).
         * - WHERE: dùng tên cột theo `[MISAColumnName]` (nếu có) trên key property.
         * Created By DatND (16/1/2026)
         */
        public virtual async Task<T> UpdateAsync(T entity)
        {
            if (entity == null) throw new ArgumentNullException(nameof(entity));

            var keyProperty = GetKeyProperty();
            var keyValue = keyProperty.GetValue(entity);
            if (keyValue == null)
            {
                throw new InvalidOperationException($"Giá trị khoá chính '{keyProperty.Name}' không được null.");
            }

            var keyColumn = GetColumnName(keyProperty);

            using (var connection = new MySqlConnection(_connectionString))
            {
                var setClauses = new List<string>();
                var parameters = new DynamicParameters();

                // Build câu SET trừ khoá chính
                foreach (var property in typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance))
                {
                    // Nếu là khoá chính thì bỏ qua
                    if (string.Equals(property.Name, keyProperty.Name, StringComparison.OrdinalIgnoreCase))
                        continue;

                    var colAttr = property.GetCustomAttribute<MISAColumnName>();
                    if (colAttr == null) continue; // rule: chỉ update các cột được map

                    setClauses.Add($"{colAttr.ColumnName} = @{property.Name}");
                    parameters.Add("@" + property.Name, property.GetValue(entity));
                }

                if (setClauses.Count == 0)
                {
                    return entity;
                }

                // Param cho câu WHERE uses property name; column uses mapped column name
                parameters.Add("@" + keyProperty.Name, keyValue);

                var sql = $"UPDATE {GetTableName()} SET {string.Join(", ", setClauses)} WHERE {keyColumn} = @{keyProperty.Name}";
                await connection.ExecuteAsync(sql, parameters);

                return entity;
            }
        }

        /**
         * Xoá 1 bản ghi theo id:
         * - Key: `[MISAKey]` (ưu tiên) hoặc convention.
         * - Column name: theo `[MISAColumnName]` (ưu tiên) hoặc tên property.
         * Created By DatND (16/1/2026)
         */
        public virtual async Task DeleteAsync(List<T> entities)
        {
            var keyProperty = GetKeyProperty();
            var keyColumn = GetColumnName(keyProperty);
            var paramName = keyProperty.Name;

            var sql = $"DELETE FROM {GetTableName()} WHERE {keyColumn} in @{paramName}";

            using (var connection = new MySqlConnection(_connectionString))
            {
                await connection.ExecuteAsync(sql, new Dictionary<string, object>
                {
                    [paramName] = entities.Select(e => keyProperty.GetValue(e)).ToList()
                });
            }
        }

        /**
         * Lấy danh sách bản ghi theo điều kiện phân trang, lọc, sắp xếp.
         * - Pagination: PageIndex (1-based), PageSize
         * - Filter: JSON array format [["field","operator",value],"and/or",...]
         * - Sort: JSON array format [{"Selector":"field","Desc":true/false},...]
         * - CustomParam: Custom query cho các điều kiện khác
         * - Columns: Tên các cột cần lấy, ngăn cách bởi dấu phẩy
         * Created By DatND (17/1/2026)
         */
        public virtual async Task<List<T>> GetByConditionAsync(QueryDTO queryDto)
        {
            if (queryDto == null) throw new ArgumentNullException(nameof(queryDto));

            using (var connection = new MySqlConnection(_connectionString))
            {
                var tableName = GetTableName();
                var sql = new StringBuilder();
                var parameters = new DynamicParameters();

                // 1. Build câu SELECT
                var selectColumns = BuildSelectClause(queryDto.Columns);
                sql.Append($"SELECT {selectColumns} FROM {tableName}");

                // 2. Build câu WHERE
                var whereClause = BuildWhereClause(queryDto, parameters);
                if (!string.IsNullOrWhiteSpace(whereClause))
                {
                    sql.Append($" WHERE {whereClause}");
                }

                // 3. Build câu ORDER BY
                var orderByClause = BuildOrderByClause(queryDto.Sort);
                if (!string.IsNullOrWhiteSpace(orderByClause))
                {
                    sql.Append($" ORDER BY {orderByClause}");
                }

                // 4. Build LIMIT/OFFSET cho phân trang
                var offset = (queryDto.PageIndex - 1) * queryDto.PageSize;
                sql.Append($" LIMIT @PageSize OFFSET @Offset");
                parameters.Add("@PageSize", queryDto.PageSize);
                parameters.Add("@Offset", offset);

                var data = await connection.QueryAsync<T>(sql.ToString(), parameters);
                return data?.ToList() ?? new List<T>();
            }
        }

        /**
         * Đếm tổng số bản ghi theo điều kiện lọc (không tính phân trang).
         * - Filter: JSON array format [["field","operator",value],"and/or",...]
         * - CustomParam: Custom query cho các điều kiện khác
         * Created By DatND (17/1/2026)
         */
        public virtual async Task<int> CountByConditionAsync(QueryDTO queryDto)
        {
            if (queryDto == null) throw new ArgumentNullException(nameof(queryDto));

            using (var connection = new MySqlConnection(_connectionString))
            {
                var tableName = GetTableName();
                var sql = new StringBuilder();
                var parameters = new DynamicParameters();

                sql.Append($"SELECT COUNT(*) FROM {tableName}");

                // Build câu WHERE như trong GetByConditionAsync nhưng không cần phân trang
                var whereClause = BuildWhereClause(queryDto, parameters);
                if (!string.IsNullOrWhiteSpace(whereClause))
                {
                    sql.Append($" WHERE {whereClause}");
                }

                var count = await connection.ExecuteScalarAsync<int>(sql.ToString(), parameters);
                return count;
            }
        }

        /**
         * Xây dựng SELECT clause từ danh sách cột.
         * - Nếu Columns rỗng hoặc null thì SELECT *
         * - Nếu có Columns thì map property name -> column name theo [MISAColumnName]
         * Created By DatND (17/1/2026)
         */
        private string BuildSelectClause(string? columns)
        {
            if (string.IsNullOrWhiteSpace(columns))
            {
                return "*";
            }

            var columnNames = columns.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(c => c.Trim())
                .Where(c => !string.IsNullOrEmpty(c));

            var properties = typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance);
            var mappedColumns = new List<string>();

            foreach (var colName in columnNames)
            {
                var property = properties.FirstOrDefault(p =>
                  string.Equals(p.Name, colName, StringComparison.OrdinalIgnoreCase));

                if (property == null)
                {
                    continue;

                }

                var dbColumn = GetColumnName(property);
                mappedColumns.Add(dbColumn);
            }

            return mappedColumns.Any() ? string.Join(", ", mappedColumns) : "*";
        }

        /**
         * Xây dựng WHERE clause từ Filter và CustomParam.
         * - Filter: JSON array format [["field","operator",value],"and/or",...]
         * - CustomParam: Dictionary<string, object> cho các điều kiện bổ sung
         * Created By DatND (17/1/2026)
         */
        private string BuildWhereClause(QueryDTO queryDto, DynamicParameters parameters)
        {
            var conditions = new List<string>();

            // 1. Parse Filter JSON
            if (!string.IsNullOrWhiteSpace(queryDto.Filter))
            {
                var filterCondition = ParseFilter(queryDto.Filter, parameters);
                if (!string.IsNullOrWhiteSpace(filterCondition))
                {
                    conditions.Add($"({filterCondition})");
                }
            }

            // 1b. Parse CustomFilter(Search)
            if (!string.IsNullOrWhiteSpace(queryDto.CustomFilter))
            {
                var customFilterCondition = ParseFilter(queryDto.CustomFilter, parameters);
                if (!string.IsNullOrWhiteSpace(customFilterCondition))
                {
                    conditions.Add($"({customFilterCondition})");
                }
            }

            // 2. Parse CustomParam (e.g., branchID)
            if (queryDto.CustomParam != null && queryDto.CustomParam.Any())
            {
                foreach (var kvp in queryDto.CustomParam)
                {
                    var property = typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance)
                      .FirstOrDefault(p => string.Equals(p.Name, kvp.Key, StringComparison.OrdinalIgnoreCase));

                    if (property != null)
                    {
                        var dbColumn = GetColumnName(property);
                        var paramName = $"@CustomParam_{kvp.Key}";
                        conditions.Add($"{dbColumn} = {paramName}");
                        parameters.Add(paramName, kvp.Value);
                    }
                }
            }

            return conditions.Any() ? string.Join(" AND ", conditions) : string.Empty;
        }

        /**
        * Biến Filter JSON array thành câu điều kiện WHERE.
        * Format: [["field","operator",value],"and/or",["field","operator",value],...]
        * Operators: contains, =, !=, >, <, >=, <=, startswith, endswith, ...
        * return: SQL condition string (ví dụ: "Name LIKE '%abc%' AND Age >= 30").
        * Created By DatND (17/1/2026)
        */
        private string ParseFilter(string filterJson, DynamicParameters parameters)
        {
            try
            {
                var filterArray = JsonSerializer.Deserialize<JsonElement>(filterJson);
                if (filterArray.ValueKind != JsonValueKind.Array)
                {
                    return string.Empty;
                }

                return ParseFilterRecursive(filterArray, parameters);
            }
            catch (JsonException)
            {
                // Invalid JSON, skip filter
                return string.Empty;
            }
        }

        /**
         * Đệ quy parse filter JSON array thành SQL condition.
         * Handles: [[condition],"and/or",[condition],...]
         * Created By DatND (17/1/2026)
         */
        private string ParseFilterRecursive(JsonElement element, DynamicParameters parameters)
        {
            if (element.ValueKind != JsonValueKind.Array)
            {
                return string.Empty;
            }

            var conditions = new List<string>();
            string? logicalOperator = null;
            var paramCounter = parameters.ParameterNames.Count();

            for (int i = 0; i < element.GetArrayLength(); i++)
            {
                var item = element[i];

                if (item.ValueKind == JsonValueKind.String)
                {
                    // Toán tử: "and" hoặc "or"
                    var op = item.GetString()?.ToLower();
                    if (op == "and" || op == "or")
                    {
                        logicalOperator = op.ToUpper();
                    }
                }
                else if (item.ValueKind == JsonValueKind.Array && item.GetArrayLength() == 3)
                {
                    // Single condition: ["field", "operator", value]
                    var condition = ParseSingleCondition(item, parameters, ref paramCounter);
                    if (!string.IsNullOrWhiteSpace(condition))
                    {
                        conditions.Add(condition);
                    }
                }
                else if (item.ValueKind == JsonValueKind.Array)
                {
                    // Điều kiện lồng: đệ quy
                    var nestedCondition = ParseFilterRecursive(item, parameters);
                    if (!string.IsNullOrWhiteSpace(nestedCondition))
                    {
                        conditions.Add($"({nestedCondition})");
                    }
                }
            }

            if (conditions.Count == 0)
            {
                return string.Empty;
            }

            var joinOperator = logicalOperator ?? "AND";
            return string.Join($" {joinOperator} ", conditions);
        }

        /**
         * Parse single filter condition: ["field", "operator", value]
         * Sử dụng FilterOperator enum để xử lý các toán tử một cách type-safe.
         * Operators:
         * - contains: field LIKE '%value%'
         * - notcontains: field NOT LIKE '%value%'
         * - startswith: field LIKE 'value%'
         * - endswith: field LIKE '%value'
         * - =, !=, >, <, >=, <=: direct comparison
         * Created By DatND (17/1/2026)
         */
        private string ParseSingleCondition(JsonElement condition, DynamicParameters parameters, ref int paramCounter)
        {
            if (condition.GetArrayLength() < 2)
            {
                return string.Empty;
            }

            var fieldName = condition[0].GetString();
            var operatorStr = condition[1].GetString();

            if (string.IsNullOrWhiteSpace(fieldName) || string.IsNullOrWhiteSpace(operatorStr))
            {
                return string.Empty;
            }

            // Parse operator string thành FilterOperator enum
            var filterOperator = FilterOperatorHelper.ParseOperator(operatorStr);
            if (filterOperator == null)
            {
                return string.Empty; // Unsupported operator
            }

            // Map property name cho DB column name
            var property = typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance)
                .FirstOrDefault(p => string.Equals(p.Name, fieldName, StringComparison.OrdinalIgnoreCase));

            if (property == null)
            {
                return string.Empty; // ko tìm thấy property, skip điều kiện
            }

            var dbColumn = GetColumnName(property);

            // Kiểm tra câu condition có value hay không
            if (condition.GetArrayLength() < 3)
            {
                return string.Empty;
            }

            var value = condition[2];
            var paramName = $"@Filter_{paramCounter++}";

            // Extract value từ JsonElement
            object? paramValue = ExtractJsonValue(value);

            // Build SQL condition dựa trên operator type
            return BuildSqlCondition(dbColumn, filterOperator.Value, paramName, paramValue, parameters);
        }

        /**
         * Extract giá trị từ JsonElement thành object.
         * Created By DatND (17/1/2026)
         */
        private object? ExtractJsonValue(JsonElement value)
        {
            switch (value.ValueKind)
            {
                case JsonValueKind.String:
                    return value.GetString();
                case JsonValueKind.Number:
                    if (value.TryGetInt32(out var intVal))
                        return intVal;
                    else if (value.TryGetInt64(out var longVal))
                        return longVal;
                    else if (value.TryGetDecimal(out var decVal))
                        return decVal;
                    else
                        return value.GetDouble();
                case JsonValueKind.True:
                    return true;
                case JsonValueKind.False:
                    return false;
                case JsonValueKind.Null:
                    return null;
                case JsonValueKind.Array:
                    // Xử lý array cho IN/NOT IN operators
                    var arrayValues = new List<object?>();
                    for (int i = 0; i < value.GetArrayLength(); i++)
                    {
                        arrayValues.Add(ExtractJsonValue(value[i]));
                    }
                    return arrayValues;
                default:
                    return value.ToString();
            }
        }

        /**
         * Build SQL condition dựa trên FilterOperator enum.
         * return: SQL condition string và thêm param vào DynamicParameters.
         * SQL condition string: field operator '%value%' (ví dụ: "Name LIKE '%abc%' , Age >= 30")
         * Created By DatND (17/1/2026)
         */
            private string BuildSqlCondition(string dbColumn, FilterOperator operatorType, string paramName,
              object? paramValue, DynamicParameters parameters)
            {
                // NULL operators (IS NULL, IS NOT NULL) - không cần parameter
                if (operatorType == FilterOperator.IsNull)
                {
                    return $"{dbColumn} IS NULL";
                }
                if (operatorType == FilterOperator.IsNotNull)
                {
                    return $"{dbColumn} IS NOT NULL";
                }

                // LIKE operators (contains, notcontains, startswith, endswith)
                if (FilterOperatorHelper.IsLikeOperator(operatorType))
                {
                    var pattern = FilterOperatorHelper.BuildLikePattern(operatorType, paramValue?.ToString() ?? "");
                    parameters.Add(paramName, pattern);
                    return $"{dbColumn} {(operatorType == FilterOperator.NotContains ? "NOT" : "")} LIKE {paramName}";
                }

                // Standard comparison operators (=, !=, >, <, >=, <=, <>)
                var sqlOperator = FilterOperatorHelper.GetSqlOperator(operatorType);
                parameters.Add(paramName, paramValue);
                return $"{dbColumn} {sqlOperator} {paramName}";
            }

        /**
         * Xây dựng ORDER BY clause từ Sort JSON.
         * Format: [{"Selector":"field","Desc":true/false},...]
         * Created By DatND (17/1/2026)
         */
        private string BuildOrderByClause(string? sortJson)
        {
            if (string.IsNullOrWhiteSpace(sortJson))
            {
                return string.Empty;
            }

            try
            {
                var sortArray = JsonSerializer.Deserialize<JsonElement>(sortJson);
                if (sortArray.ValueKind != JsonValueKind.Array)
                {
                    return string.Empty;
                }

                var orderByClauses = new List<string>();

                for (int i = 0; i < sortArray.GetArrayLength(); i++)
                {
                    var sortItem = sortArray[i];
                    if (sortItem.ValueKind != JsonValueKind.Object)
                    {
                        continue;
                    }

                    if (!sortItem.TryGetProperty("Selector", out var selectorElement))
                    {
                        continue;
                    }

                    var fieldName = selectorElement.GetString();
                    if (string.IsNullOrWhiteSpace(fieldName))
                    {
                        continue;
                    }

                    var isDesc = false;
                    if (sortItem.TryGetProperty("Desc", out var descElement) && descElement.ValueKind == JsonValueKind.True)
                    {
                        isDesc = true;
                    }

                    // Map property name to DB column name
                    var property = typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance)
                           .FirstOrDefault(p => string.Equals(p.Name, fieldName, StringComparison.OrdinalIgnoreCase));

                    if (property != null)
                    {
                        var dbColumn = GetColumnName(property);
                        var direction = isDesc ? "DESC" : "ASC";
                        orderByClauses.Add($"{dbColumn} {direction}");
                    }
                }

                return orderByClauses.Any() ? string.Join(", ", orderByClauses) : string.Empty;
            }
            catch (JsonException)
            {
                // Invalid JSON, skip sorting
                return string.Empty;
            }
        }

        /**
         * Lưu entity: tự động quyết định INSERT hay UPDATE dựa vào giá trị khoá chính.
         * Logic:
         * - Nếu key = Guid.Empty: INSERT (tạo mới GUID)
         * - Nếu key có giá trị và record tồn tại: UPDATE
         * - Nếu key có giá trị nhưng record không tồn tại: INSERT
         * Created By DatND (17/1/2026)
         */
        public virtual async Task<T> SaveAsync(T entity)
        {
            if (entity == null) throw new ArgumentNullException(nameof(entity));

            var keyProperty = GetKeyProperty();
            var keyValue = keyProperty.GetValue(entity);

            // Kiểm tra xem key có phải là Guid không
            if (keyProperty.PropertyType == typeof(Guid))
            {
                var guidKey = (Guid)(keyValue ?? Guid.Empty);

                // Nếu key là Guid.Empty → INSERT (tạo mới)
                if (guidKey == Guid.Empty)
                {
                    // Tạo GUID mới cho entity
                    keyProperty.SetValue(entity, Guid.NewGuid());
                    return await InsertAsync(entity);
                }

                // Nếu key có giá trị → kiểm tra xem record có tồn tại không
                var existingEntity = await GetByIdAsync(guidKey);
                if (existingEntity != null)
                {
                    // Record tồn tại → UPDATE
                    return await UpdateAsync(entity);
                }
                else
                {
                    // Record không tồn tại → INSERT
                    return await InsertAsync(entity);
                }
            }

            // Nếu key không phải Guid (ví dụ: int, string)
            if (keyValue == null)
            {
                // Key null → INSERT
                return await InsertAsync(entity);
            }
            else
            {
                // Key có giá trị → UPDATE
                return await UpdateAsync(entity);
            }
        }
    }
}