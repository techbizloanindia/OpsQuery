import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseRealTimeMessagesOptions {
  enabled?: boolean;
  pollInterval?: number;
  team?: 'sales' | 'credit' | 'operations' | 'management';
  onNewMessage?: (message: any) => void;
}

export function useRealTimeMessages(options: UseRealTimeMessagesOptions = {}) {
  const {
    enabled = true,
    pollInterval = 5000, // 5 seconds
    team = 'operations',
    onNewMessage
  } = options;
  
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<string>('');

  const checkForNewMessages = useCallback(async () => {
    if (!enabled) return;

    try {
      const response = await fetch(`/api/messages/latest?team=${team}&since=${lastMessageIdRef.current}`);
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const newMessages = result.data;
        
        // Update the last message ID
        if (newMessages.length > 0) {
          lastMessageIdRef.current = newMessages[newMessages.length - 1].id;
        }

        // Invalidate related queries to refresh dashboards
        queryClient.invalidateQueries({ queryKey: ['queries'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        
        // Call the callback for each new message
        if (onNewMessage) {
          newMessages.forEach((message: any) => onNewMessage(message));
        }

        console.log(`📨 Real-time: Received ${newMessages.length} new messages for ${team} team`);
      }
    } catch (error) {
      console.error('Error checking for new messages:', error);
    }
  }, [enabled, team, onNewMessage, queryClient]);

  useEffect(() => {
    if (!enabled) return;

    // Initial check
    checkForNewMessages();

    // Set up polling
    intervalRef.current = setInterval(checkForNewMessages, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkForNewMessages, pollInterval, enabled]);

  const refreshMessages = useCallback(() => {
    checkForNewMessages();
  }, [checkForNewMessages]);

  return {
    refreshMessages
  };
} 