// ===================== FINANCE MODULE =====================
let activeFinanceTab = 'dues';
let activeExpenseFilter = 'all';

function switchFinanceTab(tab){
  activeFinanceTab = tab;
  navigateTo('finance');
}

function renderFinancePage(){
  const user = getCurrentUser();
  if(user.role==='tenant') return renderTenantFinance();

  const tabHeader = `
  <div class="tab-pills" style="margin-bottom:20px;display:flex;gap:8px;background:var(--bg3);padding:4px;border-radius:12px;max-width:320px">
    <button class="tab-pill ${activeFinanceTab==='dues'?'active':''}" style="flex:1;padding:8px 12px;text-align:center;font-size:13px" onclick="switchFinanceTab('dues')"><i class="fas fa-rupee-sign"></i> Rent &amp; Dues</button>
    <button class="tab-pill ${activeFinanceTab==='expenses'?'active':''}" style="flex:1;padding:8px 12px;text-align:center;font-size:13px" onclick="switchFinanceTab('expenses')"><i class="fas fa-receipt"></i> Daily Expenses</button>
  </div>`;

  if(activeFinanceTab === 'dues'){
    return tabHeader + renderDuesSection();
  } else {
    return tabHeader + renderExpensesSection();
  }
}

function renderDuesSection(){
  const tenants = (DB.get('tenants')||[]).filter(t=>t.status==='active');
  const activeTenantIds = tenants.map(t=>t.id);
  const payments = (DB.get('payments')||[]).filter(p=>activeTenantIds.includes(p.tenantId));
  const totalExpected = tenants.reduce((s,t)=>s+t.rent,0);
  const collected = payments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.amount,0);
  const pending = payments.filter(p=>p.status==='pending').reduce((s,p)=>s+p.amount,0);
  const pendingList = payments.filter(p=>p.status==='pending');
  const currentMonth = new Date().toISOString().slice(0,7);
  const thisMonthPaid = payments.filter(p=>p.month===currentMonth&&p.status==='paid').length;
  const thisMonthTotal = payments.filter(p=>p.month===currentMonth).length;

  return `
  <div class="page-header" style="margin-top:10px">
    <h1><i class="fas fa-rupee-sign" style="color:var(--success)"></i> Rent Collection</h1>
    <p>Monthly Rent Collection Overview</p>
  </div>
  <div class="stats-grid">
    <div class="stat-card green"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div><div class="stat-value">₹${(collected/1000).toFixed(0)}K</div><div class="stat-label">Total Collected</div></div>
    <div class="stat-card pink"><div class="stat-icon pink"><i class="fas fa-clock"></i></div><div class="stat-value">₹${(pending/1000).toFixed(0)}K</div><div class="stat-label">Pending Dues</div></div>
    <div class="stat-card purple"><div class="stat-icon purple"><i class="fas fa-users"></i></div><div class="stat-value">${thisMonthPaid}/${thisMonthTotal}</div><div class="stat-label">This Month Paid</div></div>
    <div class="stat-card amber"><div class="stat-icon amber"><i class="fas fa-exclamation-triangle"></i></div><div class="stat-value">${pendingList.length}</div><div class="stat-label">Overdue Payments</div></div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-title"><i class="fas fa-exclamation-circle" style="color:var(--danger)"></i> Pending Dues</div>
      ${pendingList.length===0?'<div class="empty-state"><i class="fas fa-check-circle" style="color:var(--success)"></i><p>No pending dues!</p></div>':
      pendingList.slice(0,8).map(p=>{
        const t = tenants.find(t=>t.id===p.tenantId) || {name:p.tenantName, mobile:'', occupation:''};
        return `
        <div class="due-item">
          <div>
            <div style="font-weight:600;font-size:13px">${t.name} <span style="font-size:11px;color:var(--text3);font-weight:normal">(${t.mobile} - ${t.occupation})</span></div>
            <div style="font-size:11px;color:var(--text3)">Room ${(p.roomId || '').replace('R','')} · ${p.month}</div>
            <div style="font-size:11px;color:var(--danger)"><i class="fas fa-calendar-times"></i> Due: ${formatDate(p.dueDate)}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:16px;font-weight:700;color:var(--danger)">₹${p.amount.toLocaleString()}</div>
            <button class="btn btn-success btn-sm" style="margin-top:4px" onclick="recordPayment('${p.id}')"><i class="fas fa-check"></i> Mark Paid</button>
          </div>
        </div>`}).join('')}
      ${pendingList.length>8?`<p style="text-align:center;font-size:12px;color:var(--text3);margin-top:8px">+${pendingList.length-8} more</p>`:''}
    </div>

    <div class="card">
      <div class="card-title"><i class="fas fa-chart-bar"></i> Monthly Collection</div>
      ${['2026-01','2026-02','2026-03','2026-04','2026-05'].map(m=>{
        const mPayments = payments.filter(p=>p.month===m);
        const mPaid = mPayments.filter(p=>p.status==='paid').length;
        const pct = mPayments.length ? Math.round(mPaid/mPayments.length*100) : 0;
        const amount = mPayments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.amount,0);
        return `<div style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
            <span style="font-weight:500">${m}</span>
            <span style="color:var(--text3)">${mPaid}/${mPayments.length} · ₹${amount.toLocaleString()}</span>
            <span style="color:${pct>=80?'var(--success)':pct>=50?'var(--accent)':'var(--danger)'};font-weight:600">${pct}%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${pct>=80?'var(--success)':pct>=50?'var(--accent)':'var(--danger)'}"></div></div>
        </div>`;
      }).join('')}
      <div style="margin-top:16px;display:flex;gap:10px">
        <button class="btn btn-primary btn-sm" onclick="addPaymentModal()"><i class="fas fa-plus"></i> Record Payment</button>
        <button class="btn btn-secondary btn-sm" onclick="exportFinance()"><i class="fas fa-download"></i> Export</button>
        <button class="btn btn-secondary btn-sm" onclick="sendDueReminders()"><i class="fas fa-bell"></i> Send Reminders</button>
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:20px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <span class="card-title" style="margin-bottom:0"><i class="fas fa-history"></i> Payment Register</span>
      <div style="display:flex;gap:10px">
        <select class="form-control" id="pay-month-filter" style="width:140px" onchange="filterPayments()">
          <option value="">All Months</option>
          ${['2026-05','2026-04','2026-03','2026-02','2026-01'].map(m=>`<option value="${m}">${m}</option>`).join('')}
        </select>
        <select class="form-control" id="pay-status-filter" style="width:120px" onchange="filterPayments()">
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>
      </div>
    </div>
    <div class="table-wrap" id="pay-table">
      ${renderPaymentTable(payments.slice(0,15))}
    </div>
  </div>`;
}

