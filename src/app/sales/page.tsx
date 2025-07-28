'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import BranchProtectedRoute from '@/components/auth/BranchProtectedRoute';
import SalesDashboard from '@/components/sales/SalesDashboard';

// Create a client for sales team queries
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

export default function SalesPage() {
  return (
    <BranchProtectedRoute allowedRoles={['sales']} teamType="sales">
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-100">
          <SalesDashboard />
        </div>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </BranchProtectedRoute>
  );
} 