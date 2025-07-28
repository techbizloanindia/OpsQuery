/**
 * OpsQuery - Branch Display Modal Component
 * Copyright (c) 2024 OpsQuery Development Team
 * 
 * Licensed under the MIT License.
 * 
 * @fileoverview Branch Display Modal - Modern, responsive modal for assigned branches
 * @author OpsQuery Development Team
 * @version 3.0.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiMapPin, FiBriefcase, FiCalendar, FiCheck, FiRefreshCw, FiUsers, FiActivity } from 'react-icons/fi';

interface AssignedBranch {
  branchCode: string;
  branchName: string;
  assignedAt?: string;
  team?: string;
  isActive?: boolean;
}

interface BranchDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: AssignedBranch[];
  userRole: 'sales' | 'credit' | 'operations';
  userName?: string;
  employeeId?: string;
}

const BranchDisplayModal: React.FC<BranchDisplayModalProps> = ({
  isOpen,
  onClose,
  branches: initialBranches,
  userRole,
  userName,
  employeeId
}) => {
  const [branches, setBranches] = useState(initialBranches);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Real-time branch data refresh
  const refreshBranches = async () => {
    if (!employeeId) return;
    
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/users/branches/${employeeId}?team=${userRole}&realtime=true&nocache=${Date.now()}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setBranches(result.data);
          setLastUpdated(new Date());
          console.log(`✅ Refreshed ${result.data.length} branches for ${userRole} user`);
        }
      }
    } catch (error) {
      console.error('Error refreshing branches:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh every 30 seconds when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(refreshBranches, 30000);
    return () => clearInterval(interval);
  }, [isOpen, employeeId, userRole]);

  // Update branches when props change
  useEffect(() => {
    setBranches(initialBranches);
  }, [initialBranches]);

  if (!isOpen) return null;

  const getThemeColors = () => {
    switch (userRole) {
      case 'sales':
        return {
          primary: 'blue',
          bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600',
          header: 'bg-gradient-to-r from-blue-600 to-blue-700',
          accent: 'bg-blue-100',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'credit':
        return {
          primary: 'green',
          bg: 'bg-gradient-to-br from-green-50 to-green-100',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: 'text-green-600',
          header: 'bg-gradient-to-r from-green-600 to-green-700',
          accent: 'bg-green-100',
          button: 'bg-green-600 hover:bg-green-700'
        };
      default:
        return {
          primary: 'cyan',
          bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100',
          border: 'border-cyan-200',
          text: 'text-cyan-800',
          icon: 'text-cyan-600',
          header: 'bg-gradient-to-r from-cyan-600 to-cyan-700',
          accent: 'bg-cyan-100',
          button: 'bg-cyan-600 hover:bg-cyan-700'
        };
    }
  };

  const theme = getThemeColors();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden transform transition-all">
        {/* Header */}
        <div className={`${theme.header} text-white p-6 flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 ${theme.accent} bg-opacity-20 rounded-xl`}>
              <FiMapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Assigned Branches</h2>
              <p className="text-sm opacity-90 mt-1 flex items-center gap-2">
                {userName && (
                  <span className="flex items-center gap-1">
                    <FiUsers className="w-4 h-4" />
                    {userName}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <FiActivity className="w-4 h-4" />
                  {branches.length} {branches.length === 1 ? 'branch' : 'branches'}
                </span>
                <span className="capitalize">• {userRole} Team</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Refresh button */}
            <button
              onClick={refreshBranches}
              disabled={isRefreshing}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-xl p-2 transition-colors disabled:opacity-50"
              title="Refresh branch data"
            >
              <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-xl p-2 transition-colors"
              title="Close modal"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {branches.length === 0 ? (
            <div className="text-center py-12">
              <div className={`${theme.bg} rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6`}>
                <FiMapPin className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Branches Assigned</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                No branches have been assigned to your account yet. Contact your administrator to get branch assignments.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {branches.map((branch, index) => (
                <div
                  key={`${branch.branchCode}-${index}`}
                  className={`${theme.bg} ${theme.border} border-2 rounded-xl p-6 transition-all hover:shadow-lg hover:scale-[1.02] group`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className={`p-3 ${theme.accent} rounded-xl group-hover:scale-110 transition-transform`}>
                          <FiMapPin className={`w-6 h-6 ${theme.icon}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {branch.branchName}
                          </h3>
                          <p className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {branch.branchCode}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {branch.team && (
                          <div className="flex items-center space-x-3 text-sm bg-white rounded-lg p-3">
                            <FiBriefcase className={`w-4 h-4 ${theme.icon}`} />
                            <span className="text-gray-600">Team:</span>
                            <span className={`${theme.text} font-semibold capitalize px-2 py-1 ${theme.accent} rounded-full`}>
                              {branch.team}
                            </span>
                          </div>
                        )}
                        
                        {branch.assignedAt && (
                          <div className="flex items-center space-x-3 text-sm bg-white rounded-lg p-3">
                            <FiCalendar className={`w-4 h-4 ${theme.icon}`} />
                            <span className="text-gray-600">Assigned:</span>
                            <span className="text-gray-800 font-medium">
                              {formatDate(branch.assignedAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {branch.isActive !== false ? (
                        <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-2 rounded-full">
                          <FiCheck className="w-4 h-4" />
                          <span className="text-sm font-semibold">Active</span>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm font-medium bg-gray-100 px-3 py-2 rounded-full">
                          Inactive
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <FiActivity className="w-4 h-4" />
                Real-time data
              </span>
              <span>Last updated: {formatLastUpdated()}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshBranches}
                disabled={isRefreshing}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={onClose}
                className={`px-6 py-2 ${theme.button} text-white rounded-lg transition-colors flex items-center gap-2`}
              >
                <FiCheck className="w-4 h-4" />
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchDisplayModal;
