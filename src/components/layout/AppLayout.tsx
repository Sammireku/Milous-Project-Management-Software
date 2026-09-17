import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { NotificationToast } from '../common/NotificationToast';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top App Header with SSO & Offline Sync State */}
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main Layout Container: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Main Body Routed Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </main>

          {/* Real-Time Auto-Sync Notification Toasts */}
          <NotificationToast />

          {/* Footer */}
          <footer className="bg-white border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-500">
            <p>
              Milous Project NGO Management System • Google Workspace SSO &amp; Offline Firestore • Multi-Donor Compliance Engine
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};
