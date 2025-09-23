import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { SchoolInfo } from '../../services/studentApi';
import { completionRequestApiService, type TeachingStats } from '../../services/completionRequestApi';

interface SchoolData {
  id: number;
  assignment_id: number;
  school_name: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
  enrollment_date: string;
  assignment_status: string;
  assignment_notes?: string;
  teacher_id?: number;
  teacher_first_name?: string;
  teacher_last_name?: string;
  teacher_phone?: string;
  teacher_email?: string;
  academic_year: string;
  academic_semester: string;
  academic_start_date: string;
  academic_end_date: string;
}

const School: React.FC = () => {
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Completion Request Modal states
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionForm, setCompletionForm] = useState({
    self_evaluation: '',
    achievements: '',
    challenges_faced: '',
    skills_developed: '',
    future_goals: ''
  });
  const [teachingStats, setTeachingStats] = useState<TeachingStats | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasExistingRequest, setHasExistingRequest] = useState(false);
  const [existingRequestStatus, setExistingRequestStatus] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchoolData();
    checkExistingRequest();
  }, []);

  const checkExistingRequest = async () => {
    try {
      const response = await completionRequestApiService.getStudentCompletionRequests();
      if (response.success && response.data && response.data.length > 0) {
        const latestRequest = response.data[0]; // เอาคำร้องล่าสุด
        setHasExistingRequest(true);
        setExistingRequestStatus(latestRequest.status);
        console.log('🔵 Frontend - Existing request found:', latestRequest);
      }
    } catch (error) {
      console.error('🔵 Frontend - Error checking existing request:', error);
    }
  };

  const fetchSchoolData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔵 Frontend - Fetching school data...');
      const response = await SchoolInfo.getStudentSchoolInfo();
      console.log('🔵 Frontend - School data response:', response);
      
      if (response.success && response.data) {
        console.log('🔵 Frontend - Setting school data:', response.data);
        console.log('🔵 Frontend - School data details:', {
          id: response.data.id,
          assignment_id: response.data.assignment_id,
          school_name: response.data.school_name,
          teacher_id: response.data.teacher_id
        });
        setSchoolData(response.data);
      } else {
        console.log('🔵 Frontend - No school data found:', response.message);
        setError(response.message || 'ไม่พบข้อมูลโรงเรียน');
      }
    } catch (error) {
      console.error('🔵 Frontend - Error fetching school data:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลโรงเรียน');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (schoolData?.teacher_id) {
      navigate(`/student/messages?teacher=${schoolData.teacher_id}`);
    } else {
      alert('ไม่พบข้อมูลครูพี่เลี้ยง');
    }
  };

  const handleRequestCompletion = async () => {
    if (!schoolData?.assignment_id) {
      alert('ไม่พบข้อมูลการมอบหมาย');
      return;
    }

    // ตรวจสอบว่ามีคำร้องอยู่แล้วหรือไม่ (ยกเว้นกรณี rejected)
    if (hasExistingRequest && existingRequestStatus !== 'rejected') {
      const statusText = getStatusText(existingRequestStatus);
      alert(`คุณมีคำร้องขอสำเร็จการฝึกอยู่แล้ว (สถานะ: ${statusText})\n\nกรุณาติดตามสถานะคำร้องในเมนู "คำร้อง"`);
      return;
    }

    try {
      console.log('🔵 Frontend - Requesting completion with assignment ID:', schoolData.assignment_id);
      
      // ดึงสถิติการฝึกสอน
      const statsResponse = await completionRequestApiService.getTeachingStats(schoolData.assignment_id);
      console.log('🔵 Frontend - Stats response:', statsResponse);
      
      if (statsResponse.success && statsResponse.data) {
        setTeachingStats(statsResponse.data);
        setShowCompletionModal(true);
      } else {
        console.error('🔵 Frontend - Failed to get stats:', statsResponse.message);
        alert(`ไม่สามารถดึงข้อมูลสถิติการฝึกสอนได้: ${statsResponse.message || 'ไม่ทราบสาเหตุ'}`);
      }
    } catch (error) {
      console.error('🔵 Frontend - Error fetching teaching stats:', error);
      alert('เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ');
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'รอการตรวจสอบ',
      'under_review': 'กำลังตรวจสอบ',
      'approved': 'อนุมัติแล้ว',
      'rejected': 'ไม่อนุมัติ',
      'revision_required': 'ต้องแก้ไข'
    };
    return statusMap[status] || status;
  };

  const handleSubmitCompletionRequest = async () => {
    if (!schoolData?.assignment_id) {
      alert('ไม่พบข้อมูลการมอบหมาย');
      return;
    }

    try {
      setSubmitting(true);
      
      let response;
      
      if (existingRequestStatus === 'rejected') {
        // อัปเดตคำร้องที่ถูก reject
        response = await completionRequestApiService.updateCompletionRequest({
          assignment_id: schoolData.assignment_id,
          self_evaluation: completionForm.self_evaluation,
          achievements: completionForm.achievements,
          challenges_faced: completionForm.challenges_faced,
          skills_developed: completionForm.skills_developed,
          future_goals: completionForm.future_goals,
          status: 'pending' // เปลี่ยนสถานะกลับเป็น pending
        });
      } else {
        // สร้างคำร้องใหม่
        response = await completionRequestApiService.createCompletionRequest({
          assignment_id: schoolData.assignment_id,
          self_evaluation: completionForm.self_evaluation,
          achievements: completionForm.achievements,
          challenges_faced: completionForm.challenges_faced,
          skills_developed: completionForm.skills_developed,
          future_goals: completionForm.future_goals
        });
      }

      if (response.success) {
        const message = existingRequestStatus === 'rejected' 
          ? 'ส่งคำร้องขอประเมินใหม่เรียบร้อยแล้ว!' 
          : 'ส่งคำร้องขอสำเร็จการฝึกเรียบร้อยแล้ว!';
        alert(message);
        setShowCompletionModal(false);
        setCompletionForm({
          self_evaluation: '',
          achievements: '',
          challenges_faced: '',
          skills_developed: '',
          future_goals: ''
        });
        // อัปเดตสถานะว่ามีคำร้องแล้ว
        setHasExistingRequest(true);
        setExistingRequestStatus('pending');
        // TODO: อัปเดต sidebar เพื่อแสดงเมนูใหม่
      } else {
        alert(`ไม่สามารถส่งคำร้องได้: ${response.message}`);
      }
    } catch (error) {
      console.error('Error submitting completion request:', error);
      alert('เกิดข้อผิดพลาดในการส่งคำร้อง');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompletionFormChange = (field: string, value: string) => {
    setCompletionForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <LoggedLayout currentPage="school">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-8">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">กำลังโหลดข้อมูลโรงเรียน...</span>
              </div>
            </div>
          </div>
        </div>
      </LoggedLayout>
    );
  }

  if (error) {
    return (
      <LoggedLayout currentPage="school">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-8">
              <div className="text-center">
                <div className="text-red-600 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => navigate('/student/dashboard')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  กลับไปแดชบอร์ด
                </button>
              </div>
            </div>
          </div>
        </div>
      </LoggedLayout>
    );
  }

  if (!schoolData) {
    return (
      <LoggedLayout currentPage="school">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-8">
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่ได้ลงทะเบียนโรงเรียน</h3>
                <p className="text-gray-600 mb-4">กรุณาลงทะเบียนโรงเรียนก่อนเพื่อดูข้อมูล</p>
                <button
                  onClick={() => navigate('/student/registration')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  ไปลงทะเบียนโรงเรียน
                </button>
              </div>
            </div>
          </div>
        </div>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout currentPage="school">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">ข้อมูลโรงเรียน</h1>
            <p className="mt-2 text-gray-600">ข้อมูลโรงเรียนที่คุณสังกัดและครูพี่เลี้ยง</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* School Information */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">ข้อมูลโรงเรียน</h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    สังกัด
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{schoolData.school_name}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ที่อยู่</label>
                      <p className="mt-1 text-sm text-gray-900">{schoolData.address}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                      <p className="mt-1 text-sm text-gray-900">{schoolData.phone}</p>
                    </div>

                    {schoolData.email && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">อีเมล</label>
                        <p className="mt-1 text-sm text-gray-900">{schoolData.email}</p>
                      </div>
                    )}

                    {schoolData.website && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">เว็บไซต์</label>
                        <a 
                          href={schoolData.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-1 text-sm text-blue-600 hover:text-blue-800"
                        >
                          {schoolData.website}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ปีการศึกษา</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {schoolData.academic_year} ภาคเรียนที่ {schoolData.academic_semester}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">วันที่ลงทะเบียน</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(schoolData.enrollment_date).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Teacher Information & Actions */}
            <div className="space-y-6">
              {/* Teacher Information */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">ครูพี่เลี้ยง</h2>
                
                {schoolData.teacher_id ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {schoolData.teacher_first_name} {schoolData.teacher_last_name}
                        </h3>
                        <p className="text-sm text-gray-500">ครูพี่เลี้ยง</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {schoolData.teacher_phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {schoolData.teacher_phone}
                        </div>
                      )}

                      {schoolData.teacher_email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {schoolData.teacher_email}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">ยังไม่มีครูพี่เลี้ยง</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">ดำเนินการ</h2>
                
                <div className="space-y-3">
                  <button
                    onClick={handleSendMessage}
                    disabled={!schoolData.teacher_id}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    ส่งข้อความหา {schoolData.teacher_first_name} {schoolData.teacher_last_name}
                  </button>

                  <button
                    onClick={handleRequestCompletion}
                    disabled={hasExistingRequest && existingRequestStatus !== 'rejected'}
                    className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      hasExistingRequest && existingRequestStatus !== 'rejected'
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : existingRequestStatus === 'rejected'
                        ? 'text-white bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                        : 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    }`}
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {existingRequestStatus === 'rejected' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                    {hasExistingRequest 
                      ? existingRequestStatus === 'rejected'
                        ? 'ขอประเมินใหม่'
                        : `คำร้อง: ${getStatusText(existingRequestStatus)}`
                      : 'ขอยื่นสำเร็จการฝึก'
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Request Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">ยื่นคำร้องขอสำเร็จการฝึก</h3>
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Teaching Stats */}
              {teachingStats && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">สถิติการฝึกสอน</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">จำนวนครั้งที่สอน:</span>
                      <span className="ml-2 font-semibold">{teachingStats.total_teaching_sessions}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">ชั่วโมงสอนรวม:</span>
                      <span className="ml-2 font-semibold">{teachingStats.total_teaching_hours.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">แผนการสอน:</span>
                      <span className="ml-2 font-semibold">{teachingStats.total_lesson_plans}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    การประเมินตนเอง *
                  </label>
                  <textarea
                    value={completionForm.self_evaluation}
                    onChange={(e) => handleCompletionFormChange('self_evaluation', e.target.value)}
                    placeholder="เขียนการประเมินตนเองเกี่ยวกับการฝึกสอน..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ผลงานที่ภาคภูมิใจ
                  </label>
                  <textarea
                    value={completionForm.achievements}
                    onChange={(e) => handleCompletionFormChange('achievements', e.target.value)}
                    placeholder="เขียนผลงานที่ภาคภูมิใจในการฝึกสอน..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ความท้าทายที่เผชิญ
                  </label>
                  <textarea
                    value={completionForm.challenges_faced}
                    onChange={(e) => handleCompletionFormChange('challenges_faced', e.target.value)}
                    placeholder="เขียนความท้าทายที่เผชิญในการฝึกสอน..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ทักษะที่พัฒนาได้
                  </label>
                  <textarea
                    value={completionForm.skills_developed}
                    onChange={(e) => handleCompletionFormChange('skills_developed', e.target.value)}
                    placeholder="เขียนทักษะที่พัฒนาได้จากการฝึกสอน..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เป้าหมายในอนาคต
                  </label>
                  <textarea
                    value={completionForm.future_goals}
                    onChange={(e) => handleCompletionFormChange('future_goals', e.target.value)}
                    placeholder="เขียนเป้าหมายในอนาคต..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmitCompletionRequest}
                  disabled={!completionForm.self_evaluation.trim() || submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md"
                >
                  {submitting ? 'กำลังส่ง...' : 'ส่งคำร้อง'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </LoggedLayout>
  );
};

export default School;