function renderPaymentTable(list){
  const user = getCurrentUser();
  const tenants = DB.get('tenants')||[];
  return `<table>
    <thead><tr><th>Tenant</th><th>Room</th><th>Month</th><th>Amount</th><th>Due Date</th><th>Paid On</th><th>Mode</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>
      ${list.map(p=>{
        const t = tenants.find(t=>t.id===p.tenantId) || {name:p.tenantName, mobile:'', occupation:''};
        return `
        <tr>
          <td><strong>${t.name}</strong><br/><span style="font-size:11px;color:var(--text3)">${t.mobile} - ${t.occupation}</span></td>
          <td>${(p.roomId || '').replace('R','')}</td>
          <td>${p.month}</td>
          <td>₹${p.amount.toLocaleString()}</td>
          <td>${formatDate(p.dueDate)}</td>
          <td>${formatDate(p.paidOn)}</td>
          <td>${p.paymentMode||'—'}</td>
          <td><span class="badge ${p.status==='paid'?'badge-success':'badge-danger'}">${p.status}</span></td>
          <td>${p.status==='pending'?
            (user.role==='tenant'?`<button class="btn btn-primary btn-sm" onclick="triggerTenantPaymentGateway('${p.id}')"><i class="fas fa-lock"></i> Pay Now</button>`:
            `<button class="btn btn-success btn-sm" onclick="recordPayment('${p.id}')"><i class="fas fa-check"></i> Mark Paid</button>`)
            :'<span style="color:var(--text3);font-size:12px">✓ Settled</span>'}</td>
        </tr>`; }).join('')}
    </tbody>
  </table>`;
}

function filterPayments(){
  const month = document.getElementById('pay-month-filter').value;
  const status = document.getElementById('pay-status-filter').value;
  const tenants = DB.get('tenants')||[];
  const activeIds = tenants.map(t=>t.id);
  let payments = (DB.get('payments')||[]).filter(p=>activeIds.includes(p.tenantId));
  if(month) payments = payments.filter(p=>p.month===month);
  if(status) payments = payments.filter(p=>p.status===status);
  document.getElementById('pay-table').innerHTML = renderPaymentTable(payments);
}

