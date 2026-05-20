import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useEffect } from 'react';

/**
 * Fetches jobs scoped by user role:
 * - admin: all jobs
 * - regular user: only their own jobs
 * Subscribes to real-time updates so dashboard stats refresh instantly.
 */
export function useJobs() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();

  // Real-time subscription — invalidate query on any job change
  useEffect(() => {
    if (!user) return;
    const unsubscribe = base44.entities.Job.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['jobs', user.id] });
    });
    return unsubscribe;
  }, [user, queryClient]);

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