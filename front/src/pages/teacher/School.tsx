import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { teacherApiService } from '../../services/teacherApi';

interface SchoolInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface AcademicYear {
  id: number;
  year: string;
  studentCount: number;
  completedCount: number;
  completionRate: number;
}

interface Student {
  id: number;
  user_id: string;
  first_name: string;
  last_name: string;
  student_code: string;
  email: string;
  phone: string;
  faculty: string;
  major: string;
  enrollment_date: string;
  status: string;
  totalTeachingSessions: number;
  totalTeachingHours: number;
  totalLessonPlans: number;
  lastActivity: string;
}

const TeacherSchool: React.FC = () => {
  const navigate = useNavigate();
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchoolData();
  }, []);

  const fetchSchoolData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await teacherApiService.getMySchoolInfo();
      
      if (response.success && response.data) {
        setSchoolInfo(response.data.schoolInfo);
        setAcademicYears(response.data.academicYears || []);
        setStudents(response.data.students || []);
        
        // Check if school info is missing
        if (!response.data.schoolInfo) {
          setError('ไม่พบข้อมูลโรงเรียน กรุณาติดต่อผู้ดูแลระบบ');
        }
      } else {
        setError(response.message || 'ไม่สามารถดึงข้อมูลโรงเรียนได้');
      }
    } catch (error: any) {
      console.error('Error fetching school data:', error);
      setError('ไม่สามารถดึงข้อมูลโรงเรียนได้ กรุณาติดต่อผู้ดูแลระบบ');
    } finally {
      setLoading(false);
    }
  };

  const handleYearFilter = (yearId: number | null) => {
    setSelectedYear(yearId);
    // TODO: Filter students by academic year
  };

  const handleStudentClick = (studentId: number) => {
    navigate(`/teacher/students/${studentId}`);
  };

  if (loading) {
    return (
      <LoggedLayout currentPage="โรงเรียน">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LoggedLayout>
    );
  }

  if (error) {
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
                  <p className="mt-2">กรุณาติดต่อผู้ดูแลระบบเพื่อขอความช่วยเหลือ</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchSchoolData}
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

  return (
    <LoggedLayout currentPage="โรงเรียน">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">ข้อมูลโรงเรียน</h1>
          <p className="text-blue-100">โรงเรียนที่คุณสังกัดและนักศึกษาที่ดูแล</p>
        </div>

        {/* School Information */}
        {schoolInfo ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">ข้อมูลโรงเรียน</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ชื่อโรงเรียน</label>
                <p className="text-lg font-semibold text-gray-900">{schoolInfo.name || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ที่อยู่</label>
                <p className="text-gray-900">{schoolInfo.address || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                <p className="text-gray-900">{schoolInfo.phone || '-'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-yellow-800">ไม่พบข้อมูลโรงเรียน</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>ระบบไม่พบข้อมูลโรงเรียนที่คุณสังกัด</p>
                  <p className="mt-1">กรุณาติดต่อผู้ดูแลระบบเพื่อขอความช่วยเหลือ</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Academic Year Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ปีการศึกษา</h2>
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
            {academicYears?.map((year) => (
              <button
                key={year.id}
                onClick={() => handleYearFilter(year.id)}
                className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                  selectedYear === year.id
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
                }`}
              >
                {year.year}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">นักศึกษาทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{students?.length || 0}</p>
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
                <p className="text-sm font-medium text-gray-600">ฝึกสำเร็จ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {academicYears?.reduce((sum, year) => sum + (year.completedCount || 0), 0) || 0}
                </p>
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
                <p className="text-sm font-medium text-gray-600">อัตราสำเร็จ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {academicYears && academicYears.length > 0 
                    ? Math.round(academicYears.reduce((sum, year) => sum + (year.completionRate || 0), 0) / academicYears.length)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">รายชื่อนักศึกษา</h2>
          {!students || students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <p className="text-lg">ยังไม่มีนักศึกษาในระบบ</p>
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
                  {students?.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
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
                          บันทึก: {student.totalTeachingSessions} | 
                          ชั่วโมง: {student.totalTeachingHours} | 
                          แผน: {student.totalLessonPlans}
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
                        <button
                          onClick={() => handleStudentClick(student.id)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors duration-200"
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
        </div>
      </div>
    </LoggedLayout>
  );
};

export default TeacherSchool;
