import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { supervisorApiService } from '../../services/supervisorApi';

interface EvaluationData {
  id: number;
  student_id: string;
  assignment_id: number;
  total_teaching_hours: number;
  total_lesson_plans: number;
  total_teaching_sessions: number;
  self_evaluation: string;
  achievements: string;
  challenges_faced: string;
  skills_developed: string;
  future_goals: string;
  status: string;
  created_at: string;
  teacher_evaluation: string;
  teacher_rating: number;
  teacher_comments: string;
  teacher_evaluated_at: string;
  first_name: string;
  last_name: string;
  student_code: string;
  faculty: string;
  major: string;
  email: string;
  phone: string;
  school_name: string;
  school_address: string;
  teacher_first_name: string;
  teacher_last_name: string;
  teacher_email: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  teaching_stats: {
    total_sessions: number;
    total_lesson_plans: number;
    total_hours: number;
  };
}

const SupervisorEvaluationDetail: React.FC = () => {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 10 criteria evaluation form
  const [criteria, setCriteria] = useState({
    criteria_1: 0, // ความรู้ความเข้าใจในเนื้อหาวิชา
    criteria_2: 0, // การวางแผนการสอน
    criteria_3: 0, // การใช้สื่อและเทคโนโลยี
    criteria_4: 0, // การจัดการชั้นเรียน
    criteria_5: 0, // การสื่อสารและการนำเสนอ
    criteria_6: 0, // การประเมินผลการเรียนรู้
    criteria_7: 0, // การพัฒนาตนเอง
    criteria_8: 0, // การทำงานร่วมกับครูพี่เลี้ยง
    criteria_9: 0, // ความรับผิดชอบและความตรงต่อเวลา
    criteria_10: 0, // การสะท้อนคิดและการปรับปรุง
  });

  const [overallRating, setOverallRating] = useState<number>(0);
  const [supervisorComments, setSupervisorComments] = useState<string>('');
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');

  const criteriaLabels = [
    'ความรู้ความเข้าใจในเนื้อหาวิชา',
    'การวางแผนการสอน',
    'การใช้สื่อและเทคโนโลยี',
    'การจัดการชั้นเรียน',
    'การสื่อสารและการนำเสนอ',
    'การประเมินผลการเรียนรู้',
    'การพัฒนาตนเอง',
    'การทำงานร่วมกับครูพี่เลี้ยง',
    'ความรับผิดชอบและความตรงต่อเวลา',
    'การสะท้อนคิดและการปรับปรุง'
  ];

  useEffect(() => {
    if (requestId) {
      fetchEvaluationDetail();
    }
  }, [requestId]);

  const fetchEvaluationDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await supervisorApiService.getEvaluationDetail(Number(requestId));
      
      if (response.success && response.data) {
        setEvaluationData(response.data);
      } else {
        setError(response.message || 'ไม่สามารถดึงข้อมูลการประเมินได้');
      }
    } catch (error) {
      console.error('Error fetching evaluation detail:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลการประเมิน');
    } finally {
      setLoading(false);
    }
  };

  const handleCriteriaChange = (criteriaIndex: number, value: number) => {
    setCriteria(prev => ({
      ...prev,
      [`criteria_${criteriaIndex + 1}`]: value
    }));
  };

  const calculateAverageScore = () => {
    const values = Object.values(criteria);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return values.every(val => val > 0) ? (sum / values.length) : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all criteria are filled
    const allCriteriaFilled = Object.values(criteria).every(val => val > 0);
    if (!allCriteriaFilled) {
      alert('กรุณาให้คะแนนทุกเกณฑ์การประเมิน');
      return;
    }

    if (overallRating === 0) {
      alert('กรุณาให้คะแนนรวม');
      return;
    }

    if (!supervisorComments.trim()) {
      alert('กรุณาใส่ความคิดเห็น');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await supervisorApiService.evaluateRequest(Number(requestId), {
        ...criteria,
        overall_rating: overallRating,
        supervisor_comments: supervisorComments,
        decision
      });

      if (response.success) {
        alert(response.message);
        navigate('/supervisor/evaluations');
      } else {
        alert(response.message || 'เกิดข้อผิดพลาดในการประเมิน');
      }
    } catch (error) {
      console.error('Error evaluating request:', error);
      alert('เกิดข้อผิดพลาดในการประเมิน');
    } finally {
      setSubmitting(false);
    }
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

  if (error || !evaluationData) {
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
                onClick={() => navigate('/supervisor/evaluations')}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                กลับไปหน้ารายการ
              </button>
            </div>
          </div>
        </div>
      </LoggedLayout>
    );
  }

  const averageScore = calculateAverageScore();

  return (
    <LoggedLayout currentPage="ประเมิน">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">ประเมินนักศึกษา</h1>
              <p className="text-blue-100">
                {evaluationData.first_name} {evaluationData.last_name} ({evaluationData.student_code})
              </p>
            </div>
            <button
              onClick={() => navigate('/supervisor/evaluations')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              กลับ
            </button>
          </div>
        </div>

        {/* Student Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ข้อมูลนักศึกษา</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
              <p className="text-lg font-semibold text-gray-900">
                {evaluationData.first_name} {evaluationData.last_name}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">รหัสนักศึกษา</label>
              <p className="text-gray-900">{evaluationData.student_code}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">คณะ/สาขา</label>
              <p className="text-gray-900">{evaluationData.faculty} - {evaluationData.major}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">โรงเรียน</label>
              <p className="text-gray-900">{evaluationData.school_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ครูพี่เลี้ยง</label>
              <p className="text-gray-900">
                {evaluationData.teacher_first_name} {evaluationData.teacher_last_name}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ปีการศึกษา</label>
              <p className="text-gray-900">{evaluationData.academic_year}</p>
            </div>
          </div>
        </div>

        {/* Teaching Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">สถิติการฝึกสอน</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">ชั่วโมงสอน</p>
                  <p className="text-2xl font-bold text-gray-900">{evaluationData.total_teaching_hours}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">แผนการสอน</p>
                  <p className="text-2xl font-bold text-gray-900">{evaluationData.total_lesson_plans}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">บันทึกการสอน</p>
                  <p className="text-2xl font-bold text-gray-900">{evaluationData.total_teaching_sessions}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Teacher Evaluation */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">การประเมินของครูพี่เลี้ยง</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">คะแนนจากครูพี่เลี้ยง</label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <div
                    key={rating}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      rating <= (evaluationData.teacher_rating || 0)
                        ? 'bg-yellow-400 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    ★
                  </div>
                ))}
                <span className="ml-2 text-gray-600">
                  {evaluationData.teacher_rating || 0}/5
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ความคิดเห็นของครูพี่เลี้ยง</label>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900">{evaluationData.teacher_comments || 'ไม่มีความคิดเห็น'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Supervisor Evaluation Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">การประเมินของอาจารย์นิเทศ</h2>
          
          {/* 10 Criteria Evaluation */}
          <div className="space-y-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900">เกณฑ์การประเมิน (ให้คะแนน 1-5)</h3>
            {criteriaLabels.map((label, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    เกณฑ์ที่ {index + 1}: {label}
                  </label>
                  <span className="text-sm text-gray-500">
                    {criteria[`criteria_${index + 1}` as keyof typeof criteria]}/5
                  </span>
                </div>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleCriteriaChange(index, rating)}
                      className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 ${
                        criteria[`criteria_${index + 1}` as keyof typeof criteria] === rating
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Overall Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">คะแนนรวม (1-5)</label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setOverallRating(rating)}
                  className={`w-12 h-12 rounded-lg border-2 transition-all duration-200 ${
                    overallRating === rating
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>

          {/* Average Score Display */}
          {averageScore > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">คะแนนเฉลี่ยจาก 10 เกณฑ์:</span>
                <span className="text-lg font-bold text-blue-900">{averageScore.toFixed(2)}/5</span>
              </div>
            </div>
          )}

          {/* Decision */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">การตัดสิน</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="approved"
                  checked={decision === 'approved'}
                  onChange={(e) => setDecision(e.target.value as 'approved' | 'rejected')}
                  className="mr-2"
                />
                <span className="text-green-700 font-medium">ผ่าน</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="rejected"
                  checked={decision === 'rejected'}
                  onChange={(e) => setDecision(e.target.value as 'approved' | 'rejected')}
                  className="mr-2"
                />
                <span className="text-red-700 font-medium">ไม่ผ่าน</span>
              </label>
            </div>
          </div>

          {/* Comments */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ความคิดเห็น <span className="text-red-500">*</span>
            </label>
            <textarea
              value={supervisorComments}
              onChange={(e) => setSupervisorComments(e.target.value)}
              rows={4}
              placeholder="กรุณาใส่ความคิดเห็นและข้อเสนอแนะ..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/supervisor/evaluations')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึกการประเมิน'}
            </button>
          </div>
        </form>
      </div>
    </LoggedLayout>
  );
};

export default SupervisorEvaluationDetail;
