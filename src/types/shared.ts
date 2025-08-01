export interface ChatMessage {
  text: string;
  sender: string;
  timestamp: string;
  isSent: boolean;
}

export type TeamType = 'sales' | 'credit' | 'both' | undefined;

// Enhanced query interface with operation markings and status
export interface Query {
  id: string;
  title: string;
  tat: string;
  team?: TeamType;
  messages: ChatMessage[];
  status: 'pending' | 'resolved' | 'in_progress';
  markedForTeam?: TeamType; // Which team Operations marked this query for
  allowMessaging?: boolean; // Whether messaging is enabled for current user's team
  priority?: 'high' | 'medium' | 'low';
  description?: string;
  caseId?: string;
  customerName?: string;
  branch?: string;
  branchCode?: string;
  createdBy?: string;
  createdAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionReason?: string;
}

// Resolved query interface for Query Resolve page
export interface ResolvedQuery {
  id: string;
  queryId: string;
  title: string;
  caseId: string;
  customerName: string;
  branch: string;
  branchCode?: string;
  resolvedAt: string;
  resolvedBy: string;
  resolutionReason: string;
  priority: 'high' | 'medium' | 'low';
  team: TeamType;
  history: QueryHistoryItem[];
}

// Query history item for tracking all actions
export interface QueryHistoryItem {
  id: string;
  timestamp: string;
  action: 'created' | 'message_sent' | 'reverted' | 'resolved' | 'marked_for_team';
  actor: string; // Employee ID or name
  details: string;
  additionalData?: any;
}

export interface Case {
  id: string;
  customerName: string;
  branch: string;
  branchCode?: string;
  queries: Query[];
}

// Authentication types
export type UserRole = 'sales' | 'credit' | 'operations' | 'admin' | 'manager' | 'supervisor' | 'management';

export interface User {
  employeeId: string;
  name: string;
  role: UserRole;
  isAuthenticated: boolean;
  branch?: string | null;
  branchCode?: string | null;
  assignedBranches?: AssignedBranch[]; // For sales/credit users with multiple branch assignments
  // Management-specific fields
  managementId?: string;
  permissions?: string[];
  email?: string;
  department?: string;
}

export interface AssignedBranch {
  branchCode: string;
  branchName: string;
  assignedAt?: string;
  team?: string;
  isActive?: boolean;
}

export interface LoginCredentials {
  employeeId: string;
  password: string;
  branch?: string;
  branchCode?: string;
  assignedBranches?: AssignedBranch[];
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
} 