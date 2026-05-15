import { Navigation, Clock } from 'lucide-react';
import { useTravelTracker } from '@/lib/useTravelTracker';

export default function TravelSummary() {
  const { todaySessions, totalTodayMins, formattedTotal, formatDuration, activeTravel, elapsed } = useTravelTracker();

  if (todaySessions.length === 0 && !activeTravel) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Navigation className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-800">Today's Travel</span>
        <span className="ml-auto text-sm font-bold text-blue-700">{formattedTotal} total</span>
      </div>

      <div className="space-y-1">
        {todaySessions.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs text-blue-700">
            <span>Trip {i + 1}: {s.startTime} → {s.endTime}</span>
            <span className="font-semibold">{formatDuration(s.durationMins)}</span>
          </div>
        ))}
        {activeTravel && (
          <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium animate-pulse">
            <Clock className="w-3 h-3" />
            <span>Currently travelling since {activeTravel.startTime}…</span>
          </div>
        )}
      </div>
    </div>
  );
}