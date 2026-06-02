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

// PostgreSQL connection string
const connectionString = 'postgresql://postgres:Kannayya%402026@db.swtklinograpjazmklbx.supabase.co:5432/postgres';

// ---- GET /api/rooms — Fetch all rooms from TarakRam_RoomDetails ----
app.get('/api/rooms', async (req, res) => {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
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
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
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

// ---- POST /api/signup-notify — Send WhatsApp alert to Admin ----
app.post('/api/signup-notify', async (req, res) => {
  const { name, mobile, email, adminNumber, apiKey } = req.body;
  console.log(`\n🆕 [Signup Notification] New registration:`);
  console.log(`   👤 Name:   ${name}`);
  console.log(`   📱 Mobile: ${mobile}`);
  console.log(`   📧 Email:  ${email || 'Not provided'}`);

  if (adminNumber && apiKey && apiKey !== 'YOUR_API_KEY_HERE') {
    const https = require('https');
    const cleanNumber = adminNumber.replace(/[^0-9]/g, '');
    const waMsg = `🆕 New Sign-Up Alert!\n\n👤 Name: ${name}\n📱 Mobile: ${mobile}\n📧 Email: ${email || 'Not provided'}\n\nThis user has registered at PG app.`;
    const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanNumber}&text=${encodeURIComponent(waMsg)}&apikey=${apiKey}`;

    console.log(`[WhatsApp Backend] Dispatching silent alert to ${cleanNumber}...`);
    https.get(url, (apiRes) => {
      let data = '';
      apiRes.on('data', (chunk) => { data += chunk; });
      apiRes.on('end', () => {
        console.log(`[WhatsApp Backend] CallMeBot response status: ${apiRes.statusCode}. Body: ${data}`);
      });
    }).on('error', (err) => {
      console.error(`[WhatsApp Backend] Dispatch error: ${err.message}`);
    });
  } else {
    console.log(`[WhatsApp Backend] CallMeBot API key or number not configured. Skipping WhatsApp dispatch.`);
  }

  res.json({ success: true, message: 'Signup notification processed' });
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
