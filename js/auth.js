// ===================== AUTH MODULE =====================
let currentUser = null;
let otpStore = {};

function getSMSConfig(){
  try {
    return JSON.parse(localStorage.getItem('slvpg_sms_config')) || {
      provider: 'none',
      fast2smsKey: '',
      twoFactorKey: '',
      twilioSid: '',
      twilioToken: '',
      twilioNumber: ''
    };
  } catch(e) {
    return {
      provider: 'none',
      fast2smsKey: '',
      twoFactorKey: '',
      twilioSid: '',
      twilioToken: '',
      twilioNumber: ''
    };
  }
}

function saveSMSConfig(config){
  localStorage.setItem('slvpg_sms_config', JSON.stringify(config));
}

async function sendRealSMS(mobile, otp, customMessage = '') {
  const config = getSMSConfig();
  if (!config || config.provider === 'none') {
    console.log("No SMS provider configured. Simulating delivery.");
    return { success: false, reason: 'provider_none' };
  }

  try {
    if (config.provider === 'fast2sms') {
      if (!config.fast2smsKey) throw new Error("Fast2SMS API Key is missing.");
      let url = "";
      if (customMessage) {
        url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(config.fast2smsKey)}&route=q&message=${encodeURIComponent(customMessage)}&language=english&numbers=${mobile}`;
      } else {
        url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(config.fast2smsKey)}&route=otp&variables_values=${otp}&numbers=${mobile}`;
      }
      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();
      if (data && data.return === true) {
        return { success: true, provider: 'Fast2SMS' };
      } else {
        throw new Error(data.message || "Failed to send SMS via Fast2SMS");
      }
    } 
    else if (config.provider === 'twofactor') {
      if (!config.twoFactorKey) throw new Error("2Factor API Key is missing.");
      let url = "";
      if (customMessage) {
        url = `https://2factor.in/API/V1/${encodeURIComponent(config.twoFactorKey)}/ADDON_SERVICES/SEND/TSMS`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            To: mobile,
            Msg: customMessage
          })
        });
        const data = await res.json();
        if (data && data.Status === "Success") {
          return { success: true, provider: '2Factor.in' };
        } else {
          throw new Error(data.Details || "Failed to send SMS via 2Factor");
        }
      } else {
        url = `https://2factor.in/API/V1/${encodeURIComponent(config.twoFactorKey)}/SMS/${mobile}/${otp}/AUTOGEN`;
        const res = await fetch(url, { method: 'GET' });
        const data = await res.json();
        if (data && data.Status === "Success") {
          return { success: true, provider: '2Factor.in' };
        } else {
          throw new Error(data.Details || "Failed to send SMS via 2Factor");
        }
      }
    } 
    else if (config.provider === 'twilio') {
      if (!config.twilioSid || !config.twilioToken || !config.twilioNumber) {
        throw new Error("Twilio credentials are missing.");
      }
      const url = `https://api.twilio.com/2010-04-01/Accounts/${config.twilioSid}/Messages.json`;
      const auth = btoa(`${config.twilioSid}:${config.twilioToken}`);
      const recipient = mobile.startsWith('+') ? mobile : `+91${mobile}`;
      const msgBody = customMessage || `🔑 SLV PG Hostels — Your verification OTP is: ${otp}. Valid for 5 minutes.`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          From: config.twilioNumber,
          To: recipient,
          Body: msgBody
        })
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, provider: 'Twilio' };
      } else {
        throw new Error(data.message || "Failed to send SMS via Twilio");
      }
    }
  } catch (err) {
    console.error(`SMS Delivery Error via ${config.provider}:`, err);
    return { success: false, reason: err.message || err.toString() };
  }
  return { success: false, reason: 'unknown' };
}

function getCurrentUser(){ return currentUser; }

function loginUser(user){
  currentUser = user;
  sessionStorage.setItem('slvpg_session', JSON.stringify(user));
}

function logoutUser(){
  currentUser = null;
  sessionStorage.removeItem('slvpg_session');
  renderLoginPage();
}

function restoreSession(){
  const s = sessionStorage.getItem('slvpg_session');
  if(s){ currentUser = JSON.parse(s); return true; }
  return false;
}

function sendOTP(mobile){
  const otp = Math.floor(100000 + Math.random()*900000).toString();
  otpStore[mobile] = {otp, expires: Date.now()+300000};
  console.log(`OTP for ${mobile}: ${otp}`); // demo only
  return otp; // In real app, send via SMS
}

