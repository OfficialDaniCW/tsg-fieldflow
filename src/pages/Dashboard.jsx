import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, AlertTriangle, Clock, Moon, Package, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsRow from '@/components/dashboard/StatsRow';
import MonthlyChart from '@/components/dashboard/MonthlyChart';
import JobCard from '@/components/jobs/JobCard';
import StatusBadge from '@/components/jobs/StatusBadge';
import { useJobs } from '@/hooks/useJobs';
import { useAuth } from '@/lib/AuthContext';
import TravelSummary from '@/components/dashboard/TravelSummary';
import TodayRoutePlanner from '@/components/dashboard/TodayRoutePlanner';
import TravelTracker from '@/components/jobs/TravelTracker';
import TravelHome from '@/components/jobs/TravelHome';

export default function Dashboard() {
  const { data: allJobs = [] } = useJobs();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const now = new Date();
  const thisMonthStr = format(now, 'yyyy-MM');
  const thisMonthJobs = allJobs.filter(j => j.job_date?.startsWith(thisMonthStr));

  const INCOMPLETE_STATUSES = ['incomplete', 'unable_to_complete', 'no_access', 'tooling_equipment_issue', 'previous_diagnosis_issue', 'awaiting_others'];
  const PARTS_STATUSES = ['needs_parts', 'parts_required', 'parts_ordered', 'wrong_parts_supplied', 'faulty_parts_supplied', 'missing_stock', 'non_conformance'];
  const incomplete = allJobs.filter(j => INCOMPLETE_STATUSES.includes(j.status)).slice(0, 5);
  const partsIssues = allJobs.filter(j => PARTS_STATUSES.includes(j.status)).slice(0, 5);
  const overtimeJobs = allJobs.filter(j => j.is_overtime).slice(0, 10);
  const recentJobs = allJobs.slice(0, 5);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-5 md:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-grotesk text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{format(now, 'EEEE, d MMMM yyyy')}</p>
        </div>
        <Link to="/jobs/new">
          <Button size="sm" className="gap-1.5 h-9">
            <Plus className="w-4 h-4" />
            New Job
          </Button>
        </Link>
      </div>

      {/* Travel Summary */}
      <TravelSummary />

      {/* Travel Tracker & Travel Home */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TravelTracker />
        <TravelHome />
      </div>

      {/* Today's Route Planner */}
      <TodayRoutePlanner jobs={allJobs} />

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
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-red-200 flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-700" />
                </div>
                <div>
                  <span className="text-sm font-bold text-red-800">Incomplete</span>
                  <span className="ml-2 text-xs text-red-600 font-medium">— job could not be completed</span>
                </div>
                <span className="ml-auto bg-red-200 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">{incomplete.length}</span>
              </div>
              <p className="text-xs text-red-600 mb-3 ml-9">No parts issue — engineer was unable to attend or complete the job.</p>
              <div className="space-y-1">
                {incomplete.map(job => (
                  <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2 hover:bg-white transition-colors">
                    <span className="text-sm font-semibold text-foreground">#{job.job_number}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {job.location_name && <span>{job.location_name}</span>}
                      {job.job_date && <span className="font-mono">{format(new Date(job.job_date), 'dd MMM')}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {partsIssues.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-amber-200 flex items-center justify-center">
                  <Package className="w-4 h-4 text-amber-800" />
                </div>
                <div>
                  <span className="text-sm font-bold text-amber-900">Parts Issues</span>
                  <span className="ml-2 text-xs text-amber-700 font-medium">— blocked by parts</span>
                </div>
                <span className="ml-auto bg-amber-200 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">{partsIssues.length}</span>
              </div>
              <p className="text-xs text-amber-700 mb-3 ml-9">Job attended but stalled due to parts — needs ordering, chasing or re-supply.</p>
              <div className="space-y-1">
                {partsIssues.map(job => (
                  <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2 hover:bg-white transition-colors">
                    <span className="text-sm font-semibold text-foreground">#{job.job_number}</span>
                    <div className="flex items-center gap-2">
                      {job.location_name && <span className="text-xs text-muted-foreground">{job.location_name}</span>}
                      <StatusBadge status={job.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overtime jobs */}
      {overtimeJobs.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Overtime Jobs</p>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Moon className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-800">{overtimeJobs.length} job{overtimeJobs.length !== 1 ? 's' : ''} with overtime</span>
            </div>
            <div className="space-y-2">
              {overtimeJobs.map(job => (
                <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between py-1.5 hover:opacity-70 transition-opacity">
                  <span className="text-sm font-medium text-foreground">#{job.job_number}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {job.location_name && <span>{job.location_name}</span>}
                    {job.job_date && <span>{format(new Date(job.job_date), 'dd MMM')}</span>}
                    {job.finish_time && <span className="font-mono text-purple-700">→ {job.finish_time}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
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