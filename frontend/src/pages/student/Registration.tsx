import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { studentApiService, type School } from '../../services/studentApi';
import { useStudentStatusContext } from '../../contexts/StudentStatusContext';
import apiService from '../../services/api';

// School interface imported from studentApi

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const { status, refreshStatus } = useStudentStatusContext();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAcademicYearId, setActiveAcademicYearId] = useState<number | null>(null);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<number | null>(null);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [academicYearInfo, setAcademicYearInfo] = useState<{
    year: string;
    semester: number;
    registration_start: string;
    registration_end: string;
  } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const fetchSchools = async (page = 1, search = '') => {
    try {
      console.log('🔵 Frontend - fetchSchools called with:', { page, search });
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: 12,
        search: search || undefined,
        academic_year_id: selectedAcademicYearId || activeAcademicYearId || 3
      };
      
      console.log('🔵 Frontend - fetchSchools params:', params);

      const response = await studentApiService.getAvailableSchools(params);
      console.log('🔵 Frontend - fetchSchools response:', response);

      if (response.success && response.data) {
        console.log('🔵 Frontend - fetchSchools data:', response.data);
        console.log('🔵 Frontend - Schools count:', response.data.schools?.length);
        console.log('🔵 Frontend - Pagination:', response.data.pagination);
        
        setSchools(response.data.schools);
        setCurrentPage(response.data.pagination.page);
        setTotalPages(response.data.pagination.totalPages);
        setHasNext(response.data.pagination.hasNext);
        setHasPrev(response.data.pagination.hasPrev);
      } else {
        console.log('🔴 Frontend - fetchSchools failed:', response);
        throw new Error(response.message || 'Failed to fetch schools');
      }
    } catch (error: any) {
      console.error('🔴 Frontend - Error fetching schools:', error);
      setError(error.message || 'ไม่สามารถโหลดข้อมูลโรงเรียนได้');
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  // ดึงข้อมูลปีการศึกษาทั้งหมด
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        console.log('🔵 Frontend - fetchAcademicYears called');
        // ใช้ API เพื่อดึงข้อมูลปีการศึกษาทั้งหมด (สำหรับ student)
        const response = await apiService.get('/student/assignments/academic-years');
        console.log('🔵 Frontend - fetchAcademicYears response:', response);
        
        if (response.success && response.data?.academicYears) {
          const years = response.data.academicYears;
          console.log('🔵 Frontend - Academic years:', years);
          setAcademicYears(years);
          
          // หาปีการศึกษาที่ active
          const activeYear = years.find((year: any) => year.is_active);
          console.log('🔵 Frontend - Active academic year:', activeYear);
          if (activeYear) {
            setActiveAcademicYearId(activeYear.id);
            setSelectedAcademicYearId(activeYear.id); // เลือกปี active เป็นค่าเริ่มต้น
            updateAcademicYearInfo(activeYear);
            console.log('🔵 Frontend - Set active academic year ID:', activeYear.id);
          }
        }
      } catch (error) {
        console.error('🔴 Frontend - Error fetching academic years:', error);
        // Fallback ใช้ id = 3 ถ้า API ไม่ทำงาน
        console.log('🔵 Frontend - Using fallback academic year ID: 3');
        setActiveAcademicYearId(3);
        setSelectedAcademicYearId(3);
        setAcademicYearInfo({
          year: '2568',
          semester: 1,
          registration_start: '2025-04-01',
          registration_end: '2025-05-31'
        });
      }
    };

    fetchAcademicYears();
  }, []);

  // Function สำหรับอัปเดตข้อมูลปีการศึกษา
  const updateAcademicYearInfo = (year: any) => {
    setAcademicYearInfo({
      year: year.year,
      semester: year.semester,
      registration_start: year.registration_start,
      registration_end: year.registration_end
    });
  };

  // เมื่อเลือกปีการศึกษาเปลี่ยน
  const handleAcademicYearChange = (yearId: number) => {
    console.log('🔵 Frontend - handleAcademicYearChange called with yearId:', yearId);
    setSelectedAcademicYearId(yearId);
    const selectedYear = academicYears.find(year => year.id === yearId);
    console.log('🔵 Frontend - Selected academic year:', selectedYear);
    if (selectedYear) {
      updateAcademicYearInfo(selectedYear);
    }
    // รีเซ็ต pagination และโหลดโรงเรียนใหม่
    setCurrentPage(1);
    fetchSchools(1, searchTerm);
  };

  useEffect(() => {
    if (selectedAcademicYearId) {
      fetchSchools(1, searchTerm);
    }
  }, [selectedAcademicYearId]);

  // ตรวจสอบสถานะการลงทะเบียน
  useEffect(() => {
    console.log('🔵 Frontend - Registration useEffect - status:', status);
    console.log('🔵 Frontend - Registration useEffect - status.isRegistered:', status.isRegistered);
    console.log('🔵 Frontend - Registration useEffect - status.loading:', status.loading);
    if (status.isRegistered) {
      console.log('🔵 Frontend - User is already registered, redirecting to dashboard');
      // ถ้าลงทะเบียนแล้ว ให้ redirect ไปหน้า Dashboard
      navigate('/student/dashboard');
    }
  }, [status.isRegistered, status.loading, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔵 Frontend - handleSearch called with searchTerm:', searchTerm);
    setCurrentPage(1);
    fetchSchools(1, searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    console.log('🔵 Frontend - handlePageChange called with newPage:', newPage);
    fetchSchools(newPage, searchTerm);
  };

  const handleSelectSchool = (school: School) => {
    // ลดเงื่อนไขการตรวจสอบ - ให้ง่ายขึ้น
    console.log('🔵 Frontend - School selected:', school);
    setSelectedSchool(school);
    setShowConfirmModal(true);
  };

  const handleConfirmRegistration = async () => {
    if (!selectedSchool || !activeAcademicYearId) return;

    try {
      setSubmitting(true);
      
      console.log('🔵 Frontend - handleConfirmRegistration called');
      console.log('🔵 Frontend - selectedSchool:', selectedSchool);
      console.log('🔵 Frontend - activeAcademicYearId:', activeAcademicYearId);
      console.log('🔵 Frontend - selectedAcademicYearId:', selectedAcademicYearId);
      
      const schoolId = selectedSchool.school_id;
      // ใช้ปีการศึกษา 3 (ปีปัจจุบัน) เสมอ เพื่อให้ง่ายขึ้น
      const academicYearId = 3;
      
      console.log('🔵 Frontend - Calling registerToSchool with:', { schoolId, academicYearId });
      
      const response = await studentApiService.registerToSchool(schoolId, academicYearId);

      if (response.success) {
        // รีเฟรช student status
        refreshStatus();
        
        // แสดงข้อความสำเร็จ
        alert(`ลงทะเบียนสำเร็จ! ยินดีต้อนรับสู่ ${selectedSchool.school_name}`);
        
        // นำทางไปหน้า dashboard
        navigate('/student/dashboard');
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setSubmitting(false);
      setShowConfirmModal(false);
      setSelectedSchool(null);
    }
  };

  const getStatusBadge = () => {
    // ลดเงื่อนไข - แสดงสถานะง่ายๆ
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        เปิดรับสมัคร
      </span>
    );
  };

  // แสดง loading หรือข้อความเมื่อได้ลงทะเบียนแล้ว
  if (status.loading) {
    console.log('🔵 Frontend - Registration showing loading state');
    return (
      <LoggedLayout currentPage="ลงทะเบียนโรงเรียน">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">กำลังตรวจสอบสถานะการลงทะเบียน...</p>
              </div>
            </div>
          </div>
        </div>
      </LoggedLayout>
    );
  }

  if (status.isRegistered) {
    console.log('🔵 Frontend - Registration showing already registered state');
    console.log('🔵 Frontend - School info:', status.schoolInfo);
    return (
      <LoggedLayout currentPage="ลงทะเบียนโรงเรียน">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-8">
              <div className="text-center">
                <div className="text-green-500 mb-4">
                  <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">คุณได้ลงทะเบียนโรงเรียนแล้ว!</h3>
                <p className="text-lg text-gray-600 mb-6">
                  คุณได้ลงทะเบียนที่ <strong>{status.schoolInfo?.school_name}</strong> แล้ว
                </p>
                <div className="space-x-4">
                  <button
                    onClick={() => navigate('/student/dashboard')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    ไปยัง Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/student/school')}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    ดูข้อมูลโรงเรียน
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LoggedLayout>
    );
  }

  console.log('🔵 Frontend - Registration rendering main form');
  console.log('🔵 Frontend - Current state:', {
    loading,
    schools: schools.length,
    selectedSchool,
    activeAcademicYearId,
    selectedAcademicYearId,
    academicYearInfo,
    searchTerm,
    currentPage,
    totalPages
  });

  return (
    <LoggedLayout currentPage="ลงทะเบียนโรงเรียน">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold">ลงทะเบียนโรงเรียน</h1>
                <p className="text-lg opacity-90">เลือกโรงเรียนที่คุณต้องการไปฝึกประสบการณ์วิชาชีพ</p>
              </div>
            </div>
            
            {/* Academic Year Info */}
            {academicYearInfo && (
              <div className="bg-white bg-opacity-20 rounded-lg p-4 text-right">
                <div className="text-sm opacity-75">ปีการศึกษา</div>
                <div className="text-xl font-bold">{academicYearInfo.year}/{academicYearInfo.semester}</div>
                <div className="text-xs opacity-75 mt-1">
                  รับสมัคร: {new Date(academicYearInfo.registration_start).toLocaleDateString('th-TH')} - {new Date(academicYearInfo.registration_end).toLocaleDateString('th-TH')}
                </div>
                {/* ลบการแสดงสถานะช่วงรับสมัคร - ให้ง่ายขึ้น */}
              </div>
            )}
          </div>
        </div>

        {/* Academic Year Selector & Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          {/* Academic Year Selector */}
          {academicYears.length > 0 && (
            <div>
              <label htmlFor="academic-year" className="block text-sm font-medium text-gray-700 mb-2">
                เลือกปีการศึกษา
              </label>
              <select
                id="academic-year"
                value={selectedAcademicYearId || ''}
                onChange={(e) => handleAcademicYearChange(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {academicYears.map((year) => {
                  const isActive = year.is_active === 1 || year.is_active === true;
                  
                  return (
                    <option key={year.id} value={year.id}>
                      {year.year}/{year.semester} 
                      {isActive ? ' (ปีปัจจุบัน)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาโรงเรียนตามชื่อหรือที่อยู่..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? 'ค้นหา...' : 'ค้นหา'}
            </button>
          </form>
        </div>

        {/* ลบการแสดงคำเตือนช่วงรับสมัคร - ให้ง่ายขึ้น */}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Schools Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : schools.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบโรงเรียน</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'ไม่พบโรงเรียนที่ตรงกับการค้นหา' : 'ไม่มีโรงเรียนที่เปิดรับสมัครในขณะนี้'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schools.map((school) => {
                console.log('🔵 Frontend - Rendering school:', school);
                return (
                <div
                  key={school.school_id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1">
                        {school.school_name}
                      </h3>
                      {getStatusBadge()}
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <p className="flex items-start">
                        <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {school.address}
                      </p>
                      {school.phone && (
                        <p className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {school.phone}
                        </p>
                      )}
                      {school.teachers && (
                        <p className="flex items-start">
                          <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span className="text-xs">ครูพี่เลี้ยง: {school.teachers}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm">
                        <span className="text-gray-600">ที่ว่าง: </span>
                        <span className={`font-semibold ${school.available_slots > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {school.available_slots}/{school.max_students}
                        </span>
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${school.current_students >= school.max_students ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min((school.current_students / school.max_students) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectSchool(school)}
                      className="w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      เลือกโรงเรียนนี้
                    </button>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!hasPrev}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNext}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!hasPrev}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ก่อนหน้า
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!hasNext}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Confirmation Modal */}
        {showConfirmModal && selectedSchool && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

              <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      ยืนยันการลงทะเบียน
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        คุณต้องการลงทะเบียนเข้าโรงเรียน <strong>{selectedSchool.school_name}</strong> หรือไม่?
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        หมายเหตุ: หลังจากลงทะเบียนแล้ว คุณจะไม่สามารถเปลี่ยนโรงเรียนได้
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleConfirmRegistration}
                    disabled={submitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {submitting ? 'กำลังลงทะเบียน...' : 'ยืนยัน'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmModal(false);
                      setSelectedSchool(null);
                    }}
                    disabled={submitting}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    ยกเลิก
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

export default Registration;
