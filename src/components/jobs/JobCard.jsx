import { Link } from 'react-router-dom';
import { MapPin, Hash, Clock, Users, ChevronRight, Image, UserCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import OvertimeBadge from './OvertimeBadge';
import { format } from 'date-fns';

export default function JobCard({ job, showCreatedBy = false }) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="block bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-grotesk font-semibold text-sm text-foreground">
              <Hash className="w-3.5 h-3.5 inline mr-0.5 text-muted-foreground" />
              {job.job_number}
            </span>
            <StatusBadge status={job.status} />
            {job.is_overtime && <OvertimeBadge />}
          </div>

          {job.location_name && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{job.location_name?.toUpperCase()}</span>
              {job.location_number && (
                <span className="text-xs text-muted-foreground/70">({job.location_number})</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {job.job_date && (
              <span>{format(new Date(job.job_date), 'dd MMM yyyy')}</span>
            )}
            {job.start_time && job.finish_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {job.start_time} – {job.finish_time}
              </span>
            )}
            {job.colleague_name && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {job.colleague_name}
              </span>
            )}
            {job.image_urls?.length > 0 && (
              <span className="flex items-center gap-1">
                <Image className="w-3 h-3" />
                {job.image_urls.length}
              </span>
            )}
            {showCreatedBy && job.created_by && (
              <span className="flex items-center gap-1 text-primary/70 font-medium">
                <UserCircle className="w-3 h-3" />
                {job.created_by.split('@')[0]}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
      </div>
    </Link>
  );
}