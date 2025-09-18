import { apiService } from './api';

export interface School {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  created_at: string;
  teacher_count: number;
  student_count: number;
  active_students: number;
  completed_students: number;
}

export interface SchoolDetail {
  school: {
    id: number;
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
  };
  teachers: Array<{
    id: number;
    teacher_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    assigned_at: string;
    student_count: number;
  }>;
  students: Array<{
    assignment_id: number;
    student_id: string;
    first_name: string;
    last_name: string;
    student_code: string;
    email: string;
    phone: string;
    faculty: string;
    major: string;
    enrollment_date: string;
    status: string;
    teacher_id?: string;
    teacher_first_name?: string;
    teacher_last_name?: string;
    teaching_sessions_count: number;
    lesson_plans_count: number;
  }>;
  academicYears: Array<{
    id: number;
    year: string;
    student_count: number;
  }>;
}

export interface AvailableUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  student_code?: string;
  faculty?: string;
  major?: string;
}

export interface EvaluationRequest {
  id: number;
  student_id: string;
  assignment_id: number;
  total_teaching_hours: number;
  total_lesson_plans: number;
  total_teaching_sessions: number;
  self_evaluation: string;
  achievements: string;
  challenges_faced: string;
  skills_developed: string;
  future_goals: string;
  status: string;
  created_at: string;
  teacher_evaluation: string;
  teacher_rating: number;
  teacher_comments: string;
  teacher_evaluated_at: string;
  first_name: string;
  last_name: string;
  student_code: string;
  faculty: string;
  major: string;
  school_name: string;
  teacher_first_name: string;
  teacher_last_name: string;
  academic_year: string;
}