function verifyOTP(mobile, entered){
  const stored = otpStore[mobile];
  if(!stored) return false;
  if(Date.now() > stored.expires){ delete otpStore[mobile]; return false; }
  if(stored.otp === entered){ delete otpStore[mobile]; return true; }
  return false;
}

// ---- Render Auth Page ----
function renderLoginPage(){
  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <div class="icon"><i class="fas fa-home"></i></div>
        <h2 class="grad-text">SLV PG</h2>
        <p>Sri Lakshmi Venkateswara Women's PG</p>
        <p style="font-size:11px;color:var(--text3);margin-top:4px;"><i class="fas fa-map-marker-alt"></i> Hyderabad, Telangana</p>
      </div>

      <div class="tab-pills" id="authTabs">
        <button class="tab-pill active" onclick="switchAuthTab('login')">Login</button>
        <button class="tab-pill" onclick="switchAuthTab('signup')">Sign Up</button>
        <button class="tab-pill" onclick="switchAuthTab('guest')">Guest</button>
      </div>

      <!-- Login Tab -->
      <div id="tab-login">
        <div class="form-group">
          <label class="form-label">Mobile Number</label>
          <input class="form-control" id="login-mobile" type="tel" maxlength="10" placeholder="Enter 10-digit mobile" />
        </div>
        <div id="login-otp-section" class="hidden">
          <label class="form-label" style="text-align:center;display:block;margin-bottom:8px;">Enter OTP sent to your mobile</label>
          <div class="otp-inputs" id="login-otp-inputs">
            <input class="otp-input" maxlength="1" type="text" oninput="otpNext(this,'login')" />
            <input class="otp-input" maxlength="1" type="text" oninput="otpNext(this,'login')" />
            <input class="otp-input" maxlength="1" type="text" oninput="otpNext(this,'login')" />
            <input class="otp-input" maxlength="1" type="text" oninput="otpNext(this,'login')" />
            <input class="otp-input" maxlength="1" type="text" oninput="otpNext(this,'login')" />
            <input class="otp-input" maxlength="1" type="text" oninput="otpNext(this,'login')" />
          </div>
          <p style="text-align:center;font-size:12px;color:var(--text3);">Didn't receive? <span style="color:var(--primary-light);cursor:pointer;" onclick="requestOTP('login')">Resend OTP</span></p>
        </div>
        <div id="login-otp-demo" class="hidden" style="background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.3);border-radius:10px;padding:10px;margin-bottom:12px;font-size:12px;color:var(--text2);text-align:center;"></div>
        <button class="btn btn-primary btn-lg" style="width:100%;justify-content:center;margin-top:8px;" id="login-btn" onclick="handleLogin()">
          <i class="fas fa-paper-plane"></i> Send OTP
        </button>
        <div style="margin-top:16px;padding:12px;background:var(--bg3);border-radius:10px;font-size:12px;color:var(--text3);">
          <p style="font-weight:600;margin-bottom:8px;color:var(--text2);display:flex;align-items:center;gap:6px;"><i class="fas fa-bolt" style="color:var(--accent);"></i> Click to Log In Instantly (Bypass):</p>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <button class="btn btn-secondary btn-sm" onclick="bypassLogin('9999999999')" style="width:100%;justify-content:flex-start;padding:6px 10px;font-size:11px;"><i class="fas fa-user-shield" style="color:var(--primary-light);"></i> Admin / Owner (9999999999)</button>
            <button class="btn btn-secondary btn-sm" onclick="bypassLogin('9876543210')" style="width:100%;justify-content:flex-start;padding:6px 10px;font-size:11px;"><i class="fas fa-user-circle" style="color:var(--secondary);"></i> Tenant Priya (9876543210)</button>
            <button class="btn btn-secondary btn-sm" onclick="bypassLogin('9876543211')" style="width:100%;justify-content:flex-start;padding:6px 10px;font-size:11px;"><i class="fas fa-user-circle" style="color:var(--accent);"></i> Tenant Ananya (9876543211)</button>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="showSMSConfigModal()" style="width:100%;justify-content:center;margin-top:10px;padding:8px;font-size:11px;background:rgba(124,58,237,0.05);border:1px dashed var(--primary-light);color:var(--text2);"><i class="fas fa-comment-sms" style="color:var(--primary-light);margin-right:6px;"></i> Configure Real SMS Gateway</button>
      </div>

      <!-- Signup Tab -->
      <div id="tab-signup" class="hidden">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Full Name</label><input class="form-control" id="signup-name" placeholder="Your full name" /></div>
          <div class="form-group"><label class="form-label">Mobile</label><input class="form-control" id="signup-mobile" type="tel" maxlength="10" placeholder="10-digit mobile" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="signup-email" type="email" placeholder="email@example.com" /></div>
          <div class="form-group"><label class="form-label">I am a</label>
            <select class="form-control" id="signup-role">
              <option value="guest">Guest / Visitor</option>
              <option value="tenant">Existing Tenant</option>
            </select>
          </div>
        </div>
        <div id="signup-otp-section" class="hidden">
          <label class="form-label" style="text-align:center;display:block;margin-bottom:8px;">Enter OTP</label>
          <div class="otp-inputs" id="signup-otp-inputs">
            <input class="otp-input" maxlength="1" type="text" oninput="otpNext(this,'signup')" />
            <input class="otp-input" maxlength="1" type="text" oninput="otpNext(this,'signup')" />
            <input class="otp-input" maxlength="1" type="text" oninput="otpNext(this,'signup')" />
            <input class="otp-input" maxlength="1" type="text" oninput="otpNext(this,'signup')" />
            <input class="otp-input" maxlength="1" type="text" oninput="otpNext(this,'signup')" />
            <input class="otp-input" maxlength="1" type="text" oninput="otpNext(this,'signup')" />
          </div>
        </div>
        <div id="signup-otp-demo" class="hidden" style="background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.3);border-radius:10px;padding:10px;margin-bottom:12px;font-size:12px;color:var(--text2);text-align:center;"></div>
        <button class="btn btn-primary btn-lg" style="width:100%;justify-content:center;margin-top:8px;" id="signup-btn" onclick="handleSignup()">
          <i class="fas fa-user-plus"></i> Sign Up
        </button>
      </div>

      <!-- Guest Tab -->
      <div id="tab-guest" class="hidden">
        <div style="text-align:center;padding:16px 0;">
          <div style="width:64px;height:64px;background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 16px;"><i class="fas fa-user"></i></div>
          <h3 style="margin-bottom:8px;">Continue as Guest</h3>
          <p style="font-size:13px;color:var(--text3);margin-bottom:24px;">Browse rooms, read reviews, and book a visit without signing in.</p>
        </div>
        <button class="btn btn-primary btn-lg" style="width:100%;justify-content:center;" onclick="continueAsGuest()">
          <i class="fas fa-arrow-right"></i> Continue as Guest
        </button>
        <button class="btn btn-secondary btn-lg" style="width:100%;justify-content:center;margin-top:10px;" onclick="renderVisitBookingPublic()">
          <i class="fas fa-calendar-check"></i> Book a Visit
        </button>
      </div>
    </div>
  </div>`;
}

function switchAuthTab(tab){
  ['login','signup','guest'].forEach(t=>{
    document.getElementById(`tab-${t}`).classList.toggle('hidden', t!==tab);
  });
  document.querySelectorAll('.tab-pill').forEach((el,i)=>{
    el.classList.toggle('active', ['login','signup','guest'][i]===tab);
  });
}

function otpNext(el, prefix){
  el.value = el.value.replace(/[^0-9]/g,'');
  if(el.value && el.nextElementSibling) el.nextElementSibling.focus();
  // Auto verify when all filled
  const inputs = document.querySelectorAll(`#${prefix}-otp-inputs .otp-input`);
  const code = [...inputs].map(i=>i.value).join('');
  if(code.length===6) setTimeout(()=>verifyOTPFlow(prefix), 300);
}

