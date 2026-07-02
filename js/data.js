// ===================== SLV PG DATA STORE =====================
const DB = {
  get(key){ try{return JSON.parse(localStorage.getItem('slvpg_'+key))||null}catch{return null} },
  set(key,val){ localStorage.setItem('slvpg_'+key,JSON.stringify(val)) },
  del(key){ localStorage.removeItem('slvpg_'+key) }
};

// ===================== SUPABASE DIRECT CONNECTION (JDBC FORMAT) =====================
// JDBC Connection String: jdbc:postgresql://db.swtklinograpjazmklbx.supabase.co:5432/postgres?user=postgres&password=Kannayya@2026
// Parsed into Supabase REST API configuration below:
const SUPABASE_CONFIG = {
  // Connection string components (JDBC format reference)
  jdbc: 'jdbc:postgresql://db.swtklinograpjazmklbx.supabase.co:5432/postgres?user=postgres&password=Kannayya@2026',
  // Supabase REST API endpoint (derived from JDBC host)
  url: 'https://swtklinograpjazmklbx.supabase.co',
  // Supabase anon API key (for REST access — from Dashboard > Settings > API)
  apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dGtsaW5vZ3JhcGphem1rbGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMzY3NjYsImV4cCI6MjA5NDkxMjc2Nn0.M2xt4dbfpnOeXwKZfdtcZNSDM1wb1Bo5TbOAe5jY9Sk'
};

// ===================== WHATSAPP / ADMIN CONFIGURATION =====================
// ⚙️  CONFIGURATION FILE — Change numbers here whenever needed
const WHATSAPP_CONFIG = {
  // Number to receive notifications when a GUEST sends a VISIT BOOKING
  // Change this number to redirect visit booking WhatsApp notifications
  adminNumber: '+91-9492947038',

  // Number to receive a SILENT backend notification when any user SIGNS UP
  // Change this number to redirect signup notifications
  signupNotifyNumber: '+91-9492947038',

  // CallMeBot API key for sending silent WhatsApp messages.
  // Set up your API key by sending "I allow callmebot to send me messages" via WhatsApp
  // to CallMeBot's number, then add the apikey below:
  callmebotApiKey: 'YOUR_API_KEY_HERE'
};

let dbRoomsLoaded = false;
let dbRoomsLoading = false;
let dbRoomsError = null;

let dbExpenses = [];
let dbExpensesLoaded = false;
let dbExpensesLoading = false;

// Helper: Make authenticated request to Supabase REST API (PostgREST)
async function supabaseRequest(tableName, queryParams = '', method = 'GET', body = null) {
  const url = `${SUPABASE_CONFIG.url}/rest/v1/${tableName}${queryParams ? '?' + queryParams : ''}`;
  const headers = {
    'apikey': SUPABASE_CONFIG.apiKey,
    'Authorization': `Bearer ${SUPABASE_CONFIG.apiKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  
  const options = {
    method: method,
    headers: headers
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[Supabase] HTTP ${response.status}:`, errorBody);
    throw new Error(`Supabase API error ${response.status}: ${errorBody}`);
  }
  return response.json();
}

// Fetch rooms from Supabase (TarakRam_RoomDetails) — direct REST API call
async function fetchDBRooms() {
  try {
    // Fetch rooms directly from Supabase PostgREST
    const roomRows = await supabaseRequest('TarakRam_RoomDetails', 'select=*&order=id.asc');

    // Fetch members to calculate occupancy
    const memberRows = await supabaseRequest('RoomWise_MemberList', 'select=*');

    // Map DB columns to the format the frontend expects
    const rooms = roomRows.map(row => {
      const roomMembers = memberRows.filter(m => m.Room_No === row.Room_No);
      const rNumStr = String(row.Room_No);
      // Determine AC/Non-AC type based on room number suffix
      const isAC = rNumStr.endsWith('01') || rNumStr.endsWith('02') || rNumStr.endsWith('.01') || rNumStr.endsWith('.02');
      const type = isAC ? 'AC' : 'Non-AC';
      // Read rent from Room_Rent column; fall back to type-based default if not set
      const rentFromDB = row.Room_Rent ? parseFloat(row.Room_Rent) : null;
      const rent = rentFromDB || (isAC ? 8000 : 6000);

      return {
        id: `R${row.Room_No}`,
        number: rNumStr,
        floor: parseInt(row.Floor_No) || 1,
        beds: parseInt(row.Room_Capacity) || 4,
        occupied: roomMembers.length,
        type: type,
        rent: rent,
        created_at: row.created_at,
        db_id: row.id,
        members: roomMembers
      };
    });

    console.log(`[Supabase] ✅ Fetched ${rooms.length} rooms from TarakRam_RoomDetails`);
    return rooms;
  } catch (err) {
    console.error('[Supabase] Failed to fetch rooms:', err.message);
    throw err;
  }
}

