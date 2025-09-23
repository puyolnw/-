import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  school_name: string;
  files: LessonPlanFile[];
}

interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
}

const SupervisorLessonPlans: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedClassLevel, setSelectedClassLevel] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allLessonPlans, setAllLessonPlans] = useState<LessonPlan[]>([]);
  const [selectedLessonPlan, setSelectedLessonPlan] = useState<LessonPlan | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);


  const fetchLessonPlans = useCallback(async () => {
    try {
      setLoading(true);
      // ดึงข้อมูลทั้งหมดมา
      const params = new URLSearchParams({
        page: '1',
        limit: '1000' // ดึงข้อมูลจำนวนมาก
      });

      const response = await apiService.get(`/supervisor/lesson-plans?${params}`);
      
      if (response.success) {
        setAllLessonPlans(response.data);
        setError(null);
      } else {
        setError(response.message || 'ไม่สามารถโหลดข้อมูลแผนการสอนได้');
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
    fetchLessonPlans();
  }, [fetchLessonPlans]);

  // Client-side filtering
  const filteredLessonPlans = useMemo(() => {
    let filtered = allLessonPlans;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(plan => 
        // ชื่อแผนการสอน
        plan.lesson_plan_name.toLowerCase().includes(searchLower) ||
        // คำอธิบายแผนการสอน
        (plan.description && plan.description.toLowerCase().includes(searchLower)) ||
        // ชื่อวิชา
        (plan.subject_name && plan.subject_name.toLowerCase().includes(searchLower)) ||
        // รหัสวิชา
        (plan.subject_code && plan.subject_code.toLowerCase().includes(searchLower)) ||
        // ชื่อนักศึกษา
        (plan.first_name && plan.first_name.toLowerCase().includes(searchLower)) ||
        (plan.last_name && plan.last_name.toLowerCase().includes(searchLower)) ||
        // รหัสนักศึกษา
        (plan.student_code && plan.student_code.toLowerCase().includes(searchLower)) ||
        // ชื่ออาจารย์
        (plan.teacher_first_name && plan.teacher_first_name.toLowerCase().includes(searchLower)) ||
        (plan.teacher_last_name && plan.teacher_last_name.toLowerCase().includes(searchLower)) ||
        // ชื่อโรงเรียน
        (plan.school_name && plan.school_name.toLowerCase().includes(searchLower))
      );
    }

    // Filter by subject
    if (selectedSubject) {
      filtered = filtered.filter(plan => plan.subject_code.toString() === selectedSubject);
    }

    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter(plan => plan.status === selectedStatus);
    }

    // Filter by class level
    if (selectedClassLevel) {
      filtered = filtered.filter(plan => plan.target_grade === selectedClassLevel);
    }

    return filtered;
  }, [allLessonPlans, searchTerm, selectedSubject, selectedStatus, selectedClassLevel]);

  // Pagination
  const paginatedLessonPlans = useMemo(() => {
    const startIndex = (currentPage - 1) * 10;
    const endIndex = startIndex + 10;
    return filteredLessonPlans.slice(startIndex, endIndex);
  }, [filteredLessonPlans, currentPage]);

  // Update total pages
  useEffect(() => {
    setTotalPages(Math.ceil(filteredLessonPlans.length / 10));
  }, [filteredLessonPlans]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSubject, selectedStatus, selectedClassLevel]);

  const handleViewLessonPlan = (lessonPlan: LessonPlan) => {
    setSelectedLessonPlan(lessonPlan);
    setShowViewModal(true);
  };

  // Helper function to highlight search term
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim() || !text) return text;
    
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
    setSelectedLessonPlan(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">อนุมัติแล้ว</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">รอการอนุมัติ</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">ไม่อนุมัติ</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">{status}</span>;
    }
  };

  if (loading) {
    return (
      <LoggedLayout currentPage="ข้อมูลแผนการสอน">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LoggedLayout>
    );
  }

  if (error) {
    return (
      <LoggedLayout currentPage="ข้อมูลแผนการสอน">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout currentPage="ข้อมูลแผนการสอน">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ข้อมูลแผนการสอน</h1>
              <p className="text-gray-600 mt-1">แผนการสอนทั้งหมดในระบบ</p>
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
                  placeholder="ค้นหาชื่อแผน, ชื่อวิชา, ชื่อนักศึกษา, ชื่ออาจารย์, หรือโรงเรียน..."
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
                  setSelectedClassLevel('');
                  setSelectedStatus('');
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                ล้างตัวกรอง
              </button>
            </div>
          </div>
        </div>

        {/* Lesson Plans Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">รายการแผนการสอน</h3>
              <div className="text-sm text-gray-600">
                พบ {filteredLessonPlans.length} รายการ
                {allLessonPlans.length !== filteredLessonPlans.length && (
                  <span className="text-gray-400"> จากทั้งหมด {allLessonPlans.length} รายการ</span>
                )}
              </div>
            </div>
            {paginatedLessonPlans.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">ไม่พบแผนการสอนที่ตรงกับเงื่อนไขการค้นหา</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ชื่อแผนการสอน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วิชา
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
                        วันที่สร้าง
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        การดำเนินการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedLessonPlans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {highlightSearchTerm(plan.lesson_plan_name, searchTerm)}
                          </div>
                          {plan.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {highlightSearchTerm(plan.description, searchTerm)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{highlightSearchTerm(plan.subject_name || '', searchTerm)}</div>
                          <div className="text-sm text-gray-500">{highlightSearchTerm(plan.subject_code || '', searchTerm)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{plan.target_grade}</div>
                          <div className="text-sm text-gray-500">{plan.duration_minutes} นาที</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {highlightSearchTerm(plan.first_name || '', searchTerm)} {highlightSearchTerm(plan.last_name || '', searchTerm)}
                          </div>
                          <div className="text-sm text-gray-500">{highlightSearchTerm(plan.student_code || '', searchTerm)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{highlightSearchTerm(plan.school_name || '-', searchTerm)}</div>
                          {plan.teacher_first_name && (
                            <div className="text-sm text-gray-500">
                              ครู: {highlightSearchTerm(plan.teacher_first_name, searchTerm)} {highlightSearchTerm(plan.teacher_last_name || '', searchTerm)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(plan.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(plan.created_at).toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewLessonPlan(plan)}
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

        {/* Lesson Plan Detail Modal */}
        {showViewModal && selectedLessonPlan && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    รายละเอียดแผนการสอน
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
                  {/* Basic Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">ข้อมูลพื้นฐาน</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ชื่อแผนการสอน</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedLessonPlan.lesson_plan_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">วิชา</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedLessonPlan.subject_name} ({selectedLessonPlan.subject_code})</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ชั้นเรียน</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedLessonPlan.target_grade}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ระยะเวลา</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedLessonPlan.duration_minutes} นาที</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">สถานะ</label>
                        <div className="mt-1">{getStatusBadge(selectedLessonPlan.status)}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">วันที่สร้าง</label>
                        <p className="mt-1 text-sm text-gray-900">{new Date(selectedLessonPlan.created_at).toLocaleDateString('th-TH')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Student Information */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">ข้อมูลนักศึกษา</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedLessonPlan.first_name} {selectedLessonPlan.last_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">รหัสนักศึกษา</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedLessonPlan.student_code}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">โรงเรียน</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedLessonPlan.school_name || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ครูพี่เลี้ยง</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedLessonPlan.teacher_first_name && selectedLessonPlan.teacher_last_name 
                            ? `${selectedLessonPlan.teacher_first_name} ${selectedLessonPlan.teacher_last_name}`
                            : '-'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lesson Plan Details */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">รายละเอียดแผนการสอน</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">คำอธิบาย</label>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                          {selectedLessonPlan.description || 'นักศึกษาไม่ได้กรอกข้อมูลคำอธิบาย'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">จุดประสงค์การเรียนรู้</label>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                          {selectedLessonPlan.objectives || 'นักศึกษาไม่ได้กรอกข้อมูลจุดประสงค์การเรียนรู้'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">วิธีการสอน</label>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                          {selectedLessonPlan.teaching_methods || 'นักศึกษาไม่ได้กรอกข้อมูลวิธีการสอน'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">วิธีการประเมิน</label>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                          {selectedLessonPlan.assessment_methods || 'นักศึกษาไม่ได้กรอกข้อมูลวิธีการประเมิน'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Files Section */}
                  {selectedLessonPlan.files && selectedLessonPlan.files.length > 0 && (
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">ไฟล์แนบ</h4>
                      <div className="space-y-2">
                        {selectedLessonPlan.files.map((file: any) => (
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

export default SupervisorLessonPlans;
