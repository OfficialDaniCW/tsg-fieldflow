import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import ImageUploader from '@/components/jobs/ImageUploader';
import AIExtractButton from '@/components/jobs/AIExtractButton';
import PartsManager from '@/components/jobs/PartsManager';

const defaultJob = {
  job_number: '', location_name: '', location_number: '', job_date: '',
  start_time: '', finish_time: '', is_overtime: false, status: 'incomplete',
  completion_notes: '', colleague_name: '', image_urls: [], parts: [], ai_extracted: false
};

function checkOvertime(finishTime) {
  if (!finishTime) return false;
  const [h, m] = finishTime.split(':').map(Number);
  return h > 17 || (h === 17 && m >= 30);
}

export default function JobForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new';

  const [form, setForm] = useState(defaultJob);

  const { data: existing } = useQuery({
    queryKey: ['job', id],
    queryFn: () => base44.entities.Job.filter({ id }),
    enabled: !isNew,
    select: data => data[0],
  });

  useEffect(() => {
    if (existing) setForm(existing);
  }, [existing]);

  const set = (field, value) => setForm(prev => {
    const updated = { ...prev, [field]: value };
    if (field === 'finish_time') updated.is_overtime = checkOvertime(value);
    return updated;
  });

  const handleExtracted = (data) => {
    setForm(prev => ({ ...prev, ...data }));
  };

  const saveMutation = useMutation({
    mutationFn: () => isNew
      ? base44.entities.Job.create(form)
      : base44.entities.Job.update(id, form),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      navigate(isNew ? `/jobs/${result.id}` : `/jobs/${id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Job.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      navigate('/jobs');
    },
  });

  return (
    <div className="p-5 md:p-8 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-grotesk text-xl font-bold">{isNew ? 'New Job' : 'Edit Job'}</h1>
      </div>

      {/* Image upload + AI extract */}
      <section className="space-y-3">
        <Label className="text-sm font-semibold">Job Sheet Images</Label>
        <ImageUploader imageUrls={form.image_urls} onChange={v => set('image_urls', v)} />
        {form.image_urls?.length > 0 && (
          <AIExtractButton imageUrls={form.image_urls} onExtracted={handleExtracted} />
        )}
        {form.ai_extracted && (
          <p className="text-xs text-primary bg-primary/10 rounded-lg px-3 py-2">
            ✦ Data was auto-filled from your uploaded images. Please review and correct if needed.
          </p>
        )}
      </section>

      {/* Core details */}
      <section className="space-y-4">
        <Label className="text-sm font-semibold">Job Details</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="job_number" className="text-xs text-muted-foreground">Job Number *</Label>
            <Input id="job_number" value={form.job_number} onChange={e => set('job_number', e.target.value)} placeholder="e.g. TSG-12345" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="job_date" className="text-xs text-muted-foreground">Date</Label>
            <Input id="job_date" type="date" value={form.job_date} onChange={e => set('job_date', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location_name" className="text-xs text-muted-foreground">Location Name</Label>
            <Input id="location_name" value={form.location_name} onChange={e => set('location_name', e.target.value)} placeholder="Site name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location_number" className="text-xs text-muted-foreground">Location Number</Label>
            <Input id="location_number" value={form.location_number} onChange={e => set('location_number', e.target.value)} placeholder="Site code" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="start_time" className="text-xs text-muted-foreground">Start Time</Label>
            <Input id="start_time" type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="finish_time" className="text-xs text-muted-foreground">Finish Time</Label>
            <Input id="finish_time" type="time" value={form.finish_time} onChange={e => set('finish_time', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="colleague_name" className="text-xs text-muted-foreground">Colleague (if any)</Label>
            <Input id="colleague_name" value={form.colleague_name} onChange={e => set('colleague_name', e.target.value)} placeholder="Name of colleague" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="incomplete">Incomplete</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="parts_required">Parts Required</SelectItem>
                <SelectItem value="wrong_parts">Wrong Parts on Site</SelectItem>
                <SelectItem value="parts_ordered">Parts Ordered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <Switch checked={form.is_overtime} onCheckedChange={v => set('is_overtime', v)} id="overtime" />
          <Label htmlFor="overtime" className="text-sm font-medium text-purple-700 cursor-pointer">
            Overtime (finished after 5:30pm)
          </Label>
          {form.is_overtime && <span className="ml-auto text-xs text-purple-600 font-medium">OT ACTIVE</span>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs text-muted-foreground">Notes</Label>
          <Textarea id="notes" value={form.completion_notes} onChange={e => set('completion_notes', e.target.value)} placeholder="Any notes about this job..." className="resize-none h-24" />
        </div>
      </section>

      {/* Parts */}
      <section className="space-y-3">
        <Label className="text-sm font-semibold">Parts</Label>
        <PartsManager parts={form.parts || []} onChange={v => set('parts', v)} />
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
        {!isNew && (
          <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2" onClick={() => deleteMutation.mutate()}>
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button className="gap-2" onClick={() => saveMutation.mutate()} disabled={!form.job_number || saveMutation.isPending}>
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Job'}
          </Button>
        </div>
      </div>
    </div>
  );
}