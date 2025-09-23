import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import LoggedLayout from '../../components/layouts/LoggedLayout';

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
}

interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
}

const TeacherTeachingSessions: React.FC = () => {
  const [teachingSessions, setTeachingSessions] = useState<TeachingSession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTeachingSession, setSelectedTeachingSession] = useState<TeachingSession | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const fetchTeachingSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        subject_id: selectedSubject,
        status: selectedStatus
      });

      const response = await apiService.get(`/teacher/teaching-sessions?${params}`);
      
      if (response.success) {
        setTeachingSessions(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
        setError(null);
      } else {
        setError(response.message || 'ไม่สามารถโหลดข้อมูลบันทึกการฝึกประสบการณ์ได้');
      }
    } catch (error: any) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

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
    fetchTeachingSessions();
  }, [currentPage, searchTerm, selectedSubject, selectedStatus]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleViewTeachingSession = (teachingSession: TeachingSession) => {
    setSelectedTeachingSession(teachingSession);
    setShowViewModal(true);
  };

  const handleCloseModal = () => {
    setShowViewModal(false);
    setSelectedTeachingSession(null);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; className: string } } = {
      'submitted': { text: 'ส่งแล้ว', className: 'bg-blue-100 text-blue-800' },
      'approved': { text: 'อนุมัติ', className: 'bg-green-100 text-green-800' },
      'rejected': { text: 'ปฏิเสธ', className: 'bg-red-100 text-red-800' },
      'draft': { text: 'ร่าง', className: 'bg-yellow-100 text-yellow-800' }
    };
    
    const statusInfo = statusMap[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}>
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

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <LoggedLayout currentPage="/teacher/teaching-sessions">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ข้อมูลบันทึกการฝึกประสบการณ์</h1>
              <p className="text-gray-600 mt-1">บันทึกการฝึกประสบการณ์ของนักเรียนทั้งหมดในโรงเรียน</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาหัวข้อ, นักเรียน, หรือวิชา"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">วิชา</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">ทุกวิชา</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.subject_code} - {subject.subject_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">ทุกสถานะ</option>
                <option value="submitted">ส่งแล้ว</option>
                <option value="approved">อนุมัติ</option>
                <option value="rejected">ปฏิเสธ</option>
                <option value="draft">ร่าง</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSubject('');
                  setSelectedStatus('');
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                รีเซ็ต
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : teachingSessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">ไม่พบข้อมูลบันทึกการฝึกประสบการณ์</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        หัวข้อการสอน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        นักเรียน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วิชา
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันที่สอน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        เวลา
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ระดับชั้น
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
                    {teachingSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {session.lesson_topic}
                          </div>
                          {session.lesson_plan_name && (
                            <div className="text-sm text-gray-500">
                              แผน: {session.lesson_plan_name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {session.first_name} {session.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {session.student_code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {session.subject_code}
                          </div>
                          <div className="text-sm text-gray-500">
                            {session.subject_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(session.teaching_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTime(session.start_time)} - {formatTime(session.end_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.class_level || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(session.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewTeachingSession(session)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            ดูรายละเอียด
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      ก่อนหน้า
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      ถัดไป
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        หน้า <span className="font-medium">{currentPage}</span> จาก{' '}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          ก่อนหน้า
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          ถัดไป
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* View Modal */}
        {showViewModal && selectedTeachingSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    รายละเอียดบันทึกการฝึกประสบการณ์
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        หัวข้อการสอน
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        {selectedTeachingSession.lesson_topic}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        นักเรียน
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        {selectedTeachingSession.first_name} {selectedTeachingSession.last_name} ({selectedTeachingSession.student_code})
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        วิชา
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        {selectedTeachingSession.subject_code} - {selectedTeachingSession.subject_name}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        วันที่สอน
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        {formatDate(selectedTeachingSession.teaching_date)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        เวลา
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        {formatTime(selectedTeachingSession.start_time)} - {formatTime(selectedTeachingSession.end_time)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ระดับชั้น
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        {selectedTeachingSession.class_level || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ห้องเรียน
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        {selectedTeachingSession.class_room || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        จำนวนนักเรียน
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        {selectedTeachingSession.student_count || '-'} คน
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        สถานะ
                      </label>
                      <div className="bg-gray-50 p-3 rounded-md">
                        {getStatusBadge(selectedTeachingSession.status)}
                      </div>
                    </div>
                    {selectedTeachingSession.self_rating && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          คะแนนตนเอง
                        </label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                          {selectedTeachingSession.self_rating}/5
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Learning Activities */}
                  {selectedTeachingSession.learning_activities && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        กิจกรรมการเรียนรู้
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                        {selectedTeachingSession.learning_activities}
                      </p>
                    </div>
                  )}

                  {/* Learning Outcomes */}
                  {selectedTeachingSession.learning_outcomes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ผลการเรียนรู้
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                        {selectedTeachingSession.learning_outcomes}
                      </p>
                    </div>
                  )}

                  {/* Problems Encountered */}
                  {selectedTeachingSession.problems_encountered && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ปัญหาและอุปสรรค
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                        {selectedTeachingSession.problems_encountered}
                      </p>
                    </div>
                  )}

                  {/* Problem Solutions */}
                  {selectedTeachingSession.problem_solutions && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ข้อเสนอแนะ / แนวทางแก้ไข
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                        {selectedTeachingSession.problem_solutions}
                      </p>
                    </div>
                  )}

                  {/* Improvement Notes */}
                  {selectedTeachingSession.improvement_notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        หมายเหตุการปรับปรุง
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                        {selectedTeachingSession.improvement_notes}
                      </p>
                    </div>
                  )}

                  {/* Teacher Feedback */}
                  {selectedTeachingSession.teacher_feedback && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ความคิดเห็นจากครูพี่เลี้ยง
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                        {selectedTeachingSession.teacher_feedback}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
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

export default TeacherTeachingSessions;
