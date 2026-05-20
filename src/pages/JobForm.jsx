import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Trash2, Wrench, Clock, CheckCircle2, AlertTriangle, Package, ShoppingCart, WifiOff, Ban } from 'lucide-react';
import { savePendingJob } from '@/lib/offlineDB';
import ImageUploader from '@/components/jobs/ImageUploader';
import AIExtractButton from '@/components/jobs/AIExtractButton';
import PartsManager from '@/components/jobs/PartsManager';
import HistoryEntryManager from '@/components/jobs/HistoryEntryManager';
import TravelTracker from '@/components/jobs/TravelTracker';
import TravelHome from '@/components/jobs/TravelHome';
import SiteAssetPicker from '@/components/jobs/SiteAssetPicker';
import TemplatePicker from '@/components/jobs/TemplatePicker';
import SaveAsTemplateButton from '@/components/jobs/SaveAsTemplateButton';
import { cn } from '@/lib/utils';

const defaultJob = {
  job_number: '', location_name: '', location_number: '', job_date: '',
  start_time: '', finish_time: '', is_overtime: false, status: 'incomplete',
  job_type: 'reactive', category: 'pump', pump_number: '', equipment_id: '', equipment_name: '',
  inventory_type: '', completion_notes: '', personal_notes: '', colleague_name: '',
  image_urls: [], parts: [], history_entries: [], ai_extracted: false, non_conformance_reason: '',
  site_asset_ref: '', site_asset_type: ''
};

const EV_CHARGER_MAKES = [
  'Kempower', 'Alpitronic', 'Tritium', 'Zerova', 'ABB', 'Delta', 'Alfen',
  'Ekoenergetyka', 'Tesla Supercharger', 'Schneider', 'Wallbox', 'Pod Point',
  'EO Charging', 'Other EV',
];

const PUMP_MAKES = [
  'Gilbarco', 'Wayne', 'Tokheim', 'Petrotec', 'Bennett', 'Tatsuno',
  'Scheidt & Bachmann', 'Veeder-Root', 'OPW', 'Franklin Fueling', 'Gauges', 'Other Pump',
];

const NC_REASONS = [
  { value: 'wrong_parts_ordered', label: 'Wrong Parts Ordered' },
  { value: 'wrong_diagnosis', label: 'Wrong Diagnosis' },
  { value: 'third_party_required', label: '3rd Party Required' },
  { value: 'weights_and_measures', label: 'Weights & Measures' },
];

const JOB_TYPES = [
  { value: 'reactive', label: 'Reactive', desc: 'Breakdown / fault call' },
  { value: 'ppm', label: 'PPM', desc: 'Planned maintenance audit' },
  { value: 'vr2', label: 'VR2', desc: 'Vapour recovery' },
  { value: 'other', label: 'Other', desc: '' },
];

