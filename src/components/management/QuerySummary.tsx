'use client';

import React from 'react';

interface QuerySummaryProps {
  stats: {
    totalOTC: number;
    totalDeferral: number;
    pendingOTC: number;
    pendingDeferral: number;
    resolvedOTC: number;
    resolvedDeferral: number;
  };
  onTabChange: (tab: 'overview' | 'otc' | 'deferral') => void;
}

const QuerySummary: React.FC<QuerySummaryProps> = ({ stats, onTabChange }) => {
  const getStatusColor = (type: 'pending' | 'resolved') => {
    return type === 'pending' ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50';
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OTC Summary */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="text-2xl mr-2">⚡</span>
              OTC Queries
            </h3>
            <button
              onClick={() => onTabChange('otc')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
              <span className="text-gray-700">Total OTC Queries</span>
              <span className="font-semibold text-gray-900">{stats.totalOTC}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-lg bg-red-50">
              <span className="text-red-700">Pending</span>
              <span className="font-semibold text-red-900">{stats.pendingOTC}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-lg bg-green-50">
              <span className="text-green-700">Resolved</span>
              <span className="font-semibold text-green-900">{stats.resolvedOTC}</span>
            </div>
          </div>
          
          {stats.totalOTC > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${(stats.resolvedOTC / stats.totalOTC) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {Math.round((stats.resolvedOTC / stats.totalOTC) * 100)}% resolved
              </p>
            </div>
          )}
        </div>

        {/* Deferral Summary */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="text-2xl mr-2">⏳</span>
              Deferral Queries
            </h3>
            <button
              onClick={() => onTabChange('deferral')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
              <span className="text-gray-700">Total Deferral Queries</span>
              <span className="font-semibold text-gray-900">{stats.totalDeferral}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-lg bg-red-50">
              <span className="text-red-700">Pending</span>
              <span className="font-semibold text-red-900">{stats.pendingDeferral}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-lg bg-green-50">
              <span className="text-green-700">Resolved</span>
              <span className="font-semibold text-green-900">{stats.resolvedDeferral}</span>
            </div>
          </div>
          
          {stats.totalDeferral > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${(stats.resolvedDeferral / stats.totalDeferral) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {Math.round((stats.resolvedDeferral / stats.totalDeferral) * 100)}% resolved
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onTabChange('otc')}
            className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
          >
            <div className="flex items-center mb-2">
              <span className="text-xl mr-2">⚡</span>
              <span className="font-medium text-gray-900">Review OTC Queries</span>
            </div>
            <p className="text-sm text-gray-600">
              {stats.pendingOTC} pending queries need attention
            </p>
          </button>

          <button
            onClick={() => onTabChange('deferral')}
            className="p-4 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-left"
          >
            <div className="flex items-center mb-2">
              <span className="text-xl mr-2">⏳</span>
              <span className="font-medium text-gray-900">Review Deferral Queries</span>
            </div>
            <p className="text-sm text-gray-600">
              {stats.pendingDeferral} pending queries need attention
            </p>
          </button>

          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center mb-2">
              <span className="text-xl mr-2">📊</span>
              <span className="font-medium text-gray-900">Performance</span>
            </div>
            <p className="text-sm text-gray-600">
              {stats.resolvedOTC + stats.resolvedDeferral} total resolved queries
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuerySummary;
