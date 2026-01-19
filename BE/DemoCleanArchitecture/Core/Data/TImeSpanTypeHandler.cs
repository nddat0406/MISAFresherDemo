using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Data
{
    public sealed class TimeOnlyTypeHandler : SqlMapper.TypeHandler<TimeOnly>
    {
        /**
         * Chuyển đổi kiểu database TIME (TimeSpan) → TimeOnly
         * Created By DatND (15/1/2026)
         */
        public override TimeOnly Parse(object value)
        {
            return value switch
            {
                TimeSpan ts => TimeOnly.FromTimeSpan(ts),
                DateTime dt => TimeOnly.FromDateTime(dt),
                _ => throw new InvalidDataException($"Cannot convert {value.GetType()} to TimeOnly")
            };
        }

        /**
         * Chuyển đổi kiểu TimeOnly → database TIME
         */
        public override void SetValue(IDbDataParameter parameter, TimeOnly value)
        {
            parameter.Value = value.ToTimeSpan();
            parameter.DbType = DbType.Time;
        }
    }

}
