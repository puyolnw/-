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
      'supervisor_approved': 'อนุมัติผ่านแล้วทั้งหมด',
      'rejected': 'ไม่อนุมัติ',
      'supervisor_rejected': 'ไม่อนุมัติ',
      'revision_required': 'ต้องแก้ไข'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'under_review': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'supervisor_approved': 'bg-emerald-100 text-emerald-800',
      'rejected': 'bg-red-100 text-red-800',
      'supervisor_rejected': 'bg-red-100 text-red-800',
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

  const handlePrint = (request: CompletionRequest) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>คำร้องขอสำเร็จการฝึก #${request.id}</title>
          <style>
            body { font-family: 'Sarabun', sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #1f2937; }
            .subtitle { font-size: 16px; color: #6b7280; margin-top: 5px; }
            .section { margin: 20px 0; }
            .section-title { font-size: 18px; font-weight: bold; color: #374151; margin-bottom: 10px; border-left: 4px solid #3b82f6; padding-left: 10px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0; }
            .info-item { margin: 8px 0; }
            .info-label { font-weight: bold; color: #4b5563; }
            .info-value { color: #1f2937; }
            .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
            .status-approved { background-color: #d1fae5; color: #065f46; }
            .comments { background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 10px 0; }
            .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 14px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">คำร้องขอสำเร็จการฝึก</div>
            <div class="subtitle">หมายเลขคำร้อง: #${request.id}</div>
          </div>

          <div class="section">
            <div class="section-title">ข้อมูลนักศึกษา</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">ชื่อ-นามสกุล:</span>
                <span class="info-value">${request.student_name || 'ไม่ระบุ'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">รหัสนักศึกษา:</span>
                <span class="info-value">${request.student_code || 'ไม่ระบุ'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">คณะ:</span>
                <span class="info-value">${request.faculty || 'ไม่ระบุ'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">สาขา:</span>
                <span class="info-value">${request.major || 'ไม่ระบุ'}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">ข้อมูลการฝึกประสบการณ์</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">โรงเรียน:</span>
                <span class="info-value">${request.school_name || 'ไม่ระบุ'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">ครูพี่เลี้ยง:</span>
                <span class="info-value">${request.teacher_first_name ? `${request.teacher_first_name} ${request.teacher_last_name}` : 'ไม่ระบุ'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">จำนวนครั้งที่สอน:</span>
                <span class="info-value">${request.total_teaching_sessions || 0} ครั้ง</span>
              </div>
              <div class="info-item">
                <span class="info-label">ชั่วโมงสอนรวม:</span>
                <span class="info-value">${request.total_teaching_hours || 0} ชั่วโมง</span>
              </div>
              <div class="info-item">
                <span class="info-label">แผนการสอน:</span>
                <span class="info-value">${request.total_lesson_plans || 0} แผน</span>
              </div>
              <div class="info-item">
                <span class="info-label">วันที่ยื่นคำร้อง:</span>
                <span class="info-value">${formatDate(request.request_date)}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">สถานะการประเมิน</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">สถานะ:</span>
                <span class="status status-approved">${getStatusText(request.status)}</span>
              </div>
              ${request.teacher_reviewed_at ? `
              <div class="info-item">
                <span class="info-label">ครูพี่เลี้ยงตรวจสอบ:</span>
                <span class="info-value">${formatDate(request.teacher_reviewed_at)}</span>
              </div>
              ` : ''}
              ${request.supervisor_reviewed_at ? `
              <div class="info-item">
                <span class="info-label">อาจารย์นิเทศตรวจสอบ:</span>
                <span class="info-value">${formatDate(request.supervisor_reviewed_at)}</span>
              </div>
              ` : ''}
              ${request.approved_date ? `
              <div class="info-item">
                <span class="info-label">วันที่อนุมัติ:</span>
                <span class="info-value">${formatDate(request.approved_date)}</span>
              </div>
              ` : ''}
            </div>
          </div>

          ${request.teacher_comments || request.supervisor_comments ? `
          <div class="section">
            <div class="section-title">ความเห็นและการประเมิน</div>
            ${request.teacher_comments ? `
            <div class="comments">
              <strong>ความเห็นจากครูพี่เลี้ยง:</strong><br>
              ${request.teacher_comments}
              ${request.teacher_rating ? `<br><br><strong>คะแนน: ${request.teacher_rating}/5</strong>` : ''}
            </div>
            ` : ''}
            ${request.supervisor_comments ? `
            <div class="comments">
              <strong>ความเห็นจากอาจารย์นิเทศ:</strong><br>
              ${request.supervisor_comments}
              ${request.supervisor_rating ? `<br><br><strong>คะแนน: ${request.supervisor_rating}/5</strong>` : ''}
            </div>
            ` : ''}
          </div>
          ` : ''}

          <div class="footer">
            <p>เอกสารนี้พิมพ์จากระบบจัดการการฝึกประสบการณ์วิชาชีพครู</p>
            <p>วันที่พิมพ์: ${new Date().toLocaleDateString('th-TH')}</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              สถานะคำร้องขอสำเร็จการฝึก
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ติดตามสถานะคำร้องขอสำเร็จการฝึกที่คุณยื่นไป และปริ้นเอกสารเมื่อผ่านการประเมินแล้ว
            </p>
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
            <div className="space-y-8">
              {requests.map((request, index) => (
                <div key={`completion-request-${request.id}-${index}`} className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300">
                  {/* Header with gradient background for approved status */}
                  <div className={`px-8 py-6 ${request.status === 'supervisor_approved' ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gradient-to-r from-gray-50 to-gray-100'} border-b border-gray-200`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 p-3 rounded-full ${request.status === 'supervisor_approved' ? 'bg-white bg-opacity-20' : 'bg-blue-100'}`}>
                          {getStatusIcon(request.status)}
                        </div>
                        <div className="ml-4">
                          <h3 className={`text-xl font-bold ${request.status === 'supervisor_approved' ? 'text-white' : 'text-gray-900'}`}>
                            คำร้องขอสำเร็จการฝึก #{request.id}
                          </h3>
                          <p className={`text-sm ${request.status === 'supervisor_approved' ? 'text-green-100' : 'text-gray-500'}`}>
                            ยื่นเมื่อ: {formatDate(request.request_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-2">{getStatusText(request.status)}</span>
                        </span>
                        {/* Print button for approved requests */}
                        {request.status === 'supervisor_approved' && (
                          <button
                            onClick={() => handlePrint(request)}
                            className="inline-flex items-center px-6 py-3 bg-white text-emerald-600 rounded-full font-semibold hover:bg-emerald-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            ปริ้นเอกสาร
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-8 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* สถิติการฝึกสอน */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="p-2 bg-blue-500 rounded-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-bold text-gray-900 ml-3">สถิติการฝึกสอน</h4>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">จำนวนครั้งที่สอน:</span>
                            <span className="text-lg font-bold text-blue-600">{request.total_teaching_sessions}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">ชั่วโมงสอนรวม:</span>
                            <span className="text-lg font-bold text-blue-600">{request.total_teaching_hours} ชั่วโมง</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">แผนการสอน:</span>
                            <span className="text-lg font-bold text-blue-600">{request.total_lesson_plans}</span>
                          </div>
                        </div>
                      </div>

                      {/* ข้อมูลโรงเรียน */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="p-2 bg-green-500 rounded-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-bold text-gray-900 ml-3">ข้อมูลโรงเรียน</h4>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <span className="text-sm text-gray-600">โรงเรียน:</span>
                            <p className="text-base font-semibold text-gray-900 mt-1">{request.school_name}</p>
                          </div>
                          {request.teacher_first_name && (
                            <div>
                              <span className="text-sm text-gray-600">ครูพี่เลี้ยง:</span>
                              <p className="text-base font-semibold text-gray-900 mt-1">
                                {request.teacher_first_name} {request.teacher_last_name}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* สถานะการตรวจสอบ */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="p-2 bg-purple-500 rounded-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-bold text-gray-900 ml-3">สถานะการตรวจสอบ</h4>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${request.teacher_reviewed_at ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div className="flex-1">
                              <span className="text-sm text-gray-600">ครูพี่เลี้ยง:</span>
                              <p className="text-sm font-semibold text-gray-900">
                                {request.teacher_reviewed_at ? formatDate(request.teacher_reviewed_at) : 'ยังไม่ตรวจสอบ'}
                              </p>
                              {request.teacher_rating && (
                                <p className="text-xs text-purple-600 font-medium">คะแนน: {request.teacher_rating}/5</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${request.supervisor_reviewed_at ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div className="flex-1">
                              <span className="text-sm text-gray-600">อาจารย์นิเทศ:</span>
                              <p className="text-sm font-semibold text-gray-900">
                                {request.supervisor_reviewed_at ? formatDate(request.supervisor_reviewed_at) : 'ยังไม่ตรวจสอบ'}
                              </p>
                              {request.supervisor_rating && (
                                <p className="text-xs text-purple-600 font-medium">คะแนน: {request.supervisor_rating}/5</p>
                              )}
                            </div>
                          </div>
                          {request.approved_date && (
                            <div className="flex items-center space-x-3">
                              <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                              <div className="flex-1">
                                <span className="text-sm text-gray-600">อนุมัติเมื่อ:</span>
                                <p className="text-sm font-semibold text-emerald-600">{formatDate(request.approved_date)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ความเห็น */}
                    {(request.teacher_comments || request.supervisor_comments) && (
                      <div className="mt-8 pt-8 border-t border-gray-200">
                        <div className="flex items-center mb-6">
                          <div className="p-2 bg-yellow-500 rounded-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <h4 className="text-xl font-bold text-gray-900 ml-3">ความเห็นและการประเมิน</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {request.teacher_comments && (
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                              <div className="flex items-center mb-4">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <h5 className="text-lg font-bold text-gray-900 ml-3">จากครูพี่เลี้ยง</h5>
                              </div>
                              <p className="text-gray-700 leading-relaxed">
                                {request.teacher_comments}
                              </p>
                              {request.teacher_rating && (
                                <div className="mt-4 flex items-center">
                                  <span className="text-sm text-gray-600 mr-2">คะแนน:</span>
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <svg
                                        key={i}
                                        className={`w-5 h-5 ${i < request.teacher_rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    ))}
                                    <span className="ml-2 text-sm font-semibold text-gray-700">{request.teacher_rating}/5</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {request.supervisor_comments && (
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                              <div className="flex items-center mb-4">
                                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <h5 className="text-lg font-bold text-gray-900 ml-3">จากอาจารย์นิเทศ</h5>
                              </div>
                              <p className="text-gray-700 leading-relaxed">
                                {request.supervisor_comments}
                              </p>
                              {request.supervisor_rating && (
                                <div className="mt-4 flex items-center">
                                  <span className="text-sm text-gray-600 mr-2">คะแนน:</span>
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <svg
                                        key={i}
                                        className={`w-5 h-5 ${i < request.supervisor_rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    ))}
                                    <span className="ml-2 text-sm font-semibold text-gray-700">{request.supervisor_rating}/5</span>
                                  </div>
                                </div>
                              )}
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
