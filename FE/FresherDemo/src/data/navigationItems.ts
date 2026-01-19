import type { NavItem } from '../types/navigation';

/**
 * Hierarchical Navigation Structure
 * Converted from menuItems.ts with auto-path generation
 * Created By: DatND (13/1/2026)
 */
export const navigationItems: NavItem[] = [
  {
    id: 'overview',
    type: 'link',
    iconClass: 'icon-dashboard',
    label: 'Tổng quan',
    segment: 'overview',
  },
  {
    id: 'order',
    type: 'link',
    iconClass: 'icon-order',
    label: 'Đơn đặt hàng',
    segment: 'order',
  },
  {
    id: 'production-plan',
    type: 'group',
    iconClass: 'icon-plan',
    label: 'Kế hoạch sản xuất',
    segment: 'production-plan',
    
    children: [
      { id: 'overall-production-plan', type: 'link', iconClass: '', label: 'Kế hoạch tổng thể', segment: 'overall' },
      { id: 'detailed-production-plan', type: 'link', iconClass: '', label: 'Kế hoạch chi tiết', segment: 'detailed' },
      { id: 'material-plan', type: 'link', iconClass: '', label: 'Kế hoạch nguyên vật liệu', segment: 'material-plan' },
      { id: 'material-request', type: 'link', iconClass: '', label: 'Yêu cầu nguyên vật liệu', segment: 'material-request' }
    ]
  },
  {
    id: 'coordinate',
    type: 'group',
    iconClass: 'icon-coordinate',
    label: 'Điều phối và thực thi',
    segment: 'coordinate',
    
    children: [
      { id: 'production-order', type: 'link', iconClass: '', label: 'Lệnh sản xuất', segment: 'production-order' },
      { id: 'production-schedule', type: 'link', iconClass: '', label: 'Lịch sản xuất', segment: 'production-schedule' },
      { id: 'material-request-coordinate', type: 'link', iconClass: '', label: 'Yêu cầu xuất vật tư', segment: 'material-request' },
      { id: 'production-stats', type: 'link', iconClass: '', label: 'Thống kê sản xuất', segment: 'production-stats' },
      { id: 'product-receipt', type: 'link', iconClass: '', label: 'Yêu cầu nhập thành phẩm', segment: 'product-receipt' },
      { id: 'production-delivery-status', type: 'link', iconClass: '', label: 'Tình hình bàn giao sản xuất', segment: 'delivery-status' }
    ]
  },
  {
    id: 'quality-control',
    type: 'group',
    iconClass: 'icon-quality-control',
    label: 'Kiểm tra chất lượng',
    segment: 'quality-control',
    
    children: [
      { id: 'quality-check-request', type: 'link', iconClass: '', label: 'Yêu cầu kiểm tra', segment: 'request' },
      { id: 'quality-check-certification', type: 'link', iconClass: '', label: 'Phiếu kiểm tra', segment: 'certification' },
      {
        id: 'criteria',
        type: 'group',
        iconClass: '',
        label: 'Tiêu chí',
        segment: 'criteria',
        
        children: [
          { id: 'criteria-category', type: 'link', iconClass: '', label: 'Tiêu chí chất lượng', segment: 'category' },
          { id: 'criteria-group', type: 'link', iconClass: '', label: 'Nhóm tiêu chí chất lượng', segment: 'group' },
          { id: 'sampling-method', type: 'link', iconClass: '', label: 'Phương pháp chọn mẫu', segment: 'sampling-method' },
          { id: 'quality-standard-set', type: 'link', iconClass: '', label: 'Bộ tiêu chuẩn kiểm tra chất lượng', segment: 'standard-set' },
          { id: 'quality-defect', type: 'link', iconClass: '', label: 'Lỗi kiểm tra chất lượng', segment: 'defect' },
          { id: 'quality-defect-group', type: 'link', iconClass: '', label: 'Nhóm lỗi kiểm tra chất lượng', segment: 'defect-group' }
        ]
      }
    ]
  },
  {
    id: 'material-factory',
    type: 'group',
    iconClass: 'icon-material-factory',
    label: 'Kho vật tư',
    segment: 'warehouse',
    
    children: [
      { id: 'material-request-warehouse', type: 'link', iconClass: '', label: 'Đề nghị kho cấp vật tư', segment: 'material-request' },
      { id: 'warehouse-receipt', type: 'link', iconClass: '', label: 'Nhập kho', segment: 'receipt' },
      { id: 'warehouse-issue', type: 'link', iconClass: '', label: 'Xuất kho', segment: 'issue' },
      { id: 'warehouse-transfer', type: 'link', iconClass: '', label: 'Điều chuyển', segment: 'transfer' },
      { id: 'beginning-inventory', type: 'link', iconClass: '', label: 'Tồn kho đầu kỳ', segment: 'beginning-inventory' }
    ]
  },
  {
    id: 'work-order',
    type: 'group',
    iconClass: 'icon-work-order',
    label: 'Giao việc',
    segment: 'work-order',
    
    children: [
      { id: 'work-assignment', type: 'link', iconClass: '', label: 'Phiếu giao việc công đoạn', segment: 'assignment' },
      { id: 'work-report', type: 'link', iconClass: '', label: 'Tình hình giao việc', segment: 'report' }
    ]
  },
  { id: 'divider-1', type: 'divider' },
  {
    id: 'report',
    type: 'link',
    iconClass: 'icon-production-report',
    label: 'Báo cáo',
    segment: 'report',
  },
  { id: 'divider-2', type: 'divider' },
  {
    id: 'product-material',
    type: 'group',
    iconClass: 'icon-product-material',
    label: 'Sản phẩm, NVL',
    segment: 'product-material',
    
    children: [
      { id: 'inventory-goods', type: 'link', iconClass: '', label: 'Vật tư hàng hóa', segment: 'goods' },
      { id: 'inventory-group', type: 'link', iconClass: '', label: 'Nhóm vật tư hàng hóa', segment: 'group' },
      { id: 'inventory-specification', type: 'link', iconClass: '', label: 'Định mức nguyên vật liệu', segment: 'specification' },
      { id: 'inventory-substitute', type: 'link', iconClass: '', label: 'Nguyên vật liệu thay thế', segment: 'substitute' }
    ]
  },
  {
    id: 'process',
    type: 'group',
    iconClass: 'icon-process',
    label: 'Quy trình sản xuất',
    segment: 'process',
    
    children: [
      { id: 'stage', type: 'link', iconClass: '', label: 'Công đoạn', segment: 'stage' },
      { id: 'production-process', type: 'link', iconClass: '', label: 'Quy trình sản xuất', segment: 'production-process' }
    ]
  },
  {
    id: 'production-capacity',
    type: 'group',
    iconClass: 'icon-production-capacity',
    label: 'Năng lực sản xuất',
    segment: 'production-capacity',
    
    children: [
      { id: 'production-capacity-output', type: 'link', iconClass: '', label: 'Tổ sản xuất', segment: 'output' },
      { id: 'production-capacity-machine', type: 'link', iconClass: '', label: 'Máy móc', segment: 'machine' },
      { id: 'production-capacity-workforce', type: 'link', iconClass: '', label: 'Nhóm năng lực', segment: 'workforce' },
      { id: 'production-capacity-quota', type: 'link', iconClass: '', label: 'Khuôn', segment: 'quota' }
    ]
  },
  {
    id: 'other-category',
    type: 'popover',
    iconClass: 'icon-production-category',
    label: 'Danh mục khác',
    segment: 'other-category',
    popoverItems: [
      {
        title: 'Đối tượng',
        items: [
          { id: 'supplier', label: 'Khách hàng', path: '/other-category/supplier' },
          { id: 'employee', label: 'Nhân viên', path: '/other-category/employee' },
          { id: 'cost-object', label: 'Đối tượng tập hợp chi phí', path: '/other-category/cost-object' }
        ]
      },
      {
        title: 'Lịch làm việc',
        items: [
          { id: 'work-shift', label: 'Ca làm việc', path: '/production/dictionary/shift' },
          { id: 'holiday', label: 'Ngày nghỉ', path: '/other-category/holiday' },
          { id: 'work-schedule', label: 'Lịch làm việc', path: '/other-category/work-schedule' }
        ]
      },
      {
        title: 'Khác',
        items: [
          { id: 'structure', label: 'Cơ cấu tổ chức', path: '/other-category/structure' },
          { id: 'warehouse', label: 'Kho', path: '/other-category/warehouse' },
          { id: 'unit', label: 'Đơn vị tính', path: '/other-category/unit' },
          { id: 'work-stop-reason', label: 'Lý do dừng công việc', path: '/other-category/work-stop-reason' }
        ]
      }
    ]
  },
  {
    id: 'settings',
    type: 'popover',
    iconClass: 'icon-production-system',
    label: 'Thiết lập',
    segment: 'settings',
    popoverItems: [
      {
        title: 'Thiết lập',
        items: [
          { id: 'company-info', label: 'Thông tin công ty', path: '/settings/company-info' },
          { id: 'users-roles', label: 'Người dùng, vai trò', path: '/settings/users-roles' },
          { id: 'preferences', label: 'Tùy chọn', path: '/settings/preferences' }
        ]
      },
      {
        title: 'Tiện ích',
        items: [
          { id: 'app-integration', label: 'Kết nối ứng dụng', path: '/settings/app-integration' },
          { id: 'journal-log', label: 'Nhật ký truy cập', path: '/settings/journal-log' }
        ]
      }
    ]
  }
];

