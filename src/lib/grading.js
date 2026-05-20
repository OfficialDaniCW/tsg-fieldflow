// TSG Official Grading System

export const GRADE_TARGETS = [
  { grade: 0, ftf: null,  jpd: null,  po: null  },
  { grade: 1, ftf: 85,   jpd: 3.5,   po: 15    },
  { grade: 2, ftf: 86,   jpd: 4.2,   po: 12    },
  { grade: 3, ftf: 88,   jpd: 4.2,   po: 10    },
  { grade: 4, ftf: 90,   jpd: 4.2,   po: 9     },
  { grade: 5, ftf: 92,   jpd: 4.2,   po: 7     },
];

/**
 * Calculate the three KPI values from a list of monthly jobs.
 * @param {Array} jobs - jobs for the selected month
 * @returns {{ ftf: number|null, jpd: number|null, po: number|null }}
 */
export function calcKPIs(jobs) {
  const total = jobs.length;
  if (total === 0) return { ftf: null, jpd: null, po: null };

  // FTF: completed_first_visit only (completed_return_visit is NOT first-time fix)
  const ftfCount = jobs.filter(j => j.status === 'completed_first_visit').length;
  const ftf = Math.round((ftfCount / total) * 100 * 10) / 10;

  // JPD: total jobs ÷ distinct job_date days
  const days = new Set(jobs.map(j => j.job_date).filter(Boolean)).size;
  const jpd = days > 0 ? Math.round((total / days) * 10) / 10 : null;

  // PO: parts-ordered statuses ÷ total (parts_required = legacy alias for needs_parts)
  const poCount = jobs.filter(j =>
    ['needs_parts', 'parts_required', 'parts_ordered', 'wrong_parts_supplied', 'faulty_parts_supplied', 'missing_stock'].includes(j.status)
  ).length;
  const po = Math.round((poCount / total) * 100 * 10) / 10;

  return { ftf, jpd, po };
}

/**
 * Determine which grade is currently achieved (all 3 KPIs met simultaneously).
 */
export function calcCurrentGrade(kpis) {
  const { ftf, jpd, po } = kpis;
  if (ftf === null) return 0;
  let grade = 0;
  for (const t of GRADE_TARGETS) {
    if (t.grade === 0) continue;
    if (ftf >= t.ftf && jpd >= t.jpd && po <= t.po) {
      grade = t.grade;
    } else {
      break;
    }
  }
  return grade;
}

/**
 * Returns what is missing to achieve a given grade.
 */
export function getMissingForGrade(kpis, grade) {
  const target = GRADE_TARGETS.find(t => t.grade === grade);
  if (!target || grade === 0) return [];
  const missing = [];
  if (kpis.ftf === null || kpis.ftf < target.ftf) missing.push(`FTF ≥ ${target.ftf}%`);
  if (kpis.jpd === null || kpis.jpd < target.jpd) missing.push(`JPD ≥ ${target.jpd}`);
  if (kpis.po === null || kpis.po > target.po) missing.push(`PO ≤ ${target.po}%`);
  return missing;
}