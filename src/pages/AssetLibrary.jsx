import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, Wrench, MapPin, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';

const EQUIPMENT_TYPE_LABELS = {
  pump: '⛽ Pump',
  tank_gauge: '📊 Tank Gauge',
  vr2: '💨 VR2',
  other: '📁 Other',
};

export default function AssetLibrary() {
  const [search, setSearch] = useState('');

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list('location_name', 500),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-job_date', 500),
  });

  // Count jobs per equipment_name — case-insensitive normalised key
  const jobCountByEquipment = useMemo(() => {
    const map = {};
    jobs.forEach(j => {
      if (j.equipment_name) {
        const key = j.equipment_name.trim().toLowerCase();
        map[key] = (map[key] || 0) + 1;
      }
    });
    return map;
  }, [jobs]);

  const filtered = equipment.filter(eq => {
    const q = search.toLowerCase();
    return !q ||
      eq.name?.toLowerCase().includes(q) ||
      eq.location_name?.toLowerCase().includes(q) ||
      eq.asset_number?.toLowerCase().includes(q);
  });

  // Group by location_number (reliable unique site code), fall back to normalised name
  const bySite = useMemo(() => {
    const map = {};
    filtered.forEach(eq => {
      // Use location_number as the grouping key so "Tesco Slough" and "tesco slough" merge
      const key = eq.location_number?.trim() || eq.location_name?.trim().toLowerCase() || 'unknown';
      if (!map[key]) map[key] = { label: eq.location_name || eq.location_number || 'Unknown Site', items: [] };
      // Keep the most complete location name as label
      if (eq.location_name && eq.location_name.length > map[key].label.length) {
        map[key].label = eq.location_name;
      }
      map[key].items.push(eq);
    });
    return Object.entries(map)
      .map(([key, { label, items }]) => ({ key, label, items }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [filtered]);

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-grotesk text-2xl font-bold">Asset Library</h1>
        <p className="text-sm text-muted-foreground mt-0.5">All equipment grouped by site</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search equipment, site, asset number..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : equipment.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Wrench className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No equipment yet</p>
          <p className="text-xs mt-1">Equipment is created when jobs reference it via the WhatsApp agent or job form.</p>
        </div>
      ) : bySite.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">No results match your search.</div>
      ) : (
        <div className="space-y-6">
          {bySite.map(({ key, label, items }) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                <span className="text-xs text-muted-foreground">({items.length})</span>
              </div>
              <div className="space-y-2">
                {items.map(eq => {
                  const jobCount = jobCountByEquipment[eq.name?.trim().toLowerCase()] || 0;
                  return (
                    <Link
                      key={eq.id}
                      to={`/assets/${eq.id}`}
                      className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Wrench className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{eq.name}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {eq.equipment_type && (
                            <span className="text-xs text-muted-foreground">{EQUIPMENT_TYPE_LABELS[eq.equipment_type] || eq.equipment_type}</span>
                          )}
                          {eq.asset_number && (
                            <span className="text-xs text-muted-foreground">#{eq.asset_number}</span>
                          )}
                          {jobCount > 0 && (
                            <span className="text-xs flex items-center gap-1 text-primary font-medium">
                              <Package className="w-3 h-3" />{jobCount} job{jobCount > 1 ? 's' : ''}
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
          ))}
        </div>
      )}
    </div>
  );
}