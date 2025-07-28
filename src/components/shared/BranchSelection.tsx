/**
 * OpsQuery - Branch Selection Component
 * Copyright (c) 2024 OpsQuery Development Team
 * 
 * Licensed under the MIT License.
 * 
 * @fileoverview Branch Selection - Auto-redirect component for Sales/Credit users
 * @author OpsQuery Development Team
 * @version 2.0.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchSelection } from '@/hooks/useBranchSelection';
import { FiMapPin, FiUsers, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

interface Branch {
  id: string;
  name: string;
  code: string;
  branchCode: string;
  address: string;
  isActive: boolean;
  assignedTeams: string[];
  userCount: number;
  // Marked branch specific fields
  isMarked?: boolean;
  markedAt?: string;
  markedBy?: string;
  status?: 'pending' | 'accepted' | 'declined';
}

interface BranchSelectionProps {
  allowedRoles: string[];
  teamType: 'sales' | 'credit';
}

const BranchSelection: React.FC<BranchSelectionProps> = ({ allowedRoles, teamType }) => {
  const { user, isLoading } = useAuth();
  const { selectBranch } = useBranchSelection();
  const router = useRouter();
  
  const [userBranches, setUserBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle branch selection with auto-redirect logic
  const handleBranchSelection = useCallback(async (branch: Branch, autoRedirect: boolean = false) => {
    try {
      setIsSelecting(true);
      
      // Store branch selection with user name
      selectBranch({
        id: branch.id,
        name: branch.name,
        code: branch.code,
        teamType: teamType,
        selectedAt: new Date().toISOString()
      });

      console.log(`✅ ${teamType} user branch selected:`, branch);

      // Show immediate feedback with branch code
      const branchNotification = document.createElement('div');
      branchNotification.innerHTML = `
        <div class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r ${
          teamType === 'sales' ? 'from-blue-500 to-blue-600' : 'from-green-500 to-green-600'
        } text-white px-6 py-3 rounded-lg shadow-lg border-2 ${
          teamType === 'sales' ? 'border-blue-300' : 'border-green-300'
        } animate-bounce">
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
              </svg>
            </div>
            <div>
              <div class="font-bold text-lg tracking-wider">${branch.code}</div>
              <div class="text-xs opacity-90">${user?.name || localStorage.getItem('userName') || ''}</div>
              <div class="text-xs opacity-90">Branch assigned • ${teamType.charAt(0).toUpperCase() + teamType.slice(1)} Team</div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(branchNotification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        if (branchNotification.parentNode) {
          branchNotification.parentNode.removeChild(branchNotification);
        }
      }, 3000);

      // Redirect to appropriate dashboard
      const redirectPath = teamType === 'sales' ? '/sales' : '/credit-dashboard';
      
      if (autoRedirect) {
        console.log(`🔄 Auto-redirecting ${teamType} user to ${redirectPath}`);
      } else {
        console.log(`🔄 Redirecting ${teamType} user to ${redirectPath}`);
      }
      
      router.push(redirectPath);
    } catch (error) {
      console.error('Error selecting branch:', error);
      setError('Failed to select branch. Please try again.');
      setIsSelecting(false);
    }
  }, [teamType, selectBranch, router]);

  // Memoize fetchUserBranches to prevent infinite loops
  const fetchUserBranches = useCallback(async () => {
    try {
      setIsLoadingBranches(true);
      setError(null);
      
      if (!user?.employeeId) {
        setError('User not authenticated');
        return;
      }

      console.log(`🔍 Fetching marked branches for ${teamType} user:`, user.employeeId);
      
      // Use the marked branches API endpoint
      const response = await fetch(`/api/users/marked-branches/${user.employeeId}?team=${teamType}`);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          const branches = result.data;
          setUserBranches(branches);

          console.log(`✅ Found ${branches.length} marked branches for ${teamType} user`);

          // Check if user has already accepted a branch
          const acceptedBranch = branches.find((branch: any) => branch.status === 'accepted');
          if (acceptedBranch) {
            console.log(`🔄 Auto-redirecting to accepted branch: ${acceptedBranch.code}`);
            await handleBranchSelection(acceptedBranch, true);
          } else if (branches.length === 0) {
            setError(`No branches have been marked for your ${teamType} role. Please contact your administrator.`);
          }
        } else {
          setError(result.error || 'Failed to fetch branches');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to fetch branches: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching user branches:', error);
      setError('Failed to load branches. Please try again.');
    } finally {
      setIsLoadingBranches(false);
    }
  }, [user?.employeeId, teamType, handleBranchSelection]);
  // Auto-redirect logic for sales/credit users
  useEffect(() => {
    if (!isLoading && (!user || !user.isAuthenticated)) {
      router.push('/login');
      return;
    }

    if (!isLoading && user) {
      // Check if user has required role
      if (!allowedRoles.includes(user.role)) {
        router.push('/');
        return;
      }

      // Fetch user's marked branches
      fetchUserBranches();
    }
  }, [user, isLoading, allowedRoles, router, fetchUserBranches]);

  // Loading state with enhanced messaging
  if (isLoadingBranches) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center max-w-md">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-2 border-indigo-200 mx-auto animate-pulse"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            🏢 Setting up your {teamType} dashboard...
          </h2>
          <p className="text-gray-600 mb-4">
            📍 Fetching your assigned branches and preparing real-time updates
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span className="ml-2">Real-time branch sync in progress</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Branch Access Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
            <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Login
            </button>
        </div>
      </div>
    );
  }

  // Selection state (rare case for multiple branches)
  if (userBranches.length > 1) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Select Your {teamType.charAt(0).toUpperCase() + teamType.slice(1)} Branch
          </h1>
            <p className="text-gray-600">
              Choose the branch you want to work with for this session
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userBranches.map((branch) => (
              <div
                key={branch.id}
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <FiMapPin className="w-5 h-5 text-white" />
            </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
                      <p className="text-sm text-gray-500">{branch.code}</p>
                        </div>
                      </div>
                  {branch.isActive && (
                    <div className="flex items-center gap-1 text-green-600">
                      <FiCheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Active</span>
              </div>
            )}
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">{branch.address}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FiUsers className="w-4 h-4" />
                    <span>{branch.userCount} {branch.userCount === 1 ? 'user' : 'users'}</span>
              </div>
            </div>

              <button
                  onClick={() => handleBranchSelection(branch)}
                  disabled={isSelecting || !branch.isActive}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  {isSelecting ? (
                  <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Selecting...</span>
                  </>
                ) : (
                  <>
                      <span>Select Branch</span>
                      <FiArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            ))}
          </div>
        </div>
        </div>
    );
  }

  // Should not reach here due to auto-redirect logic
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Redirecting to your dashboard...
        </h2>
      </div>
    </div>
  );
};

export default BranchSelection;
