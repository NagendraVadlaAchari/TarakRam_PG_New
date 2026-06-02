// ===================== ROOMS MODULE =====================
function renderRoomsPage(){
  const user = getCurrentUser();
  const rooms = getRoomOccupancy();
  const floors = [...new Set(rooms.map(r=>r.floor))].sort((a,b)=>a-b);
  const totalRooms = rooms.length;
  const totalBeds = rooms.reduce((s,r)=>s+r.beds,0);
  const occupiedBeds = rooms.reduce((s,r)=>s+r.occupied,0);
  const vacantBeds = totalBeds - occupiedBeds;

  // Show DB connection status
  const dbStatusBadge = dbRoomsLoaded 
    ? ``
    : dbRoomsError
    ? `<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(239,68,68,.15);color:#ef4444;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600"><i class="fas fa-exclamation-triangle"></i> DB Error — Using cache</span>`
    : dbRoomsLoading
    ? `<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(245,158,11,.15);color:#f59e0b;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600"><i class="fas fa-spinner fa-spin"></i> Loading from DB...</span>`
    : `<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(100,116,139,.15);color:#64748b;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600"><i class="fas fa-hdd"></i> Local Data</span>`;

  // Loading state
  if (dbRoomsLoading && rooms.length === 0) {
    return `
    <div class="page-header">
      <h1><i class="fas fa-building" style="color:var(--primary-light)"></i> Rooms &amp; Occupancy</h1>
      <p>Loading room data from PostgreSQL...</p>
    </div>
    <div class="card" style="text-align:center;padding:60px 20px">
      <i class="fas fa-spinner fa-spin" style="font-size:48px;color:var(--primary-light);margin-bottom:16px"></i>
      <h3 style="color:var(--text2);margin-bottom:8px">Fetching rooms from database...</h3>
      <p style="color:var(--text3);font-size:13px">Connecting to PostgreSQL (TarakRam_RoomDetails)</p>
    </div>`;
  }

  // Error state with no data
  if (dbRoomsError && rooms.length === 0) {
    return `
    <div class="page-header">
      <h1><i class="fas fa-building" style="color:var(--primary-light)"></i> Rooms &amp; Occupancy</h1>
      <p>Could not load rooms from database</p>
    </div>
    <div class="card" style="text-align:center;padding:60px 20px">
      <i class="fas fa-exclamation-triangle" style="font-size:48px;color:var(--danger);margin-bottom:16px"></i>
      <h3 style="color:var(--danger);margin-bottom:8px">Database Connection Error</h3>
      <p style="color:var(--text3);font-size:13px;margin-bottom:16px">${dbRoomsError}</p>
      <button class="btn btn-primary" onclick="retryLoadRooms()"><i class="fas fa-redo"></i> Retry Connection</button>
    </div>`;
  }

  return `
  <div class="page-header">
    <h1><i class="fas fa-building" style="color:var(--primary-light)"></i> Rooms &amp; Occupancy</h1>
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <p>${totalRooms} Rooms · ${totalBeds} Beds Total</p>
      ${dbStatusBadge}
    </div>
  </div>
  <div class="stats-grid" style="grid-template-columns:repeat(5,1fr)">
    <div class="stat-card purple"><div class="stat-icon purple"><i class="fas fa-building"></i></div><div class="stat-value">${totalRooms}</div><div class="stat-label">Total Rooms</div></div>
    <div class="stat-card pink"><div class="stat-icon pink"><i class="fas fa-bed"></i></div><div class="stat-value">${totalBeds}</div><div class="stat-label">Total Beds</div></div>
    <div class="stat-card green"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div><div class="stat-value">${vacantBeds}</div><div class="stat-label">Vacant Beds</div></div>
    <div class="stat-card amber"><div class="stat-icon amber"><i class="fas fa-users"></i></div><div class="stat-value">${occupiedBeds}</div><div class="stat-label">Occupied Beds</div></div>
    <div class="stat-card blue"><div class="stat-icon blue"><i class="fas fa-percent"></i></div><div class="stat-value">${totalBeds > 0 ? Math.round(occupiedBeds/totalBeds*100) : 0}%</div><div class="stat-label">Occupancy Rate</div></div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-title"><i class="fas fa-th"></i> Floor-wise Room Map</div>
      <div style="display:flex;gap:12px;margin-bottom:14px;font-size:12px;color:var(--text3);">
        <span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;background:rgba(16,185,129,.3);border-radius:3px;display:inline-block"></span>Available</span>
        <span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;background:rgba(239,68,68,.3);border-radius:3px;display:inline-block"></span>Full</span>
        <span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;background:rgba(245,158,11,.3);border-radius:3px;display:inline-block"></span>Partial</span>
      </div>
      <div class="floor-grid">
        ${floors.length > 0 ? floors.map(f=>{
          const floorRooms = rooms.filter(r=>r.floor===f);
          return `<div class="floor-row">
            <div class="floor-label">Floor ${f}</div>
            <div class="rooms-row">
              ${floorRooms.map(r=>{
                const cls = r.occupied===0?'available':r.occupied===r.beds?'occupied':'partial';
                return `<div class="room-cell ${cls}" onclick="showRoomDetail('${r.id}')" title="Room ${r.number} - ${r.occupied}/${r.beds} occupied">
                  <span class="rnum">${r.number}</span>
                  <span class="rocc">${r.occupied}/${r.beds}</span>
                </div>`;
              }).join('')}
            </div>
          </div>`;
        }).join('') : `<div style="text-align:center;padding:20px;color:var(--text3)"><i class="fas fa-info-circle"></i> No rooms loaded yet</div>`}
      </div>
    </div>

    <div class="card">
      <div class="card-title"><i class="fas fa-list"></i> Room Details <span style="font-size:11px;font-weight:400;color:var(--text3);margin-left:6px">(from TarakRam_RoomDetails)</span></div>
      <div class="table-wrap" style="max-height: 400px; overflow-y: auto;">
        <table>
          <thead><tr><th>Room</th><th>Floor</th><th>Type</th><th>Beds</th><th>Occupied</th><th>Rent/Bed</th><th>Status</th></tr></thead>
          <tbody>
            ${rooms.length > 0 ? rooms.map(r=>{
              const vacant = r.beds - r.occupied;
              const cls = r.occupied===0?'badge-success':r.occupied===r.beds?'badge-danger':'badge-warning';
              const lbl = r.occupied===0?'Vacant':r.occupied===r.beds?'Full':`${vacant} Vacant`;
              return `<tr onclick="showRoomDetail('${r.id}')" style="cursor:pointer">
                <td><strong>${r.number}</strong></td>
                <td>${r.floor}</td>
                <td>${r.type}</td>
                <td>${r.beds}</td>
                <td><div class="progress-bar" style="width:80px"><div class="progress-fill" style="width:${r.beds > 0 ? r.occupied/r.beds*100 : 0}%;background:${r.occupied===r.beds?'var(--danger)':r.occupied===0?'var(--success)':'var(--accent)'}"></div></div></td>
                <td>₹${r.rent.toLocaleString()}</td>
                <td><span class="badge ${cls}">${lbl}</span></td>
              </tr>`;
            }).join('') : `<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:20px">No rooms found in database</td></tr>`}
          </tbody>
        </table>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        ${user.role==='admin'?`<button class="btn btn-secondary btn-sm" onclick="showAllRooms()"><i class="fas fa-expand"></i> View All Rooms</button>`:''}
        <button class="btn btn-secondary btn-sm" onclick="retryLoadRooms()" style="margin-left:auto"><i class="fas fa-sync-alt"></i> Refresh from DB</button>
      </div>
    </div>
  </div>
  ${user.role==='admin'?`
  <div class="card" style="margin-top:20px">
    <div class="card-title"><i class="fas fa-plus-circle"></i> Room Management</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="showAddRoomModal()"><i class="fas fa-plus"></i> Add Room</button>
      <button class="btn btn-secondary" onclick="exportRooms()"><i class="fas fa-download"></i> Export Report</button>
    </div>
  </div>`:''}`; 
}

// Retry loading data from PostgreSQL
async function retryLoadRooms() {
  showToast('Refreshing data from database...', 'info');
  await loadRoomsFromDB();
  await loadTenantsFromDB();
  navigateTo('rooms');
  if (dbRoomsLoaded) {
    showToast('Data refreshed from PostgreSQL!', 'success');
  } else {
    showToast('Could not connect to database', 'error');
  }
}

function showRoomDetail(roomId){
  const rooms = getRoomOccupancy();
  const room = rooms.find(r=>r.id===roomId);
  if(!room) return;
  const members = room.members || [];
  const beds = Array.from({length:room.beds},(_, i)=>i+1);
  const user = getCurrentUser();
  const isGuest = user.role === 'guest';

  const footerBtn = user.role === 'admin'
    ? `<div class="modal-footer" style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="closeModal()">Close</button>
        <button class="btn btn-danger" onclick="deleteRoom('${room.id}')" title="Delete Room"><i class="fas fa-trash"></i> Delete Room</button>
        <button class="btn btn-primary" onclick="showEditRoomModal('${room.id}')"><i class="fas fa-edit"></i> Edit Room</button>
       </div>`
    : `<div class="modal-footer" style="margin-top:16px;display:flex;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="closeModal()">Close</button>
       </div>`;

  showModal(`Room ${room.number} Details`, `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div style="background:var(--bg3);border-radius:10px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:700;color:var(--primary-light)">${room.floor}</div><div style="font-size:12px;color:var(--text3)">Floor</div></div>
      <div style="background:var(--bg3);border-radius:10px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:700;color:var(--success)">${room.beds-room.occupied}</div><div style="font-size:12px;color:var(--text3)">Vacant Beds</div></div>
      <div style="background:var(--bg3);border-radius:10px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:700;color:var(--accent)">${room.type}</div><div style="font-size:12px;color:var(--text3)">Type</div></div>
      <div style="background:var(--bg3);border-radius:10px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:700;color:var(--text)">₹${room.rent.toLocaleString()}</div><div style="font-size:12px;color:var(--text3)">Rent/Bed</div></div>
    </div>
    <div class="card-title"><i class="fas fa-bed"></i> Bed Allocation</div>
    ${beds.map(b=>{
      const member = members[b-1];
      const action = member ? `<span class="badge badge-danger">Occupied</span>` :
        (isGuest ? `<button class="btn btn-primary btn-sm" onclick="closeModal(); startBookingFlow('${room.id}', ${b})"><i class="fas fa-key"></i> Book Bed</button>` :
        `<span class="badge badge-success">Free</span>`);
      return `<div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border-radius:10px;margin-bottom:6px">
        <div style="width:32px;height:32px;border-radius:8px;background:${member?'rgba(239,68,68,.2)':'rgba(16,185,129,.2)'};display:flex;align-items:center;justify-content:center;color:${member?'var(--danger)':'var(--success)'};font-weight:700">${b}</div>
        <div style="flex:1">${member?`<strong>${member.Tenant_Name}</strong><br><span style="font-size:12px;color:var(--text3)">Member</span>`:'<span style="color:var(--success)">Vacant</span>'}</div>
        ${action}
      </div>`;
    }).join('')}
    ${footerBtn}
  `, false);
}

function showEditRoomModal(roomId){
  const rooms = getRoomOccupancy();
  const room = rooms.find(r=>r.id===roomId);
  if(!room) return;

  showModal(`Edit Room ${room.number}`,`
    <div class="form-row">
      <div class="form-group"><label class="form-label">Room Number</label><input class="form-control" id="mre-num" value="${room.number}" /></div>
      <div class="form-group"><label class="form-label">Floor</label><input class="form-control" id="mre-floor" type="number" min="1" max="20" value="${room.floor}" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">No. of Beds</label><input class="form-control" id="mre-beds" type="number" min="1" max="10" value="${room.beds}" /></div>
      <div class="form-group"><label class="form-label">Type</label><select class="form-control" id="mre-type"><option ${room.type==='AC'?'selected':''}>AC</option><option ${room.type==='Non-AC'?'selected':''}>Non-AC</option></select></div>
    </div>
    <div class="form-group"><label class="form-label">Rent per Bed (₹)</label><input class="form-control" id="mre-rent" type="number" value="${room.rent}" /></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="showRoomDetail('${roomId}')">Back</button>
      <button class="btn btn-success" onclick="updateRoom('${roomId}')"><i class="fas fa-save"></i> Save Changes</button>
    </div>`,false);
}

async function updateRoom(roomId){
  const rooms = DB.get('rooms') || [];
  const room = rooms.find(r => r.id === roomId);
  if (!room) return;

  const originalRoomNo = room.number;
  const num = document.getElementById('mre-num').value.trim();
  const floor = parseInt(document.getElementById('mre-floor').value);
  const beds = parseInt(document.getElementById('mre-beds').value);
  const type = document.getElementById('mre-type').value;
  const rent = parseInt(document.getElementById('mre-rent').value);

  if(!num || !floor || !beds || !rent){ showToast('Fill all fields','error'); return; }

  showToast('Updating room in database...', 'info');

  try {
    // 1. Sync to remote PostgreSQL — now includes Room_Rent
    await updateRoomInDB(room.db_id, originalRoomNo, num, floor, beds, rent);

    // 2. Sync local memory
    room.number = num;
    room.floor = floor;
    room.beds = beds;
    room.type = type;
    room.rent = rent;
    room.id = `R${num}`;

    DB.set('rooms', rooms);
    closeModal();
    showToast('Room details updated in PostgreSQL!','success');
    navigateTo('rooms');
  } catch (err) {
    console.error('Update room error:', err);
    showToast(`Failed to update room in DB: ${err.message}`, 'error');
  }
}

function showAddRoomModal(){
  showModal('Add New Room',`
    <div class="form-row">
      <div class="form-group"><label class="form-label">Room Number</label><input class="form-control" id="mr-num" placeholder="e.g. 701" /></div>
      <div class="form-group"><label class="form-label">Floor</label><input class="form-control" id="mr-floor" type="number" min="1" max="20" placeholder="Floor number" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">No. of Beds</label><input class="form-control" id="mr-beds" type="number" value="4" min="1" max="10" /></div>
      <div class="form-group"><label class="form-label">Type</label><select class="form-control" id="mr-type"><option>AC</option><option>Non-AC</option></select></div>
    </div>
    <div class="form-group"><label class="form-label">Rent per Bed (₹)</label><input class="form-control" id="mr-rent" type="number" placeholder="e.g. 8000" /></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="addRoom()"><i class="fas fa-plus"></i> Add Room</button>
    </div>`,false);
}

async function addRoom(){
  const num=document.getElementById('mr-num').value.trim();
  const floor=parseInt(document.getElementById('mr-floor').value);
  const beds=parseInt(document.getElementById('mr-beds').value);
  const type=document.getElementById('mr-type').value;
  const rent=parseInt(document.getElementById('mr-rent').value);
  if(!num||!floor||!beds||!rent){ showToast('Fill all fields','error'); return; }

  showToast('Saving new room to database...', 'info');

  try {
    // 1. Sync to remote PostgreSQL — now includes Room_Rent
    const res = await saveNewRoomToDB(num, floor, beds, rent);
    const db_id = res && res[0] ? res[0].id : Date.now();

    // 2. Update local storage
    const rooms=DB.get('rooms')||[];
    rooms.push({id:`R${num}`,number:num,floor,beds,occupied:0,type,rent,db_id});
    DB.set('rooms',rooms);

    closeModal();
    showToast('Room saved to PostgreSQL!','success');
    navigateTo('rooms');
  } catch (err) {
    console.error('Save room error:', err);
    showToast(`Failed to save room in DB: ${err.message}`, 'error');
  }
}

async function deleteRoom(roomId) {
  const rooms = DB.get('rooms') || [];
  const room = rooms.find(r => r.id === roomId);
  if (!room) return;
  
  // Check if room has occupants
  const occupancy = getRoomOccupancy();
  const r = occupancy.find(x => x.id === roomId);
  if (r && r.occupied > 0) {
    showToast(`Cannot delete Room ${room.number} — it has ${r.occupied} occupant(s). Vacate all tenants first.`, 'error');
    return;
  }
  
  if (!confirm(`Are you sure you want to permanently delete Room ${room.number}? This cannot be undone.`)) return;
  
  closeModal();
  showToast('Deleting room from database...', 'info');
  
  try {
    if (room.db_id) {
      await deleteRoomFromDB(room.db_id);
    }
    const updatedRooms = rooms.filter(r => r.id !== roomId);
    DB.set('rooms', updatedRooms);
    showToast(`Room ${room.number} deleted successfully!`, 'success');
    navigateTo('rooms');
  } catch (err) {
    console.error('Delete room error:', err);
    showToast(`Failed to delete room: ${err.message}`, 'error');
  }
}


function showAllRooms(){
  const rooms = getRoomOccupancy();
  showModal('All Rooms',`
    <div class="table-wrap">
      <table>
        <thead><tr><th>Room</th><th>Floor</th><th>Type</th><th>Occupied</th><th>Vacant</th><th>Rent</th></tr></thead>
        <tbody>${rooms.map(r=>`
          <tr><td><strong>${r.number}</strong></td><td>${r.floor}</td><td>${r.type}</td>
          <td>${r.occupied}/${r.beds}</td><td>${r.beds-r.occupied}</td><td>₹${r.rent.toLocaleString()}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>`);
}

function exportRooms(){
  const rooms = getRoomOccupancy();
  let csv='Room,Floor,Type,Beds,Occupied,Vacant,Rent/Bed\n';
  rooms.forEach(r=>{ csv+=`${r.number},${r.floor},${r.type},${r.beds},${r.occupied},${r.beds-r.occupied},${r.rent}\n`; });
  downloadCSV(csv,'slvpg_rooms.csv');
  showToast('Report downloaded!','success');
}

// ===================== GUEST BOOKING ENGINE =====================
let bookingPreSelect = null;

function startBookingFlow(roomId, bedNo){
  bookingPreSelect = { roomId, bedNo };
  navigateTo('booking');
}

function renderBookingPage(){
  const rooms = getRoomOccupancy();
  const vacantRooms = rooms.filter(r=>r.occupied<r.beds);
  
  let selRoomId = '';
  let selBedNo = '';
  if(bookingPreSelect){
    selRoomId = bookingPreSelect.roomId;
    selBedNo = bookingPreSelect.bedNo;
  } else if(vacantRooms.length > 0){
    selRoomId = vacantRooms[0].id;
  }
  
  const selectedRoom = rooms.find(r=>r.id===selRoomId);
  const totalBeds = selectedRoom ? selectedRoom.beds : 0;
  const tenants = (DB.get('tenants')||[]).filter(t=>t.roomId===selRoomId&&t.status==='active');
  
  const beds = [];
  for(let i=1; i<=totalBeds; i++){
    if(!tenants.some(t=>t.bedNo===i)){
      beds.push(i);
    }
  }
  
  const rent = selectedRoom ? selectedRoom.rent : 0;
  const deposit = rent * 2;
  const totalDue = rent + deposit;
  
  return `
  <div class="page-header">
    <h1><i class="fas fa-key" style="color:var(--primary-light)"></i> Book a Room</h1>
    <p>Select your room, bed preference, and complete safe onboarding instantly.</p>
  </div>
  
  <div class="grid-2">
    <!-- Onboarding Form -->
    <div class="card">
      <div class="card-title"><i class="fas fa-user-edit"></i> 1. Onboarding Details</div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Full Name *</label><input class="form-control" id="bk-name" placeholder="Priya Sharma" /></div>
        <div class="form-group"><label class="form-label">Mobile Number *</label><input class="form-control" id="bk-mobile" placeholder="9876543210" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Email Address *</label><input class="form-control" id="bk-email" type="email" placeholder="priya@example.com" /></div>
        <div class="form-group"><label class="form-label">Occupation *</label><input class="form-control" id="bk-occupation" placeholder="Software Engineer / Student" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Join Date *</label><input class="form-control" id="bk-join-date" type="date" value="${new Date().toISOString().slice(0, 10)}" /></div>
        <div class="form-group"><label class="form-label">Emergency Contact *</label><input class="form-control" id="bk-emergency" placeholder="Name - Relationship (Ph)" /></div>
      </div>
    </div>
    
    <!-- Room & Bed Selection -->
    <div>
      <div class="card" style="margin-bottom: 16px">
        <div class="card-title"><i class="fas fa-bed"></i> 2. Room & Bed Choice</div>
        
        <div class="form-group">
          <label class="form-label">Select Room</label>
          <select class="form-control" id="bk-room-select" onchange="onBookingRoomChange()">
            ${vacantRooms.map(r => `<option value="${r.id}" ${r.id === selRoomId ? 'selected' : ''}>Room ${r.number} (${r.type} · Rent ₹${r.rent.toLocaleString()}/bed) — ${r.beds - r.occupied} vacant</option>`).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Select Vacant Bed</label>
          <select class="form-control" id="bk-bed-select">
            ${beds.map(b => `<option value="${b}" ${b == selBedNo ? 'selected' : ''}>Bed No. ${b}</option>`).join('')}
          </select>
        </div>
      </div>
      
      <!-- Financial Summary & Checkout -->
      <div class="card">
        <div class="card-title"><i class="fas fa-receipt"></i> 3. Booking Summary</div>
        
        <div style="font-size: 13px; margin-bottom: 12px">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px">
            <span style="color: var(--text3)">Monthly Bed Rent:</span>
            <strong style="color: var(--text)">₹${rent.toLocaleString()}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px">
            <span style="color: var(--text3)">Security Deposit (refundable):</span>
            <strong style="color: var(--text)">₹${deposit.toLocaleString()}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px dashed var(--border); padding-top: 10px; margin-top: 8px">
            <span style="font-weight: 600; color: var(--text)">Total Due Now:</span>
            <strong style="font-size: 16px; color: var(--success)">₹${totalDue.toLocaleString()}</strong>
          </div>
        </div>
        
        <button class="btn btn-primary" style="width: 100%; justify-content: center" onclick="executeRoomBooking()"><i class="fas fa-lock"></i> Secure &amp; Pay Deposit</button>
      </div>
    </div>
  </div>`;
}

function onBookingRoomChange(){
  const roomId = document.getElementById('bk-room-select').value;
  bookingPreSelect = { roomId, bedNo: '' };
  navigateTo('booking');
}

function executeRoomBooking(){
  const name = document.getElementById('bk-name').value.trim();
  const mobile = document.getElementById('bk-mobile').value.trim();
  const email = document.getElementById('bk-email').value.trim();
  const occupation = document.getElementById('bk-occupation').value.trim();
  const joinDate = document.getElementById('bk-join-date').value;
  const emergency = document.getElementById('bk-emergency').value.trim();
  const roomId = document.getElementById('bk-room-select').value;
  const bedNo = parseInt(document.getElementById('bk-bed-select').value);
  
  if(!name || !mobile || !email || !occupation || !joinDate || !emergency || !roomId || !bedNo){
    showToast('Please fill all onboarding parameters', 'error');
    return;
  }
  
  const rooms = DB.get('rooms') || [];
  const room = rooms.find(r => r.id === roomId);
  if(!room) return;
  
  const rent = room.rent;
  const deposit = rent * 2;
  const totalAmount = rent + deposit;
  
  triggerPaymentGateway(totalAmount, `Deposit & 1st Month Rent — Room ${room.number} Bed ${bedNo}`, (txnId, method) => {
    const tenants = DB.get('tenants') || [];
    const newTenantId = 'T' + Math.floor(1000 + Math.random() * 9000);
    const newTenant = {
      id: newTenantId,
      name,
      mobile,
      email,
      occupation,
      joinDate,
      emergencyContact: emergency,
      roomId,
      bedNo,
      rent,
      deposit,
      status: 'active',
      noticePeriod: 30
    };
    tenants.push(newTenant);
    DB.set('tenants', tenants);
    
    room.occupied = (room.occupied || 0) + 1;
    DB.set('rooms', rooms);
    
    const payments = DB.get('payments') || [];
    const currentMonth = new Date().toISOString().slice(0,7);
    payments.push({
      id: genId('P'),
      tenantId: newTenantId,
      tenantName: name,
      roomId,
      month: currentMonth,
      amount: rent,
      status: 'paid',
      paidOn: new Date().toISOString().slice(0,10),
      dueDate: `${currentMonth}-05`,
      paymentMode: method,
      txnId
    });
    payments.push({
      id: genId('P'),
      tenantId: newTenantId,
      tenantName: name,
      roomId,
      month: 'Deposit',
      amount: deposit,
      status: 'paid',
      paidOn: new Date().toISOString().slice(0,10),
      dueDate: `${currentMonth}-05`,
      paymentMode: method,
      txnId
    });
    DB.set('payments', payments);
    
    addNotification({to: newTenantId, type: 'welcome', title: 'Welcome to SLV PG!', message: 'Your booking has successfully been captured. Enjoy your stay!'});
    addNotification({to: 'admin', type: 'new_tenant', title: 'Automated Booking Successful', message: `${name} has booked Room ${room.number} Bed ${bedNo} via Payment Gateway.`});
    
    const users = DB.get('users') || [];
    users.push({
      mobile,
      otp: '123456',
      role: 'tenant',
      name,
      tenantId: newTenantId
    });
    DB.set('users', users);
    
    const loggedUser = {
      id: newTenantId,
      mobile,
      role: 'tenant',
      name,
      tenantId: newTenantId,
      email
    };
    loginUser(loggedUser);
    
    showToast('Onboarding complete! Redirecting to your dashboard...', 'success');
    
    setTimeout(() => {
      bookingPreSelect = null;
      navigateTo('dashboard');
    }, 1500);
  });
}
