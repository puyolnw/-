import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { supervisorApiService, type SchoolDetail, type AvailableUser } from '../../services/supervisorApi';

const SupervisorSchoolDetail: React.FC = () => {
  const navigate = useNavigate();
  const { schoolId } = useParams<{ schoolId: string }>();
  const [schoolDetail, setSchoolDetail] = useState<SchoolDetail | null>(null);
  const [availableTeachers, setAvailableTeachers] = useState<AvailableUser[]>([]);
  const [availableStudents, setAvailableStudents] = useState<AvailableUser[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedStudentTeacher, setSelectedStudentTeacher] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (schoolId) {
      fetchSchoolDetail();
      fetchAvailableUsers();
    }
  }, [schoolId, selectedYear]);

  const fetchSchoolDetail = async () => {
    try {
      console.log('🔄 Fetching school detail for schoolId:', schoolId, 'selectedYear:', selectedYear);
      setLoading(true);
      setError(null);
      
      const response = await supervisorApiService.getSchoolDetail(
        Number(schoolId), 
        selectedYear || undefined
      );
      
      console.log('📡 School detail response:', response);
      
      if (response.success && response.data) {
        console.log('✅ School detail data:', response.data);
        setSchoolDetail(response.data);
      } else {
        console.log('❌ School detail error:', response.message);
        setError(response.message || 'ไม่สามารถดึงข้อมูลโรงเรียนได้');
      }
    } catch (error) {
      console.error('💥 Error fetching school detail:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลโรงเรียน');
    } finally {
      console.log('🏁 Finished fetching school detail, setting loading to false');
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const [teachersResponse, studentsResponse] = await Promise.all([
        supervisorApiService.getAvailableTeachers(),
        supervisorApiService.getAvailableStudents()
      ]);

      if (teachersResponse.success) {
        setAvailableTeachers(teachersResponse.data);
      }
      if (studentsResponse.success) {
        setAvailableStudents(studentsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const handleAddTeacher = async () => {
    if (!selectedTeacher) return;

    try {
      setSubmitting(true);
      const response = await supervisorApiService.addTeacherToSchool(
        Number(schoolId), 
        selectedTeacher
      );

      if (response.success) {
        setShowAddTeacherModal(false);
        setSelectedTeacher('');
        fetchSchoolDetail();
        fetchAvailableUsers();
      } else {
        alert(response.message || 'ไม่สามารถเพิ่มครูพี่เลี้ยงได้');
      }
    } catch (error) {
      console.error('Error adding teacher:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มครูพี่เลี้ยง');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveTeacher = async (teacherId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบครูพี่เลี้ยงคนนี้ออกจากโรงเรียน?')) return;

    try {
      const response = await supervisorApiService.removeTeacherFromSchool(
        Number(schoolId), 
        teacherId
      );

      if (response.success) {
        fetchSchoolDetail();
        fetchAvailableUsers();
      } else {
        alert(response.message || 'ไม่สามารถลบครูพี่เลี้ยงได้');
      }
    } catch (error) {
      console.error('Error removing teacher:', error);
      alert('เกิดข้อผิดพลาดในการลบครูพี่เลี้ยง');
    }
  };

  const handleAddStudent = async () => {
    if (!selectedStudent || !selectedStudentTeacher) return;

    try {
      setSubmitting(true);
      const response = await supervisorApiService.addStudentToSchool(
        Number(schoolId), 
        {
          student_id: selectedStudent,
          teacher_id: selectedStudentTeacher,
          academic_year_id: selectedYear || 1 // ใช้ปีการศึกษาปัจจุบัน
        }
      );

      if (response.success) {
        setShowAddStudentModal(false);
        setSelectedStudent('');
        setSelectedStudentTeacher('');
        fetchSchoolDetail();
        fetchAvailableUsers();
      } else {
        alert(response.message || 'ไม่สามารถเพิ่มนักศึกษาได้');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มนักศึกษา');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบนักศึกษาคนนี้ออกจากโรงเรียน?')) return;

    try {
      const response = await supervisorApiService.removeStudentFromSchool(
        Number(schoolId), 
        studentId
      );

      if (response.success) {
        fetchSchoolDetail();
        fetchAvailableUsers();
      } else {
        alert(response.message || 'ไม่สามารถลบนักศึกษาได้');
      }
    } catch (error) {
      console.error('Error removing student:', error);
      alert('เกิดข้อผิดพลาดในการลบนักศึกษา');
    }
  };

  const handleStudentClick = (studentId: string) => {
    navigate(`/supervisor/students/${studentId}`);
  };

  console.log('🎯 SchoolDetail component state:', { loading, error, schoolDetail: !!schoolDetail, schoolId });

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

  if (error || !schoolDetail) {
    console.log('❌ Showing error state:', { error, schoolDetail: !!schoolDetail });
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
                onClick={() => navigate('/supervisor/schools')}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                กลับไปหน้ารายการ
              </button>
            </div>
          </div>
        </div>
      </LoggedLayout>
    );
  }

  console.log('🎨 Rendering main school detail content');
  return (
    <LoggedLayout currentPage="โรงเรียน">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{schoolDetail.school.name}</h1>
              <p className="text-blue-100">ข้อมูลโรงเรียนและนักศึกษาที่ฝึกงาน</p>
            </div>
            <button
              onClick={() => navigate('/supervisor/schools')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              กลับ
            </button>
          </div>
        </div>

        {/* School Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ข้อมูลโรงเรียน</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">ชื่อโรงเรียน</label>
              <p className="text-lg font-semibold text-gray-900">{schoolDetail.school.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ที่อยู่</label>
              <p className="text-gray-900">{schoolDetail.school.address}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
              <p className="text-gray-900">{schoolDetail.school.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">อีเมล</label>
              <p className="text-gray-900">{schoolDetail.school.email}</p>
            </div>
          </div>
        </div>

        {/* Academic Year Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ปีการศึกษา</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedYear(null)}
              className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                selectedYear === null
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
              }`}
            >
              ทั้งหมด
            </button>
            {schoolDetail.academicYears.map((year) => (
              <button
                key={year.id}
                onClick={() => setSelectedYear(year.id)}
                className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                  selectedYear === year.id
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
                }`}
              >
                {year.year} ({year.student_count} คน)
              </button>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ครูพี่เลี้ยง</p>
                <p className="text-2xl font-bold text-gray-900">{schoolDetail.teachers.length}</p>
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
                <p className="text-sm font-medium text-gray-600">นักศึกษา</p>
                <p className="text-2xl font-bold text-gray-900">{schoolDetail.students.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">กำลังฝึก</p>
                <p className="text-2xl font-bold text-gray-900">
                  {schoolDetail.students.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Teachers List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">ครูพี่เลี้ยง</h2>
            <button
              onClick={() => setShowAddTeacherModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              เพิ่มครูพี่เลี้ยง
            </button>
          </div>
          
          {schoolDetail.teachers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-lg">ยังไม่มีครูพี่เลี้ยงในโรงเรียนนี้</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ครูพี่เลี้ยง
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      นักศึกษาที่ดูแล
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่มอบหมาย
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schoolDetail.teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {teacher.first_name.charAt(0)}{teacher.last_name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {teacher.first_name} {teacher.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{teacher.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{teacher.student_count} คน</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(teacher.assigned_at).toLocaleDateString('th-TH')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleRemoveTeacher(teacher.teacher_id)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors duration-200"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Students List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">นักศึกษา</h2>
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              เพิ่มนักศึกษา
            </button>
          </div>
          
          {schoolDetail.students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-lg">ยังไม่มีนักศึกษาในโรงเรียนนี้</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      นักศึกษา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      คณะ/สาขา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถิติการฝึก
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
                  {schoolDetail.students.map((student) => (
                    <tr key={student.assignment_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-green-600">
                                {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{student.student_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.faculty}</div>
                        <div className="text-sm text-gray-500">{student.major}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          บันทึก: {student.teaching_sessions_count} | 
                          แผน: {student.lesson_plans_count}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {student.status === 'active' ? 'กำลังฝึก' : 'เสร็จสิ้น'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStudentClick(student.student_id)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors duration-200"
                          >
                            ดูรายละเอียด
                          </button>
                          <button
                            onClick={() => handleRemoveStudent(student.student_id)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors duration-200"
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
          )}
        </div>

        {/* Add Teacher Modal */}
        {showAddTeacherModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">เพิ่มครูพี่เลี้ยง</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลือกครูพี่เลี้ยง
                  </label>
                  <select
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">เลือกครูพี่เลี้ยง</option>
                    {availableTeachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name} ({teacher.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowAddTeacherModal(false);
                      setSelectedTeacher('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleAddTeacher}
                    disabled={!selectedTeacher || submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'กำลังเพิ่ม...' : 'เพิ่ม'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Student Modal */}
        {showAddStudentModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">เพิ่มนักศึกษา</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลือกนักศึกษา
                  </label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">เลือกนักศึกษา</option>
                    {availableStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.first_name} {student.last_name} ({student.student_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลือกครูพี่เลี้ยง
                  </label>
                  <select
                    value={selectedStudentTeacher}
                    onChange={(e) => setSelectedStudentTeacher(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">เลือกครูพี่เลี้ยง</option>
                    {schoolDetail.teachers.map((teacher) => (
                      <option key={teacher.teacher_id} value={teacher.teacher_id}>
                        {teacher.first_name} {teacher.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowAddStudentModal(false);
                      setSelectedStudent('');
                      setSelectedStudentTeacher('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleAddStudent}
                    disabled={!selectedStudent || !selectedStudentTeacher || submitting}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {submitting ? 'กำลังเพิ่ม...' : 'เพิ่ม'}
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

export default SupervisorSchoolDetail;
