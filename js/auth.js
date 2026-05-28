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
    <div style="display:flex;gap:30px;max-width:920px;width:100%;padding:20px;flex-wrap:wrap;justify-content:center;align-items:stretch;">
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
          <div class="form-group">
            <label class="form-label"><i class="fas fa-lock" style="color:var(--primary-light)"></i> Password</label>
            <div style="position:relative">
              <input class="form-control" id="login-password" type="password" placeholder="Enter your password"
                onkeydown="if(event.key==='Enter') handleLogin()" style="padding-right:42px" />
              <span onclick="togglePwd('login-password')" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;color:var(--text3)">
                <i class="fas fa-eye" id="login-pwd-icon"></i>
              </span>
            </div>
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
      </div>

      <!-- Facilities Card -->
      <div class="facilities-card" style="background:var(--card);border:1px solid var(--border);border-radius:24px;padding:32px;width:100%;max-width:440px;box-shadow:0 20px 60px rgba(0,0,0,.5);display:flex;flex-direction:column;gap:20px;justify-content:space-between;">
        <div style="text-align:center;border-bottom:1px solid var(--border);padding-bottom:16px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:var(--accent);font-weight:700;margin-bottom:6px;">Welcome To Premium Living</div>
          <h2 class="grad-text" style="font-family:'Poppins',sans-serif;font-size:24px;font-weight:800;line-height:1.2;margin-bottom:6px;">Tarak Ram</h2>
          <div style="font-family:'Poppins',sans-serif;font-size:18px;font-weight:700;color:var(--text);letter-spacing:1px;margin-bottom:6px;">LUXURY WOMEN'S PG</div>
          <p style="font-size:12px;color:var(--text3);font-style:italic;margin-top:4px;">"Comfort Living According to Your Vibe"</p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
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
            <div style="display:flex;align-items:center;gap:10px;background:var(--bg3);padding:10px;border-radius:10px;border:1px solid rgba(124,58,237,0.15)">
              <div style="width:32px;height:32px;border-radius:8px;background:rgba(124,58,237,0.2);display:flex;align-items:center;justify-content:center;color:var(--primary-light);font-size:14px;"><i class="fas ${icon}"></i></div>
              <div style="font-size:11px;font-weight:600;line-height:1.2;color:var(--text2);">${label}<br/><span style="color:var(--text3);font-weight:normal;font-size:10px;">${sub}</span></div>
            </div>`).join('')}
        </div>
        <div style="background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(236,72,153,0.1));border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;">
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;font-weight:600;letter-spacing:1px;margin-bottom:6px;">Sharing Options Available</div>
          <div style="display:flex;justify-content:center;gap:10px;margin-bottom:6px;">
            ${[1,2,3,4].map(n=>`<span style="width:28px;height:28px;border-radius:6px;background:var(--primary);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">${n}</span>`).join('')}
          </div>
          <p style="font-size:11px;color:var(--text2);margin-top:6px;"><i class="fas fa-heart" style="color:var(--secondary)"></i> A Home Away From Home</p>
        </div>
        <div style="font-size:12px;color:var(--text2);line-height:1.4;border-top:1px solid var(--border);padding-top:12px;">
          <div style="display:flex;gap:8px;margin-bottom:6px;"><i class="fas fa-map-marker-alt" style="color:var(--accent);margin-top:2px;"></i> <span>House No: 3-46/1/4/19, Keshava Nagar Colony, Gowlidoddli, Serilingampally, Rangareddy Dist-500032.</span></div>
          <div style="display:flex;gap:8px;"><i class="fas fa-phone" style="color:var(--primary-light);margin-top:2px;"></i> <span><strong>87900 27362, 97415 31077</strong> (U. Navya)</span></div>
        </div>
      </div>
    </div>
  </div>`;
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
      const match = tenants.find(t => t.mobile === (record.mobile_Number||'') || t.mobile === identifier);
      if(match){
        user.role = 'tenant';
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

    // Insert new record — AccessRole defaults to empty (guest)
    const body = {
      userName: username,
      password: password,
      AccessRole: '',          // empty = guest; admin sets this manually in DB
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
