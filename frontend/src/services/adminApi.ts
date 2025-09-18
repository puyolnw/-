import { apiService } from './api';

// Types
export interface TeachingSession {
  id: number;
  teaching_date: string;
  start_time: string;
  end_time: string;
  class_level: string;
  class_room: string;
  student_count: number;
  lesson_topic: string;
  lesson_summary: string;
  learning_outcomes: string;
  teaching_methods_used: string;
  materials_used: string;
  student_engagement: string;
  problems_encountered: string;
  problem_solutions: string;
  lessons_learned: string;
  reflection: string;
  improvement_notes: string;
  teacher_feedback: string;
  self_rating: number;
  status: string;
  created_at: string;
  updated_at: string;
  student_id: number;
  student_first_name: string;
  student_last_name: string;
  student_code: string;
  faculty: string;
  major: string;
  school_name: string;
  school_address: string;
  teacher_first_name: string;
  teacher_last_name: string;
  lesson_plan_name: string;
}

export interface Evaluation {
  id: number;
  total_teaching_hours: number;
  total_lesson_plans: number;
  total_teaching_sessions: number;
  self_evaluation: string;
  achievements: string;
  challenges_faced: string;
  skills_developed: string;
  future_goals: string;
  status: string;
  teacher_rating: number;
  teacher_comments: string;
  teacher_reviewed_at: string;
  supervisor_criteria_1: number;
  supervisor_criteria_2: number;
  supervisor_criteria_3: number;
  supervisor_criteria_4: number;
  supervisor_criteria_5: number;
  supervisor_criteria_6: number;
  supervisor_criteria_7: number;
  supervisor_criteria_8: number;
  supervisor_criteria_9: number;
  supervisor_criteria_10: number;
  supervisor_total_score: number;
  supervisor_average_score: number;
  supervisor_comments: string;
  supervisor_reviewed_at: string;
  created_at: string;
  updated_at: string;
  student_id: number;
  student_first_name: string;
  student_last_name: string;
  student_code: string;
  faculty: string;
  major: string;
  school_name: string;
  school_address: string;
  teacher_first_name: string;
  teacher_last_name: string;
}

