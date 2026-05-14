import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';

export default function MonthlyChart({ jobs }) {
  const monthMap = {};
  jobs.forEach(job => {
    if (!job.job_date) return;
    const key = format(parseISO(job.job_date), 'MMM yy');
    if (!monthMap[key]) monthMap[key] = { month: key, completed: 0, incomplete: 0, total: 0 };
    monthMap[key].total++;
    if (job.status === 'completed') monthMap[key].completed++;
    else monthMap[key].incomplete++;
  });

  const data = Object.values(monthMap)
    .sort((a, b) => {
      const [aM, aY] = a.month.split(' ');
      const [bM, bY] = b.month.split(' ');
      return new Date(`1 ${aM} 20${aY}`) - new Date(`1 ${bM} 20${bY}`);
    })
    .slice(-6);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-grotesk font-semibold text-sm mb-4">Jobs by Month</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barGap={4}>
          <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }}
            cursor={{ fill: 'hsl(var(--muted))' }}
          />
          <Bar dataKey="completed" fill="hsl(142 72% 40%)" radius={[4, 4, 0, 0]} name="Completed" />
          <Bar dataKey="incomplete" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} name="Incomplete" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}