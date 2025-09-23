import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { supervisorApiService } from '../../services/supervisorApi';

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

interface CompletionRequest {
  id: number;
  student_id: number;
  assignment_id: number;
  request_date: string;
  total_teaching_hours: number;
  total_lesson_plans: number;
  total_teaching_sessions: number;
  self_evaluation?: string;
  achievements?: string;
  challenges_faced?: string;
  skills_developed?: string;
  future_goals?: string;
  teacher_comments?: string;
  teacher_rating?: number;
  teacher_reviewed_at?: string;
  status: string;
  student_first_name?: string;
  student_last_name?: string;
  student_code?: string;
  school_name?: string;
  teacher_first_name?: string;
  teacher_last_name?: string;
  detailed_evaluation_data?: any;
  detailed_rating?: number;
}

const SupervisorDetailedEvaluation: React.FC = () => {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const [completionRequest, setCompletionRequest] = useState<CompletionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Evaluation data for completion requests (7 categories with sub-items)
  const [evaluationData, setEvaluationData] = useState<EvaluationCriteria[]>([
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
  ]);

  const [overallComments, setOverallComments] = useState('');
  const [passStatus, setPassStatus] = useState<'pass' | 'fail'>('pass');
  const [reason, setReason] = useState('');

  const ratingLabels = {
    1: { label: 'ต้องปรับปรุง', color: 'text-red-600' },
    2: { label: 'พอใช้', color: 'text-orange-600' },
    3: { label: 'ดี', color: 'text-yellow-600' },
    4: { label: 'ดีมาก', color: 'text-blue-600' },
    5: { label: 'ดีเยี่ยม', color: 'text-green-600' }
  };

  useEffect(() => {
    if (requestId) {
      fetchCompletionRequest();
    }
  }, [requestId]);

  const fetchCompletionRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await supervisorApiService.getEvaluationDetail(Number(requestId));
      
      if (response.success && response.data) {
        setCompletionRequest(response.data);
      } else {
        setError(response.message || 'ไม่สามารถดึงข้อมูลคำร้องได้');
      }
    } catch (error) {
      console.error('Error fetching completion request:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง');
    } finally {
      setLoading(false);
    }
  };

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

  const calculateOverallRating = () => {
    const allSubItems = evaluationData.flatMap(criteria => criteria.subItems || []);
    const ratedSubItems = allSubItems.filter(subItem => subItem.rating > 0);
    
    if (ratedSubItems.length === 0) return 0;
    
    const totalRating = ratedSubItems.reduce((sum, subItem) => sum + subItem.rating, 0);
    return totalRating / ratedSubItems.length;
  };

  const isFormValid = () => {
    const allSubItems = evaluationData.flatMap(criteria => criteria.subItems || []);
    return allSubItems.every(subItem => subItem.rating > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      alert('กรุณาให้คะแนนทุกหัวข้อย่อย');
      return;
    }

    if (!overallComments.trim()) {
      alert('กรุณาใส่ความเห็นรวมและข้อเสนอแนะ');
      return;
    }

    if (passStatus === 'fail' && !reason.trim()) {
      alert('กรุณาระบุเหตุผลในการตัดสิน');
      return;
    }

    try {
      setSubmitting(true);
      
      const overallRating = calculateOverallRating();
      const finalStatus = passStatus === 'pass' ? 'supervisor_approved' : 'supervisor_rejected';
      
      const response = await supervisorApiService.evaluateCompletionRequest(
        Number(requestId),
        overallComments,
        overallRating,
        finalStatus,
        evaluationData
      );

      if (response.success) {
        alert('ประเมินคำร้องขอสำเร็จการฝึกสำเร็จ');
        navigate('/supervisor/evaluations');
      } else {
        alert(response.message || 'เกิดข้อผิดพลาดในการประเมิน');
      }
    } catch (error) {
      console.error('Error evaluating completion request:', error);
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

  if (error) {
    return (
      <LoggedLayout currentPage="ประเมิน">
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">เกิดข้อผิดพลาด</h1>
            <p className="text-red-100">{error}</p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/supervisor/evaluations')}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              กลับไปหน้าการประเมิน
            </button>
          </div>
        </div>
      </LoggedLayout>
    );
  }

  if (!completionRequest) {
    return (
      <LoggedLayout currentPage="ประเมิน">
        <div className="text-center py-12">
          <p className="text-gray-500">ไม่พบข้อมูลคำร้องขอสำเร็จการฝึก</p>
        </div>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout currentPage="ประเมิน">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">ประเมินแบบละเอียด</h1>
          <p className="text-purple-100">ประเมินคำร้องขอสำเร็จการฝึกแบบละเอียด</p>
          <p className="text-purple-100">นักศึกษา: {completionRequest.student_first_name} {completionRequest.student_last_name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Information */}
          {completionRequest && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">ข้อมูลที่นักศึกษายื่นมา</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">สถิติการฝึกสอน</h4>
                  <div className="space-y-2 text-sm">
                    <div>ชั่วโมงสอนรวม: {parseFloat(String(completionRequest.total_teaching_hours || '0')).toFixed(2)} ชั่วโมง</div>
                    <div>แผนการสอน: {completionRequest.total_lesson_plans} แผน</div>
                    <div>ครั้งที่สอน: {completionRequest.total_teaching_sessions} ครั้ง</div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">ข้อมูลการยื่นคำร้อง</h4>
                  <div className="space-y-2 text-sm">
                    <div>วันที่ยื่นคำร้อง</div>
                    <p className="text-sm">{new Date(completionRequest.request_date).toLocaleDateString('th-TH')}</p>
                  </div>
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
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">การประเมินตามด้านต่างๆ</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ด้านการประเมิน
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      คะแนน (ดาว)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {evaluationData.map((criteria, index) => (
                    <React.Fragment key={criteria.id}>
                      {/* Main Category Row */}
                      <tr className="bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900 mr-2">{index + 1}</span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{criteria.name}</div>
                              <div className="text-sm text-gray-500 mt-1">{criteria.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-gray-500">หัวข้อหลัก</span>
                        </td>
                      </tr>
                      
                      {/* Sub-items */}
                      {criteria.subItems?.map((subItem, subIndex) => (
                        <tr key={subItem.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 pl-16">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-600 mr-2">{subIndex + 1}</span>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{subItem.name}</div>
                                <div className="text-sm text-gray-500 mt-1">{subItem.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center space-x-1">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  key={rating}
                                  type="button"
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

            {/* Overall Rating Display */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-blue-800">คะแนนรวม</span>
                <span className="text-2xl font-bold text-blue-600">
                  {calculateOverallRating().toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-blue-600 mt-1">
                จากคะแนนเต็ม 5.00
              </div>
            </div>
          </div>

          {/* Overall Comments */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">ความเห็นรวมและข้อเสนอแนะ</h3>
            <textarea
              value={overallComments}
              onChange={(e) => setOverallComments(e.target.value)}
              placeholder="กรุณาให้ความเห็นรวมและข้อเสนอแนะสำหรับการฝึกสอนครั้งนี้..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              required
            />
          </div>

          {/* Pass/Fail Decision */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">สรุปผลการประเมิน</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">ผลการประเมิน</label>
                <div className="flex space-x-6">
                  <button
                    type="button"
                    onClick={() => setPassStatus('pass')}
                    className={`px-10 py-5 rounded-2xl border-3 transition-all duration-300 transform hover:scale-110 hover:shadow-2xl ${
                      passStatus === 'pass'
                        ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-600 text-white shadow-2xl ring-4 ring-green-200'
                        : 'bg-white border-green-400 text-green-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:border-green-500 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xl font-bold">ผ่าน</span>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPassStatus('fail')}
                    className={`px-10 py-5 rounded-2xl border-3 transition-all duration-300 transform hover:scale-110 hover:shadow-2xl ${
                      passStatus === 'fail'
                        ? 'bg-gradient-to-r from-red-500 to-red-600 border-red-600 text-white shadow-2xl ring-4 ring-red-200'
                        : 'bg-white border-red-400 text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:border-red-500 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xl font-bold">ไม่ผ่าน</span>
                    </div>
                  </button>
                </div>
              </div>

              {passStatus === 'fail' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">เหตุผลในการตัดสิน</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="กรุณาระบุเหตุผลในการตัดสินผลการประเมิน..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows={3}
                    required={passStatus === 'fail'}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/supervisor/evaluations')}
              className="px-6 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors duration-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting || !isFormValid()}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {submitting ? 'กำลังส่ง...' : 'ส่งการประเมิน'}
            </button>
          </div>
        </form>
      </div>
    </LoggedLayout>
  );
};

export default SupervisorDetailedEvaluation;
