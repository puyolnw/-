import React, { useState } from 'react';
import { teacherApiService } from '../../services/teacherApi';

interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  rating: number;
  feedback: string;
  subItems?: EvaluationSubItem[];
}

interface EvaluationSubItem {
  id: string;
  name: string;
  description: string;
  rating: number;
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
          name: 'ด้านเนื้อหาการสอน (Content Knowledge)',
          description: 'การประเมินความรู้ของผู้ฝึกสอนในเนื้อหาวิชาที่สอน ว่ามีความเข้าใจลึกซึ้งและสามารถอธิบายเนื้อหาต่างๆ ให้ผู้เรียนเข้าใจได้หรือไม่',
          rating: 0,
          feedback: '',
          subItems: [
            {
              id: '1-1',
              name: 'ความเข้าใจในเนื้อหา',
              description: 'ความเข้าใจลึกซึ้งในเนื้อหาวิชาที่สอน',
              rating: 0
            },
            {
              id: '1-2',
              name: 'การอธิบายเนื้อหา',
              description: 'ความสามารถในการอธิบายเนื้อหาให้ผู้เรียนเข้าใจ',
              rating: 0
            }
          ]
        },
        {
          id: '2',
          name: 'ด้านวิธีการสอน (Teaching Methods)',
          description: 'การประเมินวิธีการที่ใช้ในการถ่ายทอดความรู้ เช่น การใช้เทคนิคการสอนที่หลากหลาย เช่น การอภิปราย การทำกิจกรรมกลุ่ม หรือการใช้สื่อการสอน',
          rating: 0,
          feedback: '',
          subItems: [
            {
              id: '2-1',
              name: 'เทคนิคการสอน',
              description: 'การใช้เทคนิคการสอนที่หลากหลายและเหมาะสม',
              rating: 0
            },
            {
              id: '2-2',
              name: 'การอภิปรายและกิจกรรม',
              description: 'การจัดกิจกรรมการอภิปรายและกิจกรรมกลุ่ม',
              rating: 0
            }
          ]
        },
        {
          id: '3',
          name: 'ด้านความสัมพันธ์กับผู้เรียน (Teacher-Student Interaction)',
          description: 'การประเมินความสามารถของผู้ฝึกสอนในการสร้างความสัมพันธ์ที่ดีและเป็นมิตรกับผู้เรียน การสร้างบรรยากาศที่เอื้อต่อการเรียนรู้',
          rating: 0,
          feedback: '',
          subItems: [
            {
              id: '3-1',
              name: 'การสร้างความสัมพันธ์',
              description: 'การสร้างความสัมพันธ์ที่ดีกับผู้เรียน',
              rating: 0
            },
            {
              id: '3-2',
              name: 'บรรยากาศการเรียนรู้',
              description: 'การสร้างบรรยากาศที่เอื้อต่อการเรียนรู้',
              rating: 0
            }
          ]
        },
        {
          id: '4',
          name: 'ด้านการประเมินผลการเรียนรู้ของผู้เรียน (Assessment of Learning)',
          description: 'การประเมินว่าเทคนิคหรือวิธีการที่ใช้ในการประเมินผลการเรียนรู้ของผู้เรียนมีประสิทธิภาพหรือไม่ และการปรับใช้ผลการประเมินในการปรับปรุงการสอน',
          rating: 0,
          feedback: '',
          subItems: [
            {
              id: '4-1',
              name: 'วิธีการประเมิน',
              description: 'การใช้วิธีการประเมินที่เหมาะสมและมีประสิทธิภาพ',
              rating: 0
            },
            {
              id: '4-2',
              name: 'การปรับปรุงการสอน',
              description: 'การนำผลการประเมินมาปรับปรุงการสอน',
              rating: 0
            }
          ]
        },
        {
          id: '5',
          name: 'ด้านการจัดการชั้นเรียน (Classroom Management)',
          description: 'การประเมินความสามารถในการจัดการกับสถานการณ์ในห้องเรียน เช่น การควบคุมระเบียบวินัย การจัดสรรเวลา และการกระตุ้นให้ผู้เรียนมีส่วนร่วม',
          rating: 0,
          feedback: '',
          subItems: [
            {
              id: '5-1',
              name: 'การควบคุมระเบียบวินัย',
              description: 'ความสามารถในการควบคุมระเบียบวินัยในชั้นเรียน',
              rating: 0
            },
            {
              id: '5-2',
              name: 'การจัดสรรเวลา',
              description: 'การจัดสรรเวลาในการสอนอย่างเหมาะสม',
              rating: 0
            }
          ]
        },
        {
          id: '6',
          name: 'ด้านการใช้สื่อและเทคโนโลยี (Use of Media and Technology)',
          description: 'การประเมินการใช้สื่อหรือเทคโนโลยีในการสนับสนุนการเรียนการสอน เพื่อเพิ่มประสิทธิภาพในการถ่ายทอดเนื้อหาหรือทำให้การเรียนรู้น่าสนใจขึ้น',
          rating: 0,
          feedback: '',
          subItems: [
            {
              id: '6-1',
              name: 'การใช้สื่อการสอน',
              description: 'การใช้สื่อการสอนที่เหมาะสมและมีประสิทธิภาพ',
              rating: 0
            },
            {
              id: '6-2',
              name: 'การใช้เทคโนโลยี',
              description: 'การใช้เทคโนโลยีในการสนับสนุนการเรียนการสอน',
              rating: 0
            }
          ]
        },
        {
          id: '7',
          name: 'ด้านการพัฒนาตนเอง (Self-Development)',
          description: 'การประเมินความสามารถของผู้ฝึกสอนในการพัฒนาตนเอง เช่น การหาความรู้ใหม่ๆ การปรับปรุงทักษะการสอน รวมไปถึงการรับ feedback และนำไปปรับปรุง',
          rating: 0,
          feedback: '',
          subItems: [
            {
              id: '7-1',
              name: 'การแสวงหาความรู้',
              description: 'การแสวงหาความรู้ใหม่ๆ และพัฒนาตนเอง',
              rating: 0
            },
            {
              id: '7-2',
              name: 'การรับฟังข้อเสนอแนะ',
              description: 'การรับฟัง feedback และนำไปปรับปรุง',
              rating: 0
            }
          ]
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

  // const handleRatingChange = (criteriaId: string, rating: number) => {
  //   setEvaluationData(prev => 
  //     prev.map(criteria => 
  //       criteria.id === criteriaId 
  //         ? { ...criteria, rating }
  //         : criteria
  //     )
  //   );
  // };

  const handleSubItemRatingChange = (criteriaId: string, subItemId: string, rating: number) => {
    setEvaluationData(prev => 
      prev.map(criteria => 
        criteria.id === criteriaId 
          ? {
              ...criteria,
              subItems: criteria.subItems?.map(subItem =>
                subItem.id === subItemId
                  ? { ...subItem, rating }
                  : subItem
              )
            }
          : criteria
      )
    );
  };

  // const handleFeedbackChange = (criteriaId: string, feedback: string) => {
  //   setEvaluationData(prev => 
  //     prev.map(criteria => 
  //       criteria.id === criteriaId 
  //         ? { ...criteria, feedback }
  //         : criteria
  //     )
  //   );
  // };

  const calculateOverallRating = () => {
    if (isCompletionRequest) {
      // คำนวณจากหัวข้อย่อย
      const allSubItems = evaluationData.flatMap(criteria => criteria.subItems || []);
      const totalRating = allSubItems.reduce((sum, subItem) => sum + subItem.rating, 0);
      return totalRating > 0 ? (totalRating / allSubItems.length).toFixed(2) : 0;
    } else {
      // คำนวณจากหัวข้อหลัก (สำหรับ teaching session)
      const totalRating = evaluationData.reduce((sum, criteria) => sum + criteria.rating, 0);
      return totalRating > 0 ? (totalRating / evaluationData.length).toFixed(2) : 0;
    }
  };

  const isFormValid = () => {
    if (isCompletionRequest) {
      // ตรวจสอบหัวข้อย่อย
      const allSubItems = evaluationData.flatMap(criteria => criteria.subItems || []);
      return allSubItems.every(subItem => subItem.rating > 0) && 
             overallFeedback.trim() !== '' && 
             passReason.trim() !== '';
    } else {
      // ตรวจสอบหัวข้อหลัก (สำหรับ teaching session)
      return evaluationData.every(criteria => criteria.rating > 0) && 
             overallFeedback.trim() !== '' && 
             passReason.trim() !== '';
    }
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
          passStatus === 'pass' ? 'approved' : 'rejected',
          evaluationData
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

          {/* Student's Completion Request Data */}
          {isCompletionRequest && (
            <div className="mb-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border-2 border-gray-200">
              <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                ข้อมูลที่นักศึกษายื่นมา
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">สถิติการฝึกสอน</h5>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">ชั่วโมงสอนรวม:</span> {completionRequest.total_teaching_hours} ชั่วโมง</p>
                    <p><span className="font-medium">แผนการสอน:</span> {completionRequest.total_lesson_plans} แผน</p>
                    <p><span className="font-medium">ครั้งที่สอน:</span> {completionRequest.total_teaching_sessions} ครั้ง</p>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">วันที่ยื่นคำร้อง</h5>
                  <p className="text-sm">{new Date(completionRequest.request_date).toLocaleDateString('th-TH')}</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">การประเมินตนเอง</h5>
                  <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border">
                    {completionRequest.self_evaluation && completionRequest.self_evaluation.trim() !== '' 
                      ? completionRequest.self_evaluation 
                      : 'นักศึกษาไม่ได้กรอกข้อมูลการประเมินตนเอง'
                    }
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">ผลงานที่ภาคภูมิใจ</h5>
                  <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border">
                    {completionRequest.achievements && completionRequest.achievements.trim() !== '' 
                      ? completionRequest.achievements 
                      : 'นักศึกษาไม่ได้กรอกข้อมูลผลงานที่ภาคภูมิใจ'
                    }
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">ความท้าทายที่เผชิญ</h5>
                  <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border">
                    {completionRequest.challenges_faced && completionRequest.challenges_faced.trim() !== '' 
                      ? completionRequest.challenges_faced 
                      : 'นักศึกษาไม่ได้กรอกข้อมูลความท้าทายที่เผชิญ'
                    }
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">ทักษะที่พัฒนาได้</h5>
                  <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border">
                    {completionRequest.skills_developed && completionRequest.skills_developed.trim() !== '' 
                      ? completionRequest.skills_developed 
                      : 'นักศึกษาไม่ได้กรอกข้อมูลทักษะที่พัฒนาได้'
                    }
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">เป้าหมายในอนาคต</h5>
                  <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border">
                    {completionRequest.future_goals && completionRequest.future_goals.trim() !== '' 
                      ? completionRequest.future_goals 
                      : 'นักศึกษาไม่ได้กรอกข้อมูลเป้าหมายในอนาคต'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Evaluation Criteria Table */}
          <div className="mb-8">
            <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              การประเมินตามด้านต่างๆ
            </h4>
            
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">ด้านการประเมิน</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">คะแนน (ดาว)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {evaluationData.map((criteria, index) => (
                      <React.Fragment key={criteria.id}>
                        {/* หัวข้อหลัก */}
                        <tr className="bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-start">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 flex-shrink-0 mt-1">
                                {index + 1}
                              </div>
                              <div>
                                <h5 className="text-lg font-semibold text-gray-900 mb-2">
                                  {criteria.name}
                                </h5>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {criteria.description}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="text-sm text-gray-500 font-medium">
                              หัวข้อหลัก
                            </div>
                          </td>
                        </tr>
                        
                        {/* หัวข้อย่อย */}
                        {criteria.subItems?.map((subItem, subIndex) => (
                          <tr key={subItem.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 pl-16">
                              <div className="flex items-start">
                                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-xs mr-3 flex-shrink-0 mt-1">
                                  {subIndex + 1}
                                </div>
                                <div>
                                  <h6 className="text-base font-medium text-gray-800 mb-1">
                                    {subItem.name}
                                  </h6>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    {subItem.description}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center space-x-1">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <button
                                    key={rating}
                                    onClick={() => handleSubItemRatingChange(criteria.id, subItem.id, rating)}
                                    className={`w-8 h-8 rounded-full transition-all duration-200 transform hover:scale-110 ${
                                      subItem.rating >= rating
                                        ? 'text-yellow-400 hover:text-yellow-500'
                                        : 'text-gray-300 hover:text-gray-400'
                                    }`}
                                  >
                                    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  </button>
                                ))}
                              </div>
                              {subItem.rating > 0 && (
                                <div className="mt-1 text-xs text-gray-600">
                                  {ratingLabels[subItem.rating as keyof typeof ratingLabels].label}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
              <div className="flex space-x-8 justify-center">
                <button
                  onClick={() => setPassStatus('pass')}
                  className={`px-10 py-5 rounded-2xl border-3 transition-all duration-300 transform hover:scale-110 hover:shadow-2xl ${
                    passStatus === 'pass'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-600 text-white shadow-2xl ring-4 ring-green-200'
                      : 'bg-white border-green-400 text-green-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:border-green-500 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 mr-4 rounded-full flex items-center justify-center ${
                      passStatus === 'pass' 
                        ? 'bg-white bg-opacity-20' 
                        : 'bg-green-100'
                    }`}>
                      <svg className={`w-5 h-5 ${
                        passStatus === 'pass' ? 'text-white' : 'text-green-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-xl font-bold">ผ่าน</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setPassStatus('fail')}
                  className={`px-10 py-5 rounded-2xl border-3 transition-all duration-300 transform hover:scale-110 hover:shadow-2xl ${
                    passStatus === 'fail'
                      ? 'bg-gradient-to-r from-red-500 to-red-600 border-red-600 text-white shadow-2xl ring-4 ring-red-200'
                      : 'bg-white border-red-400 text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:border-red-500 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 mr-4 rounded-full flex items-center justify-center ${
                      passStatus === 'fail' 
                        ? 'bg-white bg-opacity-20' 
                        : 'bg-red-100'
                    }`}>
                      <svg className={`w-5 h-5 ${
                        passStatus === 'fail' ? 'text-white' : 'text-red-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <span className="text-xl font-bold">ไม่ผ่าน</span>
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
