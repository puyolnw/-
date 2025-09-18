export type UserRole = 'student' | 'teacher' | 'supervisor' | 'admin';

export interface User {
  id: number;
  user_id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone?: string;
  email: string;
  address?: string;
  username: string;
  school_id?: string;
  student_code?: string;  // รหัสนักศึกษา
  faculty?: string;       // คณะ
  major?: string;         // สาขา
  profile_image?: string; // ชื่อไฟล์รูปโปรไฟล์
  created_at?: string;    // ทำให้เป็น optional เพราะอาจไม่มีข้อมูล
  updated_at?: string;    // ทำให้เป็น optional เพราะอาจไม่มีข้อมูล
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  role: UserRole;
  first_name: string;
  last_name: string;
  phone?: string;
  email: string;
  address?: string;
  username: string;
  password: string;
  school_id?: string;
  student_code?: string;  // รหัสนักศึกษา
  faculty?: string;       // คณะ
  major?: string;         // สาขา
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  school_id?: string;
  student_code?: string;  // รหัสนักศึกษา
  faculty?: string;       // คณะ
  major?: string;         // สาขา
  profile_image?: string; // ชื่อไฟล์รูปโปรไฟล์
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
  };
  errors?: any[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}
