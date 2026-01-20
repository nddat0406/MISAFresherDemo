/**
 * Shift Service
 * BUSINESS LOGIC LAYER for Shift management
 * Uses ShiftApi for HTTP communication
 * Handles data transformation, validation, and store interactions
 * Created by: DatND (18/1/2026)
 */

import type { Shift } from '@/types/shift';
import { BaseService, type QueryParams, buildQueryDTO } from './baseService';
import { ShiftApi } from '@/api/shiftApi';
import { useShiftStore } from '@/store/modules/shift';
import { formatTimeLocal, timeToDate } from '@/utils/dateFormat';
import type { ShiftFormData } from '@/views/production/dictionary/shift/ShiftModal.vue';

/**
 * DTO cho Shift từ backend
 */
export interface ShiftDTO {
  shiftId: string;
  shiftCode: string;
  shiftName: string;
  beginShiftTime: string;
  endShiftTime: string;
  beginBreakTime: string | null;
  endBreakTime: string | null;
  description?: string | null;
  workingTime: number;
  breakingTime: number;
  inactive: boolean;
  createdBy: string;
  createdDate: string;
  modifiedBy: string | null;
  modifiedDate: string | null;
}

/**
 * DTO cho request lưu shift (create/update/duplicate)
 * State: 1=Add, 2=Update, 4=Duplicate
 */
export interface SaveShiftDTO {
  state: number; // 1=Add, 2=Update, 4=Duplicate
  mode: number; // Default: 0
  entityDTO?: {
    shiftId?: string;
    shiftCode: string;
    shiftName: string;
    beginShiftTime: string;
    endShiftTime: string;
    beginBreakTime?: string | null;
    endBreakTime?: string | null;
    description?: string;
    workingTime: number;
    breakingTime: number;
    inactive?: boolean;
    createdBy?: string;
    createdDate?: string;
    modifiedBy?: string;
    modifiedDate?: string;
  };
}

/**
 * DTO cho request batch delete shifts
 */
export interface DeleteShiftsRequest {
  models: ShiftDTO[];
}

/**
 * Response từ batch delete
 */
export interface DeleteShiftsResponse {
  deletedCount: number;
  failedCount: number;
  failedItems?: Array<{
    shiftId: string;
    shiftCode: string;
    reason: string;
  }>;
  triggerRefresh?: boolean;
}

/**
 * DTO cho request batch update inactive status
 */
export interface UpdateInactiveRequest {
  inactive: boolean;
  listId: string[];
}

/**
 * Response từ batch update inactive
 */
export interface UpdateInactiveResponse {
  updatedCount: number;
  failedCount: number;
  updatedShifts?: ShiftDTO[];
  failedItems?: Array<{
    shiftId: string;
    reason: string;
  }>;
}

/**
 * Danh sách các cột để query từ backend
 */
const SHIFT_COLUMNS = [
  'ShiftCode',
  'ShiftName',
  'BeginShiftTime',
  'EndShiftTime',
  'BeginBreakTime',
  'EndBreakTime',
  'WorkingTimeHours',
  'BreakingTimeHours',
  'Status',
  'CreatedBy',
  'CreatedDate',
  'ModifiedBy',
  'ModifiedDate',
  'ShiftId',
];

const SHIFT_STRING_COLUMNS = [
  'ShiftCode',
  'ShiftName',
  'CreatedDate',
  'ModifiedBy',
];

/**
 * Chuyển đổi ShiftDTO từ backend sang Shift model của frontend
 * Chuyển đổi PascalCase sang camelCase và parse datetime
 * Created by: DatND (18/1/2026)
 */
function mapShiftDTOToShift(dto: ShiftDTO): Shift {
  return {
    shiftId: dto.shiftId,
    shiftCode: dto.shiftCode,
    shiftName: dto.shiftName,
    beginShiftTime: timeToDate(dto.beginShiftTime),
    endShiftTime: timeToDate(dto.endShiftTime),
    beginBreakTime: dto.beginBreakTime
      ? timeToDate(dto.beginBreakTime)
      : undefined,
    endBreakTime: dto.endBreakTime
      ? timeToDate(dto.endBreakTime)
      : undefined,
    workingTime: parseFloat(dto.workingTime.toFixed(2)),
    breakingTime: parseFloat(dto.breakingTime.toFixed(2)),
    inactive: dto.inactive,
    createdBy: dto.createdBy,
    createdDate: new Date(dto.createdDate),
    modifiedBy: dto.modifiedBy || undefined,
    modifiedDate: dto.modifiedDate ? new Date(dto.modifiedDate) : undefined,
  };
}

