'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface BranchSyncOptions {
  pollInterval?: number;
  onBranchUpdate?: (branches: any[]) => void;
  enableLogging?: boolean;
}

export function useBranchSync({ 
  pollInterval = 30000, // Increased to 30 seconds to reduce API calls
  onBranchUpdate,
  enableLogging = false 
}: BranchSyncOptions = {}) {
  const { user } = useAuth();
  const lastSyncRef = useRef<string>('');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncCount, setSyncCount] = useState(0);
  const [isFirstSyncComplete, setIsFirstSyncComplete] = useState(false);

  const log = useCallback((message: string, data?: any) => {
    if (enableLogging) {
      console.log(`[BranchSync] ${message}`, data || '');
    }
  }, [enableLogging]);

  const syncBranches = useCallback(async () => {
    if (!user?.employeeId) {
      log('No user available for branch sync');
      return;
    }

    try {
      log(`Syncing branches for user: ${user.employeeId}`);
      setIsConnected(true);
      
      // Fetch current user data from the server
      const response = await fetch(`/api/users/branches/${user.employeeId}?realtime=true&t=${Date.now()}`);
      
      if (!response.ok) {
        log(`Failed to fetch user branches: ${response.status}`);
        setIsConnected(false);
        return;
      }

      const userData = await response.json();
      
      if (userData.success && userData.data) {
        const currentBranchData = JSON.stringify(userData.data);
        
        // Update sync status
        setLastSyncTime(new Date());
        setSyncCount(prev => prev + 1);
        
        // Check if branches have changed
        if (currentBranchData !== lastSyncRef.current) {
          log('Branch data changed, updating localStorage', userData.data);
          
          // Update localStorage
          localStorage.setItem('userBranches', JSON.stringify({
            branches: userData.data,
            lastUpdated: new Date().toISOString(),
            syncCount: Date.now() // Use timestamp instead of state counter
          }));
          
          // Trigger callback if provided
          if (onBranchUpdate) {
            onBranchUpdate(userData.data);
          }
          
          // Update reference
          lastSyncRef.current = currentBranchData;
          
          // Dispatch custom event for other components to listen
          window.dispatchEvent(new CustomEvent('branchesUpdated', {
            detail: { 
              branches: userData.data,
              timestamp: new Date().toISOString(),
              isRealTimeUpdate: true
            }
          }));

          // Branch notification disabled to prevent spam during login
          // Mark first sync as complete
          if (!isFirstSyncComplete) {
            setIsFirstSyncComplete(true);
          }
        } else {
          log('No branch changes detected');
          // Still mark first sync as complete even if no changes
          if (!isFirstSyncComplete) {
            setIsFirstSyncComplete(true);
          }
        }
      }
    } catch (error) {
      log('Error syncing branches:', error);
      setIsConnected(false);
    }
  }, [user?.employeeId, onBranchUpdate, log, isFirstSyncComplete]); // Updated dependencies

  // Initialize sync on mount
  useEffect(() => {
    if (!user?.employeeId) return;

    // Reset first sync flag for new user
    setIsFirstSyncComplete(false);
    // Clear global notification timestamp for new user
    localStorage.removeItem('lastBranchNotification');

    // Initial sync
    syncBranches();

    // Set up polling
    pollIntervalRef.current = setInterval(syncBranches, pollInterval);

    // Listen for window focus events to sync immediately
    const handleFocus = () => {
      log('Window focused, syncing branches');
      syncBranches();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.employeeId, syncBranches, pollInterval, log]);

  // Manual sync function
  const triggerSync = useCallback(() => {
    log('Manual sync triggered');
    return syncBranches();
  }, [syncBranches, log]);

  return {
    triggerSync,
    isEnabled: !!user?.employeeId,
    isConnected,
    lastSyncTime,
    syncCount
  };
}

// Hook for listening to branch updates
export function useBranchUpdateListener(callback: (branches: any[]) => void) {
  useEffect(() => {
    const handleBranchUpdate = (event: CustomEvent) => {
      callback(event.detail.branches);
    };

    window.addEventListener('branchesUpdated', handleBranchUpdate as EventListener);

    return () => {
      window.removeEventListener('branchesUpdated', handleBranchUpdate as EventListener);
    };
  }, [callback]);
}
