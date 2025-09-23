import type { User, UserRole } from '../types/user';

// Local storage keys
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const authUtils = {
  // Token management
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  // User management
  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  removeUser(): void {
    localStorage.removeItem(USER_KEY);
  },

  // Authentication status
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  },

  // Role checking
  hasRole(role: UserRole): boolean {
    const user = this.getUser();
    return user?.role === role;
  },

  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.role) : false;
  },

  // Logout
  logout(): void {
    this.removeToken();
    this.removeUser();
    // ไม่ redirect ถ้าอยู่หน้า login แล้ว
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  },

  // Get role theme class
  getRoleTheme(role?: UserRole): string {
    const userRole = role || this.getUser()?.role;
    switch (userRole) {
      case 'student':
        return 'student-theme';
      case 'teacher':
        return 'teacher-theme';
      case 'supervisor':
        return 'supervisor-theme';
      case 'admin':
        return 'admin-theme';
      default:
        return '';
    }
  },

  // Get role display name
  getRoleDisplayName(role?: UserRole): string {
    const userRole = role || this.getUser()?.role;
    switch (userRole) {
      case 'student':
        return 'นักศึกษาฝึกประสบการณ์วิชาชีพ';
      case 'teacher':
        return 'ครูพี่เลี้ยง';
      case 'supervisor':
        return 'อาจารย์ผู้นิเทศ';
      case 'admin':
        return 'ผู้ดูแลระบบ';
      default:
        return 'ผู้ใช้งาน';
    }
  },

  // Get user display name
  getUserDisplayName(user?: User): string {
    const currentUser = user || this.getUser();
    if (!currentUser) return 'ผู้ใช้งาน';
    return `${currentUser.first_name} ${currentUser.last_name}`;
  }
};

export default authUtils;
