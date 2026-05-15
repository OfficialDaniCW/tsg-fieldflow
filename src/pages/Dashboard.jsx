import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsRow from '@/components/dashboard/StatsRow';
import MonthlyChart from '@/components/dashboard/MonthlyChart';
import JobCard from '@/components/jobs/JobCard';
import StatusBadge from '@/components/jobs/StatusBadge';
import { useJobs } from '@/hooks/useJobs';
import { useAuth } from '@/lib/AuthContext';

export default function Dashboard() {
  const { data: allJobs = [] } = useJobs();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const now = new Date();
  const thisMonthStr = format(now, 'yyyy-MM');
  const thisMonthJobs = allJobs.filter(j => j.job_date?.startsWith(thisMonthStr));

  const incomplete = allJobs.filter(j => j.status === 'incomplete').slice(0, 5);
  const partsIssues = allJobs.filter(j => ['parts_required', 'non_conformance', 'wrong_parts'].includes(j.status)).slice(0, 5);
  const recentJobs = allJobs.slice(0, 5);

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-grotesk text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{format(now, 'EEEE, d MMMM yyyy')}</p>
        </div>
        <Link to="/jobs/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Job
          </Button>
        </Link>
      </div>

      {/* Stats — all jobs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">This Month</p>
          {allJobs.filter(j => !j.job_date).length > 0 && (
            <span className="text-xs text-amber-600 font-medium">
              {allJobs.filter(j => !j.job_date).length} job{allJobs.filter(j => !j.job_date).length > 1 ? 's' : ''} missing a date
            </span>
          )}
        </div>
        <StatsRow jobs={thisMonthJobs} allJobsCount={allJobs.length} />
      </div>

      {/* Chart */}
      <MonthlyChart jobs={allJobs} />

      {/* Attention needed */}
      {(incomplete.length > 0 || partsIssues.length > 0) && (
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Needs Attention</p>

          {incomplete.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-red-700">{incomplete.length} Incomplete Jobs</span>
              </div>
              <div className="space-y-2">
                {incomplete.map(job => (
                  <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between py-1.5 hover:opacity-70 transition-opacity">
                    <span className="text-sm font-medium text-foreground">#{job.job_number}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {job.location_name && <span>{job.location_name}</span>}
                      {job.job_date && <span>{format(new Date(job.job_date), 'dd MMM')}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {partsIssues.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-amber-700">{partsIssues.length} Parts Issues</span>
              </div>
              <div className="space-y-2">
                {partsIssues.map(job => (
                  <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between py-1.5 hover:opacity-70 transition-opacity">
                    <span className="text-sm font-medium text-foreground">#{job.job_number}</span>
                    <StatusBadge status={job.status} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent jobs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recent Jobs</p>
          <Link to="/jobs" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        <div className="space-y-2">
          {recentJobs.map(job => <JobCard key={job.id} job={job} showCreatedBy={isAdmin} />)}
          {recentJobs.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-sm">No jobs yet.</p>
              <Link to="/jobs/new" className="text-sm text-primary hover:underline mt-1 inline-block">Create your first job</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}