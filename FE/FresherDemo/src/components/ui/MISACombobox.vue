<script setup lang="ts">
import { Dropdown } from 'floating-vue';
import { computed, nextTick, ref, useAttrs, watch } from 'vue';

interface OptionItem {
    label: string;
    value: string | number;
    disabled?: boolean;
}
const attrs = useAttrs();
const triggerRef = ref<HTMLElement | null>(null);
const popperWidth = ref<number>(0);

const syncWidth = async () => {
    await nextTick();
    if (triggerRef.value) {
        popperWidth.value = triggerRef.value.offsetWidth;
    }
};

const props = withDefaults(defineProps<{
    modelValue: string | number | null;
    options: OptionItem[];
    placeholder?: string;
    disabled?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    noResultsText?: string;
    placement?: 'auto' | 'auto-start' | 'auto-end' |
    'top' | 'top-start' | 'top-end' |
    'right' | 'right-start' | 'right-end' |
    'bottom' | 'bottom-start' | 'bottom-end' |
    'left' | 'left-start' | 'left-end';
}>(), {
    placeholder: 'Select a value',
    disabled: false,
    searchable: true,
    searchPlaceholder: '',
    noResultsText: 'No results',
    placement: 'bottom'
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | number | null): void;
    (e: 'toggle-search', enabled: boolean): void;
    (e: 'open-change', open: boolean): void;
}>();

const isOpen = ref(false);
const searchEnabled = ref(props.searchable);
const searchQuery = ref('');

watch(isOpen, (open) => {
    if (open) syncWidth();
});
watch(
    () => props.searchable,
    (val) => {
        searchEnabled.value = val;
        if (!val) searchQuery.value = '';
    }
);

const selectedOption = computed(() => props.options.find(opt => opt.value === props.modelValue));

const filteredOptions = computed(() => {
    if (!searchEnabled.value || !searchQuery.value.trim()) return props.options;
    const keyword = searchQuery.value.trim().toLowerCase();
    return props.options.filter(opt => opt.label.toLowerCase().includes(keyword));
});

watch(isOpen, (open) => emit('open-change', open));

const close = () => {
    isOpen.value = false;
};

const selectOption = (option: OptionItem) => {
    if (option.disabled) return;
    emit('update:modelValue', option.value);
    close();
};
</script>

<template>
    <Dropdown v-model:shown="isOpen" :triggers="['click']" :distance="6" :placement="props.placement" same-width
        :middleware="['sameWidth']" :teleport="true" @hide="close">
        <template #default>
            <div ref="triggerRef" class="ms-combobox ms-editor ms-validate flex items-center gap-4 border-color-list"
                v-bind="attrs" :class="{ 'is-open': isOpen, disabled }">

                <div class="flex flex-1">
                    <div class="flex flex-row combo-box-input input-container flex-1 border">
                        <div class="menu-wrapper">
                            <input class="input flex" :value="selectedOption?.label || ''" :placeholder="placeholder"
                                v-tooltip="selectedOption?.label || placeholder" readonly style="text-align: left;">
                            <div class="menu-button-container"></div>
                        </div>
                        <div class="editor-icon-container">
                            <div class="mi icon16 angle-down icon-combo--dropdown-arrow expand"></div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <template #popper>
            <div class="combo-dropdown-panel" :style="{ width: popperWidth + 'px' }">
                <div class="dropdown-body-container" style="max-height: 140px; overflow: auto;">
                    <ul class="dropdown-items">
                        <li v-for="option in filteredOptions" :key="option.value" class="combobox-item single"
                            v-tooltip="option.label"
                            :class="{ checked: option.value === modelValue, disabled: option.disabled }"
                            style="text-align: left;" @click.stop="selectOption(option)">
                            <div class="combobox-item-con view-text">
                                <div class="combobox-item--text ">
                                    <div class="combobox-item--text">{{ option.label }}</div>
                                </div>
                            </div>
                            <div class="select-checked select-checked-not-col"></div>
                        </li>
                        <li v-if="filteredOptions.length === 0" class="combobox-item single disabled"
                            style="text-align: left;">
                            <div class="combobox-item-con view-text">
                                <div class="combobox-item--text ">
                                    <div class="combobox-item--text">{{ noResultsText }}</div>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </template>
    </Dropdown>
</template>

<style scoped>
.combo-dropdown-panel {
    z-index: 100001;
    background-color: #fff;
    overflow: hidden;
    box-shadow: 0 0 8px #0000001a, 0 8px 16px #0000001a;
    border-radius: 4px;
}

.combo-dropdown-panel .dropdown-body-container {
    max-height: 198px;
    overflow: auto;
}

.dropdown-items {
    padding: 0;
    margin: 0;
    visibility: visible;
}

.combobox-item {
    position: relative;
    cursor: pointer;
    height: 28px;
    line-height: 28px;
    white-space: nowrap;
    border-radius: 2px;
    padding: 12px;
}

.combobox-item:hover {
    background: #F3F4F6;
}

.combobox-item.single {
    display: flex;
    align-items: center;
}

.combobox-item.checked {
    color: #009b71;
    background-color: #d0fbe7;
}


.combobox-item .combobox-item-con {
    display: flex;
    flex: 1;
    width: 100%;
}

.combobox-item .view-text {
    width: calc(100% - 16px);
}

.combobox-item .combobox-item--text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    align-items: center;
}

.ms-combobox {
    width: 100%;
    background-color: transparent;
}

.ms-combobox .border {
    background: #fff;
}


.ms-combobox .input {
    border: 0;
    text-overflow: ellipsis;
    width: 100%;
    height: 16px;
    outline: none;
    font-family: Inter;
    padding: 0;
    flex: 1;
}

.dropdown-search {
    padding: 8px 12px 4px;
}

.dropdown-search .search-input {
    width: 100%;
    border: 1px solid #D1D5DB;
    border-radius: 4px;
    padding: 6px 8px;
    font-size: 13px;
}

.action-btn {
    border: 1px solid #d1d5db;
    background: #fff;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
}

.action-btn:hover {
    border-color: #111827;
}

.action-text {
    font-weight: 600;
}

.select-checked {
    width: 10px;
    height: 5.67px;
    border-width: 0 0 1px 1px;
    border-style: solid;
    border-color: #009b71;
    transform: translateY(-2px) rotate(-45deg);
    display: none;
}

.combobox-item.checked .select-checked {
    display: block;
}

.ms-combobox.is-open .border {
    border-color: #009b71;
}

.ms-combobox .icon-combo--dropdown-arrow {
    transition: transform 0.3s ease;
    transform: rotate(0deg);
}

.ms-combobox.is-open .icon-combo--dropdown-arrow {
    transform: rotate(180deg);
}
</style>
