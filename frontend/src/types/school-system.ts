// Types สำหรับระบบโรงเรียนใหม่

export interface AcademicYear {
  id: number;
  year: string;
  semester: number;
  start_date: string;
  end_date: string;
  registration_start: string;
  registration_end: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SchoolQuota {
  id: number;
  school_id: string;
  academic_year_id: number;
  max_students: number;
  current_students: number;
  max_teachers: number;
  current_teachers: number;
  is_open: boolean;
  created_at: string;
  updated_at: string;
}

export interface SchoolOverview {
  id: number;
  school_id: string;
  school_name: string;
  address: string;
  phone?: string;
  academic_year_id: number;
  year: string;
  semester: number;
  academic_start_date?: string;
  academic_end_date?: string;
  internship_start_date?: string;
  internship_end_date?: string;
  preparation_start_date?: string;
  orientation_date?: string;
  evaluation_date?: string;
  schedule_notes?: string;
  max_students: number;
  current_students: number;
  max_teachers: number;
  current_teachers: number;
  is_open: boolean;
  active_students: number;
  completed_students: number;
  cancelled_students: number;
  assigned_teachers: number;
  primary_teachers: number;
  available_slots: number;
  academic_year?: AcademicYear;
}

export interface InternshipAssignment {
  id: number;
  student_id: number;
  school_id: string;
  academic_year_id: number;
  teacher_id?: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  enrollment_date: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // จาก JOIN
  student_name?: string;
  student_code?: string;
  faculty?: string;
  major?: string;
  school_name?: string;
  teacher_name?: string;
  year?: string;
  semester?: number;
}

export interface SchoolTeacher {
  id: number;
  teacher_id: number;
  school_id: string;
  academic_year_id: number;
  is_primary: boolean;
  max_students: number;
  current_students: number;
  created_at: string;
  updated_at: string;
  // จาก JOIN
  teacher_name?: string;
  email?: string;
  phone?: string;
  user_id?: string;
}

export interface AvailableSchool {
  id: number;
  school_id: string;
  school_name: string;
  address: string;
  phone?: string;
  max_students: number;
  current_students: number;
  max_teachers: number;
  current_teachers: number;
  available_slots: number;
  teachers?: string;
  enrollment_status: 'เปิดรับสมัคร' | 'เต็มแล้ว' | 'ปิดรับสมัคร';
  can_apply: boolean;
}

export interface SchoolStats {
  total_assignments: number;
  active_count: number;
  completed_count: number;
  cancelled_count: number;
}

export interface AcademicYearStats {
  id: number;
  year: string;
  semester: number;
  participating_schools: number;
  active_students: number;
  completed_students: number;
  assigned_teachers: number;
  total_quota: number;
}