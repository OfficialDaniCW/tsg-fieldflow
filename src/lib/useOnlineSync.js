import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { getPendingJobs, markJobSynced, getPendingCount } from './offlineDB';

export function useOnlineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  const syncPendingJobs = useCallback(async () => {
    if (isSyncing) return;
    const pending = await getPendingJobs();
    if (pending.length === 0) return;

    setIsSyncing(true);
    let synced = 0;
    let failed = 0;

    for (const job of pending) {
      const { offline_id, created_at, synced: _synced, ...jobData } = job;
      try {
        await base44.entities.Job.create(jobData);
        await markJobSynced(offline_id);
        synced++;
      } catch {
        failed++;
      }
    }

    setIsSyncing(false);
    setLastSyncResult({ synced, failed, time: new Date() });
    await refreshPendingCount();
  }, [isSyncing, refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingJobs();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingJobs]);

  return { isOnline, pendingCount, isSyncing, lastSyncResult, syncPendingJobs, refreshPendingCount };
}