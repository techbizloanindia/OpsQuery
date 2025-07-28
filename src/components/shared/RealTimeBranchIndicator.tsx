/**
 * OpsQuery - Real-time Branch Indicator Component
 * Copyright (c) 2024 OpsQuery Development Team
 * 
 * Licensed under the MIT License.
 * 
 * @fileoverview Real-time Branch Indicator - Floating component showing current branch with real-time updates
 * @author OpsQuery Development Team
 * @version 2.0.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiMapPin, 
  FiWifi, 
  FiWifiOff, 
  FiRefreshCw, 
  FiClock,
  FiChevronDown,
  FiChevronUp,
  FiActivity,
  FiHome
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchSelection } from '@/hooks/useBranchSelection';
import { useBranchSync } from '@/hooks/useBranchSync';

interface RealTimeBranchIndicatorProps {
  teamType: 'sales' | 'credit';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  isMinimizable?: boolean;
}

const RealTimeBranchIndicator: React.FC<RealTimeBranchIndicatorProps> = ({
  teamType,
  position = 'top-right',
  isMinimizable = true
}) => {
  const { user } = useAuth();
  const { selectedBranch, refreshBranchData } = useBranchSelection();
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isUpdating, setIsUpdating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'updating'>('online');
  const [updateCount, setUpdateCount] = useState(0);

  // Initialize real-time branch synchronization
  const { triggerSync, isConnected, lastSyncTime } = useBranchSync({
    pollInterval: 15000, // Update every 15 seconds for real-time feel
    enableLogging: true,
    onBranchUpdate: (branches) => {
      console.log('🔄 Real-time Branch Indicator: Branch data updated');
      setLastUpdate(new Date());
      setUpdateCount(prev => prev + 1);
      setIsUpdating(true);
      
      // Stop updating animation after 1 second
      setTimeout(() => setIsUpdating(false), 1000);
    }
  });

  // Update connection status based on sync status
  useEffect(() => {
    if (isUpdating) {
      setConnectionStatus('updating');
    } else if (isConnected) {
      setConnectionStatus('online');
    } else {
      setConnectionStatus('offline');
    }
  }, [isConnected, isUpdating]);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    setIsUpdating(true);
    setConnectionStatus('updating');
    
    try {
      await Promise.all([
        triggerSync(),
        refreshBranchData()
      ]);
      setLastUpdate(new Date());
      setUpdateCount(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing branch data:', error);
    } finally {
      setTimeout(() => {
        setIsUpdating(false);
        setConnectionStatus(isConnected ? 'online' : 'offline');
      }, 1000);
    }
  }, [triggerSync, refreshBranchData, isConnected]);

  // Auto-refresh on mount and when component becomes visible
  useEffect(() => {
    if (selectedBranch && user) {
      handleRefresh();
    }
  }, [selectedBranch?.branchCode, user?.employeeId, handleRefresh]);

  if (!selectedBranch || !user) {
    return null;
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const getTeamColors = () => {
    return teamType === 'sales' 
      ? {
          bg: 'bg-blue-500',
          bgLight: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          textLight: 'text-blue-600',
          accent: 'text-blue-500'
        }
      : {
          bg: 'bg-green-500',
          bgLight: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          textLight: 'text-green-600',
          accent: 'text-green-500'
        };
  };

  const colors = getTeamColors();

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'updating':
        return <FiRefreshCw className={`w-3 h-3 animate-spin ${colors.accent}`} />;
      case 'offline':
        return <FiWifiOff className="w-3 h-3 text-red-500" />;
      default:
        return <FiWifi className={`w-3 h-3 ${colors.accent}`} />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'updating':
        return 'Updating...';
      case 'offline':
        return 'Offline';
      default:
        return 'Live';
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50 transition-all duration-300 ${isMinimized ? 'w-16' : 'w-64'}`}>
      {/* Main Indicator Card */}
      <div className={`${colors.bgLight} backdrop-blur-sm ${colors.border} border-2 rounded-xl shadow-lg transition-all duration-300 ${
        isUpdating ? 'animate-pulse ring-2 ring-opacity-50 ring-blue-400' : ''
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 ${colors.bg} rounded-lg flex items-center justify-center ${isUpdating ? 'animate-bounce' : ''}`}>
              <FiHome className="w-3 h-3 text-white" />
            </div>
            {!isMinimized && (
              <div className="flex flex-col">
                <span className={`text-xs font-medium ${colors.text}`}>
                  {teamType.charAt(0).toUpperCase() + teamType.slice(1)} Branch
                </span>
                <span className="text-xs text-gray-500">Real-time</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {/* Connection Status */}
            <div className="flex items-center gap-1">
              {getConnectionIcon()}
              {!isMinimized && (
                <span className={`text-xs font-medium ${
                  connectionStatus === 'offline' ? 'text-red-500' : colors.textLight
                }`}>
                  {getStatusText()}
                </span>
              )}
            </div>
            
            {/* Minimize/Maximize Button */}
            {isMinimizable && (
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className={`p-1 hover:bg-gray-200 rounded transition-colors ${colors.textLight}`}
              >
                {isMinimized ? (
                  <FiChevronDown className="w-3 h-3" />
                ) : (
                  <FiChevronUp className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Branch Code Display */}
        {!isMinimized && (
          <div className="px-3 pb-3">
            {/* Branch Code - Large Display */}
            <div className="text-center mb-3">
              <div className={`inline-flex items-center gap-2 px-4 py-2 ${colors.bg} text-white rounded-lg shadow-md ${
                isUpdating ? 'animate-pulse' : ''
              }`}>
                <FiMapPin className="w-4 h-4" />
                <span className="text-lg font-bold tracking-wider">
                  {selectedBranch.branchCode}
                </span>
              </div>
            </div>

            {/* Branch Details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Name:</span>
                <span className={`font-medium ${colors.text} truncate ml-2`}>
                  {selectedBranch.branchName}
                </span>
              </div>
              
              {selectedBranch.city && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Location:</span>
                  <span className={`font-medium ${colors.text}`}>
                    {selectedBranch.city}
                    {selectedBranch.state && `, ${selectedBranch.state}`}
                  </span>
                </div>
              )}

              {/* Last Update Info */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200">
                <div className="flex items-center gap-1">
                  <FiClock className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-500">Updated:</span>
                </div>
                <span className="text-gray-600 font-mono">
                  {lastUpdate.toLocaleTimeString()}
                </span>
              </div>

              {/* Update Count */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <FiActivity className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-500">Updates:</span>
                </div>
                <span className={`font-medium ${colors.textLight}`}>
                  {updateCount}
                </span>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isUpdating}
              className={`w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 ${colors.bg} text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <FiRefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
              <span className="text-xs font-medium">
                {isUpdating ? 'Updating...' : 'Refresh'}
              </span>
            </button>
          </div>
        )}

        {/* Minimized View - Just Show Branch Code */}
        {isMinimized && (
          <div className="px-2 pb-2">
            <div className={`text-center ${colors.bg} text-white rounded-lg py-1 ${
              isUpdating ? 'animate-pulse' : ''
            }`}>
              <span className="text-sm font-bold tracking-wider">
                {selectedBranch.branchCode}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Update Pulse Animation */}
      {isUpdating && !isMinimized && (
        <div className={`absolute inset-0 ${colors.bg} opacity-20 rounded-xl animate-ping pointer-events-none`}></div>
      )}
    </div>
  );
};

export default RealTimeBranchIndicator;