/**
 * Chuyển đổi Shift model sang ShiftDTO để gửi lên backend
 * Chuyển đổi camelCase sang PascalCase và format datetime
 * Created by: DatND (18/1/2026)
 */
function mapShiftToShiftDTO(shift: Shift): ShiftDTO {
  return {
    shiftId: shift.shiftId,
    shiftCode: shift.shiftCode,
    shiftName: shift.shiftName,
    beginShiftTime: formatTimeLocal(shift.beginShiftTime),
    endShiftTime: formatTimeLocal(shift.endShiftTime),
    beginBreakTime: shift.beginBreakTime
      ? formatTimeLocal(shift.beginBreakTime)
      : null,
    endBreakTime: shift.endBreakTime
      ? formatTimeLocal(shift.endBreakTime)
      : null,
    workingTime: shift.workingTime,
    breakingTime: shift.breakingTime,
    inactive: shift.inactive,
    createdBy: shift.createdBy,
    createdDate: shift.createdDate.toISOString(),
    modifiedBy: shift.modifiedBy || null,
    modifiedDate: shift.modifiedDate ? shift.modifiedDate.toISOString() : null,
  };
}


/**
 * Chuyển đổi ShiftFormData từ modal sang Partial<Shift> cho service
 * Chuyển đổi string times sang Date objects
 * 
 * Created by: DatND (18/1/2026)
 */
export const convertFormDataToShift = (formData: ShiftFormData, existingShift?: Shift): Partial<Shift> => {
    const baseDate = '2000-01-01T';
    //Tính toán workingTime và breakingTime nếu không có giá trị
    if (!formData.workingTime) {
        const beginShift = new Date(`${baseDate}${formData.beginShiftTime}`);
        const endShift = new Date(`${baseDate}${formData.endShiftTime}`);
        let totalShiftMinutes = (endShift.getTime() - beginShift.getTime()) / (1000 * 60);
        if (totalShiftMinutes < 0) {
            totalShiftMinutes += 24 * 60; // Điều chỉnh cho ca qua đêm
        }
        let breakMinutes = 0;
        if (formData.beginBreakTime && formData.endBreakTime) {
            const beginBreak = new Date(`${baseDate}${formData.beginBreakTime}`);
            const endBreak = new Date(`${baseDate}${formData.endBreakTime}`);
            breakMinutes = (endBreak.getTime() - beginBreak.getTime()) / (1000 * 60);
            if (breakMinutes < 0) {
                breakMinutes += 24 * 60; // Điều chỉnh cho ca qua đêm
            }
        }
        formData.workingTime = parseFloat(((totalShiftMinutes - breakMinutes) / 60).toFixed(2));
        formData.breakingTime = parseFloat((breakMinutes / 60).toFixed(2));
    }
    const workingTime = formData.workingTime ?? 0;
    const breakingTime = formData.breakingTime ?? 0;

    return {
        shiftId: formData.shiftId || existingShift?.shiftId,
        shiftCode: formData.shiftCode,
        shiftName: formData.shiftName,
        beginShiftTime: new Date(`${baseDate}${formData.beginShiftTime}`),
        endShiftTime: new Date(`${baseDate}${formData.endShiftTime}`),
        beginBreakTime: formData.beginBreakTime ? new Date(`${baseDate}${formData.beginBreakTime}`) : undefined,
        endBreakTime: formData.endBreakTime ? new Date(`${baseDate}${formData.endBreakTime}`) : undefined,
        workingTime: Math.round(workingTime),
        breakingTime: Math.round(breakingTime),
        inactive: formData?.inactive ?? false,
        createdBy: existingShift?.createdBy,
        createdDate: existingShift?.createdDate,
    };
};
/**
 * Shift Service class - BUSINESS LOGIC LAYER
 * Uses ShiftApi for all HTTP communication
 * Handles Shift-specific business logic, data transformation, and store management
 * Created by: DatND (18/1/2026)
 */
