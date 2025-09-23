import React, { useState, useEffect } from 'react';
import LoggedLayout from '../../../components/layouts/LoggedLayout';
import AcademicYearSelector from '../../../components/academic/AcademicYearSelector';
import EnrollmentTable from '../../../components/school/EnrollmentTable';
import { schoolSystemApiService } from '../../../services/schoolSystemApi';
import type { AcademicYear, InternshipAssignment, SchoolStats } from '../../../types/school-system';

const SchoolEnrollment: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [assignments, setAssignments] = useState<InternshipAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [filters, setFilters] = useState({
    schoolId: '',
    status: 'all'
  });

  useEffect(() => {
    if (selectedYear) {
      fetchAssignments();
      fetchStats();
    }
  }, [selectedYear, filters]);

  const fetchAssignments = async () => {
    if (!selectedYear) return;
    
    setLoading(true);
    try {
      const params: any = {
        academicYearId: selectedYear.id,
        page: 1,
        limit: 100 // ดึงทั้งหมดเพื่อแสดงใน table
      };

      if (filters.schoolId) params.schoolId = filters.schoolId;
      if (filters.status !== 'all') params.status = filters.status;

      const response = await schoolSystemApiService.getAllAssignments(params);
      if (response.success && response.data) {
        setAssignments(response.data.assignments);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!selectedYear) return;

    try {
      const response = await schoolSystemApiService.getAssignmentStats({
        academicYearId: selectedYear.id
      });
      if (response.success && response.data) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <LoggedLayout currentPage="การสมัครโรงเรียน">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">การสมัครโรงเรียน</h1>
            <p className="text-gray-600 mt-1">จัดการและติดตามการสมัครของนักศึกษา</p>
          </div>
        </div>

        {/* Statistics Cards */}
        {selectedYear && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">ทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_assignments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">กำลังฝึก</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active_count}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">เสร็จสิ้น</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed_count}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">ยกเลิก</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.cancelled_count}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <AcademicYearSelector
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              showAll={false}
            />
            
            {/* School Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                โรงเรียน
              </label>
              <input
                type="text"
                name="schoolId"
                value={filters.schoolId}
                onChange={handleFilterChange}
                placeholder="รหัสโรงเรียน (เช่น SCH001)"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สถานะ
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="active">กำลังฝึก</option>
                <option value="completed">เสร็จสิ้น</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div>
              <button
                onClick={() => setFilters({ schoolId: '', status: 'all' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                ล้างตัวกรอง
              </button>
            </div>
          </div>
        </div>

        {/* Enrollment Table */}
        {selectedYear ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                รายการการสมัคร ({assignments.length} รายการ)
              </h2>
            </div>
            
            <EnrollmentTable
              assignments={assignments}
              loading={loading}
              onView={(assignment) => {
                // TODO: Show assignment details modal
                console.log('View assignment:', assignment);
              }}
              showActions={true}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">เลือกปีการศึกษา</h3>
            <p className="mt-1 text-sm text-gray-500">กรุณาเลือกปีการศึกษาเพื่อดูข้อมูลการสมัคร</p>
          </div>
        )}
      </div>
    </LoggedLayout>
  );
};

export default SchoolEnrollment;

