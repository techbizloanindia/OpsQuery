'use client';

import React from 'react';
import BranchSelection from '@/components/shared/BranchSelection';

export default function CreditBranchSelectionPage() {
  return (
    <BranchSelection 
      allowedRoles={['credit']}
      teamType="credit" 
    />
  );
}