// ===================== SECURE PAYMENT GATEWAY SIMULATOR =====================
function triggerPaymentGateway(amount, purpose, onPaymentSuccess){
  window.activePaymentCallback = onPaymentSuccess;

  // Real SMS alert billing to +91-9492947038
  try {
    const billingMobile = "9492947038";
    const smsBody = `SLV PG Hostels Checkout: A payment request of ₹${amount.toLocaleString()} for '${purpose}' is pending. Please complete secure pay.`;
    sendRealSMS(billingMobile, '', smsBody);
  } catch (e) {
    console.error("SMS notification failed:", e);
  }

  const overlay = document.getElementById('modal-overlay');
  const container = document.getElementById('modal-container');
  overlay.classList.remove('hidden');
  container.classList.remove('hidden');
  
  container.innerHTML = `
  <div class="modal" style="max-width:440px;padding:0;overflow:hidden;border-radius:18px;border:1px solid var(--border);background:var(--card)">
    <div style="background:linear-gradient(135deg,var(--primary-dark),var(--primary));padding:18px;color:#fff;display:flex;align-items:center;justify-content:between">
      <div style="display:flex;align-items:center;gap:10px">
        <i class="fas fa-shield-alt" style="font-size:22px;color:var(--accent)"></i>
        <div style="text-align:left">
          <h3 style="margin:0;font-family:'Poppins',sans-serif;font-size:15px;font-weight:700">SLV Secure Checkout</h3>
          <p style="margin:2px 0 0;font-size:10px;opacity:0.8">100% Encrypted Payment Gateway</p>
        </div>
      </div>
      <button class="modal-close" style="color:#fff;background:none;border:none;cursor:pointer;font-size:18px;margin-left:auto" onclick="closeModal()"><i class="fas fa-times"></i></button>
    </div>
    
    <div style="padding:20px;text-align:left">
      <!-- Invoice Box -->
      <div style="background:var(--bg3);padding:14px;border-radius:12px;margin-bottom:16px;border:1px solid var(--border)">
        <div style="font-size:11px;color:var(--text3);margin-bottom:3px">PAYMENT DESCRIPTION</div>
        <div style="font-weight:600;font-size:13px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${purpose}</div>
        <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;border-top:1px dashed var(--border);padding-top:8px">
          <span style="font-size:12px;color:var(--text2)">Total Amount</span>
          <span style="font-size:17px;font-weight:800;color:var(--success)">₹${amount.toLocaleString()}</span>
        </div>
      </div>
      
      <!-- Payment Methods Selector Tabs -->
      <div style="display:flex;gap:6px;margin-bottom:16px;background:var(--bg3);padding:4px;border-radius:10px">
        <button class="tab-pill active" id="pg-btn-upi" style="padding:8px;font-size:12px;flex:1" onclick="selectPayMethod('upi')"><i class="fas fa-mobile-alt"></i> UPI / QR</button>
        <button class="tab-pill" id="pg-btn-card" style="padding:8px;font-size:12px;flex:1" onclick="selectPayMethod('card')"><i class="fas fa-credit-card"></i> Card</button>
        <button class="tab-pill" id="pg-btn-net" style="padding:8px;font-size:12px;flex:1" onclick="selectPayMethod('net')"><i class="fas fa-university"></i> Bank</button>
      </div>
      
      <!-- UPI Tab View -->
      <div id="pg-tab-upi" class="pg-tab">
        <div style="text-align:center;margin-bottom:12px">
          <!-- Mock QR Code SVG -->
          <div style="background:#fff;padding:12px;display:inline-block;border-radius:10px;margin-bottom:8px">
            <svg width="130" height="130" viewBox="0 0 100 100" style="display:block">
              <rect x="0" y="0" width="100" height="100" fill="none"/>
              <rect x="5" y="5" width="25" height="25" fill="#0f0a1e" stroke="#7c3aed" stroke-width="3"/>
              <rect x="11" y="11" width="13" height="13" fill="#ec4899"/>
              <rect x="70" y="5" width="25" height="25" fill="#0f0a1e" stroke="#7c3aed" stroke-width="3"/>
              <rect x="76" y="11" width="13" height="13" fill="#ec4899"/>
              <rect x="5" y="70" width="25" height="25" fill="#0f0a1e" stroke="#7c3aed" stroke-width="3"/>
              <rect x="11" y="76" width="13" height="13" fill="#ec4899"/>
              <rect x="40" y="40" width="20" height="20" fill="#7c3aed" rx="3"/>
              <circle cx="50" cy="50" r="4" fill="#fff"/>
              <rect x="35" y="10" width="6" fill="#0f0a1e"/>
              <rect x="45" y="15" width="12" height="6" fill="#0f0a1e"/>
              <rect x="35" y="25" width="10" height="10" fill="#0f0a1e"/>
              <rect x="55" y="5" width="8" height="12" fill="#0f0a1e"/>
              <rect x="70" y="35" width="15" height="5" fill="#0f0a1e"/>
              <rect x="80" y="45" width="10" height="15" fill="#0f0a1e"/>
              <rect x="35" y="70" width="15" height="12" fill="#0f0a1e"/>
              <rect x="40" y="85" width="25" height="8" fill="#0f0a1e"/>
              <rect x="70" y="70" width="20" height="20" fill="#0f0a1e"/>
            </svg>
          </div>
          <p style="font-size:11px;color:var(--text3)">Scan QR with GPay, PhonePe, Paytm, or BHIM</p>
          <div style="font-size:11px;font-weight:700;color:var(--accent);margin-top:4px"><i class="fas fa-clock"></i> Expires in <span id="pg-timer">05:00</span></div>
        </div>
        <div style="text-align:center;font-size:11px;color:var(--text3);margin-bottom:8px">— OR PAY WITH UPI ID —</div>
        <div class="form-group" style="margin-bottom:0">
          <div style="display:flex;gap:8px">
            <input class="form-control" id="pg-upi-id" placeholder="e.g. mobile@upi" style="font-size:13px" />
            <button class="btn btn-primary" style="flex-shrink:0;padding:10px 14px" onclick="pgVerifyAndPay('upi', ${amount})">Pay</button>
          </div>
        </div>
      </div>
      
      <!-- Card Tab View -->
      <div id="pg-tab-card" class="pg-tab hidden">
        <div class="form-group">
          <label class="form-label" style="font-size:11px">Cardholder Name</label>
          <input class="form-control" id="pg-card-name" placeholder="Name on card" style="font-size:13px;padding:9px 12px" />
        </div>
        <div class="form-group" style="position:relative">
          <label class="form-label" style="font-size:11px">Card Number</label>
          <input class="form-control" id="pg-card-num" placeholder="0000 0000 0000 0000" maxlength="19" oninput="formatCardNum(this)" style="font-size:13px;padding:9px 12px" />
          <div id="pg-card-logo" style="position:absolute;right:12px;top:31px;font-size:18px;color:var(--text3)"><i class="far fa-credit-card"></i></div>
        </div>
        <div class="form-row">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label" style="font-size:11px">Expiry Date</label>
            <input class="form-control" id="pg-card-exp" placeholder="MM/YY" maxlength="5" oninput="formatCardExp(this)" style="font-size:13px;padding:9px 12px;text-align:center" />
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label" style="font-size:11px">CVV Code</label>
            <input class="form-control" id="pg-card-cvv" type="password" placeholder="***" maxlength="3" oninput="this.value=this.value.replace(/[^0-9]/g,'')" style="font-size:13px;padding:9px 12px;text-align:center" />
          </div>
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:16px;font-size:13px" onclick="pgVerifyAndPay('card', ${amount})">Pay Securely ₹${amount.toLocaleString()}</button>
      </div>
      
      <!-- Net Banking Tab View -->
      <div id="pg-tab-net" class="pg-tab hidden">
        <label class="form-label" style="font-size:11px">Popular Banks</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
          <button class="btn btn-secondary btn-sm" style="font-size:12px;justify-content:flex-start;padding:8px" onclick="selectNetBank('SBI', this)">🏦 SBI</button>
          <button class="btn btn-secondary btn-sm" style="font-size:12px;justify-content:flex-start;padding:8px" onclick="selectNetBank('HDFC', this)">🏦 HDFC Bank</button>
          <button class="btn btn-secondary btn-sm" style="font-size:12px;justify-content:flex-start;padding:8px" onclick="selectNetBank('ICICI', this)">🏦 ICICI Bank</button>
          <button class="btn btn-secondary btn-sm" style="font-size:12px;justify-content:flex-start;padding:8px" onclick="selectNetBank('Axis', this)">🏦 Axis Bank</button>
        </div>
        <input type="hidden" id="pg-selected-bank" />
        <button class="btn btn-primary" style="width:100%;justify-content:center;font-size:13px" onclick="pgVerifyAndPay('net', ${amount})">Pay Securely ₹${amount.toLocaleString()}</button>
      </div>
      
      <!-- Safe Badges -->
      <div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-top:16px;border-top:1px solid var(--border);padding-top:10px;font-size:9px;color:var(--text3)">
        <span><i class="fas fa-lock" style="color:var(--success)"></i> PCI-DSS Secure</span>
        <span><i class="fas fa-check-circle" style="color:var(--info)"></i> SSL Encryption</span>
      </div>
    </div>
  </div>`;
  
  // Timer countdown
  let time = 300;
  const pgTimer = document.getElementById('pg-timer');
  const timerInterval = setInterval(() => {
    if (!pgTimer || !document.getElementById('pg-timer')) { clearInterval(timerInterval); return; }
    time--;
    const mins = Math.floor(time / 60).toString().padStart(2, '0');
    const secs = (time % 60).toString().padStart(2, '0');
    pgTimer.textContent = `${mins}:${secs}`;
    if (time <= 0) {
      clearInterval(timerInterval);
      pgTimer.textContent = "Expired";
      closeModal();
      showToast('Payment request timed out', 'error');
    }
  }, 1000);
}

