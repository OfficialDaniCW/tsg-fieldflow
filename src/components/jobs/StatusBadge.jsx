import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Package, AlertTriangle, ShoppingCart, Clock } from 'lucide-react';

const config = {
  completed: { label: 'Completed', icon: CheckCircle2, className: 'bg-green-100 text-green-700 border-green-200' },
  incomplete: { label: 'Incomplete', icon: XCircle, className: 'bg-red-100 text-red-700 border-red-200' },
  parts_required: { label: 'Parts Required', icon: Package, className: 'bg-amber-100 text-amber-700 border-amber-200' },
  non_conformance: { label: 'Non-Conformance', icon: AlertTriangle, className: 'bg-orange-100 text-orange-700 border-orange-200' },
  wrong_parts: { label: 'Non-Conformance', icon: AlertTriangle, className: 'bg-orange-100 text-orange-700 border-orange-200' },
  parts_ordered: { label: 'Parts Ordered', icon: ShoppingCart, className: 'bg-blue-100 text-blue-700 border-blue-200' },
};

export default function StatusBadge({ status, showIcon = true }) {
  const cfg = config[status] || config.incomplete;
  const Icon = cfg.icon;

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', cfg.className)}>
      {showIcon && <Icon className="w-3 h-3" />}
      {cfg.label}
    </span>
  );
}