import { CheckCircle2, XCircle, Package, Clock, Briefcase } from 'lucide-react';

export default function StatsRow({ jobs, allJobsCount }) {
  const total = jobs.length;
  const completed = jobs.filter(j => j.status === 'completed').length;
  const incomplete = jobs.filter(j => j.status === 'incomplete').length;
  const partsIssues = jobs.filter(j => ['parts_required', 'wrong_parts', 'parts_ordered', 'non_conformance'].includes(j.status)).length;
  const overtime = jobs.filter(j => j.is_overtime).length;

  const stats = [
    {
      label: 'This Month',
      value: total,
      sub: allJobsCount != null ? `${allJobsCount} total` : null,
      icon: Briefcase,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    { label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Incomplete', value: incomplete, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Parts Issues', value: partsIssues, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Overtime', value: overtime, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
      {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
        <div key={label} className="bg-card border border-border rounded-xl p-3 md:p-4">
          <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg ${bg} flex items-center justify-center mb-2 md:mb-3`}>
            <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${color}`} />
          </div>
          <p className="text-xl md:text-2xl font-grotesk font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
          {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
        </div>
      ))}
    </div>
  );
}