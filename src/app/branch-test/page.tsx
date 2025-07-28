/**
 * Test page for Real-time Branch Code Display
 */

'use client';

import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiUser, FiMapPin } from 'react-icons/fi';

interface BranchData {
  branchCode: string;
  branchName: string;
  assignedAt?: string;
  team?: string;
  isActive?: boolean;
  enhanced?: boolean;
}

const BranchTestPage: React.FC = () => {
  const [salesBranches, setSalesBranches] = useState<BranchData[]>([]);
  const [creditBranches, setCreditBranches] = useState<BranchData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testEmployeeIds = {
    sales: ['SALES001', 'SALES002', 'EMP001'],
    credit: ['CREDIT001', 'CREDIT002', 'EMP002']
  };

  const fetchBranches = async (employeeId: string, team: 'sales' | 'credit') => {
    try {
      const response = await fetch(`/api/users/branches/${employeeId}?team=${team}&realtime=true`);
      const result = await response.json();
      
      if (result.success) {
        return result.data || [];
      } else {
        console.error(`Error fetching ${team} branches for ${employeeId}:`, result.error);
        return [];
      }
    } catch (error) {
      console.error(`Network error fetching ${team} branches:`, error);
      return [];
    }
  };

  const handleTestFetch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Test sales branches
      const salesResults = await Promise.all(
        testEmployeeIds.sales.map(id => fetchBranches(id, 'sales'))
      );
      const allSalesBranches = salesResults.flat().filter(Boolean);
      setSalesBranches(allSalesBranches);

      // Test credit branches
      const creditResults = await Promise.all(
        testEmployeeIds.credit.map(id => fetchBranches(id, 'credit'))
      );
      const allCreditBranches = creditResults.flat().filter(Boolean);
      setCreditBranches(allCreditBranches);

    } catch (error) {
      setError('Failed to fetch branch data');
      console.error('Test fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch on component mount
  useEffect(() => {
    handleTestFetch();
  }, []);

  const renderBranchCard = (branch: BranchData, team: 'sales' | 'credit') => {
    const colors = team === 'sales' 
      ? { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', accent: 'bg-blue-500' }
      : { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', accent: 'bg-green-500' };

    return (
      <div
        key={`${team}-${branch.branchCode}`}
        className={`${colors.bg} ${colors.border} border-2 rounded-lg p-4 shadow-sm`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 ${colors.accent} rounded-full flex items-center justify-center`}>
              <FiMapPin className="w-3 h-3 text-white" />
            </div>
            <span className={`font-bold text-lg ${colors.text}`}>
              {branch.branchCode}
            </span>
          </div>
          {branch.enhanced && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Enhanced
            </span>
          )}
        </div>
        
        <div className={`text-sm ${colors.text} mb-1`}>
          {branch.branchName}
        </div>
        
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span>Team: {team}</span>
          {branch.isActive !== undefined && (
            <span className={`${branch.isActive ? 'text-green-600' : 'text-red-600'}`}>
              {branch.isActive ? 'Active' : 'Inactive'}
            </span>
          )}
          {branch.assignedAt && (
            <span>Assigned: {new Date(branch.assignedAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Real-time Branch Code Test
              </h1>
              <p className="text-gray-600">
                Testing branch assignments for Sales and Credit teams
              </p>
            </div>
            
            <button
              onClick={handleTestFetch}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Fetching...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-8">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Sales Team */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FiUser className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Sales Team</h2>
                <p className="text-sm text-gray-600">
                  {salesBranches.length} branches found
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {salesBranches.length > 0 ? (
                salesBranches.map(branch => renderBranchCard(branch, 'sales'))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {isLoading ? 'Loading...' : 'No sales branches found'}
                </div>
              )}
            </div>
          </div>

          {/* Credit Team */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <FiUser className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Credit Team</h2>
                <p className="text-sm text-gray-600">
                  {creditBranches.length} branches found
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {creditBranches.length > 0 ? (
                creditBranches.map(branch => renderBranchCard(branch, 'credit'))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {isLoading ? 'Loading...' : 'No credit branches found'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test Employee IDs */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Test Employee IDs</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Sales Team</h4>
              <div className="space-y-1">
                {testEmployeeIds.sales.map(id => (
                  <div key={id} className="text-sm font-mono bg-blue-50 text-blue-800 px-2 py-1 rounded">
                    {id}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-green-800 mb-2">Credit Team</h4>
              <div className="space-y-1">
                {testEmployeeIds.credit.map(id => (
                  <div key={id} className="text-sm font-mono bg-green-50 text-green-800 px-2 py-1 rounded">
                    {id}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchTestPage;
