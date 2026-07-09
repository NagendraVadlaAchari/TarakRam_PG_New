// ===================== MAIN APP ROUTER =====================

let currentPage = 'dashboard';

function navigateTo(page){
  currentPage = page;
  renderApp();
}

async function initApp(){
  try {
    // Attempt to load data from DB before starting the app
    await loadRoomsFromDB();
    await loadTenantsFromDB();
    await loadExpensesFromDB();
    await loadVisitsFromDB();
    await loadNotificationsFromDB();
  } catch (err) {
    console.error("Failed to load data on boot", err);
  }
  // page-loader may have been removed from DOM if login page was shown
  const loader = document.getElementById('page-loader');
  if (loader) loader.classList.add('fade-out');
  setTimeout(renderApp, 300);
}

function renderApp(){
  const user = getCurrentUser();
  if (user && user.role === 'guest' && (currentPage === 'dashboard' || currentPage === 'rooms')) {
    currentPage = 'booking';
  }
  const app = document.getElementById('app');
  const unread = getUnreadCount();

  const isGuest = user ? user.role === 'guest' : true;

  const navItems = isGuest ? [
    {id:'booking',icon:'key',label:'Book Room'},
    {id:'reviews',icon:'star',label:'Reviews'},
    {id:'visit',icon:'calendar-check',label:'Book Visit'},
    {id:'reminders',icon:'bell',label:'Payment Reminders'},
  ] : user.role === 'admin' ? [
    {id:'dashboard',icon:'tachometer-alt',label:'Dashboard'},
    {id:'rooms',icon:'building',label:'Rooms & Occupancy'},
    {id:'tenants',icon:'users',label:'Tenants'},
    {id:'finance',icon:'rupee-sign',label:'Finance'},
    {id:'rent',icon:'money-bill-wave',label:'Rent Collection'},
    {id:'documents',icon:'folder-open',label:'Documents'},
    {id:'notifications',icon:'bell',label:'Notifications',badge:unread},
    {id:'reviews',icon:'star',label:'Reviews'},
    {id:'visit',icon:'calendar-check',label:'Visit Bookings'},
  ] : [
    {id:'dashboard',icon:'tachometer-alt',label:'My Dashboard'},
    {id:'rooms',icon:'building',label:'Rooms & Occupancy'},
    {id:'tenants',icon:'user-circle',label:'My Profile'},
    {id:'finance',icon:'rupee-sign',label:'My Finances'},
    {id:'documents',icon:'folder-open',label:'My Documents'},
    {id:'notifications',icon:'bell',label:'Notifications',badge:unread},
    {id:'reviews',icon:'star',label:'Reviews'},
    {id:'visit',icon:'calendar-check',label:'Book Visit'},
  ];

  app.innerHTML = `
  <div class="sidebar" id="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-logo" onclick="navigateTo('dashboard')" style="cursor:pointer" title="Go to Dashboard">
        <div class="logo-icon"><i class="fas fa-home"></i></div>
        <div class="logo-text">
          <h3>Tarak Ram PG</h3>
          <p>Luxery Womens PG</p>
        </div>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section">
        ${navItems.map(n=>`
          <button class="nav-item ${currentPage===n.id?'active':''}" onclick="navigateTo('${n.id}');closeSidebar()">
            <i class="fas fa-${n.icon}"></i> ${n.label}
            ${n.badge?`<span class="nav-badge">${n.badge}</span>`:''}
          </button>`).join('')}
      </div>
    </nav>
    <div class="sidebar-footer">
      <div class="user-card">
        <div class="user-avatar">${user.name[0]}</div>
        <div class="user-info">
          <div class="name">${user.name}</div>
          <div class="role">${user.role==='admin'?'Owner/Admin':user.role==='tenant'?'Tenant':'Guest'}</div>
        </div>
        <button class="logout-btn" onclick="logoutUser()" title="Logout"><i class="fas fa-sign-out-alt"></i></button>
      </div>
    </div>
  </div>
  
  <div class="main-content">
    <div class="topbar">
      <div class="topbar-left">
        <button class="menu-toggle" onclick="toggleSidebar()"><i class="fas fa-bars"></i></button>
      </div>
      <div class="topbar-right">
        ${unread>0?`<button class="notif-btn" onclick="navigateTo('notifications')"><i class="fas fa-bell"></i><div class="notif-dot"></div></button>`:''}
        <div style="font-size:12px;color:var(--text3)">${new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</div>
      </div>
    </div>
    <div id="page-content">
      ${renderPage(currentPage)}
    </div>
  </div>

  <!-- Demo Switcher -->
  <div class="demo-switcher" style="display: none !important;">
    <div class="demo-switcher-header" onclick="toggleDemoSwitcher()">
      <span><i class="fas fa-flask" style="color:var(--accent);"></i> Quick Demo Switcher</span>
      <i class="fas fa-chevron-up toggle-icon" id="demo-toggle-icon"></i>
    </div>
    <div class="demo-switcher-body hidden" id="demo-switcher-body">
      <button class="btn btn-secondary btn-sm" onclick="continueAsGuest();navigateTo('booking');" style="margin-bottom:6px;width:100%;justify-content:flex-start;"><i class="fas fa-user" style="color:var(--info);"></i> Guest View</button>
      <button class="btn btn-danger btn-sm" onclick="logoutUser()" style="width:100%;justify-content:center;"><i class="fas fa-sign-out-alt"></i> Logout / Clear Session</button>
    </div>
  </div>
  `;
}


