/**
 * OpsQuery - Management Dashboard Component
 * Copyright (c) 2024 OpsQuery Development Team
 * 
 * Licensed under the MIT License.
 * 
 * @fileoverview Management Dashboard - Main interface for Management team with approval workflow
 * @author OpsQuery Development Team
 * @version 2.0.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle,
  FiX,
  FiUser,
  FiRefreshCw,
  FiFileText,
  FiTrendingUp,
  FiBarChart,
  FiBell,
  FiFilter,
  FiMessageSquare,
  FiSend,
  FiEdit3
} from 'react-icons/fi';
import { useManagementAuth } from '@/contexts/ManagementAuthContext';
import ManagementNavbar from './ManagementNavbar';
import LoadingState from '../operations/LoadingState';
import ErrorState from '../operations/ErrorState';
import QueryChatModal from '../shared/QueryChatModal';

interface QueryData {
  id: number;
  appNo: string;
  queries: Array<{
    id: string;
    text: string;
    status: 'pending' | 'approved' | 'deferred' | 'otc' | 'resolved';
    timestamp: string;
    sender: string;
    senderRole: string;
    resolvedBy?: string;
    resolvedAt?: string;
    resolutionReason?: string;
    assignedTo?: string;
    remarks?: string;
    markedFor?: string;
    awaitingApproval?: boolean;
    approvalType?: 'General' | 'OTC' | 'Deferral';
  }>;
  sendTo: string[];
  sendToSales: boolean;
  sendToCredit: boolean;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'deferred' | 'otc' | 'resolved';
  customerName: string;
  branch: string;
  branchCode: string;
  lastUpdated: string;
  markedForTeam: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionReason?: string;
  assignedTo?: string;
  remarks?: string;
}

interface QueryStats {
  pending: number;
  approved: number;
  otc: number;
  deferral: number;
  totalToday: number;
}

interface PendingApprovalRequest {
  id: string;
  queryId: number;
  requestType: 'approve' | 'deferral' | 'otc';
  assignedTo?: string;
  remarks?: string;
  requestedBy: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  team: string;
  appNo?: string;
  customerName?: string;
  branch?: string;
  branchCode?: string;
  priority?: 'high' | 'medium' | 'low' | 'urgent';
  queryText?: string;
  loanAmount?: number;
  loanType?: string;
  applicationStatus?: string;
  markedForTeam?: string;
  submittedBy?: string;
  submittedAt?: string;
}

const ManagementDashboard: React.FC = () => {
  const { 
    user, 
    canApproveQueries, 
    canApproveOTCQueries, 
    canApproveDeferralQueries,
    canViewSalesQueries,
    canViewCreditQueries,
    getQueryTeamPreferences
  } = useManagementAuth();
  
  const [activeTab, setActiveTab] = useState<'approvals' | 'queries' | 'sales' | 'credit'>('approvals');
  const [stats, setStats] = useState<QueryStats>({
    pending: 0,
    approved: 0,
    otc: 0,
    deferral: 0,
    totalToday: 0
  });
  
  const [pendingRequests, setPendingRequests] = useState<PendingApprovalRequest[]>([]);
  const [operationQueries, setOperationQueries] = useState<QueryData[]>([]);
  const [salesQueries, setSalesQueries] = useState<QueryData[]>([]);
  const [creditQueries, setCreditQueries] = useState<QueryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'approve' | 'deferral' | 'otc'>('all');
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PendingApprovalRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [approvalDecision, setApprovalDecision] = useState<'approve' | 'reject'>('approve');
  const [selectedChatQuery, setSelectedChatQuery] = useState<QueryData | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);

  // Fetch management stats and approval requests
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      console.log('🔧 Management Dashboard: Fetching data...');

      // Prepare parallel requests based on user permissions
      const requests: Promise<Response>[] = [
        fetch('/api/queries?stats=true&team=management'),
        fetch('/api/query-actions?type=approval-requests'),
        fetch('/api/queries?team=management&limit=100') // Fetch all operation queries for management
      ];

      // Add sales queries if user can view them
      if (canViewSalesQueries()) {
        requests.push(fetch('/api/queries?team=sales&limit=50'));
      }

      // Add credit queries if user can view them  
      if (canViewCreditQueries()) {
        requests.push(fetch('/api/queries?team=credit&limit=50'));
      }

      const responses = await Promise.all(requests);
      const [statsResponse, requestsResponse, operationQueriesResponse, ...teamResponses] = responses;

      // Process stats
      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        if (statsResult.success) {
          const managementStats = statsResult.data || {};
          setStats({
            pending: managementStats.pending || 0,
            approved: managementStats.approved || 0,
            otc: managementStats.otc || 0,
            deferral: managementStats.deferral || 0,
            totalToday: managementStats.total || 0
          });
          console.log('✅ Management Stats loaded:', managementStats);
        }
      } else {
        console.warn('⚠️ Stats API failed, using defaults');
      }

      // Process approval requests
      if (requestsResponse.ok) {
        const requestsResult = await requestsResponse.json();
        if (requestsResult.success) {
          const requests = requestsResult.data || [];
          
          // Enhance requests with additional data
          const enhancedRequests = await Promise.all(
            requests.map(async (request: any) => {
              try {
                // Fetch query details to get app number and customer name
                const queryResponse = await fetch(`/api/queries/${request.queryId}`);
                if (queryResponse.ok) {
                  const queryData = await queryResponse.json();
                  if (queryData.success && queryData.data) {
                    const query = queryData.data;
                    return {
                      ...request,
                      appNo: query.appNo,
                      customerName: query.customerName,
                      priority: getPriorityLevel(request.requestDate)
                    };
                  }
                }
              } catch (error) {
                console.warn('Could not fetch query details for request:', request.id);
              }
              
              return {
                ...request,
                appNo: `APP-${request.queryId}`,
                customerName: 'Unknown Customer',
                priority: getPriorityLevel(request.requestDate)
              };
            })
          );
          
          setPendingRequests(enhancedRequests);
          console.log('✅ Approval Requests loaded:', enhancedRequests.length);
        }
      } else {
        console.warn('⚠️ Approval Requests API failed');
      }

      // Process operations queries - Only show queries marked for specific teams
      if (operationQueriesResponse.ok) {
        const operationResult = await operationQueriesResponse.json();
        if (operationResult.success) {
          // Filter to only show queries that are marked for teams (have markedForTeam field)
          const markedQueries = (operationResult.data || []).filter((query: any) => 
            query.markedForTeam && query.markedForTeam !== null && query.markedForTeam !== ''
          );
          setOperationQueries(markedQueries);
          console.log('✅ Marked Operation Queries loaded for management:', markedQueries.length, 'of', operationResult.data?.length || 0);
        }
      } else {
        console.warn('⚠️ Operation Queries API failed');
      }

      // Process team queries
      let teamResponseIndex = 0;
      
      if (canViewSalesQueries() && teamResponses[teamResponseIndex]) {
        const salesResponse = teamResponses[teamResponseIndex];
        if (salesResponse.ok) {
          const salesResult = await salesResponse.json();
          if (salesResult.success) {
            setSalesQueries(salesResult.data || []);
            console.log('✅ Sales Queries loaded:', salesResult.data?.length || 0);
          }
        }
        teamResponseIndex++;
      }

      if (canViewCreditQueries() && teamResponses[teamResponseIndex]) {
        const creditResponse = teamResponses[teamResponseIndex];
        if (creditResponse.ok) {
          const creditResult = await creditResponse.json();
          if (creditResult.success) {
            setCreditQueries(creditResult.data || []);
            console.log('✅ Credit Queries loaded:', creditResult.data?.length || 0);
          }
        }
      }

    } catch (error) {
      console.error('❌ Management Dashboard: Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load management data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setLastRefreshed(new Date());
    }
  }, [canViewSalesQueries, canViewCreditQueries]);

  // Get priority level based on request age
  const getPriorityLevel = (requestDate: string): 'high' | 'medium' | 'low' => {
    const hours = Math.floor((new Date().getTime() - new Date(requestDate).getTime()) / (1000 * 60 * 60));
    if (hours > 24) return 'high';
    if (hours > 8) return 'medium';
    return 'low';
  };

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Initial load and real-time updates
  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLastRefreshed(new Date());
    await fetchData();
  };

  // Handle approval/rejection
  const handleApprovalDecision = async () => {
    if (!selectedRequest) return;

    try {
      setProcessingRequest(selectedRequest.id);

      const response = await fetch('/api/approval-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          decision: approvalDecision,
          remarks: approvalRemarks.trim() || undefined,
          managementMember: user?.name || 'Management Team'
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Management: ${approvalDecision} decision completed for request ${selectedRequest.id}`);
        
        // Close modal and refresh data
        setShowApprovalModal(false);
        setSelectedRequest(null);
        setApprovalRemarks('');
        await fetchData();
        
        // Show success message
        alert(`Request ${approvalDecision === 'approve' ? 'approved' : 'rejected'} successfully!`);
      } else {
        throw new Error(result.error || `Failed to ${approvalDecision} request`);
      }
    } catch (error) {
      console.error(`❌ Management: Error ${approvalDecision}ing request:`, error);
      alert(`Failed to ${approvalDecision} request. Please try again.`);
    } finally {
      setProcessingRequest(null);
    }
  };

  // Resolve query handler
  const handleResolveQuery = async (queryId: number, appNo: string) => {
    if (!confirm(`Are you sure you want to mark query ${appNo} as resolved?`)) {
      return;
    }

    try {
      setProcessingRequest(queryId.toString());
      
      const response = await fetch(`/api/queries/${queryId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resolvedBy: user?.employeeId || 'Management',
          resolutionReason: 'Resolved by Management',
          team: 'management'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Query resolved successfully:', queryId);
        await fetchData(); // Refresh data
        alert(`Query ${appNo} marked as resolved successfully!`);
      } else {
        throw new Error(result.error || 'Failed to resolve query');
      }
    } catch (error) {
      console.error('❌ Management: Error resolving query:', error);
      alert('Failed to resolve query. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  // Open approval modal
  const openApprovalModal = (request: PendingApprovalRequest, decision: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setApprovalDecision(decision);
    setApprovalRemarks('');
    setShowApprovalModal(true);
  };

  // Filter requests
  const filteredRequests = pendingRequests.filter(request => {
    if (activeFilter === 'all') return true;
    return request.requestType === activeFilter;
  });

  // Get status color
  const getStatusColor = (type: string) => {
    switch (type) {
      case 'approve':
        return 'bg-green-100 text-green-800';
      case 'deferral':
        return 'bg-orange-100 text-orange-800';
      case 'otc':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading state
  if (isLoading) {
    return <LoadingState message="Loading Management Dashboard..." />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={fetchData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      {/* Management Navbar */}
      <ManagementNavbar />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">




        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-1 mb-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('approvals')}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'approvals'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiClock className="w-4 h-4" />
                <span>Approval Requests</span>
                {pendingRequests.length > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('queries')}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'queries'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiMessageSquare className="w-4 h-4" />
                <span>Operations Queries</span>
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {operationQueries.length}
                </span>
              </div>
            </button>

            {canViewSalesQueries() && (
              <button
                onClick={() => setActiveTab('sales')}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'sales'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FiBarChart className="w-4 h-4" />
                  <span>Sales Queries</span>
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {salesQueries.length}
                  </span>
                </div>
              </button>
            )}

            {canViewCreditQueries() && (
              <button
                onClick={() => setActiveTab('credit')}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'credit'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FiFileText className="w-4 h-4" />
                  <span>Credit Queries</span>
                  <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {creditQueries.length}
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'approvals' && (
          <div>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiFilter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filter by request type:</span>
                </div>
                <div className="flex gap-2">
                  {[
                    { id: 'all', label: 'All', count: pendingRequests.length },
                    { id: 'approve', label: 'Approve', count: pendingRequests.filter(r => r.requestType === 'approve').length },
                    { id: 'deferral', label: 'Deferral', count: pendingRequests.filter(r => r.requestType === 'deferral').length },
                    { id: 'otc', label: 'OTC', count: pendingRequests.filter(r => r.requestType === 'otc').length },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        activeFilter === filter.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Approval Requests Content */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Pending Approval Requests</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'} awaiting management approval
                </p>
              </div>

              <div className="p-6">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <FiCheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                    <p className="text-gray-500">All approval requests have been processed</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRequests.map((request) => (
                      <div
                        key={request.id}
                        className="border border-gray-200 rounded-lg p-6 hover:border-indigo-200 transition-colors bg-white shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* Header with Application Info */}
                            <div className="flex items-center gap-3 mb-4">
                              <h3 className="text-xl font-bold text-gray-900">
                                {request.appNo || `Query #${request.queryId}`}
                              </h3>
                              
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(request.requestType)}`}>
                                {request.requestType.toUpperCase()} REQUEST
                              </span>

                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(request.priority || 'medium')}`}>
                                {(request.priority || 'medium').toUpperCase()} PRIORITY
                              </span>
                            </div>

                            {/* Customer and Branch Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="bg-blue-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <FiUser className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-800">Customer Details</span>
                                </div>
                                <p className="text-sm text-blue-900 font-semibold">{request.customerName}</p>
                                {request.loanAmount && (
                                  <p className="text-xs text-blue-700 mt-1">
                                    Amount: ₹{request.loanAmount}
                                  </p>
                                )}
                                {request.loanType && (
                                  <p className="text-xs text-blue-700">
                                    Type: {request.loanType}
                                  </p>
                                )}
                              </div>
                              
                              <div className="bg-green-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <FiTrendingUp className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-800">Branch Details</span>
                                </div>
                                <p className="text-sm text-green-900 font-semibold">
                                  {request.branch}
                                </p>
                                <p className="text-xs text-green-700">
                                  Code: {request.branchCode}
                                </p>
                              </div>
                            </div>

                            {/* Request Details */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                              <div className="flex items-center gap-2 mb-3">
                                <FiMessageSquare className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-800">Request Details</span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Requested by:</span>
                                  <p className="font-medium text-gray-900">{request.requestedBy}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Requested:</span>
                                  <p className="font-medium text-gray-900">{formatRelativeTime(request.requestDate)}</p>
                                </div>
                                {request.assignedTo && (
                                  <div>
                                    <span className="text-gray-600">Proposed assignment:</span>
                                    <p className="font-medium text-gray-900">{request.assignedTo}</p>
                                  </div>
                                )}
                                {request.markedForTeam && (
                                  <div>
                                    <span className="text-gray-600">Target team:</span>
                                    <p className="font-medium text-gray-900 capitalize">{request.markedForTeam}</p>
                                  </div>
                                )}
                              </div>

                              {/* Query Text */}
                              {request.queryText && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <span className="text-gray-600 text-sm">Original Query:</span>
                                  <div className="mt-1 p-2 bg-white rounded border border-gray-200">
                                    <p className="text-sm text-gray-800 italic">
                                      "{request.queryText.length > 150 
                                        ? `${request.queryText.substring(0, 150)}...` 
                                        : request.queryText}"
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Remarks */}
                              {request.remarks && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <span className="text-gray-600 text-sm">
                                    {request.requestType === 'deferral' ? 'Deferral Reason:' :
                                     request.requestType === 'otc' ? 'OTC Justification:' : 'Remarks:'}
                                  </span>
                                  <div className="mt-1 p-2 bg-yellow-50 rounded border border-yellow-200">
                                    <p className="text-sm text-yellow-800 font-medium">{request.remarks}</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Application Status if available */}
                            {request.applicationStatus && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                <FiFileText className="w-4 h-4" />
                                <span>Application Status: </span>
                                <span className="font-medium text-gray-900 capitalize">{request.applicationStatus}</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 ml-6">
                            <button
                              onClick={() => openApprovalModal(request, 'approve')}
                              disabled={processingRequest === request.id}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              <FiCheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            
                            <button
                              onClick={() => openApprovalModal(request, 'reject')}
                              disabled={processingRequest === request.id}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              <FiX className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Operations Queries Tab */}
        {activeTab === 'queries' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Operations Team Queries</h2>
              <p className="text-sm text-gray-600 mt-1">
                View all queries raised by operations team. Management can only view conversations and approve requests.
              </p>
            </div>

            <div className="p-6">
              {operationQueries.length === 0 ? (
                <div className="text-center py-12">
                  <FiMessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No queries available</h3>
                  <p className="text-gray-500">No queries have been raised by the operations team yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {operationQueries.map((query) => (
                    <div
                      key={query.id}
                      className="border border-gray-200 rounded-lg p-6 hover:border-indigo-200 transition-colors bg-white shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Query Header */}
                          <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-xl font-bold text-gray-900">
                              {query.appNo}
                            </h3>
                            
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              query.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                              query.status === 'approved' ? 'bg-green-100 text-green-800' :
                              query.status === 'deferred' ? 'bg-yellow-100 text-yellow-800' :
                              query.status === 'otc' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {query.status.toUpperCase()}
                            </span>

                            <span className="text-sm text-gray-500">
                              {formatRelativeTime(query.submittedAt)}
                            </span>
                          </div>

                          {/* Customer and Branch Information */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-blue-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <FiUser className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">Customer</span>
                              </div>
                              <p className="text-sm text-blue-900 font-semibold">{query.customerName}</p>
                            </div>
                            
                            <div className="bg-green-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <FiTrendingUp className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">Branch</span>
                              </div>
                              <p className="text-sm text-green-900 font-semibold">
                                {query.branch} ({query.branchCode})
                              </p>
                            </div>
                          </div>

                          {/* Query Details */}
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2 mb-3">
                              <FiFileText className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-medium text-gray-800">Query Details</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Submitted by:</span>
                                <p className="font-medium text-gray-900">{query.submittedBy}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Marked for:</span>
                                <p className="font-medium text-gray-900 capitalize">{query.markedForTeam || 'All teams'}</p>
                              </div>
                            </div>

                            {/* Show first query text */}
                            {query.queries && query.queries.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <span className="text-gray-600 text-sm">Latest Query:</span>
                                <div className="mt-1 p-2 bg-white rounded border border-gray-200">
                                  <p className="text-sm text-gray-800">
                                    {query.queries[0].text.length > 200 
                                      ? `${query.queries[0].text.substring(0, 200)}...` 
                                      : query.queries[0].text}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Management Note */}
                          <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                            <div className="flex items-center gap-2 text-indigo-700">
                              <FiEdit3 className="w-4 h-4" />
                              <span className="text-sm font-medium">Management Access</span>
                            </div>
                            <p className="text-xs text-indigo-600 mt-1">
                              You can view conversations but cannot send messages. Use "Approval Requests" tab to approve/defer/OTC with remarks.
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="ml-6 flex flex-col gap-2">
                          <button
                            onClick={() => {
                              setSelectedChatQuery(query);
                              setShowChatModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
                          >
                            <FiMessageSquare className="w-4 h-4" />
                            View Chat
                          </button>
                          
                          {/* Resolve Button - Only show for pending queries */}
                          {query.status === 'pending' && (
                            <button
                              onClick={() => handleResolveQuery(query.id, query.appNo)}
                              disabled={processingRequest === query.id.toString()}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                                processingRequest === query.id.toString()
                                  ? 'bg-gray-400 text-white cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              <FiCheckCircle className="w-4 h-4" />
                              {processingRequest === query.id.toString() ? 'Resolving...' : 'Mark Resolved'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sales Queries Tab */}
        {activeTab === 'sales' && canViewSalesQueries() && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Sales Queries</h2>
              <div className="text-center py-8">
                <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Sales queries functionality coming soon</p>
              </div>
            </div>
          </div>
        )}

        {/* Credit Queries Tab */}
        {activeTab === 'credit' && canViewCreditQueries() && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Credit Queries</h2>
              <div className="text-center py-8">
                <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Credit queries functionality coming soon</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {approvalDecision === 'approve' ? 'Approve Request' : 'Reject Request'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedRequest.requestType.toUpperCase()} request for {selectedRequest.appNo}
              </p>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {approvalDecision === 'approve' ? 'Approval Remarks' : 'Rejection Reason'}
                </label>
                <textarea
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  placeholder={approvalDecision === 'approve' 
                    ? 'Add any remarks for this approval...' 
                    : 'Please provide a reason for rejection...'
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleApprovalDecision}
                  disabled={processingRequest === selectedRequest.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 ${
                    approvalDecision === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processingRequest === selectedRequest.id ? (
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                  ) : approvalDecision === 'approve' ? (
                    <FiCheckCircle className="w-4 h-4" />
                  ) : (
                    <FiX className="w-4 h-4" />
                  )}
                  {processingRequest === selectedRequest.id 
                    ? 'Processing...' 
                    : approvalDecision === 'approve' 
                      ? 'Approve Request' 
                      : 'Reject Request'
                  }
                </button>
                
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedRequest(null);
                    setApprovalRemarks('');
                  }}
                  disabled={processingRequest === selectedRequest.id}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Read-only Chat Modal for Management */}
      {showChatModal && selectedChatQuery && (
        <QueryChatModal
          queryId={selectedChatQuery.id}
          appNo={selectedChatQuery.appNo}
          customerName={selectedChatQuery.customerName}
          isOpen={showChatModal}
          onClose={() => {
            setShowChatModal(false);
            setSelectedChatQuery(null);
          }}
          title={`Query Details - ${selectedChatQuery.appNo}`}
          branch={selectedChatQuery.branch}
          createdAt={selectedChatQuery.submittedAt}
          status={selectedChatQuery.status}
          readOnly={true} // Management users get read-only access
        />
      )}
    </div>
  );
};

export default ManagementDashboard;
