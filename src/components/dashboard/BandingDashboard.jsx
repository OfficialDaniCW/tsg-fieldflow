import { GRADE_TARGETS, calcKPIs } from '@/lib/grading';
import { CheckCircle2, XCircle } from 'lucide-react';

function GradeBar({ value, higherIsBetter, grades, unit }) {
  const maxGrade = grades[grades.length - 1];
  const minGrade = grades[0];

  return (
    <div className="mt-2 space-y-1">
      {GRADE_TARGETS.filter(t => t.grade >= 1).map(t => {
        const target = higherIsBetter ? t.ftf ?? t.jpd : t.po;
        const tVal = unit === '%' && higherIsBetter ? t.ftf
          : unit === '' ? t.jpd
          : t.po;
        const passes = value !== null && (higherIsBetter ? value >= tVal : value <= tVal);
        return (
          <div key={t.grade} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-12">G{t.grade}</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${passes ? 'bg-green-500' : 'bg-slate-300'}`}
                style={{ width: '100%' }}
              />
            </div>
            <span className={`text-xs font-semibold w-12 text-right ${passes ? 'text-green-600' : 'text-muted-foreground'}`}>
              {higherIsBetter ? '≥' : '≤'}{tVal}{unit}
            </span>
            {passes
              ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              : <XCircle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
            }
          </div>
        );
      })}
    </div>
  );
}

function KPIScaleCard({ label, value, unit, higherIsBetter, accessor }) {
  const hasValue = value !== null;
  const g1 = GRADE_TARGETS.find(t => t.grade === 1);
  const g5 = GRADE_TARGETS.find(t => t.grade === 5);
  const g1Target = accessor(g1);
  const g5Target = accessor(g5);
  const passes = hasValue && (higherIsBetter ? value >= g1Target : value <= g1Target);

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{label}</p>
        {hasValue && (
          passes
            ? <CheckCircle2 className="w-4 h-4 text-green-500" />
            : <XCircle className="w-4 h-4 text-red-400" />
        )}
      </div>
      <p className={`font-grotesk text-3xl font-bold ${passes ? 'text-green-600' : 'text-red-500'}`}>
        {hasValue ? `${value}${unit}` : '–'}
      </p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>G1: {higherIsBetter ? '≥' : '≤'}{g1Target}{unit}</span>
        <span>G5: {higherIsBetter ? '≥' : '≤'}{g5Target}{unit}</span>
      </div>
      {/* Grade scale */}
      <div className="space-y-1 pt-1">
        {GRADE_TARGETS.filter(t => t.grade >= 1).map(t => {
          const tVal = accessor(t);
          const met = hasValue && (higherIsBetter ? value >= tVal : value <= tVal);
          return (
            <div key={t.grade} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-5">G{t.grade}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${met ? 'bg-green-500' : 'bg-slate-200'}`} style={{ width: '100%' }} />
              </div>
              <span className={`text-xs w-16 text-right ${met ? 'text-green-600 font-semibold' : 'text-muted-foreground'}`}>
                {higherIsBetter ? '≥' : '≤'}{tVal}{unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Legacy breakdown tiles (kept as-is)
const BREAKDOWN_TILES = [
  {
    key: 'parts_blockers',
    label: 'Parts blockers',
    calc: jobs => {
      // parts_required is legacy alias for needs_parts
      const n = jobs.filter(j => ['needs_parts', 'parts_required', 'parts_ordered', 'wrong_parts_supplied', 'faulty_parts_supplied', 'missing_stock'].includes(j.status)).length;
      return { count: n, pct: jobs.length ? Math.round((n / jobs.length) * 100) : 0 };
    },
    color: 'text-amber-600',
  },
  {
    key: 'access_tooling',
    label: 'Access / tooling',
    calc: jobs => {
      const n = jobs.filter(j => ['no_access', 'tooling_equipment_issue'].includes(j.status)).length;
      return { count: n, pct: jobs.length ? Math.round((n / jobs.length) * 100) : 0 };
    },
    color: 'text-slate-600',
  },
  {
    key: 'prev_diagnosis',
    label: 'Diagnosis issues',
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
];

export default function BandingDashboard({ jobs }) {
  const kpis = calcKPIs(jobs);

  return (
    <div className="space-y-5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">KPI Scale — Grade 1 → 5</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPIScaleCard
          label="FTF % — First Time Fix"
          value={kpis.ftf}
          unit="%"
          higherIsBetter
          accessor={t => t.ftf}
        />
        <KPIScaleCard
          label="JPD — Jobs Per Day"
          value={kpis.jpd}
          unit=""
          higherIsBetter
          accessor={t => t.jpd}
        />
        <KPIScaleCard
          label="PO % — Parts Ordered"
          value={kpis.po}
          unit="%"
          higherIsBetter={false}
          accessor={t => t.po}
        />
      </div>

      {/* Breakdown tiles */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">Breakdown</p>
      <div className="grid grid-cols-2 gap-2">
        {BREAKDOWN_TILES.map(tile => {
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