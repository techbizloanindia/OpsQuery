'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaSearch, FaSpinner, FaExclamationCircle, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaBuilding, FaCalendarAlt, FaTimes, FaPlus, FaCheckCircle, FaPaperPlane, FaChevronDown } from 'react-icons/fa';
import EmptyState from './EmptyState';
import { useAuth } from '@/contexts/AuthContext';

interface AddQueryProps {
  appNo?: string;
}

interface ApplicationDetails {
  appNo: string;
  customerName: string;
  loanAmount: string;
  status: string;
  // Enhanced details
  customerPhone: string;
  customerEmail: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  employeeId: string;
  branchName: string;
  loanType: string;
  appliedDate: string;
  lastUpdated: string;
  sanctionedAmount: string;
  sanctionedDate?: string;
  tenure: string;
  interestRate: string;
  processingFee: string;
  cibilScore: number | string;
  monthlyIncome: string;
  companyName: string;
  designation: string;
  workExperience: string;
  priority?: string;
  documentStatus?: string;
  remarks?: string;
}

interface QueryItem {
  id: number;
  text: string;
}

// Search for application
const searchApplication = async (appNo: string): Promise<ApplicationDetails | null> => {
  try {
    console.log(`🔍 Frontend: Searching for application: "${appNo}"`);
    const response = await fetch(`/api/applications/${appNo}`);
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      console.log('❌ Frontend: Search failed:', result);
      
      // Enhanced error message with suggestions
      let errorMessage = result.error || 'Failed to find application';
      
      if (result.suggestion) {
        errorMessage += `\n\n💡 Suggestion: ${result.suggestion}`;
      }
      
      if (result.debug?.sampleApplications?.length > 0) {
        errorMessage += `\n\n📋 Available App.No examples:`;
        result.debug.sampleApplications.slice(0, 3).forEach((app: any) => {
          errorMessage += `\n• ${app.appId} (${app.customerName})`;
        });
      }
      
      throw new Error(errorMessage);
    }
    
    console.log(`✅ Frontend: Found application:`, result.data.appNo);
    return result.data;
  } catch (error) {
    console.error('💥 Frontend: Error searching for application:', error);
    return null;
  }
};

// Submit query
const submitQuery = async (data: {
  appNo: string;
  queries: string[];
  sendTo: string;
}): Promise<any> => {
  try {
    const response = await fetch('/api/queries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to submit query');
    }
    
    return result;
  } catch (error) {
    console.error('Error submitting query:', error);
    throw error;
  }
};

