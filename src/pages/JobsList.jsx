import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import JobCard from '@/components/jobs/JobCard';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'incomplete', label: 'Incomplete' },
  { value: 'completed', label: 'Completed' },
  { value: 'parts_required', label: 'Parts Required' },
  { value: 'non_conformance', label: 'Non-Conformance' },
  { value: 'parts_ordered', label: 'Parts Ordered' },
];

export default function JobsList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [overtimeOnly, setOvertimeOnly] = useState(false);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-job_date', 1000),
  });

  const filtered = jobs.filter(job => {
    const matchSearch = !search ||
      job.job_number?.toLowerCase().includes(search.toLowerCase()) ||
      job.location_name?.toLowerCase().includes(search.toLowerCase()) ||
      job.location_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchOT = !overtimeOnly || job.is_overtime;
    return matchSearch && matchStatus && matchOT;
  });

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-grotesk text-2xl font-bold">All Jobs</h1>
        <Link to="/jobs/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Job
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search job number, location..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={overtimeOnly ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5 whitespace-nowrap"
          onClick={() => setOvertimeOnly(!overtimeOnly)}
        >
          OT Only
        </Button>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">{jobs.length === 0 ? 'No jobs yet.' : 'No results match your filters.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(job => <JobCard key={job.id} job={job} />)}
        </div>
      )}
    </div>
  );
}