/**
 * OpsQuery - Staff Login Component
 * Copyright (c) 2025 OpsQuery Development Team
 * 
 * Licensed under the MIT License.
 * 
 * @fileoverview Staff Login - For Operations, Sales, Credit, and Admin users only
 * @author OpsQuery Development Team
 * @version 2.0.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { LoginCredentials, UserRole } from '@/types/shared';
import Image from 'next/image';

const Login = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    employeeId: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [logoutMessage, setLogoutMessage] = useState('');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userHasRole, setUserHasRole] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userBranch, setUserBranch] = useState<string | null>(null);
  const [userBranchCode, setUserBranchCode] = useState<string | null>(null);
  const [userAssignedBranches, setUserAssignedBranches] = useState<string[]>([]);
  const [selectedBranchInfo, setSelectedBranchInfo] = useState<{
    branchCode: string;
    branchName: string;
    teamType: 'sales' | 'credit';
  } | null>(null);
  
  const { login, isLoading } = useAuth();
  const router = useRouter();

  // Check for logout messages and selected branch on component mount
  useEffect(() => {
    try {
      const logoutReason = localStorage.getItem('logoutReason');
      if (logoutReason) {
        const parsed = JSON.parse(logoutReason);
        setLogoutMessage(parsed.message || 'Your session has ended. Please log in again.');
        localStorage.removeItem('logoutReason');
      }

      // Check for selected branch information
      const selectedBranch = localStorage.getItem('selectedBranch');
      if (selectedBranch) {
        try {
          const branchData = JSON.parse(selectedBranch);
          if (branchData.branchCode && branchData.branchName && branchData.teamType) {
            setSelectedBranchInfo({
              branchCode: branchData.branchCode,
              branchName: branchData.branchName,
              teamType: branchData.teamType
            });
          }
        } catch (error) {
          console.error('Error parsing selected branch:', error);
        }
      }
    } catch (error) {
      console.error('Error reading logout reason:', error);
    }
  }, []);

  // Clear logout message after a delay
  useEffect(() => {
    if (logoutMessage) {
      const timer = setTimeout(() => {
        setLogoutMessage('');
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [logoutMessage]);

  // Check if user has staff access (operations, sales, credit, admin only)
  const checkUserRole = async (inputId: string): Promise<void> => {
    if (!inputId.trim()) {
      setUserRole(null);
      setUserHasRole(false);
      setUserName(null);
      setUserBranch(null);
      setUserBranchCode(null);
      setUserAssignedBranches([]);
      return;
    }

    try {
      setIsCheckingRole(true);
      
      // Check as Employee ID for staff users only
      const response = await fetch(`/api/users/check-role?employeeId=${encodeURIComponent(inputId)}`);
      
      if (!response.ok) {
        console.warn('Role check API failed:', response.status);
        setUserRole(null);
        setUserHasRole(false);
        setUserName(null);
        setUserBranch(null);
        setUserBranchCode(null);
        return;
      }

      const result = await response.json();
      
      if (result.success && result.data && result.data.hasRole) {
        const role = result.data.role as UserRole;
        
        // Only allow operations, sales, credit, and admin access for employee login
        if (['operations', 'sales', 'credit', 'admin'].includes(role)) {
          setUserRole(role);
          setUserHasRole(true);
          setUserName(result.data.name || null);
          setUserBranch(result.data.branch || null);
          setUserBranchCode(result.data.branchCode || null);
          
          // Don't fetch or display branches during login process - they'll be shown in dashboard navbars instead
        } else if (['management', 'manager', 'supervisor'].includes(role)) {
          // User has management role - redirect to management login
          setUserRole(null);
          setUserHasRole(false);
          setUserName(null);
          setUserBranch(null);
          setUserBranchCode(null);
          setUserAssignedBranches([]);
          setError('Management users should use Management Login. Please use the Management Portal.');
        } else {
          console.warn('Invalid role for staff login:', role);
          setUserRole(null);
          setUserHasRole(false);
          setUserName(null);
          setUserBranch(null);
          setUserBranchCode(null);
        }
      } else {
        // If no role found but API call was successful, don't block the login
        console.log('Role check: No role found for user, letting backend validate');
        setUserRole(null);
        setUserHasRole(false);
        setUserName(null);
        setUserBranch(null);
        setUserBranchCode(null);
        setUserAssignedBranches([]);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setUserRole(null);
      setUserHasRole(false);
      setUserName(null);
      setUserBranch(null);
      setUserBranchCode(null);
      setUserAssignedBranches([]);
    } finally {
      setIsCheckingRole(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Check user role as user types employee ID
    if (name === 'employeeId') {
      checkUserRole(value);
      
      // Clear selected branch info when changing employee ID
      if (value !== credentials.employeeId) {
        setSelectedBranchInfo(null);
      }
    }
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!credentials.employeeId || !credentials.password) {
      setError('Please fill in all fields');
      return;
    }

    // Check user role before login if not already checked
    if (!userHasRole && !userRole) {
      await checkUserRole(credentials.employeeId);
    }

    try {
      console.log('🔄 STAFF LOGIN - Sending request for:', credentials.employeeId);
      
      // Call the API directly to get detailed response
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();
      console.log('📥 Staff login response:', result);
      
      if (result.success) {
        const { user, token } = result;
        const role = user.role as UserRole;
        
        // Block management users from staff login
        if (['management', 'manager', 'supervisor'].includes(role)) {
          setError('Management users must use Management ID login. Please switch to Management ID.');
          return;
        }
        
        // Use the auth context login to set up the user session
        const loginSuccess = await login(credentials);
        
        if (loginSuccess) {
          console.log('✅ Staff login successful, updating auth context...');
          
          // Store additional authentication data persistently
          localStorage.setItem('authToken', token);
          localStorage.setItem('userRole', role);
          localStorage.setItem('lastActivity', new Date().toISOString());
          
          // For Sales and Credit users, fetch and store assigned branches
          if (user.role === 'sales' || user.role === 'credit') {
            try {
              console.log(`🔄 Fetching assigned branches for ${user.role} user:`, user.employeeId);
              
              const branchResponse = await fetch(`/api/users/${user.employeeId}/branches`);
              
              if (branchResponse.ok) {
                const branchResult = await branchResponse.json();
                
                if (branchResult.success && branchResult.branches && branchResult.branches.length > 0) {
                  console.log(`✅ Found ${branchResult.branches.length} assigned branches:`, branchResult.branches);
                  
                  // Add user name to each branch assignment
                  const branchesWithUserName = branchResult.branches.map((branch: any) => ({
                    ...branch,
                    userName: user.name // Add user name to each branch assignment
                  }));
                  
                  // Store branches for branch selection
                  localStorage.setItem('assignedBranches', JSON.stringify(branchesWithUserName));
                  localStorage.setItem('hasBranchAssignments', 'true');
                  localStorage.setItem('userName', user.name); // Store user name separately too
                } else {
                  console.warn(`⚠️ No branches found for ${user.role} user:`, user.employeeId);
                  localStorage.setItem('hasBranchAssignments', 'false');
                }
              } else {
                console.warn('Failed to fetch branch assignments:', branchResponse.status);
                localStorage.setItem('hasBranchAssignments', 'false');
              }
            } catch (branchError) {
              console.error('Error fetching branch assignments:', branchError);
              localStorage.setItem('hasBranchAssignments', 'false');
            }
          }
          
          console.log('🔄 Staff login redirecting based on role:', role);
          
          // Redirect based on role to correct dashboard
          switch (role) {
            case 'sales':
              router.push('/sales-dashboard');
              break;
            case 'credit':
              router.push('/credit-dashboard');
              break;
            case 'operations':
              router.push('/operations');
              break;
            case 'admin':
              router.push('/admin-dashboard');
              break;
            default:
              router.push('/');
          }
        } else {
          setError('Failed to establish user session. Please try again.');
        }
      } else {
        // Handle specific error codes
        switch (result.code) {
          case 'USER_NOT_FOUND':
            setError('Employee ID not found. Please check your ID and try again.');
            break;
          case 'INVALID_PASSWORD':
            setError('Invalid password. Please try again.');
            break;
          case 'MANAGEMENT_USER':
            setError('Management users must use Management ID login. Please switch to Management ID.');
            break;
          case 'MISSING_CREDENTIALS':
            setError('Please fill in all fields.');
            break;
          case 'SERVER_ERROR':
            setError('Server error occurred. Please try again later.');
            break;
          default:
            setError(result.error || 'Login failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('💥 Staff login error:', error);
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      {/* Login Card */}
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="mx-auto h-24 w-64 relative mb-6 p-2">
              <Image
                src="/logo.png"
                alt="OpsQuery - Staff Portal"
                fill
                sizes="256px"
                style={{ objectFit: 'contain' }}
                priority
                className="drop-shadow-2xl filter brightness-110"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Operation Query Model
              </h1>
              <p className="text-gray-600 text-lg">Staff Portal</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Secure Access Portal</span>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selected Branch Information */}
            {selectedBranchInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 616 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900">Previously Selected Branch</h4>
                    <div className="flex items-center space-x-2 text-sm text-blue-700">
                      <span className="font-mono bg-blue-100 px-2 py-1 rounded text-xs font-bold">
                        {selectedBranchInfo.branchCode}
                      </span>
                      <span>•</span>
                      <span>{selectedBranchInfo.branchName}</span>
                      <span>•</span>
                      <span className="capitalize font-medium">{selectedBranchInfo.teamType} Team</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Login to continue with this branch or select a different one
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Employee ID Field */}
            <div className="space-y-2">
              <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                Employee ID
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  id="employeeId"
                  name="employeeId"
                  value={credentials.employeeId}
                  onChange={handleInputChange}
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all duration-200"
                  placeholder="Enter your Employee ID"
                  required
                />
                
                {/* Role indicator */}
                {isCheckingRole && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
                
                {userRole && userHasRole && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 capitalize font-medium">{userRole}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* User Info Display */}
              {userName && userRole && userHasRole && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="font-medium text-green-800">{userName}</span>
                    <span className="text-green-600">•</span>
                    <span className="capitalize text-green-700 font-medium">{userRole}</span>
                    {userBranchCode && (
                      <>
                        <span className="text-green-600">•</span>
                        <span className="font-mono text-green-800 bg-green-100 px-2 py-1 rounded text-xs font-bold">
                          {userBranchCode}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleInputChange}
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all duration-200"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>



            {/* Logout Message */}
            {logoutMessage && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{logoutMessage}</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign In to Staff Portal</span>
                </span>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <hr className="border-gray-200" />
              <span className="px-4 text-sm text-gray-500 bg-white -mt-3 inline-block">Access Other Portals</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <Link
                  href="/management-login"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-purple-300 rounded-xl text-purple-700 bg-white hover:bg-purple-50 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 font-medium text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Management Portal
                </Link>
              </div>
              <div>
                <Link
                  href="/control-panel"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium text-sm"
                >
                  Control Panel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
