import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import JobCard from '@/components/jobs/JobCard';
import { useJobs } from '@/hooks/useJobs';
import { useAuth } from '@/lib/AuthContext';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'completed_first_visit', label: 'Completed (1st Visit)' },
  { value: 'completed_return_visit', label: 'Completed (Return Visit)' },
  { value: 'incomplete', label: 'Incomplete' },
  { value: 'needs_parts', label: 'Needs Parts' },
  { value: 'parts_ordered', label: 'Parts Ordered' },
  { value: 'wrong_parts_supplied', label: 'Wrong Parts Supplied' },
  { value: 'faulty_parts_supplied', label: 'Faulty Parts Supplied' },
  { value: 'missing_stock', label: 'Missing Stock' },
  { value: 'no_access', label: 'No Access' },
  { value: 'tooling_equipment_issue', label: 'Tooling / Equipment Issue' },
  { value: 'previous_diagnosis_issue', label: 'Previous Diagnosis Issue' },
  { value: 'awaiting_others', label: 'Awaiting Others' },
  { value: 'unable_to_complete', label: 'Unable to Complete' },
  { value: 'non_conformance', label: 'Non-Conformance' },
];

function exportCSV(jobs) {
  const headers = ['Job Number', 'Date', 'Site Name', 'Site Code', 'Job Type', 'Equipment', 'Pump No', 'Status', 'Start', 'Finish', 'Overtime', 'Colleague', 'Notes'];
  const rows = jobs.map(j => [
    j.job_number, j.job_date, j.location_name, j.location_number, j.job_type,
    j.equipment_name, j.pump_number, j.status, j.start_time, j.finish_time,
    j.is_overtime ? 'Yes' : 'No', j.colleague_name,
    (j.completion_notes || '').replace(/\n/g, ' ')
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `jobs-export-${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export default function JobsList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [overtimeOnly, setOvertimeOnly] = useState(false);

  const { data: jobs = [], isLoading } = useJobs();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportCSV(filtered)}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Link to="/jobs/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Job
            </Button>
          </Link>
        </div>
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
          {filtered.map(job => <JobCard key={job.id} job={job} showCreatedBy={isAdmin} />)}
        </div>
      )}
    </div>
  );
}