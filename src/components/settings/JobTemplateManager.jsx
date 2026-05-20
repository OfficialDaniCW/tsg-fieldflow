import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function JobTemplateManager() {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['job-templates'],
    queryFn: () => base44.entities.JobTemplate.list('name', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.JobTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-templates'] }),
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <LayoutTemplate className="w-4 h-4 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Job Templates</p>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Templates pre-fill the job form. Create them from the job form using "Save as template".
      </p>

      {isLoading && <p className="text-xs text-muted-foreground">Loading...</p>}

      {!isLoading && templates.length === 0 && (
        <div className="bg-muted/40 rounded-xl px-4 py-5 text-center">
          <p className="text-sm text-muted-foreground">No templates yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Open any job form and tap "Save current form as template".</p>
        </div>
      )}

      <ul className="space-y-2">
        {templates.map(t => (
          <li key={t.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{t.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {[t.job_type?.toUpperCase(), t.category, t.location_name].filter(Boolean).join(' · ')}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0 h-8 w-8"
              onClick={() => { if (confirm('Delete this template?')) deleteMutation.mutate(t.id); }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}