function renderPage(page){
  const user = getCurrentUser();
  switch(page){
    case 'dashboard': return user.role==='tenant'?renderTenantDashboard():renderAdminDashboard();
    case 'rooms': return renderRoomsPage();
    case 'booking': return renderBookingPage();
    case 'tenants': return renderTenantsPage();
    case 'finance': return renderFinancePage();
    case 'rent': return renderRentCollection();
    case 'documents': return renderDocumentsPage();
    case 'notifications': return renderNotificationsPanel();
    case 'reviews': return renderReviewsPage();
    case 'visit': return renderVisitPage();
    case 'reminders': refreshAndRenderReminders(); return renderGuestRemindersSkeleton();
    default: return renderAdminDashboard();
  }
}

// Async refresh: fetch latest notifications from DB then re-render the reminders panel
function refreshAndRenderReminders() {
  loadNotificationsFromDB().then(() => {
    const pc = document.getElementById('page-content');
    if (pc && currentPage === 'reminders') {
      pc.innerHTML = renderGuestReminders();
    }
  }).catch(e => console.warn('[DB] Reminders refresh failed:', e));
}

function renderGuestRemindersSkeleton() {
  return `
  <div class="page-header">
    <h1><i class="fas fa-bell" style="color:var(--accent)"></i> Payment Reminders</h1>
    <p>Loading your reminders from server...</p>
  </div>
  <div class="card" style="text-align:center;padding:48px 24px">
    <div style="width:56px;height:56px;border-radius:50%;background:rgba(124,58,237,0.1);display:flex;align-items:center;justify-content:center;font-size:24px;color:var(--primary-light);margin:0 auto 16px;animation:spin 1s linear infinite">
      <i class="fas fa-sync-alt"></i>
    </div>
    <p style="color:var(--text3);font-size:13px">Fetching latest reminders from database...</p>
  </div>`;
}


function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open');
}

function closeSidebar(){
  const sb = document.getElementById('sidebar');
  if(sb) sb.classList.remove('open');
}

