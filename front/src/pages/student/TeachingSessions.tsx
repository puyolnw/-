import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { teachingSessionApiService, type TeachingSession, type TeachingSessionStats, type AvailableLessonPlan } from '../../services/teachingSessionApi';

const TeachingSessions: React.FC = () => {
  const navigate = useNavigate();
  const [teachingSessions, setTeachingSessions] = useState<TeachingSession[]>([]);
  const [stats, setStats] = useState<TeachingSessionStats | null>(null);
  const [availableLessonPlans, setAvailableLessonPlans] = useState<AvailableLessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TeachingSession | null>(null);

  // ดึงข้อมูลบันทึกการฝึกสอน
  const fetchTeachingSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page: currentPage,
        limit: 10
      };

      if (selectedStatus) params.status = selectedStatus;
      if (selectedSubject) params.subject_id = selectedSubject;

      const response = await teachingSessionApiService.getMyTeachingSessions(params);
      console.log('🔵 Frontend - Teaching sessions response:', response);
      console.log('🔵 Frontend - Response success:', response.success);
      console.log('🔵 Frontend - Response data:', response.data);
      console.log('🔵 Frontend - Response message:', response.message);
      
      if (response.success && response.data) {
        console.log('🔵 Frontend - Setting teaching sessions:', response.data.teachingSessions);
        setTeachingSessions(response.data.teachingSessions || []);
        setStats(response.data.stats);
        setTotalPages(Math.ceil((response.data.pagination?.total || 0) / 10));
      } else {
        console.error('🔴 Frontend - API response failed:', response);
        setError(response.message || 'Failed to fetch teaching sessions');
      }
    } catch (error) {
      console.error('Error fetching teaching sessions:', error);
      setError('Failed to fetch teaching sessions');
    } finally {
      setLoading(false);
    }
  };

  // ดึงข้อมูลแผนการสอนที่ใช้ได้
  const fetchAvailableLessonPlans = async () => {
    try {
      const response = await teachingSessionApiService.getAvailableLessonPlans();
      if (response.success && response.data) {
        setAvailableLessonPlans(response.data);
      }
    } catch (error) {
      console.error('Error fetching available lesson plans:', error);
    }
  };

  useEffect(() => {
    fetchTeachingSessions();
    fetchAvailableLessonPlans();
  }, [currentPage, selectedStatus, selectedSubject]);

  // ฟิลเตอร์
  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleSubjectFilter = (subjectId: number | null) => {
    setSelectedSubject(subjectId);
    setCurrentPage(1);
  };

  // Handler functions for buttons
  const handleViewSession = (session: TeachingSession) => {
    navigate(`/student/teaching-sessions/${session.id}`);
  };

  const handleEditSession = (session: TeachingSession) => {
    navigate(`/student/teaching-sessions/edit/${session.id}`);
  };

  const handleDeleteSession = (session: TeachingSession) => {
    setSelectedSession(session);
    setShowDeleteModal(true);
  };

  const handleCreateSession = () => {
    // Navigate to create session page
    console.log('Navigate to create session page');
    navigate('/student/teaching-sessions/create');
  };

  // สถานะ badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { 
        bg: 'bg-gradient-to-r from-gray-100 to-gray-200', 
        text: 'text-gray-800', 
        label: 'ร่าง',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      },
      submitted: { 
        bg: 'bg-gradient-to-r from-blue-100 to-blue-200', 
        text: 'text-blue-800', 
        label: 'ส่งแล้ว',
        icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
      },
      reviewed: { 
        bg: 'bg-gradient-to-r from-green-100 to-green-200', 
        text: 'text-green-800', 
        label: 'ตรวจแล้ว',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} shadow-sm border`}>
        <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
        </svg>
        {config.label}
      </span>
    );
  };

  // จัดรูปแบบวันที่
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // จัดรูปแบบเวลา
  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01 ${timeString}`).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // จัดรูปแบบระยะเวลา
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours} ชม. ${mins} นาที`;
    }
    return `${mins} นาที`;
  };

  return (
    <LoggedLayout currentPage="การฝึกสอน">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">การฝึกสอน</h1>
                <p className="text-green-100">บันทึกการฝึกสอนและประเมินผล</p>
              </div>
            </div>
            <button
              onClick={handleCreateSession}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-3 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              บันทึกใหม่
            </button>
          </div>
        </div>

        {/* Stats Cards - Only useful stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">เวลาสอนรวม</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {Math.round(stats.total_minutes / 60)}
                  </p>
                  <p className="text-sm text-blue-700">ชั่วโมง</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-lg border border-green-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">คะแนนเฉลี่ย</p>
                  <p className="text-3xl font-bold text-green-900">
                    {stats.average_rating ? Number(stats.average_rating).toFixed(1) : '-'}
                  </p>
                  <p className="text-sm text-green-700">จาก 5.0</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">วันสอน</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.teaching_days}</p>
                  <p className="text-sm text-purple-700">วัน</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">ตัวกรองข้อมูล</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>กรองข้อมูล</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">สถานะ</label>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-white hover:border-gray-400"
              >
                <option value="">ทั้งหมด</option>
                <option value="submitted">ส่งแล้ว</option>
                <option value="reviewed">ตรวจแล้ว</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">วิชา</label>
              <select
                value={selectedSubject || ''}
                onChange={(e) => handleSubjectFilter(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-white hover:border-gray-400"
              >
                <option value="">ทั้งหมด</option>
                {availableLessonPlans.map((plan) => (
                  <option key={plan.subject_id} value={plan.subject_id}>
                    {plan.subject_code} - {plan.subject_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">การดำเนินการ</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedStatus('');
                    setSelectedSubject(null);
                  }}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  รีเซ็ต
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Teaching Sessions List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 text-lg">กำลังโหลดข้อมูล...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-600 text-lg mb-4">{error}</p>
              <button
                onClick={fetchTeachingSessions}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                ลองใหม่
              </button>
            </div>
          ) : teachingSessions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">ยังไม่มีบันทึกการฝึกสอน</h3>
              <p className="text-gray-600 mb-6">เริ่มต้นการฝึกสอนของคุณด้วยการบันทึกครั้งแรก</p>
              <button
                onClick={handleCreateSession}
                className="px-8 py-3 bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-lg hover:from-teal-700 hover:to-green-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                บันทึกการฝึกสอนแรก
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        วันที่สอน
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        เวลา
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        วิชา
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        หัวข้อ
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        ระยะเวลา
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        ไฟล์
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        การดำเนินการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {teachingSessions.map((session, index) => (
                      <tr key={session.id} className={`hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(session.teaching_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTime(session.start_time)} - {formatTime(session.end_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {session.subject_code} - {session.subject_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {session.lesson_topic || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.duration_minutes ? formatDuration(session.duration_minutes) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(session.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.file_count || 0} ไฟล์
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleViewSession(session)}
                              className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors duration-200"
                            >
                              <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              ดู
                            </button>
                            <button 
                              onClick={() => handleEditSession(session)}
                              className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-full hover:bg-green-200 transition-colors duration-200"
                            >
                              <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              แก้ไข
                            </button>
                            <button 
                              onClick={() => handleDeleteSession(session)}
                              className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-full hover:bg-red-200 transition-colors duration-200"
                            >
                              <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      แสดงหน้า <span className="font-semibold text-gray-900">{currentPage}</span> จาก <span className="font-semibold text-gray-900">{totalPages}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        ก่อนหน้า
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        ถัดไป
                        <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* View Modal */}
        {showViewModal && selectedSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">รายละเอียดบันทึกการฝึกสอน</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="font-medium">วันที่สอน:</label>
                  <p>{formatDate(selectedSession.teaching_date)}</p>
                </div>
                <div>
                  <label className="font-medium">เวลา:</label>
                  <p>{formatTime(selectedSession.start_time)} - {formatTime(selectedSession.end_time)}</p>
                </div>
                <div>
                  <label className="font-medium">วิชา:</label>
                  <p>{selectedSession.subject_code} - {selectedSession.subject_name}</p>
                </div>
                <div>
                  <label className="font-medium">หัวข้อ:</label>
                  <p>{selectedSession.lesson_topic || '-'}</p>
                </div>
                <div>
                  <label className="font-medium">สถานะ:</label>
                  <div className="mt-1">{getStatusBadge(selectedSession.status)}</div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">แก้ไขบันทึกการฝึกสอน</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="text-center py-8">
                <p className="text-gray-600">ฟีเจอร์แก้ไขกำลังพัฒนา</p>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-red-600">ลบบันทึกการฝึกสอน</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                คุณแน่ใจหรือไม่ที่จะลบบันทึกการฝึกสอนนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={async () => {
                    if (selectedSession) {
                      try {
                        console.log('🔴 Frontend - Deleting session ID:', selectedSession.id);
                        const response = await teachingSessionApiService.deleteTeachingSession(selectedSession.id);
                        console.log('🔴 Frontend - Delete response:', response);
                        
                        if (response.success) {
                          alert('ลบบันทึกการฝึกสอนสำเร็จ!');
                          setShowDeleteModal(false);
                          setSelectedSession(null);
                          // รีเฟรชข้อมูล
                          fetchTeachingSessions();
                        } else {
                          const errorMessage = response.message || 'ไม่สามารถลบข้อมูลได้';
                          alert(`ไม่สามารถลบบันทึกได้: ${errorMessage}`);
                        }
                      } catch (error) {
                        console.error('🔴 Frontend - Error deleting session:', error);
                        alert('เกิดข้อผิดพลาดในการลบข้อมูล');
                      }
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LoggedLayout>
  );
};

export default TeachingSessions;
