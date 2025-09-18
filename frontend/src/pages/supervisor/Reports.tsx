import React, { useState, useEffect } from 'react';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { supervisorApiService } from '../../services/supervisorApi';

interface ReportData {
  academic_year_id: number | null;
  schools_stats: {
    total_schools: number;
    total_teachers: number;
    total_students: number;
  };
  evaluations_stats: {
    total_evaluations: number;
    approved_count: number;
    rejected_count: number;
    pending_count: number;
    avg_score: number;
  };
  teaching_stats: {
    total_sessions: number;
    total_lesson_plans: number;
    total_students_taught: number;
    avg_class_size: number;
  };
  schools_detail: Array<{
    school_name: string;
    address: string;
    phone: string;
    teacher_count: number;
    student_count: number;
    evaluation_count: number;
  }>;
  students_detail: Array<{
    first_name: string;
    last_name: string;
    student_code: string;
    faculty: string;
    major: string;
    school_name: string;
    teacher_first_name: string;
    teacher_last_name: string;
    lesson_plans_count: number;
    teaching_sessions_count: number;
    total_students_taught: number;
    evaluation_status: string;
    supervisor_average_score: number;
  }>;
}

const SupervisorReports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAcademicYears();
    fetchReports();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [selectedYear]);

  const fetchAcademicYears = async () => {
    try {
      const response = await supervisorApiService.getAcademicYears();
      if (response.success && response.data) {
        setAcademicYears(response.data);
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await supervisorApiService.getReports(selectedYear || undefined);
      
      if (response.success && response.data) {
        setReportData(response.data);
      } else {
        setError(response.message || 'ไม่สามารถดึงข้อมูลรายงานได้');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { color: string; text: string } } = {
      'supervisor_approved': { color: 'bg-green-100 text-green-800', text: 'ผ่าน' },
      'supervisor_rejected': { color: 'bg-red-100 text-red-800', text: 'ไม่ผ่าน' },
      'approved': { color: 'bg-yellow-100 text-yellow-800', text: 'รอประเมิน' },
      'pending': { color: 'bg-gray-100 text-gray-800', text: 'รอดำเนินการ' }
    };
    
    const statusInfo = statusMap[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

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
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">เกิดข้อผิดพลาด</h1>
            <p className="text-red-100">ไม่สามารถโหลดข้อมูลรายงานได้</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">ไม่สามารถโหลดข้อมูลรายงาน</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  <p className="mt-2">กรุณาติดต่อผู้ดูแลระบบเพื่อขอความช่วยเหลือ</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchReports}
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

  if (!reportData) {
    return (
      <LoggedLayout currentPage="รายงาน">
        <div className="text-center py-12">
          <p className="text-gray-500">ไม่พบข้อมูลรายงาน</p>
        </div>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout currentPage="รายงาน">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">รายงานการฝึกสอน</h1>
              <p className="text-blue-100">
                {selectedYear 
                  ? `ปีการศึกษา ${academicYears.find(year => year.id === selectedYear)?.academic_year || selectedYear}`
                  : 'ทุกปีการศึกษา'
                }
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handlePrint}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium"
              >
                🖨️ พิมพ์รายงาน
              </button>
            </div>
          </div>
        </div>

        {/* Academic Year Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">กรองตามปีการศึกษา</h2>
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
            {academicYears.map((year) => (
              <button
                key={year.id}
                onClick={() => setSelectedYear(year.id)}
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

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Schools Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">โรงเรียน</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.schools_stats.total_schools}</p>
              </div>
            </div>
          </div>

          {/* Teachers Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ครูพี่เลี้ยง</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.schools_stats.total_teachers}</p>
              </div>
            </div>
          </div>

          {/* Students Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">นักศึกษา</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.schools_stats.total_students}</p>
              </div>
            </div>
          </div>

          {/* Evaluations Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">การประเมิน</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.evaluations_stats.total_evaluations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">สถิติการประเมิน</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{reportData.evaluations_stats.approved_count}</div>
              <div className="text-sm text-gray-600">ผ่าน</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{reportData.evaluations_stats.rejected_count}</div>
              <div className="text-sm text-gray-600">ไม่ผ่าน</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{reportData.evaluations_stats.pending_count}</div>
              <div className="text-sm text-gray-600">รอประเมิน</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {reportData.evaluations_stats.avg_score && typeof reportData.evaluations_stats.avg_score === 'number' 
                  ? reportData.evaluations_stats.avg_score.toFixed(2) 
                  : '0.00'}
              </div>
              <div className="text-sm text-gray-600">คะแนนเฉลี่ย</div>
            </div>
          </div>
        </div>

        {/* Teaching Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">สถิติการสอน</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{reportData.teaching_stats.total_sessions}</div>
              <div className="text-sm text-gray-600">ครั้งที่สอน</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{reportData.teaching_stats.total_lesson_plans}</div>
              <div className="text-sm text-gray-600">แผนการสอน</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{reportData.teaching_stats.total_students_taught}</div>
              <div className="text-sm text-gray-600">นักเรียนที่สอน</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {reportData.teaching_stats.avg_class_size && typeof reportData.teaching_stats.avg_class_size === 'number'
                  ? reportData.teaching_stats.avg_class_size.toFixed(1) 
                  : '0.0'}
              </div>
              <div className="text-sm text-gray-600">ขนาดชั้นเรียนเฉลี่ย</div>
            </div>
          </div>
        </div>

        {/* Schools Detail */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">รายละเอียดโรงเรียน</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">โรงเรียน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ที่อยู่</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">โทรศัพท์</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ครูพี่เลี้ยง</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">นักศึกษา</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">การประเมิน</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.schools_detail.map((school, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {school.school_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{school.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{school.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{school.teacher_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{school.student_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{school.evaluation_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Students Detail */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">รายละเอียดนักศึกษา</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">นักศึกษา</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัสนักศึกษา</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คณะ/สาขา</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">โรงเรียน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ครูพี่เลี้ยง</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">แผนการสอน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ครั้งที่สอน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คะแนน</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.students_detail.map((student, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.student_code}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{student.faculty}/{student.major}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{student.school_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {student.teacher_first_name} {student.teacher_last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.lesson_plans_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.teaching_sessions_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(student.evaluation_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.supervisor_average_score && typeof student.supervisor_average_score === 'number'
                        ? student.supervisor_average_score.toFixed(2) 
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
          
          .bg-gradient-to-r {
            background: #3B82F6 !important;
            color: white !important;
          }
          
          .shadow-lg {
            box-shadow: none !important;
            border: 1px solid #E5E7EB !important;
          }
          
          .rounded-xl {
            border-radius: 0.5rem !important;
          }
          
          .space-y-6 > * + * {
            margin-top: 1.5rem !important;
          }
        }
      `}</style>
    </LoggedLayout>
  );
};

export default SupervisorReports;
