import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { teachingSessionApiService } from '../../services/teachingSessionApi';
import { lessonPlanApiService } from '../../services/lessonPlanApi';

interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
}

interface LessonPlan {
  id: number;
  lesson_plan_name: string;
  subject_id: number;
  subject_name: string;
}

interface TimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  isSelected: boolean;
}

const CreateTeachingSession: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [subjectLessonPlanCounts, setSubjectLessonPlanCounts] = useState<{[key: number]: number}>({});
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedLessonPlan, setSelectedLessonPlan] = useState<number | null>(null);
  const [teachingDate, setTeachingDate] = useState<string>('');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [classLevel, setClassLevel] = useState<string>('');
  const [classRoom, setClassRoom] = useState<string>('');
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [lessonTopic, setLessonTopic] = useState<string>('');
  const [lessonSummary, setLessonSummary] = useState<string>('');
  const [learningOutcomes, setLearningOutcomes] = useState<string>('');
  const [teachingMethodsUsed, setTeachingMethodsUsed] = useState<string>('');
  const [materialsUsed, setMaterialsUsed] = useState<string>('');
  const [studentEngagement, setStudentEngagement] = useState<string>('');
  const [problemsEncountered, setProblemsEncountered] = useState<string>('');
  const [problemSolutions, setProblemSolutions] = useState<string>('');
  const [lessonsLearned, setLessonsLearned] = useState<string>('');
  const [reflection, setReflection] = useState<string>('');
  const [improvementNotes, setImprovementNotes] = useState<string>('');
  const [selfRating, setSelfRating] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Time slots configuration - moved outside component to avoid recreation
  const initialTimeSlots: TimeSlot[] = [
    { id: '08:00-09:00', label: '08:00 - 09:00', startTime: '08:00', endTime: '09:00', isSelected: false },
    { id: '09:00-10:00', label: '09:00 - 10:00', startTime: '09:00', endTime: '10:00', isSelected: false },
    { id: '10:00-11:00', label: '10:00 - 11:00', startTime: '10:00', endTime: '11:00', isSelected: false },
    { id: '11:00-12:00', label: '11:00 - 12:00', startTime: '11:00', endTime: '12:00', isSelected: false },
    { id: '12:00-13:00', label: '12:00 - 13:00', startTime: '12:00', endTime: '13:00', isSelected: false },
    { id: '13:00-14:00', label: '13:00 - 14:00', startTime: '13:00', endTime: '14:00', isSelected: false },
    { id: '14:00-15:00', label: '14:00 - 15:00', startTime: '14:00', endTime: '15:00', isSelected: false },
    { id: '15:00-16:00', label: '15:00 - 16:00', startTime: '15:00', endTime: '16:00', isSelected: false },
    { id: '16:00-17:00', label: '16:00 - 17:00', startTime: '16:00', endTime: '17:00', isSelected: false },
  ];

  useEffect(() => {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    setTeachingDate(today);
    const timeSlotsCopy = [...initialTimeSlots];
    console.log('🕐 Setting initial time slots:', timeSlotsCopy);
    setSelectedTimeSlots(timeSlotsCopy); // Create a copy to avoid reference issues
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchLessonPlans(selectedSubject);
    } else {
      setLessonPlans([]);
      setSelectedLessonPlan(null);
    }
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await lessonPlanApiService.getSubjects({ limit: 100 });
      if (response.success && response.data) {
        setSubjects(response.data);
        
        // ดึงจำนวนแผนการสอนของแต่ละวิชา
        const counts: {[key: number]: number} = {};
        for (const subject of response.data) {
          try {
            const lessonPlanResponse = await teachingSessionApiService.getAvailableLessonPlans(subject.id);
            if (lessonPlanResponse.success && lessonPlanResponse.data) {
              counts[subject.id] = lessonPlanResponse.data.length;
            } else {
              counts[subject.id] = 0;
            }
          } catch (error) {
            console.error(`Error fetching lesson plans for subject ${subject.id}:`, error);
            counts[subject.id] = 0;
          }
        }
        setSubjectLessonPlanCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError('ไม่สามารถโหลดรายการวิชาได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonPlans = async (subjectId: number) => {
    try {
      setLoading(true);
      const response = await teachingSessionApiService.getAvailableLessonPlans(subjectId);
      if (response.success && response.data) {
        setLessonPlans(response.data);
      }
    } catch (error) {
      console.error('Error fetching lesson plans:', error);
      setError('ไม่สามารถโหลดรายการแผนการสอนได้');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSlotClick = (slotId: string) => {
    console.log('🕐 Time slot clicked:', slotId);
    setSelectedTimeSlots(prev => {
      console.log('🕐 Previous slots:', prev);
      const newSlots = prev.map(slot => ({ ...slot })); // Deep copy to avoid mutation
      const slotIndex = newSlots.findIndex(slot => slot.id === slotId);
      
      if (slotIndex === -1) {
        console.log('🕐 Slot not found:', slotId);
        return prev;
      }
      
      const slot = newSlots[slotIndex];
      console.log('🕐 Found slot:', slot);
      
      // If clicking on the first slot or a slot that's already selected, toggle it
      if (slotIndex === 0 || slot.isSelected) {
        slot.isSelected = !slot.isSelected;
        console.log('🕐 Toggled slot:', slot.isSelected);
      } else {
        // Check if previous slot is selected (consecutive selection)
        const prevSlot = newSlots[slotIndex - 1];
        if (prevSlot.isSelected) {
          slot.isSelected = !slot.isSelected;
          console.log('🕐 Previous slot selected, toggled:', slot.isSelected);
        } else {
          // If previous slot is not selected, select from this slot onwards
          slot.isSelected = true;
          console.log('🕐 Previous slot not selected, selected this slot');
        }
      }
      
      // If unselecting a slot, unselect all subsequent slots
      if (!slot.isSelected) {
        for (let i = slotIndex + 1; i < newSlots.length; i++) {
          newSlots[i].isSelected = false;
        }
        console.log('🕐 Unselected subsequent slots');
      }
      
      console.log('🕐 New slots:', newSlots);
      return newSlots;
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getSelectedTimeRange = () => {
    const selectedSlots = selectedTimeSlots.filter(slot => slot.isSelected);
    if (selectedSlots.length === 0) return null;
    
    const firstSlot = selectedSlots[0];
    const lastSlot = selectedSlots[selectedSlots.length - 1];
    
    return {
      startTime: firstSlot.startTime,
      endTime: lastSlot.endTime
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSubject || !selectedLessonPlan || !teachingDate) {
      setError('กรุณากรอกข้อมูลที่จำเป็น');
      return;
    }

    const timeRange = getSelectedTimeRange();
    if (!timeRange) {
      setError('กรุณาเลือกเวลาสอน');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // สร้าง teaching session ก่อน
      const response = await teachingSessionApiService.createTeachingSession({
        lesson_plan_id: selectedLessonPlan,
        subject_id: selectedSubject,
        teaching_date: teachingDate,
        start_time: timeRange.startTime,
        end_time: timeRange.endTime,
        class_level: classLevel || undefined,
        class_room: classRoom || undefined,
        student_count: studentCount || undefined,
        lesson_topic: lessonTopic || undefined,
        lesson_summary: lessonSummary || undefined,
        learning_outcomes: learningOutcomes || undefined,
        teaching_methods_used: teachingMethodsUsed || undefined,
        materials_used: materialsUsed || undefined,
        student_engagement: studentEngagement || undefined,
        problems_encountered: problemsEncountered || undefined,
        problem_solutions: problemSolutions || undefined,
        lessons_learned: lessonsLearned || undefined,
        reflection: reflection || undefined,
        improvement_notes: improvementNotes || undefined,
        self_rating: selfRating || undefined,
      });

      if (response.success && response.data) {
        // อัปโหลดไฟล์หลังจากสร้าง teaching session สำเร็จ
        if (uploadedFiles.length > 0) {
          try {
            const fileUploadResponse = await teachingSessionApiService.uploadFiles(response.data.id, uploadedFiles);
            if (!fileUploadResponse.success) {
              console.warn('Files upload failed:', fileUploadResponse.message);
              // ไม่ต้องหยุดการทำงาน แค่แจ้งเตือน
            }
          } catch (fileError) {
            console.warn('Files upload error:', fileError);
            // ไม่ต้องหยุดการทำงาน แค่แจ้งเตือน
          }
        }
        
        // แสดง popup สำเร็จ
        alert('บันทึกการฝึกสอนสำเร็จ!');
        navigate('/student/teaching-sessions');
      } else {
        setError(response.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (error: any) {
      console.error('Error creating teaching session:', error);
      const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      setError(errorMessage);
      
      // แสดง popup ข้อผิดพลาด
      alert(`ไม่สามารถสร้างบันทึกการฝึกสอนได้: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LoggedLayout currentPage="teaching-sessions">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">บันทึกการฝึกสอนใหม่</h1>
              <p className="mt-1 text-sm text-gray-600">กรอกข้อมูลการฝึกสอนของคุณ</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
                      <div className="mt-2 text-sm text-red-700">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่สอน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={teachingDate}
                    onChange={(e) => setTeachingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วิชาที่สอน <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSubject || ''}
                    onChange={(e) => setSelectedSubject(Number(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loading}
                  >
                    <option value="">{loading ? 'กำลังโหลด...' : 'เลือกวิชา'}</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.subject_code} - {subject.subject_name} ({subjectLessonPlanCounts[subject.id] || 0} แผน)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  แผนการสอนประจำคาบนี้ <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedLessonPlan || ''}
                  onChange={(e) => setSelectedLessonPlan(Number(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!selectedSubject}
                >
                  <option value="">เลือกแผนการสอน</option>
                  {lessonPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.lesson_plan_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Slots Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  เลือกคาบเรียนที่เข้าไปสอน <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {selectedTimeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => handleTimeSlotClick(slot.id)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        slot.isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md transform scale-105'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-medium">{slot.label}</div>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  คลิกเพื่อเลือกคาบเรียน (สามารถเลือกหลายคาบติดต่อกันได้)
                </p>
              </div>

              {/* Class Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ระดับชั้น
                  </label>
                  <input
                    type="text"
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    placeholder="เช่น ม.1, ป.3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ห้องเรียน
                  </label>
                  <input
                    type="text"
                    value={classRoom}
                    onChange={(e) => setClassRoom(e.target.value)}
                    placeholder="เช่น ห้อง 101"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    จำนวนนักเรียน
                  </label>
                  <input
                    type="number"
                    value={studentCount || ''}
                    onChange={(e) => setStudentCount(Number(e.target.value) || null)}
                    placeholder="เช่น 30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Lesson Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หัวข้อบทเรียน
                </label>
                <input
                  type="text"
                  value={lessonTopic}
                  onChange={(e) => setLessonTopic(e.target.value)}
                  placeholder="หัวข้อที่สอนในคาบนี้"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สรุปบทเรียน
                </label>
                <textarea
                  value={lessonSummary}
                  onChange={(e) => setLessonSummary(e.target.value)}
                  rows={3}
                  placeholder="สรุปเนื้อหาที่สอนในคาบนี้"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ผลการเรียนรู้
                </label>
                <textarea
                  value={learningOutcomes}
                  onChange={(e) => setLearningOutcomes(e.target.value)}
                  rows={3}
                  placeholder="สิ่งที่นักเรียนควรจะเรียนรู้ได้หลังจากจบคาบนี้"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วิธีการสอนที่ใช้
                </label>
                <textarea
                  value={teachingMethodsUsed}
                  onChange={(e) => setTeachingMethodsUsed(e.target.value)}
                  rows={3}
                  placeholder="เช่น การบรรยาย, การอภิปราย, การทำกิจกรรม"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สื่อการสอนที่ใช้
                </label>
                <textarea
                  value={materialsUsed}
                  onChange={(e) => setMaterialsUsed(e.target.value)}
                  rows={3}
                  placeholder="เช่น หนังสือ, สไลด์, กระดาน, อุปกรณ์"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Reflection Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  การมีส่วนร่วมของนักเรียน
                </label>
                <textarea
                  value={studentEngagement}
                  onChange={(e) => setStudentEngagement(e.target.value)}
                  rows={3}
                  placeholder="นักเรียนมีส่วนร่วมในการเรียนอย่างไร"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ปัญหาที่เกิดขึ้น
                </label>
                <textarea
                  value={problemsEncountered}
                  onChange={(e) => setProblemsEncountered(e.target.value)}
                  rows={3}
                  placeholder="ปัญหาหรืออุปสรรคที่พบในการสอน"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วิธีแก้ปัญหา
                </label>
                <textarea
                  value={problemSolutions}
                  onChange={(e) => setProblemSolutions(e.target.value)}
                  rows={3}
                  placeholder="วิธีการแก้ไขปัญหาที่เกิดขึ้น"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สิ่งที่ได้เรียนรู้
                </label>
                <textarea
                  value={lessonsLearned}
                  onChange={(e) => setLessonsLearned(e.target.value)}
                  rows={3}
                  placeholder="สิ่งที่คุณได้เรียนรู้จากการสอนครั้งนี้"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  การสะท้อนคิด
                </label>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  rows={3}
                  placeholder="การสะท้อนคิดเกี่ยวกับการสอนครั้งนี้"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ข้อเสนอแนะในการปรับปรุง
                </label>
                <textarea
                  value={improvementNotes}
                  onChange={(e) => setImprovementNotes(e.target.value)}
                  rows={3}
                  placeholder="ข้อเสนอแนะสำหรับการปรับปรุงการสอนในครั้งต่อไป"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  การให้คะแนนตนเอง (1-5)
                </label>
                <select
                  value={selfRating || ''}
                  onChange={(e) => setSelfRating(Number(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">เลือกคะแนน</option>
                  <option value="1">1 - ต้องปรับปรุงมาก</option>
                  <option value="2">2 - ต้องปรับปรุง</option>
                  <option value="3">3 - พอใช้</option>
                  <option value="4">4 - ดี</option>
                  <option value="5">5 - ดีมาก</option>
                </select>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อัปโหลดภาพการสอน
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {uploadedFiles.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">ไฟล์ที่เลือก:</h4>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ลบ
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/student/teaching-sessions')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกการฝึกสอน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </LoggedLayout>
  );
};

export default CreateTeachingSession;
