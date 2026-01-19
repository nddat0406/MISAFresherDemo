<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick } from 'vue';
import { ShiftStatus, type Shift } from '@/types/shift';
import MISAModal from '@/components/ui/MISAModal.vue';
import MISAInput from '@/components/ui/MISAInput.vue';
import MISATimePicker from '@/components/ui/MISATimePicker.vue';
import MISAConfirmDialog from '@/components/ui/MISAConfirmDialog.vue';
import { formatTimeLocal } from '@/utils/dateFormat';

/**
 * Props cho ShiftModal component
 * - visible: Trạng thái hiển thị của modal
 * - mode: Chế độ hoạt động ('add' | 'edit' | 'duplicate')
 * - shift: Dữ liệu ca làm việc cần edit hoặc duplicate (undefined khi mode='add')
 * 
 * Created by: DatND (16/1/2026)
 */
interface Props {
    visible: boolean;
    mode: 'add' | 'edit' | 'duplicate';
    shift?: Shift;
}

const props = defineProps<Props>();

/**
 * Events được emit từ ShiftModal
 * - update:visible: Cập nhật trạng thái visible
 * - save: Emit khi save thành công, trả về dữ liệu form và mode
 * - save-and-add: Emit khi save và thêm mới, trả về dữ liệu form
 * 
 * Created by: DatND (16/1/2026)
 */
interface Emits {
    (e: 'update:visible', value: boolean): void;
    (e: 'save', data: ShiftFormData, mode: 'add' | 'edit' | 'duplicate'): void;
    (e: 'save-and-add', data: ShiftFormData, mode: 'add' | 'edit' | 'duplicate'): void;
}

const emit = defineEmits<Emits>();

/**
 * Interface cho dữ liệu form ca làm việc
 * Chứa các trường cần thiết để tạo/sửa ca làm việc
 * 
 * Created by: DatND (16/1/2026)
 */
export interface ShiftFormData {
    shiftId?: string;
    shiftCode: string;
    shiftName: string;
    beginShiftTime: string;
    endShiftTime: string;
    beginBreakTime: string;
    inactive?: boolean;
    endBreakTime: string;
    workingTime?: number;
    breakingTime?: number;
    description?: string;
}

/**
 * Dữ liệu form ca làm việc
 * Khởi tạo với giá trị rỗng
 * 
 * Created by: DatND (16/1/2026)
 */
const formData = ref<ShiftFormData>({
    shiftCode: '',
    shiftName: '',
    beginShiftTime: '',
    endShiftTime: '',
    beginBreakTime: '',
    endBreakTime: '',
    description: '',
    inactive: false
});

const originalFormData = ref<string>('');
const isFormDirty = computed(() => {
    return JSON.stringify(formData.value) !== originalFormData.value;
});

/**
 * Trạng thái hiển thị confirm dialog
 * 
 * Created by: DatND (19/1/2026)
 */
const showConfirmDialog = ref(false);

/**
 * Validation error states
 * Lưu trữ các thông báo lỗi cho các validation phức tạp (relationship validations)
 * 
 * Created by: DatND (19/1/2026)
 */
const validationErrors = ref<{
    beginShiftTime?: string;
    endShiftTime?: string;
    beginBreakTime?: string;
    endBreakTime?: string;
}>({});

/**
 * Show error dialog
 * Created by: DatND (19/1/2026)
 */
const showErrorDialog = ref(false);
const errorDialogMessage = ref('');

/**
 * Tính toán thời gian nghỉ giữa ca (giờ)
 * Tự động tính từ beginBreakTime và endBreakTime
 * Kết quả làm tròn 2 chữ số thập phân
 * 
 * Created by: DatND (19/1/2026)
 */
const breakDuration = computed(() => {
    if (!formData.value.beginBreakTime || !formData.value.endBreakTime) {
        return 0;
    }

    try {
        const baseDate = '2000-01-01T';
        const begin = new Date(`${baseDate}${formData.value.beginBreakTime}`);
        const end = new Date(`${baseDate}${formData.value.endBreakTime}`);

        if (isNaN(begin.getTime()) || isNaN(end.getTime())) {
            return 0;
        }

        let minutes = (end.getTime() - begin.getTime()) / (1000 * 60);
        if (minutes < 0) minutes += 24 * 60; // Handle overnight

        const hours = minutes / 60;
        return Math.round(hours * 100) / 100; // Round to 2 decimal places
    } catch {
        return 0;
    }
});

