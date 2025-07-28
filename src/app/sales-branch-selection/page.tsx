'use client';

import React from 'react';
import BranchSelection from '@/components/shared/BranchSelection';

export default function SalesBranchSelectionPage() {
  return (
    <BranchSelection 
      allowedRoles={['sales']}
      teamType="sales" 
    />
  );
}
