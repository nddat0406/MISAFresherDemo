using Core.DTO;
using Core.DTO.General;
using Core.Entity;
using Core.Enum;
using Core.Helpers;
using Core.Interface.Repo;
using Core.Interface.Service;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Service
{
    public class ShiftService : BaseService<Shift, ShiftDTO>, IShiftService
    {
        private readonly IShiftRepo _shiftRepo;
        public ShiftService(IShiftRepo shiftRepo) : base(shiftRepo)
        {
            _shiftRepo = shiftRepo;
        }

        /**
         * Thay đổi trạng thái của nhiều ca làm việc.
         * Validation: Danh sách IDs không được null/rỗng, không quá 100 items
         * Created By DatND (17/1/2026)
         */
        public async Task ChangeShiftStatus(List<Guid> ids, bool inactive)
        {
            // Validate danh sách IDs
            ValidateIdList(ids, "cập nhật trạng thái");

            var changeToStatus = inactive ? ShiftStatus.Inactive : ShiftStatus.Active;
            await _shiftRepo.ChangeStatusAsync(ids, changeToStatus);
        }

        /**
         * Validate nghiệp vụ custom cho Shift.
         * - Kiểm tra thời gian hợp lệ
         * - Kiểm tra mã ca trùng lặp
         * - Kiểm tra logic nghiệp vụ
         * Created By DatND (18/1/2026)
         */
        protected override async Task ValidateCustom(Shift entity, ShiftDTO? dto, int mode, int state)
        {
            var validationErrors = new List<string>();


            // 2. Validate thời gian nghỉ (nếu có)
            if (entity.BeginBreakTime.HasValue && entity.EndBreakTime.HasValue)
            {
                if (entity.EndBreakTime.Value <= entity.BeginBreakTime.Value)
                {
                    validationErrors.Add("Thời gian kết thúc nghỉ phải sau thời gian bắt đầu nghỉ");
                }

                // Kiểm tra break time nằm trong shift time
                if (entity.BeginBreakTime.Value < entity.BeginShiftTime)
                {
                    validationErrors.Add("Thời gian bắt đầu nghỉ không được trước thời gian bắt đầu ca");
                }

                if (entity.EndBreakTime.Value > entity.EndShiftTime)
                {
                    validationErrors.Add("Thời gian kết thúc nghỉ không được sau thời gian kết thúc ca");
                }
            }
            else if (entity.BeginBreakTime.HasValue || entity.EndBreakTime.HasValue)
            {
                // Một trong hai có giá trị nhưng cái kia không có
                validationErrors.Add("Thời gian bắt đầu và kết thúc nghỉ phải được nhập cùng nhau");
            }

            // 3. Validate mã ca (ShiftCode)
            if (!string.IsNullOrWhiteSpace(entity.ShiftCode))
            {
                // Kiểm tra trùng mã ca
                var existingShift = await _shiftRepo.GetByCode(entity.ShiftCode);
                if (existingShift != null && existingShift.ShiftId != entity.ShiftId && state!=2 )
                {
                    validationErrors.Add("Mã ca đã tồn tại trong hệ thống");
                }
                // Kiểm tra độ dài
                if (entity.ShiftCode.Length > 20)
                {
                    validationErrors.Add("Mã ca không được vượt quá 20 ký tự");
                }
            }

            // 4. Validate tên ca (ShiftName)
            if (!string.IsNullOrWhiteSpace(entity.ShiftName))
            {
                if (entity.ShiftName.Length < 3)
                {
                    validationErrors.Add("Tên ca phải có ít nhất 3 ký tự");
                }

                if (entity.ShiftName.Length > 50)
                {
                    validationErrors.Add("Tên ca không được vượt quá 50 ký tự");
                }
            }

            // 5. Validate Description
            if (!string.IsNullOrWhiteSpace(entity.Description) && entity.Description.Length > 255)
            {
                validationErrors.Add("Mô tả không được vượt quá 255 ký tự");
            }

            // Throw exception nếu có lỗi
            if (validationErrors.Any())
            {
                var mainMessage = validationErrors.Count == 1
                ? validationErrors[0]
            : $"Dữ liệu ca làm việc không hợp lệ: {validationErrors.Count} lỗi";

                throw new MISAValidateException(mainMessage, validationErrors);
            }
        }

        /**
         * Xử lý nghiệp vụ trước khi save.
         * - Set ShiftId cho bản ghi mới
         * - Set trạng thái
         * - Set thời gian tạo/sửa
         * - Tính toán WorkingTime và BreakingTime
         * Created By DatND (17/1/2026)
         * Updated By DatND (18/1/2026) - Thêm tính toán WorkingTime và BreakingTime
         */
        protected override async Task BeforeSaveAsync(Shift entity, ShiftDTO dto, int mode, int state)
        {
            // Tính toán WorkingTime và BreakingTime
            var shiftDuration = entity.EndShiftTime.ToTimeSpan() - entity.BeginShiftTime.ToTimeSpan();

            if (entity.BeginBreakTime.HasValue && entity.EndBreakTime.HasValue)
            {
                var breakDuration = entity.EndBreakTime.Value.ToTimeSpan() - entity.BeginBreakTime.Value.ToTimeSpan();
                entity.BreakingTime = (decimal)breakDuration.TotalHours;
                entity.WorkingTime = (decimal)(shiftDuration - breakDuration).TotalHours;
            }
            else
            {
                entity.BreakingTime = 0;
                entity.WorkingTime = (decimal)shiftDuration.TotalHours;
            }

            // Xử lý theo state
            if (state == 1) // Create
            {
                entity.ShiftId = Guid.NewGuid();
                entity.Status = ShiftStatus.Active;
                entity.CreatedDate = DateTimeOffset.UtcNow;
                entity.ModifiedDate = DateTimeOffset.UtcNow;

                // Hard code cho demo
                entity.CreatedBy = "System";
                entity.ModifiedBy = "System";
            }
            else if (state == 2) // Update
            {
                var existingEntity = await _shiftRepo.GetByIdAsync(entity.ShiftId); // Đảm bảo entity tồn tại trước khi update
                if (existingEntity == null)
                {
                    throw new MISAValidateException("Ca làm việc không tồn tại");
                }
                // Giữ nguyên Created info
                entity.CreatedBy = existingEntity.CreatedBy;
                entity.CreatedDate = existingEntity.CreatedDate;

                entity.Status = dto.Inactive ? ShiftStatus.Inactive : ShiftStatus.Active;
                entity.ModifiedDate = DateTimeOffset.UtcNow;

                // Hard code cho demo
                entity.ModifiedBy = "System";
            }
            else if (state == 4) // Duplicate
            {
                entity.ShiftId = Guid.NewGuid();
                entity.Status = dto.Inactive ? ShiftStatus.Inactive : ShiftStatus.Active;
                entity.CreatedDate = DateTimeOffset.UtcNow;
                entity.ModifiedDate = DateTimeOffset.UtcNow;

                // Hard code for demo
                entity.CreatedBy = "System";
                entity.ModifiedBy = "System";
            }
        }

        /**
              * Map Shift entity sang ShiftDTO.
         * Created By DatND (17/1/2026)
       */
        protected override ShiftDTO MapToDto(Shift entity)
        {
            return ShiftMapping.ToDto(entity);
        }

        /**
      * Map ShiftDTO sang Shift entity.
         * Created By DatND (17/1/2026)
         */
        protected override Shift MapToEntity(ShiftDTO dto)
        {
            return ShiftMapping.ToEntity(new SaveDTO<ShiftDTO> { EntityDTO = dto });
        }
    }
}
