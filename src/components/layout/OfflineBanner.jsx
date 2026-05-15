import { WifiOff, Wifi, RefreshCw, CloudUpload } from 'lucide-react';
import { useOnlineSync } from '@/lib/useOnlineSync';
import { cn } from '@/lib/utils';

export default function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing, syncPendingJobs } = useOnlineSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={cn(
      'flex items-center justify-between gap-3 px-4 py-2 text-sm font-medium',
      isOnline ? 'bg-amber-50 border-b border-amber-200 text-amber-800' : 'bg-red-50 border-b border-red-200 text-red-800'
    )}>
      <div className="flex items-center gap-2">
        {isOnline
          ? <CloudUpload className="w-4 h-4 flex-shrink-0" />
          : <WifiOff className="w-4 h-4 flex-shrink-0" />
        }
        <span>
          {!isOnline && 'You\'re offline — jobs will be saved locally and synced when you reconnect.'}
          {isOnline && pendingCount > 0 && `${pendingCount} job${pendingCount > 1 ? 's' : ''} waiting to sync.`}
        </span>
      </div>
      {isOnline && pendingCount > 0 && (
        <button
          onClick={syncPendingJobs}
          disabled={isSyncing}
          className="flex items-center gap-1.5 text-xs font-semibold bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3 h-3', isSyncing && 'animate-spin')} />
          {isSyncing ? 'Syncing...' : 'Sync now'}
        </button>
      )}
    </div>
  );
}