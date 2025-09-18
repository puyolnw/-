import { apiService } from './api';

export interface StudentStatus {
  isRegistered: boolean;
  hasCompletionRequest: boolean;
  schoolInfo?: {
    assignment_id: number;
    school_id: string;
    school_name: string;
    enrollment_date: string;
  };
  completionRequestInfo?: {
    id: number;
    status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'revision_required';
    request_date: string;
    approved_date?: string;
    teacher_rating?: number;
    supervisor_rating?: number;
  };
}

export interface School {
  id: number;
  school_id: string;
  school_name: string;
  address: string;
  phone?: string;
  max_students: number;
  current_students: number;
  available_slots: number;
  teachers: string;
  enrollment_status: string;
  can_apply: boolean;
  availability_status: string;
}

export interface SchoolsResponse {
  schools: School[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class StudentApiService {
  // ดึงสถานะของนักศึกษา (ใช้ API เดิม)
  async getStudentStatus(): Promise<{ success: boolean; data?: StudentStatus; message?: string }> {
    try {
      // ใช้ API เดิมเพื่อเช็คว่ามีการลงทะเบียนหรือไม่
      const response = await apiService.get('/student/assignments/my');
      
      if (response.success) {
        const assignments = response.data?.assignments || [];
        const activeAssignment = assignments.find((a: any) => a.status === 'active');
        
        const isRegistered = !!activeAssignment;
        let schoolInfo = undefined; // ใช้ undefined แทน null
        
        if (activeAssignment) {
          schoolInfo = {
            assignment_id: activeAssignment.id,
            school_id: activeAssignment.school_id,
            school_name: activeAssignment.school_name,
            enrollment_date: activeAssignment.enrollment_date
          };
        }

        // เช็คคำร้องสำเร็จการฝึก
        let hasCompletionRequest = false;
        let completionRequestInfo = undefined;
        
        try {
          const completionResponse = await apiService.get('/completion-requests/my');
          if (completionResponse.success && completionResponse.data) {
            hasCompletionRequest = true;
            completionRequestInfo = {
              id: completionResponse.data.id,
              status: completionResponse.data.status,
              request_date: completionResponse.data.created_at,
              approved_date: completionResponse.data.teacher_evaluated_at,
              teacher_rating: completionResponse.data.teacher_rating,
              supervisor_rating: completionResponse.data.supervisor_average_score
            };
          }
        } catch (completionError: any) {
          // ถ้าไม่มี completion request หรือ error ให้ใช้ค่า default
          console.log('No completion request found or error:', completionError?.response?.status, completionError?.message);
          // ไม่ต้อง throw error เพราะการไม่มี completion request เป็นเรื่องปกติ
        }

        const result = {
          success: true,
          data: {
            isRegistered,
            hasCompletionRequest,
            schoolInfo,
            completionRequestInfo
          }
        };
        
        console.log('🔍 StudentStatus result:', {
          isRegistered,
          hasCompletionRequest,
          schoolInfo: schoolInfo ? `${schoolInfo.school_name} (${schoolInfo.school_id})` : 'none',
          completionRequestInfo: completionRequestInfo ? `Status: ${completionRequestInfo.status}` : 'none'
        });
        
        return result;
      }
      
      return response;
    } catch (error: any) {
      console.error('Error fetching student status:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch student status'
      };
    }
  }

  // ดึงรายการโรงเรียนที่เปิดรับสมัคร (ใช้ API เดิม)
  async getAvailableSchools(params: {
    page?: number;
    limit?: number;
    search?: string;
    academic_year_id?: number;
  } = {}): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      // ใช้ API เดิมที่มีอยู่แล้ว พร้อมส่ง academic_year_id
      const queryParams = new URLSearchParams();
      if (params.academic_year_id) {
        queryParams.append('academic_year_id', params.academic_year_id.toString());
      }
      
      const url = `/student/assignments/available-schools${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiService.get(url);
      
      if (response.success && response.data?.schools) {
        let schools = response.data.schools;
        
        // ทำ search filtering ใน frontend ก่อน (จนกว่า API จะรองรับ)
        if (params.search?.trim()) {
          const searchTerm = params.search.toLowerCase();
          schools = schools.filter((school: School) => 
            school.school_name.toLowerCase().includes(searchTerm) ||
            school.address.toLowerCase().includes(searchTerm)
          );
        }
        
        // ทำ pagination ใน frontend ก่อน
        const page = params.page || 1;
        const limit = params.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedSchools = schools.slice(startIndex, endIndex);
        
        return {
          success: true,
          data: {
            schools: paginatedSchools,
            pagination: {
              page,
              limit,
              total: schools.length,
              totalPages: Math.ceil(schools.length / limit),
              hasNext: endIndex < schools.length,
              hasPrev: page > 1
            }
          }
        };
      }
      
      return response;
    } catch (error: any) {
      console.error('Error fetching available schools:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch schools'
      };
    }
  }

  // ลงทะเบียนเข้าโรงเรียน (ใช้ API เดิม)
  async registerToSchool(schoolId: string, academicYearId: number): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await apiService.post('/student/assignments/apply', {
        school_id: schoolId,
        academic_year_id: academicYearId
      });
      return response;
    } catch (error: any) {
      console.error('Error registering to school:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed'
      };
    }
  }

  // ดึงข้อมูลโรงเรียนของนักศึกษา
  async getMySchool(): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await apiService.get('/student/my-school');
      return response;
    } catch (error: any) {
      console.error('Error fetching my school:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch school info'
      };
    }
  }

  // ดึงรายการครูพี่เลี้ยงในโรงเรียน
  async getSchoolTeachers(): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await apiService.get('/student/school/teachers');
      return response;
    } catch (error: any) {
      console.error('Error fetching school teachers:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch teachers'
      };
    }
  }

  // ยื่นคำร้องขอสำเร็จการฝึก
  async submitCompletionRequest(requestData: {
    self_evaluation?: string;
    achievements?: string;
    challenges_faced?: string;
    skills_developed?: string;
    future_goals?: string;
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await apiService.post('/student/completion-request', requestData);
      return response;
    } catch (error: any) {
      console.error('Error submitting completion request:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to submit completion request'
      };
    }
  }

  // ดึงข้อมูลคำร้องขอสำเร็จการฝึก
  async getCompletionRequest(): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await apiService.get('/student/completion-request');
      return response;
    } catch (error: any) {
      console.error('Error fetching completion request:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch completion request'
      };
    }
  }

  // ดึงข้อมูลโรงเรียนของนักศึกษา
  async getStudentSchoolInfo(): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await apiService.get('/student/assignments/school-info');
      return response;
    } catch (error: any) {
      console.error('Error fetching student school info:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch school info'
      };
    }
  }
}

export const studentApiService = new StudentApiService();

// Export SchoolInfo class for direct usage
export class SchoolInfo {
  static async getStudentSchoolInfo(): Promise<{ success: boolean; data?: any; message?: string }> {
    return studentApiService.getStudentSchoolInfo();
  }
}
