import React, { useState, useEffect } from 'react';
import LoggedLayout from '../../../components/layouts/LoggedLayout';
import AcademicYearSelector from '../../../components/academic/AcademicYearSelector';
// import SchoolCard from '../../../components/school/SchoolCard';
import AssignmentModal from '../../../components/school/AssignmentModal';
import { schoolSystemApiService } from '../../../services/schoolSystemApi';
import type { AcademicYear, SchoolOverview } from '../../../types/school-system';

const SchoolManage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [schools, setSchools] = useState<SchoolOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<SchoolOverview | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'student' | 'teacher'>('student');
  const [assignmentLoading, setAssignmentLoading] = useState(false);

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

  const handleAddStudent = (school: SchoolOverview) => {
    setSelectedSchool(school);
    setAssignmentType('student');
    setShowAssignmentModal(true);
  };

  const handleAddTeacher = (school: SchoolOverview) => {
    setSelectedSchool(school);
    setAssignmentType('teacher');
    setShowAssignmentModal(true);
  };

  const handleAssignmentSave = async (data: any) => {
    if (!selectedSchool || !selectedYear) return;

    setAssignmentLoading(true);
    try {
      if (assignmentType === 'student') {
        await schoolSystemApiService.createAssignment({
          student_id: data.student_id,
          school_id: selectedSchool.school_id,
          academic_year_id: selectedYear.id,
          teacher_id: data.teacher_id,
          start_date: data.start_date,
          end_date: data.end_date,
          notes: data.notes
        });
        alert('เพิ่มนักศึกษาเรียบร้อยแล้ว');
      } else {
        await schoolSystemApiService.assignTeacher(selectedSchool.school_id, {
          teacher_id: data.teacher_id,
          academic_year_id: selectedYear.id,
          is_primary: data.is_primary,
          max_students: data.max_students
        });
        alert('เพิ่มครูพี่เลี้ยงเรียบร้อยแล้ว');
      }
      
      setShowAssignmentModal(false);
      await fetchSchools(); // Refresh data
    } catch (error: any) {
      console.error('Error saving assignment:', error);
      alert(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleToggleEnrollment = async (school: SchoolOverview) => {
    if (!selectedYear) return;

    const action = school.is_open ? 'ปิด' : 'เปิด';
    if (!confirm(`ต้องการ${action}รับสมัครสำหรับ ${school.school_name} หรือไม่?`)) return;

    try {
      await schoolSystemApiService.updateEnrollmentStatus(school.school_id, {
        academic_year_id: selectedYear.id,
        is_open: !school.is_open
      });
      await fetchSchools(); // Refresh data
      alert(`${action}รับสมัครเรียบร้อยแล้ว`);
    } catch (error: any) {
      console.error('Error toggling enrollment:', error);
      alert(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
    }
  };

  // Filter schools based on search
  const filteredSchools = schools.filter(school =>
    school.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.school_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <LoggedLayout currentPage="จัดการโรงเรียน">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">จัดการโรงเรียน</h1>
            <p className="text-gray-600 mt-1">จัดการนักศึกษาและครูพี่เลี้ยงในแต่ละโรงเรียน</p>
          </div>
        </div>

        {/* Controls */}
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

        {/* Schools Management Grid */}
        {selectedYear ? (
          <div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-64"></div>
                  </div>
                ))}
              </div>
            ) : filteredSchools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSchools.map((school) => (
                  <div key={school.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                    {/* School Card Content */}
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {school.school_name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            รหัส: {school.school_id}
                          </p>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {school.address}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          !school.is_open ? 'bg-gray-100 text-gray-800' :
                          school.current_students >= school.max_students ? 'bg-red-100 text-red-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {!school.is_open ? 'ปิดรับสมัคร' :
                           school.current_students >= school.max_students ? 'เต็มแล้ว' :
                           'เปิดรับสมัคร'}
                        </span>
                      </div>

                      {/* Statistics */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {school.current_students}/{school.max_students}
                          </div>
                          <div className="text-sm text-blue-600">นักศึกษา</div>
                          {school.available_slots > 0 && (
                            <div className="text-xs text-blue-500 mt-1">
                              ว่าง {school.available_slots} ที่
                            </div>
                          )}
                        </div>

                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {school.assigned_teachers}/{school.max_teachers}
                          </div>
                          <div className="text-sm text-green-600">ครูพี่เลี้ยง</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddStudent(school);
                            }}
                            disabled={!school.is_open || school.available_slots <= 0}
                            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            + นักศึกษา
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddTeacher(school);
                            }}
                            disabled={school.current_teachers >= school.max_teachers}
                            className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            + ครูพี่เลี้ยง
                          </button>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleEnrollment(school);
                          }}
                          className={`w-full px-3 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
                            school.is_open 
                              ? 'bg-red-600 hover:bg-red-700' 
                              : 'bg-yellow-600 hover:bg-yellow-700'
                          }`}
                        >
                          {school.is_open ? 'ปิดรับสมัคร' : 'เปิดรับสมัคร'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/admin/schools/${school.school_id}/details?academicYearId=${selectedYear?.id}`;
                          }}
                          className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          ดูรายละเอียด
                        </button>
                      </div>
                    </div>
                  </div>
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
            <p className="mt-1 text-sm text-gray-500">กรุณาเลือกปีการศึกษาเพื่อจัดการโรงเรียน</p>
          </div>
        )}

        {/* Assignment Modal */}
        {showAssignmentModal && selectedSchool && selectedYear && (
          <AssignmentModal
            isOpen={showAssignmentModal}
            onClose={() => setShowAssignmentModal(false)}
            onSave={handleAssignmentSave}
            schoolId={selectedSchool.school_id}
            academicYearId={selectedYear.id}
            type={assignmentType}
            loading={assignmentLoading}
          />
        )}
      </div>
    </LoggedLayout>
  );
};

export default SchoolManage;
