import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LayoutTemplate, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TemplatePicker({ onApply }) {
  const [open, setOpen] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['job-templates'],
    queryFn: () => base44.entities.JobTemplate.list('name', 100),
  });

  if (templates.length === 0) return null;

  function apply(template) {
    const { id, created_date, updated_date, created_by, name, ...fields } = template;
    onApply(fields);
    setOpen(false);
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 h-11 justify-between"
        onClick={() => setOpen(v => !v)}
      >
        <span className="flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4 text-primary" />
          Use a template
        </span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
      </Button>

      {open && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Select Template</p>
            <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <ul className="max-h-60 overflow-y-auto divide-y divide-border">
            {templates.map(t => (
              <li key={t.id}>
                <button
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                  onClick={() => apply(t)}
                >
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[t.job_type?.toUpperCase(), t.category, t.location_name].filter(Boolean).join(' · ')}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}