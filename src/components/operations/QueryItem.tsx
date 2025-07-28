'use client';

import React from 'react';

interface Remark {
  id: number;
  user: string;
  team: string;
  content: string;
  timestamp: string;
}

interface QueryItemProps {
  id: number;
  title: string;
  status: 'pending' | 'approved' | 'deferred' | 'otc' | 'resolved';
  tat?: string;
  raisedDate: string;
  resolvedDate?: string;
  remarks: Remark[];
  isResolved?: boolean;
  deferralOptions?: string[];
}

interface DeferralOption {
  id: string;
  name: string;
  reason: string;
  description: string;
}

const deferralOptions: DeferralOption[] = [
  {
    id: 'documentation',
    name: 'Additional Documentation',
    reason: 'Incomplete documentation',
    description: 'Customer needs to provide additional documents'
  },
  {
    id: 'verification',
    name: 'Verification Pending',
    reason: 'Third-party verification required',
    description: 'Waiting for external verification or confirmation'
  },
  {
    id: 'approval',
    name: 'Management Approval',
    reason: 'Higher authority approval needed',
    description: 'Case requires management or senior team approval'
  },
  {
    id: 'technical_issue',
    name: 'Technical Issue',
    reason: 'System or technical problem',
    description: 'Technical difficulties preventing case resolution'
  },
  {
    id: 'customer_response',
    name: 'Customer Response',
    reason: 'Waiting for customer response',
    description: 'Customer input or clarification required'
  },
  {
    id: 'policy_review',
    name: 'Policy Review',
    reason: 'Policy clarification needed',
    description: 'Internal policy review or interpretation required'
  },
  {
    id: 'legal_review',
    name: 'Legal Review',
    reason: 'Legal department review required',
    description: 'Case needs legal compliance check or review'
  }
];

export default function QueryItem({ 
  id, 
  title, 
  status = 'pending', 
  tat, 
  raisedDate, 
  resolvedDate, 
  remarks, 
  isResolved = false,
  deferralOptions = []
}: QueryItemProps) {
  // Format the timestamp to a more readable format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })} ${date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })}`;
  };

  // Determine team color
  const getTeamColor = (team: string) => {
    if (team.includes('Sales')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (team.includes('Credit')) return 'bg-green-50 text-green-700 border-green-200';
    if (team.includes('OPS')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getStatusColor = () => {
    switch (status) {
      case 'resolved':
        return 'bg-green-200 text-green-900 border border-green-400';
      case 'deferred':
        return 'bg-orange-200 text-orange-900 border border-orange-400';
      case 'approved':
        return 'bg-green-200 text-green-900 border border-green-400';
      case 'otc':
        return 'bg-blue-200 text-blue-900 border border-blue-400';
      case 'pending':
        return 'bg-yellow-200 text-yellow-900 border border-yellow-400';
      default:
        return 'bg-blue-200 text-blue-900 border border-blue-400';
    }
  };

  // Handle status changes for management
  const handleStatusChange = async (
    newStatus: 'approved' | 'deferred' | 'otc', 
    remarks: string, 
    assignedTo?: string
  ) => {
    try {
      console.log(`📤 Operations: Changing status to ${newStatus} for query ${id}`);

      const response = await fetch('/api/query-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'status',
          queryId: id,
          status: newStatus,
          assignedTo: assignedTo || '',
          remarks: remarks,
          operationTeamMember: 'Operations Team', // Assuming user is available or default
          team: 'Operations'
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Operations: Status changed to ${newStatus} successfully`);
        
        // Show success message
        alert(`Query status changed to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}!`);
        
        // Refresh the queries to show updated status
        // Assuming onRefresh is passed as a prop or context
        // if (onRefresh) {
        //   onRefresh();
        // }
      } else {
        throw new Error(result.error || `Failed to change status to ${newStatus}`);
      }
    } catch (error) {
      console.error(`❌ Operations: Error changing status to ${newStatus}:`, error);
      alert(`Failed to change status to ${newStatus}. Please try again.`);
    }
  };

  // Handle approval requests for management
  const handleApprovalRequest = async (
    action: 'request-approve' | 'request-deferral' | 'request-otc', 
    remarks: string, 
    assignedTo?: string
  ) => {
    try {
      console.log(`📤 Operations: Creating ${action} request for query ${id}`);

      const response = await fetch('/api/query-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'action',
          queryId: id,
          action: action,
          assignedTo: assignedTo || '',
          remarks: remarks,
          operationTeamMember: 'Operations Team', // Assuming user is available or default
          team: 'Operations'
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Operations: ${action} request created successfully`);
        
        // Show success message
        alert(`${action.replace('request-', '').toUpperCase()} request sent to Management for approval!`);
        
        // Refresh the queries to show updated status
        // Assuming onRefresh is passed as a prop or context
        // if (onRefresh) {
        //   onRefresh();
        // }
      } else {
        throw new Error(result.error || `Failed to create ${action} request`);
      }
    } catch (error) {
      console.error(`❌ Operations: Error creating ${action} request:`, error);
      alert(`Failed to create ${action} request. Please try again.`);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className={`text-sm font-bold px-3 py-1.5 rounded-full shadow-sm ${getStatusColor()}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          ID: {id}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3 text-sm">
        <div>
          <span className="font-medium text-gray-600">Raised:</span>
          <span className="ml-2 text-gray-800">{formatTimestamp(raisedDate)}</span>
        </div>
        {resolvedDate && (
          <div>
            <span className="font-medium text-gray-600">Resolved:</span>
            <span className="ml-2 text-gray-800">{formatTimestamp(resolvedDate)}</span>
          </div>
        )}
        {tat && (
          <div>
            <span className="font-medium text-gray-600">TAT:</span>
            <span className="ml-2 text-gray-800">{tat}</span>
          </div>
        )}
      </div>

      {remarks && remarks.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-700 mb-2">Remarks:</h4>
          <div className="space-y-2">
            {remarks.map((remark) => (
              <div key={remark.id} className="bg-gray-50 p-3 rounded border-l-4 border-gray-300">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-800">{remark.user}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getTeamColor(remark.team)}`}>
                    {remark.team}
                  </span>
                  <span className="text-xs text-gray-500">{formatTimestamp(remark.timestamp)}</span>
                </div>
                <p className="text-gray-700">{remark.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {status === 'pending' && (
          <>
            <button
              onClick={() => handleStatusChange('approved', 'Query approved successfully')}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              ✅ Approve
            </button>
            
            <button
              onClick={() => handleStatusChange('deferred', 'Query deferred for further review')}
              className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              ⏸️ Defer
            </button>
            
            <button
              onClick={() => handleStatusChange('otc', 'Query escalated to OTC')}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              🔄 OTC
            </button>

            {/* Management Approval Request Buttons */}
            <div className="border-l border-gray-300 pl-2 ml-2 flex gap-2">
              <button
                onClick={() => handleApprovalRequest('request-approve', 'Requesting management approval for this query')}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                📤 Request Approval
              </button>
              
              <button
                onClick={() => handleApprovalRequest('request-deferral', 'Requesting management approval for deferral', 'Senior Analyst')}
                className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                📤 Request Deferral
              </button>
              
              <button
                onClick={() => handleApprovalRequest('request-otc', 'Requesting OTC approval from management', 'Senior Manager')}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                📤 Request OTC
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 