const STATUS_OPTIONS = [
  { value: 'completed_first_visit', label: 'Completed (1st Visit)', icon: CheckCircle2, color: 'border-green-300 bg-green-50 text-green-700' },
  { value: 'completed_return_visit', label: 'Completed (Return Visit)', icon: CheckCircle2, color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { value: 'incomplete', label: 'Incomplete', icon: Clock, color: 'border-red-300 bg-red-50 text-red-700' },
  { value: 'needs_parts', label: 'Needs Parts', icon: Package, color: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 'parts_ordered', label: 'Parts Ordered', icon: ShoppingCart, color: 'border-blue-300 bg-blue-50 text-blue-700' },
  { value: 'wrong_parts_supplied', label: 'Wrong Parts Supplied', icon: AlertTriangle, color: 'border-orange-300 bg-orange-50 text-orange-700' },
  { value: 'faulty_parts_supplied', label: 'Faulty Parts Supplied', icon: AlertTriangle, color: 'border-orange-300 bg-orange-50 text-orange-700' },
  { value: 'missing_stock', label: 'Missing Stock / Not Replenished', icon: Package, color: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 'no_access', label: 'No Access', icon: AlertTriangle, color: 'border-slate-300 bg-slate-50 text-slate-700' },
  { value: 'tooling_equipment_issue', label: 'Tooling / Equipment Issue', icon: Wrench, color: 'border-purple-300 bg-purple-50 text-purple-700' },
  { value: 'previous_diagnosis_issue', label: 'Previous Diagnosis Issue', icon: AlertTriangle, color: 'border-orange-300 bg-orange-50 text-orange-700' },
  { value: 'awaiting_others', label: 'Awaiting Others', icon: Clock, color: 'border-sky-300 bg-sky-50 text-sky-700' },
  { value: 'unable_to_complete', label: 'Unable to Complete', icon: AlertTriangle, color: 'border-red-300 bg-red-50 text-red-700' },
  { value: 'non_conformance', label: 'Non-Conformance', icon: AlertTriangle, color: 'border-orange-300 bg-orange-50 text-orange-700' },
];

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
    enabled: !isNew && !!id,
    select: data => data[0],
  });

  // Reset form to blank when creating a new job
  useEffect(() => {
    if (isNew) setForm(defaultJob);
  }, [isNew]);

  const { data: equipmentList = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list('name', 100),
  });

  const { data: siteRecords = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list('name', 200),
  });

  // Find the matching site record to show equipment picker
  const matchedSite = useMemo(() => {
    if (!form.location_number && !form.location_name) return null;
    return siteRecords.find(s =>
      (form.location_number && s.location_number === form.location_number) ||
      (form.location_name && s.name === form.location_name)
    ) || null;
  }, [siteRecords, form.location_number, form.location_name]);

  useEffect(() => {
    if (existing) setForm({ ...defaultJob, ...existing });
  }, [existing]);

  const set = (field, value) => setForm(prev => {
    const updated = { ...prev, [field]: value };
    if (field === 'finish_time') updated.is_overtime = checkOvertime(value);
    return updated;
  });

  const handleEquipmentSelect = (equipId) => {
    if (equipId === '__none__') {
      set('equipment_id', '');
      setForm(prev => ({ ...prev, equipment_id: '', equipment_name: '' }));
      return;
    }
    const eq = equipmentList.find(e => e.id === equipId);
    setForm(prev => ({ ...prev, equipment_id: equipId, equipment_name: eq?.name || '' }));
  };

  const handleExtracted = (data) => {
    setForm(prev => ({ ...prev, ...data }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!navigator.onLine && isNew) {
        // Save to IndexedDB for later sync
        const offline_id = await savePendingJob(form);
        return { offline: true, offline_id };
      }
      return isNew
        ? base44.entities.Job.create(form)
        : base44.entities.Job.update(id, form);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      if (result?.offline) {
        navigate('/jobs');
      } else {
        navigate(isNew ? `/jobs/${result.id}` : `/jobs/${id}`);
      }
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
    <div className="pb-32 max-w-2xl mx-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-grotesk text-lg font-bold flex-1">{isNew ? 'New Job' : 'Edit Job'}</h1>
        <Button
          className="gap-2 h-10 px-5 text-sm font-semibold"
          onClick={() => saveMutation.mutate()}
          disabled={!form.job_number || saveMutation.isPending}
        >
          {!navigator.onLine && isNew ? <WifiOff className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saveMutation.isPending ? 'Saving...' : (!navigator.onLine && isNew ? 'Save Offline' : 'Save')}
        </Button>
      </div>

      <div className="px-4 py-5 space-y-7">

        {/* Template picker */}
        {isNew && (
          <section>
            <TemplatePicker onApply={fields => setForm(prev => ({ ...prev, ...fields }))} />
          </section>
        )}

        {/* Job Type selector — big touch targets */}
        <section>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">Job Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {JOB_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => set('job_type', t.value)}
                className={cn(
                  'rounded-xl border-2 p-3 text-left transition-all',
                  form.job_type === t.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card'
                )}
              >
                <p className="font-semibold text-sm">{t.label}</p>
                {t.desc && <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>}
              </button>
            ))}
          </div>
        </section>

        {/* Core details */}
        <section className="space-y-4">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Job Details</Label>

          <div className="space-y-1.5">
            <Label htmlFor="job_number" className="text-xs text-muted-foreground">Job Number *</Label>
            <Input id="job_number" value={form.job_number} onChange={e => set('job_number', e.target.value)} placeholder="e.g. TSG-12345" className="h-11 text-base" />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Category</Label>
            <div className="grid grid-cols-2 gap-2">
              {[{ value: 'pump', label: 'Pump' }, { value: 'ev', label: 'EV Charger' }].map(c => (
                <button
                  key={c.value}
                  onClick={() => setForm(prev => ({ ...prev, category: c.value, equipment_name: '' }))}
                  className={cn('rounded-xl border-2 p-3 text-left transition-all', form.category === c.value ? 'border-primary bg-primary/10' : 'border-border bg-card')}
                >
                  <p className="font-semibold text-sm">{c.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Equipment make */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Equipment Make</Label>
            <Select value={form.equipment_name || ''} onValueChange={v => set('equipment_name', v)}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Select make..." /></SelectTrigger>
              <SelectContent>
                {(form.category === 'ev' ? EV_CHARGER_MAKES : PUMP_MAKES).map(make => (
                  <SelectItem key={make} value={make}>{make}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Inventory / equipment type */}
          <div className="space-y-1.5">
            <Label htmlFor="inventory_type" className="text-xs text-muted-foreground">Inventory / Equipment Type (from work app)</Label>
            <Input id="inventory_type" value={form.inventory_type || ''} onChange={e => set('inventory_type', e.target.value)} placeholder="e.g. SK700 VR2 MULTILINE" className="h-11" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="location_name" className="text-xs text-muted-foreground">Site Name</Label>
              <Input id="location_name" value={form.location_name} onChange={e => set('location_name', e.target.value)} placeholder="Tesco Hythe" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location_number" className="text-xs text-muted-foreground">Site Code</Label>
              <Input id="location_number" value={form.location_number} onChange={e => set('location_number', e.target.value)} placeholder="148677" className="h-11" />
            </div>
          </div>

          {/* Site asset picker — only shown if the site has equipment logged */}
          {matchedSite && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Site Asset</Label>
              <SiteAssetPicker
                site={matchedSite}
                selectedRef={form.site_asset_ref}
                selectedType={form.site_asset_type}
                onChange={(ref, type) => setForm(prev => ({ ...prev, site_asset_ref: ref, site_asset_type: type }))}
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="job_date" className="text-xs text-muted-foreground">Date</Label>
              <Input id="job_date" type="date" value={form.job_date} onChange={e => set('job_date', e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="start_time" className="text-xs text-muted-foreground">Start</Label>
              <Input id="start_time" type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="finish_time" className="text-xs text-muted-foreground">Finish</Label>
              <Input id="finish_time" type="time" value={form.finish_time} onChange={e => set('finish_time', e.target.value)} className="h-11" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="colleague_name" className="text-xs text-muted-foreground">Colleague</Label>
              <Input id="colleague_name" value={form.colleague_name} onChange={e => set('colleague_name', e.target.value)} placeholder="Name" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pump_number" className="text-xs text-muted-foreground">Pump Number(s)</Label>
              <Input id="pump_number" value={form.pump_number} onChange={e => set('pump_number', e.target.value)} placeholder="e.g. 9 & 10" className="h-11" />
            </div>
          </div>


        </section>

        {/* Status — big tap targets */}
        <section>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">Status</Label>
          <div className="grid grid-cols-1 gap-2">
            {STATUS_OPTIONS.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.value}
                  onClick={() => set('status', s.value)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all',
                    form.status === s.value ? s.color + ' border-current' : 'border-border bg-card'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-semibold text-sm">{s.label}</span>
                </button>
              );
            })}
          </div>

          {form.status === 'non_conformance' && (
            <div className="mt-3 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Non-Conformance Reason</Label>
              <Select value={form.non_conformance_reason || ''} onValueChange={v => set('non_conformance_reason', v)}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select reason..." /></SelectTrigger>
                <SelectContent>
                  {NC_REASONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className={cn(
            'flex items-center gap-3 mt-3 p-3 rounded-xl border-2 transition-all',
            form.is_overtime ? 'border-purple-300 bg-purple-50' : 'border-border bg-card'
          )}>
            <Switch checked={form.is_overtime} onCheckedChange={v => set('is_overtime', v)} id="overtime" />
            <Label htmlFor="overtime" className="text-sm font-semibold cursor-pointer flex-1">
              Overtime <span className="font-normal text-muted-foreground">(after 5:30pm)</span>
            </Label>
            {form.is_overtime && <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">OT</span>}
          </div>
        </section>

        {/* Travel Tracker */}
        <section className="space-y-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Travel</Label>
          <TravelTracker
            onTravelComplete={(result) => {
              // Auto-fill travel duration into personal notes
              const note = `Travel: ${result.startTime} → ${result.endTime} (${Math.round(result.durationMins)}m)`;
              setForm(prev => ({
                ...prev,
                personal_notes: prev.personal_notes
                  ? prev.personal_notes + '\n' + note
                  : note,
              }));
            }}
          />
        </section>

        {/* Travel Home (last job overtime tracker) */}
        <section className="space-y-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Travel Home</Label>
          <TravelHome
            jobId={id}
            onOvertimeConfirmed={({ arrivedTime, isOvertime, overtimeQuarters, overtimeMins }) => {
              if (isOvertime) {
                const note = `Travel home overtime: arrived ${arrivedTime}, ${overtimeQuarters} quarter${overtimeQuarters !== 1 ? 's' : ''} = ${overtimeMins} mins past 17:30.`;
                setForm(prev => ({
                  ...prev,
                  is_overtime: true,
                  personal_notes: prev.personal_notes ? prev.personal_notes + '\n' + note : note,
                }));
              }
            }}
          />
        </section>

        {/* Notes */}
        <section className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes / What was done</Label>
          <Textarea
            id="notes"
            value={form.completion_notes}
            onChange={e => set('completion_notes', e.target.value)}
            placeholder="Describe what was done, findings, outcome..."
            className="resize-none h-28 text-base"
          />
        </section>

        {/* Personal notes */}
        <section className="space-y-1.5">
          <Label htmlFor="personal_notes" className="text-xs font-semibold text-amber-700 uppercase tracking-wide">My Notes</Label>
          <p className="text-xs text-muted-foreground">Private log for challenges, access issues, extra hours — for your reference in management discussions.</p>
          <Textarea
            id="personal_notes"
            value={form.personal_notes}
            onChange={e => set('personal_notes', e.target.value)}
            placeholder="e.g. Site access delayed 45 mins waiting for manager. Had to source alternative parts on the day..."
            className="resize-none h-28 text-base border-amber-200 focus:border-amber-400"
          />
        </section>

        {/* Parts */}
        <section className="space-y-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Parts</Label>
          <PartsManager parts={form.parts || []} onChange={v => set('parts', v)} />
        </section>

        {/* History entries */}
        <section className="space-y-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Previous Visit Notes</Label>
          <p className="text-xs text-muted-foreground">Log notes from previous visits to help track what was done before.</p>
          <HistoryEntryManager entries={form.history_entries || []} onChange={v => set('history_entries', v)} />
        </section>

        {/* Images */}
        <section className="space-y-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Job Sheet Images</Label>
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

        {/* Save as template */}
        <div className="flex justify-center pt-2">
          <SaveAsTemplateButton form={form} />
        </div>

        {/* Delete */}
        {!isNew && (
          <div className="pt-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 h-11"
              onClick={() => { if (confirm('Delete this job?')) deleteMutation.mutate(); }}
            >
              <Trash2 className="w-4 h-4" />
              Delete Job
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}