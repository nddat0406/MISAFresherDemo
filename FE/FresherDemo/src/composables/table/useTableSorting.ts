import { ref } from 'vue';

export type SortDirection = 'asc' | 'desc';

export interface SortStateItem {
    field: string;
    direction: SortDirection;
}

export const useTableSorting = () => {
    const sortState = ref<SortStateItem[]>([]);

    /**
     * Sắp xếp đa cột theo thứ tự ưu tiên. Direction null sẽ xóa sort của cột
     * Create by: DatND (15/1/2026)
     */
    const setSort = (field: string, direction: SortDirection | null) => {
        const next = sortState.value.filter(item => item.field !== field);
        if (direction) {
            next.push({ field, direction });
        }
        sortState.value = next;
    };

    const clearSort = () => {
        sortState.value = [];
    };

    return { sortState, setSort, clearSort };
};
