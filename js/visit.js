// ===================== VISIT BOOKING MODULE =====================
function renderVisitPage(){
  const user = getCurrentUser();
  const visits = DB.get('visits')||[];

  return `
  <div class="page-header">
    <h1><i class="fas fa-calendar-check" style="color:var(--info)"></i> Book a Visit</h1>
    <p>Schedule a site visit to Sri Lakshmi Venkateswara Women's PG</p>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-title"><i class="fas fa-calendar-plus"></i> Schedule Your Visit</div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Full Name *</label><input class="form-control" id="v-name" placeholder="Your full name" value="${user.name!=='Guest'?user.name:''}" /></div>
        <div class="form-group"><label class="form-label">Mobile *</label><input class="form-control" id="v-mobile" type="tel" maxlength="10" placeholder="10-digit mobile" /></div>
      </div>
      <div class="form-group"><label class="form-label">Preferred Date *</label>
        <input class="form-control" id="v-date" type="date" min="${new Date().toISOString().slice(0,10)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Preferred Time *</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap" id="time-slots">
          ${['10:00','11:00','12:00','14:00','15:00','16:00','17:00'].map(t=>`
            <button class="slot-btn" onclick="selectSlot(this,'${t}')">${t}</button>`).join('')}
        </div>
        <input type="hidden" id="v-time" />
      </div>
      <div class="form-group"><label class="form-label">Purpose of Visit</label>
        <select class="form-control" id="v-purpose">
          <option>Check room availability</option>
          <option>Interested in joining</option>
          <option>Visiting a resident</option>
          <option>General inquiry</option>
          <option>Other</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">Additional Notes</label>
        <textarea class="form-control" id="v-notes" rows="3" placeholder="Any specific requirements or questions..."></textarea>
      </div>
      <button class="btn btn-primary btn-lg" style="width:100%;justify-content:center" onclick="bookVisit()">
        <i class="fas fa-calendar-check"></i> Confirm Booking
      </button>
    </div>

    <div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-title"><i class="fas fa-info-circle" style="color:var(--info)"></i> Visit Information</div>
        <div style="display:flex;flex-direction:column;gap:12px;font-size:13px">
          ${visitInfo('map-marker-alt','Address','#45, Lotus Colony, Madhapur, Hyderabad - 500081')}
          ${visitInfo('clock','Visiting Hours','10:00 AM – 6:00 PM (Mon–Sat)')}
          ${visitInfo('phone','Contact','+91 9999999999')}
          ${visitInfo('parking','Parking','Available (2-wheelers only)')}
          ${visitInfo('shield-alt','Security','CCTV & Biometric Entry')}
          ${visitInfo('wifi','Amenities','WiFi, AC/Non-AC, 24×7 Water, Laundry')}
        </div>
        <div style="margin-top:16px;padding:12px;background:rgba(59,130,246,.1);border-radius:10px;border:1px solid rgba(59,130,246,.2)">
          <p style="font-size:13px;color:var(--text2)"><i class="fas fa-lightbulb" style="color:var(--info)"></i> <strong>Tip:</strong> Bring your ID proof and a recent photo for faster onboarding if you decide to join!</p>
        </div>
      </div>

      ${user.role==='admin'?`
      <div class="card">
        <div class="card-title"><i class="fas fa-list"></i> All Visit Bookings</div>
        ${visits.length===0?'<div class="empty-state"><i class="fas fa-calendar"></i><p>No visit bookings yet</p></div>':
        visits.map(v=>`
          <div style="padding:12px;background:var(--bg3);border-radius:10px;margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div>
                <strong style="font-size:13px">${v.name}</strong>
                <div style="font-size:12px;color:var(--text3)"><i class="fas fa-phone"></i> ${v.mobile}</div>
                <div style="font-size:12px;color:var(--text2);margin-top:4px"><i class="fas fa-calendar"></i> ${formatDate(v.date)} at ${v.time}</div>
                <div style="font-size:12px;color:var(--text3)">${v.purpose}</div>
              </div>
              <div style="text-align:right">
                <span class="badge ${v.status==='confirmed'?'badge-success':v.status==='pending'?'badge-warning':'badge-danger'}">${v.status}</span>
                ${v.status==='pending'?`<div style="margin-top:6px;display:flex;gap:4px">
                  <button class="btn btn-success btn-sm" onclick="confirmVisit('${v.id}')"><i class="fas fa-check"></i></button>
                  <button class="btn btn-danger btn-sm" onclick="cancelVisit('${v.id}')"><i class="fas fa-times"></i></button>
                </div>`:''}
              </div>
            </div>
          </div>`).join('')}
      </div>`:''}
    </div>
  </div>`;
}

function visitInfo(icon, label, val){
  return `<div style="display:flex;gap:10px;padding:10px;background:var(--bg3);border-radius:8px">
    <i class="fas fa-${icon}" style="color:var(--primary-light);width:16px;margin-top:2px"></i>
    <div><div style="font-weight:600;color:var(--text)">${label}</div><div style="color:var(--text3);font-size:12px">${val}</div></div>
  </div>`;
}

function selectSlot(el, time){
  document.querySelectorAll('.slot-btn').forEach(b=>b.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('v-time').value = time;
}

function bookVisit(){
  const name=document.getElementById('v-name').value.trim();
  const mobile=document.getElementById('v-mobile').value.trim();
  const date=document.getElementById('v-date').value;
  const time=document.getElementById('v-time').value;
  const purpose=document.getElementById('v-purpose').value;
  const notes=document.getElementById('v-notes').value.trim();
  if(!name){ showToast('Enter your name','error'); return; }
  if(!/^[6-9]\d{9}$/.test(mobile)){ showToast('Enter valid mobile','error'); return; }
  if(!date){ showToast('Select a date','error'); return; }
  if(!time){ showToast('Select a time slot','error'); return; }
  const visits=DB.get('visits')||[];
  visits.push({id:genId('V'),name,mobile,date,time,purpose,notes,status:'pending',bookedOn:new Date().toISOString().slice(0,10)});
  DB.set('visits',visits);
  addNotification({to:'admin',type:'visit',title:'New Visit Booking',message:`${name} (${mobile}) has booked a visit on ${formatDate(date)} at ${time}. Purpose: ${purpose}`});
  showToast('Visit booked! We will confirm shortly.','success');
  // Reset form
  document.getElementById('v-name').value='';
  document.getElementById('v-mobile').value='';
  document.getElementById('v-date').value='';
  document.getElementById('v-time').value='';
  document.querySelectorAll('.slot-btn').forEach(b=>b.classList.remove('selected'));
}

function confirmVisit(id){
  const visits=DB.get('visits')||[];
  const v=visits.find(v=>v.id===id);
  if(v) v.status='confirmed';
  DB.set('visits',visits);
  addNotification({to:'admin',type:'visit',title:'Visit Confirmed',message:`Visit for ${v.name} on ${formatDate(v.date)} at ${v.time} confirmed.`});
  showToast('Visit confirmed!','success');
  navigateTo('visit');
}

function cancelVisit(id){
  const visits=DB.get('visits')||[];
  const v=visits.find(v=>v.id===id);
  if(v) v.status='cancelled';
  DB.set('visits',visits);
  showToast('Visit cancelled','warning');
  navigateTo('visit');
}