function getOTPValue(prefix){
  return [...document.querySelectorAll(`#${prefix}-otp-inputs .otp-input`)].map(i=>i.value).join('');
}

let loginStep = 'mobile';
let signupStep = 'form';

function bypassLogin(mobile){
  const users = DB.get('users')||[];
  let user = users.find(u=>u.mobile===mobile);
  if(user){
    loginUser(user);
    showToast(`Bypass successful: Logged in as ${user.name}!`, 'success');
    initApp();
  } else {
    showToast('Failed to bypass. Seeding fresh users...','info');
    seedData();
    user = (DB.get('users')||[]).find(u=>u.mobile===mobile);
    if(user){
      loginUser(user);
      initApp();
    } else {
      showToast('User not found. Try reloading page.', 'error');
    }
  }
}

async function sendRealOTPEmail(mobile, otp){
  const accessKey = '79fdb7e4-c9a2-454a-a6e8-bf030d5f1cd3';
  if(!accessKey || accessKey === 'YOUR_WEB3FORMS_ACCESS_KEY') return;
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `🔑 SLV PG Hostels — Login OTP: ${otp}`,
        from_name: 'SLV PG Hostels',
        mobile: mobile,
        otp: otp,
        message: `Hello!\n\nA login attempt was initiated for phone number: ${mobile}.\n\nYour 6-digit OTP code is: ${otp}\n\nEnter this code on the login screen to verify your identity.\n\nWarm regards,\nSLV PG Hostels Management`,
        botcheck: ''
      })
    });
    const data = await res.json();
    if(data.success){
      console.log('Real OTP email sent via Web3Forms successfully!');
    }
  } catch(e) {
    console.error('Failed to send real OTP email:', e);
  }
}

