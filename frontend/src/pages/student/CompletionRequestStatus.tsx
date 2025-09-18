import React, { useState, useEffect } from 'react';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { completionRequestApiService, type CompletionRequest } from '../../services/completionRequestApi';

const CompletionRequestStatus: React.FC = () => {
  const [requests, setRequests] = useState<CompletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompletionRequests();
  }, []);

  const fetchCompletionRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔵 Frontend - Fetching completion requests...');
      const response = await completionRequestApiService.getStudentCompletionRequests();
      console.log('🔵 Frontend - Completion requests response:', response);
      console.log('🔵 Frontend - Raw data length:', response.data?.length);
      console.log('🔵 Frontend - Raw data IDs:', response.data?.map((r: CompletionRequest) => r.id));
      
      if (response.success && response.data) {
        // ป้องกัน duplicate data โดยใช้ Map
        const uniqueRequests = response.data.filter((request: CompletionRequest, index: number, self: CompletionRequest[]) => 
          index === self.findIndex((r: CompletionRequest) => r.id === request.id)
        );
        console.log('🔵 Frontend - Unique requests length:', uniqueRequests.length);
        console.log('🔵 Frontend - Unique requests IDs:', uniqueRequests.map((r: CompletionRequest) => r.id));
        setRequests(uniqueRequests);
      } else {
        setError(response.message || 'ไม่สามารถดึงข้อมูลคำร้องได้');
      }
    } catch (error) {
      console.error('🔵 Frontend - Error fetching completion requests:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'รอการตรวจสอบ',
      'under_review': 'รออาจารย์นิเทศตรวจสอบ',
      'approved': 'อนุมัติแล้ว',
      'rejected': 'ไม่อนุมัติ',
      'revision_required': 'ต้องแก้ไข'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'under_review': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'revision_required': 'bg-orange-100 text-orange-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'under_review':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case 'approved':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'rejected':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'revision_required':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <LoggedLayout currentPage="completion-request">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </LoggedLayout>
    );
  }

  if (error) {
    return (
      <LoggedLayout currentPage="completion-request">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout currentPage="completion-request">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">สถานะคำร้องขอสำเร็จการฝึก</h1>
            <p className="mt-2 text-gray-600">ติดตามสถานะคำร้องขอสำเร็จการฝึกที่คุณยื่นไป</p>
          </div>

          {/* Requests List */}
          {requests.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีคำร้อง</h3>
              <p className="text-gray-500 mb-4">คุณยังไม่ได้ยื่นคำร้องขอสำเร็จการฝึก</p>
              <a
                href="/student/school"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                ยื่นคำร้องใหม่
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((request, index) => (
                <div key={`completion-request-${request.id}-${index}`} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {getStatusIcon(request.status)}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            คำร้องขอสำเร็จการฝึก #{request.id}
                          </h3>
                          <p className="text-sm text-gray-500">
                            ยื่นเมื่อ: {formatDate(request.request_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-2">{getStatusText(request.status)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* สถิติการฝึกสอน */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">สถิติการฝึกสอน</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">จำนวนครั้งที่สอน:</span>
                            <span className="text-sm font-medium">{request.total_teaching_sessions}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">ชั่วโมงสอนรวม:</span>
                            <span className="text-sm font-medium">{request.total_teaching_hours} ชั่วโมง</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">แผนการสอน:</span>
                            <span className="text-sm font-medium">{request.total_lesson_plans}</span>
                          </div>
                        </div>
                      </div>

                      {/* ข้อมูลโรงเรียน */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">ข้อมูลโรงเรียน</h4>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm text-gray-500">โรงเรียน:</span>
                            <p className="text-sm font-medium">{request.school_name}</p>
                          </div>
                          {request.teacher_first_name && (
                            <div>
                              <span className="text-sm text-gray-500">ครูพี่เลี้ยง:</span>
                              <p className="text-sm font-medium">
                                {request.teacher_first_name} {request.teacher_last_name}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* สถานะการตรวจสอบ */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">สถานะการตรวจสอบ</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${request.teacher_reviewed_at ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div>
                              <span className="text-sm text-gray-500">ครูพี่เลี้ยงตรวจสอบ:</span>
                              <p className="text-sm font-medium">
                                {request.teacher_reviewed_at ? formatDate(request.teacher_reviewed_at) : 'ยังไม่ตรวจสอบ'}
                              </p>
                              {request.teacher_rating && (
                                <p className="text-xs text-gray-400">คะแนน: {request.teacher_rating}/5</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${request.supervisor_reviewed_at ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div>
                              <span className="text-sm text-gray-500">อาจารย์นิเทศตรวจสอบ:</span>
                              <p className="text-sm font-medium">
                                {request.supervisor_reviewed_at ? formatDate(request.supervisor_reviewed_at) : 'ยังไม่ตรวจสอบ'}
                              </p>
                              {request.supervisor_rating && (
                                <p className="text-xs text-gray-400">คะแนน: {request.supervisor_rating}/5</p>
                              )}
                            </div>
                          </div>
                          {request.approved_date && (
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <div>
                                <span className="text-sm text-gray-500">อนุมัติเมื่อ:</span>
                                <p className="text-sm font-medium">{formatDate(request.approved_date)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ความเห็น */}
                    {(request.teacher_comments || request.supervisor_comments) && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">ความเห็น</h4>
                        <div className="space-y-4">
                          {request.teacher_comments && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-1">จากครูพี่เลี้ยง:</h5>
                              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                {request.teacher_comments}
                              </p>
                            </div>
                          )}
                          {request.supervisor_comments && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-1">จากอาจารย์นิเทศ:</h5>
                              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                {request.supervisor_comments}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </LoggedLayout>
  );
};

export default CompletionRequestStatus;
