<script setup lang="ts" generic="T">
import { computed, onMounted, onBeforeUnmount, ref, watch, useSlots } from 'vue';
import Checkbox from './MISACheckbox.vue';
import MISACombobox from './MISACombobox.vue';
import { useTableSelection } from '../../composables/table/useTableSelection';
import { useTableColumnSizing } from '../../composables/table/useTableColumnSizing';
import { useTableFiltering } from '@/composables/table/useTableFiltering';
import type { BatchAction, TableColumn } from '../../types/tableTypes';
import TablePagination from './table/parts/TablePagination.vue';
import type { SortStateItem } from '@/composables/table/useTableSorting';
import type { FilterState } from '@/composables/table/useTableFiltering';
import NoDataState from './table/parts/NoDataState.vue';
import { DatePicker } from 'primevue';

interface Props {
    data: T[];
    columns: TableColumn[];
    loading?: boolean;
    searchPlaceholder?: string;
    showAddButton?: boolean;
    addButtonText?: string;
    batchActions?: BatchAction[];
    rowsPerPageOptions?: number[];
    defaultRowsPerPage?: number;
    selectionMode?: 'single' | 'multiple';
    activeRowKey?: string | number | null;
    rowKey?: string;
    total?: number;
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    searchPlaceholder: 'Tìm kiếm',
    showAddButton: true,
    addButtonText: 'Thêm',
    rowsPerPageOptions: () => [10, 20, 30, 50, 100],
    defaultRowsPerPage: 20,
    selectionMode: 'multiple',
    rowKey: 'id',
    total: 0
});

const emit = defineEmits<{
    add: [];
    edit: [item: T, rowIndex: number];
    refresh: [];
    'selection-change': [items: T[]];
    'data-change': [params: {
        search?: string;
        filters?: Record<string, FilterState>;
        sorts?: SortStateItem[];
        page?: number;
        pageSize?: number;
    }];
}>();

const slots = useSlots();
const searchQuery = ref('');
const pageSize = ref(props.defaultRowsPerPage ?? 20);
const currentPage = ref(1);
const sortState = ref<SortStateItem[]>([]);
const pinnedColumns = ref<string[]>([]);

// Use filtering composable
const {
    filters,
    applyFilter,
    clearFilter,
    clearAllFilters,
    hasActiveFilters,
    isFilterActive,
    getFilterState: getFilterStateFromComposable,
    updateFilterState
} = useTableFiltering();

/**
 * Lấy khóa duy nhất của dòng để thao tác chọn. Trả về giá trị của rowKey hoặc JSON.stringify nếu không có
 * Create by: DatND (15/1/2026)
 */
const getRowKey = (item: any): string | number => {
    const key = item?.[props.rowKey];
    return key ?? JSON.stringify(item);
};

/**
 * Emit sự kiện khi có thay đổi về selection, truyền danh sách items được chọn lên parent
 * Create by: DatND (15/1/2026)
 */
const emitSelectionChange = (items: T[]) => emit('selection-change', items);

/**
 * Emit sự kiện thay đổi dữ liệu để parent fetch API với params search, filters, sorts, page, pageSize
 * Create by: DatND (15/1/2026)
 */
const emitDataChange = () => {
    emit('data-change', {
        search: searchQuery.value || undefined,
        filters: hasActiveFilters.value ? filters.value : undefined,
        sorts: sortState.value.length > 0 ? sortState.value : undefined,
        page: currentPage.value,
        pageSize: pageSize.value
    });
};

const { columnWidths, initWidths, getColumnWidth, startResize, stopResize } = useTableColumnSizing({
    getInitialWidth: (field) => {
        const column = props.columns.find(col => col.field === field);
        const width = column?.width ? parseInt(column.width, 10) : 160;
        return Number.isNaN(width) ? 160 : width;
    }
});

const { selectedKeys, activeRowKey, selectedItems, isRowChecked, isActiveRow, handleSelectAllChange, toggleRowSelection, unselectAll, setActiveRow } = useTableSelection({
    data: () => props.data,
    selectionMode: () => props.selectionMode,
    getRowKey,
    emitSelectionChange
});


