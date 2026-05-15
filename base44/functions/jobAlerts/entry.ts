import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const COMPLETED_STATUSES = ['completed_first_visit', 'completed_return_visit', 'completed'];

const STATUS_LABELS = {
  completed_first_visit: '✅ Completed (1st Visit)',
  completed_return_visit: '✅ Completed (Return Visit)',
  completed: '✅ Completed',
  incomplete: '⏳ Incomplete',
  needs_parts: '🔩 Needs Parts',
  parts_required: '🔩 Parts Required',
  parts_ordered: '📦 Parts Ordered',
  wrong_parts_supplied: '❌ Wrong Parts',
  faulty_parts_supplied: '❌ Faulty Parts',
  missing_stock: '❌ Missing Stock',
  no_access: '🚫 No Access',
  tooling_equipment_issue: '🔧 Tooling Issue',
  previous_diagnosis_issue: '⚠️ Prev. Diagnosis Issue',
  awaiting_others: '⏳ Awaiting Others',
  unable_to_complete: '❌ Unable to Complete',
  non_conformance: '❗ Non-Conformance',
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function jobSummary(job, index, total) {
  const loc = job.location_name ? ` @ ${job.location_name}` : '';
  const code = job.location_number ? ` (${job.location_number})` : '';
  const pump = job.pump_number ? `\n🔢 Pump: ${job.pump_number}` : '';
  const equip = job.equipment_name ? `\n🛠 Equipment: ${job.equipment_name}` : '';
  const inv = job.inventory_type ? ` — ${job.inventory_type}` : '';
  const times = job.start_time ? `\n🕐 ${job.start_time}${job.finish_time ? ' → ' + job.finish_time : ' → ?'}` : '';
  const colleague = job.colleague_name ? `\n👤 With: ${job.colleague_name}` : '';
  const typeLabel = { reactive: '🔧 Reactive', ppm: '📋 PPM', vr2: '💨 VR2', other: '📁 Other' }[job.job_type] || '';
  const status = STATUS_LABELS[job.status] || job.status;
  const notes = job.completion_notes ? `\n📝 ${job.completion_notes}` : '';

  const header = total ? `Job ${index} of ${total}` : `Job #${job.job_number}`;
  return `*${header} — #${job.job_number}*${loc}${code}\n${typeLabel}${pump}${equip}${inv}${times}${colleague}${notes}\nStatus: ${status}`;
}

async function sendWhatsApp(base44, message) {
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
  return delivered;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data, old_data, changed_fields } = payload;

    if (!data) {
      return Response.json({ skipped: true, reason: 'no data' });
    }

    const messages = [];
    const partsStatuses = ['parts_required', 'non_conformance', 'wrong_parts_supplied', 'faulty_parts_supplied'];
    const today = todayStr();

    // ─── JOB JUST MARKED AS COMPLETE ────────────────────────────────────────
    if (event?.type === 'update') {
      const statusChanged = changed_fields?.includes('status');
      const justCompleted = statusChanged
        && COMPLETED_STATUSES.includes(data.status)
        && !COMPLETED_STATUSES.includes(old_data?.status);

      if (justCompleted) {
        // Fetch all of today's jobs sorted by created_date to establish order
        const todaysJobs = (await base44.asServiceRole.entities.Job.list('-job_date', 200))
          .filter(j => j.job_date === today)
          .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

        const totalToday = todaysJobs.length;
        const completedToday = todaysJobs.filter(j => COMPLETED_STATUSES.includes(j.status));
        const remainingJobs = todaysJobs.filter(j => !COMPLETED_STATUSES.includes(j.status) && j.id !== data.id);

        // Find position of the job just completed
        const jobIndex = todaysJobs.findIndex(j => j.id === data.id) + 1;

        // Summary of the job just done
        let msg = `✅ *Job ${jobIndex} of ${totalToday} Done!*\n\n`;
        msg += jobSummary(data, jobIndex, totalToday);
        msg += `\n\n━━━━━━━━━━━━━━━`;

        if (remainingJobs.length === 0) {
          // ── LAST JOB OF THE DAY ──
          msg += `\n\n🏁 *That's your last job today!*\n`;
          msg += `Completed: ${completedToday.length} / ${totalToday}\n\n`;

          // Check for any pending/unresolved jobs across all time (not today)
          const pendingOther = (await base44.asServiceRole.entities.Job.list('-job_date', 100))
            .filter(j =>
              j.job_date !== today &&
              !COMPLETED_STATUSES.includes(j.status) &&
              j.status !== 'parts_ordered'
            );

          if (pendingOther.length > 0) {
            msg += `⚠️ *Pending jobs from other days (${pendingOther.length}):*\n`;
            pendingOther.slice(0, 5).forEach(j => {
              msg += `• #${j.job_number}${j.location_name ? ' @ ' + j.location_name : ''} — ${STATUS_LABELS[j.status] || j.status}\n`;
            });
            msg += `\nIf these won't be looked at, reply _"delete job TSG-XXXXX"_ to remove them, or update their status. 🗑️`;
          } else {
            msg += `All jobs are up to date. Great work today! 🎉`;
          }

        } else {
          // ── NEXT JOB BRIEFING ──
          const nextJob = remainingJobs[0];
          const nextIndex = todaysJobs.findIndex(j => j.id === nextJob.id) + 1;
          msg += `\n\n➡️ *Up next — Job ${nextIndex} of ${totalToday}:*\n\n`;
          msg += jobSummary(nextJob, nextIndex, totalToday);

          if (remainingJobs.length > 1) {
            msg += `\n\n📋 *Still to do today: ${remainingJobs.length} jobs*\n`;
            remainingJobs.slice(1).forEach((j, i) => {
              const idx = todaysJobs.findIndex(x => x.id === j.id) + 1;
              msg += `${idx}. #${j.job_number}${j.location_name ? ' @ ' + j.location_name : ''}\n`;
            });
          }
        }

        messages.push(msg);
      }

      // ── Parts / NC alert on status update ──
      if (statusChanged && partsStatuses.includes(data.status) && old_data?.status !== data.status) {
        const label = data.status === 'non_conformance' ? '❗ Non-Conformance' : '⚠️ Parts Issue';
        const jobRef = `Job #${data.job_number || '?'}`;
        const loc = data.location_name ? ` @ ${data.location_name}` : '';
        const ncReason = data.non_conformance_reason ? `\nReason: ${data.non_conformance_reason.replace(/_/g, ' ')}` : '';
        messages.push(`🔧 *TSG Job Alert*\n\n${label}\n\n${jobRef}${loc}${ncReason}\n\nUpdate the job when resolved.`);
      }

      // ── Overtime alert ──
      const overtimeChanged = changed_fields?.includes('is_overtime') || changed_fields?.includes('finish_time');
      if (overtimeChanged && data.is_overtime === true && old_data?.is_overtime !== true) {
        const jobRef = `Job #${data.job_number || '?'}`;
        const loc = data.location_name ? ` @ ${data.location_name}` : '';
        messages.push(`⏰ *Overtime*\n\n${jobRef}${loc} finished at ${data.finish_time || '?'}.\n\nMake sure to log it! 💼`);
      }
    }

    // ─── NEW JOB CREATED ────────────────────────────────────────────────────
    if (event?.type === 'create') {
      const jobRef = data.job_number ? `#${data.job_number}` : 'New job';
      const loc = data.location_name ? ` @ ${data.location_name}` : '';
      const typeLabel = { reactive: '🔧 Reactive', ppm: '📋 PPM', vr2: '💨 VR2', other: '📁 Other' }[data.job_type] || '';
      const pump = data.pump_number ? `\nPump: ${data.pump_number}` : '';
      const equip = data.equipment_name ? `\nEquipment: ${data.equipment_name}` : '';
      const times = (data.start_time || data.finish_time) ? `\nTime: ${data.start_time || '?'} → ${data.finish_time || '?'}` : '';
      const colleague = data.colleague_name ? `\nWith: ${data.colleague_name}` : '';
      messages.push(`✅ *Job added!*\n\n${typeLabel ? typeLabel + ' — ' : ''}Job ${jobRef}${loc}${pump}${equip}${times}${colleague}`);

      if (partsStatuses.includes(data.status)) {
        const ncReason = data.non_conformance_reason ? `\nReason: ${data.non_conformance_reason.replace(/_/g, ' ')}` : '';
        messages.push(`🔧 *TSG Job Alert*\n\n⚠️ Parts/NC on new job\n\nJob ${jobRef}${loc}${ncReason}`);
      }
      if (data.is_overtime === true) {
        messages.push(`⏰ *Overtime*\n\nJob ${jobRef}${loc} logged with finish ${data.finish_time || '?'}. Don't forget to log it! 💼`);
      }
    }

    if (messages.length === 0) {
      return Response.json({ skipped: true, reason: 'no alert conditions met' });
    }

    let delivered = 0;
    for (const message of messages) {
      delivered += await sendWhatsApp(base44, message);
    }

    return Response.json({ sent: true, messageCount: messages.length, delivered });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});