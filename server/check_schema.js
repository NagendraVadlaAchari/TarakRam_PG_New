// Quick script to discover TarakRam_RoomDetails table schema
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
    console.log('Connected to PostgreSQL!');
    
    // Get table columns
    const schemaRes = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'TarakRam_RoomDetails'
      ORDER BY ordinal_position;
    `);
    console.log('\n=== TABLE SCHEMA: TarakRam_RoomDetails ===');
    console.log(JSON.stringify(schemaRes.rows, null, 2));
    
    // Get sample data
    const dataRes = await client.query('SELECT * FROM "TarakRam_RoomDetails" LIMIT 5;');
    console.log('\n=== SAMPLE DATA ===');
    console.log(JSON.stringify(dataRes.rows, null, 2));
    console.log(`\nTotal rows returned: ${dataRes.rowCount}`);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
