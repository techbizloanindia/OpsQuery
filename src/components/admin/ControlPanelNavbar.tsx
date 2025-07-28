'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const ControlPanelNavbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navigateToHome = () => {
    router.push('/');
  };

  return (
    <nav className="bg-gradient-to-r from-cyan-600 to-cyan-700 shadow-sm">
      <div className="mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Left Section - Title */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-white">Control Panel</h1>
            <span className="text-cyan-200 text-sm">•</span>
            <span className="text-cyan-100 text-sm">Welcome, {user?.name || 'Admin'}</span>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <button className="relative p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19c-5 0-8-3-8-8s3-8 8-8 8 3 8 8-3 8-8 8z"/>
              </svg>
            </button>

            {/* Logout Button */}
            <button 
              className="flex items-center space-x-2 bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>


    </nav>
  );
};

export default ControlPanelNavbar; 