async function requestOTP(prefix){
  const mobile = document.getElementById(`${prefix}-mobile`).value.trim();
  if(!/^[6-9]\d{9}$/.test(mobile)){ showToast('Enter valid 10-digit mobile number','error'); return false; }
  
  const otp = sendOTP(mobile);
  document.getElementById(`${prefix}-otp-section`).classList.remove('hidden');
  const demo = document.getElementById(`${prefix}-otp-demo`);
  demo.classList.remove('hidden');
  
  const config = getSMSConfig();
  if (config.provider !== 'none') {
    demo.innerHTML = `<i class="fas fa-spinner fa-spin" style="color:var(--primary-light);"></i> <strong>Sending real SMS OTP...</strong><br/>Attempting mobile network dispatch via ${config.provider === 'fast2sms' ? 'Fast2SMS' : config.provider === 'twofactor' ? '2Factor.in' : 'Twilio'}...`;
    
    const res = await sendRealSMS(mobile, otp);
    if (res.success) {
      demo.innerHTML = `<i class="fas fa-check-circle" style="color:var(--success);"></i> <strong>Real SMS Sent!</strong><br/>OTP was successfully sent to your mobile number <strong>${mobile}</strong> via <strong>${res.provider}</strong>. Please check your phone!`;
      showToast(`SMS OTP sent via ${res.provider}!`, 'success');
    } else {
      demo.innerHTML = `<i class="fas fa-exclamation-triangle" style="color:var(--warning);"></i> <strong>SMS Delivery Failed!</strong><br/><span style="font-family:monospace;font-size:10.5px;color:var(--danger);">${res.reason}</span><br/><p style="margin-top:6px;font-size:11px;">Falling back to Gmail verification: check inbox or use temporary bypass OTP: <strong>${otp}</strong></p>`;
      showToast('SMS delivery failed. Using backup OTP.', 'error');
      sendRealOTPEmail(mobile, otp);
    }
  } else {
    demo.innerHTML = `<i class="fas fa-info-circle" style="color:var(--info);"></i> <strong>Real SMS is NOT configured.</strong><br/>Using default backup: OTP has been sent to Gmail (<strong>grownglow2k26@gmail.com</strong>) or use bypass code: <strong>${otp}</strong>.<br/>
    <button class="btn btn-secondary btn-sm" onclick="showSMSConfigModal()" style="margin-top:8px;padding:3px 8px;font-size:10px;display:inline-flex;align-items:center;gap:4px;"><i class="fas fa-cog"></i> Setup SMS Gateway</button>`;
    showToast('OTP sent! Check Gmail or setup SMS gateway.', 'info');
    sendRealOTPEmail(mobile, otp);
  }
  return true;
}

async function handleLogin(){
  if(loginStep==='mobile'){
    const success = await requestOTP('login');
    if(success){
      loginStep='otp';
      document.getElementById('login-btn').innerHTML='<i class="fas fa-check"></i> Verify OTP';
    }
  } else {
    verifyOTPFlow('login');
  }
}

