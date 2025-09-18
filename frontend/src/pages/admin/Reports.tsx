import React, { useState, useEffect } from 'react';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { adminApiService } from '../../services/adminApi';

// Import Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface ReportsData {
  overview: {
    total_schools: number;
    total_users: number;
    total_students: number;
    total_teachers: number;
    total_supervisors: number;
    active_internships: number;
    active_students: number;
    completed_students: number;
  };
  evaluations: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    waiting: number;
    avg_score: number;
    min_score: number;
    max_score: number;
  };
  teaching_sessions: {
    total: number;
    students_with_sessions: number;
    avg_class_size: number;
    total_students_taught: number;
    approved: number;
    draft: number;
    submitted: number;
  };
  lesson_plans: {
    total: number;
    students_with_plans: number;
    approved: number;
    draft: number;
    submitted: number;
  };
  charts: {
    evaluations_by_month: any[];
    teaching_sessions_by_month: any[];
    users_by_role: any[];
    schools_activity: any[];
    evaluation_criteria: any[];
  };
  detailed_data: any[];
}


const AdminReports: React.FC = () => {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Simple filter states
  const [filterSchool, setFilterSchool] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminApiService.getReports();
      
      if (response.success && response.data) {
        setReportsData(response.data);
      } else {
        setError(response.message || 'ไม่สามารถดึงข้อมูลรายงานได้');
      }
    } catch (error) {
      console.error('🔴 Frontend - Error fetching reports:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน');
    } finally {
      setLoading(false);
    }
  };

  // Get unique schools from detailed_data
  const getUniqueSchools = () => {
    if (!reportsData?.detailed_data) return [];
    const schools = reportsData.detailed_data
      .map(item => item.school_name)
      .filter((school, index, self) => school && self.indexOf(school) === index);
    return schools;
  };

  // Filter detailed data based on simple filters
  const getFilteredDetailedData = () => {
    if (!reportsData?.detailed_data) return [];
    
    return reportsData.detailed_data.filter(item => {
      const schoolMatch = !filterSchool || item.school_name === filterSchool;
      const statusMatch = !filterStatus || item.internship_status === filterStatus;
      return schoolMatch && statusMatch;
    });
  };

  // Chart configurations
  const usersByRoleChartData = {
    labels: reportsData?.charts.users_by_role.map(item => {
      const roleMap: { [key: string]: string } = {
        'student': 'นักศึกษา',
        'teacher': 'ครูพี่เลี้ยง',
        'supervisor': 'อาจารย์นิเทศ',
        'admin': 'ผู้ดูแลระบบ'
      };
      return roleMap[item.role] || item.role;
    }) || [],
    datasets: [
      {
        data: reportsData?.charts.users_by_role.map(item => item.count) || [],
        backgroundColor: [
          '#3B82F6', // Blue
          '#10B981', // Green
          '#8B5CF6', // Purple
          '#EF4444', // Red
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const evaluationsByMonthChartData = {
    labels: reportsData?.charts.evaluations_by_month.map(item => item.month) || [],
    datasets: [
      {
        label: 'จำนวนการประเมิน',
        data: reportsData?.charts.evaluations_by_month.map(item => item.count) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
      {
        label: 'คะแนนเฉลี่ย',
        data: reportsData?.charts.evaluations_by_month.map(item => 
          item.avg_score && typeof item.avg_score === 'number' ? item.avg_score : 0
        ) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        yAxisID: 'y1',
      },
    ],
  };

  const teachingSessionsByMonthChartData = {
    labels: reportsData?.charts.teaching_sessions_by_month.map(item => item.month) || [],
    datasets: [
      {
        label: 'จำนวนบันทึกฝึกประสบการณ์',
        data: reportsData?.charts.teaching_sessions_by_month.map(item => item.count) || [],
        backgroundColor: 'rgba(139, 92, 246, 0.5)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2,
      },
    ],
  };

  const schoolsActivityChartData = {
    labels: reportsData?.charts.schools_activity.map(item => item.school_name) || [],
    datasets: [
      {
        label: 'จำนวนนักศึกษา',
        data: reportsData?.charts.schools_activity.map(item => item.student_count) || [],
        backgroundColor: 'rgba(245, 158, 11, 0.5)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 2,
      },
    ],
  };

  const evaluationCriteriaChartData = {
    labels: reportsData?.charts.evaluation_criteria.map(item => item.criteria_name) || [],
    datasets: [
      {
        label: 'คะแนนเฉลี่ย',
        data: reportsData?.charts.evaluation_criteria.map(item => 
          item.avg_score && typeof item.avg_score === 'number' ? item.avg_score : 0
        ) || [],
        backgroundColor: 'rgba(236, 72, 153, 0.5)',
        borderColor: 'rgba(236, 72, 153, 1)',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'กราฟแสดงข้อมูลรายงาน',
      },
    },
  };

  const evaluationsChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
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

  if (!reportsData) {
    return (
      <LoggedLayout currentPage="รายงาน">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบข้อมูล</h2>
            <p className="text-gray-600">ไม่สามารถดึงข้อมูลรายงานได้</p>
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
          <h1 className="text-3xl font-bold mb-2">รายงานระบบ</h1>
          <p className="text-blue-100">รายงานข้อมูลทั้งหมดในระบบฝึกประสบการณ์วิชาชีพ</p>
        </div>



        {/* Overview Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">โรงเรียนทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{reportsData.overview.total_schools}</p>
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
                <p className="text-sm font-medium text-gray-600">ผู้ใช้ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{reportsData.overview.total_users}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">นักศึกษาที่กำลังฝึก</p>
                <p className="text-2xl font-bold text-gray-900">{reportsData.overview.active_students}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">การประเมินทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{reportsData.evaluations.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users by Role - Doughnut Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">ผู้ใช้ตามบทบาท</h2>
            <div className="h-64">
              <Doughnut data={usersByRoleChartData} options={chartOptions} />
            </div>
          </div>

          {/* Schools Activity - Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">กิจกรรมของโรงเรียน</h2>
            <div className="h-64">
              <Bar data={schoolsActivityChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evaluations by Month - Line Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">การประเมินตามเดือน</h2>
            <div className="h-64">
              <Line data={evaluationsByMonthChartData} options={evaluationsChartOptions} />
            </div>
          </div>

          {/* Teaching Sessions by Month - Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">บันทึกฝึกประสบการณ์ตามเดือน</h2>
            <div className="h-64">
              <Bar data={teachingSessionsByMonthChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Evaluation Criteria - Bar Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">คะแนนเฉลี่ยตามเกณฑ์การประเมิน</h2>
          <div className="h-64">
            <Bar data={evaluationCriteriaChartData} options={chartOptions} />
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evaluation Statistics */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">สถิติการประเมิน</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ผ่าน</span>
                <span className="font-semibold text-green-600">{reportsData.evaluations.approved}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ไม่ผ่าน</span>
                <span className="font-semibold text-red-600">{reportsData.evaluations.rejected}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">รอประเมิน</span>
                <span className="font-semibold text-yellow-600">{reportsData.evaluations.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">คะแนนเฉลี่ย</span>
                <span className="font-semibold">
                  {reportsData.evaluations.avg_score && typeof reportsData.evaluations.avg_score === 'number' 
                    ? reportsData.evaluations.avg_score.toFixed(2) 
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">คะแนนสูงสุด</span>
                <span className="font-semibold">
                  {reportsData.evaluations.max_score && typeof reportsData.evaluations.max_score === 'number' 
                    ? reportsData.evaluations.max_score.toFixed(2) 
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">คะแนนต่ำสุด</span>
                <span className="font-semibold">
                  {reportsData.evaluations.min_score && typeof reportsData.evaluations.min_score === 'number' 
                    ? reportsData.evaluations.min_score.toFixed(2) 
                    : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Teaching Sessions Statistics */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">สถิติบันทึกฝึกประสบการณ์</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">จำนวนทั้งหมด</span>
                <span className="font-semibold">{reportsData.teaching_sessions.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">นักศึกษาที่มีบันทึก</span>
                <span className="font-semibold">{reportsData.teaching_sessions.students_with_sessions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ขนาดชั้นเรียนเฉลี่ย</span>
                <span className="font-semibold">
                  {reportsData.teaching_sessions.avg_class_size && typeof reportsData.teaching_sessions.avg_class_size === 'number' 
                    ? reportsData.teaching_sessions.avg_class_size.toFixed(1) 
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">นักเรียนที่สอนทั้งหมด</span>
                <span className="font-semibold">{reportsData.teaching_sessions.total_students_taught}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ส่งแล้ว</span>
                <span className="font-semibold text-blue-600">{reportsData.teaching_sessions.submitted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ร่าง</span>
                <span className="font-semibold text-gray-600">{reportsData.teaching_sessions.draft}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Data Table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">รายละเอียดข้อมูลนักศึกษา</h2>
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">โรงเรียน</label>
                <select
                  value={filterSchool}
                  onChange={(e) => setFilterSchool(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">ทั้งหมด</option>
                  {getUniqueSchools().map((school) => (
                    <option key={school} value={school}>
                      {school}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">ทั้งหมด</option>
                  <option value="active">กำลังฝึก</option>
                  <option value="completed">เสร็จสิ้น</option>
                  <option value="null">ยังไม่ได้ลงทะเบียน</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterSchool('');
                    setFilterStatus('');
                  }}
                  className="bg-gray-500 text-white px-3 py-1 rounded-lg hover:bg-gray-600 transition-colors duration-200 text-sm"
                >
                  รีเซ็ต
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">นักศึกษา</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">โรงเรียน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">บันทึกฝึกประสบการณ์</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">แผนการสอน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">การประเมิน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คะแนนเฉลี่ย</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredDetailedData().map((student) => (
                  <tr key={student.student_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{student.student_code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.school_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.teaching_sessions_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.lesson_plans_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.evaluations_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.avg_evaluation_score && typeof student.avg_evaluation_score === 'number' 
                        ? student.avg_evaluation_score.toFixed(2) 
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        student.internship_status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : student.internship_status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.internship_status === 'active' ? 'กำลังฝึก' : 
                         student.internship_status === 'completed' ? 'เสร็จสิ้น' : 
                         student.internship_status || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </LoggedLayout>
  );
};

export default AdminReports;