class ShiftService extends BaseService<ShiftApi> {
  constructor(shiftApi: ShiftApi = new ShiftApi(), shiftStore?: ReturnType<typeof useShiftStore>) {
    super(shiftApi, shiftStore);
  }

  /**
   * Query danh sách ca làm việc với phân trang, lọc và sắp xếp
   * CHỈ gọi khi: filter thay đổi, sort thay đổi, pagination thay đổi, hoặc refresh
   * Tự động chuyển đổi params frontend sang backend format và lưu vào store
   * Created by: DatND (18/1/2026)
   */
  async query(
    params: QueryParams = {},
    saveToStore: boolean = true,
    columnDefinitions?: any[]
  ): Promise<{
    data: Shift[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    // Build query DTO using BaseService helper
    const queryDTO = buildQueryDTO(params, SHIFT_COLUMNS, SHIFT_STRING_COLUMNS, columnDefinitions);

    // Call API layer
    const response = await this.api.query(queryDTO);

    if (!response.success || !response.data) {
      throw new Error(
        response.userMessage || response.systemMessage || 'Query failed'
      );
    }

    const result = response.data;
    const mappedData = result.pageData.map(mapShiftDTOToShift);

    // Lưu dữ liệu đã map vào store
    if (saveToStore && this.storeActions) {
      this.storeActions.setItems(mappedData);
      this.storeActions.setPagination({
        pageIndex: result.pageIndex,
        pageSize: result.pageSize,
        totalCount: result.totalCount,
        totalPage: result.totalPage,
      });
    }

    return {
      data: mappedData,
      total: result.totalCount,
      page: result.pageIndex,
      pageSize: result.pageSize,
    };
  }

  /**
   * Lưu ca làm việc (tạo mới, cập nhật hoặc nhân bản)
   * State: 1=Tạo mới, 2=Cập nhật, 4=Nhân bản
   * KHÔNG fetch lại từ server, chỉ cập nhật local store
   * Tự động select row vừa tạo/cập nhật và đưa lên đầu danh sách
   * Created by: DatND (18/1/2026)
   */
  async save(
    shift: Partial<Shift>,
    state: 1 | 2 | 4,
    currentUser: string = 'admin',
    saveToStore: boolean = true
  ): Promise<Shift> {
    const saveDTO: SaveShiftDTO = {
      state: state,
      mode: 0,
      entityDTO: {
        shiftCode: shift.shiftCode!,
        shiftName: shift.shiftName!,
        beginShiftTime: shift.beginShiftTime
          ? formatTimeLocal(shift.beginShiftTime)
          : '',
        endShiftTime: shift.endShiftTime
          ? formatTimeLocal(shift.endShiftTime)
          : '',
        beginBreakTime: shift.beginBreakTime
          ? formatTimeLocal(shift.beginBreakTime)
          : null,
        endBreakTime: shift.endBreakTime
          ? formatTimeLocal(shift.endBreakTime)
          : null,
        workingTime: shift.workingTime || 0,
        breakingTime: shift.breakingTime || 0,
        inactive: shift.inactive ?? false,

        shiftId: shift.shiftId,
        createdBy: currentUser,

        description: shift.description || '',
      }
    }
    // Gọi API layer để persist vào backend
    const response = await this.api.save(saveDTO);

    if (!response.success || !response.data) {
      throw new Error(
        response.userMessage || response.systemMessage || 'Failed to save shift'
      );
    }

    const savedShift = mapShiftDTOToShift(response.data);

    // Cập nhật local store và tự động select row
    if (saveToStore && this.storeActions) {

      // Tự động select row vừa save
      if (state !== 2) {
        // Thêm/cập nhật item vào đầu danh sách
        this.storeActions.upsertItem(savedShift);
        this.storeActions.setCurrentItem(savedShift);

        // Tăng totalCount nếu là tạo mới hoặc duplicate
        const currentPagination = this.storeActions.pagination;
        if (currentPagination) {
          this.storeActions.setPagination({
            ...currentPagination,
            totalCount: currentPagination.totalCount + 1,
            totalPage: Math.ceil((currentPagination.totalCount + 1) / currentPagination.pageSize)
          });
        }
      } else {
        // Chỉ cập nhật item trong danh sách
        this.storeActions.updateItem(savedShift);
      }
    }

    return savedShift;
  }

  /**
   * Xóa danh sách ca làm việc
   * KHÔNG fetch lại từ server, chỉ xóa khỏi local store
   * Tự động clear selection sau khi xóa
   * Created by: DatND (18/1/2026)
   */
  async deleteShifts(
    shifts: Shift[],
    saveToStore: boolean = true
  ): Promise<DeleteShiftsResponse> {
    const request: DeleteShiftsRequest = {
      models: shifts.map(mapShiftToShiftDTO),
    };

    const deletedIds = shifts.map((s) => s.shiftId);

    // Gọi API layer để persist vào backend
    const response = await this.api.deleteShifts(request);

    if (!response.success || !response.data) {
      throw new Error(
        response.userMessage || response.systemMessage || 'Failed to delete shifts'
      );
    }

    const result = response.data;

    // Xóa các shifts đã xóa thành công khỏi local store
    if (saveToStore && this.storeActions) {
      // Lọc ra các IDs đã xóa thành công (không nằm trong FailedItems)
      const failedIds =
        result.failedItems?.map((item) => item.shiftId) || [];
      const successIds = deletedIds.filter((id) => !failedIds.includes(id));

      // Xóa khỏi store
      this.storeActions.removeItems(successIds);

      // Clear current item nếu nó đang được chọn và bị xóa
      const currentItem = this.storeActions.currentItem;
      if (currentItem && successIds.includes(currentItem.shiftId)) {
        this.storeActions.setCurrentItem(null);
      }

      // Giảm totalCount
      const currentPagination = this.storeActions.pagination;
      if (currentPagination) {
        this.storeActions.setPagination({
          ...currentPagination,
          totalCount: Math.max(0, currentPagination.totalCount - (result.deletedCount ?? shifts.length)),
          totalPage: Math.ceil(Math.max(0, currentPagination.totalCount - (result.deletedCount ?? shifts.length)) / currentPagination.pageSize)
        });
      }
      if(this.storeActions.getStoreItemCount() === 0){
        result.triggerRefresh = true
        return result;
      }

    }

    return result;
  }

  /**
   * Cập nhật trạng thái Inactive cho danh sách ca làm việc
   * Inactive = true: Ngừng sử dụng, Inactive = false: Kích hoạt
   * KHÔNG fetch lại từ server, chỉ cập nhật local store
   * Tự động select row đầu tiên được cập nhật
   * Created by: DatND (18/1/2026)
   */
  async updateInactive(
    shiftIds: string[],
    inactive: boolean,
    saveToStore: boolean = true
  ): Promise<void> {
    const request: UpdateInactiveRequest = {
      inactive: inactive,
      listId: shiftIds,
    };

    // Gọi API layer để persist vào backend
    const response = await this.api.updateInactive(request);

    if (!response.success) {
      throw new Error(
        response.userMessage ||
        response.systemMessage ||
        'Failed to update inactive status'
      );
    }

    // Cập nhật local store với các shifts đã cập nhật thành công
    if (saveToStore && this.storeActions) {
      // Cập nhật từng item trong store
      shiftIds.forEach((id) => {
        const item = this.storeActions!.items.find((s: Shift) => s.shiftId === id);
        item!.inactive = inactive;
      });
    }

  }
}

/**
 * Factory function để tạo ShiftService instance với store
 * Created by: DatND (18/1/2026)
 */
export function createShiftService(
  shiftStore?: ReturnType<typeof useShiftStore>
): ShiftService {
  return new ShiftService(new ShiftApi(), shiftStore);
}

/**
 * Default singleton instance of ShiftService
 * Uses default ShiftApi instance
 * Created by: DatND (18/1/2026)
 */
export const shiftService = new ShiftService();