// Check maximum ID in TarakRam_RoomDetails and return next ID
async function getNextRoomId() {
  try {
    const res = await supabaseRequest('TarakRam_RoomDetails', 'select=id&order=id.desc&limit=1');
    if (res && res.length > 0) {
      return parseInt(res[0].id) + 1;
    }
    return 1;
  } catch (err) {
    console.error("Failed to get next room ID:", err);
    return 1;
  }
}

// Check maximum ID in RoomWise_MemberList and return next ID
async function getNextTenantId() {
  try {
    const res = await supabaseRequest('RoomWise_MemberList', 'select=id&order=id.desc&limit=1');
    if (res && res.length > 0) {
      return parseInt(res[0].id) + 1;
    }
    return 1;
  } catch (err) {
    console.error("Failed to get next tenant ID:", err);
    return 1;
  }
}

// Save new room in PostgreSQL
async function saveNewRoomToDB(roomNumber, floor, capacity, rent) {
  const nextId = await getNextRoomId();
  const body = {
    id: nextId,
    Room_No: String(roomNumber),
    Floor_No: String(floor),
    Room_Capacity: String(capacity),
    Room_Rent: rent ? parseFloat(rent) : null
  };
  return await supabaseRequest('TarakRam_RoomDetails', '', 'POST', body);
}

// Update existing room in PostgreSQL
async function updateRoomInDB(dbId, originalRoomNo, newRoomNo, floor, capacity, rent) {
  let queryParams = '';
  if (dbId) {
    queryParams = `id=eq.${dbId}`;
  } else {
    queryParams = `Room_No=eq.${originalRoomNo}`;
  }
  
  const body = {
    Room_No: String(newRoomNo),
    Floor_No: String(floor),
    Room_Capacity: String(capacity),
    Room_Rent: rent ? parseFloat(rent) : null
  };
  return await supabaseRequest('TarakRam_RoomDetails', queryParams, 'PATCH', body);
}

// Save new tenant in PostgreSQL RoomWise_MemberList
async function saveNewTenantToDB(tenantName, mobileNo, occupation, joinDate, roomNo, floorNo, email, dob, deposit, companyCollege, emergencyContact) {
  const nextId = await getNextTenantId();
  const body = {
    id: nextId,
    Tenant_Name: String(tenantName),
    Mobile_No: String(mobileNo),
    Occupation: String(occupation),
    DOJ: joinDate ? joinDate : null,
    Room_No: String(roomNo),
    Floor_No: String(floorNo),
    Email: email || null,
    DOB: dob || null,
    SecurityDeposit: deposit !== undefined && deposit !== null ? String(deposit) : null,
    CompanyCollegeName: companyCollege || null,
    EmergencyContact: emergencyContact || null
  };
  return await supabaseRequest('RoomWise_MemberList', '', 'POST', body);
}

// Update existing tenant in PostgreSQL RoomWise_MemberList
async function updateTenantInDB(dbId, tenantName, mobileNo, occupation, joinDate, roomNo, floorNo, email, dob, deposit, companyCollege, emergencyContact) {
  if (!dbId) throw new Error('No DB ID provided for tenant update');
  const queryParams = `id=eq.${dbId}`;
  const body = {
    Tenant_Name: String(tenantName),
    Mobile_No: String(mobileNo),
    Occupation: String(occupation),
    DOJ: joinDate ? joinDate : null,
    Room_No: String(roomNo),
    Floor_No: String(floorNo),
    Email: email || null,
    DOB: dob || null,
    SecurityDeposit: deposit !== undefined && deposit !== null ? String(deposit) : null,
    CompanyCollegeName: companyCollege || null,
    EmergencyContact: emergencyContact || null
  };
  return await supabaseRequest('RoomWise_MemberList', queryParams, 'PATCH', body);
}

// Save vacated tenant details to RoomWise_MemberList_VacateDetails
async function saveVacateDetailsToDB(tenant, vacateDate) {
  const body = {
    Tenant_Name: tenant.name || null,
    Mobile_No: tenant.mobile || null,
    Email: tenant.email || null,
    DOB: tenant.dob || null,
    Occupation: tenant.occupation || null,
    CompanyCollegeName: tenant.company || null,
    Room_No: tenant.roomId ? tenant.roomId.replace('R', '') : null,
    DOJ: tenant.joinDate || null,
    VacateDate: vacateDate || new Date().toISOString().slice(0, 10),
    SecurityDeposit: tenant.deposit !== undefined && tenant.deposit !== null ? String(tenant.deposit) : null,
    Rent: tenant.rent !== undefined && tenant.rent !== null ? String(tenant.rent) : null,
    IDProof: tenant.idProof || null,
    IDNumber: tenant.idNumber || null,
    EmergencyContact: tenant.emergencyContact || null
  };
  return await supabaseRequest('RoomWise_MemberList_VacateDetails', '', 'POST', body);
}