function verifyOTPFlow(prefix){
  const mobile = document.getElementById(`${prefix}-mobile`).value.trim();
  const code = getOTPValue(prefix);
  if(code.length<6){ showToast('Enter complete 6-digit OTP','error'); return; }
  if(!verifyOTP(mobile, code)){ showToast('Invalid OTP. Try again.','error'); return; }

  const users = DB.get('users')||[];
  let user = users.find(u=>u.mobile===mobile);

  if(prefix==='login'){
    if(!user){
      // Auto-register custom number for a premium demo experience!
      showToast('Creating new demo profile for your number...','info');
      user = {
        id: genId('U'),
        name: 'Resident Guest',
        mobile: mobile,
        role: 'tenant',
        tenantId: genId('T'),
        email: 'grownglow2k26@gmail.com'
      };
      users.push(user);
      DB.set('users', users);
      
      // Also seed a tenant profile in tenants list so they see a beautiful filled dashboard!
      const tenants = DB.get('tenants')||[];
      const newTenant = {
        id: user.tenantId,
        name: 'Resident Guest',
        mobile: mobile,
        email: 'grownglow2k26@gmail.com',
        roomId: 'R102', // Premium AC Room 102
        bedNo: 4,
        joinDate: new Date().toISOString().split('T')[0],
        rent: 8000,
        deposit: 16000,
        noticePeriod: 30,
        emergencyContact: 'Emergency Contact - 9999999999',
        idProof: 'Aadhar',
        idNumber: 'XXXX-XXXX-9999',
        occupation: 'Software Engineer',
        company: 'Demo Corporation',
        dob: '1998-05-20',
        status: 'active'
      };
      tenants.push(newTenant);
      DB.set('tenants', tenants);
      
      // Seed a pending payment for them so they can test the payment gateway!
      const payments = DB.get('payments')||[];
      const currentMonth = new Date().toISOString().slice(0,7);
      payments.push({
        id: `P${Date.now()}`,
        tenantId: user.tenantId,
        tenantName: user.name,
        roomId: newTenant.roomId,
        month: currentMonth,
        amount: newTenant.rent,
        status: 'pending',
        dueDate: `${currentMonth}-05`,
        paidOn: '',
        paymentMode: '',
        txnId: ''
      });
      DB.set('payments', payments);
    }
    loginUser(user);
    showToast(`Welcome back, ${user.name}!`,'success');
    setTimeout(()=>initApp(), 500);
  } else {
    // Signup
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const role = document.getElementById('signup-role').value;
    if(!user){
      user = {id:genId('U'),name,mobile,email,role:'guest'};
      users.push(user);
      DB.set('users',users);
    }
    loginUser(user);
    showToast(`Welcome, ${name}!`,'success');
    setTimeout(()=>initApp(), 500);
  }
}

async function handleSignup(){
  const name = document.getElementById('signup-name').value.trim();
  const mobile = document.getElementById('signup-mobile').value.trim();
  if(!name){ showToast('Enter your name','error'); return; }
  if(!/^[6-9]\d{9}$/.test(mobile)){ showToast('Enter valid mobile','error'); return; }
  if(signupStep==='form'){
    const success = await requestOTP('signup');
    if(success){
      signupStep='otp';
      document.getElementById('signup-btn').innerHTML='<i class="fas fa-check"></i> Verify & Create Account';
    }
  } else {
    verifyOTPFlow('signup');
  }
}

function continueAsGuest(){
  currentUser = {id:'guest',name:'Guest',role:'guest'};
  initApp();
}

function renderVisitBookingPublic(){
  currentUser = {id:'guest',name:'Guest',role:'guest'};
  initApp();
  setTimeout(()=>navigateTo('visit'), 300);
}

