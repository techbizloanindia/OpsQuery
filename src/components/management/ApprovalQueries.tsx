'use client';

import React, { useState, useEffect } from 'react';
import { useManagementAuth } from '@/contexts/ManagementAuthContext';

interface QueryData {
  id: number;
  appNo: string;
  queries: Array<{
    id: string;
    text: string;
    status: 'pending' | 'approved' | 'deferred' | 'otc' | 'resolved';
    timestamp?: string;
    sender?: string;
    senderRole?: string;
    markedFor?: string;
    awaitingApproval?: boolean;
    approvalType?: 'General' | 'OTC' | 'Deferral';
  }>;
  customerName: string;
  branch: string;
  branchCode: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'deferred' | 'otc' | 'resolved';
  markedForTeam?: 'sales' | 'credit' | 'both';
  chat?: Array<{
    id: string;
    message: string;
    sender: string;
    senderRole: string;
    timestamp: string;
    senderName?: string;
  }>;
}

interface ApprovalAction {
  queryId: string;
  action: 'approve' | 'reject';
  remarks?: string;
  approvalType: 'General' | 'OTC' | 'Deferral';
}

const ApprovalQueries: React.FC = () => {
  const { user, canApproveQueries, canApproveOTCQueries, canApproveDeferralQueries, canViewSalesQueries, canViewCreditQueries } = useManagementAuth();
  const [queries, setQueries] = useState<QueryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<QueryData | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<ApprovalAction | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTeamTab, setActiveTeamTab] = useState<'sales' | 'credit'>('sales');
  const [activeApprovalTab, setActiveApprovalTab] = useState<'General' | 'OTC' | 'Deferral'>('General');

  useEffect(() => {
    fetchApprovalQueries();
  }, []);

  const fetchApprovalQueries = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/queries?awaiting_approval=true');
      const data = await response.json();
      
      if (response.ok) {
        // Filter queries that need approval based on user permissions
        const filteredQueries = data.filter((query: QueryData) => {
          return query.queries.some(q => {
            if (q.approvalType === 'General' && canApproveQueries()) return true;
            if (q.approvalType === 'OTC' && canApproveOTCQueries()) return true;
            if (q.approvalType === 'Deferral' && canApproveDeferralQueries()) return true;
            return false;
          });
        });
        
        setQueries(filteredQueries);
      }
    } catch (error) {
      console.error('Error fetching approval queries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async () => {
    if (!approvalAction || !selectedQuery) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/approval-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: approvalAction.queryId,
          decision: approvalAction.action,
          remarks: approvalRemarks,
          managementMember: user?.name,
          approvalType: approvalAction.approvalType,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Refresh the queries list
        await fetchApprovalQueries();
        setShowApprovalModal(false);
        setApprovalAction(null);
        setApprovalRemarks('');
        setSelectedQuery(null);
      } else {
        console.error('Approval action failed:', result.error);
      }
    } catch (error) {
      console.error('Error processing approval:', error);
    } finally {
      setProcessing(false);
    }
  };

  const openApprovalModal = (query: QueryData, action: 'approve' | 'reject', approvalType: 'General' | 'OTC' | 'Deferral') => {
    setSelectedQuery(query);
    setApprovalAction({
      queryId: query.appNo,
      action,
      approvalType,
    });
    setShowApprovalModal(true);
  };

  const getQueriesByTeamAndType = (team: 'sales' | 'credit', type: 'General' | 'OTC' | 'Deferral') => {
    return queries.filter(query => {
      const matchesTeam = query.markedForTeam === team || query.markedForTeam === 'both';
      const matchesType = query.queries.some(q => q.approvalType === type && q.awaitingApproval);
      return matchesTeam && matchesType;
    });
  };

  const getQueriesByType = (type: 'General' | 'OTC' | 'Deferral') => {
    return queries.filter(query => 
      query.queries.some(q => q.approvalType === type && q.awaitingApproval)
    );
  };

  const getApprovalTypeIcon = (type: 'General' | 'OTC' | 'Deferral') => {
    switch (type) {
      case 'General': return '✅';
      case 'OTC': return '🟡';
      case 'Deferral': return '⏳';
      default: return '📋';
    }
  };

  const getApprovalTypeColor = (type: 'General' | 'OTC' | 'Deferral') => {
    switch (type) {
      case 'General': return 'bg-green-100 text-green-800 border-green-300';
      case 'OTC': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Deferral': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading approval queries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="mr-3">⚡</span>
                Sales and Credit Query Approval Center
              </h1>
              <p className="text-gray-600 mt-1">
                Review and approve queries sent by Operations team for Sales and Credit departments
              </p>
            </div>
            <div className="flex items-center gap-3">
              {canApproveQueries() && (
                <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-300">
                  ✅ General Authority
                </span>
              )}
              {canApproveOTCQueries() && (
                <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-800 border border-orange-300">
                  🟡 OTC Authority
                </span>
              )}
              {canApproveDeferralQueries() && (
                <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                  ⏳ Deferral Authority
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Team Selection Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Team Tabs">
              {(['sales', 'credit'] as const).map((team) => {
                const canViewTeam = team === 'sales' ? canViewSalesQueries() : canViewCreditQueries();
                
                // If no preferences are set, show both tabs (default behavior)
                const hasAnyPreferences = canViewSalesQueries() || canViewCreditQueries();
                const shouldShowTab = hasAnyPreferences ? canViewTeam : true;
                
                if (!shouldShowTab) return null;

                const salesQueriesCount = getQueriesByTeamAndType('sales', 'General').length + 
                                        getQueriesByTeamAndType('sales', 'OTC').length + 
                                        getQueriesByTeamAndType('sales', 'Deferral').length;
                const creditQueriesCount = getQueriesByTeamAndType('credit', 'General').length + 
                                         getQueriesByTeamAndType('credit', 'OTC').length + 
                                         getQueriesByTeamAndType('credit', 'Deferral').length;
                
                const queriesCount = team === 'sales' ? salesQueriesCount : creditQueriesCount;
                
                return (
                  <button
                    key={team}
                    onClick={() => setActiveTeamTab(team)}
                    className={`${
                      activeTeamTab === team
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg flex items-center gap-3`}
                  >
                    <span>{team === 'sales' ? '📈' : '💳'}</span>
                    {team.charAt(0).toUpperCase() + team.slice(1)} Queries
                    {queriesCount > 0 && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        team === 'sales' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {queriesCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Approval Type Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Approval Tabs">
              {(['General', 'OTC', 'Deferral'] as const).map((type) => {
                const canApprove = 
                  (type === 'General' && canApproveQueries()) ||
                  (type === 'OTC' && canApproveOTCQueries()) ||
                  (type === 'Deferral' && canApproveDeferralQueries());
                
                if (!canApprove) return null;

                const queriesCount = getQueriesByTeamAndType(activeTeamTab, type).length;
                
                return (
                  <button
                    key={type}
                    onClick={() => setActiveApprovalTab(type)}
                    className={`${
                      activeApprovalTab === type
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <span>{getApprovalTypeIcon(type)}</span>
                    {type} Queries
                    {queriesCount > 0 && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getApprovalTypeColor(type)}`}>
                        {queriesCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Queries List */}
          <div className="p-6">
            {getQueriesByTeamAndType(activeTeamTab, activeApprovalTab).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">{getApprovalTypeIcon(activeApprovalTab)}</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeTeamTab} {activeApprovalTab} queries pending approval
                </h3>
                <p className="text-gray-500">
                  All {activeTeamTab} {activeApprovalTab.toLowerCase()} queries have been processed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {getQueriesByTeamAndType(activeTeamTab, activeApprovalTab).map((query) => (
                  <div
                    key={query.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Application: {query.appNo}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Customer: {query.customerName} | Branch: {query.branch} ({query.branchCode})
                        </p>
                        <p className="text-sm text-gray-600">
                          Submitted by: {query.submittedBy} | {new Date(query.submittedAt).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Team: <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            query.markedForTeam === 'sales' ? 'bg-green-100 text-green-800' : 
                            query.markedForTeam === 'credit' ? 'bg-blue-100 text-blue-800' : 
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {query.markedForTeam === 'sales' ? '📈 Sales' : 
                             query.markedForTeam === 'credit' ? '💳 Credit' : 
                             '🔄 Both'}
                          </span>
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full ${getApprovalTypeColor(activeApprovalTab)}`}>
                        {getApprovalTypeIcon(activeApprovalTab)} {activeApprovalTab} Approval
                      </span>
                    </div>

                    {/* Query Details */}
                    <div className="space-y-3 mb-4">
                      {query.queries
                        .filter(q => q.approvalType === activeApprovalTab && q.awaitingApproval)
                        .map((q) => (
                        <div key={q.id} className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-800 mb-2">{q.text}</p>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Raised by: {q.sender} ({q.senderRole})</span>
                            <span>{q.timestamp && new Date(q.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chat History */}
                    {query.chat && query.chat.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Chat Activity:</h4>
                        <div className="max-h-32 overflow-y-auto space-y-2">
                          {query.chat.slice(-3).map((chat) => (
                            <div key={chat.id} className="text-sm bg-blue-50 p-2 rounded">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-blue-900">
                                  {chat.senderName || chat.sender} ({chat.senderRole})
                                </span>
                                <span className="text-blue-600 text-xs">
                                  {new Date(chat.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-blue-800 mt-1">{chat.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openApprovalModal(query, 'approve', activeApprovalTab)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => openApprovalModal(query, 'reject', activeApprovalTab)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        ❌ Reject
                      </button>
                      <button
                        onClick={() => setSelectedQuery(query)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        👁️ View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && approvalAction && selectedQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {approvalAction.action === 'approve' ? 'Approve' : 'Reject'} {approvalAction.approvalType} Query
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Application: {selectedQuery.appNo}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Customer: {selectedQuery.customerName}
              </p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks (Optional)
              </label>
              <textarea
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder={`Add remarks for this ${approvalAction.action} action...`}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleApprovalAction}
                disabled={processing}
                className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${
                  approvalAction.action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {approvalAction.action === 'approve' ? '✅' : '❌'}
                    {approvalAction.action === 'approve' ? 'Approve' : 'Reject'}
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setApprovalAction(null);
                  setApprovalRemarks('');
                }}
                disabled={processing}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalQueries;
