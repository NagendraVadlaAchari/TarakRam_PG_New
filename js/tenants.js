// ===================== TENANTS MODULE =====================
function renderTenantsPage(){
  const user = getCurrentUser();
  if(user.role==='tenant') return renderMyProfile();
  const tenants = DB.get('tenants')||[];
  const active = tenants.filter(t=>t.status==='active');
  const inactive = tenants.filter(t=>t.status!=='active');

  return `
  <div class="page-header">
    <h1><i class="fas fa-users" style="color:var(--secondary)"></i> Tenant Management</h1>
    <p>${active.length} active tenants · ${inactive.length} previous</p>
  </div>
  <div style="display:flex;gap:12px;align-items:center;margin-bottom:20px;flex-wrap:wrap">
    <div class="search-bar" style="flex:1;min-width:200px"><i class="fas fa-search"></i><input class="form-control" id="tenant-search" placeholder="Search tenants..." oninput="filterTenants()" /></div>
    ${user.role==='admin'?`<button class="btn btn-primary" onclick="showAddTenantModal()"><i class="fas fa-user-plus"></i> Add Tenant</button>`:''}
    <button class="btn btn-secondary" onclick="exportTenants()"><i class="fas fa-download"></i> Export</button>
  </div>
  <div class="section-tabs">
    <button class="section-tab active" onclick="switchTenantTab('active',this)">Active (${active.length})</button>
    <button class="section-tab" onclick="switchTenantTab('inactive',this)">Previous (${inactive.length})</button>
  </div>
  <div id="tenants-grid">
    ${renderTenantCards(active)}
  </div>
  `;
}

