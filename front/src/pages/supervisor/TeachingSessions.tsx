import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiService } from '../../services/api';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { useAuth } from '../../hooks/useAuth';

interface TeachingSession {
  id: number;
  lesson_topic: string;
  subject_code: string;
  subject_name: string;
  teaching_date: string;
  start_time: string;
  end_time: string;
  class_level: string;
  class_room: string;
  student_count: number;
  learning_activities: string;
  learning_outcomes: string;
  problems_encountered: string;
  problem_solutions: string;
  improvement_notes: string;
  teacher_feedback: string;
  self_rating: number;
  status: string;
  created_at: string;
  first_name: string;
  last_name: string;
  student_code: string;
  student_user_id: string;
  teacher_first_name: string;
  teacher_last_name: string;
  lesson_plan_name: string;
  school_name: string;
}

interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
}

const SupervisorTeachingSessions: React.FC = () => {
  const { user } = useAuth();
  const [teachingSessions, setTeachingSessions] = useState<TeachingSession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedClassLevel, setSelectedClassLevel] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allTeachingSessions, setAllTeachingSessions] = useState<TeachingSession[]>([]);
  const [selectedTeachingSession, setSelectedTeachingSession] = useState<TeachingSession | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const fetchTeachingSessions = useCallback(async () => {
    try {
      setLoading(true);
      // ดึงข้อมูลทั้งหมดมา
      const params = new URLSearchParams({
        page: '1',
        limit: '1000' // ดึงข้อมูลจำนวนมาก
      });

      const response = await apiService.get(`/supervisor/teaching-sessions?${params}`);
      
      if (response.success) {
        setAllTeachingSessions(response.data);
        setError(null);
      } else {
        setError(response.message || 'ไม่สามารถโหลดข้อมูลบันทึกการฝึกประสบการณ์ได้');
      }
    } catch (error: any) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await apiService.get('/student/lesson-plans/subjects');
      if (response.success) {
        setSubjects(response.data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchTeachingSessions();
  }, [fetchTeachingSessions]);

  // Client-side filtering
  const filteredTeachingSessions = useMemo(() => {
    let filtered = allTeachingSessions;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(session => 
        // หัวข้อการสอน
        (session.lesson_topic && session.lesson_topic.toLowerCase().includes(searchLower)) ||
        // กิจกรรมการเรียนรู้
        (session.learning_activities && session.learning_activities.toLowerCase().includes(searchLower)) ||
        // ผลการเรียนรู้
        (session.learning_outcomes && session.learning_outcomes.toLowerCase().includes(searchLower)) ||
        // ชื่อวิชา
        (session.subject_name && session.subject_name.toLowerCase().includes(searchLower)) ||
        // รหัสวิชา
        (session.subject_code && session.subject_code.toLowerCase().includes(searchLower)) ||
        // ชื่อนักศึกษา
        (session.first_name && session.first_name.toLowerCase().includes(searchLower)) ||
        (session.last_name && session.last_name.toLowerCase().includes(searchLower)) ||
        // รหัสนักศึกษา
        (session.student_code && session.student_code.toLowerCase().includes(searchLower)) ||
        // ชื่ออาจารย์
        (session.teacher_first_name && session.teacher_first_name.toLowerCase().includes(searchLower)) ||
        (session.teacher_last_name && session.teacher_last_name.toLowerCase().includes(searchLower)) ||
        // ชื่อโรงเรียน
        (session.school_name && session.school_name.toLowerCase().includes(searchLower)) ||
        // ชื่อแผนการสอน
        (session.lesson_plan_name && session.lesson_plan_name.toLowerCase().includes(searchLower))
      );
    }

    // Filter by subject
    if (selectedSubject) {
      filtered = filtered.filter(session => session.subject_id.toString() === selectedSubject);
    }

    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter(session => session.status === selectedStatus);
    }

    // Filter by class level
    if (selectedClassLevel) {
      filtered = filtered.filter(session => session.class_level === selectedClassLevel);
    }

    return filtered;
  }, [allTeachingSessions, searchTerm, selectedSubject, selectedStatus, selectedClassLevel]);

  // Pagination
  const paginatedTeachingSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * 10;
    const endIndex = startIndex + 10;
    return filteredTeachingSessions.slice(startIndex, endIndex);
  }, [filteredTeachingSessions, currentPage]);

  // Update total pages
  useEffect(() => {
    setTotalPages(Math.ceil(filteredTeachingSessions.length / 10));
  }, [filteredTeachingSessions]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSubject, selectedStatus, selectedClassLevel]);

  const handleViewTeachingSession = (teachingSession: TeachingSession) => {
    setSelectedTeachingSession(teachingSession);
    setShowViewModal(true);
  };

  // Helper function to highlight search term
  const highlightSearchTerm = (text: string | null | undefined, searchTerm: string) => {
    if (!searchTerm.trim() || !text) return text || '';
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const closeModal = () => {
    setShowViewModal(false);
    setSelectedTeachingSession(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">เสร็จสิ้น</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">รอดำเนินการ</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">ยกเลิก</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">{status}</span>;
    }
  };

  const getRatingStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  if (loading) {
    return (
      <LoggedLayout currentPage="ข้อมูลบันทึกการฝึกประสบการณ์">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LoggedLayout>
    );
  }

  if (error) {
    return (
      <LoggedLayout currentPage="ข้อมูลบันทึกการฝึกประสบการณ์">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout currentPage="ข้อมูลบันทึกการฝึกประสบการณ์">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ข้อมูลบันทึกการฝึกประสบการณ์</h1>
              <p className="text-gray-600 mt-1">บันทึกการฝึกประสบการณ์ทั้งหมดในระบบ</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">ค้นหา</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาหัวข้อการสอน, ชื่อวิชา, ชื่อนักศึกษา, ชื่ออาจารย์..."
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                  style={{ minWidth: '200px' }}
                  maxLength={255}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="ล้างการค้นหา"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วิชา</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">ทุกวิชา</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.subject_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชั้นเรียน</label>
              <select
                value={selectedClassLevel}
                onChange={(e) => setSelectedClassLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">ทุกชั้นเรียน</option>
                <option value="ม.1">ม.1</option>
                <option value="ม.2">ม.2</option>
                <option value="ม.3">ม.3</option>
                <option value="ม.4">ม.4</option>
                <option value="ม.5">ม.5</option>
                <option value="ม.6">ม.6</option>
                <option value="ป.1">ป.1</option>
                <option value="ป.2">ป.2</option>
                <option value="ป.3">ป.3</option>
                <option value="ป.4">ป.4</option>
                <option value="ป.5">ป.5</option>
                <option value="ป.6">ป.6</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">ทุกสถานะ</option>
                <option value="active">ใช้งาน</option>
                <option value="completed">เสร็จสิ้น</option>
                <option value="archived">เก็บถาวร</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSubject('');
                  setSelectedStatus('');
                  setSelectedClassLevel('');
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                ล้างตัวกรอง
              </button>
            </div>
          </div>
        </div>

        {/* Teaching Sessions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">รายการบันทึกการฝึกประสบการณ์</h3>
              <div className="text-sm text-gray-600">
                พบ {filteredTeachingSessions.length} รายการ
                {allTeachingSessions.length !== filteredTeachingSessions.length && (
                  <span className="text-gray-400"> จากทั้งหมด {allTeachingSessions.length} รายการ</span>
                )}
              </div>
            </div>
            {paginatedTeachingSessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">ไม่พบบันทึกการฝึกประสบการณ์ที่ตรงกับเงื่อนไขการค้นหา</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        หัวข้อการสอน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วิชา
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันที่สอน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ชั้นเรียน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        นักศึกษา
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        โรงเรียน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        การดำเนินการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedTeachingSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {highlightSearchTerm(session.lesson_topic, searchTerm)}
                          </div>
                          {session.lesson_plan_name && (
                            <div className="text-sm text-gray-500">
                              แผน: {highlightSearchTerm(session.lesson_plan_name, searchTerm)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{highlightSearchTerm(session.subject_name || '', searchTerm)}</div>
                          <div className="text-sm text-gray-500">{highlightSearchTerm(session.subject_code || '', searchTerm)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(session.teaching_date).toLocaleDateString('th-TH')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {session.start_time} - {session.end_time}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{session.class_level}</div>
                          <div className="text-sm text-gray-500">
                            {session.class_room} ({session.student_count} คน)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {highlightSearchTerm(session.first_name || '', searchTerm)} {highlightSearchTerm(session.last_name || '', searchTerm)}
                          </div>
                          <div className="text-sm text-gray-500">{highlightSearchTerm(session.student_code || '', searchTerm)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{highlightSearchTerm(session.school_name || '-', searchTerm)}</div>
                          {session.teacher_first_name && (
                            <div className="text-sm text-gray-500">
                              ครู: {highlightSearchTerm(session.teacher_first_name, searchTerm)} {highlightSearchTerm(session.teacher_last_name || '', searchTerm)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(session.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewTeachingSession(session)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            ดูรายละเอียด
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ก่อนหน้า
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === i + 1
                          ? 'text-white bg-blue-600'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Teaching Session Detail Modal */}
        {showViewModal && selectedTeachingSession && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    รายละเอียดบันทึกการฝึกประสบการณ์
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  {/* Header with Title and Status */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                          {selectedTeachingSession.lesson_topic}
                        </h2>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(selectedTeachingSession.teaching_date).toLocaleDateString('th-TH')}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {selectedTeachingSession.start_time} - {selectedTeachingSession.end_time}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {selectedTeachingSession.class_level} - {selectedTeachingSession.class_room}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(selectedTeachingSession.status)}
                      </div>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      ข้อมูลพื้นฐาน
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">วิชา</label>
                          <p className="text-sm text-gray-900 font-medium">
                            {selectedTeachingSession.subject_name} ({selectedTeachingSession.subject_code})
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนนักเรียน</label>
                          <p className="text-sm text-gray-900">
                            {selectedTeachingSession.student_count} คน
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สอน</label>
                          <p className="text-sm text-gray-900">
                            {new Date(selectedTeachingSession.teaching_date).toLocaleDateString('th-TH', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">เวลา</label>
                          <p className="text-sm text-gray-900">
                            {selectedTeachingSession.start_time} - {selectedTeachingSession.end_time}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ชั้นเรียน</label>
                          <p className="text-sm text-gray-900">
                            {selectedTeachingSession.class_level}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ห้องเรียน</label>
                          <p className="text-sm text-gray-900">
                            {selectedTeachingSession.class_room}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Student Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border-l-4 border-blue-500">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      ข้อมูลนักศึกษา
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
                          <p className="text-sm text-gray-900 font-medium">
                            {selectedTeachingSession.first_name} {selectedTeachingSession.last_name}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">รหัสนักศึกษา</label>
                          <p className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                            {selectedTeachingSession.student_code}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">โรงเรียน</label>
                          <p className="text-sm text-gray-900">
                            {selectedTeachingSession.school_name || '-'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ครูพี่เลี้ยง</label>
                          <p className="text-sm text-gray-900">
                            {selectedTeachingSession.teacher_first_name && selectedTeachingSession.teacher_last_name 
                              ? `${selectedTeachingSession.teacher_first_name} ${selectedTeachingSession.teacher_last_name}`
                              : '-'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Teaching Details */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-l-4 border-green-500">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      รายละเอียดการสอน
                    </h4>
                    <div className="space-y-6">
                      {selectedTeachingSession.lesson_plan_name && (
                        <div className="bg-white p-4 rounded-lg border border-green-200">
                          <label className="block text-sm font-medium text-gray-700 mb-2">แผนการสอนที่ใช้</label>
                          <p className="text-sm text-gray-900 font-medium">{selectedTeachingSession.lesson_plan_name}</p>
                        </div>
                      )}
                      {selectedTeachingSession.learning_activities && (
                        <div className="bg-white p-4 rounded-lg border border-green-200">
                          <label className="block text-sm font-medium text-gray-700 mb-2">กิจกรรมการเรียนรู้</label>
                          <div className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                            {selectedTeachingSession.learning_activities}
                          </div>
                        </div>
                      )}
                      {selectedTeachingSession.learning_outcomes && (
                        <div className="bg-white p-4 rounded-lg border border-green-200">
                          <label className="block text-sm font-medium text-gray-700 mb-2">ผลการเรียนรู้</label>
                          <div className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                            {selectedTeachingSession.learning_outcomes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reflection and Feedback */}
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-lg border-l-4 border-yellow-500">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      การสะท้อนและข้อเสนอแนะ
                    </h4>
                    <div className="space-y-6">
                      {selectedTeachingSession.problems_encountered && (
                        <div className="bg-white p-4 rounded-lg border border-yellow-200">
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            ปัญหาที่พบ
                          </label>
                          <div className="text-sm text-gray-900 whitespace-pre-wrap bg-red-50 p-3 rounded border border-red-200">
                            {selectedTeachingSession.problems_encountered}
                          </div>
                        </div>
                      )}
                      {selectedTeachingSession.problem_solutions && (
                        <div className="bg-white p-4 rounded-lg border border-yellow-200">
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            วิธีแก้ไขปัญหา
                          </label>
                          <div className="text-sm text-gray-900 whitespace-pre-wrap bg-green-50 p-3 rounded border border-green-200">
                            {selectedTeachingSession.problem_solutions}
                          </div>
                        </div>
                      )}
                      {selectedTeachingSession.improvement_notes && (
                        <div className="bg-white p-4 rounded-lg border border-yellow-200">
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            ข้อเสนอแนะการปรับปรุง
                          </label>
                          <div className="text-sm text-gray-900 whitespace-pre-wrap bg-blue-50 p-3 rounded border border-blue-200">
                            {selectedTeachingSession.improvement_notes}
                          </div>
                        </div>
                      )}
                      {selectedTeachingSession.teacher_feedback && (
                        <div className="bg-white p-4 rounded-lg border border-yellow-200">
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            ความเห็นจากครูพี่เลี้ยง
                          </label>
                          <div className="text-sm text-gray-900 whitespace-pre-wrap bg-purple-50 p-3 rounded border border-purple-200">
                            {selectedTeachingSession.teacher_feedback}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Self Rating */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-l-4 border-purple-500">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      การประเมินตนเอง
                    </h4>
                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-center space-x-4">
                        <span className="text-sm font-medium text-gray-700">คะแนน:</span>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {getRatingStars(selectedTeachingSession.self_rating)}
                          </div>
                          <span className="text-lg font-bold text-purple-600 ml-2">
                            {selectedTeachingSession.self_rating}/5
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Files Section */}
                  {selectedTeachingSession.files && selectedTeachingSession.files.length > 0 && (
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg border-l-4 border-indigo-500">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        ไฟล์แนบ ({selectedTeachingSession.files.length} ไฟล์)
                      </h4>
                      <div className="space-y-2">
                        {selectedTeachingSession.files.map((file: any) => (
                          <div key={file.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                {file.file_type === 'pdf' ? (
                                  <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                  </svg>
                                ) : file.file_type === 'doc' || file.file_type === 'docx' ? (
                                  <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                  </svg>
                                ) : file.file_type === 'ppt' || file.file_type === 'pptx' ? (
                                  <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                  </svg>
                                ) : file.file_type === 'jpg' || file.file_type === 'jpeg' || file.file_type === 'png' ? (
                                  <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{file.file_name}</p>
                                <p className="text-xs text-gray-500">
                                  {file.file_category} • {(file.file_size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {file.file_type.toUpperCase()}
                              </span>
                              <button
                                onClick={() => window.open(`http://localhost:3000${file.file_path}`, '_blank')}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                ดูไฟล์
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </LoggedLayout>
  );
};

export default SupervisorTeachingSessions;
