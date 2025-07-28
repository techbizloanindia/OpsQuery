/**
 * OpsQuery - Sales My Queries Component
 * Copyright (c) 2024 OpsQuery Development Team
 * 
 * Licensed under the MIT License.
 * 
 * @fileoverview My Queries - Displays pending sales queries
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
  FiRefreshCw
} from 'react-icons/fi';
import QueryChatModal from '@/components/shared/QueryChatModal';
import { useBranchSelection } from '@/hooks/useBranchSelection';

interface Query {
  id: number;
  appNo: string;
  customerName: string;
  priority?: 'low' | 'medium' | 'high';
  status: string;
  team: string;
  sendToSales?: boolean;
  sendToCredit?: boolean;
  markedForTeam?: string;
  branchCode: string;
  submittedAt: string;
  description: string;
}

interface MyQueriesProps {
  queries: Query[];
  isLoading: boolean;
}

const MyQueries: React.FC<MyQueriesProps> = ({
  queries,
  isLoading
}) => {
  const { selectedBranch } = useBranchSelection();
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);

  // Filter queries for sales team
  const salesQueries = queries.filter(query => {
    // Check if query is assigned to sales team
    const isForSales = query.sendToSales || 
                      query.markedForTeam === 'sales' || 
                      query.markedForTeam === 'both' ||
                      query.team === 'sales';
    
    // Check if query matches selected branch
    const matchesBranch = !selectedBranch || 
                         query.branchCode === selectedBranch.branchCode;
    
    // Only show pending queries
    const isPending = query.status === 'pending';
    
    return isForSales && matchesBranch && isPending;
  });

  const openChatModal = (query: Query) => {
    setSelectedQuery(query);
    setShowChatModal(true);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FiRefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading sales queries...</p>
        </div>
      </div>
    );
  }

  if (salesQueries.length === 0) {
    return (
      <div className="text-center py-12">
        <FiCheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Queries</h3>
        <p className="text-gray-600">All sales queries have been processed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          My Queries ({salesQueries.length})
        </h2>
        <div className="text-sm text-gray-500">
          Showing queries for {selectedBranch?.branchCode || 'all branches'}
        </div>
      </div>

      {/* Queries List */}
      <div className="grid gap-6">
        {salesQueries.map((query) => (
          <div key={query.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiUser className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{query.appNo}</h3>
                  <p className="text-gray-600">{query.customerName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(query.priority)}`}>
                  {(query.priority || 'medium').toUpperCase()}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  SALES
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FiMapPin className="w-4 h-4" />
                <span>Branch: {query.branchCode}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FiClock className="w-4 h-4" />
                <span>Submitted: {new Date(query.submittedAt).toLocaleString()}</span>
              </div>
            </div>

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
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiMessageSquare className="w-4 h-4" />
                <span>View & Send Message</span>
              </button>
            </div>
          </div>
        ))}
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

export default MyQueries; 