/**
 * Tính toán cột theo thứ tự, đưa các pinned columns lên đầu. Trả về mảng columns đã sắp xếp
 * Create by: DatND (15/1/2026)
 */
const orderedColumns = computed(() => {
    const pinned = props.columns.filter(col => pinnedColumns.value.includes(col.field));
    const rest = props.columns.filter(col => !pinnedColumns.value.includes(col.field));
    return [...pinned, ...rest];
});

/**
 * Tính offset left cho các sticky columns, bắt đầu từ 40px (checkbox width). Trả về Record<field, offset>
 * Create by: DatND (15/1/2026)
 */
const stickyOffsets = computed(() => {
    const offsets: Record<string, number> = {};
    let left = 40; // checkbox column width
    orderedColumns.value.forEach(col => {
        if (pinnedColumns.value.includes(col.field)) {
            offsets[col.field] = left;
            left += getColumnWidth(col.field);
        }
    });
    return offsets;
});

const selectAllModel = computed({
    get: () => props.data.length > 0 && props.data.every(item => selectedKeys.value.has(getRowKey(item))),
    set: (value: boolean) => handleSelectAllChange(props.data, value)
});

/**
 * Tính toán style cho mỗi cột bao gồm width, alignment, sticky position, z-index. Trả về Record<field, styleObject>
 * Create by: DatND (15/1/2026)
 */
const columnStyles = computed(() => {
    const map: Record<string, Record<string, string | number | undefined>> = {};
    orderedColumns.value.forEach(column => {
        const width = getColumnWidth(column.field);
        const isPinned = pinnedColumns.value.includes(column.field);
        const left = stickyOffsets.value[column.field];
        map[column.field] = {
            width: `${width}px`,
            minWidth: `${width}px`,
            maxWidth: `${width}px`,
            textAlign: column.align || 'left',
            position: isPinned ? 'sticky' : undefined,
            left: isPinned ? `${left}px` : undefined,
            zIndex: isPinned ? 3 : undefined,
        };
    });
    return map;
});
/**
 * Check trạng thái cột có được ghim hay không. Trả về true nếu column.field có trong pinnedColumns
 * Create by: DatND (15/1/2026)
 */
const isPinned = (column: TableColumn) => pinnedColumns.value.includes(column.field);


const pageInfo = computed(() => {
    const total = props.total || props.data.length;
    if (!total) return '0 - 0';
    const start = (currentPage.value - 1) * pageSize.value + 1;
    const end = Math.min(currentPage.value * pageSize.value, total);
    return `${start} - ${end}`;
});

const totalCount = computed(() => props.total || props.data.length);


/**
 * Xử lý batch action cho các dòng được chọn. Gọi action.action với selectedItems nếu có dòng được chọn
 * Create by: DatND (15/1/2026)
 */
const handleBatchAction = (action: BatchAction) => {
    if (selectedItems.value.length) {
        action.action(selectedItems.value);
    }
};

/**
 * Xử lý click vào dòng, set active row và toggle selection nếu mode là single. Emit edit event
 * Create by: DatND (15/1/2026)
 */
const handleRowClick = (item: T, rowIndex: number) => {
    setActiveRow(item);
    if (props.selectionMode === 'single') {
        toggleRowSelection(item, true);
    }
};

/**
 * Xử lý chỉnh sửa item, emit edit event với item và rowIndex
 * Create by: DatND (15/1/2026)
 */
const handleEdit = (item: T, rowIndex: number) => {
    emit('edit', item, rowIndex);
};

/**
 * Xử lý thay đổi sắp xếp, cập nhật sortState và emit data-change. Direction null sẽ xóa sort
 * Create by: DatND (15/1/2026)
 */
const handleSort = (field: string, direction: 'asc' | 'desc' | null) => {
    if (direction === null) {
        sortState.value = sortState.value.filter(s => s.field !== field);
    } else {
        const existingIndex = sortState.value.findIndex(s => s.field === field);
        if (existingIndex >= 0 && sortState.value[existingIndex]) {
            sortState.value[existingIndex]!.direction = direction;
        } else {
            sortState.value.push({ field, direction });
        }
    }
    emitDataChange();
};