class AdminApiService {
  // Dashboard
  async getDashboard(): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await apiService.get('/admin/dashboard');
      return response;
    } catch (error: any) {
      console.error('Error fetching admin dashboard:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลแดชบอร์ดได้'
      };
    }
  }

  // Reports
  async getReports(params?: {
    academic_year_id?: number;
    school_id?: number;
    start_date?: string;
    end_date?: string;
    report_type?: string;
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.academic_year_id) queryParams.append('academic_year_id', params.academic_year_id.toString());
      if (params?.school_id) queryParams.append('school_id', params.school_id.toString());
      if (params?.start_date) queryParams.append('start_date', params.start_date);
      if (params?.end_date) queryParams.append('end_date', params.end_date);
      if (params?.report_type) queryParams.append('report_type', params.report_type);

      const url = `/admin/reports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiService.get(url);
      return response;
    } catch (error: any) {
      console.error('Error fetching admin reports:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลรายงานได้'
      };
    }
  }

  async getFilterOptions(): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await apiService.get('/admin/reports/filter-options');
      return response;
    } catch (error: any) {
      console.error('Error fetching filter options:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลตัวเลือกกรองได้'
      };
    }
  }

  // User Management
  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    sort?: string;
    order?: string;
  }): Promise<{ success: boolean; data?: any; pagination?: any; message?: string }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.role) queryParams.append('role', params.role);
      if (params?.sort) queryParams.append('sort', params.sort);
      if (params?.order) queryParams.append('order', params.order);

      const url = `/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiService.get(url);
      return response;
    } catch (error: any) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลผู้ใช้ได้'
      };
    }
  }

  async createUser(userData: any): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await apiService.post('/admin/users', userData);
      return response;
    } catch (error: any) {
      console.error('Error creating user:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถสร้างผู้ใช้ได้'
      };
    }
  }

  async updateUser(userId: number, userData: any): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await apiService.put(`/admin/users/${userId}`, userData);
      return response;
    } catch (error: any) {
      console.error('Error updating user:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถอัปเดตผู้ใช้ได้'
      };
    }
  }

  async deleteUser(userId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.delete(`/admin/users/${userId}`);
      return response;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถลบผู้ใช้ได้'
      };
    }
  }

  // School Management
  async getAllSchools(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: string;
  }): Promise<{ success: boolean; data?: any; pagination?: any; message?: string }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.sort) queryParams.append('sort', params.sort);
      if (params?.order) queryParams.append('order', params.order);

      const url = `/admin/schools${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiService.get(url);
      return response;
    } catch (error: any) {
      console.error('Error fetching schools:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลโรงเรียนได้'
      };
    }
  }

  async createSchool(schoolData: any): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await apiService.post('/admin/schools', schoolData);
      return response;
    } catch (error: any) {
      console.error('Error creating school:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถสร้างโรงเรียนได้'
      };
    }
  }

  async updateSchool(schoolId: number, schoolData: any): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await apiService.put(`/admin/schools/${schoolId}`, schoolData);
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
      const response = await apiService.delete(`/admin/schools/${schoolId}`);
      return response;
    } catch (error: any) {
      console.error('Error deleting school:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถลบโรงเรียนได้'
      };
    }
  }

  // Teaching Sessions
  async getAllTeachingSessions(params?: {
    page?: number;
    limit?: number;
    search?: string;
    student_id?: number;
    school_id?: string;
  }): Promise<{ success: boolean; data: TeachingSession[]; pagination: any; message?: string }> {
    try {
      const response = await apiService.get('/admin/teaching-sessions', { params });
      return response;
    } catch (error: any) {
      console.error('Error fetching teaching sessions:', error);
      return {
        success: false,
        data: [],
        pagination: {},
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลบันทึกฝึกประสบการณ์ได้'
      };
    }
  }

  async getTeachingSessionById(id: number): Promise<{ success: boolean; data?: TeachingSession; message?: string }> {
    try {
      const response = await apiService.get(`/admin/teaching-sessions/${id}`);
      return response;
    } catch (error: any) {
      console.error('Error fetching teaching session:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลบันทึกฝึกประสบการณ์ได้'
      };
    }
  }

  async updateTeachingSession(id: number, data: Partial<TeachingSession>): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.put(`/admin/teaching-sessions/${id}`, data);
      return response;
    } catch (error: any) {
      console.error('Error updating teaching session:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถอัปเดตข้อมูลบันทึกฝึกประสบการณ์ได้'
      };
    }
  }

  async deleteTeachingSession(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.delete(`/admin/teaching-sessions/${id}`);
      return response;
    } catch (error: any) {
      console.error('Error deleting teaching session:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถลบข้อมูลบันทึกฝึกประสบการณ์ได้'
      };
    }
  }

  // Evaluations
  async getAllEvaluations(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    student_id?: number;
    school_id?: string;
  }): Promise<{ success: boolean; data: Evaluation[]; pagination: any; message?: string }> {
    try {
      const response = await apiService.get('/admin/evaluations', { params });
      return response;
    } catch (error: any) {
      console.error('Error fetching evaluations:', error);
      return {
        success: false,
        data: [],
        pagination: {},
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลการประเมินได้'
      };
    }
  }

  async getEvaluationById(id: number): Promise<{ success: boolean; data?: Evaluation; message?: string }> {
    try {
      const response = await apiService.get(`/admin/evaluations/${id}`);
      return response;
    } catch (error: any) {
      console.error('Error fetching evaluation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลการประเมินได้'
      };
    }
  }

  async updateEvaluation(id: number, data: Partial<Evaluation>): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.put(`/admin/evaluations/${id}`, data);
      return response;
    } catch (error: any) {
      console.error('Error updating evaluation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถอัปเดตข้อมูลการประเมินได้'
      };
    }
  }

  async deleteEvaluation(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.delete(`/admin/evaluations/${id}`);
      return response;
    } catch (error: any) {
      console.error('Error deleting evaluation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถลบข้อมูลการประเมินได้'
      };
    }
  }
}

export const adminApiService = new AdminApiService();