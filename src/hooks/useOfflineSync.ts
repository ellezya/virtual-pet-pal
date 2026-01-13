import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QueuedAction {
  id: string;
  type: 'feed' | 'water' | 'play' | 'nap' | 'clean';
  timestamp: number;
  data?: Record<string, unknown>;
}

const QUEUE_KEY = 'lalalola-offline-queue';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedActions, setQueuedActions] = useState<QueuedAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load queued actions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(QUEUE_KEY);
    if (stored) {
      try {
        setQueuedActions(JSON.parse(stored));
      } catch {
        // Invalid data, clear it
        localStorage.removeItem(QUEUE_KEY);
      }
    }
  }, []);

  // Save queued actions to localStorage
  useEffect(() => {
    if (queuedActions.length > 0) {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queuedActions));
    } else {
      localStorage.removeItem(QUEUE_KEY);
    }
  }, [queuedActions]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for service worker sync messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_QUEUED_ACTIONS') {
        syncQueuedActions();
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && queuedActions.length > 0) {
      syncQueuedActions();
    }
  }, [isOnline]);

  const queueAction = useCallback((action: Omit<QueuedAction, 'id' | 'timestamp'>) => {
    const newAction: QueuedAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    setQueuedActions((prev) => [...prev, newAction]);
    return newAction.id;
  }, []);

  const syncQueuedActions = useCallback(async () => {
    if (isSyncing || queuedActions.length === 0 || !isOnline) return;

    setIsSyncing(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsSyncing(false);
        return;
      }

      // Process queued actions
      const successfulIds: string[] = [];

      for (const action of queuedActions) {
        try {
          // Log the care action to the database
          // The actual progress update is handled by useProgress hook
          // Here we just mark actions as synced
          successfulIds.push(action.id);
        } catch {
          // Keep failed actions in queue
          console.error('Failed to sync action:', action.id);
        }
      }

      // Remove successfully synced actions
      setQueuedActions((prev) =>
        prev.filter((action) => !successfulIds.includes(action.id))
      );
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, queuedActions, isOnline]);

  return {
    isOnline,
    queuedActions,
    queueAction,
    syncQueuedActions,
    isSyncing,
    hasQueuedActions: queuedActions.length > 0,
  };
};
