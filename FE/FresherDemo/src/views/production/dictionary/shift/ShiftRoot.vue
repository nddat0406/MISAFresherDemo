/**
 * Quản lý danh sách ca làm việc
 * Hỗ trợ thêm, sửa, xóa, nhân bản và thay đổi trạng thái ca làm việc
 * Created by: DatND (16/1/2026)
 */
<script setup lang="ts">
// ========== IMPORTS ==========
import { ref, computed } from 'vue';
import { Dropdown } from 'floating-vue';

// Types
import type { Shift } from '@/types/shift';
import type { BatchAction, TableColumn } from '@/types/tableTypes';
import type { FilterState } from '@/composables/table/useTableFiltering';
import type { SortStateItem } from '@/composables/table/useTableSorting';
import type { ShiftFormData } from './ShiftModal.vue';

// Components
import MISATable from '@/components/ui/MISATable.vue';
import ShiftModal from './ShiftModal.vue';
import MISAConfirmDialog from '@/components/ui/MISAConfirmDialog.vue';

// Composables & Services
import { useShiftService } from '@/composables/useShiftService';
import { useToast } from '@/composables/useToast';
import { convertFormDataToShift } from '@/services/shiftService';

// Utils
import { formatTimeLocal } from '@/utils/dateFormat';

// ========== CONSTANTS ==========
/**
 * Cấu hình cột hiển thị cho bảng ca làm việc
 * Created by: DatND (16/1/2026)
 */
const columns: TableColumn[] = [
    { field: 'shiftCode', header: 'Mã ca', sortable: true, width: '150px', filterType: 'text' },
    { field: 'shiftName', header: 'Tên ca', sortable: true, width: '200px', filterType: 'text' },
    {
        field: 'beginShiftTime',
        header: 'Giờ vào ca',
        sortable: true,
        align: 'left',
        width: '150px',
        formatter: (value: Date) => value ? formatTimeLocal(value).substring(0, 5) : '-'
    },
    {
        field: 'endShiftTime',
        header: 'Giờ hết ca',
        sortable: true,
        align: 'left',
        width: '150px',
        formatter: (value: Date) => value ? formatTimeLocal(value).substring(0, 5) : '-'
    },
    {
        field: 'beginBreakTime',
        header: 'Bắt đầu nghỉ giữa ca',
        sortable: true,
        align: 'left',
        width: '200px',
        formatter: (value: Date) => value ? formatTimeLocal(value).substring(0, 5) : '-'
    },
    {
        field: 'endBreakTime',
        header: 'Kết thúc nghỉ giữa ca',
        sortable: true,
        align: 'left',
        width: '200px',
        formatter: (value: Date) => value ? formatTimeLocal(value).substring(0, 5) : '-'
    },
    {
        field: 'workingTime',
        header: 'Thời gian làm việc (Giờ)',
        sortable: true,
        align: 'right',
        width: '200px',
        filterType: 'number'
    },
    {
        field: 'breakingTime',
        header: 'Thời gian nghỉ (Giờ)',
        sortable: true,
        align: 'right',
        width: '180px',
        filterType: 'number'
    },
    {
        field: 'inactive',
        header: 'Trạng thái',
        sortable: true,
        align: 'left',
        width: '150px',
        filterType: 'select',
        backendField: 'Status', // Map to Status field in backend
        filterOptions: [
            { label: 'Đang sử dụng', value: '1' }, // ShiftStatus.Active = 1
            { label: 'Ngừng sử dụng', value: '2' }  // ShiftStatus.Inactive = 2
        ],
        valueTransformer: (value: string) => parseInt(value, 10), // Convert string to number for backend
        formatter: (value: boolean) => value ? 'Ngừng sử dụng' : 'Đang sử dụng'
    },
    {
        field: 'createdBy',
        header: 'Người tạo',
        sortable: true,
        width: '150px',
        filterType: 'text'
    },
    {
        field: 'createdDate',
        header: 'Ngày tạo',
        sortable: true,
        align: 'left',
        width: '150px',
        filterType: 'date',
        formatter: (value: Date) => value ? new Date(value).toLocaleDateString('vi-VN') : '-'
    },
    {
        field: 'modifiedBy',
        header: 'Người sửa',
        sortable: true,
        width: '150px',
        filterType: 'text',
        formatter: (value?: string) => value || '-'
    },
    {
        field: 'modifiedDate',
        header: 'Ngày sửa',
        sortable: true,
        align: 'left',
        width: '150px',
        filterType: 'date',
        formatter: (value?: Date) => value ? new Date(value).toLocaleDateString('vi-VN') : '-'
    },
];

