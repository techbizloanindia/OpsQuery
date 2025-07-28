'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { LoginCredentials } from '@/types/shared';
import Image from 'next/image';

const ControlPanelLogin = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    employeeId: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
    
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

    try {
      setIsLoading(true);
      
      console.log('🔄 CONTROL PANEL LOGIN - Sending request:', {
        employeeId: credentials.employeeId,
        hasPassword: !!credentials.password
      });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError);
        setError('Server error: Invalid response format. Please try again.');
        return;
      }

      console.log('🔐 CONTROL PANEL LOGIN - API Response:', {
        success: result?.success,
        error: result?.error,
        userRole: result?.user?.role,
        statusCode: response.status,
        hasResult: !!result
      });
      
      if (result.success && result.user) {
        // Only allow admin users to access control panel
        if (result.user.role === 'admin') {
          // Update the auth context with control panel user data
          const success = await login({
            employeeId: credentials.employeeId,
            password: credentials.password,
            branch: result.user.branch,
            branchCode: result.user.branchCode
          });
          
          if (success) {
            console.log('✅ Control panel login successful, redirecting to control panel dashboard');
            router.push('/admin-dashboard');
          } else {
            setError('Failed to initialize control panel session. Please try again.');
          }
        } else {
          setError('Access denied. Control panel privileges required.');
          console.log('❌ Non-control panel user attempted control panel access:', result.user.role);
        }
      } else {
        // Handle specific error codes
        console.error('Control panel login failed:', {
          statusCode: response.status,
          statusText: response.statusText,
          result: result,
          hasResult: !!result,
          resultKeys: result ? Object.keys(result) : 'no result'
        });
        
        // Check if result exists and has proper structure
        if (!result || typeof result !== 'object') {
          setError('Server error: Invalid response received. Please try again.');
          return;
        }
        
        // Handle specific error codes or fallback to generic messages
        const errorCode = result.code || 'UNKNOWN_ERROR';
        const errorMessage = result.error || result.message || 'Login failed';
        
        console.log('Processing error code:', errorCode, 'Message:', errorMessage);
        
        switch (errorCode) {
          case 'USER_NOT_FOUND':
            setError('Control panel ID not found. Please check your control panel ID.');
            break;
          case 'ACCOUNT_INACTIVE':
            setError('Your control panel account is inactive. Please contact administrator.');
            break;
          case 'INVALID_PASSWORD':
            setError('Invalid password. Please try again.');
            break;
          case 'NO_ACCESS_RIGHTS':
            setError('Control panel access not assigned. Please contact system administrator.');
            break;
          case 'MANAGEMENT_USER':
            setError('Management users should use the Management Portal.');
            break;
          case 'MISSING_CREDENTIALS':
            setError('Please fill in all fields.');
            break;
          case 'SERVER_ERROR':
            setError('Server error occurred. Please try again later.');
            break;
          default:
            // Fallback error message
            if (response.status === 500) {
              setError('Server error occurred. Please try again later.');
            } else if (response.status === 401) {
              setError('Invalid control panel credentials. Please check your ID and password.');
            } else if (response.status === 403) {
              setError('Access denied. Control panel privileges required.');
            } else {
              setError(errorMessage || 'Login failed. Please try again.');
            }
        }
      }
    } catch (error) {
      console.error('Control panel login error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
                alt="OpsQuery - Control Panel"
                fill
                sizes="256px"
                style={{ objectFit: 'contain' }}
                priority
                className="drop-shadow-2xl filter brightness-110"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Operation Query Model
              </h1>
              <p className="text-gray-600 text-lg">Control Panel</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Secure Access Portal</span>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Control Panel ID Field */}
            <div className="space-y-2">
              <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                Login with Your Unique ID
              </label>
              <input
                id="employeeId"
                name="employeeId"
                type="text"
                required
                value={credentials.employeeId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 outline-none text-gray-900 bg-white placeholder-gray-400"
                placeholder="Enter your control panel ID"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 outline-none pr-12 text-gray-900 bg-white placeholder-gray-400"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Back to Regular Login */}
          <div className="mt-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/login"
                className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 font-medium"
              >
                Regular Employee Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanelLogin; 