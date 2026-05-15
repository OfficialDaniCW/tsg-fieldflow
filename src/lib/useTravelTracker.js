import { useState, useEffect } from 'react';

const STORAGE_KEY = 'tsg_travel_sessions';
const ACTIVE_KEY = 'tsg_active_travel';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function useTravelTracker() {
  const [activeTravel, setActiveTravel] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ACTIVE_KEY)) || null; }
    catch { return null; }
  });

  const [sessions, setSessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  });

  const [elapsed, setElapsed] = useState(0);

  // Tick elapsed time while travelling
  useEffect(() => {
    if (!activeTravel) { setElapsed(0); return; }
    const update = () => setElapsed(Math.floor((Date.now() - activeTravel.startMs) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [activeTravel]);

  function startTravel() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const session = { startMs: Date.now(), startTime: new Date().toTimeString().slice(0, 5), startLocation: null };
        localStorage.setItem(ACTIVE_KEY, JSON.stringify(session));
        setActiveTravel(session);
        resolve(session);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const session = {
            startMs: Date.now(),
            startTime: new Date().toTimeString().slice(0, 5),
            startLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          };
          localStorage.setItem(ACTIVE_KEY, JSON.stringify(session));
          setActiveTravel(session);
          resolve(session);
        },
        () => {
          const session = { startMs: Date.now(), startTime: new Date().toTimeString().slice(0, 5), startLocation: null };
          localStorage.setItem(ACTIVE_KEY, JSON.stringify(session));
          setActiveTravel(session);
          resolve(session);
        },
        { timeout: 5000 }
      );
    });
  }

  function endTravel() {
    return new Promise((resolve, reject) => {
      if (!activeTravel) { resolve(null); return; }

      const finish = (endLocation) => {
        const endMs = Date.now();
        const durationMins = Math.round((endMs - activeTravel.startMs) / 60000);
        const completed = {
          date: todayStr(),
          startTime: activeTravel.startTime,
          endTime: new Date().toTimeString().slice(0, 5),
          durationMins,
          startLocation: activeTravel.startLocation,
          endLocation,
        };
        const updated = [...sessions, completed];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        localStorage.removeItem(ACTIVE_KEY);
        setSessions(updated);
        setActiveTravel(null);
        resolve(completed);
      };

      if (!navigator.geolocation) { finish(null); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => finish({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => finish(null),
        { timeout: 5000 }
      );
    });
  }

  // Today's sessions
  const todaySessions = sessions.filter(s => s.date === todayStr());
  const totalTodayMins = todaySessions.reduce((sum, s) => sum + s.durationMins, 0);

  return {
    activeTravel,
    elapsed,
    sessions,
    todaySessions,
    totalTodayMins,
    formattedTotal: formatDuration(totalTodayMins),
    formatDuration,
    startTravel,
    endTravel,
  };
}