function selectPayMethod(method){
  document.querySelectorAll('.pg-tab').forEach(el=>el.classList.add('hidden'));
  document.getElementById(`pg-tab-${method}`).classList.remove('hidden');
  
  ['upi','card','net'].forEach(m=>{
    const btn = document.getElementById(`pg-btn-${m}`);
    if(m===method) btn.classList.add('active');
    else btn.classList.remove('active');
  });
}

function formatCardNum(el){
  let v = el.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  let matches = v.match(/\d{4,16}/g);
  let match = matches && matches[0] || '';
  let parts = [];
  for (let i=0, len=match.length; i<len; i+=4) {
    parts.push(match.substring(i, i+4));
  }
  el.value = parts.length > 0 ? parts.join(' ') : v;
  
  const logo = document.getElementById('pg-card-logo');
  if(v.startsWith('4')) logo.innerHTML = '<i class="fab fa-cc-visa" style="color:#1a1f71"></i>';
  else if(v.startsWith('5')) logo.innerHTML = '<i class="fab fa-cc-mastercard" style="color:#eb001b"></i>';
  else if(v.startsWith('3')) logo.innerHTML = '<i class="fab fa-cc-amex" style="color:#007bc1"></i>';
  else logo.innerHTML = '<i class="far fa-credit-card"></i>';
}

function formatCardExp(el){
  let v = el.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  el.value = v.length >= 2 ? v.substring(0,2) + '/' + v.substring(2,4) : v;
}

function selectNetBank(bank, btn){
  document.getElementById('pg-selected-bank').value = bank;
  btn.parentNode.querySelectorAll('button').forEach(b=>{
    b.style.borderColor = 'var(--border)';
    b.style.background = 'var(--bg3)';
  });
  btn.style.borderColor = 'var(--primary)';
  btn.style.background = 'rgba(124,58,237,0.1)';
}

function pgVerifyAndPay(method, amount){
  // Check net banking bank selection
  if(method==='net' && !document.getElementById('pg-selected-bank').value){
    showToast('Select a bank first','error');
    return;
  }
  // Check Card credentials simple check
  if(method==='card'){
    const name = document.getElementById('pg-card-name').value.trim();
    const num = document.getElementById('pg-card-num').value.replace(/\s/g,'');
    const exp = document.getElementById('pg-card-exp').value;
    const cvv = document.getElementById('pg-card-cvv').value;
    if(!name||num.length<15||exp.length<5||cvv.length<3){
      showToast('Enter complete card parameters','error');
      return;
    }
  }
  // Check UPI
  if(method==='upi'){
    const upi = document.getElementById('pg-upi-id').value.trim();
    if(upi && !upi.includes('@')){
      showToast('Enter valid UPI ID (e.g. mobile@upi)','error');
      return;
    }
  }

  const container = document.getElementById('modal-container');
  container.innerHTML = `
  <div class="modal" style="max-width:380px;padding:36px 20px;text-align:center;background:var(--card)">
    <div style="position:relative;width:68px;height:68px;margin:0 auto 20px">
      <div style="position:absolute;inset:0;border:4px solid var(--border);border-radius:50%"></div>
      <div style="position:absolute;inset:0;border:4px solid transparent;border-top-color:var(--primary);border-radius:50%;animation:pg-spin 1s linear infinite"></div>
    </div>
    <h3 style="font-family:'Poppins',sans-serif;font-size:15px;margin-bottom:6px">Contacting bank secure vaults...</h3>
    <p style="font-size:12px;color:var(--text3)" id="pg-load-msg">Awaiting secure network callback...</p>
  </div>`;
  
  if(!document.getElementById('pg-spin-style')){
    const s = document.createElement('style');
    s.id = 'pg-spin-style';
    s.innerHTML = '@keyframes pg-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }';
    document.head.appendChild(s);
  }

  const loadMsg = document.getElementById('pg-load-msg');
  setTimeout(()=>{ if(loadMsg) loadMsg.textContent="Verifying anti-fraud metrics..."; }, 1200);
  setTimeout(()=>{ if(loadMsg) loadMsg.textContent="Executing general ledger ledger updates..."; }, 2400);

  setTimeout(()=>{
    const txnId = 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    container.innerHTML = `
    <div class="modal" style="max-width:380px;padding:36px 20px;text-align:center;background:var(--card)">
      <div style="width:64px;height:64px;background:rgba(16,185,129,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;color:var(--success);margin:0 auto 16px animate-pulse">
        <i class="fas fa-check-circle"></i>
      </div>
      <h3 style="font-family:'Poppins',sans-serif;font-size:18px;color:var(--success);margin-bottom:6px">Payment Successful!</h3>
      <p style="font-size:12px;color:var(--text2);margin-bottom:16px">Transaction authorized and captured successfully.</p>
      
      <div style="background:var(--bg3);border-radius:10px;padding:12px;text-align:left;font-size:12px;margin-bottom:20px;border:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:var(--text3)">Transaction ID:</span><span style="font-weight:600;color:var(--text)">${txnId}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:var(--text3)">Payment Mode:</span><span style="font-weight:600;color:var(--text)">${method.toUpperCase()} Sim</span></div>
        <div style="display:flex;justify-content:space-between"><span style="color:var(--text3)">Status:</span><span style="font-weight:700;color:var(--success)">SETTLED</span></div>
      </div>
      
      <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="closeModal(); pgCallbackTrigger('${txnId}', '${method}')">OK, Continue</button>
    </div>`;
    
    window.pgPendingCallback = () => {
      if (window.activePaymentCallback) {
        window.activePaymentCallback(txnId, method.toUpperCase() + ' Simulator');
        delete window.activePaymentCallback;
      }
    };
  }, 3600);
}

