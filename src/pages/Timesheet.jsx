import { useState, useMemo } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { FileText, Clock, Briefcase, Car, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useJobs } from '@/hooks/useJobs';
import StatusBadge from '@/components/jobs/StatusBadge';
import { jsPDF } from 'jspdf';

function parseHHMM(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function diffMins(start, finish) {
  const s = parseHHMM(start);
  const f = parseHHMM(finish);
  if (s == null || f == null) return 0;
  return Math.max(0, f - s);
}

function fmtMins(mins) {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getTravelSessions(dateStr) {
  try {
    const all = JSON.parse(localStorage.getItem('tsg_travel_sessions') || '[]');
    return all.filter(s => s.date === dateStr);
  } catch { return []; }
}

function getTravelHome(dateStr) {
  try {
    const th = JSON.parse(localStorage.getItem('tsg_travel_home') || '{}');
    // Only return if it was for today (we don't persist date on travelHome, so match by presence)
    return th.arrivedTime ? th : null;
  } catch { return null; }
}

export default function Timesheet() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const { data: allJobs = [] } = useJobs();

  const dayJobs = useMemo(() =>
    allJobs
      .filter(j => j.job_date === selectedDate)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')),
    [allJobs, selectedDate]
  );

  const travelSessions = useMemo(() => getTravelSessions(selectedDate), [selectedDate]);
  const travelHome = selectedDate === today ? getTravelHome(selectedDate) : null;

  const totalJobMins = useMemo(() =>
    dayJobs.reduce((sum, j) => sum + diffMins(j.start_time, j.finish_time), 0),
    [dayJobs]
  );

  const totalTravelMins = useMemo(() =>
    travelSessions.reduce((sum, s) => sum + (s.durationMins || 0), 0),
    [travelSessions]
  );

  const firstStart = dayJobs[0]?.start_time || null;
  const lastFinish = [...dayJobs].reverse().find(j => j.finish_time)?.finish_time || null;
  const totalDayMins = diffMins(firstStart, lastFinish);
  const overtimeJobs = dayJobs.filter(j => j.is_overtime);

  function generatePDF() {
    const doc = new jsPDF();
    const dateLabel = isValid(parseISO(selectedDate))
      ? format(parseISO(selectedDate), 'EEEE, d MMMM yyyy')
      : selectedDate;
    const engineerName = 'TSG Field Engineer';

    // Header
    doc.setFillColor(192, 57, 43);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TSG JOB TIMESHEET', 14, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Engineer: ${engineerName}`, 14, 21);
    doc.text(`Date: ${dateLabel}`, 140, 21);

    doc.setTextColor(30, 30, 30);
    let y = 38;

    // Summary bar
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, y, 182, 22, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('DAY SUMMARY', 18, y + 7);
    doc.setFont('helvetica', 'normal');
    const summaryItems = [
      `Jobs: ${dayJobs.length}`,
      `First start: ${firstStart || '—'}`,
      `Last finish: ${lastFinish || '—'}`,
      `On-site: ${fmtMins(totalJobMins)}`,
      `Travel: ${fmtMins(totalTravelMins)}`,
      `Overtime: ${overtimeJobs.length > 0 ? 'YES' : 'None'}`,
    ];
    doc.text(summaryItems.join('    '), 18, y + 15);
    y += 32;

    // Jobs table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('JOBS', 14, y);
    y += 5;

    // Table header
    doc.setFillColor(220, 220, 220);
    doc.rect(14, y, 182, 7, 'F');
    doc.setFontSize(8);
    doc.text('Job #', 16, y + 5);
    doc.text('Location', 40, y + 5);
    doc.text('Start', 110, y + 5);
    doc.text('Finish', 130, y + 5);
    doc.text('Duration', 155, y + 5);
    doc.text('Status', 175, y + 5);
    y += 8;

    dayJobs.forEach((job, i) => {
      if (y > 260) { doc.addPage(); y = 20; }
      if (i % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(14, y - 1, 182, 8, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(String(job.job_number || '—').slice(0, 12), 16, y + 5);
      doc.text(String(job.location_name || '—').slice(0, 28), 40, y + 5);
      doc.text(job.start_time || '—', 110, y + 5);
      doc.text(job.finish_time || '—', 130, y + 5);
      const d = diffMins(job.start_time, job.finish_time);
      doc.text(d ? fmtMins(d) : '—', 155, y + 5);
      doc.text((job.status || '').replace(/_/g, ' ').slice(0, 16), 175, y + 5);
      y += 8;

      // Completion notes
      if (job.completion_notes) {
        if (y > 265) { doc.addPage(); y = 20; }
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(7);
        const noteLines = doc.splitTextToSize(`  Notes: ${job.completion_notes}`, 178);
        noteLines.slice(0, 3).forEach(line => {
          doc.text(line, 16, y + 4);
          y += 5;
        });
        doc.setTextColor(30, 30, 30);
      }
    });

    y += 6;

    // Travel sessions
    if (travelSessions.length > 0) {
      if (y > 245) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('TRAVEL SESSIONS (between jobs)', 14, y);
      y += 5;
      doc.setFillColor(220, 220, 220);
      doc.rect(14, y, 182, 7, 'F');
      doc.setFontSize(8);
      doc.text('Start', 16, y + 5);
      doc.text('End', 60, y + 5);
      doc.text('Duration', 100, y + 5);
      y += 8;
      travelSessions.forEach(s => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(s.startTime || '—', 16, y + 5);
        doc.text(s.endTime || '—', 60, y + 5);
        doc.text(fmtMins(s.durationMins), 100, y + 5);
        y += 8;
      });
      y += 4;
    }

    // Travel home / overtime
    if (travelHome) {
      if (y > 255) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('TRAVEL HOME', 14, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Left last job: ${travelHome.startTime || '—'}    Arrived home: ${travelHome.arrivedTime || '—'}`, 14, y);
      y += 6;
      if (travelHome.isOvertime) {
        doc.setTextColor(120, 0, 200);
        doc.setFont('helvetica', 'bold');
        doc.text(`OVERTIME: ${travelHome.overtimeQuarters} quarter(s) = ${(travelHome.overtimeQuarters || 0) * 15} mins past 17:30`, 14, y);
        doc.setTextColor(30, 30, 30);
        y += 8;
      }
    }

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated: ${new Date().toLocaleString('en-GB')} · TSG Tracker`, 14, 287);

    doc.save(`timesheet-${selectedDate}.pdf`);
  }

  const dateLabel = isValid(parseISO(selectedDate))
    ? format(parseISO(selectedDate), 'EEEE, d MMMM yyyy')
    : selectedDate;

  return (
    <div className="p-5 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-grotesk text-2xl font-bold">Timesheet</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Daily job & travel summary</p>
        </div>
        <Button onClick={generatePDF} className="gap-2 flex-shrink-0" disabled={dayJobs.length === 0}>
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Date picker */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Select Date</Label>
        <Input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="h-11 text-base max-w-xs"
        />
      </div>

      {dayJobs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No jobs on {dateLabel}</p>
          <p className="text-xs mt-1">Select a different date or add jobs first.</p>
        </div>
      ) : (
        <>
          {/* Day summary strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Briefcase className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold font-grotesk">{dayJobs.length}</p>
              <p className="text-xs text-muted-foreground">Jobs</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Clock className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-xl font-bold font-grotesk">{fmtMins(totalJobMins)}</p>
              <p className="text-xs text-muted-foreground">On-site</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Car className="w-4 h-4 text-green-500 mx-auto mb-1" />
              <p className="text-xl font-bold font-grotesk">{fmtMins(totalTravelMins) || '—'}</p>
              <p className="text-xs text-muted-foreground">Travel</p>
            </div>
          </div>

          {/* Overtime banner */}
          {overtimeJobs.length > 0 && (
            <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-purple-700">
                {overtimeJobs.length} job{overtimeJobs.length > 1 ? 's' : ''} flagged as overtime
              </p>
            </div>
          )}

          {/* Jobs */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Jobs — {dateLabel}</p>
            <div className="space-y-3">
              {dayJobs.map(job => (
                <JobTimesheetRow key={job.id} job={job} />
              ))}
            </div>
          </div>

          {/* Travel sessions */}
          {travelSessions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Between-Job Travel</p>
              <div className="bg-card border border-border rounded-xl divide-y divide-border">
                {travelSessions.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Car className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm flex-1">{s.startTime} → {s.endTime}</span>
                    <span className="text-sm font-semibold text-muted-foreground">{fmtMins(s.durationMins)}</span>
                  </div>
                ))}
                <div className="flex items-center gap-3 px-4 py-3 bg-secondary/30">
                  <span className="text-xs font-semibold text-muted-foreground flex-1">Total travel</span>
                  <span className="text-sm font-bold">{fmtMins(totalTravelMins)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Travel home */}
          {travelHome && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Travel Home</p>
              <div className={`rounded-xl border-2 p-4 ${travelHome.isOvertime ? 'border-purple-200 bg-purple-50' : 'border-green-200 bg-green-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{travelHome.startTime || '—'} → {travelHome.arrivedTime}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Left last job → arrived home</p>
                  </div>
                  {travelHome.isOvertime ? (
                    <div className="text-right">
                      <p className="text-sm font-bold text-purple-700">+{(travelHome.overtimeQuarters || 0) * 15} mins OT</p>
                      <p className="text-xs text-purple-500">{travelHome.overtimeQuarters} quarter{travelHome.overtimeQuarters !== 1 ? 's' : ''}</p>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-green-700">No OT 🎉</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function JobTimesheetRow({ job }) {
  const [expanded, setExpanded] = useState(false);
  const duration = diffMins(job.start_time, job.finish_time);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">#{job.job_number}</span>
            <StatusBadge status={job.status} />
            {job.is_overtime && (
              <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">OT</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{job.location_name || 'No location'}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold">{job.start_time || '—'} – {job.finish_time || '—'}</p>
          <p className="text-xs text-muted-foreground">{duration ? fmtMins(duration) : 'No times'}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-2 bg-secondary/10">
          {job.equipment_name && (
            <p className="text-xs"><span className="text-muted-foreground">Equipment:</span> {job.equipment_name}</p>
          )}
          {job.pump_number && (
            <p className="text-xs"><span className="text-muted-foreground">Pump:</span> {job.pump_number}</p>
          )}
          {job.colleague_name && (
            <p className="text-xs"><span className="text-muted-foreground">Colleague:</span> {job.colleague_name}</p>
          )}
          {job.completion_notes && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Completion Notes:</p>
              <p className="text-xs leading-relaxed bg-card border border-border rounded-lg p-2">{job.completion_notes}</p>
            </div>
          )}
          {job.personal_notes && (
            <div>
              <p className="text-xs text-amber-600 mb-1">My Notes:</p>
              <p className="text-xs leading-relaxed bg-amber-50 border border-amber-100 rounded-lg p-2">{job.personal_notes}</p>
            </div>
          )}
          {(job.parts || []).length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Parts:</p>
              <div className="space-y-1">
                {job.parts.map((p, i) => (
                  <p key={i} className="text-xs">{p.description || p.part_number} ×{p.quantity}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}