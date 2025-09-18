import React, { useState } from 'react';
import { teacherApiService } from '../../services/teacherApi';

interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  rating: number;
  feedback: string;
}

interface DetailedEvaluationProps {
  teachingSession?: any;
  completionRequest?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const DetailedEvaluation: React.FC<DetailedEvaluationProps> = ({ 
  teachingSession, 
  completionRequest,
  onClose, 
  onSuccess 
}) => {
  const isCompletionRequest = !!completionRequest;
  const [evaluationData, setEvaluationData] = useState<EvaluationCriteria[]>(() => {
    if (isCompletionRequest) {
      return [
        {
          id: '1',
          name: 'ความรู้ความเข้าใจในวิชาชีพ',
          description: 'การแสดงออกถึงความรู้ความเข้าใจในวิชาชีพครูและการประยุกต์ใช้',
          rating: 0,
          feedback: ''
        },
        {
          id: '2',
          name: 'ทักษะการสอน',
          description: 'ความสามารถในการสอน การใช้เทคนิคการสอน และการจัดการชั้นเรียน',
          rating: 0,
          feedback: ''
        },
        {
          id: '3',
          name: 'การสื่อสารและการปฏิสัมพันธ์',
          description: 'ความสามารถในการสื่อสารกับนักเรียน ผู้ปกครอง และเพื่อนร่วมงาน',
          rating: 0,
          feedback: ''
        },
        {
          id: '4',
          name: 'การวางแผนและการจัดการ',
          description: 'ความสามารถในการวางแผนการสอน การจัดการเวลา และการจัดระบบงาน',
          rating: 0,
          feedback: ''
        },
        {
          id: '5',
          name: 'การประเมินและการติดตาม',
          description: 'ความสามารถในการประเมินผลการเรียนรู้และการติดตามความก้าวหน้าของนักเรียน',
          rating: 0,
          feedback: ''
        },
        {
          id: '6',
          name: 'การพัฒนาตนเอง',
          description: 'การแสดงออกถึงความมุ่งมั่นในการพัฒนาตนเองและการเรียนรู้อย่างต่อเนื่อง',
          rating: 0,
          feedback: ''
        },
        {
          id: '7',
          name: 'จรรยาบรรณวิชาชีพ',
          description: 'การปฏิบัติตนตามจรรยาบรรณวิชาชีพครูและการเป็นแบบอย่างที่ดี',
          rating: 0,
          feedback: ''
        },
        {
          id: '8',
          name: 'การทำงานเป็นทีม',
          description: 'ความสามารถในการทำงานร่วมกับเพื่อนร่วมงานและทีมงาน',
          rating: 0,
          feedback: ''
        },
        {
          id: '9',
          name: 'การแก้ไขปัญหาและความคิดสร้างสรรค์',
          description: 'ความสามารถในการแก้ไขปัญหาและใช้ความคิดสร้างสรรค์ในการสอน',
          rating: 0,
          feedback: ''
        },
        {
          id: '10',
          name: 'ความพร้อมในการประกอบอาชีพ',
          description: 'ความพร้อมและความเหมาะสมในการประกอบอาชีพครูในอนาคต',
          rating: 0,
          feedback: ''
        }
      ];
    } else {
      return [
        {
          id: '1',
          name: 'การเตรียมการสอน',
          description: 'การเตรียมแผนการสอน วัสดุอุปกรณ์ และเนื้อหาที่จะสอน',
          rating: 0,
          feedback: ''
        },
        {
          id: '2',
          name: 'การจัดการชั้นเรียน',
          description: 'การควบคุมชั้นเรียน การสร้างบรรยากาศการเรียนรู้ และการจัดการพฤติกรรมนักเรียน',
          rating: 0,
          feedback: ''
        },
        {
          id: '3',
          name: 'เทคนิคการสอน',
          description: 'การใช้วิธีการสอนที่เหมาะสม การอธิบายที่ชัดเจน และการกระตุ้นให้นักเรียนคิด',
          rating: 0,
          feedback: ''
        },
        {
          id: '4',
          name: 'การสื่อสารกับนักเรียน',
          description: 'การใช้ภาษาและท่าทางที่เหมาะสม การฟังและการตอบคำถามนักเรียน',
          rating: 0,
          feedback: ''
        },
        {
          id: '5',
          name: 'การประเมินผลการเรียนรู้',
          description: 'การตรวจสอบความเข้าใจของนักเรียน การให้คำแนะนำ และการประเมินผลงาน',
          rating: 0,
          feedback: ''
        },
        {
          id: '6',
          name: 'การแก้ไขปัญหา',
          description: 'การแก้ไขปัญหาที่เกิดขึ้นในชั้นเรียน การปรับแผนการสอนตามสถานการณ์',
          rating: 0,
          feedback: ''
        },
        {
          id: '7',
          name: 'การทำงานร่วมกับครูพี่เลี้ยง',
          description: 'การรับฟังคำแนะนำ การปรึกษา และการทำงานร่วมกับครูพี่เลี้ยง',
          rating: 0,
          feedback: ''
        },
        {
          id: '8',
          name: 'ความรับผิดชอบ',
          description: 'การตรงต่อเวลา การส่งงานตามกำหนด และการปฏิบัติตามกฎระเบียบ',
          rating: 0,
          feedback: ''
        },
        {
          id: '9',
          name: 'การพัฒนาตนเอง',
          description: 'การแสวงหาความรู้ใหม่ การปรับปรุงตนเอง และการรับฟังข้อเสนอแนะ',
          rating: 0,
          feedback: ''
        },
        {
          id: '10',
          name: 'การสร้างแรงบันดาลใจ',
          description: 'การสร้างแรงจูงใจให้นักเรียนเรียน การเป็นแบบอย่างที่ดี และการสร้างบรรยากาศการเรียนรู้',
          rating: 0,
          feedback: ''
        }
      ];
    }
  });

  const [overallFeedback, setOverallFeedback] = useState('');
  const [passStatus, setPassStatus] = useState<'pass' | 'fail'>('pass');
  const [passReason, setPassReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const ratingLabels = {
    1: { label: 'น้อยมาก', color: 'text-red-600', bgColor: 'bg-red-100' },
    2: { label: 'น้อย', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    3: { label: 'ปานกลาง', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    4: { label: 'ดี', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    5: { label: 'ดีมาก', color: 'text-green-600', bgColor: 'bg-green-100' }
  };

  const handleRatingChange = (criteriaId: string, rating: number) => {
    setEvaluationData(prev => 
      prev.map(criteria => 
        criteria.id === criteriaId 
          ? { ...criteria, rating }
          : criteria
      )
    );
  };

  const handleFeedbackChange = (criteriaId: string, feedback: string) => {
    setEvaluationData(prev => 
      prev.map(criteria => 
        criteria.id === criteriaId 
          ? { ...criteria, feedback }
          : criteria
      )
    );
  };

  const calculateOverallRating = () => {
    const totalRating = evaluationData.reduce((sum, criteria) => sum + criteria.rating, 0);
    return totalRating > 0 ? (totalRating / evaluationData.length).toFixed(2) : 0;
  };

  const isFormValid = () => {
    return evaluationData.every(criteria => criteria.rating > 0) && 
           overallFeedback.trim() !== '' && 
           passReason.trim() !== '';
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      setSubmitting(true);
      
      let response;
      
      if (isCompletionRequest) {
        // สำหรับ completion request ใช้ API แยก
        response = await teacherApiService.evaluateCompletionRequest(
          completionRequest.id,
          overallFeedback,
          parseFloat(calculateOverallRating().toString()),
          passStatus === 'pass' ? 'approved' : 'rejected'
        );
      } else {
        // สำหรับ teaching session ใช้ detailed evaluation
        response = await teacherApiService.submitDetailedEvaluation({
          teachingSessionId: teachingSession.id,
          criteria: evaluationData,
          overallFeedback,
          overallRating: parseFloat(calculateOverallRating().toString()),
          passStatus,
          passReason
        });
      }

      if (response.success) {
        alert('ประเมินสำเร็จ');
        onSuccess();
        onClose();
      } else {
        alert(response.message || 'เกิดข้อผิดพลาดในการประเมิน');
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      alert('เกิดข้อผิดพลาดในการประเมิน');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50 backdrop-blur-sm">
      <div className="relative top-4 mx-auto p-6 border-0 w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-2xl rounded-2xl bg-white max-h-[95vh] overflow-y-auto">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-blue-600 to-purple-600 -m-6 p-6 rounded-t-2xl text-white">
            <div>
              <h3 className="text-3xl font-bold mb-2">
                {isCompletionRequest ? 'ประเมินคำร้องขอสำเร็จการฝึกแบบละเอียด' : 'ประเมินการฝึกสอนแบบละเอียด'}
              </h3>
              <p className="text-blue-100 text-lg">
                {isCompletionRequest 
                  ? `นักศึกษา: ${completionRequest.student_name}`
                  : `นักศึกษา: ${teachingSession.student_name} | วิชา: ${teachingSession.subject_name}`
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors bg-white bg-opacity-20 rounded-full p-2 hover:bg-opacity-30"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Evaluation Criteria */}
          <div className="space-y-6 mb-8">
            {evaluationData.map((criteria, index) => (
              <div key={criteria.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                      {index + 1}
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {criteria.name}
                    </h4>
                  </div>
                  <p className="text-gray-600 ml-11 leading-relaxed">{criteria.description}</p>
                </div>

                {/* Rating */}
                <div className="mb-6">
                  <label className="block text-lg font-semibold text-gray-800 mb-4">
                    คะแนน (1-5)
                  </label>
                  <div className="flex space-x-3">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleRatingChange(criteria.id, rating)}
                        className={`w-20 h-20 rounded-xl border-2 transition-all duration-300 transform hover:scale-110 ${
                          criteria.rating === rating
                            ? `${ratingLabels[rating as keyof typeof ratingLabels].bgColor} border-blue-500 scale-110 shadow-lg`
                            : 'bg-white border-gray-300 hover:border-gray-400 hover:shadow-md'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${
                            criteria.rating === rating 
                              ? ratingLabels[rating as keyof typeof ratingLabels].color 
                              : 'text-gray-400'
                          }`}>
                            {rating}
                          </div>
                          <div className={`text-xs font-medium ${
                            criteria.rating === rating 
                              ? ratingLabels[rating as keyof typeof ratingLabels].color 
                              : 'text-gray-400'
                          }`}>
                            {ratingLabels[rating as keyof typeof ratingLabels].label}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">
                    ความเห็นและข้อเสนอแนะ
                  </label>
                  <textarea
                    value={criteria.feedback}
                    onChange={(e) => handleFeedbackChange(criteria.id, e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="กรุณาให้ความเห็นและข้อเสนอแนะสำหรับหัวข้อนี้..."
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Overall Rating */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border-2 border-blue-100">
            <h4 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              คะแนนรวม
            </h4>
            <div className="flex items-center space-x-6">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {calculateOverallRating()}
              </div>
              <div className="text-lg text-gray-600">
                จากคะแนนเต็ม 5.00
              </div>
            </div>
          </div>

          {/* Overall Feedback */}
          <div className="mb-6">
            <label className="block text-xl font-bold text-gray-800 mb-3">
              ความเห็นรวมและข้อเสนอแนะ
            </label>
            <textarea
              value={overallFeedback}
              onChange={(e) => setOverallFeedback(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="กรุณาให้ความเห็นรวมและข้อเสนอแนะสำหรับการฝึกสอนครั้งนี้..."
            />
          </div>

          {/* Pass/Fail Decision */}
          <div className="bg-gradient-to-r from-green-50 to-red-50 rounded-xl p-6 mb-6 border-2 border-gray-200">
            <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              สรุปผลการประเมิน
            </h4>
            
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-800 mb-4">
                ผลการประเมิน
              </label>
              <div className="flex space-x-6 justify-center">
                <button
                  onClick={() => setPassStatus('pass')}
                  className={`px-8 py-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                    passStatus === 'pass'
                      ? 'bg-green-500 border-green-500 text-white shadow-lg'
                      : 'bg-white border-green-300 text-green-600 hover:bg-green-50'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-lg font-semibold">ผ่าน</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setPassStatus('fail')}
                  className={`px-8 py-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                    passStatus === 'fail'
                      ? 'bg-red-500 border-red-500 text-white shadow-lg'
                      : 'bg-white border-red-300 text-red-600 hover:bg-red-50'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-lg font-semibold">ไม่ผ่าน</span>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                เหตุผลในการตัดสิน
              </label>
              <textarea
                value={passReason}
                onChange={(e) => setPassReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="กรุณาระบุเหตุผลในการตัดสินผลการประเมิน..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 font-semibold"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid() || submitting}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
            >
              {submitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังส่ง...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ส่งการประเมิน
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedEvaluation;
