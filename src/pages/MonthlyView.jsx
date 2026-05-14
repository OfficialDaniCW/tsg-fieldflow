import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, startOfMonth, endOfMonth, parseISO, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsRow from '@/components/dashboard/StatsRow';
import JobCard from '@/components/jobs/JobCard';
import MonthlyChart from '@/components/dashboard/MonthlyChart';

export default function MonthlyView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: allJobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-job_date', 500),
  });

  const monthJobs = allJobs.filter(job => {
    if (!job.job_date) return false;
    const d = parseISO(job.job_date);
    return d >= startOfMonth(currentMonth) && d <= endOfMonth(currentMonth);
  });

  const partsIssues = monthJobs.filter(j => ['parts_required', 'wrong_parts', 'parts_ordered'].includes(j.status));
  const overtimeJobs = monthJobs.filter(j => j.is_overtime);

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto space-y-7">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <h1 className="font-grotesk text-2xl font-bold">Monthly View</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-grotesk font-semibold text-sm w-28 text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <StatsRow jobs={monthJobs} />

      <MonthlyChart jobs={allJobs} />

      {/* Parts issues */}
      {partsIssues.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Parts Issues This Month</p>
          <div className="space-y-2">
            {partsIssues.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        </div>
      )}

      {/* Overtime */}
      {overtimeJobs.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Overtime Jobs ({overtimeJobs.length})
          </p>
          <div className="space-y-2">
            {overtimeJobs.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        </div>
      )}

      {/* All jobs this month */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          All Jobs — {format(currentMonth, 'MMMM yyyy')} ({monthJobs.length})
        </p>
        {monthJobs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No jobs recorded for this month.
          </div>
        ) : (
          <div className="space-y-2">
            {monthJobs.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        )}
      </div>
    </div>
  );
}