// ===================== AUTH MODULE =====================
let currentUser = null;

// ---- Session helpers ----
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

// ---- Supabase helpers (reuse SUPABASE_CONFIG from data.js) ----
async function loginMasterRequest(queryParams='', method='GET', body=null){
  const url = `${SUPABASE_CONFIG.url}/rest/v1/TarakRam_LoginMaster_Data${queryParams?'?'+queryParams:''}`;
  const headers = {
    'apikey': SUPABASE_CONFIG.apiKey,
    'Authorization': `Bearer ${SUPABASE_CONFIG.apiKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  const options = { method, headers };
  if(body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  if(!res.ok){
    const err = await res.text();
    throw new Error(`DB error ${res.status}: ${err}`);
  }
  return res.json();
}

// ---- Render Login Page ----
function renderLoginPage(){
  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="icon"><i class="fas fa-home"></i></div>
          <h2 class="grad-text">Tarak Ram PG</h2>
          <p>Tarak Ram Luxery Womens PG</p>
          <p style="font-size:11px;color:var(--text3);margin-top:4px;"><i class="fas fa-map-marker-alt"></i> Gowlidoddli, Hyderabad</p>
        </div>

        <div class="tab-pills" id="authTabs">
          <button class="tab-pill active" onclick="switchAuthTab('login')">Login</button>
          <button class="tab-pill" onclick="switchAuthTab('signup')">Sign Up</button>
          <button class="tab-pill" onclick="switchAuthTab('guest')">Guest</button>
        </div>

        <!-- ========== LOGIN TAB ========== -->
        <div id="tab-login">
          <div class="form-group">
            <label class="form-label"><i class="fas fa-user" style="color:var(--primary-light)"></i> Username / Mobile / Email</label>
            <input class="form-control" id="login-identifier" placeholder="Enter username, mobile or email"
              onkeydown="if(event.key==='Enter') document.getElementById('login-password').focus()" />
          </div>
          <div class="form-group" style="margin-bottom:8px;">
            <label class="form-label"><i class="fas fa-lock" style="color:var(--primary-light)"></i> Password</label>
            <div style="position:relative">
              <input class="form-control" id="login-password" type="password" placeholder="Enter your password"
                onkeydown="if(event.key==='Enter') handleLogin()" style="padding-right:42px" />
              <span onclick="togglePwd('login-password')" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;color:var(--text3)">
                <i class="fas fa-eye" id="login-pwd-icon"></i>
              </span>
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-bottom:18px;">
            <span onclick="showForgotPassword()" style="color:var(--accent);cursor:pointer;font-size:12.5px;font-weight:600;"><i class="fas fa-key"></i> Forgot Password?</span>
          </div>
          <div id="login-error" style="display:none;padding:8px 12px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:8px;font-size:12px;color:var(--danger);margin-bottom:10px;"></div>
          <button class="btn btn-primary btn-lg" style="width:100%;justify-content:center;margin-top:4px;" id="login-btn" onclick="handleLogin()">
            <i class="fas fa-sign-in-alt"></i> Login
          </button>
          <p style="text-align:center;font-size:12px;color:var(--text3);margin-top:12px;">
            Don't have an account? <span style="color:var(--primary-light);cursor:pointer;font-weight:600" onclick="switchAuthTab('signup')">Sign Up</span>
          </p>
        </div>

        <!-- ========== SIGNUP TAB ========== -->
        <div id="tab-signup" class="hidden">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input class="form-control" id="signup-name" placeholder="Your full name" />
            </div>
            <div class="form-group">
              <label class="form-label">Username *</label>
              <input class="form-control" id="signup-username" placeholder="Choose a username" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Mobile *</label>
              <input class="form-control" id="signup-mobile" type="tel" maxlength="10" placeholder="10-digit mobile" />
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-control" id="signup-email" type="email" placeholder="email@example.com" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Password *</label>
              <div style="position:relative">
                <input class="form-control" id="signup-password" type="password" placeholder="Create a password" style="padding-right:42px" />
                <span onclick="togglePwd('signup-password')" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;color:var(--text3)">
                  <i class="fas fa-eye" id="signup-pwd-icon"></i>
                </span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Confirm Password *</label>
              <input class="form-control" id="signup-confirm" type="password" placeholder="Re-enter password" />
            </div>
          </div>
          <div id="signup-error" style="display:none;padding:8px 12px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:8px;font-size:12px;color:var(--danger);margin-bottom:10px;"></div>
          <button class="btn btn-primary btn-lg" style="width:100%;justify-content:center;margin-top:4px;" id="signup-btn" onclick="handleSignup()">
            <i class="fas fa-user-plus"></i> Create Account
          </button>
          <p style="text-align:center;font-size:12px;color:var(--text3);margin-top:12px;">
            Already have an account? <span style="color:var(--primary-light);cursor:pointer;font-weight:600" onclick="switchAuthTab('login')">Login</span>
          </p>
        </div>

        <!-- ========== GUEST TAB ========== -->
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

        <!-- ========== FORGOT PASSWORD TAB ========== -->
        <div id="tab-forgot" class="hidden">
          <div style="text-align:center;margin-bottom:20px;">
            <div style="width:54px;height:54px;background:rgba(245,158,11,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;color:var(--accent);margin:0 auto 12px;"><i class="fas fa-key"></i></div>
            <h3 style="font-family:'Poppins',sans-serif;font-weight:700;">Reset Password</h3>
            <p style="font-size:12px;color:var(--text3);margin-top:4px;">Recover your login credentials securely.</p>
          </div>
          
          <div id="forgot-step1">
            <div class="form-group">
              <label class="form-label"><i class="fas fa-user" style="color:var(--primary-light)"></i> Username / Mobile / Email</label>
              <input class="form-control" id="forgot-identifier" placeholder="Enter your registered username, mobile or email" />
            </div>
            <div id="forgot-error" style="display:none;padding:8px 12px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:8px;font-size:12px;color:var(--danger);margin-bottom:10px;"></div>
            <button class="btn btn-primary btn-lg" style="width:100%;justify-content:center;" id="forgot-verify-btn" onclick="handleForgotVerify()">
              Verify Account
            </button>
          </div>
          
          <div id="forgot-step2" class="hidden">
            <div class="form-group">
              <label class="form-label">New Password *</label>
              <div style="position:relative">
                <input class="form-control" id="forgot-new-password" type="password" placeholder="Enter new password" style="padding-right:42px" />
                <span onclick="togglePwd('forgot-new-password')" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;color:var(--text3)">
                  <i class="fas fa-eye" id="forgot-new-pwd-icon"></i>
                </span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Confirm New Password *</label>
              <input class="form-control" id="forgot-confirm-password" type="password" placeholder="Re-enter password" />
            </div>
            <div id="forgot-reset-error" style="display:none;padding:8px 12px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:8px;font-size:12px;color:var(--danger);margin-bottom:10px;"></div>
            <button class="btn btn-primary btn-lg" style="width:100%;justify-content:center;" id="forgot-reset-btn" onclick="handleForgotReset()">
              Update Password
            </button>
          </div>
          
          <button class="btn btn-secondary btn-lg" style="width:100%;justify-content:center;margin-top:10px;" onclick="cancelForgotPassword()">
            Back to Login
          </button>
        </div>
      </div>

      <!-- Facilities Brochure Card -->
      <div class="facilities-card" style="background:var(--card);border:1px solid var(--border);border-radius:24px;padding:24px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.5);display:flex;flex-direction:column;gap:16px;justify-content:space-between;">
        
        <!-- Brochure Cover Banner -->
        <div style="position:relative;height:180px;border-radius:16px;overflow:hidden;border:1px solid var(--border)">
          <img src="hostel_brochure_image.png" style="width:100%;height:100%;object-fit:cover;" alt="Tarak Ram PG Brochure" />
          <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(15,10,30,0.95) 0%, rgba(15,10,30,0.15) 100%);"></div>
          <div style="position:absolute;bottom:12px;left:16px;">
            <span style="background:var(--secondary);color:#fff;font-size:9.5px;font-weight:700;padding:4px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:1px;box-shadow:0 4px 12px rgba(236,72,153,0.3)">Premium Living</span>
            <h3 style="font-family:'Poppins',sans-serif;font-size:19px;font-weight:800;color:#fff;margin-top:6px;text-shadow:0 2px 4px rgba(0,0,0,0.5)">Tarak Ram Women's PG</h3>
          </div>
        </div>

        <div style="text-align:center;border-bottom:1px solid var(--border);padding-bottom:12px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:var(--accent);font-weight:700;margin-bottom:4px;">Welcome To Premium Living</div>
          <p style="font-size:12px;color:var(--text3);font-style:italic;">"Comfort Living According to Your Vibe"</p>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          ${[
            ['fa-wifi','Wi-Fi','High Speed'],
            ['fa-utensils','Homely Food','Veg & Non-Veg'],
            ['fa-video','CCTV','Surveillance'],
            ['fa-shield-alt','24/7','Security'],
            ['fa-bolt','Power','Backup'],
            ['fa-tshirt','Washing','Machines'],
            ['fa-snowflake','Refrigerators','Available'],
            ['fa-tint','RO Purified','Drinking Water']
          ].map(([icon,label,sub])=>`
            <div style="display:flex;align-items:center;gap:8px;background:var(--bg3);padding:8px;border-radius:10px;border:1px solid rgba(124,58,237,0.12)">
              <div style="width:28px;height:28px;border-radius:8px;background:rgba(124,58,237,0.15);display:flex;align-items:center;justify-content:center;color:var(--primary-light);font-size:13px;"><i class="fas ${icon}"></i></div>
              <div style="font-size:10px;font-weight:600;line-height:1.2;color:var(--text2);">${label}<br/><span style="color:var(--text3);font-weight:normal;font-size:9px;">${sub}</span></div>
            </div>`).join('')}
        </div>

        <div style="background:linear-gradient(135deg,rgba(124,58,237,0.1),rgba(236,72,153,0.06));border:1px solid var(--border);border-radius:12px;padding:10px;text-align:center;">
          <div style="font-size:9.5px;color:var(--text3);text-transform:uppercase;font-weight:600;letter-spacing:1px;margin-bottom:4px;">Sharing Options Available</div>
          <div style="display:flex;justify-content:center;gap:8px;margin-bottom:4px;">
            ${[1,2,3,4].map(n=>`<span style="width:26px;height:26px;border-radius:6px;background:var(--primary);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;">${n}</span>`).join('')}
          </div>
          <p style="font-size:10.5px;color:var(--text2);"><i class="fas fa-heart" style="color:var(--secondary)"></i> A Home Away From Home</p>
        </div>

        <div style="font-size:11.5px;color:var(--text2);line-height:1.4;border-top:1px solid var(--border);padding-top:10px;">
          <div style="display:flex;gap:8px;margin-bottom:4px;"><i class="fas fa-map-marker-alt" style="color:var(--accent);margin-top:2px;font-size:11px;"></i> <span>House No: 3-46/1/4/19, Keshava Nagar Colony, Gowlidoddli, Serilingampally, Rangareddy Dist-500032.</span></div>
          <div style="display:flex;gap:8px;"><i class="fas fa-phone" style="color:var(--primary-light);margin-top:2px;font-size:11px;"></i> <span><strong>87900 27362, 97415 31077</strong> (U. Navya)</span></div>
        </div>
      </div>
    </div>
  </div>`;
}

// ========== FORGOT PASSWORD HANDLERS ==========
function showForgotPassword() {
  document.getElementById('tab-login').classList.add('hidden');
  document.getElementById('tab-signup').classList.add('hidden');
  document.getElementById('tab-guest').classList.add('hidden');
  document.getElementById('authTabs').classList.add('hidden');
  document.getElementById('tab-forgot').classList.remove('hidden');
  
  document.getElementById('forgot-step1').classList.remove('hidden');
  document.getElementById('forgot-step2').classList.add('hidden');
  document.getElementById('forgot-identifier').value = '';
  document.getElementById('forgot-new-password').value = '';
  document.getElementById('forgot-confirm-password').value = '';
  document.getElementById('forgot-error').style.display = 'none';
  document.getElementById('forgot-reset-error').style.display = 'none';
}

function cancelForgotPassword() {
  document.getElementById('authTabs').classList.remove('hidden');
  document.getElementById('tab-forgot').classList.add('hidden');
  const activeTabEl = document.querySelector('.tab-pill.active');
  let activeTab = 'login';
  if (activeTabEl) {
    const clickAttr = activeTabEl.getAttribute('onclick');
    const match = clickAttr.match(/'([^']+)'/);
    if (match) activeTab = match[1];
  }
  switchAuthTab(activeTab);
}

