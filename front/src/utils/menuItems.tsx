import React from 'react';
import type { UserRole } from '../types/user';
import type { StudentStatus } from '../contexts/StudentStatusContext';

interface MenuItem {
  title: string;
  path?: string;
  icon: React.ReactNode;
  submenu?: MenuItem[];
  className?: string; // เพิ่มสำหรับ styling พิเศษ
  badge?: string; // เพิ่มสำหรับแสดง badge
}

// Icons สำหรับเมนู
const DashboardIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
  </svg>
);

const ProfileIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const DocumentIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const UsersIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const SchoolIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const CompletionRequestIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ReportIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);


const ManagementIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const RegisterIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const TeachingIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const MessageIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const CompletionIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// เมนูสำหรับนักศึกษาที่ยังไม่ได้ลงทะเบียน
const unregisteredStudentMenuItems: MenuItem[] = [
  {
    title: 'แดชบอร์ด',
    path: '/student/dashboard',
    icon: DashboardIcon,
  },
  {
    title: '🎯 ลงทะเบียน',
    path: '/student/registration',
    icon: RegisterIcon,
    className: 'bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold shadow-lg transform hover:scale-105 transition-all duration-200 animate-pulse',
    badge: 'สำคัญ!'
  },
];

// เมนูสำหรับนักศึกษาที่ลงทะเบียนแล้ว
const registeredStudentMenuItems: MenuItem[] = [
  {
    title: 'แดชบอร์ด',
    path: '/student/dashboard',
    icon: DashboardIcon,
  },
  {
    title: 'บันทึกแผนการสอน',
    path: '/student/lesson-plans',
    icon: DocumentIcon,
  },
  {
    title: 'บันทึกข้อมูลการฝึกประสบการณ์',
    path: '/student/teaching-sessions',
    icon: TeachingIcon,
  },
  {
    title: 'ข้อมูลโรงเรียน',
    path: '/student/school',
    icon: SchoolIcon,
  },
  {
    title: 'รายงานผลการปฏิบัติงาน',
    path: '/student/completion-request',
    icon: CompletionRequestIcon,
  },
  {
    title: 'กล่องข้อความ',
    path: '/student/messages',
    icon: MessageIcon,
  },
];

// เมนูสำหรับนักศึกษาที่ยื่นคำร้องสำเร็จการฝึกแล้ว
const completionRequestedStudentMenuItems: MenuItem[] = [
  {
    title: 'แดชบอร์ด',
    path: '/student/dashboard',
    icon: DashboardIcon,
  },
  {
    title: 'บันทึกแผนการสอน',
    path: '/student/lesson-plans',
    icon: DocumentIcon,
  },
  {
    title: 'บันทึกข้อมูลการฝึกประสบการณ์',
    path: '/student/teaching-sessions',
    icon: TeachingIcon,
  },
  {
    title: 'ข้อมูลโรงเรียน',
    path: '/student/school',
    icon: SchoolIcon,
  },
  {
    title: 'รายงานผลการปฏิบัติงาน',
    path: '/student/completion-request',
    icon: CompletionRequestIcon,
  },
  {
    title: 'กล่องข้อความ',
    path: '/student/messages',
    icon: MessageIcon,
  },
];

// Function สำหรับเลือกเมนูตามสถานะนักศึกษา
export const getStudentMenuItems = (studentStatus: StudentStatus): MenuItem[] => {
  console.log('🎯 getStudentMenuItems called with:', {
    loading: studentStatus.loading,
    isRegistered: studentStatus.isRegistered,
    hasCompletionRequest: studentStatus.hasCompletionRequest,
    schoolInfo: studentStatus.schoolInfo ? `${studentStatus.schoolInfo.school_name}` : 'none'
  });

  if (studentStatus.loading) {
    console.log('📋 Using unregisteredStudentMenuItems (loading)');
    return unregisteredStudentMenuItems;
  }

  if (!studentStatus.isRegistered) {
    console.log('📋 Using unregisteredStudentMenuItems (not registered)');
    return unregisteredStudentMenuItems;
  }

  if (studentStatus.hasCompletionRequest) {
    console.log('📋 Using completionRequestedStudentMenuItems (has completion request)');
    return completionRequestedStudentMenuItems;
  }

  console.log('📋 Using registeredStudentMenuItems (registered, no completion request)');
  return registeredStudentMenuItems;
};

