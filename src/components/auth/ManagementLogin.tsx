/**
 * OpsQuery - Management Login Component
 * Copyright (c) 2025 OpsQuery Development Team
 * 
 * Licensed under the MIT License.
 * 
 * @fileoverview Management Login - For Management, Manager, and Supervisor users
 * @author OpsQuery Development Team
 * @version 2.0.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useManagementAuth } from '@/contexts/ManagementAuthContext';
import { UserRole } from '@/types/shared';
import Image from 'next/image';

const ManagementLogin = () => {
  const [credentials, setCredentials] = useState({
    managementId: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [logoutMessage, setLogoutMessage] = useState('');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userHasRole, setUserHasRole] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  
  const { login: managementLogin, isLoading } = useManagementAuth();
  const router = useRouter();

  // Check for logout messages on component mount
  useEffect(() => {
    try {
      const logoutReason = localStorage.getItem('managementLogoutReason');
      if (logoutReason) {
        const parsed = JSON.parse(logoutReason);
        setLogoutMessage(parsed.message || 'Your management session has ended. Please log in again.');
        localStorage.removeItem('managementLogoutReason');
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

  // Check if user has management access
  const checkUserRole = async (inputId: string): Promise<void> => {
    if (!inputId.trim()) {
      setUserRole(null);
      setUserHasRole(false);
      setUserName(null);
      return;
    }

    try {
      setIsCheckingRole(true);
      
      // Check as Management ID for management users
      const response = await fetch(`/api/management/check-role?managementId=${encodeURIComponent(inputId)}`);
      
      if (!response.ok) {
        console.warn('Management Role check API failed:', response.status);
        setUserRole(null);
        setUserHasRole(false);
        setUserName(null);
        return;
      }

      const result = await response.json();
      
      if (result.success && result.data && result.data.hasRole) {
        const role = result.data.role as UserRole;
        
        // Only allow management roles for management login
        if (['management', 'manager', 'supervisor'].includes(role)) {
          setUserRole(role);
          setUserHasRole(true);
          setUserName(result.data.name || null);
        } else {
          // User has staff role - should use employee login
          setUserRole(null);
          setUserHasRole(false);
          setUserName(null);
          setError('Staff users should use Employee ID login. Please use the Staff Portal.');
        }
      } else {
        // If no role found but API call was successful, don't block the login
        console.log('Management Role check: No role found for user, letting backend validate');
        setUserRole(null);
        setUserHasRole(false);
        setUserName(null);
      }
    } catch (error) {
      console.error('Error checking management role:', error);
      setUserRole(null);
      setUserHasRole(false);
      setUserName(null);
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
    
    // Check management role as user types management ID
    if (name === 'managementId') {
      checkUserRole(value);
    }
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!credentials.managementId || !credentials.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      console.log('🔄 MANAGEMENT LOGIN - Sending request for:', credentials.managementId);
      
      const response = await fetch('/api/management/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          managementId: credentials.managementId,
          password: credentials.password,
        }),
      });

      const result = await response.json();
      console.log('📥 Management login response:', result);

      if (result.success) {
        // Use management auth context to store authentication data
        managementLogin(result.token, result.user);
        
        console.log('✅ Management login successful, redirecting to management dashboard...');
        router.push('/management-dashboard');
      } else {
        console.error('❌ Management login failed:', result.error);
        setError(result.error || 'Management login failed. Please try again.');
      }
    } catch (error) {
      console.error('💥 Management login error:', error);
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 px-4">
      {/* Login Card */}
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="mx-auto h-24 w-64 relative mb-6 p-2">
              <Image
                src="/logo.png"
                alt="OpsQuery - Management Portal"
                fill
                sizes="256px"
                style={{ objectFit: 'contain' }}
                priority
                className="drop-shadow-2xl filter brightness-110"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Management Portal
              </h1>
              <p className="text-gray-600 text-lg">Executive Access</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>Secure Management Access</span>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Management ID Field */}
            <div className="space-y-2">
              <label htmlFor="managementId" className="block text-sm font-medium text-gray-700">
                Management ID
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  id="managementId"
                  name="managementId"
                  value={credentials.managementId}
                  onChange={handleInputChange}
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm transition-all duration-200"
                  placeholder="Enter your Management ID"
                  required
                />
                
                {/* Role checking indicator */}
                {isCheckingRole && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
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
                <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="font-medium text-purple-800">{userName}</span>
                    <span className="text-purple-600">•</span>
                    <span className="capitalize text-purple-700 font-medium bg-purple-100 px-2 py-1 rounded text-xs">
                      {userRole}
                    </span>
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
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm transition-all duration-200"
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
              <div className="bg-purple-50 border border-purple-200 text-purple-700 px-4 py-3 rounded-xl text-sm">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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
                  <span>Management Sign In</span>
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
                  href="/login"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 font-medium text-sm"
                >
                  Staff Portal
                </Link>
              </div>
              <div>
                <Link
                  href="/control-panel"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 font-medium text-sm"
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

export default ManagementLogin;
