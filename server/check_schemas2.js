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
    
    // Get table columns for RoomWise_MemberList
    const schemaRes1 = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'RoomWise_MemberList'
      ORDER BY ordinal_position;
    `);
    console.log('\n=== TABLE SCHEMA: RoomWise_MemberList ===');
    console.log(JSON.stringify(schemaRes1.rows, null, 2));

    const dataRes1 = await client.query('SELECT * FROM "RoomWise_MemberList" LIMIT 5;');
    console.log('\n=== SAMPLE DATA: RoomWise_MemberList ===');
    console.log(JSON.stringify(dataRes1.rows, null, 2));

    // Get table columns for TarakRam_RoomDetails
    const schemaRes2 = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'TarakRam_RoomDetails'
      ORDER BY ordinal_position;
    `);
    console.log('\n=== TABLE SCHEMA: TarakRam_RoomDetails ===');
    console.log(JSON.stringify(schemaRes2.rows, null, 2));

    const dataRes2 = await client.query('SELECT * FROM "TarakRam_RoomDetails" LIMIT 5;');
    console.log('\n=== SAMPLE DATA: TarakRam_RoomDetails ===');
    console.log(JSON.stringify(dataRes2.rows, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
