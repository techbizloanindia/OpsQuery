'use client';

import React from 'react';
import ControlPanelDashboard from '@/components/admin/ControlPanelDashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ControlPanelDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']} redirectTo="/control-panel">
      <ControlPanelDashboard />
    </ProtectedRoute>
  );
} 