import { apiService } from './api';

export interface CompletionRequest {
  id: number;
  student_id: number;
  assignment_id: number;
  request_date: string;
  total_teaching_hours: number;
  total_lesson_plans: number;
  total_teaching_sessions: number;
  self_evaluation?: string;
  achievements?: string;
  challenges_faced?: string;
  skills_developed?: string;
  future_goals?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'revision_required';
  teacher_comments?: string;
  teacher_rating?: number;
  teacher_reviewed_at?: string;
  supervisor_comments?: string;
  supervisor_rating?: number;
  supervisor_reviewed_at?: string;
  approved_by?: number;
  approved_date?: string;
  school_name?: string;
  teacher_first_name?: string;
  teacher_last_name?: string;
  teacher_email?: string;
  teacher_phone?: string;
  student_first_name?: string;
  student_last_name?: string;
  student_code?: string;
}

export interface TeachingStats {
  total_teaching_sessions: number;
  total_teaching_hours: number;
  total_lesson_plans: number;
}

class CompletionRequestApiService {
  // สร้างคำร้องขอสำเร็จการฝึกใหม่
  async createCompletionRequest(requestData: {
    assignment_id: number;
    self_evaluation?: string;
    achievements?: string;
    challenges_faced?: string;
    skills_developed?: string;
    future_goals?: string;
  }): Promise<{ success: boolean; data?: CompletionRequest; message?: string }> {
    try {
      console.log('🔵 Frontend - Creating completion request:', requestData);
      const response = await apiService.post('/completion-requests', requestData);
      console.log('🔵 Frontend - Create completion request response:', response);
      return response;
    } catch (error: any) {
      console.error('Error creating completion request:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create completion request'
      };
    }
  }

  // ดึงคำร้องขอสำเร็จการฝึกของนักศึกษา
  async getStudentCompletionRequests(): Promise<{ success: boolean; data?: CompletionRequest[]; message?: string }> {
    try {
      console.log('🔵 Frontend - Fetching student completion requests...');
      const response = await apiService.get('/completion-requests/my-requests');
      console.log('🔵 Frontend - Student completion requests response:', response);
      return response;
    } catch (error: any) {
      console.error('Error fetching student completion requests:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch completion requests'
      };
    }
  }

  // ดึงคำร้องขอสำเร็จการฝึกตาม ID
  async getCompletionRequestById(id: number): Promise<{ success: boolean; data?: CompletionRequest; message?: string }> {
    try {
      console.log('🔵 Frontend - Fetching completion request by ID:', id);
      const response = await apiService.get(`/completion-requests/${id}`);
      console.log('🔵 Frontend - Completion request by ID response:', response);
      return response;
    } catch (error: any) {
      console.error('Error fetching completion request by ID:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch completion request'
      };
    }
  }

  // อัปเดตคำร้องขอสำเร็จการฝึก
  async updateCompletionRequest(data: {
    assignment_id: number;
    self_evaluation: string;
    achievements: string;
    challenges_faced: string;
    skills_developed: string;
    future_goals: string;
    status: string;
  }): Promise<{ success: boolean; data?: CompletionRequest; message?: string }> {
    try {
      console.log('🔵 Frontend - Updating completion request:', data);
      const response = await apiService.put('/completion-requests/update', data);
      console.log('🔵 Frontend - Update completion request response:', response);
      return response;
    } catch (error: any) {
      console.error('Error updating completion request:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update completion request'
      };
    }
  }

  // ดึงคำร้องที่รอการอนุมัติ (สำหรับครูพี่เลี้ยง)
  async getPendingRequests(): Promise<{ success: boolean; data?: CompletionRequest[]; message?: string }> {
    try {
      console.log('🔵 Frontend - Fetching pending requests...');
      const response = await apiService.get('/completion-requests/pending/teacher');
      console.log('🔵 Frontend - Pending requests response:', response);
      return response;
    } catch (error: any) {
      console.error('Error fetching pending requests:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch pending requests'
      };
    }
  }

  // อัปเดตสถานะคำร้อง (สำหรับครูพี่เลี้ยง)
  async updateRequestStatus(id: number, status: string, teacherComments?: string, teacherRating?: number): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔵 Frontend - Updating request status:', { id, status, teacherComments, teacherRating });
      const response = await apiService.put(`/completion-requests/${id}/status`, {
        status,
        teacher_comments: teacherComments,
        teacher_rating: teacherRating
      });
      console.log('🔵 Frontend - Update request status response:', response);
      return response;
    } catch (error: any) {
      console.error('Error updating request status:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update request status'
      };
    }
  }

  // อัปเดตความเห็นจากอาจารย์นิเทศ
  async updateSupervisorReview(id: number, supervisorComments?: string, supervisorRating?: number): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔵 Frontend - Updating supervisor review:', { id, supervisorComments, supervisorRating });
      const response = await apiService.put(`/completion-requests/${id}/supervisor-review`, {
        supervisor_comments: supervisorComments,
        supervisor_rating: supervisorRating
      });
      console.log('🔵 Frontend - Update supervisor review response:', response);
      return response;
    } catch (error: any) {
      console.error('Error updating supervisor review:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update supervisor review'
      };
    }
  }

  // อนุมัติคำร้อง (สำหรับอาจารย์นิเทศ)
  async approveRequest(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔵 Frontend - Approving request:', id);
      const response = await apiService.put(`/completion-requests/${id}/approve`);
      console.log('🔵 Frontend - Approve request response:', response);
      return response;
    } catch (error: any) {
      console.error('Error approving request:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to approve request'
      };
    }
  }

  // ลบคำร้อง
  async deleteCompletionRequest(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔵 Frontend - Deleting completion request:', id);
      const response = await apiService.delete(`/completion-requests/${id}`);
      console.log('🔵 Frontend - Delete completion request response:', response);
      return response;
    } catch (error: any) {
      console.error('Error deleting completion request:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete completion request'
      };
    }
  }

  // ดึงสถิติการฝึกสอน
  async getTeachingStats(assignmentId: number): Promise<{ success: boolean; data?: TeachingStats; message?: string }> {
    try {
      console.log('🔵 Frontend - Fetching teaching stats:', assignmentId);
      const response = await apiService.get(`/completion-requests/stats?assignment_id=${assignmentId}`);
      console.log('🔵 Frontend - Teaching stats response:', response);
      return response;
    } catch (error: any) {
      console.error('🔵 Frontend - Error fetching teaching stats:', error);
      console.error('🔵 Frontend - Error response:', error.response?.data);
      console.error('🔵 Frontend - Error status:', error.response?.status);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch teaching stats'
      };
    }
  }
}

export const completionRequestApiService = new CompletionRequestApiService();