/**
 * Xử lý áp dụng filter, reset về page 1 và emit data-change
 * Create by: DatND (18/1/2026)
 */
const handleApplyFilter = (field: string, state: FilterState) => {
    applyFilter(field, state);
    currentPage.value = 1;
    emitDataChange();
};

/**
 * Xử lý xóa filter, reset về page 1 và emit data-change
 * Create by: DatND (18/1/2026)
 */
const handleClearFilter = (field: string) => {
    clearFilter(field);
    currentPage.value = 1;
    emitDataChange();
};

/**
 * Xử lý xóa tất cả filters, reset về page 1 và emit data-change
 * Create by: DatND (18/1/2026)
 */
const handleClearAllFilters = () => {
    clearAllFilters();
    currentPage.value = 1;
    emitDataChange();
};

/**
 * Toggle ghim cột, thêm hoặc xóa field khỏi pinnedColumns
 * Create by: DatND (15/1/2026)
 */
const togglePin = (field: string) => {
    const pinned = new Set(pinnedColumns.value);
    if (pinned.has(field)) {
        pinned.delete(field);
    } else {
        pinned.add(field);
    }
    pinnedColumns.value = Array.from(pinned);
};

/**
 * Lấy trạng thái filter cho một cột với type từ column definition
 * Create by: DatND (18/1/2026)
 */
const getFilterState = (column: TableColumn): FilterState => {
    return getFilterStateFromComposable(column.field, column.filterType);
};

/**
 * Lấy hướng sắp xếp của một cột. Trả về 'asc', 'desc' hoặc null
 * Create by: DatND (15/1/2026)
 */
const getSortDirection = (field: string) => sortState.value.find(item => item.field === field)?.direction ?? null;

/**
 * Lấy options cho filter operator theo filterType
 * Create by: DatND (18/1/2026)
 */
const getFilterOperatorOptions = (column: TableColumn) => {
    if (column.filterType === 'number' || column.filterType === 'date') {
        return [
            { label: '(Trống)', value: 'isNull' },
            { label: '(Không trống)', value: 'notNull' },
            { label: 'Bằng', value: 'equals' },
            { label: 'Khác', value: 'different' },
            { label: 'Lớn hơn', value: 'greater' },
            { label: 'Nhỏ hơn', value: 'less' },
            { label: 'Lớn hơn hoặc bằng', value: 'greaterOrEqual' },
            { label: 'Nhỏ hơn hoặc bằng', value: 'lessOrEqual' }
        ];
    }
    return [
        { label: '(Trống)', value: 'isNull' },
        { label: '(Không trống)', value: 'notNull' },
        { label: 'Chứa', value: 'contains' },
        { label: 'Không chứa', value: 'notContains' },
        { label: 'Bằng', value: 'equals' },
        { label: 'Khác', value: 'different' },
        { label: 'Bắt đầu bằng', value: 'startsWith' },
        { label: 'Kết thúc bằng', value: 'endsWith' }
    ];
};

/**
 * Lấy label hiển thị cho filter tag dựa trên operator và value
 * Create by: DatND (18/1/2026)
 */
const getFilterLabel = (field: string, filter: FilterState): string => {
    const column = props.columns.find(col => col.field === field);
    const columnName = column?.header || field;

    const operatorLabels: Record<string, string> = {
        contains: 'Chứa',
        notContains: 'Không chứa',
        equals: 'Bằng',
        notequal: 'Khác',
        different: 'Khác',
        startsWith: 'Bắt đầu bằng',
        endsWith: 'Kết thúc bằng',
        greater: 'Lớn hơn',
        less: 'Nhỏ hơn',
        greaterOrEqual: 'Lớn hơn hoặc bằng',
        lessOrEqual: 'Nhỏ hơn hoặc bằng',
        isNull: 'Trống',
        notNull: 'Không trống'
    };

    const operatorLabel = operatorLabels[filter.operator] || filter.operator;

    // Null operators don't show value
    if (filter.operator === 'isNull' || filter.operator === 'notNull') {
        return `${columnName} (${operatorLabel})`;
    }

    return `${columnName} (${operatorLabel}: ${filter.value})`;
};

/**
 * Xử lý thay đổi trang theo action (first/prev/next/last), cập nhật currentPage và emit data-change
 * Create by: DatND (15/1/2026)
 */
