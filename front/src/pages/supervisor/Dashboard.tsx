import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { useAuth } from '../../hooks/useAuth';
import { supervisorApiService } from '../../services/supervisorApi';

interface DashboardData {
  overview: {
    total_schools: number;
    total_teachers: number;
    total_students: number;
    active_students: number;
    completed_students: number;
  };
  evaluations: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
  };
  pending_evaluations: Array<{
    id: number;
    created_at: string;
    first_name: string;
    last_name: string;
    student_code: string;
    school_name: string;
    teacher_first_name: string;
    teacher_last_name: string;
    total_teaching_hours: number;
    total_lesson_plans: number;
    total_teaching_sessions: number;
  }>;
  recent_evaluations: Array<{
    id: number;
    created_at: string;
    supervisor_average_score: number;
    status: string;
    first_name: string;
    last_name: string;
    student_code: string;
    school_name: string;
  }>;
  students_to_follow: Array<{
    id: number;
    first_name: string;
    last_name: string;
    student_code: string;
    school_name: string;
    teacher_first_name: string;
    teacher_last_name: string;
    enrollment_date: string;
    status: string;
    teaching_sessions_count: number;
    lesson_plans_count: number;
    last_teaching_date: string;
  }>;
  recent_schools: Array<{
    school_name: string;
    address: string;
    student_count: number;
    teacher_count: number;
    last_activity_date: string;
  }>;
}

