import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Search, Plus, Building2, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SiteDetail from '@/components/sites/SiteDetail';

export default function Sites() {
  const [search, setSearch] = useState('');
  const [selectedSite, setSelectedSite] = useState(null);

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-job_date', 500),
  });

  const { data: siteRecords = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list('name', 200),
  });

  // Build site list from jobs (group by location_name / location_number)
  const sites = useMemo(() => {
    const map = {};

    jobs.forEach(job => {
      const key = job.location_number || job.location_name || '__unknown__';
      if (!map[key]) {
        map[key] = {
          id: key,
          name: job.location_name || 'Unknown Site',
          location_number: job.location_number || '',
          jobs: [],
        };
      }
      map[key].jobs.push(job);
    });

    // Merge with Site entity records for extra info (address, notes etc.)
    siteRecords.forEach(rec => {
      const key = rec.location_number || rec.name;
      if (map[key]) {
        map[key] = { ...map[key], ...rec, jobs: map[key].jobs };
      } else {
        map[key] = { ...rec, id: key, jobs: [] };
      }
    });

    return Object.values(map).sort((a, b) => {
      if (b.jobs.length !== a.jobs.length) return b.jobs.length - a.jobs.length;
      return a.name.localeCompare(b.name);
    });
  }, [jobs, siteRecords]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sites;
    const q = search.toLowerCase();
    return sites.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.location_number?.toLowerCase().includes(q)
    );
  }, [sites, search]);

  if (selectedSite) {
    return <SiteDetail site={selectedSite} onBack={() => setSelectedSite(null)} />;
  }

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-grotesk text-2xl font-bold text-foreground">Sites</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{sites.length} site{sites.length !== 1 ? 's' : ''} from job history</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by site name or code..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-11"
        />
      </div>

      {/* Site list */}
      <div className="space-y-2">
        {filtered.map(site => {
          const incompleteCount = site.jobs.filter(j => j.status === 'incomplete').length;
          return (
            <button
              key={site.id}
              onClick={() => setSelectedSite(site)}
              className="w-full bg-card border border-border rounded-xl p-4 text-left hover:shadow-md hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-foreground">{site.name}</p>
                    {site.location_number && (
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{site.location_number}</span>
                    )}
                    {incompleteCount > 0 && (
                      <span className="text-xs font-semibold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">
                        {incompleteCount} open
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {site.jobs.length} job{site.jobs.length !== 1 ? 's' : ''}
                    </span>
                    {site.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{site.city}</span>}
                    {site.postcode && !site.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{site.postcode}</span>}
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-primary/30 group-hover:bg-primary transition-colors flex-shrink-0" />
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{search ? 'No sites match your search.' : 'No sites yet — they appear automatically from your jobs.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}