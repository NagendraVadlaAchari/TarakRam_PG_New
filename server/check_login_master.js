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
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);
    console.log('=== TABLES ===');
    console.log(tables.rows.map(r => r.table_name));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
main();