export default function AddQuery({ appNo = '' }: AddQueryProps) {
  const [searchTerm, setSearchTerm] = useState(appNo);
  const [queries, setQueries] = useState<QueryItem[]>([{ id: 1, text: '' }]);
  const [sendTo, setSendTo] = useState<string[]>(['Sales']);
  const [searchResult, setSearchResult] = useState<ApplicationDetails | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showBothTeams, setShowBothTeams] = useState(false);
  const [querySubmitted, setQuerySubmitted] = useState(false);
  
  // Get user information from auth context
  const { user } = useAuth();
  
  const queryClient = useQueryClient();
  
  // Available teams
  const availableTeams = [
    { id: 'Sales', label: '🏢 Sales Team', color: 'bg-blue-50 hover:bg-blue-100' },
    { id: 'Credit', label: '💳 Credit Team', color: 'bg-green-50 hover:bg-green-100' },
    { id: 'Both', label: '🔄 Both Teams', color: 'bg-purple-50 hover:bg-purple-100' },
  ];

  // Auto-search when appNo prop changes (from "Raise Query" button click)
  useEffect(() => {
    if (appNo && appNo !== searchTerm) {
      // Enhanced cleaning for auto-search from "Raise Query" button
      const cleanAppNo = appNo
        .trim()                          // Remove leading/trailing spaces
        .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
        .toUpperCase();                 // Convert to uppercase for consistency
      
      console.log(`🔍 Frontend: Auto-search normalized: "${appNo}" → "${cleanAppNo}"`);
      
      setSearchTerm(cleanAppNo);
      // Automatically search for the application details
      setIsSearching(true);
      searchMutation.mutate(cleanAppNo);
    }
  }, [appNo]);

  // Clear success message after 10 seconds
  useEffect(() => {
    if (querySubmitted) {
      const timer = setTimeout(() => {
        setQuerySubmitted(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [querySubmitted]);
  
  // React Query mutation for searching application
  const searchMutation = useMutation({
    mutationFn: searchApplication,
    onSuccess: (data) => {
      if (data) {
        setSearchResult(data);
        setSearchError(null);
      } else {
        setSearchResult(null);
        setSearchError('Application not found');
      }
      setIsSearching(false);
    },
    onError: (error) => {
      setSearchResult(null);
      setSearchError('Error searching for application');
      setIsSearching(false);
    }
  });
  
  // React Query mutation for submitting query with real-time updates
  const submitMutation = useMutation({
    mutationFn: submitQuery,
    onSuccess: (data) => {
      if (data.success) {
        // Reset form
        setQueries([{ id: 1, text: '' }]);
        setQuerySubmitted(true);
        
        // Invalidate and refetch query data for real-time updates across all dashboards
        queryClient.invalidateQueries({ queryKey: ['pendingQueries'] });
        queryClient.invalidateQueries({ queryKey: ['resolvedQueries'] });
        queryClient.invalidateQueries({ queryKey: ['salesQueries'] });
        queryClient.invalidateQueries({ queryKey: ['creditQueries'] });
        queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
        queryClient.invalidateQueries({ queryKey: ['queryActions'] });
        
        // Show success message without alert
        console.log('Query submitted successfully:', data.message);
      } else {
        setSearchError('Failed to submit queries: ' + data.message);
      }
    },
    onError: (error) => {
      setSearchError('Error submitting queries. Please try again.');
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Enhanced cleaning: normalize spaces, trim, and handle various formats
    const cleanSearchTerm = searchTerm
      .trim()                          // Remove leading/trailing spaces
      .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
      .toUpperCase();                 // Convert to uppercase for consistency
    
    if (!cleanSearchTerm) return;
    
    console.log(`🔍 Frontend: Normalized search term: "${searchTerm}" → "${cleanSearchTerm}"`);
    
    setIsSearching(true);
    setQuerySubmitted(false);
    searchMutation.mutate(cleanSearchTerm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchResult || queries.some(q => !q.text.trim())) return;
    
    // Filter out empty queries
    const validQueries = queries.filter(q => q.text.trim().length > 0).map(q => q.text);
    
    if (validQueries.length === 0) {
      setSearchError('Please enter at least one query');
      return;
    }
    
    // Include user information in the submission
    submitMutation.mutate({
      appNo: searchResult.appNo,
      queries: validQueries,
      sendTo: sendTo.join(', ')
    });
  };

  const handleQueryChange = (id: number, text: string) => {
    setQueries(prevQueries => 
      prevQueries.map(q => q.id === id ? { ...q, text } : q)
    );
  };

  const addQuery = () => {
    const newId = Math.max(0, ...queries.map(q => q.id)) + 1;
    setQueries([...queries, { id: newId, text: '' }]);
  };

  const removeQuery = (id: number) => {
    if (queries.length > 1) {
      setQueries(queries.filter(q => q.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'sanctioned':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'under processing':
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCibilScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 650) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleTeamSelection = (teamId: string) => {
    if (teamId === 'Both') {
      setSendTo(['Sales', 'Credit']);
      setShowBothTeams(true);
    } else {
      setSendTo([teamId]);
      setShowBothTeams(false);
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Success Message */}
      {querySubmitted && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-center gap-3 animate-fadeIn">
          <FaCheckCircle className="text-green-600 text-xl" />
          <div className="flex-1">
            <p className="font-medium text-green-800">Query submitted successfully!</p>
            <p className="text-green-700 text-sm">
              Your query has been sent to {sendTo.join(' and ')} team{sendTo.length > 1 ? 's' : ''} in real-time.
            </p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FaSearch className="text-cyan-600" />
          Search Sanctioned Case by App.No
          {appNo && (
            <span className="text-sm bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full font-medium">
              Auto-loaded: {appNo}
            </span>
          )}
        </h2>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Enter App.No (e.g., GGNP001, APP123)"
              className="w-full p-4 pl-12 border-2 border-gray-300 rounded-xl text-black text-lg focus:border-cyan-500 focus:outline-none transition-colors font-bold bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ color: '#000000', backgroundColor: '#ffffff', fontWeight: '700' }}
            />
            <FaSearch className="absolute left-4 top-5 text-gray-400" />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchTerm.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-semibold"
          >
            {isSearching ? (
              <>
                <FaSpinner className="animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <FaSearch />
                Search
              </>
            )}
          </button>
        </form>
        
        {searchError && (
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-lg">
            <div className="flex items-start gap-3">
              <FaExclamationCircle className="text-red-500 mt-1 flex-shrink-0" />
              <div className="font-medium">
                <div className="mb-2">Application Search Failed</div>
                <pre className="whitespace-pre-wrap text-sm font-normal">{searchError}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {searchResult ? (
        <div className="space-y-8">
          {/* Application Details */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FaBuilding />
                Application Details
              </h3>
              <p className="text-blue-100 text-sm">
                Showing details for App.No: {searchResult.appNo}
              </p>
            </div>
            
            <div className="p-4 sm:p-6">
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 pb-4 border-b border-gray-200">
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{searchResult.customerName}</h4>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(searchResult.status)}`}>
                      {searchResult.status}
                    </span>
                    {searchResult.priority && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        searchResult.priority === 'high' ? 'bg-red-100 text-red-800' :
                        searchResult.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {searchResult.priority.toUpperCase()} PRIORITY
                      </span>
                    )}
                    <span className="text-gray-600">
                      Applied: {searchResult.appliedDate}
                    </span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  <div className="text-right">
                    <span className="text-gray-600">Loan Amount:</span>
                    <p className="text-xl font-bold text-gray-900">
                      {searchResult.loanAmount !== 'Not specified' ? `₹${searchResult.loanAmount}` : searchResult.loanAmount}
                    </p>
                  </div>
                  {searchResult.sanctionedAmount && searchResult.sanctionedAmount !== 'Same as loan amount' && (
                    <div className="text-right mt-1">
                      <span className="text-gray-600">Sanctioned:</span>
                      <p className="text-lg font-semibold text-green-600">₹{searchResult.sanctionedAmount}</p>
                    </div>
                  )}
                  {searchResult.sanctionedDate && (
                    <div className="text-right mt-1">
                      <span className="text-gray-600 text-sm">Sanctioned on:</span>
                      <p className="text-sm text-gray-700">{searchResult.sanctionedDate}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {/* Contact Information */}
                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Contact Information</h5>
                  <div className="flex items-start gap-3">
                    <FaPhone className="text-gray-400 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">{searchResult.customerPhone}</p>
                      <p className="text-sm text-gray-600">Phone</p>
                    </div>
                  </div>
                  {searchResult.customerEmail !== 'Not provided' && (
                    <div className="flex items-start gap-3">
                      <FaEnvelope className="text-gray-400 mt-1" />
                      <div>
                        <p className="font-medium text-gray-900">{searchResult.customerEmail}</p>
                        <p className="text-sm text-gray-600">Email</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="text-gray-400 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">{searchResult.address}</p>
                      <p className="text-sm text-gray-600">{searchResult.city}, {searchResult.state} - {searchResult.pincode}</p>
                    </div>
                  </div>
                </div>
                
                {/* Loan Details */}
                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Loan Details</h5>
                  <div>
                    <p className="text-sm text-gray-600">Loan Type</p>
                    <p className="font-medium text-gray-900">{searchResult.loanType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tenure</p>
                    <p className="font-medium text-gray-900">
                      {searchResult.tenure.includes('months') ? searchResult.tenure : `${searchResult.tenure} months`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Interest Rate</p>
                    <p className="font-medium text-gray-900">
                      {searchResult.interestRate.includes('%') ? searchResult.interestRate : `${searchResult.interestRate}%`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Processing Fee</p>
                    <p className="font-medium text-gray-900">{searchResult.processingFee}</p>
                  </div>
                </div>
                
                {/* Employment Details */}
                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Employment & Credit</h5>
                  <div>
                    <p className="text-sm text-gray-600">Company</p>
                    <p className="font-medium text-gray-900">{searchResult.companyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Designation</p>
                    <p className="font-medium text-gray-900">{searchResult.designation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Income</p>
                    <p className="font-medium text-gray-900">₹{searchResult.monthlyIncome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CIBIL Score</p>
                    <p className={`font-medium ${typeof searchResult.cibilScore === 'number' ? getCibilScoreColor(searchResult.cibilScore) : 'text-gray-900'}`}>
                      {searchResult.cibilScore}
                      {typeof searchResult.cibilScore === 'number' && (
                        <span className="ml-1 text-xs">
                          {searchResult.cibilScore >= 750 ? '(Excellent)' : 
                           searchResult.cibilScore >= 650 ? '(Good)' : '(Needs Improvement)'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {(searchResult.documentStatus || searchResult.remarks) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h5 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Additional Information</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResult.documentStatus && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <p className="text-sm text-green-700 font-medium">Document Status</p>
                        <p className="text-green-900">{searchResult.documentStatus}</p>
                      </div>
                    )}
                    {searchResult.remarks && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700 font-medium">Remarks</p>
                        <p className="text-blue-900 text-sm">{searchResult.remarks}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Add Query Form */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
            <div className="bg-purple-600 p-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FaPlus />
                Add New Query - Real-time Submission
              </h3>
              <p className="text-purple-100 text-sm mt-1">
                Queries will be sent instantly to selected teams and appear in their dashboard immediately
              </p>
            </div>
            
            <div className="p-4 sm:p-6">
              {/* Team Selection - Simplified */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-gray-700 font-bold mb-2">Send To (Real-time):</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full md:w-auto flex items-center justify-between gap-2 p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span>
                      {showBothTeams ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                          <span className="w-3 h-3 rounded-full bg-green-500"></span>
                          Both Teams
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${
                            sendTo.includes('Sales') ? 'bg-blue-500' : 'bg-green-500'
                          }`}></span>
                          {sendTo[0]} Team
                        </span>
                      )}
                    </span>
                    <FaChevronDown className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full md:w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                      {availableTeams.map((team) => (
                        <button
                          key={team.id}
                          type="button"
                          onClick={() => handleTeamSelection(team.id)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                            (team.id === 'Both' && showBothTeams) || 
                            (team.id !== 'Both' && !showBothTeams && sendTo.includes(team.id))
                              ? 'bg-blue-50'
                              : ''
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${team.color}`}>
                            {team.label.split(' ')[0]}
                          </div>
                          <span>{team.label.split(' ').slice(1).join(' ')}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {showBothTeams ? 'Both Sales and Credit Teams' : `${sendTo[0]} Team Only`}
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">Query Details:</label>
                <div className="space-y-4">
                  {queries.map((query, index) => (
                    <div key={query.id} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <textarea
                          value={query.text}
                          onChange={(e) => handleQueryChange(query.id, e.target.value)}
                          placeholder={`Query ${index + 1}: Describe the issue or question...`}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none h-20 text-black font-bold bg-white"
                          style={{ color: '#000000', backgroundColor: '#ffffff', fontWeight: '700' }}
                          required
                        />
                      </div>
                      {queries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuery(query.id)}
                          className="mt-2 p-2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <button
                  type="button"
                  onClick={addQuery}
                  className="mt-4 flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium"
                >
                  <FaPlus />
                  Add Another Query
                </button>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || queries.every(q => !q.text.trim())}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitMutation.isPending ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane />
                      Submit Query
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        !isSearching && !searchError && (
          <EmptyState 
            message="Search for an application first - Enter an application number to search for sanctioned cases" 
          />
        )
      )}
    </div>
  );
} 