// ===================== SMS GATEWAY SETTINGS MODAL =====================
function showSMSConfigModal() {
  const config = getSMSConfig();
  const content = `
  <div style="color:var(--text2);font-size:13px;line-height:1.5;text-align:left;">
    <p style="margin-bottom:14px;color:var(--text3);">SLV PG supports real-time mobile OTP dispatch. Enter your API credentials below. They are saved securely in your browser's local storage.</p>
    
    <div class="form-group" style="margin-bottom:12px;">
      <label class="form-label">SMS Provider</label>
      <select class="form-control" id="sms-provider-select" onchange="toggleSMSConfigFields()" style="width:100%;padding:10px;border-radius:8px;background:var(--bg3);border:1px solid var(--border);color:var(--text1);">
        <option value="none" ${config.provider === 'none' ? 'selected' : ''}>None (Gmail Redirection Fallback)</option>
        <option value="fast2sms" ${config.provider === 'fast2sms' ? 'selected' : ''}>Fast2SMS (India - Recommended)</option>
        <option value="twofactor" ${config.provider === 'twofactor' ? 'selected' : ''}>2Factor.in (India)</option>
        <option value="twilio" ${config.provider === 'twilio' ? 'selected' : ''}>Twilio (Global SMS)</option>
      </select>
    </div>

    <!-- Fast2SMS Fields -->
    <div id="sms-fast2sms-fields" class="sms-fields-group ${config.provider === 'fast2sms' ? '' : 'hidden'}" style="margin-bottom:12px;">
      <div class="form-group">
        <label class="form-label">Fast2SMS API Key</label>
        <input class="form-control" type="password" id="sms-fast2sms-key" value="${config.fast2smsKey || ''}" placeholder="Paste Fast2SMS API Key" style="width:100%;padding:10px;border-radius:8px;background:var(--bg3);border:1px solid var(--border);color:var(--text1);" />
        <span style="font-size:11px;color:var(--text3);margin-top:4px;display:block;">Get a free API key from <a href="https://www.fast2sms.com" target="_blank" style="color:var(--primary-light);text-decoration:underline;">fast2sms.com</a> (Includes free startup credits, pre-approved OTP template).</span>
      </div>
    </div>

    <!-- 2Factor Fields -->
    <div id="sms-twofactor-fields" class="sms-fields-group ${config.provider === 'twofactor' ? '' : 'hidden'}" style="margin-bottom:12px;">
      <div class="form-group">
        <label class="form-label">2Factor API Key</label>
        <input class="form-control" type="password" id="sms-twofactor-key" value="${config.twoFactorKey || ''}" placeholder="Paste 2Factor API Key" style="width:100%;padding:10px;border-radius:8px;background:var(--bg3);border:1px solid var(--border);color:var(--text1);" />
        <span style="font-size:11px;color:var(--text3);margin-top:4px;display:block;">Get a key from <a href="https://2factor.in" target="_blank" style="color:var(--primary-light);text-decoration:underline;">2factor.in</a>.</span>
      </div>
    </div>

    <!-- Twilio Fields -->
    <div id="sms-twilio-fields" class="sms-fields-group ${config.provider === 'twilio' ? '' : 'hidden'}" style="margin-bottom:12px;">
      <div class="form-row" style="display:flex;gap:10px;margin-bottom:10px;">
        <div class="form-group" style="flex:1;">
          <label class="form-label">Account SID</label>
          <input class="form-control" id="sms-twilio-sid" value="${config.twilioSid || ''}" placeholder="AC..." style="width:100%;padding:10px;border-radius:8px;background:var(--bg3);border:1px solid var(--border);color:var(--text1);" />
        </div>
        <div class="form-group" style="flex:1;">
          <label class="form-label">Auth Token</label>
          <input class="form-control" type="password" id="sms-twilio-token" value="${config.twilioToken || ''}" placeholder="Token" style="width:100%;padding:10px;border-radius:8px;background:var(--bg3);border:1px solid var(--border);color:var(--text1);" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Twilio Phone Number</label>
        <input class="form-control" id="sms-twilio-number" value="${config.twilioNumber || ''}" placeholder="+1XXXXXXXXXX" style="width:100%;padding:10px;border-radius:8px;background:var(--bg3);border:1px solid var(--border);color:var(--text1);" />
      </div>
    </div>

    <!-- Test Send SMS Section -->
    <div style="border-top:1px solid var(--border);margin-top:16px;padding-top:12px;">
      <h4 style="margin-bottom:8px;font-size:12px;color:var(--text1);"><i class="fas fa-paper-plane" style="color:var(--accent);margin-right:4px;"></i> Test Your Configuration</h4>
      <div style="display:flex;gap:10px;align-items:flex-end;">
        <div class="form-group" style="flex:1;margin-bottom:0;">
          <label class="form-label">Test Mobile Number</label>
          <input class="form-control" id="sms-test-mobile" type="tel" maxlength="10" placeholder="10-digit mobile" style="width:100%;padding:10px;border-radius:8px;background:var(--bg3);border:1px solid var(--border);color:var(--text1);" />
        </div>
        <button class="btn btn-primary" onclick="triggerTestSMS()" style="height:40px;padding:0 16px;"><i class="fas fa-envelope"></i> Send Test SMS</button>
      </div>
      <div id="sms-test-status" style="margin-top:10px;font-size:11.5px;color:var(--text3);min-height:16px;"></div>
    </div>
  </div>
  `;

  const footerContent = `
  <div class="modal-footer" style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end;">
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveSMSConfigModal()"><i class="fas fa-save"></i> Save Settings</button>
  </div>
  `;

  const overlay = document.getElementById('modal-overlay');
  const container = document.getElementById('modal-container');
  overlay.classList.remove('hidden');
  container.classList.remove('hidden');
  container.innerHTML = `
  <div class="modal">
    <div class="modal-header">
      <h3 style="font-family:'Poppins',sans-serif;font-weight:700;display:flex;align-items:center;gap:8px;"><i class="fas fa-comment-sms" style="color:var(--primary-light);"></i> SMS Gateway Setup</h3>
      <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
    </div>
    ${content}
    ${footerContent}
  </div>`;
  overlay.onclick = null; // Prevent accidental closing
}

