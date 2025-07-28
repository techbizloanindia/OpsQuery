'use client';

import React from 'react';
import ManagementNavbar from '@/components/management/ManagementNavbar';
import ApprovalQueries from '@/components/management/ApprovalQueries';
import ManagementProtectedRoute from '@/components/auth/ManagementProtectedRoute';

const ApprovalPage: React.FC = () => {
  return (
    <ManagementProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <ManagementNavbar />
        <div className="pt-16">
          <ApprovalQueries />
        </div>
      </div>
    </ManagementProtectedRoute>
  );
};

export default ApprovalPage;
