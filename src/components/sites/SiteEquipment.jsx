import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Fuel, Zap, Droplets, Plus, Pencil, Trash2, Save, X, ChevronDown, ChevronUp, Hash, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const PUMP_TYPES = [
  { value: 'mono', label: 'Mono (single-sided)' },
  { value: 'dual', label: 'Dual (double-sided)' },
  { value: 'triple', label: 'Triple' },
  { value: 'adblue', label: 'AdBlue' },
  { value: 'lpg', label: 'LPG' },
  { value: 'other', label: 'Other' },
];

const TANK_PRODUCTS = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'unleaded', label: 'Unleaded' },
  { value: 'super_unleaded', label: 'Super Unleaded' },
  { value: 'adblue', label: 'AdBlue' },
  { value: 'lpg', label: 'LPG' },
  { value: 'other', label: 'Other' },
];

const EV_TYPES = [
  { value: 'dc_fast', label: 'DC Fast' },
  { value: 'ac_slow', label: 'AC Slow' },
  { value: 'rapid', label: 'Rapid' },
  { value: 'ultra_rapid', label: 'Ultra Rapid' },
];

const PUMP_MAKES = ['Gilbarco', 'Wayne', 'Tokheim', 'Petrotec', 'Bennett', 'Tatsuno', 'Scheidt & Bachmann', 'OPW', 'Other'];
const EV_MAKES = ['Kempower', 'Alpitronic', 'Tritium', 'Zerova', 'ABB', 'Delta', 'Alfen', 'Pod Point', 'EO Charging', 'Other'];

const PUMP_TYPE_COLORS = {
  mono:   'bg-blue-50 text-blue-700 border-blue-200',
  dual:   'bg-green-50 text-green-700 border-green-200',
  triple: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  adblue: 'bg-sky-50 text-sky-700 border-sky-200',
  lpg:    'bg-purple-50 text-purple-700 border-purple-200',
  other:  'bg-muted text-muted-foreground border-border',
};

const PRODUCT_COLORS = {
  diesel:         'bg-yellow-50 text-yellow-700 border-yellow-200',
  unleaded:       'bg-green-50 text-green-700 border-green-200',
  super_unleaded: 'bg-red-50 text-red-700 border-red-200',
  adblue:         'bg-sky-50 text-sky-700 border-sky-200',
  lpg:            'bg-purple-50 text-purple-700 border-purple-200',
  other:          'bg-muted text-muted-foreground border-border',
};

function EmptyForm({ onAdd, fields, renderForm }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border-2 border-dashed border-border rounded-xl py-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> Add
      </button>
    );
  }
  return renderForm({ onSave: (item) => { onAdd(item); setOpen(false); }, onCancel: () => setOpen(false) });
}

function PumpForm({ pump = {}, onSave, onCancel }) {
  const [f, setF] = useState({ pump_number: '', make: '', model: '', type: 'dual', asset_number: '', serial_number: '', notes: '', ...pump });
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Pump No.</Label>
          <Input value={f.pump_number} onChange={e => setF({ ...f, pump_number: e.target.value })} placeholder="e.g. 1, 3 & 4" className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select value={f.type} onValueChange={v => setF({ ...f, type: v })}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{PUMP_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Make</Label>
          <Select value={f.make} onValueChange={v => setF({ ...f, make: v })}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>{PUMP_MAKES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Model</Label>
          <Input value={f.model} onChange={e => setF({ ...f, model: e.target.value })} placeholder="e.g. SK700" className="h-9" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Asset No.</Label>
          <Input value={f.asset_number} onChange={e => setF({ ...f, asset_number: e.target.value })} placeholder="Asset #" className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Serial No.</Label>
          <Input value={f.serial_number} onChange={e => setF({ ...f, serial_number: e.target.value })} placeholder="Serial #" className="h-9" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Notes</Label>
        <Input value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} placeholder="e.g. Feeds grades 1-4" className="h-9" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}><X className="w-4 h-4" /></Button>
        <Button size="sm" onClick={() => onSave(f)} className="gap-1"><Save className="w-4 h-4" />Save</Button>
      </div>
    </div>
  );
}

function TankForm({ tank = {}, onSave, onCancel }) {
  const [f, setF] = useState({ tank_number: '', product: 'diesel', capacity_litres: '', asset_number: '', serial_number: '', gauge_make: '', gauge_model: '', notes: '', ...tank });
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Tank No.</Label>
          <Input value={f.tank_number} onChange={e => setF({ ...f, tank_number: e.target.value })} placeholder="e.g. Tank 1" className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Product</Label>
          <Select value={f.product} onValueChange={v => setF({ ...f, product: v })}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{TANK_PRODUCTS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Capacity (L)</Label>
          <Input type="number" value={f.capacity_litres} onChange={e => setF({ ...f, capacity_litres: e.target.value })} placeholder="e.g. 30000" className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Asset No.</Label>
          <Input value={f.asset_number} onChange={e => setF({ ...f, asset_number: e.target.value })} placeholder="Asset #" className="h-9" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Serial No.</Label>
          <Input value={f.serial_number} onChange={e => setF({ ...f, serial_number: e.target.value })} placeholder="Serial #" className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Gauge Make</Label>
          <Input value={f.gauge_make} onChange={e => setF({ ...f, gauge_make: e.target.value })} placeholder="e.g. Veeder-Root" className="h-9" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Notes</Label>
        <Input value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} placeholder="Additional notes" className="h-9" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}><X className="w-4 h-4" /></Button>
        <Button size="sm" onClick={() => onSave(f)} className="gap-1"><Save className="w-4 h-4" />Save</Button>
      </div>
    </div>
  );
}

