import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { studentApiService } from '../services/studentApi';

export interface StudentStatus {
  isRegistered: boolean;
  hasCompletionRequest: boolean;
  schoolInfo?: {
    assignment_id: number;
    school_id: string;
    school_name: string;
    enrollment_date: string;
  };
  completionRequestInfo?: {
    id: number;
    status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'revision_required';
    request_date: string;
    approved_date?: string;
    teacher_rating?: number;
    supervisor_rating?: number;
  };
  loading: boolean;
  error: string | null;
}

interface StudentStatusContextType {
  status: StudentStatus;
  refreshStatus: () => void;
}

const StudentStatusContext = createContext<StudentStatusContextType | null>(null);

// Cache สำหรับเก็บข้อมูล student status
let cachedStatus: StudentStatus | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 นาที
let isFetching = false; // ป้องกันการเรียก API ซ้ำ

export const StudentStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<StudentStatus>(() => {
    // ใช้ cache ถ้ามีและยังไม่หมดอายุ
    if (cachedStatus && Date.now() - cacheTimestamp < CACHE_DURATION) {
      return { ...cachedStatus, loading: false };
    }
    
    // ถ้าเป็น student ให้เริ่มต้นด้วย loading: true เพื่อรอข้อมูล
    const isStudent = user?.role === 'student';
    
    return {
      isRegistered: false,
      hasCompletionRequest: false,
      loading: isStudent, // เริ่มต้น loading สำหรับ student
      error: null,
    };
  });

  const fetchStudentStatus = async () => {
    if (!user || user.role !== 'student') {
      // ถ้าไม่ใช่ student ให้ใช้ค่า default
      const defaultStatus = {
        isRegistered: false,
        hasCompletionRequest: false,
        loading: false,
        error: null,
      };
      setStatus(defaultStatus);
      return;
    }

    // ใช้ cache ถ้ามีและยังไม่หมดอายุ
    if (cachedStatus && Date.now() - cacheTimestamp < CACHE_DURATION) {
      console.log('🟡 StudentStatusProvider - Using cached data');
      setStatus({ ...cachedStatus, loading: false });
      return;
    }

    // ป้องกันการเรียก API ซ้ำ
    if (isFetching) {
      console.log('🟡 StudentStatusProvider - Already fetching, skipping...');
      return;
    }

    try {
      isFetching = true;
      // ตั้ง loading เฉพาะเมื่อไม่มี cache
      if (!cachedStatus) {
        setStatus(prev => ({ ...prev, loading: true, error: null }));
      }

      // เรียก API เพื่อเช็คสถานะการลงทะเบียน
      console.log('🔄 StudentStatusProvider - Fetching student status...');
      const response = await studentApiService.getStudentStatus();
      
      if (response.success && response.data) {
        const newStatus = {
          ...response.data,
          loading: false,
          error: null,
        };
        
        // อัปเดต cache
        cachedStatus = newStatus;
        cacheTimestamp = Date.now();
        
        setStatus(newStatus);
        console.log('🟢 StudentStatusProvider - Status updated and cached:', {
          isRegistered: newStatus.isRegistered,
          hasCompletionRequest: newStatus.hasCompletionRequest,
          schoolInfo: newStatus.schoolInfo ? `${newStatus.schoolInfo.school_name}` : 'none'
        });
      } else {
        console.log('🔴 StudentStatusProvider - API response failed:', response);
        throw new Error(response.message || 'Failed to fetch student status');
      }
    } catch (error: any) {
      console.error('🔴 StudentStatusProvider - Error fetching status:', error);
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch student status',
      }));
    } finally {
      isFetching = false;
    }
  };

  // อัปเดต loading state เมื่อ user เปลี่ยน
  useEffect(() => {
    console.log('🔄 StudentStatusProvider - User role changed:', user?.role);
    console.log('🔄 StudentStatusProvider - Current status:', status);
    if (user?.role === 'student') {
      // ถ้าเป็น student และยังไม่มี cache ให้ตั้ง loading: true
      if (!cachedStatus || Date.now() - cacheTimestamp >= CACHE_DURATION) {
        console.log('🔄 StudentStatusProvider - Setting loading: true for student');
        setStatus(prev => ({ ...prev, loading: true }));
      } else {
        console.log('🔄 StudentStatusProvider - Using cached data for student');
        setStatus(prev => ({ ...prev, loading: false }));
      }
    } else {
      // ถ้าไม่ใช่ student ให้ตั้ง loading: false
      console.log('🔄 StudentStatusProvider - Setting loading: false for non-student');
      setStatus(prev => ({ ...prev, loading: false }));
    }
  }, [user?.role]);

  // เรียกข้อมูลเมื่อ user เปลี่ยน
  useEffect(() => {
    // ตรวจสอบว่า user เปลี่ยนจริงๆ หรือไม่
    if (user?.id && user?.role === 'student') {
      fetchStudentStatus();
    }
  }, [user?.id, user?.role]); // ใช้ user.id และ user.role แทน user object

  // Function สำหรับ refresh status
  const refreshStatus = () => {
    // ล้าง cache เพื่อให้ fetch ข้อมูลใหม่
    cachedStatus = null;
    cacheTimestamp = 0;
    isFetching = false;
    fetchStudentStatus();
  };

  return (
    <StudentStatusContext.Provider value={{ status, refreshStatus }}>
      {children}
    </StudentStatusContext.Provider>
  );
};

export const useStudentStatusContext = () => {
  const context = useContext(StudentStatusContext);
  if (!context) {
    throw new Error('useStudentStatusContext must be used within StudentStatusProvider');
  }
  return context;
};