function renderTenantCards(list){
  if(!list.length) return '<div class="empty-state"><i class="fas fa-users"></i><p>No tenants found</p></div>';
  const rooms = getRoomOccupancy();
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
    ${list.map(t=>{
      const room = rooms.find(r=>r.id===t.roomId);
      const payments = getTenantPayments(t.id);
      const pending = payments.filter(p=>p.status==='pending').length;
      return `<div class="tenant-card" onclick="showTenantDetail('${t.id}')">
        <div class="tenant-header">
          <div class="tenant-avatar">${t.name[0]}</div>
          <div style="flex:1">
            <div style="font-weight:700;color:var(--text);font-size:15px">${t.name}</div>
            <div style="font-size:12px;color:var(--text3)"><i class="fas fa-phone"></i> ${t.mobile}</div>
          </div>
          <span class="badge badge-purple">ID: ${t.id}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:var(--text2)">
          <div><i class="fas fa-building" style="color:var(--primary-light)"></i> Room ${t.roomId.replace('R','')} · Bed ${t.bedNo}</div>
          <div><i class="fas fa-rupee-sign" style="color:var(--success)"></i> ₹${t.rent.toLocaleString()}/mo</div>
          <div><i class="fas fa-briefcase" style="color:var(--info)"></i> ${t.occupation}</div>
          <div><i class="fas fa-calendar" style="color:var(--accent)"></i> ${formatDate(t.joinDate)}</div>
        </div>
        ${pending>0?`<div style="margin-top:10px;padding:6px 10px;background:rgba(239,68,68,.1);border-radius:8px;font-size:12px;color:var(--danger)"><i class="fas fa-exclamation-circle"></i> ${pending} pending payment(s)</div>`:''}
      </div>`;
    }).join('')}
  </div>`;
}

function switchTenantTab(tab, el){
  document.querySelectorAll('.section-tab').forEach(e=>e.classList.remove('active'));
  el.classList.add('active');
  const tenants = DB.get('tenants')||[];
  const list = tenants.filter(t=>tab==='active'?t.status==='active':t.status!=='active');
  document.getElementById('tenants-grid').innerHTML = renderTenantCards(list);
}

function filterTenants(){
  const q = document.getElementById('tenant-search').value.toLowerCase();
  const tenants = (DB.get('tenants')||[]).filter(t=>t.status==='active');
  const filtered = q ? tenants.filter(t=>t.name.toLowerCase().includes(q)||t.mobile.includes(q)||t.roomId.toLowerCase().includes(q)) : tenants;
  document.getElementById('tenants-grid').innerHTML = renderTenantCards(filtered);
}

function showTenantDetail(id){
  const t = (DB.get('tenants')||[]).find(t=>t.id===id);
  if(!t) return;
  const payments = getTenantPayments(id);
  const pending = payments.filter(p=>p.status==='pending');
  const user = getCurrentUser();

  showModal(`${t.name} — Tenant Profile`,`
    <div style="display:flex;gap:14px;align-items:center;margin-bottom:20px;padding:14px;background:linear-gradient(135deg,rgba(124,58,237,.2),rgba(236,72,153,.1));border-radius:12px">
      <div style="width:60px;height:60px;background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;flex-shrink:0">${t.name[0]}</div>
      <div>
        <h3 style="font-size:18px;margin-bottom:4px">${t.name}</h3>
        <p style="font-size:13px;color:var(--text3)">ID: ${t.id} · Room ${t.roomId.replace('R','')} · Bed ${t.bedNo}</p>
      </div>
      <span class="badge badge-success" style="margin-left:auto">${t.status}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;font-size:13px">
      ${detail('Mobile',t.mobile,'phone')}
      ${detail('Email',t.email,'envelope')}
      ${detail('Occupation',t.occupation,'briefcase')}
      ${detail('Company',t.company,'building')}
      ${detail('DOB',t.dob ? formatDate(t.dob) : '','birthday-cake')}
      ${detail('Join Date',t.joinDate ? formatDate(t.joinDate) : '','calendar-plus')}
      ${detail('Rent',t.rent ? `₹${t.rent.toLocaleString()}/month` : '','rupee-sign')}
      ${detail('Deposit',t.deposit ? `₹${t.deposit.toLocaleString()}` : '','shield-alt')}
      ${detail('Notice Period',t.noticePeriod ? `${t.noticePeriod} days` : '','clock')}
      ${detail('ID Proof',(t.idProof && t.idNumber) ? `${t.idProof} - ${t.idNumber}` : (t.idProof || t.idNumber),'id-card')}
      ${detail('Emergency',t.emergencyContact,'phone-alt')}
    </div>
    ${pending.length?`<div style="padding:12px;background:rgba(239,68,68,.1);border-radius:10px;border:1px solid rgba(239,68,68,.2);margin-bottom:12px"><p style="font-size:13px;font-weight:600;color:var(--danger);margin-bottom:6px"><i class="fas fa-exclamation-circle"></i> Pending Dues</p>${pending.map(p=>`<p style="font-size:12px;color:var(--text2)">${p.month} — ₹${p.amount.toLocaleString()}</p>`).join('')}</div>`:''}
    ${user.role==='admin'?`<div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Close</button><button class="btn btn-danger" onclick="vacateTenant('${t.id}')"><i class="fas fa-sign-out-alt"></i> Vacate</button><button class="btn btn-primary" onclick="editTenant('${t.id}')"><i class="fas fa-edit"></i> Edit</button></div>`:
    `<div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Close</button></div>`}
  `,false);
}

function detail(label, val, icon){
  if (val === undefined || val === null || String(val).trim() === '' || String(val).trim() === '—' || String(val).trim() === 'NaN' || String(val).trim() === 'Invalid Date') {
    return '';
  }
  return `<div style="padding:10px;background:var(--bg3);border-radius:8px"><div style="font-size:11px;color:var(--text3);margin-bottom:3px"><i class="fas fa-${icon}"></i> ${label}</div><div style="font-weight:500;color:var(--text)">${val}</div></div>`;
}

function renderMyProfile(){
  const user = getCurrentUser();
  const tenants = DB.get('tenants')||[];
  const t = tenants.find(t=>t.id===user.tenantId);
  if(!t) return `<div class="empty-state"><i class="fas fa-user"></i><p>Profile not found. Contact admin.</p></div>`;
  const payments = getTenantPayments(t.id);
  const paid = payments.filter(p=>p.status==='paid').length;
  const pending = payments.filter(p=>p.status==='pending');

  return `
  <div class="page-header"><h1><i class="fas fa-user-circle" style="color:var(--secondary)"></i> My Profile</h1><p>Tenant ID: ${t.id}</p></div>
  <div class="grid-2">
    <div class="card">
      <div style="text-align:center;padding:16px 0">
        <div style="width:80px;height:80px;background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:#fff;margin:0 auto 16px">${t.name[0]}</div>
        <h2 style="font-size:20px;margin-bottom:4px">${t.name}</h2>
        <p style="font-size:13px;color:var(--text3)">${t.occupation} · ${t.company}</p>
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:center">
          <span class="badge badge-purple">ID: ${t.id}</span>
          <span class="badge badge-success">Active</span>
        </div>
      </div>
      <div style="display:grid;gap:8px;font-size:13px">
        ${detail('Room & Bed',`Room ${t.roomId.replace('R','')} · Bed ${t.bedNo}`,'building')}
        ${detail('Monthly Rent',`₹${t.rent.toLocaleString()}`,'rupee-sign')}
        ${detail('Security Deposit',`₹${t.deposit.toLocaleString()}`,'shield-alt')}
        ${detail('Joined On',formatDate(t.joinDate),'calendar')}
        ${detail('Notice Period',`${t.noticePeriod} days`,'clock')}
      </div>
    </div>
    <div>
      <div class="card">
        <div class="card-title"><i class="fas fa-rupee-sign"></i> Payment Summary</div>
        <div class="stats-grid" style="grid-template-columns:1fr 1fr;gap:10px">
          <div class="stat-card green" style="padding:14px"><div class="stat-value" style="font-size:22px">${paid}</div><div class="stat-label">Months Paid</div></div>
          <div class="stat-card pink" style="padding:14px"><div class="stat-value" style="font-size:22px">${pending.length}</div><div class="stat-label">Pending</div></div>
        </div>
        ${pending.length?`<div style="margin-top:12px;padding:12px;background:rgba(239,68,68,.1);border-radius:10px"><p style="font-size:13px;font-weight:600;color:var(--danger)"><i class="fas fa-exclamation-circle"></i> Pending Dues</p>${pending.map(p=>`<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text2);padding:6px 0"><span>${p.month}</span><span>₹${p.amount.toLocaleString()}</span></div>`).join('')}</div>`:'<div style="text-align:center;padding:12px;color:var(--success)"><i class="fas fa-check-circle"></i> All dues cleared!</div>'}
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-title"><i class="fas fa-history"></i> Payment History</div>
        ${payments.slice(0,5).map(p=>`
          <div class="due-item">
            <div><div style="font-size:13px;font-weight:600">${p.month}</div><div style="font-size:11px;color:var(--text3)">${p.paidOn?`Paid: ${p.paidOn}`:`Due: ${p.dueDate}`}</div></div>
            <div style="text-align:right"><div style="font-size:14px;font-weight:700">₹${p.amount.toLocaleString()}</div><span class="badge ${p.status==='paid'?'badge-success':'badge-danger'}">${p.status}</span></div>
          </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function showAddTenantModal(){
  const rooms = getRoomOccupancy();
  const availableRooms = rooms.filter(r=>r.occupied<r.beds);
  showModal('Add New Tenant',`
    <div class="form-row">
      <div class="form-group"><label class="form-label">Full Name *</label><input class="form-control" id="at-name" placeholder="Tenant full name" /></div>
      <div class="form-group"><label class="form-label">Mobile *</label><input class="form-control" id="at-mobile" type="tel" maxlength="10" placeholder="10-digit mobile" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="at-email" type="email" placeholder="email@example.com" /></div>
      <div class="form-group"><label class="form-label">Date of Birth</label><input class="form-control" id="at-dob" type="date" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Occupation</label><input class="form-control" id="at-occ" placeholder="e.g. Software Engineer" /></div>
      <div class="form-group"><label class="form-label">Company/College</label><input class="form-control" id="at-comp" placeholder="Employer or Institution" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Room *</label>
        <select class="form-control" id="at-room" onchange="updateBeds()">
          <option value="">-- Select Room --</option>
          ${availableRooms.map(r=>`<option value="${r.id}">Room ${r.number} (Floor ${r.floor}) - ${r.beds-r.occupied} beds free - ₹${r.rent}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Bed No *</label>
        <select class="form-control" id="at-bed"><option>Select room first</option></select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Join Date *</label><input class="form-control" id="at-join" type="date" value="${new Date().toISOString().slice(0,10)}" /></div>
      <div class="form-group"><label class="form-label">Monthly Rent (₹) *</label><input class="form-control" id="at-rent" type="number" placeholder="8000" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Security Deposit (₹)</label><input class="form-control" id="at-dep" type="number" placeholder="16000" /></div>
      <div class="form-group"><label class="form-label">Notice Period (days)</label><input class="form-control" id="at-notice" type="number" value="30" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">ID Proof Type</label>
        <select class="form-control" id="at-idtype"><option>Aadhar</option><option>Passport</option><option>Voter ID</option><option>DL</option><option>PAN Card</option></select>
      </div>
      <div class="form-group"><label class="form-label">ID Number</label><input class="form-control" id="at-idnum" placeholder="ID document number" /></div>
    </div>
    <div class="form-group"><label class="form-label">Emergency Contact</label><input class="form-control" id="at-emerg" placeholder="Name & mobile of emergency contact" /></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveTenant()"><i class="fas fa-save"></i> Save Tenant</button>
    </div>`,false);
}

function updateBeds(){
  const roomId = document.getElementById('at-room').value;
  if(!roomId){ document.getElementById('at-bed').innerHTML='<option>Select room first</option>'; return; }
  const rooms = getRoomOccupancy();
  const room = rooms.find(r=>r.id===roomId);
  const tenants = DB.get('tenants')||[];
  const occupied = tenants.filter(t=>t.roomId===roomId&&t.status==='active').map(t=>t.bedNo);
  const freeBeds = Array.from({length:room.beds},(_,i)=>i+1).filter(b=>!occupied.includes(b));
  document.getElementById('at-bed').innerHTML = freeBeds.map(b=>`<option value="${b}">Bed ${b}</option>`).join('');
  document.getElementById('at-rent').value = room.rent;
  document.getElementById('at-dep').value = room.rent*2;
}

function saveTenant(){
  const name=document.getElementById('at-name').value.trim();
  const mobile=document.getElementById('at-mobile').value.trim();
  const email=document.getElementById('at-email').value.trim();
  const dob=document.getElementById('at-dob').value;
  const occ=document.getElementById('at-occ').value.trim();
  const comp=document.getElementById('at-comp').value.trim();
  const roomId=document.getElementById('at-room').value;
  const bedNo=parseInt(document.getElementById('at-bed').value);
  const joinDate=document.getElementById('at-join').value;
  const rent=parseInt(document.getElementById('at-rent').value);
  const deposit=parseInt(document.getElementById('at-dep').value)||rent*2;
  const noticePeriod=parseInt(document.getElementById('at-notice').value)||30;
  const idProof=document.getElementById('at-idtype').value;
  const idNumber=document.getElementById('at-idnum').value.trim();
  const emergencyContact=document.getElementById('at-emerg').value.trim();

  if(!name||!mobile||!roomId||!rent){ showToast('Fill required fields','error'); return; }

  const tenants=DB.get('tenants')||[];
  const id='T'+String(tenants.length+1).padStart(3,'0');
  tenants.push({id,name,mobile,email,dob,occupation:occ,company:comp,roomId,bedNo,joinDate,rent,deposit,noticePeriod,idProof,idNumber,emergencyContact,status:'active'});
  DB.set('tenants',tenants);

  // Add user account
  const users=DB.get('users')||[];
  if(!users.find(u=>u.mobile===mobile)){
    users.push({id:genId('U'),name,mobile,role:'tenant',tenantId:id});
    DB.set('users',users);
  }

  // Save to PostgreSQL RoomWise_MemberList
  const allRooms = getRoomOccupancy();
  const selRoom = allRooms.find(r=>r.id===roomId);
  const floorNo = selRoom ? selRoom.floor : 1;
  const roomNo = roomId.replace('R','');
  saveNewTenantToDB(name, mobile, occ||'Member', joinDate, roomNo, String(floorNo), email, dob, deposit)
    .then(()=>{
      console.log('[DB] ✅ Tenant saved to RoomWise_MemberList');
      return loadTenantsFromDB();
    })
    .then(() => {
      if (currentPage === 'tenants') {
        navigateTo('tenants');
      }
    })
    .catch(err=>{ console.error('[DB] ❌ Failed to save tenant to DB:', err.message); showToast('Tenant saved locally, DB sync failed: '+err.message,'warning'); });

  addNotification({to:'admin',type:'join',title:'New Tenant Added',message:`${name} has been added to Room ${roomId.replace('R','')} Bed ${bedNo}.`});
  closeModal();
  showToast('Tenant added successfully!','success');
  navigateTo('tenants');
}

function vacateTenant(id){
  if(!confirm(`Are you sure you want to vacate this tenant?`)) return;
  const tenants=DB.get('tenants')||[];
  const t=tenants.find(t=>t.id===id);
  if(t){
    t.status='vacated';
    t.vacatedOn=new Date().toISOString().slice(0,10);
    closeModal();
    
    if(t.db_id){
      showToast('Deleting tenant from database...', 'info');
      deleteTenantFromDB(t.db_id)
        .then(()=>{
          console.log('[DB] ✅ Tenant deleted from RoomWise_MemberList');
          const updatedTenants = (DB.get('tenants')||[]).filter(item => item.id !== id);
          DB.set('tenants', updatedTenants);
          showToast('Tenant checked out and deleted from database!','warning');
          navigateTo('tenants');
        })
        .catch(err=>{
          console.error('[DB] ❌ Failed to delete tenant from DB:', err.message);
          showToast('Saved locally, database delete failed: '+err.message,'warning');
          DB.set('tenants',tenants);
          navigateTo('tenants');
        });
    } else {
      DB.set('tenants',tenants);
      showToast('Tenant vacated locally','warning');
      navigateTo('tenants');
    }
  }
}

function editTenant(id){
  const tenants = DB.get('tenants')||[];
  const t = tenants.find(t=>t.id===id);
  if(!t) return;
  closeModal();
  setTimeout(()=>{
    showModal(`Edit Tenant — ${t.name}`,`
      <div class="form-row">
        <div class="form-group"><label class="form-label">Full Name *</label><input class="form-control" id="et-name" value="${t.name}" placeholder="Tenant full name" /></div>
        <div class="form-group"><label class="form-label">Mobile *</label><input class="form-control" id="et-mobile" type="tel" maxlength="10" value="${t.mobile}" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="et-email" type="email" value="${t.email||''}" /></div>
        <div class="form-group"><label class="form-label">Date of Birth</label><input class="form-control" id="et-dob" type="date" value="${t.dob||''}" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Occupation</label><input class="form-control" id="et-occ" value="${t.occupation||''}" /></div>
        <div class="form-group"><label class="form-label">Company / College</label><input class="form-control" id="et-comp" value="${t.company||''}" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Join Date</label><input class="form-control" id="et-join" type="date" value="${t.joinDate||''}" /></div>
        <div class="form-group"><label class="form-label">Monthly Rent (₹)</label><input class="form-control" id="et-rent" type="number" value="${t.rent||''}" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Security Deposit (₹)</label><input class="form-control" id="et-dep" type="number" value="${t.deposit||''}" /></div>
        <div class="form-group"><label class="form-label">Notice Period (days)</label><input class="form-control" id="et-notice" type="number" value="${t.noticePeriod||30}" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ID Proof Type</label>
          <select class="form-control" id="et-idtype">
            ${['Aadhar','Passport','Voter ID','DL','PAN Card'].map(p=>`<option value="${p}" ${t.idProof===p?'selected':''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">ID Number</label><input class="form-control" id="et-idnum" value="${t.idNumber||''}" /></div>
      </div>
      <div class="form-group"><label class="form-label">Emergency Contact</label><input class="form-control" id="et-emerg" value="${t.emergencyContact||''}" placeholder="Name & mobile" /></div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveEditedTenant('${t.id}')"><i class="fas fa-save"></i> Save Changes</button>
      </div>
    `,false);
  },200);
}

function saveEditedTenant(id){
  const name = document.getElementById('et-name').value.trim();
  const mobile = document.getElementById('et-mobile').value.trim();
  const email = document.getElementById('et-email').value.trim();
  const dob = document.getElementById('et-dob').value;
  const occ = document.getElementById('et-occ').value.trim();
  const comp = document.getElementById('et-comp').value.trim();
  const joinDate = document.getElementById('et-join').value;
  const rent = parseInt(document.getElementById('et-rent').value)||0;
  const deposit = parseInt(document.getElementById('et-dep').value)||0;
  const noticePeriod = parseInt(document.getElementById('et-notice').value)||30;
  const idProof = document.getElementById('et-idtype').value;
  const idNumber = document.getElementById('et-idnum').value.trim();
  const emergencyContact = document.getElementById('et-emerg').value.trim();

  if(!name||!mobile){ showToast('Name and Mobile are required','error'); return; }

  const tenants = DB.get('tenants')||[];
  const t = tenants.find(t=>t.id===id);
  if(!t){ showToast('Tenant not found','error'); return; }

  // Update in localStorage
  Object.assign(t,{name,mobile,email,dob,occupation:occ,company:comp,joinDate,rent,deposit,noticePeriod,idProof,idNumber,emergencyContact});
  DB.set('tenants',tenants);

  // Update in PostgreSQL
  const roomNo = t.roomId ? t.roomId.replace('R','') : '';
  const allRooms = getRoomOccupancy();
  const selRoom = allRooms.find(r=>r.id===t.roomId);
  const floorNo = selRoom ? selRoom.floor : '';
  updateTenantInDB(t.db_id, name, mobile, occ||'Member', joinDate, roomNo, String(floorNo), email, dob, deposit)
    .then(()=>{
      console.log('[DB] ✅ Tenant updated in RoomWise_MemberList');
      return loadTenantsFromDB();
    })
    .then(() => {
      if (currentPage === 'tenants') {
        navigateTo('tenants');
      }
    })
    .catch(err=>{ console.error('[DB] ❌ Failed to update tenant in DB:', err.message); showToast('Saved locally, DB sync failed: '+err.message,'warning'); });

  closeModal();
  showToast('Tenant updated successfully!','success');
  navigateTo('tenants');
}

function exportTenants(){
  const tenants=DB.get('tenants')||[];
  let csv='ID,Name,Mobile,Room,Bed,Occupation,Company,Rent,Deposit,Join Date,Status\n';
  tenants.forEach(t=>{ csv+=`${t.id},${t.name},${t.mobile},${t.roomId},${t.bedNo},${t.occupation},${t.company},${t.rent},${t.deposit},${t.joinDate},${t.status}\n`; });
  downloadCSV(csv,'slvpg_tenants.csv');
  showToast('Export downloaded!','success');
}
