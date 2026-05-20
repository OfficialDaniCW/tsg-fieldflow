import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookmarkPlus, Check } from 'lucide-react';

export default function SaveAsTemplateButton({ form }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.JobTemplate.create({
      name,
      job_type: form.job_type,
      category: form.category,
      location_name: form.location_name,
      location_number: form.location_number,
      equipment_name: form.equipment_name,
      inventory_type: form.inventory_type,
      pump_number: form.pump_number,
      colleague_name: form.colleague_name,
      completion_notes: form.completion_notes,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-templates'] });
      setOpen(false);
      setName('');
    },
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
      >
        <BookmarkPlus className="w-3.5 h-3.5" />
        Save current form as template
      </button>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      <Input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Template name (e.g. PPM Tesco Hythe)"
        className="h-9 text-sm flex-1"
        autoFocus
        onKeyDown={e => e.key === 'Enter' && name && saveMutation.mutate()}
      />
      <Button
        size="sm"
        className="h-9 gap-1"
        disabled={!name || saveMutation.isPending}
        onClick={() => saveMutation.mutate()}
      >
        <Check className="w-3.5 h-3.5" />
        {saveMutation.isPending ? 'Saving...' : 'Save'}
      </Button>
      <Button size="sm" variant="ghost" className="h-9" onClick={() => setOpen(false)}>Cancel</Button>
    </div>
  );
}