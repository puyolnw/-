import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface LoggedNavbarProps {
  currentPage: string;
}

const LoggedNavbar: React.FC<LoggedNavbarProps> = ({ currentPage }) => {
  const { user, logout, getUserDisplayName } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // สร้าง profile URL ตาม role
  const getProfileUrl = () => {
    if (!user) return '/login';
    return `/${user.role}/profile`;
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          {/* ชื่อหน้าปัจจุบัน */}
          <div>
            <h1 className="text-2xl font-prompt font-semibold text-gray-900">
              {currentPage}
            </h1>
          </div>

          {/* ส่วนขวา - Profile */}
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 hidden md:block">
              สวัสดี, {getUserDisplayName()}
            </span>
            
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-2 transition-colors duration-200"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary-200">
                  {user?.profile_image ? (
                    <img
                      src={`http://localhost:3000/uploads/profiles/${user.profile_image}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-500 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {user?.first_name?.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                    isProfileOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                  <Link
                    to={getProfileUrl()}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>ข้อมูลส่วนตัว</span>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>ออกจากระบบ</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LoggedNavbar;