/**
 * Tính toán thời gian làm việc (giờ)
 * Công thức: (endShiftTime - beginShiftTime) - breakDuration
 * Kết quả làm tròn 2 chữ số thập phân
 * 
 * Created by: DatND (19/1/2026)
 */
const workingDuration = computed(() => {
    if (!formData.value.beginShiftTime || !formData.value.endShiftTime) {
        return 0;
    }

    try {
        const baseDate = '2000-01-01T';
        const begin = new Date(`${baseDate}${formData.value.beginShiftTime}`);
        const end = new Date(`${baseDate}${formData.value.endShiftTime}`);

        if (isNaN(begin.getTime()) || isNaN(end.getTime())) {
            return 0;
        }

        let totalMinutes = (end.getTime() - begin.getTime()) / (1000 * 60);
        if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight

        const breakMinutes = breakDuration.value * 60;
        const workingMinutes = totalMinutes - breakMinutes;

        // Never return negative
        const hours = Math.max(0, workingMinutes / 60);
        return Math.round(hours * 100) / 100; // Round to 2 decimal places
    } catch {
        return 0;
    }
});

/**
 * Tính toán tiêu đề modal dựa vào mode
 * - add: "Thêm Ca làm việc"
 * - edit: "Sửa Ca làm việc"
 * - duplicate: "Nhân bản Ca làm việc"
 * 
 * Created by: DatND (16/1/2026)
 */
const modalTitle = computed(() => {
    if (props.mode === 'add') return 'Thêm Ca làm việc';
    if (props.mode === 'edit') return 'Sửa Ca làm việc';
    return 'Nhân bản Ca làm việc';
});


/**
 * Khởi tạo dữ liệu form từ shift prop
 * - Mode add: Reset form (tất cả trường rỗng)
 * - Mode edit: Giữ nguyên tất cả các trường kể cả shiftCode
 * - Mode duplicate: Clear shiftCode, giữ nguyên các trường còn lại
 * 
 * Created by: DatND (16/1/2026)
 */
const initFormData = () => {
    if (props.shift && props.mode !== 'add') {
        formData.value = {
            shiftCode: props.mode === 'duplicate' ? '' : props.shift.shiftCode,
            shiftName: props.shift.shiftName,
            beginShiftTime: formatTimeLocal(props.shift.beginShiftTime).substring(0, 5),
            endShiftTime: formatTimeLocal(props.shift.endShiftTime).substring(0, 5),
            beginBreakTime: props.shift.beginBreakTime ? formatTimeLocal(props.shift.beginBreakTime).substring(0, 5) : '',
            endBreakTime: props.shift.endBreakTime ? formatTimeLocal(props.shift.endBreakTime).substring(0, 5) : '',
            workingTime: props.shift.workingTime,
            breakingTime: props.shift.breakingTime,
            inactive: props.shift.inactive,
            description: props.shift.description || ''
        };
    } else {
        resetForm();
    }
    // Store original form data for dirty checking
    originalFormData.value = JSON.stringify(formData.value);
};

/**
 * Reset form về trạng thái ban đầu (tất cả trường rỗng)
 * 
 * Created by: DatND (16/1/2026)
 */
const resetForm = () => {
    formData.value = {
        shiftCode: '',
        shiftName: '',
        beginShiftTime: '',
        endShiftTime: '',
        beginBreakTime: '',
        endBreakTime: '',
        description: '',
        inactive: false
    };
    validationErrors.value = {};
};

/**
 * Validation helper: kiểm tra chuỗi rỗng hoặc chỉ chứa khoảng trắng
 * 
 * Created by: DatND (19/1/2026)
 */
const isEmptyOrWhitespace = (value: string): boolean => {
    return !value || value.trim().length === 0;
};

/**
 * Parse time string HH:mm to minutes since midnight
 * 
 * Created by: DatND (19/1/2026)
 */
