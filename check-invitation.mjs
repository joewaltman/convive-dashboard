import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  // Find the test dinner and invitation
  const result = await pool.query(`
    SELECT 
      i.id as invitation_id,
      i.status,
      i.token,
      i.confirmed_at,
      i.payment_intent_id,
      i.price_paid_cents,
      i.invite_email_sent_at,
      i.checkout_started_at,
      g.email,
      g.first_name,
      d.dinner_name,
      d.dinner_date
    FROM invitations i
    JOIN guests g ON g.id = i.guest_id
    JOIN dinners d ON d.id = i.dinner_id
    WHERE g.email = 'joewaltman@gmail.com'
    ORDER BY i.id DESC
    LIMIT 5
  `);
  
  console.log('Invitations for joewaltman@gmail.com:');
  console.log(JSON.stringify(result.rows, null, 2));
  
  // Also check upcoming dinners
  const dinnerResult = await pool.query(`
    SELECT d.id, d.dinner_name, d.dinner_date, d.status,
      (SELECT COUNT(*) FROM invitations WHERE dinner_id = d.id AND status = 'confirmed') as confirmed_count,
      (SELECT COUNT(*) FROM invitations WHERE dinner_id = d.id) as total_invitations
    FROM dinners d
    WHERE d.dinner_date >= '2025-04-25'
    ORDER BY d.dinner_date
    LIMIT 5
  `);
  
  console.log('\nUpcoming dinners:');
  console.log(JSON.stringify(dinnerResult.rows, null, 2));
  
  await pool.end();
}

check().catch(console.error);
