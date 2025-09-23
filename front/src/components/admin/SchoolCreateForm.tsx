import React, { useState } from 'react';

interface SchoolCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schoolData: SchoolCreateData) => void;
  loading?: boolean;
}

interface SchoolCreateData {
  school_name: string;
  address: string;
  phone?: string;
}

const SchoolCreateForm: React.FC<SchoolCreateFormProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  loading = false 
}) => {
  const [formData, setFormData] = useState<SchoolCreateData>({
    school_name: '',
    address: '',
    phone: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    // ตรวจสอบชื่อโรงเรียน (2-200 ตัวอักษร)
    if (!formData.school_name.trim()) {
      newErrors.school_name = 'กรุณากรอกชื่อโรงเรียน';
    } else if (formData.school_name.trim().length < 2) {
      newErrors.school_name = 'ชื่อโรงเรียนต้องมีอย่างน้อย 2 ตัวอักษร';
    } else if (formData.school_name.trim().length > 200) {
      newErrors.school_name = 'ชื่อโรงเรียนต้องไม่เกิน 200 ตัวอักษร';
    }

    // ตรวจสอบที่อยู่ (10-500 ตัวอักษร)
    if (!formData.address.trim()) {
      newErrors.address = 'กรุณากรอกที่อยู่';
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'ที่อยู่ต้องมีอย่างน้อย 10 ตัวอักษร';
    } else if (formData.address.trim().length > 500) {
      newErrors.address = 'ที่อยู่ต้องไม่เกิน 500 ตัวอักษร';
    }

    // ตรวจสอบเบอร์โทร (10-15 ตัวอักษร, optional)
    if (formData.phone && formData.phone.trim()) {
      if (formData.phone.trim().length < 10) {
        newErrors.phone = 'เบอร์โทรต้องมีอย่างน้อย 10 ตัวอักษร';
      } else if (formData.phone.trim().length > 15) {
        newErrors.phone = 'เบอร์โทรต้องไม่เกิน 15 ตัวอักษร';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🏗️ SchoolCreateForm - Form submitted');
    console.log('📝 Form data:', formData);
    
    if (validateForm()) {
      console.log('✅ Form validation passed');
      onSave(formData);
    } else {
      console.log('❌ Form validation failed:', errors);
    }
  };

  const handleClose = () => {
    setFormData({
      school_name: '',
      address: '',
      phone: ''
    });
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
              เพิ่มโรงเรียนใหม่
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">ข้อมูลพื้นฐาน</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="school_name" className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อโรงเรียน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="school_name"
                    name="school_name"
                    value={formData.school_name}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.school_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="กรอกชื่อโรงเรียน (2-200 ตัวอักษร)"
                  />
                  {errors.school_name && <p className="text-red-500 text-sm mt-1">{errors.school_name}</p>}
                  <p className="text-gray-500 text-xs mt-1">ชื่อโรงเรียนต้องมี 2-200 ตัวอักษร</p>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    ที่อยู่ <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.address ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="กรอกที่อยู่ (อย่างน้อย 10 ตัวอักษร)"
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                  <p className="text-gray-500 text-xs mt-1">ที่อยู่ต้องมี 10-500 ตัวอักษร</p>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="กรอกเบอร์โทรศัพท์ (10-15 ตัวอักษร)"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  <p className="text-gray-500 text-xs mt-1">เบอร์โทรต้องมี 10-15 ตัวอักษร (ไม่บังคับ)</p>
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">หมายเหตุ</h4>
                  <div className="mt-1 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>รหัสโรงเรียนจะถูกสร้างขึ้นโดยอัตโนมัติ</li>
                      <li>ข้อมูลสามารถแก้ไขได้หลังจากสร้างแล้ว</li>
                      <li>โรงเรียนจะถูกเปิดใช้งานทันทีหลังจากสร้าง</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังสร้าง...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    เพิ่มโรงเรียน
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SchoolCreateForm;
