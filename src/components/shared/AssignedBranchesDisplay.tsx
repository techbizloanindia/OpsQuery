'use client';

import React, { useState, useEffect } from 'react';
import { FiMapPin, FiChevronDown, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchSelection } from '@/hooks/useBranchSelection';

interface AssignedBranch {
  branchCode: string;
  branchName: string;
  city?: string;
  state?: string;
  region?: string;
  zone?: string;
  isActive?: boolean;
  assignedAt?: string;
  team?: string;
}

interface AssignedBranchesDisplayProps {
  team: 'sales' | 'credit';
  assignedBranches: AssignedBranch[];
  isLoading?: boolean;
  onBranchChange?: (branchCode: string) => void;
  onRefresh?: () => void;
  className?: string;
}

const AssignedBranchesDisplay: React.FC<AssignedBranchesDisplayProps> = ({
  team,
  assignedBranches,
  isLoading = false,
  onBranchChange,
  onRefresh,
  className = ''
}) => {
  const { user } = useAuth();
  const { selectedBranch, switchToBranch } = useBranchSelection();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<AssignedBranch | null>(null);

  // Set current branch based on selection or first assigned branch
  useEffect(() => {
    if (assignedBranches.length > 0) {
      if (selectedBranch) {
        // Find the selected branch in assigned branches
        const selected = assignedBranches.find(b => b.branchCode === selectedBranch.branchCode);
        setCurrentBranch(selected || assignedBranches[0]);
      } else {
        // Default to first branch
        setCurrentBranch(assignedBranches[0]);
      }
    }
  }, [assignedBranches, selectedBranch]);

  // Handle branch switching
  const handleBranchSwitch = (branch: AssignedBranch) => {
    setCurrentBranch(branch);
    setIsDropdownOpen(false);
    
    // Update branch selection
    switchToBranch(branch.branchCode);
    
    // Notify parent component
    if (onBranchChange) {
      onBranchChange(branch.branchCode);
    }
    
    console.log(`🔄 Switched to branch: ${branch.branchCode} (${branch.branchName})`);
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
        </div>
      </div>
    );
  }

  if (assignedBranches.length === 0) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <FiMapPin className="text-yellow-600 h-5 w-5" />
          <div>
            <p className="text-yellow-800 font-medium">No Branches Assigned</p>
            <p className="text-yellow-600 text-sm">
              Contact your administrator to get {team} branches assigned to your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FiMapPin className="text-blue-600 h-5 w-5" />
            <span className="font-medium text-gray-900">
              Assigned Branches ({assignedBranches.length})
            </span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Refresh branches"
            >
              <FiRefreshCw className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Current Branch Display */}
      {currentBranch && (
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {currentBranch.branchName}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      {currentBranch.branchCode}
                    </span>
                    {currentBranch.city && (
                      <span>{currentBranch.city}, {currentBranch.state}</span>
                    )}
                    {currentBranch.region && (
                      <span className="text-blue-600">{currentBranch.region}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Branch Switcher (if multiple branches) */}
            {assignedBranches.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium">Switch Branch</span>
                  <FiChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="py-2">
                      {assignedBranches.map((branch) => (
                        <button
                          key={branch.branchCode}
                          onClick={() => handleBranchSwitch(branch)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-gray-900">{branch.branchName}</div>
                            <div className="flex items-center space-x-3 text-sm text-gray-600">
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                                {branch.branchCode}
                              </span>
                              {branch.city && (
                                <span>{branch.city}, {branch.state}</span>
                              )}
                            </div>
                          </div>
                          {currentBranch?.branchCode === branch.branchCode && (
                            <FiCheck className="h-4 w-4 text-green-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Branch Details */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Team:</span>
                <span className="ml-2 font-medium capitalize text-blue-600">{team}</span>
              </div>
              {currentBranch.zone && (
                <div>
                  <span className="text-gray-500">Zone:</span>
                  <span className="ml-2 font-medium">{currentBranch.zone}</span>
                </div>
              )}
              {currentBranch.assignedAt && (
                <div>
                  <span className="text-gray-500">Assigned:</span>
                  <span className="ml-2 font-medium">
                    {new Date(currentBranch.assignedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Branches Summary (collapsible) */}
      {assignedBranches.length > 1 && (
        <div className="px-4 pb-4">
          <details className="group">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 font-medium">
              View All Assigned Branches ({assignedBranches.length})
            </summary>
            <div className="mt-2 space-y-2">
              {assignedBranches.map((branch, index) => (
                <div
                  key={branch.branchCode}
                  className={`p-3 rounded-lg border ${
                    currentBranch?.branchCode === branch.branchCode 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{branch.branchName}</div>
                      <div className="text-xs text-gray-600">
                        {branch.branchCode} • {branch.city}, {branch.state}
                      </div>
                    </div>
                    {currentBranch?.branchCode === branch.branchCode && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default AssignedBranchesDisplay; 