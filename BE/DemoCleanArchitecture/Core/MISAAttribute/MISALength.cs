using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.MISAAttribute
{
    [AttributeUsage(AttributeTargets.Property)]
    public class MISALength: Attribute
    {
        public int Length { get; }
        public string ErrorMessage { get; set; }
        public MISALength(int length, string errorMessage)
        {
            Length = length;
            ErrorMessage = errorMessage;
        }
    }
}
