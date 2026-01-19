<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { Shift } from '@/types/shift';
import type { BatchAction, TableColumn } from '@/types/tableTypes';
import type { FilterState } from '@/composables/table/useTableFiltering';
import type { SortStateItem } from '@/composables/table/useTableSorting';
import MISATable from '@/components/ui/MISATable.vue';
import ShiftModal, { type ShiftFormData } from './ShiftModal.vue';
import MISAConfirmDialog from '@/components/ui/MISAConfirmDialog.vue';
import { Dropdown } from 'floating-vue';
import { useShiftService } from '@/composables/useShiftService';
import { formatTimeLocal } from '@/utils/dateFormat';
import { convertFormDataToShift } from '@/services/shiftService';
import { useToast } from '@/composables/useToast';



/**
 * Sử dụng shift service với Pinia store integration
 * Cung cấp service instance và reactive state từ store
 * 
 * Created by: DatND (18/1/2026)
 */
const {
    shiftService,
    shifts,
    totalCount,
    isLoading,
} = useShiftService();

/**
 * Toast notification instance
 * Created by: DatND (19/1/2026)
 */
const toast = useToast();

/**
 * Trạng thái hiển thị modal và mode của modal
 * - dialogVisible: Điều khiển việc hiển thị modal
 * - modalMode: Chế độ hoạt động ('add' | 'edit' | 'duplicate')
 * - selectedShift: Ca làm việc được chọn để edit/duplicate
 * 
 * Created by: DatND (16/1/2026)
 */
const dialogVisible = ref(false);
const modalMode = ref<'add' | 'edit' | 'duplicate'>('add');
const selectedShift = ref<Shift | undefined>(undefined);
const selectedShifts = ref<Shift[]>([]);
const activeRowKey = ref<string | number | null>(null);

/**
 * State for delete confirmation dialog
 * 
 * Created by: DatND (19/1/2026)
 */
const showDeleteConfirm = ref(false);
const shiftsToDelete = ref<Shift[]>([]);
const deleteShiftMessage = 'Ca làm việc';

// Track last query params for refresh
const lastQueryParams = ref<{
    search?: string;
    filters?: Record<string, FilterState>;
    sorts?: SortStateItem[];
    page?: number;
    pageSize?: number;
}>({});


/**
 * Định nghĩa cột cho bảng hiển thị ca làm việc
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
        filterType: 'text',
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


/**
 * Định nghĩa các hành động hàng loạt (batch actions) cho bảng ca làm việc
 * Tùy thuộc vào trạng thái của các ca được chọn để hiển thị các hành động phù hợp
 * Created by: DatND (16/1/2026)
 */
const batchActions = computed<BatchAction[]>(() => {
    const actions: BatchAction[] = [];

    // 
    const hasInactive = selectedShifts.value.some(s => s.inactive);
    const hasActive = selectedShifts.value.some(s => !s.inactive);

    // Show "Sử dụng" chỉ khi có shift đang ngừng sử dụng
    if (hasInactive) {
        actions.push({
            label: 'Sử dụng',
            icon: 'active',
            variant: 'success',
            shortkey: 'Active',
            action: async (shifts: Shift[]) => {
                try {
                    const shiftIds = shifts.map(s => s.shiftId);
                    await shiftService.updateInactive(shiftIds, false, true);
                } catch (error) {
                    console.error('Error activating shifts:', error);
                }
            }
        });
    }

    // Show "Ngừng sử dụng" chỉ khi có shift đang hoạt động
    if (hasActive) {
        actions.push({
            label: 'Ngừng sử dụng',
            icon: 'inactive',
            variant: 'danger',
            shortkey: 'Inactive',
            action: async (shifts: Shift[]) => {
                try {
                    const shiftIds = shifts.map(s => s.shiftId);
                    await shiftService.updateInactive(shiftIds, true, true);
                } catch (error) {
                    console.error('Error deactivating shifts:', error);
                }
            }
        });
    }

    // luôn hiển thị "Xóa"
    actions.push({
        label: 'Xóa',
        icon: 'trash',
        variant: 'danger',
        shortkey: 'Delete',
        action: (shifts: Shift[]) => {
            shiftsToDelete.value = shifts;
            showDeleteConfirm.value = true;
        }
    });

    return actions;
});

/**
 * Mở modal với mode edit
 * Set selectedShift và modalMode, sau đó hiển thị modal
 * 
 * Created by: DatND (16/1/2026)
 */
const openEditDialog = (shift: Shift) => {
    selectedShift.value = shift;
    modalMode.value = 'edit';
    dialogVisible.value = true;
};

/**
 * Mở modal với mode duplicate
 * Set selectedShift và modalMode, sau đó hiển thị modal
 * 
 * Created by: DatND (16/1/2026)
 */
const openDuplicateDialog = (shift: Shift) => {
    selectedShift.value = shift;
    modalMode.value = 'duplicate';
    dialogVisible.value = true;
};

/**
 * Mở modal để thêm mới shift
 * Reset selectedShift và set modalMode về add, sau đó hiển thị modal
 * 
 * Created by: DatND (16/1/2026)
 */
const openAddDialog = () => {
    selectedShift.value = undefined;
    modalMode.value = 'add';
    dialogVisible.value = true;
};

