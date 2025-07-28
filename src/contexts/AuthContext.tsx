'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, LoginCredentials, AuthContextType } from '@/types/shared';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const logoutCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for logout triggers
  const checkLogoutTriggers = useCallback(async () => {
    if (!user?.employeeId) return;

    try {
      const response = await fetch(`/api/auth/check-logout?employeeId=${user.employeeId}`);
      
      if (!response.ok) {
        // Silently handle network errors or server issues
        return;
      }
      
      const result = await response.json();

      if (result.success && result.shouldLogout) {
        console.log(`🚨 Automatic logout triggered for ${user.employeeId}: ${result.reason}`);
        
        // Clear storage first
        try {
          localStorage.removeItem('currentUser');
          localStorage.removeItem('userBranch');
          localStorage.removeItem('selectedBranch');
          localStorage.removeItem('userBranches');
          localStorage.removeItem('managementToken');
          localStorage.removeItem('managementUser');
          localStorage.removeItem('authToken');
        } catch (storageError) {
          console.error('Error clearing localStorage during auto-logout:', storageError);
        }

        // Show logout notification
        const logoutMessage = getLogoutMessage(result.reason, result.metadata);
        
        // Set user to null and show notification
        setUser(null);
        
        // Use a brief delay to ensure state updates, then redirect with message
        setTimeout(() => {
          // Store logout reason for display on login page
          try {
            localStorage.setItem('logoutReason', JSON.stringify({
              reason: result.reason,
              message: logoutMessage,
              timestamp: new Date().toISOString()
            }));
          } catch (e) {
            console.error('Error storing logout reason:', e);
          }
          
          router.push('/login');
        }, 100);
      }
    } catch (error) {
      // Silently handle network errors to prevent console spam
      // Only log if it's not a network connectivity issue
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Network error - silently ignore
        return;
      }
      console.error('Error checking logout triggers:', error);
    }
  }, [user?.employeeId, router]);

  // Generate user-friendly logout messages
  const getLogoutMessage = (reason: string, metadata: any) => {
    switch (reason) {
      case 'branch_assignment_changed':
        return 'Your branch assignments have been updated. Please log in again to see your new assigned branches.';
      case 'branch_assignment_removed':
        return 'Your branch assignments have been removed. Please contact your administrator.';
      case 'primary_branch_changed':
        return 'Your primary branch has been changed. Please log in again to continue.';
      default:
        return 'Your account information has been updated. Please log in again to continue.';
    }
  };

  // Check if user is logged in on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Validate user object structure
          if (parsedUser && parsedUser.employeeId && parsedUser.role) {
            setUser(parsedUser);
          } else {
            console.warn('Invalid stored user data, clearing...');
            localStorage.removeItem('currentUser');
          }
        } catch (parseError) {
          console.error('Error parsing stored user:', parseError);
          localStorage.removeItem('currentUser');
        }
      }
    } catch (storageError) {
      console.error('Error accessing localStorage:', storageError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up logout trigger checking when user is logged in
  useEffect(() => {
    if (user?.employeeId) {
      // Initial check
      checkLogoutTriggers();
      
      // Set up interval checking every 10 seconds
      logoutCheckIntervalRef.current = setInterval(checkLogoutTriggers, 10000);
      
      console.log(`🔍 Started logout trigger monitoring for user ${user.employeeId}`);
    } else {
      // Clear interval when no user
      if (logoutCheckIntervalRef.current) {
        clearInterval(logoutCheckIntervalRef.current);
        logoutCheckIntervalRef.current = null;
      }
    }

    return () => {
      if (logoutCheckIntervalRef.current) {
        clearInterval(logoutCheckIntervalRef.current);
        logoutCheckIntervalRef.current = null;
      }
    };
  }, [user?.employeeId, checkLogoutTriggers]);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();
      console.log('🔐 Auth context login result:', result);

      if (result.success && result.user) {
        const loggedInUser: User = {
          employeeId: result.user.employeeId,
          name: result.user.fullName || result.user.name,
          role: result.user.role,
          isAuthenticated: true,
          branch: result.user.branch || credentials.branch || null,
          branchCode: result.user.branchCode || credentials.branchCode || null,
          assignedBranches: result.user.assignedBranches || credentials.assignedBranches || [],
          // Add management-specific fields if they exist
          ...(result.user.managementId && { managementId: result.user.managementId }),
          ...(result.user.permissions && { permissions: result.user.permissions }),
          ...(result.user.email && { email: result.user.email }),
          ...(result.user.department && { department: result.user.department })
        };
        
        setUser(loggedInUser);
        try {
          localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
          // Clear any previous logout reason
          localStorage.removeItem('logoutReason');
        } catch (storageError) {
          console.error('Error storing user data:', storageError);
          // Continue without localStorage - user will be logged in for this session
        }
        setIsLoading(false);
        return true;
      } else {
        console.error('❌ Auth context login failed:', result?.error || 'Unknown error');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('💥 Auth context login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = useCallback(() => {
    console.log('🚪 AuthContext: Logging out...');
    
    // Clear logout check interval
    if (logoutCheckIntervalRef.current) {
      clearInterval(logoutCheckIntervalRef.current);
      logoutCheckIntervalRef.current = null;
    }
    
    setUser(null);
    
    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userBranch');
      localStorage.removeItem('selectedBranch');
      localStorage.removeItem('userBranches');
      localStorage.removeItem('managementToken');
      localStorage.removeItem('managementUser');
      localStorage.removeItem('authToken');
    } catch (storageError) {
      console.error('Error clearing localStorage during logout:', storageError);
      // Continue with logout even if localStorage fails
    }
    
    console.log('✅ AuthContext: Logout complete, redirecting to login');
    
    // Use setTimeout to ensure state updates complete before redirect
    setTimeout(() => {
      router.push('/login');
    }, 100);
  }, [router]);

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 