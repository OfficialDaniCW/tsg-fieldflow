import { useState } from 'react';
import { Navigation, NavigationOff, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTravelTracker } from '@/lib/useTravelTracker';
import { cn } from '@/lib/utils';

function pad(n) { return String(n).padStart(2, '0'); }

function fmtElapsed(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function TravelTracker({ onTravelComplete }) {
  const { activeTravel, elapsed, todaySessions, totalTodayMins, formatDuration, startTravel, endTravel } = useTravelTracker();
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    await startTravel();
    setLoading(false);
  }

  async function handleEnd() {
    setLoading(true);
    const result = await endTravel();
    setLoading(false);
    if (result && onTravelComplete) {
      onTravelComplete(result);
    }
  }

  return (
    <div className={cn(
      'rounded-xl border-2 p-4 transition-all',
      activeTravel ? 'border-blue-300 bg-blue-50' : 'border-border bg-card'
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Navigation className={cn('w-4 h-4', activeTravel ? 'text-blue-600 animate-pulse' : 'text-muted-foreground')} />
          <span className="text-sm font-semibold">Travel Tracker</span>
        </div>
        {totalTodayMins > 0 && (
          <span className="text-xs text-muted-foreground">
            Today: <span className="font-semibold text-foreground">{formatDuration(totalTodayMins)}</span>
            {todaySessions.length > 1 && ` (${todaySessions.length} trips)`}
          </span>
        )}
      </div>

      {activeTravel ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-blue-700">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Started at {activeTravel.startTime}</span>
            <span className="font-mono text-sm font-bold ml-auto">{fmtElapsed(elapsed)}</span>
          </div>
          <Button
            type="button"
            onClick={handleEnd}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <NavigationOff className="w-4 h-4" />
            {loading ? 'Getting location...' : 'End Travel'}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {todaySessions.length > 0 && (
            <div className="space-y-1 mb-2">
              {todaySessions.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Trip {i + 1}: {s.startTime} → {s.endTime}</span>
                  <span className="font-medium text-foreground">{formatDuration(s.durationMins)}</span>
                </div>
              ))}
            </div>
          )}
          <Button
            type="button"
            onClick={handleStart}
            disabled={loading}
            variant="outline"
            className="w-full gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Navigation className="w-4 h-4" />
            {loading ? 'Getting location...' : 'Start Travel'}
          </Button>
        </div>
      )}
    </div>
  );
}