// เมนูสำหรับครูพี่เลี้ยง
const teacherMenuItems: MenuItem[] = [
  {
    title: 'แดชบอร์ด',
    path: '/teacher/dashboard',
    icon: DashboardIcon,
  },
  {
    title: 'ข้อมูลโรงเรียน',
    path: '/teacher/school',
    icon: SchoolIcon,
  },
  {
    title: 'ข้อมูลแผนการสอน',
    path: '/teacher/lesson-plans',
    icon: DocumentIcon,
  },
  {
    title: 'ข้อมูลบันทึกการฝึกประสบการณ์',
    path: '/teacher/teaching-sessions',
    icon: DocumentIcon,
  },
  {
    title: 'ประเมินผลการฝึกประสบการณ์',
    path: '/teacher/evaluations',
    icon: DocumentIcon,
  },
  {
    title: 'รายงาน',
    path: '/teacher/reports',
    icon: ReportIcon,
  },
  {
    title: 'กล่องข้อความ',
    path: '/teacher/messages',
    icon: MessageIcon,
  },
];

// เมนูสำหรับอาจารย์ผู้นิเทศ
const supervisorMenuItems: MenuItem[] = [
  {
    title: 'แดชบอร์ด',
    path: '/supervisor/dashboard',
    icon: DashboardIcon,
  },
  {
    title: 'โรงเรียนทั้งหมด',
    path: '/supervisor/schools',
    icon: SchoolIcon,
  },
  {
    title: 'ข้อมูลแผนการสอน',
    path: '/supervisor/lesson-plans',
    icon: DocumentIcon,
  },
  {
    title: 'ข้อมูลบันทึกการฝึกประสบการณ์',
    path: '/supervisor/teaching-sessions',
    icon: TeachingIcon,
  },
  {
    title: 'ประเมินผลการฝึกประสบการณ์',
    path: '/supervisor/evaluations',
    icon: CompletionIcon,
  },
  {
    title: 'รายงาน',
    path: '/supervisor/reports',
    icon: ReportIcon,
  },
  {
    title: 'กล่องข้อความ',
    path: '/supervisor/messages',
    icon: MessageIcon,
  },
];

// เมนูสำหรับผู้ดูแลระบบ
const adminMenuItems: MenuItem[] = [
  {
    title: 'แดชบอร์ด',
    path: '/admin/dashboard',
    icon: DashboardIcon,
  },
  {
    title: 'โรงเรียน',
    icon: SchoolIcon,
    submenu: [
      {
        title: 'ภาพรวม',
        path: '/admin/schools/overview',
        icon: DashboardIcon,
      },
      {
        title: 'การสมัคร',
        path: '/admin/schools/enrollment',
        icon: UsersIcon,
      },
    ],
  },
  {
    title: 'รายงาน',
    path: '/admin/reports',
    icon: ReportIcon,
  },
  {
    title: 'จัดการ',
    icon: ManagementIcon,
    submenu: [
      {
        title: 'จัดการผู้ใช้งาน',
        path: '/admin/users',
        icon: UsersIcon,
      },
      {
        title: 'จัดการโรงเรียน',
        path: '/admin/schools',
        icon: SchoolIcon,
      },
      {
        title: 'จัดการบันทึกฝึกประสบการณ์',
        path: '/admin/teaching-sessions',
        icon: DocumentIcon,
      },
      {
        title: 'จัดการการประเมิน',
        path: '/admin/evaluations',
        icon: DocumentIcon,
      },
    ],
  },
  {
    title: 'ข้อมูลส่วนตัว',
    path: '/admin/profile',
    icon: ProfileIcon,
  },
];

export const getMenuItemsByRole = (role: UserRole, studentStatus?: StudentStatus): MenuItem[] => {
  switch (role) {
    case 'student':
      // ถ้ามี studentStatus ให้ใช้ getStudentMenuItems, ถ้าไม่มีให้ใช้เมนูพื้นฐาน
      return studentStatus ? getStudentMenuItems(studentStatus) : unregisteredStudentMenuItems;
    case 'teacher':
      return teacherMenuItems;
    case 'supervisor':
      return supervisorMenuItems;
    case 'admin':
      return adminMenuItems;
    default:
      return [];
  }
};

export default getMenuItemsByRole;
