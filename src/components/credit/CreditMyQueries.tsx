/**
 * OpsQuery - Credit My Queries Component
 * Copyright (c) 2024 OpsQuery Development Team
 * 
 * Licensed under the MIT License.
 * 
 * @fileoverview Credit My Queries - Displays pending credit assessment queries
 * @author OpsQuery Development Team
 * @version 2.0.0
 */

'use client';

import React, { useState } from 'react';
import { 
  FiClock, 
  FiUser, 
  FiMapPin, 
  FiMessageSquare,
  FiCheckCircle,
  FiX,
  FiPause,
  FiRefreshCw,
  FiAlertTriangle,
  FiShield,
  FiDollarSign
} from 'react-icons/fi';
import QueryChatModal from '@/components/shared/QueryChatModal';
import { useBranchSelection } from '@/hooks/useBranchSelection';

interface Query {
  id: number;
  appNo: string;
  customerName: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
  team: string;
  sendToSales?: boolean;
  sendToCredit?: boolean;
  markedForTeam?: string;
  branchCode: string;
  submittedAt: string;
  description: string;
  loanAmount?: number;
  creditScore?: number;
}

interface CreditMyQueriesProps {
  queries: Query[];
  isLoading: boolean;
}

const CreditMyQueries: React.FC<CreditMyQueriesProps> = ({
  queries,
  isLoading
}) => {
  const { selectedBranch } = useBranchSelection();
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);

  // Filter queries for credit team
  const creditQueries = queries.filter(query => {
    // Check if query is assigned to credit team
    const isForCredit = query.sendToCredit || 
                       query.markedForTeam === 'credit' || 
                       query.markedForTeam === 'both' ||
                       query.team === 'credit';
    
    // Check if query matches selected branch
    const matchesBranch = !selectedBranch || 
                         query.branchCode === selectedBranch.branchCode;
    
    // Only show pending queries
    const isPending = query.status === 'pending';
    
    return isForCredit && matchesBranch && isPending;
  });

  const openChatModal = (query: Query) => {
    setSelectedQuery(query);
    setShowChatModal(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCreditRiskLevel = (query: Query) => {
    // Simple risk assessment based on loan amount and credit score
    if (query.loanAmount && query.loanAmount > 1000000) return 'high';
    if (query.creditScore && query.creditScore < 600) return 'high';
    if (query.loanAmount && query.loanAmount > 500000) return 'medium';
    if (query.creditScore && query.creditScore < 700) return 'medium';
    return 'low';
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return <FiAlertTriangle className="w-4 h-4 text-red-600" />;
      case 'medium': return <FiShield className="w-4 h-4 text-yellow-600" />;
      case 'low': return <FiCheckCircle className="w-4 h-4 text-green-600" />;
      default: return <FiShield className="w-4 h-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FiRefreshCw className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading credit assessments...</p>
        </div>
      </div>
    );
  }

  if (creditQueries.length === 0) {
    return (
      <div className="text-center py-12">
        <FiCheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Assessments</h3>
        <p className="text-gray-600">All credit assessments have been completed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Credit Assessments ({creditQueries.length})
        </h2>
        <div className="text-sm text-gray-500">
          Showing assessments for {selectedBranch?.branchCode || 'all branches'}
        </div>
      </div>

      {/* Queries List */}
      <div className="grid gap-6">
        {creditQueries.map((query) => {
          const riskLevel = getCreditRiskLevel(query);
          
          return (
            <div key={query.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FiUser className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{query.appNo}</h3>
                    <p className="text-gray-600">{query.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(query.priority)}`}>
                    {query.priority.toUpperCase()}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    CREDIT
                  </span>
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100">
                    {getRiskIcon(riskLevel)}
                    <span className="text-gray-700">{riskLevel.toUpperCase()} RISK</span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FiMapPin className="w-4 h-4" />
                  <span>Branch: {query.branchCode}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FiClock className="w-4 h-4" />
                  <span>Submitted: {new Date(query.submittedAt).toLocaleString()}</span>
                </div>
                {query.loanAmount && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FiDollarSign className="w-4 h-4" />
                    <span>Amount: ₹{query.loanAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Credit Details */}
              {(query.creditScore || query.loanAmount) && (
                <div className="bg-green-50 rounded-lg p-3 mb-4">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Credit Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {query.creditScore && (
                      <div>
                        <span className="text-green-700">Credit Score:</span>
                        <span className="ml-2 font-medium text-green-900">{query.creditScore}</span>
                      </div>
                    )}
                    {query.loanAmount && (
                      <div>
                        <span className="text-green-700">Loan Amount:</span>
                        <span className="ml-2 font-medium text-green-900">₹{query.loanAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {query.description && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{query.description}</p>
                </div>
              )}

              {/* Actions - Only Chat is allowed */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => openChatModal(query)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiMessageSquare className="w-4 h-4" />
                  <span>View & Send Message</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chat Modal */}
      {showChatModal && selectedQuery && (
        <QueryChatModal
          isOpen={showChatModal}
          onClose={() => {
            setShowChatModal(false);
            setSelectedQuery(null);
          }}
          queryId={selectedQuery.id.toString()}
          appNo={selectedQuery.appNo}
          customerName={selectedQuery.customerName}
        />
      )}
    </div>
  );
};

export default CreditMyQueries; 