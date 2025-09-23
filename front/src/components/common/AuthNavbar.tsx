import React from 'react';
import { Link } from 'react-router-dom';

const AuthNavbar: React.FC = () => {
  return (
    <nav className="bg-primary-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo และชื่อเว็บ */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-primary-600 font-bold text-lg">ฝ</span>
            </div>
            <h1 className="text-xl font-prompt font-semibold">
              ระบบฝึกประสบการณ์วิชาชีพ
            </h1>
          </Link>

          {/* ปุ่ม Login */}
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="bg-primary-700 hover:bg-primary-800 px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AuthNavbar;
