'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ManagementAuthProvider } from '@/contexts/ManagementAuthContext';
import ManagementProtectedRoute from '@/components/auth/ManagementProtectedRoute';
import ManagementDashboard from '@/components/management/ManagementDashboard';

// Create a client for management queries
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 30000, // 30 seconds for real-time updates
      retry: 3,
    },
  },
});

// Force dynamic rendering to avoid SSG issues with context providers
export const dynamic = 'force-dynamic';

export default function ManagementDashboardPage() {
  return (
    <ManagementAuthProvider>
      <ManagementProtectedRoute>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
            <ManagementDashboard />
          </div>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ManagementProtectedRoute>
    </ManagementAuthProvider>
  );
}
