import React, { useState, useEffect } from 'react';
import type { SchoolOverview } from '../../types/school-system';

interface QuotaSettingsProps {
  school: SchoolOverview;
  onSave: (quotaData: { max_students: number; max_teachers: number; is_open: boolean }) => void;
  onClose: () => void;
  loading?: boolean;
}

const QuotaSettings: React.FC<QuotaSettingsProps> = ({
  school,
  onSave,
  onClose,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    max_students: school.max_students,
    max_teachers: school.max_teachers,
    is_open: school.is_open
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      max_students: school.max_students,
      max_teachers: school.max_teachers,
      is_open: school.is_open
    });
  }, [school]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseInt(value) || 0
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

    if (formData.max_students < school.current_students) {
      newErrors.max_students = `จำนวนสูงสุดต้องไม่น้อยกว่านักศึกษาปัจจุบัน (${school.current_students} คน)`;
    }

    if (formData.max_students < 1) {
      newErrors.max_students = 'จำนวนนักศึกษาต้องมากกว่า 0';
    }

    if (formData.max_students > 50) {
      newErrors.max_students = 'จำนวนนักศึกษาต้องไม่เกิน 50 คน';
    }

    if (formData.max_teachers < school.current_teachers) {
      newErrors.max_teachers = `จำนวนสูงสุดต้องไม่น้อยกว่าครูปัจจุบัน (${school.current_teachers} คน)`;
    }

    if (formData.max_teachers < 1) {
      newErrors.max_teachers = 'จำนวนครูต้องมากกว่า 0';
    }

    if (formData.max_teachers > 20) {
      newErrors.max_teachers = 'จำนวนครูต้องไม่เกิน 20 คน';
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              ตั้งค่าโควตา - {school.school_name}
            </h3>
            <button
              onClick={onClose}
              className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Current Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">สถานะปัจจุบัน</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">นักศึกษา:</span>
                <span className="ml-1 font-medium">{school.current_students}/{school.max_students}</span>
              </div>
              <div>
                <span className="text-gray-600">ครูพี่เลี้ยง:</span>
                <span className="ml-1 font-medium">{school.current_teachers}/{school.max_teachers}</span>
              </div>
              <div>
                <span className="text-gray-600">สถานะ:</span>
                <span className={`ml-1 font-medium ${school.is_open ? 'text-green-600' : 'text-red-600'}`}>
                  {school.is_open ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">ที่ว่าง:</span>
                <span className="ml-1 font-medium">{school.available_slots} ที่</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Max Students */}
            <div>
              <label htmlFor="max_students" className="block text-sm font-medium text-gray-700 mb-1">
                จำนวนนักศึกษาสูงสุด <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="max_students"
                name="max_students"
                min="1"
                max="50"
                value={formData.max_students}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  errors.max_students ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.max_students && <p className="text-red-500 text-sm mt-1">{errors.max_students}</p>}
              <p className="text-gray-500 text-xs mt-1">ปัจจุบันมี {school.current_students} คน</p>
            </div>

            {/* Max Teachers */}
            <div>
              <label htmlFor="max_teachers" className="block text-sm font-medium text-gray-700 mb-1">
                จำนวนครูพี่เลี้ยงสูงสุด <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="max_teachers"
                name="max_teachers"
                min="1"
                max="20"
                value={formData.max_teachers}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  errors.max_teachers ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.max_teachers && <p className="text-red-500 text-sm mt-1">{errors.max_teachers}</p>}
              <p className="text-gray-500 text-xs mt-1">ปัจจุบันมี {school.current_teachers} คน</p>
            </div>

            {/* Is Open */}
            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_open"
                  name="is_open"
                  checked={formData.is_open}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_open" className="ml-2 block text-sm text-gray-900">
                  เปิดรับสมัครนักศึกษา
                </label>
              </div>
              <p className="text-gray-500 text-xs mt-1">
                {formData.is_open ? 'นักศึกษาสามารถสมัครเข้าโรงเรียนนี้ได้' : 'ปิดรับสมัครชั่วคราว'}
              </p>
            </div>

            {/* Warning */}
            {(formData.max_students !== school.max_students || formData.max_teachers !== school.max_teachers) && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex">
                  <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      การเปลี่ยนแปลงโควตาจะส่งผลต่อการรับสมัครในอนาคต
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังบันทึก...
                  </>
                ) : (
                  'บันทึกการตั้งค่า'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuotaSettings;

