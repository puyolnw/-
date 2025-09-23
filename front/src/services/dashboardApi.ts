import { apiService } from './api';

export interface DashboardStudent {
  id: number;
  first_name: string;
  last_name: string;
  user_id: string;
  email: string;
}

export interface DashboardSchoolInfo {
  id: number;
  assignment_id: number;
  school_name: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
  enrollment_date: string;
  assignment_status: string;
  assignment_notes?: string;
  teacher_id?: number;
  teacher_first_name?: string;
  teacher_last_name?: string;
  teacher_phone?: string;
  teacher_email?: string;
  academic_year: string;
  academic_semester: string;
  academic_start_date: string;
  academic_end_date: string;
}

export interface DashboardTeachingStats {
  total_teaching_sessions: number;
  total_teaching_hours: number;
  total_lesson_plans: number;
}

export interface DashboardLessonPlanStats {
  total_plans: number;
  active_plans: number;
  draft_plans: number;
  archived_plans: number;
}

export interface DashboardRecentTeachingSession {
  id: number;
  teaching_date: string;
  start_time: string;
  end_time: string;
  class_level: string;
  class_room: string;
  student_count: number;
  lesson_topic: string;
  status: string;
  subject_name?: string;
  lesson_plan_name?: string;
}

export interface DashboardRecentLessonPlan {
  id: number;
  lesson_plan_name: string;
  subject_name: string;
  target_grade: string;
  duration_minutes: number;
  status: string;
  created_at: string;
}

export interface DashboardCompletionRequest {
  id: number;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'revision_required';
  request_date: string;
  approved_date?: string;
  teacher_rating?: number;
  supervisor_rating?: number;
  teacher_comments?: string;
  supervisor_comments?: string;
}

export interface DashboardSummary {
  totalTeachingSessions: number;
  totalTeachingHours: number;
  totalLessonPlans: number;
  isRegistered: boolean;
  hasCompletionRequest: boolean;
  completionRequestStatus: string | null;
}

export interface DashboardData {
  student: DashboardStudent;
  schoolInfo: DashboardSchoolInfo | null;
  teachingStats: DashboardTeachingStats | null;
  lessonPlanStats: DashboardLessonPlanStats | null;
  recentTeachingSessions: DashboardRecentTeachingSession[];
  recentLessonPlans: DashboardRecentLessonPlan[];
  completionRequestStatus: DashboardCompletionRequest | null;
  summary: DashboardSummary;
}

class DashboardApiService {
  // ดึงข้อมูล Dashboard สำหรับนักศึกษา
  async getStudentDashboard(): Promise<{ success: boolean; data?: DashboardData; message?: string }> {
    try {
      console.log('🔵 Frontend - Fetching student dashboard...');
      const response = await apiService.get('/dashboard/student');
      console.log('🔵 Frontend - Dashboard response:', response);
      return response;
    } catch (error: any) {
      console.error('🔵 Frontend - Error fetching dashboard:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch dashboard data'
      };
    }
  }
}

export const dashboardApiService = new DashboardApiService();
