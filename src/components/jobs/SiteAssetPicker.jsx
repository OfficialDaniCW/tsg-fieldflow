import { Fuel, Layers, Zap, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Shows site equipment as selectable chips so the engineer can link the job to a specific asset
export default function SiteAssetPicker({ site, selectedRef, selectedType, onChange }) {
  const pumps = site?.pumps || [];
  const tanks = site?.tanks || [];
  const evs = site?.ev_chargers || [];

  if (!pumps.length && !tanks.length && !evs.length) return null;

  const handleSelect = (ref, type) => {
    if (selectedRef === ref) {
      onChange('', ''); // deselect
    } else {
      onChange(ref, type);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Link to a specific asset at this site (optional)</p>
        {selectedRef && (
          <button onClick={() => onChange('', '')} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {pumps.map((p, i) => {
          const ref = `Pump ${p.pump_number || (i + 1)}`;
          const isSelected = selectedRef === ref;
          return (
            <button
              key={`pump-${i}`}
              type="button"
              onClick={() => handleSelect(ref, 'pump')}
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all',
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              )}
            >
              <Fuel className="w-3 h-3" />
              {ref}
              {p.make && <span className="opacity-70">· {p.make}</span>}
            </button>
          );
        })}
        {tanks.map((t, i) => {
          const ref = t.tank_number || `Tank ${i + 1}`;
          const gaugeLabel = t.gauge_make ? ` Gauge` : '';
          const displayRef = gaugeLabel ? `${ref}${gaugeLabel}` : ref;
          const isSelected = selectedRef === displayRef || selectedRef === ref;

          return (
            <button
              key={`tank-${i}`}
              type="button"
              onClick={() => handleSelect(ref, 'tank')}
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all',
                isSelected
                  ? 'bg-yellow-500 text-white border-yellow-500'
                  : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
              )}
            >
              <Layers className="w-3 h-3" />
              {ref}
              {t.product && <span className="opacity-70">· {t.product}</span>}
            </button>
          );
        })}
        {evs.map((e, i) => {
          const ref = e.unit_number || `EV ${i + 1}`;
          const isSelected = selectedRef === ref;
          return (
            <button
              key={`ev-${i}`}
              type="button"
              onClick={() => handleSelect(ref, 'ev_charger')}
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all',
                isSelected
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
              )}
            >
              <Zap className="w-3 h-3" />
              {ref}
              {e.make && <span className="opacity-70">· {e.make}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}