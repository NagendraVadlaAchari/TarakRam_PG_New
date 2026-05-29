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
    const res = await client.query('SELECT * FROM "RoomWise_MemberList";');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
main();
