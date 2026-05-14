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
    const partsStatuses = ['parts_required', 'non_conformance', 'wrong_parts'];

    // --- Parts alert on status update ---
    if (event?.type === 'update') {
      const statusChanged = changed_fields?.includes('status');
      if (statusChanged && partsStatuses.includes(data.status) && old_data?.status !== data.status) {
        const label = data.status === 'parts_required' ? '⚠️ Parts Required' : '❌ Non-Conformance';
        const jobRef = data.job_number ? `Job #${data.job_number}` : 'Job';
        const loc = data.location_name ? ` @ ${data.location_name}` : '';
        const ncReason = data.non_conformance_reason ? `\nReason: ${data.non_conformance_reason.replace(/_/g, ' ')}` : '';
        messages.push(`🔧 *TSG Job Alert*\n\n${label}\n\n${jobRef}${loc}${ncReason}\n\nUpdate the job when resolved.`);
      }

      // --- Overtime alert: is_overtime newly turned true ---
      const overtimeChanged = changed_fields?.includes('is_overtime') || changed_fields?.includes('finish_time');
      if (overtimeChanged && data.is_overtime === true && old_data?.is_overtime !== true) {
        const jobRef = data.job_number ? `Job #${data.job_number}` : 'Job';
        const loc = data.location_name ? ` @ ${data.location_name}` : '';
        const finishTime = data.finish_time || 'unknown time';
        messages.push(`⏰ *Overtime Reminder*\n\n${jobRef}${loc} finished at ${finishTime}.\n\nOvertime starts from 17:30 — make sure to log it! 💼`);
      }
    }

    // --- New job created with parts issue or overtime ---
    if (event?.type === 'create') {
      if (partsStatuses.includes(data.status)) {
        const label = data.status === 'parts_required' ? '⚠️ Parts Required' : '❌ Non-Conformance';
        const jobRef = data.job_number ? `Job #${data.job_number}` : 'Job';
        const loc = data.location_name ? ` @ ${data.location_name}` : '';
        const ncReason = data.non_conformance_reason ? `\nReason: ${data.non_conformance_reason.replace(/_/g, ' ')}` : '';
        messages.push(`🔧 *TSG Job Alert*\n\n${label}\n\n${jobRef}${loc}${ncReason}\n\nNew job created with a non-conformance noted.`);
      }
      if (data.is_overtime === true) {
        const jobRef = data.job_number ? `Job #${data.job_number}` : 'Job';
        const loc = data.location_name ? ` @ ${data.location_name}` : '';
        const finishTime = data.finish_time || 'unknown time';
        messages.push(`⏰ *Overtime Reminder*\n\n${jobRef}${loc} logged with finish time ${finishTime}.\n\nDon't forget to log your overtime from 17:30! 💼`);
      }
    }

    if (messages.length === 0) {
      return Response.json({ skipped: true, reason: 'no alert conditions met' });
    }

    // Deliver via TSG job agent — pushes into the user's WhatsApp conversation
    const conversations = await base44.asServiceRole.agents.listConversations({
      agent_name: 'tsg_job_agent',
    });

    let delivered = 0;
    if (conversations?.length > 0) {
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