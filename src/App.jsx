import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import JobsList from '@/pages/JobsList';
import JobForm from '@/pages/JobForm';
import JobDetail from '@/pages/JobDetail';
import MonthlyView from '@/pages/MonthlyView';
import WhatsAppAgent from '@/pages/WhatsAppAgent';
import CalendarView from '@/pages/CalendarView';
import FTFReport from '@/pages/FTFReport';
import AssetLibrary from '@/pages/AssetLibrary';
import AssetDetail from '@/pages/AssetDetail';
import Sites from '@/pages/Sites.jsx';
import Timesheet from '@/pages/Timesheet';
import Settings from '@/pages/Settings';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/jobs" element={<JobsList />} />
        <Route path="/jobs/new" element={<JobForm />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/jobs/:id/edit" element={<JobForm />} />
        <Route path="/monthly" element={<MonthlyView />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/ftf" element={<FTFReport />} />
        <Route path="/whatsapp" element={<WhatsAppAgent />} />
        <Route path="/assets" element={<AssetLibrary />} />
        <Route path="/assets/:id" element={<AssetDetail />} />
        <Route path="/sites" element={<Sites />} />
        <Route path="/timesheet" element={<Timesheet />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App