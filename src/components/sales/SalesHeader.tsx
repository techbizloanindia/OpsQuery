/**
 * OpsQuery - Sales Header Component
 * Copyright (c) 2024 OpsQuery Development Team
 * 
 * Licensed under the MIT License.
 * 
 * @fileoverview Sales Header - Dashboard header with stats and controls
 * @author OpsQuery Development Team
 * @version 2.0.0
 */

'use client';

import React from 'react';
import { 
  FiUser, 
  FiLogOut,
  FiHome,
  FiTrendingUp,
  FiRefreshCw,
  FiClock,
  FiBell
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchSelection } from '@/hooks/useBranchSelection';
import NotificationButton from '@/components/shared/NotificationButton';

interface SalesHeaderProps {
  stats: {
    totalQueries: number;
    pendingQueries: number;
    resolvedQueries: number;
    totalToday: number;
  };
  onRefresh: () => void;
  isRefreshing: boolean;
  lastRefreshed: Date;
}

const SalesHeader: React.FC<SalesHeaderProps> = ({
  stats,
  onRefresh,
  isRefreshing,
  lastRefreshed
}) => {
  const { user, logout } = useAuth();
  const { selectedBranch } = useBranchSelection();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sales Dashboard</h1>
                <p className="text-sm text-gray-500">Manage sales queries and applications</p>
              </div>
            </div>

            {/* Enhanced Real-time Branch Info */}
            {selectedBranch && (
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg border-2 border-blue-300 transform hover:scale-105 transition-all duration-200">
                <div className="relative">
                  <FiHome className="w-5 h-5" />
                  {/* Real-time pulse indicator */}
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold tracking-wider">
                    {selectedBranch.branchCode}
                  </div>
                  <div className="text-xs text-blue-100 flex items-center gap-1">
                    <span className="w-1 h-1 bg-green-300 rounded-full animate-pulse"></span>
                    Live Branch • Sales
                  </div>
                </div>
                {/* Branch name on larger screens */}
                <div className="hidden lg:block text-right">
                  <div className="text-sm font-medium truncate max-w-32">
                    {selectedBranch.branchName}
                  </div>
                  <div className="text-xs text-blue-100">
                    {selectedBranch.city && `${selectedBranch.city}`}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Center - Quick Stats */}
          <div className="hidden lg:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm">
              <FiTrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-gray-600">Total:</span>
              <span className="font-semibold text-blue-600">{stats.totalQueries}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <FiClock className="w-4 h-4 text-orange-600" />
              <span className="text-gray-600">Pending:</span>
              <span className="font-semibold text-orange-600">{stats.pendingQueries}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <FiTrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-gray-600">Resolved:</span>
              <span className="font-semibold text-green-600">{stats.resolvedQueries}</span>
            </div>
          </div>

          {/* Right side - Actions and user */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <NotificationButton 
              team="Sales"
            />

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh data"
            >
              <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {/* Last Refreshed */}
            <div className="hidden md:flex items-center space-x-2 text-xs text-gray-500">
              <FiClock className="w-3 h-3" />
              <span>Updated: {lastRefreshed.toLocaleTimeString()}</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">Sales Team</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiUser className="w-4 h-4 text-blue-600" />
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <FiLogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SalesHeader; 