const parseTimeToMinutes = (timeStr: string): number | null => {
    if (!timeStr) return null;
    const parts = timeStr.split(':').map(Number);
    const hours = parts[0];
    const minutes = parts[1];
    if (hours === undefined || minutes === undefined || isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
};

/**
 * Validate shift times relationship (beginShiftTime and endShiftTime)
 * - Bắt đầu không được bằng kết thúc
 * Note: Required validation is now handled by the TimePicker component itself
 * 
 * Created by: DatND (19/1/2026)
 */
const validateShiftTimes = () => {
    let isValid = true;

    // Clear previous errors
    delete validationErrors.value.beginShiftTime;
    delete validationErrors.value.endShiftTime;

    // If both are filled, validate relationship
    if (formData.value.beginShiftTime && formData.value.endShiftTime) {
        const beginMinutes = parseTimeToMinutes(formData.value.beginShiftTime);
        const endMinutes = parseTimeToMinutes(formData.value.endShiftTime);

        if (beginMinutes !== null && endMinutes !== null) {
            if (beginMinutes === endMinutes) {
                validationErrors.value.beginShiftTime = 'Giờ vào ca không được bằng giờ hết ca';
                validationErrors.value.endShiftTime = 'Giờ hết ca không được bằng giờ vào ca';
                isValid = false;
            }
        }
    }

    return isValid;
};

/**
 * Validate break times relationship (beginBreakTime and endBreakTime)
 * - Ko bắt buộc
 * - nếu nhập thì phải đầy đủ cả 2 trường
 * - Bắt đầu phải trước kết thúc
 * - Thời gian nghỉ phải nằm trong khoảng thời gian ca làm việc
 * 
 * Created by: DatND (19/1/2026)
 */
const validateBreakTimes = () => {
    let isValid = true;

    // Clear previous errors
    delete validationErrors.value.beginBreakTime;
    delete validationErrors.value.endBreakTime;

    const hasBeginBreak = !isEmptyOrWhitespace(formData.value.beginBreakTime);
    const hasEndBreak = !isEmptyOrWhitespace(formData.value.endBreakTime);

    // Nếu nhập một trường thì trường còn lại bắt buộc phải nhập
    if (hasBeginBreak && !hasEndBreak) {
        validationErrors.value.endBreakTime = 'Kết thúc nghỉ giữa ca không được để trống khi đã nhập bắt đầu nghỉ';
        isValid = false;
    }

    if (hasEndBreak && !hasBeginBreak) {
        validationErrors.value.beginBreakTime = 'Bắt đầu nghỉ giữa ca không được để trống khi đã nhập kết thúc nghỉ';
        isValid = false;
    }

    // If both are filled, validate relationship and range
    if (hasBeginBreak && hasEndBreak) {
        const beginBreakMinutes = parseTimeToMinutes(formData.value.beginBreakTime);
        const endBreakMinutes = parseTimeToMinutes(formData.value.endBreakTime);
        const beginShiftMinutes = parseTimeToMinutes(formData.value.beginShiftTime);
        const endShiftMinutes = parseTimeToMinutes(formData.value.endShiftTime);

        if (beginBreakMinutes !== null && endBreakMinutes !== null) {
            // Check break time order
            if (beginBreakMinutes >= endBreakMinutes) {
                validationErrors.value.beginBreakTime = 'Bắt đầu nghỉ phải trước kết thúc nghỉ';
                isValid = false;
            }

            // Check if break time is within shift time
            if (beginShiftMinutes !== null && endShiftMinutes !== null) {
                // For same-day shifts
                if (beginShiftMinutes < endShiftMinutes) {
                    if (beginBreakMinutes < beginShiftMinutes) {
                        validationErrors.value.beginBreakTime = 'Thời gian nghỉ phải nằm trong ca làm việc';
                        isValid = false;
                    }
                    if (endBreakMinutes > endShiftMinutes) {
                        validationErrors.value.endBreakTime = 'Thời gian nghỉ phải nằm trong ca làm việc';
                        isValid = false;
                    }
                }
            }
        }
    }

    return isValid;
};

/**
 * Refs để focus vào input Mã ca khi modal mở và trigger validation
 * 
 * Created by: DatND (16/1/2026)
 */
const shiftCodeInputRef = ref<any>(null);
const shiftNameInputRef = ref<any>(null);
const beginShiftTimeRef = ref<any>(null);
const endShiftTimeRef = ref<any>(null);

/**
 * Watch shift prop và visible để khởi tạo lại form data khi modal mở
 * Đảm bảo form luôn có dữ liệu mới nhất khi mở modal
 * Focus vào input Mã ca sau khi modal hiển thị
 * 
 * Created by: DatND (16/1/2026)
 */
watch(() => [props.visible, props.shift, props.mode], ([newVisible]) => {
    if (newVisible) {
        initFormData();
        // Focus vào input Mã ca sau khi DOM cập nhật
        nextTick(() => {
            if (shiftCodeInputRef.value) {
                const inputEl = shiftCodeInputRef.value.$el?.querySelector('input') || shiftCodeInputRef.value;
                inputEl?.focus();
            }
        });
    }
}, { immediate: true });

/**
 * Xử lý sự kiện Save
 * Emit event 'save' với dữ liệu form và mode hiện tại
 * Chỉ save khi form hợp lệ
 * 
 * Created by: DatND (16/1/2026)
 */
const handleSave = () => {
    const errors: string[] = [];

    // Trigger validation on required fields (handled by components)
    let isRequiredValid = true;
    if (shiftCodeInputRef.value?.validate) {
        if (!shiftCodeInputRef.value.validate()) {
            isRequiredValid = false;
            errors.push('Mã ca không được để trống');
        }
    }
    if (shiftNameInputRef.value?.validate) {
        if (!shiftNameInputRef.value.validate()) {
            isRequiredValid = false;
            errors.push('Tên ca không được để trống');
        }
    }
    if (beginShiftTimeRef.value?.validate) {
        if (!beginShiftTimeRef.value.validate()) {
            isRequiredValid = false;
            errors.push('Giờ vào ca không được để trống');
        }
    }
    if (endShiftTimeRef.value?.validate) {
        if (!endShiftTimeRef.value.validate()) {
            isRequiredValid = false;
            errors.push('Giờ hết ca không được để trống');
        }
    }

    // Validate relationship rules
    const isShiftTimesValid = validateShiftTimes();
    const isBreakTimesValid = validateBreakTimes();

    // Collect relationship errors
    if (!isShiftTimesValid) {
        if (validationErrors.value.beginShiftTime) errors.push(validationErrors.value.beginShiftTime);
        if (validationErrors.value.endShiftTime) errors.push(validationErrors.value.endShiftTime);
    }
    if (!isBreakTimesValid) {
        if (validationErrors.value.beginBreakTime) errors.push(validationErrors.value.beginBreakTime);
        if (validationErrors.value.endBreakTime) errors.push(validationErrors.value.endBreakTime);
    }

    if (!isRequiredValid || !isShiftTimesValid || !isBreakTimesValid) {
        // Show error dialog with all errors
        errorDialogMessage.value = errors.join('\n');
        showErrorDialog.value = true;
        return;
    }

    emit('save', formData.value, props.mode);
    originalFormData.value = JSON.stringify(formData.value);
};

/**
 * Xử lý sự kiện Save và Thêm
 * Emit event 'save-and-add' với dữ liệu form
 * Chỉ save khi form hợp lệ
 * 
 * Created by: DatND (16/1/2026)
 */
const handleSaveAndAdd = () => {
    const errors: string[] = [];

    // Trigger validation on required fields (handled by components)
    let isRequiredValid = true;
    if (shiftCodeInputRef.value?.validate) {
        if (!shiftCodeInputRef.value.validate()) {
            isRequiredValid = false;
            errors.push('Mã ca không được để trống');
        }
    }
    if (shiftNameInputRef.value?.validate) {
        if (!shiftNameInputRef.value.validate()) {
            isRequiredValid = false;
            errors.push('Tên ca không được để trống');
        }
    }
    if (beginShiftTimeRef.value?.validate) {
        if (!beginShiftTimeRef.value.validate()) {
            isRequiredValid = false;
            errors.push('Giờ vào ca không được để trống');
        }
    }
    if (endShiftTimeRef.value?.validate) {
        if (!endShiftTimeRef.value.validate()) {
            isRequiredValid = false;
            errors.push('Giờ hết ca không được để trống');
        }
    }

    // Validate relationship rules
    const isShiftTimesValid = validateShiftTimes();
    const isBreakTimesValid = validateBreakTimes();

    // Collect relationship errors
    if (!isShiftTimesValid) {
        if (validationErrors.value.beginShiftTime) errors.push(validationErrors.value.beginShiftTime);
        if (validationErrors.value.endShiftTime) errors.push(validationErrors.value.endShiftTime);
    }
    if (!isBreakTimesValid) {
        if (validationErrors.value.beginBreakTime) errors.push(validationErrors.value.beginBreakTime);
        if (validationErrors.value.endBreakTime) errors.push(validationErrors.value.endBreakTime);
    }

    if (!isRequiredValid || !isShiftTimesValid || !isBreakTimesValid) {
        // Show error dialog with all errors
        errorDialogMessage.value = errors.join('\n');
        showErrorDialog.value = true;
        return;
    }

    emit('save-and-add', formData.value, props.mode);
    originalFormData.value = JSON.stringify(formData.value);
};

/**
 * Xử lý sự kiện Cancel/Close
 * Đóng modal và reset form
 * 
 * Created by: DatND (16/1/2026)
 */
const handleCancel = () => {
    if (isFormDirty.value) {
        showConfirmDialog.value = true;
    } else {
        emit('update:visible', false);
        resetForm();
    }
}

/**
 * Xử lý khi người dùng xác nhận thoát mà không lưu
 * Created by: DatND (19/1/2026)
 */
const handleConfirmExit = () => {
    emit('update:visible', false);
    resetForm();
}

onMounted(() => {

});
</script>

<template>
    <!-- Confirm Dialog for unsaved changes -->
    <MISAConfirmDialog v-model:visible="showConfirmDialog" title="Thoát và không lưu?"
        message="Nếu bạn thoát, các dữ liệu đang nhập liệu sẽ không được lưu lại." accept-label="Đồng ý"
        reject-label="Hủy" @accept="handleConfirmExit" />

    <!-- Error Dialog for validation errors -->
    <MISAConfirmDialog v-model:visible="showErrorDialog" title="Lỗi xác thực" accept-label="Đóng" :show-reject="false">
        <template #message>
            <ul style="list-style-type: disc; padding-left: 20px; margin: 0;">
                <li v-for="(error, index) in errorDialogMessage.split('\n').filter(e => e)" :key="index"
                    style="margin-bottom: 8px;">
                    {{ error }}
                </li>
            </ul>
        </template>
    </MISAConfirmDialog>

    <MISAModal :visible="visible" @update:visible="emit('update:visible', $event)">
        <!-- Title slot -->
        <template #title>
            {{ modalTitle }}
        </template>

        <!-- Body slot -->
        <template #default>
            <div class="container-content">
                <div class="form-group">
                    <MISAInput ref="shiftCodeInputRef" v-model="formData.shiftCode" label="Mã ca" :required="true"
                        :maxlength="25" placeholder="Nhập mã ca" />
                </div>
                <div class="form-group">
                    <MISAInput ref="shiftNameInputRef" v-model="formData.shiftName" label="Tên ca" :required="true"
                        :maxlength="50" placeholder="Nhập tên ca" />
                </div>
                <div class="form-group flex">
                    <div class="w-1/2 mr-3">
                        <MISATimePicker ref="beginShiftTimeRef" :containerStyle="{ maxWidth: '122px', paddingRight: 0 }"
                            :error="validationErrors.beginShiftTime" :inputStyle="{ width: '78px', height: '16px' }"
                            labelClass="w-37.5" v-model="formData.beginShiftTime" label="Giờ vào ca" :required="true"
                            placeholder="HH:MM" @blur="validateShiftTimes" />
                    </div>
                    <div class="w-1/2">
                        <MISATimePicker ref="endShiftTimeRef" :containerStyle="{ maxWidth: '122px', paddingRight: 0 }"
                            :error="validationErrors.endShiftTime" :inputStyle="{ width: '78px', height: '16px' }"
                            labelClass="w-43.75" v-model="formData.endShiftTime" label="Giờ hết ca" :required="true"
                            placeholder="HH:MM" @blur="validateShiftTimes" :format="'HH:mm'" />
                    </div>
                </div>
                <div class="form-group flex mt-4">
                    <div class="w-1/2 mr-3">
                        <MISATimePicker :containerStyle="{ maxWidth: '122px', paddingRight: 0 }"
                            :inputStyle="{ width: '78px', height: '16px' }" labelClass="w-37.5"
                            v-model="formData.beginBreakTime" label="Bắt đầu nghỉ giữa ca" placeholder="HH:MM"
                            @blur="validateBreakTimes" :error="validationErrors.beginBreakTime" :format="'HH:mm'" />
                    </div>
                    <div class="w-1/2">
                        <MISATimePicker :containerStyle="{ maxWidth: '122px', paddingRight: 0 }"
                            :inputStyle="{ width: '78px', height: '16px' }" labelClass="w-43.75"
                            v-model="formData.endBreakTime" label="Kết thúc nghỉ giữa ca" placeholder="HH:MM"
                            @blur="validateBreakTimes" :error="validationErrors.endBreakTime" :format="'HH:mm'" />
                    </div>
                </div>
                <div class="form-group flex mt-4">
                    <div class="ms-number ms-editor w-1/2 flex items-center gap-4 mr-3">
                        <div class="label-container">
                            <div class="flex items-center w-37.5"><label class="label">Thời gian làm việc (giờ)</label>
                            </div>
                        </div>
                        <div class="ms-number-container flex-1 w-full">
                            <div class="flex-1 flex items-center input-container disabled border">
                                <input step="1" class="ms-number-item w-full h-4" disabled tabindex="0"
                                    :value="workingDuration || ''">
                            </div>
                        </div>
                    </div>
                    <div class="ms-number ms-editor w-1/2 flex items-center gap-4">
                        <div class="label-container">
                            <div class="flex items-center w-43.75">
                                <label class="label">Thời gian nghỉ giữa ca (giờ)</label>
                            </div>
                        </div>
                        <div class="ms-number-container flex-1 w-full">
                            <div class="flex-1 flex items-center input-container disabled border">
                                <input step="1" class="ms-number-item w-full h-4" disabled tabindex="0"
                                    :value="breakDuration || ''">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-group mt-4">
                    <div class="ms-textarea ms-editor ms-validate flex items-start gap-4 w-full" style="height: auto;">
                        <div class="flex w-37.5"><label class="label">Mô tả</label></div>
                        <div class="flex-1 flex border w-full">
                            <textarea v-model="formData.description" class="ms-textarea-item flex w-full"
                                maxlength="400" rows="3"></textarea>
                        </div>
                    </div>
                </div>
                <div class="form-group flex mt-4 gap-4" v-if="mode === 'edit'">
                    <label for="statusInfo" title="Trạng thái" class="form-label w-37.5">Trạng thái</label>
                    <div class="form-control-container radio-item">
                        <div class="flex flex-row">
                            <label class="ms-radio mr-4">
                                <input type="radio" name="rdname" tabindex="0" value="false"
                                    :checked="!formData.inactive"><span <span class="checkmark"></span>
                                <div class="flex flex-column ms-radio-content">
                                    <span class="ms-radio--text">Đang sử dụng</span>
                                </div>
                            </label>
                            <label class="ms-radio mr-4">
                                <input type="radio" name="rdname" tabindex="0" value="true"
                                    :checked="formData.inactive"><span class="checkmark"></span>
                                <div class="flex flex-column ms-radio-content">
                                    <span class="ms-radio--text">Ngừng sử dụng</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

        </template>

        <!-- Footer slot -->
        <template #footer>
            <div class="flex footer-buttons-parent">
                <div class="flex footer-buttons-right footer-buttons">
                    <button class="ms-button btn-solid-brand" v-tooltip="'Ctr + S'" shortkey-target="Save"
                        @click="handleSave">
                        <div class="text nowrap">Lưu</div>
                    </button>
                    <button class="ms-button btn-outline-neutral" v-tooltip="'Ctr + Shift + S'"
                        shortkey-target="SaveAndAdd" @click="handleSaveAndAdd">
                        <div class="text nowrap">Lưu và Thêm</div>
                    </button>
                    <button class="ms-button btn-outline-neutral" shortkey-target="Close" @click="handleCancel">
                        <div class="text nowrap">Hủy</div>
                    </button>
                </div>
            </div>
        </template>
    </MISAModal>
</template>

<style scoped>
/* Container Styles */
.shift-detail .container-content {
    padding: 20px;
}

.container-content {
    padding: 20px;
}

.shift-detail .footer-buttons-parent {
    width: 100%;
    justify-content: flex-end;
}

.footer-buttons-parent {
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

.footer-buttons {
    flex-direction: row-reverse;
    gap: 8px;
}

.shift-detail .container-content .form-group .form-label {
    color: #262626;
    display: block;
    font-weight: 600;
}

/* Error message styling */
.error-message {
    color: #e74c3c;
    font-size: 12px;
    margin-top: 4px;
    margin-left: 0;
    display: block;
}

.form-group {
    position: relative;
}
</style>
