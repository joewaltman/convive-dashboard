import { Pool } from 'pg';
import type { Invitation, InvitationResponse } from './types';

const dbUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL || '';

const pool = new Pool({
  connectionString: dbUrl,
  ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
});

function rowToInvitation(row: Record<string, unknown>): Invitation {
  return {
    id: Number(row.id),
    guestId: Number(row.guest_id),
    dinnerId: Number(row.dinner_id),
    guestName: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
    phone: row.phone ? String(row.phone) : null,
    inviteSentDate: row.invite_sent_date ? new Date(row.invite_sent_date as string).toISOString().split('T')[0] : null,
    response: row.response as InvitationResponse,
    responseDate: row.response_date ? new Date(row.response_date as string).toISOString().split('T')[0] : null,
    notes: row.notes ? String(row.notes) : null,
  };
}

export async function fetchInvitationsByDinner(dinnerId: string): Promise<Invitation[]> {
  const result = await pool.query(`
    SELECT i.*, g.first_name, g.last_name, g.phone
    FROM invitations i
    JOIN guests g ON g.id = i.guest_id
    WHERE i.dinner_id = $1
    ORDER BY g.last_name, g.first_name
  `, [dinnerId]);

  return result.rows.map(rowToInvitation);
}

export async function updateInvitationResponse(
  id: string,
  response: InvitationResponse
): Promise<Invitation> {
  // Get the current invitation to check previous response
  const currentResult = await pool.query(
    'SELECT * FROM invitations WHERE id = $1',
    [id]
  );

  if (currentResult.rows.length === 0) {
    throw new Error(`Invitation not found: ${id}`);
  }

  const current = currentResult.rows[0];
  const previousResponse = current.response;

  // Update the invitation response
  // Cast $1 to TEXT to handle null values properly
  await pool.query(`
    UPDATE invitations
    SET response = $1::TEXT, response_date = CASE WHEN $1::TEXT IS NOT NULL THEN CURRENT_DATE ELSE NULL END
    WHERE id = $2
  `, [response, id]);

  // Handle attendance sync
  if (response === 'Accepted' && previousResponse !== 'Accepted') {
    // Create attendance record if doesn't exist
    await pool.query(`
      INSERT INTO attendance (guest_id, dinner_id)
      VALUES ($1, $2)
      ON CONFLICT (guest_id, dinner_id) DO NOTHING
    `, [current.guest_id, current.dinner_id]);
  } else if (previousResponse === 'Accepted' && response !== 'Accepted') {
    // Remove attendance record
    await pool.query(`
      DELETE FROM attendance
      WHERE guest_id = $1 AND dinner_id = $2
    `, [current.guest_id, current.dinner_id]);
  }

  // Fetch updated invitation
  const result = await pool.query(`
    SELECT i.*, g.first_name, g.last_name, g.phone
    FROM invitations i
    JOIN guests g ON g.id = i.guest_id
    WHERE i.id = $1
  `, [id]);

  return rowToInvitation(result.rows[0]);
}

export async function createInvitation(
  dinnerId: string,
  guestId: string,
  inviteSentDate?: string
): Promise<Invitation> {
  const result = await pool.query(`
    INSERT INTO invitations (dinner_id, guest_id, invite_sent_date)
    VALUES ($1, $2, $3)
    RETURNING id
  `, [dinnerId, guestId, inviteSentDate || null]);

  const id = result.rows[0].id;

  const invitationResult = await pool.query(`
    SELECT i.*, g.first_name, g.last_name, g.phone
    FROM invitations i
    JOIN guests g ON g.id = i.guest_id
    WHERE i.id = $1
  `, [id]);

  return rowToInvitation(invitationResult.rows[0]);
}

export async function deleteInvitation(id: string): Promise<void> {
  // Get the invitation to check if it was accepted
  const result = await pool.query(
    'SELECT * FROM invitations WHERE id = $1',
    [id]
  );

  if (result.rows.length > 0) {
    const invitation = result.rows[0];

    // Remove attendance record if it existed
    if (invitation.response === 'Accepted') {
      await pool.query(`
        DELETE FROM attendance
        WHERE guest_id = $1 AND dinner_id = $2
      `, [invitation.guest_id, invitation.dinner_id]);
    }
  }

  await pool.query('DELETE FROM invitations WHERE id = $1', [id]);
}

export async function createAttendance(guestId: string, dinnerId: string): Promise<void> {
  await pool.query(`
    INSERT INTO attendance (guest_id, dinner_id)
    VALUES ($1, $2)
    ON CONFLICT (guest_id, dinner_id) DO NOTHING
  `, [guestId, dinnerId]);
}

export async function deleteAttendance(guestId: string, dinnerId: string): Promise<void> {
  await pool.query(`
    DELETE FROM attendance
    WHERE guest_id = $1 AND dinner_id = $2
  `, [guestId, dinnerId]);
}
