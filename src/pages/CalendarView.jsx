import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import DayJobsSheet from '@/components/calendar/DayJobsSheet';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const queryClient = useQueryClient();

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-job_date', 1000),
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const jobsByDate = useMemo(() => {
    const map = {};
    jobs.forEach(job => {
      if (!job.job_date) return;
      const key = format(parseISO(job.job_date), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(job);
    });
    return map;
  }, [jobs]);

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const handleDrop = async (e, targetDay) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData('jobId');
    if (!jobId) return;
    const newDate = format(targetDay, 'yyyy-MM-dd');
    await base44.entities.Job.update(jobId, { job_date: newDate });
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  };

  const handleDragOver = (e) => e.preventDefault();

  const getDayDot = (jobs) => {
    if (!jobs?.length) return null;
    const hasOvertime = jobs.some(j => j.is_overtime);
    const hasParts = jobs.some(j => j.status === 'parts_required' || j.status === 'wrong_parts');
    const allDone = jobs.every(j => j.status === 'completed');
    if (hasOvertime) return 'overtime';
    if (hasParts) return 'parts';
    if (allDone) return 'done';
    return 'active';
  };

  const dotColors = {
    overtime: 'bg-purple-500',
    parts: 'bg-amber-500',
    done: 'bg-green-500',
    active: 'bg-primary',
  };

  const selectedDayJobs = selectedDay
    ? jobsByDate[format(selectedDay, 'yyyy-MM-dd')] || []
    : [];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="font-grotesk font-bold text-xl text-foreground">Calendar</h1>
          <p className="text-xs text-muted-foreground">{format(currentDate, 'MMMM yyyy')}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Today
          </button>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pb-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />Overtime</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Parts Issue</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />All Done</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Jobs</span>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1 px-2 gap-0.5 pb-2 overflow-hidden">
        {calDays.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const dayJobs = jobsByDate[key] || [];
          const dot = getDayDot(dayJobs);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const selected = selectedDay && isSameDay(day, selectedDay);

          return (
            <div
              key={key}
              onClick={() => setSelectedDay(isSameDay(day, selectedDay) ? null : day)}
              onDrop={e => handleDrop(e, day)}
              onDragOver={handleDragOver}
              className={cn(
                'flex flex-col items-center justify-start pt-1.5 rounded-xl cursor-pointer transition-all min-h-0',
                selected ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-secondary',
                !isCurrentMonth && 'opacity-30',
              )}
            >
              <span className={cn(
                'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                today ? 'bg-primary text-primary-foreground font-bold' : 'text-foreground',
              )}>
                {format(day, 'd')}
              </span>
              {dot && (
                <span className={cn('w-1.5 h-1.5 rounded-full mt-0.5', dotColors[dot])} />
              )}
              {dayJobs.length > 0 && (
                <span className="text-[10px] text-muted-foreground mt-0.5">{dayJobs.length}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Day detail sheet */}
      <DayJobsSheet
        day={selectedDay}
        jobs={selectedDayJobs}
        onClose={() => setSelectedDay(null)}
        onJobMoved={() => queryClient.invalidateQueries({ queryKey: ['jobs'] })}
      />

      {/* FAB */}
      <Link
        to="/jobs/new"
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors z-30"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}