function toggleSMSConfigFields(){
  const provider = document.getElementById('sms-provider-select').value;
  document.querySelectorAll('.sms-fields-group').forEach(el => el.classList.add('hidden'));
  if (provider !== 'none') {
    document.getElementById(`sms-${provider}-fields`).classList.remove('hidden');
  }
}

function saveSMSConfigModal(){
  const provider = document.getElementById('sms-provider-select').value;
  const config = {
    provider,
    fast2smsKey: document.getElementById('sms-fast2sms-key')?.value.trim() || '',
    twoFactorKey: document.getElementById('sms-twofactor-key')?.value.trim() || '',
    twilioSid: document.getElementById('sms-twilio-sid')?.value.trim() || '',
    twilioToken: document.getElementById('sms-twilio-token')?.value.trim() || '',
    twilioNumber: document.getElementById('sms-twilio-number')?.value.trim() || ''
  };
  saveSMSConfig(config);
  showToast('SMS Gateway settings saved successfully!', 'success');
  closeModal();
}

async function triggerTestSMS(){
  const mobile = document.getElementById('sms-test-mobile').value.trim();
  if(!/^[6-9]\d{9}$/.test(mobile)){
    document.getElementById('sms-test-status').innerHTML = `<span style="color:var(--danger);"><i class="fas fa-times-circle"></i> Enter valid 10-digit mobile number for testing</span>`;
    return;
  }

  const provider = document.getElementById('sms-provider-select').value;
  if(provider === 'none'){
    document.getElementById('sms-test-status').innerHTML = `<span style="color:var(--warning);"><i class="fas fa-exclamation-triangle"></i> Select an SMS provider to test</span>`;
    return;
  }

  const tempConfig = {
    provider,
    fast2smsKey: document.getElementById('sms-fast2sms-key')?.value.trim() || '',
    twoFactorKey: document.getElementById('sms-twofactor-key')?.value.trim() || '',
    twilioSid: document.getElementById('sms-twilio-sid')?.value.trim() || '',
    twilioToken: document.getElementById('sms-twilio-token')?.value.trim() || '',
    twilioNumber: document.getElementById('sms-twilio-number')?.value.trim() || ''
  };

  document.getElementById('sms-test-status').innerHTML = `<i class="fas fa-spinner fa-spin" style="color:var(--primary-light);"></i> Dispatching 6-digit test OTP to ${mobile}...`;

  // Temporarily override localStorage config helper during test
  const originalGetConfig = getSMSConfig;
  window.getSMSConfig = () => tempConfig;

  const testOtp = Math.floor(100000 + Math.random()*900000).toString();
  const res = await sendRealSMS(mobile, testOtp);

  // Restore original helper
  window.getSMSConfig = originalGetConfig;

  if (res.success) {
    document.getElementById('sms-test-status').innerHTML = `<span style="color:var(--success);font-weight:600;"><i class="fas fa-check-circle"></i> Test Success! Physical OTP [${testOtp}] sent to ${mobile} via ${res.provider}. Check your phone!</span>`;
    showToast(`SMS sent to ${mobile}!`, 'success');
  } else {
    document.getElementById('sms-test-status').innerHTML = `<span style="color:var(--danger);font-weight:600;"><i class="fas fa-times-circle"></i> Test Failed: ${res.reason}</span>`;
    showToast('Test SMS delivery failed.', 'error');
  }
}

