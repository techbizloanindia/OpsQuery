/**
 * OpsQuery - Toast Notification System
 * Copyright (c) 2024 OpsQuery Development Team
 * 
 * Licensed under the MIT License.
 * 
 * @fileoverview Toast Notification System - Real-time notifications for branch updates and other events
 * @author OpsQuery Development Team
 * @version 2.0.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiCheckCircle, 
  FiAlertCircle, 
  FiInfo, 
  FiX,
  FiHome,
  FiRefreshCw
} from 'react-icons/fi';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Listen for toast events
  useEffect(() => {
    const handleShowToast = (event: CustomEvent) => {
      const { message, type = 'info', duration = 5000, icon, action } = event.detail;
      
      const toast: Toast = {
        id: Math.random().toString(36).substring(2, 9),
        message,
        type,
        duration,
        icon,
        action
      };

      setToasts(prev => [...prev, toast]);

      // Auto remove after duration
      if (duration > 0) {
        setTimeout(() => {
          removeToast(toast.id);
        }, duration);
      }
    };

    window.addEventListener('showToast', handleShowToast as EventListener);

    return () => {
      window.removeEventListener('showToast', handleShowToast as EventListener);
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const getToastIcon = (type: string, customIcon?: React.ReactNode) => {
    if (customIcon) return customIcon;

    switch (type) {
      case 'success':
        return <FiCheckCircle className="w-5 h-5" />;
      case 'error':
        return <FiAlertCircle className="w-5 h-5" />;
      case 'warning':
        return <FiAlertCircle className="w-5 h-5" />;
      default:
        return <FiInfo className="w-5 h-5" />;
    }
  };

  const getToastStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: 'text-green-500',
          accent: 'bg-green-500'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: 'text-red-500',
          accent: 'bg-red-500'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-500',
          accent: 'bg-yellow-500'
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-500',
          accent: 'bg-blue-500'
        };
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => {
        const styles = getToastStyles(toast.type);
        
        return (
          <div
            key={toast.id}
            className={`${styles.bg} border-2 ${styles.bg.includes('border') ? '' : 'border-gray-200'} rounded-lg shadow-lg backdrop-blur-sm transform transition-all duration-300 animate-slide-in-right`}
          >
            {/* Progress bar */}
            {toast.duration && toast.duration > 0 && (
              <div className="h-1 bg-gray-200 rounded-t-lg overflow-hidden">
                <div 
                  className={`h-full ${styles.accent} animate-shrink-width`}
                  style={{ 
                    animationDuration: `${toast.duration}ms`,
                    animationTimingFunction: 'linear'
                  }}
                ></div>
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 ${styles.icon}`}>
                  {getToastIcon(toast.type, toast.icon)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${styles.text}`}>
                    {toast.message}
                  </p>
                  
                  {/* Action button */}
                  {toast.action && (
                    <button
                      onClick={toast.action.onClick}
                      className={`mt-2 text-xs font-medium ${styles.icon} hover:underline`}
                    >
                      {toast.action.label}
                    </button>
                  )}
                </div>

                {/* Close button */}
                <button
                  onClick={() => removeToast(toast.id)}
                  className={`flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors ${styles.text} opacity-60 hover:opacity-100`}
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Utility functions to show toasts
export const showToast = {
  success: (message: string, options?: Partial<Toast>) => {
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: { message, type: 'success', ...options }
    }));
  },
  
  error: (message: string, options?: Partial<Toast>) => {
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: { message, type: 'error', ...options }
    }));
  },
  
  info: (message: string, options?: Partial<Toast>) => {
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: { message, type: 'info', ...options }
    }));
  },
  
  warning: (message: string, options?: Partial<Toast>) => {
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: { message, type: 'warning', ...options }
    }));
  },

  branchUpdate: (branchCode: string, teamType: 'sales' | 'credit') => {
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: { 
        message: `Branch ${branchCode} updated for ${teamType} team`,
        type: 'info',
        duration: 4000,
        icon: <FiHome className="w-5 h-5" />,
        action: {
          label: 'View Dashboard',
          onClick: () => {
            window.location.href = teamType === 'sales' ? '/sales' : '/credit-dashboard';
          }
        }
      }
    }));
  },

  realTimeSync: (message: string) => {
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: { 
        message,
        type: 'info',
        duration: 2000,
        icon: <FiRefreshCw className="w-5 h-5 animate-spin" />
      }
    }));
  }
};

export default ToastContainer;
