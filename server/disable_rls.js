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
    console.log('Connected to PostgreSQL as superuser/postgres!');
    
    // Disable RLS so the anon role (REST API) can read/write data
    await client.query(`ALTER TABLE "TarakRam_RoomDetails" DISABLE ROW LEVEL SECURITY;`);
    console.log('Disabled RLS on TarakRam_RoomDetails');

    await client.query(`ALTER TABLE "RoomWise_MemberList" DISABLE ROW LEVEL SECURITY;`);
    console.log('Disabled RLS on RoomWise_MemberList');
    
    // Ensure the anon role has basic privileges (Supabase usually grants these, but just in case)
    await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON "TarakRam_RoomDetails" TO anon;`);
    await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON "RoomWise_MemberList" TO anon;`);
    await client.query(`GRANT USAGE ON SCHEMA public TO anon;`);
    
    console.log('Granted permissions to anon role.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
