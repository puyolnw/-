import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useStudentStatusContext } from '../../contexts/StudentStatusContext';
import Sidebar from '../common/Sidebar';
import LoggedNavbar from '../common/LoggedNavbar';
import Footer from '../common/Footer';
import PageTransition from '../common/PageTransition';
import { getMenuItemsByRole } from '../../utils/menuItems';

interface LoggedLayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

const LoggedLayout: React.FC<LoggedLayoutProps> = ({ children, currentPage }) => {
  const { user, getRoleTheme } = useAuth();
  const { status: studentStatus } = useStudentStatusContext();
  
  if (!user) {
    return null;
  }

  // ส่ง studentStatus ไปด้วยถ้าเป็น student
  const menuItems = getMenuItemsByRole(
    user.role, 
    user.role === 'student' ? studentStatus : undefined
  );

  return (
    <div className={`min-h-screen flex bg-gray-50 ${getRoleTheme()}`}>
      {/* Sidebar */}
      <Sidebar 
        menuItems={menuItems} 
        loading={user.role === 'student' ? studentStatus.loading : false}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <LoggedNavbar currentPage={currentPage} />

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <PageTransition>
            {children}
          </PageTransition>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default LoggedLayout;
