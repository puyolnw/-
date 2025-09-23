import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import LoggedLayout from '../../../components/layouts/LoggedLayout';
import StudentList from '../../../components/school/StudentList';
import TeacherList from '../../../components/school/TeacherList';
import QuotaSettings from '../../../components/school/QuotaSettings';
import AcademicYearSettings from '../../../components/school/AcademicYearSettings';
import AddStudentModal from '../../../components/school/AddStudentModal';
import AddTeacherModal from '../../../components/school/AddTeacherModal';
import { schoolSystemApiService } from '../../../services/schoolSystemApi';
import type { SchoolOverview, InternshipAssignment, SchoolTeacher } from '../../../types/school-system';

const SchoolDetails: React.FC = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const [searchParams] = useSearchParams();
  const academicYearId = parseInt(searchParams.get('academicYearId') || '0');

  const [school, setSchool] = useState<SchoolOverview | null>(null);
  const [students, setStudents] = useState<InternshipAssignment[]>([]);
  const [teachers, setTeachers] = useState<SchoolTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'teachers'>('overview');
  const [showQuotaSettings, setShowQuotaSettings] = useState(false);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [showAcademicYearSettings, setShowAcademicYearSettings] = useState(false);
  const [academicYearLoading, setAcademicYearLoading] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchSchoolDetails = useCallback(async () => {
    // Prevent duplicate calls
    if (isFetchingRef.current) {
      console.log('🔴 SchoolDetails - Already fetching, skipping duplicate call');
      return;
    }
    
    isFetchingRef.current = true;
    console.log('🟡 SchoolDetails - fetchSchoolDetails called', {
      schoolId,
      academicYearId,
      timestamp: new Date().toISOString()
    });

    if (!schoolId || !academicYearId) {
      console.log('🔴 SchoolDetails - Missing schoolId or academicYearId');
      return;
    }

    setLoading(true);
    try {
      console.log('🟡 SchoolDetails - Calling getSchoolDetails API');
      const response = await schoolSystemApiService.getSchoolDetails(schoolId, academicYearId);
      
      console.log('🟡 SchoolDetails - getSchoolDetails API response', {
        success: response.success,
        hasData: !!response.data,
        school: response.data?.school,
        studentsCount: response.data?.students?.length,
        students: response.data?.students,
        teachersCount: response.data?.teachers?.length,
        teachers: response.data?.teachers
      });

      if (response.success && response.data) {
        setSchool(response.data.school);
        setStudents(response.data.students);
        setTeachers(response.data.teachers);
        
        console.log('🟡 SchoolDetails - State updated', {
          schoolSet: !!response.data.school,
          studentsSet: response.data.students?.length,
          teachersSet: response.data.teachers?.length
        });
      }
    } catch (error) {
      console.error('🔴 SchoolDetails - Error fetching school details:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [schoolId, academicYearId]);

  useEffect(() => {
    if (schoolId && academicYearId) {
      fetchSchoolDetails();
    }
  }, [schoolId, academicYearId, fetchSchoolDetails]);

  const handleQuotaSave = async (quotaData: { max_students: number; max_teachers: number; is_open: boolean }) => {
    if (!schoolId) return;

    setQuotaLoading(true);
    try {
      await schoolSystemApiService.setSchoolQuota(schoolId, {
        academic_year_id: academicYearId,
        ...quotaData
      });
      
      setShowQuotaSettings(false);
      await fetchSchoolDetails(); // Refresh data
      alert('ตั้งค่าโควตาเรียบร้อยแล้ว');
    } catch (error: any) {
      console.error('Error setting quota:', error);
      alert(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
    } finally {
      setQuotaLoading(false);
    }
  };

  const handleAcademicYearSave = async (yearData: { academicYearId: number; start_date: string; end_date: string }) => {
    if (!schoolId) {
      alert('ไม่พบรหัสโรงเรียน');
      return;
    }

    setAcademicYearLoading(true);
    try {
      // Update school-specific academic year schedule
      await schoolSystemApiService.updateSchoolSchedule(schoolId, {
        academic_year_id: yearData.academicYearId,
        internship_start_date: yearData.start_date,
        internship_end_date: yearData.end_date,
        preparation_start_date: yearData.start_date, // Use same date for preparation
        orientation_date: yearData.start_date, // Use same date for orientation
        evaluation_date: yearData.end_date, // Use same date for evaluation
        notes: 'อัปเดตโดยระบบ',
        updated_by: 1 // TODO: Get from current user
      });
      
      setShowAcademicYearSettings(false);
      fetchSchoolDetails(); // Refresh data
      alert('ตั้งค่าปีการศึกษาเรียบร้อยแล้ว');
    } catch (error: any) {
      console.error('Error setting academic year:', error);
      alert(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
    } finally {
      setAcademicYearLoading(false);
    }
  };

  const handleRemoveStudent = useCallback(async (assignment: InternshipAssignment) => {
    if (!confirm(`ต้องการลบ ${assignment.student_name} ออกจากโรงเรียนหรือไม่?`)) return;

    try {
      await schoolSystemApiService.deleteAssignment(assignment.id);
      await fetchSchoolDetails(); // Refresh data
      alert('ลบนักศึกษาเรียบร้อยแล้ว');
    } catch (error: any) {
      console.error('Error removing student:', error);
      alert(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
    }
  }, [fetchSchoolDetails]);

  const handleRemoveTeacher = useCallback(async (teacher: SchoolTeacher) => {
    if (!confirm(`ต้องการลบ ${teacher.teacher_name} ออกจากโรงเรียนหรือไม่?`)) return;

    try {
      await schoolSystemApiService.removeTeacher(teacher.id);
      await fetchSchoolDetails(); // Refresh data
      alert('ลบครูพี่เลี้ยงเรียบร้อยแล้ว');
    } catch (error: any) {
      console.error('Error removing teacher:', error);
      alert(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
    }
  }, [fetchSchoolDetails]);

  const handleSetPrimaryTeacher = async (teacher: SchoolTeacher) => {
    if (!confirm(`ต้องการตั้ง ${teacher.teacher_name} เป็นครูหลักหรือไม่?`)) return;

    try {
      await schoolSystemApiService.setPrimaryTeacher(teacher.id);
      await fetchSchoolDetails(); // Refresh data
      alert('ตั้งครูหลักเรียบร้อยแล้ว');
    } catch (error: any) {
      console.error('Error setting primary teacher:', error);
      alert(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleAddStudent = useCallback(async (studentData: { student_id: number; student_code: string; teacher_id?: number }) => {
    console.log('🟡 SchoolDetails - handleAddStudent called', {
      studentData,
      schoolId,
      academicYearId
    });

    if (!schoolId || !academicYearId) {
      console.log('🔴 SchoolDetails - Missing schoolId or academicYearId');
      throw new Error('Missing schoolId or academicYearId');
    }

    try {
      const apiData = {
        student_id: studentData.student_id,
        academic_year_id: academicYearId,
        teacher_id: studentData.teacher_id,
        start_date: new Date().toISOString().split('T')[0],
        end_date: school?.academic_end_date,
        notes: 'เพิ่มจากหน้า details'
      };

      console.log('🟡 SchoolDetails - Calling assignStudent API', {
        schoolId,
        apiData
      });

      const result = await schoolSystemApiService.assignStudent(schoolId, apiData);

      console.log('🟡 SchoolDetails - assignStudent API success:', result);
      
      // รีเฟรชข้อมูลหลังจาก API สำเร็จ
      await fetchSchoolDetails();
      console.log('🟢 SchoolDetails - Data refreshed successfully');
      
      // ไม่ต้อง alert ที่นี่ ให้ AddStudentModal จัดการ
      return result; // Return ผลลัพธ์กลับไป
    } catch (error: any) {
      console.error('🔴 SchoolDetails - assignStudent API failed:', error);
      // Re-throw error ให้ AddStudentModal จัดการ
      throw error;
    }
  }, [schoolId, academicYearId, school?.academic_end_date, fetchSchoolDetails]);

  const handleAddTeacher = useCallback(async (teacherData: { teacher_id: number; is_primary: boolean; max_students: number }) => {
    if (!schoolId || !academicYearId) return;

    try {
      await schoolSystemApiService.assignTeacher(schoolId, {
        teacher_id: teacherData.teacher_id,
        academic_year_id: academicYearId,
        is_primary: teacherData.is_primary,
        max_students: teacherData.max_students
      });
      
      setShowAddTeacherModal(false);
      fetchSchoolDetails();
      alert('เพิ่มครูพี่เลี้ยงเรียบร้อยแล้ว');
    } catch (error: any) {
      console.error('Error adding teacher:', error);
      alert(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
    }
  }, [schoolId, academicYearId, fetchSchoolDetails]);

  if (loading) {
    return (
      <LoggedLayout currentPage="รายละเอียดโรงเรียน">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </LoggedLayout>
    );
  }

  if (!school) {
    return (
      <LoggedLayout currentPage="รายละเอียดโรงเรียน">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบโรงเรียน</h3>
          <p className="mt-1 text-sm text-gray-500">ไม่พบข้อมูลโรงเรียนที่ระบุ</p>
        </div>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout currentPage={`${school.school_name}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{school.school_name}</h1>
                <p className="text-gray-600">รหัส: {school.school_id} | ปีการศึกษา: {school.year}/{school.semester}</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAcademicYearSettings(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              จัดการปีการศึกษา
            </button>
            <button
              onClick={() => setShowQuotaSettings(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              ตั้งค่าโควตา
            </button>
          </div>
        </div>

        {/* School Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Basic Info */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-3">ข้อมูลโรงเรียน</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium text-gray-700">ที่อยู่:</span> {school.address}</p>
                {school.phone && <p><span className="font-medium text-gray-700">โทรศัพท์:</span> {school.phone}</p>}
                <p>
                  <span className="font-medium text-gray-700">สถานะ:</span>
                  <span className={`ml-1 ${school.is_open ? 'text-green-600' : 'text-red-600'}`}>
                    {school.is_open ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
                  </span>
                </p>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">ปีการศึกษา {school.year}/{school.semester}</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>วันที่เปิดเทอม: {school.academic_start_date ? new Date(school.academic_start_date).toLocaleDateString('th-TH') : 'ยังไม่ได้ตั้งค่า'}</p>
                    <p>วันที่ปิดเทอม: {school.academic_end_date ? new Date(school.academic_end_date).toLocaleDateString('th-TH') : 'ยังไม่ได้ตั้งค่า'}</p>
                    <p>วันที่เริ่มฝึกงาน: {school.internship_start_date ? new Date(school.internship_start_date).toLocaleDateString('th-TH') : 'ยังไม่ได้ตั้งค่า'}</p>
                    <p>วันที่สิ้นสุดฝึกงาน: {school.internship_end_date ? new Date(school.internship_end_date).toLocaleDateString('th-TH') : 'ยังไม่ได้ตั้งค่า'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">นักศึกษา</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">กำลังฝึก:</span>
                  <span className="font-medium">{school.active_students}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">เสร็จแล้ว:</span>
                  <span className="font-medium">{school.completed_students}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">โควตา:</span>
                  <span className="font-medium">{school.current_students}/{school.max_students}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ที่ว่าง:</span>
                  <span className="font-medium text-green-600">{school.available_slots}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">ครูพี่เลี้ยง</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ทั้งหมด:</span>
                  <span className="font-medium">{school.assigned_teachers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ครูหลัก:</span>
                  <span className="font-medium">{school.primary_teachers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">โควตา:</span>
                  <span className="font-medium">{school.current_teachers}/{school.max_teachers}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ภาพรวม
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'students'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                นักศึกษา ({school.current_students})
              </button>
              <button
                onClick={() => setActiveTab('teachers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'teachers'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ครูพี่เลี้ยง ({school.assigned_teachers})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Progress Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{school.active_students}</div>
                    <div className="text-sm text-blue-600">กำลังฝึกงาน</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{school.completed_students}</div>
                    <div className="text-sm text-green-600">เสร็จสิ้นแล้ว</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-3xl font-bold text-yellow-600">{school.available_slots}</div>
                    <div className="text-sm text-yellow-600">ที่ว่าง</div>
                  </div>
                </div>

                {/* Capacity Progress */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">ความจุโรงเรียน</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>นักศึกษา</span>
                        <span>{school.current_students}/{school.max_students}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((school.current_students / school.max_students) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>ครูพี่เลี้ยง</span>
                        <span>{school.current_teachers}/{school.max_teachers}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((school.current_teachers / school.max_teachers) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">รายการนักศึกษา</h3>
                  <button
                    onClick={() => setShowAddStudentModal(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    เพิ่มนักศึกษา
                  </button>
                </div>
                <StudentList
                  students={students}
                  onRemove={handleRemoveStudent}
                  onUpdateStatus={(_assignment) => {/* TODO: เปลี่ยนสถานะ */}}
                  onAssignTeacher={(_assignment) => {/* TODO: จัดครู */}}
                />
              </div>
            )}

            {activeTab === 'teachers' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">รายการครูพี่เลี้ยง</h3>
                  <button
                    onClick={() => setShowAddTeacherModal(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    เพิ่มครูพี่เลี้ยง
                  </button>
                </div>
                <TeacherList
                  teachers={teachers}
                  onRemove={handleRemoveTeacher}
                  onSetPrimary={handleSetPrimaryTeacher}
                  onEdit={(_teacher) => {/* TODO: แก้ไขครู */}}
                />
              </div>
            )}
          </div>
        </div>

        {/* Quota Settings Modal */}
        {showQuotaSettings && (
          <QuotaSettings
            school={school}
            onSave={handleQuotaSave}
            onClose={() => setShowQuotaSettings(false)}
            loading={quotaLoading}
          />
        )}

        {/* Academic Year Settings Modal */}
        {showAcademicYearSettings && (
          <AcademicYearSettings
            isOpen={showAcademicYearSettings}
            onClose={() => setShowAcademicYearSettings(false)}
            onSave={handleAcademicYearSave}
            schoolId={schoolId || ''}
            currentYear={school ? { id: academicYearId, year: school?.year || '', semester: school?.semester || 1, start_date: school?.year || '', end_date: school?.year || '', registration_start: '', registration_end: '', is_active: true, created_at: '', updated_at: '' } : undefined}
            loading={academicYearLoading}
          />
        )}

        {/* Add Student Modal */}
        {showAddStudentModal && (
          <AddStudentModal
            isOpen={showAddStudentModal}
            onClose={() => setShowAddStudentModal(false)}
            onSave={handleAddStudent}
            schoolId={schoolId || ''}
            academicYearId={academicYearId}
            availableTeachers={teachers}
          />
        )}

        {/* Add Teacher Modal */}
        {showAddTeacherModal && (
          <AddTeacherModal
            isOpen={showAddTeacherModal}
            onClose={() => setShowAddTeacherModal(false)}
            onSave={handleAddTeacher}
            schoolId={schoolId || ''}
            academicYearId={academicYearId}
          />
        )}
      </div>
    </LoggedLayout>
  );
};

export default SchoolDetails;

