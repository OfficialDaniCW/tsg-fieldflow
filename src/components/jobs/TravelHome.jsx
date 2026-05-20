import { useState } from 'react';
import { Home, Navigation, Clock, AlertTriangle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TRAVEL_BUFFER_END = '17:30'; // overtime starts here
const OVERTIME_START_H = 17;
const OVERTIME_START_M = 30;

function nowTimeStr() {
  return new Date().toTimeString().slice(0, 5);
}

function parseTime(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Round UP to nearest 15 mins beyond 17:30
function overtimeQuarters(arrivedMins) {
  const otStart = OVERTIME_START_H * 60 + OVERTIME_START_M; // 1050
  if (arrivedMins <= otStart) return 0;
  const over = arrivedMins - otStart;
  return Math.ceil(over / 15); // quarters
}

function formatOT(quarters) {
  const mins = quarters * 15;
  if (mins < 60) return `${mins} mins`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const STORAGE_KEY = 'tsg_travel_home';
const HISTORY_KEY = 'tsg_travel_home_history';

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch { return []; }
}

function saveToHistory(entry) {
  const history = loadHistory();
  // Keep last 30 entries
  const updated = [entry, ...history].slice(0, 30);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export default function TravelHome({ jobId, onOvertimeConfirmed }) {
  const [state, setState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  });
  const [history] = useState(loadHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  const isActive = !!state.startTime;
  const isArrived = !!state.arrivedTime;

  function startTravelHome() {
    setLoading(true);
    const time = nowTimeStr();
    const next = { startTime: time, jobId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setState(next);
    setLoading(false);
  }

  function arrivedHome() {
    setLoading(true);
    const arrivedTime = nowTimeStr();
    const date = new Date().toISOString().slice(0, 10);
    const arrivedMins = parseTime(arrivedTime);
    const quarters = overtimeQuarters(arrivedMins);
    const isOT = quarters > 0;
    const updated = { ...state, arrivedTime, isOvertime: isOT, overtimeQuarters: quarters, date };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setState(updated);
    // Save to history
    saveToHistory({ date, startTime: state.startTime, arrivedTime, isOvertime: isOT, overtimeQuarters: quarters });
    setLoading(false);

    if (onOvertimeConfirmed) {
      onOvertimeConfirmed({ arrivedTime, isOvertime: isOT, overtimeQuarters: quarters, overtimeMins: quarters * 15 });
    }
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    setState({});
  }

  // Arrived — show result
  if (isArrived) {
    const otMins = (state.overtimeQuarters || 0) * 15;
    return (
      <div className={cn(
        'rounded-xl border-2 p-4',
        state.isOvertime ? 'border-purple-300 bg-purple-50' : 'border-green-300 bg-green-50'
      )}>
        <div className="flex items-center gap-2 mb-2">
          <Home className={cn('w-4 h-4', state.isOvertime ? 'text-purple-600' : 'text-green-600')} />
          <span className={cn('text-sm font-semibold', state.isOvertime ? 'text-purple-800' : 'text-green-800')}>
            Arrived Home — {state.arrivedTime}
          </span>
        </div>
        {state.isOvertime ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-bold text-purple-700">
                Overtime: +{formatOT(state.overtimeQuarters)} ({state.overtimeQuarters} quarter{state.overtimeQuarters !== 1 ? 's' : ''})
              </span>
            </div>
            <p className="text-xs text-purple-600">
              Left job at {state.startTime} · Arrived {state.arrivedTime} · {otMins} mins past 17:30
            </p>
            <p className="text-xs text-purple-500 mt-1">
              Last job has been flagged as overtime. ✅
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-green-700">
              Home by {state.arrivedTime} — within normal hours. No overtime. 🎉
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Left job at {state.startTime}
            </p>
          </div>
        )}
        <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground underline mt-3 block">
          Start new day
        </button>
      </div>
    );
  }

  // Active — show arrived button
  if (isActive) {
    const startMins = parseTime(state.startTime);
    const nowMins = parseTime(nowTimeStr());
    const elapsed = Math.max(0, nowMins - startMins);

    return (
      <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Navigation className="w-4 h-4 text-blue-600 animate-pulse" />
          <span className="text-sm font-semibold text-blue-800">Travelling Home</span>
          <span className="ml-auto text-xs text-blue-600 font-mono">Started {state.startTime}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-blue-600 mb-3">
          <Clock className="w-3 h-3" />
          <span>{elapsed} mins so far · Overtime kicks in at 17:30</span>
        </div>
        <Button
          type="button"
          onClick={arrivedHome}
          disabled={loading}
          className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
        >
          <Home className="w-4 h-4" />
          {loading ? 'Logging...' : 'Arrived Home'}
        </Button>
      </div>
    );
  }

  // Idle — show start button + optional history
  return (
    <div className="rounded-xl border-2 border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Home className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Travel Home</span>
        <span className="ml-auto text-xs text-muted-foreground">OT after 17:30</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Press when leaving your last job. Tap "Arrived Home" to log your arrival and auto-calculate overtime.
      </p>
      <Button
        type="button"
        onClick={startTravelHome}
        disabled={loading}
        variant="outline"
        className="w-full gap-2 border-slate-300"
      >
        <Navigation className="w-4 h-4" />
        {loading ? 'Starting...' : 'Start Travel Home'}
      </Button>

      {history.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowHistory(h => !h)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <History className="w-3 h-3" />
            {showHistory ? 'Hide' : 'Show'} history ({history.length})
          </button>
          {showHistory && (
            <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
              {history.map((h, i) => (
                <div key={i} className={cn(
                  'flex items-center justify-between text-xs rounded-lg px-2 py-1.5',
                  h.isOvertime ? 'bg-purple-50 text-purple-800' : 'bg-green-50 text-green-800'
                )}>
                  <span className="font-medium">{h.date}</span>
                  <span className="font-mono">{h.startTime} → {h.arrivedTime}</span>
                  <span className="font-semibold">
                    {h.isOvertime ? `+${formatOT(h.overtimeQuarters)} OT` : 'No OT'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}