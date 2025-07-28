'use client';

import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaExclamationCircle } from 'react-icons/fa';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  type: NotificationType;
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  isVisible,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000
}) => {
  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, autoCloseDelay, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <FaExclamationCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <FaExclamationTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <FaInfoCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className={`rounded-lg border p-4 shadow-lg ${getColors()} animate-slide-in-right`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold">
              {title}
            </h3>
            <p className="text-sm mt-1 opacity-90">
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          </div>
        </div>
        {autoClose && (
          <div className="mt-2">
            <div 
              className="h-1 bg-current opacity-20 rounded-full overflow-hidden"
            >
              <div 
                className="h-full bg-current animate-progress"
                style={{
                  animation: `progress-bar ${autoCloseDelay}ms linear forwards`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Notification Manager Context
interface NotificationContextType {
  showNotification: (type: NotificationType, title: string, message: string) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

interface NotificationState {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isVisible: boolean;
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = React.useState<NotificationState[]>([]);
  const nextId = React.useRef(1);

  const showNotification = React.useCallback((type: NotificationType, title: string, message: string) => {
    const id = nextId.current++;
    setNotifications(prev => [...prev, { id, type, title, message, isVisible: true }]);
  }, []);

  const hideNotification = React.useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const contextValue: NotificationContextType = {
    showNotification,
    showSuccess: (title, message) => showNotification('success', title, message),
    showError: (title, message) => showNotification('error', title, message),
    showWarning: (title, message) => showNotification('warning', title, message),
    showInfo: (title, message) => showNotification('info', title, message),
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={() => hideNotification(notification.id)}
        />
      ))}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export default Notification;
