// Utility functions for login tracking

export const logLoginEvent = async (userId: string, action: 'login' | 'logout') => {
  try {
    console.log('📊 Logging', action, 'event for user:', userId);
    
    const response = await fetch('/api/admin/login-tracker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        userId,
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Login event logged successfully:', action);
    } else {
      console.error('❌ Failed to log login event:', data.message);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error logging login event:', error);
    return { success: false, error };
  }
};

// Get client IP address (simplified version)
const getClientIP = async (): Promise<string> => {
  try {
    // In a real application, you might want to use a service to get the real IP
    // For now, we'll use a placeholder
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'Unknown';
  } catch (error) {
    console.log('Could not fetch IP address:', error);
    return 'Unknown';
  }
};

// Auto-logout on page unload
export const setupAutoLogout = (userId: string) => {
  const handleBeforeUnload = () => {
    // Use sendBeacon for reliability during page unload
    const data = JSON.stringify({
      action: 'logout',
      userId,
      userAgent: navigator.userAgent
    });
    
    navigator.sendBeacon('/api/admin/login-tracker', data);
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
};

// Update session activity (heartbeat)
export const updateSessionActivity = async (userId: string) => {
  try {
    const response = await fetch('/api/admin/login-tracker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'heartbeat',
        userId
      })
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error updating session activity:', error);
    return false;
  }
};

// Set up periodic session activity updates
export const setupSessionHeartbeat = (userId: string, intervalMinutes = 5) => {
  const interval = setInterval(() => {
    updateSessionActivity(userId);
  }, intervalMinutes * 60 * 1000);
  
  // Return cleanup function
  return () => {
    clearInterval(interval);
  };
};
