import React, { useState, useEffect } from 'react';
import { schoolSystemApiService } from '../../services/schoolSystemApi';
import type { AcademicYear } from '../../types/school-system';

interface AcademicYearSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (yearData: { academicYearId: number; start_date: string; end_date: string }) => void;
  schoolId: string;
  currentYear?: AcademicYear;
  loading?: boolean;
}

const AcademicYearSettings: React.FC<AcademicYearSettingsProps> = ({
  isOpen,
  onClose,
  onSave,
  schoolId: _schoolId,
  currentYear,
  loading = false
}) => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [formData, setFormData] = useState({
    academicYearId: currentYear?.id || 0,
    start_date: '',
    end_date: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchAcademicYears();
      if (currentYear) {
        setFormData({
          academicYearId: currentYear.id,
          start_date: currentYear.start_date,
          end_date: currentYear.end_date
        });
      }
    }
  }, [isOpen, currentYear]);

  const fetchAcademicYears = async () => {
    try {
      const response = await schoolSystemApiService.getAllAcademicYears();
      if (response.success && response.data) {
        setAcademicYears(response.data.academicYears);
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'academicYearId' ? parseInt(value) : value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Auto-fill dates when academic year changes
    if (name === 'academicYearId') {
      const selectedYear = academicYears.find(y => y.id === parseInt(value));
      if (selectedYear) {
        setFormData(prev => ({
          ...prev,
          start_date: selectedYear.start_date,
          end_date: selectedYear.end_date
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.academicYearId) {
      newErrors.academicYearId = 'กรุณาเลือกปีการศึกษา';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'กรุณาระบุวันที่เริ่ม';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'กรุณาระบุวันที่สิ้นสุด';
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
    setFormData({
      academicYearId: currentYear?.id || 0,
      start_date: currentYear?.start_date || '',
      end_date: currentYear?.end_date || ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const selectedAcademicYear = academicYears.find(y => y.id === formData.academicYearId);

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
              ตั้งค่าปีการศึกษา
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
            {/* Academic Year Selection */}
            <div>
              <label htmlFor="academicYearId" className="block text-sm font-medium text-gray-700 mb-1">
                ปีการศึกษา <span className="text-red-500">*</span>
              </label>
              <select
                id="academicYearId"
                name="academicYearId"
                value={formData.academicYearId}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  errors.academicYearId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">-- เลือกปีการศึกษา --</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.year}/{year.semester} {year.is_active && '(ปัจจุบัน)'}
                  </option>
                ))}
              </select>
              {errors.academicYearId && <p className="text-red-500 text-sm mt-1">{errors.academicYearId}</p>}
            </div>

            {/* Academic Year Info */}
            {selectedAcademicYear && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">ข้อมูลปีการศึกษา</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>ภาคเรียนที่: {selectedAcademicYear.semester}</p>
                  <p>ลงทะเบียน: {new Date(selectedAcademicYear.registration_start).toLocaleDateString('th-TH')} - {new Date(selectedAcademicYear.registration_end).toLocaleDateString('th-TH')}</p>
                  <p>เรียน: {new Date(selectedAcademicYear.start_date).toLocaleDateString('th-TH')} - {new Date(selectedAcademicYear.end_date).toLocaleDateString('th-TH')}</p>
                </div>
              </div>
            )}

            {/* Custom Dates for School */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่เปิดเทอม <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.start_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
              </div>
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่ปิดเทอม <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.end_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
              </div>
            </div>

            {/* Info Note */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex">
                <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    วันที่ฝึกงานสามารถปรับแต่งได้แยกต่างหากจากปีการศึกษาหลัก
                  </p>
                </div>
              </div>
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

export default AcademicYearSettings;

