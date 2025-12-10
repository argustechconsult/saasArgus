import React from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useRouter } from '../../lib/next-shim';

export default function DashboardLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center fixed w-full top-0 z-20 h-16">
        <div className="flex items-center gap-2">
           {/* Mobile menu placeholder */}
          <div className="md:hidden mr-2">
             <span className="text-2xl">☰</span>
          </div>
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
             <span>🚀</span> SaaS Manager
          </h1>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-red-500 font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors">
          Logout
        </button>
      </nav>

      <div className="flex pt-16 h-[calc(100vh)]">
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 p-6 md:ml-64 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}