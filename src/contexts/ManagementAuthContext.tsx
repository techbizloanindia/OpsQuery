'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface ManagementUser {
  managementId: string;
  employeeId: string;
  name: string;
  email: string;
  role: 'management';
  permissions: string[];
  queryTeamPreferences?: ('sales' | 'credit' | 'both')[];
}

interface ManagementAuthContextType {
  user: ManagementUser | null;
  token: string | null;
  login: (token: string, user: ManagementUser) => void;
  logout: (skipRedirect?: boolean) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  canApproveQueries: () => boolean;
  canApproveOTCQueries: () => boolean;
  canApproveDeferralQueries: () => boolean;
  getApprovalAuthorities: () => string[];
  canViewSalesQueries: () => boolean;
  canViewCreditQueries: () => boolean;
  getQueryTeamPreferences: () => ('sales' | 'credit' | 'both')[];
}

const ManagementAuthContext = createContext<ManagementAuthContextType | undefined>(undefined);

export const useManagementAuth = () => {
  const context = useContext(ManagementAuthContext);
  if (context === undefined) {
    throw new Error('useManagementAuth must be used within a ManagementAuthProvider');
  }
  return context;
};

interface ManagementAuthProviderProps {
  children: React.ReactNode;
}

export const ManagementAuthProvider: React.FC<ManagementAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<ManagementUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('managementToken');
    const storedUser = localStorage.getItem('managementUser');

    console.log('🔍 ManagementAuth: Checking stored auth...', { 
      hasStoredToken: !!storedToken, 
      hasStoredUser: !!storedUser 
    });

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('✅ ManagementAuth: Found stored management user:', { 
          name: parsedUser.name, 
          managementId: parsedUser.managementId,
          hasPermissions: !!parsedUser.permissions,
          hasTeamPreferences: !!parsedUser.queryTeamPreferences
        });
        setToken(storedToken);
        setUser(parsedUser);
        setIsLoading(false);
        console.log('✅ ManagementAuth: Loaded from stored data', { user: parsedUser.name });
        return;
      } catch (error) {
        console.error('❌ ManagementAuth: Error parsing stored management user data:', error);
        localStorage.removeItem('managementToken');
        localStorage.removeItem('managementUser');
      }
    }

    // If no management auth, check if regular auth has a management user
    const regularUser = localStorage.getItem('currentUser');
    console.log('🔍 ManagementAuth: Checking regular auth...', { hasRegularUser: !!regularUser });
    
    if (regularUser) {
      try {
        const parsedRegularUser = JSON.parse(regularUser);
        console.log('🔍 ManagementAuth: Regular user data', { 
          role: parsedRegularUser.role, 
          name: parsedRegularUser.name,
          hasManagementId: !!parsedRegularUser.managementId,
          hasPermissions: !!parsedRegularUser.permissions,
          hasTeamPreferences: !!parsedRegularUser.queryTeamPreferences
        });
        
        // If the regular user has management role, initialize management auth
        if (parsedRegularUser.role === 'management' || 
            parsedRegularUser.role === 'manager' || 
            parsedRegularUser.role === 'supervisor') {
          
          const managementUser: ManagementUser = {
            managementId: parsedRegularUser.managementId || parsedRegularUser.employeeId,
            employeeId: parsedRegularUser.employeeId,
            name: parsedRegularUser.name,
            email: parsedRegularUser.email || '',
            role: 'management',
            permissions: parsedRegularUser.permissions || [],
            queryTeamPreferences: parsedRegularUser.queryTeamPreferences || ['both']
          };
          
          // Use a dummy token for consistency (since we're using the regular auth token)
          const managementToken = 'mgmt_' + Date.now();
          
          setToken(managementToken);
          setUser(managementUser);
          localStorage.setItem('managementToken', managementToken);
          localStorage.setItem('managementUser', JSON.stringify(managementUser));
          
          console.log('✅ ManagementAuth: Initialized from regular auth', { 
            user: managementUser.name,
            managementId: managementUser.managementId,
            permissions: managementUser.permissions?.length || 0,
            teamPreferences: managementUser.queryTeamPreferences
          });
        } else {
          console.log('❌ ManagementAuth: Regular user is not management role, role:', parsedRegularUser.role);
        }
      } catch (error) {
        console.error('❌ ManagementAuth: Error parsing regular user data for management:', error);
      }
    } else {
      console.log('❌ ManagementAuth: No regular user found');
    }

    setIsLoading(false);
    console.log('🔍 ManagementAuth: Initialization complete');
  }, []);

  useEffect(() => {
    // Redirect logic
    if (!isLoading) {
      if (!isAuthenticated && pathname === '/management-dashboard') {
        router.push('/management-login');
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const login = (newToken: string, newUser: ManagementUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('managementToken', newToken);
    localStorage.setItem('managementUser', JSON.stringify(newUser));
  };

  const logout = (skipRedirect = false) => {
    console.log('🚪 ManagementAuth: Logging out...');
    setToken(null);
    setUser(null);
    localStorage.removeItem('managementToken');
    localStorage.removeItem('managementUser');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userBranch');
    localStorage.removeItem('selectedBranch');
    console.log('✅ ManagementAuth: Logout complete');
    
    // Only redirect if not skipped (to prevent conflicts with navbar logout)
    if (!skipRedirect) {
      router.push('/management-login');
    }
  };

  // Permission checking functions
  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };

  const canApproveQueries = (): boolean => {
    return hasPermission('approve_queries');
  };

  const canApproveOTCQueries = (): boolean => {
    return hasPermission('approve_otc_queries');
  };

  const canApproveDeferralQueries = (): boolean => {
    return hasPermission('approve_deferral_queries');
  };

  const getApprovalAuthorities = (): string[] => {
    const authorities: string[] = [];
    if (canApproveQueries()) authorities.push('General Queries');
    if (canApproveOTCQueries()) authorities.push('OTC Queries');
    if (canApproveDeferralQueries()) authorities.push('Deferral Queries');
    return authorities;
  };

  // Query team preference functions
  const canViewSalesQueries = (): boolean => {
    return user?.queryTeamPreferences?.includes('sales') || user?.queryTeamPreferences?.includes('both') || false;
  };

  const canViewCreditQueries = (): boolean => {
    return user?.queryTeamPreferences?.includes('credit') || user?.queryTeamPreferences?.includes('both') || false;
  };

  const getQueryTeamPreferences = (): ('sales' | 'credit' | 'both')[] => {
    return user?.queryTeamPreferences || [];
  };

  const value: ManagementAuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated,
    hasPermission,
    canApproveQueries,
    canApproveOTCQueries,
    canApproveDeferralQueries,
    getApprovalAuthorities,
    canViewSalesQueries,
    canViewCreditQueries,
    getQueryTeamPreferences,
  };

  return (
    <ManagementAuthContext.Provider value={value}>
      {children}
    </ManagementAuthContext.Provider>
  );
};
