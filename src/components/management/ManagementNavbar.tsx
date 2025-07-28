'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useManagementAuth } from '@/contexts/ManagementAuthContext';

const ManagementNavbar: React.FC = () => {
  const { user, logout: authLogout } = useAuth();
  const { 
    user: managementUser, 
    logout: managementLogout, 
    canApproveQueries, 
    canApproveOTCQueries, 
    canApproveDeferralQueries
  } = useManagementAuth();
  
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Clear localStorage first to prevent any conflicts
      localStorage.removeItem('managementToken');
      localStorage.removeItem('managementUser');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userBranch');
      localStorage.removeItem('selectedBranch');
      localStorage.removeItem('authToken');
      
      // Clear auth contexts without redirect conflicts
      if (managementLogout) {
        managementLogout(true); // Skip redirect from context
      }
      if (authLogout) {
        authLogout();
      }
      
      // Force immediate redirect to management login
      window.location.href = '/management-login';
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: Force redirect even if there's an error
      window.location.href = '/management-login';
    }
  };

  const currentUser = managementUser || user;

  return (
    <nav className="bg-gradient-to-r from-cyan-600 to-cyan-700 shadow-sm">
      <div className="mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Left Section - Title */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-white">Management Dashboard</h1>
            <span className="text-cyan-200 text-sm">•</span>
            <span className="text-cyan-100 text-sm">Welcome, {currentUser?.name || 'Manager'}</span>
          </div>

          {/* Center Section - Status Pills */}
          <div className="hidden md:flex items-center space-x-4">
            {/* User Status */}
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-cyan-100 text-sm font-medium">
                {currentUser?.employeeId || currentUser?.managementId || 'Multiple'}
              </span>
            </div>

            {/* Last Updated */}
            <div className="flex items-center space-x-2 text-cyan-100">
              <span className="text-sm">Last updated: 6m ago</span>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-4">
            {/* Refresh Button */}
            <button className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm font-medium">Refresh</span>
            </button>

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default ManagementNavbar;
