using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.MISAAttribute
{
    [AttributeUsage(AttributeTargets.Class)]

    public class MISATableName : Attribute
    {
        public string TableName { get; }

        public MISATableName(string tableName)
        {
            TableName = tableName;
        }
    }
}
