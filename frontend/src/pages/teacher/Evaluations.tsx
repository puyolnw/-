import React, { useState, useEffect } from 'react';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { teacherApiService, type CompletionRequest } from '../../services/teacherApi';
import DetailedEvaluation from './DetailedEvaluation';

const Evaluations: React.FC = () => {
  const [completionRequests, setCompletionRequests] = useState<CompletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDetailedEvaluation, setShowDetailedEvaluation] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [evaluationForm, setEvaluationForm] = useState({
    feedback: '',
    rating: 5
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await teacherApiService.getPendingCompletionRequests();
      if (response.success && response.data) {
        setCompletionRequests(response.data);
      } else {
        setError(response.message || 'ไม่สามารถดึงข้อมูลคำร้องขอสำเร็จการฝึกได้');
      }
    } catch (error) {
      console.error('🔵 Frontend - Error fetching data:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = (item: any) => {
    // ใช้ detailed evaluation สำหรับ completion requests
    setSelectedItem(item);
    setShowDetailedEvaluation(true);
  };

  const handleSubmitEvaluation = async () => {
    try {
      let response;
      
      response = await teacherApiService.evaluateCompletionRequest(
        selectedItem.id,
        evaluationForm.feedback,
        evaluationForm.rating,
        'under_review'
      );

      if (response?.success) {
        alert('ประเมินสำเร็จ');
        setShowEvaluationModal(false);
        fetchData(); // Refresh data
      } else {
        alert(response?.message || 'เกิดข้อผิดพลาดในการประเมิน');
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      alert('เกิดข้อผิดพลาดในการประเมิน');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  const renderCompletionRequests = () => (
    <div className="space-y-4">
      {completionRequests.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีคำร้องขอสำเร็จการฝึกรอประเมิน</h3>
          <p className="text-gray-500">นักศึกษายังไม่ได้ยื่นคำร้องขอสำเร็จการฝึก</p>
        </div>
      ) : (
        completionRequests.map((request) => (
          <div key={request.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{request.student_name}</h3>
                <p className="text-sm text-gray-500">คำร้องขอสำเร็จการฝึก #{request.id}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                {request.status === 'pending' ? 'รอประเมิน' : request.status}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">ชั่วโมงสอนรวม</p>
                <p className="font-medium">{request.total_teaching_hours} ชั่วโมง</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">แผนการสอน</p>
                <p className="font-medium">{request.total_lesson_plans} แผน</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ยื่นเมื่อ</p>
                <p className="font-medium">{formatDate(request.request_date)}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">การประเมินตนเอง</p>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                {request.self_evaluation}
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => handleEvaluate(request)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ประเมินแบบละเอียด
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (loading) {
    return (
      <LoggedLayout currentPage="ประเมินการฝึกงาน">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout currentPage="ประเมินการฝึกงาน">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">ประเมินการฝึกงาน</h1>
            <p className="mt-2 text-gray-600">ประเมินผลงานของนักศึกษาที่คุณดูแล</p>
          </div>


          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
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
          )}

          {/* Content */}
          <div>
            {renderCompletionRequests()}
          </div>
        </div>

        {/* Detailed Evaluation Modal */}
        {showDetailedEvaluation && selectedItem && (
          <DetailedEvaluation
            completionRequest={selectedItem}
            onClose={() => setShowDetailedEvaluation(false)}
            onSuccess={() => {
              fetchData(); // Refresh data
            }}
          />
        )}

        {/* Evaluation Modal */}
        {showEvaluationModal && selectedItem && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    ประเมินคำร้องขอสำเร็จการฝึก
                  </h3>
                  <button
                    onClick={() => setShowEvaluationModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      คะแนน (1-5)
                    </label>
                    <select
                      value={evaluationForm.rating}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, rating: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>1 - ต้องปรับปรุง</option>
                      <option value={2}>2 - ปรับปรุง</option>
                      <option value={3}>3 - พอใช้</option>
                      <option value={4}>4 - ดี</option>
                      <option value={5}>5 - ดีมาก</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ความเห็น
                    </label>
                    <textarea
                      value={evaluationForm.feedback}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, feedback: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="กรุณาให้ความเห็นและข้อเสนอแนะ..."
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowEvaluationModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSubmitEvaluation}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    ส่งการประเมิน
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </LoggedLayout>
  );
};

export default Evaluations;