// ========== SERVICES & STORES ==========
/**
 * Kết nối với shift service và Pinia store
 * Created by: DatND (18/1/2026)
 */
const { shiftService, shifts, totalCount, isLoading } = useShiftService();

/**
 * Quản lý thông báo toast
 * Created by: DatND (19/1/2026)
 */
const toast = useToast();

// ========== REACTIVE STATE ==========
/**
 * Quản lý trạng thái modal chỉnh sửa ca làm việc
 * Created by: DatND (16/1/2026)
 */
const dialogVisible = ref(false);
const modalMode = ref<'add' | 'edit' | 'duplicate'>('add');
const selectedShift = ref<Shift | undefined>(undefined);

/**
 * Quản lý trạng thái chọn ca làm việc trong bảng
 * Created by: DatND (16/1/2026)
 */
const selectedShifts = ref<Shift[]>([]);
const activeRowKey = ref<string | number | null>(null);

/**
 * Quản lý trạng thái xác nhận xóa
 * Created by: DatND (19/1/2026)
 */
const showDeleteConfirm = ref(false);
const shiftsToDelete = ref<Shift[]>([]);

/**
 * Lưu trữ tham số truy vấn cuối cùng để hỗ trợ làm mới
 * Created by: DatND (18/1/2026)
 */
const lastQueryParams = ref<{
    search?: string;
    filters?: Record<string, FilterState>;
    sorts?: SortStateItem[];
    page?: number;
    pageSize?: number;
}>({});

// ========== COMPUTED PROPERTIES ==========
/**
 * Tạo danh sách hành động hàng loạt dựa trên trạng thái ca được chọn
 * Created by: DatND (16/1/2026)
 */
const batchActions = computed<BatchAction[]>(() => {
    const actions: BatchAction[] = [];
    const hasInactive = selectedShifts.value.some(s => s.inactive);
    const hasActive = selectedShifts.value.some(s => !s.inactive);

    if (hasInactive) {
        actions.push({
            label: 'Sử dụng',
            icon: 'active',
            variant: 'success',
            shortkey: 'Active',
            action: (shifts: Shift[]) => handleUpdateInactive(shifts, false)
        });
    }

    if (hasActive) {
        actions.push({
            label: 'Ngừng sử dụng',
            icon: 'inactive',
            variant: 'danger',
            shortkey: 'Inactive',
            action: (shifts: Shift[]) => handleUpdateInactive(shifts, true)
        });
    }

    actions.push({
        label: 'Xóa',
        icon: 'trash',
        variant: 'danger',
        shortkey: 'Delete',
        action: (shifts: Shift[]) => openDeleteConfirm(shifts)
    });

    return actions;
});

// ========== HELPERS ==========
/**
 * Xác định trạng thái lưu và thông báo dựa trên chế độ modal
 * Created by: DatND (16/1/2026)
 */
const getSaveStateAndMessage = (mode: 'add' | 'edit' | 'duplicate'): { state: 1 | 2 | 4; message: string } => {
    const stateMap = {
        add: { state: 1 as 1 | 2 | 4, message: 'Thêm Ca làm việc thành công' },
        edit: { state: 2 as 1 | 2 | 4, message: 'Sửa Ca làm việc thành công' },
        duplicate: { state: 4 as 1 | 2 | 4, message: 'Nhân bản Ca làm việc thành công' }
    };
    return stateMap[mode];
};

/**
 * Xử lý lưu ca làm việc với các tham số chung
 * Created by: DatND (16/1/2026)
 */
const saveShift = async (formData: ShiftFormData, mode: 'add' | 'edit' | 'duplicate'): Promise<Shift> => {
    const { state, message } = getSaveStateAndMessage(mode);
    const shiftData = convertFormDataToShift(formData, selectedShift.value);
    const savedShift = await shiftService.save(shiftData, state, 'admin', true);
    activeRowKey.value = savedShift.shiftId;
    toast.success(message);
    return savedShift;
};

