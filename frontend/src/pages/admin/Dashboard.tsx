import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { useAuth } from '../../hooks/useAuth';
import { adminApiService } from '../../services/adminApi';

interface DashboardData {
  overview: {
    total_schools: number;
    total_users: number;
    total_students: number;
    total_teachers: number;
    total_supervisors: number;
    total_admins: number;
    active_internships: number;
    active_students: number;
    completed_students: number;
  };
  evaluations: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    waiting: number;
    avg_score: number;
  };
  teaching_sessions: {
    total: number;
    students_with_sessions: number;
    avg_class_size: number;
    approved: number;
    draft: number;
  };
  lesson_plans: {
    total: number;
    students_with_plans: number;
    approved: number;
    draft: number;
  };
  recent_evaluations: any[];
  recent_teaching_sessions: any[];
  recent_schools: any[];
  recent_users: any[];
}

const AdminDashboard: React.FC = () => {
  const { getUserDisplayName } = useAuth();
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
      const response = await adminApiService.getDashboard();
      
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
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'รอดำเนินการ' },
      'approved': { color: 'bg-blue-100 text-blue-800', text: 'รอประเมิน' },
      'supervisor_approved': { color: 'bg-green-100 text-green-800', text: 'ผ่าน' },
      'supervisor_rejected': { color: 'bg-red-100 text-red-800', text: 'ไม่ผ่าน' },
      'draft': { color: 'bg-gray-100 text-gray-800', text: 'ร่าง' },
      'submitted': { color: 'bg-blue-100 text-blue-800', text: 'ส่งแล้ว' }
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

  const getRoleBadge = (role: string) => {
    const roleMap: { [key: string]: { color: string; text: string } } = {
      'student': { color: 'bg-blue-100 text-blue-800', text: 'นักศึกษา' },
      'teacher': { color: 'bg-green-100 text-green-800', text: 'ครูพี่เลี้ยง' },
      'supervisor': { color: 'bg-purple-100 text-purple-800', text: 'อาจารย์นิเทศ' },
      'admin': { color: 'bg-red-100 text-red-800', text: 'ผู้ดูแลระบบ' }
    };
    
    const roleInfo = roleMap[role] || { color: 'bg-gray-100 text-gray-800', text: role };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleInfo.color}`}>
        {roleInfo.text}
      </span>
    );
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
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบข้อมูล</h2>
            <p className="text-gray-600">ไม่สามารถดึงข้อมูลแดชบอร์ดได้</p>
          </div>
        </div>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout currentPage="แดชบอร์ด">
      <div className="space-y-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">สวัสดี, {getUserDisplayName()}</h1>
          <p className="text-blue-100">ยินดีต้อนรับสู่ระบบจัดการฝึกประสบการณ์วิชาชีพ</p>
        </div>

        {/* Overview Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">โรงเรียนทั้งหมด</p>
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
                <p className="text-sm font-medium text-gray-600">ผู้ใช้ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.overview.total_users}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">นักศึกษาที่กำลังฝึก</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.overview.active_students}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">การประเมินทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.evaluations.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Statistics */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">สถิติผู้ใช้</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">นักศึกษา</span>
                <span className="font-semibold">{dashboardData.overview.total_students}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ครูพี่เลี้ยง</span>
                <span className="font-semibold">{dashboardData.overview.total_teachers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">อาจารย์นิเทศ</span>
                <span className="font-semibold">{dashboardData.overview.total_supervisors}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ผู้ดูแลระบบ</span>
                <span className="font-semibold">{dashboardData.overview.total_admins}</span>
              </div>
            </div>
          </div>

          {/* Evaluation Statistics */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">สถิติการประเมิน</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ผ่าน</span>
                <span className="font-semibold text-green-600">{dashboardData.evaluations.approved}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ไม่ผ่าน</span>
                <span className="font-semibold text-red-600">{dashboardData.evaluations.rejected}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">รอประเมิน</span>
                <span className="font-semibold text-yellow-600">{dashboardData.evaluations.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">คะแนนเฉลี่ย</span>
                <span className="font-semibold">{dashboardData.evaluations.avg_score.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Evaluations */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">การประเมินล่าสุด</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.recent_evaluations.map((evaluation) => (
                  <div key={evaluation.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {evaluation.first_name} {evaluation.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{evaluation.school_name}</p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(evaluation.status)}
                      <p className="text-sm text-gray-500 mt-1">
                        {evaluation.supervisor_average_score && typeof evaluation.supervisor_average_score === 'number' 
                          ? evaluation.supervisor_average_score.toFixed(2) 
                          : '-'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">ผู้ใช้ที่ลงทะเบียนล่าสุด</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.recent_users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{user.school_name || '-'}</p>
                    </div>
                    <div className="text-right">
                      {getRoleBadge(user.role)}
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">การดำเนินการด่วน</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="text-center">
                <svg className="w-8 h-8 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="font-medium text-gray-900">จัดการผู้ใช้</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/schools')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="text-center">
                <svg className="w-8 h-8 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="font-medium text-gray-900">จัดการโรงเรียน</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/teaching-sessions')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="text-center">
                <svg className="w-8 h-8 text-purple-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p className="font-medium text-gray-900">บันทึกฝึกประสบการณ์</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/evaluations')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="text-center">
                <svg className="w-8 h-8 text-orange-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium text-gray-900">การประเมิน</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </LoggedLayout>
  );
};

export default AdminDashboard;