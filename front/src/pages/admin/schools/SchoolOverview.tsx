import React, { useState, useEffect } from 'react';
import LoggedLayout from '../../../components/layouts/LoggedLayout';
import AcademicYearSelector from '../../../components/academic/AcademicYearSelector';
import SchoolCard from '../../../components/school/SchoolCard';
import AddStudentModal from '../../../components/school/AddStudentModal';
import AddTeacherModal from '../../../components/school/AddTeacherModal';
import { schoolSystemApiService } from '../../../services/schoolSystemApi';
import type { AcademicYear, SchoolOverview as SchoolOverviewType, SchoolTeacher } from '../../../types/school-system';

const SchoolOverview: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [schools, setSchools] = useState<SchoolOverviewType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolOverviewType | null>(null);
  const [availableTeachers] = useState<SchoolTeacher[]>([]);

  useEffect(() => {
    if (selectedYear) {
      fetchSchools();
    }
  }, [selectedYear]);

  const fetchSchools = async () => {
    if (!selectedYear) return;
    
    setLoading(true);
    try {
      const response = await schoolSystemApiService.getSchoolOverview(selectedYear.id);
      if (response.success && response.data) {
        setSchools(response.data.schools);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolClick = (school: SchoolOverviewType) => {
    // Navigate to school details page
    window.location.href = `/admin/schools/${school.school_id}/details?academicYearId=${selectedYear?.id}`;
  };

  const handleAddStudent = (school: SchoolOverviewType) => {
    setSelectedSchool(school);
    setShowAddStudentModal(true);
  };

  const handleAddTeacher = (school: SchoolOverviewType) => {
    setSelectedSchool(school);
    setShowAddTeacherModal(true);
  };

  const handleStudentSave = async (studentData: { student_id: number; student_code: string; teacher_id?: number }) => {
    console.log('🟢 SchoolOverview - handleStudentSave called', {
      studentData,
      selectedSchool: selectedSchool?.school_id,
      selectedYear: selectedYear?.id
    });

    if (!selectedSchool || !selectedYear) {
      console.log('🔴 SchoolOverview - Missing selectedSchool or selectedYear');
      return;
    }

    try {
      const apiData = {
        student_id: studentData.student_id,
        academic_year_id: selectedYear.id,
        teacher_id: studentData.teacher_id,
        start_date: new Date().toISOString().split('T')[0],
        end_date: selectedYear.end_date,
        notes: 'เพิ่มจากหน้า overview'
      };

      console.log('🟢 SchoolOverview - Calling assignStudent API', {
        schoolId: selectedSchool.school_id,
        apiData
      });

      const result = await schoolSystemApiService.assignStudent(selectedSchool.school_id, apiData);

      console.log('🟢 SchoolOverview - assignStudent API success:', result);

      setShowAddStudentModal(false);
      fetchSchools(); // Refresh data
      alert('เพิ่มนักศึกษาเรียบร้อยแล้ว');
    } catch (error: any) {
      console.error('🔴 SchoolOverview - assignStudent API failed:', error);
      alert(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleTeacherSave = async (teacherData: { teacher_id: number }) => {
    if (!selectedSchool || !selectedYear) return;

    try {
      await schoolSystemApiService.assignTeacher(selectedSchool.school_id, {
        teacher_id: teacherData.teacher_id,
        academic_year_id: selectedYear.id,
        is_primary: false,
        max_students: 5
      });

      setShowAddTeacherModal(false);
      fetchSchools(); // Refresh data
      alert('เพิ่มครูพี่เลี้ยงเรียบร้อยแล้ว');
    } catch (error: any) {
      console.error('Error adding teacher:', error);
      alert(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
    }
  };

  // Filter schools based on search
  const filteredSchools = schools.filter(school =>
    school.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.school_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate overall statistics
  const stats = {
    totalSchools: schools.length,
    openSchools: schools.filter(s => s.is_open).length,
    fullSchools: schools.filter(s => s.current_students >= s.max_students).length,
    totalStudents: schools.reduce((sum, s) => sum + s.current_students, 0),
    totalQuota: schools.reduce((sum, s) => sum + s.max_students, 0),
    totalTeachers: schools.reduce((sum, s) => sum + s.assigned_teachers, 0),
    completedStudents: schools.reduce((sum, s) => sum + s.completed_students, 0)
  };

  return (
    <LoggedLayout currentPage="ภาพรวมโรงเรียน">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ภาพรวมโรงเรียน</h1>
            <p className="text-gray-600 mt-1">ดูข้อมูลสรุปของโรงเรียนทั้งหมดในระบบ</p>
          </div>
        </div>

        {/* Academic Year Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <AcademicYearSelector
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              showAll={false}
            />
            
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค้นหาโรงเรียน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อโรงเรียนหรือรหัส..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {selectedYear && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h5a2 2 0 002-2V9a2 2 0 00-2-2H9a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">โรงเรียนทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSchools}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">นักศึกษา</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}/{stats.totalQuota}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">ครูพี่เลี้ยง</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTeachers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">เสร็จสิ้น</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedStudents}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schools Grid */}
        {selectedYear ? (
          <div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="h-16 bg-gray-100 rounded"></div>
                        <div className="h-16 bg-gray-100 rounded"></div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredSchools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSchools.map((school) => (
                  <SchoolCard
                    key={school.id}
                    school={school}
                    onClick={() => handleSchoolClick(school)}
                    onAddStudent={() => handleAddStudent(school)}
                    onAddTeacher={() => handleAddTeacher(school)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h5a2 2 0 002-2V9a2 2 0 00-2-2H9a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบโรงเรียน</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'ไม่พบโรงเรียนที่ตรงกับการค้นหา' : 'ไม่มีโรงเรียนในปีการศึกษานี้'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">เลือกปีการศึกษา</h3>
            <p className="mt-1 text-sm text-gray-500">กรุณาเลือกปีการศึกษาเพื่อดูข้อมูลโรงเรียน</p>
          </div>
        )}

        {/* Modals */}
        {selectedSchool && selectedYear && (
          <>
            <AddStudentModal
              isOpen={showAddStudentModal}
              onClose={() => setShowAddStudentModal(false)}
              onSave={handleStudentSave}
              schoolId={selectedSchool.school_id}
              academicYearId={selectedYear.id}
              availableTeachers={availableTeachers}
            />

            <AddTeacherModal
              isOpen={showAddTeacherModal}
              onClose={() => setShowAddTeacherModal(false)}
              onSave={handleTeacherSave}
              schoolId={selectedSchool.school_id}
              academicYearId={selectedYear.id}
            />
          </>
        )}
      </div>
    </LoggedLayout>
  );
};

export default SchoolOverview;
