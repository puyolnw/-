import apiService from './api';

export interface TeachingSession {
  id: number;
  student_id: number;
  lesson_plan_id: number;
  subject_id: number;
  teaching_date: string;
  start_time: string;
  end_time: string;
  class_level?: string;
  class_room?: string;
  student_count?: number;
  lesson_topic?: string;
  lesson_summary?: string;
  learning_activities?: string;
  learning_outcomes?: string;
  teaching_methods_used?: string;
  materials_used?: string;
  student_engagement?: string;
  problems_encountered?: string;
  problem_solutions?: string;
  lessons_learned?: string;
  reflection?: string;
  improvement_notes?: string;
  teacher_feedback?: string;
  self_rating?: number;
  status: 'draft' | 'submitted' | 'reviewed';
  lesson_plan_name?: string;
  lesson_plan_code?: string;
  subject_code?: string;
  subject_name?: string;
  first_name?: string;
  last_name?: string;
  student_code?: string;
  file_count?: number;
  duration_minutes?: number;
  files?: TeachingSessionFile[];
  created_at: string;
  updated_at: string;
}

export interface TeachingSessionFile {
  id: number;
  teaching_session_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  file_category: 'photo' | 'document' | 'video' | 'other';
  description?: string;
  uploaded_at: string;
}

export interface TeachingSessionStats {
  total_sessions: number;
  draft_sessions: number;
  submitted_sessions: number;
  reviewed_sessions: number;
  total_minutes: number;
  average_rating: number;
  teaching_days: number;
  subjects_taught: number;
}

export interface AvailableLessonPlan {
  id: number;
  lesson_plan_code: string;
  lesson_plan_name: string;
  subject_id: number;
  subject_code: string;
  subject_name: string;
  plan_status: string;
}

export interface CreateTeachingSessionData {
  lesson_plan_id: number;
  subject_id: number;
  teaching_date: string;
  start_time: string;
  end_time: string;
  class_level?: string;
  class_room?: string;
  student_count?: number;
  lesson_topic?: string;
  lesson_summary?: string;
  learning_outcomes?: string;
  teaching_methods_used?: string;
  materials_used?: string;
  student_engagement?: string;
  problems_encountered?: string;
  problem_solutions?: string;
  lessons_learned?: string;
  reflection?: string;
  improvement_notes?: string;
  teacher_feedback?: string;
  self_rating?: number;
  status?: 'draft' | 'submitted' | 'reviewed';
}

export interface UpdateTeachingSessionData {
  lesson_plan_id?: number;
  subject_id?: number;
  teaching_date?: string;
  start_time?: string;
  end_time?: string;
  class_level?: string;
  class_room?: string;
  student_count?: number;
  lesson_topic?: string;
  lesson_summary?: string;
  learning_outcomes?: string;
  teaching_methods_used?: string;
  materials_used?: string;
  student_engagement?: string;
  problems_encountered?: string;
  problem_solutions?: string;
  lessons_learned?: string;
  reflection?: string;
  improvement_notes?: string;
  teacher_feedback?: string;
  self_rating?: number;
  status?: 'draft' | 'submitted' | 'reviewed';
}

class TeachingSessionApiService {

