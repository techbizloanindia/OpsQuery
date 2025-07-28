'use client';

import React from 'react';
import { useManagementAuth } from '@/contexts/ManagementAuthContext';

interface ManagementProtectedRouteProps {
  children: React.ReactNode;
}

const ManagementProtectedRoute: React.FC<ManagementProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useManagementAuth();

  console.log('🛡️ ManagementProtectedRoute: Auth state check', {
    isLoading,
    isAuthenticated,
    hasUser: !!user,
    userName: user?.name,
    managementId: user?.managementId
  });

  if (isLoading) {
    console.log('🛡️ ManagementProtectedRoute: Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading management authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🛡️ ManagementProtectedRoute: Access denied - not authenticated');
    
    // Check if there's a current user who might need to be converted to management auth
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const parsedUser = JSON.parse(currentUser);
        if (parsedUser.role === 'management') {
          console.log('🛡️ ManagementProtectedRoute: Found management user in regular auth, forcing page reload...');
          window.location.reload();
          return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Initializing management access...</p>
              </div>
            </div>
          );
        }
      } catch (error) {
        console.error('🛡️ ManagementProtectedRoute: Error checking current user:', error);
      }
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Management Access Required</h2>
          <p className="text-gray-600 mb-6">You need to be logged in as a management user to access this page.</p>
          <div className="space-y-4">
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Go to Login
            </a>
            <div className="text-sm text-gray-500">
              <p>If you're already logged in and seeing this message:</p>
              <button
                onClick={() => window.location.reload()}
                className="text-blue-600 hover:text-blue-500 underline"
              >
                Try refreshing the page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('🛡️ ManagementProtectedRoute: Access granted for user:', user?.name);
  return <>{children}</>;
};

export default ManagementProtectedRoute;
