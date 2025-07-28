'use client';

import React, { useState, useEffect } from 'react';

interface LoginSession {
  _id: string;
  userId: string;
  username: string;
  fullName: string;
  role: 'operations' | 'sales' | 'credit';
  department: string;
  branch: string;
  loginTime: string;
  logoutTime?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'active' | 'logged_out';
  sessionDuration?: number;
}

interface LoginStats {
  operations: {
    totalUsers: number;
    activeUsers: number;
    totalLogins: number;
    avgSessionTime: number;
  };
  sales: {
    totalUsers: number;
    activeUsers: number;
    totalLogins: number;
    avgSessionTime: number;
  };
  credit: {
    totalUsers: number;
    activeUsers: number;
    totalLogins: number;
    avgSessionTime: number;
  };
}

const LoginTrackerTab: React.FC = () => {
  const [activeView, setActiveView] = useState<'overview' | 'operations' | 'sales' | 'credit'>('overview');
  const [loginSessions, setLoginSessions] = useState<LoginSession[]>([]);
  const [stats, setStats] = useState<LoginStats>({
    operations: { totalUsers: 0, activeUsers: 0, totalLogins: 0, avgSessionTime: 0 },
    sales: { totalUsers: 0, activeUsers: 0, totalLogins: 0, avgSessionTime: 0 },
    credit: { totalUsers: 0, activeUsers: 0, totalLogins: 0, avgSessionTime: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(true);

  useEffect(() => {
    fetchLoginData();
    
    let interval: NodeJS.Timeout;
    if (isLiveMode) {
      interval = setInterval(() => {
        fetchLoginData();
      }, 30000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [dateRange, isLiveMode]);

  const fetchLoginData = async () => {
    try {
      setLoading(true);
      
      console.log('📊 Login Tracker: Fetching real-time data for range:', dateRange);
      
      const response = await fetch(`/api/admin/login-tracker?range=${dateRange}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Login Tracker API Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Login Tracker API Response data:', data);

      if (data.success) {
        setLoginSessions(data.sessions || []);
        setStats(data.stats || stats);
        setLastUpdated(new Date());
        console.log('✅ Updated with real data:', data.sessions?.length, 'sessions');
      } else {
        console.error('❌ API returned error:', data.message);
        throw new Error(data.message || 'API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error fetching login data:', error);
      
      console.log('🔄 Using empty data due to API error');
      
      setLoginSessions([]);
      setStats({
        operations: { totalUsers: 0, activeUsers: 0, totalLogins: 0, avgSessionTime: 0 },
        sales: { totalUsers: 0, activeUsers: 0, totalLogins: 0, avgSessionTime: 0 },
        credit: { totalUsers: 0, activeUsers: 0, totalLogins: 0, avgSessionTime: 0 }
      });
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'operations': return 'bg-blue-100 text-blue-800';
      case 'sales': return 'bg-green-100 text-green-800';
      case 'credit': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Operations Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Operations</h3>
              <p className="text-sm text-gray-600">User Activity</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Users:</span>
              <span className="font-semibold text-green-600">{stats.operations.activeUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Users:</span>
              <span className="font-semibold">{stats.operations.totalUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Logins:</span>
              <span className="font-semibold">{stats.operations.totalLogins}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Session:</span>
              <span className="font-semibold">{formatDuration(stats.operations.avgSessionTime)}</span>
            </div>
          </div>
        </div>

        {/* Sales Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sales</h3>
              <p className="text-sm text-gray-600">User Activity</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Users:</span>
              <span className="font-semibold text-green-600">{stats.sales.activeUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Users:</span>
              <span className="font-semibold">{stats.sales.totalUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Logins:</span>
              <span className="font-semibold">{stats.sales.totalLogins}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Session:</span>
              <span className="font-semibold">{formatDuration(stats.sales.avgSessionTime)}</span>
            </div>
          </div>
        </div>

        {/* Credit Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Credit</h3>
              <p className="text-sm text-gray-600">User Activity</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Users:</span>
              <span className="font-semibold text-green-600">{stats.credit.activeUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Users:</span>
              <span className="font-semibold">{stats.credit.totalUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Logins:</span>
              <span className="font-semibold">{stats.credit.totalLogins}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Session:</span>
              <span className="font-semibold">{formatDuration(stats.credit.avgSessionTime)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {loginSessions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Login Activity</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loginSessions.slice(0, 5).map((session) => (
                  <tr key={session._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{session.fullName}</div>
                        <div className="text-sm text-gray-500">@{session.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(session.role)}`}>
                        {session.role.charAt(0).toUpperCase() + session.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(session.loginTime)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                        {session.status === 'active' ? 'Active' : 'Logged Out'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.sessionDuration ? formatDuration(session.sessionDuration) : 'Active'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loginSessions.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Login Sessions Found</h3>
          <p className="text-gray-600">There are no login sessions for the selected date range.</p>
        </div>
      )}
    </div>
  );

  const renderDetailedView = (role: 'operations' | 'sales' | 'credit') => {
    const filteredSessions = loginSessions.filter(session => session.role === role);
    
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 capitalize">{role} Login Sessions</h3>
          <p className="text-sm text-gray-600">{filteredSessions.length} sessions found</p>
        </div>
        {filteredSessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSessions.map((session) => (
                  <tr key={session._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{session.fullName}</div>
                        <div className="text-sm text-gray-500">@{session.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.branch}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(session.loginTime)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.ipAddress}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                        {session.status === 'active' ? 'Active' : 'Logged Out'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.sessionDuration ? formatDuration(session.sessionDuration) : 'Active'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-500">No login sessions found for {role}</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">Login Tracker</h2>
            {isLiveMode && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Live</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4 mt-1">
            <p className="text-gray-600">Monitor user login activity across departments</p>
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsLiveMode(!isLiveMode)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isLiveMode 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isLiveMode ? '⏸️ Pause Live' : '▶️ Start Live'}
          </button>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button
            onClick={fetchLoginData}
            disabled={loading}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'operations', label: 'Operations', icon: '🏢' },
            { key: 'sales', label: 'Sales', icon: '📈' },
            { key: 'credit', label: 'Credit', icon: '💳' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === tab.key
                  ? 'border-cyan-500 text-cyan-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeView === 'overview' && renderOverview()}
      {activeView === 'operations' && renderDetailedView('operations')}
      {activeView === 'sales' && renderDetailedView('sales')}
      {activeView === 'credit' && renderDetailedView('credit')}
    </div>
  );
};

export default LoginTrackerTab;
