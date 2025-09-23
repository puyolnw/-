import apiService from './api';

export interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
  description?: string;
  created_by: number;
  first_name?: string;
  last_name?: string;
  lesson_plan_count?: number;
  created_at: string;
  updated_at: string;
}

export interface LessonPlan {
  id: number;
  student_id: number;
  lesson_plan_name: string;
  subject_id: number;
  description?: string;
  objectives?: string;
  teaching_methods?: string;
  assessment_methods?: string;
  duration_minutes: number;
  target_grade?: string;
  status: 'active' | 'completed' | 'archived';
  subject_code?: string;
  subject_name?: string;
  first_name?: string;
  last_name?: string;
  student_code?: string;
  file_count?: number;
  created_at: string;
  updated_at: string;
  files?: LessonPlanFile[];
}

export interface LessonPlanFile {
  id: number;
  lesson_plan_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  file_category: 'document' | 'presentation' | 'media' | 'other';
  uploaded_at: string;
}

export interface LessonPlanStats {
  total_plans: number;
  active_plans: number;
  completed_plans: number;
  archived_plans: number;
}

export interface CreateLessonPlanData {
  lesson_plan_name: string;
  subject_id: number;
  description?: string;
  objectives?: string;
  teaching_methods?: string;
  assessment_methods?: string;
  duration_minutes?: number;
  target_grade?: string;
  status?: 'active' | 'completed' | 'archived';
}

export interface UpdateLessonPlanData {
  lesson_plan_name?: string;
  subject_id?: number;
  description?: string;
  objectives?: string;
  teaching_methods?: string;
  assessment_methods?: string;
  duration_minutes?: number;
  target_grade?: string;
  status?: 'draft' | 'active' | 'completed' | 'archived';
}

class LessonPlanApiService {
  // สร้างแผนการสอนใหม่
  async createLessonPlan(data: CreateLessonPlanData): Promise<{ success: boolean; data?: LessonPlan; message?: string }> {
    try {
      const response = await apiService.post('/student/lesson-plans', data);
      
      // ตรวจสอบว่า response.data มี success field หรือไม่
      if (response.data && typeof response.data === 'object' && response.data.success !== undefined) {
        // Backend ส่งมาในรูปแบบ {success: true, message: '...', data: {...}}
        return response.data;
      } else {
        // Backend ส่งมาในรูปแบบ {...} ตรงๆ
        return {
          success: true,
          message: 'Lesson plan created successfully',
          data: response.data
        };
      }
    } catch (error: any) {
      console.error('Error creating lesson plan:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create lesson plan'
      };
    }
  }

