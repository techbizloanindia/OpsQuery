/**
 * OpsQuery - Credit Query Resolved Component
 * Copyright (c) 2024 OpsQuery Development Team
 * 
 * Licensed under the MIT License.
 * 
 * @fileoverview Credit Query Resolved - Displays resolved credit assessments
 * @author OpsQuery Development Team
 * @version 2.0.0
 */

'use client';

import React, { useState, useMemo } from 'react';
import { 
  FiCheckCircle, 
  FiUser, 
  FiMapPin, 
  FiClock,
  FiMessageSquare,
  FiSearch,
  FiFilter,
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
  resolvedAt?: string;
  resolvedBy?: string;
  description: string;
  resolution?: string;
  loanAmount?: number;
  creditScore?: number;
}

interface CreditQueryResolvedProps {
  queries: Query[];
  isLoading: boolean;
}

const CreditQueryResolved: React.FC<CreditQueryResolvedProps> = ({
  queries,
  isLoading
}) => {
  const { selectedBranch } = useBranchSelection();
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Filter and search queries
  const filteredQueries = useMemo(() => {
    let filtered = queries.filter(query => {
      // Check if query is assigned to credit team
      const isForCredit = query.sendToCredit || 
                         query.markedForTeam === 'credit' || 
                         query.markedForTeam === 'both' ||
                         query.team === 'credit';
      
      // Check if query matches selected branch
      const matchesBranch = !selectedBranch || 
                          query.branchCode === selectedBranch.branchCode;
      
      // Only show resolved queries
      const isResolved = ['resolved', 'approved', 'deferred', 'otc'].includes(query.status);
      
      return isForCredit && matchesBranch && isResolved;
    });

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(query =>
        query.appNo.toLowerCase().includes(search) ||
        query.customerName.toLowerCase().includes(search) ||
        query.branchCode.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(query => query.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          const dateA = new Date(a.resolvedAt || a.submittedAt).getTime();
          const dateB = new Date(b.resolvedAt || b.submittedAt).getTime();
          return dateB - dateA;
        case 'oldest':
          const dateC = new Date(a.resolvedAt || a.submittedAt).getTime();
          const dateD = new Date(b.resolvedAt || b.submittedAt).getTime();
          return dateC - dateD;
        case 'risk':
          const riskA = getCreditRiskLevel(a);
          const riskB = getCreditRiskLevel(b);
          const riskOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return riskOrder[riskB as keyof typeof riskOrder] - riskOrder[riskA as keyof typeof riskOrder];
        default:
          return 0;
      }
    });

    return filtered;
  }, [queries, selectedBranch, searchTerm, statusFilter, sortBy]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'deferred': return 'text-orange-600 bg-orange-100';
      case 'otc': return 'text-purple-600 bg-purple-100';
      case 'resolved': return 'text-blue-600 bg-blue-100';
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
          <p className="text-gray-600">Loading resolved assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Assessments Completed ({filteredQueries.length})
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by app no, customer, or branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 w-full sm:w-64"
            />
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="resolved">Resolved</option>
              <option value="approved">Approved</option>
              <option value="deferred">Deferred</option>
              <option value="otc">OTC</option>
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="risk">By Risk Level</option>
          </select>
        </div>
      </div>

      {/* Queries List */}
      {filteredQueries.length === 0 ? (
        <div className="text-center py-12">
          <FiCheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Assessments</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'No assessments match your search criteria.'
              : 'No credit assessments have been completed yet.'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredQueries.map((query) => {
            const riskLevel = getCreditRiskLevel(query);
            
            return (
              <div key={query.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-all duration-300">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FiCheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{query.appNo}</h3>
                      <p className="text-sm text-gray-600">{query.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(query.priority)}`}>
                      {query.priority.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(query.status)}`}>
                      {query.status === 'approved' ? '✅ APPROVED' :
                       query.status === 'deferred' ? '⏸️ DEFERRED' :
                       query.status === 'otc' ? '💰 OTC APPROVED' :
                       query.status === 'resolved' ? '✅ RESOLVED' :
                       query.status.toUpperCase()}
                    </span>
                    <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100">
                      {getRiskIcon(riskLevel)}
                      <span className="text-gray-700">{riskLevel.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <FiMapPin className="w-4 h-4" />
                    <span>Branch: {query.branchCode}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiClock className="w-4 h-4" />
                    <span>Submitted: {new Date(query.submittedAt).toLocaleDateString()}</span>
                  </div>
                  {query.resolvedAt && (
                    <div className="flex items-center space-x-2">
                      <FiCheckCircle className="w-4 h-4" />
                      <span>Resolved: {new Date(query.resolvedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Credit Details */}
                {(query.creditScore || query.loanAmount) && (
                  <div className="bg-green-50 rounded-lg p-3 mb-3">
                    <h4 className="text-sm font-medium text-green-800 mb-2">Assessment Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {query.creditScore && (
                        <div className="flex items-center space-x-2">
                          <FiShield className="w-4 h-4 text-green-600" />
                          <span className="text-green-700">Credit Score: </span>
                          <span className="font-medium text-green-900">{query.creditScore}</span>
                        </div>
                      )}
                      {query.loanAmount && (
                        <div className="flex items-center space-x-2">
                          <FiDollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-green-700">Amount: </span>
                          <span className="font-medium text-green-900">₹{query.loanAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Resolution Details */}
                {(query.resolvedBy || query.resolution) && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    {query.resolvedBy && (
                      <p className="text-sm text-blue-800 mb-1">
                        <span className="font-medium">Assessed by:</span> {query.resolvedBy}
                      </p>
                    )}
                    {query.resolution && (
                      <p className="text-sm text-blue-700">{query.resolution}</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end">
                  <button
                    onClick={() => openChatModal(query)}
                    className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <FiMessageSquare className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

export default CreditQueryResolved; 