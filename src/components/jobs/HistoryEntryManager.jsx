import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const emptyEntry = { date: '', engineer: '', equipment: '', pump_number: '', action_code: '', comments: '' };

export default function HistoryEntryManager({ entries = [], onChange }) {
  const [expanded, setExpanded] = useState(null);

  const add = () => {
    const updated = [...entries, { ...emptyEntry }];
    onChange(updated);
    setExpanded(updated.length - 1);
  };

  const update = (i, field, value) => {
    const updated = entries.map((e, idx) => idx === i ? { ...e, [field]: value } : e);
    onChange(updated);
  };

  const remove = (i) => {
    onChange(entries.filter((_, idx) => idx !== i));
    setExpanded(null);
  };

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => (
        <div key={i} className="border border-border rounded-xl overflow-hidden bg-card">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left"
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            <span className="truncate">
              {entry.date || entry.equipment || `Entry ${i + 1}`}
              {entry.pump_number && <span className="text-xs text-blue-600 ml-2">Pump {entry.pump_number}</span>}
            </span>
            {expanded === i ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
          </button>

          {expanded === i && (
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <Input value={entry.date} onChange={e => update(i, 'date', e.target.value)} placeholder="e.g. 24/04/2026" className="h-10" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Pump Number</Label>
                  <Input value={entry.pump_number} onChange={e => update(i, 'pump_number', e.target.value)} placeholder="e.g. 9" className="h-10" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Equipment</Label>
                <Input value={entry.equipment} onChange={e => update(i, 'equipment', e.target.value)} placeholder="e.g. SK700 VR2 MULTILINE" className="h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Engineer</Label>
                <Input value={entry.engineer} onChange={e => update(i, 'engineer', e.target.value)} placeholder="Name" className="h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Action / Ref Code</Label>
                <Input value={entry.action_code} onChange={e => update(i, 'action_code', e.target.value)} placeholder="e.g. 2604384263" className="h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Comments / What was done</Label>
                <Textarea value={entry.comments} onChange={e => update(i, 'comments', e.target.value)} placeholder="Describe what happened on that visit..." className="resize-none h-24" />
              </div>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 w-full" onClick={() => remove(i)}>
                <Trash2 className="w-3.5 h-3.5" />Remove Entry
              </Button>
            </div>
          )}
        </div>
      ))}

      <Button variant="outline" size="sm" className="w-full gap-2 h-10 border-dashed" onClick={add}>
        <Plus className="w-4 h-4" />Add Previous Visit Note
      </Button>
    </div>
  );
}