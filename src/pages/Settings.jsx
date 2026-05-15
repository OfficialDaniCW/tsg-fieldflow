import { useState, useEffect } from 'react';
import { Home, Save, User, Bell, MapPin, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const SETTINGS_KEY = 'tsg_user_settings';

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
  catch { return {}; }
}

function saveSettings(data) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
}

export default function Settings() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState(() => loadSettings());

  function set(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="p-5 md:p-8 max-w-lg mx-auto space-y-8">
      <div>
        <h1 className="font-grotesk text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Preferences & personal details</p>
      </div>

      {/* Profile */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Profile</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <p className="text-sm font-semibold">{user?.full_name || 'Engineer'}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <p className="text-xs text-muted-foreground capitalize">Role: {user?.role}</p>
        </div>
      </section>

      {/* Home address */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Home Address</p>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Used to calculate travel home duration and overtime. Required for accurate OT reporting.
        </p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Street Address</Label>
            <Input
              value={settings.home_street || ''}
              onChange={e => set('home_street', e.target.value)}
              placeholder="e.g. 12 Main Street"
              className="h-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Town / City</Label>
              <Input
                value={settings.home_city || ''}
                onChange={e => set('home_city', e.target.value)}
                placeholder="e.g. Southampton"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Postcode</Label>
              <Input
                value={settings.home_postcode || ''}
                onChange={e => set('home_postcode', e.target.value)}
                placeholder="e.g. SO14 1AA"
                className="h-11"
              />
            </div>
          </div>
          {settings.home_postcode && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Home: {[settings.home_street, settings.home_city, settings.home_postcode].filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>
      </section>

      {/* Default working hours */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Working Hours</p>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">Standard shift for overtime calculations.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Shift Start</Label>
            <Input
              type="time"
              value={settings.shift_start || '08:00'}
              onChange={e => set('shift_start', e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Shift End (OT after)</Label>
            <Input
              type="time"
              value={settings.shift_end || '17:30'}
              onChange={e => set('shift_end', e.target.value)}
              className="h-11"
            />
          </div>
        </div>
        <div className="bg-secondary/50 rounded-xl px-4 py-3 text-xs text-muted-foreground">
          Core hours: <strong>08:00 – 17:00</strong> · Travel buffer: <strong>17:00 – 17:30</strong> · Overtime: <strong>after 17:30</strong> (in 15-min quarters)
        </div>
      </section>

      {/* Engineer name override */}
      <section className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Report Name</p>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Name on PDF timesheets</Label>
          <Input
            value={settings.report_name || user?.full_name || ''}
            onChange={e => set('report_name', e.target.value)}
            placeholder="Your full name"
            className="h-11"
          />
        </div>
      </section>

      <Button onClick={handleSave} className="w-full gap-2 h-12 text-base font-semibold">
        {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
        {saved ? 'Saved!' : 'Save Settings'}
      </Button>


    </div>
  );
}