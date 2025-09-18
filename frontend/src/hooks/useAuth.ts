import { useState, useEffect } from 'react';
import type { User, UserRole } from '../types/user';
import { authUtils } from '../utils/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // ตรวจสอบสถานะการ login เมื่อ component mount
    const checkAuth = () => {
      const currentUser = authUtils.getUser();
      const token = authUtils.getToken();
      
      if (currentUser && token) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (userData: User, token: string) => {
    authUtils.setUser(userData);
    authUtils.setToken(token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    authUtils.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData: User) => {
    authUtils.setUser(userData);
    setUser(userData);
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const getRoleTheme = (): string => {
    return authUtils.getRoleTheme(user?.role);
  };

  const getRoleDisplayName = (): string => {
    return authUtils.getRoleDisplayName(user?.role);
  };

  const getUserDisplayName = (): string => {
    return authUtils.getUserDisplayName(user || undefined);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    hasRole,
    hasAnyRole,
    getRoleTheme,
    getRoleDisplayName,
    getUserDisplayName,
  };
};

export default useAuth;
