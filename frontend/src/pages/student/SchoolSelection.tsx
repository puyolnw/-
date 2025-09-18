import React, { useState, useEffect } from 'react';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import AcademicYearSelector from '../../components/academic/AcademicYearSelector';
import { schoolSystemApiService } from '../../services/schoolSystemApi';
import type { AcademicYear, AvailableSchool, InternshipAssignment } from '../../types/school-system';

const SchoolSelection: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [availableSchools, setAvailableSchools] = useState<AvailableSchool[]>([]);
  const [myAssignment, setMyAssignment] = useState<InternshipAssignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (selectedYear) {
      fetchAvailableSchools();
      fetchMyAssignment();
    }
  }, [selectedYear]);

  const fetchAvailableSchools = async () => {
    if (!selectedYear) return;
    
    setLoading(true);
    try {
      const response = await schoolSystemApiService.getAvailableSchools(selectedYear.id);
      if (response.success && response.data) {
        setAvailableSchools(response.data.schools);
      }
    } catch (error) {
      console.error('Error fetching available schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAssignment = async () => {
    if (!selectedYear) return;

    try {
      const response = await schoolSystemApiService.getMyAssignments(selectedYear.id);
      if (response.success && response.data) {
        // เอาแค่ assignment แรกที่ active
        const activeAssignment = response.data.assignments.find(a => a.status === 'active');
        setMyAssignment(activeAssignment || null);
      }
    } catch (error) {
      console.error('Error fetching my assignment:', error);
    }
  };

  const handleApply = async (school: AvailableSchool) => {
    if (!selectedYear) return;

    if (!confirm(`ต้องการสมัครเข้า ${school.school_name} หรือไม่?`)) return;

    setApplyLoading(school.school_id);
    try {
      await schoolSystemApiService.applyToSchool(school.school_id, selectedYear.id);
      alert('สมัครเรียบร้อยแล้ว!');
      await fetchAvailableSchools();
      await fetchMyAssignment();
    } catch (error: any) {
      console.error('Error applying to school:', error);
      alert(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
    } finally {
      setApplyLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!selectedYear || !myAssignment) return;

    if (!confirm('ต้องการยกเลิกการสมัครหรือไม่?')) return;

    try {
      await schoolSystemApiService.cancelApplication(selectedYear.id);
      alert('ยกเลิกการสมัครเรียบร้อยแล้ว');
      await fetchAvailableSchools();
      await fetchMyAssignment();
    } catch (error: any) {
      console.error('Error cancelling application:', error);
      alert(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
    }
  };

  // Filter schools based on search
  const filteredSchools = availableSchools.filter(school =>
    school.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.school_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <LoggedLayout currentPage="เลือกโรงเรียน">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">เลือกโรงเรียนฝึกประสบการณ์</h1>
            <p className="text-gray-600 mt-1">เลือกโรงเรียนที่ต้องการไปฝึกประสบการณ์วิชาชีพ</p>
          </div>
        </div>

        {/* My Current Assignment */}
        {myAssignment && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-blue-900">การสมัครของคุณ</h3>
                <div className="mt-2 text-blue-800">
                  <p className="font-medium">{myAssignment.school_name}</p>
                  <p className="text-sm">สถานะ: {myAssignment.status === 'active' ? 'กำลังฝึก' : myAssignment.status}</p>
                  <p className="text-sm">วันที่สมัคร: {new Date(myAssignment.enrollment_date).toLocaleDateString('th-TH')}</p>
                  {myAssignment.teacher_name && (
                    <p className="text-sm">ครูพี่เลี้ยง: {myAssignment.teacher_name}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                ยกเลิกการสมัคร
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <AcademicYearSelector
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              showAll={false}
            />
            
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค้นหาโรงเรียน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อโรงเรียนหรือรหัส..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Available Schools */}
        {selectedYear ? (
          <div>
            {myAssignment ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">คุณได้สมัครโรงเรียนแล้ว</h3>
                <p className="mt-1 text-gray-500">คุณสามารถสมัครได้เพียงโรงเรียนเดียวต่อปีการศึกษา</p>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-64"></div>
                  </div>
                ))}
              </div>
            ) : filteredSchools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSchools.map((school) => (
                  <div key={school.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                    <div className="p-6">
                      {/* School Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {school.school_name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            รหัส: {school.school_id}
                          </p>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {school.address}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          school.enrollment_status === 'เปิดรับสมัคร' 
                            ? 'bg-green-100 text-green-800'
                            : school.enrollment_status === 'เต็มแล้ว'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {school.enrollment_status}
                        </span>
                      </div>

                      {/* School Info */}
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">ที่ว่าง:</span>
                          <span className="font-medium text-green-600">{school.available_slots} ที่</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">รับทั้งหมด:</span>
                          <span className="font-medium">{school.max_students} คน</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">ครูพี่เลี้ยง:</span>
                          <span className="font-medium">{school.current_teachers} คน</span>
                        </div>
                        {school.teachers && (
                          <div>
                            <span className="text-sm text-gray-600">ครูพี่เลี้ยง:</span>
                            <p className="text-sm text-gray-900 mt-1">{school.teachers}</p>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>ความจุ</span>
                          <span>{school.current_students}/{school.max_students}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              school.current_students >= school.max_students 
                                ? 'bg-red-500' 
                                : 'bg-green-500'
                            }`}
                            style={{ 
                              width: `${Math.min((school.current_students / school.max_students) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Apply Button */}
                      <button
                        onClick={() => handleApply(school)}
                        disabled={!school.can_apply || applyLoading === school.school_id}
                        className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          school.can_apply
                            ? 'bg-primary-600 hover:bg-primary-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {applyLoading === school.school_id ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            กำลังสมัคร...
                          </>
                        ) : school.can_apply ? (
                          <>
                            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            สมัครเข้าโรงเรียน
                          </>
                        ) : (
                          school.enrollment_status
                        )}
                      </button>

                      {/* Additional Info */}
                      {school.phone && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-sm text-gray-600">
                            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {school.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h5a2 2 0 002-2V9a2 2 0 00-2-2H9a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบโรงเรียน</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'ไม่พบโรงเรียนที่ตรงกับการค้นหา' : 'ไม่มีโรงเรียนเปิดรับสมัครในปีการศึกษานี้'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">เลือกปีการศึกษา</h3>
            <p className="mt-1 text-sm text-gray-500">กรุณาเลือกปีการศึกษาเพื่อดูโรงเรียนที่เปิดรับสมัคร</p>
          </div>
        )}

        {/* Academic Year Selector */}
        {!myAssignment && selectedYear && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <AcademicYearSelector
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
                showAll={false}
              />
              
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ค้นหาโรงเรียน
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="ค้นหาด้วยชื่อโรงเรียนหรือรหัส..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </LoggedLayout>
  );
};

export default SchoolSelection;