const handlePageChange = (action: 'first' | 'prev' | 'next' | 'last') => {
    const totalPages = Math.ceil(totalCount.value / pageSize.value);

    switch (action) {
        case 'first':
            currentPage.value = 1;
            break;
        case 'prev':
            if (currentPage.value > 1) currentPage.value--;
            break;
        case 'next':
            if (currentPage.value < totalPages) currentPage.value++;
            break;
        case 'last':
            currentPage.value = totalPages;
            break;
    }
    emitDataChange();
};

/**
 * Watch search query với debounce (1 giây), reset về page 1 và emit data-change
 * Create by: DatND (18/1/2026)
 */
let searchDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
    if (searchDebounceTimeout) clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = setTimeout(() => {
        currentPage.value = 1;
        emitDataChange();
    }, 1000);
});

/**
 * Watch page size, reset về page 1 và emit data-change khi thay đổi
 * Create by: DatND (15/1/2026)
 */
watch(pageSize, () => {
    currentPage.value = 1;
    emitDataChange();
});

/**
 * Watch activeRowKey prop để set active row tương ứng khi có thay đổi từ bên ngoài
 */
watch(
  () => props.activeRowKey,
  (key) => {
    if (!key) return;

    const item = props.data.find(
      d => getRowKey(d) === key
    );

    if (item) {
      setActiveRow(item);
    }
  },
  { immediate: true }
);

onMounted(() => {
    initWidths(props.columns.map(col => col.field));
    // Emit initial data change để fetch dữ liệu ban đầu
    emitDataChange();
});

onBeforeUnmount(() => {
    stopResize();
});
</script>

