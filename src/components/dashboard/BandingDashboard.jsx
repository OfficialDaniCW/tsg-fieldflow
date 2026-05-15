const TILES = [
  {
    key: 'total',
    label: 'Total Jobs',
    calc: jobs => ({ count: jobs.length, pct: 100 }),
    color: 'text-foreground',
  },
  {
    key: 'completed_first',
    label: 'Completed first visit',
    calc: jobs => {
      const n = jobs.filter(j => j.status === 'completed_first_visit' || j.status === 'completed').length;
      return { count: n, pct: jobs.length ? Math.round((n / jobs.length) * 100) : 0 };
    },
    color: 'text-green-600',
  },
  {
    key: 'completed_any',
    label: 'Completed any visit',
    calc: jobs => {
      const n = jobs.filter(j => ['completed_first_visit', 'completed_return_visit', 'completed'].includes(j.status)).length;
      return { count: n, pct: jobs.length ? Math.round((n / jobs.length) * 100) : 0 };
    },
    color: 'text-emerald-600',
  },
  {
    key: 'parts_blockers',
    label: 'Parts blockers',
    calc: jobs => {
      const n = jobs.filter(j => ['needs_parts', 'parts_required', 'parts_ordered', 'wrong_parts_supplied', 'faulty_parts_supplied', 'missing_stock'].includes(j.status)).length;
      return { count: n, pct: jobs.length ? Math.round((n / jobs.length) * 100) : 0 };
    },
    color: 'text-amber-600',
  },
  {
    key: 'wrong_faulty',
    label: 'Wrong/faulty parts',
    calc: jobs => {
      const n = jobs.filter(j => ['wrong_parts_supplied', 'faulty_parts_supplied'].includes(j.status)).length;
      return { count: n, pct: jobs.length ? Math.round((n / jobs.length) * 100) : 0 };
    },
    color: 'text-orange-600',
  },
  {
    key: 'access_tooling',
    label: 'Access/tooling blockers',
    calc: jobs => {
      const n = jobs.filter(j => ['no_access', 'tooling_equipment_issue'].includes(j.status)).length;
      return { count: n, pct: jobs.length ? Math.round((n / jobs.length) * 100) : 0 };
    },
    color: 'text-slate-600',
  },
  {
    key: 'prev_diagnosis',
    label: 'Previous diagnosis',
    calc: jobs => {
      const n = jobs.filter(j => j.status === 'previous_diagnosis_issue' || j.status === 'non_conformance').length;
      return { count: n, pct: jobs.length ? Math.round((n / jobs.length) * 100) : 0 };
    },
    color: 'text-orange-600',
  },
  {
    key: 'external',
    label: 'External blockers',
    calc: jobs => {
      const n = jobs.filter(j => ['awaiting_others', 'unable_to_complete'].includes(j.status)).length;
      return { count: n, pct: jobs.length ? Math.round((n / jobs.length) * 100) : 0 };
    },
    color: 'text-sky-600',
  },
  {
    key: 'controllable',
    label: 'Controllable completion',
    calc: jobs => {
      const blockers = jobs.filter(j => ['no_access', 'awaiting_others', 'missing_stock'].includes(j.status)).length;
      const controllable = jobs.length - blockers;
      const completed = jobs.filter(j => ['completed_first_visit', 'completed_return_visit', 'completed'].includes(j.status)).length;
      return { count: completed, pct: controllable > 0 ? Math.round((completed / controllable) * 100) : 0 };
    },
    color: 'text-green-600',
  },
  {
    key: 'engineer',
    label: 'Engineer issue',
    calc: jobs => {
      const n = jobs.filter(j => ['wrong_parts_supplied', 'previous_diagnosis_issue', 'non_conformance'].includes(j.status)).length;
      return { count: n, pct: jobs.length ? Math.round((n / jobs.length) * 100) : 0 };
    },
    color: 'text-red-600',
  },
];

export default function BandingDashboard({ jobs }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Banding Dashboard</p>
      <div className="grid grid-cols-2 gap-2">
        {TILES.map(tile => {
          const { count, pct } = tile.calc(jobs);
          return (
            <div key={tile.key} className="bg-card border border-border rounded-xl p-3">
              <p className="text-xs text-muted-foreground leading-tight">{tile.label}</p>
              <p className={`text-2xl font-grotesk font-bold mt-1 ${tile.color}`}>{count}</p>
              <p className="text-xs text-muted-foreground">{pct}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}