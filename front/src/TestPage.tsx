import React from 'react';
import AuthLayout from './components/layouts/AuthLayout';

const TestPage: React.FC = () => {
  return (
    <AuthLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-red-600 mb-4">🔥 TEST PAGE with AuthLayout!</h1>
        <p className="text-blue-600 text-lg mb-6">
          ถ้าเห็นข้อความนี้ + Navbar + Footer = Layout ทำงาน ✅
        </p>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">🎨 Tailwind CSS Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary-500 text-white p-4 rounded-lg">
              <h3 className="font-bold">Primary Color</h3>
              <p>bg-primary-500</p>
            </div>
            <div className="bg-secondary-500 text-white p-4 rounded-lg">
              <h3 className="font-bold">Secondary Color</h3>
              <p>bg-secondary-500</p>
            </div>
            <div className="bg-accent-500 text-white p-4 rounded-lg">
              <h3 className="font-bold">Accent Color</h3>
              <p>bg-accent-500</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">📍 URL Information</h2>
          <p><strong>Current URL:</strong> {window.location.href}</p>
          <p><strong>Pathname:</strong> {window.location.pathname}</p>
        </div>

        <div className="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500">
          <p className="text-yellow-700">
            <strong>🔍 Layout Debug Test:</strong><br/>
            <strong>✅ เห็น Navbar สีฟ้า = AuthNavbar ทำงาน</strong><br/>
            <strong>✅ เห็น Footer สีเทาเข้ม = Footer ทำงาน</strong><br/>
            <strong>✅ เห็นสีและ layout สวย = Tailwind ทำงาน</strong><br/>
            <strong>❌ ไม่เห็นอะไรเลย = มีปัญหาใหญ่</strong>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default TestPage;
