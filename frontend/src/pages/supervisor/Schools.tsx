import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { supervisorApiService, type School } from '../../services/supervisorApi';

const SupervisorSchools: React.FC = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchAcademicYears();
    fetchSchools();
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [selectedYear]);

  const fetchAcademicYears = async () => {
    try {
      console.log('🔄 Starting to fetch academic years...');
      const response = await supervisorApiService.getAcademicYears();
      console.log('📡 Academic years response:', response);
      if (response.success && response.data) {
        console.log('✅ Academic years data:', response.data);
        setAcademicYears(response.data);
      } else {
        console.log('❌ Academic years error:', response.message);
      }
    } catch (error) {
      console.error('💥 Error fetching academic years:', error);
    }
  };

  const fetchSchools = async () => {
    try {
      console.log('🔄 Starting to fetch schools...');
      setLoading(true);
      setError(null);
      
      const params: any = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      if (selectedYear) {
        params.academic_year_id = selectedYear;
      }

      console.log('📡 API params:', params);
      const response = await supervisorApiService.getAllSchools(params);
      console.log('📡 API response:', response);
      
      if (response.success) {
        console.log('✅ Schools data:', response.data);
        setSchools(response.data);
        setPagination(response.pagination);
      } else {
        console.log('❌ API error:', response.message);
        setError(response.message || 'ไม่สามารถดึงข้อมูลโรงเรียนได้');
      }
    } catch (error) {
      console.error('💥 Error fetching schools:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลโรงเรียน');
    } finally {
      console.log('🏁 Finished fetching schools, setting loading to false');
      setLoading(false);
    }
  };

  const handleYearFilter = (yearId: number | null) => {
    setSelectedYear(yearId);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSchoolClick = (schoolId: number) => {
    navigate(`/supervisor/schools/${schoolId}`);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  console.log('🎯 Component state:', { loading, error, schools: schools.length, academicYears: academicYears.length });

  if (loading) {
    console.log('⏳ Showing loading state');
    return (
      <LoggedLayout currentPage="โรงเรียน">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LoggedLayout>
    );
  }

  if (error) {
    console.log('❌ Showing error state:', error);
    return (
      <LoggedLayout currentPage="โรงเรียน">
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">เกิดข้อผิดพลาด</h1>
            <p className="text-red-100">ไม่สามารถโหลดข้อมูลโรงเรียนได้</p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">ไม่สามารถโหลดข้อมูลโรงเรียน</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchSchools}
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

  console.log('🎨 Rendering main content');
  return (
    <LoggedLayout currentPage="โรงเรียน">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">โรงเรียนทั้งหมด</h1>
          <p className="text-blue-100">จัดการและติดตามข้อมูลโรงเรียนในระบบ</p>
        </div>

        {/* Academic Year Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">กรองตามปีการศึกษา</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleYearFilter(null)}
              className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                selectedYear === null
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
              }`}
            >
              ทั้งหมด
            </button>
            {academicYears.map((year, index) => (
              <button
                key={year.id || `year-${index}`}
                onClick={() => handleYearFilter(year.id)}
                className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                  selectedYear === year.id
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
                }`}
              >
                {year.academic_year}
              </button>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">โรงเรียนทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{schools.length}</p>
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
                <p className="text-sm font-medium text-gray-600">ครูพี่เลี้ยงทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">
                  {schools.reduce((sum, school) => sum + (school.teacher_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">นักศึกษาทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">
                  {schools.reduce((sum, school) => sum + (school.student_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ฝึกสำเร็จ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {schools.reduce((sum, school) => sum + (school.completed_students || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Schools Grid */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">รายการโรงเรียน</h2>
          
          {schools.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-lg">ไม่พบข้อมูลโรงเรียน</p>
            </div>
          ) : (
            <React.Fragment key="schools-list">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schools.map((school, index) => (
                  <div
                    key={school.id || `school-${index}`}
                    onClick={() => handleSchoolClick(school.id)}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{school.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{school.address}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {school.phone}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">สร้างเมื่อ</div>
                        <div className="text-sm text-gray-700">
                          {school.created_at ? new Date(school.created_at).toLocaleDateString('th-TH') : '-'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{school.teacher_count || 0}</div>
                        <div className="text-xs text-gray-500">ครูพี่เลี้ยง</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{school.student_count || 0}</div>
                        <div className="text-xs text-gray-500">นักศึกษา</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center text-green-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {school.completed_students || 0} สำเร็จ
                      </div>
                      <div className="flex items-center text-orange-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {school.active_students || 0} กำลังฝึก
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-8 flex justify-center">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ก่อนหน้า
                    </button>
                    
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          page === pagination.page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ถัดไป
                    </button>
                  </nav>
                </div>
              )}
            </React.Fragment>
          )}
        </div>
      </div>
    </LoggedLayout>
  );
};

export default SupervisorSchools;