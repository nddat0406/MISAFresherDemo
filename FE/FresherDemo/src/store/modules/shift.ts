/**
 * Pinia Store - Shift
 * Quản lý state cho Shift entity sử dụng Pinia
 * Created by: DatND (18/1/2026)
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Shift } from '@/types/shift';

/**
 * Shift Store sử dụng Composition API style
 * Cung cấp state, getters và actions cho quản lý ca làm việc
 * Created by: DatND (18/1/2026)
 */
export const useShiftStore = defineStore('shift', () => {
  // State
  const items = ref<Shift[]>([]);
  const currentItem = ref<Shift | null>(null);
  const pagination = ref({
    pageIndex: 1,
    pageSize: 30,
    totalCount: 0,
    totalPage: 0,
  });
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  /**
   * Lấy danh sách shifts đang active
   * Created by: DatND (18/1/2026)
   */
  const activeShifts = computed<Shift[]>(() => {
    return items.value.filter((shift) => !shift.inactive);
  });

  /**
   * Lấy danh sách shifts đang inactive
   * Created by: DatND (18/1/2026)
   */
  const inactiveShifts = computed<Shift[]>(() => {
    return items.value.filter((shift) => shift.inactive);
  });

  /**
   * Lấy tổng số shifts
   * Created by: DatND (18/1/2026)
   */
  const totalCount = computed<number>(() => pagination.value.totalCount);

  /**
   * Kiểm tra có shift nào đang được load không
   * Created by: DatND (18/1/2026)
   */
  const isLoading = computed<boolean>(() => loading.value);

  // Actions
  /**
   * Set danh sách shifts
   * Created by: DatND (18/1/2026)
   */
  function setItems(newItems: Shift[]) {
    items.value = newItems;
  }

  /**
   * Set thông tin phân trang
   * Created by: DatND (18/1/2026)
   */
  function setPagination(paginationData: {
    pageIndex: number;
    pageSize: number;
    totalCount: number;
    totalPage: number;
  }) {
    pagination.value = paginationData;
  }

  /**
   * Set shift hiện tại (đang edit/view)
   * Created by: DatND (18/1/2026)
   */
  function setCurrentItem(item: Shift | null) {
    currentItem.value = item;
  }

  /**
   * Thêm hoặc cập nhật một shift trong danh sách
   * Nếu shift đã tồn tại (theo shiftId) thì update và đưa lên đầu, ngược lại thì thêm mới ở đầu
   * Created by: DatND (18/1/2026)
   */
  function upsertItem(item: Shift) {
    const index = items.value.findIndex((s) => s.shiftId === item.shiftId);
    if (index !== -1) {
      // Xóa item cũ khỏi vị trí hiện tại
      items.value.splice(index, 1);
    }
    // Luôn thêm vào đầu danh sách (cho create)
    items.value.unshift(item);
  }


  /**   
   * Cập nhật một shift trong danh sách
   * Chỉ cập nhật nếu shift đã tồn tại (theo shiftId)
   * Created by: DatND (18/1/2026)
   */
  function updateItem(item: Shift) {
    const index = items.value.findIndex((s) => s.shiftId === item.shiftId);
    if (index !== -1) {
      items.value[index] = item;
    }
  }
  /**
   * Xóa shifts khỏi danh sách theo danh sách IDs
   * Created by: DatND (18/1/2026)
   */
  function removeItems(ids: string[]) {
    items.value = items.value.filter((item) => !ids.includes(item.shiftId));
  }

  /**
   * Cập nhật trạng thái loading
   * Created by: DatND (18/1/2026)
   */
  function setLoading(value: boolean) {
    loading.value = value;
  }

  /**
   * Cập nhật error message
   * Created by: DatND (18/1/2026)
   */
  function setError(message: string | null) {
    error.value = message;
  }

  /**
   * Clear error message
   * Created by: DatND (18/1/2026)
   */
  function clearError() {
    error.value = null;
  }

  /**
   * Lấy shift theo ID
   * Created by: DatND (18/1/2026)
   */
  function getShiftById(id: string): Shift | undefined {
    return items.value.find((shift) => shift.shiftId === id);
  }

  /**
   * Reset về trạng thái ban đầu
   * Created by: DatND (18/1/2026)
   */
  function reset() {
    items.value = [];
    currentItem.value = null;
    pagination.value = {
      pageIndex: 1,
      pageSize: 30,
      totalCount: 0,
      totalPage: 0,
    };
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    items,
    currentItem,
    pagination,
    loading,
    error,

    // Getters
    activeShifts,
    inactiveShifts,
    totalCount,
    isLoading,

    // Actions
    setItems,
    setPagination,
    setCurrentItem,
    upsertItem,
    updateItem,
    removeItems,
    setLoading,
    setError,
    clearError,
    getShiftById,
    reset,
  };
});
