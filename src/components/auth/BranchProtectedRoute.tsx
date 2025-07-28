'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/shared';

interface BranchProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  teamType: 'sales' | 'credit';
  redirectTo?: string;
}

const BranchProtectedRoute: React.FC<BranchProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [],
  teamType,
  redirectTo = '/login' 
}) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // If user is not authenticated, redirect to login
      if (!user || !user.isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      // If specific roles are required and user doesn't have the required role
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirect to their appropriate dashboard based on their role
        switch (user.role) {
          case 'sales':
            if (teamType !== 'sales') {
              router.push('/sales-branch-selection');
            }
            break;
          case 'credit':
            if (teamType !== 'credit') {
              router.push('/credit-branch-selection');
            }
            break;
          case 'operations':
            router.push('/operations');
            break;
          case 'admin':
            router.push('/admin-dashboard');
            break;
          case 'manager':
          case 'supervisor':
          case 'management':
            router.push('/management-dashboard');
            break;
          default:
            router.push('/login');
        }
        return;
      }

      // For Sales and Credit teams, check if they have assigned branches
      if (user.role === 'sales' || user.role === 'credit') {
        try {
          // First check if user has assigned branches from login
          if (user.assignedBranches && user.assignedBranches.length > 0) {
            console.log(`✅ ${user.role} user has ${user.assignedBranches.length} assigned branches from login`);
            
            // Store assigned branches for dashboard use
            try {
              localStorage.setItem('assignedBranches', JSON.stringify({
                branches: user.assignedBranches,
                teamType: user.role,
                autoAssigned: true,
                selectedAt: new Date().toISOString()
              }));
              
              // Skip branch selection - user has assigned branches
              return;
            } catch (storageError) {
              console.warn('Could not store assigned branches:', storageError);
            }
          }
          
          // Fallback: Check localStorage for assigned branches
          const assignedBranches = localStorage.getItem('assignedBranches');
          if (assignedBranches) {
            try {
              const branchData = JSON.parse(assignedBranches);
              
              // Validate branch data structure
              if (branchData && branchData.teamType === teamType && branchData.branches?.length > 0) {
                console.log(`✅ Found ${branchData.branches.length} assigned branches for ${teamType} team`);
                return; // User has valid assigned branches
              }
            } catch (parseError) {
              console.error('Error parsing assigned branches:', parseError);
              localStorage.removeItem('assignedBranches');
            }
          }
          
          // Fallback: Check for manual branch selection (legacy)
          const selectedBranch = localStorage.getItem('selectedBranch');
          
          if (!selectedBranch) {
            // No branch selected or assigned, redirect to branch selection
            if (user.role === 'sales') {
              router.push('/sales-branch-selection');
            } else {
              router.push('/credit-branch-selection');
            }
            return;
          }

          try {
            const branchData = JSON.parse(selectedBranch);
            
            // Validate branch data structure
            if (!branchData || !branchData.teamType) {
              throw new Error('Invalid branch data structure');
            }
            
            // Check if the branch selection is for the correct team
            if (branchData.teamType !== teamType) {
              // Wrong team type, redirect to correct branch selection
              if (user.role === 'sales') {
                router.push('/sales-branch-selection');
              } else {
                router.push('/credit-branch-selection');
              }
              return;
            }

            // Check if branch selection is not too old (optional - 24 hours limit)
            if (branchData.selectedAt) {
              const selectedAt = new Date(branchData.selectedAt);
              const now = new Date();
              const hoursDiff = (now.getTime() - selectedAt.getTime()) / (1000 * 60 * 60);
              
              if (hoursDiff > 24) {
                // Branch selection is too old, require re-selection
                localStorage.removeItem('selectedBranch');
                if (user.role === 'sales') {
                  router.push('/sales-branch-selection');
                } else {
                  router.push('/credit-branch-selection');
                }
                return;
              }
            }
          } catch (parseError) {
            console.error('Error parsing branch data:', parseError);
            // Invalid branch data, redirect to branch selection
            try {
              localStorage.removeItem('selectedBranch');
            } catch (removeError) {
              console.error('Error removing invalid branch data:', removeError);
            }
            
            if (user.role === 'sales') {
              router.push('/sales-branch-selection');
            } else {
              router.push('/credit-branch-selection');
            }
            return;
          }
        } catch (storageError) {
          console.error('Error accessing localStorage for branch selection:', storageError);
          // If localStorage is not available, redirect to branch selection
          if (user.role === 'sales') {
            router.push('/sales-branch-selection');
          } else {
            router.push('/credit-branch-selection');
          }
          return;
        }
      }
    }
  }, [user, isLoading, router, allowedRoles, teamType, redirectTo]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!user || !user.isAuthenticated) {
    return null;
  }

  // If role check fails, show nothing while redirecting
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return null;
  }

  // For Sales and Credit, check branch selection or assignment
  if (user.role === 'sales' || user.role === 'credit') {
    try {
      // Check for assigned branches first
      const assignedBranches = localStorage.getItem('assignedBranches');
      if (assignedBranches) {
        try {
          const branchData = JSON.parse(assignedBranches);
          if (branchData && branchData.teamType === teamType && branchData.branches?.length > 0) {
            return <>{children}</>; // User has valid assigned branches
          }
        } catch (parseError) {
          console.error('Error parsing assigned branches:', parseError);
          localStorage.removeItem('assignedBranches');
        }
      }
      
      // Fallback to manual branch selection
      const selectedBranch = localStorage.getItem('selectedBranch');
      if (!selectedBranch) {
        return null; // Redirecting to branch selection
      }
    } catch (storageError) {
      console.error('Error checking branch selection:', storageError);
      return null; // Redirecting to branch selection
    }
  }

  // User is authenticated, has proper role, and has selected branch (if required)
  return <>{children}</>;
};

export default BranchProtectedRoute;