class SupervisorApiService {
  // ดึงข้อมูลแดชบอร์ด
  async getDashboard(): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await apiService.get('/supervisor/dashboard');
      return response;
    } catch (error: any) {
      console.error('Error fetching dashboard:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลแดชบอร์ดได้'
      };
    }
  }

  // โรงเรียน
  async getAllSchools(params?: {
    academic_year_id?: number;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: School[]; pagination: any; message?: string }> {
    try {
      const response = await apiService.get('/supervisor/schools', { params });
      return response;
    } catch (error: any) {
      console.error('Error fetching schools:', error);
      return {
        success: false,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลโรงเรียนได้'
      };
    }
  }

  async getSchoolDetail(schoolId: number, academicYearId?: number): Promise<{ success: boolean; data?: SchoolDetail; message?: string }> {
    try {
      const params = academicYearId ? { academic_year_id: academicYearId } : {};
      const response = await apiService.get(`/supervisor/schools/${schoolId}`, { params });
      return response;
    } catch (error: any) {
      console.error('Error fetching school detail:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลโรงเรียนได้'
      };
    }
  }

  // จัดการครูพี่เลี้ยง
  async addTeacherToSchool(schoolId: number, teacherId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.post(`/supervisor/schools/${schoolId}/teachers`, {
        teacher_id: teacherId
      });
      return response;
    } catch (error: any) {
      console.error('Error adding teacher to school:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถเพิ่มครูพี่เลี้ยงได้'
      };
    }
  }

  async removeTeacherFromSchool(schoolId: number, teacherId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.delete(`/supervisor/schools/${schoolId}/teachers/${teacherId}`);
      return response;
    } catch (error: any) {
      console.error('Error removing teacher from school:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถลบครูพี่เลี้ยงได้'
      };
    }
  }

  // จัดการนักศึกษา
  async addStudentToSchool(schoolId: number, data: {
    student_id: string;
    teacher_id: string;
    academic_year_id: number;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.post(`/supervisor/schools/${schoolId}/students`, data);
      return response;
    } catch (error: any) {
      console.error('Error adding student to school:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถเพิ่มนักศึกษาได้'
      };
    }
  }

  async removeStudentFromSchool(schoolId: number, studentId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.delete(`/supervisor/schools/${schoolId}/students/${studentId}`);
      return response;
    } catch (error: any) {
      console.error('Error removing student from school:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถลบนักศึกษาได้'
      };
    }
  }

  // ดึงรายชื่อที่สามารถเพิ่มได้
  async getAvailableTeachers(): Promise<{ success: boolean; data: AvailableUser[]; message?: string }> {
    try {
      const response = await apiService.get('/supervisor/available/teachers');
      return response;
    } catch (error: any) {
      console.error('Error fetching available teachers:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลครูพี่เลี้ยงได้'
      };
    }
  }

  async getAvailableStudents(): Promise<{ success: boolean; data: AvailableUser[]; message?: string }> {
    try {
      const response = await apiService.get('/supervisor/available/students');
      return response;
    } catch (error: any) {
      console.error('Error fetching available students:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลนักศึกษาได้'
      };
    }
  }

  // การประเมิน
  async getPendingEvaluations(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: EvaluationRequest[]; pagination: any; message?: string }> {
    try {
      const response = await apiService.get('/supervisor/evaluations/pending', { params });
      return response;
    } catch (error: any) {
      console.error('Error fetching pending evaluations:', error);
      return {
        success: false,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลการประเมินได้'
      };
    }
  }

  async getEvaluationHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: any[]; pagination: any; message?: string }> {
    try {
      const response = await apiService.get('/supervisor/evaluations/history', { params });
      return response;
    } catch (error: any) {
      console.error('Error fetching evaluation history:', error);
      return {
        success: false,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลประวัติการประเมินได้'
      };
    }
  }

  async getEvaluationDetail(requestId: number): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await apiService.get(`/supervisor/evaluations/${requestId}`);
      return response;
    } catch (error: any) {
      console.error('Error fetching evaluation detail:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลการประเมินได้'
      };
    }
  }

  async evaluateRequest(requestId: number, evaluationData: {
    criteria_1: number;
    criteria_2: number;
    criteria_3: number;
    criteria_4: number;
    criteria_5: number;
    criteria_6: number;
    criteria_7: number;
    criteria_8: number;
    criteria_9: number;
    criteria_10: number;
    overall_rating: number;
    supervisor_comments: string;
    decision: 'approved' | 'rejected';
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.post(`/supervisor/evaluations/${requestId}`, evaluationData);
      return response;
    } catch (error: any) {
      console.error('Error evaluating request:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถประเมินได้'
      };
    }
  }

  // จัดการผู้ใช้งาน
  async getAllUsers(params?: {
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: any[]; pagination: any; message?: string }> {
    try {
      const response = await apiService.get('/supervisor/management/users', { params });
      return response;
    } catch (error: any) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลผู้ใช้งานได้'
      };
    }
  }

  async createUser(userData: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone: string;
    role: string;
    student_code?: string;
    faculty?: string;
    major?: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.post('/supervisor/management/users', userData);
      return response;
    } catch (error: any) {
      console.error('Error creating user:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถสร้างผู้ใช้งานได้'
      };
    }
  }

  async updateUser(userId: string, userData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
    student_code?: string;
    faculty?: string;
    major?: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.put(`/supervisor/management/users/${userId}`, userData);
      return response;
    } catch (error: any) {
      console.error('Error updating user:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถอัปเดตผู้ใช้งานได้'
      };
    }
  }

  async deleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.delete(`/supervisor/management/users/${userId}`);
      return response;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถลบผู้ใช้งานได้'
      };
    }
  }

  // จัดการโรงเรียน
  async createSchool(schoolData: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.post('/supervisor/management/schools', schoolData);
      return response;
    } catch (error: any) {
      console.error('Error creating school:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถสร้างโรงเรียนได้'
      };
    }
  }

  async updateSchool(schoolId: number, schoolData: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.put(`/supervisor/management/schools/${schoolId}`, schoolData);
      return response;
    } catch (error: any) {
      console.error('Error updating school:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถอัปเดตโรงเรียนได้'
      };
    }
  }

  async deleteSchool(schoolId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.delete(`/supervisor/management/schools/${schoolId}`);
      return response;
    } catch (error: any) {
      console.error('Error deleting school:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถลบโรงเรียนได้'
      };
    }
  }

  // ดึงข้อมูลปีการศึกษา
  async getAcademicYears(): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
      const response = await apiService.get('/dashboard/academic-years');
      return response;
    } catch (error: any) {
      console.error('Error fetching academic years:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลปีการศึกษาได้'
      };
    }
  }

  // ดึงรายละเอียดนักศึกษา
  async getStudentDetail(studentId: number): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await apiService.get(`/supervisor/students/${studentId}`);
      return response;
    } catch (error: any) {
      console.error('Error fetching student detail:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลนักศึกษาได้'
      };
    }
  }

  // ดึงข้อมูลรายงาน
  async getReports(academicYearId?: number): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const params = academicYearId ? `?academic_year_id=${academicYearId}` : '';
      const response = await apiService.get(`/supervisor/reports${params}`);
      return response;
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลรายงานได้'
      };
    }
  }
}

export const supervisorApiService = new SupervisorApiService();
