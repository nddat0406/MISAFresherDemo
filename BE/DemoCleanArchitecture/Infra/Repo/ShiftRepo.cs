using Core.Entity;
using Core.Enum;
using Core.Interface.Repo;
using Dapper;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infra.Repo
{
    public class ShiftRepo : BaseRepo<Shift>, IShiftRepo
    {
        public ShiftRepo(IConfiguration configuration, IHostEnvironment env) : base(configuration, env)
        {
        }

        public Task ChangeStatusAsync(List<Guid> ids, ShiftStatus changeToStatus)
        {
            using (var connection = new MySqlConnection(ConnectionString))
            {
                var sql = $"UPDATE shifts SET status = @Status WHERE shift_id IN @Ids";
                var parameters = new DynamicParameters();
                parameters.Add("Status", changeToStatus);
                parameters.Add("Ids", ids);

                return connection.ExecuteAsync(sql, parameters);
            }
        }

        public Task<Shift> GetByCode(string shiftCode)
        {
            using (var connection = new MySqlConnection(ConnectionString))
            {
                var sql = "SELECT * FROM shifts WHERE shift_code = @ShiftCode LIMIT 1";
                var parameters = new DynamicParameters();
                parameters.Add("ShiftCode", shiftCode);
                return connection.QueryFirstOrDefaultAsync<Shift>(sql, parameters);
            }
        }
    }
}