  // ดึงบันทึกการฝึกสอนทั้งหมดของนักศึกษา
  async getMyTeachingSessions(params: {
    status?: string;
    subject_id?: number;
    lesson_plan_id?: number;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ success: boolean; data?: { teachingSessions: TeachingSession[]; stats: TeachingSessionStats; pagination: any }; message?: string }> {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.subject_id) queryParams.append('subject_id', params.subject_id.toString());
      if (params.lesson_plan_id) queryParams.append('lesson_plan_id', params.lesson_plan_id.toString());
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const url = `/student/teaching-sessions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('🔵 API Service - Making request to:', url);
      const response = await apiService.get(url);
      console.log('🔵 API Service - Response:', response);
      return response;
    } catch (error: any) {
      console.error('Error fetching teaching sessions:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch teaching sessions'
      };
    }
  }

  // ดึงบันทึกการฝึกสอนตาม ID
  async getTeachingSessionById(id: number): Promise<{ success: boolean; data?: TeachingSession & { files: TeachingSessionFile[] }; message?: string }> {
    try {
      const response = await apiService.get(`/student/teaching-sessions/${id}`);
      return response;
    } catch (error: any) {
      console.error('Error fetching teaching session:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch teaching session'
      };
    }
  }

  // อัปเดตบันทึกการฝึกสอน
  async updateTeachingSession(id: number, data: UpdateTeachingSessionData): Promise<{ success: boolean; data?: TeachingSession; message?: string }> {
    try {
      const response = await apiService.put(`/student/teaching-sessions/${id}`, data);
      return response;
    } catch (error: any) {
      console.error('Error updating teaching session:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update teaching session'
      };
    }
  }

  // สร้างบันทึกการฝึกสอนใหม่
  async createTeachingSession(data: {
    lesson_plan_id: number;
    subject_id: number;
    teaching_date: string;
    start_time: string;
    end_time: string;
    class_level?: string | null;
    class_room?: string | null;
    student_count?: number | null;
    lesson_topic?: string | null;
    learning_activities?: string | null;
    learning_outcomes?: string | null;
    teaching_methods_used?: string | null;
    materials_used?: string | null;
    student_engagement?: string | null;
    problems_encountered?: string | null;
    problem_solutions?: string | null;
    lessons_learned?: string | null;
    reflection?: string | null;
    improvement_notes?: string | null;
    self_rating?: number | null;
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      console.log('🔵 API Service - Creating teaching session:', data);
      const response = await apiService.post('/student/teaching-sessions', data);
      console.log('🔵 API Service - Create response:', response);
      return response;
    } catch (error: any) {
      console.error('Error creating teaching session:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create teaching session'
      };
    }
  }

  // ลบบันทึกการฝึกสอน
  async deleteTeachingSession(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.delete(`/student/teaching-sessions/${id}`);
      return response;
    } catch (error: any) {
      console.error('Error deleting teaching session:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete teaching session'
      };
    }
  }

  // ดึงแผนการสอนที่ใช้ได้
  async getAvailableLessonPlans(subjectId?: number): Promise<{ success: boolean; data?: AvailableLessonPlan[]; message?: string }> {
    try {
      const url = subjectId 
        ? `/student/teaching-sessions/lesson-plans?subject_id=${subjectId}`
        : '/student/teaching-sessions/lesson-plans';
      const response = await apiService.get(url);
      return response;
    } catch (error: any) {
      console.error('Error fetching available lesson plans:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch available lesson plans'
      };
    }
  }

  // ดึงสถิติรายเดือน
  async getMonthlyStats(year: number, month: number): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await apiService.get(`/student/teaching-sessions/stats/monthly?year=${year}&month=${month}`);
      return response;
    } catch (error: any) {
      console.error('Error fetching monthly stats:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch monthly stats'
      };
    }
  }

  // อัปโหลดไฟล์สำหรับบันทึกการฝึกสอน
  async uploadFiles(teachingSessionId: number, files: File[], description?: string): Promise<{ success: boolean; data?: TeachingSessionFile[]; message?: string }> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      if (description) {
        formData.append('description', description);
      }

      const response = await apiService.post(`/student/teaching-sessions/${teachingSessionId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response;
    } catch (error: any) {
      console.error('Error uploading files:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload files'
      };
    }
  }

  // ลบไฟล์
  async deleteFile(teachingSessionId: number, fileId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.delete(`/student/teaching-sessions/${teachingSessionId}/files/${fileId}`);
      return response;
    } catch (error: any) {
      console.error('Error deleting file:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete file'
      };
    }
  }

  // ดาวน์โหลดไฟล์
  async downloadFile(teachingSessionId: number, fileId: number): Promise<Blob | null> {
    try {
      const response = await apiService.get(`/student/teaching-sessions/${teachingSessionId}/files/${fileId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error downloading file:', error);
      return null;
    }
  }

  // ฟังก์ชันช่วยสำหรับจัดรูปแบบขนาดไฟล์
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // ฟังก์ชันช่วยสำหรับกำหนดไอคอนไฟล์
  getFileIcon(_fileType: string, mimeType: string): string {
    if (mimeType.startsWith('image/')) return '📷';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📈';
    return '📎';
  }

  // ฟังก์ชันช่วยสำหรับคำนวณระยะเวลา
  calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // นาที
  }

  // ฟังก์ชันช่วยสำหรับจัดรูปแบบเวลา
  formatTime(time: string): string {
    return new Date(`2000-01-01 ${time}`).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ฟังก์ชันช่วยสำหรับจัดรูปแบบวันที่
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // ฟังก์ชันช่วยสำหรับจัดรูปแบบระยะเวลา
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours} ชั่วโมง ${mins} นาที`;
    }
    return `${mins} นาที`;
  }
}

export const teachingSessionApiService = new TeachingSessionApiService();
