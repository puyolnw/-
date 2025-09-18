import React, { useState, useEffect } from 'react';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { teacherApiService } from '../../services/teacherApi';

interface ReportData {
  students: Array<{
    id: number;
    name: string;
    student_code: string;
    email: string;
    totalTeachingSessions: number;
    totalTeachingHours: number;
    totalLessonPlans: number;
    completionStatus: string;
    lastActivity: string;
  }>;
  summary: {
    totalStudents: number;
    completedStudents: number;
    pendingStudents: number;
    totalTeachingSessions: number;
    totalTeachingHours: number;
    averageRating: number;
  };
  academicYear: string;
  schoolName: string;
  reportDate: string;
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Available options
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [students, setStudents] = useState<Array<{id: number, name: string}>>([]);

  useEffect(() => {
    fetchReportData();
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    // Refetch data when filters change
    if (reportData) {
      fetchReportData();
    }
  }, [selectedAcademicYear, selectedStatus, selectedStudent, dateRange]);

  const fetchFilterOptions = async () => {
    try {
      // Fetch academic years and students for filters
      const response = await teacherApiService.getMySchoolInfo();
      if (response.success && response.data) {
        setAcademicYears(response.data.academicYears?.map((ay: any) => ay.year) || []);
        setStudents(response.data.students?.map((s: any) => ({id: s.id, name: s.first_name + ' ' + s.last_name})) || []);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
      // Set empty arrays if API fails
      setAcademicYears([]);
      setStudents([]);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await teacherApiService.getTeacherDashboard();
      if (response.success && response.data) {
        // Transform data for report
        const transformedData: ReportData = {
          students: response.data.recentStudents?.map((student: any) => ({
            id: student.id,
            name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'ไม่ระบุชื่อ',
            student_code: student.student_code || 'N/A',
            email: student.email || 'N/A',
            totalTeachingSessions: student.total_teaching_sessions || 0,
            totalTeachingHours: Math.round(parseFloat(student.total_teaching_hours) || 0),
            totalLessonPlans: student.total_lesson_plans || 0,
            completionStatus: student.status || 'pending',
            lastActivity: student.last_activity ? new Date(student.last_activity).toLocaleDateString('th-TH') : 'N/A'
          })) || [],
          summary: {
            totalStudents: response.data.stats?.totalStudents || 0,
            completedStudents: response.data.stats?.completedEvaluations || 0,
            pendingStudents: response.data.stats?.pendingEvaluations || 0,
            totalTeachingSessions: response.data.recentStudents?.reduce((sum: number, student: any) => sum + (student.total_teaching_sessions || 0), 0) || 0,
            totalTeachingHours: response.data.recentStudents?.reduce((sum: number, student: any) => sum + (parseFloat(student.total_teaching_hours) || 0), 0) || 0,
            averageRating: 4.2 // Default value since not available in current API
          },
          academicYear: selectedAcademicYear || '2567',
          schoolName: response.data.schoolInfo?.school_name || 'โรงเรียนที่ยังไม่ได้ระบุ',
          reportDate: new Date().toLocaleDateString('th-TH')
        };
        
        setReportData(transformedData);
      } else {
        setError(response.message || 'ไม่สามารถดึงข้อมูลรายงานได้');
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'กำลังฝึกงาน';
      case 'completed':
        return 'สำเร็จ';
      case 'pending':
        return 'รอดำเนินการ';
      case 'in_progress':
        return 'กำลังดำเนินการ';
      default:
        return status || 'ไม่ทราบสถานะ';
    }
  };

  const filteredStudents = reportData?.students.filter(student => {
    if (selectedStatus !== 'all' && student.completionStatus !== selectedStatus) return false;
    if (selectedStudent !== 'all' && student.id.toString() !== selectedStudent) return false;
    return true;
  }) || [];

  if (loading) {
    return (
      <LoggedLayout currentPage="รายงาน">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LoggedLayout>
    );
  }

  if (error) {
    return (
      <LoggedLayout currentPage="รายงาน">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout currentPage="รายงาน">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">รายงานการฝึกงาน</h1>
          <p className="text-blue-100">สรุปผลการฝึกงานของนักศึกษาในความดูแล</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">ตัวกรองข้อมูล</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Academic Year Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ปีการศึกษา
              </label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">ทั้งหมด</option>
                {academicYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สถานะการฝึกงาน
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">ทั้งหมด</option>
                <option value="active">กำลังฝึกงาน</option>
                <option value="completed">สำเร็จ</option>
                <option value="pending">รอดำเนินการ</option>
                <option value="in_progress">กำลังดำเนินการ</option>
              </select>
            </div>

            {/* Student Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                นักศึกษา
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">ทั้งหมด</option>
                {students.map(student => (
                  <option key={student.id} value={student.id.toString()}>{student.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ช่วงวันที่
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="วันที่เริ่มต้น"
                />
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="วันที่สิ้นสุด"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end">
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            พิมพ์รายงาน
          </button>
        </div>

        {/* Report Content */}
        {reportData && (
          <div className="bg-white rounded-lg shadow-lg p-6 print:shadow-none">
            {/* Report Header */}
            <div className="text-center mb-8 print:mb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">รายงานการฝึกงาน</h2>
              <p className="text-lg text-gray-600">{reportData.schoolName}</p>
              <p className="text-sm text-gray-500">ปีการศึกษา {reportData.academicYear}</p>
              <p className="text-sm text-gray-500">วันที่รายงาน: {reportData.reportDate}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">นักศึกษาทั้งหมด</p>
                    <p className="text-3xl font-bold">{reportData.summary.totalStudents}</p>
                  </div>
                  <svg className="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">สำเร็จการฝึก</p>
                    <p className="text-3xl font-bold">{reportData.summary.completedStudents}</p>
                  </div>
                  <svg className="w-12 h-12 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">ชั่วโมงสอนรวม</p>
                    <p className="text-3xl font-bold">{reportData.summary.totalTeachingHours}</p>
                  </div>
                  <svg className="w-12 h-12 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      นักศึกษา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      รหัสนักศึกษา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      บันทึกการฝึกสอน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ชั่วโมงสอน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      แผนการสอน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      กิจกรรมล่าสุด
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.student_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.totalTeachingSessions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.totalTeachingHours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.totalLessonPlans}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.completionStatus)}`}>
                          {getStatusText(student.completionStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.lastActivity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Report Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 print:mt-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  รายงานนี้สร้างขึ้นโดยระบบจัดการการฝึกงาน
                </div>
                <div className="text-sm text-gray-500">
                  วันที่พิมพ์: {new Date().toLocaleDateString('th-TH')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            font-size: 12px;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:mb-4 {
            margin-bottom: 1rem !important;
          }
          
          .print\\:mt-4 {
            margin-top: 1rem !important;
          }
        }
      `}</style>
    </LoggedLayout>
  );
};

export default Reports;
