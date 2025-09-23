import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import LoggedLayout from '../../components/layouts/LoggedLayout';

interface LessonPlanFile {
  id: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  fileCategory: string;
}

interface LessonPlan {
  id: number;
  lesson_plan_name: string;
  subject_code: string;
  subject_name: string;
  description: string;
  objectives: string;
  teaching_methods: string;
  assessment_methods: string;
  duration_minutes: number;
  target_grade: string;
  status: string;
  created_at: string;
  first_name: string;
  last_name: string;
  student_code: string;
  student_user_id: string;
  teacher_first_name: string;
  teacher_last_name: string;
  files: LessonPlanFile[];
}

interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
}

const TeacherLessonPlans: React.FC = () => {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLessonPlan, setSelectedLessonPlan] = useState<LessonPlan | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const fetchLessonPlans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        subject_id: selectedSubject,
        status: selectedStatus
      });

      const response = await apiService.get(`/teacher/lesson-plans?${params}`);
      
      if (response.success) {
        setLessonPlans(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
        setError(null);
      } else {
        setError(response.message || 'ไม่สามารถโหลดข้อมูลแผนการสอนได้');
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
    fetchLessonPlans();
  }, [currentPage, searchTerm, selectedSubject, selectedStatus]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleViewLessonPlan = (lessonPlan: LessonPlan) => {
    setSelectedLessonPlan(lessonPlan);
    setShowViewModal(true);
  };

  const handleCloseModal = () => {
    setShowViewModal(false);
    setSelectedLessonPlan(null);
  };

  const handleDownloadFile = async (planId: number, fileId: number, fileName: string) => {
    try {
      const response = await fetch(`/api/teacher/lesson-plans/${planId}/files/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('doc')) return '📝';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('video')) return '🎥';
    if (fileType.includes('audio')) return '🎵';
    return '📎';
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; className: string } } = {
      'active': { text: 'ใช้งาน', className: 'bg-green-100 text-green-800' },
      'inactive': { text: 'ไม่ใช้งาน', className: 'bg-gray-100 text-gray-800' },
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

  return (
    <LoggedLayout currentPage="/teacher/lesson-plans">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ข้อมูลแผนการสอน</h1>
              <p className="text-gray-600 mt-1">แผนการสอนของนักเรียนทั้งหมดในโรงเรียน</p>
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
                placeholder="ค้นหาชื่อแผน, นักเรียน, หรือวิชา"
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
                <option value="active">ใช้งาน</option>
                <option value="inactive">ไม่ใช้งาน</option>
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
          ) : lessonPlans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">ไม่พบข้อมูลแผนการสอน</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ชื่อแผนการสอน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        นักเรียน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วิชา
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ระดับชั้น
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันที่สร้าง
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ไฟล์ประกอบ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        การดำเนินการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lessonPlans.map((lessonPlan) => (
                      <tr key={lessonPlan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {lessonPlan.lesson_plan_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {lessonPlan.duration_minutes} นาที
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {lessonPlan.first_name} {lessonPlan.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {lessonPlan.student_code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {lessonPlan.subject_code}
                          </div>
                          <div className="text-sm text-gray-500">
                            {lessonPlan.subject_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lessonPlan.target_grade || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(lessonPlan.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(lessonPlan.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {lessonPlan.files && lessonPlan.files.length > 0 ? (
                              lessonPlan.files.map((file) => (
                                <button
                                  key={file.id}
                                  onClick={() => handleDownloadFile(lessonPlan.id, file.id, file.fileName)}
                                  className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                                  title={`${file.fileName} (${formatFileSize(file.fileSize)})`}
                                >
                                  <span className="mr-1">{getFileIcon(file.fileType)}</span>
                                  <span className="truncate max-w-20">{file.fileName}</span>
                                </button>
                              ))
                            ) : (
                              <span className="text-gray-400 text-sm">ไม่มีไฟล์</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewLessonPlan(lessonPlan)}
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
        {showViewModal && selectedLessonPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    รายละเอียดแผนการสอน
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
                        ชื่อแผนการสอน
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        {selectedLessonPlan.lesson_plan_name}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        นักเรียน
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        {selectedLessonPlan.first_name} {selectedLessonPlan.last_name} ({selectedLessonPlan.student_code})
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        วิชา
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        {selectedLessonPlan.subject_code} - {selectedLessonPlan.subject_name}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ระยะเวลา
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        {selectedLessonPlan.duration_minutes} นาที
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ระดับชั้น
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        {selectedLessonPlan.target_grade || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        สถานะ
                      </label>
                      <div className="bg-gray-50 p-3 rounded-md">
                        {getStatusBadge(selectedLessonPlan.status)}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedLessonPlan.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        คำอธิบาย
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                        {selectedLessonPlan.description}
                      </p>
                    </div>
                  )}

                  {/* Objectives */}
                  {selectedLessonPlan.objectives && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        วัตถุประสงค์
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                        {selectedLessonPlan.objectives}
                      </p>
                    </div>
                  )}

                  {/* Teaching Methods */}
                  {selectedLessonPlan.teaching_methods && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        วิธีการสอน
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                        {selectedLessonPlan.teaching_methods}
                      </p>
                    </div>
                  )}

                  {/* Assessment Methods */}
                  {selectedLessonPlan.assessment_methods && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        วิธีการประเมิน
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                        {selectedLessonPlan.assessment_methods}
                      </p>
                    </div>
                  )}

                  {/* Files */}
                  {selectedLessonPlan.files && selectedLessonPlan.files.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ไฟล์ประกอบแผนการสอน
                      </label>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="grid grid-cols-1 gap-2">
                          {selectedLessonPlan.files.map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div className="flex items-center">
                                <span className="mr-2 text-lg">{getFileIcon(file.fileType)}</span>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{file.fileName}</p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(file.fileSize)} • {file.fileCategory}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDownloadFile(selectedLessonPlan.id, file.id, file.fileName)}
                                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                              >
                                ดาวน์โหลด
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
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

export default TeacherLessonPlans;
