using Core.DTO;
using Core.DTO.General;
using Core.Entity;
using Core.Enum;

namespace Core.Helpers
{
    public static class ShiftMapping
    {
        public static ShiftDTO ToDto(this Shift entity)
        {

            // Map entity -> DTO để trả về client
            return new ShiftDTO
            {
                ShiftId = entity.ShiftId,
                ShiftCode = entity.ShiftCode,
                ShiftName = entity.ShiftName,

                // Spec: store/return normalized "HH:mm:ss"
                BeginShiftTime = entity.BeginShiftTime.ToString("HH:mm:ss"),
                EndShiftTime = entity.EndShiftTime.ToString("HH:mm:ss"),
                BeginBreakTime = entity.BeginBreakTime?.ToString("HH:mm:ss"),
                EndBreakTime = entity.EndBreakTime?.ToString("HH:mm:ss"),

                Description = entity.Description,

                WorkingTime = entity.WorkingTime,
                BreakingTime = entity.BreakingTime,

                // Mapping trạng thái về cờ Inactive
                Inactive = entity.Status == ShiftStatus.Inactive,

                CreatedBy = entity.CreatedBy,
                CreatedDate = entity.CreatedDate,
                ModifiedBy = entity.ModifiedBy,
                ModifiedDate = entity.ModifiedDate
            };
        }

        

        public static Shift ToEntity(this SaveDTO<ShiftDTO> dto)
        {
            // Map DTO cập nhật -> entity để save vào DB
            return new Shift
            {
                ShiftId = dto.EntityDTO.ShiftId,
                ShiftCode = dto.EntityDTO.ShiftCode,
                ShiftName = dto.EntityDTO.ShiftName,
                BeginShiftTime = TimeOnly.Parse(dto.EntityDTO.BeginShiftTime),
                EndShiftTime = TimeOnly.Parse(dto.EntityDTO.EndShiftTime),
                BeginBreakTime = string.IsNullOrWhiteSpace(dto.EntityDTO.BeginBreakTime) ? null : TimeOnly.Parse(dto.EntityDTO.BeginBreakTime),
                EndBreakTime = string.IsNullOrWhiteSpace(dto.EntityDTO.EndBreakTime) ? null : TimeOnly.Parse(dto.EntityDTO.EndBreakTime),

                Description = dto.EntityDTO.Description,

                // Quy ước: Inactive=true -> Status=Inactive
                Status = dto.EntityDTO.Inactive ? ShiftStatus.Inactive : ShiftStatus.Active,

                ModifiedBy = dto.EntityDTO.ModifiedBy,
                ModifiedDate = dto.EntityDTO.ModifiedDate
            };
        }
    }
}
