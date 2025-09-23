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
  // ข้อมูลบุคคลอ้างอิง
  advisor_name?: string;     // ชื่ออาจารย์ที่ปรึกษา
  advisor_phone?: string;    // เบอร์โทรอาจารย์ที่ปรึกษา
  father_name?: string;      // ชื่อบิดา
  father_occupation?: string; // อาชีพบิดา
  father_phone?: string;     // เบอร์โทรบิดา
  mother_name?: string;      // ชื่อมารดา
  mother_occupation?: string; // อาชีพมารดา
  mother_phone?: string;     // เบอร์โทรมารดา
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
  // ข้อมูลบุคคลอ้างอิง
  advisor_name?: string;     // ชื่ออาจารย์ที่ปรึกษา
  advisor_phone?: string;    // เบอร์โทรอาจารย์ที่ปรึกษา
  father_name?: string;      // ชื่อบิดา
  father_occupation?: string; // อาชีพบิดา
  father_phone?: string;     // เบอร์โทรบิดา
  mother_name?: string;      // ชื่อมารดา
  mother_occupation?: string; // อาชีพมารดา
  mother_phone?: string;     // เบอร์โทรมารดา
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
