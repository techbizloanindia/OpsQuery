/**
 * OpsQuery - Sales Dashboard Component
 * Copyright (c) 2024 OpsQuery Development Team
 * 
 * Licensed under the MIT License.
 * 
 * @fileoverview Sales Dashboard - Main interface for Sales team with My Queries and Query Resolved sections
 * @author OpsQuery Development Team
 * @version 2.0.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiRefreshCw, 
  FiClock, 
  FiCheckCircle, 
  FiMessageSquare,
  FiFilter,
  FiTrendingUp,
  FiBarChart,
  FiUser,
  FiBell,
  FiMapPin
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchSelection } from '@/hooks/useBranchSelection';
import { useBranchSync, useBranchUpdateListener } from '@/hooks/useBranchSync';
import { useRealTimeMessages } from '@/hooks/useRealTimeMessages';
import SalesNavbar from './SalesNavbar';
import MyQueries from './MyQueries';
import QueryResolved from './QueryResolved';
import LoadingState from '../operations/LoadingState';
import ErrorState from '../operations/ErrorState';
import RealTimeBranchIndicator from '../shared/RealTimeBranchIndicator';
import RealTimeBranchDisplay from '../shared/RealTimeBranchDisplay';

export type SalesTabType = 'query-raised' | 'query-resolved';

interface QueryData {
  id: number;
  appNo: string;
  queries: Array<{
    id: string;
    text: string;
    status: 'pending' | 'approved' | 'deferred' | 'otc' | 'resolved';
    timestamp: string;
    sender: string;
    senderRole: string;
  }>;
  sendTo: string[];
  sendToSales: boolean;
  sendToCredit: boolean;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'deferred' | 'otc' | 'resolved';
  customerName: string;
  branch: string;
  branchCode: string;
  lastUpdated: string;
  markedForTeam: string;
}

interface DashboardStats {
  myQueries: number;
  resolved: number;
  pending: number;
  totalToday: number;
}

interface AssignedBranch {
  branchCode: string;
  branchName: string;
  assignedAt?: string;
  team?: string;
  isActive?: boolean;
}

const SalesDashboard: React.FC = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranchSelection();
  
  // State management
  const [activeTab, setActiveTab] = useState<SalesTabType>('query-raised');
  const [queries, setQueries] = useState<QueryData[]>([]);
  const [assignedBranches, setAssignedBranches] = useState<AssignedBranch[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    myQueries: 0,
    resolved: 0,
    pending: 0,
    totalToday: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Branch update callback - memoized to prevent infinite loops
  const handleBranchUpdate = useCallback((branches: any[]) => {
    // Only update if branch count actually changed
    const currentBranchCount = assignedBranches.length;
    if (branches.length !== currentBranchCount) {
      setRefreshTrigger(prev => prev + 1);
      
      // Store the branch count for reference (removed toast notification - handled by useBranchSync)
      sessionStorage.setItem('lastSalesBranchCount', branches.length.toString());
    }
  }, [assignedBranches.length]);

  // Initialize real-time branch synchronization with optimized polling
  const { triggerSync, isConnected, lastSyncTime } = useBranchSync({
    pollInterval: 30000, // Increased to 30 seconds to reduce server load
    enableLogging: false, // Disabled logging to reduce console spam
    onBranchUpdate: handleBranchUpdate
  });

  // Listen for branch updates from other sources - memoized callback
  const handleBranchUpdateNotification = useCallback((branches: any[]) => {
    // Reduced logging to prevent spam
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useBranchUpdateListener(handleBranchUpdateNotification);

  // Real-time messaging for Sales team
  const handleNewMessage = useCallback((message: any) => {
    console.log('📨 Sales Dashboard: New message received', message);
    // Refresh queries when new messages arrive
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useRealTimeMessages({
    enabled: true,
    team: 'sales',
    pollInterval: 8000, // Check every 8 seconds for real-time feel
    onNewMessage: handleNewMessage
  });

  // Fetch user's assigned branches directly from database - REAL DATA ONLY
  const fetchAssignedBranches = useCallback(async () => {
    if (!user?.employeeId) return [];

    try {
      // Always fetch fresh data from database - NO CACHING
      const response = await fetch(`/api/users/branches/${user.employeeId}?team=sales&realtime=true&nocache=true`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        // Use real branch assignments from database
        const realBranches = result.data.map((branch: any) => ({
          branchCode: branch.branchCode,
          branchName: branch.branchName,
          assignedAt: branch.assignedAt,
          team: 'sales',
          isActive: branch.isActive !== false
        }));
        
        setAssignedBranches(realBranches);
        
        return realBranches;
      } else {
        setAssignedBranches([]);
        return [];
      }
    } catch (error) {
      console.error('Error fetching branch assignments:', error);
      setAssignedBranches([]);
      return [];
    }
  }, [user?.employeeId]);

  // Fetch queries with branch and team filtering - ALWAYS FRESH DATA
  const fetchQueries = useCallback(async () => {
    try {
      setError(null);
      
      // Always get fresh branch assignments from database first
      const userBranches = await fetchAssignedBranches();
      
      // Build query parameters for sales team
      const params = new URLSearchParams({
        team: 'sales'
      });

      // Add branch filtering based on REAL assigned branches from database
      if (userBranches.length > 0) {
        const branchCodes = userBranches.map((b: any) => b.branchCode).filter(Boolean);
        if (branchCodes.length > 0) {
          params.append('branches', branchCodes.join(','));
        }
      }

      const response = await fetch(`/api/queries?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        const salesQueries = result.data || [];
        setQueries(salesQueries);
        
        console.log(`📊 Sales Dashboard: Loaded ${salesQueries.length} queries for branches [${userBranches.map((b: any) => b.branchCode).join(', ')}]`);
        
        // Calculate stats
        const pendingQueries = salesQueries.filter((q: QueryData) => 
          q.status === 'pending' || q.queries.some(query => query.status === 'pending')
        );
        
        const resolvedQueries = salesQueries.filter((q: QueryData) => 
          q.status === 'resolved' || q.queries.some(query => query.status === 'resolved')
        );

        // Get today's queries
        const today = new Date().toDateString();
        const todayQueries = salesQueries.filter((q: QueryData) => 
          new Date(q.submittedAt).toDateString() === today
        );

        setStats({
          myQueries: salesQueries.length,
          resolved: resolvedQueries.length,
          pending: pendingQueries.length,
          totalToday: todayQueries.length
        });

        console.log('✅ Sales Dashboard: Loaded queries successfully', {
          total: salesQueries.length,
          pending: pendingQueries.length,
          resolved: resolvedQueries.length,
          branches: userBranches.length
        });
      } else {
        throw new Error(result.error || 'Failed to fetch queries');
      }
    } catch (error) {
      console.warn('Sales Dashboard: Error fetching queries:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load sales queries';
      setError(`Unable to load queries: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fetchAssignedBranches]); // Depends on fetchAssignedBranches since we call it

  // Initial load and real-time updates - Fixed to prevent infinite loops
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (!mounted || !user?.employeeId) return;
      
      try {
        // First load branches
        const branches = await fetchAssignedBranches();
        if (!mounted) return;
        
        // Then load queries only if we have branches or want to show empty state
        await fetchQueries();
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        if (mounted) {
          setError('Failed to load dashboard data. Please refresh the page.');
        }
      }
    };

    loadData();
    
    // Set up auto-refresh with reasonable interval to balance real-time updates and performance
    const interval = setInterval(() => {
      if (mounted && user?.employeeId) {
        fetchQueries(); // Refresh queries for updates
      }
    }, 30000); // Increased to 30 seconds to reduce server load

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user?.employeeId]); // Only depend on user.employeeId to prevent infinite loops

  // Separate effect to fetch queries when branches change
  useEffect(() => {
    if (assignedBranches.length > 0) {
      fetchQueries();
    }
  }, [assignedBranches, fetchQueries]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLastRefreshed(new Date());
    setRefreshTrigger(prev => prev + 1);
    await fetchAssignedBranches();
    await fetchQueries();
  };

  // Tab change handler
  const handleTabChange = (tab: SalesTabType) => {
    setActiveTab(tab);
  };

  // Render active tab content
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'query-raised':
        return (
          <MyQueries
            key={refreshTrigger}
            queries={queries
              .filter(q => q.status === 'pending' || q.queries.some(query => query.status === 'pending'))
              .map(q => ({
                id: q.id,
                appNo: q.appNo,
                customerName: q.customerName,
                priority: 'medium' as const,
                status: q.status,
                team: q.markedForTeam || 'sales',
                sendToSales: q.sendToSales,
                sendToCredit: q.sendToCredit,
                markedForTeam: q.markedForTeam,
                branchCode: q.branchCode,
                submittedAt: q.submittedAt,
                description: q.queries[0]?.text || 'No description available'
              }))}
            isLoading={isLoading}
          />
        );
      case 'query-resolved':
        return (
          <QueryResolved
            key={refreshTrigger}
            queries={queries
              .filter(q => q.status === 'resolved' || q.queries.some(query => query.status === 'resolved'))
              .map(q => ({
                id: q.id,
                appNo: q.appNo,
                customerName: q.customerName,
                priority: 'medium' as const,
                status: q.status,
                team: q.markedForTeam || 'sales',
                sendToSales: q.sendToSales,
                sendToCredit: q.sendToCredit,
                markedForTeam: q.markedForTeam,
                branchCode: q.branchCode,
                submittedAt: q.submittedAt,
                description: q.queries[0]?.text || 'No description available'
              }))}
            isLoading={isLoading}
          />
        );
      default:
        return (
          <MyQueries 
            key={refreshTrigger}
            queries={queries
              .filter(q => q.status === 'pending' || q.queries.some(query => query.status === 'pending'))
              .map(q => ({
                id: q.id,
                appNo: q.appNo,
                customerName: q.customerName,
                priority: 'medium' as const,
                status: q.status,
                team: q.markedForTeam || 'sales',
                sendToSales: q.sendToSales,
                sendToCredit: q.sendToCredit,
                markedForTeam: q.markedForTeam,
                branchCode: q.branchCode,
                submittedAt: q.submittedAt,
                description: q.queries[0]?.text || 'No description available'
              }))}
            isLoading={isLoading}
          />
        );
    }
  };

  // Loading state
  if (isLoading) {
    return <LoadingState message="Loading Sales Dashboard..." />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState 
        message={error}
        onRetry={handleRefresh}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <SalesNavbar 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          stats={{
            pendingQueries: stats.pending,
            resolvedQueries: stats.resolved,
            totalToday: stats.totalToday
          }}
          onRefresh={handleRefresh}
          lastRefreshed={lastRefreshed}
        />



        {/* Real-time Branch Display Section */}


        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 min-h-96">
          {renderActiveTab()}
        </div>
      </div>


    </div>
  );
};

export default SalesDashboard; 