  // ดึงแผนการสอนทั้งหมดของนักศึกษา
  async getMyLessonPlans(params: {
    status?: string;
    subject_id?: number;
    page?: number;
    limit?: number;
  } = {}): Promise<{ success: boolean; data?: { lessonPlans: LessonPlan[]; stats: LessonPlanStats; pagination: any }; message?: string }> {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.subject_id) queryParams.append('subject_id', params.subject_id.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const url = `/student/lesson-plans${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiService.get(url);
      
      if (response.data && typeof response.data === 'object' && response.data.success !== undefined) {
        return response.data;
      } else {
        return {
          success: true,
          data: response.data
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch lesson plans'
      };
    }
  }

  // ดึงแผนการสอนตาม ID
  async getLessonPlanById(id: number): Promise<{ success: boolean; data?: LessonPlan & { files: LessonPlanFile[] }; message?: string }> {
    try {
      const response = await apiService.get(`/student/lesson-plans/${id}`);
      
      if (response.data && typeof response.data === 'object' && response.data.success !== undefined) {
        return response.data;
      } else {
        return {
          success: true,
          data: response.data
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch lesson plan'
      };
    }
  }

  // อัปเดตแผนการสอน
  async updateLessonPlan(id: number, data: UpdateLessonPlanData): Promise<{ success: boolean; data?: LessonPlan; message?: string }> {
    try {
      const response = await apiService.put(`/student/lesson-plans/${id}`, data);
      
      if (response.data && typeof response.data === 'object' && response.data.success !== undefined) {
        return response.data;
      } else {
        return {
          success: true,
          data: response.data,
          message: 'Lesson plan updated successfully'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update lesson plan'
      };
    }
  }

  // ลบแผนการสอน
  async deleteLessonPlan(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.delete(`/student/lesson-plans/${id}`);
      
      if (response.data && typeof response.data === 'object' && response.data.success !== undefined) {
        return response.data;
      } else {
        return {
          success: true,
          message: 'Lesson plan deleted successfully'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete lesson plan'
      };
    }
  }

  // ดึงวิชาทั้งหมด
  async getSubjects(params: {
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ success: boolean; data?: Subject[]; message?: string }> {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());

      const url = `/student/lesson-plans/subjects${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiService.get(url);
      
      if (response.data && typeof response.data === 'object' && response.data.success !== undefined) {
        return response.data;
      } else {
        return {
          success: true,
          data: response.data
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch subjects'
      };
    }
  }

  // สร้างวิชาใหม่
  async createSubject(data: {
    subject_code: string;
    subject_name: string;
    description?: string;
  }): Promise<{ success: boolean; data?: Subject; message?: string }> {
    try {
      const response = await apiService.post('/student/lesson-plans/subjects', data);
      
      if (response.data && typeof response.data === 'object') {
        if (response.data.success !== undefined) {
          return response.data;
        } else {
          return {
            success: true,
            message: 'Subject created successfully',
            data: response.data
          };
        }
      }
      
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create subject'
      };
    }
  }

  // อัปโหลดไฟล์แผนการสอน (PDF, Word)
  async uploadLessonPlanDocuments(lessonPlanId: number, files: File[]): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await apiService.post(`/student/lesson-plans/${lessonPlanId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return {
        success: true,
        data: response.data,
        message: 'Files uploaded successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload lesson plan documents'
      };
    }
  }

  // อัปโหลดไฟล์สื่อการสอน (รูป, วิดีโอ, PPT)
  async uploadTeachingMaterials(lessonPlanId: number, files: File[]): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await apiService.post(`/student/lesson-plans/${lessonPlanId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return {
        success: true,
        data: response.data,
        message: 'Files uploaded successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload teaching materials'
      };
    }
  }

  // อัปโหลดไฟล์สำหรับแผนการสอน (legacy - ใช้สำหรับ backward compatibility)
  async uploadFiles(lessonPlanId: number, files: File[]): Promise<{ success: boolean; data?: LessonPlanFile[]; message?: string }> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await apiService.post(`/student/lesson-plans/${lessonPlanId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Backend ส่ง response ในรูปแบบ {success: true, message: "...", data: [...]}
      // แต่ response.data คือ array ของไฟล์ที่อัปโหลด
      // เราต้อง return object ที่มี success field
      return {
        success: true,
        data: response.data,
        message: 'Files uploaded successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload files'
      };
    }
  }

  // ลบไฟล์
  async deleteFile(lessonPlanId: number, fileId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.delete(`/student/lesson-plans/${lessonPlanId}/files/${fileId}`);
      
      // ตรวจสอบว่า response.data มี success field หรือไม่
      if (response.data && typeof response.data === 'object' && response.data.success !== undefined) {
        // Backend ส่งมาในรูปแบบ {success: true, message: "..."}
        return response.data;
      } else {
        // ถ้า response.data เป็น undefined หรือไม่ใช่ object
        return {
          success: true,
          message: 'File deleted successfully'
        };
      }
    } catch (error: any) {
      console.error('🔴 API Service - Error response:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete file'
      };
    }
  }

  // ดาวน์โหลดไฟล์
  async downloadFile(lessonPlanId: number, fileId: number): Promise<Blob | null> {
    try {
      const response = await apiService.get(`/student/lesson-plans/${lessonPlanId}/files/${fileId}/download`, {
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
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📈';
    return '📎';
  }
}

export const lessonPlanApiService = new LessonPlanApiService();