<template>
    <div class="flex flex-col h-full">
        <div class="flex flex-row title-box">
            <slot name="title"></slot>
        </div>

        <div class="body-layout-list">
            <div class="body-list">
                <div class="form-list flex flex-column">
                    <div class="flex flex-column w-full">
                        <!-- Toolbar -->
                        <div class="condition-box flex flex-row items-center w-full">
                            <div class="flex gap-2 items-center">
                                <div class="ms-input ms-editor w-full flex items-center gap-4 search-input-list max-h-4"
                                    style="height: auto;">
                                    <div class="flex-1 flex items-center input-container border pointer ">
                                        <div class="mi icon16 icon left search"></div>
                                        <input v-model="searchQuery" class="ms-input-item flex w-full"
                                            :placeholder="searchPlaceholder" type="text" autocomplete="on">
                                    </div>
                                </div>
                                <div class="filter-conditions h-full"
                                    v-if="hasActiveFilters && selectedItems.length === 0">
                                    <div class="filter-item" v-for="(filter, field) in filters" :key="field">
                                        <div class="lable-value-filter">{{ getFilterLabel(field as string, filter) }}
                                        </div>
                                        <div class="mi icon16 pointer close"
                                            @click="handleClearFilter(field as string)"></div>
                                    </div>
                                    <div class="delete-all-filter" @click="handleClearAllFilters">Bỏ lọc</div>
                                </div>
                                <slot name="toolbar-append" :unselectAll="unselectAll" :selectedItems="selectedItems"
                                    :batchActions="batchActions"></slot>
                            </div>

                            <div class="action flex items-center flex-row" v-if="selectedItems.length === 0">
                                <button class="ms-button btn-outline-neutral only-icon" v-tooltip="'Lấy lại dữ liệu'"
                                    @click="emit('refresh')">
                                    <div class="icon reload mi icon16">&nbsp;</div>
                                </button>
                            </div>


                        </div>
                    </div>
                </div>

                <div class="voucher-body-grid">
                    <div class="ms-grid-viewer flex flex-col has-scroll-x has-scroll-y has-paging flex-box">
                        <div class="ms-content-table sticky-1 scroller">
                            <div class="grid-scroll">
                                <table class="ms-table table-resizable">
                                    <!-- Table Header -->
                                    <thead class="ms-thead">
                                        <tr class="ms-tr">
                                            <th class="ms-th multiple-cell sticky ms-th-col" rowspan="0" scope="col">
                                                <Checkbox v-model="selectAllModel" />
                                            </th>
                                            <th v-for="column in orderedColumns" :key="column.field"
                                                class="ms-col-th ms-th" :class="isPinned(column) ? 'lock' : ''"
                                                :style="columnStyles[column.field]">
                                                <div class="ms-th-content flex-row">
                                                    <VDropdown :triggers="['click']" placement="bottom-start" teleport
                                                        :auto-hide="true" strategy="fixed">
                                                        <template #default="{ toggle }">
                                                            <div class="th-trigger" role="button" tabindex="0">
                                                                <div class="menu-wrapper">
                                                                    <div class="menu-button-container">
                                                                        <div class="ms-th-title flex flex-between">
                                                                            <div class="w-full">
                                                                                <div class="caption_arrow_wrap"
                                                                                    :class="`justify-${column.align === 'center' ? 'center' : column.align === 'right' ? 'end' : 'start'}`"
                                                                                    :style="{ textAlign: column.align || 'left' }">
                                                                                    <div class="mi icon16 pinned"
                                                                                        v-if="isPinned(column)"></div>
                                                                                    <span class="caption-btn flex">
                                                                                        <slot
                                                                                            :name="`header-${column.field}`"
                                                                                            :column="column">
                                                                                            {{ column.header }}
                                                                                        </slot>
                                                                                    </span>
                                                                                    <div class="ms-th-title-icon justify-center"
                                                                                        v-if="getSortDirection(column.field) === 'asc'">
                                                                                        <div class="mi icon16 arrow-up">
                                                                                        </div>
                                                                                    </div>
                                                                                    <div class="ms-th-title-icon justify-center"
                                                                                        v-if="getSortDirection(column.field) === 'desc'">
                                                                                        <div
                                                                                            class="mi icon16 arrow-down">
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </template>
                                                        <template #popper>
                                                            <ul class="menu-wrapper-menu " role="menu">
                                                                <li class="menu-wrapper-item flex menu-wrapper-item-icon"
                                                                    role="menuitem" tabindex="-1"
                                                                    @click="handleSort(column.field, null)">
                                                                    <div class="mi icon16 menu-item-ic empty"></div>
                                                                    <div class="menu-item-content">Không sắp xếp</div>
                                                                </li>
                                                                <li class="menu-wrapper-item flex menu-wrapper-item-icon"
                                                                    :class="getSortDirection(column.field) === 'asc' ? 'checked' : ''"
                                                                    role="menuitem" tabindex="-1"
                                                                    @click="handleSort(column.field, 'asc')">
                                                                    <div class="mi icon16 menu-item-ic arrow-up"></div>
                                                                    <div class="menu-item-content">Tăng dần</div>
                                                                </li>
                                                                <li class="menu-wrapper-item flex menu-wrapper-item-icon"
                                                                    :class="getSortDirection(column.field) === 'desc' ? 'checked' : ''"
                                                                    role="menuitem" tabindex="-1"
                                                                    @click="handleSort(column.field, 'desc')">
                                                                    <div class="mi icon16 menu-item-ic arrow-down">
                                                                    </div>
                                                                    <div class="menu-item-content">Giảm dần</div>
                                                                </li>
                                                                <div class="menu-border"></div>
                                                                <li class="menu-wrapper-item flex menu-wrapper-item-icon"
                                                                    role="menuitem" tabindex="-1"
                                                                    :class="pinnedColumns.includes(column.field) ? 'checked' : ''"
                                                                    @click="togglePin(column.field)">
                                                                    <div class="mi icon16 menu-item-ic pin">
                                                                    </div>
                                                                    <div class="menu-item-content">Ghim cột
                                                                    </div>
                                                                </li>
                                                                <li class="menu-wrapper-item flex menu-wrapper-item-icon"
                                                                    role="menuitem" tabindex="-1"
                                                                    @click="togglePin(column.field)">
                                                                    <div class="mi icon16 menu-item-ic unpin">
                                                                    </div>
                                                                    <div class="menu-item-content">
                                                                        Bỏ ghim cột
                                                                    </div>
                                                                </li>
                                                            </ul>
                                                        </template>
                                                    </VDropdown>

                                                    <div class="ms-th-title-icon justify-center">
                                                        <VDropdown v-if="column.filterType" :triggers="['click']"
                                                            placement="bottom-end" :auto-hide="false" position="fixed">
                                                            <button class="filter-btn" type="button">
                                                                <div class="mi icon16"
                                                                    :class="!isFilterActive(column.field) ? 'filter--default' : 'filter--active'">
                                                                </div>
                                                            </button>
                                                            <template #popper="{ hide }">
                                                                <div
                                                                    class="gap-container flex-col padding-vertial padding-horizontal condition-container text">
                                                                    <div
                                                                        class="flex justify-between items-center relative">
                                                                        <div class="column-filter-text">Lọc {{
                                                                            column.header }}</div>
                                                                        <div class="close-condition-btn">
                                                                            <button
                                                                                class="ms-button btn-text-neutral only-icon"
                                                                                @click="hide">
                                                                                <div class="icon close mi icon16">&nbsp;
                                                                                </div>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <div class="filter-container">
                                                                        <div class="control-gap-item view-fitler-text">
                                                                            <div class="column-filter flex">
                                                                                <div class="filter-operator">
                                                                                    <MISACombobox :placement="'bottom'"
                                                                                        :options="getFilterOperatorOptions(column)"
                                                                                        :model-value="getFilterState(column).operator"
                                                                                        @update:model-value="(op) => updateFilterState(column.field, { operator: op as any })" />
                                                                                </div>
                                                                            </div>
                                                                            <div class="filter-value" v-if="column.filterType==='number' || column.filterType==='text'">
                                                                                <div class="ms-input ms-editor flex items-center gap-4 w-full"
                                                                                    style="height: auto;">
                                                                                    <div
                                                                                        class="flex-1 flex items-center input-container border pointer">
                                                                                        <input
                                                                                            class="ms-input-item flex w-full"
                                                                                            placeholder="Nhập giá trị lọc"
                                                                                            :type="column.filterType"
                                                                                            autocomplete="on"
                                                                                            :value="getFilterState(column).value"
                                                                                            @input="(e: Event) => updateFilterState(column.field, { value: (e.target as HTMLInputElement).value })">
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div class="filter-value" v-if="column.filterType==='date'">
                                                                                <div class="ms-input ms-editor flex items-center gap-4 w-full"
                                                                                    style="height: auto;">
                                                                                    <div
                                                                                        class="flex-1 flex items-center input-container border pointer">
                                                                                         <input
                                                                                            class="ms-input-item flex w-full"
                                                                                            placeholder="Nhập giá trị lọc"
                                                                                            :type="column.filterType"
                                                                                            autocomplete="on"
                                                                                            :value="getFilterState(column).value"
                                                                                            @input="(e: Event) => updateFilterState(column.field, { value: (e.target as HTMLInputElement).value })">


                                                                                            <!-- <DatePicker
                                                                                                :format="'DD/MM/YYYY'"
                                                                                                :placeholder="'__/__/____'"
                                                                                                :clearable="true"
                                                                                                :input-props="{ class: 'ms-input-item flex w-full', placeholder: 'Chọn ngày...' }">
                                                                                            </DatePicker> -->
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div class="buttons flex">
                                                                        <div class="ml-auto flex gap-x-2">
                                                                            <button
                                                                                class="ms-button btn-outline-neutral"
                                                                                classbtncustom="filter-header-btn"
                                                                                @click="hide">
                                                                                <div class="text nowrap">Hủy</div>
                                                                            </button>
                                                                            <button class="ms-button btn-solid-brand"
                                                                                classbtncustom="filter-header-btn"
                                                                                @click="handleApplyFilter(column.field, getFilterState(column)); hide()">
                                                                                <div class="text nowrap">Áp dụng</div>
                                                                            </button>
                                                                        </div>
                                                                        <div>
                                                                            <button class="ms-button btn-filled-neutral"
                                                                                classbtncustom="filter-header-btn"
                                                                                @click="handleClearFilter(column.field); hide()">
                                                                                <div class="text nowrap">Bỏ lọc</div>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </template>
                                                        </VDropdown>
                                                    </div>
                                                </div>
                                                <div class="ms-resize"
                                                    @mousedown.stop="(event) => startResize(column.field, event.clientX)">
                                                </div>
                                            </th>
                                            <th class="ms-th widget-title" rowspan="0" scope="col"
                                                v-if="$slots['action-column']" style="width: 100px; min-width: 100px;">
                                            </th>
                                        </tr>
                                    </thead>

                                    <!-- Table Body -->
                                    <tbody class="ms-tbody data">
                                        <!-- Loading Skeleton -->
                                        <template v-if="loading">
                                            <tr v-for="n in pageSize" :key="`shimmer-${n}`" class="ms-tr">
                                                <td 
                                                    style="width: 40px; min-width: 40px; border-right: 1px dotted rgb(193, 196, 204);">
                                                    <div class="shimmer"></div>
                                                </td>
                                                <td v-for="column in orderedColumns" :key="`shimmer-${column.field}`"
                                                    style="border-right: 1px dotted rgb(193, 196, 204);"
                                                    :style="{ 
                                                        width: getColumnWidth(column.field) + 'px',
                                                        minWidth: getColumnWidth(column.field) + 'px',
                                                        maxWidth: getColumnWidth(column.field) + 'px'
                                                    }">
                                                    <div class="shimmer"></div>
                                                </td>
                                                <td v-if="$slots['action-column']" class=" sticky"
                                                    style="width: 100px; min-width: 100px; max-width: 100px;border-right: 1px dotted rgb(193, 196, 204);">
                                                </td>
                                            </tr>
                                        </template>

                                        <!-- Actual Data -->
                                        <template v-else>
                                            <tr v-for="(item, rowIndex) in data" :key="getRowKey(item)" class="ms-tr"
                                                :class="{ 'row-selected': isActiveRow(item), 'row-checked': isRowChecked(item) }"
                                                @click="handleRowClick(item, rowIndex)">
                                                <td class="ms-td multiple-cell sticky ms-col-td-multiple">
                                                    <Checkbox :model-value="isRowChecked(item)" @click.stop
                                                        @update:model-value="(checked) => toggleRowSelection(item, checked)" />
                                                </td>
                                                <td v-for="column in orderedColumns" :key="column.field"
                                                    @dblclick.stop="emit('edit', item, rowIndex)"
                                                    class="ms-td ms-col-td" :class="isPinned(column) ? 'lock' : ''"
                                                    :style="columnStyles[column.field]">
                                                    <div>
                                                        <slot :name="`cell-${column.field}`"
                                                                :value="(item as any)[column.field]" 
                                                                :item="item" :column="column" 
                                                                :row-index="rowIndex">
                                                        <div class="text-overflow"
                                                            :title="column.formatter ? column.formatter((item as any)[column.field], item) : (item as any)[column.field]">
                                                            <span :class="`text-${column.align || 'left'}`"
                                                                :style="{ textAlign: column.align || 'left' }">
                                                                <span class="text-view">
                                                                    <div>
                                                                        
                                                                            {{ column.formatter ? column.formatter((item as any)[column.field], item) : (item as any)[column.field] }}
                                                                    </div>
                                                                </span>
                                                            </span>
                                                        </div>
                                                                        </slot>

                                                    </div>
                                                </td>
                                                <td class="ms-td widget-item sticky" v-if="$slots['action-column']"
                                                    style="width: 100px; min-width: 100px;max-width: 100px;">
                                                    <slot name="action-column" :item="item" :row-index="rowIndex">
                                                    </slot>
                                                </td>
                                            </tr>
                                        </template>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <slot name="no-data">
                            <NoDataState v-if="data.length === 0 && !loading" />
                        </slot>

                        <!-- Pagination -->
                        <TablePagination :totalCount="totalCount" :pageSize="pageSize" :pageSizes="rowsPerPageOptions"
                            :pageInfo="pageInfo" :hasPrev="currentPage > 1"
                            :hasNext="currentPage * pageSize < totalCount"
                            @update:pageSize="(value) => { pageSize = value; }" @page-change="handlePageChange">
                            <template #pagination-append>
                                <slot name="pagination-append"></slot>
                            </template>
                        </TablePagination>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style src="../../assets/css/table.css"></style>
