using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.MISAAttribute
{
    [AttributeUsage(AttributeTargets.Property)]
    public class MISARequire: Attribute
    {
        public string ErrorMessage { get; set; }
        public MISARequire(string errorMessage)
        {
            ErrorMessage = errorMessage;
        }
    }
}
