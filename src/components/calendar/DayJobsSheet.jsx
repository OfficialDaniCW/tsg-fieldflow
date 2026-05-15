import { format } from 'date-fns';
import { X, Clock, MapPin, Hash, ChevronRight, GripVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/jobs/StatusBadge';
import OvertimeBadge from '@/components/jobs/OvertimeBadge';
import { AnimatePresence, motion } from 'framer-motion';

export default function DayJobsSheet({ day, jobs, onClose, onJobMoved }) {
  const queryClient = useQueryClient();

  const handleDragStart = (e, job) => {
    e.dataTransfer.setData('jobId', job.id);
  };

  if (!day) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-card rounded-t-2xl shadow-2xl border-t border-border flex flex-col"
        style={{ maxHeight: '75vh', height: '75vh' }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
          <div>
            <p className="font-grotesk font-semibold text-base text-foreground">
              {format(day, 'EEEE, d MMMM')}
            </p>
            <p className="text-xs text-muted-foreground">
              {jobs.length === 0 ? 'No jobs scheduled' : `${jobs.length} job${jobs.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Jobs list */}
        <div className="overflow-y-auto px-4 py-3 space-y-2 flex-1 min-h-0">
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No jobs on this day</p>
              <Link
                to="/jobs/new"
                className="mt-3 inline-block text-sm text-primary font-medium hover:underline"
              >
                + Add a job
              </Link>
            </div>
          ) : (
            jobs.map(job => (
              <div
                key={job.id}
                draggable
                onDragStart={e => handleDragStart(e, job)}
                className={cn(
                  'flex items-start gap-3 bg-background rounded-xl border border-border p-3 cursor-grab active:cursor-grabbing',
                  job.is_overtime && 'border-l-4 border-l-purple-500',
                  (job.status === 'parts_required' || job.status === 'wrong_parts') && 'border-l-4 border-l-amber-500',
                )}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-0.5">
                      <Hash className="w-3 h-3 text-muted-foreground" />{job.job_number}
                    </span>
                    <StatusBadge status={job.status} showIcon={false} />
                    {job.is_overtime && <OvertimeBadge />}
                  </div>
                  {job.location_name && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />{job.location_name}
                    </p>
                  )}
                  {job.start_time && job.finish_time && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 flex-shrink-0" />{job.start_time} – {job.finish_time}
                    </p>
                  )}
                </div>
                <Link to={`/jobs/${job.id}`} className="p-1 hover:bg-secondary rounded-lg transition-colors">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-30 bg-black/30"
      />
    </AnimatePresence>
  );
}