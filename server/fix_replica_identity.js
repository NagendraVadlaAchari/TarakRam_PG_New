const { Client } = require('pg');

const client = new Client({
  host: 'db.swtklinograpjazmklbx.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Kannayya@2026',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully!');

    // Get all user tables in the public schema
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `;
    const tablesRes = await client.query(tablesQuery);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log('Found tables in public schema:', tables);

    for (const table of tables) {
      console.log(`Setting REPLICA IDENTITY FULL on table "${table}"...`);
      await client.query(`ALTER TABLE "${table}" REPLICA IDENTITY FULL;`);
      console.log(`✅ Table "${table}" replica identity set to FULL.`);
    }

    console.log('All tables updated successfully!');
  } catch (err) {
    console.error('Error executing query:', err.message);
  } finally {
    await client.end();
  }
}

main();
