import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { useAuth } from '../../hooks/useAuth';
import { dashboardApiService, type DashboardData } from '../../services/dashboardApi';

const StudentDashboard: React.FC = () => {
  const { user, getUserDisplayName } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔵 Frontend - Fetching dashboard data...');
      const response = await dashboardApiService.getStudentDashboard();
      console.log('🔵 Frontend - Dashboard response:', response);
      
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        setError(response.message || 'ไม่สามารถดึงข้อมูล Dashboard ได้');
      }
    } catch (error) {
      console.error('🔵 Frontend - Error fetching dashboard:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล Dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LoggedLayout currentPage="แดชบอร์ด">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </LoggedLayout>
    );
  }

  if (error) {
    return (
      <LoggedLayout currentPage="แดชบอร์ด">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={fetchDashboardData}
                      className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      ลองใหม่
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout currentPage="แดชบอร์ด">
      <div className="space-y-6">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-prompt font-semibold text-gray-900 mb-2">
                สวัสดี, {getUserDisplayName()}
              </h2>
              <p className="text-gray-600">
                ยินดีต้อนรับเข้าสู่ระบบฝึกประสบการณ์วิชาชีพ
              </p>
              <p className="text-sm text-primary-600 mt-1">
                รหัสนักศึกษา: {user?.user_id}
              </p>
              {dashboardData?.schoolInfo && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">โรงเรียน:</span> {dashboardData.schoolInfo.school_name}
                  </p>
                  {dashboardData.schoolInfo.teacher_first_name && (
                    <p className="text-sm text-blue-800 mt-1">
                      <span className="font-medium">ครูพี่เลี้ยง:</span> {dashboardData.schoolInfo.teacher_first_name} {dashboardData.schoolInfo.teacher_last_name}
                    </p>
                  )}
                </div>
              )}
              {!dashboardData?.summary.isRegistered && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">⚠️ ยังไม่ได้ลงทะเบียนโรงเรียน</span>
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    กรุณาลงทะเบียนโรงเรียนเพื่อเริ่มการฝึกประสบการณ์
                  </p>
                </div>
              )}
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">บันทึกการฝึกสอน</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData?.summary.totalTeachingSessions || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ชั่วโมงสอนรวม</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData?.summary.totalTeachingHours || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">แผนการสอน</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData?.summary.totalLessonPlans || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">สถานะคำร้อง</p>
                <p className="text-lg font-semibold text-gray-900">
                  {dashboardData?.summary.hasCompletionRequest ? (
                    <span className="text-green-600">ยื่นแล้ว</span>
                  ) : (
                    <span className="text-gray-500">ยังไม่ยื่น</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Teaching Sessions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-prompt font-semibold text-gray-900">
                  บันทึกการฝึกสอนล่าสุด
                </h3>
                <button
                  onClick={() => navigate('/student/teaching-sessions')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  ดูทั้งหมด
                </button>
              </div>
            </div>
            <div className="p-6">
              {dashboardData?.recentTeachingSessions && dashboardData.recentTeachingSessions.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentTeachingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{session.lesson_topic}</p>
                        <p className="text-sm text-gray-500">
                          {session.class_level || 'ไม่ระบุ'} - {session.class_room || 'ไม่ระบุ'} ({session.student_count || 0} คน)
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(session.teaching_date).toLocaleDateString('th-TH')} {session.start_time}-{session.end_time}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        session.status === 'reviewed' ? 'bg-green-100 text-green-800' :
                        session.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status === 'reviewed' ? 'ตรวจแล้ว' :
                         session.status === 'submitted' ? 'ส่งแล้ว' : 'ร่าง'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">ยังไม่มีบันทึกการฝึกสอน</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Lesson Plans */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-prompt font-semibold text-gray-900">
                  แผนการสอนล่าสุด
                </h3>
                <button
                  onClick={() => navigate('/student/lesson-plans')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  ดูทั้งหมด
                </button>
              </div>
            </div>
            <div className="p-6">
              {dashboardData?.recentLessonPlans && dashboardData.recentLessonPlans.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentLessonPlans.map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{plan.lesson_plan_name}</p>
                        <p className="text-sm text-gray-500">
                          {plan.subject_name} - {plan.target_grade} ({plan.duration_minutes} นาที)
                        </p>
                        <p className="text-xs text-gray-400">
                          สร้างเมื่อ: {new Date(plan.created_at).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        plan.status === 'active' ? 'bg-green-100 text-green-800' :
                        plan.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {plan.status === 'active' ? 'ใช้งาน' :
                         plan.status === 'draft' ? 'ร่าง' : 'เก็บถาวร'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">ยังไม่มีแผนการสอน</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-prompt font-semibold text-gray-900 mb-4">
            การดำเนินการด่วน
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/student/teaching-sessions/create')}
              className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium text-blue-700">สร้างบันทึกการฝึกสอน</span>
            </button>
            <button 
              onClick={() => navigate('/student/lesson-plans')}
              className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="font-medium text-green-700">จัดการแผนการสอน</span>
            </button>
            <button 
              onClick={() => navigate('/student/school')}
              className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="font-medium text-purple-700">ข้อมูลโรงเรียน</span>
            </button>
            <button 
              onClick={() => navigate('/student/messages')}
              className="flex items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="font-medium text-orange-700">ข้อความ</span>
            </button>
          </div>
        </div>
      </div>
    </LoggedLayout>
  );
};

export default StudentDashboard;
