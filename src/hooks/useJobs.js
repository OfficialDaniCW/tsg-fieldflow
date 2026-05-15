import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

/**
 * Fetches jobs scoped by user role:
 * - admin: all jobs
 * - regular user: only their own jobs
 */
export function useJobs() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return useQuery({
    queryKey: ['jobs', user?.id],
    queryFn: async () => {
      if (isAdmin) {
        return base44.entities.Job.list('-job_date', 1000);
      } else {
        return base44.entities.Job.filter({ created_by: user?.email }, '-job_date', 1000);
      }
    },
    enabled: !!user,
  });
}