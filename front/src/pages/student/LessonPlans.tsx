import React, { useState, useEffect, useCallback } from 'react';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { lessonPlanApiService, type LessonPlan, type Subject, type LessonPlanStats } from '../../services/lessonPlanApi';
import { useToast } from '../../contexts/ToastContext';

const LessonPlans: React.FC = () => {
  const { showToast } = useToast();
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<LessonPlanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // เพิ่ม state สำหรับการค้นหาและ filter
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'lesson_plan_name' | 'subject_name'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // State สำหรับ modal ดู/แก้ไข/ลบ
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLessonPlan, setSelectedLessonPlan] = useState<LessonPlan | null>(null);
  
  // Form state สำหรับสร้างแผนการสอน (แก้ไขแล้ว - กรอกแค่ชื่อ + เลือกวิชา)
  const [formData, setFormData] = useState({
    lesson_plan_name: '',
    subject_id: '',
    description: '',
    objectives: '',
    teaching_methods: '',
    assessment_methods: '',
    duration_minutes: 50,
    target_grade: '',
    status: 'active'
  });

  // Form state สำหรับสร้างวิชาใหม่
  const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
  const [subjectFormData, setSubjectFormData] = useState({
    subject_code: '',
    subject_name: '',
    description: ''
  });

  // State สำหรับจัดการไฟล์
  const [lessonPlanDocuments, setLessonPlanDocuments] = useState<FileList | null>(null);
  const [teachingMaterials, setTeachingMaterials] = useState<FileList | null>(null);

  // ดึงข้อมูลแผนการสอน
  const fetchLessonPlans = useCallback(async () => {
    try {
      setLoading(true);
      
      const params: any = {
        page: currentPage,
        limit: 10
      };

      if (selectedStatus) params.status = selectedStatus;
      if (selectedSubject) params.subject_id = selectedSubject;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const response = await lessonPlanApiService.getMyLessonPlans(params);
      
      // Backend ส่ง response ในรูปแบบ {success: true, data: {lessonPlans: [...], stats: {...}, pagination: {...}}}
      if (response && response.success && response.data) {
        let plans = response.data.lessonPlans || [];
        
        // ดึงข้อมูลไฟล์สำหรับแต่ละแผนการสอน
        const plansWithFiles = await Promise.all(
          plans.map(async (plan: LessonPlan) => {
            try {
              const fileResponse = await lessonPlanApiService.getLessonPlanById(plan.id);
              if (fileResponse.success && fileResponse.data) {
                return { ...plan, files: fileResponse.data.files || [] };
              }
              return plan;
            } catch (error) {
              return plan;
            }
          })
        );
        
        // Client-side sorting
        const sortedPlans = plansWithFiles.sort((a: LessonPlan, b: LessonPlan) => {
          let aValue: any, bValue: any;
          
          switch (sortBy) {
            case 'lesson_plan_name':
              aValue = a.lesson_plan_name.toLowerCase();
              bValue = b.lesson_plan_name.toLowerCase();
              break;
            case 'subject_name':
              aValue = (a.subject_name || '').toLowerCase();
              bValue = (b.subject_name || '').toLowerCase();
              break;
            case 'created_at':
            default:
              aValue = new Date(a.created_at).getTime();
              bValue = new Date(b.created_at).getTime();
              break;
          }
          
          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
        
        setLessonPlans(sortedPlans);
        setStats(response.data.stats || null);
        setTotalPages(Math.ceil((response.data.pagination?.total || 0) / 10));
        setError(null); // Clear any previous errors
      } else {
        setError(response?.message || 'Failed to fetch lesson plans');
      }
    } catch (error: any) {
      // แสดง error message ที่ละเอียดขึ้น
      let errorMessage = 'Failed to fetch lesson plans';
      if (error.response?.status === 401) {
        errorMessage = 'กรุณา login ใหม่ (Token หมดอายุ)';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = `Network Error: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedStatus, selectedSubject, searchTerm, sortBy, sortOrder]);

  // ดึงข้อมูลวิชา
  const fetchSubjects = async () => {
    try {
      const response = await lessonPlanApiService.getSubjects({ limit: 100 });
      
      if (response.success && response.data) {
        setSubjects(response.data);
      } else if (Array.isArray(response)) {
        // ถ้า response เป็น array ตรงๆ (ไม่มี wrapper)
        setSubjects(response);
      }
    } catch (error) {
      
    }
  };

  useEffect(() => {
    fetchLessonPlans();
    fetchSubjects();
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

  // ฟังก์ชันสำหรับการค้นหา
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  // ฟังก์ชันสำหรับการเรียงลำดับ (ใช้ใน dropdown)
  // const handleSort = (field: 'created_at' | 'lesson_plan_name' | 'subject_name') => {
  //   if (sortBy === field) {
  //     setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  //   } else {
  //     setSortBy(field);
  //     setSortOrder('asc');
  //   }
  // };

  // ฟังก์ชันสำหรับ modal ดู/แก้ไข/ลบ
  const handleViewLessonPlan = async (plan: LessonPlan) => {
    setSelectedLessonPlan(plan);
    
    // ดึงไฟล์ที่แนบมาด้วย
    try {
      const response = await lessonPlanApiService.getLessonPlanById(plan.id);
      if (response.success && response.data) {
        const updatedPlan = { ...plan, files: response.data.files || [] };
        setSelectedLessonPlan(updatedPlan);
      } else {
        setSelectedLessonPlan(plan);
      }
    } catch (error) {
    }
    
    setShowViewModal(true);
  };

  const handleEditLessonPlan = async (plan: LessonPlan) => {
    setSelectedLessonPlan(plan);
    
    // ดึงไฟล์ที่แนบมาด้วย
    try {
      
      const response = await lessonPlanApiService.getLessonPlanById(plan.id);
      
      if (response.success && response.data) {
        const updatedPlan = { ...plan, files: response.data.files || [] };
        
        
        setSelectedLessonPlan(updatedPlan);
      } else {
        
        setSelectedLessonPlan(plan);
      }
    } catch (error) {
      
    }
    
    // Debug: ตรวจสอบไฟล์ที่เลือกในหน้าแก้ไข
    
    
    
    
    setFormData({
      lesson_plan_name: plan.lesson_plan_name,
      subject_id: plan.subject_id.toString(),
      description: plan.description || '',
      objectives: plan.objectives || '',
      teaching_methods: plan.teaching_methods || '',
      assessment_methods: plan.assessment_methods || '',
      duration_minutes: plan.duration_minutes,
      target_grade: plan.target_grade || '',
      status: plan.status
    });
    setShowEditModal(true);
  };

  const handleDeleteLessonPlan = (plan: LessonPlan) => {
    setSelectedLessonPlan(plan);
    setShowDeleteModal(true);
  };

  // ยืนยันการลบ
  const confirmDelete = async () => {
    if (!selectedLessonPlan) return;
    
    try {
      
      const response = await lessonPlanApiService.deleteLessonPlan(selectedLessonPlan.id);
      
      
      // ตรวจสอบ response structure
      if (response && typeof response === 'object' && response.success === true) {
        await fetchLessonPlans();
        setShowDeleteModal(false);
        setSelectedLessonPlan(null);
        showToast('ลบแผนการสอนสำเร็จ!', 'success');
      } else {
        const errorMessage = response?.message || 'ไม่ทราบสาเหตุ';
        
        showToast('เกิดข้อผิดพลาด: ' + errorMessage, 'error');
      }
    } catch (error: any) {
      
      let errorMessage = 'ไม่ทราบสาเหตุ';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
        showToast('เกิดข้อผิดพลาด: ' + errorMessage, 'error');
    }
  };

  // ลบไฟล์จากแผนการสอน
  const handleDeleteFile = async (fileId: number) => {
    if (!selectedLessonPlan) return;
    
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบไฟล์นี้?')) {
      return;
    }
    
    try {
      
      const response = await lessonPlanApiService.deleteFile(selectedLessonPlan.id, fileId);
      
      
      // ตรวจสอบ response structure
      if (response && typeof response === 'object' && response.success === true) {
        // อัปเดตข้อมูลไฟล์ใน selectedLessonPlan
        setSelectedLessonPlan(prev => {
          if (!prev) return null;
          return {
            ...prev,
            files: prev.files?.filter(file => file.id !== fileId) || []
          };
        });
        // รีเฟรชข้อมูลแผนการสอน
        await fetchLessonPlans();
        showToast('ลบไฟล์สำเร็จ!', 'success');
      } else {
        const errorMessage = response?.message || 'ไม่ทราบสาเหตุ';
        
        showToast('เกิดข้อผิดพลาด: ' + errorMessage, 'error');
      }
    } catch (error: any) {
      
      let errorMessage = 'ไม่ทราบสาเหตุ';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
        showToast('เกิดข้อผิดพลาด: ' + errorMessage, 'error');
    }
  };

  // สถานะ badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'ใช้งาน' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'เสร็จสิ้น' },
      archived: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'เก็บถาวร' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
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

  // จัดการ form input
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration_minutes' ? parseInt(value) || 0 : value
    }));
  };

  // สร้างแผนการสอน
  const handleCreateLessonPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // ไม่บังคับให้มีไฟล์แผนการสอน (สามารถสร้างได้โดยไม่มีไฟล์)

      // สร้างแผนการสอนก่อน
      const lessonPlanData = {
        lesson_plan_name: formData.lesson_plan_name,
        subject_id: parseInt(formData.subject_id),
        description: formData.description || undefined,
        objectives: formData.objectives || undefined,
        teaching_methods: formData.teaching_methods || undefined,
        assessment_methods: formData.assessment_methods || undefined,
        duration_minutes: formData.duration_minutes,
        target_grade: formData.target_grade || undefined,
        status: formData.status as 'active' | 'completed' | 'archived'
      };
      
      
      const response = await lessonPlanApiService.createLessonPlan(lessonPlanData);
      

      if (response.success && response.data) {
        const lessonPlanId = response.data.id;
        
        // อัปโหลดไฟล์แผนการสอน
        if (lessonPlanDocuments && lessonPlanDocuments.length > 0) {
          
          
          const documentFiles = Array.from(lessonPlanDocuments);
          const docResponse = await lessonPlanApiService.uploadLessonPlanDocuments(lessonPlanId, documentFiles);
          
          
          // ตรวจสอบ response structure ที่ถูกต้อง
          if (docResponse && typeof docResponse === 'object' && docResponse.success === true) {
            
          } else {
            
            showToast('เกิดข้อผิดพลาดในการอัปโหลดไฟล์แผนการสอน: ' + (docResponse?.message || 'ไม่ทราบสาเหตุ'), 'error');
          }
        }

        // อัปโหลดไฟล์สื่อการสอน
        if (teachingMaterials && teachingMaterials.length > 0) {
          
          
          const materialFiles = Array.from(teachingMaterials);
          const materialResponse = await lessonPlanApiService.uploadTeachingMaterials(lessonPlanId, materialFiles);
          
          
          // ตรวจสอบ response structure ที่ถูกต้อง
          if (materialResponse && typeof materialResponse === 'object' && materialResponse.success === true) {
            
          } else {
            
            showToast('เกิดข้อผิดพลาดในการอัปโหลดไฟล์สื่อการสอน: ' + (materialResponse?.message || 'ไม่ทราบสาเหตุ'), 'error');
          }
        }

        showToast('สร้างแผนการสอนและอัปโหลดไฟล์สำเร็จ!', 'success');
        setShowCreateModal(false);
        setFormData({
          lesson_plan_name: '',
          subject_id: '',
          description: '',
          objectives: '',
          teaching_methods: '',
          assessment_methods: '',
          duration_minutes: 50,
          target_grade: '',
          status: 'active'
        });
        setLessonPlanDocuments(null);
        setTeachingMaterials(null);
        fetchLessonPlans(); // รีเฟรชข้อมูล
      } else {
        showToast('เกิดข้อผิดพลาด: ' + (response.message || 'ไม่ทราบสาเหตุ'), 'error');
      }
    } catch (error) {
      
      showToast('เกิดข้อผิดพลาดในการสร้างแผนการสอน', 'error');
    }
  };

  // ฟังก์ชันสำหรับสร้างวิชาใหม่
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      
      
      const response = await lessonPlanApiService.createSubject({
        subject_code: subjectFormData.subject_code,
        subject_name: subjectFormData.subject_name,
        description: subjectFormData.description
      });

      

      if (response.success) {
        showToast('สร้างวิชาใหม่สำเร็จ!', 'success');
        setShowCreateSubjectModal(false);
        setSubjectFormData({
          subject_code: '',
          subject_name: '',
          description: ''
        });
        fetchSubjects(); // รีเฟรชข้อมูลวิชา
      } else {
        const errorMessage = response.message || 'ไม่ทราบสาเหตุ';
        
        showToast('เกิดข้อผิดพลาด: ' + errorMessage, 'error');
      }
    } catch (error: any) {
      
      
      let errorMessage = 'เกิดข้อผิดพลาดในการสร้างวิชาใหม่';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors;
        errorMessage = validationErrors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
        showToast('เกิดข้อผิดพลาด: ' + errorMessage, 'error');
    }
  };

  return (
    <LoggedLayout currentPage="แผนการสอน">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">แผนการสอน</h1>
                <p className="text-blue-100">จัดการแผนการสอนของคุณ</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              สร้างแผนใหม่
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">ทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_plans}</p>
                </div>
              </div>
            </div>


            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">ใช้งาน</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active_plans}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">เสร็จสิ้น</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed_plans}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Box */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">ค้นหาแผนการสอน</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="ค้นหาตามชื่อแผนการสอน..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">ทั้งหมด</option>
                <option value="active">ใช้งาน</option>
                <option value="completed">เสร็จสิ้น</option>
                <option value="archived">เก็บถาวร</option>
              </select>
            </div>

            {/* Subject Filter */}
            <div className="lg:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">วิชา</label>
              <select
                value={selectedSubject || ''}
                onChange={(e) => handleSubjectFilter(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">ทั้งหมด</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.subject_code} - {subject.subject_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">เรียงตาม</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as 'created_at' | 'lesson_plan_name' | 'subject_name');
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="created_at-desc">วันที่สร้าง (ใหม่-เก่า)</option>
                <option value="created_at-asc">วันที่สร้าง (เก่า-ใหม่)</option>
                <option value="lesson_plan_name-asc">ชื่อแผน (ก-ฮ)</option>
                <option value="lesson_plan_name-desc">ชื่อแผน (ฮ-ก)</option>
                <option value="subject_name-asc">วิชา (ก-ฮ)</option>
                <option value="subject_name-desc">วิชา (ฮ-ก)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lesson Plans List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">กำลังโหลด...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchLessonPlans}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ลองใหม่
              </button>
            </div>
          ) : lessonPlans.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 mb-4">ยังไม่มีแผนการสอน</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                สร้างแผนการสอนแรก
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        แผนการสอน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วิชา
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ระยะเวลา
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ไฟล์
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
                    {lessonPlans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {plan.lesson_plan_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {plan.id}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {plan.subject_code} - {plan.subject_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {plan.duration_minutes} นาที
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(plan.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="flex flex-col">
                              <span className={plan.file_count && plan.file_count > 0 ? 'text-green-600 font-medium' : 'text-gray-500'}>
                                {plan.file_count || 0} ไฟล์
                              </span>
                              {plan.files && plan.files.length > 0 && (
                                <div className="text-xs text-gray-500 mt-1 max-w-xs">
                                  {plan.files.slice(0, 2).map((file, index) => (
                                    <div key={file.id} className="truncate">
                                      {index > 0 && ', '}
                                      {file.file_name}
                                    </div>
                                  ))}
                                  {plan.files.length > 2 && (
                                    <div className="text-gray-400">
                                      และอีก {plan.files.length - 2} ไฟล์...
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(plan.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleViewLessonPlan(plan)}
                              className="text-blue-600 hover:text-blue-900 hover:underline"
                              title="ดูรายละเอียด"
                            >
                              ดู
                            </button>
                            <button 
                              onClick={() => handleEditLessonPlan(plan)}
                              className="text-green-600 hover:text-green-900 hover:underline"
                              title="แก้ไขแผนการสอน"
                            >
                              แก้ไข
                            </button>
                            <button 
                              onClick={() => handleDeleteLessonPlan(plan)}
                              className="text-red-600 hover:text-red-900 hover:underline"
                              title="ลบแผนการสอน"
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
              {totalPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      หน้า {currentPage} จาก {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ก่อนหน้า
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ถัดไป
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal สร้างแผนการสอน */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">สร้างแผนการสอนใหม่</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateLessonPlan} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อแผนการสอน *</label>
                  <input
                    type="text"
                    name="lesson_plan_name"
                    value={formData.lesson_plan_name}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="เช่น แผนการสอนคณิตศาสตร์ ป.1"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">วิชา *</label>
                    <button
                      type="button"
                      onClick={() => setShowCreateSubjectModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      + สร้างวิชาใหม่
                    </button>
                  </div>
                  <select 
                    name="subject_id"
                    value={formData.subject_id}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">เลือกวิชา</option>
                    {subjects.length > 0 ? (
                      subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>{subject.subject_name}</option>
                      ))
                    ) : (
                      <option value="" disabled>ไม่มีวิชาให้เลือก</option>
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    จำนวนวิชาที่มี: {subjects.length} รายการ
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="อธิบายรายละเอียดของแผนการสอน"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">จุดประสงค์การเรียนรู้</label>
                  <textarea
                    name="objectives"
                    value={formData.objectives}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ระบุจุดประสงค์ที่ต้องการให้ผู้เรียนบรรลุ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วิธีการสอน</label>
                  <textarea
                    name="teaching_methods"
                    value={formData.teaching_methods}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="อธิบายวิธีการสอนที่ใช้"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วิธีการประเมิน</label>
                  <textarea
                    name="assessment_methods"
                    value={formData.assessment_methods}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="อธิบายวิธีการประเมินผลการเรียนรู้"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ระยะเวลาสอน (นาที) *</label>
                    <input
                      type="number"
                      name="duration_minutes"
                      value={formData.duration_minutes}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="50"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ระดับชั้นเป้าหมาย</label>
                    <input
                      type="text"
                      name="target_grade"
                      value={formData.target_grade}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="เช่น ป.1, ม.1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">ใช้งาน</option>
                    <option value="completed">เสร็จสิ้น</option>
                    <option value="archived">เก็บถาวร</option>
                  </select>
                </div>

                {/* ส่วนอัปโหลดไฟล์ */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">อัปโหลดไฟล์</h4>
                  
                  {/* ไฟล์แผนการสอน */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ไฟล์แผนการสอน (PDF, Word) *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      multiple
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        setLessonPlanDocuments(e.target.files);
                        
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">รองรับไฟล์ PDF, Word (.pdf, .doc, .docx)</p>
                  </div>

                  {/* ไฟล์สื่อการสอน */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ไฟล์สื่อการสอน (รูปภาพ, วิดีโอ, PowerPoint)
                    </label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif,.mp4,.avi,.ppt,.pptx"
                      multiple
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        setTeachingMaterials(e.target.files);
                        
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">รองรับไฟล์ รูปภาพ (.jpg, .png, .gif), วิดีโอ (.mp4, .avi), PowerPoint (.ppt, .pptx)</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    สร้างแผนการสอน
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
            )}

            {/* Modal สร้างวิชาใหม่ */}
            {showCreateSubjectModal && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
                <div className="relative p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">สร้างวิชาใหม่</h3>
                      <button
                        onClick={() => setShowCreateSubjectModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <form onSubmit={handleCreateSubject} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">รหัสวิชา *</label>
                        <input
                          type="text"
                          name="subject_code"
                          value={subjectFormData.subject_code}
                          onChange={(e) => setSubjectFormData(prev => ({ ...prev, subject_code: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="เช่น MATH001, SCI001"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อวิชา *</label>
                        <input
                          type="text"
                          name="subject_name"
                          value={subjectFormData.subject_name}
                          onChange={(e) => setSubjectFormData(prev => ({ ...prev, subject_name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="เช่น คณิตศาสตร์พื้นฐาน"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                        <textarea
                          name="description"
                          value={subjectFormData.description}
                          onChange={(e) => setSubjectFormData(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="อธิบายรายละเอียดของวิชา"
                        />
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowCreateSubjectModal(false)}
                          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          สร้างวิชา
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Lesson Plan Modal */}
            {showEditModal && selectedLessonPlan && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">แก้ไขแผนการสอน</h3>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      // อัปเดตข้อมูลแผนการสอน
                      const updateData = {
                        lesson_plan_name: formData.lesson_plan_name,
                        subject_id: parseInt(formData.subject_id),
                        description: formData.description || undefined,
                        objectives: formData.objectives || undefined,
                        teaching_methods: formData.teaching_methods || undefined,
                        assessment_methods: formData.assessment_methods || undefined,
                        duration_minutes: formData.duration_minutes,
                        target_grade: formData.target_grade || undefined,
                        status: formData.status as 'active' | 'completed' | 'archived'
                      };
                      
                      
                      
                      
                      
                      const response = await lessonPlanApiService.updateLessonPlan(selectedLessonPlan.id, updateData);
                      
                      
                      
                      
                      if (response.success) {
                        // อัปโหลดไฟล์ใหม่ (ถ้ามี)
                        try {
                          
                          
                          
                          
                          if (lessonPlanDocuments && lessonPlanDocuments.length > 0) {
                            
                            
                            const documentFiles = Array.from(lessonPlanDocuments);
                            const docResponse = await lessonPlanApiService.uploadLessonPlanDocuments(selectedLessonPlan.id, documentFiles);
                            
                            
                            // ตรวจสอบ response structure ที่ถูกต้อง
                            if (docResponse && typeof docResponse === 'object' && docResponse.success === true) {
                              
                            } else {
                              
                              showToast('เกิดข้อผิดพลาดในการอัปโหลดไฟล์แผนการสอน: ' + (docResponse?.message || 'ไม่ทราบสาเหตุ'), 'error');
                            }
                          }

                          if (teachingMaterials && teachingMaterials.length > 0) {
                            
                            
                            const materialFiles = Array.from(teachingMaterials);
                            const materialResponse = await lessonPlanApiService.uploadTeachingMaterials(selectedLessonPlan.id, materialFiles);
                            
                            
                            // ตรวจสอบ response structure ที่ถูกต้อง
                            if (materialResponse && typeof materialResponse === 'object' && materialResponse.success === true) {
                              
                            } else {
                              
                              showToast('เกิดข้อผิดพลาดในการอัปโหลดไฟล์สื่อการสอน: ' + (materialResponse?.message || 'ไม่ทราบสาเหตุ'), 'error');
                            }
                          }
                        } catch (uploadError: any) {
                          
                          showToast('เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ' + (uploadError.message || 'ไม่ทราบสาเหตุ'), 'error');
                        }

                        await fetchLessonPlans();
                        setShowEditModal(false);
                        setSelectedLessonPlan(null);
                        showToast('บันทึกการแก้ไขและอัปโหลดไฟล์สำเร็จ!', 'success');
                      } else {
                        showToast('เกิดข้อผิดพลาด: ' + (response.message || 'ไม่ทราบสาเหตุ'), 'error');
                      }
                    } catch (error: any) {
                      
                      showToast('เกิดข้อผิดพลาด: ' + (error.message || 'ไม่ทราบสาเหตุ'), 'error');
                    }
                  }}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อแผนการสอน *</label>
                        <input
                          type="text"
                          name="lesson_plan_name"
                          value={formData.lesson_plan_name}
                          onChange={handleFormChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">วิชา *</label>
                        <select
                          name="subject_id"
                          value={formData.subject_id}
                          onChange={handleFormChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">เลือกวิชา</option>
                          {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.subject_code} - {subject.subject_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleFormChange}
                          rows={3}
                          placeholder="อธิบายเกี่ยวกับแผนการสอนนี้..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">จุดประสงค์การเรียนรู้</label>
                        <textarea
                          name="objectives"
                          value={formData.objectives}
                          onChange={handleFormChange}
                          rows={3}
                          placeholder="ระบุจุดประสงค์การเรียนรู้..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">วิธีการสอน</label>
                        <textarea
                          name="teaching_methods"
                          value={formData.teaching_methods}
                          onChange={handleFormChange}
                          rows={3}
                          placeholder="อธิบายวิธีการสอน..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">วิธีการประเมิน</label>
                        <textarea
                          name="assessment_methods"
                          value={formData.assessment_methods}
                          onChange={handleFormChange}
                          rows={3}
                          placeholder="อธิบายวิธีการประเมิน..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ระยะเวลา (นาที)</label>
                          <input
                            type="number"
                            name="duration_minutes"
                            value={formData.duration_minutes}
                            onChange={handleFormChange}
                            min="15"
                            max="180"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ระดับชั้น</label>
                          <input
                            type="text"
                            name="target_grade"
                            value={formData.target_grade}
                            onChange={handleFormChange}
                            placeholder="เช่น ป.1, ม.1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="active">ใช้งาน</option>
                          <option value="completed">เสร็จสิ้น</option>
                          <option value="archived">เก็บถาวร</option>
                        </select>
                      </div>
                    </div>

                    {/* ส่วนจัดการไฟล์ */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">จัดการไฟล์</h4>
                      
  
                      
                      {/* แสดงไฟล์ที่มีอยู่ */}
                      {selectedLessonPlan?.files && selectedLessonPlan.files.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-3">ไฟล์ที่มีอยู่:</h5>
                          
                          {/* ไฟล์แผนการสอน */}
                          {selectedLessonPlan.files.filter(file => file.file_category === 'document').length > 0 && (
                            <div className="mb-3">
                              <h6 className="text-xs font-medium text-blue-700 mb-2">📄 ไฟล์แผนการสอน</h6>
                              <div className="space-y-2">
                                {selectedLessonPlan.files.filter(file => file.file_category === 'document').map((file) => (
                                  <div key={file.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-200">
                                    <div className="flex items-center">
                                      <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <div>
                                        <span className="text-sm font-medium text-gray-900">{file.file_name}</span>
                                        <div className="text-xs text-gray-500">
                                          {Math.round(file.file_size / 1024)} KB • {file.mime_type}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex space-x-2">
                                      <button 
                                        onClick={() => window.open(`/api/files/${file.id}`, '_blank')}
                                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                      >
                                        ดู
                                      </button>
                                      <button 
                                        onClick={async () => {
                                          if (confirm('คุณแน่ใจหรือไม่ที่จะลบไฟล์นี้?')) {
                                            try {
                                              const response = await lessonPlanApiService.deleteFile(selectedLessonPlan.id, file.id);
                                              if (response && response.success) {
                                                // อัปเดตไฟล์ใน state
                                                setSelectedLessonPlan(prev => ({
                                                  ...prev!,
                                                  files: prev!.files?.filter(f => f.id !== file.id) || []
                                                }));
                                                showToast('ลบไฟล์สำเร็จ!', 'success');
                                              } else {
                                                alert('เกิดข้อผิดพลาด: ' + (response?.message || 'ไม่ทราบสาเหตุ'));
                                              }
                                            } catch (error: any) {
                                              
                                              showToast('เกิดข้อผิดพลาด: ' + (error.message || 'ไม่ทราบสาเหตุ'), 'error');
                                            }
                                          }
                                        }}
                                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                                      >
                                        ลบ
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ไฟล์สื่อการสอน */}
                          {selectedLessonPlan.files.filter(file => file.file_category === 'media' || file.file_category === 'presentation').length > 0 && (
                            <div className="mb-3">
                              <h6 className="text-xs font-medium text-green-700 mb-2">🎥 ไฟล์สื่อการสอน</h6>
                              <div className="space-y-2">
                                {selectedLessonPlan.files.filter(file => file.file_category === 'media' || file.file_category === 'presentation').map((file) => (
                                  <div key={file.id} className="flex items-center justify-between p-3 bg-green-50 rounded-md border border-green-200">
                                    <div className="flex items-center">
                                      <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                      <div>
                                        <span className="text-sm font-medium text-gray-900">{file.file_name}</span>
                                        <div className="text-xs text-gray-500">
                                          {Math.round(file.file_size / 1024)} KB • {file.mime_type}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex space-x-2">
                                      <button 
                                        onClick={() => window.open(`/api/files/${file.id}`, '_blank')}
                                        className="text-green-600 hover:text-green-800 text-xs font-medium"
                                      >
                                        ดู
                                      </button>
                                      <button 
                                        onClick={async () => {
                                          if (confirm('คุณแน่ใจหรือไม่ที่จะลบไฟล์นี้?')) {
                                            try {
                                              const response = await lessonPlanApiService.deleteFile(selectedLessonPlan.id, file.id);
                                              if (response && response.success) {
                                                // อัปเดตไฟล์ใน state
                                                setSelectedLessonPlan(prev => ({
                                                  ...prev!,
                                                  files: prev!.files?.filter(f => f.id !== file.id) || []
                                                }));
                                                showToast('ลบไฟล์สำเร็จ!', 'success');
                                              } else {
                                                alert('เกิดข้อผิดพลาด: ' + (response?.message || 'ไม่ทราบสาเหตุ'));
                                              }
                                            } catch (error: any) {
                                              
                                              showToast('เกิดข้อผิดพลาด: ' + (error.message || 'ไม่ทราบสาเหตุ'), 'error');
                                            }
                                          }
                                        }}
                                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                                      >
                                        ลบ
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ไฟล์อื่นๆ */}
                          {selectedLessonPlan.files.filter(file => file.file_category === 'other').length > 0 && (
                            <div className="mb-3">
                              <h6 className="text-xs font-medium text-gray-700 mb-2">📎 ไฟล์อื่นๆ</h6>
                              <div className="space-y-2">
                                {selectedLessonPlan.files.filter(file => file.file_category === 'other').map((file) => (
                                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                                    <div className="flex items-center">
                                      <svg className="w-4 h-4 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <div>
                                        <span className="text-sm font-medium text-gray-900">{file.file_name}</span>
                                        <div className="text-xs text-gray-500">
                                          {Math.round(file.file_size / 1024)} KB • {file.mime_type}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex space-x-2">
                                      <button 
                                        onClick={() => window.open(`/api/files/${file.id}`, '_blank')}
                                        className="text-gray-600 hover:text-gray-800 text-xs font-medium"
                                      >
                                        ดู
                                      </button>
                                      <button 
                                        onClick={async () => {
                                          if (confirm('คุณแน่ใจหรือไม่ที่จะลบไฟล์นี้?')) {
                                            try {
                                              const response = await lessonPlanApiService.deleteFile(selectedLessonPlan.id, file.id);
                                              if (response && response.success) {
                                                // อัปเดตไฟล์ใน state
                                                setSelectedLessonPlan(prev => ({
                                                  ...prev!,
                                                  files: prev!.files?.filter(f => f.id !== file.id) || []
                                                }));
                                                showToast('ลบไฟล์สำเร็จ!', 'success');
                                              } else {
                                                alert('เกิดข้อผิดพลาด: ' + (response?.message || 'ไม่ทราบสาเหตุ'));
                                              }
                                            } catch (error: any) {
                                              
                                              showToast('เกิดข้อผิดพลาด: ' + (error.message || 'ไม่ทราบสาเหตุ'), 'error');
                                            }
                                          }
                                        }}
                                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                                      >
                                        ลบ
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* อัปโหลดไฟล์ใหม่ */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">เพิ่มไฟล์แผนการสอน</label>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setLessonPlanDocuments(e.target.files)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">รองรับไฟล์ PDF, Word (สูงสุด 10MB)</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">เพิ่มไฟล์สื่อการสอน</label>
                          <input
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.gif,.mp4,.avi,.ppt,.pptx"
                            onChange={(e) => setTeachingMaterials(e.target.files)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">รองรับไฟล์รูปภาพ, วิดีโอ, PowerPoint (สูงสุด 50MB)</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                      >
                        บันทึกการแก้ไข
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* View Lesson Plan Modal */}
            {showViewModal && selectedLessonPlan && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">รายละเอียดแผนการสอน</h3>
                    <button
                      onClick={() => setShowViewModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ชื่อแผนการสอน</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedLessonPlan.lesson_plan_name}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">วิชา</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedLessonPlan.subject_code} - {selectedLessonPlan.subject_name}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">คำอธิบาย</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                        {selectedLessonPlan.description || 'ไม่ระบุ'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">จุดประสงค์การเรียนรู้</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                        {selectedLessonPlan.objectives || 'ไม่ระบุ'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">วิธีการสอน</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                        {selectedLessonPlan.teaching_methods || 'ไม่ระบุ'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">วิธีการประเมิน</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                        {selectedLessonPlan.assessment_methods || 'ไม่ระบุ'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ระยะเวลา</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedLessonPlan.duration_minutes} นาที</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ระดับชั้น</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedLessonPlan.target_grade || 'ไม่ระบุ'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">สถานะ</label>
                      <div className="mt-1">{getStatusBadge(selectedLessonPlan.status)}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">จำนวนไฟล์</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedLessonPlan.file_count || 0} ไฟล์</p>
                      
                      {/* Debug: แสดงข้อมูลไฟล์ทั้งหมด */}
      
                      
                      {selectedLessonPlan.files && selectedLessonPlan.files.length > 0 && (
                        <div className="mt-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">ไฟล์ที่แนบ</label>
          
                          
                          {/* ไฟล์แผนการสอน */}
                          {selectedLessonPlan.files.filter(file => file.file_category === 'document').length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-blue-700 mb-2">📄 ไฟล์แผนการสอน</h4>
                              <div className="space-y-2">
                                {selectedLessonPlan.files.filter(file => file.file_category === 'document').map((file) => (
                                  <div key={file.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-200">
                                    <div className="flex items-center">
                                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <div>
                                        <span className="text-sm font-medium text-gray-900">{file.file_name}</span>
                                        <div className="text-xs text-gray-500">
                                          {Math.round(file.file_size / 1024)} KB • {file.mime_type}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex space-x-2">
                                      <button 
                                        onClick={() => window.open(`/api/files/${file.id}`, '_blank')}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                      >
                                        ดูไฟล์
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteFile(file.id)}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                      >
                                        ลบ
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ไฟล์สื่อการสอน */}
                          {selectedLessonPlan.files.filter(file => file.file_category === 'media' || file.file_category === 'presentation').length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-green-700 mb-2">🎥 ไฟล์สื่อการสอน</h4>
                              <div className="space-y-2">
                                {selectedLessonPlan.files.filter(file => file.file_category === 'media' || file.file_category === 'presentation').map((file) => (
                                  <div key={file.id} className="flex items-center justify-between p-3 bg-green-50 rounded-md border border-green-200">
                                    <div className="flex items-center">
                                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                      <div>
                                        <span className="text-sm font-medium text-gray-900">{file.file_name}</span>
                                        <div className="text-xs text-gray-500">
                                          {Math.round(file.file_size / 1024)} KB • {file.mime_type}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex space-x-2">
                                      <button 
                                        onClick={() => window.open(`/api/files/${file.id}`, '_blank')}
                                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                                      >
                                        ดูไฟล์
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteFile(file.id)}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                      >
                                        ลบ
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ไฟล์อื่นๆ */}
                          {selectedLessonPlan.files.filter(file => file.file_category === 'other').length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">📎 ไฟล์อื่นๆ</h4>
                              <div className="space-y-2">
                                {selectedLessonPlan.files.filter(file => file.file_category === 'other').map((file) => (
                                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                                    <div className="flex items-center">
                                      <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <div>
                                        <span className="text-sm font-medium text-gray-900">{file.file_name}</span>
                                        <div className="text-xs text-gray-500">
                                          {Math.round(file.file_size / 1024)} KB • {file.mime_type}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex space-x-2">
                                      <button 
                                        onClick={() => window.open(`/api/files/${file.id}`, '_blank')}
                                        className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                                      >
                                        ดูไฟล์
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteFile(file.id)}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                      >
                                        ลบ
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* แสดงไฟล์ทั้งหมด (fallback) - แสดงทุกไฟล์ที่ไม่ตรงกับประเภทข้างต้น */}
                          {selectedLessonPlan.files.filter(file => 
                            file.file_category !== 'document' && 
                            file.file_category !== 'media' && 
                            file.file_category !== 'presentation' && 
                            file.file_category !== 'other'
                          ).length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">📎 ไฟล์อื่นๆ</h4>
                              <div className="space-y-2">
                                {selectedLessonPlan.files.filter(file => 
                                  file.file_category !== 'document' && 
                                  file.file_category !== 'media' && 
                                  file.file_category !== 'presentation' && 
                                  file.file_category !== 'other'
                                ).map((file) => (
                                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                                    <div className="flex items-center">
                                      <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <div>
                                        <span className="text-sm font-medium text-gray-900">{file.file_name}</span>
                                        <div className="text-xs text-gray-500">
                                          {Math.round(file.file_size / 1024)} KB • {file.mime_type} • {file.file_category || 'ไม่ระบุประเภท'}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex space-x-2">
                                      <button 
                                        onClick={() => window.open(`/api/files/${file.id}`, '_blank')}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                      >
                                        ดูไฟล์
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteFile(file.id)}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                      >
                                        ลบ
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* แสดงไฟล์ทั้งหมดแบบง่าย (ถ้าไม่มีไฟล์แสดงในประเภทใดเลย) */}
                          {selectedLessonPlan.files.length > 0 && 
                           selectedLessonPlan.files.filter(file => file.file_category === 'document').length === 0 &&
                           selectedLessonPlan.files.filter(file => file.file_category === 'media' || file.file_category === 'presentation').length === 0 &&
                           selectedLessonPlan.files.filter(file => file.file_category === 'other').length === 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">📎 ไฟล์ทั้งหมด</h4>
                              <div className="space-y-2">
                                {selectedLessonPlan.files.map((file) => (
                                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                                    <div className="flex items-center">
                                      <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <div>
                                        <span className="text-sm font-medium text-gray-900">{file.file_name}</span>
                                        <div className="text-xs text-gray-500">
                                          {Math.round(file.file_size / 1024)} KB • {file.mime_type} • {file.file_category || 'ไม่ระบุประเภท'}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex space-x-2">
                                      <button 
                                        onClick={() => window.open(`/api/files/${file.id}`, '_blank')}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                      >
                                        ดูไฟล์
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteFile(file.id)}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                      >
                                        ลบ
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">วันที่สร้าง</label>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(selectedLessonPlan.created_at)}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">วันที่อัปเดต</label>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(selectedLessonPlan.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowViewModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      ปิด
                    </button>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleEditLessonPlan(selectedLessonPlan);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      แก้ไข
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedLessonPlan && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">ยืนยันการลบ</h3>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">
                      คุณแน่ใจหรือไม่ที่จะลบแผนการสอน <strong>"{selectedLessonPlan.lesson_plan_name}"</strong>?
                    </p>
                    <p className="text-sm text-red-600 mt-2">
                      การดำเนินการนี้ไม่สามารถย้อนกลับได้
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </LoggedLayout>
        );
      };

      export default LessonPlans;
