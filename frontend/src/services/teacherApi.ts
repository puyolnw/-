import { apiService } from './api';

export interface TeacherDashboardData {
  teacher: {
    id: number;
    first_name: string;
    last_name: string;
    user_id: string;
    email: string;
  };
  schoolInfo: {
    school_id: string;
    school_name: string;
    address: string;
    phone: string;
  };
  stats: {
    totalStudents: number;
    pendingEvaluations: number;
    completedEvaluations: number;
    pendingCompletionRequests: number;
  };
  recentStudents: Array<{
    id: number;
    first_name: string;
    last_name: string;
    user_id: string;
    progress: number;
    lastActivity: string;
    status: string;
  }>;
  pendingEvaluations: Array<{
    id: number;
    student_id: number;
    student_name: string;
    type: string;
    submitted_at: string;
    status: string;
  }>;
}

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  user_id: string;
  email: string;
  student_code: string;
  assignment_id: number;
  enrollment_date: string;
  status: string;
  progress: number;
  total_teaching_sessions: number;
  total_teaching_hours: number;
  total_lesson_plans: number;
  last_activity: string;
}

export interface TeachingSession {
  id: number;
  student_id: number;
  student_name: string;
  lesson_plan_name: string;
  subject_name: string;
  teaching_date: string;
  start_time: string;
  end_time: string;
  status: string;
  submitted_at: string;
  teacher_feedback?: string;
  teacher_rating?: number;
}

export interface LessonPlan {
  id: number;
  student_id: number;
  student_name: string;
  lesson_plan_name: string;
  subject_name: string;
  status: string;
  created_at: string;
  teacher_feedback?: string;
  teacher_rating?: number;
}

export interface CompletionRequest {
  id: number;
  student_id: number;
  student_name: string;
  request_date: string;
  status: string;
  total_teaching_hours: number;
  total_lesson_plans: number;
  total_teaching_sessions: number;
  self_evaluation: string;
  teacher_comments?: string;
  teacher_rating?: number;
  teacher_reviewed_at?: string;
}

class TeacherApiService {
  // ดึงข้อมูล Dashboard ของครูพี่เลี้ยง
  async getTeacherDashboard(): Promise<{ success: boolean; data?: TeacherDashboardData; message?: string }> {
    try {
      console.log('🔵 Frontend - Fetching teacher dashboard...');
      const response = await apiService.get('/teacher/dashboard');
      console.log('🔵 Frontend - Teacher dashboard response:', response);
      return response;
    } catch (error: any) {
      console.error('Error fetching teacher dashboard:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลแดชบอร์ดได้'
      };
    }
  }

  // ดึงรายชื่อนักศึกษาที่ดูแล
  async getMyStudents(): Promise<{ success: boolean; data?: Student[]; message?: string }> {
    try {
      console.log('🔵 Frontend - Fetching my students...');
      const response = await apiService.get('/teacher/students');
      console.log('🔵 Frontend - My students response:', response);
      return response;
    } catch (error: any) {
      console.error('Error fetching my students:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลนักศึกษาได้'
      };
    }
  }

  // ดึงบันทึกการฝึกสอนที่รอการประเมิน
  async getPendingTeachingSessions(): Promise<{ success: boolean; data?: TeachingSession[]; message?: string }> {
    try {
      console.log('🔵 Frontend - Fetching pending teaching sessions...');
      const response = await apiService.get('/teacher/teaching-sessions/pending');
      console.log('🔵 Frontend - Pending teaching sessions response:', response);
      return response;
    } catch (error: any) {
      console.error('Error fetching pending teaching sessions:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลบันทึกการฝึกสอนได้'
      };
    }
  }

  // ดึงแผนการสอนที่รอการประเมิน
  async getPendingLessonPlans(): Promise<{ success: boolean; data?: LessonPlan[]; message?: string }> {
    try {
      console.log('🔵 Frontend - Fetching pending lesson plans...');
      const response = await apiService.get('/teacher/lesson-plans/pending');
      console.log('🔵 Frontend - Pending lesson plans response:', response);
      return response;
    } catch (error: any) {
      console.error('Error fetching pending lesson plans:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลแผนการสอนได้'
      };
    }
  }

