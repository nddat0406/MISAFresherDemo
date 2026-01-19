export interface ApiResponse<T> {
  success: boolean;          // xác nhận thành công hay thất bại
  code?: number;             // HTTP status code
  subCode?: number;          // Application-specific sub-code
  data: T | null;            // Response data
  userMessage?: string;      // Message thân thiện với người dùng
  systemMessage?: string;    // Message hệ thống
  getLastData: boolean;      // Xác nhận đây có phải là trang dữ liệu cuối cùng không
  serverTime: string;        // Thời gian máy chủ theo định dạng ISO 8601
}