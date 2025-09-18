import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { supervisorApiService } from '../../services/supervisorApi';

interface StudentDetail {
  student: {
    id: number;
    first_name: string;
    last_name: string;
    student_code: string;
    email: string;
    phone: string;
    faculty: string;
    major: string;
    profile_image?: string;
  };
  teacher: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  school: {
    id: number;
    name: string;
    address: string;
    phone: string;
  };
  assignment: {
    id: number;
    enrollment_date: string;
    status: string;
    academic_year_id: number;
  };
  lessonPlans: Array<{
    id: number;
    lesson_plan_name: string;
    subject_id: number;
    description: string;
    objectives: string;
    teaching_methods: string;
    assessment_methods: string;
    duration_minutes: number;
    target_grade: string;
    created_at: string;
    status: string;
  }>;
  teachingSessions: Array<{
    id: number;
    lesson_plan_id: number;
    subject_id: number;
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
  }>;
  academicYear: {
    id: number;
    year: string;
    semester: number;
  };
}

const SupervisorStudentDetail: React.FC = () => {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'lesson-plans' | 'teaching-sessions'>('lesson-plans');

  useEffect(() => {
    if (studentId) {
      fetchStudentDetail();
    }
  }, [studentId]);

  const fetchStudentDetail = async () => {
    try {
      console.log('🔄 Fetching student detail for studentId:', studentId);
      setLoading(true);
      setError(null);

      const response = await supervisorApiService.getStudentDetail(Number(studentId));

      console.log('📡 Student detail response:', response);

      if (response.success && response.data) {
        console.log('✅ Student detail data:', response.data);
        setStudentDetail(response.data);
      } else {
        console.log('❌ Student detail error:', response.message);
        setError(response.message || 'ไม่สามารถดึงข้อมูลนักศึกษาได้');
      }
    } catch (error) {
      console.error('💥 Error fetching student detail:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษา');
    } finally {
      console.log('🏁 Finished fetching student detail, setting loading to false');
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { color: 'bg-gray-100 text-gray-800', text: 'ร่าง' },
      'submitted': { color: 'bg-blue-100 text-blue-800', text: 'ส่งแล้ว' },
      'approved': { color: 'bg-green-100 text-green-800', text: 'อนุมัติ' },
      'rejected': { color: 'bg-red-100 text-red-800', text: 'ปฏิเสธ' },
      'active': { color: 'bg-green-100 text-green-800', text: 'กำลังฝึก' },
      'completed': { color: 'bg-blue-100 text-blue-800', text: 'เสร็จสิ้น' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100 text-gray-800', text: status };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  console.log('🎯 StudentDetail component state:', { loading, error, studentDetail: !!studentDetail, studentId });

  if (loading) {
    console.log('⏳ Showing loading state');
    return (
      <LoggedLayout currentPage="รายละเอียดนักศึกษา">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LoggedLayout>
    );
  }

  if (error || !studentDetail) {
    console.log('❌ Showing error state:', { error, studentDetail: !!studentDetail });
    return (
      <LoggedLayout currentPage="รายละเอียดนักศึกษา">
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">เกิดข้อผิดพลาด</h1>
            <p className="text-red-100">ไม่สามารถโหลดข้อมูลนักศึกษาได้</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">ไม่สามารถโหลดข้อมูลนักศึกษา</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error || 'ไม่พบข้อมูลนักศึกษาที่ระบุ'}</p>
                  <p className="mt-2">กรุณาติดต่อผู้ดูแลระบบเพื่อขอความช่วยเหลือ</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchStudentDetail}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          </div>
        </div>
      </LoggedLayout>
    );
  }

  console.log('🎨 Rendering main content for StudentDetail');
  return (
    <LoggedLayout currentPage="รายละเอียดนักศึกษา">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">รายละเอียดนักศึกษา</h1>
              <p className="text-blue-100">ข้อมูลการฝึกงานและผลงานของนักศึกษา</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              กลับ
            </button>
          </div>
        </div>

        {/* Student Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {studentDetail.student.first_name.charAt(0)}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {studentDetail.student.first_name} {studentDetail.student.last_name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">รหัสนักศึกษา</p>
                  <p className="font-medium text-gray-900">{studentDetail.student.student_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">คณะ/สาขา</p>
                  <p className="font-medium text-gray-900">{studentDetail.student.faculty}</p>
                  <p className="text-sm text-gray-600">{studentDetail.student.major}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">อีเมล</p>
                  <p className="font-medium text-gray-900">{studentDetail.student.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">เบอร์โทรศัพท์</p>
                  <p className="font-medium text-gray-900">{studentDetail.student.phone}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              {getStatusBadge(studentDetail.assignment.status)}
            </div>
          </div>
        </div>

        {/* Teacher and School Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Teacher Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">ครูพี่เลี้ยง</h3>
            {studentDetail.teacher ? (
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {studentDetail.teacher.first_name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {studentDetail.teacher.first_name} {studentDetail.teacher.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{studentDetail.teacher.email}</p>
                  <p className="text-sm text-gray-600">{studentDetail.teacher.phone}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>ไม่พบข้อมูลครูพี่เลี้ยง</p>
              </div>
            )}
          </div>

          {/* School Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">โรงเรียนฝึกงาน</h3>
            {studentDetail.school ? (
              <div>
                <p className="font-medium text-gray-900 mb-2">{studentDetail.school.name}</p>
                <p className="text-sm text-gray-600 mb-1">{studentDetail.school.address}</p>
                <p className="text-sm text-gray-600">{studentDetail.school.phone}</p>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>ไม่พบข้อมูลโรงเรียน</p>
              </div>
            )}
          </div>
        </div>

        {/* Assignment Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">ข้อมูลการฝึกงาน</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">วันที่เริ่มฝึกงาน</p>
              <p className="font-medium text-gray-900">{formatDate(studentDetail.assignment.enrollment_date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">ปีการศึกษา</p>
              <p className="font-medium text-gray-900">{studentDetail.academicYear ? studentDetail.academicYear.year : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">ภาคเรียน</p>
              <p className="font-medium text-gray-900">ภาคเรียนที่ {studentDetail.academicYear ? studentDetail.academicYear.semester : '-'}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('lesson-plans')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'lesson-plans'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                แผนการสอน ({studentDetail.lessonPlans.length})
              </button>
              <button
                onClick={() => setActiveTab('teaching-sessions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'teaching-sessions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                บันทึกการสอน ({studentDetail.teachingSessions.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'lesson-plans' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">แผนการสอน</h3>
                {studentDetail.lessonPlans.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg">ยังไม่มีแผนการสอน</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {studentDetail.lessonPlans.map((plan) => (
                      <div key={plan.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{plan.lesson_plan_name}</h4>
                            <p className="text-sm text-gray-600">ชั้น {plan.target_grade} - {plan.duration_minutes} นาที</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(plan.status)}
                            <span className="text-sm text-gray-500">{formatDate(plan.created_at)}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">วัตถุประสงค์</p>
                            <p className="text-sm text-gray-600 line-clamp-2">{plan.objectives}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">วิธีการสอน</p>
                            <p className="text-sm text-gray-600 line-clamp-2">{plan.teaching_methods}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'teaching-sessions' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">บันทึกการสอน</h3>
                {studentDetail.teachingSessions.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg">ยังไม่มีบันทึกการสอน</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {studentDetail.teachingSessions.map((session) => (
                      <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{session.lesson_topic}</h4>
                            <p className="text-sm text-gray-600">ชั้น {session.class_level} - ห้อง {session.class_room}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(session.status)}
                            <span className="text-sm text-gray-500">{formatDate(session.teaching_date)}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">วันที่สอน</p>
                            <p className="text-sm text-gray-600">{formatDate(session.teaching_date)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">เวลา</p>
                            <p className="text-sm text-gray-600">
                              {formatTime(session.start_time)} - {formatTime(session.end_time)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">จำนวนนักเรียน</p>
                            <p className="text-sm text-gray-600">{session.student_count} คน</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">สรุปการสอน</p>
                            <p className="text-sm text-gray-600 line-clamp-2">{session.lesson_summary}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">การสะท้อนคิด</p>
                            <p className="text-sm text-gray-600 line-clamp-2">{session.reflection}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </LoggedLayout>
  );
};

export default SupervisorStudentDetail;
