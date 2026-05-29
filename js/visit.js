// ===================== VISIT BOOKING MODULE =====================
function renderVisitPage(){
  const user = getCurrentUser();
  const visits = DB.get('visits')||[];

  return `
  <div class="page-header">
    <h1><i class="fas fa-calendar-check" style="color:var(--info)"></i> Book a Visit</h1>
    <p>Schedule a site visit to Tarak Ram Luxury Women's PG</p>
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
      <div class="card" style="margin-bottom:16px;background:var(--card);border:1px solid var(--border);border-radius:20px;padding:24px;">
        <div style="text-align:center;border-bottom:1px solid var(--border);padding-bottom:12px;margin-bottom:16px;">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--accent);font-weight:700;margin-bottom:4px;">Premium Living Space</div>
          <h3 class="grad-text" style="font-family:'Poppins',sans-serif;font-size:20px;font-weight:800;margin-bottom:2px;line-height:1.2;">Tarak Ram</h3>
          <div style="font-family:'Poppins',sans-serif;font-size:14px;font-weight:700;color:var(--text);letter-spacing:1px;">LUXURY WOMEN'S PG</div>
          <p style="font-size:11px;color:var(--text3);font-style:italic;margin-top:2px;">"Comfort Living According to Your Vibe"</p>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;font-size:13px">
          ${visitInfo('map-marker-alt','Address','House No: 3-46/1/4/19, Keshava Nagar Colony, Gowlidoddli, Serilingampally, Rangareddy Dist-500032.')}
          ${visitInfo('phone','Contact Numbers','87900 27362, 97415 31077 (U. Navya)')}
          ${visitInfo('clock','Visiting Hours','10:00 AM – 6:00 PM (Mon–Sat)')}
          ${visitInfo('parking','Parking & Safety','Available (2-wheelers only) · CCTV Monitored')}
        </div>

        <div style="margin-top:16px;">
          <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;"><i class="fas fa-star" style="color:var(--accent);margin-right:4px;"></i> Key Amenities</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            ${miniFacility('wifi', 'Wi-Fi', 'High Speed')}
            ${miniFacility('utensils', 'Homely Food', 'Veg & Non-Veg')}
            ${miniFacility('video', 'CCTV', 'Surveillance')}
            ${miniFacility('shield-alt', '24/7 Security', 'Guards & Entry')}
            ${miniFacility('bolt', 'Power Backup', '24/7 Power')}
            ${miniFacility('tshirt', 'Washing', 'Machines')}
            ${miniFacility('snowflake', 'Refrigerators', 'Available')}
            ${miniFacility('tint', 'RO Purified', 'Drinking Water')}
          </div>
        </div>

        <div style="background:linear-gradient(135deg, rgba(124,58,237,0.12), rgba(236,72,153,0.08));border:1px solid var(--border);border-radius:12px;padding:10px;text-align:center;margin-top:16px;">
          <div style="font-size:9px;color:var(--text3);text-transform:uppercase;font-weight:600;letter-spacing:1px;margin-bottom:6px;">Sharing Options Available</div>
          <div style="display:flex;justify-content:center;gap:8px;">
            ${[1, 2, 3, 4].map(num => `<span style="width:24px;height:24px;border-radius:6px;background:var(--primary);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;">${num}</span>`).join('')}
          </div>
          <p style="font-size:10px;color:var(--text2);margin-top:6px;"><i class="fas fa-heart" style="color:var(--secondary)"></i> A Home Away From Home</p>
        </div>

        <div style="margin-top:16px;padding:12px;background:rgba(124,58,237,.08);border-radius:10px;border:1px solid rgba(124,58,237,.15)">
          <p style="font-size:12px;color:var(--text2);line-height:1.4;"><i class="fas fa-lightbulb" style="color:var(--accent)"></i> <strong>Tip:</strong> Bring your ID proof (Aadhar/Passport) and a passport size photo for instant, hassle-free onboarding if you decide to join!</p>
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
      </div>` : renderGuestVisits()}
    </div>
  </div>`;
}

function visitInfo(icon, label, val){
  return `<div style="display:flex;gap:10px;padding:10px;background:var(--bg3);border-radius:8px">
    <i class="fas fa-${icon}" style="color:var(--primary-light);width:16px;margin-top:2px"></i>
    <div><div style="font-weight:600;color:var(--text)">${label}</div><div style="color:var(--text3);font-size:11.5px;line-height:1.3;">${val}</div></div>
  </div>`;
}

function miniFacility(icon, label, desc){
  return `
  <div style="display:flex;align-items:center;gap:8px;background:var(--bg3);padding:6px 10px;border-radius:8px;border:1px solid rgba(124,58,237,0.06)">
    <div style="width:24px;height:24px;border-radius:6px;background:rgba(124,58,237,0.12);display:flex;align-items:center;justify-content:center;color:var(--primary-light);font-size:11px;"><i class="fas fa-${icon}"></i></div>
    <div style="font-size:10px;font-weight:600;line-height:1.2;color:var(--text2);">${label}<br/><span style="color:var(--text3);font-weight:normal;font-size:9px;">${desc}</span></div>
  </div>`;
}

function selectSlot(el, time){
  document.querySelectorAll('.slot-btn').forEach(b=>b.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('v-time').value = time;
}

async function bookVisit(){
  const user = getCurrentUser();
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

  showToast('Booking visit in database...', 'info');

  try {
    const newVisit = {
      name,
      mobile,
      date,
      time,
      purpose,
      notes,
      status: 'pending',
      bookedOn: new Date().toISOString().slice(0,10),
      visitor_id: user ? user.id : 'guest'
    };

    const res = await saveNewVisitToDB(newVisit);
    
    // Save this visit's DB ID in guest local storage
    const myVisits = DB.get('my_visits') || [];
    if (res && res[0]) {
      myVisits.push(res[0].id);
      DB.set('my_visits', myVisits);
    }

    addNotification({to:'admin',type:'visit',title:'New Visit Booking',message:`${name} (${mobile}) has booked a visit on ${formatDate(date)} at ${time}. Purpose: ${purpose}`});
    showToast('Visit booked successfully! We will confirm shortly.','success');
    
    // Reset form
    document.getElementById('v-name').value='';
    document.getElementById('v-mobile').value='';
    document.getElementById('v-date').value='';
    document.getElementById('v-time').value='';
    document.querySelectorAll('.slot-btn').forEach(b=>b.classList.remove('selected'));
    
    navigateTo('visit');
  } catch (err) {
    console.error('Book visit error:', err);
    showToast('Could not save booking to database', 'error');
  }
}

async function confirmVisit(id){
  const visits = DB.get('visits') || [];
  const v = visits.find(v => v.id === id);
  if (v) {
    try {
      showToast('Confirming visit in database...', 'info');
      await updateVisitStatusInDB(v.db_id, 'confirmed');
      
      addNotification({to:'admin',type:'visit',title:'Visit Confirmed',message:`Visit for ${v.name} on ${formatDate(v.date)} at ${v.time} confirmed.`});
      
      if (v.visitor_id && v.visitor_id !== 'guest') {
        addNotification({
          to: v.visitor_id,
          type: 'visit',
          title: 'Visit Approved & Confirmed! 🎉',
          message: `Your requested visit on ${formatDate(v.date)} at ${v.time} has been approved and confirmed. We look forward to seeing you!`
        });
      }
      
      showToast('Visit confirmed successfully!','success');
      navigateTo('visit');
    } catch (err) {
      console.error('Confirm visit error:', err);
      showToast('Failed to confirm visit in database', 'error');
    }
  }
}

async function cancelVisit(id){
  const visits = DB.get('visits') || [];
  const v = visits.find(v => v.id === id);
  if (v) {
    try {
      showToast('Cancelling visit in database...', 'info');
      await updateVisitStatusInDB(v.db_id, 'cancelled');
      showToast('Visit cancelled','warning');
      navigateTo('visit');
    } catch (err) {
      console.error('Cancel visit error:', err);
      showToast('Failed to cancel visit in database', 'error');
    }
  }
}

function renderGuestVisits() {
  const user = getCurrentUser();
  const allVisits = DB.get('visits') || [];
  const myVisitIds = DB.get('my_visits') || [];
  
  const myVisits = allVisits.filter(v => {
    if (user && user.mobile && v.mobile === user.mobile) return true;
    if (user && user.id && v.visitor_id === user.id) return true;
    if (myVisitIds.includes(v.db_id) || myVisitIds.includes(parseInt(v.id.replace('V','')))) return true;
    return false;
  });
  
  if (myVisits.length === 0) {
    return '';
  }
  
  return `
  <div class="card" style="margin-top: 16px;">
    <div class="card-title"><i class="fas fa-calendar-check"></i> My Scheduled Visits</div>
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${myVisits.map(v => {
        let statusBadge = '';
        let infoMessage = '';
        if (v.status === 'pending') {
          statusBadge = '<span class="badge badge-warning">Pending Approval</span>';
          infoMessage = '<p style="font-size:12px;color:var(--text3);margin-top:6px;"><i class="fas fa-info-circle"></i> Our team is reviewing your visit request. You will see an update here once confirmed.</p>';
        } else if (v.status === 'confirmed') {
          statusBadge = '<span class="badge badge-success">Approved &amp; Confirmed</span>';
          infoMessage = `
            <div style="margin-top:8px;padding:10px;background:rgba(16,185,129,.08);border-radius:8px;border:1px solid rgba(16,185,129,.15)">
              <p style="font-size:12px;color:var(--success);line-height:1.4;margin:0">
                <i class="fas fa-check-circle"></i> <strong>Approved!</strong> We are excited to meet you! Please arrive on time at the scheduled slot.
              </p>
              <p style="font-size:11.5px;color:var(--text2);margin:4px 0 0 0">
                <strong>Directions &amp; Contact:</strong> U. Navya (<a href="tel:8790027362" style="color:var(--primary-light);text-decoration:none">87900 27362</a>, <a href="tel:9741531077" style="color:var(--primary-light);text-decoration:none">97415 31077</a>).
              </p>
            </div>`;
        } else {
          statusBadge = '<span class="badge badge-danger">Cancelled</span>';
          infoMessage = '<p style="font-size:12px;color:var(--danger);margin-top:6px;"><i class="fas fa-times-circle"></i> This visit request was cancelled.</p>';
        }
        
        return `
        <div style="padding:14px;background:var(--bg3);border-radius:12px;border:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
            <div>
              <div style="font-weight:600;font-size:14px;color:var(--text);">${v.name}</div>
              <div style="font-size:12px;color:var(--text3);margin-top:2px"><i class="fas fa-calendar-alt"></i> ${formatDate(v.date)} at <strong>${v.time}</strong></div>
              <div style="font-size:12px;color:var(--text3);margin-top:2px"><i class="fas fa-question-circle"></i> Purpose: ${v.purpose}</div>
            </div>
            <div>
              ${statusBadge}
            </div>
          </div>
          ${infoMessage}
        </div>`;
      }).join('')}
    </div>
  </div>`;
}
