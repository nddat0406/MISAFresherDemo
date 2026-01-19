<script setup lang="ts">
import { computed, ref } from 'vue';

interface Props {
    modelValue?: string | number | null;
    type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url';
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    maxlength?: number;
    required?: boolean;
    label?: string;
    error?: string;
    autocomplete?: string;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    type: 'text',
    placeholder: '',
    disabled: false,
    readonly: false,
    autocomplete: 'on'
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | number): void;
    (e: 'focus', event: FocusEvent): void;
    (e: 'blur', event: FocusEvent): void;
    (e: 'validation-error', error: string | null): void;
}>();

const internalError = ref<string | null>(null);

const displayError = computed(() => props.error || internalError.value);

const inputValue = computed({
    get: () => props.modelValue ?? '',
    set: (value: string | number) => emit('update:modelValue', value)
});

const isEmptyOrWhitespace = (value: string | number | null | undefined): boolean => {
    if (value === null || value === undefined) return true;
    const strValue = String(value);
    return strValue.trim().length === 0;
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

const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    inputValue.value = props.type === 'number' ? target.valueAsNumber || target.value : target.value;
    // Clear error on input
    if (internalError.value) {
        internalError.value = null;
        emit('validation-error', null);
    }
};

const handleFocus = (event: FocusEvent) => {
    emit('focus', event);
};

const handleBlur = (event: FocusEvent) => {
    validateRequired();
    emit('blur', event);
};

defineExpose({
    validate: validateRequired
});
</script>

<template>
    <div class="ms-input ms-editor w-full flex items-center gap-4 ms-validate" :class="{ 'error': displayError }">
        <div v-if="label" class="flex items-center w-37.5">
            <label class="label">{{ label }}</label>
            <div v-if="required" class="ms-input-required">&nbsp;*</div>
        </div>
        <div class="flex-1 flex items-center input-container border pointer" :class="{ 'error': displayError, 'disabled': disabled }" v-tooltip="displayError">
            <slot name="prefix"></slot>
            <input
                class="ms-input-item flex w-full"
                :type="type"
                :value="inputValue"
                :placeholder="placeholder"
                :disabled="disabled"
                :readonly="readonly"
                :maxlength="maxlength"
                :autocomplete="autocomplete"
                @input="handleInput"
                @focus="handleFocus"
                @blur="handleBlur"
            />
            <slot name="suffix"></slot>
        </div>
    </div>
</template>

<style scoped>
/* Component-specific overrides if needed */
</style>
