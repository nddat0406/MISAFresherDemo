using Core.Enum;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Core.MISAAttribute;

namespace Core.Entity
{
    [MISATableName("shifts")]
    public class Shift
    {
        [MISAKey("ShiftId không được để trống.")]
        [MISAColumnName("shift_id")]
        public Guid ShiftId { get; set; }

        [MISARequire("Mã ca không được để trống.")]
        [MISAColumnName("shift_code")]
        public string ShiftCode { get; set; } = null!;
        [MISARequire("Tên ca không được để trống.")]
        [MISAColumnName("shift_name")]
        public string ShiftName { get; set; } = null!;

        [MISARequire("Thời gian bắt đầu ca không được để trống.")]
        [MISAColumnName("begin_shift_time")]
        public TimeOnly BeginShiftTime { get; set; }
        [MISARequire("Thời gian kết thúc ca không được để trống.")]
        [MISAColumnName("end_shift_time")]
        public TimeOnly EndShiftTime { get; set; }
        [MISAColumnName("begin_break_time")]
        public TimeOnly? BeginBreakTime { get; set; }
        [MISAColumnName("end_break_time")]
        public TimeOnly? EndBreakTime { get; set; }
        [MISAColumnName("breaking_time_hours")]
        public decimal BreakingTime { get; set; }
        [MISAColumnName("working_time_hours")]
        public decimal WorkingTime { get; set; }
        [MISAColumnName("description")]
        public string? Description { get; set; }
        [MISARequire("Trạng thái ca không được để trống.")]
        [MISAColumnName("status")]
        public ShiftStatus Status { get; set; }

        [MISARequire("Người tạo không được để trống.")]
        [MISAColumnName("created_by")]
        public string CreatedBy { get; set; } = null!;
        [MISARequire("Ngày tạo không được để trống.")]
        [MISAColumnName("created_date")]
        public DateTimeOffset CreatedDate { get; set; }
        [MISAColumnName("modified_by")]
        public string? ModifiedBy { get; set; }
        [MISAColumnName("modified_date")]
        public DateTimeOffset? ModifiedDate { get; set; }
    }

}
