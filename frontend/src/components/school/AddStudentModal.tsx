import React, { useState, useEffect } from 'react';
import { schoolSystemApiService } from '../../services/schoolSystemApi';
import type { SchoolTeacher } from '../../types/school-system';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentData: { student_id: number; student_code: string; teacher_id?: number }) => void;
  schoolId: string;
  academicYearId: number;
  availableTeachers: SchoolTeacher[];
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  student_code: string;
  faculty: string;
  major: string;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  schoolId: _schoolId,
  academicYearId: _academicYearId,
  availableTeachers
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<SchoolTeacher | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // เพิ่ม flag สำหรับป้องกัน double submit

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen]);

  // เลือกครูพี่เลี้ยงแบบอัตโนมัติ (ครูที่มีภาระงานน้อยที่สุด)
  useEffect(() => {
    if (availableTeachers && availableTeachers.length > 0) {
      // หาครูที่มีภาระงานน้อยที่สุด (current_students น้อยที่สุด)
      const teacherWithLeastLoad = availableTeachers.reduce((min, teacher) => 
        teacher.current_students < min.current_students ? teacher : min
      );
      setSelectedTeacher(teacherWithLeastLoad);
    }
  }, [availableTeachers]);

  useEffect(() => {
    // Filter students based on search term
    const filtered = students.filter(student => 
      (student.student_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.last_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
    setShowDropdown(searchTerm.length > 0 && filtered.length > 0);
  }, [students, searchTerm]);

  const fetchStudents = async () => {
    try {
      const response = await schoolSystemApiService.getAvailableStudents(_academicYearId);
      if (response.success && response.data) {
        setStudents(response.data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      // Fallback to mock data if API fails
      setStudents([
        { id: 1, first_name: 'สมชาย', last_name: 'ใจดี', student_code: 'ST001', faculty: 'คณะวิศวกรรมศาสตร์', major: 'วิศวกรรมคอมพิวเตอร์' },
        { id: 2, first_name: 'สมหญิง', last_name: 'รักเรียน', student_code: 'ST002', faculty: 'คณะวิทยาศาสตร์', major: 'วิทยาการคอมพิวเตอร์' },
        { id: 3, first_name: 'วิชัย', last_name: 'ขยันเรียน', student_code: 'ST003', faculty: 'คณะวิศวกรรมศาสตร์', major: 'วิศวกรรมไฟฟ้า' },
        { id: 4, first_name: 'มาลี', last_name: 'ตั้งใจ', student_code: 'ST004', faculty: 'คณะวิทยาศาสตร์', major: 'คณิตศาสตร์' }
      ]);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear selection if search term changes
    if (selectedStudent && !value.includes(selectedStudent.student_code)) {
      setSelectedStudent(null);
    }
    
    // Clear error when user starts typing
    if (errors.student_code) {
      setErrors(prev => ({ ...prev, student_code: '' }));
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setSearchTerm(`${student.student_code} - ${student.first_name} ${student.last_name}`);
    setShowDropdown(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedStudent) {
      newErrors.student_code = 'กรุณาเลือกนักศึกษา';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔵 AddStudentModal - handleSubmit called', {
      validateForm: validateForm(),
      selectedStudent,
      selectedTeacher,
      loading,
      isSubmitting
    });
    
    // Prevent multiple submissions
    if (loading || isSubmitting) {
      console.log('🔴 AddStudentModal - Already submitting, preventing duplicate submission');
      return;
    }
    
    if (validateForm() && selectedStudent) {
      setLoading(true);
      setIsSubmitting(true);
      
      const studentData = {
        student_id: selectedStudent.id,
        student_code: selectedStudent.student_code,
        teacher_id: selectedTeacher?.teacher_id
      };
      
      console.log('🔵 AddStudentModal - Calling onSave with data:', studentData);
      
      try {
        await onSave(studentData);
        console.log('🟢 AddStudentModal - onSave completed successfully');
        alert('เพิ่มนักศึกษาเรียบร้อยแล้ว');
        handleClose(); // Close modal after successful save
      } catch (error: any) {
        console.error('🔴 AddStudentModal - onSave failed:', error);
        alert(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    // Reset เฉพาะเมื่อไม่ได้กำลัง submit
    if (!isSubmitting) {
      setSearchTerm('');
      setSelectedStudent(null);
      setSelectedTeacher(null);
      setShowDropdown(false);
      setErrors({});
      setLoading(false);
      setIsSubmitting(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        ></div>

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              เพิ่มนักศึกษา
            </h3>
            <button
              onClick={handleClose}
              className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student Selection */}
            <div className="relative">
              <label htmlFor="student_search" className="block text-sm font-medium text-gray-700 mb-1">
                นักศึกษา <span className="text-red-500">*</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({students.length} คนที่สามารถลงทะเบียนได้)
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="student_search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="กรอกรหัสนิสิต หรือชื่อนิสิต"
                  className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.student_code ? 'border-red-300' : 'border-gray-300'
                  }`}
                  autoComplete="off"
                  onMouseEnter={() => setShowDropdown(true)}
                  onFocus={() => setShowDropdown(true)}
                />
                
                {/* Hover Tooltip */}
                {students.length > 0 && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="group relative">
                      <svg className="w-5 h-5 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute right-0 bottom-full mb-2 w-80 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                        <div className="font-medium mb-2">นักศึกษาที่สามารถลงทะเบียนได้:</div>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {students.slice(0, 10).map((student) => (
                            <div key={student.id} className="text-xs">
                              {student.student_code} - {student.first_name} {student.last_name}
                            </div>
                          ))}
                          {students.length > 10 && (
                            <div className="text-xs text-gray-300">
                              และอีก {students.length - 10} คน...
                            </div>
                          )}
                        </div>
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-64 overflow-auto">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => handleStudentSelect(student)}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">
                              {student.student_code} - {student.first_name} {student.last_name}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {student.faculty}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              สาขา: {student.major}
                            </div>
                          </div>
                          <div className="ml-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-gray-500 text-sm">
                      ไม่พบนักศึกษาที่ตรงกับการค้นหา
                    </div>
                  )}
                </div>
              )}
              
              {errors.student_code && <p className="text-red-500 text-sm mt-1">{errors.student_code}</p>}
              {filteredStudents.length === 0 && searchTerm && !showDropdown && (
                <p className="text-gray-500 text-sm mt-1">ไม่พบนักศึกษาที่ตรงกับการค้นหา</p>
              )}
            </div>

            {/* Teacher Assignment Info */}
            {selectedTeacher && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="text-sm font-medium text-blue-800">ครูพี่เลี้ยงที่เลือกอัตโนมัติ</h4>
                </div>
                <div className="text-sm text-blue-700">
                  <p><span className="font-medium">ชื่อ:</span> {selectedTeacher.teacher_name}</p>
                  <p><span className="font-medium">ภาระงานปัจจุบัน:</span> {selectedTeacher.current_students}/{selectedTeacher.max_students} คน</p>
                  {selectedTeacher.is_primary && (
                    <p className="text-blue-600 font-medium">⭐ ครูหลัก</p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading || isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading || isSubmitting ? 'กำลังบันทึก...' : 'เพิ่มนักศึกษา'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddStudentModal;
