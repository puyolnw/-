import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [], 
  requireAuth = true 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // แสดง loading ระหว่างตรวจสอบสถานะ (เฉพาะหน้าที่ต้อง auth)
  if (isLoading && requireAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 animate-pulse">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  // ถ้าต้องการ authentication แต่ไม่ได้ login
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ถ้าได้ login แล้วแต่เข้าหน้า auth
  if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/register')) {
    // Redirect ตาม role
    const roleRedirects = {
      student: '/student/dashboard',
      teacher: '/teacher/dashboard',
      supervisor: '/supervisor/dashboard',
      admin: '/admin/dashboard'
    };
    return <Navigate to={roleRedirects[user!.role]} replace />;
  }

  // ตรวจสอบสิทธิ์ตาม role
  if (requireAuth && allowedRoles.length > 0 && user) {
    if (!allowedRoles.includes(user.role)) {
      // Redirect ไปหน้าแรกของ role ตัวเอง
      const roleRedirects = {
        student: '/student/dashboard',
        teacher: '/teacher/dashboard',
        supervisor: '/supervisor/dashboard',
        admin: '/admin/dashboard'
      };
      return <Navigate to={roleRedirects[user.role]} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
