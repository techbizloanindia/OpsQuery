/**
 * OpsQuery - Credit Navbar Component
 * Copyright (c) 2024 OpsQuery Development Team
 *
 * Licensed under the MIT License.
 *
 * @fileoverview Credit Navbar - Navigation tabs for credit dashboard
 * @author OpsQuery Development Team
 * @version 2.0.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiClock, FiCheckCircle, FiTrendingUp, FiMapPin, FiRefreshCw, FiLogOut, FiBell } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchUpdateListener } from '@/hooks/useBranchSync';
import BranchDisplayModal from '@/components/shared/BranchDisplayModal';

interface CreditNavbarProps {
  activeTab: 'query-raised' | 'query-resolved';
  onTabChange: (tab: 'query-raised' | 'query-resolved') => void;
  stats: {
    pendingQueries: number;
    resolvedQueries: number;
    totalToday: number;
  };
  onRefresh?: () => void;
  lastRefreshed?: Date;
}

const CreditNavbar: React.FC<CreditNavbarProps> = ({
  activeTab,
  onTabChange,
  stats,
  onRefresh,
  lastRefreshed
}) => {
  const { user, logout } = useAuth();
  const [assignedBranches, setAssignedBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Listen for branch updates
  useBranchUpdateListener((branches) => {
    console.log('🔄 Credit Navbar: Received branch update notification');
    fetchBranches();
  });

  // Fetch assigned branches count with real-time data
  const fetchBranches = useCallback(async () => {
    if (!user?.employeeId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/users/branches/${user.employeeId}?team=credit&realtime=true`);
      const result = await response.json();

      if (result.success && result.data) {
        setAssignedBranches(result.data);
        console.log(`📊 Credit Navbar: Updated with ${result.count} real-time branches`);
      }
    } catch (error) {
      console.error('Error fetching branches for navbar:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.employeeId]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Format last updated time
  const formatLastUpdated = () => {
    if (!lastRefreshed) return 'Never';
    const now = new Date();
    const diff = now.getTime() - lastRefreshed.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-600 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Credit Dashboard</h1>
            <div className="flex items-center gap-2 text-sm text-blue-100 mt-1">
              <span>Welcome, {user?.name || user?.employeeId || 'Credit User'}</span>
              <span>•</span>
              <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                👤 Credit Team
              </span>
              {user?.employeeId && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    🆔 {user.employeeId}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Manual refresh control */}
            <div className="flex items-center gap-3 text-sm">
              <span className="text-blue-100">
                Last updated: {formatLastUpdated()}
              </span>
              
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 
                           text-white rounded-lg transition-all duration-200 text-sm"
                  title="Refresh dashboard data"
                >
                  <FiRefreshCw className="w-3 h-3" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              )}
            </div>

            {/* Assigned Branches Button */}
            <button
              onClick={() => setShowBranchModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 
                       text-white rounded-lg transition-all duration-200 text-sm"
              title="View assigned branches"
            >
              <FiMapPin className="w-4 h-4" />
              <span className="hidden sm:inline">
                {assignedBranches.length > 0 ? `${assignedBranches.length} Branches` : 'Branches'}
              </span>
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 
                       text-white rounded-lg transition-all duration-200 text-sm"
              title="Logout"
            >
              <FiLogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              {/* Query Raised Tab */}
              <button
                onClick={() => onTabChange('query-raised')}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'query-raised'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiClock className="w-4 h-4" />
                <span>Query Raised</span>
                {stats.pendingQueries > 0 && (
                  <span className="ml-2 bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {stats.pendingQueries}
                  </span>
                )}
              </button>

              {/* Query Resolved Tab */}
              <button
                onClick={() => onTabChange('query-resolved')}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'query-resolved'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiCheckCircle className="w-4 h-4" />
                <span>Query Resolved</span>
                {stats.resolvedQueries > 0 && (
                  <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {stats.resolvedQueries}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <FiTrendingUp className="w-4 h-4 text-blue-600" />
                <span>Today: <span className="font-medium text-blue-600">{stats.totalToday}</span></span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Branch Display Modal */}
      <BranchDisplayModal
        isOpen={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        branches={assignedBranches}
        userRole="credit"
        userName={user?.name || user?.employeeId}
        employeeId={user?.employeeId}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to logout from the Credit Dashboard?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreditNavbar; 