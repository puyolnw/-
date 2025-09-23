import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { useAuth } from '../../hooks/useAuth';
import { teacherApiService, type TeacherDashboardData } from '../../services/teacherApi';

const TeacherDashboard: React.FC = () => {
  const { user, getUserDisplayName } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔵 Frontend - Fetching teacher dashboard...');
      const response = await teacherApiService.getTeacherDashboard();
      console.log('🔵 Frontend - Teacher dashboard response:', response);
      
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        setError(response.message || 'ไม่สามารถดึงข้อมูลแดชบอร์ดได้');
      }
    } catch (error) {
      console.error('🔵 Frontend - Error fetching teacher dashboard:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด');
    } finally {
      setLoading(false);
    }
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
                สวัสดี, {dashboardData?.teacher ? `${dashboardData.teacher.first_name} ${dashboardData.teacher.last_name}` : getUserDisplayName()}
              </h2>
              <p className="text-gray-600">
                ยินดีต้อนรับเข้าสู่ระบบจัดการนักศึกษาฝึกงาน
              </p>
              <p className="text-sm text-secondary-600 mt-1">
                รหัสครูพี่เลี้ยง: {dashboardData?.teacher?.user_id || user?.user_id}
              </p>
              {dashboardData?.schoolInfo && (
                <p className="text-sm text-gray-500 mt-1">
                  โรงเรียน: {dashboardData.schoolInfo.school_name}
                </p>
              )}
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-lg">
                <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">นักศึกษาที่ดูแล</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardData?.stats.totalStudents || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">รายงานรอตรวจ</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardData?.stats.pendingEvaluations || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">การประเมินเสร็จแล้ว</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardData?.stats.completedEvaluations || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">คำร้องรอประเมิน</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardData?.stats.pendingCompletionRequests || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Reviews */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-prompt font-semibold text-gray-900">
                รายงานรอตรวจ
              </h3>
            </div>
            <div className="p-6">
              {dashboardData?.pendingEvaluations && dashboardData.pendingEvaluations.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.pendingEvaluations.slice(0, 5).map((evaluation) => (
                    <div key={`${evaluation.type}-${evaluation.id}`} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {evaluation.student_name} - {evaluation.type === 'teaching_session' ? 'บันทึกการฝึกสอน' : 'แผนการสอน'}
                        </p>
                        <p className="text-sm text-gray-500">
                          ส่งเมื่อ {new Date(evaluation.submitted_at).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                      <button className="px-3 py-1 bg-secondary-100 text-secondary-800 text-sm font-medium rounded-full hover:bg-secondary-200 transition-colors">
                        ตรวจสอบ
                      </button>
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
                  <p className="text-sm text-gray-500">ไม่มีรายงานรอตรวจ</p>
                </div>
              )}
            </div>
          </div>

          {/* Student Progress */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-prompt font-semibold text-gray-900">
                ความคืบหน้านักศึกษา
              </h3>
            </div>
            <div className="p-6">
              {dashboardData?.recentStudents && dashboardData.recentStudents.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-green-600 font-medium text-sm">{student.first_name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                          <p className="text-sm text-gray-500">ความคืบหน้า {student.progress}%</p>
                        </div>
                      </div>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            student.progress >= 80 ? 'bg-green-600' : 
                            student.progress >= 60 ? 'bg-blue-600' : 
                            'bg-yellow-600'
                          }`} 
                          style={{ width: `${student.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">ไม่มีนักศึกษาที่ดูแล</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => navigate('/teacher/students')}
              className="flex items-center p-4 bg-secondary-50 hover:bg-secondary-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-secondary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="font-medium text-secondary-700">จัดการนักศึกษา</span>
            </button>
            <button 
              onClick={() => navigate('/teacher/evaluations')}
              className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="font-medium text-blue-700">ประเมินการฝึกงาน</span>
            </button>
            <button className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200">
              <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="font-medium text-green-700">ดูรายงาน</span>
            </button>
          </div>
        </div>
      </div>
    </LoggedLayout>
  );
};

export default TeacherDashboard;
