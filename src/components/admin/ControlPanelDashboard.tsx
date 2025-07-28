'use client';

import React, { useState } from 'react';
import ControlPanelNavbar from './ControlPanelNavbar';
import UserCreationTab from './UserCreationTab';
import BulkUploadTab from './BulkUploadTab';
import BranchManagementTab from './BranchManagementTab';

type TabType = 'user-management' | 'bulk-upload' | 'branch-management';

const ControlPanelDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('user-management');

  const tabs = [
    { id: 'user-management', label: 'User Management', icon: '👤' },
    { id: 'bulk-upload', label: 'Bulk Upload', icon: '📄' },
    { id: 'branch-management', label: 'Branch Management', icon: '🏢' },
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      <ControlPanelNavbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Control Panel</h1>
          <p className="text-gray-600">Manage users, branches, and system configurations</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-0">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 border-b-2 ${
                    activeTab === tab.id
                      ? 'border-cyan-500 text-cyan-600 bg-cyan-50'
                      : 'border-transparent text-gray-600 hover:text-cyan-600 hover:border-cyan-300'
                  } ${index === 0 ? 'rounded-tl-lg' : ''} ${index === tabs.length - 1 ? 'rounded-tr-lg' : ''}`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 min-h-[600px]">
          {activeTab === 'user-management' && <UserCreationTab />}
          {activeTab === 'bulk-upload' && <BulkUploadTab />}
          {activeTab === 'branch-management' && <BranchManagementTab />}
        </div>
      </div>
    </div>
  );
};

export default ControlPanelDashboard; 