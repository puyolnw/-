import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  UpdateProfileRequest, 
  ChangePasswordRequest,
  AuthResponse,
  ApiResponse 
} from '../types/user';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor เพื่อเพิ่ม token ใน header
    this.api.interceptors.request.use(
      (config) => {
        let token = localStorage.getItem('token');
        console.log('🔵 Frontend - API Request token:', token);
        
        // ถ้าไม่มี token หรือ token ไม่ถูกต้อง ให้ส่ง error
        if (!token || token === 'null' || token === 'undefined') {
          console.log('🔵 Frontend - No valid token found');
          throw new Error('No authentication token found');
        }
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor เพื่อจัดการ error
    this.api.interceptors.response.use(
      (response) => {
        console.log('🔵 Base API - Response received:', response.status, response.data);
        return response;
      },
      (error) => {
        console.error('🔴 Base API - Error response:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method
        });

        if (error.response?.status === 401) {
          // Token หมดอายุหรือไม่ถูกต้อง
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // ไม่ redirect ถ้าอยู่หน้า login แล้ว
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        } else if (error.response?.status === 400) {
          // Bad Request - แสดง error message ที่ชัดเจน
          const errorMessage = error.response?.data?.message || 'ข้อมูลที่ส่งไม่ถูกต้อง';
          console.error('🔴 Bad Request Error:', errorMessage);
        } else if (error.response?.status === 500) {
          // Internal Server Error
          console.error('🔴 Server Error:', error.response?.data?.message || 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์');
        } else if (!error.response) {
          // Network error
          console.error('🔴 Network Error:', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints (ไม่ต้องใช้ token)
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    // สร้าง axios instance แยกที่ไม่ใช้ interceptor
    const authApi = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const response: AxiosResponse<AuthResponse> = await authApi.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    // สร้าง axios instance แยกที่ไม่ใช้ interceptor
    const authApi = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const response: AxiosResponse<AuthResponse> = await authApi.post('/auth/register', userData);
    return response.data;
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = await this.api.get('/auth/profile');
    return response.data;
  }

  async logout(): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.post('/auth/logout');
    return response.data;
  }

  // User management endpoints
  async updateProfile(userData: UpdateProfileRequest | FormData): Promise<ApiResponse<{ user: User }>> {
    const config = userData instanceof FormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } : {};
    
    const response: AxiosResponse<ApiResponse<{ user: User }>> = await this.api.put('/users/profile', userData, config);
    return response.data;
  }

  async changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.put('/users/password', passwordData);
    return response.data;
  }

  // Admin endpoints
  async getUsersByRole(role: string): Promise<ApiResponse<{ users: User[], count: number }>> {
    const response: AxiosResponse<ApiResponse<{ users: User[], count: number }>> = await this.api.get(`/users/role/${role}`);
    return response.data;
  }

  async getUserById(id: number): Promise<ApiResponse<{ user: User }>> {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = await this.api.get(`/users/${id}`);
    return response.data;
  }

  async deleteUser(id: number): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.delete(`/users/${id}`);
    return response.data;
  }

  // Generic HTTP methods with better error handling
  async get(url: string, config?: any): Promise<any> {
    try {
      const response = await this.api.get(url, config);
      return response.data;
    } catch (error: any) {
      console.error(`🔴 GET ${url} failed:`, error.response?.data || error.message);
      throw error;
    }
  }

  async post(url: string, data?: any, config?: any): Promise<any> {
    try {
      const response = await this.api.post(url, data, config);
      return response.data;
    } catch (error: any) {
      console.error(`🔴 POST ${url} failed:`, error.response?.data || error.message);
      throw error;
    }
  }

  async put(url: string, data?: any, config?: any): Promise<any> {
    try {
      const response = await this.api.put(url, data, config);
      return response.data;
    } catch (error: any) {
      console.error(`🔴 PUT ${url} failed:`, error.response?.data || error.message);
      throw error;
    }
  }

  async delete(url: string, config?: any): Promise<any> {
    try {
      const response = await this.api.delete(url, config);
      return response.data;
    } catch (error: any) {
      console.error(`🔴 DELETE ${url} failed:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
