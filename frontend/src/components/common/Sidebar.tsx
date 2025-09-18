import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface MenuItem {
  title: string;
  path?: string;
  icon: React.ReactNode;
  submenu?: MenuItem[];
  className?: string;
  badge?: string;
}

interface SidebarProps {
  menuItems: MenuItem[];
  loading?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ menuItems, loading = false }) => {
  const location = useLocation();
  const { getRoleTheme } = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // ฟังก์ชันตรวจสอบว่า current path อยู่ใน submenu ไหน
  const findActiveSubmenu = () => {
    // หา exact match ก่อน
    for (const item of menuItems) {
      if (item.submenu) {
        for (const subItem of item.submenu) {
          if (subItem.path && location.pathname === subItem.path) {
            return item.title;
          }
        }
      }
    }
    
    // ถ้าไม่มี exact match ให้หา partial match ที่แม่นยำ
    // แต่ต้องไม่ใช่ path ที่เป็น parent ของ submenu อื่น
    for (const item of menuItems) {
      if (item.submenu) {
        for (const subItem of item.submenu) {
          if (subItem.path && location.pathname.startsWith(subItem.path + '/')) {
            // ตรวจสอบว่าไม่ใช่ parent path ของ submenu อื่น
            const isParentOfOtherSubmenu = menuItems.some(otherItem => 
              otherItem.submenu?.some(otherSubItem => 
                otherSubItem.path && 
                otherSubItem.path !== subItem.path && 
                otherSubItem.path.startsWith(subItem.path + '/')
              )
            );
            
            if (!isParentOfOtherSubmenu) {
              return item.title;
            }
          }
        }
      }
    }
    
    return null;
  };

  // useEffect เพื่อเปิด submenu ที่ตรงกับ current path
  useEffect(() => {
    const activeSubmenu = findActiveSubmenu();
    if (activeSubmenu) {
      setOpenSubmenu(activeSubmenu);
    }
  }, [location.pathname, menuItems]);

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // ตรวจสอบว่า submenu item เป็น active หรือไม่
  const isSubmenuItemActive = (path: string) => {
    // ตรวจสอบ exact match ก่อน
    if (location.pathname === path) {
      return true;
    }
    
    // ตรวจสอบ partial match สำหรับ nested routes
    // แต่ต้องไม่ใช่ parent path ของ submenu อื่น
    if (location.pathname.startsWith(path + '/')) {
      // ตรวจสอบว่าไม่ใช่ parent path ของ submenu อื่น
      const isParentOfOtherSubmenu = menuItems.some(item => 
        item.submenu?.some(subItem => 
          subItem.path && 
          subItem.path !== path && 
          subItem.path.startsWith(path + '/')
        )
      );
      
      return !isParentOfOtherSubmenu;
    }
    
    return false;
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isSubmenuOpen = openSubmenu === item.title;
    const paddingLeft = level === 0 ? 'pl-6' : 'pl-12';
    
    // ตรวจสอบว่า submenu parent มี active item หรือไม่
    const hasActiveSubmenuItem = hasSubmenu && item.submenu?.some(subItem => 
      subItem.path && isSubmenuItemActive(subItem.path)
    );

    return (
      <div key={item.title} className="mb-1">
        {hasSubmenu ? (
          <button
            onClick={() => toggleSubmenu(item.title)}
            className={`w-full flex items-center justify-between ${paddingLeft} pr-6 py-3 text-left text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-200 ${
              isSubmenuOpen || hasActiveSubmenuItem ? 'bg-primary-50 text-primary-700' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.title}</span>
            </div>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isSubmenuOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : (
          <Link
            to={item.path || '#'}
            className={`flex items-center ${paddingLeft} pr-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-200 ${
              item.path && (level > 0 ? isSubmenuItemActive(item.path) : isActive(item.path)) ? 'bg-primary-100 text-primary-700 border-r-4 border-primary-500' : ''
            } ${item.className || ''}`}
          >
            <span className="text-lg mr-3">{item.icon}</span>
            <span className="font-medium flex-1">{item.title}</span>
            {item.badge && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2 animate-bounce">
                {item.badge}
              </span>
            )}
          </Link>
        )}

        {/* Submenu */}
        {hasSubmenu && isSubmenuOpen && (
          <div className="bg-gray-50">
            {item.submenu?.map((subItem) => renderMenuItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={`w-64 bg-white border-r border-gray-200 shadow-sm min-h-screen ${getRoleTheme()}`}>
      {/* Header - ชื่อเว็บไซต์ */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">ฝ</span>
          </div>
          <div>
            <h2 className="text-lg font-prompt font-semibold text-gray-900">
              ระบบฝึกประสบการณ์
            </h2>
            <p className="text-sm text-gray-500">วิชาชีพ</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="py-4">
        {loading ? (
          // แสดง skeleton loading เมื่อกำลังโหลด
          <div className="space-y-2 px-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-center space-x-3 py-3">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          menuItems.map((item) => renderMenuItem(item))
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
