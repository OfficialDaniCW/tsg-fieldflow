import { useState, useMemo } from 'react';
import { Search, MapPin, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useJobs } from '@/hooks/useJobs';
import SiteDetail from '@/components/sites/SiteDetail';

export default function Sites() {
  const { data: allJobs = [] } = useJobs();
  const [search, setSearch] = useState('');
  const [selectedSite, setSelectedSite] = useState(null);

  // Group jobs by site
  const sites = useMemo(() => {
    const map = {};
    allJobs.forEach(job => {
      if (!job.location_name) return;
      const key = job.location_name.trim().toUpperCase();
      if (!map[key]) {
        map[key] = {
          name: job.location_name.trim().toUpperCase(),
          location_number: job.location_number || '',
          jobs: [],
        };
      }
      map[key].jobs.push(job);
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [allJobs]);

  const filtered = sites.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.location_number.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedSite) {
    return (
      <SiteDetail
        site={selectedSite}
        onBack={() => setSelectedSite(null)}
      />
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="font-grotesk text-2xl font-bold text-foreground">Sites</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{sites.length} location{sites.length !== 1 ? 's' : ''} on record</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search sites..."
          className="pl-9 h-11"
        />
      </div>

      <div className="space-y-2">
        {filtered.map(site => (
          <button
            key={site.name}
            onClick={() => setSelectedSite(site)}
            className="w-full bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:shadow-md hover:border-primary/30 transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{site.name}</p>
                {site.location_number && (
                  <p className="text-xs text-muted-foreground">Code: {site.location_number}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="text-xs font-medium">{site.jobs.length} job{site.jobs.length !== 1 ? 's' : ''}</span>
              <ChevronRight className="w-4 h-4 group-hover:text-primary transition-colors" />
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No sites found.</p>
          </div>
        )}
      </div>
    </div>
  );
}