import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, MessageCircle, BarChart2, ChevronUp, LogOut, Archive, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import OfflineBanner from '@/components/layout/OfflineBanner';

// Bottom nav: 4 items — Home, Jobs, Insights (grouped), WhatsApp
const insightItems = [
  { path: '/calendar', label: 'Calendar' },
  { path: '/monthly', label: 'Monthly' },
  { path: '/ftf', label: 'FTF Report' },
  { path: '/assets', label: 'Asset Library' },
  { path: '/sites', label: 'Sites' },
];

const mainNavItems = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/jobs', label: 'Jobs', icon: Briefcase },
  { path: '/whatsapp', label: 'WhatsApp', icon: MessageCircle },
];

// Full sidebar nav for desktop
const allNavItems = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/jobs', label: 'Jobs', icon: Briefcase },
  { path: '/calendar', label: 'Calendar', icon: BarChart2 },
  { path: '/monthly', label: 'Monthly', icon: BarChart2 },
  { path: '/ftf', label: 'FTF Report', icon: BarChart2 },
  { path: '/assets', label: 'Asset Library', icon: Archive },
  { path: '/sites', label: 'Sites', icon: MapPin },
  { path: '/whatsapp', label: 'WhatsApp', icon: MessageCircle },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [insightsOpen, setInsightsOpen] = useState(false);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isInsightActive = insightItems.some(i => isActive(i.path));

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-row flex-1">
        <aside className="flex flex-col w-60 min-h-screen" style={{ background: '#c0392b' }}>
          {/* Brand */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                <span className="font-grotesk font-black text-sm" style={{ color: '#c0392b' }}>TSG</span>
              </div>
              <div>
                <p className="font-grotesk font-bold text-sm text-white leading-tight">TSG Tracker</p>
                <p className="text-xs text-white/70">Job Management</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {allNavItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive(path)
                    ? 'bg-white text-red-700 shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/15'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-white/20 p-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/15 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <OfflineBanner />
          <Outlet />
        </main>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col flex-1">
        {/* TSG Red top brand bar */}
        <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3" style={{ background: '#c0392b' }}>
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <span className="font-grotesk font-black text-xs" style={{ color: '#c0392b' }}>TSG</span>
          </div>
          <div className="flex-1">
            <p className="font-grotesk font-bold text-white text-sm leading-tight">TSG Tracker</p>
            <p className="text-white/70 text-[10px]">Job Management</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/70 hover:text-white transition-colors p-2"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <main className="flex-1 overflow-auto pb-20">
          <OfflineBanner />
          <Outlet />
        </main>

        {/* Bottom tab bar — 4 items */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-stretch">
          {/* Home */}
          {mainNavItems.slice(0, 2).map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors',
                isActive(path) ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive(path) && 'stroke-[2.5]')} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}

          {/* Insights — expandable */}
          <div className="flex-1 relative flex flex-col items-center justify-center py-2 gap-0.5">
            <button
              onClick={() => setInsightsOpen(o => !o)}
              className={cn(
                'flex flex-col items-center gap-0.5 w-full transition-colors',
                isInsightActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <BarChart2 className={cn('w-5 h-5', isInsightActive && 'stroke-[2.5]')} />
              <span className="text-[10px] font-medium flex items-center gap-0.5">
                Insights <ChevronUp className={cn('w-2.5 h-2.5 transition-transform', insightsOpen ? 'rotate-0' : 'rotate-180')} />
              </span>
            </button>

            {/* Popup menu */}
            {insightsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setInsightsOpen(false)} />
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden w-40">
                  {insightItems.map(({ path, label }) => (
                    <button
                      key={path}
                      onClick={() => { navigate(path); setInsightsOpen(false); }}
                      className={cn(
                        'w-full px-4 py-3 text-sm font-medium text-left transition-colors border-b border-border last:border-0',
                        isActive(path) ? 'text-primary bg-primary/5' : 'text-foreground hover:bg-secondary'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* WhatsApp */}
          <Link
            to="/whatsapp"
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors',
              isActive('/whatsapp') ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <MessageCircle className={cn('w-5 h-5', isActive('/whatsapp') && 'stroke-[2.5]')} />
            <span className="text-[10px] font-medium">WhatsApp</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}