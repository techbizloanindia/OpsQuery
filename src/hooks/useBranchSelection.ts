'use client';

import { useState, useEffect, useCallback } from 'react';

interface SelectedBranch {
  branchCode: string;
  branchName: string;
  branchAddress?: string;
  city?: string;
  state?: string;
  region?: string;
  zone?: string;
  isActive?: boolean;
  selectedAt?: string;
  teamType?: 'sales' | 'credit';
  userName?: string; // User's name
  availableBranches?: Array<{
    branchCode: string;
    branchName: string;
    city?: string;
    state?: string;
    isActive?: boolean;
  }>;
  expiresAt?: number;
  lastUpdated?: string;
}

export const useBranchSelection = () => {
  const [selectedBranch, setSelectedBranch] = useState<SelectedBranch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load branch selection from localStorage
  const loadBranchSelection = useCallback(() => {
    try {
      const storedBranch = localStorage.getItem('selectedBranch');
      if (storedBranch) {
        const branchData = JSON.parse(storedBranch);
        
        // Check if the stored data is still valid (not expired)
        if (branchData.expiresAt && Date.now() > branchData.expiresAt) {
          console.log('📅 Stored branch selection has expired, clearing...');
          localStorage.removeItem('selectedBranch');
          setSelectedBranch(null);
        } else {
          setSelectedBranch(branchData);
        }
      }
    } catch (error) {
      console.error('Error parsing selected branch:', error);
      localStorage.removeItem('selectedBranch');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateBranchSelection = useCallback((branchData: Partial<SelectedBranch> & { branchCode: string; branchName: string }) => {
    const branch: SelectedBranch = {
      ...branchData,
      selectedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // Expire after 24 hours
    };
    
    localStorage.setItem('selectedBranch', JSON.stringify(branch));
    setSelectedBranch(branch);
    
    // Dispatch event for other components to listen
    window.dispatchEvent(new CustomEvent('branchSelectionUpdated', {
      detail: { selectedBranch: branch }
    }));
  }, []);

  useEffect(() => {
    loadBranchSelection();

    // Listen for branch updates from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedBranch') {
        console.log('🔄 Branch selection changed in another tab, updating...');
        loadBranchSelection();
      }
    };

    // Listen for custom branch update events
    const handleBranchUpdate = (event: CustomEvent) => {
      // Get current branch from localStorage to avoid dependency loop
      const storedBranch = localStorage.getItem('selectedBranch');
      if (storedBranch && event.detail.branches) {
        try {
          const currentBranch = JSON.parse(storedBranch);
          const updatedBranch = event.detail.branches.find(
            (b: any) => b.branchCode === currentBranch.branchCode
          );
          
          if (updatedBranch && JSON.stringify(updatedBranch) !== JSON.stringify(currentBranch)) {
            console.log('🔄 Current branch data updated, refreshing selection...');
            updateBranchSelection({
              ...currentBranch,
              ...updatedBranch,
              lastUpdated: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error parsing stored branch for update:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('branchesUpdated', handleBranchUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('branchesUpdated', handleBranchUpdate as EventListener);
    };
  }, [loadBranchSelection]);

  const clearBranchSelection = useCallback(() => {
    localStorage.removeItem('selectedBranch');
    setSelectedBranch(null);
    
    // Dispatch event for other components to listen
    window.dispatchEvent(new CustomEvent('branchSelectionCleared'));
  }, []);

  const switchToBranch = useCallback((branchCode: string) => {
    if (selectedBranch?.availableBranches) {
      const newBranch = selectedBranch.availableBranches.find(
        branch => branch.branchCode === branchCode
      );
      
      if (newBranch) {
        const updatedSelection = {
          ...selectedBranch,
          branchCode: newBranch.branchCode,
          branchName: newBranch.branchName,
          city: newBranch.city,
          state: newBranch.state,
          isActive: newBranch.isActive,
          selectedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        };
        
        localStorage.setItem('selectedBranch', JSON.stringify(updatedSelection));
        setSelectedBranch(updatedSelection);
        
        // Dispatch event for other components to listen
        window.dispatchEvent(new CustomEvent('branchSelectionUpdated', {
          detail: { selectedBranch: updatedSelection }
        }));
      }
    }
  }, [selectedBranch]);

  // Enhanced selectBranch method
  const selectBranch = useCallback((branchData: {
    id?: string;
    name: string;
    code: string;
    city?: string;
    state?: string;
    region?: string;
    zone?: string;
    teamType: 'sales' | 'credit';
    selectedAt: string;
    availableBranches?: any[];
  }) => {
    const branch: SelectedBranch = {
      branchCode: branchData.code,
      branchName: branchData.name,
      city: branchData.city,
      state: branchData.state,
      region: branchData.region,
      zone: branchData.zone,
      selectedAt: branchData.selectedAt,
      lastUpdated: new Date().toISOString(),
      teamType: branchData.teamType,
      availableBranches: branchData.availableBranches,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // Expire after 24 hours
    };
    
    localStorage.setItem('selectedBranch', JSON.stringify(branch));
    setSelectedBranch(branch);
    
    // Dispatch event for other components to listen
    window.dispatchEvent(new CustomEvent('branchSelectionUpdated', {
      detail: { selectedBranch: branch }
    }));
  }, []);

  // Refresh current branch data
  const refreshBranchData = useCallback(async () => {
    if (!selectedBranch) return;

    try {
      // Trigger a branch sync to get latest data
      window.dispatchEvent(new CustomEvent('refreshBranchData', {
        detail: { branchCode: selectedBranch.branchCode }
      }));
    } catch (error) {
      console.error('Error refreshing branch data:', error);
    }
  }, [selectedBranch]);

  return {
    selectedBranch,
    isLoading,
    clearBranchSelection,
    updateBranchSelection,
    switchToBranch,
    selectBranch,
    refreshBranchData,
    hasBranchSelected: !!selectedBranch,
    hasMultipleBranches: !!(selectedBranch?.availableBranches && selectedBranch.availableBranches.length > 1),
    isExpired: selectedBranch ? (selectedBranch.expiresAt && Date.now() > selectedBranch.expiresAt) : false
  };
};
