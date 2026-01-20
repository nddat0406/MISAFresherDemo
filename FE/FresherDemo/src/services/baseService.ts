/**
 * Base Service Module
 * Cung cấp các phương thức service cơ bản có thể tái sử dụng cho tất cả entities
 * BUSINESS LOGIC LAYER - Uses API layer for HTTP communication
 * Hỗ trợ chuyển đổi query params, tương tác với Pinia store
 * Created by: DatND (18/1/2026)
 */

import type { FilterState } from '@/composables/table/useTableFiltering';
import type { SortStateItem } from '@/composables/table/useTableSorting';

/**
 * DTO cho yêu cầu phân trang và lọc dữ liệu
 */
export interface QueryDTO {
  pageIndex: number;
  pageSize: number;
  columns: string;
  columnsSummary?: string | null;
  filter?: string | null;
  quickSearch?: any | null;
  sort?: string | null;
  customParam?: Record<string, any> | null;
  customFilter?: string | null;
  useSp: boolean;
}

/**
 * Kết quả phân trang trả về từ API
 */
export interface PagedResult<T> {
  pageData: T[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPage: number;
}

/**
 * Tham số query từ frontend
 */
export interface QueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: Record<string, FilterState>;
  sorts?: SortStateItem[];
  customParams?: Record<string, any>;
}

/**
 * Chuyển đổi FilterState từ frontend sang định dạng backend filter string
 * Định dạng: [["field","operator",value],"and",["field2","operator2",value2]]
 * Hỗ trợ backendField mapping và valueTransformer từ column definition
 * Created by: DatND (18/1/2026)
 */
export function transformFiltersToBackend(
  filters: Record<string, FilterState>,
  columns?: any[]
): string | null {
  const filterEntries = Object.entries(filters);
  if (filterEntries.length === 0) return null;

  const conditions: any[] = [];

  filterEntries.forEach(([field, filterState], index) => {
    const { operator, value, type } = filterState;

    // Ánh xạ operator từ frontend sang backend
    let backendOperator = '';
    switch (operator) {
      case 'contains':
        backendOperator = 'contains';
        break;
      case 'notContains':
        backendOperator = 'notcontains';
        break;
      case 'equals':
        backendOperator = '=';
        break;
      case 'notequal':
      case 'different':
        backendOperator = '<>';
        break;
      case 'startsWith':
        backendOperator = 'startswith';
        break;
      case 'endsWith':
        backendOperator = 'endswith';
        break;
      case 'greater':
        backendOperator = '>';
        break;
      case 'less':
        backendOperator = '<';
        break;
      case 'greaterOrEqual':
        backendOperator = '>=';
        break;
      case 'lessOrEqual':
        backendOperator = '<=';
        break;
      case 'isNull':
        backendOperator = 'isnull';
        break;
      case 'notNull':
        backendOperator = 'notnull';
        break;
      case 'selected':
        backendOperator = '=';
        break;
      default:
        backendOperator = 'contains';
    }

    // Tìm column definition để lấy backendField và valueTransformer
    const column = columns?.find(col => col.field === field);
    
    // Chuyển đổi giá trị dựa trên type
    let transformedValue: any = value;
    
    // Null operators don't need a value
    if (operator === 'isNull' || operator === 'notNull') {
      transformedValue = null;
    } else if (type === 'number') {
      transformedValue = parseFloat(value) || 0;
    } else if (type === 'date' || type === 'time') {
      // Giữ nguyên string cho date/time
      transformedValue = value;
    }
    
    // Áp dụng valueTransformer nếu có
    if (column?.valueTransformer) {
      transformedValue = column.valueTransformer(transformedValue);
    }

    // Chuyển đổi field name: Ưu tiên backendField, sau đó camelCase sang PascalCase
    const pascalField = column?.backendField || (field.charAt(0).toUpperCase() + field.slice(1));

    // Thêm condition
    if (index > 0) {
      conditions.push('and');
    }
    conditions.push([pascalField, backendOperator, transformedValue]);
  });

  return JSON.stringify(conditions);
}

/**
 * Chuyển đổi SortStateItem[] từ frontend sang định dạng backend sort string
 * Định dạng: [{"Selector":"FieldName","Desc":true/false}]
 * Created by: DatND (18/1/2026)
 */
export function transformSortsToBackend(sorts: SortStateItem[]): string | null {
  if (sorts.length === 0) return null;

  const backendSorts = sorts.map((sort) => {
    // Chuyển đổi field name từ camelCase sang PascalCase
    const pascalField = sort.field.charAt(0).toUpperCase() + sort.field.slice(1);

    return {
      Selector: pascalField,
      Desc: sort.direction === 'desc',
    };
  });

  return JSON.stringify(backendSorts);
}

/**
 * Xây dựng custom filter từ search query
 * Search áp dụng contains cho tất cả các cột string (không phải time)
 * Định dạng: [["Field1","contains","searchValue"],"or",["Field2","contains","searchValue"]]
 * Created by: DatND (18/1/2026)
 */
export function buildSearchCustomFilter(
  searchValue: string,
  stringColumns: string[]
): string | null {
  if (!searchValue || stringColumns.length === 0) return null;

  const conditions: any[] = [];

  stringColumns.forEach((field, index) => {
    // Chuyển đổi field name từ camelCase sang PascalCase
    const pascalField = field.charAt(0).toUpperCase() + field.slice(1);

    if (index > 0) {
      conditions.push('or');
    }
    conditions.push([pascalField, 'contains', searchValue]);
  });

  return JSON.stringify(conditions);
}

/**
 * Tạo QueryDTO từ QueryParams của frontend
 * Chuyển đổi tất cả params sang định dạng backend yêu cầu
 * Search được chuyển thành customFilter với contains cho tất cả string columns
 * Created by: DatND (18/1/2026)
 */
export function buildQueryDTO(
  params: QueryParams,
  columns: string[],
  stringColumns?: string[],
  columnDefinitions?: any[]
): QueryDTO {
  const {
    page = 1,
    pageSize = 30,
    search,
    filters = {},
    sorts = [],
    customParams = {},
  } = params;

  // Build custom filter from search if stringColumns provided
  const customFilter = stringColumns && search 
    ? buildSearchCustomFilter(search, stringColumns)
    : null;

  return {
    pageIndex: page,
    pageSize: pageSize,
    columns: columns.join(','),
    columnsSummary: null,
    filter: transformFiltersToBackend(filters, columnDefinitions),
    quickSearch: null, // Search is handled via customFilter instead
    sort: transformSortsToBackend(sorts),
    customParam: Object.keys(customParams).length > 0 ? customParams : null,
    customFilter: customFilter,
    useSp: false,
  };
}

/**
 * Base Service class - BUSINESS LOGIC LAYER
 * Uses API classes for HTTP communication
 * Handles data transformation and store interactions
 * All services must extend this class
 * Created by: DatND (18/1/2026)
 */
export abstract class BaseService<TApi = any> {
  protected api: TApi;
  protected storeActions: any = null;

  constructor(api: TApi, storeActions?: any) {
    this.api = api;
    this.storeActions = storeActions || null;
  }

  /**
   * Đăng ký Pinia store actions vào service
   * Cho phép service gọi các actions của store
   * Created by: DatND (18/1/2026)
   */
  setStoreActions(storeActions: any) {
    this.storeActions = storeActions;
  }
}
