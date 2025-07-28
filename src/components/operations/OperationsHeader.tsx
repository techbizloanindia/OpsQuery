'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaSignOutAlt, FaSync, FaBell } from 'react-icons/fa';
import NotificationButton from '../shared/NotificationButton';

interface OperationsHeaderProps {
  onRefresh?: () => void;
  lastRefreshed?: Date;
  newQueriesCount?: number;
}

export default function OperationsHeader({ 
  onRefresh, 
  lastRefreshed,
  newQueriesCount = 0 
}: OperationsHeaderProps) {
  const { user, logout } = useAuth();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Format last updated time
  const formatLastUpdated = () => {
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Update last updated time every second
  useEffect(() => {
    const interval = setInterval(() => {
      // Don't update state here, just force a re-render
      const forceUpdate = Date.now();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Update timestamp when refresh is called or lastRefreshed changes
  useEffect(() => {
    if (lastRefreshed) {
      setLastUpdated(lastRefreshed);
    }
  }, [lastRefreshed]);



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
    <header className="bg-gradient-to-r from-cyan-700 to-cyan-600 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Operations Dashboard</h1>
          <div className="flex items-center gap-2 text-sm text-cyan-100 mt-1">
            <span>Welcome, {user?.name || user?.employeeId || 'Operations User'}</span>
            <span>•</span>
            <span className="flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-medium">
              👤 Multiple
            </span>
            {user?.employeeId && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-medium">
                  🆔 {user.employeeId}
                </span>
              </>
            )}
            {user?.branch && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-medium">
                  🏢 {user.branch} {user.branchCode && `(${user.branchCode})`}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Manual refresh control */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-cyan-100">Last updated: {formatLastUpdated()}</span>
            
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-cyan-100 text-cyan-700 border border-cyan-300 hover:bg-cyan-200"
              >
                <FaSync />
                Refresh
              </button>
            )}
          </div>

          {/* Notification Button */}
          <NotificationButton team="Operations" />

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-white hover:text-cyan-100 hover:bg-cyan-600 rounded-lg transition-colors"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </div>

      {newQueriesCount > 0 && (
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-800 rounded-lg">
          <FaBell className="animate-pulse" />
          <span className="font-medium">{newQueriesCount} New Quer{newQueriesCount > 1 ? 'ies' : 'y'}</span>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Logout
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to logout from the Operations Dashboard?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <FaSignOutAlt />
                Yes, Logout
              </button>
              <button
                onClick={cancelLogout}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
