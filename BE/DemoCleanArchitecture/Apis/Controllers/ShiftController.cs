using Core.Helpers;
using API.Models;
using Core.DTO;
using Core.Interface.Service;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Core.DTO.General;

namespace API.Controllers
{
    /** 
     * Controller quản lý ca làm việc.
     * Created By: DatND (17/1/2026)
     */
    [Route("api/v1/shift")]
    [ApiController]
    public class ShiftController : ControllerBase
    {
        private readonly IShiftService _shiftService;

        public ShiftController(IShiftService shiftService)
        {
            _shiftService = shiftService;
        }

        /**
         * Lấy danh sách ca làm việc với phân trang, lọc và sắp xếp.
         * </summary>
         * <param name="queryDto">Tham số query (pagination, filter, sort)</param>
         * <returns>ApiResponse chứa PagedResult của shifts</returns>
         * <response code="200">Lấy dữ liệu thành công</response>
         * <response code="400">Dữ liệu đầu vào không hợp lệ</response>
         * <response code="500">Lỗi hệ thống</response>
         */
        [HttpPost("data-paging")]
        public async Task<IActionResult> GetShiftsByCondition([FromBody] QueryDTO queryDto)
        {
            // Service layer sẽ validate queryDto
            var result = await _shiftService.GetByConditionAsync(queryDto);
            var count = await _shiftService.CountByConditionAsync(queryDto);

            var pagedResult = new PagedResult<ShiftDTO>
            {
                PageData = result,
                TotalCount = count,
                PageIndex = queryDto.PageIndex,
                PageSize = queryDto.PageSize,
                TotalPage = (int)Math.Ceiling((double)count / queryDto.PageSize)
            };

            var response = new ApiResponse<PagedResult<ShiftDTO>>
            {
                Success = true,
                Code = StatusCodes.Status200OK,
                SubCode = 0,
                UserMessage = $"Lấy danh sách ca làm việc thành công. Tìm thấy {count} bản ghi.",
                Data = pagedResult,
                GetLastData = queryDto.PageIndex >= (int)Math.Ceiling((double)count / queryDto.PageSize),
                ServerTime = DateTimeOffset.UtcNow
            };

            return Ok(response);
        }

        /** Lưu ca làm việc (tạo mới hoặc cập nhật).
         * Tự động phát hiện INSERT/UPDATE dựa vào ShiftId.
         * </summary>
         * <param name="shiftDto">Dữ liệu ca làm việc cần lưu</param>
         * <returns>ApiResponse chứa ca làm việc đã lưu</returns>
         * <response code="200">Lưu ca làm việc thành công</response>
         * <response code="400">Dữ liệu không hợp lệ (validation error)</response>
         * <response code="500">Lỗi hệ thống</response>
         */
        [HttpPost("save-async")]
        public async Task<IActionResult> SaveShiftAsync([FromBody] SaveDTO<ShiftDTO> shiftDto)
        {
            // Service layer sẽ validate shiftDto
            var result = await _shiftService.SaveAsync(shiftDto.EntityDTO, shiftDto.Mode, shiftDto.State);

            var isNewRecord = shiftDto.State == 1; // State 1 = Create
            var userMessage = isNewRecord
                ? $"Tạo mới ca làm việc '{result.ShiftName}' thành công"
                : $"Cập nhật ca làm việc '{result.ShiftName}' thành công";

            var response = new ApiResponse<ShiftDTO>
            {
                Success = true,
                Code = StatusCodes.Status200OK,
                SubCode = 0,
                UserMessage = userMessage,
                Data = result,
                GetLastData = false,
                ServerTime = DateTimeOffset.UtcNow
            };

            return Ok(response);
        }

        /** Cập nhật trạng thái hoạt động của nhiều ca làm việc.
         * </summary>
         * <param name="dto">Danh sách ID và trạng thái cần cập nhật</param>
         * <returns>ApiResponse xác nhận cập nhật thành công</returns>
         * <response code="200">Cập nhật trạng thái thành công</response>
         * <response code="400">Dữ liệu không hợp lệ</response>
         * <response code="500">Lỗi hệ thống</response>
         */
        [HttpPost("update-inactive")]
        public async Task<IActionResult> UpdateShiftInactive([FromBody] ShiftStatusUpdateDTO dto)
        {
            // Service layer sẽ validate dto và ids
            await _shiftService.ChangeShiftStatus(dto.ListId, dto.Inactive);

            var statusText = dto.Inactive ? "ngừng hoạt động" : "hoạt động";
            var userMessage = $"Cập nhật trạng thái {dto.ListId.Count} ca làm việc thành {statusText} thành công";

            var response = new ApiResponse<object>
            {
                Success = true,
                Code = StatusCodes.Status200OK,
                SubCode = 0,
                UserMessage = userMessage,
                Data = new { UpdatedCount = dto.ListId.Count, Inactive = dto.Inactive },
                GetLastData = false,
                ServerTime = DateTimeOffset.UtcNow
            };

            return Ok(response);
        }

        /** Xoá nhiều ca làm việc.
         * <param name="deleteDto">Danh sách ca làm việc cần xoá</param>
         * <returns>ApiResponse xác nhận xoá thành công</returns>
         * <response code="200">Xoá ca làm việc thành công</response>
         * <response code="400">Dữ liệu không hợp lệ</response>
         * <response code="404">Không tìm thấy ca làm việc</response>
         * <response code="500">Lỗi hệ thống</response>
         */
        [HttpDelete("delete")]
        public async Task<IActionResult> DeleteShift([FromBody] DeleteDTO<ShiftDTO> deleteDto)
        {
            // Service layer sẽ validate deleteDto và list
            await _shiftService.DeleteAsync(deleteDto.Models);

            var response = new ApiResponse<object>
            {
                Success = true,
                Code = StatusCodes.Status200OK,
                SubCode = 0,
                UserMessage = $"Xoá {deleteDto.Models.Count} ca làm việc thành công",
                Data = new { DeletedCount = deleteDto.Models.Count },
                GetLastData = false,
                ServerTime = DateTimeOffset.UtcNow
            };

            return Ok(response);
        }
    }
}
