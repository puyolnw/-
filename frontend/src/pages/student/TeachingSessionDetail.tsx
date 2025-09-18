import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { teachingSessionApiService, type TeachingSession } from '../../services/teachingSessionApi';

const TeachingSessionDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<TeachingSession | null>(null);
  const [sessionFiles, setSessionFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchSessionDetail();
    }
  }, [id]);

  const fetchSessionDetail = async () => {
    try {
      setLoading(true);
      const response = await teachingSessionApiService.getTeachingSessionById(Number(id));
      
      if (response.success && response.data) {
        setSession(response.data);
        
        // ใช้ข้อมูลไฟล์ที่ได้จาก response โดยตรง
        if (response.data.files) {
          setSessionFiles(response.data.files);
        } else {
          setSessionFiles([]);
        }
      } else {
        setError(response.message || 'ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (error) {
      console.error('Error fetching session detail:', error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/student/teaching-sessions/edit/${id}`);
  };

  const handleDelete = async () => {
    console.log('🔴 Frontend - Delete button clicked, session ID:', id);
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบบันทึกการฝึกสอนนี้?')) {
      try {
        console.log('🔴 Frontend - Calling delete API for session ID:', Number(id));
        const response = await teachingSessionApiService.deleteTeachingSession(Number(id));
        console.log('🔴 Frontend - Delete API response:', response);
        if (response.success) {
          alert('ลบบันทึกการฝึกสอนสำเร็จ!');
          navigate('/student/teaching-sessions');
        } else {
          const errorMessage = response.message || 'ไม่สามารถลบข้อมูลได้';
          setError(errorMessage);
          alert(`ไม่สามารถลบบันทึกได้: ${errorMessage}`);
        }
      } catch (error) {
        console.error('🔴 Frontend - Error deleting session:', error);
        const errorMessage = 'เกิดข้อผิดพลาดในการลบข้อมูล';
        setError(errorMessage);
        alert(`ไม่สามารถลบบันทึกได้: ${errorMessage}`);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'ร่าง' },
      submitted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'ส่งแล้ว' },
      reviewed: { bg: 'bg-green-100', text: 'text-green-800', label: 'ตรวจแล้ว' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Remove seconds if present
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <LoggedLayout currentPage="teaching-sessions">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-8">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">กำลังโหลดข้อมูล...</span>
              </div>
            </div>
          </div>
        </div>
      </LoggedLayout>
    );
  }

  if (error || !session) {
    return (
      <LoggedLayout currentPage="teaching-sessions">
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
                <p className="text-gray-600 mb-4">{error || 'ไม่พบข้อมูลบันทึกการฝึกสอน'}</p>
                <button
                  onClick={() => navigate('/student/teaching-sessions')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  กลับไปหน้ารายการ
                </button>
              </div>
            </div>
          </div>
        </div>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout currentPage="teaching-sessions">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">รายละเอียดบันทึกการฝึกสอน</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    {formatDate(session.teaching_date)} • {formatTime(session.start_time)} - {formatTime(session.end_time)}
                  </p>
                </div>
                <div className="flex space-x-3">
                  {getStatusBadge(session.status)}
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลพื้นฐาน</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">วิชาที่สอน</label>
                    <p className="mt-1 text-sm text-gray-900">{session.subject_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">แผนการสอน</label>
                    <p className="mt-1 text-sm text-gray-900">{session.lesson_plan_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ระดับชั้น</label>
                    <p className="mt-1 text-sm text-gray-900">{session.class_level || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ห้องเรียน</label>
                    <p className="mt-1 text-sm text-gray-900">{session.class_room || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">จำนวนนักเรียน</label>
                    <p className="mt-1 text-sm text-gray-900">{session.student_count || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">คะแนนตนเอง</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {session.self_rating ? `${session.self_rating}/5` : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lesson Details */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">รายละเอียดการสอน</h2>
                <div className="space-y-4">
                  {session.lesson_topic && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">หัวข้อบทเรียน</label>
                      <p className="mt-1 text-sm text-gray-900">{session.lesson_topic}</p>
                    </div>
                  )}
                  
                  {session.lesson_summary && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">สรุปบทเรียน</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{session.lesson_summary}</p>
                    </div>
                  )}
                  
                  {session.learning_outcomes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ผลการเรียนรู้</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{session.learning_outcomes}</p>
                    </div>
                  )}
                  
                  {session.teaching_methods_used && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">วิธีการสอนที่ใช้</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{session.teaching_methods_used}</p>
                    </div>
                  )}
                  
                  {session.materials_used && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">สื่อการสอนที่ใช้</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{session.materials_used}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reflection */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">การสะท้อนคิด</h2>
                <div className="space-y-4">
                  {session.student_engagement && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">การมีส่วนร่วมของนักเรียน</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{session.student_engagement}</p>
                    </div>
                  )}
                  
                  {session.problems_encountered && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ปัญหาที่เกิดขึ้น</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{session.problems_encountered}</p>
                    </div>
                  )}
                  
                  {session.problem_solutions && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">วิธีแก้ปัญหา</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{session.problem_solutions}</p>
                    </div>
                  )}
                  
                  {session.lessons_learned && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">สิ่งที่ได้เรียนรู้</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{session.lessons_learned}</p>
                    </div>
                  )}
                  
                  {session.reflection && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">การสะท้อนคิด</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{session.reflection}</p>
                    </div>
                  )}
                  
                  {session.improvement_notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ข้อเสนอแนะในการปรับปรุง</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{session.improvement_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Teacher Feedback */}
              {session.teacher_feedback && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">ความเห็นจากครูพี่เลี้ยง</h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{session.teacher_feedback}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Session Info */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลการฝึกสอน</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">วันที่สอน</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(session.teaching_date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">เวลา</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatTime(session.start_time)} - {formatTime(session.end_time)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ระยะเวลา</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {session.duration_minutes ? `${Math.round(session.duration_minutes / 60)} ชั่วโมง` : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">สถานะ</label>
                    <div className="mt-1">{getStatusBadge(session.status)}</div>
                  </div>
                </div>
              </div>

              {/* Files */}
              {sessionFiles.length > 0 && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ไฟล์แนบ</h3>
                  <div className="space-y-3">
                    {sessionFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            {file.file_category === 'photo' ? (
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            ) : file.file_category === 'video' ? (
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.file_name}</p>
                            <p className="text-xs text-gray-500">
                              {file.file_category === 'photo' ? 'รูปภาพ' : 
                               file.file_category === 'video' ? 'วิดีโอ' : 
                               file.file_category === 'document' ? 'เอกสาร' : 'ไฟล์อื่นๆ'}
                              • {Math.round(file.file_size / 1024)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {file.file_category === 'photo' && (
                            <button
                              onClick={() => {
                                // เปิดรูปภาพในแท็บใหม่
                                window.open(`/api/uploads/teaching-sessions/${file.file_path.split('/').pop()}`, '_blank');
                              }}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              ดูรูป
                            </button>
                          )}
                          <button
                            onClick={() => {
                              // ดาวน์โหลดไฟล์
                              const link = document.createElement('a');
                              link.href = `/api/student/teaching-sessions/${id}/files/${file.id}/download`;
                              link.download = file.file_name;
                              link.click();
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            ดาวน์โหลด
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">การดำเนินการ</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleEdit}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    แก้ไขบันทึก
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    ลบบันทึก
                  </button>
                  <button
                    onClick={() => navigate('/student/teaching-sessions')}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    กลับไปหน้ารายการ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LoggedLayout>
  );
};

export default TeachingSessionDetail;
