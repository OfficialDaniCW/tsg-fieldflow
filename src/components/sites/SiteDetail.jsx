import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Briefcase, Package, StickyNote, ChevronRight, Fuel, Layers, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import StatusBadge from '@/components/jobs/StatusBadge';
import SiteEquipment from '@/components/sites/SiteEquipment';
import { cn } from '@/lib/utils';

const ASSET_ICONS = { pump: Fuel, tank: Layers, ev_charger: Zap };
const ASSET_COLORS = {
  pump: 'text-blue-700 bg-blue-50 border-blue-200',
  tank: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  ev_charger: 'text-green-700 bg-green-50 border-green-200',
};

function partsSummary(jobs) {
  const map = {};
  jobs.forEach(job => {
    (job.parts || []).forEach(part => {
      const key = part.part_number || part.description || 'Unknown';
      if (!map[key]) map[key] = { label: part.description || part.part_number || 'Unknown', qty: 0 };
      map[key].qty += Number(part.quantity) || 1;
    });
  });
  return Object.values(map).sort((a, b) => b.qty - a.qty);
}

function AssetJobGroup({ assetRef, assetType, jobs }) {
  const [open, setOpen] = useState(true);
  const Icon = ASSET_ICONS[assetType] || Fuel;
  const colorClass = ASSET_COLORS[assetType] || ASSET_COLORS.pump;
  const parts = useMemo(() => partsSummary(jobs), [jobs]);
  const sortedJobs = [...jobs].sort((a, b) => new Date(b.job_date || 0) - new Date(a.job_date || 0));

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border', colorClass)}>
            <Icon className="w-3 h-3" />{assetRef}
          </span>
          <span className="text-xs text-muted-foreground">{jobs.length} job{jobs.length !== 1 ? 's' : ''}</span>
          {parts.length > 0 && (
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <Package className="w-3 h-3" />{parts.reduce((s, p) => s + p.qty, 0)} parts
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="divide-y divide-border">
          {parts.length > 0 && (
            <div className="px-4 py-2 bg-blue-50/50 flex flex-wrap gap-2">
              {parts.map((p, i) => (
                <span key={i} className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full">
                  {p.label} ×{p.qty}
                </span>
              ))}
            </div>
          )}
          {sortedJobs.map(job => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-semibold text-sm">#{job.job_number}</span>
                  <StatusBadge status={job.status} />
                  {job.is_overtime && <span className="text-xs font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full">OT</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  {job.job_date && <span>{format(parseISO(job.job_date), 'dd MMM yyyy')}</span>}
                  {job.start_time && job.finish_time && <span>{job.start_time} – {job.finish_time}</span>}
                  {(job.parts || []).length > 0 && (
                    <span className="flex items-center gap-1"><Package className="w-3 h-3" />{job.parts.length} part{job.parts.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SiteDetail({ site, onBack }) {
  const siteRecordId = site.id && site.id !== (site.location_number || site.name) ? site.id : null;
  const jobs = site.jobs;

  const totalParts = useMemo(() => partsSummary(jobs), [jobs]);

  const recurringIssues = useMemo(() => {
    return jobs
      .filter(j => j.personal_notes?.trim())
      .map(j => ({ note: j.personal_notes.trim(), job_number: j.job_number, job_date: j.job_date }));
  }, [jobs]);

  const sortedJobs = [...jobs].sort((a, b) => {
    if (!a.job_date) return 1;
    if (!b.job_date) return -1;
    return new Date(b.job_date) - new Date(a.job_date);
  });

  // Group jobs by site_asset_ref
  const { assetGroups, unlinkedJobs } = useMemo(() => {
    const groups = {};
    const unlinked = [];
    jobs.forEach(job => {
      if (job.site_asset_ref) {
        if (!groups[job.site_asset_ref]) groups[job.site_asset_ref] = { assetType: job.site_asset_type || 'pump', jobs: [] };
        groups[job.site_asset_ref].jobs.push(job);
      } else {
        unlinked.push(job);
      }
    });
    return { assetGroups: groups, unlinkedJobs: unlinked };
  }, [jobs]);

  return (
    <div className="pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="font-grotesk font-bold text-base truncate">{site.name}</p>
          </div>
          {site.location_number && (
            <p className="text-xs text-muted-foreground">Code: {site.location_number}</p>
          )}
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">

        {/* Equipment inventory */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5" /> Site Equipment
          </p>
          <SiteEquipment site={site} siteRecordId={siteRecordId} />
        </div>

        {/* Summary chips */}
        <div className="flex gap-3 flex-wrap">
          <div className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" />
            {jobs.length} Job{jobs.length !== 1 ? 's' : ''}
          </div>
          {totalParts.length > 0 && (
            <div className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              {totalParts.reduce((s, p) => s + p.qty, 0)} Parts Used
            </div>
          )}
          {recurringIssues.length > 0 && (
            <div className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5" />
              {recurringIssues.length} Personal Note{recurringIssues.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Parts used */}
        {totalParts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> Parts Used at This Site
            </p>
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              {totalParts.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-foreground">{p.label}</span>
                  <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">×{p.qty}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personal notes / recurring issues */}
        {recurringIssues.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5" /> My Notes from This Site
            </p>
            <div className="space-y-2">
              {recurringIssues.map((entry, i) => (
                <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-amber-700">#{entry.job_number}</span>
                    {entry.job_date && (
                      <span className="text-xs text-muted-foreground">{format(parseISO(entry.job_date), 'dd MMM yyyy')}</span>
                    )}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{entry.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Jobs — grouped by asset if available */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" /> All Jobs at This Site
          </p>

          {Object.keys(assetGroups).length > 0 && (
            <div className="space-y-2">
              {Object.entries(assetGroups).map(([ref, { assetType, jobs: aJobs }]) => (
                <AssetJobGroup key={ref} assetRef={ref} assetType={assetType} jobs={aJobs} />
              ))}
            </div>
          )}

          {unlinkedJobs.length > 0 && (
            <div className="space-y-2">
              {Object.keys(assetGroups).length > 0 && (
                <p className="text-xs text-muted-foreground pt-1">Other jobs (no asset linked)</p>
              )}
              {[...unlinkedJobs].sort((a, b) => new Date(b.job_date || 0) - new Date(a.job_date || 0)).map(job => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="block bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm">#{job.job_number}</span>
                        <StatusBadge status={job.status} />
                        {job.is_overtime && <span className="text-xs font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full">OT</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {job.job_date && <span>{format(parseISO(job.job_date), 'dd MMM yyyy')}</span>}
                        {job.start_time && job.finish_time && <span>{job.start_time} – {job.finish_time}</span>}
                        {(job.parts || []).length > 0 && (
                          <span className="flex items-center gap-1"><Package className="w-3 h-3" />{job.parts.length} part{job.parts.length !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}