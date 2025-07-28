'use client';

import React, { useState, useEffect } from 'react';
import { FaBell, FaTimes, FaEye, FaCheck } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ManagementNotification {
  id: string;
  queryId: string;
  appNo: string;
  customerName: string;
  message: string;
  type: 'OTC' | 'Deferral';
  timestamp: string;
  isRead: boolean;
  sender: string;
  priority: 'high' | 'medium' | 'low';
  branchName?: string;
  operatorName?: string;
}

interface ManagementNotificationButtonProps {
  className?: string;
}

export default function ManagementNotificationButton({ className = '' }: ManagementNotificationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch OTC and Deferral notifications for Management
  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['management-notifications'],
    queryFn: async (): Promise<ManagementNotification[]> => {
      try {
        const allNotifications: ManagementNotification[] = [];
        
        // Fetch OTC queries
        const otcResponse = await fetch('/api/queries?resolutionType=otc&status=resolved');
        const otcData = await otcResponse.json();
        
        // Fetch Deferral queries
        const deferralResponse = await fetch('/api/queries?resolutionType=deferral&status=resolved');
        const deferralData = await deferralResponse.json();

        console.log('📊 Management Notifications - OTC Response:', otcResponse.ok, otcData);
        console.log('📊 Management Notifications - Deferral Response:', deferralResponse.ok, deferralData);

        // Process OTC notifications
        if (otcResponse.ok && otcData.success && otcData.data) {
          otcData.data.forEach((app: any) => {
            if (app.queries && Array.isArray(app.queries)) {
              app.queries.forEach((query: any) => {
                if (query.status === 'otc' || (query.status === 'resolved' && query.resolutionType === 'otc')) {
                  allNotifications.push({
                    id: `otc-${query.id || app.id}-${Date.now()}`,
                    queryId: query.id || app.id,
                    appNo: app.appNo || 'Unknown',
                    customerName: app.customerName || 'Unknown Customer',
                    message: `New OTC query assigned by Operations team`,
                    type: 'OTC',
                    timestamp: query.lastUpdated || query.submittedAt || app.lastUpdated || new Date().toISOString(),
                    isRead: false,
                    sender: query.operatorName || 'Operations Team',
                    priority: 'high',
                    branchName: app.branchName || 'Unknown Branch',
                    operatorName: query.operatorName || 'Unknown Operator'
                  });
                }
              });
            }
          });
        }
        
        // Process Deferral notifications
        if (deferralResponse.ok && deferralData.success && deferralData.data) {
          deferralData.data.forEach((app: any) => {
            if (app.queries && Array.isArray(app.queries)) {
              app.queries.forEach((query: any) => {
                if (query.status === 'deferred' || (query.status === 'resolved' && query.resolutionType === 'deferral')) {
                  allNotifications.push({
                    id: `deferral-${query.id || app.id}-${Date.now()}`,
                    queryId: query.id || app.id,
                    appNo: app.appNo || 'Unknown',
                    customerName: app.customerName || 'Unknown Customer',
                    message: `New Deferral query assigned by Operations team`,
                    type: 'Deferral',
                    timestamp: query.lastUpdated || query.submittedAt || app.lastUpdated || new Date().toISOString(),
                    isRead: false,
                    sender: query.operatorName || 'Operations Team',
                    priority: 'medium',
                    branchName: app.branchName || 'Unknown Branch',
                    operatorName: query.operatorName || 'Unknown Operator'
                  });
                }
              });
            }
          });
        }
        
        // Sort by timestamp (newest first)
        return allNotifications.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      } catch (error) {
        console.error('Error fetching management notifications:', error);
        return [];
      }
    },
    refetchInterval: 15000, // Refresh every 15 seconds
    staleTime: 10000
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      console.log(`Marking management notification ${notificationId} as read`);
      // In a real implementation, you would call an API to mark as read
      return { success: true };
    },
    onSuccess: () => {
      refetch();
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      console.log('Marking all management notifications as read');
      // In a real implementation, you would call an API to mark all as read
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
      minute: '2-digit',
      hour12: true
    });
  };

  // Format date
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.notification-dropdown')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={`relative notification-dropdown ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <FaBell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[1.25rem] h-5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800">
              Management Notifications
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsReadMutation.mutate()}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  disabled={markAllAsReadMutation.isPending}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => markAsReadMutation.mutate(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    {/* Type Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      notification.type === 'OTC' ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {notification.type === 'OTC' ? 'O' : 'D'}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.type} - {notification.appNo}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.customerName}
                      </p>
                      
                      <p className="text-sm text-gray-800 mt-1">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          By: {notification.operatorName || notification.sender}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.timestamp)}
                        </span>
                      </div>
                      
                      {notification.branchName && (
                        <span className="text-xs text-gray-500 mt-1 block">
                          Branch: {notification.branchName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <FaBell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  OTC and Deferral queries will appear here
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications && notifications.length > 0 && (
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Showing {notifications.length} recent notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
