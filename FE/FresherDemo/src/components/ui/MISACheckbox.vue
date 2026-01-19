<script setup lang="ts">
defineProps<{
    modelValue: boolean
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>();

const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    emit('update:modelValue', target.checked);
};
</script>
<template>
    <label class="ms-checkbox justify-center" checkonly="">
        <input type="checkbox" class="ms-checkbox-control checkbox" :checked="modelValue" :value="modelValue"
            @change="handleChange">
        <div class="ms-checkbox-wrapper">
            <span class="ms-checkbox-container">
                <span class="ms-checkbox-inner">
                    <div class="checkmark" :class="{ 'mi-checkbox-active': modelValue }"></div>
                </span>
            </span>
        </div>
    </label>
</template>


<style src="@/assets/css/checkbox.css"></style>