  // ดึงคำร้องขอสำเร็จการฝึกที่รอการประเมิน
  async getPendingCompletionRequests(): Promise<{ success: boolean; data?: CompletionRequest[]; message?: string }> {
    try {
      console.log('🔵 Frontend - Fetching pending completion requests...');
      const response = await apiService.get('/teacher/completion-requests/pending');
      console.log('🔵 Frontend - Pending completion requests response:', response);
      return response;
    } catch (error: any) {
      console.error('Error fetching pending completion requests:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลคำร้องขอสำเร็จการฝึกได้'
      };
    }
  }

  // ประเมินบันทึกการฝึกสอน
  async evaluateTeachingSession(sessionId: number, feedback: string, rating: number): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔵 Frontend - Evaluating teaching session:', { sessionId, feedback, rating });
      const response = await apiService.put(`/teacher/teaching-sessions/${sessionId}/evaluate`, {
        teacher_feedback: feedback,
        teacher_rating: rating
      });
      console.log('🔵 Frontend - Evaluate teaching session response:', response);
      return response;
    } catch (error: any) {
      console.error('Error evaluating teaching session:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถประเมินบันทึกการฝึกสอนได้'
      };
    }
  }

  // ประเมินแผนการสอน
  async evaluateLessonPlan(planId: number, feedback: string, rating: number): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔵 Frontend - Evaluating lesson plan:', { planId, feedback, rating });
      const response = await apiService.put(`/teacher/lesson-plans/${planId}/evaluate`, {
        teacher_feedback: feedback,
        teacher_rating: rating
      });
      console.log('🔵 Frontend - Evaluate lesson plan response:', response);
      return response;
    } catch (error: any) {
      console.error('Error evaluating lesson plan:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถประเมินแผนการสอนได้'
      };
    }
  }

  // ประเมินคำร้องขอสำเร็จการฝึก
  async evaluateCompletionRequest(requestId: number, comments: string, rating: number, status: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔵 Frontend - Evaluating completion request:', { requestId, comments, rating, status });
      const response = await apiService.put(`/teacher/completion-requests/${requestId}/evaluate`, {
        teacher_comments: comments,
        teacher_rating: rating,
        status: status
      });
      console.log('🔵 Frontend - Evaluate completion request response:', response);
      return response;
    } catch (error: any) {
      console.error('Error evaluating completion request:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถประเมินคำร้องขอสำเร็จการฝึกได้'
      };
    }
  }

  // ดึงข้อมูลโรงเรียนของครูพี่เลี้ยง
  async getMySchoolInfo(): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      console.log('🔵 Frontend - Fetching my school info...');
      const response = await apiService.get('/teacher/school-info');
      console.log('🔵 Frontend - My school info response:', response);
      return response;
    } catch (error: any) {
      console.error('Error fetching my school info:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลโรงเรียนได้'
      };
    }
  }

  // ดึงรายละเอียดนักศึกษา
  async getStudentDetail(studentId: number): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      console.log('🔵 Frontend - Fetching student detail for ID:', studentId);
      const response = await apiService.get(`/teacher/students/${studentId}`);
      console.log('🔵 Frontend - Student detail response:', response);
      return response;
    } catch (error: any) {
      console.error('Error fetching student detail:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลนักศึกษาได้'
      };
    }
  }

  // ส่งการประเมินแบบละเอียด
  async submitDetailedEvaluation(evaluationData: {
    teachingSessionId: number;
    criteria: Array<{
      id: string;
      name: string;
      description: string;
      rating: number;
      feedback: string;
    }>;
    overallFeedback: string;
    overallRating: number;
    passStatus: 'pass' | 'fail';
    passReason: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔵 Frontend - Submitting detailed evaluation:', evaluationData);
      const response = await apiService.post('/teacher/evaluations/detailed', evaluationData);
      console.log('🔵 Frontend - Submit detailed evaluation response:', response);
      return response;
    } catch (error: any) {
      console.error('Error submitting detailed evaluation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถส่งการประเมินได้'
      };
    }
  }
}

export const teacherApiService = new TeacherApiService();
