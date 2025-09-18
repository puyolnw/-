import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { 
  AcademicYear, 
  SchoolOverview, 
  InternshipAssignment, 
  SchoolTeacher, 
  AvailableSchool,
  SchoolStats,
  AcademicYearStats 
} from '../types/school-system';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

class SchoolSystemApiService {
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
        const token = localStorage.getItem('token');
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
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // ===== Academic Year APIs =====

  async getAllAcademicYears(): Promise<ApiResponse<{ academicYears: AcademicYear[] }>> {
    const response: AxiosResponse<ApiResponse<{ academicYears: AcademicYear[] }>> = await this.api.get('/admin/academic-years');
    return response.data;
  }

  async getActiveAcademicYear(): Promise<ApiResponse<{ academicYear: AcademicYear }>> {
    const response: AxiosResponse<ApiResponse<{ academicYear: AcademicYear }>> = await this.api.get('/admin/academic-years/active');
    return response.data;
  }

  async createAcademicYear(data: Partial<AcademicYear>): Promise<ApiResponse<{ academicYear: AcademicYear }>> {
    const response: AxiosResponse<ApiResponse<{ academicYear: AcademicYear }>> = await this.api.post('/admin/academic-years', data);
    return response.data;
  }

  async updateAcademicYear(id: number, data: Partial<AcademicYear>): Promise<ApiResponse<{ academicYear: AcademicYear }>> {
    const response: AxiosResponse<ApiResponse<{ academicYear: AcademicYear }>> = await this.api.put(`/admin/academic-years/${id}`, data);
    return response.data;
  }

  async activateAcademicYear(id: number): Promise<ApiResponse<{ academicYear: AcademicYear }>> {
    const response: AxiosResponse<ApiResponse<{ academicYear: AcademicYear }>> = await this.api.put(`/admin/academic-years/${id}/activate`);
    return response.data;
  }

