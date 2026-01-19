/**
 * Shift API
 * Pure HTTP communication layer for Shift endpoints
 * NO BUSINESS LOGIC - Only HTTP requests
 * Created by: DatND (18/1/2026)
 */

import { BaseApi } from './baseApi';
import type { ApiResponse } from '@/types/aipResponse';
import type { ShiftDTO, SaveShiftDTO, DeleteShiftsRequest, DeleteShiftsResponse, UpdateInactiveRequest, UpdateInactiveResponse } from '@/services/shiftService';

/**
 * DTO for query request
 */
export interface QueryDTO {
  pageIndex: number;
  pageSize: number;
  columns: string;
  columnsSummary?: string | null;
  filter?: string | null;
  quickSearch?: any | null;
  sort?: string | null;
  customParam?: Record<string, any> | null;
  customFilter?: string | null;
  useSp: boolean;
}

/**
 * DTO for paged result
 */
export interface PagedResult<T> {
  pageData: T[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPage: number;
}

/**
 * Shift API class - extends BaseApi
 * Provides HTTP methods for Shift-related endpoints
 * Created by: DatND (18/1/2026)
 */
export class ShiftApi extends BaseApi {
  constructor() {
    super('/v1/shift');
  }

  /**
   * Query shifts with pagination, filter, and sort
   * Created by: DatND (18/1/2026)
   */
  async query(queryDTO: QueryDTO): Promise<ApiResponse<PagedResult<ShiftDTO>>> {
    return this.post<PagedResult<ShiftDTO>>('/data-paging', queryDTO);
  }

  /**
   * Save shift (create, update, or duplicate)
   * Created by: DatND (18/1/2026)
   */
  async save(saveDTO: SaveShiftDTO): Promise<ApiResponse<ShiftDTO>> {
    return this.post<ShiftDTO>('/save-async', saveDTO);
  }

  /**
   * Delete multiple shifts
   * Created by: DatND (18/1/2026)
   */
  async deleteShifts(request: DeleteShiftsRequest): Promise<ApiResponse<DeleteShiftsResponse>> {
    return this.delete<DeleteShiftsResponse>('/delete', request);
  }

  /**
   * Update inactive status for multiple shifts
   * Created by: DatND (18/1/2026)
   */
  async updateInactive(request: UpdateInactiveRequest): Promise<ApiResponse<UpdateInactiveResponse>> {
    return this.post<UpdateInactiveResponse>('/update-inactive', request);
  }
}

/**
 * Singleton instance of ShiftApi
 * Created by: DatND (18/1/2026)
 */
export const shiftApi = new ShiftApi();
