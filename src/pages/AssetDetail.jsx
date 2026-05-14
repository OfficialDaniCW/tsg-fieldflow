import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Wrench, MapPin, Hash, AlertTriangle, CheckCircle2, Package, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/jobs/StatusBadge';

const JOB_TYPE_LABELS = {
  reactive: '🔧 Reactive',
  ppm: '📋 PPM',
  vr2: '💨 VR2',
  other: '📁 Other',
};

const EQUIPMENT_TYPE_LABELS = {
  pump: '⛽ Pump',
  tank_gauge: '📊 Tank Gauge',
  vr2: '💨 VR2',
  other: '📁 Other',
};

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: equipment, isLoading: loadingAsset } = useQuery({
    queryKey: ['equipment', id],
    queryFn: () => base44.entities.Equipment.filter({ id }),
    select: data => data[0],
  });

  const { data: allJobs = [], isLoading: loadingJobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-job_date', 500),
  });

  // Match jobs to this equipment by name (equipment_name is denormalised on jobs)
  const serviceHistory = equipment
    ? allJobs.filter(j => j.equipment_name && j.equipment_name.toLowerCase() === equipment.name?.toLowerCase())
    : [];

  const isLoading = loadingAsset || loadingJobs;

  if (isLoading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!equipment) return (
    <div className="p-8 text-center text-muted-foreground">
      <p>Asset not found.</p>
      <Link to="/assets" className="text-primary text-sm hover:underline mt-2 inline-block">Back to Asset Library</Link>
    </div>
  );

  // Fault analysis
  const faultJobs = serviceHistory.filter(j => ['parts_required', 'non_conformance', 'parts_ordered'].includes(j.status));
  const completedJobs = serviceHistory.filter(j => j.status === 'completed');
  const ftfRate = serviceHistory.length > 0 ? Math.round((completedJobs.length / serviceHistory.length) * 100) : null;

  return (
    <div className="pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="font-grotesk font-bold text-base truncate">{equipment.name}</p>
          {equipment.location_name && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3" />{equipment.location_name}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">

        {/* Asset info chips */}
        <div className="flex flex-wrap gap-2">
          {equipment.equipment_type && (
            <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
              {EQUIPMENT_TYPE_LABELS[equipment.equipment_type] || equipment.equipment_type}
            </span>
          )}
          {equipment.asset_number && (
            <span className="bg-secondary text-secondary-foreground text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
              <Hash className="w-3 h-3" />{equipment.asset_number}
            </span>
          )}
        </div>

        {equipment.notes && (
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Notes</p>
            <p className="text-sm text-foreground">{equipment.notes}</p>
          </div>
        )}

        {/* Service summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-grotesk font-bold text-foreground">{serviceHistory.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Jobs</p>
          </div>
          <div className="bg-card border border-green-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-grotesk font-bold text-green-600">{ftfRate !== null ? `${ftfRate}%` : '–'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">FTF Rate</p>
          </div>
          <div className="bg-card border border-orange-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-grotesk font-bold text-orange-600">{faultJobs.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Fault Jobs</p>
          </div>
        </div>

        {/* Recurring fault banner */}
        {faultJobs.length >= 2 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Recurring Fault Detected</p>
              <p className="text-xs text-red-600 mt-0.5">
                This asset has {faultJobs.length} fault/non-conformance jobs. Review service history below for patterns.
              </p>
            </div>
          </div>
        )}

        {/* Service history */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Service History ({serviceHistory.length})
          </p>

          {serviceHistory.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No jobs linked to this asset yet.</p>
              <p className="text-xs mt-1 text-muted-foreground">Jobs are linked when they reference this equipment name.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {serviceHistory.map(job => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="flex items-start gap-3 bg-card border border-border rounded-xl p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold">#{job.job_number}</span>
                      <StatusBadge status={job.status} />
                      {job.job_type && (
                        <span className="text-xs text-muted-foreground">{JOB_TYPE_LABELS[job.job_type]}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {job.job_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />{format(parseISO(job.job_date), 'dd MMM yyyy')}
                        </span>
                      )}
                      {job.pump_number && <span>Pump {job.pump_number}</span>}
                      {job.completion_notes && (
                        <span className="truncate max-w-48">{job.completion_notes}</span>
                      )}
                    </div>
                    {job.parts?.length > 0 && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-primary">
                        <Package className="w-3 h-3" />
                        {job.parts.length} part{job.parts.length > 1 ? 's' : ''} logged
                      </div>
                    )}
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground/30 flex-shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}