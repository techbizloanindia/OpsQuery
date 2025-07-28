'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import BranchProtectedRoute from '@/components/auth/BranchProtectedRoute';
import CreditDashboard from '@/components/credit/CreditDashboard';

// Create a client for credit team queries
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

export default function CreditDashboardPage() {
  return (
    <BranchProtectedRoute allowedRoles={['credit']} teamType="credit">
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-100">
          <CreditDashboard />
        </div>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </BranchProtectedRoute>
  );
} 