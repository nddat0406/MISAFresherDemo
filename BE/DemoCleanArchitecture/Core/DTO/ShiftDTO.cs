using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.DTO
{
    public class ShiftDTO
    {
        public Guid ShiftId { get; set; }
        public string ShiftCode { get; set; } = null!;
        public string ShiftName { get; set; } = null!;

        public string BeginShiftTime { get; set; } = null!;
        public string EndShiftTime { get; set; } = null!;

        public string? BeginBreakTime { get; set; }
        public string? EndBreakTime { get; set; }

        public string? Description { get; set; }

        public decimal WorkingTime { get; set; }
        public decimal BreakingTime { get; set; }

        public bool Inactive { get; set; }

        public string CreatedBy { get; set; } = null!;
        public DateTimeOffset CreatedDate { get; set; }

        public string? ModifiedBy { get; set; }
        public DateTimeOffset? ModifiedDate { get; set; }
    }

}
