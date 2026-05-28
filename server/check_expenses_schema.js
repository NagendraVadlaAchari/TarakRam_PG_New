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
    
    // Get table columns for TarakRam_ExpensesDetails
    const schemaRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'TarakRam_ExpensesDetails'
      ORDER BY ordinal_position;
    `);
    console.log('\n=== TABLE SCHEMA: TarakRam_ExpensesDetails ===');
    console.log(JSON.stringify(schemaRes.rows, null, 2));

    const dataRes = await client.query('SELECT * FROM "TarakRam_ExpensesDetails" LIMIT 5;');
    console.log('\n=== SAMPLE DATA: TarakRam_ExpensesDetails ===');
    console.log(JSON.stringify(dataRes.rows, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
