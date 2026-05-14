import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ArrowLeft, Pencil, MapPin, Hash, Clock, Users, Package, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/jobs/StatusBadge';
import OvertimeBadge from '@/components/jobs/OvertimeBadge';

const partStatusColors = {
  used: 'bg-green-100 text-green-700',
  required: 'bg-amber-100 text-amber-700',
  ordered: 'bg-blue-100 text-blue-700',
  wrong_part: 'bg-orange-100 text-orange-700',
};

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

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

  return (
    <div className="p-5 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-grotesk text-xl font-bold">#{job.job_number}</h1>
              <StatusBadge status={job.status} />
              {job.is_overtime && <OvertimeBadge />}
            </div>
            {job.location_name && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {job.location_name}
                {job.location_number && ` (${job.location_number})`}
              </p>
            )}
          </div>
        </div>
        <Link to={`/jobs/${id}/edit`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {job.job_date && (
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Calendar className="w-3.5 h-3.5" />Date
            </div>
            <p className="text-sm font-medium">{format(new Date(job.job_date), 'dd MMM yyyy')}</p>
          </div>
        )}
        {(job.start_time || job.finish_time) && (
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Clock className="w-3.5 h-3.5" />Times
            </div>
            <p className="text-sm font-medium">{job.start_time || '–'} → {job.finish_time || '–'}</p>
          </div>
        )}
        {job.colleague_name && (
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Users className="w-3.5 h-3.5" />With
            </div>
            <p className="text-sm font-medium">{job.colleague_name}</p>
          </div>
        )}
      </div>

      {/* Notes */}
      {job.completion_notes && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Notes</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{job.completion_notes}</p>
        </div>
      )}

      {/* Parts */}
      {job.parts?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />Parts ({job.parts.length})
          </p>
          <div className="space-y-2">
            {job.parts.map((part, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{part.description || 'Unnamed part'}</p>
                  {part.part_number && <p className="text-xs text-muted-foreground">Part #: {part.part_number}</p>}
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-xs text-muted-foreground">Qty: {part.quantity}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${partStatusColors[part.status] || 'bg-muted text-muted-foreground'}`}>
                    {part.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Images */}
      {job.image_urls?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Images ({job.image_urls.length})</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {job.image_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-80 transition-opacity">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      {job.ai_extracted && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          ✦ Some details were auto-extracted from job sheet images
        </p>
      )}
    </div>
  );
}