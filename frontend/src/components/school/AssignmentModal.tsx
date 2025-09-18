import React, { useState, useEffect } from 'react';
import { schoolSystemApiService } from '../../services/schoolSystemApi';
import type { User } from '../../types/user';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AssignmentData) => void;
  schoolId: string;
  academicYearId: number;
  type: 'student' | 'teacher';
  loading?: boolean;
}

interface AssignmentData {
  student_id?: number;
  teacher_id?: number;
  is_primary?: boolean;
  max_students?: number;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  schoolId,
  academicYearId,
  type,
  loading = false
}) => {
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<AssignmentData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers();
      resetForm();
    }
  }, [isOpen, type]);

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      if (type === 'teacher') {
        const response = await schoolSystemApiService.getAvailableTeachers(schoolId, academicYearId);
        if (response.success && response.data) {
          setAvailableUsers(response.data.teachers);
        }
      } else {
        // TODO: Implement get available students API
        // For now, we'll need to get all students and filter
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const resetForm = () => {
    setFormData(type === 'teacher' ? { is_primary: false, max_students: 5 } : {});
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type: inputType } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : inputType === 'number' ? parseInt(value) || 0 : value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (type === 'student') {
      if (!formData.student_id) {
        newErrors.student_id = 'กรุณาเลือกนักศึกษา';
      }
    } else {
      if (!formData.teacher_id) {
        newErrors.teacher_id = 'กรุณาเลือกครูพี่เลี้ยง';
      }
      if (formData.max_students && (formData.max_students < 1 || formData.max_students > 20)) {
        newErrors.max_students = 'จำนวนนักศึกษาต้องอยู่ระหว่าง 1-20 คน';
      }
    }

    if (formData.start_date && formData.end_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
      newErrors.end_date = 'วันที่สิ้นสุดต้องหลังจากวันที่เริ่ม';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleClose = () => {
    resetForm();
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

        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {type === 'student' ? 'เพิ่มนักศึกษา' : 'เพิ่มครูพี่เลี้ยง'}
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
            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type === 'student' ? 'เลือกนักศึกษา' : 'เลือกครูพี่เลี้ยง'} <span className="text-red-500">*</span>
              </label>
              {loadingUsers ? (
                <div className="animate-pulse h-10 bg-gray-200 rounded-lg"></div>
              ) : (
                <select
                  name={type === 'student' ? 'student_id' : 'teacher_id'}
                  value={formData.student_id || formData.teacher_id || ''}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.student_id || errors.teacher_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">-- เลือก{type === 'student' ? 'นักศึกษา' : 'ครูพี่เลี้ยง'} --</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.user_id})
                    </option>
                  ))}
                </select>
              )}
              {(errors.student_id || errors.teacher_id) && (
                <p className="text-red-500 text-sm mt-1">{errors.student_id || errors.teacher_id}</p>
              )}
            </div>

            {/* Teacher-specific fields */}
            {type === 'teacher' && (
              <>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_primary"
                    name="is_primary"
                    checked={formData.is_primary || false}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_primary" className="ml-2 block text-sm text-gray-900">
                    ตั้งเป็นครูหลัก
                  </label>
                </div>

                <div>
                  <label htmlFor="max_students" className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวนนักศึกษาสูงสุดที่ดูแลได้
                  </label>
                  <input
                    type="number"
                    id="max_students"
                    name="max_students"
                    min="1"
                    max="20"
                    value={formData.max_students || 5}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.max_students ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.max_students && <p className="text-red-500 text-sm mt-1">{errors.max_students}</p>}
                </div>
              </>
            )}

            {/* Date fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่เริ่ม
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date || ''}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่สิ้นสุด
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date || ''}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.end_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                หมายเหตุ
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes || ''}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="หมายเหตุเพิ่มเติม..."
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading || loadingUsers}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังเพิ่ม...
                  </>
                ) : (
                  `เพิ่ม${type === 'student' ? 'นักศึกษา' : 'ครูพี่เลี้ยง'}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignmentModal;

