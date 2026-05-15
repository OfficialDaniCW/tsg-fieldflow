import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, Navigation, RotateCcw, ExternalLink, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/jobs/StatusBadge';

// Sort jobs by postcode prefix proximity (groups nearby areas together)
function optimiseRoute(jobs) {
  if (jobs.length <= 1) return jobs;
  const withPostcode = jobs.filter(j => j.location_number || j.location_name);
  const withoutPostcode = jobs.filter(j => !j.location_number && !j.location_name);
  // Sort by location_number (site code) then location_name alphabetically — groups nearby sites
  const sorted = [...withPostcode].sort((a, b) => {
    const aKey = (a.location_number || a.location_name || '').toUpperCase();
    const bKey = (b.location_number || b.location_name || '').toUpperCase();
    return aKey.localeCompare(bKey);
  });
  return [...sorted, ...withoutPostcode];
}

function buildGoogleMapsUrl(jobs) {
  // Build a multi-stop Google Maps directions URL
  const stops = jobs
    .map(j => j.location_name || j.location_number)
    .filter(Boolean)
    .map(s => encodeURIComponent(s));
  if (stops.length === 0) return null;
  if (stops.length === 1) return `https://www.google.com/maps/search/?api=1&query=${stops[0]}`;
  const origin = stops[0];
  const destination = stops[stops.length - 1];
  const waypoints = stops.slice(1, -1).join('|');
  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  if (waypoints) url += `&waypoints=${waypoints}`;
  return url;
}

const STATUS_DONE = ['completed_first_visit', 'completed_return_visit', 'completed'];

export default function TodayRoutePlanner({ jobs }) {
  const [optimised, setOptimised] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayJobs = jobs.filter(j => j.job_date === todayStr);

  const displayJobs = useMemo(
    () => optimised ? optimiseRoute(todayJobs) : todayJobs,
    [optimised, todayJobs]
  );

  const mapsUrl = useMemo(() => buildGoogleMapsUrl(displayJobs), [displayJobs]);

  if (todayJobs.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-muted/30 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-semibold text-foreground whitespace-nowrap">Today's Route</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full flex-shrink-0">{todayJobs.length}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button
            size="sm"
            variant={optimised ? 'default' : 'outline'}
            className="h-7 text-xs gap-1 px-2.5"
            onClick={() => setOptimised(v => !v)}
          >
            {optimised ? <RotateCcw className="w-3 h-3" /> : <Navigation className="w-3 h-3" />}
            {optimised ? 'Original' : 'Optimise'}
          </Button>
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 px-2.5">
                <ExternalLink className="w-3 h-3" />
                Maps
              </Button>
            </a>
          )}
        </div>
      </div>

      {optimised && (
        <div className="px-4 py-2 bg-primary/5 border-b border-primary/10 text-xs text-primary font-medium flex items-center gap-1.5">
          <Navigation className="w-3 h-3" />
          Route optimised by proximity — tap Maps to open in Google Maps with all stops.
        </div>
      )}

      {/* Job list */}
      <div className="divide-y divide-border">
        {displayJobs.map((job, idx) => {
          const done = STATUS_DONE.includes(job.status);
          return (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="flex items-center gap-3 px-3 py-3 hover:bg-muted/40 transition-colors"
            >
              {/* Step number */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${done ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>
                {done ? '✓' : idx + 1}
              </div>

              {/* Job info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-sm font-semibold ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    #{job.job_number}
                  </span>
                  <StatusBadge status={job.status} />
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {job.location_name && (
                    <span className="text-xs text-muted-foreground truncate max-w-[160px]">{job.location_name}</span>
                  )}
                  {job.start_time && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {job.start_time}
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}