  async deleteAcademicYear(id: number): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.delete(`/admin/academic-years/${id}`);
    return response.data;
  }

  async getAcademicYearStats(id: number): Promise<ApiResponse<{ stats: AcademicYearStats }>> {
    const response: AxiosResponse<ApiResponse<{ stats: AcademicYearStats }>> = await this.api.get(`/admin/academic-years/stats/${id}`);
    return response.data;
  }

  // ===== School System APIs =====

  async getSchoolOverview(academicYearId?: number): Promise<ApiResponse<{ schools: SchoolOverview[] }>> {
    const params = academicYearId ? { academicYearId } : {};
    const response: AxiosResponse<ApiResponse<{ schools: SchoolOverview[] }>> = await this.api.get('/admin/school-system/overview', { params });
    return response.data;
  }

  async getSchoolDetails(schoolId: string, academicYearId: number): Promise<ApiResponse<{ school: SchoolOverview; students: InternshipAssignment[]; teachers: SchoolTeacher[] }>> {
    console.log('🔵 API Service - getSchoolDetails called', {
      schoolId,
      academicYearId,
      timestamp: new Date().toISOString()
    });

    const response: AxiosResponse<ApiResponse<{ school: SchoolOverview; students: InternshipAssignment[]; teachers: SchoolTeacher[] }>> = await this.api.get(`/admin/school-system/${schoolId}/details`, {
      params: { academicYearId }
    });

    console.log('🔵 API Service - getSchoolDetails response', {
      status: response.status,
      success: response.data.success,
      hasData: !!response.data.data,
      schoolData: !!response.data.data?.school,
      studentsCount: response.data.data?.students?.length,
      students: response.data.data?.students,
      teachersCount: response.data.data?.teachers?.length,
      teachers: response.data.data?.teachers,
      timestamp: new Date().toISOString()
    });

    return response.data;
  }

  async getSchoolStudents(schoolId: string, params: { academicYearId: number; status?: string; page?: number; limit?: number }): Promise<ApiResponse<{ assignments: InternshipAssignment[]; total: number; page: number; limit: number; totalPages: number }>> {
    const response: AxiosResponse<ApiResponse<{ assignments: InternshipAssignment[]; total: number; page: number; limit: number; totalPages: number }>> = await this.api.get(`/admin/school-system/${schoolId}/students`, { params });
    return response.data;
  }

  async getSchoolTeachers(schoolId: string, academicYearId: number): Promise<ApiResponse<{ teachers: SchoolTeacher[] }>> {
    const response: AxiosResponse<ApiResponse<{ teachers: SchoolTeacher[] }>> = await this.api.get(`/admin/school-system/${schoolId}/teachers`, {
      params: { academicYearId }
    });
    return response.data;
  }

  async getAvailableTeachers(schoolId: string, academicYearId: number): Promise<ApiResponse<{ teachers: any[] }>> {
    const response: AxiosResponse<ApiResponse<{ teachers: any[] }>> = await this.api.get(`/admin/school-system/${schoolId}/teachers/available`, {
      params: { academicYearId }
    });
    return response.data;
  }

  async getAvailableStudents(academicYearId: number): Promise<ApiResponse<{ students: any[] }>> {
    const response: AxiosResponse<ApiResponse<{ students: any[] }>> = await this.api.get('/admin/assignments/available-students', {
      params: { academicYearId }
    });
    return response.data;
  }

  async setSchoolQuota(schoolId: string, quotaData: { academic_year_id: number; max_students: number; max_teachers: number; is_open?: boolean }): Promise<ApiResponse<{ quota: any }>> {
    const response: AxiosResponse<ApiResponse<{ quota: any }>> = await this.api.post(`/admin/school-system/${schoolId}/quotas`, quotaData);
    return response.data;
  }

  async updateEnrollmentStatus(schoolId: string, data: { academic_year_id: number; is_open: boolean }): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.put(`/admin/school-system/${schoolId}/enrollment-status`, data);
    return response.data;
  }

  async assignStudent(schoolId: string, studentData: { student_id: number; academic_year_id: number; teacher_id?: number; start_date?: string; end_date?: string; notes?: string }): Promise<ApiResponse<{ assignmentId: number }>> {
    console.log('🔵 API Service - assignStudent called', {
      schoolId,
      studentData,
      timestamp: new Date().toISOString()
    });
    
    const response: AxiosResponse<ApiResponse<{ assignmentId: number }>> = await this.api.post(`/admin/school-system/${schoolId}/students`, studentData);
    
    console.log('🔵 API Service - assignStudent response', {
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  }

  async removeStudent(assignmentId: number): Promise<ApiResponse> {
    console.log('🔵 API Service - removeStudent called', {
      assignmentId,
      timestamp: new Date().toISOString()
    });
    
    const response: AxiosResponse<ApiResponse> = await this.api.delete(`/admin/school-system/students/${assignmentId}`);
    
    console.log('🔵 API Service - removeStudent response', {
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  }

  async assignTeacher(schoolId: string, teacherData: { teacher_id: number; academic_year_id: number; is_primary?: boolean; max_students?: number }): Promise<ApiResponse<{ assignmentId: number }>> {
    const response: AxiosResponse<ApiResponse<{ assignmentId: number }>> = await this.api.post(`/admin/school-system/${schoolId}/teachers`, teacherData);
    return response.data;
  }

  async removeTeacher(assignmentId: number): Promise<ApiResponse> {
    console.log('🔵 API Service - removeTeacher called', {
      assignmentId,
      timestamp: new Date().toISOString()
    });
    
    const response: AxiosResponse<ApiResponse> = await this.api.delete(`/admin/school-system/teachers/${assignmentId}`);
    
    console.log('🔵 API Service - removeTeacher response', {
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  }

  async setPrimaryTeacher(assignmentId: number): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.put(`/admin/school-system/teachers/${assignmentId}/primary`);
    return response.data;
  }

  // ===== Assignment APIs =====

  async getAllAssignments(params?: { academicYearId?: number; schoolId?: string; status?: string; page?: number; limit?: number }): Promise<ApiResponse<{ assignments: InternshipAssignment[]; total: number; page: number; limit: number; totalPages: number }>> {
    const response: AxiosResponse<ApiResponse<{ assignments: InternshipAssignment[]; total: number; page: number; limit: number; totalPages: number }>> = await this.api.get('/admin/assignments', { params });
    return response.data;
  }

  async getAssignmentById(id: number): Promise<ApiResponse<{ assignment: InternshipAssignment }>> {
    const response: AxiosResponse<ApiResponse<{ assignment: InternshipAssignment }>> = await this.api.get(`/admin/assignments/${id}`);
    return response.data;
  }

  async createAssignment(data: { student_id: number; school_id: string; academic_year_id: number; teacher_id?: number; start_date?: string; end_date?: string; notes?: string }): Promise<ApiResponse<{ assignment: InternshipAssignment }>> {
    const response: AxiosResponse<ApiResponse<{ assignment: InternshipAssignment }>> = await this.api.post('/admin/assignments', data);
    return response.data;
  }

  async updateAssignment(id: number, data: Partial<InternshipAssignment>): Promise<ApiResponse<{ assignment: InternshipAssignment }>> {
    const response: AxiosResponse<ApiResponse<{ assignment: InternshipAssignment }>> = await this.api.put(`/admin/assignments/${id}`, data);
    return response.data;
  }

  async deleteAssignment(id: number): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.delete(`/admin/assignments/${id}`);
    return response.data;
  }

  async getAssignmentStats(params?: { academicYearId?: number; schoolId?: string }): Promise<ApiResponse<{ stats: SchoolStats }>> {
    const response: AxiosResponse<ApiResponse<{ stats: SchoolStats }>> = await this.api.get('/admin/assignments/stats', { params });
    return response.data;
  }

  // ===== Student APIs =====

  async getAvailableSchools(academicYearId?: number): Promise<ApiResponse<{ schools: AvailableSchool[] }>> {
    const params = academicYearId ? { academic_year_id: academicYearId } : {};
    const response: AxiosResponse<ApiResponse<{ schools: AvailableSchool[] }>> = await this.api.get('/student/assignments/available-schools', { params });
    return response.data;
  }

  async getMyAssignments(academicYearId?: number): Promise<ApiResponse<{ assignments: InternshipAssignment[] }>> {
    const params = academicYearId ? { academic_year_id: academicYearId } : {};
    const response: AxiosResponse<ApiResponse<{ assignments: InternshipAssignment[] }>> = await this.api.get('/student/assignments/my', { params });
    return response.data;
  }

  async applyToSchool(schoolId: string, academicYearId: number): Promise<ApiResponse<{ assignment: InternshipAssignment }>> {
    const response: AxiosResponse<ApiResponse<{ assignment: InternshipAssignment }>> = await this.api.post('/student/assignments/apply', {
      school_id: schoolId,
      academic_year_id: academicYearId
    });
    return response.data;
  }

  async cancelApplication(academicYearId: number): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.post('/student/assignments/cancel', {
      academic_year_id: academicYearId
    });
    return response.data;
  }

  async updateSchoolSchedule(schoolId: string, scheduleData: { 
    academic_year_id: number; 
    internship_start_date: string; 
    internship_end_date: string; 
    preparation_start_date?: string; 
    orientation_date?: string; 
    evaluation_date?: string; 
    notes?: string; 
    updated_by: number 
  }): Promise<ApiResponse<{ schedule: any }>> {
    const response: AxiosResponse<ApiResponse<{ schedule: any }>> = await this.api.put(`/admin/school-system/${schoolId}/schedule`, scheduleData);
    return response.data;
  }
}

export const schoolSystemApiService = new SchoolSystemApiService();
export default schoolSystemApiService;

