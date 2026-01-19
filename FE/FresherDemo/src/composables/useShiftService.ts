/**
 * Composable - Use Shift Service
 * Cung cấp shift service đã được kết nối với Pinia store
 * Tự động tích hợp với store để lưu dữ liệu khi fetch
 * Created by: DatND (18/1/2026)
 */

import { storeToRefs } from 'pinia';
import { useShiftStore } from '@/store/modules/shift';
import { createShiftService } from '@/services/shiftService';

/**
 * Hook để sử dụng shift service với Pinia store
 * Trả về service instance và các reactive properties từ store
 * Created by: DatND (18/1/2026)
 */
export function useShiftService() {
  const shiftStore = useShiftStore();
  const shiftService = createShiftService(shiftStore);

  // Reactive refs từ store (sử dụng storeToRefs để giữ reactivity)
  const {
    items: shifts,
    currentItem: currentShift,
    pagination,
    loading,
    error,
    activeShifts,
    inactiveShifts,
    totalCount,
    isLoading,
  } = storeToRefs(shiftStore);

  return {
    // Service
    shiftService,

    // State (reactive refs)
    shifts,
    currentShift,
    pagination,
    loading,
    error,

    // Getters (computed refs)
    activeShifts,
    inactiveShifts,
    totalCount,
    isLoading,

    // Actions (methods từ store)
    setItems: shiftStore.setItems,
    setPagination: shiftStore.setPagination,
    setCurrentItem: shiftStore.setCurrentItem,
    upsertItem: shiftStore.upsertItem,
    removeItems: shiftStore.removeItems,
    setLoading: shiftStore.setLoading,
    setError: shiftStore.setError,
    clearError: shiftStore.clearError,
    getShiftById: shiftStore.getShiftById,
    reset: shiftStore.reset,
  };
}