function EVForm({ ev = {}, onSave, onCancel }) {
  const [f, setF] = useState({ unit_number: '', make: '', model: '', type: 'dc_fast', power_kw: '', asset_number: '', serial_number: '', notes: '', ...ev });
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Unit No.</Label>
          <Input value={f.unit_number} onChange={e => setF({ ...f, unit_number: e.target.value })} placeholder="e.g. EV-1" className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select value={f.type} onValueChange={v => setF({ ...f, type: v })}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{EV_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Make</Label>
          <Select value={f.make} onValueChange={v => setF({ ...f, make: v })}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>{EV_MAKES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Model</Label>
          <Input value={f.model} onChange={e => setF({ ...f, model: e.target.value })} placeholder="Model name" className="h-9" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Power (kW)</Label>
          <Input type="number" value={f.power_kw} onChange={e => setF({ ...f, power_kw: e.target.value })} placeholder="e.g. 150" className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Asset No.</Label>
          <Input value={f.asset_number} onChange={e => setF({ ...f, asset_number: e.target.value })} placeholder="Asset #" className="h-9" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Serial No.</Label>
        <Input value={f.serial_number} onChange={e => setF({ ...f, serial_number: e.target.value })} placeholder="Serial #" className="h-9" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}><X className="w-4 h-4" /></Button>
        <Button size="sm" onClick={() => onSave(f)} className="gap-1"><Save className="w-4 h-4" />Save</Button>
      </div>
    </div>
  );
}

