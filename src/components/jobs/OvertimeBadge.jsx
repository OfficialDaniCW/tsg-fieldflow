import { Clock } from 'lucide-react';

export default function OvertimeBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
      <Clock className="w-3 h-3" />
      OT
    </span>
  );
}