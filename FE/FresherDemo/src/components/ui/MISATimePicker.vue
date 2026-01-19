<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { Dropdown } from 'floating-vue';

interface Props {
    modelValue?: string | null;
    format?: 'HH:mm' | 'hh:mm A';
    hourType?: 12 | 24;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    label?: string;
    error?: string;
    containerClass?: string;
    containerStyle?: Record<string, any>;
    labelClass?: string;
    labelStyle?: Record<string, any>;
    inputClass?: string;
    inputStyle?: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    format: 'HH:mm',
    hourType: 24,
    placeholder: 'HH:MM',
    disabled: false,
    required: false
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
    (e: 'blur', value: string): void;
    (e: 'focus', value: string): void;
    (e: 'validation-error', error: string | null): void;
}>();

const isOpen = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const inputValue = ref(props.modelValue || '');
const triggerRef = ref<HTMLElement | null>(null);
const popperWidth = ref<number>(0);
const internalError = ref<string | null>(null);

const displayError = computed(() => props.error || internalError.value);

const isEmptyOrWhitespace = (value: string | null | undefined): boolean => {
    if (value === null || value === undefined) return true;
    return value.trim().length === 0;
};

const validateRequired = () => {
    if (props.required && isEmptyOrWhitespace(props.modelValue)) {
        const errorMsg = `${props.label || 'Trường này'} không được để trống`;
        internalError.value = errorMsg;
        emit('validation-error', errorMsg);
        return false;
    }
    internalError.value = null;
    emit('validation-error', null);
    return true;
};

// Generate time options in 30-minute intervals
const timeOptions = computed(() => {
    const options: string[] = [];
    const maxHour = props.hourType === 24 ? 24 : 12;

    for (let hour = 0; hour < maxHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const h = hour.toString().padStart(2, '0');
            const m = minute.toString().padStart(2, '0');

            if (props.hourType === 12) {
                const period = hour < 12 ? 'AM' : 'PM';
                const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                options.push(`${displayHour.toString().padStart(2, '0')}:${m} ${period}`);
            } else {
                options.push(`${h}:${m}`);
            }
        }
    }

    return options;
});

const syncWidth = () => {
    if (triggerRef.value) {
        popperWidth.value = triggerRef.value.offsetWidth;
    }
};

const validateTimeInput = (value: string): boolean => {
    const timeRegex = props.hourType === 24
        ? /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/
        : /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/i;

    return timeRegex.test(value);
};

const formatTime = (value: string): string => {
    // Remove any non-digit characters except colon and space
    let cleaned = value.replace(/[^\d:\sAaPpMm]/g, '');

    // Auto-format as user types
    if (cleaned.length === 2 && !cleaned.includes(':')) {
        cleaned = cleaned + ':';
    }

    return cleaned;
};
const handleInput = (event: Event) => {
    const value = (event.target as HTMLInputElement).value;
    inputValue.value = value;

    if (validateTimeInput(value)) {
        emit('update:modelValue', value);
    }
    // Clear error on input
    if (internalError.value) {
        internalError.value = null;
        emit('validation-error', null);
    }
};


const handleKeyDown = (event: KeyboardEvent) => {
    if (props.disabled) return;

    const controlKeys = [
        'Backspace',
        'Delete',
        'Tab',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End'
    ];

    if (controlKeys.includes(event.key)) return;

    if (!/\d/.test(event.key)) {
        event.preventDefault();
        return;
    }

    const input = event.target as HTMLInputElement;
    const value = input.value;
    const pos = input.selectionStart ?? value.length;

    // Prevent overflow
    if (value.length >= 5) {
        event.preventDefault();
        return;
    }

    // FIRST DIGIT HANDLING
    if (value.length === 0) {
        const digit = Number(event.key);

        // If first digit > 2 → prefix 0 and auto-complete hour
        if (digit > 2) {
            event.preventDefault();
            input.value = `0${digit}:`;
            inputValue.value = input.value;
            return;
        }
        return;
    }

    // SECOND DIGIT HANDLING
    if (value.length === 1) {
        const hour = Number(value + event.key);
        if (hour > 23) {
            event.preventDefault();
            return;
        }

        // Auto insert colon after hour
        event.preventDefault();
        input.value = `${hour.toString().padStart(2, '0')}:`;
        inputValue.value = input.value;
        return;
    }

    // AUTO COLON (safety)
    if (value.length === 2 && !value.includes(':')) {
        input.value = value + ':';
    }

    // MINUTE VALIDATION
    if (value.length === 3) {
        if (Number(event.key) > 5) {
            event.preventDefault();
            return;
        }
    }
};


const handleBlur = () => {
    // Validate and format on blur
    if (inputValue.value && !validateTimeInput(inputValue.value)) {
        // Reset to previous valid value or empty
        inputValue.value = props.modelValue || '';
    }
    validateRequired();
    emit('blur', inputValue.value);
};

const selectTime = (time: string) => {
    inputValue.value = time;
    emit('update:modelValue', time);
    isOpen.value = false;
};

const handleFocus = () => {
    syncWidth();
};

const handleClickOutside = (event: MouseEvent) => {
    if (
        dropdownRef.value &&
        !dropdownRef.value.contains(event.target as Node) &&
        inputRef.value &&
        !inputRef.value.contains(event.target as Node)
    ) {
        isOpen.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
    inputValue.value = props.modelValue || '';
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
});

// Watch for external changes
const updateInputValue = () => {
    if (props.modelValue !== inputValue.value) {
        inputValue.value = props.modelValue || '';
    }
};

// Sync external changes
onMounted(() => {
    updateInputValue();
});

defineExpose({
    validate: validateRequired
});
</script>

<template>
    <div class="ms-timepicker ms-editor flex items-center gap-4 ms-validate" :class="{ 'disabled': disabled }">
        <div v-if="label" :class="labelClass" class="flex flex-row" :style="labelStyle">
            <label class="label">{{ label }}</label>
            <div v-if="required" class="ms-timepicker-required">&nbsp;*</div>
        </div>

        <Dropdown v-model:shown="isOpen" :triggers="['click']" :distance="6" placement="bottom-start">
            <template #default>
                <div ref="triggerRef" class="ms-container--timepicker flex flex-row border input-container flex-1"
                    v-tooltip="displayError" :class="[{ 'error': displayError }, { 'disabled': disabled }, containerClass]"
                    :style="containerStyle">
                    <input ref="inputRef" class="ms-input--timepicker flex" :placeholder="placeholder"
                        :class="inputClass" :style="inputStyle" :value="inputValue" :disabled="disabled" tabindex="0"
                        @input="handleInput" @keydown="handleKeyDown" @blur="handleBlur" @focus="handleFocus"
                        @click="!disabled && (isOpen = !isOpen)" />
                    <div class="mi icon16 ic-time"></div>
                </div>
            </template>

            <template #popper>
                <div ref="dropdownRef" class="ms-timepicker-dropdown" :style="{ width: `${popperWidth}px` }">
                    <div class="time-options-container">
                        <div v-for="time in timeOptions" :key="time" class="time-option"
                            :class="{ 'selected': time === inputValue }" @click="selectTime(time)">
                            {{ time }}
                        </div>
                    </div>
                </div>
            </template>
        </Dropdown>
    </div>
</template>

<style src="../../assets/css/inputs.css"></style>
