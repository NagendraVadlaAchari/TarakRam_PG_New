// ===================== SLV PG — Backend API Server =====================
// Connects to Supabase PostgreSQL and serves room data to the frontend

const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

const app = express();
const PORT = 3001;

// Enable CORS for frontend access
app.use(cors());
app.use(express.json());

// PostgreSQL connection config (Supabase)
const dbConfig = {
  host: 'db.swtklinograpjazmklbx.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Kannayya@2026',
  ssl: { rejectUnauthorized: false }
};

// ---- GET /api/rooms — Fetch all rooms from TarakRam_RoomDetails ----
app.get('/api/rooms', async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    
    // Fetch rooms
    const result = await client.query('SELECT * FROM "TarakRam_RoomDetails" ORDER BY id ASC');
    
    // Fetch members to calculate occupancy
    const membersRes = await client.query('SELECT * FROM "RoomWise_MemberList"');
    const members = membersRes.rows;
    
    // Map DB columns to the format the frontend expects
    const rooms = result.rows.map(row => {
      // Find members for this room
      const roomMembers = members.filter(m => m.Room_No === row.Room_No);
      
      return {
        id: `R${row.Room_No}`,
        number: String(row.Room_No),
        floor: parseInt(row.Floor_No) || 1,     // Now use Floor_No from DB
        beds: parseInt(row.Room_Capacity) || 4, // Room_Capacity from DB
        occupied: roomMembers.length,           // Occupied beds based on members
        type: 'Standard',                       // Default type
        rent: 6000,                             // Default rent
        created_at: row.created_at,
        db_id: row.id,                          // Preserve original DB id
        members: roomMembers                    // Include members for UI
      };
    });

    console.log(`[API] Fetched ${rooms.length} rooms from TarakRam_RoomDetails with members`);
    res.json({ success: true, rooms, count: rooms.length });
  } catch (err) {
    console.error('[API] Database error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    await client.end();
  }
});

// ---- GET /api/tenants — Fetch all tenants from RoomWise_MemberList ----
app.get('/api/tenants', async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query('SELECT * FROM "RoomWise_MemberList" ORDER BY id ASC');
    
    // Map DB columns to the format the frontend expects
    const tenants = result.rows.map(row => ({
      id: `T${row.id}`,
      name: row.Tenant_Name,
      mobile: '9999999999', // Default
      email: 'tenant@example.com',
      occupation: 'Member',
      company: 'SLV PG',
      roomId: `R${row.Room_No}`,
      bedNo: 1, // Default
      joinDate: row.created_at,
      rent: 6000,
      deposit: 12000,
      status: 'active',
      db_id: row.id
    }));

    console.log(`[API] Fetched ${tenants.length} tenants from RoomWise_MemberList`);
    res.json({ success: true, tenants, count: tenants.length });
  } catch (err) {
    console.error('[API] Database error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    await client.end();
  }
});

// ---- GET /api/health — Health check ----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'SLV PG API', timestamp: new Date().toISOString() });
});

// ---- Start Server ----
app.listen(PORT, () => {
  console.log(`\n🚀 SLV PG API Server running at http://localhost:${PORT}`);
  console.log(`   📡 Rooms endpoint: http://localhost:${PORT}/api/rooms`);
  console.log(`   💚 Health check:   http://localhost:${PORT}/api/health\n`);
});
