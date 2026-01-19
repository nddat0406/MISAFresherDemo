using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.MISAAttribute
{
    [AttributeUsage(AttributeTargets.Property)]
    public class MISAKey: Attribute
    {
        public string ErrorMessage { get; }
        public MISAKey( string errorMessage)
        {
            ErrorMessage = errorMessage;
        }
    }
}
