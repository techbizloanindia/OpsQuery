'use client';

import React from 'react';

interface ManagementHeaderProps {
  activeTab: 'overview' | 'otc' | 'deferral';
  onTabChange: (tab: 'overview' | 'otc' | 'deferral') => void;
  stats: {
    totalOTC: number;
    totalDeferral: number;
    pendingOTC: number;
    pendingDeferral: number;
    resolvedOTC: number;
    resolvedDeferral: number;
  };
}

const ManagementHeader: React.FC<ManagementHeaderProps> = ({ activeTab, onTabChange, stats }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'otc', label: 'OTC Queries', icon: '⚡', count: stats.totalOTC },
    { id: 'deferral', label: 'Deferral Queries', icon: '⏳', count: stats.totalDeferral },
  ];

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-6">
          <h1 className="text-3xl font-bold text-gray-900">Management Dashboard</h1>
          <p className="mt-2 text-gray-600">Monitor and manage OTC and Deferral queries</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total OTC</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalOTC}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <span className="text-2xl">⚡</span>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Total Deferral</p>
                <p className="text-2xl font-bold text-orange-900">{stats.totalDeferral}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Pending</p>
                <p className="text-2xl font-bold text-red-900">{stats.pendingOTC + stats.pendingDeferral}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <span className="text-2xl">⏰</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Resolved</p>
                <p className="text-2xl font-bold text-green-900">{stats.resolvedOTC + stats.resolvedDeferral}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as 'overview' | 'otc' | 'deferral')}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default ManagementHeader;
