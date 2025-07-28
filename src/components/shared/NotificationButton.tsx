'use client';

import React, { useState, useEffect } from 'react';
import { FaBell, FaTimes, FaEye, FaCheck } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Notification {
  id: string;
  queryId: string;
  appNo: string;
  customerName: string;
  message: string;
  team: 'Sales' | 'Credit' | 'Operations';
  timestamp: string;
  isRead: boolean;
  sender: string;
  priority: 'high' | 'medium' | 'low';
}

interface NotificationButtonProps {
  className?: string;
  team?: 'Operations' | 'Sales' | 'Credit'; // Add team prop
}

export default function NotificationButton({ className = '', team = 'Operations' }: NotificationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch notifications based on team
  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['notifications', team],
    queryFn: async (): Promise<Notification[]> => {
      try {
        const allNotifications: Notification[] = [];
        
        if (team === 'Operations') {
          // Operations sees notifications from both Sales and Credit teams
          const [salesResponse, creditResponse] = await Promise.all([
            fetch('/api/query-actions?type=messages&team=Sales&unread=true'),
            fetch('/api/query-actions?type=messages&team=Credit&unread=true')
          ]);
          
          const [salesResult, creditResult] = await Promise.all([
            salesResponse.json(),
            creditResponse.json()
          ]);
          
          // Process Sales notifications
          if (salesResult.success && salesResult.data) {
            salesResult.data.forEach((msg: any) => {
              allNotifications.push({
                id: msg.id,
                queryId: msg.queryId,
                appNo: msg.appNo || 'Unknown',
                customerName: msg.customerName || 'Unknown Customer',
                message: msg.message || msg.responseText,
                team: 'Sales',
                timestamp: msg.timestamp,
                isRead: false,
                sender: msg.sender || 'Sales Team',
                priority: 'medium'
              });
            });
          }
          
          // Process Credit notifications
          if (creditResult.success && creditResult.data) {
            creditResult.data.forEach((msg: any) => {
              allNotifications.push({
                id: msg.id,
                queryId: msg.queryId,
                appNo: msg.appNo || 'Unknown',
                customerName: msg.customerName || 'Unknown Customer',
                message: msg.message || msg.responseText,
                team: 'Credit',
                timestamp: msg.timestamp,
                isRead: false,
                sender: msg.sender || 'Credit Team',
                priority: 'medium'
              });
            });
          }
        } else {
          // Sales and Credit teams only see notifications from Operations (queries assigned to them)
          const response = await fetch(`/api/queries?team=${team.toLowerCase()}&status=pending&hasNewMessages=true`);
          const result = await response.json();
          
          if (result.success && result.data) {
            result.data.forEach((queryData: any) => {
              // Check if there are new messages from Operations team
              if (queryData.hasNewOperationsMessages) {
                allNotifications.push({
                  id: `ops-${queryData.id}`,
                  queryId: queryData.id,
                  appNo: queryData.appNo,
                  customerName: queryData.customerName || 'Unknown Customer',
                  message: `New query assigned to ${team} team`,
                  team: 'Operations',
                  timestamp: queryData.lastUpdated || queryData.submittedAt,
                  isRead: false,
                  sender: 'Operations Team',
                  priority: 'high'
                });
              }
            });
          }
        }
        
        // Sort by timestamp (newest first)
        return allNotifications.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      console.log(`Marking notification ${notificationId} as read for ${team} team`);
      return { success: true };
    },
    onSuccess: () => {
      refetch();
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      console.log(`Marking all notifications as read for ${team} team`);
      return { success: true };
    },
    onSuccess: () => {
      refetch();
    }
  });

  // Get unread count
  const unreadCount = notifications?.length || 0;

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetch]);

  // Get team-specific colors
  const getTeamColors = () => {
    switch (team) {
      case 'Sales':
        return {
          primary: 'text-blue-600',
          bg: 'bg-blue-50',
          hover: 'hover:bg-blue-100',
          ring: 'focus:ring-blue-500'
        };
      case 'Credit':
        return {
          primary: 'text-green-600',
          bg: 'bg-green-50',
          hover: 'hover:bg-green-100',
          ring: 'focus:ring-green-500'
        };
      default: // Operations
        return {
          primary: 'text-cyan-600',
          bg: 'bg-cyan-50',
          hover: 'hover:bg-cyan-100',
          ring: 'focus:ring-cyan-500'
        };
    }
  };

  const colors = getTeamColors();

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full bg-white border border-gray-300 text-gray-600 ${colors.hover} ${colors.primary} transition-colors focus:outline-none focus:ring-2 ${colors.ring}`}
        aria-label="Notifications"
      >
        <FaBell className={`w-5 h-5 ${unreadCount > 0 ? `animate-pulse ${colors.primary}` : ''}`} />
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-800">
                🔔 {team} Notifications
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            
            {/* Team-specific description */}
            <p className="text-sm text-gray-600 mb-3">
              {team === 'Operations' 
                ? 'Messages from Sales and Credit teams' 
                : `New queries assigned to ${team} team`
              }
            </p>

            {/* Actions */}
            {unreadCount > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  className={`text-sm ${colors.primary} font-medium flex items-center gap-1`}
                >
                  <FaCheck className="w-3 h-3" />
                  Mark all as read
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className={`animate-spin w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full mx-auto mb-2`} 
                     style={{ borderTopColor: colors.primary.includes('blue') ? '#2563eb' : colors.primary.includes('green') ? '#10b981' : '#06b6d4' }}></div>
                Loading notifications...
              </div>
            ) : notifications?.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <FaBell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="font-medium">No notifications</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications?.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => {
                      // Navigate to appropriate dashboard based on team
                      const dashboardUrl = team === 'Operations' 
                        ? `/operations` 
                        : team === 'Sales' 
                        ? `/sales` 
                        : `/credit-dashboard`;
                      window.open(dashboardUrl, '_blank');
                      markAsReadMutation.mutate(notification.id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Team Badge */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        notification.team === 'Sales' ? 'bg-blue-500' : 
                        notification.team === 'Credit' ? 'bg-green-500' : 'bg-cyan-500'
                      }`}>
                        {notification.team === 'Sales' ? 'S' : 
                         notification.team === 'Credit' ? 'C' : 'O'}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.team} Team Message
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-1">
                          App: {notification.appNo} • {notification.customerName}
                        </p>
                        
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <p className="text-xs text-gray-500 mt-1">
                          From: {notification.sender}
                        </p>
                      </div>
                      
                      {/* Action Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsReadMutation.mutate(notification.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                        title="Mark as read"
                      >
                        <FaEye className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications && notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => {
                  const dashboardUrl = team === 'Operations' 
                    ? '/operations' 
                    : team === 'Sales' 
                    ? '/sales' 
                    : '/credit-dashboard';
                  window.open(dashboardUrl, '_blank');
                  setIsOpen(false);
                }}
                className={`w-full text-sm ${colors.primary} font-medium text-center`}
              >
                View all in {team} Dashboard →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}