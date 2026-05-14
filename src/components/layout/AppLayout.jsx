import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Briefcase, BarChart3, MessageCircle, CalendarDays, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/jobs', label: 'Jobs', icon: Briefcase },
  { path: '/calendar', label: 'Calendar', icon: CalendarDays },
  { path: '/ftf', label: 'FTF', icon: TrendingUp },
  { path: '/monthly', label: 'Monthly', icon: BarChart3 },
  { path: '/whatsapp', label: 'WhatsApp', icon: MessageCircle },
];

export default function AppLayout() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-row flex-1">
        <aside className="flex flex-col w-60 bg-card border-r border-border min-h-screen">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="font-grotesk font-bold text-sm text-foreground leading-tight">TSG Tracker</p>
                <p className="text-xs text-muted-foreground">Job Management</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive(path)
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile: full screen content + bottom nav */}
      <div className="md:hidden flex flex-col flex-1">
        {/* Page header brand bar */}
        <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Briefcase className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-grotesk font-semibold text-sm text-foreground">TSG Tracker</span>
        </div>

        {/* Main content — padded for bottom nav */}
        <main className="flex-1 overflow-auto pb-20">
          <Outlet />
        </main>

        {/* Bottom tab bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-stretch">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors',
                isActive(path)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive(path) && 'stroke-[2.5]')} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}