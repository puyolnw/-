import React, { useState, useEffect } from 'react';
import { schoolSystemApiService } from '../../services/schoolSystemApi';

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (teacherData: { teacher_id: number; is_primary: boolean; max_students: number }) => void;
  schoolId: string;
  academicYearId: number;
}

interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role?: string;
}

const AddTeacherModal: React.FC<AddTeacherModalProps> = ({
  isOpen,
  onClose,
  onSave,
  schoolId,
  academicYearId
}) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableTeachers();
    }
  }, [isOpen, schoolId, academicYearId]);

  useEffect(() => {
    // Filter teachers based on search term
    const filtered = teachers.filter(teacher => 
      (teacher.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTeachers(filtered);
    setShowDropdown(searchTerm.length > 0 && filtered.length > 0);
  }, [teachers, searchTerm]);

  const fetchAvailableTeachers = async () => {
    try {
      const response = await schoolSystemApiService.getAvailableTeachers(schoolId, academicYearId);
      if (response.success && response.data) {
        setTeachers(response.data.teachers);
      }
    } catch (error) {
      console.error('Error fetching available teachers:', error);
      // Fallback to mock data if API fails
      setTeachers([
        { id: 1, first_name: 'อาจารย์สมชาย', last_name: 'ใจดี', email: 'teacher1@example.com', phone: '081-234-5678', role: 'teacher' },
        { id: 2, first_name: 'อาจารย์สมหญิง', last_name: 'รักสอน', email: 'teacher2@example.com', phone: '081-234-5679', role: 'teacher' },
        { id: 3, first_name: 'อาจารย์วิชัย', last_name: 'ขยันสอน', email: 'teacher3@example.com', phone: '081-234-5680', role: 'teacher' },
        { id: 4, first_name: 'อาจารย์มาลี', last_name: 'ตั้งใจสอน', email: 'teacher4@example.com', phone: '081-234-5681', role: 'teacher' },
        { id: 5, first_name: 'อาจารย์ประยุทธ', last_name: 'ดีใจสอน', email: 'teacher5@example.com', phone: '081-234-5682', role: 'teacher' },
        { id: 6, first_name: 'อาจารย์วรรณา', last_name: 'รักการสอน', email: 'teacher6@example.com', phone: '081-234-5683', role: 'teacher' }
      ]);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear selection if search term changes
    if (selectedTeacher && !value.includes(selectedTeacher.first_name)) {
      setSelectedTeacher(null);
    }
    
    // Clear error when user starts typing
    if (errors.teacher_id) {
      setErrors(prev => ({ ...prev, teacher_id: '' }));
    }
  };

  const handleTeacherSelect = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setSearchTerm(`${teacher.first_name} ${teacher.last_name}`);
    setShowDropdown(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedTeacher) {
      newErrors.teacher_id = 'กรุณาเลือกครูพี่เลี้ยง';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm() && selectedTeacher && !loading) {
      setLoading(true);
      try {
        await onSave({
          teacher_id: selectedTeacher.id,
          is_primary: false,
          max_students: 5
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedTeacher(null);
    setShowDropdown(false);
    setErrors({});
    onClose();
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
              เพิ่มครูพี่เลี้ยง
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
            {/* Teacher Selection */}
            <div className="relative">
              <label htmlFor="teacher_search" className="block text-sm font-medium text-gray-700 mb-1">
                ครูพี่เลี้ยง <span className="text-red-500">*</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({teachers.length} คนที่สามารถลงทะเบียนได้)
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="teacher_search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="กรอกชื่อครู"
                  className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.teacher_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                  autoComplete="off"
                  onMouseEnter={() => setShowDropdown(true)}
                  onFocus={() => setShowDropdown(true)}
                />
                
                {/* Hover Tooltip */}
                {teachers.length > 0 && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="group relative">
                      <svg className="w-5 h-5 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute right-0 bottom-full mb-2 w-96 bg-gray-900 text-white text-xs rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 shadow-xl">
                        <div className="font-medium mb-3 text-sm">ครูพี่เลี้ยงที่สามารถลงทะเบียนได้:</div>
                        <div className="max-h-48 overflow-y-auto space-y-2">
                          {teachers.slice(0, 8).map((teacher) => (
                            <div key={teacher.id} className="text-xs bg-gray-800 rounded p-2">
                              <div className="font-medium text-white">
                                {teacher.first_name} {teacher.last_name}
                              </div>
                              <div className="text-gray-300 text-xs">
                                {teacher.email}
                              </div>
                              {teacher.phone && (
                                <div className="text-gray-400 text-xs">
                                  {teacher.phone}
                                </div>
                              )}
                            </div>
                          ))}
                          {teachers.length > 8 && (
                            <div className="text-xs text-gray-300 bg-gray-800 rounded p-2 text-center">
                              และอีก {teachers.length - 8} คน...
                            </div>
                          )}
                        </div>
                        <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-64 overflow-auto">
                  {filteredTeachers.length > 0 ? (
                    filteredTeachers.map((teacher) => (
                      <div
                        key={teacher.id}
                        onClick={() => handleTeacherSelect(teacher)}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">
                              {teacher.first_name} {teacher.last_name}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {teacher.email}
                            </div>
                            {teacher.phone && (
                              <div className="text-xs text-gray-500 mt-1">
                                📞 {teacher.phone}
                              </div>
                            )}
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
                      ไม่พบครูพี่เลี้ยงที่ตรงกับการค้นหา
                    </div>
                  )}
                </div>
              )}
              
              {errors.teacher_id && <p className="text-red-500 text-sm mt-1">{errors.teacher_id}</p>}
              {filteredTeachers.length === 0 && searchTerm && !showDropdown && (
                <p className="text-gray-500 text-sm mt-1">ไม่พบครูพี่เลี้ยงที่ตรงกับการค้นหา</p>
              )}
            </div>


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
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'กำลังบันทึก...' : 'เพิ่มครูพี่เลี้ยง'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTeacherModal;
