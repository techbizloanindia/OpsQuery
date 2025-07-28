/**
 * Real-time Branch Display Component
 * Shows all marked branch codes with real-time updates from admin control panel
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiMapPin, FiRefreshCw, FiWifi, FiWifiOff, FiEye, FiEyeOff } from 'react-icons/fi';

interface BranchInfo {
  branchCode: string;
  branchName: string;
  isActive: boolean;
  city?: string;
  state?: string;
  region?: string;
  assignedAt?: string;
  team?: string;
  enhanced?: boolean;
  source?: string;
  lastUpdated?: Date;
}

interface RealTimeBranchDisplayProps {
  employeeId: string;
  team: 'sales' | 'credit' | 'operations';
  className?: string;
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const RealTimeBranchDisplay: React.FC<RealTimeBranchDisplayProps> = ({
  employeeId,
  team,
  className = '',
  showDetails = false,
  autoRefresh = true,
  refreshInterval = 10000 // 10 seconds
}) => {
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [showDetailView, setShowDetailView] = useState(showDetails);

  // Fetch real-time branch data
  const fetchBranches = useCallback(async () => {
    try {
      setError(null);
      
      const response = await fetch(
        `/api/users/branches/${employeeId}?team=${team}&realtime=true&includeInactive=false`,
        {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setBranches(result.data);
        setIsConnected(true);
        setLastUpdate(new Date());
        
        console.log(`📍 Real-time branch update: ${result.data.length} branches for ${team} team`);
        
        // Log branch codes for debugging
        const branchCodes = result.data.map((b: BranchInfo) => b.branchCode).join(', ');
        console.log(`🏢 Active branch codes: [${branchCodes}]`);
        
      } else {
        console.warn('⚠️ No branch data received:', result.error);
        setError(result.error || 'No branch data available');
      }

    } catch (err: any) {
      console.error('❌ Error fetching real-time branch data:', err);
      setError(err.message || 'Failed to fetch branch data');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, team]);

  // Initial load and auto-refresh setup
  useEffect(() => {
    fetchBranches();

    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        console.log(`🔄 Auto-refreshing branch data for ${team} team...`);
        fetchBranches();
      }, refreshInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchBranches, autoRefresh, refreshInterval]);

  // Manual refresh
  const handleRefresh = () => {
    setIsLoading(true);
    fetchBranches();
  };

  // Toggle detail view
  const toggleDetailView = () => {
    setShowDetailView(!showDetailView);
  };

  // Get team color theme
  const getTeamColors = () => {
    switch (team) {
      case 'sales':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-900',
          accent: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-800',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'credit':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-900',
          accent: 'text-green-600',
          badge: 'bg-green-100 text-green-800',
          button: 'bg-green-600 hover:bg-green-700'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-900',
          accent: 'text-gray-600',
          badge: 'bg-gray-100 text-gray-800',
          button: 'bg-gray-600 hover:bg-gray-700'
        };
    }
  };

  const colors = getTeamColors();

  if (isLoading && branches.length === 0) {
    return (
      <div className={`p-4 ${colors.bg} ${colors.border} border rounded-lg ${className}`}>
        <div className="flex items-center gap-3">
          <FiRefreshCw className="w-5 h-5 animate-spin" />
          <span className={colors.text}>Loading branch assignments...</span>
        </div>
      </div>
    );
  }

  if (error && branches.length === 0) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiWifiOff className="w-5 h-5 text-red-600" />
            <span className="text-red-900">Branch data unavailable</span>
          </div>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiMapPin className={`w-5 h-5 ${colors.accent}`} />
            <div>
              <h3 className={`font-semibold ${colors.text}`}>
                Assigned Branches ({branches.length})
              </h3>
              <p className="text-sm text-gray-500">
                Real-time from admin control panel
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <div className="flex items-center gap-1">
              {isConnected ? (
                <FiWifi className="w-4 h-4 text-green-500" />
              ) : (
                <FiWifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs text-gray-500">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {/* Toggle Detail View */}
            <button
              onClick={toggleDetailView}
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              title={showDetailView ? 'Hide details' : 'Show details'}
            >
              {showDetailView ? (
                <FiEyeOff className="w-4 h-4 text-gray-600" />
              ) : (
                <FiEye className="w-4 h-4 text-gray-600" />
              )}
            </button>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
              title="Refresh branch data"
            >
              <FiRefreshCw className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Branch List */}
      <div className="p-4">
        {branches.length === 0 ? (
          <div className="text-center py-8">
            <FiMapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No branches assigned</p>
          </div>
        ) : (
          <div className={`grid gap-3 ${showDetailView ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
            {branches.map((branch) => (
              <div
                key={branch.branchCode}
                className={`p-3 ${colors.badge} rounded-lg ${showDetailView ? 'space-y-2' : 'text-center'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-lg">
                    {branch.branchCode}
                  </span>
                  {branch.enhanced && (
                    <span className="w-2 h-2 bg-green-500 rounded-full" title="Real-time data" />
                  )}
                </div>
                
                {showDetailView && (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{branch.branchName}</p>
                    {branch.city && (
                      <p className="text-gray-600">{branch.city}, {branch.state}</p>
                    )}
                    {branch.region && (
                      <p className="text-gray-500">Region: {branch.region}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Team: {branch.team || team}</span>
                      <span className={branch.isActive ? 'text-green-600' : 'text-red-600'}>
                        {branch.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                )}
                
                {!showDetailView && (
                  <p className="text-sm font-medium mt-1 truncate" title={branch.branchName}>
                    {branch.branchName}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Footer Info */}
        <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <span>
            Auto-refresh: {autoRefresh ? `${refreshInterval / 1000}s` : 'Off'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RealTimeBranchDisplay;
