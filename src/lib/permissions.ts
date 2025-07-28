// Permission constants and utility functions for authorization
export const PERMISSIONS = {
  // General permissions
  VIEW_QUERIES: 'view_queries',
  RESOLVE_QUERIES: 'resolve_queries',
  MANAGE_USERS: 'manage_users',
  VIEW_REPORTS: 'view_reports',
  EXPORT_DATA: 'export_data',
  MANAGE_BRANCHES: 'manage_branches',
  
  // Query approval permissions
  APPROVE_QUERIES: 'approve_queries',
  APPROVE_OTC_QUERIES: 'approve_otc_queries',
  APPROVE_DEFERRAL_QUERIES: 'approve_deferral_queries',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export interface UserWithPermissions {
  permissions?: string[];
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: UserWithPermissions | null, permission: Permission): boolean {
  if (!user || !user.permissions) return false;
  return user.permissions.includes(permission);
}

/**
 * Check if a user can approve general queries
 */
export function canApproveQueries(user: UserWithPermissions | null): boolean {
  return hasPermission(user, PERMISSIONS.APPROVE_QUERIES);
}

/**
 * Check if a user can approve OTC queries
 */
export function canApproveOTCQueries(user: UserWithPermissions | null): boolean {
  return hasPermission(user, PERMISSIONS.APPROVE_OTC_QUERIES);
}

/**
 * Check if a user can approve deferral queries
 */
export function canApproveDeferralQueries(user: UserWithPermissions | null): boolean {
  return hasPermission(user, PERMISSIONS.APPROVE_DEFERRAL_QUERIES);
}

/**
 * Get all approval authorities for a user
 */
export function getApprovalAuthorities(user: UserWithPermissions | null): {
  type: 'general' | 'otc' | 'deferral';
  label: string;
  permission: Permission;
}[] {
  const authorities: { type: 'general' | 'otc' | 'deferral'; label: string; permission: Permission }[] = [];
  
  if (canApproveQueries(user)) {
    authorities.push({
      type: 'general',
      label: 'General Query Approval',
      permission: PERMISSIONS.APPROVE_QUERIES
    });
  }
  
  if (canApproveOTCQueries(user)) {
    authorities.push({
      type: 'otc',
      label: 'OTC Query Approval',
      permission: PERMISSIONS.APPROVE_OTC_QUERIES
    });
  }
  
  if (canApproveDeferralQueries(user)) {
    authorities.push({
      type: 'deferral',
      label: 'Deferral Query Approval',
      permission: PERMISSIONS.APPROVE_DEFERRAL_QUERIES
    });
  }
  
  return authorities;
}

/**
 * Check if a user has any approval authority
 */
export function hasAnyApprovalAuthority(user: UserWithPermissions | null): boolean {
  return canApproveQueries(user) || canApproveOTCQueries(user) || canApproveDeferralQueries(user);
}

/**
 * Get permission display information
 */
export function getPermissionDisplayInfo(permission: string): {
  icon: string;
  color: string;
  label: string;
  description: string;
} {
  const permissionMap: { [key: string]: { icon: string; color: string; label: string; description: string } } = {
    [PERMISSIONS.VIEW_QUERIES]: {
      icon: '👁️',
      color: 'bg-blue-100 text-blue-800',
      label: 'View Queries',
      description: 'Can view and monitor queries across the system'
    },
    [PERMISSIONS.RESOLVE_QUERIES]: {
      icon: '✅',
      color: 'bg-green-100 text-green-800',
      label: 'Resolve Queries',
      description: 'Can mark queries as resolved and provide responses'
    },
    [PERMISSIONS.MANAGE_USERS]: {
      icon: '👥',
      color: 'bg-purple-100 text-purple-800',
      label: 'Manage Users',
      description: 'Can create, edit, and manage user accounts'
    },
    [PERMISSIONS.VIEW_REPORTS]: {
      icon: '📊',
      color: 'bg-indigo-100 text-indigo-800',
      label: 'View Reports',
      description: 'Can access and view system reports and analytics'
    },
    [PERMISSIONS.EXPORT_DATA]: {
      icon: '📤',
      color: 'bg-gray-100 text-gray-800',
      label: 'Export Data',
      description: 'Can export data and generate reports'
    },
    [PERMISSIONS.MANAGE_BRANCHES]: {
      icon: '🏢',
      color: 'bg-cyan-100 text-cyan-800',
      label: 'Manage Branches',
      description: 'Can manage branch information and settings'
    },
    [PERMISSIONS.APPROVE_QUERIES]: {
      icon: '✅',
      color: 'bg-green-100 text-green-800 border-green-300',
      label: 'Approve General Queries',
      description: 'Can approve and authorize general query resolutions'
    },
    [PERMISSIONS.APPROVE_OTC_QUERIES]: {
      icon: '🟡',
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      label: 'Approve OTC Queries',
      description: 'Can approve Over-The-Counter (OTC) special case queries'
    },
    [PERMISSIONS.APPROVE_DEFERRAL_QUERIES]: {
      icon: '⏳',
      color: 'bg-purple-100 text-purple-800 border-purple-300',
      label: 'Approve Deferral Queries',
      description: 'Can approve deferral requests and postponement cases'
    }
  };
  
  return permissionMap[permission] || {
    icon: '🔧',
    color: 'bg-gray-100 text-gray-800',
    label: permission.replace(/_/g, ' '),
    description: 'Custom permission'
  };
}

/**
 * Validate if a permission is a valid approval permission
 */
export function isApprovalPermission(permission: string): boolean {
  const approvalPermissions = [
    PERMISSIONS.APPROVE_QUERIES,
    PERMISSIONS.APPROVE_OTC_QUERIES,
    PERMISSIONS.APPROVE_DEFERRAL_QUERIES
  ];
  return approvalPermissions.includes(permission as any);
}

/**
 * Get all available permissions
 */
export function getAllPermissions(): Permission[] {
  return Object.values(PERMISSIONS);
}

/**
 * Get approval permissions only
 */
export function getApprovalPermissions(): Permission[] {
  return [
    PERMISSIONS.APPROVE_QUERIES,
    PERMISSIONS.APPROVE_OTC_QUERIES,
    PERMISSIONS.APPROVE_DEFERRAL_QUERIES
  ];
}