// ========== HANDLERS - MODAL ==========
/**
 * Mở modal với chế độ và dữ liệu ca làm việc cụ thể
 * Created by: DatND (16/1/2026)
 */
const openModal = (mode: 'add' | 'edit' | 'duplicate', shift?: Shift) => {
    modalMode.value = mode;
    selectedShift.value = shift;
    dialogVisible.value = true;
};

const openAddDialog = () => openModal('add');
const openEditDialog = (shift: Shift) => openModal('edit', shift);
const openDuplicateDialog = (shift: Shift) => openModal('duplicate', shift);

// ========== HANDLERS - SAVE ==========
/**
 * Xử lý lưu ca làm việc và đóng modal
 * Created by: DatND (16/1/2026)
 */
const handleSave = async (formData: ShiftFormData, mode: 'add' | 'edit' | 'duplicate') => {
    try {
        await saveShift(formData, mode);
        dialogVisible.value = false;
    } catch (error) {
        console.error('Error saving shift:', error);
        toast.error('Lưu Ca làm việc thất bại. Vui lòng thử lại.');
    }
};

/**
 * Xử lý lưu ca làm việc và chuyển sang chế độ thêm mới
 * Created by: DatND (16/1/2026)
 */
const handleSaveAndAdd = async (formData: ShiftFormData, mode: 'add' | 'edit' | 'duplicate') => {
    try {
        await saveShift(formData, mode);
        selectedShift.value = undefined;
        modalMode.value = 'add';
    } catch (error) {
        console.error('Error saving shift:', error);
        toast.error('Thêm Ca làm việc thất bại. Vui lòng thử lại.');
        selectedShift.value = undefined;
        modalMode.value = 'add';
    }
};

// ========== HANDLERS - DELETE ==========
/**
 * Mở dialog xác nhận xóa ca làm việc
 * Created by: DatND (19/1/2026)
 */
const openDeleteConfirm = (shifts: Shift[]) => {
    shiftsToDelete.value = shifts;
    showDeleteConfirm.value = true;
};

/**
 * Xử lý xác nhận xóa ca làm việc
 * Created by: DatND (19/1/2026)
 */
const handleConfirmDelete = async () => {
    try {
       var result = await shiftService.deleteShifts(shiftsToDelete.value, true);
       if((result && (result as any).triggerRefresh)){
            await handleRefresh();
         }
        showDeleteConfirm.value = false;
    } catch (error) {
        console.error('Error deleting shifts:', error);
        toast.error('Xóa Ca làm việc thất bại. Vui lòng thử lại.');
    }
};

// ========== HANDLERS - STATUS ==========
/**
 * Xử lý cập nhật trạng thái sử dụng ca làm việc
 * Created by: DatND (16/1/2026)
 */
const handleUpdateInactive = async (shifts: Shift[], inactive: boolean) => {
    try {
        const shiftIds = shifts.map(s => s.shiftId);
        await shiftService.updateInactive(shiftIds, inactive, true);
    } catch (error) {
        console.error('Error updating shift status:', error);
    }
};

// ========== HANDLERS - DATA ==========
/**
 * Xử lý thay đổi dữ liệu bảng (tìm kiếm, lọc, sắp xếp, phân trang)
 * Created by: DatND (18/1/2026)
 */
const handleDataChange = async (params: {
    search?: string;
    filters?: Record<string, FilterState>;
    sorts?: SortStateItem[];
    page?: number;
    pageSize?: number;
}) => {
    try {
        lastQueryParams.value = params;
        await shiftService.query({
            page: params.page || 1,
            pageSize: params.pageSize || 20,
            search: params.search,
            filters: params.filters,
            sorts: params.sorts
        }, true, columns);
    } catch (error) {
        console.error('Error fetching shifts:', error);
    }
};

/**
 * Xử lý làm mới dữ liệu bảng
 * Created by: DatND (18/1/2026)
 */
const handleRefresh = async () => {
    await handleDataChange(lastQueryParams.value);
};

// ========== HANDLERS - TABLE EVENTS ==========
const handleEdit = (shift: Shift) => openEditDialog(shift);
const handleSelectionChange = (items: Shift[]) => { selectedShifts.value = items; };
const handleBatchAction = (action: BatchAction, selectedItems: Shift[]) => action.action(selectedItems);
</script>

