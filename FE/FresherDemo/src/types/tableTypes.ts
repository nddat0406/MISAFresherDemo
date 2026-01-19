import type { VNode } from 'vue';
import type { FilterState, FilterOperator } from '../composables/table/useTableFiltering';

export interface TableColumn {
    field: string;
    header: string;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
    formatter?: (value: any, row?: any) => string;
    filterType?: 'text' | 'number' | 'time'| 'date';
    pinnable?: boolean;
    cellRender?: (ctx: { value: any; item: any; column: TableColumn; rowIndex: number }) => VNode;
    headerRender?: (ctx: { column: TableColumn }) => VNode;
}

export interface BatchAction {
    label: string;
    icon: string;
    variant: 'success' | 'danger' | 'neutral';
    action: (selectedItems: any[]) => void;
    shortkey?: string;
}

export type SortDirection = 'asc' | 'desc';
export type FilterStateMap = Record<string, FilterState>;
export type FilterOperatorType = FilterOperator;