const SupervisorDashboard: React.FC = () => {
  const { user, getUserDisplayName } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await supervisorApiService.getDashboard();
      
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        setError(response.message || 'ไม่สามารถดึงข้อมูลแดชบอร์ดได้');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { color: string; text: string } } = {
      'supervisor_approved': { color: 'bg-green-100 text-green-800', text: 'ผ่าน' },
      'supervisor_rejected': { color: 'bg-red-100 text-red-800', text: 'ไม่ผ่าน' },
      'approved': { color: 'bg-yellow-100 text-yellow-800', text: 'รอประเมิน' },
      'active': { color: 'bg-blue-100 text-blue-800', text: 'กำลังฝึกงาน' },
      'completed': { color: 'bg-gray-100 text-gray-800', text: 'เสร็จสิ้น' }
    };
    
    const statusInfo = statusMap[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <LoggedLayout currentPage="แดชบอร์ด">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LoggedLayout>
    );
  }

  if (error) {
    return (
      <LoggedLayout currentPage="แดชบอร์ด">
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">เกิดข้อผิดพลาด</h1>
            <p className="text-red-100">ไม่สามารถโหลดข้อมูลแดชบอร์ดได้</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">ไม่สามารถโหลดข้อมูลแดชบอร์ด</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  <p className="mt-2">กรุณาติดต่อผู้ดูแลระบบเพื่อขอความช่วยเหลือ</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchDashboard}
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

  if (!dashboardData) {
    return (
      <LoggedLayout currentPage="แดชบอร์ด">
        <div className="text-center py-12">
          <p className="text-gray-500">ไม่พบข้อมูลแดชบอร์ด</p>
        </div>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout currentPage="แดชบอร์ด">
      <div className="space-y-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                สวัสดี, {getUserDisplayName()}
              </h1>
              <p className="text-blue-100">
                ยินดีต้อนรับเข้าสู่ระบบนิเทศการฝึกประสบการณ์วิชาชีพ
              </p>
              <p className="text-sm text-blue-200 mt-1">
                รหัสอาจารย์ผู้นิเทศ: {user?.user_id}
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">โรงเรียน</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.overview.total_schools}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ครูพี่เลี้ยง</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.overview.total_teachers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">นักศึกษาทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.overview.total_students}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">กำลังฝึกงาน</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.overview.active_students}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">เสร็จสิ้น</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.overview.completed_students}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">สถิติการประเมิน</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{dashboardData.evaluations.total}</div>
              <div className="text-sm text-gray-600">ทั้งหมด</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{dashboardData.evaluations.approved}</div>
              <div className="text-sm text-gray-600">ผ่าน</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{dashboardData.evaluations.rejected}</div>
              <div className="text-sm text-gray-600">ไม่ผ่าน</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{dashboardData.evaluations.pending}</div>
              <div className="text-sm text-gray-600">รอประเมิน</div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Evaluations */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">การประเมินที่รอดำเนินการ</h3>
                <button 
                  onClick={() => navigate('/supervisor/evaluations')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ดูทั้งหมด
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.pending_evaluations.length > 0 ? (
                  dashboardData.pending_evaluations.map((evaluation) => (
                    <div key={evaluation.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{evaluation.first_name} {evaluation.last_name}</p>
                        <p className="text-sm text-gray-500">{evaluation.school_name}</p>
                        <p className="text-sm text-gray-400">
                          {evaluation.total_teaching_hours} ชั่วโมง • {evaluation.total_lesson_plans} แผน • {evaluation.total_teaching_sessions} ครั้ง
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(evaluation.created_at)}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/supervisor/evaluations/${evaluation.id}`)}
                        className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full hover:bg-yellow-200"
                      >
                        ประเมิน
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>ไม่มีการประเมินที่รอดำเนินการ</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Evaluations */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">การประเมินล่าสุด</h3>
                <button 
                  onClick={() => navigate('/supervisor/evaluations')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ดูทั้งหมด
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.recent_evaluations.length > 0 ? (
                  dashboardData.recent_evaluations.map((evaluation) => (
                    <div key={evaluation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{evaluation.first_name} {evaluation.last_name}</p>
                        <p className="text-sm text-gray-500">{evaluation.school_name}</p>
                        <p className="text-sm text-gray-400">
                          คะแนน: {evaluation.supervisor_average_score && typeof evaluation.supervisor_average_score === 'number' 
                            ? evaluation.supervisor_average_score.toFixed(2) 
                            : '-'}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(evaluation.created_at)}</p>
                      </div>
                      {getStatusBadge(evaluation.status)}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>ไม่มีข้อมูลการประเมินล่าสุด</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Students to Follow */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">นักศึกษาที่ต้องติดตาม</h3>
              <button 
                onClick={() => navigate('/supervisor/schools')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ดูทั้งหมด
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.students_to_follow.length > 0 ? (
                dashboardData.students_to_follow.map((student) => (
                  <div key={student.id} className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                      {getStatusBadge(student.status)}
                    </div>
                    <p className="text-sm text-gray-500">{student.school_name}</p>
                    <p className="text-sm text-gray-400">ครูพี่เลี้ยง: {student.teacher_first_name} {student.teacher_last_name}</p>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>{student.teaching_sessions_count} ครั้งสอน</span>
                      <span>{student.lesson_plans_count} แผน</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      เริ่มฝึกงาน: {formatDate(student.enrollment_date)}
                    </p>
                    {student.last_teaching_date && (
                      <p className="text-xs text-gray-400">
                        สอนล่าสุด: {formatDate(student.last_teaching_date)}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <p>ไม่มีนักศึกษาที่ต้องติดตาม</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">การดำเนินการด่วน</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/supervisor/evaluations')}
              className="flex items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-yellow-700">ประเมินนักศึกษา</span>
            </button>
            <button 
              onClick={() => navigate('/supervisor/schools')}
              className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="font-medium text-blue-700">จัดการโรงเรียน</span>
            </button>
            <button 
              onClick={() => navigate('/supervisor/chat')}
              className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="font-medium text-green-700">แชท</span>
            </button>
            <button 
              onClick={() => navigate('/supervisor/reports')}
              className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="font-medium text-purple-700">รายงาน</span>
            </button>
          </div>
        </div>
      </div>
    </LoggedLayout>
  );
};

export default SupervisorDashboard;
