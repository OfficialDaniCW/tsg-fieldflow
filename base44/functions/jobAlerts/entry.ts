import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data, old_data, changed_fields } = payload;

    if (!data) {
      return Response.json({ skipped: true, reason: 'no data' });
    }

    const messages = [];

    const partsStatuses = ['parts_required', 'wrong_parts'];
    const statusChanged = changed_fields?.includes('status');
    const newStatus = data.status;
    const oldStatus = old_data?.status;

    // Parts alert on status change (update events)
    if (event?.type === 'update' && statusChanged && partsStatuses.includes(newStatus) && oldStatus !== newStatus) {
      const statusLabel = newStatus === 'parts_required' ? '⚠️ Parts Required' : '❌ Wrong Parts on Site';
      const jobRef = data.job_number ? `Job #${data.job_number}` : 'Job';
      const location = data.location_name ? ` @ ${data.location_name}` : '';
      messages.push(`🔧 *TSG Job Alert*\n\n${statusLabel}\n\n${jobRef}${location}\n\nUpdate the job in your TSG Tracker app when parts are confirmed.`);
    }

    // Overtime alert: is_overtime flipped to true
    const overtimeChanged = changed_fields?.includes('is_overtime') || changed_fields?.includes('finish_time');
    const isNowOvertime = data.is_overtime === true;
    const wasOvertime = old_data?.is_overtime === true;

    if (event?.type === 'update' && overtimeChanged && isNowOvertime && !wasOvertime) {
      const jobRef = data.job_number ? `Job #${data.job_number}` : 'Job';
      const location = data.location_name ? ` @ ${data.location_name}` : '';
      const finishTime = data.finish_time || 'unknown time';
      messages.push(`⏰ *Overtime Reminder*\n\n${jobRef}${location} finished at ${finishTime}.\n\nOvertime starts from 17:30 — make sure to log it! 💼`);
    }

    // New job created already flagged with parts issue or overtime
    if (event?.type === 'create') {
      if (partsStatuses.includes(data.status)) {
        const statusLabel = data.status === 'parts_required' ? '⚠️ Parts Required' : '❌ Wrong Parts on Site';
        const jobRef = data.job_number ? `Job #${data.job_number}` : 'Job';
        const location = data.location_name ? ` @ ${data.location_name}` : '';
        messages.push(`🔧 *TSG Job Alert*\n\n${statusLabel}\n\n${jobRef}${location}\n\nNew job created with a parts issue noted.`);
      }
      if (data.is_overtime === true) {
        const jobRef = data.job_number ? `Job #${data.job_number}` : 'Job';
        const location = data.location_name ? ` @ ${data.location_name}` : '';
        const finishTime = data.finish_time || 'unknown time';
        messages.push(`⏰ *Overtime Reminder*\n\n${jobRef}${location} logged with finish time ${finishTime}.\n\nDon't forget to log your overtime from 17:30! 💼`);
      }
    }

    if (messages.length === 0) {
      return Response.json({ skipped: true, reason: 'no alert conditions met' });
    }

    // Deliver via the TSG job agent — pushes message into the user's WhatsApp conversation
    const conversations = await base44.asServiceRole.agents.listConversations({
      agent_name: 'tsg_job_agent',
    });

    let delivered = 0;
    if (conversations && conversations.length > 0) {
      const latestConvo = conversations[0];
      for (const message of messages) {
        await base44.asServiceRole.agents.addMessage(latestConvo, {
          role: 'assistant',
          content: message,
        });
        delivered++;
      }
    }

    return Response.json({ sent: true, messageCount: messages.length, delivered });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});