function pgCallbackTrigger(txn, mode){
  if(window.pgPendingCallback){
    window.pgPendingCallback();
    delete window.pgPendingCallback;
  }
}

function triggerTenantPaymentGateway(payId){
  const payments = DB.get('payments')||[];
  const p = payments.find(p=>p.id===payId);
  if(!p) return;
  
  triggerPaymentGateway(p.amount, `Rent Collection — ${p.month}`, (txnId, method) => {
    p.status = 'paid';
    p.paymentMode = method;
    p.txnId = txnId;
    p.paidOn = new Date().toISOString().slice(0,10);
    DB.set('payments', payments);
    
    addNotification({to:p.tenantId,type:'payment',title:'Rent Payment Success',message:`Your rent of ₹${p.amount.toLocaleString()} for ${p.month} has been cleared via ${method}. Txn: ${txnId}.`});
    showToast('Rent Paid Successfully!','success');
    const user = getCurrentUser();
    navigateTo(user.role === 'guest' ? 'reminders' : 'finance');
  });
}

function recordPayment(payId){
  showModal('Record Payment',`
    <div class="form-group"><label class="form-label">Payment Mode</label>
      <select class="form-control" id="rp-mode">
        <option>Cash</option><option>UPI</option><option>NEFT</option><option>Cheque</option>
      </select>
    </div>
    <div class="form-group"><label class="form-label">Transaction ID (optional)</label><input class="form-control" id="rp-txn" placeholder="UPI/NEFT ref number" /></div>
    <div class="form-group"><label class="form-label">Paid On</label><input class="form-control" id="rp-date" type="date" value="${new Date().toISOString().slice(0,10)}" /></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-success" onclick="savePayment('${payId}')"><i class="fas fa-check"></i> Confirm Payment</button>
    </div>`,false);
}

function savePayment(payId){
  const mode = document.getElementById('rp-mode').value;
  const txn = document.getElementById('rp-txn').value.trim();
  const date = document.getElementById('rp-date').value;
  const payments = DB.get('payments')||[];
  const p = payments.find(p=>p.id===payId);
  if(p){
    p.status='paid'; p.paymentMode=mode; p.txnId=txn||genId('TXN'); p.paidOn=date;
    DB.set('payments',payments);
    addNotification({to:p.tenantId,type:'payment',title:'Rent Received',message:`Your rent of ₹${p.amount.toLocaleString()} for ${p.month} has been received. Thank you!`});
    closeModal();
    showToast('Payment recorded!','success');
    navigateTo('finance');
  }
}

