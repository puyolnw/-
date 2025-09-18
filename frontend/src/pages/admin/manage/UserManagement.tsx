import React, { useState, useEffect } from 'react';
import LoggedLayout from '../../../components/layouts/LoggedLayout';
import UserTable from '../../../components/admin/UserTable';
import UserModal from '../../../components/admin/UserModal';
import UserEditForm from '../../../components/admin/UserEditForm';
import UserCreateForm from '../../../components/admin/UserCreateForm';
import DeleteConfirmModal from '../../../components/admin/DeleteConfirmModal';
import { adminApiService } from '../../../services/adminApi';
import type { User } from '../../../types/user';

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // ดึงข้อมูลผู้ใช้จาก API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 50, // เพิ่มจาก 10 เป็น 50
        search: searchTerm,
        role: selectedRole,
        sort: 'created_at',
        order: 'DESC'
      };
      
      const response = await adminApiService.getAllUsers(params);

      if (response.success && response.data) {
        setUsers(response.data.users);
        setTotalUsers(response.data.pagination.totalRecords);
        setCurrentPage(response.data.pagination.currentPage);
      } else {
        console.error('🔴 Frontend - Failed to fetch users:', response.message);
        setUsers([]);
      }
    } catch (error) {
      console.error('🔴 Frontend - Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // useEffect สำหรับดึงข้อมูลเมื่อ component mount และเมื่อ dependencies เปลี่ยน
  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, selectedRole]);

  // Mock data สำหรับ fallback (จะลบทิ้งในอนาคต)


  // ใช้ข้อมูลจาก API แทน mock data
  const filteredUsers = users; // API จัดการ filter แล้ว

  // สร้าง stats จากข้อมูลที่ได้รับจาก API (เฉพาะหน้าที่แสดง)
  const stats = {
    total: totalUsers, // ใช้ totalUsers จาก pagination
    students: users.filter(u => u.role === 'student').length,
    teachers: users.filter(u => u.role === 'teacher').length,
    supervisors: users.filter(u => u.role === 'supervisor').length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  // Handler functions
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    setLoading(true);
    try {
      if (!selectedUser) return;
      
      const response = await adminApiService.updateUser(selectedUser.id, userData);
      
      if (response.success) {
        // Close modal and show success message
        setEditModalOpen(false);
        setSelectedUser(null);
        
        // Refresh user list
        await fetchUsers();
        alert('บันทึกข้อมูลเรียบร้อยแล้ว');
      } else {
        alert('เกิดข้อผิดพลาด: ' + response.message);
      }
      
    } catch (error) {
      console.error('Error saving user:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      if (!selectedUser) return;
      
      const response = await adminApiService.deleteUser(selectedUser.id);
      
      if (response.success) {
        // Close modal and show success message
        setDeleteModalOpen(false);
        setSelectedUser(null);
        
        // Refresh user list
        await fetchUsers();
        alert('ลบผู้ใช้งานเรียบร้อยแล้ว');
      } else {
        alert('เกิดข้อผิดพลาด: ' + response.message);
      }
      
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('เกิดข้อผิดพลาดในการลบผู้ใช้งาน');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    setLoading(true);
    try {
      const response = await adminApiService.createUser(userData);
      
      if (response.success) {
        // Close modal and show success message
        setCreateModalOpen(false);
        
        // Refresh user list
        await fetchUsers();
        alert('เพิ่มผู้ใช้งานเรียบร้อยแล้ว');
      } else {
        alert('เกิดข้อผิดพลาด: ' + response.message);
      }
      
    } catch (error) {
      console.error('Error creating user:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoggedLayout currentPage="จัดการผู้ใช้งาน">
      <div className="space-y-6">
        {/* Header with Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">นักศึกษา</p>
                <p className="text-2xl font-bold text-gray-900">{stats.students}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ครูพี่เลี้ยง</p>
                <p className="text-2xl font-bold text-gray-900">{stats.teachers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ผู้นิเทศ</p>
                <p className="text-2xl font-bold text-gray-900">{stats.supervisors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ผู้ดูแล</p>
                <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">ค้นหาและกรองข้อมูล</h3>
              <button 
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                เพิ่มผู้ใช้ใหม่
              </button>
            </div>

            {/* Search and Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Bar */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ค้นหาผู้ใช้งาน
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="ค้นหาด้วยชื่อ, อีเมล, หรือรหัสนักศึกษา..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประเภทผู้ใช้งาน
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="all">ทุกประเภท</option>
                  <option value="student">นักศึกษา</option>
                  <option value="teacher">ครูพี่เลี้ยง</option>
                  <option value="supervisor">ผู้นิเทศ</option>
                  <option value="admin">ผู้ดูแลระบบ</option>
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || selectedRole !== 'all') && (
              <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-500">ตัวกรองที่ใช้:</span>
                {searchTerm && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ค้นหา: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {selectedRole !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ประเภท: {selectedRole === 'student' ? 'นักศึกษา' : selectedRole === 'teacher' ? 'ครูพี่เลี้ยง' : selectedRole === 'supervisor' ? 'ผู้นิเทศ' : 'ผู้ดูแลระบบ'}
                    <button
                      onClick={() => setSelectedRole('all')}
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-600"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedRole('all');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User Table */}
        <UserTable 
          users={filteredUsers}
          onView={handleViewUser}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
        />

        {/* Modals */}
        <UserModal
          user={selectedUser}
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedUser(null);
          }}
        />

        <UserEditForm
          user={selectedUser}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedUser(null);
          }}
          onSave={handleSaveUser}
          loading={loading}
        />

        <UserCreateForm
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSave={handleCreateUser}
          loading={loading}
        />

        <DeleteConfirmModal
          user={selectedUser}
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedUser(null);
          }}
          onConfirm={handleConfirmDelete}
          loading={loading}
        />
      </div>
    </LoggedLayout>
  );
};

export default UserManagement;