async function handleForgotVerify() {
  const identifier = document.getElementById('forgot-identifier').value.trim();
  const errEl = document.getElementById('forgot-error');
  errEl.style.display = 'none';
  
  if (!identifier) {
    errEl.style.display = 'block';
    errEl.textContent = 'Please enter your username, mobile or email.';
    return;
  }
  
  const btn = document.getElementById('forgot-verify-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
  
  try {
    const encId = encodeURIComponent(identifier);
    const query = `or=(userName.eq.${encId},mobile_Number.eq.${encId},email.eq.${encId})&select=*&limit=1`;
    const rows = await loginMasterRequest(query);
    
    if (!rows || rows.length === 0) {
      errEl.style.display = 'block';
      errEl.textContent = 'No account found matching this credential.';
      return;
    }
    
    const record = rows[0];
    window.forgotUserId = record.id;
    window.forgotUserName = record.userName;
    
    document.getElementById('forgot-step1').classList.add('hidden');
    document.getElementById('forgot-step2').classList.remove('hidden');
    showToast(`Identity verified for ${record.userName}!`, 'success');
  } catch (err) {
    console.error('[Auth] Verify error:', err);
    errEl.style.display = 'block';
    errEl.textContent = 'Verification failed: ' + err.message;
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Verify Account';
  }
}

async function handleForgotReset() {
  const newPwd = document.getElementById('forgot-new-password').value;
  const confirmPwd = document.getElementById('forgot-confirm-password').value;
  const errEl = document.getElementById('forgot-reset-error');
  errEl.style.display = 'none';
  
  if (!newPwd) {
    errEl.style.display = 'block';
    errEl.textContent = 'Password is required.';
    return;
  }
  if (newPwd !== confirmPwd) {
    errEl.style.display = 'block';
    errEl.textContent = 'Passwords do not match.';
    return;
  }
  
  const btn = document.getElementById('forgot-reset-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
  
  try {
    const body = { password: newPwd };
    const query = `id=eq.${window.forgotUserId}`;
    await loginMasterRequest(query, 'PATCH', body);
    
    showToast('Password updated successfully! Please login.', 'success');
    cancelForgotPassword();
    
    const loginUserEl = document.getElementById('login-identifier');
    if (loginUserEl) {
      loginUserEl.value = window.forgotUserName || '';
    }
  } catch (err) {
    console.error('[Auth] Reset error:', err);
    errEl.style.display = 'block';
    errEl.textContent = 'Password reset failed: ' + err.message;
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Update Password';
  }
}


// ---- Tab switcher ----
function switchAuthTab(tab){
  ['login','signup','guest'].forEach(t=>{
    document.getElementById(`tab-${t}`).classList.toggle('hidden', t!==tab);
  });
  document.querySelectorAll('.tab-pill').forEach((el,i)=>{
    el.classList.toggle('active', ['login','signup','guest'][i]===tab);
  });
}

// ---- Password show/hide toggle ----
function togglePwd(inputId){
  const el = document.getElementById(inputId);
  const icon = document.getElementById(inputId.replace('login-password','login-pwd-icon').replace('signup-password','signup-pwd-icon'));
  if(el.type==='password'){ el.type='text'; if(icon) icon.className='fas fa-eye-slash'; }
  else { el.type='password'; if(icon) icon.className='fas fa-eye'; }
}

// ---- Error helpers ----
function showLoginError(msg){ const el=document.getElementById('login-error'); el.style.display='block'; el.textContent=msg; }
function hideLoginError(){ document.getElementById('login-error').style.display='none'; }
function showSignupError(msg){ const el=document.getElementById('signup-error'); el.style.display='block'; el.textContent=msg; }
function hideSignupError(){ document.getElementById('signup-error').style.display='none'; }

// ========== LOGIN HANDLER ==========
async function handleLogin(){
  hideLoginError();
  const identifier = document.getElementById('login-identifier').value.trim();
  const password   = document.getElementById('login-password').value;
  if(!identifier){ showLoginError('Please enter your username, mobile, or email.'); return; }
  if(!password){   showLoginError('Please enter your password.'); return; }

  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

  try {
    // Build an OR query: match userName OR mobile_Number OR email
    const encId = encodeURIComponent(identifier);
    const query = `or=(userName.eq.${encId},mobile_Number.eq.${encId},email.eq.${encId})&select=*&limit=1`;
    const rows = await loginMasterRequest(query);

    if(!rows || rows.length === 0){
      showLoginError('No account found. Please check your credentials or sign up.');
      return;
    }

    const record = rows[0];
    if(record.password !== password){
      showLoginError('Incorrect password. Please try again.');
      return;
    }

    // Determine role: 'Admin' in AccessRole → admin, else guest
    const isAdmin = record.AccessRole && record.AccessRole.toLowerCase() === 'admin';
    const user = {
      id: `DB_${record.id || record.userName}`,
      name: record.userName,
      mobile: record.mobile_Number || '',
      email: record.email || '',
      role: isAdmin ? 'admin' : 'guest',
      dbRecord: record
    };

    // Try to find a matching local tenant if not admin
    if(!isAdmin){
      const tenants = DB.get('tenants') || [];
      // Prioritize name match (case-insensitive) first, then mobile match
      let match = null;
      if (record.userName) {
        match = tenants.find(t => t.name && t.name.trim().toLowerCase() === record.userName.trim().toLowerCase());
      }
      if (!match) {
        match = tenants.find(t => t.mobile === (record.mobile_Number||'') || t.mobile === identifier);
      }
      if(match){
        // If they are explicitly 'Guest' in AccessRole, keep role as 'guest' but link tenantId so they go to guest views (like Payment Reminders) with their data linked
        const isGuestRole = record.AccessRole && record.AccessRole.toLowerCase() === 'guest';
        user.role = isGuestRole ? 'guest' : 'tenant';
        user.tenantId = match.id;
        user.name = match.name || user.name;
      }
    }

    loginUser(user);
    showToast(`Welcome, ${user.name}! 🎉`, 'success');
    setTimeout(()=>initApp(), 400);

  } catch(err){
    console.error('[Auth] Login error:', err);
    showLoginError('Login failed: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
  }
}

// ========== SIGNUP HANDLER ==========
async function handleSignup(){
  hideSignupError();
  const name     = document.getElementById('signup-name').value.trim();
  const username = document.getElementById('signup-username').value.trim();
  const mobile   = document.getElementById('signup-mobile').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirm  = document.getElementById('signup-confirm').value;

  if(!name)     { showSignupError('Full name is required.'); return; }
  if(!username) { showSignupError('Username is required.'); return; }
  if(!mobile || !/^[6-9]\d{9}$/.test(mobile)) { showSignupError('Enter a valid 10-digit mobile number.'); return; }
  if(!password) { showSignupError('Password is required.'); return; }
  if(password !== confirm){ showSignupError('Passwords do not match.'); return; }

  const btn = document.getElementById('signup-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

  try {
    // Check if username or mobile already exists
    const encUser = encodeURIComponent(username);
    const encMob  = encodeURIComponent(mobile);
    const existing = await loginMasterRequest(`or=(userName.eq.${encUser},mobile_Number.eq.${encMob})&select=userName,mobile_Number&limit=1`);
    if(existing && existing.length > 0){
      showSignupError('An account with this username or mobile already exists. Please login.');
      return;
    }

    const nextId = await getNextLoginMasterId();
    if(!nextId){
      throw new Error("Could not retrieve next ID for user registration.");
    }

    // Insert new record — AccessRole defaults to empty (guest)
    const body = {
      id: nextId,
      userName: username,
      password: password,
      AccessRole: 'Guest',          // empty = guest; admin sets this manually in DB
      mobile_Number: mobile,
      email: email || null
    };
    const result = await loginMasterRequest('', 'POST', body);
    const record = Array.isArray(result) ? result[0] : result;

    // Save to local users as well
    const users = DB.get('users') || [];
    if(!users.find(u=>u.mobile===mobile)){
      users.push({ id: genId('U'), name, mobile, email, role:'guest' });
      DB.set('users', users);
    }

    const user = {
      id: `DB_${record?.id || username}`,
      name,
      mobile,
      email,
      role: 'guest',
      dbRecord: record
    };

    // Silent WhatsApp notification to admin (no browser popup, no UI interruption)
    try {
      if (typeof WHATSAPP_CONFIG !== 'undefined' && WHATSAPP_CONFIG.signupNotifyNumber) {
        const waNum = WHATSAPP_CONFIG.signupNotifyNumber.replace(/[^0-9]/g, '');
        const waMsg = `🆕 New Sign-Up Alert!\n\n👤 Name: ${name}\n📱 Mobile: ${mobile}\n📧 Email: ${email || 'Not provided'}\n🕐 Time: ${new Date().toLocaleString('en-IN')}\n\nThis user has registered at Tarak Ram PG app.`;
        // Silent method: send via wa.me link in a hidden iframe (no window.open popup)
        const silentFrame = document.createElement('iframe');
        silentFrame.style.cssText = 'display:none;width:0;height:0;border:none;position:absolute;left:-9999px;top:-9999px';
        silentFrame.src = `https://api.whatsapp.com/send?phone=${waNum}&text=${encodeURIComponent(waMsg)}`;
        document.body.appendChild(silentFrame);
        // Remove iframe after 5 seconds
        setTimeout(() => { try { document.body.removeChild(silentFrame); } catch(e){} }, 5000);
      }
    } catch (waErr) {
      console.warn('[Auth] Silent signup WhatsApp notification failed:', waErr);
    }

    loginUser(user);
    showToast(`Account created! Welcome, ${name}! 🎉`, 'success');
    setTimeout(()=>initApp(), 400);

  } catch(err){
    console.error('[Auth] Signup error:', err);
    showSignupError('Sign up failed: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
  }
}

// ---- Guest access ----
function continueAsGuest(){
  currentUser = {id:'guest', name:'Guest', role:'guest'};
  initApp();
}

function renderVisitBookingPublic(){
  currentUser = {id:'guest', name:'Guest', role:'guest'};
  initApp();
  setTimeout(()=>navigateTo('visit'), 300);
}
