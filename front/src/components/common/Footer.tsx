import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-300 mb-2 md:mb-0">
            © 2025 ระบบฝึกประสบการณ์วิชาชีพ. สงวนลิขสิทธิ์.
          </div>
          <div className="text-sm text-gray-300">
            พัฒนาโดย ทีมพัฒนาระบบ
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
