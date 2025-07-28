'use client';

import React from 'react';
import ControlPanelDashboard from '@/components/admin/ControlPanelDashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { BranchProvider } from '@/contexts/BranchContext';

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <BranchProvider>
        <ControlPanelDashboard />
      </BranchProvider>
    </ProtectedRoute>
  );
} 