import { Clock, CheckCircle2, AlertTriangle, Package, ShoppingCart, XCircle, Ban, Wrench, AlertCircle, Users, HelpCircle } from 'lucide-react';

const STATUS_CONFIG = {
  completed_first_visit: { label: 'Completed (1st Visit)', icon: CheckCircle2, color: 'bg-green-100 text-green-700 border-green-200' },
  completed_return_visit: { label: 'Completed (Return)', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  // legacy alias kept for display of old records only
  parts_required:        { label: 'Needs Parts', icon: Package, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  incomplete:            { label: 'Incomplete', icon: Clock, color: 'bg-red-100 text-red-700 border-red-200' },
  needs_parts:           { label: 'Needs Parts', icon: Package, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  parts_ordered:         { label: 'Parts Ordered', icon: ShoppingCart, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  wrong_parts_supplied:  { label: 'Wrong Parts', icon: XCircle, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  faulty_parts_supplied: { label: 'Faulty Parts', icon: XCircle, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  missing_stock:         { label: 'Missing Stock', icon: AlertCircle, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  no_access:             { label: 'No Access', icon: Ban, color: 'bg-slate-100 text-slate-700 border-slate-200' },
  tooling_equipment_issue: { label: 'Tooling Issue', icon: Wrench, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  previous_diagnosis_issue: { label: 'Prev. Diagnosis', icon: AlertTriangle, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  awaiting_others:       { label: 'Awaiting Others', icon: Users, color: 'bg-sky-100 text-sky-700 border-sky-200' },
  unable_to_complete:    { label: 'Unable to Complete', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
  non_conformance:       { label: 'Non-Conformance', icon: AlertTriangle, color: 'bg-orange-100 text-orange-700 border-orange-200' },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status || 'Unknown', icon: HelpCircle, color: 'bg-muted text-muted-foreground border-border' };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}