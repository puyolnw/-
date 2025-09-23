import React from 'react';
import AuthNavbar from '../common/AuthNavbar';
import Footer from '../common/Footer';
import PageTransition from '../common/PageTransition';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <AuthNavbar />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <PageTransition>
          {children}
        </PageTransition>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AuthLayout;
