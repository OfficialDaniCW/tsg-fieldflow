import { CheckCircle2, XCircle } from 'lucide-react';
import { GRADE_TARGETS, calcCurrentGrade, getMissingForGrade } from '@/lib/grading';

function KPICard({ label, value, unit = '', target, higherIsBetter, description }) {
  const hasValue = value !== null;
  const passes = hasValue && (higherIsBetter ? value >= target : value <= target);

  // Progress bar: cap at 100%
  let pct = 0;
  if (hasValue && target) {
    pct = higherIsBetter
      ? Math.min(100, Math.round((value / target) * 100))
      : Math.min(100, Math.round(((target * 2 - value) / (target * 2)) * 100));
    // Simpler for PO: full bar at 0%, empty at 2×target
    if (!higherIsBetter) {
      pct = value <= target ? Math.round(((target - value) / target) * 50 + 50) : Math.round(Math.max(0, (1 - value / (target * 2)) * 50));
    }
    pct = Math.max(0, Math.min(100, pct));
  }

  return (
    <div className={`border rounded-xl p-4 flex flex-col gap-2 ${passes ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
        {hasValue
          ? passes
            ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          : null}
      </div>

      <div className="flex items-end gap-1.5">
        <span className={`font-grotesk text-3xl font-bold ${passes ? 'text-green-700' : 'text-red-600'}`}>
          {hasValue ? `${value}${unit}` : '–'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white/70 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${passes ? 'bg-green-500' : 'bg-red-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Grade 1 target: <span className="font-semibold">{higherIsBetter ? '≥' : '≤'} {target}{unit}</span>
        {description && <span className="block mt-0.5 text-muted-foreground/70">{description}</span>}
      </p>
    </div>
  );
}

export default function GradeTracker({ kpis }) {
  const { ftf, jpd, po } = kpis;
  const currentGrade = calcCurrentGrade(kpis);
  const nextGrade = Math.min(currentGrade + 1, 5);
  const missing = getMissingForGrade(kpis, nextGrade);
  const nextTarget = GRADE_TARGETS.find(t => t.grade === nextGrade);

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Grade Tracker</p>

      {/* Three KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        <KPICard
          label="FTF %"
          value={ftf}
          unit="%"
          target={85}
          higherIsBetter
          description="First time fix rate"
        />
        <KPICard
          label="JPD"
          value={jpd}
          unit=""
          target={3.5}
          higherIsBetter
          description="Jobs per day"
        />
        <KPICard
          label="PO %"
          value={po}
          unit="%"
          target={15}
          higherIsBetter={false}
          description="Parts ordered rate"
        />
      </div>

      {/* Current grade readout */}
      <div className={`rounded-2xl border p-5 flex flex-col gap-2 ${currentGrade >= 1 ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Current Grade</p>
            <p className="font-grotesk text-4xl font-bold text-foreground">Grade {currentGrade}</p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(g => (
              <div
                key={g}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${g <= currentGrade ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                {g}
              </div>
            ))}
          </div>
        </div>

        {currentGrade < 5 && nextTarget && (
          <div className="mt-1">
            <p className="text-sm font-semibold text-foreground">
              Next target: Grade {nextGrade}
            </p>
            {missing.length === 0 ? (
              <p className="text-xs text-green-700 mt-0.5">All targets met — grade will be updated next calculation.</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                Needs: <span className="font-semibold text-red-600">{missing.join(', ')}</span>
              </p>
            )}
          </div>
        )}
        {currentGrade === 5 && (
          <p className="text-sm font-semibold text-green-700">Maximum grade achieved!</p>
        )}
      </div>
    </div>
  );
}