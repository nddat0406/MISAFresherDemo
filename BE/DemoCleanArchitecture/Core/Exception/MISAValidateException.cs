using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core
{
    /// <summary>
    /// Exception cho lỗi validation dữ liệu.
    /// Sử dụng khi dữ liệu không đáp ứng yêu cầu nghiệp vụ.
    /// Created By DatND (18/1/2026)
    /// </summary>
    public class MISAValidateException : Exception
    {
        public string Msg { get; set; }

        public List<string> ValidationErrors { get; set; } = new List<string>();

        public MISAValidateException()
        {
            Msg = "Dữ liệu không hợp lệ";
        }

        public MISAValidateException(string message) : base(message)
        {
            this.Msg = message;
        }

        public MISAValidateException(string message, List<string> validationErrors) : base(message)
        {
            this.Msg = message;
            this.ValidationErrors = validationErrors;
        }

        public MISAValidateException(string message, Exception innerException) : base(message, innerException)
        {
            this.Msg = message;
        }
    }

    /// <summary>
    /// Exception cho lỗi không tìm thấy dữ liệu.
    /// Sử dụng khi query không tìm thấy bản ghi.
    /// Created By DatND (18/1/2026)
    /// </summary>
    public class MISANotFoundException : Exception
    {
        public string EntityName { get; set; }
        public object? EntityId { get; set; }

        public MISANotFoundException(string entityName, object? entityId)
            : base($"Không tìm thấy {entityName} với ID: {entityId}")
        {
            EntityName = entityName;
            EntityId = entityId;
        }

        public MISANotFoundException(string message) : base(message)
        {
            EntityName = string.Empty;
        }
    }

    /// <summary>
    /// Exception cho lỗi trùng lặp dữ liệu.
    /// Sử dụng khi dữ liệu vi phạm unique constraint.
    /// Created By DatND (18/1/2026)
    /// </summary>
    public class MISADuplicateException : Exception
    {
        public string FieldName { get; set; }
        public object? FieldValue { get; set; }

        public MISADuplicateException(string fieldName, object? fieldValue)
      : base($"{fieldName} '{fieldValue}' đã tồn tại trong hệ thống")
        {
            FieldName = fieldName;
            FieldValue = fieldValue;
        }

        public MISADuplicateException(string message) : base(message)
        {
            FieldName = string.Empty;
        }
    }

    /// <summary>
    /// Exception cho lỗi nghiệp vụ.
    /// Sử dụng khi vi phạm rule nghiệp vụ phức tạp.
    /// Created By DatND (18/1/2026)
    /// </summary>
    public class MISABusinessException : Exception
    {
        public string BusinessRule { get; set; }

        public MISABusinessException(string message) : base(message)
        {
            BusinessRule = message;
        }

        public MISABusinessException(string businessRule, string message) : base(message)
        {
            BusinessRule = businessRule;
        }
    }
}
