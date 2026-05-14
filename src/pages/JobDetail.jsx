import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Pencil, MapPin, Hash, Clock, Users, Package, Calendar, Wrench, History, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/jobs/StatusBadge';
import OvertimeBadge from '@/components/jobs/OvertimeBadge';
import { cn } from '@/lib/utils';

const partStatusColors = {
  used: 'bg-green-100 text-green-700',
  required: 'bg-amber-100 text-amber-700',
  ordered: 'bg-blue-100 text-blue-700',
  wrong_part: 'bg-orange-100 text-orange-700',
};

const JOB_TYPE_LABELS = {
  reactive: '🔧 Reactive',
  ppm: '📋 PPM',
  vr2: '💨 VR2',
  other: '📁 Other',
};

const NC_REASON_LABELS = {
  wrong_parts_ordered: 'Wrong Parts Ordered',
  wrong_diagnosis: 'Wrong Diagnosis',
  third_party_required: '3rd Party Required',
  weights_and_measures: 'Weights & Measures',
};

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [historyFilter, setHistoryFilter] = useState('all');
  const [showHistory, setShowHistory] = useState(true);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => base44.entities.Job.filter({ id }),
    select: data => data[0],
  });

  if (isLoading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!job) return (
    <div className="p-8 text-center text-muted-foreground">
      <p>Job not found.</p>
      <Link to="/jobs" className="text-primary text-sm hover:underline mt-2 inline-block">Back to jobs</Link>
    </div>
  );

  const history = job.history_entries || [];
  const pumpNumbers = [...new Set(history.map(h => h.pump_number).filter(Boolean))];
  const filteredHistory = historyFilter === 'all'
    ? history
    : history.filter(h => h.pump_number === historyFilter);

  return (
    <div className="pb-8 max-w-2xl mx-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-grotesk font-bold text-base">#{job.job_number}</span>
            <StatusBadge status={job.status} />
            {job.is_overtime && <OvertimeBadge />}
          </div>
          {job.location_name && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {job.location_name}{job.location_number && ` (${job.location_number})`}
            </p>
          )}
        </div>
        <Link to={`/jobs/${id}/edit`}>
          <Button size="sm" className="gap-1.5 h-9">
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="px-4 py-5 space-y-5">

        {/* Key info chips */}
        <div className="flex flex-wrap gap-2">
          {job.job_type && (
            <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
              {JOB_TYPE_LABELS[job.job_type] || job.job_type}
            </span>
          )}
          {job.pump_number && (
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-200">
              🔩 Pump {job.pump_number}
            </span>
          )}
          {job.equipment_name && (
            <span className="bg-secondary text-secondary-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
              <Wrench className="w-3 h-3 inline mr-1" />{job.equipment_name}
            </span>
          )}
          {job.non_conformance_reason && (
            <span className="bg-orange-50 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-orange-200">
              ⚠ {NC_REASON_LABELS[job.non_conformance_reason]}
            </span>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-3 gap-2">
          {job.job_date && (
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs font-semibold">{format(parseISO(job.job_date), 'dd MMM')}</p>
              <p className="text-xs text-muted-foreground">{format(parseISO(job.job_date), 'yyyy')}</p>
            </div>
          )}
          {(job.start_time || job.finish_time) && (
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs font-semibold">{job.start_time || '–'}</p>
              <p className="text-xs text-muted-foreground">→ {job.finish_time || '–'}</p>
            </div>
          )}
          {job.colleague_name && (
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs font-semibold truncate">{job.colleague_name}</p>
              <p className="text-xs text-muted-foreground">With</p>
            </div>
          )}
        </div>

        {/* Notes */}
        {job.completion_notes && (
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">Notes</p>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{job.completion_notes}</p>
          </div>
        )}

        {/* Parts */}
        {job.parts?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />Parts ({job.parts.length})
            </p>
            <div className="space-y-2">
              {job.parts.map((part, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{part.description || 'Unnamed part'}</p>
                    {part.part_number && <p className="text-xs text-muted-foreground">Part #: {part.part_number}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">×{part.quantity}</span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', partStatusColors[part.status] || 'bg-muted text-muted-foreground')}>
                      {part.status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History log */}
        {history.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => setShowHistory(h => !h)}
              className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wide"
            >
              <span className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />Previous Visit Notes ({history.length})
              </span>
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showHistory && (
              <>
                {/* Pump filter */}
                {pumpNumbers.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setHistoryFilter('all')}
                      className={cn('text-xs px-3 py-1 rounded-full border font-medium transition-colors',
                        historyFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card')}
                    >All</button>
                    {pumpNumbers.map(p => (
                      <button
                        key={p}
                        onClick={() => setHistoryFilter(p)}
                        className={cn('text-xs px-3 py-1 rounded-full border font-medium transition-colors',
                          historyFilter === p ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card')}
                      >Pump {p}</button>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  {filteredHistory.map((entry, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {entry.date && <p className="text-xs font-semibold text-muted-foreground">{entry.date}</p>}
                          {entry.equipment && <p className="text-xs text-foreground font-medium">{entry.equipment}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {entry.pump_number && (
                            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                              Pump {entry.pump_number}
                            </span>
                          )}
                        </div>
                      </div>
                      {entry.engineer && <p className="text-xs text-muted-foreground">Engineer: {entry.engineer}</p>}
                      {entry.action_code && <p className="text-xs text-muted-foreground">Ref: {entry.action_code}</p>}
                      {entry.comments && (
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed border-t border-border pt-2 mt-2">{entry.comments}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Images */}
        {job.image_urls?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Images ({job.image_urls.length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {job.image_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-xl overflow-hidden bg-muted hover:opacity-80 transition-opacity">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}

        {job.ai_extracted && (
          <p className="text-xs text-muted-foreground">✦ Some details were auto-extracted from job sheet images</p>
        )}
      </div>
    </div>
  );
}