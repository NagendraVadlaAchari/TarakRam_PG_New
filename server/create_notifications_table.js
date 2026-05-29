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
    console.log('Connected to PostgreSQL database.');

    // 1. Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "TarakRam_Notifications" (
        id serial PRIMARY KEY,
        created_at timestamp with time zone DEFAULT now(),
        type varchar(50),
        title varchar(255),
        message text,
        date varchar(50),
        read boolean DEFAULT false,
        to_user varchar(50)
      );
    `);
    console.log('Table "TarakRam_Notifications" created or verified.');

    // 2. Disable RLS
    await client.query(`
      ALTER TABLE "TarakRam_Notifications" DISABLE ROW LEVEL SECURITY;
    `);
    console.log('Disabled RLS on "TarakRam_Notifications".');

    // 3. Grant table permissions
    await client.query(`
      GRANT SELECT, INSERT, UPDATE, DELETE ON "TarakRam_Notifications" TO anon;
    `);
    await client.query(`
      GRANT SELECT, INSERT, UPDATE, DELETE ON "TarakRam_Notifications" TO authenticated;
    `);
    console.log('Granted DML permissions to anon and authenticated roles.');

    // 4. Grant sequence permissions
    await client.query(`
      GRANT USAGE, SELECT ON SEQUENCE "TarakRam_Notifications_id_seq" TO anon;
    `);
    await client.query(`
      GRANT USAGE, SELECT ON SEQUENCE "TarakRam_Notifications_id_seq" TO authenticated;
    `);
    console.log('Granted sequence permissions to anon and authenticated roles.');

    console.log('Database migration successfully completed!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

main();
