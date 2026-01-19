import { computed, ref } from 'vue';

export type SelectionMode = 'single' | 'multiple';

interface UseTableSelectionParams<T> {
    data: () => T[];
    selectionMode: () => SelectionMode;
    getRowKey: (item: T) => string | number;
    emitSelectionChange: (items: T[]) => void;
}

export const useTableSelection = <T>({
    data,
    selectionMode,
    getRowKey,
    emitSelectionChange
}: UseTableSelectionParams<T>) => {
    const selectedKeys = ref<Set<string | number>>(new Set());
    const activeRowKey = ref<string | number | null>(null);

    const selectedItems = computed(() => data().filter(item => selectedKeys.value.has(getRowKey(item))));

    const isRowChecked = (item: T) => selectedKeys.value.has(getRowKey(item));

    /**
     * Quản lý chọn tất cả hoặc bỏ chọn tất cả. Tạo Set mới chứa keys nếu checked = true
     * Create by: DatND (15/1/2026)
     */
    const handleSelectAllChange = (items: T[], checked: boolean) => {
        const next = new Set<string | number>();
        if (checked) {
            items.forEach(item => next.add(getRowKey(item)));
        }
        selectedKeys.value = next;
        emitSelectionChange(selectedItems.value);
    };

    /**
     * Quản lý bật/tắt chọn một dòng. Mode single sẽ clear all, mode multiple sẽ add/delete key
     * Create by: DatND (15/1/2026)
     */
    const toggleRowSelection = (item: T, checked: boolean) => {
        const key = getRowKey(item);
        const next = new Set(selectedKeys.value);

        if (selectionMode() === 'single') {
            checked ? next.add(key) : next.clear();
        } else {
            if (checked) next.add(key);
            else next.delete(key);
        }

        selectedKeys.value = next;
        emitSelectionChange(selectedItems.value);
    };

    const unselectAll = () => {
        selectedKeys.value = new Set();
        emitSelectionChange(selectedItems.value);
    };

    const setActiveRow = (item: T | null) => {
        activeRowKey.value = item ? getRowKey(item) : null;
    };

    const isActiveRow = (item: T) => activeRowKey.value === getRowKey(item);

    return {
        selectedKeys,
        activeRowKey,
        selectedItems,
        isRowChecked,
        isActiveRow,
        handleSelectAllChange,
        toggleRowSelection,
        unselectAll,
        setActiveRow
    };
};
