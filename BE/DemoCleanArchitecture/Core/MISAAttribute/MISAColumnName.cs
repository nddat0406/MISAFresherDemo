using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.MISAAttribute
{
    [AttributeUsage(AttributeTargets.Property)]
    public class MISAColumnName : Attribute
    {
        public string ColumnName { get; }

        public MISAColumnName(string columnName)
        {
            ColumnName = columnName;
        }
    }
}