function EquipmentSection({ title, icon: Icon, color, items, onAdd, onDelete, renderCard, renderForm }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editIdx, setEditIdx] = useState(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 ${color}`}>
          <Icon className="w-3.5 h-3.5" /> {title} <span className="ml-1 bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-xs font-normal">{items.length}</span>
        </p>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          editIdx === idx
            ? <div key={idx}>{renderForm({ item, onSave: (updated) => { onAdd(updated, idx); setEditIdx(null); }, onCancel: () => setEditIdx(null) })}</div>
            : (
              <div key={idx} className="relative group">
                {renderCard(item)}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditIdx(idx)} className="p-1.5 rounded-lg bg-background border border-border hover:bg-secondary">
                    <Pencil className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <button onClick={() => onDelete(idx)} className="p-1.5 rounded-lg bg-background border border-border hover:bg-destructive/10">
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              </div>
            )
        ))}
        {addOpen
          ? renderForm({ onSave: (item) => { onAdd(item); setAddOpen(false); }, onCancel: () => setAddOpen(false) })
          : (
            <button
              onClick={() => setAddOpen(true)}
              className="w-full border-2 border-dashed border-border rounded-xl py-2.5 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add {title.replace(/s$/, '')}
            </button>
          )
        }
      </div>
    </div>
  );
}

export default function SiteEquipment({ site, siteRecordId }) {
  const queryClient = useQueryClient();

  const pumps = site.pumps || [];
  const tanks = site.tanks || [];
  const evs = site.ev_chargers || [];

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (siteRecordId) {
        return base44.entities.Site.update(siteRecordId, data);
      }
      return base44.entities.Site.create({ name: site.name, location_number: site.location_number, ...data });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sites'] }),
  });

  const updateField = (field, arr) => saveMutation.mutate({ ...site, [field]: arr });

  const addOrUpdate = (field, arr, item, idx) => {
    const next = [...arr];
    if (idx !== undefined) next[idx] = item; else next.push(item);
    updateField(field, next);
  };

  const remove = (field, arr, idx) => {
    updateField(field, arr.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">

      {/* Overview chips */}
      {(pumps.length > 0 || tanks.length > 0 || evs.length > 0) && (
        <div className="flex gap-2 flex-wrap">
          {pumps.length > 0 && (
            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5" />{pumps.length} Pump{pumps.length !== 1 ? 's' : ''}
              {pumps.filter(p => p.type === 'adblue').length > 0 && (
                <span className="ml-1 bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full text-xs">+AdBlue</span>
              )}
            </span>
          )}
          {tanks.length > 0 && (
            <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />{tanks.length} Tank{tanks.length !== 1 ? 's' : ''}
            </span>
          )}
          {evs.length > 0 && (
            <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />{evs.length} EV Charger{evs.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Pumps */}
      <EquipmentSection
        title="Pumps"
        icon={Fuel}
        color="text-blue-700"
        items={pumps}
        onAdd={(item, idx) => addOrUpdate('pumps', pumps, item, idx)}
        onDelete={(idx) => remove('pumps', pumps, idx)}
        renderCard={(p) => (
          <div className="bg-card border border-border rounded-xl p-4 pr-16">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Fuel className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm">
                    {p.pump_number ? `Pump ${p.pump_number}` : 'Pump'}
                  </span>
                  {p.type && (
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', PUMP_TYPE_COLORS[p.type] || PUMP_TYPE_COLORS.other)}>
                      {PUMP_TYPES.find(t => t.value === p.type)?.label || p.type}
                    </span>
                  )}
                </div>
                {(p.make || p.model) && (
                  <p className="text-sm text-foreground">{[p.make, p.model].filter(Boolean).join(' ')}</p>
                )}
                <div className="flex gap-3 mt-1.5 flex-wrap">
                  {p.asset_number && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Hash className="w-3 h-3" />Asset: {p.asset_number}
                    </span>
                  )}
                  {p.serial_number && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Hash className="w-3 h-3" />Serial: {p.serial_number}
                    </span>
                  )}
                </div>
                {p.notes && <p className="text-xs text-muted-foreground mt-1 italic">{p.notes}</p>}
              </div>
            </div>
          </div>
        )}
        renderForm={({ item, onSave, onCancel }) => <PumpForm pump={item} onSave={onSave} onCancel={onCancel} />}
      />

      {/* Tanks */}
      <EquipmentSection
        title="Tanks"
        icon={Layers}
        color="text-yellow-700"
        items={tanks}
        onAdd={(item, idx) => addOrUpdate('tanks', tanks, item, idx)}
        onDelete={(idx) => remove('tanks', tanks, idx)}
        renderCard={(t) => (
          <div className="bg-card border border-border rounded-xl p-4 pr-16">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-yellow-50 flex items-center justify-center flex-shrink-0">
                <Layers className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm">{t.tank_number || 'Tank'}</span>
                  {t.product && (
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', PRODUCT_COLORS[t.product] || PRODUCT_COLORS.other)}>
                      {TANK_PRODUCTS.find(p => p.value === t.product)?.label || t.product}
                    </span>
                  )}
                  {t.capacity_litres && (
                    <span className="text-xs text-muted-foreground">{Number(t.capacity_litres).toLocaleString()}L</span>
                  )}
                </div>
                {(t.gauge_make || t.gauge_model) && (
                  <p className="text-sm text-foreground">Gauge: {[t.gauge_make, t.gauge_model].filter(Boolean).join(' ')}</p>
                )}
                <div className="flex gap-3 mt-1.5 flex-wrap">
                  {t.asset_number && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Hash className="w-3 h-3" />Asset: {t.asset_number}
                    </span>
                  )}
                  {t.serial_number && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Hash className="w-3 h-3" />Serial: {t.serial_number}
                    </span>
                  )}
                </div>
                {t.notes && <p className="text-xs text-muted-foreground mt-1 italic">{t.notes}</p>}
              </div>
            </div>
          </div>
        )}
        renderForm={({ item, onSave, onCancel }) => <TankForm tank={item} onSave={onSave} onCancel={onCancel} />}
      />

      {/* EV Chargers */}
      <EquipmentSection
        title="EV Chargers"
        icon={Zap}
        color="text-green-700"
        items={evs}
        onAdd={(item, idx) => addOrUpdate('ev_chargers', evs, item, idx)}
        onDelete={(idx) => remove('ev_chargers', evs, idx)}
        renderCard={(e) => (
          <div className="bg-card border border-border rounded-xl p-4 pr-16">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm">{e.unit_number || 'Charger'}</span>
                  {e.type && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">
                      {EV_TYPES.find(t => t.value === e.type)?.label || e.type}
                    </span>
                  )}
                  {e.power_kw && <span className="text-xs text-muted-foreground">{e.power_kw}kW</span>}
                </div>
                {(e.make || e.model) && (
                  <p className="text-sm text-foreground">{[e.make, e.model].filter(Boolean).join(' ')}</p>
                )}
                <div className="flex gap-3 mt-1.5 flex-wrap">
                  {e.asset_number && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Hash className="w-3 h-3" />Asset: {e.asset_number}
                    </span>
                  )}
                  {e.serial_number && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Hash className="w-3 h-3" />Serial: {e.serial_number}
                    </span>
                  )}
                </div>
                {e.notes && <p className="text-xs text-muted-foreground mt-1 italic">{e.notes}</p>}
              </div>
            </div>
          </div>
        )}
        renderForm={({ item, onSave, onCancel }) => <EVForm ev={item} onSave={onSave} onCancel={onCancel} />}
      />
    </div>
  );
}