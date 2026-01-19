using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.DTO
{
    public class ShiftStatusUpdateDTO
    {
        public bool Inactive { get; set; }
        public List<Guid> ListId { get; set; } = new();
    }
}
