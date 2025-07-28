'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Force dynamic rendering to avoid SSG issues with context providers
export const dynamic = 'force-dynamic';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user || !user.isAuthenticated) {
        // Always redirect to login if not authenticated
        console.log('No user authenticated, redirecting to login');
        router.replace('/login');
        return;
      }
      
        // Redirect to appropriate dashboard based on user role
      console.log('User authenticated:', user.role, 'redirecting to dashboard');
        switch (user.role) {
          case 'sales':
          router.replace('/sales-branch-selection');
            break;
          case 'credit':
          router.replace('/credit-branch-selection');
            break;
          case 'operations':
          router.replace('/operations');
            break;
          case 'admin':
          router.replace('/admin-dashboard');
            break;
          case 'management':
          case 'manager':
          case 'supervisor':
          router.replace('/management-dashboard');
            break;
          default:
            // If unknown role, redirect to login
            console.warn('Unknown user role:', user.role);
          router.replace('/login');
      }
    }
  }, [user, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
