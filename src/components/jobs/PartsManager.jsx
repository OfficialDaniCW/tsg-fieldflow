import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusOpts = [
  { value: 'used', label: 'Used' },
  { value: 'required', label: 'Required' },
  { value: 'ordered', label: 'Ordered' },
  { value: 'wrong_part', label: 'Wrong Part' },
];

const statusColors = {
  used: 'bg-green-100 text-green-700',
  required: 'bg-amber-100 text-amber-700',
  ordered: 'bg-blue-100 text-blue-700',
  wrong_part: 'bg-orange-100 text-orange-700',
};

export default function PartsManager({ parts = [], onChange }) {
  const addPart = () => onChange([...parts, { part_number: '', description: '', quantity: 1, status: 'used' }]);

  const update = (i, field, value) => {
    const updated = parts.map((p, idx) => idx === i ? { ...p, [field]: value } : p);
    onChange(updated);
  };

  const remove = (i) => onChange(parts.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      {parts.map((part, i) => (
        <div key={i} className="flex gap-2 items-start p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex-1 grid grid-cols-2 gap-2">
            <Input
              placeholder="Part #"
              value={part.part_number}
              onChange={e => update(i, 'part_number', e.target.value)}
              className="text-sm"
            />
            <Input
              placeholder="Description"
              value={part.description}
              onChange={e => update(i, 'description', e.target.value)}
              className="text-sm"
            />
            <Input
              type="number"
              placeholder="Qty"
              min={1}
              value={part.quantity}
              onChange={e => update(i, 'quantity', parseInt(e.target.value) || 1)}
              className="text-sm"
            />
            <Select value={part.status} onValueChange={v => update(i, 'status', v)}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOpts.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button onClick={() => remove(i)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addPart} className="w-full gap-2">
        <Plus className="w-4 h-4" />
        Add Part
      </Button>
    </div>
  );
}