<template>
    <!-- Delete Confirmation Dialog -->
    <MISAConfirmDialog v-model:visible="showDeleteConfirm" title="Xóa Ca làm việc" :message="shiftsToDelete.length > 1 ?
     'Các ca làm việc sau khi bị xóa sẽ không thể khôi phục. Bạn có muốn tiếp tục xóa không?' 
    : 'Ca làm việc ' + (shiftsToDelete[0]?.shiftName || '') + ' sau khi bị xóa sẽ không thể khôi phục. Bạn có muốn tiếp tục xóa không?' "
    accept-label="Xóa" accept-class="ms-button btn-solid-danger" 
    reject-label="Hủy" icon="icon-warning" @accept="handleConfirmDelete" />

    <MISATable :data="shifts" :columns="columns" :batch-actions="batchActions" :total="totalCount" :loading="isLoading"
        @selection-change="handleSelectionChange" :active-row-key="activeRowKey" search-placeholder="Tìm kiếm"
        row-key="shiftId" add-button-text="Thêm" @edit="handleEdit" @refresh="handleRefresh"
        @data-change="handleDataChange">
        <template #title>
            <div class="list-title title-shift-list flex">Ca làm việc</div>
            <div class="main-button">
                <button class="ms-button btn-solid-brand" @click="openAddDialog()">
                    <div class="icon add-white mi icon16"> &nbsp; </div>
                    <div class="text text-nowrap pl-1">Thêm</div>
                </button>
            </div>
        </template>
        <template #toolbar-append="slotProps">
            <div class="feature-batch flex" v-if="slotProps.selectedItems.length > 0">
                <div class="selected-count">
                    Đã chọn <span class="font-bold">{{ slotProps.selectedItems.length }}</span>
                </div>
                <div class="unselected" @click="slotProps.unselectAll">Bỏ chọn</div>

                <template v-for="action in batchActions" :key="action.label">
                    <button class="ms-button" :class="`btn-outline-${action.variant}`"
                        :shortkey-target="action.shortkey" @click="handleBatchAction(action, slotProps.selectedItems)">
                        <div class="icon left mi icon16"
                            :class="[action.icon, { 'green': action.variant === 'success', 'red': action.variant === 'danger' }]">
                        </div>
                        <div class="text text-nowrap pl-1">{{ action.label }}</div>
                    </button>
                </template>
            </div>
        </template>
        <template #cell-inactive="slotProps">
            <template v-if="slotProps.value">
                <div class="flex flex-row item-center">
                    <div class="inactive custom-status">Ngừng sử dụng</div>
                </div>
            </template>
            <template v-else>
                <div class="flex flex-row item-center">
                    <div class="active custom-status">Đang sử dụng</div>
                </div>
            </template>
        </template>
        <template #action-column="slotProps">
            <div class="widget-container">
                <div class="feature-btn text-info" v-tooltip="'Chỉnh sửa'"
                    @click.stop="handleEdit(slotProps.item as Shift)">
                    <div class="mi icon16 pencil"></div>
                </div>
                <Dropdown class="widget-more-dropdown" :triggers="['click']" placement="bottom-end" :distance="6">
                    <template #default>
                        <div class="menu-wrapper widget-more-container">
                            <div class="menu-button-container">
                                <div class="feature-btn">
                                    <div class="mi icon16 feature-more-blue"></div>
                                </div>
                            </div>
                        </div>
                    </template>
                    <template #popper>
                        <ul class="menu-wrapper-menu widget-more-container" role="menu" id="musgmn0atpq"
                            style="left: 900.984px; right: unset; top: 215.5px; bottom: unset; overflow: auto; min-width: 0px; padding: 8px 0px;">
                            <li class="menu-wrapper-item d-flex menu-wrapper-item-icon menu-item-feture" role="menuitem"
                                @click="openDuplicateDialog(slotProps.item as Shift)" tabindex="-1">
                                <div class="mi icon16 menu-item-ic mi icon16 duplicate"></div>
                                <div class="menu-item-content"><span>Nhân bản</span></div>
                            </li>
                            <li v-if="!slotProps.item.inactive"
                                class="menu-wrapper-item d-flex menu-wrapper-item-icon menu-item-feture" role="menuitem"
                                tabindex="-1"
                                @click="slotProps.item.inactive = true; shiftService.updateInactive([slotProps.item.shiftId], true, true)">
                                <div class="mi icon16 menu-item-ic mi icon16 empty"></div>
                                <div class="menu-item-content">
                                    <span>Ngừng sử dụng</span>
                                </div>
                            </li>
                            <li v-else class="menu-wrapper-item d-flex menu-wrapper-item-icon menu-item-feture"
                                role="menuitem" tabindex="-1"
                                @click="slotProps.item.inactive = false; shiftService.updateInactive([slotProps.item.shiftId], false, true)">
                                <div class="mi icon16 menu-item-ic mi icon16 active"></div>
                                <div class="menu-item-content">
                                    <span>Sử dụng</span>
                                </div>
                            </li>
                            <li class="menu-wrapper-item d-flex menu-wrapper-item-icon menu-item-feture delete"
                                role="menuitem" tabindex="-1"
                                @click="shiftsToDelete = [slotProps.item as Shift]; showDeleteConfirm = true">
                                <div class="mi icon16 menu-item-ic mi icon16 trash red"></div>
                                <div class="menu-item-content">
                                    <span>Xóa</span>
                                </div>
                            </li>
                        </ul>
                    </template>
                </Dropdown>
            </div>
        </template>
    </MISATable>
    <!-- ShiftModal component - Handles Edit and Duplicate modes -->
    <ShiftModal v-model:visible="dialogVisible" :mode="modalMode" :shift="selectedShift" @save="handleSave"
        @save-and-add="handleSaveAndAdd" />

