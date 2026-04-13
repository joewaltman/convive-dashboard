import { Pool } from 'pg';
import type { Guest, GuestFields, AttentionQueueItem, AttentionQueueData } from './types';

const dbUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL || '';

const pool = new Pool({
  connectionString: dbUrl,
  ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
});

function rowToGuest(row: Record<string, unknown>): Guest {
  const fields: GuestFields = {};

  if (row.first_name != null) fields['First Name'] = String(row.first_name);
  if (row.last_name != null) fields['Last Name'] = String(row.last_name);
  if (row.email != null) fields['Email'] = String(row.email);
  if (row.phone != null) fields['Phone'] = String(row.phone);
  if (row.age_range != null) fields['Age Range'] = String(row.age_range);
  if (row.funnel_stage != null) fields['Funnel Stage'] = String(row.funnel_stage);
  if (row.curiosity_score != null) fields['Curiosity Score'] = Number(row.curiosity_score);
  if (row.spark_score != null) fields['Spark Score'] = Number(row.spark_score);
  if (row.call_complete != null) fields['Call Complete'] = Boolean(row.call_complete);
  if (row.call_date != null) fields['Call Date'] = String(row.call_date);
  if (row.priority != null) fields['Priority'] = String(row.priority);
  if (row.what_do_you_do != null) fields['What Do You Do'] = String(row.what_do_you_do);
  if (row.about != null) fields['About'] = String(row.about);
  if (row.one_thing != null) fields['OneThing'] = String(row.one_thing);
  if (row.curious_about != null) fields['Curious About'] = String(row.curious_about);
  if (row.surprising_knowledge != null) fields['Surprising Knowledge'] = String(row.surprising_knowledge);
  if (row.solo_or_couple != null) fields['Solo or Couple'] = String(row.solo_or_couple);
  if (row.available_days != null) fields['Available Days'] = row.available_days as string[];
  if (row.dietary_restrictions != null) fields['Dietary Restrictions'] = row.dietary_restrictions as string[];
  if (row.dietary_notes != null) fields['Dietary Notes'] = String(row.dietary_notes);
  if (row.hosting_interest != null) fields['Hosting Interest'] = String(row.hosting_interest);
  if (row.created_at != null) fields['Created Time'] = new Date(row.created_at as string).toISOString();
  if (row.routing_status != null) fields['Routing Status'] = String(row.routing_status);
  if (row.last_replied_at != null) fields['Last Replied At'] = new Date(row.last_replied_at as string).toISOString();
  if (row.last_message_sent_at != null) fields['Last Message Sent At'] = new Date(row.last_message_sent_at as string).toISOString();
  if (row.sequence_completed != null) fields['Sequence Completed'] = Boolean(row.sequence_completed);
  if (row.sequence_paused != null) fields['Sequence Paused'] = Boolean(row.sequence_paused);
  if (row.sequence_step != null) fields['Sequence Step'] = Number(row.sequence_step);

  return {
    id: String(row.id),
    fields,
    createdTime: row.created_at ? new Date(row.created_at as string).toISOString() : undefined,
  };
}

// Fetch new sign-ups that need initial triage (exclude legacy data before Apr 10, 2026)
async function fetchNewSignups(): Promise<AttentionQueueItem[]> {
  const result = await pool.query(`
    SELECT g.*
    FROM guests g
    WHERE g.routing_status IS NULL
      AND g.created_at >= '2026-04-10'
    ORDER BY g.created_at DESC
  `);

  return result.rows.map(row => ({
    guest: rowToGuest(row),
    lastActivityAt: row.created_at
      ? new Date(row.created_at as string).toISOString()
      : new Date().toISOString(),
  }));
}

export async function fetchAttentionQueue(): Promise<AttentionQueueData> {
  const newSignups = await fetchNewSignups();

  return {
    newSignups,
    totalCount: newSignups.length,
  };
}

export async function fetchAttentionCount(): Promise<number> {
  const result = await pool.query(`
    SELECT COUNT(*) AS total
    FROM guests g
    WHERE g.routing_status IS NULL
      AND g.created_at >= '2026-04-10'
  `);

  return Number(result.rows[0]?.total ?? 0);
}

export async function routeGuest(guestId: number, status: string): Promise<void> {
  // Map status to funnel stage
  const funnelStageMap: Record<string, string> = {
    green: 'Dinner Ready',
    yellow: 'Call Scheduled',
    red: 'New',
    deprioritized: 'Declined',
  };

  const funnelStage = funnelStageMap[status] || 'New';

  // Update guest routing status and funnel stage
  await pool.query(
    `UPDATE guests SET routing_status = $1, funnel_stage = $2, updated_at = NOW() WHERE id = $3`,
    [status, funnelStage, guestId]
  );

  // Clear all flagged messages for this guest
  await pool.query(
    `UPDATE messages SET flagged = false WHERE guest_id = $1`,
    [guestId]
  );
}

export async function unpauseGuest(guestId: number): Promise<void> {
  await pool.query(
    `UPDATE guests SET sequence_paused = FALSE, updated_at = NOW() WHERE id = $1`,
    [guestId]
  );
}
