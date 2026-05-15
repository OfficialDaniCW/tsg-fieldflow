import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STATUS_LABELS = {
  completed_first_visit: 'Completed (1st Visit)',
  completed_return_visit: 'Completed (Return Visit)',
  completed: 'Completed',
  incomplete: 'Incomplete ⚠️',
  needs_parts: 'Needs Parts 🔩',
  parts_required: 'Parts Required 🔩',
  parts_ordered: 'Parts Ordered 📦',
  wrong_parts_supplied: 'Wrong Parts ❌',
  faulty_parts_supplied: 'Faulty Parts ❌',
  missing_stock: 'Missing Stock ❌',
  no_access: 'No Access 🚫',
  tooling_equipment_issue: 'Tooling Issue 🔧',
  previous_diagnosis_issue: 'Prev. Diagnosis Issue ⚠️',
  awaiting_others: 'Awaiting Others ⏳',
  unable_to_complete: 'Unable to Complete ❌',
  non_conformance: 'Non-Conformance ❗',
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatJob(job) {
  const loc = job.location_name ? ` @ ${job.location_name}` : '';
  const pump = job.pump_number ? ` Pump ${job.pump_number}` : '';
  const equip = job.equipment_name ? ` (${job.equipment_name})` : '';
  const times = job.start_time ? ` ${job.start_time}${job.finish_time ? '→' + job.finish_time : '→?'}` : '';
  const status = STATUS_LABELS[job.status] || job.status;
  return `• *#${job.job_number}*${loc}${pump}${equip}${times}\n  Status: ${status}`;
}

function getMissingFields(job) {
  const missing = [];
  if (!job.finish_time) missing.push('finish time');
  if (!job.status || job.status === 'incomplete') missing.push('outcome/status');
  if (!job.completion_notes) missing.push('job notes');
  if (!job.start_time) missing.push('start time');
  return missing;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const type = payload?.type || 'morning'; // 'morning' or 'evening'
    const today = todayStr();

    // Fetch all jobs — today's and recent incomplete
    const allJobs = await base44.asServiceRole.entities.Job.list('-job_date', 500);

    const todaysJobs = allJobs.filter(j => j.job_date === today);

    // Jobs with missing info (last 7 days, not fully complete)
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentJobs = allJobs.filter(j => {
      if (!j.job_date) return false;
      return new Date(j.job_date) >= sevenDaysAgo;
    });

    const incompleteJobs = recentJobs.filter(j =>
      !['completed_first_visit', 'completed_return_visit', 'completed'].includes(j.status)
    );

    const jobsMissingInfo = recentJobs.filter(j => getMissingFields(j).length > 0);

    let message = '';

    if (type === 'morning') {
      const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
      message = `☀️ *Good morning! TSG Daily Briefing*\n📅 ${dateLabel}\n\n`;

      if (todaysJobs.length > 0) {
        message += `*Today's jobs (${todaysJobs.length}):*\n`;
        message += todaysJobs.map(formatJob).join('\n') + '\n\n';
      } else {
        message += `No jobs logged for today yet. Don't forget to add them as you go!\n\n`;
      }

      if (incompleteJobs.length > 0) {
        message += `*⚠️ Still outstanding (last 7 days, ${incompleteJobs.length} jobs):*\n`;
        message += incompleteJobs.slice(0, 5).map(formatJob).join('\n');
        if (incompleteJobs.length > 5) message += `\n  ...and ${incompleteJobs.length - 5} more`;
        message += '\n\n';
      }

      if (jobsMissingInfo.length > 0) {
        message += `*📝 Jobs with missing info:*\n`;
        jobsMissingInfo.slice(0, 5).forEach(j => {
          const missing = getMissingFields(j);
          message += `• *#${j.job_number}*${j.location_name ? ' @ ' + j.location_name : ''} — missing: ${missing.join(', ')}\n`;
        });
        message += '\n';
      }

      message += `Reply with a job update anytime, e.g. _"Job TSG-123 completed at Tesco Hythe, 8am-4pm"_ 💪`;

    } else {
      // Evening wrap-up
      const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
      message = `🌙 *Evening Wrap-Up*\n📅 ${dateLabel}\n\n`;

      const completedToday = todaysJobs.filter(j =>
        ['completed_first_visit', 'completed_return_visit', 'completed'].includes(j.status)
      );
      const notCompleteToday = todaysJobs.filter(j =>
        !['completed_first_visit', 'completed_return_visit', 'completed'].includes(j.status)
      );

      if (todaysJobs.length === 0) {
        message += `No jobs logged today. Remember to add any jobs before you finish!\n\n`;
      } else {
        message += `*Today: ${completedToday.length} completed, ${notCompleteToday.length} not completed*\n\n`;

        if (completedToday.length > 0) {
          message += `✅ *Completed today:*\n`;
          message += completedToday.map(formatJob).join('\n') + '\n\n';
        }

        if (notCompleteToday.length > 0) {
          message += `⚠️ *Not completed today:*\n`;
          message += notCompleteToday.map(formatJob).join('\n') + '\n\n';
        }
      }

      // Jobs missing key info across all today's jobs
      const todayMissing = todaysJobs.filter(j => getMissingFields(j).length > 0);
      if (todayMissing.length > 0) {
        message += `*📝 Please fill in before you finish:*\n`;
        todayMissing.forEach(j => {
          const missing = getMissingFields(j);
          message += `• *#${j.job_number}*${j.location_name ? ' @ ' + j.location_name : ''} — ${missing.join(', ')}\n`;
        });
        message += '\n';
      }

      if (incompleteJobs.length > 0) {
        message += `*📋 Still open across the week: ${incompleteJobs.length} jobs*\n`;
        message += incompleteJobs.slice(0, 3).map(j => `• #${j.job_number}${j.location_name ? ' @ ' + j.location_name : ''} — ${STATUS_LABELS[j.status] || j.status}`).join('\n');
        if (incompleteJobs.length > 3) message += `\n  ...and ${incompleteJobs.length - 3} more`;
        message += '\n\n';
      }

      message += `Great work today! Update anything outstanding and we'll catch you in the morning. 👷`;
    }

    // Send to all WhatsApp conversations for the TSG job agent
    const conversations = await base44.asServiceRole.agents.listConversations({
      agent_name: 'tsg_job_agent',
    });

    let delivered = 0;
    for (const convo of (conversations || [])) {
      await base44.asServiceRole.agents.addMessage(convo, {
        role: 'assistant',
        content: message,
      });
      delivered++;
    }

    return Response.json({ sent: true, type, delivered, todaysJobs: todaysJobs.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});