</template>

<style>
/* Dialog Styles */

.dialog-root {
    width: 680px;
    touch-action: none;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    transition: all .3s ease-in-out;
    border-radius: 4px;
}

.dialog-root:focus {
    outline: none;
}

.dialog-mask {
    background-color: #0000002e;
}

.dialog-footer {
    display: flex;
    padding: 12px 20px;
    position: relative;
    border-top: 1px solid #d5dfe2;
}
</style>


<style scoped>
.list-title {
    font-size: 24px;
    font-weight: 700;
    font-family: Inter;
    color: #111827;
    line-height: normal;
}

.widget-container {
    transition: visibility 0s ease;
}

.widget-container {
    display: flex;
    justify-content: flex-start;
    padding-left: 8px;
    align-items: center;
    gap: 8px;
}

/* Modal Styles */
.modal__title {
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal__title .title-left {
    flex: 1 1 0%;
    min-width: 0;
    align-items: center;
    font-weight: 700;
    font-size: 16px;
    line-height: 36px;
    text-overflow: ellipsis;
    overflow: hidden;
    display: flex;
}

.modal__title .title-right {
    display: flex;
    align-items: center;
    column-gap: 8px;
    justify-content: flex-end;
    white-space: nowrap;
    flex-shrink: 0;
}

.modal__content {
    flex: 1;
}

.shift-detail .container-content {
    padding: 20px;
}

.shift-detail .footer-buttons-parent {
    width: 100%;
    justify-content: flex-end;
}

/* Inputs Styles */
.form-group:not(.top) {
    margin-bottom: 16px;
}

.form-group:last-child {
    margin-bottom: 0;
}

.shift-detail .container-content .ms-timepicker .ms-container--timepicker {
    max-width: 122px !important;
    padding-right: 0 !important;
}

.shift-detail .container-content .ms-timepicker .ms-input--timepicker {
    width: 78px !important;
}

.ms-editor .border.disabled {
    max-width: 122px !important;
}

.shift-detail .footer-buttons {
    flex-direction: row-reverse;
    gap: 8px;
}

.checkmark {
    display: inline-block;
    width: 16px;
    height: 16px;
    min-width: 16px;
    min-height: 16px;
    color: #fff;
    text-align: center;
    border-radius: 50%;
    position: relative;
    border: 1px solid #7b7b7b;
    background-color: #fff;
    cursor: pointer;
}

.active.custom-status {
    background-color: #ebfef6;
    color: #009b71;
    padding: 5px 8px;
    border-radius: 999px;
    line-height: normal;
}

.inactive.custom-status {
    background-color: #fee2e2;
    color: #dc2626;
    width: fit-content;
    padding: 5px 8px;
    border-radius: 999px;
    line-height: normal;
}
</style>