// Load all vacate details from RoomWise_MemberList_VacateDetails
async function loadVacateDetailsFromDB() {
  try {
    console.log('[Supabase] Fetching vacate details from RoomWise_MemberList_VacateDetails...');
    const rows = await supabaseRequest('RoomWise_MemberList_VacateDetails', 'select=*&order=id.desc');
    console.log(`[Supabase] ✅ Loaded ${rows.length} vacate records`);
    return rows;
  } catch (err) {
    console.error('[Supabase] ❌ Vacate details loading failed:', err.message);
    throw err;
  }
}

// Export vacate details as CSV download
async function exportVacateDetailsCSV() {
  try {
    showToast('Fetching vacate details...', 'info');
    const rows = await loadVacateDetailsFromDB();
    if (!rows || rows.length === 0) {
      showToast('No vacate records found.', 'warning');
      return;
    }
    const headers = ['ID','Tenant Name','Mobile','Email','DOB','Occupation','Company/College','Room No','Join Date','Vacate Date','Security Deposit','Rent','ID Proof','ID Number','Emergency Contact','Created At'];
    const csvRows = rows.map(r => [
      r.id || '',
      r.Tenant_Name || '',
      r.Mobile_No || '',
      r.Email || '',
      r.DOB || '',
      r.Occupation || '',
      r.CompanyCollegeName || '',
      r.Room_No || '',
      r.DOJ || '',
      r.VacateDate || '',
      r.SecurityDeposit || '',
      r.Rent || '',
      r.IDProof || '',
      r.IDNumber || '',
      r.EmergencyContact || '',
      r.created_at || ''
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...csvRows].join('\n');
    downloadCSV(csv, 'vacate_details_' + new Date().toISOString().slice(0,10) + '.csv');
    showToast(`Exported ${rows.length} vacate record(s)!`, 'success');
  } catch (err) {
    showToast('Failed to export vacate details: ' + err.message, 'error');
  }
}

// Delete tenant from PostgreSQL RoomWise_MemberList
async function deleteTenantFromDB(dbId) {
  if (!dbId) throw new Error('No DB ID provided for tenant deletion');
  const queryParams = `id=eq.${dbId}`;
  return await supabaseRequest('RoomWise_MemberList', queryParams, 'DELETE');
}

// Delete room from PostgreSQL TarakRam_RoomDetails
async function deleteRoomFromDB(dbId) {
  if (!dbId) throw new Error('No DB ID provided for room deletion');
  const queryParams = `id=eq.${dbId}`;
  return await supabaseRequest('TarakRam_RoomDetails', queryParams, 'DELETE');
}

// Delete expense from PostgreSQL TarakRam_ExpensesDetails
async function deleteExpenseFromDB(dbId) {
  if (!dbId) throw new Error('No DB ID provided for expense deletion');
  const queryParams = `id=eq.${dbId}`;
  return await supabaseRequest('TarakRam_ExpensesDetails', queryParams, 'DELETE');
}


// Load rooms from Supabase and store in localStorage for seamless use
async function loadRoomsFromDB() {
  if (dbRoomsLoading) return; // Prevent duplicate calls
  dbRoomsLoading = true;
  dbRoomsError = null;

  try {
    console.log('[Supabase] Fetching rooms from TarakRam_RoomDetails...');
    const dbRooms = await fetchDBRooms();

    // Store the DB rooms in localStorage — replaces any hardcoded rooms
    DB.set('rooms', dbRooms);
    dbRoomsLoaded = true;
    dbRoomsLoading = false;

    console.log(`[Supabase] ✅ Loaded ${dbRooms.length} rooms from database`);
    return dbRooms;
  } catch (err) {
    dbRoomsError = err.message;
    dbRoomsLoading = false;
    dbRoomsLoaded = false;
    console.error('[Supabase] ❌ Room loading failed:', err.message);

    // If DB fails, fall back to whatever is already in localStorage
    const fallback = DB.get('rooms');
    if (!fallback || fallback.length === 0) {
      console.warn('[Supabase] No fallback rooms in localStorage either');
    }
    return fallback || [];
  }
}

// Fetch all expenses from TarakRam_ExpensesDetails
async function loadExpensesFromDB() {
  if (dbExpensesLoading) return;
  dbExpensesLoading = true;
  try {
    console.log('[Supabase] Fetching expenses from TarakRam_ExpensesDetails...');
    const rows = await supabaseRequest('TarakRam_ExpensesDetails', 'select=*&order=Date.desc');
    dbExpenses = rows.map(r => ({
      id: r.id,
      txnId: r.TransactionID,
      date: r.Date,
      category: r.Category,
      itemDetails: r.ItemDetails,
      amount: parseFloat(r.Amount) || 0,
      paymentMethod: r.PaymentMethod,
      paidBy: r.PaidBy
    }));
    DB.set('expenses', dbExpenses);
    dbExpensesLoaded = true;
    dbExpensesLoading = false;
    console.log(`[Supabase] ✅ Loaded ${dbExpenses.length} expenses from database`);
    return dbExpenses;
  } catch (err) {
    console.error('[Supabase] ❌ Expenses loading failed:', err.message);
    dbExpensesLoading = false;
    dbExpensesLoaded = false;
    dbExpenses = DB.get('expenses') || [];
    return dbExpenses;
  }
}

// Save a new expense to TarakRam_ExpensesDetails
async function saveNewExpenseToDB(expense) {
  const body = {
    TransactionID: expense.txnId,
    Date: expense.date,
    Category: expense.category,
    ItemDetails: expense.itemDetails,
    Amount: parseFloat(expense.amount) || 0,
    PaymentMethod: expense.paymentMethod,
    PaidBy: expense.paidBy
  };
  const result = await supabaseRequest('TarakRam_ExpensesDetails', '', 'POST', body);
  await loadExpensesFromDB();
  return result;
}

// Update existing expense in TarakRam_ExpensesDetails
async function updateExpenseInDB(dbId, expense) {
  if (!dbId) throw new Error('No DB ID provided for expense update');
  const queryParams = `id=eq.${dbId}`;
  const body = {
    TransactionID: expense.txnId,
    Date: expense.date,
    Category: expense.category,
    ItemDetails: expense.itemDetails,
    Amount: parseFloat(expense.amount) || 0,
    PaymentMethod: expense.paymentMethod,
    PaidBy: expense.paidBy
  };
  const result = await supabaseRequest('TarakRam_ExpensesDetails', queryParams, 'PATCH', body);
  await loadExpensesFromDB();
  return result;
}


// Fetch tenants from Supabase (RoomWise_MemberList) — direct REST API call
async function fetchDBTenants() {
  try {
    const memberRows = await supabaseRequest('RoomWise_MemberList', 'select=*&order=id.asc');
    const rooms = DB.get('rooms') || [];

    // Map DB columns to the format the frontend expects
    const tenants = memberRows.map(row => {
      const tenantRoomId = `R${row.Room_No}`;
      const matchingRoom = rooms.find(r => r.id === tenantRoomId);
      
      // Determine AC/Non-AC type based on room number suffix for fallback rent
      const rNumStr = String(row.Room_No);
      const isAC = rNumStr.endsWith('01') || rNumStr.endsWith('02') || rNumStr.endsWith('.01') || rNumStr.endsWith('.02');
      const fallbackRent = isAC ? 8000 : 6000;
      
      const rent = matchingRoom ? matchingRoom.rent : fallbackRent;

      return {
        id: `T${row.id}`,
        name: row.Tenant_Name,
        mobile: row.Mobile_No || '9999999999',
        email: row.Email || '',
        dob: row.DOB || '',
        occupation: row.Occupation || 'Member',
        company: row.CompanyCollegeName || row.Company || '',
        roomId: tenantRoomId,
        bedNo: 1,
        joinDate: row.DOJ || row.created_at,
        rent: rent,
        deposit: row.SecurityDeposit ? parseFloat(row.SecurityDeposit) : 0,
        emergencyContact: row.EmergencyContact || '',
        status: 'active',
        db_id: row.id
      };
    });

    console.log(`[Supabase] ✅ Fetched ${tenants.length} tenants from RoomWise_MemberList`);
    return tenants;
  } catch (err) {
    console.error('[Supabase] Failed to fetch tenants:', err.message);
    throw err;
  }
}

async function loadTenantsFromDB() {
  try {
    console.log('[Supabase] Fetching tenants from RoomWise_MemberList...');
    const dbTenants = await fetchDBTenants();
    DB.set('tenants', dbTenants);
    console.log(`[Supabase] ✅ Loaded ${dbTenants.length} tenants from database`);
    
    // Also sync payments for DB tenants so Finance & Dues shows updated list
    let payments = DB.get('payments') || [];
    let paymentsModified = false;
    dbTenants.forEach(t => {
      const tenantPayments = payments.filter(p => p.tenantId === t.id);
      if (tenantPayments.length > 0) {
        // Update names in existing payments only — do NOT auto-create pending payments
        tenantPayments.forEach(p => {
          if (p.tenantName !== t.name) {
             p.tenantName = t.name;
             paymentsModified = true;
          }
        });
      }
      // NOTE: Pending payment records are created only when admin explicitly records them
      // via addPaymentModal() — NOT auto-generated on tenant load.
    });

    // Cleanup existing stale auto-generated pending payments for tenants who have NO paid payments
    payments = payments.filter(p => {
      if (p.status === 'pending') {
        const hasPaid = payments.some(x => x.tenantId === p.tenantId && x.status === 'paid');
        if (!hasPaid) {
          paymentsModified = true;
          return false;
        }
      }
      return true;
    });

    if (paymentsModified) {
      DB.set('payments', payments);
    }
    
    return dbTenants;
  } catch (err) {
    console.error('[Supabase] ❌ Tenant loading failed:', err.message);
    return DB.get('tenants') || [];
  }
}

// ===================== SUPABASE VISITS SYNC =====================
async function loadVisitsFromDB() {
  try {
    console.log('[Supabase] Fetching visits from TarakRam_VisitBookings...');
    const rows = await supabaseRequest('TarakRam_VisitBookings', 'select=*&order=date.desc,time.asc');
    const visits = rows.map(row => ({
      id: 'V' + row.id,
      name: row.name,
      mobile: row.mobile,
      date: row.date,
      time: row.time,
      purpose: row.purpose,
      notes: row.notes,
      status: row.status,
      bookedOn: row.booked_on,
      db_id: row.id,
      visitor_id: row.visitor_id
    }));
    DB.set('visits', visits);
    console.log(`[Supabase] ✅ Loaded ${visits.length} visits from database`);
    return visits;
  } catch (err) {
    console.error('[Supabase] ❌ Visit loading failed:', err.message);
    return DB.get('visits') || [];
  }
}

async function saveNewVisitToDB(visit) {
  const body = {
    name: visit.name,
    mobile: visit.mobile,
    date: visit.date,
    time: visit.time,
    purpose: visit.purpose,
    notes: visit.notes,
    status: visit.status,
    booked_on: visit.bookedOn,
    visitor_id: visit.visitor_id
  };
  const res = await supabaseRequest('TarakRam_VisitBookings', '', 'POST', body);
  await loadVisitsFromDB();
  return res;
}

async function updateVisitStatusInDB(dbId, status) {
  const queryParams = `id=eq.${dbId}`;
  const body = { status };
  const res = await supabaseRequest('TarakRam_VisitBookings', queryParams, 'PATCH', body);
  await loadVisitsFromDB();
  return res;
}

// Seed default data if first run
function seedData(){
  if(DB.get('seeded')) return;

  // Admin user
  DB.set('users',[
    {id:'u1',name:'Admin Owner',mobile:'9999999999',role:'admin',pin:'1234',email:'admin@slvpg.com'},
    {id:'u2',name:'Priya Sharma',mobile:'9876543210',role:'tenant',tenantId:'T001',pin:'5678'},
    {id:'u3',name:'Ananya Reddy',mobile:'9876543211',role:'tenant',tenantId:'T002',pin:'5678'},
    {id:'u4',name:'Lakshmi Devi',mobile:'9876543212',role:'tenant',tenantId:'T003',pin:'5678'},
    {id:'u5',name:'Meera Pillai',mobile:'9876543213',role:'tenant',tenantId:'T004',pin:'5678'},
  ]);

  // Rooms: Will be loaded from PostgreSQL (TarakRam_RoomDetails)
  // Initialize with empty array — loadRoomsFromDB() will populate this
  DB.set('rooms', []);

  // Tenants
  DB.set('tenants',[
    {id:'T001',name:'Priya Sharma',mobile:'9876543210',email:'priya@email.com',
     roomId:'R101',bedNo:1,joinDate:'2025-01-15',rent:8000,deposit:16000,
     noticePeriod:30,emergencyContact:'Rahul Sharma - 9898989898',
     idProof:'Aadhar',idNumber:'XXXX-XXXX-1234',occupation:'Software Engineer',
     company:'TCS Hyderabad',dob:'1998-03-12',status:'active'},
    {id:'T002',name:'Ananya Reddy',mobile:'9876543211',email:'ananya@email.com',
     roomId:'R101',bedNo:2,joinDate:'2025-02-01',rent:8000,deposit:16000,
     noticePeriod:30,emergencyContact:'Sita Reddy - 9797979797',
     idProof:'Passport',idNumber:'P1234567',occupation:'MBA Student',
     company:'JNTU Hyderabad',dob:'2000-07-22',status:'active'},
    {id:'T003',name:'Lakshmi Devi',mobile:'9876543212',email:'lakshmi@email.com',
     roomId:'R101',bedNo:3,joinDate:'2025-01-20',rent:8000,deposit:16000,
     noticePeriod:30,emergencyContact:'Ravi Devi - 9696969696',
     idProof:'Voter ID',idNumber:'VID123456',occupation:'Teacher',
     company:'Kendriya Vidyalaya',dob:'1995-11-05',status:'active'},
    {id:'T004',name:'Meera Pillai',mobile:'9876543213',email:'meera@email.com',
     roomId:'R101',bedNo:4,joinDate:'2025-03-10',rent:8000,deposit:16000,
     noticePeriod:30,emergencyContact:'Kumar Pillai - 9595959595',
     idProof:'Aadhar',idNumber:'XXXX-XXXX-5678',occupation:'Data Analyst',
     company:'Infosys',dob:'1997-09-18',status:'active'},
    {id:'T005',name:'Deepa Krishnan',mobile:'9876543214',email:'deepa@email.com',
     roomId:'R102',bedNo:1,joinDate:'2025-02-14',rent:8000,deposit:16000,
     noticePeriod:30,emergencyContact:'Vijay Krishnan - 9494949494',
     idProof:'Aadhar',idNumber:'XXXX-XXXX-9012',occupation:'CA Student',
     company:'ICAI',dob:'2001-04-30',status:'active'},
    {id:'T006',name:'Swathi Nair',mobile:'9876543215',email:'swathi@email.com',
     roomId:'R102',bedNo:2,joinDate:'2025-02-20',rent:8000,deposit:16000,
     noticePeriod:30,emergencyContact:'Suresh Nair - 9393939393',
     idProof:'DL',idNumber:'DL1234567890',occupation:'Nurse',
     company:'Apollo Hospital',dob:'1996-12-08',status:'active'},
    {id:'T007',name:'Radha Patel',mobile:'9876543216',email:'radha@email.com',
     roomId:'R102',bedNo:3,joinDate:'2025-04-01',rent:8000,deposit:16000,
     noticePeriod:30,emergencyContact:'Mohan Patel - 9292929292',
     idProof:'Aadhar',idNumber:'XXXX-XXXX-3456',occupation:'BPO Executive',
     company:'Wipro BPO',dob:'1999-06-25',status:'active'},
    {id:'T008',name:'Asha Gupta',mobile:'9876543217',email:'asha@email.com',
     roomId:'R201',bedNo:1,joinDate:'2025-01-05',rent:6000,deposit:12000,
     noticePeriod:30,emergencyContact:'Raj Gupta - 9191919191',
     idProof:'Aadhar',idNumber:'XXXX-XXXX-7890',occupation:'Bank Employee',
     company:'SBI',dob:'1994-08-14',status:'active'},
    {id:'T009',name:'Divya Menon',mobile:'9876543218',email:'divya@email.com',
     roomId:'R201',bedNo:2,joinDate:'2025-03-25',rent:6000,deposit:12000,
     noticePeriod:30,emergencyContact:'Sunil Menon - 9090909090',
     idProof:'Passport',idNumber:'P9876543',occupation:'IT Professional',
     company:'HCL Technologies',dob:'1998-01-17',status:'active'},
  ]);

  // Finance/Payments
  const months=['2026-01','2026-02','2026-03','2026-04','2026-05'];
  const payments=[];
  let pid=1;
  DB.get('tenants').forEach(t=>{
    months.forEach((m,i)=>{
      const paid = i<4 ? (Math.random()>0.15) : false;
      payments.push({
        id:`P${pid++}`,tenantId:t.id,tenantName:t.name,roomId:t.roomId,
        month:m,amount:t.rent,status:paid?'paid':'pending',
        paidOn:paid?`${m}-0${Math.floor(Math.random()*8+1)}`:'',
        dueDate:`${m}-05`,
        paymentMode:paid?['UPI','Cash','NEFT'][Math.floor(Math.random()*3)]:'',
        txnId:paid?`TXN${Math.random().toString(36).substr(2,9).toUpperCase()}`:''
      });
    });
  });
  DB.set('payments',payments);

  // Notifications
  DB.set('notifications',[
    {id:'N1',type:'due',title:'Rent Due Reminder',message:'Rent for May 2026 is due on 5th May for 3 tenants.',date:'2026-05-01',read:false,to:'admin'},
    {id:'N2',type:'join',title:'New Tenant Joined',message:'Divya Menon joined Room 201 on 25-Mar-2026.',date:'2026-03-25',read:true,to:'admin'},
    {id:'N3',type:'due',title:'Your Rent is Due',message:'Your rent of ₹8,000 for May 2026 is pending. Please pay by 5th May.',date:'2026-05-01',read:false,to:'T001'},
    {id:'N4',type:'review',title:'New Review Pending',message:'A guest has submitted a review pending your approval.',date:'2026-05-10',read:false,to:'admin'},
    {id:'N5',type:'visit',title:'Visit Scheduled',message:'Preethi has booked a site visit on 20-May-2026 at 11:00 AM.',date:'2026-05-18',read:false,to:'admin'},
  ]);

  // Documents
  DB.set('documents',[
    {id:'D1',tenantId:'T001',tenantName:'Priya Sharma',type:'Aadhar Card',fileName:'priya_aadhar.pdf',uploadDate:'2025-01-15',verified:true},
    {id:'D2',tenantId:'T001',tenantName:'Priya Sharma',type:'Photo',fileName:'priya_photo.jpg',uploadDate:'2025-01-15',verified:true},
    {id:'D3',tenantId:'T002',tenantName:'Ananya Reddy',type:'Passport',fileName:'ananya_passport.pdf',uploadDate:'2025-02-01',verified:true},
    {id:'D4',tenantId:'T002',tenantName:'Ananya Reddy',type:'Photo',fileName:'ananya_photo.jpg',uploadDate:'2025-02-01',verified:false},
    {id:'D5',tenantId:'T003',tenantName:'Lakshmi Devi',type:'Voter ID',fileName:'lakshmi_voterid.pdf',uploadDate:'2025-01-20',verified:true},
  ]);

  // Reviews
  DB.set('reviews',[
    {id:'Rev1',name:'Sneha K',mobile:'9876543219',rating:5,comment:'Excellent facilities! Very safe and clean. The staff is very helpful. Highly recommended for working women.',date:'2026-04-15',status:'approved'},
    {id:'Rev2',name:'Pooja M',mobile:'9876543220',rating:4,comment:'Good accommodation with all basic amenities. Food is tasty. Location is convenient near metro.',date:'2026-04-20',status:'approved'},
    {id:'Rev3',name:'Kavya R',mobile:'9876543221',rating:5,comment:'Best PG in Hyderabad for women! Very secure with CCTV and biometric entry. Highly recommend!',date:'2026-05-02',status:'pending'},
    {id:'Rev4',name:'Nisha P',mobile:'9876543222',rating:3,comment:'Average facilities. WiFi could be better. Otherwise clean and safe.',date:'2026-05-12',status:'pending'},
  ]);

  // Visit bookings
  DB.set('visits',[
    {id:'V1',name:'Preethi S',mobile:'9876500001',date:'2026-05-20',time:'11:00',purpose:'Check room availability',status:'confirmed'},
    {id:'V2',name:'Ranjitha K',mobile:'9876500002',date:'2026-05-22',time:'14:00',purpose:'Interested in joining',status:'pending'},
  ]);

  DB.set('seeded',true);
}

// ---- Helper functions ----
function genId(prefix){ return prefix+(Date.now().toString(36)+Math.random().toString(36).substr(2,4)).toUpperCase(); }

function getRoomOccupancy(){
  const rooms=DB.get('rooms')||[];
  const tenants=DB.get('tenants')||[];
  return rooms.map(r=>{
    const count = r.members ? r.members.length : tenants.filter(t=>t.roomId===r.id&&t.status==='active').length;
    return {...r,occupied:count};
  });
}

function getPendingDues(){
  const payments=DB.get('payments')||[];
  return payments.filter(p=>p.status==='pending');
}

function getTenantPayments(tenantId){
  return (DB.get('payments')||[]).filter(p=>p.tenantId===tenantId);
}

function getUnreadNotifications(role,tenantId){
  return (DB.get('notifications')||[]).filter(n=>{
    if(role==='admin') return n.to==='admin';
    return n.to===tenantId||n.to==='all';
  }).filter(n=>!n.read);
}

// Get next auto-increment ID for TarakRam_LoginMaster_Data (DB has no sequence)
async function getNextLoginMasterId() {
  try {
    const res = await supabaseRequest('TarakRam_LoginMaster_Data', 'select=id&order=id.desc&limit=1');
    if (res && res.length > 0) {
      return parseInt(res[0].id) + 1;
    }
    return 1;
  } catch (err) {
    console.error('Failed to get next login master ID:', err);
    return null;
  }
}

function getUserTenantId(user) {
  if (!user) return null;
  if (user.role === 'tenant' && user.tenantId) return user.tenantId;
  if (user.tenantId) return user.tenantId;
  
  const tenants = DB.get('tenants') || [];
  const uName = (user.name || '').trim().toLowerCase();
  const uMobile = (user.mobile || '').replace(/\D/g, '');
  const dbRecord = user.dbRecord || {};
  const dbUser = (dbRecord.userName || '').trim().toLowerCase();
  const dbMobile = (dbRecord.mobile_Number || '').replace(/\D/g, '');

  const nameToMatch = uName || dbUser;
  const mobileToMatch = uMobile || dbMobile;

  if (!nameToMatch && !mobileToMatch) return null;

  // 1. Both name and mobile match
  let match = tenants.find(t => {
    const tName = (t.name || '').trim().toLowerCase();
    const tMobile = (t.mobile || '').replace(/\D/g, '');
    return nameToMatch && tName === nameToMatch && mobileToMatch && tMobile === mobileToMatch;
  });

  // 2. Name matches
  if (!match && nameToMatch) {
    match = tenants.find(t => {
      const tName = (t.name || '').trim().toLowerCase();
      return tName === nameToMatch;
    });
  }

  // 3. Mobile matches
  if (!match && mobileToMatch) {
    match = tenants.find(t => {
      const tMobile = (t.mobile || '').replace(/\D/g, '');
      return tMobile === mobileToMatch;
    });
  }

  return match ? match.id : null;
}

// ===================== DYNAMIC NOTIFICATIONS DATABASE SYNC =====================
async function loadNotificationsFromDB() {
  try {
    console.log('[Supabase] Fetching notifications from TarakRam_Notifications...');
    const rows = await supabaseRequest('TarakRam_Notifications', 'select=*&order=id.desc');
    
    // If database table is empty, seed it with defaults
    if (rows.length === 0) {
      console.log('[Supabase] Database notifications empty. Seeding defaults...');
      const defaults = [
        {type:'due',title:'Rent Due Reminder',message:'Rent for May 2026 is due on 5th May for 3 tenants.',date:'2026-05-01',read:false,to_user:'admin'},
        {type:'join',title:'New Tenant Joined',message:'Divya Menon joined Room 201 on 25-Mar-2026.',date:'2026-03-25',read:true,to_user:'admin'},
        {type:'due',title:'Your Rent is Due',message:'Your rent of ₹8,000 for May 2026 is pending. Please pay by 5th May.',date:'2026-05-01',read:false,to_user:'T001'},
        {type:'review',title:'New Review Pending',message:'A guest has submitted a review pending your approval.',date:'2026-05-10',read:false,to_user:'admin'},
        {type:'visit',title:'Visit Scheduled',message:'Preethi has booked a site visit on 20-May-2026 at 11:00 AM.',date:'2026-05-18',read:false,to_user:'admin'},
      ];
      // Save all defaults to DB
      for (const d of defaults) {
        await supabaseRequest('TarakRam_Notifications', '', 'POST', d);
      }
      // Re-fetch
      const seededRows = await supabaseRequest('TarakRam_Notifications', 'select=*&order=id.desc');
      return mapDBNotifications(seededRows);
    }

    return mapDBNotifications(rows);
  } catch (err) {
    console.error('[Supabase] ❌ Notifications loading failed:', err.message);
    return DB.get('notifications') || [];
  }
}

function mapDBNotifications(rows) {
  const mapped = rows.map(r => ({
    id: 'N' + r.id,
    type: r.type,
    title: r.title,
    message: r.message,
    date: r.date,
    read: r.read,
    to: r.to_user,
    db_id: r.id
  }));
  DB.set('notifications', mapped);
  return mapped;
}

async function saveNewNotificationToDB(notif) {
  const body = {
    type: notif.type,
    title: notif.title,
    message: notif.message,
    date: notif.date || new Date().toISOString().slice(0, 10),
    read: notif.read || false,
    to_user: notif.to
  };
  const res = await supabaseRequest('TarakRam_Notifications', '', 'POST', body);
  await loadNotificationsFromDB();
  return res;
}

async function updateNotificationReadStatusInDB(dbId, readStatus) {
  const queryParams = `id=eq.${dbId}`;
  const body = { read: readStatus };
  const res = await supabaseRequest('TarakRam_Notifications', queryParams, 'PATCH', body);
  await loadNotificationsFromDB();
  return res;
}

seedData();