/**
 * Xử lý sự kiện edit shift từ table
 * Gọi openEditDialog với shift được chọn
 * 
 * Created by: DatND (16/1/2026)
 */
const handleEdit = (shift: Shift) => {
    openEditDialog(shift);
};

/**
 * Xử lý làm mới dữ liệu, gọi lại API với params hiện tại
 * 
 * Created by: DatND (18/1/2026)
 */
const handleRefresh = async () => {
    await handleDataChange(lastQueryParams.value);
};

/**
 * Xử lý thay đổi dữ liệu khi filter, sort, pagination, hoặc search thay đổi
 * Gọi shiftService.query với params và cập nhật store
 * 
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
        // Lưu params để dùng cho refresh
        lastQueryParams.value = params;

        // Gọi truy vấn dữ liệu với các tham số hiện tại
        await shiftService.query({
            page: params.page || 1,
            pageSize: params.pageSize || 20,
            search: params.search,
            filters: params.filters,
            sorts: params.sorts
        }, true); // Lưu vào store
    } catch (error) {
        console.error('Error fetching shifts:', error);
    }
};

/**
 * Xử lý sự kiện Save từ ShiftModal
 * - Mode add: Tạo shift mới
 * - Mode edit: Cập nhật shift hiện tại
 * - Mode duplicate: Tạo shift mới từ dữ liệu duplicate
 * Đóng modal sau khi xử lý
 * 
 * Created by: DatND (16/1/2026)
 */
const handleSave = async (formData: ShiftFormData, mode: 'add' | 'edit' | 'duplicate') => {
    try {
        let state: 1 | 2 | 4;
        let successMessage = '';

        if (mode === 'add') {
            state = 1; // Add
            successMessage = 'Thêm Ca làm việc thành công';
        } else if (mode === 'edit') {
            state = 2; // Update
            successMessage = 'Sửa Ca làm việc thành công';
        } else {
            state = 4; // Duplicate
            successMessage = 'Nhân bản Ca làm việc thành công';
        }

        // Convert form data to Shift format
        const shiftData = convertFormDataToShift(formData, selectedShift.value);

        // Call API to save shift (service will update store automatically)
        var savedShift = await shiftService.save(shiftData, state, 'admin', true);
        activeRowKey.value = savedShift.shiftId;
        toast.success(successMessage);
        dialogVisible.value = false;
    } catch (error) {
        console.error('Error saving shift:', error);
        toast.error('Lưu Ca làm việc thất bại. Vui lòng thử lại.');
    }
};

/**
 * Xử lý sự kiện Save và Thêm từ ShiftModal
 * Lưu shift hiện tại và giữ modal mở để thêm mới
 * 
 * Created by: DatND (16/1/2026)
 */
const handleSaveAndAdd = async (formData: ShiftFormData, mode: 'add' | 'edit' | 'duplicate') => {
    try {
        let state: 1 | 2 | 4;
        let successMessage = '';

        if (mode === 'add') {
            state = 1; // Add
            successMessage = 'Thêm Ca làm việc thành công';
        } else if (mode === 'edit') {
            state = 2; // Update
            successMessage = 'Sửa Ca làm việc thành công';
        } else {
            state = 4; // Duplicate
            successMessage = 'Nhân bản Ca làm việc thành công';
        }
        // Convert form data to Shift format
        const shiftData = convertFormDataToShift(formData, selectedShift.value);

        // Call API to save shift (service will update store automatically)
        var savedShift = await shiftService.save(shiftData, state, 'admin', true);
        activeRowKey.value = savedShift.shiftId;
        // Convert form data to Shift format
        toast.success('Thêm Ca làm việc thành công');

        // Reset selected shift để form trở về trạng thái thêm mới
        selectedShift.value = undefined;
        modalMode.value = 'add';
    } catch (error) {
        console.error('Error saving shift:', error);
        toast.error('Thêm Ca làm việc thất bại. Vui lòng thử lại.');
        // Reset selected shift để form trở về trạng thái thêm mới
        selectedShift.value = undefined;
        modalMode.value = 'add';
    }
};

const handleBatchAction = (action: BatchAction, selectedItems: Shift[]) => {
    action.action(selectedItems);
};

const handleSelectionChange = (items: Shift[]) => {
    selectedShifts.value = items;
};

/**
 * Xử lý xác nhận xóa ca làm việc
 * 
 * Created by: DatND (19/1/2026)
 */
const handleConfirmDelete = async () => {
    try {
        const count = shiftsToDelete.value.length;
        await shiftService.deleteShifts(shiftsToDelete.value, true);
        showDeleteConfirm.value = false;
    } catch (error) {
        console.error('Error deleting shifts:', error);
        toast.error('Xóa Ca làm việc thất bại. Vui lòng thử lại.');
    }
};
</script>

<template>
    <!-- Delete Confirmation Dialog -->
    <MISAConfirmDialog v-model:visible="showDeleteConfirm" title="Xóa Ca làm việc" message="{{ shiftsToDelete.length > 1 ?
     'Các Ca làm việc sau khi bị xóa sẽ không thể khôi phục. Bạn có muốn tiếp tục xóa không?' 
    : 'Ca làm việc ' + (shiftsToDelete[0]?.shiftName || '') + ' sau khi bị xóa sẽ không thể khôi phục. Bạn có muốn tiếp tục xóa không?' 
    }}" 
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