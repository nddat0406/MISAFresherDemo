/**
 * Base API Module
 * Cung cấp các phương thức HTTP cơ bản để giao tiếp với backend
 * Xử lý ApiResponse wrapper và error handling
 * NO BUSINESS LOGIC - Pure HTTP communication only
 * Created by: DatND (18/1/2026)
 */

import type { ApiResponse } from '@/types/aipResponse';

/**
 * Base API class cung cấp các phương thức HTTP thuần túy
 * Không chứa business logic, chỉ xử lý HTTP requests
 * All APIs must extend this class
 * Created by: DatND (18/1/2026)
 */
export abstract class BaseApi {
  protected baseUrl: string;

  constructor(endpoint: string = '') {
    // Get base URL from environment variable
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7232/api';
    this.baseUrl = `${apiBaseUrl}${endpoint}`;
  }

  /**
   * Thực hiện POST request
   * Tự động parse ApiResponse và trả về data
   * Created by: DatND (18/1/2026)
   */
  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<T> = await response.json();
      return result;
    } catch (error) {
      console.error('API POST Error:', error);
      throw error;
    }
  }

  /**
   * Thực hiện GET request
   * Tự động parse ApiResponse và trả về data
   * Created by: DatND (18/1/2026)
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<T> = await response.json();
      return result;
    } catch (error) {
      console.error('API GET Error:', error);
      throw error;
    }
  }

  /**
   * Thực hiện PUT request
   * Tự động parse ApiResponse và trả về data
   * Created by: DatND (18/1/2026)
   */
  async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<T> = await response.json();
      return result;
    } catch (error) {
      console.error('API PUT Error:', error);
      throw error;
    }
  }

  /**
   * Thực hiện DELETE request với body chứa danh sách models
   * Tự động parse ApiResponse và trả về data
   * Created by: DatND (18/1/2026)
   */
  async delete<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<T> = await response.json();
      return result;
    } catch (error) {
      console.error('API DELETE Error:', error);
      throw error;
    }
  }

  /**
   * Thực hiện PATCH request
   * Tự động parse ApiResponse và trả về data
   * Created by: DatND (18/1/2026)
   */
  async patch<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<T> = await response.json();
      return result;
    } catch (error) {
      console.error('API PATCH Error:', error);
      throw error;
    }
  }
}
