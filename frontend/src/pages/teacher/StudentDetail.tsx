import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { teacherApiService } from '../../services/teacherApi';

interface StudentInfo {
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
  profile_image?: string;
}

interface TeachingSession {
  id: number;
  subject_name: string;
  teaching_date: string;
  start_time: string;
  end_time: string;
  class_level: string;
  class_room: string;
  student_count: number;
  lesson_topic: string;
  status: string;
  teacher_rating?: number;
  teacher_feedback?: string;
  teacher_reviewed_at?: string;
}

interface LessonPlan {
  id: number;
  title: string;
  subject_name: string;
  grade_level: string;
  created_at: string;
  status: string;
  teacher_rating?: number;
  teacher_feedback?: string;
  teacher_reviewed_at?: string;
}

const StudentDetail: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'lesson-plans' | 'teaching-sessions'>('lesson-plans');
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [teachingSessions, setTeachingSessions] = useState<TeachingSession[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'lesson-plan' | 'teaching-session'>('lesson-plan');

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
    }
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const response = await teacherApiService.getStudentDetail(parseInt(studentId!));
      setStudentInfo(response.data?.studentInfo);
      setTeachingSessions(response.data?.teachingSessions || []);
      setLessonPlans(response.data?.lessonPlans || []);
    } catch (error: any) {
      console.error('Error fetching student data:', error);
      setError('ไม่สามารถดึงข้อมูลนักศึกษาได้');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'ส่งแล้ว';
      case 'reviewed':
        return 'ตรวจแล้ว';
      case 'draft':
        return 'ร่าง';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleViewDetail = (item: any, type: 'lesson-plan' | 'teaching-session') => {
    setSelectedItem(item);
    setModalType(type);
    setShowDetailModal(true);
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  if (loading) {
    return (
      <LoggedLayout currentPage="รายละเอียดนักศึกษา">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LoggedLayout>
    );
  }

  if (error || !studentInfo) {
    return (
      <LoggedLayout currentPage="รายละเอียดนักศึกษา">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">เกิดข้อผิดพลาด</div>
          <div className="text-red-500">{error || 'ไม่พบข้อมูลนักศึกษา'}</div>
          <button
            onClick={() => navigate('/teacher/school')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            กลับไปหน้ารายชื่อนักศึกษา
          </button>
        </div>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout currentPage="รายละเอียดนักศึกษา">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {studentInfo.first_name} {studentInfo.last_name}
              </h1>
              <p className="text-blue-100">รหัสนักศึกษา: {studentInfo.student_code}</p>
            </div>
            <button
              onClick={() => navigate('/teacher/school')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
            >
              กลับ
            </button>
          </div>
        </div>

        {/* Student Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ข้อมูลเบื้องต้น</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
              <p className="text-lg font-semibold text-gray-900">
                {studentInfo.first_name} {studentInfo.last_name}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสนักศึกษา</label>
              <p className="text-lg text-gray-900">{studentInfo.student_code}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
              <p className="text-gray-900">{studentInfo.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
              <p className="text-gray-900">{studentInfo.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">คณะ</label>
              <p className="text-gray-900">{studentInfo.faculty}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สาขา</label>
              <p className="text-gray-900">{studentInfo.major}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ลงทะเบียน</label>
              <p className="text-gray-900">{formatDate(studentInfo.enrollment_date)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                studentInfo.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {studentInfo.status === 'active' ? 'กำลังฝึก' : 'เสร็จสิ้น'}
              </span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">แผนการสอน</p>
                <p className="text-2xl font-bold text-gray-900">{lessonPlans.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">บันทึกการฝึกสอน</p>
                <p className="text-2xl font-bold text-gray-900">{teachingSessions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ชั่วโมงสอนรวม</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teachingSessions.reduce((total, session) => {
                    const start = new Date(`2000-01-01T${session.start_time}`);
                    const end = new Date(`2000-01-01T${session.end_time}`);
                    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    return total + hours;
                  }, 0).toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('lesson-plans')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'lesson-plans'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                แผนการสอน ({lessonPlans.length})
              </button>
              <button
                onClick={() => setActiveTab('teaching-sessions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'teaching-sessions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                บันทึกการฝึกสอน ({teachingSessions.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'lesson-plans' ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">แผนการสอน</h3>
                {lessonPlans.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-lg">ยังไม่มีแผนการสอน</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lessonPlans.map((plan) => (
                      <div key={plan.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900">{plan.title}</h4>
                            <p className="text-sm text-gray-600">
                              วิชา: {plan.subject_name} | ระดับ: {plan.grade_level}
                            </p>
                            <p className="text-sm text-gray-500">
                              สร้างเมื่อ: {formatDate(plan.created_at)}
                            </p>
                            {plan.teacher_feedback && (
                              <p className="text-sm text-blue-600 mt-2">
                                ความเห็น: {plan.teacher_feedback}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(plan.status)}`}>
                              {getStatusText(plan.status)}
                            </span>
                            {plan.teacher_rating && (
                              <div className="text-sm text-gray-600">
                                คะแนน: {plan.teacher_rating}/5
                              </div>
                            )}
                            <button
                              onClick={() => handleViewDetail(plan, 'lesson-plan')}
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                            >
                              ดูรายละเอียด
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">บันทึกการฝึกสอน</h3>
                {teachingSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-lg">ยังไม่มีบันทึกการฝึกสอน</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teachingSessions.map((session) => (
                      <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900">{session.lesson_topic}</h4>
                            <p className="text-sm text-gray-600">
                              วิชา: {session.subject_name} | วันที่: {formatDate(session.teaching_date)}
                            </p>
                            <p className="text-sm text-gray-600">
                              เวลา: {formatTime(session.start_time)} - {formatTime(session.end_time)} | 
                              ระดับ: {session.class_level} | ห้อง: {session.class_room} | 
                              นักเรียน: {session.student_count} คน
                            </p>
                            {session.teacher_feedback && (
                              <p className="text-sm text-blue-600 mt-2">
                                ความเห็น: {session.teacher_feedback}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                              {getStatusText(session.status)}
                            </span>
                            {session.teacher_rating && (
                              <div className="text-sm text-gray-600">
                                คะแนน: {session.teacher_rating}/5
                              </div>
                            )}
                            <button
                              onClick={() => handleViewDetail(session, 'teaching-session')}
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                            >
                              ดูรายละเอียด
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {modalType === 'lesson-plan' ? 'รายละเอียดแผนการสอน' : 'รายละเอียดบันทึกการสอน'}
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {modalType === 'lesson-plan' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">ข้อมูลพื้นฐาน</h4>
                      <div className="space-y-2">
                        <p><span className="font-medium">หัวข้อ:</span> {selectedItem.title}</p>
                        <p><span className="font-medium">วิชา:</span> {selectedItem.subject_name}</p>
                        <p><span className="font-medium">ระดับ:</span> {selectedItem.grade_level}</p>
                        <p><span className="font-medium">สถานะ:</span> {getStatusText(selectedItem.status)}</p>
                        <p><span className="font-medium">สร้างเมื่อ:</span> {formatDate(selectedItem.created_at)}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">การประเมิน</h4>
                      <div className="space-y-2">
                        {selectedItem.teacher_rating && (
                          <p><span className="font-medium">คะแนน:</span> {selectedItem.teacher_rating}/5</p>
                        )}
                        {selectedItem.teacher_feedback && (
                          <p><span className="font-medium">ความเห็น:</span> {selectedItem.teacher_feedback}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">วัตถุประสงค์การเรียนรู้</h4>
                    <p className="text-gray-700">{selectedItem.learning_objectives || 'ไม่ระบุ'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">เนื้อหาการสอน</h4>
                    <p className="text-gray-700">{selectedItem.content || 'ไม่ระบุ'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">กิจกรรมการเรียนการสอน</h4>
                    <p className="text-gray-700">{selectedItem.activities || 'ไม่ระบุ'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">สื่อการสอน</h4>
                    <p className="text-gray-700">{selectedItem.materials || 'ไม่ระบุ'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">การประเมินผล</h4>
                    <p className="text-gray-700">{selectedItem.assessment || 'ไม่ระบุ'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">ข้อมูลพื้นฐาน</h4>
                      <div className="space-y-2">
                        <p><span className="font-medium">วิชา:</span> {selectedItem.subject_name}</p>
                        <p><span className="font-medium">วันที่สอน:</span> {formatDate(selectedItem.teaching_date)}</p>
                        <p><span className="font-medium">เวลา:</span> {formatTime(selectedItem.start_time)} - {formatTime(selectedItem.end_time)}</p>
                        <p><span className="font-medium">ระดับ:</span> {selectedItem.class_level}</p>
                        <p><span className="font-medium">ห้อง:</span> {selectedItem.class_room}</p>
                        <p><span className="font-medium">จำนวนนักเรียน:</span> {selectedItem.student_count} คน</p>
                        <p><span className="font-medium">สถานะ:</span> {getStatusText(selectedItem.status)}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">การประเมิน</h4>
                      <div className="space-y-2">
                        {selectedItem.teacher_rating && (
                          <p><span className="font-medium">คะแนน:</span> {selectedItem.teacher_rating}/5</p>
                        )}
                        {selectedItem.teacher_feedback && (
                          <p><span className="font-medium">ความเห็น:</span> {selectedItem.teacher_feedback}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">หัวข้อการสอน</h4>
                    <p className="text-gray-700">{selectedItem.lesson_topic || 'ไม่ระบุ'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">สรุปการสอน</h4>
                    <p className="text-gray-700">{selectedItem.lesson_summary || 'ไม่ระบุ'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">ผลการเรียนรู้</h4>
                    <p className="text-gray-700">{selectedItem.learning_outcomes || 'ไม่ระบุ'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">วิธีการสอนที่ใช้</h4>
                    <p className="text-gray-700">{selectedItem.teaching_methods_used || 'ไม่ระบุ'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">สื่อการสอนที่ใช้</h4>
                    <p className="text-gray-700">{selectedItem.materials_used || 'ไม่ระบุ'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">การมีส่วนร่วมของนักเรียน</h4>
                    <p className="text-gray-700">{selectedItem.student_engagement || 'ไม่ระบุ'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">ปัญหาที่พบ</h4>
                    <p className="text-gray-700">{selectedItem.problems_encountered || 'ไม่ระบุ'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">การแก้ไขปัญหา</h4>
                    <p className="text-gray-700">{selectedItem.problem_solutions || 'ไม่ระบุ'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">บทเรียนที่ได้</h4>
                    <p className="text-gray-700">{selectedItem.lessons_learned || 'ไม่ระบุ'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">การสะท้อนคิด</h4>
                    <p className="text-gray-700">{selectedItem.reflection || 'ไม่ระบุ'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">ข้อเสนอแนะการปรับปรุง</h4>
                    <p className="text-gray-700">{selectedItem.improvement_notes || 'ไม่ระบุ'}</p>
                  </div>
                  
                  {selectedItem.self_rating && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">การประเมินตนเอง</h4>
                      <p className="text-gray-700">คะแนน: {selectedItem.self_rating}/5</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </LoggedLayout>
  );
};

export default StudentDetail;
