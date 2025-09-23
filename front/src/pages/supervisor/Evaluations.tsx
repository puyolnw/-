import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { supervisorApiService, type EvaluationRequest } from '../../services/supervisorApi';

const SupervisorEvaluations: React.FC = () => {
  const navigate = useNavigate();
  const [pendingEvaluations, setPendingEvaluations] = useState<EvaluationRequest[]>([]);
  const [evaluationHistory, setEvaluationHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingEvaluations();
    } else {
      fetchEvaluationHistory();
    }
  }, [activeTab, pagination.page]);

  const fetchPendingEvaluations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await supervisorApiService.getPendingEvaluations({
        page: pagination.page,
        limit: pagination.limit
      });
      
      if (response.success) {
        setPendingEvaluations(response.data);
        setPagination(response.pagination);
      } else {
        setError(response.message || 'ไม่สามารถดึงข้อมูลการประเมินได้');
      }
    } catch (error) {
      console.error('Error fetching pending evaluations:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลการประเมิน');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluationHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await supervisorApiService.getEvaluationHistory({
        page: pagination.page,
        limit: pagination.limit
      });
      
      if (response.success) {
        setEvaluationHistory(response.data);
        setPagination(response.pagination);
      } else {
        setError(response.message || 'ไม่สามารถดึงข้อมูลประวัติการประเมินได้');
      }
    } catch (error) {
      console.error('Error fetching evaluation history:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการประเมิน');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateClick = (requestId: number) => {
    navigate(`/supervisor/evaluations/${requestId}/detailed`);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { color: string; text: string } } = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'รอการประเมิน' },
      'teacher_approved': { color: 'bg-blue-100 text-blue-800', text: 'ครูพี่เลี้ยงอนุมัติแล้ว' },
      'supervisor_approved': { color: 'bg-green-100 text-green-800', text: 'อาจารย์นิเทศอนุมัติแล้ว' },
      'supervisor_rejected': { color: 'bg-red-100 text-red-800', text: 'อาจารย์นิเทศปฏิเสธ' },
      'approved': { color: 'bg-green-100 text-green-800', text: 'อนุมัติแล้ว' },
      'rejected': { color: 'bg-red-100 text-red-800', text: 'ปฏิเสธ' }
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
      <LoggedLayout currentPage="ประเมิน">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LoggedLayout>
    );
  }

  if (error) {
    return (
      <LoggedLayout currentPage="ประเมิน">
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">เกิดข้อผิดพลาด</h1>
            <p className="text-red-100">ไม่สามารถโหลดข้อมูลการประเมินได้</p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">ไม่สามารถโหลดข้อมูลการประเมิน</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => activeTab === 'pending' ? fetchPendingEvaluations() : fetchEvaluationHistory()}
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
    <LoggedLayout currentPage="ประเมิน">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">การประเมินนักศึกษา</h1>
          <p className="text-blue-100">ประเมินนักศึกษาตามเกณฑ์ 10 ข้อ</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                รอการประเมิน ({pendingEvaluations.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ประวัติการประเมิน ({evaluationHistory.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'pending' ? (
              <>
                {pendingEvaluations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg">ไม่มีคำร้องที่รอการประเมิน</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingEvaluations.map((evaluation) => (
                      <div key={evaluation.id} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {evaluation.first_name} {evaluation.last_name}
                              </h3>
                              <span className="text-sm text-gray-500">({evaluation.student_code})</span>
                              {getStatusBadge(evaluation.status)}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">โรงเรียน:</span> {evaluation.school_name}
                              </div>
                              <div>
                                <span className="font-medium">ครูพี่เลี้ยง:</span> {evaluation.teacher_first_name} {evaluation.teacher_last_name}
                              </div>
                              <div>
                                <span className="font-medium">ปีการศึกษา:</span> {evaluation.academic_year}
                              </div>
                              <div>
                                <span className="font-medium">วันที่ยื่น:</span> {new Date(evaluation.created_at).toLocaleDateString('th-TH')}
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                              <div className="bg-white rounded-lg p-3">
                                <div className="text-gray-500">ชั่วโมงสอน</div>
                                <div className="font-semibold text-lg">{parseFloat(String(evaluation.total_teaching_hours || '0')).toFixed(2)}</div>
                              </div>
                              <div className="bg-white rounded-lg p-3">
                                <div className="text-gray-500">แผนการสอน</div>
                                <div className="font-semibold text-lg">{evaluation.total_lesson_plans}</div>
                              </div>
                              <div className="bg-white rounded-lg p-3">
                                <div className="text-gray-500">บันทึกการสอน</div>
                                <div className="font-semibold text-lg">{evaluation.total_teaching_sessions}</div>
                              </div>
                            </div>
                          </div>
                          <div className="ml-6">
                            <button
                              onClick={() => handleEvaluateClick(evaluation.id)}
                              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                            >
                              ประเมิน
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {evaluationHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg">ไม่มีประวัติการประเมิน</p>
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
                            โรงเรียน
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            คะแนนเฉลี่ย
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            สถานะ
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            วันที่ประเมิน
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {evaluationHistory.map((evaluation) => (
                          <tr key={evaluation.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-sm font-medium text-blue-600">
                                      {evaluation.first_name.charAt(0)}{evaluation.last_name.charAt(0)}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {evaluation.first_name} {evaluation.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">{evaluation.student_code}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{evaluation.school_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {evaluation.supervisor_average_score ? parseFloat(evaluation.supervisor_average_score).toFixed(2) : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(evaluation.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {evaluation.supervisor_evaluated_at 
                                  ? new Date(evaluation.supervisor_evaluated_at).toLocaleDateString('th-TH')
                                  : '-'
                                }
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

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
          </div>
        </div>
      </div>
    </LoggedLayout>
  );
};

export default SupervisorEvaluations;