function addPaymentModal(){
  const tenants = (DB.get('tenants')||[]).filter(t=>t.status==='active');
  const currentMonth = new Date().toISOString().slice(0,7);
  showModal('Record New Payment',`
    <div class="form-group"><label class="form-label">Tenant *</label>
      <select class="form-control" id="np-tenant">
        ${tenants.map(t=>`<option value="${t.id}">${t.name} - Room ${(t.roomId || '').replace('R','')} (₹${t.rent.toLocaleString()})</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Month *</label><input class="form-control" id="np-month" type="month" value="${currentMonth}" /></div>
      <div class="form-group"><label class="form-label">Amount (₹) *</label><input class="form-control" id="np-amount" type="number" placeholder="8000" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Mode</label><select class="form-control" id="np-mode"><option>Cash</option><option>UPI</option><option>NEFT</option><option>Cheque</option></select></div>
      <div class="form-group"><label class="form-label">Paid On</label><input class="form-control" id="np-date" type="date" value="${new Date().toISOString().slice(0,10)}" /></div>
    </div>
    <div class="form-group"><label class="form-label">Transaction ID</label><input class="form-control" id="np-txn" placeholder="Optional" /></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-success" onclick="saveNewPayment()"><i class="fas fa-save"></i> Save Payment</button>
    </div>`,false);
}

function saveNewPayment(){
  const tenantId=document.getElementById('np-tenant').value;
  const month=document.getElementById('np-month').value;
  const amount=parseInt(document.getElementById('np-amount').value);
  const mode=document.getElementById('np-mode').value;
  const date=document.getElementById('np-date').value;
  const txn=document.getElementById('np-txn').value.trim();
  if(!tenantId||!month||!amount){ showToast('Fill required fields','error'); return; }
  const tenant=(DB.get('tenants')||[]).find(t=>t.id===tenantId);
  const payments=DB.get('payments')||[];
  payments.push({id:genId('P'),tenantId,tenantName:tenant.name,roomId:tenant.roomId,month,amount,status:'paid',paidOn:date,dueDate:`${month}-05`,paymentMode:mode,txnId:txn||genId('TXN')});
  DB.set('payments',payments);
  addNotification({to:tenantId,type:'payment',title:'Rent Received',message:`Your rent of ₹${amount.toLocaleString()} for ${month} has been received.`});
  closeModal();
  showToast('Payment recorded!','success');
  navigateTo('finance');
}

function sendDueReminders(){
  const pending = (DB.get('payments')||[]).filter(p=>p.status==='pending');
  const tenantIds = [...new Set(pending.map(p=>p.tenantId))];
  tenantIds.forEach(tid=>{
    const tPending = pending.filter(p=>p.tenantId===tid);
    addNotification({to:tid,type:'due',title:'Rent Due Reminder',message:`You have ${tPending.length} pending payment(s). Total: ₹${tPending.reduce((s,p)=>s+p.amount,0).toLocaleString()}. Please pay at the earliest.`});
  });
  addNotification({to:'admin',type:'due',title:'Reminders Sent',message:`Due reminders sent to ${tenantIds.length} tenants.`});
  showToast(`Reminders sent to ${tenantIds.length} tenants!`,'success');
}

function sendIndividualReminder(tenantId, month) {
  const tenants = DB.get('tenants') || [];
  const t = tenants.find(x => x.id === tenantId);
  if (!t) return;
  
  addNotification({
    to: tenantId,
    type: 'due',
    title: 'Rent Due Reminder',
    message: `Dear ${t.name}, your rent of ₹${t.rent.toLocaleString()} for ${month} is pending. Please complete your payment at the earliest to avoid late fees.`
  });
  
  showToast(`Reminder sent to ${t.name} successfully!`, 'success');
}

function sendSelectedReminders(month) {
  const checkboxes = document.querySelectorAll('.rc-tenant-checkbox:checked');
  const selectedIds = Array.from(checkboxes).map(cb => cb.getAttribute('data-tenant-id'));
  
  if (selectedIds.length === 0) {
    showToast('Please select at least one tenant.', 'warning');
    return;
  }
  
  const tenants = DB.get('tenants') || [];
  let sentCount = 0;
  
  selectedIds.forEach(id => {
    const t = tenants.find(x => x.id === id);
    if (t) {
      addNotification({
        to: id,
        type: 'due',
        title: 'Rent Due Reminder',
        message: `Dear ${t.name}, your rent of ₹${t.rent.toLocaleString()} for ${month} is pending. Please complete your payment at the earliest.`
      });
      sentCount++;
    }
  });
  
  showToast(`Payment reminders sent to ${sentCount} selected tenants!`, 'success');
  
  // Clear checkboxes
  document.querySelectorAll('.rc-tenant-checkbox').forEach(cb => cb.checked = false);
  const selectAll = document.getElementById('rc-select-all');
  if (selectAll) selectAll.checked = false;
  updateRCSelectionCount();
}

function toggleSelectAllRCTenants(headerCb) {
  const checkboxes = document.querySelectorAll('.rc-tenant-checkbox');
  checkboxes.forEach(cb => cb.checked = headerCb.checked);
  updateRCSelectionCount();
}

function updateRCSelectionCount() {
  const checkboxes = document.querySelectorAll('.rc-tenant-checkbox:checked');
  const count = checkboxes.length;
  const bar = document.getElementById('rc-bulk-actions');
  const label = document.getElementById('rc-selected-count');
  
  if (bar && label) {
    if (count > 0) {
      bar.style.display = 'flex';
      label.textContent = `${count} tenant${count > 1 ? 's' : ''} selected`;
    } else {
      bar.style.display = 'none';
    }
  }
}

function renderTenantFinance(){
  const user = getCurrentUser();
  const payments = getTenantPayments(user.tenantId);
  const paid = payments.filter(p=>p.status==='paid');
  const pending = payments.filter(p=>p.status==='pending');
  return `
  <div class="page-header"><h1><i class="fas fa-rupee-sign" style="color:var(--success)"></i> My Finances</h1></div>
  <div class="stats-grid">
    <div class="stat-card green"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div><div class="stat-value">₹${paid.reduce((s,p)=>s+p.amount,0).toLocaleString()}</div><div class="stat-label">Total Paid</div></div>
    <div class="stat-card pink"><div class="stat-icon pink"><i class="fas fa-clock"></i></div><div class="stat-value">₹${pending.reduce((s,p)=>s+p.amount,0).toLocaleString()}</div><div class="stat-label">Pending</div></div>
    <div class="stat-card purple"><div class="stat-icon purple"><i class="fas fa-calendar-check"></i></div><div class="stat-value">${paid.length}</div><div class="stat-label">Months Paid</div></div>
  </div>
  <div class="card">
    <div class="card-title"><i class="fas fa-history"></i> Payment History</div>
    <div class="table-wrap">${renderPaymentTable(payments)}</div>
  </div>`;
}

function exportFinance(){
  const payments=DB.get('payments')||[];
  let csv='Tenant,Room,Month,Amount,Status,Paid On,Mode,TxnId\n';
  payments.forEach(p=>{ csv+=`${p.tenantName},${p.roomId},${p.month},${p.amount},${p.status},${p.paidOn||''},${p.paymentMode||''},${p.txnId||''}\n`; });
  downloadCSV(csv,'slvpg_finance.csv');
  showToast('Finance report downloaded!','success');
}

// ===================== DAILY EXPENSES MANAGEMENT =====================
function renderExpensesSection(){
  const expenses = dbExpenses || DB.get('expenses') || [];
  
  // Apply date filters based on activeExpenseFilter
  let filtered = [...expenses];
  const now = new Date();
  
  if (activeExpenseFilter === 'weekly') {
     const oneWeekAgo = new Date();
     oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
     filtered = expenses.filter(e => e.date && new Date(e.date) >= oneWeekAgo);
  } else if (activeExpenseFilter === 'monthly') {
     const currentMonthStr = now.toISOString().slice(0,7);
     filtered = expenses.filter(e => e.date && e.date.startsWith(currentMonthStr));
  } else if (activeExpenseFilter === 'yearly') {
     const currentYearStr = now.getFullYear().toString();
     filtered = expenses.filter(e => e.date && e.date.startsWith(currentYearStr));
  }
  
  // Calculate aggregate stats from filtered list
  const total = filtered.reduce((s,e)=>s+e.amount, 0);
  const count = filtered.length;
  const avg = count ? (total / count) : 0;
  
  // Calculate current month total for reference
  const curMonthStr = now.toISOString().slice(0,7);
  const monthTotal = expenses.filter(e => e.date && e.date.startsWith(curMonthStr)).reduce((s,e)=>s+e.amount, 0);
  
  // Calculate categories breakdown
  const categories = ['Food & Groceries', 'Maintenance & Repairs', 'Electricity & Water', 'Staff Salaries', 'Marketing & Ads', 'Others'];
  const catColors = {
     'Food & Groceries': 'var(--primary)',
     'Maintenance & Repairs': 'var(--accent)',
     'Electricity & Water': 'var(--info)',
     'Staff Salaries': 'var(--success)',
     'Marketing & Ads': 'var(--secondary)',
     'Others': '#64748b'
  };
  
  const catTotals = {};
  categories.forEach(c => { catTotals[c] = 0; });
  filtered.forEach(e => {
     const cat = e.category || 'Others';
     if (catTotals[cat] !== undefined) {
        catTotals[cat] += e.amount;
     } else {
        catTotals['Others'] += e.amount;
     }
  });

  return `
  <div class="page-header" style="margin-top:10px">
    <h1><i class="fas fa-receipt" style="color:var(--primary-light)"></i> Daily Expenses</h1>
    <p>Hostel Outflows &amp; Spend Analysis</p>
  </div>
  
  <div class="stats-grid">
    <div class="stat-card purple">
      <div class="stat-icon purple"><i class="fas fa-wallet"></i></div>
      <div class="stat-value">₹${total.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
      <div class="stat-label">Total Outflow (${activeExpenseFilter.toUpperCase()})</div>
    </div>
    <div class="stat-card green">
      <div class="stat-icon green"><i class="fas fa-calendar-alt"></i></div>
      <div class="stat-value">₹${monthTotal.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
      <div class="stat-label">This Month Expenses</div>
    </div>
    <div class="stat-card pink">
      <div class="stat-icon pink"><i class="fas fa-calculator"></i></div>
      <div class="stat-value">₹${avg.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
      <div class="stat-label">Average per Expense</div>
    </div>
    <div class="stat-card amber">
      <div class="stat-icon amber"><i class="fas fa-tags"></i></div>
      <div class="stat-value">${count}</div>
      <div class="stat-label">Expenses Count</div>
    </div>
  </div>
  
  <div class="grid-2">
    <!-- Reports Period & Category budgets -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <span class="card-title" style="margin-bottom:0"><i class="fas fa-chart-pie"></i> Spend Category Analysis</span>
        <select class="form-control" style="width:130px" onchange="filterExpensesByPeriod(this.value)">
          <option value="all" ${activeExpenseFilter==='all'?'selected':''}>All Time</option>
          <option value="weekly" ${activeExpenseFilter==='weekly'?'selected':''}>Weekly</option>
          <option value="monthly" ${activeExpenseFilter==='monthly'?'selected':''}>Monthly</option>
          <option value="yearly" ${activeExpenseFilter==='yearly'?'selected':''}>Yearly</option>
        </select>
      </div>
      
      <div style="display:flex;flex-direction:column;gap:14px">
        ${categories.map(cat => {
           const amt = catTotals[cat];
           const pct = total > 0 ? Math.round(amt / total * 100) : 0;
           const color = catColors[cat];
           return `
           <div>
             <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px">
               <strong>${cat}</strong>
               <span style="color:var(--text3)">₹${amt.toLocaleString()} · <span style="color:${color};font-weight:700">${pct}%</span></span>
             </div>
             <div class="progress-bar" style="height:8px"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
           </div>`;
        }).join('')}
      </div>
      
      <div style="margin-top:20px;display:flex;gap:10px">
        <button class="btn btn-primary" onclick="showAddExpenseModal()"><i class="fas fa-plus-circle"></i> Add Daily Expense</button>
        <button class="btn btn-secondary" onclick="exportExpensesCSV()"><i class="fas fa-file-excel"></i> Export Report</button>
      </div>
    </div>
    
    <!-- Quick Breakdown & Summary Info Box -->
    <div class="card" style="display:flex;flex-direction:column;justify-content:space-between">
      <div>
        <div class="card-title"><i class="fas fa-info-circle"></i> Outflow Summary</div>
        <p style="font-size:13px;color:var(--text2);line-height:1.5;margin-bottom:14px">
          Daily outflows represent operational expenditures spent to maintain high-quality women's PG services. All entered data maps in real-time to the secure PostgreSQL ledger: <code>TarakRam_ExpensesDetails</code>.
        </p>
        
        <!-- Interactive Information List -->
        <div style="background:var(--bg3);border-radius:10px;padding:12px;border:1px solid var(--border);font-size:12.5px">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
             <span style="color:var(--text3)">Active Period:</span>
             <strong style="text-transform:capitalize;color:var(--accent)">${activeExpenseFilter}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
             <span style="color:var(--text3)">Highest Outflow Category:</span>
             <strong style="color:var(--text)">
               ${(() => {
                  let maxCat = 'None';
                  let maxVal = -1;
                  categories.forEach(c => {
                     if(catTotals[c] > maxVal && catTotals[c] > 0) { maxVal = catTotals[c]; maxCat = c; }
                  });
                  return maxCat;
               })()}
             </strong>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
             <span style="color:var(--text3)">Expenses Count in Period:</span>
             <strong>${count} transactions</strong>
          </div>
          <div style="display:flex;justify-content:space-between">
             <span style="color:var(--text3)">PostgreSQL Table:</span>
             <code style="color:var(--primary-light)">TarakRam_ExpensesDetails</code>
          </div>
        </div>
      </div>
      
      <div style="background:linear-gradient(135deg,rgba(16,185,129,.1),rgba(124,58,237,.05));border:1px dashed var(--success);border-radius:12px;padding:12px;margin-top:14px;display:flex;align-items:center;gap:10px">
        <div style="width:36px;height:36px;border-radius:50%;background:rgba(16,185,129,.2);color:var(--success);display:flex;align-items:center;justify-content:center;font-size:18px"><i class="fas fa-database"></i></div>
        <div style="font-size:11.5px;line-height:1.3;color:var(--text2)">
          <strong>Supabase Direct Sync Active</strong><br/><span style="color:var(--text3)">Changes propagate instantly to remote PostgreSQL servers.</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Expenses Ledger -->
  <div class="card" style="margin-top:20px">
    <div class="card-title"><i class="fas fa-list-ul"></i> Expenses Register <span style="font-size:11px;font-weight:normal;color:var(--text3);margin-left:6px">(Table: TarakRam_ExpensesDetails)</span></div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Date</th>
            <th>Category</th>
            <th>Item Details</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Paid By</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.length === 0 ? `<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:30px"><i class="fas fa-receipt" style="font-size:24px;margin-bottom:8px"></i><br/>No expense records found for this period.</td></tr>` :
          filtered.map(e => `
          <tr>
            <td><code style="color:var(--accent);font-weight:600;font-size:12px">${e.txnId}</code></td>
            <td><strong>${formatDate(e.date)}</strong></td>
            <td><span class="badge" style="background:${catColors[e.category] || '#64748b'};color:#fff">${e.category}</span></td>
            <td style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${e.itemDetails}">${e.itemDetails}</td>
            <td><strong style="color:var(--danger)">₹${e.amount.toLocaleString()}</strong></td>
            <td><span style="font-size:12px;color:var(--text2)"><i class="fas fa-${e.paymentMethod==='UPI'?'mobile-alt':e.paymentMethod==='Cash'?'money-bill-wave':'credit-card'}"></i> ${e.paymentMethod}</span></td>
            <td><span class="badge badge-purple">${e.paidBy}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function filterExpensesByPeriod(period){
  activeExpenseFilter = period;
  navigateTo('finance');
}

function showAddExpenseModal(){
  const randTxn = 'EXP-' + new Date().toISOString().slice(2,10).replace(/-/g,'') + '-' + Math.random().toString(36).substr(2,5).toUpperCase();
  const today = new Date().toISOString().slice(0,10);
  
  showModal('Add Daily Outflow / Expense', `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Transaction ID *</label><input class="form-control" id="ex-txn" value="${randTxn}" /></div>
      <div class="form-group"><label class="form-label">Date *</label><input class="form-control" type="date" id="ex-date" value="${today}" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Category *</label>
        <select class="form-control" id="ex-category">
          <option>Food & Groceries</option>
          <option>Maintenance & Repairs</option>
          <option>Electricity & Water</option>
          <option>Staff Salaries</option>
          <option>Marketing & Ads</option>
          <option>Others</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">Payment Method *</label>
        <select class="form-control" id="ex-method">
          <option>UPI</option>
          <option>Cash</option>
          <option>Card</option>
          <option>NEFT</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Amount (₹) *</label><input class="form-control" type="number" id="ex-amount" placeholder="e.g. 1500" /></div>
      <div class="form-group"><label class="form-label">Paid By *</label><input class="form-control" id="ex-paidby" value="Admin" placeholder="Manager/Admin" /></div>
    </div>
    <div class="form-group">
      <label class="form-label">Item / Expenditure Details *</label>
      <textarea class="form-control" id="ex-details" rows="3" placeholder="Provide description of what was purchased..." style="height:auto;padding:10px"></textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveExpense()"><i class="fas fa-save"></i> Save Outflow</button>
    </div>`, false);
}

async function saveExpense(){
  const txnId = document.getElementById('ex-txn').value.trim();
  const date = document.getElementById('ex-date').value;
  const category = document.getElementById('ex-category').value;
  const itemDetails = document.getElementById('ex-details').value.trim();
  const amount = parseFloat(document.getElementById('ex-amount').value);
  const paidBy = document.getElementById('ex-paidby').value.trim();
  const paymentMethod = document.getElementById('ex-method').value;
  
  if(!txnId || !date || !category || !itemDetails || isNaN(amount) || amount <= 0 || !paidBy){
     showToast('Please fill all required fields correctly', 'error');
     return;
  }
  
  showToast('Saving expense to database...', 'info');
  
  try {
     const newExpense = {
        txnId,
        date,
        category,
        itemDetails,
        amount,
        paymentMethod,
        paidBy
     };
     
     // 1. Save to Remote Supabase TarakRam_ExpensesDetails
     await saveNewExpenseToDB(newExpense);
     
     closeModal();
     showToast('Daily expense successfully logged in PostgreSQL!', 'success');
     navigateTo('finance');
  } catch(err) {
     console.error('Save expense error:', err);
     showToast(`Failed to save expense in DB: ${err.message}`, 'error');
  }
}

function exportExpensesCSV(){
  const expenses = dbExpenses || DB.get('expenses') || [];
  let csv = 'Transaction ID,Date,Category,Item Details,Amount,Payment Method,Paid By\n';
  expenses.forEach(e => {
     csv += `"${e.txnId}","${e.date}","${e.category}","${e.itemDetails.replace(/"/g, '""')}",${e.amount},"${e.paymentMethod}","${e.paidBy}"\n`;
  });
  downloadCSV(csv, 'tarakram_expenses_report.csv');
  showToast('Expenses CSV downloaded!', 'success');
}
