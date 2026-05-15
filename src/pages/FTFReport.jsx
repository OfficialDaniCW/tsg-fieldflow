import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/jobs/StatusBadge';
import BandingDashboard from '@/components/dashboard/BandingDashboard';

const NC_REASON_LABELS = {
  wrong_parts_ordered: 'Wrong Parts Ordered',
  wrong_diagnosis: 'Wrong Diagnosis',
  third_party_required: '3rd Party Required',
  weights_and_measures: 'Weights & Measures',
};

export default function FTFReport() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: allJobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-job_date', 1000),
  });

  const monthStr = format(currentMonth, 'yyyy-MM');
  const monthJobs = allJobs.filter(job => job.job_date?.startsWith(monthStr));

  const completed = monthJobs.filter(j => ['completed', 'completed_first_visit', 'completed_return_visit'].includes(j.status));
  const nonConformance = monthJobs.filter(j => ['non_conformance', 'wrong_parts_supplied', 'faulty_parts_supplied', 'previous_diagnosis_issue'].includes(j.status));
  const total = monthJobs.length;
  const ftfRate = total > 0 ? Math.round((completed.length / total) * 100) : null;

  // Group non-conformance by reason
  const reasonCounts = nonConformance.reduce((acc, job) => {
    const reason = job.non_conformance_reason || 'unspecified';
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {});

  const rateColor = ftfRate === null ? 'text-muted-foreground' : ftfRate >= 80 ? 'text-green-600' : ftfRate >= 60 ? 'text-amber-600' : 'text-red-600';
  const rateBg = ftfRate === null ? 'bg-muted' : ftfRate >= 80 ? 'bg-green-50 border-green-200' : ftfRate >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-grotesk text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            FTF Report
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">First Time Fix & Non-Conformance Tracker</p>
        </div>
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

      {/* FTF Rate Card */}
      <div className={`border rounded-2xl p-6 ${rateBg}`}>
        <p className="text-sm font-medium text-muted-foreground mb-1">First Time Fix Rate</p>
        <div className="flex items-end gap-3">
          <span className={`font-grotesk text-5xl font-bold ${rateColor}`}>
            {ftfRate !== null ? `${ftfRate}%` : '–'}
          </span>
          <span className="text-sm text-muted-foreground mb-1.5">
            {completed.length} completed / {total} total jobs
          </span>
        </div>
        {/* Progress bar */}
        {ftfRate !== null && (
          <div className="mt-4 h-2.5 bg-white/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${ftfRate >= 80 ? 'bg-green-500' : ftfRate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${ftfRate}%` }}
            />
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          {ftfRate === null ? 'No jobs recorded this month.' : ftfRate >= 80 ? 'Excellent first time fix rate!' : ftfRate >= 60 ? 'Aim for above 80% FTF rate.' : 'Low FTF rate — review non-conformance reasons below.'}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-grotesk font-bold text-foreground">{total}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Jobs</p>
        </div>
        <div className="bg-card border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-grotesk font-bold text-green-600">{completed.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Completed (FTF)</p>
        </div>
        <div className="bg-card border border-orange-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-grotesk font-bold text-orange-600">{nonConformance.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Non-Conformance</p>
        </div>
      </div>

      {/* Non-conformance breakdown */}
      {nonConformance.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Non-Conformance Breakdown</p>

          {/* Reason summary */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            {Object.entries(reasonCounts).map(([reason, count]) => (
              <div key={reason} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-sm font-medium">
                    {reason === 'unspecified' ? 'Reason Not Specified' : NC_REASON_LABELS[reason] || reason}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full"
                      style={{ width: `${(count / nonConformance.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-orange-600 w-4 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Individual NC jobs */}
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Non-Conformance Jobs</p>
          <div className="space-y-2">
            {nonConformance.map(job => (
              <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between bg-card border border-border rounded-xl p-3 hover:bg-secondary/50 transition-colors">
                <div>
                  <p className="text-sm font-semibold">#{job.job_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.location_name && `${job.location_name} · `}
                    {job.job_date && format(parseISO(job.job_date), 'dd MMM')}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <StatusBadge status={job.status} />
                  {job.non_conformance_reason && (
                    <p className="text-xs text-orange-600 font-medium">{NC_REASON_LABELS[job.non_conformance_reason]}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Banding Dashboard */}
      <BandingDashboard jobs={monthJobs} />

      {total > 0 && nonConformance.length === 0 && (
        <div className="text-center py-8 bg-green-50 border border-green-200 rounded-2xl">
          <p className="font-semibold text-green-700">No non-conformances this month!</p>
          <p className="text-sm text-green-600 mt-0.5">Perfect first time fix rate.</p>
        </div>
      )}
    </div>
  );
}