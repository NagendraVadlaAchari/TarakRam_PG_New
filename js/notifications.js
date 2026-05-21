// ===================== NOTIFICATIONS MODULE =====================
function renderNotificationsPanel(){
  const user = getCurrentUser();
  const all = DB.get('notifications')||[];
  const mine = all.filter(n=> user.role==='admin' ? n.to==='admin' : (n.to===user.tenantId||n.to==='all'));

  return `
  <div class="page-header">
    <h1><i class="fas fa-bell" style="color:var(--accent)"></i> Notifications</h1>
    <p>${mine.filter(n=>!n.read).length} unread notification(s)</p>
  </div>
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <span class="card-title" style="margin-bottom:0"><i class="fas fa-inbox"></i> All Notifications</span>
      <button class="btn btn-secondary btn-sm" onclick="markAllRead()"><i class="fas fa-check-double"></i> Mark All Read</button>
    </div>
    ${mine.length===0?`<div class="empty-state"><i class="fas fa-bell-slash"></i><p>No notifications yet</p></div>`:
    mine.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(n=>`
      <div class="due-item" style="${!n.read?'background:rgba(124,58,237,.06);border-radius:10px;padding:14px;margin-bottom:8px;':'padding:14px 0;'}">
        <div style="display:flex;gap:12px;align-items:flex-start;flex:1">
          <div style="width:38px;height:38px;border-radius:10px;background:${typeColor(n.type)};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${typeIcon(n.type)}</div>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span style="font-weight:600;font-size:14px;color:var(--text)">${n.title}</span>
              ${!n.read?'<span class="badge badge-purple">New</span>':''}
            </div>
            <p style="font-size:13px;color:var(--text2)">${n.message}</p>
            <p style="font-size:11px;color:var(--text3);margin-top:4px"><i class="fas fa-clock"></i> ${formatDate(n.date)}</p>
          </div>
        </div>
        ${!n.read?`<button class="btn btn-secondary btn-sm" onclick="markRead('${n.id}')">Mark Read</button>`:''}
      </div>`).join('')}
  </div>
  ${user.role==='admin'?renderSendNotification():''}`;
}

function typeColor(t){
  return {due:'rgba(245,158,11,.2)',join:'rgba(16,185,129,.2)',review:'rgba(124,58,237,.2)',visit:'rgba(59,130,246,.2)',payment:'rgba(16,185,129,.2)'}[t]||'rgba(124,58,237,.2)';
}
function typeIcon(t){
  return {due:'⏰',join:'🆕',review:'⭐',visit:'📅',payment:'💰'}[t]||'🔔';
}

function markRead(id){
  const notifs = DB.get('notifications')||[];
  const n = notifs.find(n=>n.id===id);
  if(n) n.read=true;
  DB.set('notifications',notifs);
  navigateTo('notifications');
}

function markAllRead(){
  const user = getCurrentUser();
  const notifs = DB.get('notifications')||[];
  notifs.forEach(n=>{
    if(user.role==='admin'&&n.to==='admin') n.read=true;
    else if(n.to===user.tenantId||n.to==='all') n.read=true;
  });
  DB.set('notifications',notifs);
  showToast('All notifications marked as read','success');
  navigateTo('notifications');
}

function addNotification(notif){
  const notifs = DB.get('notifications')||[];
  notifs.unshift({id:genId('N'),date:new Date().toISOString().slice(0,10),read:false,...notif});
  DB.set('notifications',notifs);
}

function getUnreadCount(){
  const user = getCurrentUser();
  if(!user) return 0;
  const notifs = DB.get('notifications')||[];
  return notifs.filter(n=>{
    if(user.role==='admin') return n.to==='admin'&&!n.read;
    return (n.to===user.tenantId||n.to==='all')&&!n.read;
  }).length;
}

function renderSendNotification(){
  return `
  <div class="card" style="margin-top:20px;">
    <div class="card-title"><i class="fas fa-paper-plane"></i> Send Notification</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">To</label>
        <select class="form-control" id="notif-to">
          <option value="all">All Tenants</option>
          ${(DB.get('tenants')||[]).filter(t=>t.status==='active').map(t=>`<option value="${t.id}">${t.name}</option>`).join('')}
          <option value="admin">Admin Only</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Type</label>
        <select class="form-control" id="notif-type">
          <option value="due">Payment Due</option>
          <option value="payment">Payment Received</option>
          <option value="join">New Tenant</option>
          <option value="review">Review</option>
          <option value="visit">Visit</option>
        </select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Title</label><input class="form-control" id="notif-title" placeholder="Notification title" /></div>
    <div class="form-group"><label class="form-label">Message</label><textarea class="form-control" id="notif-msg" rows="3" placeholder="Notification message..."></textarea></div>
    <button class="btn btn-primary" onclick="sendManualNotif()"><i class="fas fa-paper-plane"></i> Send Notification</button>
  </div>`;
}

function sendManualNotif(){
  const to = document.getElementById('notif-to').value;
  const type = document.getElementById('notif-type').value;
  const title = document.getElementById('notif-title').value.trim();
  const message = document.getElementById('notif-msg').value.trim();
  if(!title||!message){ showToast('Fill all fields','error'); return; }
  addNotification({to,type,title,message});
  showToast('Notification sent!','success');
  navigateTo('notifications');
}
