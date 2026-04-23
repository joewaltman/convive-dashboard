import { NextResponse } from 'next/server';
import { pool } from '@/lib/pool';

export async function GET() {
  try {
    // First check if host_guest_id column exists on dinners table
    const columnCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'dinners' AND column_name = 'host_guest_id'
    `);
    const hasHostGuestId = columnCheck.rows.length > 0;

    // Fetch guests eligible to host:
    // - hosting_interest IN ('Yes', 'Maybe') OR
    // - Have hosted before (if host_guest_id column exists)
    let query: string;

    if (hasHostGuestId) {
      query = `
        SELECT DISTINCT
          g.id,
          g.first_name,
          g.last_name,
          g.hosting_interest,
          g.zip_code,
          EXISTS (
            SELECT 1 FROM dinners d WHERE d.host_guest_id = g.id
          ) as has_hosted
        FROM guests g
        WHERE g.hosting_interest IN ('Yes', 'Maybe')
          OR g.id IN (SELECT host_guest_id FROM dinners WHERE host_guest_id IS NOT NULL)
        ORDER BY
          CASE g.hosting_interest
            WHEN 'Yes' THEN 1
            WHEN 'Maybe' THEN 2
            ELSE 3
          END,
          g.last_name,
          g.first_name
      `;
    } else {
      // Fallback: just use hosting_interest
      query = `
        SELECT DISTINCT
          g.id,
          g.first_name,
          g.last_name,
          g.hosting_interest,
          g.zip_code,
          FALSE as has_hosted
        FROM guests g
        WHERE g.hosting_interest IN ('Yes', 'Maybe')
        ORDER BY
          CASE g.hosting_interest
            WHEN 'Yes' THEN 1
            WHEN 'Maybe' THEN 2
            ELSE 3
          END,
          g.last_name,
          g.first_name
      `;
    }

    const result = await pool.query(query);

    const candidates = result.rows.map(row => ({
      id: row.id,
      firstName: row.first_name || '',
      lastName: row.last_name || '',
      hostingInterest: row.hosting_interest || null,
      address: null,
      zipCode: row.zip_code || null,
      hasHosted: row.has_hosted,
    }));

    return NextResponse.json(candidates);
  } catch (error) {
    console.error('Error fetching host candidates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch host candidates' },
      { status: 500 }
    );
  }
}
