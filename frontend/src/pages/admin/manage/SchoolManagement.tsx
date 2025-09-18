import React, { useState, useEffect } from 'react';
import LoggedLayout from '../../../components/layouts/LoggedLayout';
import SchoolTable from '../../../components/admin/SchoolTable';
import SchoolModal from '../../../components/admin/SchoolModal';
import SchoolEditForm from '../../../components/admin/SchoolEditForm';
import SchoolCreateForm from '../../../components/admin/SchoolCreateForm';
import SchoolDeleteConfirmModal from '../../../components/admin/SchoolDeleteConfirmModal';
import { adminApiService } from '../../../services/adminApi';

interface School {
  id: number;
  school_id: string;
  school_name: string;
  address: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

const SchoolManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(false);
  
  // API Data states
  const [schools, setSchools] = useState<School[]>([]);
  const [totalSchools, setTotalSchools] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // ดึงข้อมูลโรงเรียนจาก API
  const fetchSchools = async () => {
    setLoading(true);
    try {
      const response = await adminApiService.getAllSchools({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        sort: 'created_at',
        order: 'DESC'
      });

      if (response.success && response.data) {
        setSchools(response.data.schools);
        setTotalSchools(response.data.pagination.totalRecords);
        setCurrentPage(response.data.pagination.currentPage);
      } else {
        console.error('Failed to fetch schools:', response.message);
        setSchools([]);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  // useEffect เพื่อดึงข้อมูลเมื่อ component mount และเมื่อ dependencies เปลี่ยน
  useEffect(() => {
    fetchSchools();
  }, [currentPage, searchTerm]);

  // ใช้ข้อมูลจาก API แทน mock data
  const stats = {
    total: totalSchools,
    active: totalSchools // สมมติว่าทั้งหมดใช้งานได้
  };

  // Handler functions
  const handleViewSchool = (school: School) => {
    setSelectedSchool(school);
    setViewModalOpen(true);
  };

  const handleEditSchool = (school: School) => {
    setSelectedSchool(school);
    setEditModalOpen(true);
  };

  const handleDeleteSchool = (school: School) => {
    setSelectedSchool(school);
    setDeleteModalOpen(true);
  };

  const handleSaveSchool = async (schoolData: Partial<School>) => {
    console.log('💾 Updating school:', selectedSchool?.id, 'with data:', schoolData);
    setLoading(true);
    try {
      if (selectedSchool) {
        const response = await adminApiService.updateSchool(selectedSchool.id, schoolData);
        console.log('✅ Update school response:', response);
      }
      
      // Close modal and refresh data
      setEditModalOpen(false);
      setSelectedSchool(null);
      await fetchSchools();
      
      alert('บันทึกข้อมูลเรียบร้อยแล้ว');
      
    } catch (error: any) {
      console.error('❌ Error updating school:', error);
      console.error('❌ Error response:', error.response?.data);
      alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchool = async (schoolData: any) => {
    console.log('🏗️ Creating school with data:', schoolData);
    setLoading(true);
    try {
      const response = await adminApiService.createSchool(schoolData);
      console.log('✅ Create school response:', response);
      
      // Close modal and refresh data
      setCreateModalOpen(false);
      await fetchSchools();
      
      alert('เพิ่มโรงเรียนเรียบร้อยแล้ว');
      
    } catch (error: any) {
      console.error('❌ Error creating school:', error);
      console.error('❌ Error response:', error.response?.data);
      
      // แสดง validation errors แบบละเอียด
      if (error.response?.data?.errors) {
        console.error('❌ Validation errors:', error.response.data.errors);
        const errorMessages = error.response.data.errors.map((err: any) => `- ${err.msg}`).join('\n');
        alert(`เกิดข้อผิดพลาดในการเพิ่มโรงเรียน:\n${errorMessages}`);
      } else {
        alert(`เกิดข้อผิดพลาดในการเพิ่มโรงเรียน: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    console.log('🗑️ Deleting school:', selectedSchool?.id, selectedSchool?.school_name);
    setLoading(true);
    try {
      if (selectedSchool) {
        const response = await adminApiService.deleteSchool(selectedSchool.id);
        console.log('✅ Delete school response:', response);
      }
      
      // Close modal and refresh data
      setDeleteModalOpen(false);
      setSelectedSchool(null);
      await fetchSchools();
      
      alert('ลบโรงเรียนเรียบร้อยแล้ว');
      
    } catch (error: any) {
      console.error('❌ Error deleting school:', error);
      console.error('❌ Error response:', error.response?.data);
      alert(`เกิดข้อผิดพลาดในการลบโรงเรียน: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoggedLayout currentPage="จัดการโรงเรียน">
      <div className="space-y-6">
        {/* Header with Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h5a2 2 0 002-2V9a2 2 0 00-2-2H9a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">โรงเรียนทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ใช้งานได้</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อโรงเรียน, รหัส, หรือชื่อผู้อำนวยการ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Add Button */}
            <div className="flex items-center space-x-4">

              {/* Add School Button */}
              <button 
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                เพิ่มโรงเรียนใหม่
              </button>
            </div>
          </div>
        </div>

        {/* School Table */}
        <SchoolTable 
          schools={schools}
          loading={loading}
          onView={handleViewSchool}
          onEdit={handleEditSchool}
          onDelete={handleDeleteSchool}
        />

        {/* Modals */}
        <SchoolModal
          school={selectedSchool}
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedSchool(null);
          }}
        />

        <SchoolEditForm
          school={selectedSchool}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedSchool(null);
          }}
          onSave={handleSaveSchool}
          loading={loading}
        />

        <SchoolCreateForm
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSave={handleCreateSchool}
          loading={loading}
        />

        <SchoolDeleteConfirmModal
          school={selectedSchool}
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedSchool(null);
          }}
          onConfirm={handleConfirmDelete}
          loading={loading}
        />
      </div>
    </LoggedLayout>
  );
};

export default SchoolManagement;