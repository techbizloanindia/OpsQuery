'use client';

import React, { useState, useEffect } from 'react';

interface ManagementUser {
  _id?: string;
  managementId: string;
  employeeId: string;
  name: string;
  email: string;
  role: 'management';
  permissions: string[];
  queryTeamPreferences?: ('sales' | 'credit' | 'both')[];
  createdAt?: Date;
  isActive?: boolean;
}

const ManagementCreationTab: React.FC = () => {
  const [formData, setFormData] = useState({
    managementId: '',
    employeeId: '',
    name: '',
    email: '',
    role: 'management' as const,
    password: '',
    permissions: [] as string[],
    queryTeamPreferences: [] as ('sales' | 'credit' | 'both')[]
  });
  const [managementUsers, setManagementUsers] = useState<ManagementUser[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // New state for user management
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  useEffect(() => {
    fetchManagementUsers();
  }, []);

  const fetchManagementUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/management');
      const data = await response.json();
      if (response.ok) {
        setManagementUsers(data.managementUsers || []);
      } else {
        console.error('Failed to fetch management users:', data.error);
      }
    } catch (error) {
      console.error('Error fetching management users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteUser = async (managementId: string) => {
    try {
      console.log('Attempting to delete management user:', managementId);
      const response = await fetch(`/api/management/${encodeURIComponent(managementId)}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      console.log('Delete response:', response.status, data);

      if (response.ok) {
        setMessage({ type: 'success', text: 'Management user deleted successfully' });
        fetchManagementUsers(); // Refresh the list
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete management user' });
      }
    } catch (error) {
      console.error('Error in handleDeleteUser:', error);
      setMessage({ type: 'error', text: 'An error occurred while deleting the management user' });
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handlePasswordEdit = async (managementId: string) => {
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    setIsEditingPassword(true);
    try {
      const response = await fetch(`/api/management/${managementId}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password updated successfully' });
        setNewPassword('');
        setEditingUserId(null);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating the password' });
    } finally {
      setIsEditingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: `Management user created successfully! ID: ${data.managementUser.managementId}` });
        setFormData({
          managementId: '',
          employeeId: '',
          name: '',
          email: '',
          role: 'management',
          password: '',
          permissions: [],
          queryTeamPreferences: []
        });
        fetchManagementUsers(); // Refresh the list
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create management user' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while creating the management user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Create Management User Form */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-black">Create Management User</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span>Query Approval Authority Available</span>
          </div>
        </div>
        
        {/* Quick Auth Options Summary */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">📋 Available Authorization Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-2 bg-green-100 rounded-lg">
              <span className="text-green-600">✅</span>
              <span className="text-xs font-medium text-green-800">General Query Approval</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-orange-100 rounded-lg">
              <span className="text-orange-600">🟡</span>
              <span className="text-xs font-medium text-orange-800">OTC Query Approval</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-purple-100 rounded-lg">
              <span className="text-purple-600">⏳</span>
              <span className="text-xs font-medium text-purple-800">Deferral Query Approval</span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-black mb-2">
                Employee ID
              </label>
              <input
                type="text"
                id="employeeId"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Enter employee ID"
              />
            </div>

            <div>
              <label htmlFor="managementId" className="block text-sm font-medium text-black mb-2">
                Management ID
              </label>
              <input
                type="text"
                id="managementId"
                name="managementId"
                value={formData.managementId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Admin will decide Management ID format"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Enter password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-black mb-2">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              >
                <option value="management">Management</option>
              </select>
            </div>
          </div>

          {/* Authorization Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-4">
              📋 Authorization Options
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="approve_queries"
                  checked={formData.permissions.includes('approve_queries')}
                  onChange={(e) => {
                    const { checked } = e.target;
                    setFormData(prev => ({
                      ...prev,
                      permissions: checked 
                        ? [...prev.permissions, 'approve_queries']
                        : prev.permissions.filter(p => p !== 'approve_queries')
                    }));
                  }}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="approve_queries" className="ml-3 flex items-center">
                  <span className="text-green-600 mr-2">✅</span>
                  <span className="text-sm font-medium text-green-800">General Query Approval</span>
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="approve_otc_queries"
                  checked={formData.permissions.includes('approve_otc_queries')}
                  onChange={(e) => {
                    const { checked } = e.target;
                    setFormData(prev => ({
                      ...prev,
                      permissions: checked 
                        ? [...prev.permissions, 'approve_otc_queries']
                        : prev.permissions.filter(p => p !== 'approve_otc_queries')
                    }));
                  }}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="approve_otc_queries" className="ml-3 flex items-center">
                  <span className="text-orange-600 mr-2">🟡</span>
                  <span className="text-sm font-medium text-orange-800">OTC Query Approval</span>
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="approve_deferral_queries"
                  checked={formData.permissions.includes('approve_deferral_queries')}
                  onChange={(e) => {
                    const { checked } = e.target;
                    setFormData(prev => ({
                      ...prev,
                      permissions: checked 
                        ? [...prev.permissions, 'approve_deferral_queries']
                        : prev.permissions.filter(p => p !== 'approve_deferral_queries')
                    }));
                  }}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="approve_deferral_queries" className="ml-3 flex items-center">
                  <span className="text-purple-600 mr-2">⏳</span>
                  <span className="text-sm font-medium text-purple-800">Deferral Query Approval</span>
                </label>
              </div>
            </div>
            
            {/* Selected Permissions Preview */}
            {formData.permissions.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-2">Selected Authorizations:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.permissions.includes('approve_queries') && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-300">
                      ✅ General Approval
                    </span>
                  )}
                  {formData.permissions.includes('approve_otc_queries') && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-800 border border-orange-300">
                      🟡 OTC Authority
                    </span>
                  )}
                  {formData.permissions.includes('approve_deferral_queries') && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                      ⏳ Deferral Control
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Query Team Preferences */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-4">
              🎯 Query Team Viewing Preferences
            </label>
            <p className="text-sm text-gray-600 mb-4">
              Select which team's queries this management user can view and approve. This controls which queries appear in their approval dashboard.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sales_queries"
                  checked={formData.queryTeamPreferences.includes('sales')}
                  onChange={(e) => {
                    const { checked } = e.target;
                    setFormData(prev => ({
                      ...prev,
                      queryTeamPreferences: checked 
                        ? [...prev.queryTeamPreferences, 'sales']
                        : prev.queryTeamPreferences.filter(p => p !== 'sales')
                    }));
                  }}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="sales_queries" className="ml-3 flex items-center">
                  <span className="text-green-600 mr-2">📈</span>
                  <span className="text-sm font-medium text-green-800">Sales Team Queries</span>
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="credit_queries"
                  checked={formData.queryTeamPreferences.includes('credit')}
                  onChange={(e) => {
                    const { checked } = e.target;
                    setFormData(prev => ({
                      ...prev,
                      queryTeamPreferences: checked 
                        ? [...prev.queryTeamPreferences, 'credit']
                        : prev.queryTeamPreferences.filter(p => p !== 'credit')
                    }));
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="credit_queries" className="ml-3 flex items-center">
                  <span className="text-blue-600 mr-2">💳</span>
                  <span className="text-sm font-medium text-blue-800">Credit Team Queries</span>
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="both_queries"
                  checked={formData.queryTeamPreferences.includes('both')}
                  onChange={(e) => {
                    const { checked } = e.target;
                    setFormData(prev => ({
                      ...prev,
                      queryTeamPreferences: checked 
                        ? [...prev.queryTeamPreferences, 'both']
                        : prev.queryTeamPreferences.filter(p => p !== 'both')
                    }));
                  }}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="both_queries" className="ml-3 flex items-center">
                  <span className="text-purple-600 mr-2">🔄</span>
                  <span className="text-sm font-medium text-purple-800">Both Teams (Universal)</span>
                </label>
              </div>
            </div>
            
            {/* Selected Query Team Preferences Preview */}
            {formData.queryTeamPreferences.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-800 mb-2">Selected Query Teams:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.queryTeamPreferences.includes('sales') && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-300">
                      📈 Sales Queries
                    </span>
                  )}
                  {formData.queryTeamPreferences.includes('credit') && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                      💳 Credit Queries
                    </span>
                  )}
                  {formData.queryTeamPreferences.includes('both') && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                      🔄 Universal Access
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {message && (
            <div className={`p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Management User'}
            </button>
          </div>
        </form>
      </div>

      {/* Management Users List */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-black mb-6">Management Users</h3>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-black">Loading management users...</p>
          </div>
        ) : managementUsers.length === 0 ? (
          <div className="text-center py-8 text-black">
            No management users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Management ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Access Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Query Teams
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {managementUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                      <div className="flex flex-col">
                        <span className="font-semibold">{user.managementId}</span>
                        <span className="text-xs text-gray-500">({user.name})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {user.employeeId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      <div className="max-w-xs">
                        <div className="flex flex-wrap gap-2">
                          {user.permissions?.includes('approve_queries') && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-300">
                              ✅ General
                            </span>
                          )}
                          {user.permissions?.includes('approve_otc_queries') && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-800 border border-orange-300">
                              🟡 OTC
                            </span>
                          )}
                          {user.permissions?.includes('approve_deferral_queries') && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                              ⏳ Deferral
                            </span>
                          )}
                          {(!user.permissions || user.permissions.length === 0) && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              🔒 Limited Access
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      <div className="max-w-xs">
                        <div className="flex flex-wrap gap-2">
                          {user.queryTeamPreferences?.includes('sales') && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-300">
                              📈 Sales
                            </span>
                          )}
                          {user.queryTeamPreferences?.includes('credit') && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                              💳 Credit
                            </span>
                          )}
                          {user.queryTeamPreferences?.includes('both') && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                              🔄 Both
                            </span>
                          )}
                          {(!user.queryTeamPreferences || user.queryTeamPreferences.length === 0) && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              ❌ None Selected
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingUserId(user.managementId)}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                        >
                          Edit Password
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(user.managementId)}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Password Edit Modal */}
      {editingUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg border border-gray-200 w-full max-w-md">
            <h4 className="text-lg font-semibold text-black mb-4">Edit Password</h4>
            <div className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-black mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Enter new password"
                  minLength={6}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setEditingUserId(null);
                    setNewPassword('');
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePasswordEdit(editingUserId)}
                  disabled={isEditingPassword || !newPassword || newPassword.length < 6}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg border border-gray-200 w-full max-w-md">
            <h4 className="text-lg font-semibold text-black mb-4">Confirm Deletion</h4>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this management user? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementCreationTab;
