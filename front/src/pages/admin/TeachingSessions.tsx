import React, { useState, useEffect } from 'react';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { adminApiService, type TeachingSession } from '../../services/adminApi';

const AdminTeachingSessions: React.FC = () => {
  const [sessions, setSessions] = useState<TeachingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<TeachingSession | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchSessions();
  }, [pagination.page, searchTerm]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApiService.getAllTeachingSessions({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined
      });

      if (response.success) {
        setSessions(response.data);
        setPagination(response.pagination);
      } else {
        setError(response.message || 'ไม่สามารถดึงข้อมูลได้');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchSessions();
  };

  const handleEdit = (session: TeachingSession) => {
    setSelectedSession(session);
    setShowEditModal(true);
  };

  const handleDelete = (session: TeachingSession) => {
    setSelectedSession(session);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedSession) return;

    try {
      const response = await adminApiService.deleteTeachingSession(selectedSession.id);
      if (response.success) {
        setShowDeleteModal(false);
        setSelectedSession(null);
        fetchSessions();
      } else {
        alert(response.message || 'ไม่สามารถลบข้อมูลได้');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { color: string; text: string } } = {
      'draft': { color: 'bg-gray-100 text-gray-800', text: 'ร่าง' },
      'submitted': { color: 'bg-blue-100 text-blue-800', text: 'ส่งแล้ว' },
      'approved': { color: 'bg-green-100 text-green-800', text: 'อนุมัติ' },
      'rejected': { color: 'bg-red-100 text-red-800', text: 'ปฏิเสธ' }
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

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  if (loading) {
    return (
      <LoggedLayout currentPage="จัดการบันทึกฝึกประสบการณ์">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout currentPage="จัดการบันทึกฝึกประสบการณ์">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">จัดการบันทึกฝึกประสบการณ์</h1>
          <p className="text-blue-100">จัดการข้อมูลบันทึกการฝึกประสบการณ์ของนักศึกษาทั้งหมด</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="ค้นหาด้วยชื่อนักศึกษา, รหัสนักศึกษา, โรงเรียน, หรือหัวข้อการสอน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              ค้นหา
            </button>
          </form>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">บันทึกทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">อนุมัติแล้ว</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sessions.filter(s => s.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">รอตรวจสอบ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sessions.filter(s => s.status === 'submitted').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ร่าง</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sessions.filter(s => s.status === 'draft').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">รายการบันทึกฝึกประสบการณ์</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">นักศึกษา</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">โรงเรียน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่สอน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หัวข้อ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {session.student_first_name} {session.student_last_name}
                        </div>
                        <div className="text-sm text-gray-500">{session.student_code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.school_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{formatDate(session.teaching_date)}</div>
                      <div className="text-gray-500">
                        {formatTime(session.start_time)} - {formatTime(session.end_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">{session.lesson_topic}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(session.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(session)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(session)}
                          className="text-red-600 hover:text-red-900"
                        >
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
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  แสดง {((pagination.page - 1) * pagination.limit) + 1} ถึง {Math.min(pagination.page * pagination.limit, pagination.total)} จาก {pagination.total} รายการ
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ก่อนหน้า
                  </button>
                  <span className="px-3 py-1 text-sm">
                    หน้า {pagination.page} จาก {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && selectedSession && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">แก้ไขบันทึกฝึกประสบการณ์</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">นักศึกษา</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedSession.student_first_name} {selectedSession.student_last_name} ({selectedSession.student_code})
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">โรงเรียน</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedSession.school_name}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">วันที่สอน</label>
                      <input
                        type="date"
                        value={selectedSession.teaching_date}
                        onChange={(e) => setSelectedSession({...selectedSession, teaching_date: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">เวลาเริ่ม</label>
                      <input
                        type="time"
                        value={selectedSession.start_time}
                        onChange={(e) => setSelectedSession({...selectedSession, start_time: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">เวลาสิ้นสุด</label>
                      <input
                        type="time"
                        value={selectedSession.end_time}
                        onChange={(e) => setSelectedSession({...selectedSession, end_time: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ระดับชั้น</label>
                      <input
                        type="text"
                        value={selectedSession.class_level}
                        onChange={(e) => setSelectedSession({...selectedSession, class_level: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ห้องเรียน</label>
                      <input
                        type="text"
                        value={selectedSession.class_room}
                        onChange={(e) => setSelectedSession({...selectedSession, class_room: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">หัวข้อการสอน</label>
                    <input
                      type="text"
                      value={selectedSession.lesson_topic}
                      onChange={(e) => setSelectedSession({...selectedSession, lesson_topic: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">สถานะ</label>
                    <select
                      value={selectedSession.status}
                      onChange={(e) => setSelectedSession({...selectedSession, status: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="draft">ร่าง</option>
                      <option value="submitted">ส่งแล้ว</option>
                      <option value="approved">อนุมัติ</option>
                      <option value="rejected">ปฏิเสธ</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const response = await adminApiService.updateTeachingSession(selectedSession.id, selectedSession);
                        if (response.success) {
                          setShowEditModal(false);
                          fetchSessions();
                        } else {
                          alert(response.message || 'ไม่สามารถอัปเดตข้อมูลได้');
                        }
                      } catch (error) {
                        console.error('Error updating session:', error);
                        alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    บันทึก
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedSession && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ยืนยันการลบ</h3>
                <p className="text-sm text-gray-500 mb-6">
                  คุณต้องการลบบันทึกฝึกประสบการณ์ของ {selectedSession.student_first_name} {selectedSession.student_last_name} หรือไม่?
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    ลบ
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

export default AdminTeachingSessions;