// ---- Admin Dashboard ----
function renderAdminDashboard(){
  const tenants = (DB.get('tenants')||[]).filter(t=>t.status==='active');
  const activeIds = tenants.map(t=>t.id);
  const payments = (DB.get('payments')||[]).filter(p=>activeIds.includes(p.tenantId));
  const rooms = getRoomOccupancy();
  const currentMonth = new Date().toISOString().slice(0,7);
  const mPayments = payments.filter(p=>p.month===currentMonth);
  const collected = mPayments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.amount,0);
  const pending = mPayments.filter(p=>p.status==='pending');
  const totalBeds = rooms.reduce((s,r)=>s+r.beds,0);
  const occupiedBeds = rooms.reduce((s,r)=>s+r.occupied,0);
  const visits = (DB.get('visits')||[]).filter(v=>v.status==='pending');
  const pendingReviews = (DB.get('reviews')||[]).filter(r=>r.status==='pending');

  return `
  <div class="page-header">
    <h1>Welcome back, <span class="grad-text">Admin</span> 👋</h1>
    <p>Tarak Ram Luxery Womens PG</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card purple" onclick="navigateTo('tenants')" style="cursor:pointer">
      <div class="stat-icon purple"><i class="fas fa-users"></i></div>
      <div class="stat-value">${tenants.length}</div>
      <div class="stat-label">Active Tenants</div>
    </div>
    <div class="stat-card green" onclick="navigateTo('rooms')" style="cursor:pointer">
      <div class="stat-icon green"><i class="fas fa-bed"></i></div>
      <div class="stat-value">${totalBeds-occupiedBeds}</div>
      <div class="stat-label">Vacant Beds</div>
    </div>
    <div class="stat-card pink" onclick="navigateTo('finance')" style="cursor:pointer">
      <div class="stat-icon pink"><i class="fas fa-rupee-sign"></i></div>
      <div class="stat-value">₹${(collected/1000).toFixed(0)}K</div>
      <div class="stat-label">Collected (${currentMonth})</div>
    </div>
    <div class="stat-card amber" onclick="navigateTo('finance')" style="cursor:pointer">
      <div class="stat-icon amber"><i class="fas fa-clock"></i></div>
      <div class="stat-value">${pending.length}</div>
      <div class="stat-label">Pending Dues</div>
    </div>
    <div class="stat-card blue" onclick="navigateTo('visit')" style="cursor:pointer">
      <div class="stat-icon blue"><i class="fas fa-calendar-check"></i></div>
      <div class="stat-value">${visits.length}</div>
      <div class="stat-label">Visit Requests</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-title"><i class="fas fa-building"></i> Occupancy Overview</div>
      <div style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
          <span>Overall Occupancy</span>
          <span style="font-weight:600;color:var(--primary-light)">${Math.round(occupiedBeds/totalBeds*100)}%</span>
        </div>
        <div class="progress-bar" style="height:10px"><div class="progress-fill" style="width:${occupiedBeds/totalBeds*100}%;background:linear-gradient(90deg,var(--primary),var(--secondary))"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3);margin-top:6px">
          <span>${occupiedBeds} occupied</span><span>${totalBeds-occupiedBeds} vacant</span>
        </div>
      </div>
      <div class="floor-grid">
        ${[1,2,3,4,5,6].map(f=>{
          const floorRooms = rooms.filter(r=>r.floor===f).sort((a,b)=>parseInt(a.number)-parseInt(b.number));
          return `<div class="floor-row">
            <div class="floor-label">Floor ${f}</div>
            <div class="rooms-row">
              ${floorRooms.map(r=>{
                const cls=r.occupied===0?'available':r.occupied===r.beds?'occupied':'partial';
                return `<div class="room-cell ${cls}" onclick="navigateTo('rooms')" title="Room ${r.number}: ${r.occupied}/${r.beds}">
                  <span class="rnum">${r.number}</span>
                  <span class="rocc">${r.occupied}/${r.beds}</span>
                </div>`;
              }).join('')}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-title"><i class="fas fa-exclamation-circle" style="color:var(--danger)"></i> Pending Dues</div>
        ${pending.length===0?'<div style="text-align:center;padding:16px;color:var(--success)"><i class="fas fa-check-circle"></i> All collected!</div>':
        pending.slice(0,5).map(p=>{
          const t = tenants.find(t=>t.id===p.tenantId) || {name:p.tenantName, mobile:'', occupation:''};
          return `
          <div class="due-item">
            <div><strong style="font-size:13px">${t.name}</strong> <span style="font-size:11px;color:var(--text3);font-weight:normal">(${t.mobile} - ${t.occupation})</span><div style="font-size:11px;color:var(--text3)">Room ${(p.roomId || '').replace('R','')} · Due: ${formatDate(p.dueDate)}</div></div>
            <div style="text-align:right"><div style="font-weight:700;color:var(--danger)">₹${p.amount.toLocaleString()}</div><button class="btn btn-success btn-sm" style="margin-top:4px" onclick="recordPayment('${p.id}')">Pay</button></div>
          </div>`}).join('')}
        ${pending.length>5?`<p style="font-size:12px;color:var(--text3);text-align:center;margin-top:8px;cursor:pointer" onclick="navigateTo('finance')">+${pending.length-5} more →</p>`:''}
      </div>

      <div class="card">
        <div class="card-title"><i class="fas fa-bolt"></i> Quick Actions</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <button class="btn btn-primary" onclick="showAddTenantModal()"><i class="fas fa-user-plus"></i> Add Tenant</button>
          <button class="btn btn-secondary" onclick="addPaymentModal()"><i class="fas fa-rupee-sign"></i> Record Payment</button>
          <button class="btn btn-secondary" onclick="navigateTo('notifications')"><i class="fas fa-bell"></i> Send Notice</button>
          <button class="btn btn-secondary" onclick="sendDueReminders()"><i class="fas fa-paper-plane"></i> Send Reminders</button>
          <button class="btn btn-secondary" onclick="navigateTo('documents')"><i class="fas fa-folder-open"></i> Documents</button>
          <button class="btn btn-secondary" onclick="navigateTo('visit')"><i class="fas fa-calendar"></i> Visits (${visits.length})</button>
          <button class="btn btn-primary" style="grid-column: span 2; background: linear-gradient(135deg, var(--primary), var(--secondary)); border: none; font-weight: 600; color: #fff;" onclick="showExportOptionsModal()"><i class="fas fa-file-export"></i> Export Entire App Data</button>
        </div>
        ${pendingReviews.length?`<div style="margin-top:12px;padding:10px;background:rgba(245,158,11,.1);border-radius:8px;cursor:pointer" onclick="navigateTo('reviews')"><p style="font-size:13px;color:var(--accent)"><i class="fas fa-star"></i> ${pendingReviews.length} review(s) awaiting approval</p></div>`:''}
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:20px">
    <div class="card-title"><i class="fas fa-users"></i> Recent Tenants</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Name</th><th>Room</th><th>Rent</th><th>Joined</th><th>May 2026</th></tr></thead>
        <tbody>
          ${tenants.slice(0,6).map(t=>{
            const p=payments.find(p=>p.tenantId===t.id&&p.month===currentMonth);
            return `<tr onclick="showTenantDetail('${t.id}')" style="cursor:pointer">
              <td><span class="badge badge-purple">${t.id}</span></td>
              <td><strong>${t.name}</strong></td>
              <td>Room ${(t.roomId || '').replace('R','')} · Bed ${t.bedNo}</td>
              <td>₹${t.rent.toLocaleString()}</td>
              <td>${formatDate(t.joinDate)}</td>
              <td><span class="badge ${p&&p.status==='paid'?'badge-success':'badge-danger'}">${p?p.status:'no record'}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

// ---- Tenant Dashboard ----
function renderTenantDashboard(){
  const user = getCurrentUser();
  const t = (DB.get('tenants')||[]).find(t=>t.id===user.tenantId);
  if(!t) return `<div class="empty-state"><i class="fas fa-user-slash"></i><p>Profile not found. Contact admin.</p></div>`;
  const payments = getTenantPayments(t.id);
  const pending = payments.filter(p=>p.status==='pending');
  const currentMonth = new Date().toISOString().slice(0,7);
  const thisMonth = payments.find(p=>p.month===currentMonth);
  const reviews = (DB.get('reviews')||[]).filter(r=>r.status==='approved').slice(0,3);

  return `
  <div class="page-header">
    <h1>Welcome, <span class="grad-text">${t.name.split(' ')[0]}</span> 👋</h1>
    <p>Tenant ID: ${t.id} · Room ${(t.roomId || '').replace('R','')} · Bed ${t.bedNo}</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card purple"><div class="stat-icon purple"><i class="fas fa-rupee-sign"></i></div><div class="stat-value">₹${t.rent.toLocaleString()}</div><div class="stat-label">Monthly Rent</div></div>
    <div class="stat-card pink"><div class="stat-icon pink"><i class="fas fa-clock"></i></div><div class="stat-value">${pending.length}</div><div class="stat-label">Pending Dues</div></div>
    <div class="stat-card green"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div><div class="stat-value">${payments.filter(p=>p.status==='paid').length}</div><div class="stat-label">Months Paid</div></div>
    <div class="stat-card amber"><div class="stat-icon amber"><i class="fas fa-shield-alt"></i></div><div class="stat-value">₹${t.deposit.toLocaleString()}</div><div class="stat-label">Security Deposit</div></div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-title"><i class="fas fa-calendar"></i> This Month — ${currentMonth}</div>
      ${thisMonth?`
        <div style="text-align:center;padding:20px">
          <div style="font-size:36px;font-weight:700;color:${thisMonth.status==='paid'?'var(--success)':'var(--danger)'}">${thisMonth.status==='paid'?'✓ PAID':'⚠ PENDING'}</div>
          <div style="font-size:22px;font-weight:700;margin:8px 0">₹${thisMonth.amount.toLocaleString()}</div>
          ${thisMonth.status==='paid'?`<p style="font-size:13px;color:var(--text3)">Paid on ${formatDate(thisMonth.paidOn)} via ${thisMonth.paymentMode}</p>`:`<p style="font-size:13px;color:var(--danger)">Due by ${formatDate(thisMonth.dueDate)}. Please pay to avoid late fees.</p>`}
        </div>`:
      `<div class="empty-state"><i class="fas fa-question-circle"></i><p>No record for this month</p></div>`}
    </div>

    <div class="card">
      <div class="card-title"><i class="fas fa-history"></i> Recent Payments</div>
      ${payments.slice(0,4).map(p=>`
        <div class="due-item">
          <div><strong style="font-size:13px">${p.month}</strong><div style="font-size:11px;color:var(--text3)">${p.paidOn?`Paid ${formatDate(p.paidOn)}`:`Due ${formatDate(p.dueDate)}`}</div></div>
          <div style="text-align:right"><div style="font-weight:700">₹${p.amount.toLocaleString()}</div><span class="badge ${p.status==='paid'?'badge-success':'badge-danger'}">${p.status}</span></div>
        </div>`).join('')}
      <button class="btn btn-secondary btn-sm" style="margin-top:8px" onclick="navigateTo('finance')">View All →</button>
    </div>
  </div>

  <div class="card" style="margin-top:16px">
    <div class="card-title"><i class="fas fa-star" style="color:var(--accent)"></i> Recent Reviews from Residents</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px">
      ${reviews.map(r=>`
        <div style="padding:14px;background:var(--bg3);border-radius:10px">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <strong style="font-size:13px">${r.name}</strong>
            <span class="stars" style="font-size:12px">${'★'.repeat(r.rating)}</span>
          </div>
          <p style="font-size:12px;color:var(--text2);font-style:italic">"${r.comment.slice(0,80)}..."</p>
        </div>`).join('')}
    </div>
  </div>`;
}

// ---- Rent Collection Page ----
function getMonthsUpToNow() {
  // Returns array of YYYY-MM strings from Jan 2026 up to (and including) current month, newest first
  const now = new Date();
  const startYear = 2026, startMonth = 1;
  const months = [];
  let y = now.getFullYear(), m = now.getMonth() + 1; // 1-based
  while (y > startYear || (y === startYear && m >= startMonth)) {
    months.push(`${y}-${String(m).padStart(2,'0')}`);
    m--;
    if (m === 0) { m = 12; y--; }
  }
  return months;
}

function renderRentCollection(){
  const user = getCurrentUser();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const tenants = (DB.get('tenants')||[]).filter(t=>t.status==='active');
  const activeIds = tenants.map(t=>t.id);
  const payments = (DB.get('payments')||[]).filter(p=>activeIds.includes(p.tenantId));

  const months = getMonthsUpToNow();

  return `
  <div class="page-header">
    <h1><i class="fas fa-money-bill-wave" style="color:var(--success)"></i> Rent Collection</h1>
    <p>Monthly payment status tracker</p>
  </div>
  <div style="display:flex;gap:10px;margin-bottom:20px;align-items:center;flex-wrap:wrap">
    <select class="form-control" id="rc-month" style="width:160px" onchange="renderRentCollectionTable()">
      ${months.map(m=>`<option value="${m}" ${m===currentMonth?'selected':''}>${m}</option>`).join('')}
    </select>
    <button class="btn btn-primary btn-sm" onclick="sendDueReminders()"><i class="fas fa-bell"></i> Send Broadcast Reminders</button>
    <button class="btn btn-secondary btn-sm" onclick="exportFinance()"><i class="fas fa-download"></i> Export</button>
  </div>
  <div class="card" id="rc-table-wrap">
    ${renderRCTable(currentMonth, tenants, payments)}
  </div>`;
}


function renderRCTable(month, tenants, payments){
  const paid = payments.filter(p=>p.month===month&&p.status==='paid');
  const total = tenants.reduce((s,t)=>s+t.rent,0);
  const collected = paid.reduce((s,p)=>s+p.amount,0);
  const pct = total?Math.round(collected/total*100):0;

  return `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
    <span class="card-title" style="margin-bottom:0">Collection Status — ${month}</span>
    <div style="display:flex;gap:12px;font-size:13px">
      <span style="color:var(--success)"><i class="fas fa-check-circle"></i> Paid: ${paid.length}</span>
      <span style="color:var(--danger)"><i class="fas fa-clock"></i> Pending: ${tenants.length-paid.length}</span>
      <span style="color:var(--text2)">₹${collected.toLocaleString()} / ₹${total.toLocaleString()} (${pct}%)</span>
    </div>
  </div>
  
  <div class="progress-bar" style="margin-bottom:20px"><div class="progress-fill" style="width:${pct}%;background:linear-gradient(90deg,var(--success),#34d399)"></div></div>
  
  <!-- Floating/Inline Bulk Actions Bar -->
  <div id="rc-bulk-actions" style="margin-bottom: 16px; display: none; align-items: center; gap: 12px; background: rgba(124,58,237,0.08); padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(124,58,237,0.18)">
    <span style="font-size: 13.5px; font-weight: 600; color: var(--text)" id="rc-selected-count">0 tenants selected</span>
    <button class="btn btn-primary btn-sm" onclick="sendSelectedReminders('${month}')"><i class="fas fa-paper-plane"></i> Send Reminders to Selected</button>
  </div>
  
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;"><input type="checkbox" id="rc-select-all" onclick="toggleSelectAllRCTenants(this)" /></th>
          <th>Tenant</th>
          <th>Room</th>
          <th>Rent</th>
          <th>Status</th>
          <th>Paid On</th>
          <th>Mode</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${tenants.map(t=>{
          const p=payments.find(p=>p.tenantId===t.id&&p.month===month);
          const isPaid = p && p.status === 'paid';
          return `<tr>
            <td style="text-align: center;">
              ${isPaid ? '—' : `<input type="checkbox" class="rc-tenant-checkbox" data-tenant-id="${t.id}" onclick="updateRCSelectionCount()" />`}
            </td>
            <td><strong>${t.name}</strong><div style="font-size:11px;color:var(--text3)">${t.mobile} - ${t.occupation}</div></td>
            <td>Room ${(t.roomId || '').replace('R','')} · Bed ${t.bedNo}</td>
            <td>₹${t.rent.toLocaleString()}</td>
            <td><span class="badge ${p&&p.status==='paid'?'badge-success':'badge-danger'}">${p?p.status:'not recorded'}</span></td>
            <td>${p&&p.paidOn||'—'}</td>
            <td>${p&&p.paymentMode||'—'}</td>
            <td>
              <div style="display:flex;gap:6px;align-items:center">
                ${!isPaid ? `<button class="btn btn-success btn-sm" title="Mark Paid" onclick="recordPayment('${p ? p.id : ''}', '${t.id}', '${month}', ${t.rent})"><i class="fas fa-check"></i></button>` : '<span style="color:var(--success);font-size:12px">✓ Paid</span>'}
                ${!isPaid ? `<button class="btn btn-secondary btn-sm" title="Send Reminder" onclick="sendIndividualReminder('${t.id}', '${month}')"><i class="fas fa-bell"></i></button>` : ''}
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`;
}

function renderRentCollectionTable(){
  const month = document.getElementById('rc-month').value;
  const tenants = (DB.get('tenants')||[]).filter(t=>t.status==='active');
  const activeIds = tenants.map(t=>t.id);
  const payments = (DB.get('payments')||[]).filter(p=>activeIds.includes(p.tenantId));
  document.getElementById('rc-table-wrap').innerHTML = renderRCTable(month, tenants, payments);
}

// ---- Utility Functions ----
function showModal(title, content, showFooter=true){
  const overlay = document.getElementById('modal-overlay');
  const container = document.getElementById('modal-container');
  overlay.classList.remove('hidden');
  container.classList.remove('hidden');
  container.innerHTML = `
  <div class="modal">
    <div class="modal-header">
      <h3>${title}</h3>
      <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
    </div>
    ${content}
    ${showFooter?'<div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Close</button></div>':''}
  </div>`;
  overlay.onclick = closeModal;
}

function closeModal(){
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-container').classList.add('hidden');
}

function showToast(msg, type='info'){
  const icons={success:'check-circle',error:'exclamation-circle',warning:'exclamation-triangle',info:'info-circle'};
  const toast = document.createElement('div');
  toast.className=`toast ${type}`;
  toast.innerHTML=`<i class="fas fa-${icons[type]} toast-icon"></i><span class="toast-msg">${msg}</span>`;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(()=>toast.remove(), 4000);
}

function formatDate(dateStr){
  if(!dateStr) return '—';
  try{
    const d = new Date(dateStr);
    if(isNaN(d.getTime())) return dateStr;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }catch(e){ return dateStr; }
}

function downloadCSV(csv, filename){
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}

function toggleDemoSwitcher(){
  const body = document.getElementById('demo-switcher-body');
  const icon = document.getElementById('demo-toggle-icon');
  if(body) {
    const isHidden = body.classList.contains('hidden');
    body.classList.toggle('hidden');
    if(icon) {
      icon.className = isHidden ? "fas fa-chevron-down toggle-icon" : "fas fa-chevron-up toggle-icon";
    }
  }
}

// ===================== GUEST REMINDERS PANEL =====================
function renderGuestReminders() {
  const user = getCurrentUser();
  if (!user) return `<div class="empty-state"><i class="fas fa-user-slash"></i><p>Please login first.</p></div>`;

  const tenants = DB.get('tenants') || [];
  const dbRecord = user.dbRecord || {};

  // --- Robust cross-table matching ---
  // LoginMaster has: userName, mobile_Number
  // RoomWise_MemberList (tenants) has: name (=Tenant_Name), mobile (=Mobile_No)
  // Try: exact name match first, then mobile match
  const loginName   = (dbRecord.userName   || user.name  || '').trim().toLowerCase();
  const loginMobile = (dbRecord.mobile_Number || user.mobile || '').replace(/\D/g,'');

  let guestTenant = null;

  // 1. Match by BOTH name AND mobile
  if (loginName && loginMobile) {
    guestTenant = tenants.find(t => {
      const tName   = (t.name   || '').trim().toLowerCase();
      const tMobile = (t.mobile || '').replace(/\D/g,'');
      return tName === loginName && tMobile === loginMobile;
    });
  }
  // 2. Match by name only
  if (!guestTenant && loginName) {
    guestTenant = tenants.find(t => (t.name || '').trim().toLowerCase() === loginName);
  }
  // 3. Match by mobile only
  if (!guestTenant && loginMobile) {
    guestTenant = tenants.find(t => (t.mobile || '').replace(/\D/g,'') === loginMobile);
  }
  // 4. Use cached tenantId from session
  if (!guestTenant && user.tenantId) {
    guestTenant = tenants.find(t => t.id === user.tenantId);
  }

  if (!guestTenant) {
    return `
    <div class="page-header">
      <h1><i class="fas fa-bell" style="color:var(--accent)"></i> Payment Reminders</h1>
      <p>Notifications and dues for your account</p>
    </div>
    <div class="card" style="text-align:center;padding:48px 24px;border:1px solid var(--border);border-radius:24px;background:var(--card)">
      <div style="width:72px;height:72px;background:rgba(245,158,11,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;color:var(--accent);margin:0 auto 20px;animation:pulse 2s infinite;">
        <i class="fas fa-user-clock"></i>
      </div>
      <h3 style="margin-bottom:8px;font-family:'Poppins',sans-serif;font-size:18px;">No PG Tenant Record Found</h3>
      <p style="color:var(--text2);font-size:13.5px;max-width:480px;margin:0 auto 20px;line-height:1.6;">
        Your guest account (username: <strong style="color:var(--primary-light)">${user.name}</strong>) is not currently linked to an active PG resident profile in our tenant database.
      </p>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:12px 16px;max-width:480px;margin:0 auto;text-align:left;font-size:12.5px;color:var(--text3);line-height:1.5;">
        <i class="fas fa-info-circle" style="color:var(--primary-light);margin-right:6px"></i>
        If you have checked in recently, please make sure the PG Admin has added your record in the <strong>RoomWise_MemberList</strong> table matching your name (<strong>Nag</strong>) or mobile number.
      </div>
    </div>`;
  }
  
  const payments = (DB.get('payments')||[]).filter(p => p.tenantId === guestTenant.id);
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const allNotifications = DB.get('notifications') || [];
  const reminders = allNotifications.filter(n => n.to === guestTenant.id && (n.type === 'due' || n.type === 'payment'));
  
  return `
  <div class="page-header">
    <h1><i class="fas fa-bell" style="color:var(--accent)"></i> Payment Reminders</h1>
    <p>Logged in as: <strong style="color:var(--primary-light)">${user.name}</strong> · Resident Profile Link Verified</p>
  </div>
  
  <div class="stats-grid">
    <div class="stat-card purple">
      <div class="stat-icon purple"><i class="fas fa-door-open"></i></div>
      <div class="stat-value">Room ${(guestTenant.roomId || '').replace('R','')}</div>
      <div class="stat-label">Bed Assigned: ${guestTenant.bedNo}</div>
    </div>
    <div class="stat-card green">
      <div class="stat-icon green"><i class="fas fa-rupee-sign"></i></div>
      <div class="stat-value">₹${guestTenant.rent.toLocaleString()}</div>
      <div class="stat-label">Monthly Rent</div>
    </div>
    <div class="stat-card pink">
      <div class="stat-icon pink"><i class="fas fa-clock"></i></div>
      <div class="stat-value">${pendingPayments.length}</div>
      <div class="stat-label">Pending Dues</div>
    </div>
    <div class="stat-card amber">
      <div class="stat-icon amber"><i class="fas fa-shield-alt"></i></div>
      <div class="stat-value">₹${guestTenant.deposit.toLocaleString()}</div>
      <div class="stat-label">Security Deposit</div>
    </div>
  </div>
  
  <div class="grid-2">
    <!-- Pending Dues Card -->
    <div class="card">
      <div class="card-title" style="color:var(--danger)"><i class="fas fa-exclamation-circle"></i> Pending Rent / Dues</div>
      ${pendingPayments.length === 0 ? `
        <div style="text-align:center;padding:48px 10px;color:var(--success)">
          <i class="fas fa-check-circle" style="font-size:42px;margin-bottom:12px;display:block"></i>
          <span style="font-weight:600;font-size:14px">All Settled! No pending dues.</span>
        </div>` : 
        pendingPayments.map(p => `
        <div class="due-item" style="padding:14px 0;">
          <div>
            <div style="font-weight:700;font-size:14px;color:var(--text)">Rent for ${p.month}</div>
            <div style="font-size:12px;color:var(--text3);margin-top:4px;"><i class="far fa-calendar-alt"></i> Due Date: ${formatDate(p.dueDate)}</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:800;font-size:17px;color:var(--danger);margin-bottom:6px">₹${p.amount.toLocaleString()}</div>
            <button class="btn btn-primary btn-sm" onclick="triggerTenantPaymentGateway('${p.id}')">
              <i class="fas fa-credit-card"></i> Pay Now
            </button>
          </div>
        </div>`).join('')}
    </div>
    
    <!-- Reminders Feed -->
    <div class="card">
      <div class="card-title"><i class="fas fa-history"></i> Reminders &amp; Alerts</div>
      ${reminders.length === 0 ? `
        <div class="empty-state" style="padding:48px 10px;">
          <i class="fas fa-bell-slash" style="font-size:32px;margin-bottom:12px;opacity:0.3"></i>
          <p style="font-size:13px;color:var(--text3)">No reminder notifications sent yet.</p>
        </div>` : 
        reminders.sort((a,b) => new Date(b.date) - new Date(a.date)).map(n => `
        <div class="due-item" style="padding:12px 0;">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:34px;height:34px;border-radius:8px;background:${n.type==='due'?'rgba(245,158,11,.15)':'rgba(16,185,129,.15)'};color:${n.type==='due'?'var(--accent)':'var(--success)'};display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">
              <i class="fas fa-${n.type==='due'?'bell':'check-circle'}"></i>
            </div>
            <div style="flex:1">
              <strong style="font-size:13.5px;color:var(--text)">${n.title}</strong>
              <p style="font-size:12.5px;color:var(--text2);margin-top:4px;line-height:1.4">${n.message}</p>
              <span style="font-size:10.5px;color:var(--text3);margin-top:6px;display:block;"><i class="far fa-clock"></i> ${formatDate(n.date)}</span>
            </div>
          </div>
        </div>`).join('')}
    </div>
  </div>`;
}

// ---- Boot ----
window.addEventListener('DOMContentLoaded', () => {
  if (restoreSession()) {
    initApp();
  } else {
    setTimeout(() => {
      const loader = document.getElementById('page-loader');
      if (loader) loader.classList.add('fade-out');
      setTimeout(renderLoginPage, 500);
    }, 2000);
  }
});
