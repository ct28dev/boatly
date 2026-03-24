var APP_PATH_PREFIX = (function () {
  if (typeof window === 'undefined') return '';
  var p = window.location.pathname || '';
  if (p.startsWith('/boatly')) return '/boatly';
  if (p.startsWith('/boathub')) return '/boathub';
  return '';
})();
const API = APP_PATH_PREFIX ? APP_PATH_PREFIX + '/api' : '/api';
const SOCKET_URL = (typeof window !== 'undefined') ? ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:3001' : (window.location.protocol + '//' + window.location.hostname + ':3001')) : 'http://localhost:3001';

const state = {
  token: localStorage.getItem('bh_token'),
  user: JSON.parse(localStorage.getItem('bh_user') || 'null'),
  partnerBookingSearch: '',
  currentTour: null,
  currentItinerary: null,
  bookingData: { date: null, time: null, timeLabel: '', passengers: { adult: 1, child: 0, infant: 0 }, promo: null, discount: 0, paymentMethod: 'qr', pickup_location: '' },
  bookingStep: 1,
  favorites: new Set(JSON.parse(localStorage.getItem('bh_favs') || '[]')),
  calendarMonth: new Date().getMonth(),
  calendarYear: new Date().getFullYear(),
  selectedAddons: [],
  cachedAddons: null,
  galleryIndex: 0,
  galleryImages: [],
  galleryStartX: 0,
  mapInstance: null,
  mapPickInstance: null,
  mapPickMarker: null,
  mapPickCoords: null,
  planSlots: [],
  planSlotMapIndex: null,
  planSlotMapCoords: null,
  planSlotMapInstance: null,
  tourFilterProvince: '',
  tourSearchQuery: '',
  tourBoatType: '',
  locationSearchTimeout: null,
  planSlotTourTimeout: null,
  activityPlaceName: '',
  activityLat: null,
  activityLng: null,
  activityTime: '',
  tipEnabled: false,
  _tipBookingId: null,
  _socket: null,
  _boatMarker: null,
  _boatPosition: null,
  /** เมนูล่าง 5 ปุ่ม: แท็บทริป (2=จอง เร็ว, 4=สำรวจ) เมื่อเปิด toursPanel */
  bottomNavToursTab: 4,
  openToursFromQuickBook: false,
  /** เปิดแผนที่จากปุ่มเมนู "สำรวจ" — โฟกัสใกล้ตัว (ท่าเรือใกล้ฉัน) */
  mapOpenFromExploreNav: false,
  /** หัวข้อความสนใจ AI (จาก API /settings/ai-interests) */
  aiInterestTopics: []
};

async function apiCall(method, endpoint, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = 'Bearer ' + state.token;
  const opts = { method, headers };
  if (method === 'GET' || method === 'HEAD') {
    opts.cache = 'no-store';
  }
  if (body) opts.body = JSON.stringify(body);
  try {
    const r = await fetch(API + endpoint, opts);
    const text = await r.text();
    let json;
    try { json = JSON.parse(text); } catch (e) {
      console.error('API parse error:', endpoint, text.substring(0, 200));
      return { success: false, message: t('error') };
    }
    if (r.status === 401 && endpoint !== '/auth/login') {
      state.token = null;
      state.user = null;
      localStorage.removeItem('bh_token');
      localStorage.removeItem('bh_user');
      updateAuthUI();
      toast(t('auth_session_expired') || 'Session expired. Please log in again.', 'error');
    }
    return json;
  } catch (e) {
    console.error('API error:', endpoint, e);
    return { success: false, message: t('error') };
  }
}

function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast show ' + type;
  setTimeout(() => el.className = 'toast', 3000);
}

function imgSrc(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = APP_PATH_PREFIX;
  let path = (url || '').trim().replace(/^\//, '');
  if (path.startsWith('boatly/')) path = path.replace(/^boatly\//, '');
  if (path.startsWith('boathub/')) path = path.replace(/^boathub\//, '');
  return (base ? base + '/' : '/') + path;
}

/** ใช้ใน style="..." — ห้ามใช้ JSON.stringify ใน url() เพราะ " จะตัดแอตทริบิวต์ style */
function cssBackgroundImageUrl(url) {
  if (!url) return "''";
  return "'" + String(url).replace(/\\/g, '\\\\').replace(/'/g, '%27') + "'";
}

function profileAvatarHtml(profileImage, userName) {
  var initial = userName ? userName.charAt(0).toUpperCase() : '?';
  if (!profileImage) return initial;
  var src;
  var token = state.token || localStorage.getItem('bh_token');
  if (profileImage.indexOf('http') === 0) {
    src = profileImage;
  } else if (token) {
    src = API + '/users/profile-image?token=' + encodeURIComponent(token) + '&v=' + encodeURIComponent(profileImage);
  } else {
    src = imgSrc(profileImage);
  }
  return '<img src="' + src + '" data-fallback="' + esc(initial) + '" alt="avatar" onerror="this.onerror=null;this.parentElement.textContent=this.getAttribute(\'data-fallback\')||\'?\'">';
}

function tourImage(tour) {
  if (tour.primary_image) return imgSrc(tour.primary_image);
  if (tour.boat_image) return imgSrc(tour.boat_image);
  if (tour.images && tour.images.length > 0) return imgSrc(tour.images[0].image_url || tour.images[0]);
  return 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=400&h=300&fit=crop';
}

function formatPrice(p) {
  return '฿' + Number(p || 0).toLocaleString();
}

function formatDuration(m) {
  if (!m) return '';
  if (m >= 480) return t('full_day');
  return Math.floor(m / 60) + ' ' + t('detail_duration');
}

function esc(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function escAttr(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightText(text, searchTerm) {
  if (!text && text !== 0) return '';
  var safe = esc(String(text));
  if (!searchTerm || searchTerm.length < 1) return safe;
  try {
    var term = String(searchTerm).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var re = new RegExp('(' + term + ')', 'gi');
    return safe.replace(re, '<mark class="search-highlight">$1</mark>');
  } catch (e) { return safe; }
}

function boatName(tour) {
  return tField(tour, 'name') || tour.boat_name || tour.name || '';
}

function boatLocation(tour) {
  if (tour.destination) return tField(tour.destination, 'name');
  return tField(tour, 'destination_name') || tour.destination_name_th || tour.destination_name || '';
}

function boatId(tour) {
  return tour.boat_id || tour.id;
}

/* ===== Auth ===== */

function isLoggedIn() { return !!state.token; }

function requireLogin(cb) {
  if (!isLoggedIn()) { showModal('loginModal'); return false; }
  if (cb) cb();
  return true;
}

let oauthProviders = { google: { enabled: false }, line: { enabled: false } };

async function initOAuthButtons() {
  try {
    const r = await apiCall('GET', '/auth/providers');
    if (r.success && r.data) oauthProviders = r.data;
  } catch (e) {}
  const loginDiv = document.getElementById('oauthButtons');
  const regDiv = document.getElementById('regOauthButtons');
  if (loginDiv) renderOAuthButtons(loginDiv);
  if (regDiv) renderOAuthButtons(regDiv);
  if (oauthProviders.google?.enabled && oauthProviders.google?.client_id && typeof google !== 'undefined') {
    initGoogleSignIn();
  }
}

function renderOAuthButtons(container) {
  if (!container) return;
  const gEnabled = oauthProviders.google?.enabled && oauthProviders.google?.client_id;
  const lEnabled = oauthProviders.line?.enabled;
  let html = '';
  if (gEnabled) {
    html += '<div class="oauth-google-wrap"><div class="google-signin-container" style="display:flex;justify-content:center"></div><a href="javascript:void(0)" class="oauth-retry-link" onclick="retryGoogleLogin()" data-t="auth_google_retry">เลือกบัญชี Google อื่น</a></div>';
  } else {
    html += '<button type="button" class="oauth-btn oauth-google" onclick="toast(t(\'auth_oauth_configure\'), \'error\')"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" style="width:20px;height:20px"><span data-t="auth_google">Sign in with Google</span></button>';
  }
  if (lEnabled) {
    html += '<a href="' + APP_PATH_PREFIX + '/api/auth/line" class="oauth-btn oauth-line"><span style="color:#00B900;font-weight:700">LINE</span> <span data-t="auth_line">Sign in with Line</span></a>';
  } else {
    html += '<button type="button" class="oauth-btn oauth-line" onclick="toast(t(\'auth_oauth_configure\'), \'error\')"><span style="color:#00B900;font-weight:700">LINE</span> <span data-t="auth_line">Sign in with Line</span></button>';
  }
  container.innerHTML = html;
  applyTranslations();
  if (gEnabled) setTimeout(initGoogleSignIn, 500);
}

function retryGoogleLogin() {
  const loginDiv = document.getElementById('oauthButtons');
  const regDiv = document.getElementById('regOauthButtons');
  if (loginDiv) renderOAuthButtons(loginDiv);
  if (regDiv) renderOAuthButtons(regDiv);
}

function initGoogleSignIn() {
  const containers = document.querySelectorAll('.google-signin-container');
  if (!containers.length || typeof google === 'undefined') return;
  try {
    google.accounts.id.initialize({
      client_id: oauthProviders.google.client_id,
      callback: handleGoogleCredential,
      auto_select: false
    });
    containers.forEach(c => {
      if (c && !c.querySelector('iframe')) {
        google.accounts.id.renderButton(c, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: 280
        });
      }
    });
  } catch (e) { console.warn('Google Sign-In init:', e); }
}

function handleGoogleCredential(response) {
  if (!response?.credential) return;
  doGoogleLoginWithToken(response.credential);
}

async function doGoogleLoginWithToken(idToken) {
  const btn = document.getElementById('loginBtn');
  if (btn) { btn.disabled = true; btn.textContent = t('loading') || '...'; }
  const r = await apiCall('POST', '/auth/google', { id_token: idToken });
  if (btn) { btn.disabled = false; btn.textContent = t('auth_login_btn'); }
  if (r.success && r.data?.token) {
    state.token = r.data.token;
    state.user = r.data.user;
    localStorage.setItem('bh_token', r.data.token);
    localStorage.setItem('bh_user', JSON.stringify(r.data.user));
    closeModal('loginModal');
    closeModal('registerModal');
    toast(t('auth_login_success'));
    updateAuthUI();
    loadHome();
  } else {
    toast(r.message || t('error'), 'error');
  }
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pw = document.getElementById('loginPassword').value;
  if (!email || !pw) return toast(t('auth_fill_all'), 'error');
  const btn = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');
  btn.disabled = true;
  btn.textContent = t('loading');
  errEl.textContent = '';
  try {
    const r = await apiCall('POST', '/auth/login', { email, password: pw });
    btn.disabled = false;
    btn.textContent = t('auth_login_btn');
    if (r.success && r.data && r.data.token) {
      state.token = r.data.token;
      state.user = r.data.user;
      state.operatorStatus = r.data.operator_status || null;
      localStorage.setItem('bh_token', r.data.token);
      localStorage.setItem('bh_user', JSON.stringify(r.data.user));
      const role = r.data.user?.role;
      if (role === 'operator' || role === 'admin') {
        localStorage.setItem('bh_operator_token', r.data.token);
        localStorage.setItem('bh_operator_user', JSON.stringify(r.data.user));
        if (r.data.operator_status === 'approved') {
          localStorage.setItem('bh_operator_status', 'approved');
        }
      }
      if (role === 'admin' || role === 'staff') {
        localStorage.setItem('boatly_admin_token', r.data.token);
        localStorage.removeItem('boathub_admin_token');
      }
      closeModal('loginModal');
      if (role === 'operator' && r.data.operator_status === 'approved') {
        toast(t('op_approved_msg') || 'บัญชีของคุณได้รับการอนุมัติแล้ว');
      } else {
        toast(t('auth_login_success'));
      }
      updateAuthUI();
      loadFavoriteIds();
      loadHome();
    } else {
      errEl.textContent = r.message || t('auth_wrong_creds');
    }
  } catch (e) {
    btn.disabled = false;
    btn.textContent = t('auth_login_btn');
    errEl.textContent = t('error');
  }
}

function selectRegLang(btn, lang) {
  document.querySelectorAll('.lang-flag-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  setLang(lang);
}

async function doRegister() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const pw = document.getElementById('regPassword').value;
  if (!name || !email || !pw) return toast(t('auth_fill_all'), 'error');
  const btn = document.getElementById('regBtn');
  btn.disabled = true;
  btn.textContent = t('loading');
  const r = await apiCall('POST', '/auth/register', { name, email, password: pw, phone, language: currentLang });
  btn.disabled = false;
  btn.textContent = t('auth_register_btn');
  if (r.success && r.data && r.data.token) {
    state.token = r.data.token;
    state.user = r.data.user;
    localStorage.setItem('bh_token', r.data.token);
    localStorage.setItem('bh_user', JSON.stringify(r.data.user));
    closeModal('registerModal');
    toast(t('auth_register_success'));
    updateAuthUI();
    showPanel('profilePanel');
    showProfile();
    loadHome();
  } else {
    document.getElementById('regError').textContent = r.message || t('error');
  }
}

function doLogout() {
  state.token = null;
  state.user = null;
  state.favorites.clear();
  state.selectedAddons = [];
  state.cachedAddons = null;
  localStorage.removeItem('bh_token');
  localStorage.removeItem('bh_user');
  localStorage.removeItem('bh_operator_token');
  localStorage.removeItem('bh_operator_user');
  localStorage.removeItem('bh_favs');
  closePanel('profilePanel');
  toast(t('auth_logout_done'));
  updateAuthUI();
  loadHome();
}

function updateFooterPartner() {
  const link = document.getElementById('footerPartnerLink');
  if (!link) return;
  const isOperator = state.user && (state.user.role === 'operator' || state.user.role === 'admin');
  const regUrl = (window.location.origin || '') + (APP_PATH_PREFIX || '') + '/operator/register';
  if (isOperator) {
    link.href = '#';
    link.onclick = async (e) => {
      e.preventDefault();
      const text = t('footer_partner_invite') + ' — BOATLY';
      if (navigator.share) {
        try {
          await navigator.share({ title: 'BOATLY', text, url: regUrl });
          toast(t('footer_invite_copied'));
        } catch (err) {
          if (err.name !== 'AbortError') copyRegLink(regUrl);
        }
      } else {
        copyRegLink(regUrl);
      }
    };
    const span = link.querySelector('span');
    if (span) span.textContent = t('footer_partner_invite');
    link.querySelector('i').className = 'fas fa-share-nodes';
  } else {
    link.href = (APP_PATH_PREFIX || '') + '/operator/register';
    link.onclick = null;
    const span = link.querySelector('span');
    if (span) span.textContent = t('footer_partner');
    link.querySelector('i').className = 'fas fa-ship';
  }
}

function copyRegLink(url) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => toast(t('footer_invite_copied')));
  } else {
    const ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    toast(t('footer_invite_copied'));
  }
}

function updateAuthUI() {
  updateFooterPartner();
  const g = document.getElementById('heroGreeting');
  const n = document.getElementById('heroUserBtn');
  if (!g || !n) return;
  if (state.user) {
    g.textContent = t('hero_greeting') + ' ' + state.user.name.split(' ')[0] + ' 👋';
    var av = profileAvatarHtml(state.user.profile_image, state.user.name);
    if (av.charAt(0) === '<') {
      n.innerHTML = '<span class="hero-avatar-wrap" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;border-radius:50%;overflow:hidden;color:#fff;font-weight:700;font-size:16px">' + av + '</span>';
    } else {
      n.innerHTML = '<span style="font-weight:700;font-size:16px;color:#fff">' + esc(av) + '</span>';
    }
    const adminLink = document.getElementById('profileAdminLink');
    const opLink = document.getElementById('profileOperatorLink');
    if (adminLink) adminLink.style.display = (state.user.role === 'admin' || state.user.role === 'staff') ? '' : 'none';
    if (opLink) opLink.style.display = (state.user.role === 'operator' || state.user.role === 'admin') ? '' : 'none';
  } else {
    g.textContent = t('hero_greeting') + ' 👋';
    n.innerHTML = '<i class="fas fa-user" style="color:#fff"></i>';
    const adminLink = document.getElementById('profileAdminLink');
    const opLink = document.getElementById('profileOperatorLink');
    if (adminLink) adminLink.style.display = 'none';
    if (opLink) opLink.style.display = 'none';
  }
  loadNotificationCount();
}

/* ===== Modals ===== */

function showModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.style.display = 'flex';
  setTimeout(() => m.classList.add('show'), 10);
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('show');
  m.style.display = 'none';
  document.body.style.overflow = '';
}

/* ===== Panels ===== */

function showPanel(id) {
  const el = document.getElementById(id);
  if (el) {
    if (id === 'toursPanel') {
      if (state.openToursFromQuickBook) {
        state.openToursFromQuickBook = false;
      } else {
        state.bottomNavToursTab = 4;
      }
    }
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  applyTranslations();
  syncBottomNavForCustomerIfVisible();
}

var opBookingPollTimer = null;
function closePanel(id) {
  if (id === 'operatorPanel' && opBookingPollTimer) { clearInterval(opBookingPollTimer); opBookingPollTimer = null; }
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
  const anyOpen = document.querySelector('.slide-panel.open');
  if (!anyOpen) document.body.style.overflow = '';
  syncBottomNavForCustomerIfVisible();
}

function closeAllPanels() {
  document.querySelectorAll('.slide-panel.open').forEach(p => p.classList.remove('open'));
  document.body.style.overflow = '';
  state.bookingStep = 1;
  state.selectedAddons = [];
  state.cachedAddons = null;
}

/** ปิดแผงสไลด์ทั้งหมด ยกเว้น keepId — ใช้เมื่อสลับแท็บเมนูล่าง (ไม่รีเซ็ต state การจองลึกเท่า closeAllPanels) */
function closeAllCustomerPanelsExcept(keepId) {
  document.querySelectorAll('.slide-panel.open').forEach(function(p) {
    if (keepId && p.id === keepId) return;
    p.classList.remove('open');
  });
  var anyOpen = document.querySelector('.slide-panel.open');
  if (!anyOpen) document.body.style.overflow = '';
  else document.body.style.overflow = 'hidden';
}

function openFullOperatorDashboard(page) {
  var base = APP_PATH_PREFIX;
  var url = base + '/operator';
  if (page) url += '#' + page;
  window.open(url, '_blank');
}

function updateOpBookingBadge(unack) {
  var n = unack || 0;
  var badgeEl = document.getElementById('opBookingNewBadge');
  if (badgeEl) badgeEl.style.display = n > 0 ? 'block' : 'none';
  var ackBar = document.getElementById('opBookingsAckBar');
  if (ackBar) ackBar.style.display = n > 0 ? 'flex' : 'none';
}
function openOperatorPanel() {
  if (opBookingPollTimer) { clearInterval(opBookingPollTimer); opBookingPollTimer = null; }
  document.querySelectorAll('.slide-panel.open').forEach(function(p) { p.classList.remove('open'); });
  var el = document.getElementById('operatorPanel');
  if (el) {
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  stateOperatorMode = 'overview';
  document.querySelectorAll('.operator-mode-card').forEach(function(c) {
    c.classList.toggle('active', (c.dataset.mode || '') === 'overview');
  });
  loadOperatorDashboard();
  if (state.token) {
    opBookingPollTimer = setInterval(function() {
      if (!document.getElementById('operatorPanel') || !document.getElementById('operatorPanel').classList.contains('open')) { if (opBookingPollTimer) clearInterval(opBookingPollTimer); opBookingPollTimer = null; return; }
      fetch(API + '/operator-data.php?action=unacknowledged-count&token=' + encodeURIComponent(state.token)).then(function(r) { return r.json(); }).then(function(j) { updateOpBookingBadge(j.unacknowledged_bookings || 0); }).catch(function() {});
    }, 25000);
  }
  applyTranslations();
  var wrap = document.getElementById('operatorContentWrap');
  if (wrap && !wrap._opScrollBound) {
    wrap._opScrollBound = true;
    wrap.addEventListener('scroll', function() {
      var idx = Math.round(wrap.scrollLeft / (wrap.offsetWidth || 1));
      var modes = ['overview', 'bookings', 'boats', 'revenue'];
      var m = modes[idx];
      if (m && m !== stateOperatorMode) {
        stateOperatorMode = m;
        document.querySelectorAll('.operator-mode-card').forEach(function(c) {
          c.classList.toggle('active', (c.dataset.mode || '') === m);
        });
      }
    });
  }
}

var stateOperatorMode = 'overview';

function setOperatorMode(mode) {
  stateOperatorMode = mode;
  document.querySelectorAll('.operator-mode-card').forEach(function(c) {
    c.classList.toggle('active', (c.dataset.mode || '') === mode);
  });
  var wrap = document.getElementById('operatorContentWrap');
  var panes = ['overview', 'bookings', 'boats', 'addons', 'revenue'];
  var idx = panes.indexOf(mode);
  if (wrap && idx >= 0) {
    wrap.scrollTo({ left: idx * wrap.offsetWidth, behavior: 'smooth' });
  }
}

async function loadOperatorDashboard() {
  var statsRow = document.getElementById('operatorStatsRow');
  var recentList = document.getElementById('operatorRecentList');
  var bookingsList = document.getElementById('operatorBookingsList');
  var boatsList = document.getElementById('operatorBoatsList');
  var addonsList = document.getElementById('operatorAddonsList');
  var revenueStats = document.getElementById('operatorRevenueStats');
  var revenueList = document.getElementById('operatorRevenueList');
  if (!statsRow) return;

  var setLoading = function() {
    if (statsRow) statsRow.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:24px"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--ocean-600)"></i></div>';
    if (recentList) recentList.innerHTML = '';
    if (bookingsList) bookingsList.innerHTML = '';
    if (boatsList) boatsList.innerHTML = '';
    if (addonsList) addonsList.innerHTML = '';
    if (revenueStats) revenueStats.innerHTML = '';
    if (revenueList) revenueList.innerHTML = '';
  };
  setLoading();

  if (!state.token) {
    if (statsRow) statsRow.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:24px;color:#64748b">กรุณาเข้าสู่ระบบ</div>';
    return;
  }

  var searchQ = (state.partnerBookingSearch || '').trim();
  var hl = function(t) { return highlightText(t, searchQ); };
  var fmt = function(n) { return '฿' + Number(n || 0).toLocaleString(); };
  var cardStyle = 'background:#fff;border-radius:12px;padding:14px;box-shadow:0 2px 8px rgba(0,0,0,0.06);border:1px solid #f1f5f9';
  var statusLabel = function(s) {
    var m = { pending: 'รอดำเนินการ', confirmed: 'รอดำเนินการ', completed: 'งานสำเร็จ', rescheduled: 'เลื่อนกำหนด', cancelled: 'ยกเลิก', no_show: 'ไม่มา' };
    return m[s] || s || '-';
  };
  var statusClr = function(s) {
    return s === 'confirmed' ? '#eab308' : s === 'pending' ? '#eab308' : s === 'completed' ? '#22c55e' : s === 'rescheduled' ? '#ef4444' : s === 'cancelled' ? '#94a3b8' : '#64748b';
  };
  var isWithin30Min = function(b) {
    if (!b.booking_date || !b.time_slot) return false;
    var d = b.booking_date + ' ' + (b.time_slot.length <= 5 ? b.time_slot : b.time_slot.substring(0, 5));
    var serviceTime = new Date(d.replace(/-/g, '/'));
    var now = new Date();
    var diff = (serviceTime - now) / 60000;
    return diff >= 0 && diff <= 30;
  };
  var bookingCard = function(b) {
    if (b.id) opBookingCache[b.id] = b;
    var sc = statusClr(b.status);
    var cust = b.display_name || b.customer_name || b.guest_name || '-';
    var loc = (b.pickup_location || '').trim() || (b.pier_name_th || b.pier_name || '');
    var statusActions = '';
    if (b.id) {
      var cur = b.status || '';
      var isP = cur === 'pending' || cur === 'confirmed';
      var isC = cur === 'completed';
      var isR = cur === 'rescheduled';
      statusActions = '<div style="margin-top:6px"><span style="font-size:10px;color:#94a3b8;margin-right:6px">สถานะ:</span><span style="font-size:10px;padding:2px 6px;border-radius:6px;background:' + sc + '22;color:' + sc + ';font-weight:600">' + esc(statusLabel(b.status)) + '</span></div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
        '<button type="button" onclick="event.stopPropagation();opSetBookingStatus(' + b.id + ',\'confirmed\')" style="font-size:11px;padding:6px 10px;border:2px solid ' + (isP ? '#eab308' : '#e2e8f0') + ';border-radius:8px;background:' + (isP ? '#fef9c3' : '#fff') + ';color:' + (isP ? '#a16207' : '#64748b') + ';cursor:pointer;font-weight:600"><i class="fas fa-clock" style="margin-right:4px"></i>รอดำเนินการ</button>' +
        '<button type="button" onclick="event.stopPropagation();opSetBookingStatus(' + b.id + ',\'completed\')" style="font-size:11px;padding:6px 10px;border:2px solid ' + (isC ? '#22c55e' : '#e2e8f0') + ';border-radius:8px;background:' + (isC ? '#dcfce7' : '#fff') + ';color:' + (isC ? '#15803d' : '#64748b') + ';cursor:pointer;font-weight:600"><i class="fas fa-flag-checkered" style="margin-right:4px"></i>งานสำเร็จ</button>' +
        '<button type="button" onclick="event.stopPropagation();opSetBookingStatus(' + b.id + ',\'rescheduled\')" style="font-size:11px;padding:6px 10px;border:2px solid ' + (isR ? '#ef4444' : '#e2e8f0') + ';border-radius:8px;background:' + (isR ? '#fee2e2' : '#fff') + ';color:' + (isR ? '#b91c1c' : '#64748b') + ';cursor:pointer;font-weight:600"><i class="fas fa-calendar-alt" style="margin-right:4px"></i>เลื่อนกำหนด</button></div>';
    }
    var pinClr = b.is_pinned ? '#f59e0b' : '#94a3b8';
    var pinBtn = b.id ? '<button type="button" onclick="event.stopPropagation();opToggleBookingPin(' + b.id + ',' + (b.is_pinned ? 0 : 1) + ',event)" style="border:none;background:none;padding:4px;cursor:pointer;color:' + pinClr + ';flex-shrink:0" title="' + (b.is_pinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด') + '"><i class="fas fa-thumbtack"></i></button>' : '';
    var noteIcon = (b.partner_note || '').trim() ? '<i class="fas fa-sticky-note" style="color:#64748b;font-size:11px;flex-shrink:0" title="มีโน็ต"></i>' : '';
    var notePreview = (b.partner_note || '').trim() ? '<div class="op-note-preview" style="font-size:11px;color:#78716c;margin-top:6px;padding:6px 8px;background:#fefce8;border-radius:6px;border-left:3px solid #f59e0b"><i class="fas fa-sticky-note" style="margin-right:4px;color:#d97706"></i>' + esc((b.partner_note || '').substring(0, 60)) + ((b.partner_note || '').length > 60 ? '...' : '') + '</div>' : '';
    var rowClick = b.id ? 'showOpBookingDetailModalById(' + b.id + ')' : 'setOperatorMode(\'bookings\')';
    var swipeAttrs = b.id ? ' data-op-bid="' + b.id + '" data-op-pinned="' + (b.is_pinned ? 1 : 0) + '"' : '';
    return '<div class="op-booking-list-row op-swipeable"' + swipeAttrs + ' onclick="' + rowClick + '" style="border:1px solid #f1f5f9;border-radius:10px;margin-bottom:6px">' +
      '<div class="op-bk-icon"><i class="fas fa-calendar-check"></i></div>' +
      '<div class="op-bk-body">' +
      '<div class="op-bk-ref" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' + pinBtn + noteIcon + hl(b.booking_ref || '-') +
      '<span style="font-size:10px;padding:2px 6px;border-radius:6px;background:' + sc + '22;color:' + sc + ';font-weight:600">' + esc(statusLabel(b.status)) + '</span></div>' +
      '<div class="op-bk-detail">' + esc(b.boat_name || '') + ' · ' + hl(cust) + '</div>' +
      '<div style="font-size:11px;color:#64748b"><i class="fas fa-phone" style="margin-right:4px;font-size:10px"></i>' + hl(b.customer_phone || '-') + (loc ? ' · <i class="fas fa-map-marker-alt" style="margin-right:4px;font-size:10px"></i>' + hl(loc) : '') + '</div>' +
      '<div class="op-bk-date">' + (b.booking_date || '') + ' ' + (b.time_slot || '') + '</div>' +
      notePreview +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><div class="op-bk-amount">' + fmt(b.total_amount) + '</div>' + statusActions + '</div></div></div>';
  };
  var bookingListItem = function(b) {
    if (b.id) opBookingCache[b.id] = b;
    var sc = statusClr(b.status);
    var cust = b.display_name || b.customer_name || b.guest_name || '-';
    var within30 = isWithin30Min(b);
    var permIcon = '<span class="op-booking-perm" title="ขออนุญาตแจ้งรายละเอียดการบริการ" style="flex-shrink:0;width:28px;height:28px;border-radius:50%;background:#eff6ff;color:#3b82f6;display:flex;align-items:center;justify-content:center;font-size:12px"><i class="fas fa-hand-paper"></i></span>';
    var remindBadge = within30 ? '<span class="op-booking-remind" style="flex-shrink:0;font-size:10px;padding:4px 8px;border-radius:8px;background:#fef3c7;color:#d97706;font-weight:600"><i class="fas fa-clock" style="margin-right:4px"></i>เริ่มใน 30 นาที</span>' : '';
    var pinClr = b.is_pinned ? '#f59e0b' : '#94a3b8';
    var pinBtn = b.id ? '<button type="button" onclick="event.stopPropagation();opToggleBookingPin(' + b.id + ',' + (b.is_pinned ? 0 : 1) + ',event)" style="border:none;background:none;padding:4px;cursor:pointer;color:' + pinClr + ';flex-shrink:0" title="' + (b.is_pinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด') + '"><i class="fas fa-thumbtack"></i></button>' : '';
    var noteIcon = (b.partner_note || '').trim() ? '<i class="fas fa-sticky-note" style="color:#64748b;font-size:11px;flex-shrink:0" title="มีโน็ต"></i>' : '';
    var notePreview = (b.partner_note || '').trim() ? '<div class="op-note-preview" style="font-size:11px;color:#78716c;margin-top:6px;padding:6px 8px;background:#fefce8;border-radius:6px;border-left:3px solid #f59e0b"><i class="fas fa-sticky-note" style="margin-right:4px;color:#d97706"></i>' + esc((b.partner_note || '').substring(0, 60)) + ((b.partner_note || '').length > 60 ? '...' : '') + '</div>' : '';
    var swipeAttrs = b.id ? ' data-op-bid="' + b.id + '" data-op-pinned="' + (b.is_pinned ? 1 : 0) + '"' : '';
    var actions = '';
    if (b.status === 'pending') {
      actions = '<div style="display:flex;gap:6px;flex-shrink:0;margin-top:8px;flex-wrap:wrap"><button type="button" class="op-crud-btn op-crud-ok" onclick="event.stopPropagation();opConfirmBooking(' + b.id + ')" title="ยืนยัน"><i class="fas fa-check"></i></button><button type="button" class="op-crud-btn op-crud-cancel" onclick="event.stopPropagation();opCancelBooking(' + b.id + ')" title="ยกเลิก"><i class="fas fa-times"></i></button></div>';
    }
    if (b.id) {
      var cur = b.status || '';
      var isP = cur === 'pending' || cur === 'confirmed';
      var isC = cur === 'completed';
      var isR = cur === 'rescheduled';
      actions += '<div style="margin-top:6px"><span style="font-size:10px;color:#94a3b8;margin-right:6px">สถานะ:</span><span style="font-size:10px;padding:2px 6px;border-radius:6px;background:' + sc + '22;color:' + sc + ';font-weight:600">' + esc(statusLabel(b.status)) + '</span></div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
        '<button type="button" onclick="event.stopPropagation();opSetBookingStatus(' + b.id + ',\'confirmed\')" style="font-size:11px;padding:6px 10px;border:2px solid ' + (isP ? '#eab308' : '#e2e8f0') + ';border-radius:8px;background:' + (isP ? '#fef9c3' : '#fff') + ';color:' + (isP ? '#a16207' : '#64748b') + ';cursor:pointer;font-weight:600"><i class="fas fa-clock" style="margin-right:4px"></i>รอดำเนินการ</button>' +
        '<button type="button" onclick="event.stopPropagation();opSetBookingStatus(' + b.id + ',\'completed\')" style="font-size:11px;padding:6px 10px;border:2px solid ' + (isC ? '#22c55e' : '#e2e8f0') + ';border-radius:8px;background:' + (isC ? '#dcfce7' : '#fff') + ';color:' + (isC ? '#15803d' : '#64748b') + ';cursor:pointer;font-weight:600"><i class="fas fa-flag-checkered" style="margin-right:4px"></i>งานสำเร็จ</button>' +
        '<button type="button" onclick="event.stopPropagation();opSetBookingStatus(' + b.id + ',\'rescheduled\')" style="font-size:11px;padding:6px 10px;border:2px solid ' + (isR ? '#ef4444' : '#e2e8f0') + ';border-radius:8px;background:' + (isR ? '#fee2e2' : '#fff') + ';color:' + (isR ? '#b91c1c' : '#64748b') + ';cursor:pointer;font-weight:600"><i class="fas fa-calendar-alt" style="margin-right:4px"></i>เลื่อนกำหนด</button></div>';
    }
    return '<div class="op-booking-item op-swipeable"' + swipeAttrs + ' style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;background:#fff;border-radius:12px;border:1px solid #f1f5f9;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.04)" onclick="' + (b.id ? 'showOpBookingDetailModalById(' + b.id + ')' : '') + '">' +
      '<div style="flex:1;min-width:0">' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">' +
      pinBtn + noteIcon +
      '<span style="font-weight:600;font-size:13px;color:#1e293b">' + hl(b.booking_ref || '-') + '</span>' +
      '<span style="font-size:11px;padding:2px 6px;border-radius:6px;background:' + sc + '22;color:' + sc + ';font-weight:600">' + esc(statusLabel(b.status)) + '</span>' +
      remindBadge + '</div>' +
      '<div style="font-size:12px;color:#64748b;margin-bottom:2px">' + hl(cust) + ' · ' + esc(b.boat_name || '') + '</div>' +
      '<div style="font-size:11px;color:#94a3b8"><i class="fas fa-phone" style="margin-right:4px;font-size:10px"></i>' + hl(b.customer_phone || '-') + '</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-top:2px"><i class="fas fa-map-marker-alt" style="margin-right:4px;font-size:10px"></i>' + hl((b.pickup_location || '').trim() || b.pier_name_th || b.pier_name || '-') + '</div>' +
      notePreview +
      '<div style="font-size:11px;color:#94a3b8">' + (b.booking_date || '') + ' ' + (b.time_slot || '') + ' · ' + fmt(b.total_amount) + '</div>' + actions + '</div>' +
      permIcon + '</div>';
  };
  var boatCard = function(bt) {
    var statusClr = bt.status === 'active' ? '#10b981' : '#f59e0b';
    var img = (bt.image || '').startsWith('http') ? bt.image : ((bt.image || '').startsWith('/') ? (window.location.origin || '') + bt.image : '');
    var imgHtml = img ? '<div style="width:56px;height:56px;border-radius:12px;overflow:hidden;flex-shrink:0"><img src="' + esc(img) + '" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML=\'<div style=width:100%;height:100%;background:linear-gradient(135deg,#e0f2fe,#bae6fd);display:flex;align-items:center;justify-content:center;font-size:24px;color:var(--ocean-600)"><i class=fas fa-ship></i></div>\'"></div>' : '<div style="width:56px;height:56px;border-radius:12px;background:linear-gradient(135deg,#e0f2fe,#bae6fd);display:flex;align-items:center;justify-content:center;color:var(--ocean-600);font-size:24px;flex-shrink:0"><i class="fas fa-ship"></i></div>';
    return '<div class="op-boat-card" style="' + cardStyle + ';display:flex;align-items:center;gap:12px">' + imgHtml +
      '<div style="flex:1;min-width:0">' +
      '<div style="font-weight:600;font-size:14px;color:#1e293b">' + esc(bt.name || '') + '</div>' +
      '<div style="font-size:12px;color:#64748b">' + esc(bt.province_name_th || bt.province || '') + ' · ' + fmt(bt.price) + '</div>' +
      '<span style="font-size:11px;padding:2px 6px;border-radius:6px;background:' + statusClr + '22;color:' + statusClr + ';font-weight:600;display:inline-block;margin-top:4px">' + esc(bt.status || '') + '</span></div>' +
      '<div style="display:flex;gap:6px;flex-shrink:0">' +
      '<button type="button" class="op-crud-btn op-crud-edit" onclick="showOpBoatModal(' + bt.id + ')" title="แก้ไข"><i class="fas fa-pen"></i></button>' +
      '<button type="button" class="op-crud-btn op-crud-del" onclick="opDeleteBoat(' + bt.id + ',' + JSON.stringify(bt.name || '') + ')" title="ปิดขาย"><i class="fas fa-ban"></i></button></div></div>';
  };

  try {
    var r = await fetch(API + '/operator-data.php?action=dashboard&token=' + encodeURIComponent(state.token));
    var data = r.ok ? await r.json() : {};
    if (data.error) {
      var msg = data.message || data.error;
      var checkBtn = '<br><button type="button" onclick="checkOperatorStatusAndReload()" style="margin-top:12px;padding:8px 16px;background:var(--ocean-600);color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer"><i class="fas fa-sync-alt" style="margin-right:6px"></i>' + (t('op_check_status_btn') || 'ตรวจสอบสถานะอีกครั้ง') + '</button>';
      statsRow.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:24px;color:#ef4444">' + esc(msg) + checkBtn + '</div>';
      return;
    }

    updateOpBookingBadge(data.unacknowledged_bookings);

    var statCards = [
      { val: data.boats ?? 0, lbl: 'เรือ', icon: 'fa-ship', bg: '#dbeafe', color: '#2563eb' },
      { val: data.bookings ?? 0, lbl: 'การจองเดือนนี้', icon: 'fa-calendar-check', bg: '#d1fae5', color: '#059669' },
      { val: fmt(data.revenue), lbl: 'รายรับเดือนนี้', icon: 'fa-coins', bg: '#fef3c7', color: '#d97706' },
      { val: Number(data.rating || 0).toFixed(1), lbl: 'คะแนนเฉลี่ย', icon: 'fa-star', bg: '#fce7f3', color: '#db2777' },
      { val: fmt(data.tips_total), lbl: 'ทิป', icon: 'fa-hand-holding-heart', bg: '#fdf4ff', color: '#a855f7' }
    ];
    statsRow.innerHTML = statCards.map(function(s) {
      return '<div style="' + cardStyle + '">' +
        '<div style="width:36px;height:36px;border-radius:8px;background:' + s.bg + ';color:' + s.color + ';display:flex;align-items:center;justify-content:center;margin-bottom:8px;font-size:14px"><i class="fas ' + s.icon + '"></i></div>' +
        '<div style="font-size:20px;font-weight:700;color:#1e293b">' + esc(String(s.val)) + '</div>' +
        '<div style="font-size:11px;color:#64748b;margin-top:2px">' + esc(s.lbl) + '</div></div>';
    }).join('');

    var recent = data.recent || [];
    recent.sort(function(a, b) {
      var da = (a.booking_date || '') + ' ' + (a.time_slot || '');
      var db = (b.booking_date || '') + ' ' + (b.time_slot || '');
      return da.localeCompare(db);
    });
    if (recentList) {
      recentList.innerHTML = recent.length === 0
        ? '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:13px">ยังไม่มีการจอง</div>'
        : recent.map(bookingCard).join('');
    }

    var boatsR = await fetch(API + '/operator-data.php?action=boats&token=' + encodeURIComponent(state.token));
    var boats = boatsR.ok ? await boatsR.json() : [];
    if (!Array.isArray(boats)) boats = [];
    if (boatsList) {
      boatsList.innerHTML = boats.length === 0
        ? '<div style="text-align:center;padding:24px;color:#94a3b8;font-size:13px"><i class="fas fa-ship" style="font-size:32px;margin-bottom:8px;display:block;opacity:0.5"></i>ยังไม่มีเรือ — กดปุ่ม <i class="fas fa-plus" style="color:var(--ocean-600)"></i> เพื่อเพิ่ม</div>'
        : boats.map(boatCard).join('');
    }

    var addonsR = await fetch(API + '/operator-data.php?action=addons&token=' + encodeURIComponent(state.token));
    var addons = addonsR.ok ? await addonsR.json() : [];
    if (!Array.isArray(addons)) addons = [];
    if (addonsList) {
      var addonCard = function(a) {
        var actClr = a.is_active ? '#10b981' : '#94a3b8';
        return '<div style="' + cardStyle + ';display:flex;align-items:center;gap:12px">' +
          '<div style="width:40px;height:40px;border-radius:10px;background:#f5f3ff;color:#7c3aed;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0"><i class="fas ' + (a.icon || 'fa-plus-circle') + '"></i></div>' +
          '<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13px;color:#1e293b">' + esc(a.name_th || a.name_en || '') + '</div>' +
          '<div style="font-size:11px;color:#64748b">' + esc(a.boat_name || '') + ' · ' + fmt(a.price) + '</div></div>' +
          '<span style="font-size:10px;padding:2px 6px;border-radius:6px;background:' + actClr + '22;color:' + actClr + ';font-weight:600">' + (a.is_active ? 'เปิด' : 'ปิด') + '</span>' +
          '<div style="display:flex;gap:4px"><button type="button" class="op-crud-btn op-crud-edit" onclick="showOpAddonModal(' + a.id + ')" title="แก้ไข"><i class="fas fa-pen"></i></button>' +
          '<button type="button" class="op-crud-btn op-crud-del" onclick="opDeleteAddon(' + a.id + ')" title="ลบ"><i class="fas fa-trash"></i></button></div></div>';
      };
      addonsList.innerHTML = addons.length === 0
        ? '<div style="text-align:center;padding:24px;color:#94a3b8;font-size:13px"><i class="fas fa-plus-circle" style="font-size:32px;margin-bottom:8px;display:block;opacity:0.5"></i>ยังไม่มี Add-on — กดปุ่ม <i class="fas fa-plus" style="color:#a855f7"></i> เพื่อเพิ่ม</div>'
        : addons.map(addonCard).join('');
    }

    var opSearchInput = document.getElementById('operatorBookingsSearch');
    if (opSearchInput) { opSearchInput.value = searchQ; }
    var bookingsUrl = API + '/operator-data.php?action=bookings&token=' + encodeURIComponent(state.token);
    if (searchQ) bookingsUrl += '&search=' + encodeURIComponent(searchQ);
    var bookingsR = await fetch(bookingsUrl);
    var bookings = bookingsR.ok ? await bookingsR.json() : [];
    if (!Array.isArray(bookings)) bookings = [];
    if (bookingsList) {
      if (bookings.length === 0) {
        bookingsList.innerHTML = '<div style="text-align:center;padding:24px;color:#94a3b8;font-size:13px">ยังไม่มีการจอง</div>';
      } else {
        var today = new Date().toISOString().slice(0, 10);
        var byDate = {};
        bookings.forEach(function(b) {
          var d = b.booking_date || '';
          if (!byDate[d]) byDate[d] = [];
          byDate[d].push(b);
        });
        var todayBookings = byDate[today] || [];
        var dates = Object.keys(byDate).filter(function(d) { return d !== today; }).sort();
        var fmtDate = function(d) {
          if (!d) return '';
          var parts = d.split('-');
          if (parts.length >= 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
          return d;
        };
        var html = '';
        html += '<div class="op-bookings-section" style="margin-bottom:20px">';
        html += '<h3 style="font-size:14px;font-weight:700;color:var(--ocean-700);margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid var(--ocean-500);background:linear-gradient(135deg,#dbeafe,#e0f2fe);padding:10px 14px;margin:-20px -20px 10px -20px;border-radius:0"><i class="fas fa-sun" style="margin-right:6px;color:var(--ocean-600)"></i>วันนี้ · ' + fmtDate(today) + ' (' + todayBookings.length + ' รายการ)</h3>';
        html += '<div style="display:flex;flex-direction:column;gap:0">' + (todayBookings.length === 0 ? '<div style="padding:16px;color:#94a3b8;font-size:12px">วันนี้ไม่มีงานจอง</div>' : todayBookings.map(bookingListItem).join('')) + '</div></div>';
        html += '<div class="op-bookings-section" style="margin-bottom:20px">';
        html += '<h3 style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #e2e8f0"><i class="fas fa-calendar-alt" style="margin-right:6px;color:#64748b"></i>แพลนเนอร์การจองทั้งหมด</h3>';
        html += '<div style="display:flex;flex-direction:column;gap:0">';
        dates.forEach(function(d) {
          var items = byDate[d] || [];
          html += '<div style="margin-bottom:12px">';
          html += '<div style="font-size:12px;font-weight:600;color:#64748b;margin-bottom:6px;padding-left:4px">' + fmtDate(d) + ' (' + items.length + ' รายการ)</div>';
          html += items.map(bookingListItem).join('');
          html += '</div>';
        });
        html += '</div></div>';
        bookingsList.innerHTML = html;
      }
    }

    var revR = await fetch(API + '/operator-data.php?action=revenue&token=' + encodeURIComponent(state.token));
    var revData = revR.ok ? await revR.json() : { total: 0, month: 0, pending: 0, items: [] };
    if (revenueStats) {
      revenueStats.style.gridTemplateColumns = 'repeat(3, 1fr)';
      revenueStats.innerHTML = '<div style="' + cardStyle + '"><div style="font-size:16px;font-weight:700;color:#1e293b">' + fmt(revData.total) + '</div><div style="font-size:10px;color:#64748b">ทั้งหมด</div></div>' +
        '<div style="' + cardStyle + '"><div style="font-size:16px;font-weight:700;color:#1e293b">' + fmt(revData.month) + '</div><div style="font-size:10px;color:#64748b">เดือนนี้</div></div>' +
        '<div style="' + cardStyle + '"><div style="font-size:16px;font-weight:700;color:#f59e0b">' + fmt(revData.pending) + '</div><div style="font-size:10px;color:#64748b">รอจ่าย</div></div>';
    }
    var items = revData.items || [];
    if (revenueList) {
      revenueList.innerHTML = items.length === 0
        ? '<div style="text-align:center;padding:24px;color:#94a3b8;font-size:13px">ไม่มีรายการ</div>'
        : items.slice(0, 20).map(function(i) {
          return '<div style="' + cardStyle + '">' +
            '<div style="display:flex;justify-content:space-between"><span style="font-weight:600">' + esc(i.booking_ref || '') + '</span><span style="color:var(--ocean-600);font-weight:600">' + fmt(i.total_amount) + '</span></div>' +
            '<div style="font-size:12px;color:#64748b;margin-top:4px">' + esc(i.boat_name || '') + ' · ' + (i.booking_date || '') + '</div>' +
            '<span style="font-size:11px;padding:2px 6px;border-radius:4px;background:' + (i.pay_status === 'paid' ? '#d1fae5' : '#fef3c7') + ';color:' + (i.pay_status === 'paid' ? '#059669' : '#d97706') + ';margin-top:6px;display:inline-block">' + (i.pay_status || 'pending') + '</span></div>';
        }).join('');
    }
  } catch (e) {
    console.error('loadOperatorDashboard error:', e);
    statsRow.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:24px;color:#ef4444">โหลดข้อมูลไม่สำเร็จ</div>';
  }
}

async function checkOperatorStatusAndReload() {
  if (!state.token) return;
  try {
    var r = await fetch(API + '/operator-data.php?action=status&token=' + encodeURIComponent(state.token));
    var j = r.ok ? await r.json() : {};
    if ((j.status || '').toLowerCase() === 'approved') {
      toast(t('op_approved_msg') || 'บัญชีของคุณได้รับการอนุมัติแล้ว');
      loadOperatorDashboard();
    } else {
      toast((t('op_still_pending') || 'ยังรอการอนุมัติจากแอดมิน'), 'error');
    }
  } catch (e) {
    toast(t('error') || 'เกิดข้อผิดพลาด', 'error');
  }
}

async function opConfirmBooking(id) {
  if (!state.token) return;
  try {
    var r = await fetch(API + '/operator-data.php?action=confirm&id=' + id + '&token=' + encodeURIComponent(state.token));
    var j = r.ok ? await r.json() : {};
    if (j.success !== false) { toast(t('success_msg') || 'ยืนยันการจองแล้ว'); loadOperatorDashboard(); }
    else toast(j.message || 'ไม่สำเร็จ', 'error');
  } catch (e) { toast('ไม่สำเร็จ', 'error'); }
}

async function opCancelBooking(id) {
  if (!state.token || !confirm('ยกเลิกการจองนี้?')) return;
  try {
    var r = await fetch(API + '/operator-data.php?action=cancel&id=' + id + '&token=' + encodeURIComponent(state.token));
    var j = r.ok ? await r.json() : {};
    if (j.success !== false) { toast('ยกเลิกการจองแล้ว'); loadOperatorDashboard(); }
    else toast(j.message || 'ไม่สำเร็จ', 'error');
  } catch (e) { toast('ไม่สำเร็จ', 'error'); }
}

async function opCompleteBooking(id) {
  if (!state.token || !id) return;
  try {
    var r = await fetch(API + '/operator-data.php?action=booking-status&id=' + id + '&status=completed&token=' + encodeURIComponent(state.token));
    var j = r.ok ? await r.json() : {};
    if (j.success !== false) { toast('งานสำเร็จ'); loadOperatorDashboard(); if (typeof loadPartnerBookings === 'function') loadPartnerBookings(); }
    else toast(j.message || 'ไม่สำเร็จ', 'error');
  } catch (e) { toast('ไม่สำเร็จ', 'error'); }
}
async function opAcknowledgeBookings() {
  if (!state.token) return;
  try {
    var r = await fetch(API + '/operator-data.php?action=acknowledge-bookings&token=' + encodeURIComponent(state.token));
    var j = r.ok ? await r.json() : {};
    if (j.success !== false) {
      toast('ยืนยันรับรู้แล้ว');
      var badgeEl = document.getElementById('opBookingNewBadge');
      if (badgeEl) badgeEl.style.display = 'none';
      var ackBar = document.getElementById('opBookingsAckBar');
      if (ackBar) ackBar.style.display = 'none';
      loadOperatorDashboard();
      if (typeof loadPartnerBookings === 'function') loadPartnerBookings();
    } else toast(j.message || 'ไม่สำเร็จ', 'error');
  } catch (e) { toast('ไม่สำเร็จ', 'error'); }
}
async function opSetBookingStatus(id, status) {
  if (!state.token || !id || !status) return;
  try {
    var r = await fetch(API + '/operator-data.php?action=booking-status&id=' + id + '&status=' + encodeURIComponent(status) + '&token=' + encodeURIComponent(state.token));
    var j = r.ok ? await r.json() : {};
    if (j.success !== false) {
      var msg = status === 'completed' ? 'งานสำเร็จ' : (status === 'rescheduled' ? 'เลื่อนกำหนด' : 'รอดำเนินการ');
      toast(msg);
      if (opBookingCache[id]) opBookingCache[id].status = status;
      if (opBookingDetailData && opBookingDetailData.id === id) { opBookingDetailData.status = status; showOpBookingDetailModal(opBookingDetailData); }
      loadOperatorDashboard();
      if (typeof loadPartnerBookings === 'function') loadPartnerBookings();
    } else toast(j.message || 'ไม่สำเร็จ', 'error');
  } catch (e) { toast('ไม่สำเร็จ', 'error'); }
}

var opBookingDetailData = null;
var opBookingCache = {};
function showOpBookingDetailModalById(id) {
  var b = opBookingCache[id];
  if (b) showOpBookingDetailModal(b);
}
function showOpBookingDetailModal(b) {
  if (!b) return;
  opBookingDetailData = b;
  var modal = document.getElementById('opBookingDetailModal');
  var content = document.getElementById('opBookingDetailContent');
  var statusActionsEl = document.getElementById('opBookingStatusActions');
  var noteInput = document.getElementById('opBookingNoteInput');
  var pinBtn = document.getElementById('opBookingPinBtn');
  var pinLabel = document.getElementById('opBookingPinLabel');
  if (!modal || !content) return;
  var cust = b.display_name || b.customer_name || b.guest_name || '-';
  var loc = (b.pickup_location || '').trim() || (b.pier_name_th || b.pier_name || '-');
  var fmt = function(n) { return '฿' + Number(n || 0).toLocaleString(); };
  content.innerHTML = '<div style="display:grid;gap:10px">' +
    '<div><span style="color:#94a3b8">Ref</span><br><strong>' + esc(b.booking_ref || '-') + '</strong></div>' +
    '<div><span style="color:#94a3b8">ลูกค้า</span><br>' + esc(cust) + '</div>' +
    '<div><span style="color:#94a3b8">โทร</span><br><a href="tel:' + esc(b.customer_phone || '') + '" style="color:var(--ocean-600)">' + esc(b.customer_phone || '-') + '</a></div>' +
    '<div><span style="color:#94a3b8">สถานที่รับ/ส่ง</span><br>' + esc(loc) + '</div>' +
    '<div><span style="color:#94a3b8">เรือ</span><br>' + esc(b.boat_name || '-') + '</div>' +
    '<div><span style="color:#94a3b8">วันที่ · เวลา</span><br>' + (b.booking_date || '') + ' ' + (b.time_slot || '') + '</div>' +
    '<div><span style="color:#94a3b8">ยอด</span><br><strong style="color:var(--ocean-600)">' + fmt(b.total_amount) + '</strong></div>' +
    (b.pay_status ? '<div><span style="color:#94a3b8">สถานะชำระเงิน</span><br><span style="font-weight:600;color:' + (b.pay_status === 'paid' ? '#22c55e' : '#eab308') + '">' + (b.pay_status === 'paid' ? 'ชำระแล้ว' : 'รอชำระ') + '</span></div>' : '') +
    (b.transaction_ref ? '<div><span style="color:#94a3b8">Ref โอนเงิน (จับคู่กับสลิปธนาคาร)</span><br><code style="font-size:13px;font-weight:600;color:var(--ocean-600);letter-spacing:0.5px">' + esc(b.transaction_ref) + '</code></div>' : '') + '</div>';
  if (statusActionsEl) {
    if (b.id && !b._isDemo) {
      var statusLabels = { pending:'รอดำเนินการ', confirmed:'รอดำเนินการ', completed:'งานสำเร็จ', rescheduled:'เลื่อนกำหนด', cancelled:'ยกเลิก' };
      var statusColors = { pending:'#eab308', confirmed:'#eab308', completed:'#22c55e', rescheduled:'#ef4444', cancelled:'#94a3b8' };
      var cur = b.status || '';
      var sc = statusColors[cur] || '#64748b';
      var isPending = cur === 'pending' || cur === 'confirmed';
      var isCompleted = cur === 'completed';
      var isRescheduled = cur === 'rescheduled';
      var payPending = b.pay_status === 'pending' && b.payment_id;
      var confirmPayBtn = payPending ? '<button type="button" onclick="opConfirmPaymentFromModal(' + b.payment_id + ')" style="width:100%;padding:10px;margin-bottom:10px;border:2px solid #22c55e;border-radius:10px;background:#dcfce7;color:#15803d;font-size:13px;font-weight:600;cursor:pointer"><i class="fas fa-check-circle" style="margin-right:6px"></i>ยืนยันรับชำระเงินแล้ว</button>' : '';
      statusActionsEl.innerHTML = confirmPayBtn +
        '<div style="margin-bottom:10px"><span style="font-size:12px;color:#94a3b8;margin-right:8px">สถานะปัจจุบัน:</span><span style="font-size:12px;padding:4px 10px;border-radius:8px;background:' + sc + '22;color:' + sc + ';font-weight:600">' + esc(statusLabels[cur] || cur) + '</span></div>' +
        '<label style="display:block;margin-bottom:8px;font-size:12px;color:#64748b">กำหนดสถานะการทำงาน (กดเลือก)</label>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button type="button" onclick="opSetBookingStatus(' + b.id + ',\'confirmed\');closeOpBookingDetailModal()" style="flex:1;padding:10px;border:2px solid ' + (isPending ? '#eab308' : '#e2e8f0') + ';border-radius:10px;background:' + (isPending ? '#fef9c3' : '#fff') + ';color:' + (isPending ? '#a16207' : '#64748b') + ';font-size:13px;font-weight:600;cursor:pointer"><i class="fas fa-clock" style="margin-right:6px"></i>รอดำเนินการ</button>' +
        '<button type="button" onclick="opSetBookingStatus(' + b.id + ',\'completed\');closeOpBookingDetailModal()" style="flex:1;padding:10px;border:2px solid ' + (isCompleted ? '#22c55e' : '#e2e8f0') + ';border-radius:10px;background:' + (isCompleted ? '#dcfce7' : '#fff') + ';color:' + (isCompleted ? '#15803d' : '#64748b') + ';font-size:13px;font-weight:600;cursor:pointer"><i class="fas fa-flag-checkered" style="margin-right:6px"></i>งานสำเร็จ</button>' +
        '<button type="button" onclick="opSetBookingStatus(' + b.id + ',\'rescheduled\');closeOpBookingDetailModal()" style="flex:1;padding:10px;border:2px solid ' + (isRescheduled ? '#ef4444' : '#e2e8f0') + ';border-radius:10px;background:' + (isRescheduled ? '#fee2e2' : '#fff') + ';color:' + (isRescheduled ? '#b91c1c' : '#64748b') + ';font-size:13px;font-weight:600;cursor:pointer"><i class="fas fa-calendar-alt" style="margin-right:6px"></i>เลื่อนกำหนด</button></div>';
      statusActionsEl.style.display = 'block';
    } else {
      statusActionsEl.innerHTML = '';
      statusActionsEl.style.display = 'none';
    }
  }
  if (noteInput) {
    noteInput.value = b.partner_note || '';
    initOpNoteAutoSave(noteInput);
  }
  if (pinBtn) {
    pinBtn.style.color = b.is_pinned ? '#f59e0b' : '#64748b';
    pinBtn.style.borderColor = b.is_pinned ? '#f59e0b' : '#e2e8f0';
    if (pinLabel) pinLabel.textContent = b.is_pinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด';
  }
  modal.style.display = 'flex';
}
var opNoteAutoSaveTimer = null;
function initOpNoteAutoSave(ta) {
  if (!ta) return;
  if (opNoteAutoSaveTimer) clearTimeout(opNoteAutoSaveTimer);
  ta.oninput = function() {
    clearTimeout(opNoteAutoSaveTimer);
    opNoteAutoSaveTimer = setTimeout(function() { opSaveBookingNoteFromModal(true); }, 600);
  };
}
async function opConfirmPaymentFromModal(paymentId) {
  if (!paymentId || !state.token) return;
  if (!confirm('ยืนยันว่าลูกค้าชำระเงินแล้ว? (ตรวจสอบจากธนาคารก่อน)')) return;
  try {
    var r = await apiCall('PUT', '/payments/' + paymentId + '/confirm');
    if (r.success !== false) {
      toast('ยืนยันการชำระเงินแล้ว');
      if (opBookingDetailData) opBookingDetailData.pay_status = 'paid';
      showOpBookingDetailModal(opBookingDetailData);
      loadOperatorDashboard();
      if (typeof loadPartnerBookings === 'function') loadPartnerBookings();
    } else toast(r.message || 'ไม่สำเร็จ', 'error');
  } catch (e) { toast('ไม่สำเร็จ', 'error'); }
}

async function opSaveAndCloseBookingModal() {
  await opSaveBookingNoteFromModal(false);
  closeOpBookingDetailModal();
}
function closeOpBookingDetailModal() {
  opBookingDetailData = null;
  var modal = document.getElementById('opBookingDetailModal');
  if (modal) modal.style.display = 'none';
}
async function opTogglePinFromModal() {
  if (!opBookingDetailData || !opBookingDetailData.id || !state.token) return;
  var pinned = opBookingDetailData.is_pinned ? 0 : 1;
  try {
    var r = await fetch(API + '/operator-data.php?action=booking-pin&id=' + opBookingDetailData.id + '&pinned=' + pinned + '&token=' + encodeURIComponent(state.token));
    var j = r.ok ? await r.json() : {};
    if (j.success !== false) {
      opBookingDetailData.is_pinned = pinned;
      var pinBtn = document.getElementById('opBookingPinBtn');
      var pinLabel = document.getElementById('opBookingPinLabel');
      if (pinBtn) { pinBtn.style.color = pinned ? '#f59e0b' : '#64748b'; pinBtn.style.borderColor = pinned ? '#f59e0b' : '#e2e8f0'; }
      if (pinLabel) pinLabel.textContent = pinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด';
      toast(pinned ? 'ปักหมุดแล้ว' : 'ยกเลิกปักหมุดแล้ว');
      loadOperatorDashboard();
      if (typeof loadPartnerBookings === 'function') loadPartnerBookings();
    } else toast(j.message || 'ไม่สำเร็จ', 'error');
  } catch (e) { toast('ไม่สำเร็จ', 'error'); }
}
async function opSaveBookingNoteFromModal(silent) {
  if (!opBookingDetailData || !state.token) return;
  if (opBookingDetailData._isDemo || state.partnerBookingsAreDemo) {
    if (!silent) toast('นี่เป็นข้อมูลตัวอย่าง — สร้างเรือและรับการจองจริงก่อนจึงจะบันทึกโน็ตได้', 'error');
    return;
  }
  if (!opBookingDetailData.id && !opBookingDetailData.booking_ref) return;
  var noteInput = document.getElementById('opBookingNoteInput');
  var note = noteInput ? noteInput.value : '';
  try {
    var fd = new FormData();
    var bid = opBookingDetailData.id || 0;
    fd.append('id', String(bid));
    fd.append('note', note);
    if (opBookingDetailData.booking_ref) fd.append('booking_ref', opBookingDetailData.booking_ref);
    var url = API + '/operator-data.php?action=booking-note&token=' + encodeURIComponent(state.token);
    if (bid) url += '&id=' + bid;
    var r = await fetch(url, {
      method: 'POST',
      body: fd
    });
    var j = {};
    try { j = await r.json(); } catch (e) {}
    if (j && j.success !== false && !j.error) {
      opBookingDetailData.partner_note = note.trim();
      if (!silent) toast('บันทึกโน็ตแล้ว');
      loadOperatorDashboard();
      if (typeof loadPartnerBookings === 'function') loadPartnerBookings();
    } else if (!silent) toast(j.message || j.error || 'ไม่สำเร็จ', 'error');
  } catch (e) { if (!silent) toast('ไม่สำเร็จ', 'error'); }
}
function opToggleBookingPin(id, pinned, ev) {
  if (ev) ev.stopPropagation();
  if (!state.token) return;
  fetch(API + '/operator-data.php?action=booking-pin&id=' + id + '&pinned=' + (pinned ? 1 : 0) + '&token=' + encodeURIComponent(state.token))
    .then(function(r) { return r.json(); })
    .then(function(j) {
      if (j.success !== false) { toast(pinned ? 'ปักหมุดแล้ว' : 'ยกเลิกปักหมุดแล้ว'); loadOperatorDashboard(); if (typeof loadPartnerBookings === 'function') loadPartnerBookings(); }
      else toast(j.message || 'ไม่สำเร็จ', 'error');
    })
    .catch(function() { toast('ไม่สำเร็จ', 'error'); });
}

(function initOpSwipeToPin() {
  var startX = 0, startY = 0, targetEl = null;
  document.addEventListener('touchstart', function(e) {
    var el = e.target.closest('.op-swipeable');
    if (el && el.dataset.opBid) {
      targetEl = el;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    } else targetEl = null;
  }, { passive: true });
  document.addEventListener('touchend', function(e) {
    if (!targetEl || !targetEl.dataset.opBid || !state.token) return;
    var touch = e.changedTouches && e.changedTouches[0];
    if (!touch) { targetEl = null; return; }
    var dx = touch.clientX - startX;
    var dy = touch.clientY - startY;
    if (dx > 50 && Math.abs(dy) < 80) {
      var bid = parseInt(targetEl.dataset.opBid, 10);
      var pinned = targetEl.dataset.opPinned === '1' ? 0 : 1;
      opToggleBookingPin(bid, pinned, e);
    }
    targetEl = null;
  }, { passive: true });
})();

async function opDeleteBoat(id, name) {
  if (!state.token || !confirm('ปิดการขายเรือ "' + (name || '') + '" ใช่หรือไม่?')) return;
  try {
    var r = await apiCall('DELETE', '/operator/boats/' + id);
    if (r.success !== false) {
      toast('ปิดการขายเรือแล้ว');
      loadOperatorDashboard();
      if (typeof loadPartnerContentDiscovery === 'function') loadPartnerContentDiscovery();
    } else toast(r.message || 'ไม่สำเร็จ', 'error');
  } catch (e) { toast('ไม่สำเร็จ', 'error'); }
}

async function opDeleteAddon(id) {
  if (!state.token || !confirm('ลบ Add-on นี้?')) return;
  try {
    var r = await apiCall('DELETE', '/operator/addons/' + id);
    if (r.success !== false) { toast('ลบ Add-on แล้ว'); loadOperatorDashboard(); }
    else toast(r.message || 'ไม่สำเร็จ', 'error');
  } catch (e) { toast('ไม่สำเร็จ', 'error'); }
}

var stateOpBoatModalId = null;
function durToHrMin(min) {
  min = parseInt(min, 10) || 0;
  var h = Math.floor(min / 60);
  var m = min % 60;
  return { h: h, m: m };
}
var stateOpBoatAddonsTemp = [];
var stateOpBoatImagesTemp = [];
function opFormatBoatTimeSlots(boat) {
  var slots = ['09:00', '13:00', '16:00'];
  if (boat && boat.default_time_slots) {
    try {
      var parsed = typeof boat.default_time_slots === 'string' ? JSON.parse(boat.default_time_slots) : boat.default_time_slots;
      if (Array.isArray(parsed) && parsed.length > 0) slots = parsed;
    } catch (e) {}
  }
  return slots.map(function(s) {
    return '<span class="op-boat-time-slot" data-slot="' + esc(s) + '" style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px;background:#eff6ff;color:#1e40af;border-radius:8px;font-size:12px;font-weight:600">' +
      '<i class="fas fa-clock"></i> ' + esc(s) +
      '<button type="button" onclick="opRemoveBoatTimeSlot(this)" style="border:none;background:none;color:#64748b;cursor:pointer;padding:0 2px;font-size:11px" title="ลบ"><i class="fas fa-times"></i></button></span>';
  }).join('');
}
function opGetBoatTimeSlots() {
  var list = document.getElementById('opBoatTimeSlotsList');
  if (!list) return [];
  return Array.prototype.slice.call(list.querySelectorAll('.op-boat-time-slot')).map(function(el) { return el.dataset.slot || ''; }).filter(Boolean);
}
function opAddBoatTimeSlot() {
  var inp = document.getElementById('opBoatTimeSlotInput');
  var list = document.getElementById('opBoatTimeSlotsList');
  if (!inp || !list) return;
  var val = inp.value;
  if (!val) { toast('กรุณาเลือกเวลา', 'error'); return; }
  if (val.length >= 5) val = val.substring(0, 5);
  if (list.querySelector('[data-slot="' + val + '"]')) { toast('มีรอบนี้แล้ว', 'error'); return; }
  var span = document.createElement('span');
  span.className = 'op-boat-time-slot';
  span.dataset.slot = val;
  span.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:6px 10px;background:#eff6ff;color:#1e40af;border-radius:8px;font-size:12px;font-weight:600';
  span.innerHTML = '<i class="fas fa-clock"></i> ' + esc(val) + ' <button type="button" onclick="opRemoveBoatTimeSlot(this)" style="border:none;background:none;color:#64748b;cursor:pointer;padding:0 2px;font-size:11px" title="ลบ"><i class="fas fa-times"></i></button>';
  list.appendChild(span);
  inp.value = '';
}
function opRemoveBoatTimeSlot(btn) {
  var el = btn && btn.closest ? btn.closest('.op-boat-time-slot') : null;
  if (el) el.remove();
}
async function showOpBoatModal(boatId) {
  stateOpBoatModalId = boatId || null;
  if (!boatId) { stateOpBoatAddonsTemp = []; stateOpBoatImagesTemp = []; }
  var boat = null;
  if (boatId) {
    var boatsR = await fetch(API + '/operator-data.php?action=boats&token=' + encodeURIComponent(state.token));
    var boats = boatsR.ok ? await boatsR.json() : [];
    boat = (boats || []).find(function(b) { return b.id == boatId; });
  }
  var provR = await fetch(API + '/operator-data.php?action=provinces&token=' + encodeURIComponent(state.token));
  var provinces = provR.ok ? await provR.json() : [];
  if (!Array.isArray(provinces)) provinces = [];
  var provOpts = '<option value="">-- เลือกจังหวัด --</option>' + provinces.map(function(p) { var v = p.name_th || p.name_en || p.id || ''; var sel = boat && ((boat.province_name_th || boat.province || '') === v || boat.province === v); return '<option value="' + esc(v) + '"' + (sel ? ' selected' : '') + '>' + esc(p.name_th || p.name_en || v) + '</option>'; }).join('');
  var typesR = await fetch(API + '/operator-data.php?action=boat-types&token=' + encodeURIComponent(state.token));
  var boatTypes = typesR.ok ? await typesR.json() : [];
  if (!Array.isArray(boatTypes)) boatTypes = [{ slug: 'longtail', name_th: 'เรือหางยาว' }, { slug: 'speedboat', name_th: 'สปีดโบ๊ท' }, { slug: 'yacht', name_th: 'เรือยอร์ช' }, { slug: 'catamaran', name_th: 'เรือคาตามารัน' }];
  var typeOpts = boatTypes.map(function(t) { var v = t.slug || t.id || ''; return '<option value="' + esc(v) + '"' + (boat && (boat.boat_type || '') === v ? ' selected' : (!boat && v === 'longtail' ? ' selected' : '')) + '>' + esc(t.name_th || t.name_en || v) + '</option>'; }).join('');
  var dm = durToHrMin(boat ? boat.duration : 120);
  var templatesR = await fetch(API + '/operator-data.php?action=addon-templates&token=' + encodeURIComponent(state.token));
  var allTemplates = templatesR.ok ? await templatesR.json() : [];
  if (!Array.isArray(allTemplates)) allTemplates = [];
  var boatAddons = [];
  if (boat && boat.id) {
    var addonsR = await fetch(API + '/operator-data.php?action=addons&token=' + encodeURIComponent(state.token));
    var allAddons = addonsR.ok ? await addonsR.json() : [];
    boatAddons = (allAddons || []).filter(function(a) { return a.boat_id == boat.id; });
  }
  var addonRows = boatId ? boatAddons.map(function(a) {
    return '<div class="op-boat-addon-row" data-id="' + a.id + '" style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f8fafc;border-radius:8px;margin-bottom:6px"><span style="flex:1;font-size:13px">' + esc(a.name_th || a.name_en || '') + '</span><span style="font-weight:600;color:var(--ocean-600)">฿' + Number(a.price || 0).toLocaleString() + '</span><button type="button" onclick="opDeleteAddonFromBoatModal(' + a.id + ',' + boatId + ')" style="border:none;background:#fee2e2;color:#991b1b;padding:4px 8px;border-radius:6px;font-size:11px;cursor:pointer">ลบ</button></div>';
  }).join('') : stateOpBoatAddonsTemp.map(function(a, i) {
    return '<div class="op-boat-addon-temp" data-idx="' + i + '" style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f8fafc;border-radius:8px;margin-bottom:6px"><span style="flex:1;font-size:13px">' + esc(a.name || '') + '</span><span style="font-weight:600;color:var(--ocean-600)">฿' + Number(a.price || 0).toLocaleString() + '</span><button type="button" onclick="opRemoveBoatAddonTemp(' + i + ')" style="border:none;background:#fee2e2;color:#991b1b;padding:4px 8px;border-radius:6px;font-size:11px;cursor:pointer">ลบ</button></div>';
  }).join('');
  var addonSelectHtml = allTemplates.length > 0 ? '<div style="margin-top:8px;padding:8px;background:#eff6ff;border-radius:8px;font-size:12px;color:#1e40af"><strong>เลือกจาก Add-on ที่มีอยู่:</strong><div id="opBoatAddonSelectList" style="max-height:100px;overflow-y:auto;margin-top:6px">' + allTemplates.map(function(t) {
    var checked = boatId ? boatAddons.some(function(a) { return a.addon_template_id == t.id; }) : stateOpBoatAddonsTemp.some(function(a) { return a.template_id == t.id; });
    return '<label style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer"><input type="checkbox" data-id="' + t.id + '" data-name="' + esc(t.name_th || t.name_en || '') + '" data-price="' + (t.price || 0) + '" onchange="opToggleSelectAddonTemplate(this)"' + (checked ? ' checked' : '') + '><span>' + esc(t.name_th || t.name_en || '') + ' ฿' + Number(t.price || 0).toLocaleString() + '</span></label>';
  }).join('') + '</div></div>' : '<p style="font-size:12px;color:#94a3b8;margin-top:8px">ยังไม่มี Add-on — สร้างใหม่ด้านล่างหรือไปที่เมนูเสริมบริการ</p>';
  var inpStyle = 'width:100%;height:44px;border:2px solid #e2e8f0;border-radius:10px;padding:0 12px';
  var html = '<div style="background:#fff;border-radius:16px;padding:20px;max-width:480px;width:100%;margin:auto;max-height:90vh;overflow-y:auto">' +
    '<h3 style="margin-bottom:16px;font-size:16px"><i class="fas fa-ship" style="margin-right:8px;color:var(--ocean-600)"></i>' + (boat ? 'แก้ไขเรือ/ทัวร์' : 'เพิ่มเรือ/ทัวร์') + '</h3>' +
    '<div style="margin-bottom:12px"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px">ชื่อเรือ/ทัวร์ *</label><input type="text" id="opBoatName" value="' + esc(boat ? boat.name : '') + '" placeholder="เช่น ล่องเรือชมพระอาทิตย์ตก" style="' + inpStyle + '"></div>' +
    '<div style="margin-bottom:12px"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px">พื้นที่ให้บริการ *</label><select id="opBoatProvince" style="' + inpStyle + '">' + provOpts + '</select></div>' +
    '<div style="margin-bottom:12px"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px">ประเภทเรือ</label><select id="opBoatType" style="' + inpStyle + '">' + typeOpts + '</select></div>' +
    '<div style="margin-bottom:12px"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px">ความจุ (คน)</label><input type="number" id="opBoatCap" value="' + (boat ? boat.capacity : 20) + '" min="1" style="' + inpStyle + '"></div>' +
    '<div style="margin-bottom:12px"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px">ระยะเวลา</label><div style="display:flex;gap:8px"><div style="flex:1"><label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:4px">ชม.</label><input type="number" id="opBoatDurHr" value="' + dm.h + '" min="0" max="24" style="' + inpStyle + '"></div><div style="flex:1"><label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:4px">นาที</label><input type="number" id="opBoatDurMin" value="' + dm.m + '" min="0" max="59" style="' + inpStyle + '"></div></div></div>' +
    '<div style="margin-bottom:12px"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px">ราคา (฿) *</label><input type="number" id="opBoatPrice" value="' + (boat ? boat.price : 0) + '" min="0" step="0.01" style="' + inpStyle + '"></div>' +
    '<div style="margin-bottom:12px;padding-top:12px;border-top:1px solid #e2e8f0"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:8px">รอบเวลาการให้บริการ</label><p style="font-size:11px;color:#94a3b8;margin-bottom:8px">กำหนดเวลาที่ลูกค้าสามารถจองได้ (เช่น 09:00, 13:00, 16:00)</p><div id="opBoatTimeSlotsList" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">' + opFormatBoatTimeSlots(boat) + '</div><div style="display:flex;gap:8px;align-items:center"><input type="time" id="opBoatTimeSlotInput" style="height:40px;border:2px solid #e2e8f0;border-radius:8px;padding:0 10px;font-size:14px;flex:1"><button type="button" onclick="opAddBoatTimeSlot()" style="padding:8px 14px;border:2px solid #e2e8f0;background:#fff;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer"><i class="fas fa-plus" style="margin-right:4px"></i>เพิ่มรอบ</button></div></div>' +
    '<div style="margin-bottom:12px"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px">รายละเอียด</label><textarea id="opBoatDesc" rows="2" style="width:100%;border:2px solid #e2e8f0;border-radius:10px;padding:10px 12px;font-size:13px;resize:vertical">' + esc(boat ? (boat.description || boat.description_th || '') : '') + '</textarea></div>' +
    '<div id="opBoatImagesSection" style="margin-bottom:16px;padding-top:12px;border-top:1px solid #e2e8f0"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:8px">รูปโปรโมท (สูงสุด 8 รูป)</label><div id="opBoatImagesList" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:8px"></div><input type="file" id="opBoatImageInput" accept="image/jpeg,image/png,image/gif,image/webp" style="display:none" multiple><button type="button" id="opBoatImageAddBtn" onclick="document.getElementById(\'opBoatImageInput\').click()" style="width:100%;height:40px;border:2px dashed #e2e8f0;background:#f8fafc;border-radius:8px;color:#64748b;font-size:13px;cursor:pointer"><i class="fas fa-plus" style="margin-right:6px"></i>เพิ่มรูป</button></div>' +
    '<div id="opBoatAddonsSection" style="margin-bottom:16px;padding-top:12px;border-top:1px solid #e2e8f0"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:8px">Add-on ที่มีสำหรับเรือนี้</label><div id="opBoatAddonsList" style="max-height:120px;overflow-y:auto;margin-bottom:8px">' + (addonRows || '<p style="color:#94a3b8;font-size:12px">ยังไม่มี Add-on — เลือกจากรายการด้านล่างหรือสร้างใหม่</p>') + '</div>' + addonSelectHtml + '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><button type="button" onclick="showOpAddonModal(null,' + (boatId || 'null') + ')" style="flex:1;min-width:120px;height:38px;border:2px solid #a855f7;background:#f5f3ff;color:#7c3aed;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer"><i class="fas fa-plus" style="margin-right:4px"></i>สร้าง Add-on</button><button type="button" onclick="opAddBoatAddonInline(' + (boatId || '0') + ')" style="flex:1;min-width:120px;height:38px;border:2px solid #e2e8f0;background:#fff;color:#64748b;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer"><i class="fas fa-bolt" style="margin-right:4px"></i>สร้างแบบเร็ว</button></div></div>' +
    '<div style="display:flex;gap:8px;margin-top:16px"><button type="button" onclick="document.getElementById(\'opBoatModal\').remove();stateOpBoatAddonsTemp=[];stateOpBoatImagesTemp=[]" style="flex:1;height:44px;border:2px solid #e2e8f0;background:#fff;border-radius:10px;font-weight:600;cursor:pointer">ยกเลิก</button>' +
    '<button type="button" onclick="opSaveBoat()" style="flex:1;height:44px;border:none;background:linear-gradient(135deg,var(--ocean-600),var(--ocean-500));color:#fff;border-radius:10px;font-weight:600;cursor:pointer"><i class="fas fa-check" style="margin-right:6px"></i>บันทึก</button></div></div>';
  var m = document.getElementById('opBoatModal');
  if (m) m.remove();
  var d = document.createElement('div');
  d.id = 'opBoatModal';
  d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto';
  d.innerHTML = html;
  d.onclick = function(e) { if (e.target === d) { d.remove(); stateOpBoatAddonsTemp = []; stateOpBoatImagesTemp = []; } };
  document.body.appendChild(d);
  if (boatId) {
    loadOpBoatImages(boatId);
    loadOpBoatAddons(boatId);
    var imgInp = document.getElementById('opBoatImageInput');
    if (imgInp) imgInp.onchange = function() { opUploadBoatImage(boatId, this.files); this.value = ''; };
  } else {
    opRenderBoatImagesTemp();
    var imgInp = document.getElementById('opBoatImageInput');
    if (imgInp) imgInp.onchange = function() { opAddBoatImagesTemp(this.files); this.value = ''; };
  }
}
function opAddBoatImagesTemp(files) {
  if (!files || files.length === 0) return;
  for (var i = 0; i < files.length; i++) {
    if (stateOpBoatImagesTemp.length >= 8) break;
    stateOpBoatImagesTemp.push({ file: files[i], url: URL.createObjectURL(files[i]) });
  }
  opRenderBoatImagesTemp();
}
function opRemoveBoatImageTemp(idx) {
  if (stateOpBoatImagesTemp[idx] && stateOpBoatImagesTemp[idx].url) URL.revokeObjectURL(stateOpBoatImagesTemp[idx].url);
  stateOpBoatImagesTemp.splice(idx, 1);
  opRenderBoatImagesTemp();
}
function opRenderBoatImagesTemp() {
  var c = document.getElementById('opBoatImagesList');
  var addBtn = document.getElementById('opBoatImageAddBtn');
  if (!c) return;
  c.innerHTML = stateOpBoatImagesTemp.map(function(item, i) {
    return '<div style="position:relative;aspect-ratio:1;border-radius:8px;overflow:hidden;background:#f1f5f9"><img src="' + esc(item.url) + '" alt="" style="width:100%;height:100%;object-fit:cover"><button type="button" onclick="opRemoveBoatImageTemp(' + i + ')" style="position:absolute;top:4px;right:4px;width:24px;height:24px;border:none;background:rgba(239,68,68,.9);color:#fff;border-radius:50%;cursor:pointer;font-size:11px"><i class="fas fa-times"></i></button></div>';
  }).join('');
  if (addBtn) addBtn.style.display = stateOpBoatImagesTemp.length >= 8 ? 'none' : '';
}

async function loadOpBoatImages(boatId) {
  var c = document.getElementById('opBoatImagesList');
  if (!c) return;
  try {
    var r = await apiCall('GET', '/operator/boats/' + boatId + '/images');
    var imgs = (r.data || r) || [];
    c.innerHTML = imgs.map(function(img, i) {
      var url = imgSrc(img.image_url || '');
      return '<div style="position:relative;aspect-ratio:1;border-radius:8px;overflow:hidden;background:#f1f5f9"><img src="' + esc(url) + '" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML=\'<div style=width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#94a3b8><i class=fas fa-image></i></div>\'">' +
        (i === 0 ? '<span style="position:absolute;bottom:4px;left:4px;font-size:10px;background:rgba(0,0,0,.6);color:#fff;padding:2px 6px;border-radius:4px">หลัก</span>' : '') +
        '<button type="button" onclick="opDeleteBoatImage(' + boatId + ',' + img.id + ')" style="position:absolute;top:4px;right:4px;width:24px;height:24px;border:none;background:rgba(239,68,68,.9);color:#fff;border-radius:50%;cursor:pointer;font-size:11px"><i class="fas fa-times"></i></button></div>';
    }).join('');
    var addBtn = document.getElementById('opBoatImageAddBtn');
    if (addBtn) addBtn.style.display = imgs.length >= 8 ? 'none' : '';
  } catch (e) { c.innerHTML = ''; }
}

async function opUploadBoatImage(boatId, files) {
  if (!boatId || !files || files.length === 0) return;
  for (var i = 0; i < files.length; i++) {
    var fd = new FormData();
    fd.append('image', files[i]);
    try {
      var r = await fetch(API + '/operator/boats/' + boatId + '/images', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + state.token },
        body: fd
      });
      var j = r.ok ? await r.json() : {};
      if (j.success !== false) {
        loadOpBoatImages(boatId);
        toast('อัปโหลดรูปสำเร็จ');
      } else toast(j.message || 'อัปโหลดไม่สำเร็จ', 'error');
    } catch (e) { toast('อัปโหลดไม่สำเร็จ', 'error'); }
  }
}

async function opDeleteBoatImage(boatId, imgId) {
  if (!confirm('ลบรูปนี้?')) return;
  try {
    var r = await apiCall('DELETE', '/operator/boats/' + boatId + '/images/' + imgId);
    if (r.success !== false) { loadOpBoatImages(boatId); toast('ลบรูปแล้ว'); }
    else toast(r.message || 'ไม่สำเร็จ', 'error');
  } catch (e) { toast('ไม่สำเร็จ', 'error'); }
}

async function loadOpBoatAddons(boatId) {
  var c = document.getElementById('opBoatAddonsList');
  if (!c) return;
  try {
    var addonsR = await fetch(API + '/operator-data.php?action=addons&token=' + encodeURIComponent(state.token));
    var all = addonsR.ok ? await addonsR.json() : [];
    var list = (all || []).filter(function(a) { return a.boat_id == boatId; });
    if (list.length === 0) {
      c.innerHTML = '<p style="font-size:12px;color:#94a3b8;margin:0">ยังไม่มี Add-on</p>';
    } else {
      c.innerHTML = list.map(function(a) {
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#f8fafc;border-radius:8px;margin-bottom:6px"><span style="font-size:13px">' + esc(a.name_th || a.name_en || '') + ' — ฿' + Number(a.price || 0).toLocaleString() + '</span><button type="button" onclick="opDeleteAddonFromBoatModal(' + a.id + ',' + boatId + ')" style="border:none;background:none;color:#ef4444;cursor:pointer;padding:4px"><i class="fas fa-trash-alt"></i></button></div>';
      }).join('');
    }
  } catch (e) { c.innerHTML = '<p style="font-size:12px;color:#94a3b8;margin:0">โหลดไม่สำเร็จ</p>'; }
}

function opRemoveBoatAddonTemp(idx) {
  stateOpBoatAddonsTemp.splice(idx, 1);
  opRefreshBoatAddonsTemp();
}
function opRefreshBoatAddonsTemp() {
  var list = document.getElementById('opBoatAddonsList');
  if (!list) return;
  list.innerHTML = stateOpBoatAddonsTemp.length === 0 ? '<p style="color:#94a3b8;font-size:12px">ยังไม่มี Add-on — เลือกจากรายการด้านล่างหรือสร้างใหม่</p>' : stateOpBoatAddonsTemp.map(function(a, i) {
    return '<div class="op-boat-addon-temp" data-idx="' + i + '" style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f8fafc;border-radius:8px;margin-bottom:6px"><span style="flex:1;font-size:13px">' + esc(a.name || '') + '</span><span style="font-weight:600;color:var(--ocean-600)">฿' + Number(a.price || 0).toLocaleString() + '</span><button type="button" onclick="opRemoveBoatAddonTemp(' + i + ')" style="border:none;background:#fee2e2;color:#991b1b;padding:4px 8px;border-radius:6px;font-size:11px;cursor:pointer">ลบ</button></div>';
  }).join('');
  var selList = document.getElementById('opBoatAddonSelectList');
  if (selList) selList.querySelectorAll('input[type=checkbox]').forEach(function(cb) {
    var tid = parseInt(cb.dataset.id, 10);
    cb.checked = stateOpBoatAddonsTemp.some(function(a) { return a.template_id == tid; });
  });
}
function opToggleSelectAddonTemplate(el) {
  var id = parseInt(el.dataset.id, 10);
  var name = el.dataset.name || '';
  var price = parseFloat(el.dataset.price) || 0;
  if (el.checked) {
    if (stateOpBoatModalId) {
      apiCall('POST', '/operator/boats/' + stateOpBoatModalId + '/addons', { addon_template_id: id }).then(function(r) {
        if (r.success !== false) { loadOpBoatAddons(stateOpBoatModalId); toast('เพิ่ม Add-on แล้ว'); loadOperatorDashboard(); }
        else toast(r.message || 'ไม่สำเร็จ', 'error');
      }).catch(function() { toast('ไม่สำเร็จ', 'error'); });
    } else {
      stateOpBoatAddonsTemp.push({ template_id: id, name: name, price: price });
      opRefreshBoatAddonsTemp();
    }
  } else {
    if (stateOpBoatModalId) {
      fetch(API + '/operator-data.php?action=addons&token=' + encodeURIComponent(state.token)).then(function(r) { return r.json(); }).then(function(allAddons) {
        var a = (allAddons || []).find(function(x) { return x.boat_id == stateOpBoatModalId && x.addon_template_id == id; });
        if (a) apiCall('DELETE', '/operator/addons/' + a.id).then(function(r) {
          if (r.success !== false) { loadOpBoatAddons(stateOpBoatModalId); toast('ลบ Add-on แล้ว'); loadOperatorDashboard(); }
        });
      });
    } else {
      var idx = stateOpBoatAddonsTemp.findIndex(function(a) { return a.template_id == id; });
      if (idx >= 0) stateOpBoatAddonsTemp.splice(idx, 1);
      opRefreshBoatAddonsTemp();
    }
  }
}
async function opAddBoatAddonInline(boatId) {
  var name = prompt('ชื่อ Add-on (เช่น อาหารว่าง, น้ำดื่ม):');
  if (!name || !name.trim()) return;
  var priceStr = prompt('ราคา (฿):', '0');
  var price = parseFloat(priceStr) || 0;
  try {
    var r = await apiCall('POST', '/operator/addon-templates', { name_th: name.trim(), name_en: name.trim(), price: price });
    var tid = r.data && r.data.id ? r.data.id : r.id;
    if (!tid) { toast(r.message || 'ไม่สำเร็จ', 'error'); return; }
    if (boatId && boatId != '0') {
      var r2 = await apiCall('POST', '/operator/boats/' + boatId + '/addons', { addon_template_id: tid });
      if (r2.success !== false) { loadOpBoatAddons(boatId); toast('สร้างและเพิ่ม Add-on แล้ว'); loadOperatorDashboard(); }
      else toast(r2.message || 'ไม่สำเร็จ', 'error');
    } else {
      stateOpBoatAddonsTemp.push({ template_id: tid, name: name.trim(), price: price });
      opRefreshBoatAddonsTemp();
      toast('สร้าง Add-on แล้ว');
    }
  } catch (e) { toast('ไม่สำเร็จ', 'error'); }
}
async function opDeleteAddonFromBoatModal(addonId, boatId) {
  if (!confirm('ลบ Add-on นี้?')) return;
  try {
    var r = await apiCall('DELETE', '/operator/addons/' + addonId);
    if (r.success !== false) { loadOpBoatAddons(boatId); toast('ลบ Add-on แล้ว'); loadOperatorDashboard(); }
    else toast(r.message || 'ไม่สำเร็จ', 'error');
  } catch (e) { toast('ไม่สำเร็จ', 'error'); }
}

async function opSaveBoat() {
  var name = (document.getElementById('opBoatName') || {}).value.trim();
  var province = (document.getElementById('opBoatProvince') || {}).value;
  var cap = parseInt((document.getElementById('opBoatCap') || {}).value, 10) || 20;
  var hr = parseInt((document.getElementById('opBoatDurHr') || {}).value, 10) || 0;
  var min = parseInt((document.getElementById('opBoatDurMin') || {}).value, 10) || 0;
  var dur = Math.max(1, hr * 60 + min);
  var price = parseFloat((document.getElementById('opBoatPrice') || {}).value) || 0;
  var desc = (document.getElementById('opBoatDesc') || {}).value || '';
  var timeSlots = opGetBoatTimeSlots();
  if (!name) { toast('กรุณากรอกชื่อเรือ/ทัวร์', 'error'); return; }
  if (!province) { toast('กรุณาเลือกพื้นที่ให้บริการ (จังหวัด)', 'error'); return; }
  if (price <= 0) { toast('กรุณากรอกราคา', 'error'); return; }
  var boatType = (document.getElementById('opBoatType') || {}).value || 'longtail';
  var body = { name: name, province: province, boat_type: boatType, capacity: cap, duration: dur, price: price, description: desc, default_time_slots: timeSlots.length > 0 ? timeSlots.sort() : ['09:00', '13:00', '16:00'] };
  try {
    var r;
    var isNew = !stateOpBoatModalId;
    if (stateOpBoatModalId) {
      r = await apiCall('PUT', '/operator/boats/' + stateOpBoatModalId, body);
    } else {
      r = await apiCall('POST', '/operator/boats', body);
    }
    if (r.success !== false) {
      var newId = r.data && r.data.id ? r.data.id : stateOpBoatModalId;
      var hadAddons = isNew && newId && stateOpBoatAddonsTemp.length > 0;
      if (hadAddons) {
        for (var i = 0; i < stateOpBoatAddonsTemp.length; i++) {
          var a = stateOpBoatAddonsTemp[i];
          if (a.template_id) await apiCall('POST', '/operator/boats/' + newId + '/addons', { addon_template_id: a.template_id });
        }
        stateOpBoatAddonsTemp = [];
      }
      var hadImages = isNew && newId && stateOpBoatImagesTemp.length > 0;
      if (hadImages) {
        for (var j = 0; j < stateOpBoatImagesTemp.length; j++) {
          var item = stateOpBoatImagesTemp[j];
          if (item && item.file) {
            var fd = new FormData();
            fd.append('image', item.file);
            try {
              var imgR = await fetch(API + '/operator/boats/' + newId + '/images', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + state.token },
                body: fd
              });
              var imgJ = imgR.ok ? await imgR.json() : {};
              if (imgJ.success === false) toast(imgJ.message || 'อัปโหลดรูปไม่สำเร็จ', 'error');
            } catch (e) { toast('อัปโหลดรูปไม่สำเร็จ', 'error'); }
            if (item.url) URL.revokeObjectURL(item.url);
          }
        }
        stateOpBoatImagesTemp = [];
      }
      document.getElementById('opBoatModal') && document.getElementById('opBoatModal').remove();
      toast(hadAddons || hadImages ? 'บันทึกสำเร็จ' + (hadAddons ? ' พร้อม Add-on' : '') + (hadImages ? ' พร้อมรูปภาพ' : '') : 'บันทึกสำเร็จ');
      loadOperatorDashboard();
      if (typeof loadPartnerContentDiscovery === 'function') loadPartnerContentDiscovery();
      if (isNew && newId && !hadImages) { showOpBoatModal(newId); toast('เพิ่มรูปภาพและ Add-on ได้ด้านล่าง'); }
    } else toast(r.message || 'ไม่สำเร็จ', 'error');
  } catch (e) { toast('ไม่สำเร็จ', 'error'); }
}

var stateOpAddonModalId = null;
var stateOpAddonPreselectBoatId = null;
async function showOpAddonModal(addonId, preselectBoatId) {
  stateOpAddonModalId = addonId || null;
  stateOpAddonPreselectBoatId = preselectBoatId || null;
  var addon = null;
  var boats = [];
  if (addonId) {
    var addonsR = await fetch(API + '/operator-data.php?action=addons&token=' + encodeURIComponent(state.token));
    addon = ((addonsR.ok ? await addonsR.json() : []) || []).find(function(a) { return a.id == addonId; });
  }
  var boatsR = await fetch(API + '/operator-data.php?action=boats&token=' + encodeURIComponent(state.token));
  boats = boatsR.ok ? await boatsR.json() : [];
  if (!Array.isArray(boats)) boats = [];
  var selBoatId = addon ? addon.boat_id : (stateOpAddonPreselectBoatId || null);
  var boatOpts = boats.map(function(b) { return '<option value="' + b.id + '"' + (selBoatId == b.id ? ' selected' : '') + '>' + esc(b.name || '') + '</option>'; }).join('');
  var m = document.getElementById('opAddonModal');
  if (m) m.remove();
  var d = document.createElement('div');
  d.id = 'opAddonModal';
  d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto';
  d.innerHTML = '<div style="background:#fff;border-radius:16px;padding:20px;max-width:400px;width:100%;margin:auto">' +
    '<h3 style="margin-bottom:16px;font-size:16px"><i class="fas fa-plus-circle" style="margin-right:8px;color:#a855f7"></i>' + (addon ? 'แก้ไข Add-on' : 'เพิ่ม Add-on') + '</h3>' +
    '<div style="margin-bottom:12px"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px">เรือ *</label><select id="opAddonBoat" style="width:100%;height:44px;border:2px solid #e2e8f0;border-radius:10px;padding:0 12px"' + (addon || stateOpAddonPreselectBoatId ? ' disabled' : '') + '><option value="">-- เลือกเรือ --</option>' + boatOpts + '</select></div>' +
    '<div style="margin-bottom:12px"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px">ชื่อ Add-on *</label><input type="text" id="opAddonName" value="' + esc(addon ? (addon.name_th || addon.name_en || '') : '') + '" placeholder="เช่น อาหารกลางวัน" style="width:100%;height:44px;border:2px solid #e2e8f0;border-radius:10px;padding:0 12px"></div>' +
    '<div style="margin-bottom:12px"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px">หมายเหตุ/เงื่อนไข (แสดงให้ลูกค้าเห็น)</label><textarea id="opAddonNote" placeholder="เช่น ต้องแจ้งล่วงหน้าอย่างน้อย 1 วัน" style="width:100%;min-height:60px;border:2px solid #e2e8f0;border-radius:10px;padding:10px 12px;resize:vertical">' + esc(addon ? (addon.description_th || addon.description_en || '') : '') + '</textarea></div>' +
    '<div style="margin-bottom:16px"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px">ราคา (฿) *</label><input type="number" id="opAddonPrice" value="' + (addon ? addon.price : 0) + '" min="0" step="0.01" style="width:100%;height:44px;border:2px solid #e2e8f0;border-radius:10px;padding:0 12px"></div>' +
    '<div style="display:flex;gap:8px"><button type="button" onclick="document.getElementById(\'opAddonModal\').remove()" style="flex:1;height:44px;border:2px solid #e2e8f0;background:#fff;border-radius:10px;font-weight:600;cursor:pointer">ยกเลิก</button>' +
    '<button type="button" onclick="opSaveAddon()" style="flex:1;height:44px;border:none;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;border-radius:10px;font-weight:600;cursor:pointer"><i class="fas fa-check" style="margin-right:6px"></i>บันทึก</button></div></div>';
  d.onclick = function(e) { if (e.target === d) d.remove(); };
  document.body.appendChild(d);
}

async function opSaveAddon() {
  var boatSel = document.getElementById('opAddonBoat');
  var boatId = parseInt((boatSel || {}).value, 10) || stateOpAddonPreselectBoatId;
  var name = (document.getElementById('opAddonName') || {}).value.trim();
  var note = (document.getElementById('opAddonNote') || {}).value.trim();
  var price = parseFloat((document.getElementById('opAddonPrice') || {}).value) || 0;
  if (!name) { toast('กรุณากรอกชื่อ Add-on', 'error'); return; }
  try {
    var r;
    if (stateOpAddonModalId) {
      r = await apiCall('PUT', '/operator/addons/' + stateOpAddonModalId, { name_th: name, name_en: name, description_th: note, description_en: note, price: price });
    } else {
      if (!boatId) { toast('กรุณาเลือกเรือ', 'error'); return; }
      r = await apiCall('POST', '/operator/addons', { boat_id: boatId, name_th: name, name_en: name, description_th: note, description_en: note, price: price });
    }
    if (r.success !== false) {
      document.getElementById('opAddonModal') && document.getElementById('opAddonModal').remove();
      toast('บันทึกสำเร็จ');
      loadOperatorDashboard();
      if (stateOpAddonPreselectBoatId && document.getElementById('opBoatAddonsList')) {
        loadOpBoatAddons(stateOpAddonPreselectBoatId);
      }
    } else toast(r.message || 'ไม่สำเร็จ', 'error');
  } catch (e) { toast('ไม่สำเร็จ', 'error'); }
}

function goHome() {
  closeAllPanels();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  var c = document.getElementById('bottomNavCustomer');
  var p = document.getElementById('bottomNavPartner');
  if (c && c.style.display !== 'none') bottomNavSetActive(0);
  else if (p && p.style.display !== 'none') bottomNavSetActivePartner(0);
  if (c && c.style.display !== 'none') {
    loadPromotions();
  }
}

/**
 * ซิงค์แท็บเมนูล่างกับแผงที่เปิดอยู่ — แก้กรณี loadHome/loadCustomerHome รีเซ็ตเป็น "หน้าแรก" ทั้งที่ผู้ใช้เปิดแผงอื่นอยู่
 */
function syncBottomNavForCustomer() {
  var bnC = document.getElementById('bottomNavCustomer');
  if (!bnC || bnC.style.display === 'none') return;
  function isOpen(panelId) {
    var el = document.getElementById(panelId);
    return el && el.classList.contains('open');
  }
  if (isOpen('bookingsPanel') || isOpen('bookingDetailPanel') || isOpen('fullCalendarPanel') || isOpen('bookingCalendarPanel')) {
    bottomNavSetActive(1);
    return;
  }
  if (isOpen('itineraryPanel') || isOpen('itineraryDetailPanel')) {
    bottomNavSetActive(3);
    return;
  }
  if (isOpen('mapPanel')) {
    bottomNavSetActive(4);
    return;
  }
  if (isOpen('toursPanel') || isOpen('tourDetailPanel') || isOpen('bookingPanel')) {
    var tt = state.bottomNavToursTab;
    if (typeof tt !== 'number' || tt < 0) tt = 4;
    bottomNavSetActive(tt);
    return;
  }
  bottomNavSetActive(0);
}

function syncBottomNavForCustomerIfVisible() {
  var bnC = document.getElementById('bottomNavCustomer');
  if (!bnC || bnC.style.display === 'none') return;
  syncBottomNavForCustomer();
}

/** แถบล่างแบบลอย (ลูกค้า) — indicator 5 ช่อง */
var BOTTOM_NAV_CUSTOMER_SLOTS = 5;
function bottomNavSetActive(idx) {
  var ind = document.getElementById('bottomNavPillIndicator');
  if (ind) {
    var maxI = BOTTOM_NAV_CUSTOMER_SLOTS - 1;
    var clamped = Math.max(0, Math.min(maxI, idx));
    ind.style.left = (clamped * (100 / BOTTOM_NAV_CUSTOMER_SLOTS)) + '%';
  }
  var items = document.querySelectorAll('#bottomNavCustomer .nav-item');
  items.forEach(function(el, i) {
    el.classList.toggle('active', i === idx);
  });
}

function bottomNavSetActivePartner(idx) {
  var ind = document.getElementById('bottomNavPillIndicatorPartner');
  if (ind) ind.style.left = (Math.max(0, Math.min(3, idx)) * 25) + '%';
  var items = document.querySelectorAll('#bottomNavPartner .nav-item');
  items.forEach(function(el, i) {
    el.classList.toggle('active', i === idx);
  });
}

function refreshCurrentView() {
  const openPanel = document.querySelector('.slide-panel.open');
  if (!openPanel) {
    loadHome();
    return;
  }
  const id = openPanel.id;
  if (id === 'profilePanel') showProfile();
  else if (id === 'editProfilePanel') showEditProfile();
  else if (id === 'bookingsPanel') loadBookings();
  else if (id === 'bookingDetailPanel' && state.lastBookingDetailId) showBookingDetail(state.lastBookingDetailId);
  else if (id === 'favoritesPanel') loadFavorites();
  else if (id === 'notifPanel') loadNotifications();
  else if (id === 'tourDetailPanel' && state.currentTour) showTourDetail(state.currentTour.id || state.currentTour.boat_id);
  else if (id === 'toursPanel') loadTourListing();
  else if (id === 'bookingPanel' && state.currentTour) { renderBookingStep(state.bookingStep); updateBookingUI(); }
  else if (id === 'mapPanel') loadMap();
  else if (id === 'operatorPanel') loadOperatorDashboard();
  else loadHome();
}

/* ===== Home ===== */

async function loadHome() {
  applyTranslations();
  updateAuthUI();
  const isOp = state.user && (state.user.role === 'operator' || state.user.role === 'admin');
  if (isOp) {
    loadPartnerHome();
  } else {
    loadCustomerHome();
  }
}

function loadCustomerHome() {
  var cust = ['customerSearchBar', 'customerCategories', 'customerSuperApp', 'customerPromo', 'customerRecommended', 'customerNearby', 'customerMap'];
  var partner = ['partnerHeroTagline', 'partnerCategories', 'partnerHomeContent'];
  cust.forEach(function(id) { var e = document.getElementById(id); if (e) e.style.display = ''; });
  partner.forEach(function(id) { var e = document.getElementById(id); if (e) e.style.display = 'none'; });
  var footer = document.getElementById('footerPartnerSection');
  if (footer) footer.style.display = '';
  var bnC = document.getElementById('bottomNavCustomer');
  var bnP = document.getElementById('bottomNavPartner');
  if (bnC) bnC.style.display = 'flex';
  if (bnP) bnP.style.display = 'none';
  syncBottomNavForCustomer();
  loadRecommended();
  loadNearby();
  loadPromotions();
}

async function loadPartnerHome() {
  var cust = ['customerSearchBar', 'customerCategories', 'customerSuperApp', 'customerPromo', 'customerRecommended', 'customerNearby', 'customerMap'];
  var partner = ['partnerHeroTagline', 'partnerCategories', 'partnerHomeContent'];
  cust.forEach(function(id) { var e = document.getElementById(id); if (e) e.style.display = 'none'; });
  partner.forEach(function(id) { var e = document.getElementById(id); if (e) e.style.display = ''; });
  var footer = document.getElementById('footerPartnerSection');
  if (footer) footer.style.display = 'none';
  var bnC = document.getElementById('bottomNavCustomer');
  var bnP = document.getElementById('bottomNavPartner');
  if (bnC) bnC.style.display = 'none';
  if (bnP) bnP.style.display = 'flex';
  bottomNavSetActivePartner(0);
  loadPartnerContentDiscovery();
}

var statePartnerData = null;
var statePartnerCategoryExpand = null;

function scrollToPartnerBookings() {
  expandPartnerCategory(null);
  var el = document.getElementById('partnerRecommended');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollToPartnerBoats() {
  expandPartnerCategory(null);
  var el = document.getElementById('partnerBoats');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function expandPartnerCategory(mode) {
  var expand = document.getElementById('partnerCategoryExpand');
  var content = document.getElementById('partnerCategoryExpandContent');
  var titleEl = document.getElementById('partnerCategoryExpandTitle');
  var items = document.querySelectorAll('#partnerCategories .category-item');
  if (!expand || !content) return;

  if (!mode || mode === statePartnerCategoryExpand) {
    statePartnerCategoryExpand = null;
    expand.style.display = 'none';
    items.forEach(function(i) { i.classList.remove('active'); });
    return;
  }

  statePartnerCategoryExpand = mode;
  items.forEach(function(i) {
    i.classList.toggle('active', (i.dataset.mode || '') === mode);
  });

  var titles = { overview: 'แดชบอร์ด', bookings: 'การจอง', boats: 'เรือ', revenue: 'รายรับ' };
  if (titleEl) titleEl.textContent = titles[mode] || mode;

  content.innerHTML = '<div style="text-align:center;padding:24px"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--ocean-600)"></i></div>';
  expand.style.display = 'block';

  loadPartnerCategoryCards(mode, content);
}

async function loadPartnerCategoryCards(mode, container) {
  if (!container) container = document.getElementById('partnerCategoryExpandContent');
  if (!container) return;
  var fmt = function(n) { return '฿' + Number(n || 0).toLocaleString(); };
  var card = partnerCard;

  try {
    if (mode === 'overview') {
      var data = statePartnerData;
      if (!data) {
        var r = await fetch(API + '/operator-data.php?action=dashboard&token=' + encodeURIComponent(state.token));
        data = r.ok ? await r.json() : {};
        statePartnerData = data;
      }
      var unack = data.unacknowledged_bookings || 0;
      var sections = [
        { icon: 'fa-chart-line', label: 'ภาพรวม', bg: '#dbeafe', color: '#2563eb', onclick: 'openOperatorPanel()', badge: 0 },
        { icon: 'fa-ship', label: 'เรือของฉัน', bg: '#d1fae5', color: '#059669', onclick: 'openOperatorPanel();setOperatorMode(\'boats\')', badge: 0 },
        { icon: 'fa-calendar-check', label: 'การจอง', bg: '#fef3c7', color: '#d97706', onclick: 'openOperatorPanel();setOperatorMode(\'bookings\')', badge: unack },
        { icon: 'fa-plus-circle', label: 'เสริมบริการ', bg: '#f5f3ff', color: '#7c3aed', onclick: 'openOperatorPanel();setOperatorMode(\'addons\')', badge: 0 },
        { icon: 'fa-coins', label: 'รายรับ', bg: '#d1fae5', color: '#059669', onclick: 'openOperatorPanel();setOperatorMode(\'revenue\')', badge: 0 },
        { icon: 'fa-star', label: 'รีวิว', bg: '#fce7f3', color: '#db2777', onclick: 'openFullOperatorDashboard(\'reviews\')', badge: 0 },
        { icon: 'fa-hand-holding-heart', label: 'ทิป', bg: '#fdf4ff', color: '#a855f7', onclick: 'openFullOperatorDashboard(\'tips\')', badge: 0 },
        { icon: 'fa-bell', label: 'การแจ้งเตือน', bg: '#eff6ff', color: '#3b82f6', onclick: 'loadNotifications()', badge: 0 },
        { icon: 'fa-file-alt', label: 'เอกสาร', bg: '#fef3c7', color: '#d97706', onclick: 'openFullOperatorDashboard(\'documents\')', badge: 0 }
      ];
      container.innerHTML = '<div class="partner-dashboard-full">' + sections.map(function(s) {
        var badgeHtml = (s.badge || 0) > 0 ? '<span style="position:absolute;top:4px;right:4px;width:10px;height:10px;background:#ef4444;border-radius:50%;border:2px solid #fff;z-index:2" title="มีการจองใหม่"></span>' : '';
        return '<div class="partner-dashboard-item" onclick="' + s.onclick + '" style="position:relative">' +
          '<div class="pd-icon" style="background:' + s.bg + ';color:' + s.color + ';position:relative">' + badgeHtml + '<i class="fas ' + s.icon + '"></i></div>' +
          '<span class="pd-text">' + esc(s.label) + '</span></div>';
      }).join('') + '</div>';
    } else if (mode === 'revenue') {
      var revR = await fetch(API + '/operator-data.php?action=revenue&token=' + encodeURIComponent(state.token));
      var rev = revR.ok ? await revR.json() : { total: 0, month: 0, pending: 0, items: [] };
      var items = rev.items || [];
      var total = Number(rev.total || 0);
      var month = Number(rev.month || 0);
      var pending = Number(rev.pending || 0);
      var summaryText = month > 0 ? 'เดือนนี้ ' + fmt(month) : 'ยังไม่มีรายรับ';
      var html = '<div class="revenue-stats-wrap">';
      html += '<div class="revenue-hero">';
      html += '<div class="rh-icon"><i class="fas fa-coins"></i></div>';
      html += '<div class="rh-label">รายรับทั้งหมด</div>';
      html += '<div class="rh-value">' + fmt(total) + '</div>';
      html += '<div class="rh-sub">' + summaryText + '</div>';
      html += '</div>';
      html += '<div class="revenue-mini-cards">';
      html += '<div class="revenue-mini"><div class="rm-icon"><i class="fas fa-wallet"></i></div><div class="rm-label">ทั้งหมด</div><div class="rm-value">' + fmt(total) + '</div></div>';
      html += '<div class="revenue-mini"><div class="rm-icon"><i class="fas fa-calendar-alt"></i></div><div class="rm-label">เดือนนี้</div><div class="rm-value">' + fmt(month) + '</div></div>';
      html += '<div class="revenue-mini"><div class="rm-icon"><i class="fas fa-hourglass-half"></i></div><div class="rm-label">รอจ่าย</div><div class="rm-value">' + fmt(pending) + '</div></div>';
      html += '</div>';
      if (items.length > 0) {
        html += '<div class="revenue-list-title"><i class="fas fa-receipt"></i>รายการล่าสุด</div>';
        html += '<div class="revenue-list">';
        items.slice(0, 5).forEach(function(i) {
          html += '<div class="revenue-list-item"><span class="rli-ref">' + esc(i.booking_ref || '-') + '</span><span class="rli-amt">' + fmt(i.total_amount) + '</span></div>';
        });
        html += '</div>';
      }
      html += '<div class="revenue-cta" onclick="openOperatorPanel();setOperatorMode(\'revenue\')"><i class="fas fa-chart-line"></i>ดูรายละเอียดทั้งหมด</div>';
      html += '</div>';
      container.innerHTML = html;
    }
  } catch (e) {
    console.error('loadPartnerCategoryCards error:', e);
    container.innerHTML = '<div style="text-align:center;padding:24px;color:#ef4444;font-size:13px">โหลดข้อมูลไม่สำเร็จ</div>';
  }
}

function partnerCard(img, icon, title, sub, price, onclick) {
  var oc = onclick ? ' onclick="' + onclick + '"' : '';
  var safeUrl = img ? (img + '').replace(/'/g, '%27') : '';
  var imgDiv = safeUrl
    ? '<div class="card-img" style="background:url(\'' + safeUrl + '\') center/cover"></div>'
    : '<div class="card-img"><i class="fas ' + (icon || 'fa-ship') + '"></i></div>';
  return '<div class="partner-discovery-card"' + oc + '>' + imgDiv +
    '<div class="card-body"><div class="card-title">' + esc(title || '') + '</div>' +
    (sub ? '<div class="card-sub">' + esc(sub) + '</div>' : '') +
    (price ? '<div class="card-price">' + esc(price) + '</div>' : '') + '</div></div>';
}

async function loadPartnerContentDiscovery() {
  if (!state.token) {
    var bookings = document.getElementById('partnerBookingsScroll');
    var boats = document.getElementById('partnerBoatsScroll');
    var calCard = document.getElementById('partnerCalendarCard');
    if (bookings) bookings.innerHTML = '<p style="color:#94a3b8;font-size:13px;padding:20px">กรุณาเข้าสู่ระบบ</p>';
    if (boats) boats.innerHTML = '';
    if (calCard) calCard.style.display = 'none';
    return;
  }
  var calCard = document.getElementById('partnerCalendarCard');
  if (calCard) calCard.style.display = '';

  var fmt = function(n) { return '฿' + Number(n || 0).toLocaleString(); };

  try {
    var r = await fetch(API + '/operator-data.php?action=dashboard&token=' + encodeURIComponent(state.token));
    statePartnerData = r.ok ? await r.json() : {};
    if (statePartnerData.error) {
      statePartnerData = {};
    }
    var data = statePartnerData;

    loadPartnerBookings(data);
    loadPartnerBoats(data);
  } catch (e) {
    console.error('loadPartnerContentDiscovery error:', e);
  }
}

async function loadPartnerBookings(data) {
  var c = document.getElementById('partnerBookingsScroll');
  if (!c) return;
  c.innerHTML = '<div style="padding:20px"><i class="fas fa-spinner fa-spin" style="color:var(--ocean-600)"></i></div>';
  var fmt = function(n) { return '฿' + Number(n || 0).toLocaleString(); };
  var fmtDate = function(d) {
    if (!d) return '';
    var parts = d.split('-');
    if (parts.length >= 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
    return d;
  };
  try {
    var bkR = await fetch(API + '/operator-data.php?action=bookings&token=' + encodeURIComponent(state.token));
    var recent = bkR.ok ? await bkR.json() : (data.recent || []);
    if (!Array.isArray(recent)) recent = [];
    var useDemo = recent.length === 0;
    if (useDemo) {
      var today = new Date().toISOString().slice(0, 10);
      var d2 = new Date(); d2.setDate(d2.getDate() + 1);
      var d3 = new Date(); d3.setDate(d3.getDate() + 2);
      var tomorrow = d2.toISOString().slice(0, 10);
      var dayAfter = d3.toISOString().slice(0, 10);
      state.partnerBookingsAreDemo = true;
      recent = [
        { id: 1, _isDemo: true, booking_ref: 'BH-AYT-000001', boat_name: 'Ayutthaya Sunset Longtail', display_name: 'สมชาย ใจดี', customer_phone: '081-234-5678', pickup_location: 'ท่าเรือเจ้าพระยา', pier_name: 'ท่าเรือเจ้าพระยา', booking_date: today, time_slot: '09:00', total_amount: 3000, status: 'confirmed' },
        { id: 2, _isDemo: true, booking_ref: 'BH-AYT-000002', boat_name: 'Grand Temple River Cruise', display_name: 'นภา สวยงาม', customer_phone: '082-345-6789', pickup_location: 'โรงแรมริเวอร์วิว', pier_name: 'ท่าเรือวัดพระศรีสรรเพชญ์', booking_date: today, time_slot: '14:00', total_amount: 10000, status: 'pending' },
        { id: 3, _isDemo: true, booking_ref: 'BH-AYT-000003', boat_name: 'Ayutthaya Sunset Longtail', display_name: 'John Smith', customer_phone: '083-456-7890', pickup_location: '', pier_name: 'ท่าเรือเจ้าพระยา', booking_date: tomorrow, time_slot: '16:00', total_amount: 3000, status: 'confirmed' },
        { id: 4, _isDemo: true, booking_ref: 'BH-AYT-000004', boat_name: 'Grand Temple River Cruise', display_name: 'มณี ใจดี', customer_phone: '084-567-8901', pickup_location: 'ท่าเรือวัดกษัตราธิราช', pier_name: 'ท่าเรือวัดกษัตราธิราช', booking_date: dayAfter, time_slot: '10:00', total_amount: 12500, status: 'pending' }
      ];
    } else {
      state.partnerBookingsAreDemo = false;
    }
    if (recent.length === 0) {
      c.innerHTML = '<div class="op-booking-list-row" onclick="openOperatorPanel();setOperatorMode(\'bookings\')" style="justify-content:center;flex-direction:column;align-items:center;padding:24px">' +
        '<div class="op-bk-icon" style="margin-bottom:8px"><i class="fas fa-calendar-plus"></i></div>' +
        '<p style="color:#64748b;font-size:13px">ยังไม่มีการจอง</p><p style="color:var(--ocean-600);font-size:12px;margin-top:4px">กดเพื่อเปิดแดชบอร์ด</p></div>';
    } else {
      var today = new Date().toISOString().slice(0, 10);
      var byDate = {};
      recent.forEach(function(b) {
        var d = b.booking_date || '';
        if (!byDate[d]) byDate[d] = [];
        byDate[d].push(b);
      });
      var todayBookings = byDate[today] || [];
      var otherDates = Object.keys(byDate).filter(function(d) { return d !== today; }).sort();
      var html = '';
      if (useDemo) html += '<div style="font-size:11px;color:#94a3b8;margin-bottom:8px;padding:6px 10px;background:#f8fafc;border-radius:8px"><i class="fas fa-info-circle" style="margin-right:4px"></i>ตัวอย่างการแสดงผล — เมื่อมีข้อมูลจริงจะแสดงแทน</div>';
      html += '<div class="op-booking-list-date-group" style="background:linear-gradient(135deg,#dbeafe,#e0f2fe);color:var(--ocean-700)"><i class="fas fa-sun" style="margin-right:6px"></i>วันนี้ · ' + fmtDate(today) + ' (' + todayBookings.length + ' รายการ)</div>';
      if (todayBookings.length === 0) {
        html += '<div class="op-booking-list-row" style="padding:16px;color:#94a3b8;font-size:13px" onclick="openOperatorPanel();setOperatorMode(\'bookings\')"><i class="fas fa-calendar-check" style="margin-right:8px;color:var(--ocean-400)"></i>วันนี้ไม่มีงานจอง — กดดูแพลนเนอร์ด้านล่าง</div>';
      } else {
        todayBookings.forEach(function(b) {
          if (b.id) opBookingCache[b.id] = b;
          var cust = b.display_name || b.customer_name || b.guest_name || '-';
          var loc = (b.pickup_location || '').trim() || (b.pier_name_th || b.pier_name || '');
          var statusLabels = { pending:'รอดำเนินการ', confirmed:'รอดำเนินการ', completed:'งานสำเร็จ', rescheduled:'เลื่อนกำหนด', cancelled:'ยกเลิก' };
          var statusColors = { pending:'#eab308', confirmed:'#eab308', completed:'#22c55e', rescheduled:'#ef4444', cancelled:'#94a3b8' };
          var sc = statusColors[b.status] || '#64748b';
          var completeBtn = '';
          if (b.id) {
            var cur = b.status || '';
            var isP = cur === 'pending' || cur === 'confirmed';
            var isC = cur === 'completed';
            var isR = cur === 'rescheduled';
            completeBtn = '<div style="margin-top:6px"><span style="font-size:10px;color:#94a3b8;margin-right:6px">สถานะ:</span><span style="font-size:10px;padding:2px 6px;border-radius:6px;background:' + sc + '22;color:' + sc + ';font-weight:600">' + esc(statusLabels[b.status] || b.status) + '</span></div>' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
        '<button type="button" onclick="event.stopPropagation();opSetBookingStatus(' + b.id + ',\'confirmed\')" style="font-size:11px;padding:6px 10px;border:2px solid ' + (isP ? '#eab308' : '#e2e8f0') + ';border-radius:8px;background:' + (isP ? '#fef9c3' : '#fff') + ';color:' + (isP ? '#a16207' : '#64748b') + ';cursor:pointer;font-weight:600"><i class="fas fa-clock" style="margin-right:4px"></i>รอดำเนินการ</button>' +
        '<button type="button" onclick="event.stopPropagation();opSetBookingStatus(' + b.id + ',\'completed\')" style="font-size:11px;padding:6px 10px;border:2px solid ' + (isC ? '#22c55e' : '#e2e8f0') + ';border-radius:8px;background:' + (isC ? '#dcfce7' : '#fff') + ';color:' + (isC ? '#15803d' : '#64748b') + ';cursor:pointer;font-weight:600"><i class="fas fa-flag-checkered" style="margin-right:4px"></i>งานสำเร็จ</button>' +
        '<button type="button" onclick="event.stopPropagation();opSetBookingStatus(' + b.id + ',\'rescheduled\')" style="font-size:11px;padding:6px 10px;border:2px solid ' + (isR ? '#ef4444' : '#e2e8f0') + ';border-radius:8px;background:' + (isR ? '#fee2e2' : '#fff') + ';color:' + (isR ? '#b91c1c' : '#64748b') + ';cursor:pointer;font-weight:600"><i class="fas fa-calendar-alt" style="margin-right:4px"></i>เลื่อนกำหนด</button></div>';
          }
          var pinClr = b.is_pinned ? '#f59e0b' : '#94a3b8';
          var pinBtn = b.id ? '<button type="button" onclick="event.stopPropagation();opToggleBookingPin(' + b.id + ',' + (b.is_pinned ? 0 : 1) + ',event)" style="border:none;background:none;padding:4px;cursor:pointer;color:' + pinClr + ';flex-shrink:0" title="' + (b.is_pinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด') + '"><i class="fas fa-thumbtack"></i></button>' : '';
          var noteIcon = (b.partner_note || '').trim() ? '<i class="fas fa-sticky-note" style="color:#64748b;font-size:11px" title="มีโน็ต"></i>' : '';
          var notePreview = (b.partner_note || '').trim() ? '<div class="op-note-preview" style="font-size:11px;color:#78716c;margin-top:6px;padding:6px 8px;background:#fefce8;border-radius:6px;border-left:3px solid #f59e0b"><i class="fas fa-sticky-note" style="margin-right:4px;color:#d97706"></i>' + esc((b.partner_note || '').substring(0, 60)) + ((b.partner_note || '').length > 60 ? '...' : '') + '</div>' : '';
          var rowClick = b.id ? 'showOpBookingDetailModalById(' + b.id + ')' : 'openOperatorPanel();setOperatorMode(\'bookings\')';
          var swipeAttrs = b.id ? ' data-op-bid="' + b.id + '" data-op-pinned="' + (b.is_pinned ? 1 : 0) + '"' : '';
          html += '<div class="op-booking-list-row op-swipeable"' + swipeAttrs + ' onclick="' + rowClick + '">' +
            '<div class="op-bk-icon"><i class="fas fa-calendar-check"></i></div>' +
            '<div class="op-bk-body">' +
            '<div class="op-bk-ref" style="display:flex;align-items:center;gap:6px">' + pinBtn + noteIcon + esc(b.booking_ref || '-') + '</div>' +
            '<div class="op-bk-detail">' + esc(b.boat_name || '') + ' · ' + esc(cust) + '</div>' +
            '<div style="font-size:11px;color:#64748b"><i class="fas fa-phone" style="margin-right:4px;font-size:10px"></i>' + esc(b.customer_phone || '-') + (loc ? ' · <i class="fas fa-map-marker-alt" style="margin-right:4px;font-size:10px"></i>' + esc(loc) : '') + '</div>' +
            notePreview +
            '<div class="op-bk-date">' + fmtDate(today) + ' ' + (b.time_slot || '') + '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><div class="op-bk-amount">' + fmt(b.total_amount) + '</div>' + completeBtn + '</div></div></div>';
        });
      }
      otherDates.forEach(function(d) {
        var items = byDate[d] || [];
        html += '<div class="op-booking-list-date-group"><i class="fas fa-calendar-day" style="margin-right:6px"></i>' + fmtDate(d) + ' (' + items.length + ' รายการ)</div>';
        items.forEach(function(b) {
          if (b.id) opBookingCache[b.id] = b;
          var cust = b.display_name || b.customer_name || b.guest_name || '-';
          var loc = (b.pickup_location || '').trim() || (b.pier_name_th || b.pier_name || '');
          var statusLabels = { pending:'รอดำเนินการ', confirmed:'รอดำเนินการ', completed:'งานสำเร็จ', rescheduled:'เลื่อนกำหนด', cancelled:'ยกเลิก' };
          var statusColors = { pending:'#eab308', confirmed:'#eab308', completed:'#22c55e', rescheduled:'#ef4444', cancelled:'#94a3b8' };
          var sc = statusColors[b.status] || '#64748b';
          var completeBtn = '';
          if (b.id) {
            var cur = b.status || '';
            var isP = cur === 'pending' || cur === 'confirmed';
            var isC = cur === 'completed';
            var isR = cur === 'rescheduled';
            completeBtn = '<div style="margin-top:6px"><span style="font-size:10px;color:#94a3b8;margin-right:6px">สถานะ:</span><span style="font-size:10px;padding:2px 6px;border-radius:6px;background:' + sc + '22;color:' + sc + ';font-weight:600">' + esc(statusLabels[b.status] || b.status) + '</span></div>' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
        '<button type="button" onclick="event.stopPropagation();opSetBookingStatus(' + b.id + ',\'confirmed\')" style="font-size:11px;padding:6px 10px;border:2px solid ' + (isP ? '#eab308' : '#e2e8f0') + ';border-radius:8px;background:' + (isP ? '#fef9c3' : '#fff') + ';color:' + (isP ? '#a16207' : '#64748b') + ';cursor:pointer;font-weight:600"><i class="fas fa-clock" style="margin-right:4px"></i>รอดำเนินการ</button>' +
        '<button type="button" onclick="event.stopPropagation();opSetBookingStatus(' + b.id + ',\'completed\')" style="font-size:11px;padding:6px 10px;border:2px solid ' + (isC ? '#22c55e' : '#e2e8f0') + ';border-radius:8px;background:' + (isC ? '#dcfce7' : '#fff') + ';color:' + (isC ? '#15803d' : '#64748b') + ';cursor:pointer;font-weight:600"><i class="fas fa-flag-checkered" style="margin-right:4px"></i>งานสำเร็จ</button>' +
        '<button type="button" onclick="event.stopPropagation();opSetBookingStatus(' + b.id + ',\'rescheduled\')" style="font-size:11px;padding:6px 10px;border:2px solid ' + (isR ? '#ef4444' : '#e2e8f0') + ';border-radius:8px;background:' + (isR ? '#fee2e2' : '#fff') + ';color:' + (isR ? '#b91c1c' : '#64748b') + ';cursor:pointer;font-weight:600"><i class="fas fa-calendar-alt" style="margin-right:4px"></i>เลื่อนกำหนด</button></div>';
          }
          var pinClr = b.is_pinned ? '#f59e0b' : '#94a3b8';
          var pinBtn = b.id ? '<button type="button" onclick="event.stopPropagation();opToggleBookingPin(' + b.id + ',' + (b.is_pinned ? 0 : 1) + ',event)" style="border:none;background:none;padding:4px;cursor:pointer;color:' + pinClr + ';flex-shrink:0" title="' + (b.is_pinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด') + '"><i class="fas fa-thumbtack"></i></button>' : '';
          var noteIcon = (b.partner_note || '').trim() ? '<i class="fas fa-sticky-note" style="color:#64748b;font-size:11px" title="มีโน็ต"></i>' : '';
          var notePreview = (b.partner_note || '').trim() ? '<div class="op-note-preview" style="font-size:11px;color:#78716c;margin-top:6px;padding:6px 8px;background:#fefce8;border-radius:6px;border-left:3px solid #f59e0b"><i class="fas fa-sticky-note" style="margin-right:4px;color:#d97706"></i>' + esc((b.partner_note || '').substring(0, 60)) + ((b.partner_note || '').length > 60 ? '...' : '') + '</div>' : '';
          var rowClick = b.id ? 'showOpBookingDetailModalById(' + b.id + ')' : 'openOperatorPanel();setOperatorMode(\'bookings\')';
          var swipeAttrs = b.id ? ' data-op-bid="' + b.id + '" data-op-pinned="' + (b.is_pinned ? 1 : 0) + '"' : '';
          html += '<div class="op-booking-list-row op-swipeable"' + swipeAttrs + ' onclick="' + rowClick + '">' +
            '<div class="op-bk-icon"><i class="fas fa-calendar-check"></i></div>' +
            '<div class="op-bk-body">' +
            '<div class="op-bk-ref" style="display:flex;align-items:center;gap:6px">' + pinBtn + noteIcon + esc(b.booking_ref || '-') + '</div>' +
            '<div class="op-bk-detail">' + esc(b.boat_name || '') + ' · ' + esc(cust) + '</div>' +
            '<div style="font-size:11px;color:#64748b"><i class="fas fa-phone" style="margin-right:4px;font-size:10px"></i>' + esc(b.customer_phone || '-') + (loc ? ' · <i class="fas fa-map-marker-alt" style="margin-right:4px;font-size:10px"></i>' + esc(loc) : '') + '</div>' +
            notePreview +
            '<div class="op-bk-date">' + fmtDate(d) + ' ' + (b.time_slot || '') + '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><div class="op-bk-amount">' + fmt(b.total_amount) + '</div>' + completeBtn + '</div></div></div>';
        });
      });
      c.innerHTML = html;
    }
  } catch (e) {
    c.innerHTML = '<p style="color:#94a3b8;font-size:13px;padding:20px">โหลดไม่สำเร็จ</p>';
  }
}

async function loadPartnerBoats(data) {
  var c = document.getElementById('partnerBoatsScroll');
  if (!c) return;
  c.innerHTML = '<div style="padding:20px"><i class="fas fa-spinner fa-spin" style="color:var(--ocean-600)"></i></div>';
  var fmt = function(n) { return '฿' + Number(n || 0).toLocaleString(); };
  try {
    var boatsR = await fetch(API + '/operator-data.php?action=boats&token=' + encodeURIComponent(state.token));
    var boats = boatsR.ok ? await boatsR.json() : [];
    if (!Array.isArray(boats)) boats = [];
    if (boats.length === 0) {
      c.innerHTML = '<div class="tour-card" style="display:flex;align-items:center;justify-content:center;min-width:200px" onclick="showOpBoatModal()">' +
        '<div style="text-align:center;padding:24px"><i class="fas fa-ship" style="font-size:32px;color:#94a3b8;margin-bottom:8px"></i><p style="color:#64748b;font-size:13px">ยังไม่มีเรือ</p><p style="color:var(--ocean-600);font-size:12px;margin-top:4px">กดเพื่อเพิ่มเรือ</p></div></div>';
    } else {
      c.innerHTML = boats.map(function(bt) {
        var img = (bt.image || '').startsWith('http') ? bt.image : ((bt.image || '').startsWith('/') ? (window.location.origin || '') + bt.image : '');
        var imgHtml = img
          ? '<div class="tour-card-image" style="position:relative"><img src="' + esc(img) + '" alt=""><div class="partner-boat-actions" style="position:absolute;top:8px;right:8px;display:flex;gap:6px;z-index:5"><button type="button" class="op-crud-btn op-crud-edit" onclick="event.stopPropagation();showOpBoatModal(' + bt.id + ')" title="แก้ไข"><i class="fas fa-pen"></i></button><button type="button" class="op-crud-btn op-crud-del" onclick="event.stopPropagation();opDeleteBoat(' + bt.id + ',' + JSON.stringify(bt.name || '') + ')" title="ปิดขาย"><i class="fas fa-ban"></i></button></div></div>'
          : '<div class="tour-card-image" style="background:linear-gradient(135deg,var(--ocean-500),var(--ocean-600));display:flex;align-items:center;justify-content:center;position:relative"><i class="fas fa-ship" style="font-size:40px;color:rgba(255,255,255,0.9)"></i><div class="partner-boat-actions" style="position:absolute;top:8px;right:8px;display:flex;gap:6px;z-index:5"><button type="button" class="op-crud-btn op-crud-edit" onclick="event.stopPropagation();showOpBoatModal(' + bt.id + ')" title="แก้ไข"><i class="fas fa-pen"></i></button><button type="button" class="op-crud-btn op-crud-del" onclick="event.stopPropagation();opDeleteBoat(' + bt.id + ',' + JSON.stringify(bt.name || '') + ')" title="ปิดขาย"><i class="fas fa-ban"></i></button></div></div>';
        return '<div class="tour-card" onclick="openOperatorPanel();setOperatorMode(\'boats\')" style="min-width:200px;position:relative">' + imgHtml +
          '<div style="padding:12px"><div style="font-weight:600;font-size:14px">' + esc(bt.name || '') + '</div>' +
          '<div style="font-size:12px;color:#64748b;margin-top:2px">' + esc(bt.province_name_th || bt.province || '') + '</div>' +
          '<div style="font-size:13px;font-weight:600;color:var(--ocean-600);margin-top:4px">' + fmt(bt.price) + '</div></div></div>';
      }).join('');
    }
  } catch (e) {
    c.innerHTML = '<p style="color:#94a3b8;font-size:13px;padding:20px">โหลดไม่สำเร็จ</p>';
  }
}

var stateBookingCalendar = { month: 0, year: 0, bookings: [], byDate: {} };
var fullCalendarInstance = null;

function bookingsToFullCalendarEvents(bookings) {
  if (!Array.isArray(bookings)) return [];
  var statusColor = { pending: '#eab308', confirmed: '#eab308', completed: '#22c55e', rescheduled: '#ef4444', cancelled: '#94a3b8', no_show: '#64748b' };
  return bookings.map(function(b) {
    var d = b.booking_date || '';
    var t = (b.time_slot || '09:00').toString();
    if (t.length <= 5) t = t + ':00';
    var startStr = d + 'T' + t;
    var start = new Date(startStr);
    var end = new Date(start.getTime() + 60 * 60 * 1000);
    var title = (b.booking_ref || '') + ' ' + (b.boat_name || '');
    if (!title.trim()) title = 'การจอง #' + (b.id || '');
    return {
      id: String(b.id || ''),
      title: title,
      start: start,
      end: end,
      extendedProps: b,
      backgroundColor: statusColor[b.status] || '#f59e0b',
      borderColor: statusColor[b.status] || '#f59e0b'
    };
  });
}

async function showFullCalendarPanel() {
  if (!state.token) { toast('กรุณาเข้าสู่ระบบ', 'error'); return; }
  var panel = document.getElementById('fullCalendarPanel');
  var container = document.getElementById('fullCalendarContainer');
  if (!panel || !container) return;
  showPanel('fullCalendarPanel');
  container.innerHTML = '<div style="text-align:center;padding:24px"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--ocean-600)"></i></div>';
  try {
    var r = await fetch(API + '/operator-data.php?action=bookings&token=' + encodeURIComponent(state.token));
    var bookings = r.ok ? await r.json() : [];
    if (!Array.isArray(bookings)) bookings = [];
    if (bookings.length === 0) {
      var td = new Date().toISOString().slice(0, 10);
      var d2 = new Date(); d2.setDate(d2.getDate() + 1); var tm = d2.toISOString().slice(0, 10);
      var d3 = new Date(); d3.setDate(d3.getDate() + 2); var da = d3.toISOString().slice(0, 10);
      bookings = [
        { id: 1, booking_ref: 'BH-AYT-000001', boat_name: 'Ayutthaya Sunset Longtail', display_name: 'สมชาย ใจดี', customer_phone: '081-234-5678', pickup_location: 'ท่าเรือเจ้าพระยา', pier_name: 'ท่าเรือเจ้าพระยา', booking_date: td, time_slot: '09:00', total_amount: 3000, status: 'confirmed' },
        { id: 2, booking_ref: 'BH-AYT-000002', boat_name: 'Grand Temple River Cruise', display_name: 'นภา สวยงาม', customer_phone: '082-345-6789', pickup_location: 'โรงแรมริเวอร์วิว', pier_name: 'ท่าเรือวัดพระศรีสรรเพชญ์', booking_date: td, time_slot: '14:00', total_amount: 10000, status: 'pending' },
        { id: 3, booking_ref: 'BH-AYT-000003', boat_name: 'Ayutthaya Sunset Longtail', display_name: 'John Smith', customer_phone: '083-456-7890', pickup_location: '', pier_name: 'ท่าเรือเจ้าพระยา', booking_date: tm, time_slot: '16:00', total_amount: 3000, status: 'confirmed' },
        { id: 4, booking_ref: 'BH-AYT-000004', boat_name: 'Grand Temple River Cruise', display_name: 'มณี ใจดี', customer_phone: '084-567-8901', pickup_location: 'ท่าเรือวัดกษัตราธิราช', pier_name: 'ท่าเรือวัดกษัตราธิราช', booking_date: da, time_slot: '10:00', total_amount: 12500, status: 'pending' }
      ];
    }
    var events = bookingsToFullCalendarEvents(bookings);
    container.innerHTML = '';
    if (typeof FullCalendar === 'undefined') {
      container.innerHTML = '<div style="text-align:center;padding:24px;color:#ef4444">โหลด FullCalendar ไม่สำเร็จ</div>';
      return;
    }
    var calendarEl = document.createElement('div');
    calendarEl.id = 'fullCalendarEl';
    container.appendChild(calendarEl);
    var calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
      events: events,
      buttonText: { today: 'วันนี้', month: 'เดือน', week: 'สัปดาห์', day: 'วัน' },
      height: 'auto',
      eventClick: function(info) {
        var b = info.event.extendedProps || {};
        var loc = (b.pickup_location || '').trim() || (b.pier_name_th || b.pier_name || '-');
        var msg = 'เลขจอง: ' + (b.booking_ref || '-') + '\nเรือ: ' + (b.boat_name || '-') + '\nลูกค้า: ' + (b.display_name || b.customer_name || '-') + '\nเบอร์ติดต่อ: ' + (b.customer_phone || '-') + '\nสถานที่รับ/ส่ง: ' + loc + '\nเวลา: ' + (b.time_slot || '-') + '\nราคา: ฿' + Number(b.total_amount || 0).toLocaleString() + '\nสถานะ: ' + (b.status || '-');
        alert(msg);
      },
      editable: false
    });
    calendar.render();
    fullCalendarInstance = calendar;
  } catch (e) {
    console.error('showFullCalendarPanel error:', e);
    container.innerHTML = '<div style="text-align:center;padding:24px;color:#ef4444">โหลดข้อมูลไม่สำเร็จ</div>';
  }
}

async function showBookingCalendar() {
  if (!state.token) { toast('กรุณาเข้าสู่ระบบ', 'error'); return; }
  var panel = document.getElementById('bookingCalendarPanel');
  var grid = document.getElementById('bookingCalendarGrid');
  var detail = document.getElementById('bookingCalendarDayDetail');
  var monthLabel = document.getElementById('bookingCalendarMonthLabel');
  if (!panel || !grid) return;
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:24px"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--ocean-600)"></i></div>';
  if (detail) detail.innerHTML = '';
  showPanel('bookingCalendarPanel');
  try {
    var r = await fetch(API + '/operator-data.php?action=bookings&token=' + encodeURIComponent(state.token));
    var bookings = r.ok ? await r.json() : [];
    if (!Array.isArray(bookings)) bookings = [];
    if (bookings.length === 0) {
      var td = new Date().toISOString().slice(0, 10);
      var d2 = new Date(); d2.setDate(d2.getDate() + 1); var tm = d2.toISOString().slice(0, 10);
      var d3 = new Date(); d3.setDate(d3.getDate() + 2); var da = d3.toISOString().slice(0, 10);
      bookings = [
        { booking_ref: 'BH-AYT-000001', boat_name: 'Ayutthaya Sunset Longtail', display_name: 'สมชาย ใจดี', customer_phone: '081-234-5678', pickup_location: 'ท่าเรือเจ้าพระยา', pier_name: 'ท่าเรือเจ้าพระยา', booking_date: td, time_slot: '09:00', total_amount: 3000, status: 'confirmed' },
        { booking_ref: 'BH-AYT-000002', boat_name: 'Grand Temple River Cruise', display_name: 'นภา สวยงาม', customer_phone: '082-345-6789', pickup_location: 'โรงแรมริเวอร์วิว', pier_name: 'ท่าเรือวัดพระศรีสรรเพชญ์', booking_date: td, time_slot: '14:00', total_amount: 10000, status: 'pending' },
        { booking_ref: 'BH-AYT-000003', boat_name: 'Ayutthaya Sunset Longtail', display_name: 'John Smith', customer_phone: '083-456-7890', pickup_location: '', pier_name: 'ท่าเรือเจ้าพระยา', booking_date: tm, time_slot: '16:00', total_amount: 3000, status: 'confirmed' },
        { booking_ref: 'BH-AYT-000004', boat_name: 'Grand Temple River Cruise', display_name: 'มณี ใจดี', customer_phone: '084-567-8901', pickup_location: 'ท่าเรือวัดกษัตราธิราช', pier_name: 'ท่าเรือวัดกษัตราธิราช', booking_date: da, time_slot: '10:00', total_amount: 12500, status: 'pending' }
      ];
    }
    var byDate = {};
    bookings.forEach(function(b) { var d = b.booking_date || ''; if (!byDate[d]) byDate[d] = []; byDate[d].push(b); });
    stateBookingCalendar.bookings = bookings;
    stateBookingCalendar.byDate = byDate;
    var now = new Date();
    stateBookingCalendar.month = now.getMonth();
    stateBookingCalendar.year = now.getFullYear();
    renderBookingCalendarGrid();
  } catch (e) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:24px;color:#ef4444">โหลดข้อมูลไม่สำเร็จ</div>';
  }
}

function showBookingCalendarPrevMonth() {
  stateBookingCalendar.month--;
  if (stateBookingCalendar.month < 0) { stateBookingCalendar.month = 11; stateBookingCalendar.year--; }
  renderBookingCalendarGrid();
}

function showBookingCalendarNextMonth() {
  stateBookingCalendar.month++;
  if (stateBookingCalendar.month > 11) { stateBookingCalendar.month = 0; stateBookingCalendar.year++; }
  renderBookingCalendarGrid();
}

function renderBookingCalendarGrid() {
  var grid = document.getElementById('bookingCalendarGrid');
  var detail = document.getElementById('bookingCalendarDayDetail');
  var monthLabel = document.getElementById('bookingCalendarMonthLabel');
  if (!grid) return;
  var m = stateBookingCalendar.month;
  var y = stateBookingCalendar.year;
  var byDate = stateBookingCalendar.byDate || {};
  var monthNames = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  if (monthLabel) monthLabel.textContent = monthNames[m] + ' ' + y;
  var first = new Date(y, m, 1);
  var last = new Date(y, m + 1, 0);
  var startPad = first.getDay();
  var daysInMonth = last.getDate();
  var html = '';
  ['อา','จ','อ','พ','พฤ','ศ','ส'].forEach(function(d) {
    html += '<div style="text-align:center;font-size:10px;font-weight:700;color:#64748b;padding:4px 0">' + d + '</div>';
  });
  for (var i = 0; i < startPad; i++) html += '<div></div>';
  var statusIconMap = { pending: ['fa-clock', '#eab308', '#fef9c3'], confirmed: ['fa-check-circle', '#eab308', '#fef9c3'], completed: ['fa-flag-checkered', '#22c55e', '#dcfce7'], rescheduled: ['fa-calendar-alt', '#ef4444', '#fee2e2'], cancelled: ['fa-times-circle', '#94a3b8', '#f1f5f9'], no_show: ['fa-user-x', '#64748b', '#f1f5f9'] };
  for (var d = 1; d <= daysInMonth; d++) {
    var dateStr = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    var items = byDate[dateStr] || [];
    var today = new Date();
    var isToday = today.getDate() === d && today.getMonth() === m && today.getFullYear() === y;
    var jobIcons = '';
    if (items.length > 0) {
      items.slice(0, 4).forEach(function(b) {
        var si = statusIconMap[b.status] || statusIconMap.pending;
        var title = (b.booking_ref || '') + ' ' + (b.boat_name || '') + ' ' + (b.time_slot || '');
        jobIcons += '<span style="width:22px;height:22px;border-radius:6px;background:' + si[2] + ';color:' + si[1] + ';display:inline-flex;align-items:center;justify-content:center;font-size:10px;margin:1px" title="' + esc(title) + '"><i class="fas ' + si[0] + '"></i></span>';
      });
      if (items.length > 4) jobIcons += '<span style="font-size:9px;color:#64748b;margin-left:2px">+' + (items.length - 4) + '</span>';
    }
    html += '<div onclick="selectBookingCalendarDate(\'' + dateStr + '\')" style="min-height:52px;padding:4px;border-radius:10px;background:' + (isToday ? '#dbeafe' : 'transparent') + ';cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;border:' + (isToday ? '2px solid var(--ocean-500)' : '1px solid #f1f5f9') + '" class="booking-cal-cell">';
    html += '<span style="font-size:12px;font-weight:700;color:#1e293b;margin-bottom:2px">' + d + '</span>';
    if (jobIcons) html += '<div style="display:flex;flex-wrap:wrap;gap:1px;justify-content:center;align-items:center">' + jobIcons + '</div>';
    html += '</div>';
  }
  grid.innerHTML = html;
  if (detail) detail.innerHTML = '<p style="text-align:center;color:#94a3b8;font-size:12px;padding:12px">กดเลือกวันที่เพื่อดูรายการจอง</p>';
}

function selectBookingCalendarDate(dateStr) {
  var detail = document.getElementById('bookingCalendarDayDetail');
  if (!detail) return;
  var byDate = stateBookingCalendar.byDate || {};
  var items = byDate[dateStr] || [];
  var statusIcon = function(s) {
    var m = { pending: ['fa-clock', '#eab308', '#fef9c3'], confirmed: ['fa-check-circle', '#eab308', '#fef9c3'], completed: ['fa-flag-checkered', '#22c55e', '#dcfce7'], cancelled: ['fa-times-circle', '#94a3b8', '#f1f5f9'], no_show: ['fa-user-x', '#64748b', '#f1f5f9'] };
    return m[s] || m.pending;
  };
  var statusLabel = function(s) { var m = { pending: 'รอดำเนินการ', confirmed: 'รอดำเนินการ', completed: 'งานสำเร็จ', rescheduled: 'เลื่อนกำหนด', cancelled: 'ยกเลิก', no_show: 'ไม่มา' }; return m[s] || s || '-'; };
  var fmt = function(n) { return '฿' + Number(n || 0).toLocaleString(); };
  var fmtDate = function(d) { if (!d) return ''; var p = d.split('-'); return p.length >= 3 ? p[2] + '/' + p[1] + '/' + p[0] : d; };
  if (items.length === 0) {
    detail.innerHTML = '<div style="padding:16px;background:#f8fafc;border-radius:12px;text-align:center;color:#64748b;font-size:13px">' + fmtDate(dateStr) + ' — ไม่มีการจอง</div>';
    return;
  }
  var html = '<div style="margin-bottom:8px;font-weight:700;font-size:13px;color:#1e293b"><i class="fas fa-calendar-day" style="color:var(--ocean-600);margin-right:6px"></i>' + fmtDate(dateStr) + ' (' + items.length + ' งาน)</div>';
  items.forEach(function(b) {
    var si = statusIcon(b.status);
    html += '<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:#fff;border-radius:12px;margin-bottom:8px;box-shadow:0 2px 8px rgba(0,0,0,0.06);border:1px solid #f1f5f9" onclick="closePanel(\'bookingCalendarPanel\');openOperatorPanel();setOperatorMode(\'bookings\')">';
    html += '<div style="width:40px;height:40px;border-radius:10px;background:' + si[2] + ';color:' + si[1] + ';display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0" title="' + esc(statusLabel(b.status)) + '"><i class="fas ' + si[0] + '"></i></div>';
    html += '<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13px;color:#1e293b">' + esc(b.booking_ref || '-') + ' <span style="font-size:10px;padding:2px 6px;border-radius:6px;background:' + si[2] + ';color:' + si[1] + ';font-weight:600;margin-left:4px">' + esc(statusLabel(b.status)) + '</span></div>';
    html += '<div style="font-size:12px;color:#64748b;margin-top:2px"><i class="fas fa-ship" style="font-size:10px;margin-right:4px;color:var(--ocean-500)"></i>' + esc(b.boat_name || '') + ' · <i class="far fa-user" style="font-size:10px;margin-right:2px"></i>' + esc(b.display_name || b.customer_name || b.guest_name || '-') + '</div>';
    var loc = (b.pickup_location || '').trim() || (b.pier_name_th || b.pier_name || '');
    html += '<div style="font-size:11px;color:#94a3b8;margin-top:2px"><i class="fas fa-phone" style="margin-right:4px"></i>' + esc(b.customer_phone || '-') + (loc ? ' · <i class="fas fa-map-marker-alt" style="margin-right:4px"></i>' + esc(loc) : '') + '</div>';
    html += '<div style="font-size:11px;color:#94a3b8;margin-top:2px"><i class="far fa-clock" style="margin-right:4px"></i>' + (b.time_slot || '-') + ' · <i class="fas fa-coins" style="margin-right:4px;color:#059669"></i>' + fmt(b.total_amount) + '</div></div>';
    html += '<span style="font-size:10px;padding:4px 8px;border-radius:8px;background:' + si[2] + ';color:' + si[1] + ';font-weight:600"><i class="fas ' + si[0] + '" style="margin-right:2px"></i>' + esc(statusLabel(b.status)) + '</span></div>';
  });
  detail.innerHTML = html;
}

function loadPartnerQuickMenu() {
  var grid = document.getElementById('partnerQuickMenuGrid');
  if (!grid) return;
  var items = [
    { icon: 'fa-chart-pie', label: 'แดชบอร์ด', onclick: 'openOperatorPanel()' },
    { icon: 'fa-calendar-days', label: 'ปฏิทินการจอง', onclick: 'showBookingCalendar()' },
    { icon: 'fa-bell', label: 'การแจ้งเตือน', onclick: 'loadNotifications()' },
    { icon: 'fa-ticket-alt', label: 'จองทริป', onclick: 'showPanel(\'toursPanel\');loadTourListing()' },
    { icon: 'fa-globe', label: 'ภาษา', onclick: 'showLangPicker()' },
    { icon: 'fa-sign-out-alt', label: 'ออกจากระบบ', onclick: 'doLogout()' }
  ];
  grid.innerHTML = items.map(function(it) {
    return '<div class="partner-menu-item" onclick="' + it.onclick + '">' +
      '<div class="partner-menu-icon"><i class="fas ' + it.icon + '"></i></div>' +
      '<span class="partner-menu-text">' + esc(it.label) + '</span></div>';
  }).join('');
}

async function loadRecommended() {
  const c = document.getElementById('recommendedTours');
  if (!c) return;
  c.innerHTML = skeletonCards(4);
  try {
    const r = await apiCall('GET', '/tours/recommended');
    if (r && r.success && Array.isArray(r.data) && r.data.length > 0) {
      c.innerHTML = r.data.map(tour => tourCardHTML(tour)).join('');
    } else if (r && r.success && Array.isArray(r.data) && r.data.length === 0) {
      c.innerHTML = '<p style="color:#94a3b8;font-size:13px;padding:20px;text-align:center">' + (currentLang === 'th' ? 'ยังไม่มีทริปแนะนำ — เพิ่มเรือในแดชบอร์ด Operator' : 'No recommended tours yet') + '</p>';
    } else {
      c.innerHTML = '<p style="color:#94a3b8;font-size:13px;padding:20px;text-align:center">' + esc(r && r.message ? r.message : t('error')) + '</p>';
    }
  } catch (e) {
    c.innerHTML = '<p style="color:#94a3b8;font-size:13px;padding:20px;text-align:center">' + esc(t('error')) + '</p>';
  }
}

async function loadNearby() {
  const c = document.getElementById('nearbyTours');
  if (!c) return;
  c.innerHTML = skeletonList(4);
  try {
    const r = await apiCall('GET', '/tours?limit=4&page=1');
    if (r && r.success && r.data) {
      const tours = Array.isArray(r.data.tours) ? r.data.tours : (Array.isArray(r.data) ? r.data : []);
      if (tours.length > 0) {
        c.innerHTML = tours.map(tour => nearbyCardHTML(tour)).join('');
      } else {
        c.innerHTML = '<p style="color:#94a3b8;font-size:13px;padding:20px;text-align:center">' + (currentLang === 'th' ? 'ยังไม่มีทริป — เพิ่มเรือในแดชบอร์ด Operator' : 'No tours yet') + '</p>';
      }
    } else {
      c.innerHTML = '<p style="color:#94a3b8;font-size:13px;padding:20px;text-align:center">' + esc(r && r.message ? r.message : t('error')) + '</p>';
    }
  } catch (e) {
    c.innerHTML = '<p style="color:#94a3b8;font-size:13px;padding:20px;text-align:center">' + esc(t('error')) + '</p>';
  }
}

async function loadPromotions() {
  const c = document.getElementById('promoScroll');
  if (!c) return;
  const r = await apiCall('GET', '/promotions');
  const list = Array.isArray(r.data) ? r.data.slice(0, 8) : [];
  if (r.success && list.length > 0) {
    c.innerHTML = list.map(p => {
      const hasImg = p.image_url && String(p.image_url).trim();
      const bgFlat = p.gradient_colors || 'linear-gradient(135deg,#023e8a,#00b4d8)';
      const bgStyle = hasImg
        ? ('background-image: linear-gradient(135deg, rgba(15,23,42,0.88), rgba(30,58,138,0.5)), url(' + cssBackgroundImageUrl(imgSrc(p.image_url)) + '); background-size: cover; background-position: center;')
        : ('background: ' + bgFlat + ';');
      const icon = p.icon || 'fa-ticket';
      const title = tField(p, 'title') || p.title || '';
      const desc = p.code
        ? (t('summary_promo') + ': ' + p.code + ' ' + (p.discount_value ? (p.discount_type === 'percentage' ? p.discount_value + '%' : formatPrice(p.discount_value)) : ''))
        : (tField(p, 'description') || '');
      let onclick = '';
      if (p.link_type === 'boat' && p.link_value) onclick = 'onclick="showTourDetail(' + p.link_value + ')"';
      else if (p.link_type === 'destination' && p.link_value) onclick = 'onclick="showPanel(\'toursPanel\');loadTourListing(\'' + esc(p.link_value) + '\')"';
      else if (p.link_type === 'url' && p.link_value) onclick = 'onclick="window.open(\'' + esc(p.link_value) + '\',\'_blank\')"';
      return '<div class="promo-card" style="' + bgStyle + 'cursor:pointer" ' + onclick + '>' +
        '<div class="promo-icon"><i class="fas ' + esc(icon) + '"></i></div>' +
        '<h3>' + esc(title) + '</h3>' +
        '<p>' + esc(desc) + '</p></div>';
    }).join('');
  } else {
    c.innerHTML =
      '<div class="promo-card" style="background:linear-gradient(135deg,#023e8a,#00b4d8)"><div class="promo-icon"><i class="fas fa-ship"></i></div><h3>' + esc(t('section_recommended')) + '</h3><p>' + esc(t('hero_search_placeholder')) + '</p></div>' +
      '<div class="promo-card" style="background:linear-gradient(135deg,#f97316,#fbbf24)"><div class="promo-icon"><i class="fas fa-sun"></i></div><h3>Sunset Cruise</h3><p>' + esc(t('section_promo')) + '</p></div>' +
      '<div class="promo-card" style="background:linear-gradient(135deg,#22c55e,#00b4d8)"><div class="promo-icon"><i class="fas fa-water"></i></div><h3>' + esc(t('cat_popular')) + '</h3><p>' + formatPrice(500) + '</p></div>';
  }
}

/* ===== Tour Cards ===== */

function tourCardHTML(tour) {
  const img = tourImage(tour);
  const tid = boatId(tour);
  const isFav = state.favorites.has(Number(tid));
  const name = boatName(tour);
  const loc = boatLocation(tour);
  const rating = Number(tour.avg_rating || 0).toFixed(1);
  const reviewCount = tour.review_count || 0;
  const cap = tour.capacity || tour.max_passengers || '-';

  return '<div class="tour-card" onclick="showTourDetail(' + tid + ')">' +
    '<div class="tour-card-image">' +
      '<img src="' + img + '" alt="' + esc(name) + '" loading="lazy" onerror="this.style.display=\'none\'">' +
      '<div class="overlay"></div>' +
      '<button class="heart-btn glass-dark ' + (isFav ? 'liked' : '') + '" onclick="event.stopPropagation();toggleFav(' + tid + ',this)"><i class="fas fa-heart"></i></button>' +
    '</div>' +
    '<div class="tour-card-body">' +
      '<div class="tour-card-location"><i class="fas fa-map-pin"></i>' + esc(loc) + '</div>' +
      '<div class="tour-card-name">' + esc(name) + '</div>' +
      '<div class="tour-card-meta"><span><i class="far fa-clock"></i>' + formatDuration(tour.duration) + '</span><span><i class="fas fa-users"></i>' + cap + ' ' + t('detail_capacity') + '</span></div>' +
      '<div class="tour-card-footer">' +
        '<div class="tour-card-price"><span class="current">' + formatPrice(tour.price) + '</span></div>' +
        '<div class="tour-card-rating"><span class="star"><i class="fas fa-star"></i></span> <strong>' + rating + '</strong> <span class="count">(' + reviewCount + ')</span></div>' +
      '</div>' +
    '</div></div>';
}

function nearbyCardHTML(tour) {
  const img = tourImage(tour);
  const tid = boatId(tour);
  const name = boatName(tour);
  const loc = boatLocation(tour);
  const rating = Number(tour.avg_rating || 0).toFixed(1);

  return '<div class="nearby-card" onclick="showTourDetail(' + tid + ')">' +
    '<div class="nearby-card-image"><img src="' + img + '" alt="' + esc(name) + '" loading="lazy" onerror="this.style.display=\'none\'"></div>' +
    '<div class="nearby-card-body">' +
      '<div><div class="tour-card-location"><i class="fas fa-map-pin"></i>' + esc(loc) + '</div>' +
      '<div style="font-size:14px;font-weight:600;margin-top:2px">' + esc(name) + '</div></div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between">' +
        '<span style="font-size:16px;font-weight:700;color:var(--ocean-700)">' + formatPrice(tour.price) + '</span>' +
        '<div class="tour-card-rating"><span class="star"><i class="fas fa-star"></i></span> <strong>' + rating + '</strong></div>' +
      '</div>' +
    '</div></div>';
}

function skeletonCards(n) {
  return Array(n).fill('').map(() =>
    '<div class="tour-card" style="width:240px"><div style="height:150px;background:#e2e8f0;animation:pulse 1.5s infinite"></div><div style="padding:14px"><div style="height:12px;width:60px;background:#e2e8f0;border-radius:4px;margin-bottom:8px;animation:pulse 1.5s infinite"></div><div style="height:14px;width:180px;background:#e2e8f0;border-radius:4px;margin-bottom:12px;animation:pulse 1.5s infinite"></div><div style="height:12px;width:120px;background:#e2e8f0;border-radius:4px;animation:pulse 1.5s infinite"></div></div></div>'
  ).join('');
}

function skeletonList(n) {
  return Array(n).fill('').map(() =>
    '<div class="nearby-card"><div style="width:96px;height:96px;border-radius:12px;background:#e2e8f0;flex-shrink:0;animation:pulse 1.5s infinite"></div><div style="flex:1;padding:4px 0"><div style="height:12px;width:60px;background:#e2e8f0;border-radius:4px;margin-bottom:8px;animation:pulse 1.5s infinite"></div><div style="height:14px;width:160px;background:#e2e8f0;border-radius:4px;margin-bottom:16px;animation:pulse 1.5s infinite"></div><div style="height:16px;width:80px;background:#e2e8f0;border-radius:4px;animation:pulse 1.5s infinite"></div></div></div>'
  ).join('');
}

/* ===== Tour Listing ===== */

async function loadTourFilterChips(selectedValue) {
  const container = document.getElementById('tourFilterChips');
  if (!container) return;
  const sel = String(selectedValue || state.tourFilterProvince || '').trim();
  const selNorm = sel.toLowerCase();
  try {
    const r = await apiCall('GET', '/destinations');
    const list = Array.isArray(r?.data) ? r.data : (r?.data?.destinations || []);
    const seen = {};
    const allLabel = t('filter_all') || 'ทั้งหมด';
    let html = '<span class="filter-chip' + (!sel || sel === 'all' ? ' active' : '') + '" onclick="filterByProvince(\'all\',this)" data-t="filter_all">' + esc(allLabel) + '</span>';
    (list || []).forEach(function(d) {
      const label = (currentLang === 'th' ? (d.name_th || d.province || d.name) : (d.name || d.province || d.name_th)) || '-';
      const value = String(d.province || d.name_th || d.name || '').trim();
      if (!value) return;
      const key = value.toLowerCase();
      if (seen[key]) return;
      seen[key] = value;
      const isActive = sel && sel !== 'all' && (value === sel || key === selNorm);
      html += '<span class="filter-chip' + (isActive ? ' active' : '') + '" data-province="' + esc(value) + '" onclick="filterByProvince(this.getAttribute(\'data-province\'),this)">' + esc(label) + '</span>';
    });
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = '<span class="filter-chip active" onclick="filterByProvince(\'all\',this)" data-t="filter_all">' + esc(t('filter_all') || 'ทั้งหมด') + '</span>';
  }
}

async function loadTourListing(search, filter, boatType) {
  const c = document.getElementById('tourGrid');
  if (!c) return;
  state.tourFilterProvince = (filter && filter !== 'all') ? String(filter).trim() : '';
  state.tourSearchQuery = (search && String(search).trim()) ? String(search).trim() : '';
  if (typeof boatType !== 'undefined') {
    state.tourBoatType = boatType ? String(boatType).trim() : '';
  }
  loadTourFilterChips(state.tourFilterProvince);
  c.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--ocean-600)"></i></div>';
  let url = '/tours?limit=20&page=1';
  if (state.tourSearchQuery) url += '&search=' + encodeURIComponent(state.tourSearchQuery);
  if (state.tourFilterProvince) url += '&province=' + encodeURIComponent(state.tourFilterProvince);
  if (state.tourBoatType) url += '&boat_type=' + encodeURIComponent(state.tourBoatType);
  const r = await apiCall('GET', url);
  if (r.success && r.data) {
    const tours = Array.isArray(r.data) ? r.data : (r.data.tours || []);
    if (tours.length === 0) {
      c.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px">' +
        '<i class="fas fa-ship" style="font-size:48px;color:#e2e8f0;margin-bottom:12px;display:block"></i>' +
        '<p style="font-size:15px;font-weight:600;color:#94a3b8">' + esc(t('no_trips')) + '</p>' +
        '<p style="font-size:13px;color:#cbd5e1;margin-top:4px">' + esc(t('try_other')) + '</p></div>';
    } else {
      c.innerHTML = tours.map(tour => {
        const img = tourImage(tour);
        const tid = boatId(tour);
        return '<div class="tour-card" style="width:100%" onclick="showTourDetail(' + tid + ')">' +
          '<div class="tour-card-image" style="height:120px"><img src="' + img + '" alt="' + esc(boatName(tour)) + '" loading="lazy" onerror="this.style.display=\'none\'"><div class="overlay"></div></div>' +
          '<div class="tour-card-body" style="padding:10px">' +
            '<div class="tour-card-location" style="font-size:11px"><i class="fas fa-map-pin"></i>' + esc(boatLocation(tour)) + '</div>' +
            '<div class="tour-card-name" style="font-size:12px">' + esc(boatName(tour)) + '</div>' +
            '<div class="tour-card-footer"><span style="font-size:14px;font-weight:700;color:var(--ocean-700)">' + formatPrice(tour.price) + '</span>' +
            '<div class="tour-card-rating" style="font-size:11px"><span class="star"><i class="fas fa-star"></i></span> ' + Number(tour.avg_rating || 0).toFixed(1) + '</div></div>' +
          '</div></div>';
      }).join('');
    }
  } else {
    c.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;color:#94a3b8">' + esc(t('error')) + '</p>';
  }
  const searchInput = document.getElementById('tourSearchInput');
  if (searchInput) searchInput.value = state.tourSearchQuery || '';
}

/* ===== Tour Detail ===== */

async function showTourDetail(id) {
  showPanel('tourDetailPanel');
  const content = document.getElementById('tourDetailContent');
  if (!content) return;
  content.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:400px"><i class="fas fa-spinner fa-spin" style="font-size:32px;color:var(--ocean-600)"></i></div>';
  const galleryEl = document.getElementById('detailImageEl');
  if (galleryEl) galleryEl.src = '';

  const r = await apiCall('GET', '/tours/' + id);
  if (!r.success || !r.data) { toast(t('no_data'), 'error'); return; }

  const tour = r.data;
  state.currentTour = tour;
  state.cachedAddons = null;
  state.selectedAddons = [];

  const images = [];
  if (tour.images && tour.images.length > 0) {
    tour.images.forEach(img => images.push(imgSrc(img.image_url || img)));
  }
  if (images.length === 0) images.push(tourImage(tour));
  initImageGallery(images);

  const isFav = state.favorites.has(Number(tour.id));
  const rating = Number(tour.avg_rating || 0);
  const reviewCount = tour.review_count || 0;

  const highlightsRaw = tField(tour, 'highlights') || tour.highlights || '';
  const highlightsList = highlightsRaw
    ? (typeof highlightsRaw === 'string' ? highlightsRaw.split(',').map(s => s.trim()).filter(Boolean) : (Array.isArray(highlightsRaw) ? highlightsRaw : []))
    : [];

  const descText = tField(tour, 'description') || tour.description || '';
  const routeText = tField(tour, 'route') || tour.route || '';
  const cap = tour.capacity || tour.max_passengers || '-';

  let html = '';
  html += '<div style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--ocean-600);margin-bottom:6px"><i class="fas fa-map-pin"></i><span>' + esc(boatLocation(tour)) + '</span></div>';
  html += '<h1 style="font-size:22px;font-weight:700;margin-bottom:8px">' + esc(boatName(tour)) + '</h1>';
  html += '<div style="display:flex;align-items:center;gap:8px;margin-top:8px"><div class="tour-card-rating">' + starsHTML(rating) + ' <span style="font-weight:600;margin-left:4px">' + rating.toFixed(1) + '</span> <span class="count">(' + reviewCount + ' ' + t('detail_reviews_unit') + ')</span></div></div>';
  html += '<div class="tour-info-row">' +
    '<div class="tour-info-item"><i class="far fa-clock"></i><span>' + formatDuration(tour.duration) + '</span></div>' +
    '<div class="tour-info-item"><i class="fas fa-users"></i><span>' + cap + ' ' + t('detail_capacity') + '</span></div>' +
    '<div class="tour-info-item"><i class="fas fa-ship"></i><span>' + esc(tour.boat_type || 'longtail') + '</span></div></div>';

  if (highlightsList.length > 0) {
    html += '<h3 style="font-size:16px;font-weight:600;margin:20px 0 10px">' + t('detail_highlights') + '</h3>';
    html += '<div class="highlight-pills">' + highlightsList.map(h => '<span class="highlight-pill"><i class="fas fa-check" style="margin-right:4px;font-size:10px"></i>' + esc(h) + '</span>').join('') + '</div>';
  }

  if (descText) {
    html += '<p class="tour-description">' + esc(descText) + '</p>';
  }

  if (routeText) {
    html += '<div style="padding:12px;background:var(--ocean-50);border-radius:12px;margin:16px 0">' +
      '<div style="font-size:13px;font-weight:600;margin-bottom:4px"><i class="fas fa-anchor" style="color:var(--ocean-600);margin-right:6px"></i>' + t('detail_route') + '</div>' +
      '<div style="font-size:12px;color:#64748b">' + esc(routeText) + '</div></div>';
  }

  html += '<div id="detailAddonsSection"></div>';

  html += '<h3 style="font-size:16px;font-weight:600;margin:20px 0 12px">' + t('detail_reviews') + '</h3>';
  html += '<div class="reviews-header"><span class="rating-big">' + rating.toFixed(1) + '</span><div><div class="rating-stars">' + starsHTML(rating) + '</div><div class="rating-count">' + t('detail_from_reviews') + ' ' + reviewCount + ' ' + t('detail_reviews_unit') + '</div></div></div>';
  html += '<div id="tourReviews"></div>';
  html += '<div style="height:100px"></div>';

  content.innerHTML = html;

  const favBtn = document.getElementById('detailFavBtn');
  if (favBtn) {
    favBtn.style.color = isFav ? '#ef4444' : '#1e293b';
    favBtn.innerHTML = '<i class="fas fa-heart" style="color:' + (isFav ? '#ef4444' : '#333') + '"></i>';
  }

  const priceEl = document.getElementById('detailPriceValue');
  if (priceEl) priceEl.textContent = formatPrice(tour.price);

  loadTourReviews(id);
  loadDetailAddons(tour.id);
}

function starsHTML(rating) {
  let s = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) s += '<i class="fas fa-star" style="color:#f59e0b"></i>';
    else if (i - 0.5 <= rating) s += '<i class="fas fa-star-half-alt" style="color:#f59e0b"></i>';
    else s += '<i class="fas fa-star" style="color:#e2e8f0"></i>';
  }
  return s;
}

async function loadDetailAddons(boatId) {
  const section = document.getElementById('detailAddonsSection');
  if (!section) return;
  const r = await apiCall('GET', '/addons?boat_id=' + boatId);
  if (r.success && r.data && r.data.length > 0) {
    state.cachedAddons = r.data;
    let html = '<h3 style="font-size:16px;font-weight:600;margin:20px 0 10px">' + t('detail_addons') + '</h3>';
    html += '<div style="display:flex;flex-direction:column;gap:8px">';
    r.data.forEach(addon => {
      const name = tField(addon, 'name') || addon.name || '';
      const icon = addon.icon || 'fa-plus-circle';
      html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--ocean-50);border-radius:10px">' +
        '<i class="fas ' + esc(icon) + '" style="color:var(--ocean-600);font-size:16px;width:24px;text-align:center"></i>' +
        '<div style="flex:1"><div style="font-size:13px;font-weight:600">' + esc(name) + '</div></div>' +
        '<div style="font-size:13px;font-weight:700;color:var(--ocean-700)">+' + formatPrice(addon.price) + '</div></div>';
    });
    html += '</div>';
    section.innerHTML = html;
  }
}

async function loadTourReviews(tourId) {
  const c = document.getElementById('tourReviews');
  if (!c) return;
  const r = await apiCall('GET', '/tours/' + tourId + '/reviews?limit=5');
  if (r.success && r.data) {
    const reviews = r.data.reviews || r.data;
    if (reviews.length === 0) {
      c.innerHTML = '<p style="font-size:13px;color:#94a3b8;padding:16px 0">' + esc(t('detail_no_reviews')) + '</p>';
    } else {
      const colors = ['#6366f1', '#ec4899', '#f97316', '#22c55e', '#06b6d4', '#a855f7'];
      c.innerHTML = reviews.map((rv, i) => {
        let reviewImgs = '';
        if (rv.images && rv.images.length > 0) {
          reviewImgs = '<div style="display:flex;gap:6px;margin-top:8px;overflow-x:auto">' +
            rv.images.map(img => '<img src="' + imgSrc(img.image_url || img) + '" style="width:60px;height:60px;object-fit:cover;border-radius:8px;flex-shrink:0" onerror="this.style.display=\'none\'">').join('') + '</div>';
        }
        return '<div class="review-item">' +
          '<div class="review-user">' +
            '<div class="review-avatar" style="background:' + colors[i % 6] + '">' + (rv.user_name || 'U').charAt(0) + '</div>' +
            '<div><div style="font-size:13px;font-weight:600">' + esc(rv.user_name || '') + '</div>' +
            '<div style="font-size:11px;color:#94a3b8">' + (rv.created_at ? new Date(rv.created_at).toLocaleDateString(currentLang === 'th' ? 'th-TH' : 'en-US') : '') + '</div></div>' +
            '<div style="margin-left:auto;color:#f59e0b;font-size:12px">' + '<i class="fas fa-star"></i>'.repeat(rv.rating || 0) + '</div>' +
          '</div>' +
          '<p class="review-text">' + esc(rv.comment || '') + '</p>' +
          reviewImgs +
        '</div>';
      }).join('');
    }
  }
}

/* ===== Image Gallery ===== */

function initImageGallery(images) {
  state.galleryImages = images;
  state.galleryIndex = 0;

  const container = document.getElementById('detailGalleryInner');
  if (!container) {
    const imgEl = document.getElementById('detailImageEl');
    if (imgEl && images.length > 0) imgEl.src = images[0];
    return;
  }

  if (images.length <= 1) {
    container.innerHTML = '<img src="' + (images[0] || '') + '" style="width:100%;height:240px;object-fit:cover" onerror="this.src=\'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=400&h=300&fit=crop\'">';
    return;
  }

  let html = '<div style="position:relative;width:100%;overflow:hidden">' +
    '<div id="galleryTrack" style="display:flex;transition:transform 0.3s ease;width:100%">';
  images.forEach(src => {
    html += '<div style="min-width:100%;flex-shrink:0"><img src="' + src + '" style="width:100%;height:240px;object-fit:cover" onerror="this.src=\'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=400&h=300&fit=crop\'"></div>';
  });
  html += '</div>';
  html += '<div id="galleryDots" style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:3">';
  images.forEach((_, i) => {
    html += '<div class="gallery-dot" style="width:8px;height:8px;border-radius:50%;background:' + (i === 0 ? '#fff' : 'rgba(255,255,255,0.5)') + ';cursor:pointer;transition:background 0.2s" onclick="goToSlide(' + i + ')"></div>';
  });
  html += '</div></div>';

  container.innerHTML = html;

  const track = document.getElementById('galleryTrack');
  if (track && images.length > 1) {
    track.addEventListener('touchstart', galleryTouchStart, { passive: true });
    track.addEventListener('touchend', galleryTouchEnd, { passive: true });
  }
}

function galleryTouchStart(e) {
  state.galleryStartX = e.touches[0].clientX;
}

function galleryTouchEnd(e) {
  const diff = state.galleryStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 40) {
    if (diff > 0 && state.galleryIndex < state.galleryImages.length - 1) goToSlide(state.galleryIndex + 1);
    else if (diff < 0 && state.galleryIndex > 0) goToSlide(state.galleryIndex - 1);
  }
}

function goToSlide(idx) {
  state.galleryIndex = idx;
  const track = document.getElementById('galleryTrack');
  if (track) track.style.transform = 'translateX(-' + (idx * 100) + '%)';
  const dots = document.querySelectorAll('#galleryDots .gallery-dot');
  dots.forEach((dot, i) => { dot.style.background = i === idx ? '#fff' : 'rgba(255,255,255,0.5)'; });
}

/* ===== Favorites ===== */

async function loadFavoriteIds() {
  if (!isLoggedIn()) return;
  const r = await apiCall('GET', '/favorites');
  if (r.success && r.data) {
    const favs = r.data.favorites || r.data;
    state.favorites = new Set((Array.isArray(favs) ? favs : []).map(f => Number(f.boat_id || f.id)));
    localStorage.setItem('bh_favs', JSON.stringify([...state.favorites]));
  }
}

async function toggleFav(id, btn) {
  if (!requireLogin()) return;
  const numId = Number(id);
  if (state.favorites.has(numId)) {
    state.favorites.delete(numId);
    if (btn) btn.classList.remove('liked');
    await apiCall('DELETE', '/favorites/' + numId);
    toast(t('fav_removed'));
  } else {
    state.favorites.add(numId);
    if (btn) btn.classList.add('liked');
    await apiCall('POST', '/favorites', { boat_id: numId });
    toast(t('fav_added'));
  }
  localStorage.setItem('bh_favs', JSON.stringify([...state.favorites]));
}

async function toggleDetailFav() {
  if (!state.currentTour) return;
  await toggleFav(state.currentTour.id, null);
  const isFav = state.favorites.has(Number(state.currentTour.id));
  const favBtn = document.getElementById('detailFavBtn');
  if (favBtn) favBtn.innerHTML = '<i class="fas fa-heart" style="color:' + (isFav ? '#ef4444' : '#333') + '"></i>';
}

async function loadFavorites() {
  if (!requireLogin()) return;
  closePanel('profilePanel');
  showPanel('favoritesPanel');
  applyTranslations();
  const c = document.getElementById('favoritesContent');
  if (!c) { console.error('favoritesContent not found'); return; }
  c.innerHTML = '<div style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--ocean-600)"></i></div>';
  let r;
  try { r = await apiCall('GET', '/favorites'); } catch(e) { console.error('loadFavorites error:', e); r = { success: false }; }
  const favs = r.success && r.data ? (r.data.favorites || r.data) : [];
  if (Array.isArray(favs) && favs.length > 0) {
    c.innerHTML = favs.map(tour => {
      const img = tourImage(tour);
      const tid = boatId(tour);
      const name = boatName(tour);
      const loc = boatLocation(tour);
      const rating = Number(tour.avg_rating || 0).toFixed(1);
      const reviews = tour.review_count || 0;
      return '<div class="fav-card" onclick="showTourDetail(' + tid + ')">' +
        '<img class="fav-card-img" src="' + img + '" alt="" loading="lazy" onerror="this.src=\'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=200&h=200&fit=crop\'">' +
        '<div class="fav-card-body">' +
          '<div style="font-size:11px;color:#94a3b8"><i class="fas fa-map-pin" style="margin-right:3px"></i>' + esc(loc) + '</div>' +
          '<div style="font-size:14px;font-weight:600;margin-top:2px">' + esc(name) + '</div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-top:4px">' +
            '<span style="font-size:15px;font-weight:700;color:var(--ocean-700)">' + formatPrice(tour.price) + '</span>' +
            '<span style="font-size:11px;color:#f59e0b"><i class="fas fa-star"></i> ' + rating + ' (' + reviews + ')</span>' +
          '</div>' +
        '</div>' +
        '<button class="fav-remove-btn" onclick="event.stopPropagation();removeFavorite(' + tid + ',this)" title="Remove"><i class="fas fa-heart"></i></button>' +
      '</div>';
    }).join('');
  } else {
    c.innerHTML = '<div style="text-align:center;padding:60px 20px">' +
      '<i class="far fa-heart" style="font-size:48px;color:#e2e8f0;display:block;margin-bottom:12px"></i>' +
      '<p style="font-size:15px;font-weight:600;color:#94a3b8">' + esc(t('fav_empty')) + '</p>' +
      '<p style="font-size:13px;color:#cbd5e1;margin-top:6px">' + esc(t('fav_hint')) + '</p></div>';
  }
}

async function removeFavorite(boatId, btn) {
  const r = await apiCall('DELETE', '/favorites/' + boatId);
  if (r.success) {
    state.favorites.delete(Number(boatId));
    toast(t('fav_removed'));
    if (btn) {
      const card = btn.closest('.fav-card');
      if (card) { card.style.transition = 'opacity 0.3s,transform 0.3s'; card.style.opacity = '0'; card.style.transform = 'translateX(60px)'; setTimeout(() => { card.remove(); }, 300); }
    }
  } else {
    toast(r.message || t('error'), 'error');
  }
}

/* ===== Booking Flow (6 steps) ===== */

function startBooking() {
  if (!state.currentTour) return;
  if (!requireLogin()) return;
  state.bookingData = { date: null, time: null, timeLabel: '', passengers: { adult: 1, child: 0, infant: 0 }, promo: null, discount: 0, paymentMethod: 'qr' };
  state.bookingStep = 1;
  state.selectedAddons = [];
  state.cachedAddons = null;
  state.calendarMonth = new Date().getMonth();
  state.calendarYear = new Date().getFullYear();
  showPanel('bookingPanel');
  updateBookingUI();
  renderCalendar();
  applyTranslations();
}

function updateBookingUI() {
  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById('step' + i);
    if (el) el.classList.toggle('active', i === state.bookingStep);
  }
  document.querySelectorAll('#bookingSteps .step-dot').forEach((d, i) => {
    d.className = 'step-dot';
    if (i + 1 === state.bookingStep) d.classList.add('active');
    else if (i + 1 < state.bookingStep) d.classList.add('completed');
  });
  const backBtn = document.getElementById('bookingBackBtn');
  const nextBtn = document.getElementById('bookingNextBtn');
  if (backBtn) backBtn.style.display = state.bookingStep > 1 ? '' : 'none';
  if (nextBtn) {
    if (state.bookingStep === 6) nextBtn.textContent = t('book_pay_btn') + ' ' + formatPrice(calcTotal());
    else if (state.bookingStep === 5) nextBtn.textContent = t('book_confirm');
    else nextBtn.textContent = t('book_next');
  }
  updateBookingSuperSummary();
}

/** แถบสรุป Super App — จองทริป (แสดงตลอดขั้นตอน) */
function updateBookingSuperSummary() {
  const bar = document.getElementById('bookingSuperSummary');
  const pill = document.getElementById('bookingStepPill');
  if (pill) pill.textContent = state.bookingStep + ' / 6';
  if (!bar || !state.currentTour) {
    if (bar) bar.style.display = 'none';
    return;
  }
  bar.style.display = 'flex';
  const tn = document.getElementById('bssTourName');
  if (tn) tn.textContent = boatName(state.currentTour) || '—';
  const bd = state.bookingData;
  const dateLocale = currentLang === 'th' ? 'th-TH' : (currentLang === 'zh' ? 'zh-CN' : (currentLang === 'ko' ? 'ko-KR' : (currentLang === 'fr' ? 'fr-FR' : 'en-US')));
  const dateEl = document.getElementById('bssDate');
  if (dateEl) {
    if (bd && bd.date) {
      try {
        const d = new Date(bd.date + (bd.date.length === 10 ? 'T12:00:00' : ''));
        dateEl.textContent = isNaN(d.getTime()) ? bd.date : d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' });
      } catch (e) {
        dateEl.textContent = bd.date;
      }
    } else dateEl.textContent = '—';
  }
  const px = document.getElementById('bssPax');
  if (px && bd && bd.passengers) {
    const p = bd.passengers;
    const total = (p.adult || 0) + (p.child || 0) + (p.infant || 0);
    px.textContent = total > 0 ? String(total) + ' คน' : '—';
  }
  const timeEl = document.getElementById('bssTime');
  if (timeEl) timeEl.textContent = (bd && bd.time) ? bd.time : '—';
}

function calcTotal() {
  if (!state.currentTour) return 0;
  const p = state.currentTour.price;
  const { adult, child } = state.bookingData.passengers;
  let total = (adult * p) + (child * Math.round(p * 0.6));
  state.selectedAddons.forEach(addon => { total += Number(addon.price || 0) * (addon.quantity || 1); });
  total -= state.bookingData.discount;
  return Math.max(0, total);
}

function bookingNext() {
  const bd = state.bookingData;
  if (state.bookingStep === 1 && !bd.date) return toast(t('book_select_date'), 'error');
  if (state.bookingStep === 2 && !bd.time) return toast(t('book_select_time'), 'error');
  if (state.bookingStep === 3) {
    const totalPax = bd.passengers.adult + bd.passengers.child + bd.passengers.infant;
    if (totalPax < 1) return toast(t('book_min_pax'), 'error');
  }

  if (state.bookingStep === 6) { submitBooking(); return; }

  if (state.bookingStep < 6) {
    state.bookingStep++;
    renderBookingStep();
  }
}

function bookingBack() {
  if (state.bookingStep > 1) {
    state.bookingStep--;
    renderBookingStep();
  }
}

function renderBookingStep() {
  updateBookingUI();
  applyTranslations();
  if (state.bookingStep === 1) renderCalendar();
  if (state.bookingStep === 2) loadTimeSlots();
  if (state.bookingStep === 3) updatePassengerUI();
  if (state.bookingStep === 4) renderAddonsStep();
  if (state.bookingStep === 5) updateSummary();
  if (state.bookingStep === 6) renderPaymentStep();
}

/* ===== Calendar ===== */

function renderCalendar() {
  const m = state.calendarMonth;
  const y = state.calendarYear;
  const months = t('cal_months');
  const weekdays = t('cal_weekdays');

  const labelEl = document.getElementById('calMonthLabel');
  if (labelEl) labelEl.textContent = (Array.isArray(months) ? months[m] : '') + ' ' + (currentLang === 'th' ? (y + 543) : y);

  const weekdaysEl = document.getElementById('calWeekdays');
  if (weekdaysEl && Array.isArray(weekdays)) {
    weekdaysEl.innerHTML = weekdays.map(d => '<div class="calendar-weekday">' + d + '</div>').join('');
  }

  const firstDay = new Date(y, m, 1).getDay();
  const totalDays = new Date(y, m + 1, 0).getDate();
  const today = new Date();
  let html = '';
  for (let i = 0; i < firstDay; i++) html += '<div class="calendar-day disabled"></div>';
  for (let d = 1; d <= totalDays; d++) {
    const dt = new Date(y, m, d);
    const isPast = dt < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isToday = d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
    const dateStr = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const isSel = state.bookingData.date === dateStr;
    html += '<button class="calendar-day' + (isPast ? ' disabled' : '') + (isToday ? ' today' : '') + (isSel ? ' selected' : '') + '"' + (isPast ? ' disabled' : '') + ' onclick="selectDate(\'' + dateStr + '\',this)">' + d + '</button>';
  }
  const daysEl = document.getElementById('calendarDays');
  if (daysEl) daysEl.innerHTML = html;
}

function prevMonth() {
  state.calendarMonth--;
  if (state.calendarMonth < 0) { state.calendarMonth = 11; state.calendarYear--; }
  renderCalendar();
}

function nextMonth() {
  state.calendarMonth++;
  if (state.calendarMonth > 11) { state.calendarMonth = 0; state.calendarYear++; }
  renderCalendar();
}

function selectDate(dateStr, el) {
  state.bookingData.date = dateStr;
  document.querySelectorAll('.calendar-day.selected').forEach(d => d.classList.remove('selected'));
  if (el) el.classList.add('selected');
  updateBookingSuperSummary();
}

/* ===== Time Slots ===== */

async function loadTimeSlots() {
  const c = document.getElementById('timeSlotsContainer');
  if (!c) return;
  c.innerHTML = '<div style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--ocean-600)"></i></div>';
  const tid = state.currentTour.id;
  const date = state.bookingData.date;
  const r = await apiCall('GET', '/tours/' + tid + '/schedules?date=' + date);
  let schedules = r.success && r.data ? (r.data.schedules || r.data) : [];
  if (!Array.isArray(schedules)) schedules = [];

  if (schedules.length === 0) {
    const tour = state.currentTour;
    const cap = tour.capacity || 20;
    let defSlots = ['09:00', '13:00', '16:00'];
    if (tour.default_time_slots) {
      try {
        const parsed = typeof tour.default_time_slots === 'string' ? JSON.parse(tour.default_time_slots) : tour.default_time_slots;
        if (Array.isArray(parsed) && parsed.length > 0) defSlots = parsed;
      } catch (e) {}
    }
    schedules = defSlots.map(s => ({ time_slot: s, remaining_seats: cap, is_available: 1 }));
  }

  function getSlotMeta(timeStr) {
    const h = parseInt(timeStr.split(':')[0], 10);
    if (h < 10) return { bg: '#fef3c7', color: '#f59e0b', icon: 'fa-sun', labelKey: 'time_morning' };
    if (h < 14) return { bg: '#dbeafe', color: '#3b82f6', icon: 'fa-cloud-sun', labelKey: 'time_afternoon' };
    if (h < 17) return { bg: '#fce7f3', color: '#ec4899', icon: 'fa-sun-plant-wilt', labelKey: 'time_sunset' };
    return { bg: '#ede9fe', color: '#8b5cf6', icon: 'fa-moon', labelKey: 'time_evening' };
  }

  c.innerHTML = schedules.map(s => {
    const meta = getSlotMeta(s.time_slot);
    const seats = s.remaining_seats !== undefined ? s.remaining_seats : (s.max_seats ? s.max_seats - (s.booked_seats || 0) : 20);
    const full = seats <= 0;
    const label = s.label || t(meta.labelKey);
    const seatsText = full ? t('time_full') : t('time_seats_left', { n: seats });
    const isSel = state.bookingData.time === s.time_slot;
    return '<div class="time-slot' + (isSel ? ' selected' : '') + '" style="' + (full ? 'opacity:0.5;pointer-events:none' : '') + '" onclick="selectTime(\'' + s.time_slot + '\',\'' + esc(label) + '\',this)">' +
      '<div class="time-slot-icon" style="background:' + meta.bg + ';color:' + meta.color + '"><i class="fas ' + meta.icon + '"></i></div>' +
      '<div class="time-slot-info"><div class="time-slot-time">' + s.time_slot + '</div><div class="time-slot-label">' + esc(label) + '</div></div>' +
      '<div class="time-slot-seats">' + seatsText + '</div>' +
      '<div class="time-slot-check"><i class="fas fa-check"></i></div></div>';
  }).join('');
}

function selectTime(time, label, el) {
  state.bookingData.time = time;
  state.bookingData.timeLabel = label;
  document.querySelectorAll('.time-slot.selected').forEach(s => s.classList.remove('selected'));
  if (el) el.classList.add('selected');
  updateBookingSuperSummary();
}

/* ===== Passengers ===== */

function updatePassengerUI() {
  const p = state.bookingData.passengers;
  const tour = state.currentTour;

  const adultLabel = document.getElementById('adultLabel');
  const childLabel = document.getElementById('childLabel');
  const infantLabel = document.getElementById('infantLabel');
  const adultDesc = document.getElementById('adultDesc');
  const childDesc = document.getElementById('childDesc');
  const infantDesc = document.getElementById('infantDesc');

  if (adultLabel) adultLabel.textContent = t('pax_adult');
  if (childLabel) childLabel.textContent = t('pax_child');
  if (infantLabel) infantLabel.textContent = t('pax_infant');
  if (adultDesc) adultDesc.textContent = t('pax_adult_desc');
  if (childDesc) childDesc.textContent = t('pax_child_desc');
  if (infantDesc) infantDesc.textContent = t('pax_infant_desc');

  const adultCount = document.getElementById('adultCount');
  const childCount = document.getElementById('childCount');
  const infantCount = document.getElementById('infantCount');
  if (adultCount) adultCount.textContent = p.adult;
  if (childCount) childCount.textContent = p.child;
  if (infantCount) infantCount.textContent = p.infant;

  const adultMinus = document.getElementById('adultMinus');
  const childMinus = document.getElementById('childMinus');
  const infantMinus = document.getElementById('infantMinus');
  if (adultMinus) adultMinus.disabled = p.adult <= 1;
  if (childMinus) childMinus.disabled = p.child <= 0;
  if (infantMinus) infantMinus.disabled = p.infant <= 0;

  if (tour) {
    const adultPrice = document.getElementById('adultPrice');
    const childPrice = document.getElementById('childPrice');
    const infantPrice = document.getElementById('infantPrice');
    if (adultPrice) adultPrice.textContent = formatPrice(tour.price) + t('pax_per_person');
    if (childPrice) childPrice.textContent = formatPrice(Math.round(tour.price * 0.6)) + t('pax_per_person');
    if (infantPrice) infantPrice.textContent = t('free');
  }
  updateBookingSuperSummary();
}

function updatePassenger(type, delta) {
  const p = state.bookingData.passengers;
  p[type] = Math.max(type === 'adult' ? 1 : 0, Math.min(20, p[type] + delta));
  updatePassengerUI();
}

/* ===== Add-ons Step ===== */

async function renderAddonsStep() {
  const c = document.getElementById('addonsContainer') || document.getElementById('step4');
  if (!c) return;

  if (!state.cachedAddons) {
    c.innerHTML = '<div style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--ocean-600)"></i></div>';
    const r = await apiCall('GET', '/addons?boat_id=' + state.currentTour.id);
    state.cachedAddons = (r.success && r.data) ? r.data : [];
  }

  if (state.cachedAddons.length === 0) {
    const inner = c.querySelector('.addons-list') || c;
    inner.innerHTML = '<p style="text-align:center;padding:30px;color:#94a3b8;font-size:13px">' + esc(t('no_data')) + '</p>';
    return;
  }

  const target = c.querySelector('.addons-list') || c;
  let html = '';
  state.cachedAddons.forEach((addon, idx) => {
    const name = tField(addon, 'name') || addon.name || '';
    const note = addon.description_th || addon.description_en || '';
    const icon = addon.icon || 'fa-plus-circle';
    const sel = state.selectedAddons.find(a => a.id === addon.id);
    const checked = !!sel;
    const qty = sel ? (sel.quantity || 1) : 1;
    html += '<div class="addon-item" style="display:flex;align-items:center;gap:10px;padding:14px;background:' + (checked ? 'var(--ocean-50)' : '#fff') + ';border:2px solid ' + (checked ? 'var(--ocean-600)' : '#e2e8f0') + ';border-radius:12px;transition:all 0.2s">' +
      '<label style="flex:1;cursor:pointer;display:flex;align-items:flex-start;gap:10px" onclick="toggleAddon(' + idx + ',this)">' +
      '<i class="fas ' + esc(icon) + '" style="color:var(--ocean-600);font-size:18px;width:28px;text-align:center;margin-top:2px"></i>' +
      '<div><div style="font-size:14px;font-weight:600">' + esc(name) + '</div>' +
      (note ? '<div style="font-size:12px;color:#64748b;margin-top:4px">' + esc(note) + '</div>' : '') + '</div>' +
      '<div style="font-size:14px;font-weight:700;color:var(--ocean-700)">+' + formatPrice(addon.price) + '</div>' +
      '<div style="width:22px;height:22px;flex-shrink:0;border-radius:6px;border:2px solid ' + (checked ? 'var(--ocean-600)' : '#cbd5e1') + ';background:' + (checked ? 'var(--ocean-600)' : '#fff') + ';display:flex;align-items:center;justify-content:center">' +
        (checked ? '<i class="fas fa-check" style="color:#fff;font-size:11px"></i>' : '') +
      '</div></label>';
    if (checked) {
      html += '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0" onclick="event.stopPropagation()">' +
        '<button type="button" onclick="changeAddonQty(' + idx + ',-1)" style="width:32px;height:32px;border:2px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;font-size:16px;line-height:1">−</button>' +
        '<input type="number" id="addonQty' + idx + '" value="' + qty + '" min="1" max="99" style="width:48px;height:32px;border:2px solid #e2e8f0;border-radius:8px;text-align:center;font-size:14px" onchange="setAddonQty(' + idx + ',this.value)">' +
        '<button type="button" onclick="changeAddonQty(' + idx + ',1)" style="width:32px;height:32px;border:2px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;font-size:16px;line-height:1">+</button>' +
        '</div>';
    }
    html += '</div>';
  });
  target.innerHTML = html;
}

function toggleAddon(idx) {
  const addon = state.cachedAddons[idx];
  if (!addon) return;
  const exists = state.selectedAddons.findIndex(a => a.id === addon.id);
  if (exists >= 0) state.selectedAddons.splice(exists, 1);
  else state.selectedAddons.push({ ...addon, quantity: 1 });
  renderAddonsStep();
}

function changeAddonQty(idx, delta) {
  const addon = state.cachedAddons[idx];
  if (!addon) return;
  const sel = state.selectedAddons.find(a => a.id === addon.id);
  if (!sel) return;
  const q = Math.max(1, Math.min(99, (sel.quantity || 1) + delta));
  sel.quantity = q;
  const inp = document.getElementById('addonQty' + idx);
  if (inp) inp.value = q;
  updateSummary();
  updateBookingUI();
}

function setAddonQty(idx, val) {
  const addon = state.cachedAddons[idx];
  if (!addon) return;
  const sel = state.selectedAddons.find(a => a.id === addon.id);
  if (!sel) return;
  const q = Math.max(1, Math.min(99, parseInt(val, 10) || 1));
  sel.quantity = q;
  renderAddonsStep();
}

/* ===== Summary ===== */

function updateSummary() {
  const tour = state.currentTour;
  const bd = state.bookingData;
  if (!tour) return;

  const d = new Date(bd.date);
  const dateLocale = currentLang === 'th' ? 'th-TH' : (currentLang === 'zh' ? 'zh-CN' : (currentLang === 'ko' ? 'ko-KR' : (currentLang === 'fr' ? 'fr-FR' : 'en-US')));
  const dateStr = d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' });

  const nameEl = document.getElementById('summaryTourName');
  const imgEl = document.getElementById('summaryImg');
  const dateEl = document.getElementById('summaryDate');
  const timeEl = document.getElementById('summaryTime');
  const paxEl = document.getElementById('summaryPassengers');
  const pierEl = document.getElementById('summaryPier');

  if (nameEl) nameEl.textContent = boatName(tour);
  if (imgEl) imgEl.src = tourImage(tour);
  if (dateEl) dateEl.textContent = dateStr;
  if (timeEl) timeEl.textContent = bd.time;
  if (paxEl) {
    let paxText = t('pax_adult') + ' ' + bd.passengers.adult;
    if (bd.passengers.child > 0) paxText += ', ' + t('pax_child') + ' ' + bd.passengers.child;
    if (bd.passengers.infant > 0) paxText += ', ' + t('pax_infant') + ' ' + bd.passengers.infant;
    paxEl.textContent = paxText;
  }
  if (pierEl) {
    const pierName = tField(tour, 'pier_name') || tour.pier_name || '';
    const pierLat = tour.pier_latitude;
    const pierLng = tour.pier_longitude;
    if (pierName) {
      let pierHtml = '<span style="font-weight:600">' + esc(pierName) + '</span>';
      if (pierLat && pierLng) {
        pierHtml += ' <a href="https://maps.google.com/?q=' + pierLat + ',' + pierLng + '" target="_blank" style="color:var(--ocean-600);font-size:12px;text-decoration:none"><i class="fas fa-location-dot"></i> GPS</a>';
      }
      pierEl.innerHTML = pierHtml;
    } else {
      pierEl.textContent = boatLocation(tour) || '-';
    }
  }

  const gpsNoteEl = document.getElementById('summaryGpsNote');
  if (gpsNoteEl) gpsNoteEl.textContent = t('summary_gps_note');

  const routeEl = document.getElementById('summaryRoute');
  if (routeEl) routeEl.textContent = tField(tour, 'route') || tour.route || '-';

  const adultTotal = bd.passengers.adult * tour.price;
  const childTotal = bd.passengers.child * Math.round(tour.price * 0.6);
  let breakdown = '<div class="summary-row"><span class="label">' + t('pax_adult') + ' × ' + bd.passengers.adult + '</span><span class="value">' + formatPrice(adultTotal) + '</span></div>';
  if (bd.passengers.child > 0) {
    breakdown += '<div class="summary-row"><span class="label">' + t('pax_child') + ' × ' + bd.passengers.child + '</span><span class="value">' + formatPrice(childTotal) + '</span></div>';
  }
  if (state.selectedAddons.length > 0) {
    breakdown += '<div class="summary-row" style="margin-top:8px;padding-top:8px;border-top:1px dashed #e2e8f0"><span class="label" style="font-weight:600">' + t('summary_addons') + '</span><span></span></div>';
    state.selectedAddons.forEach(addon => {
      const name = tField(addon, 'name') || addon.name || '';
      const qty = addon.quantity || 1;
      const sub = Number(addon.price || 0) * qty;
      breakdown += '<div class="summary-row"><span class="label" style="padding-left:8px">• ' + esc(name) + (qty > 1 ? ' × ' + qty : '') + '</span><span class="value">+' + formatPrice(sub) + '</span></div>';
    });
  }
  if (bd.discount > 0) {
    breakdown += '<div class="summary-row" style="color:var(--ocean-600)"><span class="label"><i class="fas fa-tag" style="margin-right:4px"></i>' + t('summary_discount') + '</span><span class="value">-' + formatPrice(bd.discount) + '</span></div>';
  }

  const breakdownEl = document.getElementById('summaryBreakdown');
  if (breakdownEl) breakdownEl.innerHTML = breakdown;
  const totalEl = document.getElementById('summaryTotal');
  if (totalEl) totalEl.textContent = formatPrice(calcTotal());
  var pickupInp = document.getElementById('pickupLocationInput');
  if (pickupInp) { pickupInp.value = bd.pickup_location || ''; pickupInp.placeholder = t('summary_pickup_placeholder') || ''; }
  updateBookingUI();
}

async function validatePromo() {
  const input = document.getElementById('promoInput');
  if (!input) return;
  const code = input.value.trim();
  if (!code) return;
  const amount = calcTotal() + state.bookingData.discount;
  const r = await apiCall('POST', '/promotions/validate', { code, amount });
  if (r.success && r.data && r.data.valid) {
    state.bookingData.promo = code;
    state.bookingData.discount = r.data.discount_amount || 0;
    toast(t('summary_promo') + ': ' + code + ' -' + formatPrice(state.bookingData.discount));
    updateSummary();
  } else {
    toast(r.message || t('error'), 'error');
  }
}

function selectPayment(el) {
  document.querySelectorAll('.payment-method.selected').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  state.bookingData.paymentMethod = el.dataset.method || 'qr';
  updatePaymentTotalDisplay();
}

async function renderPaymentStep() {
  updatePaymentTotalDisplay();
  const c = document.getElementById('paymentMethodsContainer');
  if (!c) return;

  c.innerHTML = '<div style="text-align:center;padding:20px"><i class="fas fa-spinner fa-spin" style="font-size:20px;color:var(--ocean-600)"></i></div>';

  const r = await apiCall('GET', '/settings/payment-methods');
  const methods = (r.success && r.data) ? r.data : { qr: { enabled: true } };

  const icons = {
    qr:   { icon: 'fa-qrcode', bg: '#f0fdf4', color: '#22c55e' },
    cod:  { icon: 'fa-money-bill-wave', bg: '#fefce8', color: '#eab308' },
    card: { icon: 'fa-credit-card', bg: '#ede9fe', color: '#8b5cf6' }
  };
  const descKeys = { qr: 'pay_qr_desc', cod: 'pay_cod_desc', card: 'pay_card_desc' };
  const labelKeys = { qr: 'pay_qr', cod: 'pay_cod', card: 'pay_card' };

  let html = '';
  let first = true;
  for (const [key, cfg] of Object.entries(methods)) {
    if (!cfg.enabled) continue;
    const ic = icons[key] || icons.qr;
    const label = (currentLang === 'th' ? cfg.label_th : cfg.label_en) || t(labelKeys[key] || 'pay_qr');
    const desc = t(descKeys[key] || 'pay_qr_desc');
    const selected = first ? ' selected' : '';
    if (first) { state.bookingData.paymentMethod = key; first = false; }
    html += '<div class="payment-method' + selected + '" data-method="' + key + '" onclick="selectPayment(this)">' +
      '<div class="payment-icon" style="background:' + ic.bg + ';color:' + ic.color + '"><i class="fas ' + ic.icon + '"></i></div>' +
      '<div class="payment-info"><h4>' + esc(label) + '</h4><p>' + esc(desc) + '</p></div>' +
      '<div class="payment-check"><i class="fas fa-check-circle"></i></div></div>';
  }
  if (!html) {
    html = '<div class="payment-method selected" data-method="qr" onclick="selectPayment(this)">' +
      '<div class="payment-icon" style="background:#f0fdf4;color:#22c55e"><i class="fas fa-qrcode"></i></div>' +
      '<div class="payment-info"><h4>' + t('pay_qr') + '</h4><p>' + t('pay_qr_desc') + '</p></div>' +
      '<div class="payment-check"><i class="fas fa-check-circle"></i></div></div>';
    state.bookingData.paymentMethod = 'qr';
  }
  c.innerHTML = html;
}

function updatePaymentTotalDisplay() {
  const total = calcTotal();
  const el = document.getElementById('paymentTotalAmount');
  if (el) el.textContent = formatPrice(total);
}

async function submitBooking() {
  if (!requireLogin()) return;
  const tour = state.currentTour;
  const bd = state.bookingData;
  if (!tour) return;
  const btn = document.getElementById('bookingNextBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px"></i>' + t('loading'); }

  const totalPax = bd.passengers.adult + bd.passengers.child;
  if (totalPax < 1) {
    if (btn) { btn.disabled = false; btn.textContent = t('book_pay_btn') + ' ' + formatPrice(calcTotal()); }
    return toast(t('book_min_pax'), 'error');
  }
  const addons = state.selectedAddons.map(a => ({ id: a.id, quantity: a.quantity || 1 }));

  const user = state.user || {};
  const customerName = user.name || user.full_name || '';
  const customerEmail = user.email || '';
  const customerPhone = user.phone || '';

  if (!customerName || !customerEmail) {
    if (btn) { btn.disabled = false; btn.textContent = t('book_pay_btn') + ' ' + formatPrice(calcTotal()); }
    return toast(t('book_fill_contact'), 'error');
  }

  const bookRes = await apiCall('POST', '/bookings', {
    boat_id: tour.id,
    booking_date: bd.date,
    time_slot: bd.time,
    passengers: totalPax,
    addons: addons,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    pickup_location: (bd.pickup_location || '').trim() || null,
    special_request: ''
  });

  if (!bookRes.success) {
    if (btn) { btn.disabled = false; btn.textContent = t('book_pay_btn') + ' ' + formatPrice(calcTotal()); }
    toast(bookRes.message || t('error'), 'error');
    return;
  }

  const booking = bookRes.data;
  const bookingId = booking.booking_id || booking.id;
  const bookingRef = booking.booking_ref || ('BH-' + String(bookingId).padStart(6, '0'));

  const payRes = await apiCall('POST', '/payments', { booking_id: bookingId, payment_method: bd.paymentMethod });
  let payId = null;
  if (payRes.success && payRes.data) {
    payId = payRes.data.payment_id || payRes.data.id;
  }

  if (bd.paymentMethod === 'qr' && payId) {
    if (btn) { btn.disabled = false; btn.textContent = t('book_pay_btn'); }
    state._pendingPayId = payId;
    state._pendingBookingRef = bookingRef;
    state._pendingBooking = booking;
    showQrPayment(calcTotal(), bookingRef, payId);
    return;
  }

  if (btn) { btn.disabled = false; btn.textContent = t('book_pay_btn'); }

  const refEl = document.getElementById('successBookingId');
  if (refEl) refEl.textContent = bookingRef;

  const totalEl = document.getElementById('successAmount');
  if (totalEl) totalEl.textContent = formatPrice(booking.total_amount || calcTotal());
  var subEl = document.getElementById('successSubtitle');
  if (subEl) subEl.textContent = (bd.paymentMethod && bd.paymentMethod !== 'qr') ? (currentLang === 'th' ? 'จองสำเร็จ — รอการยืนยันการชำระเงินจากผู้ให้บริการ' : 'Booking received — Awaiting payment confirmation') : (currentLang === 'th' ? 'การจองของคุณได้รับการยืนยันแล้ว' : 'Your booking has been confirmed');

  const detailEl = document.getElementById('successDetail');
  if (detailEl) {
    const d = new Date(bd.date);
    const dateLocale = currentLang === 'th' ? 'th-TH' : 'en-US';
    let detailHtml =
      '<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:#64748b">' + t('summary_date') + '</span><span style="font-weight:600">' + d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:#64748b">' + t('summary_time') + '</span><span style="font-weight:600">' + esc(bd.time) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:#64748b">' + t('summary_pax') + '</span><span style="font-weight:600">' + totalPax + ' ' + t('pax_per_person').replace('/', '') + '</span></div>';

    const pierName = tField(tour, 'pier_name') || tour.pier_name || '';
    const pierLat = tour.pier_latitude;
    const pierLng = tour.pier_longitude;
    if (pierName) {
      detailHtml += '<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:#64748b">' + t('summary_pier') + '</span><span style="font-weight:600">' + esc(pierName) + '</span></div>';
    }
    if (pierLat && pierLng) {
      detailHtml += '<a href="https://maps.google.com/?q=' + pierLat + ',' + pierLng + '" target="_blank" style="display:block;margin-top:8px;padding:10px;background:#f0fdf4;border-radius:10px;text-align:center;color:#16a34a;font-weight:600;font-size:13px;text-decoration:none"><i class="fas fa-location-dot" style="margin-right:6px"></i>' + t('summary_navigate') + '</a>';
    }
    detailEl.innerHTML = detailHtml;
  }

  setSuccessShareData(bookingRef, booking, bd, tour);
  showModal('successModal');
}

function setSuccessShareData(bookingRef, booking, bd, tour) {
  var d = bd ? new Date(bd.date) : null;
  var dateLocale = currentLang === 'th' ? 'th-TH' : 'en-US';
  var dateStr = d ? d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  var timeStr = (bd && bd.time) ? bd.time : '';
  var pax = (bd && bd.passengers) ? (bd.passengers.adult + bd.passengers.child) : 0;
  var pierName = (tour && (tField(tour, 'pier_name') || tour.pier_name)) || '';
  var amount = (booking && booking.total_amount) ? formatPrice(booking.total_amount) : '';
  var shareText = (currentLang === 'th' ? 'ฉันจองทริปเรือผ่าน BOATLY แล้ว! ' : 'I just booked a boat trip on BOATLY! ') +
    (currentLang === 'th' ? 'รหัส ' : 'Ref ') + bookingRef +
    (dateStr ? ' | ' + dateStr : '') +
    (timeStr ? ' ' + timeStr : '') +
    (pax ? ' | ' + pax + (currentLang === 'th' ? ' คน' : ' pax') : '') +
    (pierName ? ' | ' + pierName : '') +
    (amount ? ' | ' + amount : '');
  state._successShareText = shareText;
  state._successShareUrl = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin + (window.location.pathname || '') : 'https://boatly.co.th';
}

function closeSuccess() {
  closeModal('successModal');
  closeAllPanels();
  goHome();
}

async function showQrPayment(amount, bookingRef, payId) {
  const qrEl = document.getElementById('qrCodeContainer');
  const amtEl = document.getElementById('qrAmount');
  const refEl = document.getElementById('qrBookingRef');
  const nameEl = document.getElementById('qrAccountName');
  if (amtEl) amtEl.textContent = formatPrice(amount);
  if (refEl) refEl.textContent = bookingRef;

  if (qrEl) {
    qrEl.innerHTML = '<div style="width:220px;height:220px;display:flex;align-items:center;justify-content:center"><i class="fas fa-spinner fa-spin" style="font-size:32px;color:var(--ocean-600)"></i></div>';

    let qrMode = 'promptpay';
    let ppId = '';
    let customUrl = '';
    let accountName = '';

    try {
      const r = await apiCall('GET', '/settings/payment-methods');
      if (r.success && r.data && r.data.qr) {
        const qrCfg = r.data.qr;
        qrMode = qrCfg.qr_mode || 'promptpay';
        ppId = qrCfg.promptpay_id || '';
        customUrl = qrCfg.custom_qr_url || '';
        accountName = qrCfg.account_name || '';
      }
    } catch (e) {}

    if (nameEl) nameEl.textContent = accountName || 'BOATLY';

    if (qrMode === 'custom' && customUrl) {
      const qrImgUrl = customUrl.startsWith('http') ? customUrl : imgSrc(customUrl);
      qrEl.innerHTML = '<img src="' + qrImgUrl + '" alt="QR Code" style="width:220px;height:220px;object-fit:contain;border-radius:12px">';
    } else {
      if (!ppId) ppId = '0000000000';
      const qrData = generatePromptPayPayload(ppId, amount);
      const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(qrData);
      qrEl.innerHTML = '<img src="' + qrUrl + '" alt="PromptPay QR" style="width:220px;height:220px;border-radius:12px">';
    }
  }

  showModal('qrPaymentModal');
}

function generatePromptPayPayload(ppId, amount) {
  function tlv(id, val) { return id + String(val.length).padStart(2, '0') + val; }
  let payload = '';
  payload += tlv('00', '01');
  payload += tlv('01', '12');
  let merchant = tlv('00', 'A000000677010111');
  if (ppId.length >= 13) {
    merchant += tlv('01', '00' + ppId.replace(/-/g, ''));
  } else {
    let phone = ppId.replace(/^0/, '66').replace(/-/g, '');
    merchant += tlv('01', '00' + phone);
  }
  payload += tlv('29', merchant);
  payload += tlv('53', '764');
  if (amount > 0) {
    payload += tlv('54', amount.toFixed(2));
  }
  payload += tlv('58', 'TH');
  payload += tlv('62', tlv('05', 'BOATLY'));
  payload += '6304';
  const crc = crc16(payload);
  return payload + crc;
}

function crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function closeQrPaymentModal() {
  if (qrPaymentPollInterval) { clearInterval(qrPaymentPollInterval); qrPaymentPollInterval = null; }
  closeModal('qrPaymentModal');
}

function showQrPaymentSuccess() {
  const bookingRef = state._pendingBookingRef;
  const booking = state._pendingBooking || {};
  const tour = state.currentTour;
  const bd = state.bookingData;
  closeQrPaymentModal();
  const refEl = document.getElementById('successBookingId');
  if (refEl) refEl.textContent = bookingRef;
  const totalEl = document.getElementById('successAmount');
  if (totalEl) totalEl.textContent = formatPrice(booking.total_amount || calcTotal());
  const detailEl = document.getElementById('successDetail');
  if (detailEl && tour && bd) {
    const d = new Date(bd.date);
    const dateLocale = currentLang === 'th' ? 'th-TH' : 'en-US';
    const totalPax = bd.passengers.adult + bd.passengers.child;
    let detailHtml =
      '<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:#64748b">' + t('summary_date') + '</span><span style="font-weight:600">' + d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:#64748b">' + t('summary_time') + '</span><span style="font-weight:600">' + esc(bd.time) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:#64748b">' + t('summary_pax') + '</span><span style="font-weight:600">' + totalPax + ' ' + t('pax_per_person').replace('/', '') + '</span></div>';
    const pierName = tField(tour, 'pier_name') || tour.pier_name || '';
    const pierLat = tour.pier_latitude;
    const pierLng = tour.pier_longitude;
    if (pierName) detailHtml += '<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:#64748b">' + t('summary_pier') + '</span><span style="font-weight:600">' + esc(pierName) + '</span></div>';
    if (pierLat && pierLng) detailHtml += '<a href="https://maps.google.com/?q=' + pierLat + ',' + pierLng + '" target="_blank" style="display:block;margin-top:8px;padding:10px;background:#f0fdf4;border-radius:10px;text-align:center;color:#16a34a;font-weight:600;font-size:13px;text-decoration:none"><i class="fas fa-location-dot" style="margin-right:6px"></i>' + t('summary_navigate') + '</a>';
    detailEl.innerHTML = detailHtml;
  }
  setSuccessShareData(bookingRef, booking, bd, tour);
  showModal('successModal');
}

var qrPaymentPollInterval = null;
async function checkQrPaymentStatus() {
  const payId = state._pendingPayId;
  if (!payId) return;
  const btn = document.getElementById('qrConfirmBtn');
  const msgEl = document.getElementById('qrStatusMsg');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px"></i>' + t('loading'); }
  if (msgEl) msgEl.textContent = '';
  try {
    var r = await apiCall('GET', '/payments/' + payId + '/status');
    var d = r.data || r;
    if (d.status === 'paid' && d.booking_status === 'confirmed') {
      if (qrPaymentPollInterval) { clearInterval(qrPaymentPollInterval); qrPaymentPollInterval = null; }
      if (state._pendingBooking) state._pendingBooking.status = 'confirmed';
      showQrPaymentSuccess();
      return;
    }
    if (msgEl) msgEl.textContent = t('qr_pending');
    if (msgEl) msgEl.style.color = '#64748b';
  } catch (e) {
    if (msgEl) { msgEl.textContent = (e.message || 'ไม่สามารถตรวจสอบได้'); msgEl.style.color = '#ef4444'; }
  }
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sync-alt" style="margin-right:6px"></i><span data-t="qr_check_status">' + t('qr_check_status') + '</span>'; }
  if (!qrPaymentPollInterval) {
    qrPaymentPollInterval = setInterval(function() {
      if (!document.getElementById('qrPaymentModal') || !document.getElementById('qrPaymentModal').classList.contains('show')) {
        clearInterval(qrPaymentPollInterval);
        qrPaymentPollInterval = null;
        return;
      }
      checkQrPaymentStatus();
    }, 8000);
  }
}

/* ===== Share Success Card ===== */
async function shareSuccessCard() {
  var card = document.getElementById('successShareCard');
  if (!card) return;
  if (typeof html2canvas === 'undefined') {
    toast(t('error') || 'Error', 'error');
    return;
  }
  try {
    var canvas = await html2canvas(card, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
    var blob = await new Promise(function(resolve) { canvas.toBlob(resolve, 'image/png', 0.95); });
    var file = new File([blob], 'boatly-booking.png', { type: 'image/png' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'BOATLY - ' + (t('success_title') || 'Booking Confirmed'),
        text: state._successShareText || '',
        files: [file]
      });
      toast(t('success_share_copied') || 'Shared!', 'success');
    } else {
      var a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'boatly-booking-' + (document.getElementById('successBookingId') ? document.getElementById('successBookingId').textContent.replace(/-/g, '') : '') + '.png';
      a.click();
      toast(t('success_share_image') || 'Image saved', 'success');
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      try {
        var c2 = await html2canvas(card, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
        var a = document.createElement('a');
        a.href = c2.toDataURL('image/png');
        a.download = 'boatly-booking.png';
        a.click();
        toast(t('success_share_image'), 'success');
      } catch (e2) {
        toast(t('error') || 'Error', 'error');
      }
    }
  }
}

function shareToLine() {
  var text = encodeURIComponent(state._successShareText || '');
  window.open('https://line.me/R/share?text=' + text, '_blank', 'noopener');
}

function shareToFacebook() {
  var url = encodeURIComponent(state._successShareUrl || window.location.href);
  window.open('https://www.facebook.com/sharer/sharer.php?u=' + url, '_blank', 'noopener,width=600,height=400');
}

function shareToTwitter() {
  var text = encodeURIComponent(state._successShareText || '');
  window.open('https://twitter.com/intent/tweet?text=' + text, '_blank', 'noopener,width=600,height=400');
}

/* ===== Bookings History ===== */

let bookingFilter = '';

async function loadBookings(status) {
  var isOp = state.user && (state.user.role === 'operator' || state.user.role === 'admin');
  if (isOp) {
    if (!requireLogin()) return;
    openOperatorPanel();
    bottomNavSetActivePartner(2);
    return;
  }
  bottomNavSetActive(1);
  if (!requireLogin()) return;
  closeAllCustomerPanelsExcept('bookingsPanel');
  showPanel('bookingsPanel');
  if (status !== undefined) bookingFilter = status;
  applyTranslations();

  const tabs = document.querySelectorAll('.booking-tab');
  tabs.forEach(tab => tab.classList.toggle('active', (tab.dataset.status || '') === bookingFilter));

  const c = document.getElementById('bookingsContent');
  if (!c) { console.error('bookingsContent not found'); return; }
  c.innerHTML = '<div style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--ocean-600)"></i></div>';

  try {
    let url = '/bookings?limit=50';
    if (bookingFilter) url += '&status=' + bookingFilter;
    const r = await apiCall('GET', url);

    if (r.success && r.data) {
      const bookings = r.data.bookings || (Array.isArray(r.data) ? r.data : []);
      if (!Array.isArray(bookings) || bookings.length === 0) {
        c.innerHTML = '<div style="text-align:center;padding:60px 20px">' +
          '<i class="fas fa-calendar-xmark" style="font-size:48px;color:#e2e8f0;display:block;margin-bottom:12px"></i>' +
          '<p style="font-size:15px;font-weight:600;color:#94a3b8">' + esc(t('bookings_empty')) + '</p></div>';
      } else {
        c.innerHTML = bookings.map(b => renderBookingCard(b)).join('');
      }
    } else {
      c.innerHTML = '<div style="text-align:center;padding:60px 20px"><p style="color:#ef4444;font-size:13px">' + esc(r.message || t('error')) + '</p></div>';
    }
  } catch (e) {
    console.error('loadBookings error:', e);
    c.innerHTML = '<div style="text-align:center;padding:60px 20px"><p style="color:#ef4444">' + esc(t('error')) + '</p></div>';
  }
}

function filterBookings(status, el) {
  bookingFilter = status;
  document.querySelectorAll('.booking-tab').forEach(tab => tab.classList.remove('active'));
  if (el) el.classList.add('active');
  loadBookings(status);
}

function renderBookingCard(b) {
  const statusIcons = { pending: 'fa-clock', confirmed: 'fa-check-circle', completed: 'fa-flag-checkered', cancelled: 'fa-times-circle' };
  const statusColors = { pending: '#eab308', confirmed: '#eab308', completed: '#22c55e', rescheduled: '#ef4444', cancelled: '#ef4444' };
  const statusLabel = t('status_' + b.status) || b.status;
  const statusIcon = statusIcons[b.status] || 'fa-clock';
  const statusColor = statusColors[b.status] || '#94a3b8';
  const img = b.boat_image ? imgSrc(b.boat_image) : (b.primary_image ? imgSrc(b.primary_image) : 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=400&h=300&fit=crop');
  const bName = b.boat_name || tField(b, 'name') || '';
  const dest = tField(b, 'destination_name') || b.destination_name || '';
  const canCancel = b.status === 'pending' || b.status === 'confirmed';
  const payStatus = b.payment_status === 'completed' ? '✅' : (b.payment_status === 'pending' ? '⏳' : '');

  return '<div class="nearby-card" style="margin-bottom:12px;cursor:pointer" onclick="showBookingDetail(' + b.id + ')">' +
    '<div class="nearby-card-image"><img src="' + img + '" alt="" loading="lazy" onerror="this.style.display=\'none\'"></div>' +
    '<div class="nearby-card-body">' +
      '<div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">' +
          '<span class="status-badge" style="background:' + statusColor + '15;color:' + statusColor + '"><i class="fas ' + statusIcon + '" style="margin-right:3px;font-size:10px"></i>' + esc(statusLabel) + '</span>' +
          (b.booking_ref ? '<span style="font-size:10px;color:#94a3b8;font-weight:600">' + esc(b.booking_ref) + '</span>' : '') +
        '</div>' +
        '<h4 style="font-size:14px;font-weight:600;margin-top:2px">' + esc(bName) + '</h4>' +
        (dest ? '<p style="font-size:11px;color:#94a3b8;margin-top:1px"><i class="fas fa-map-marker-alt" style="margin-right:3px"></i>' + esc(dest) + '</p>' : '') +
        '<p style="font-size:12px;color:#64748b;margin-top:3px"><i class="far fa-calendar" style="margin-right:4px"></i>' + (b.booking_date || '') + ' · <i class="far fa-clock" style="margin:0 3px"></i>' + (b.time_slot || '') + ' · <i class="fas fa-users" style="margin:0 3px"></i>' + (b.passengers || 0) + '</p>' +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px">' +
        '<span style="font-size:15px;font-weight:700;color:var(--ocean-700)">' + payStatus + ' ' + formatPrice(b.total_amount) + '</span>' +
        (canCancel ? '<button onclick="event.stopPropagation();cancelBooking(' + b.id + ')" style="font-size:11px;color:#ef4444;border:1px solid #fecaca;background:#fff;padding:4px 10px;border-radius:8px;cursor:pointer;font-family:inherit">' + esc(t('bookings_cancel')) + '</button>' : '') +
      '</div>' +
    '</div></div>';
}

async function loadTipEnabled() {
  try {
    const r = await fetch(API + '/tip/enabled');
    const j = await r.json();
    state.tipEnabled = !!(j.data && j.data.enabled);
  } catch (e) { state.tipEnabled = false; }
}

async function showBookingDetail(id) {
  state.lastBookingDetailId = id;
  closePanel('bookingsPanel');
  showPanel('bookingDetailPanel');
  const c = document.getElementById('bookingDetailContent');
  if (!c) return;
  c.innerHTML = '<div style="text-align:center;padding:60px"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--ocean-600)"></i></div>';

  if (state.tipEnabled === false) await loadTipEnabled();
  const r = await apiCall('GET', '/bookings/' + id);
  if (!r.success || !r.data) {
    c.innerHTML = '<div style="padding:40px;text-align:center"><p style="color:#ef4444">' + esc(r.message || t('error')) + '</p></div>';
    return;
  }

  const b = r.data;
  const statusColors = { pending: '#eab308', confirmed: '#eab308', completed: '#22c55e', rescheduled: '#ef4444', cancelled: '#ef4444' };
  const statusLabel = t('status_' + b.status) || b.status;
  const statusColor = statusColors[b.status] || '#94a3b8';
  const img = b.boat_image ? imgSrc(b.boat_image) : 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800&h=400&fit=crop';
  const bName = b.boat_name || tField(b, 'name') || '';
  const dest = tField(b, 'destination_name') || b.destination_name || '';
  const canCancel = b.status === 'pending' || b.status === 'confirmed';

  let addonsHtml = '';
  if (b.booking_addons) {
    try {
      const addons = typeof b.booking_addons === 'string' ? JSON.parse(b.booking_addons) : b.booking_addons;
      if (Array.isArray(addons) && addons.length > 0) {
        addonsHtml = '<div class="booking-detail-section"><h4>' + esc(t('book_addon')) + '</h4>' +
          addons.map(a => {
            const qty = a.quantity || 1;
            const sub = a.subtotal != null ? a.subtotal : (Number(a.price) || 0) * qty;
            return '<div class="bkd-row"><span class="label">' + esc(a.name) + (qty > 1 ? ' × ' + qty : '') + '</span><span class="value">+' + formatPrice(sub) + '</span></div>';
          }).join('') +
          '</div>';
      }
    } catch (e) {}
  }

  const payInfo = b.payment;
  const payMethodMap = { promptpay: 'QR / PromptPay', cash: t('pay_cod') || 'COD', credit_card: t('pay_card') || 'Card' };
  const payStatusMap = { completed: '✅ ' + (t('pay_completed') || 'Paid'), pending: '⏳ ' + (t('pay_pending') || 'Pending'), failed: '❌ ' + (t('pay_failed') || 'Failed') };

  c.innerHTML =
    '<div class="booking-detail-hero">' +
      '<img src="' + img + '" alt="" onerror="this.style.display=\'none\'">' +
      '<div class="status-overlay" style="background:' + statusColor + ';color:#fff">' + esc(statusLabel) + '</div>' +
    '</div>' +

    '<div class="booking-detail-section">' +
      '<h4>' + esc(t('booking_detail_info')) + '</h4>' +
      '<div style="font-size:18px;font-weight:700;margin-bottom:4px">' + esc(bName) + '</div>' +
      (dest ? '<div style="font-size:13px;color:#64748b"><i class="fas fa-map-marker-alt" style="margin-right:4px"></i>' + esc(dest) + '</div>' : '') +
      (b.booking_ref ? '<div style="margin-top:8px;padding:8px 12px;background:#f8fafc;border-radius:10px;font-size:13px"><span style="color:#94a3b8">' + esc(t('booking_ref')) + ':</span> <strong style="color:var(--ocean-700);letter-spacing:1px">' + esc(b.booking_ref) + '</strong></div>' : '') +
    '</div>' +

    '<div class="booking-detail-section">' +
      '<h4>' + esc(t('booking_schedule')) + '</h4>' +
      '<div class="bkd-row"><span class="label"><i class="far fa-calendar" style="margin-right:6px"></i>' + esc(t('book_date')) + '</span><span class="value">' + (b.booking_date || '-') + '</span></div>' +
      '<div class="bkd-row"><span class="label"><i class="far fa-clock" style="margin-right:6px"></i>' + esc(t('book_time')) + '</span><span class="value">' + (b.time_slot || '-') + '</span></div>' +
      '<div class="bkd-row"><span class="label"><i class="fas fa-users" style="margin-right:6px"></i>' + esc(t('summary_passengers')) + '</span><span class="value">' + (b.passengers || 0) + ' ' + esc(t('summary_pax')) + '</span></div>' +
    '</div>' +

    addonsHtml +

    '<div class="booking-detail-section">' +
      '<h4>' + esc(t('booking_contact')) + '</h4>' +
      '<div class="bkd-row"><span class="label">' + esc(t('edit_name')) + '</span><span class="value">' + esc(b.customer_name || '-') + '</span></div>' +
      '<div class="bkd-row"><span class="label">Email</span><span class="value">' + esc(b.customer_email || '-') + '</span></div>' +
      '<div class="bkd-row"><span class="label">' + esc(t('edit_phone')) + '</span><span class="value">' + esc(b.customer_phone || '-') + '</span></div>' +
      ((b.pickup_location || '').trim() || b.pier_name_th || b.pier_name ? '<div class="bkd-row"><span class="label">' + esc(t('summary_pickup_location')) + '</span><span class="value">' + esc((b.pickup_location || '').trim() || b.pier_name_th || b.pier_name || '-') + '</span></div>' : '') +
      (b.special_request ? '<div class="bkd-row"><span class="label">' + esc(t('booking_note')) + '</span><span class="value">' + esc(b.special_request) + '</span></div>' : '') +
    '</div>' +

    '<div class="booking-detail-section">' +
      '<h4>' + esc(t('booking_payment')) + '</h4>' +
      (payInfo ? '<div class="bkd-row"><span class="label">' + esc(t('pay_method')) + '</span><span class="value">' + (payMethodMap[payInfo.method] || payInfo.method) + '</span></div>' +
        '<div class="bkd-row"><span class="label">' + esc(t('pay_status')) + '</span><span class="value">' + (payStatusMap[payInfo.status] || payInfo.status) + '</span></div>' +
        (payInfo.transaction_ref ? '<div class="bkd-row"><span class="label">Ref</span><span class="value" style="font-size:12px">' + esc(payInfo.transaction_ref) + '</span></div>' : '') :
        '<div style="font-size:13px;color:#94a3b8">' + esc(t('pay_none')) + '</div>') +
      '<div style="margin-top:12px;padding-top:12px;border-top:2px dashed #e2e8f0">' +
        '<div class="bkd-row"><span class="label" style="font-size:16px;font-weight:700;color:#1e293b">' + esc(t('pay_total')) + '</span><span class="value" style="font-size:20px;color:var(--ocean-700)">' + formatPrice(b.total_amount) + '</span></div>' +
      '</div>' +
    '</div>' +

    ((b.status === 'confirmed' || b.status === 'in_progress') ? '<div class="booking-detail-section" style="border:2px solid #00b4d8;background:linear-gradient(135deg,#e8f6fc,#d0edf8)"><h4><i class="fas fa-ship" style="color:#0077b6;margin-right:8px"></i>' + (t('live_tracking') || 'Live Tracking') + '</h4><div id="liveTrackMap" style="height:200px;border-radius:12px;overflow:hidden;background:#e2e8f0"></div><p id="liveTrackStatus" style="font-size:12px;color:#64748b;margin-top:8px"><i class="fas fa-circle" style="font-size:6px;color:#22c55e;animation:pulse 1.5s infinite"></i> ' + (t('live_tracking_waiting') || 'รอตำแหน่งเรือ...') + '</p></div>' +
      '<div class="booking-detail-section" style="border:2px solid #8b5cf6;background:linear-gradient(135deg,#f5f3ff,#ede9fe)"><h4><i class="fas fa-comments" style="color:#7c3aed;margin-right:8px"></i>' + (t('chat_with_crew') || 'แชทกับทีมงาน') + '</h4><div id="bookingChatMessages" style="max-height:180px;overflow-y:auto;padding:12px;background:#fff;border-radius:12px;margin-bottom:10px"></div><div style="display:flex;gap:8px"><input type="text" id="bookingChatInput" placeholder="' + (t('chat_placeholder') || 'พิมพ์ข้อความ...') + '" style="flex:1;padding:10px 14px;border:2px solid #e2e8f0;border-radius:10px;font-size:14px" onkeydown="if(event.key===\'Enter\')sendBookingChat(' + b.id + ')"><button onclick="sendBookingChat(' + b.id + ')" style="padding:10px 16px;background:#7c3aed;color:#fff;border:none;border-radius:10px;font-weight:600;cursor:pointer"><i class="fas fa-paper-plane"></i></button></div></div>' : '') +

    (canCancel ? '<div style="padding:16px 20px"><button onclick="cancelBooking(' + b.id + ')" style="width:100%;padding:14px;border-radius:14px;border:2px solid #fecaca;background:#fff;color:#ef4444;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit"><i class="fas fa-times-circle" style="margin-right:6px"></i>' + esc(t('bookings_cancel')) + '</button></div>' : '') +

    (b.status === 'completed' && state.tipEnabled ? '<div style="padding:16px 20px;display:flex;gap:10px;flex-wrap:wrap">' +
      (!b.has_reviewed ? '<button onclick="showWriteReviewFromBooking(' + b.id + ',' + b.boat_id + ',' + JSON.stringify(bName || '') + ')" style="flex:1;min-width:120px;padding:14px;border-radius:14px;border:2px solid #fef3c7;background:#fffbeb;color:#d97706;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit"><i class="fas fa-star" style="margin-right:6px"></i>' + (t('review_write') || 'เขียนรีวิว') + '</button>' : '') +
      (!b.tip_given ? '<button onclick="showTipModal(' + b.id + ', 0, ' + JSON.stringify(bName || '') + ')" style="flex:1;min-width:120px;padding:14px;border-radius:14px;border:2px solid #e9d5ff;background:linear-gradient(135deg,#fdf4ff,#fae8ff);color:#a855f7;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(168,85,247,0.2)"><i class="fas fa-hand-holding-heart" style="margin-right:6px"></i>' + (t('tip_give') || 'ให้ทิป') + '</button>' : '') +
    '</div>' : '') +

    '<div style="height:40px"></div>';

  applyTranslations();

  if (b.status === 'confirmed' || b.status === 'in_progress') {
    initLiveTrackingAndChat(b.id, b.destination_lat, b.destination_lng);
  }
}

function initLiveTrackingAndChat(bookingId, destLat, destLng) {
  var mapEl = document.getElementById('liveTrackMap');
  if (mapEl && typeof L !== 'undefined') {
    var center = [14.0, 100.5];
    if (destLat && destLng) center = [parseFloat(destLat), parseFloat(destLng)];
    var m = L.map('liveTrackMap').setView(center, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(m);
    state._liveTrackMap = m;
      state._boatMarker = L.marker(center, { icon: L.divIcon({ className: 'boat-marker', html: '<i class="fas fa-ship" style="font-size:24px;color:#0077b6"></i>', iconSize: [30, 30] }) }).addTo(m);
  }
  loadBookingChat(bookingId);
  connectBookingSocket(bookingId);
}

function connectBookingSocket(bookingId) {
  if (state._socketBookingId === bookingId && state._socket && state._socket.connected) return;
  if (state._socket) { state._socket.disconnect(); state._socket = null; }
  try {
    var io = window.io;
    if (!io) {
      var s = document.createElement('script');
      s.src = SOCKET_URL + '/socket.io/socket.io.js';
      s.onload = function() { doConnect(bookingId); };
      document.head.appendChild(s);
    } else {
      doConnect(bookingId);
    }
  } catch (e) { console.warn('Socket init:', e); }
  function doConnect(bid) {
    var io = window.io;
    if (!io) return;
    state._socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    state._socketBookingId = bid;
    state._socket.on('connect', function() { state._socket.emit('joinBooking', bid); });
    state._socket.on('boatLocation', function(data) {
      if (data.booking_id !== bid) return;
      state._boatPosition = { lat: data.lat, lng: data.lng };
      if (state._boatMarker) {
        state._boatMarker.setLatLng([data.lat, data.lng]);
        if (state._liveTrackMap) state._liveTrackMap.panTo([data.lat, data.lng]);
      }
      var st = document.getElementById('liveTrackStatus');
      if (st) st.innerHTML = '<i class="fas fa-circle" style="font-size:6px;color:#22c55e"></i> ' + (t('live_tracking_active') || 'กำลังอัปเดตตำแหน่งเรือ');
    });
    state._socket.on('newMessage', function(msg) {
      if (msg.booking_id !== bid) return;
      appendChatMessage(msg);
    });
  }
}

async function loadBookingChat(bookingId) {
  var container = document.getElementById('bookingChatMessages');
  if (!container) return;
  try {
    var r = await apiCall('GET', '/bookings/' + bookingId + '/messages');
    var list = (r.success && r.data) ? r.data : [];
    container.innerHTML = list.length ? list.map(function(m) {
      var who = m.sender_type === 'crew' ? (t('crew') || 'ทีมงาน') : (m.sender_type === 'system' ? (t('system') || 'ระบบ') : (t('you') || 'คุณ'));
      return '<div style="margin-bottom:8px"><span style="font-size:11px;color:#64748b">' + esc(who) + '</span>: ' + esc(m.message) + '</div>';
    }).join('') : '<p style="font-size:13px;color:#94a3b8">' + (t('chat_empty') || 'ยังไม่มีข้อความ') + '</p>';
    container.scrollTop = container.scrollHeight;
  } catch (e) { container.innerHTML = '<p style="color:#94a3b8">โหลดไม่สำเร็จ</p>'; }
}

function appendChatMessage(msg) {
  var container = document.getElementById('bookingChatMessages');
  if (!container) return;
  var who = msg.sender_type === 'crew' ? (t('crew') || 'ทีมงาน') : (msg.sender_type === 'system' ? (t('system') || 'ระบบ') : (t('you') || 'คุณ'));
  var first = container.querySelector('p');
  if (first && first.textContent.indexOf('ยังไม่มี') >= 0) container.innerHTML = '';
  container.innerHTML += '<div style="margin-bottom:8px"><span style="font-size:11px;color:#64748b">' + esc(who) + '</span>: ' + esc(msg.message) + '</div>';
  container.scrollTop = container.scrollHeight;
}

async function sendBookingChat(bookingId) {
  var inp = document.getElementById('bookingChatInput');
  var text = (inp && inp.value || '').trim();
  if (!text) return;
  var senderType = (state.user && state.user.role === 'operator') ? 'crew' : 'customer';
  if (state._socket && state._socket.connected) {
    state._socket.emit('sendMessage', { booking_id: bookingId, sender_type: senderType, sender_id: state.user ? state.user.id : null, message: text });
    inp.value = '';
    appendChatMessage({ sender_type: senderType, message: text });
  } else {
    try {
      var r = await apiCall('POST', '/bookings/' + bookingId + '/messages', { message: text, sender_type: senderType });
      if (r.success) { inp.value = ''; appendChatMessage(r.data || { sender_type: senderType, message: text }); }
      else toast(r.message || t('error'), 'error');
    } catch (e) { toast(t('error'), 'error'); }
  }
}

async function cancelBooking(id) {
  if (!confirm(t('bookings_cancel_confirm'))) return;
  const r = await apiCall('PUT', '/bookings/' + id + '/cancel');
  if (r.success) {
    toast(t('bookings_cancelled'));
    closePanel('bookingDetailPanel');
    loadBookings();
  } else {
    toast(r.message || t('error'), 'error');
  }
}

/* ===== Profile ===== */

async function showProfile() {
  if (!requireLogin()) return;
  showPanel('profilePanel');
  // ถ้ามี token แต่ state.user ยังไม่มี ให้ดึงจาก API ก่อน
  if (!state.user && state.token) {
    try {
      const me = await apiCall('GET', '/auth/me');
      if (me.success && me.data) {
        state.user = me.data;
        localStorage.setItem('bh_user', JSON.stringify(state.user));
      }
    } catch (e) {}
  }
  // Refetch profile from server to ensure profile_image is current
  try {
    const pr = await apiCall('GET', '/users/profile');
    if (pr.success && pr.data) {
      state.user = { ...(state.user || {}), ...pr.data };
      localStorage.setItem('bh_user', JSON.stringify(state.user));
    }
  } catch (e) {
    if (!state.user && state.token) {
      try {
        const me = await apiCall('GET', '/auth/me');
        if (me.success && me.data) {
          state.user = me.data;
          localStorage.setItem('bh_user', JSON.stringify(state.user));
        }
      } catch (e2) {}
    }
  }
  const u = state.user;
  const isOperator = u && (u.role === 'operator' || u.role === 'admin');

  if (u) {
    const avatar = document.getElementById('profileAvatar');
    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    if (avatar) {
      avatar.innerHTML = profileAvatarHtml(u.profile_image, u.name);
    }
    if (nameEl) nameEl.textContent = u.name;
    if (emailEl) emailEl.textContent = u.email;

    const roleBadge = document.getElementById('profileRoleBadge');
    if (roleBadge) roleBadge.style.display = isOperator ? 'inline-block' : 'none';

    const statsCustomer = document.getElementById('profileStatsCustomer');
    const statsOperator = document.getElementById('profileStatsOperator');
    const opLink = document.getElementById('profileOperatorLink');
    const adminLink = document.getElementById('profileAdminLink');
    const bookingHistory = document.getElementById('profileBookingHistory');
    const favorites = document.getElementById('profileFavorites');
    const bookAsCustomer = document.getElementById('profileBookAsCustomer');
    const announcementsLink = document.getElementById('profileAnnouncements');

    if (isOperator) {
      if (statsCustomer) statsCustomer.style.display = 'none';
      if (statsOperator) statsOperator.style.display = 'flex';
      if (opLink) { opLink.style.display = ''; opLink.style.order = '-1'; }
      if (bookingHistory) {
        bookingHistory.querySelector('h4').textContent = 'การจองของลูกค้า';
        bookingHistory.querySelector('p').textContent = 'ดูและจัดการการจองที่ลูกค้าจองกับคุณ';
        bookingHistory.onclick = () => openOperatorPanel();
      }
      if (favorites) favorites.style.display = 'none';
      if (bookAsCustomer) bookAsCustomer.style.display = '';
      if (announcementsLink) announcementsLink.style.display = '';
    } else {
      if (statsCustomer) statsCustomer.style.display = 'flex';
      if (statsOperator) statsOperator.style.display = 'none';
      if (opLink) opLink.style.display = 'none';
      if (bookingHistory) {
        bookingHistory.querySelector('h4').textContent = t('profile_booking_history');
        bookingHistory.querySelector('p').textContent = t('profile_booking_history_desc');
        bookingHistory.onclick = () => loadBookings();
      }
      if (favorites) favorites.style.display = '';
      if (bookAsCustomer) bookAsCustomer.style.display = 'none';
      if (announcementsLink) announcementsLink.style.display = 'none';
    }
    if (adminLink) adminLink.style.display = (u.role === 'admin' || u.role === 'staff') ? '' : 'none';
  }

  const menuItems = document.querySelectorAll('[data-profile-menu]');
  menuItems.forEach(el => {
    const key = el.getAttribute('data-profile-menu');
    if (key) el.textContent = t(key);
  });

  if (isOperator && state.token) {
    try {
      const r = await fetch(API + '/operator-data.php?action=dashboard&token=' + encodeURIComponent(state.token));
      const data = r.ok ? await r.json() : {};
      if (!data.error) {
        document.getElementById('statBoats').textContent = data.boats ?? 0;
        document.getElementById('statOpBookings').textContent = data.bookings ?? 0;
        document.getElementById('statRevenue').textContent = '฿' + Number(data.revenue || 0).toLocaleString();
      } else {
        document.getElementById('statBoats').textContent = '0';
        document.getElementById('statOpBookings').textContent = '0';
        document.getElementById('statRevenue').textContent = '฿0';
      }
    } catch (e) {
      document.getElementById('statBoats').textContent = '0';
      document.getElementById('statOpBookings').textContent = '0';
      document.getElementById('statRevenue').textContent = '฿0';
    }
  } else {
    const sr = await apiCall('GET', '/users/stats');
    if (sr.success && sr.data) {
      const tripEl = document.getElementById('statTrips');
      const revEl = document.getElementById('statReviews');
      const favEl = document.getElementById('statFavs');
      const tripLabel = document.getElementById('statTripsLabel');
      const revLabel = document.getElementById('statReviewsLabel');
      const favLabel = document.getElementById('statFavsLabel');
      if (tripEl) tripEl.textContent = sr.data.total_bookings || 0;
      if (revEl) revEl.textContent = sr.data.total_reviews || 0;
      if (favEl) favEl.textContent = sr.data.total_favorites || 0;
      if (tripLabel) tripLabel.textContent = t('profile_trips');
      if (revLabel) revLabel.textContent = t('profile_reviews');
      if (favLabel) favLabel.textContent = t('profile_favs');
    }
  }
  updateAuthUI();
}

async function showFeedbackPanel() {
  closePanel('profilePanel');
  showPanel('feedbackPanel');
  const c = document.getElementById('feedbackContent');
  if (!c) return;
  c.innerHTML = '<div style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--ocean-600)"></i></div>';
  try {
    const intro = await apiCall('GET', '/cms/feedback');
    const introData = intro.success && intro.data ? intro.data : {};
    const title = tField(introData, 'title') || introData.title_th || introData.title_en || '';
    const body = tField(introData, 'body') || introData.body_th || introData.body_en || '';
    let html = '';
    if (title || body) {
      html += '<div style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:20px">';
      if (title) html += '<h3 style="font-size:15px;font-weight:600;margin-bottom:8px">' + esc(title) + '</h3>';
      if (body) html += '<p style="font-size:13px;color:#64748b;line-height:1.6;white-space:pre-wrap">' + esc(body) + '</p>';
      html += '</div>';
    }
    html += '<div class="form-group"><label style="font-size:13px;font-weight:600;display:block;margin-bottom:8px">' + (t('profile_feedback') || 'ความเห็น') + '</label>';
    html += '<textarea id="feedbackMessage" placeholder="' + esc(t('profile_feedback_desc') || 'ส่งความคิดเห็นหรือข้อเสนอแนะ') + '" style="width:100%;min-height:120px;border:2px solid #e2e8f0;border-radius:10px;padding:12px;font-size:14px;resize:vertical"></textarea></div>';
    html += '<button class="btn-primary" style="width:100%;padding:14px" onclick="submitFeedback()"><i class="fas fa-paper-plane" style="margin-right:6px"></i>' + (t('edit_save') || 'ส่ง') + '</button>';
    c.innerHTML = html;
  } catch (e) {
    c.innerHTML = '<p style="text-align:center;color:#ef4444;padding:20px">' + esc(t('error') || 'Error') + '</p>';
  }
}

async function submitFeedback() {
  const msg = (document.getElementById('feedbackMessage') || {}).value.trim();
  if (!msg) return toast(t('profile_feedback_desc') || 'กรุณากรอกข้อความ', 'error');
  try {
    const r = await apiCall('POST', '/cms/feedback', { message: msg });
    if (r.success) {
      toast(r.message || 'ส่งความเห็นสำเร็จ');
      document.getElementById('feedbackMessage').value = '';
    } else toast(r.message || t('error'), 'error');
  } catch (e) {
    toast(t('error') || 'Error', 'error');
  }
}

async function showHelpCenterPanel() {
  closePanel('profilePanel');
  showPanel('helpCenterPanel');
  const c = document.getElementById('helpCenterContent');
  if (!c) return;
  c.innerHTML = '<div style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--ocean-600)"></i></div>';
  try {
    const r = await apiCall('GET', '/cms/help');
    const items = (r.success && r.data) ? r.data : [];
    if (items.length === 0) {
      c.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px;font-size:14px">' + esc(t('no_data') || 'ยังไม่มีข้อมูล') + '</p>';
      return;
    }
    let html = '<div style="display:flex;flex-direction:column;gap:12px">';
    items.forEach(function(item) {
      const title = tField(item, 'title') || item.title_th || item.title_en || '';
      const body = tField(item, 'body') || item.body_th || item.body_en || '';
      html += '<div style="background:#fff;border:2px solid #e2e8f0;border-radius:12px;padding:16px">';
      html += '<h4 style="font-size:14px;font-weight:600;margin-bottom:8px">' + esc(title) + '</h4>';
      html += '<p style="font-size:13px;color:#64748b;line-height:1.6;white-space:pre-wrap">' + esc(body) + '</p>';
      html += '</div>';
    });
    html += '</div>';
    c.innerHTML = html;
  } catch (e) {
    c.innerHTML = '<p style="text-align:center;color:#ef4444;padding:20px">' + esc(t('error') || 'Error') + '</p>';
  }
}

async function showAnnouncementsPanel() {
  closePanel('profilePanel');
  showPanel('announcementsPanel');
  const c = document.getElementById('announcementsContent');
  if (!c) return;
  c.innerHTML = '<div style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--ocean-600)"></i></div>';
  try {
    const r = await apiCall('GET', '/cms/announcements');
    const items = (r.success && r.data) ? r.data : [];
    if (items.length === 0) {
      c.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px;font-size:14px">' + esc(t('no_data') || 'ยังไม่มีข้อมูล') + '</p>';
      return;
    }
    let html = '<div style="display:flex;flex-direction:column;gap:12px">';
    items.forEach(function(item) {
      const title = tField(item, 'title') || item.title_th || item.title_en || '';
      const body = tField(item, 'body') || item.body_th || item.body_en || '';
      const date = item.created_at ? new Date(item.created_at).toLocaleDateString(currentLang === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
      html += '<div style="background:#fff;border:2px solid #e2e8f0;border-radius:12px;padding:16px">';
      if (date) html += '<span style="font-size:11px;color:#94a3b8;display:block;margin-bottom:6px">' + esc(date) + '</span>';
      html += '<h4 style="font-size:14px;font-weight:600;margin-bottom:8px">' + esc(title) + '</h4>';
      html += '<p style="font-size:13px;color:#64748b;line-height:1.6;white-space:pre-wrap">' + esc(body) + '</p>';
      html += '</div>';
    });
    html += '</div>';
    c.innerHTML = html;
  } catch (e) {
    c.innerHTML = '<p style="text-align:center;color:#ef4444;padding:20px">' + esc(t('error') || 'Error') + '</p>';
  }
}

async function showEditProfile() {
  if (!requireLogin()) return;
  if (!state.token) state.token = localStorage.getItem('bh_token');
  closePanel('profilePanel');
  showPanel('editProfilePanel');

  var u = state.user;
  if (!u) {
    try {
      var cached = localStorage.getItem('bh_user');
      if (cached) {
        u = JSON.parse(cached);
        state.user = u;
      }
    } catch (e) {}
  }

  try {
    var pr = await apiCall('GET', '/users/profile');
    if (pr && pr.success && pr.data) {
      u = { ...(u || {}), ...pr.data };
      state.user = u;
      localStorage.setItem('bh_user', JSON.stringify(u));
    }
  } catch (e) {}

  u = state.user || u;
  if (!u) return;

  function populateForm() {
    var nameInput = document.getElementById('editName');
    var emailInput = document.getElementById('editEmail');
    var phoneInput = document.getElementById('editPhone');
    var langSelect = document.getElementById('editLanguage');
    var avatar = document.getElementById('editProfileAvatar');
    var statusEl = document.getElementById('profileUploadStatus');

    if (nameInput) nameInput.value = u.name || '';
    if (emailInput) emailInput.value = u.email || '';
    if (phoneInput) phoneInput.value = u.phone || '';
    if (langSelect) langSelect.value = u.language || currentLang || 'th';
    if (statusEl) statusEl.innerHTML = '';

    if (avatar) avatar.innerHTML = profileAvatarHtml(u.profile_image, u.name);

    var fileInput = document.getElementById('profileImageInput');
    if (fileInput) fileInput.value = '';
  }

  requestAnimationFrame(function() { requestAnimationFrame(populateForm); });
}

function previewProfileImage(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];

  if (file.size > 5 * 1024 * 1024) {
    toast(t('error') + ': Max 5MB', 'error');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const avatar = document.getElementById('editProfileAvatar');
    if (avatar) {
      avatar.innerHTML = '<img src="' + e.target.result + '" alt="preview">';
    }
  };
  reader.readAsDataURL(file);

  uploadProfileImage(file);
}

async function uploadProfileImage(file) {
  const statusEl = document.getElementById('profileUploadStatus');
  if (statusEl) statusEl.innerHTML = '<span style="color:var(--ocean-600)"><i class="fas fa-spinner fa-spin"></i> ' + t('edit_uploading') + '</span>';

  const formData = new FormData();
  formData.append('image', file);

  try {
    const token = localStorage.getItem('bh_token');
    const resp = await fetch(API + '/users/profile-image', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    });
    const r = await resp.json();

    if (r.success && r.data && r.data.profile_image) {
      state.user.profile_image = r.data.profile_image;
      localStorage.setItem('bh_user', JSON.stringify(state.user));
      if (statusEl) statusEl.innerHTML = '<span style="color:#22c55e"><i class="fas fa-check-circle"></i> ' + t('edit_photo_saved') + '</span>';
      updateProfileAvatars();
      updateAuthUI();
    } else {
      if (statusEl) statusEl.innerHTML = '<span style="color:#ef4444"><i class="fas fa-exclamation-circle"></i> ' + (r.message || t('error')) + '</span>';
    }
  } catch (e) {
    if (statusEl) statusEl.innerHTML = '<span style="color:#ef4444"><i class="fas fa-exclamation-circle"></i> ' + t('error') + '</span>';
  }
}

function updateProfileAvatars() {
  const u = state.user;
  if (!u) return;

  const avatarEls = [
    document.getElementById('profileAvatar'),
    document.getElementById('editProfileAvatar')
  ];

  avatarEls.forEach(el => {
    if (!el) return;
    el.innerHTML = profileAvatarHtml(u.profile_image, u.name);
  });
}

async function saveProfile() {
  const name = document.getElementById('editName').value.trim();
  const phone = document.getElementById('editPhone').value.trim();
  const lang = document.getElementById('editLanguage')?.value || 'th';

  if (!name) return toast(t('auth_fill_all'), 'error');

  const r = await apiCall('PUT', '/users/profile', { name, phone, language: lang });
  if (r.success) {
    state.user = { ...state.user, name, phone, language: lang };
    if (r.data && r.data.profile_image !== undefined) state.user.profile_image = r.data.profile_image;
    localStorage.setItem('bh_user', JSON.stringify(state.user));

    if (lang !== currentLang) {
      setLang(lang);
    }

    closePanel('editProfilePanel');
    var isOp = state.user && (state.user.role === 'operator' || state.user.role === 'admin');
    if (isOp) {
      goHome();
      loadHome();
    } else {
      showPanel('profilePanel');
      showProfile();
    }
    toast(t('edit_saved'));
    updateAuthUI();
    updateProfileAvatars();
  } else {
    toast(r.message || t('error'), 'error');
  }
}

/* ===== Notifications ===== */

async function loadNotificationCount() {
  if (!isLoggedIn()) return;
  const r = await apiCall('GET', '/users/notifications');
  if (r.success && r.data) {
    const unread = r.data.unread_count || 0;
    const badge = document.getElementById('notifBadge');
    if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? '' : 'none'; }
  }
}

async function loadNotifications() {
  if (!requireLogin()) return;
  closePanel('profilePanel');
  showPanel('notifPanel');
  applyTranslations();
  const c = document.getElementById('notifContent');
  if (!c) return;
  c.innerHTML = '<div style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--ocean-600)"></i></div>';
  const r = await apiCall('GET', '/users/notifications');
  const notifs = r.success && r.data ? (r.data.notifications || r.data) : [];

  if (Array.isArray(notifs) && notifs.length > 0) {
    const typeConfig = {
      booking:   { icon: 'fa-calendar-check', bg: '#eff6ff', color: '#3b82f6' },
      payment:   { icon: 'fa-credit-card', bg: '#f0fdf4', color: '#22c55e' },
      cancel:    { icon: 'fa-times-circle', bg: '#fef2f2', color: '#ef4444' },
      review:    { icon: 'fa-star', bg: '#fefce8', color: '#eab308' },
      promo:     { icon: 'fa-gift', bg: '#faf5ff', color: '#a855f7' },
      system:    { icon: 'fa-info-circle', bg: '#f8fafc', color: '#64748b' },
      confirmed: { icon: 'fa-check-circle', bg: '#f0fdf4', color: '#22c55e' },
      completed: { icon: 'fa-flag-checkered', bg: '#dcfce7', color: '#22c55e' }
    };

    c.innerHTML = notifs.map(n => {
      const cfg = typeConfig[n.type] || typeConfig.system;
      const isRead = n.is_read == 1;
      const dateLocale = currentLang === 'th' ? 'th-TH' : 'en-US';
      const dateStr = n.created_at ? new Date(n.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

      return '<div class="notif-item' + (isRead ? ' read' : '') + '" onclick="markNotifRead(' + n.id + ',this)">' +
        '<div class="notif-icon" style="background:' + cfg.bg + ';color:' + cfg.color + '"><i class="fas ' + cfg.icon + '"></i></div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="display:flex;align-items:start;justify-content:space-between;gap:8px">' +
            '<div style="font-size:14px;font-weight:' + (isRead ? '400' : '600') + ';color:#1e293b">' + esc(n.title || '') + '</div>' +
            (!isRead ? '<span style="width:8px;height:8px;border-radius:50%;background:var(--ocean-600);flex-shrink:0;margin-top:6px"></span>' : '') +
          '</div>' +
          '<div style="font-size:12px;color:#64748b;margin-top:3px;line-height:1.5;white-space:pre-line">' + esc(n.body || '') + '</div>' +
          '<div style="font-size:11px;color:#94a3b8;margin-top:4px">' + dateStr + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  } else {
    c.innerHTML = '<div style="text-align:center;padding:60px 20px">' +
      '<i class="fas fa-bell-slash" style="font-size:48px;color:#e2e8f0;display:block;margin-bottom:12px"></i>' +
      '<p style="font-size:15px;font-weight:600;color:#94a3b8">' + esc(t('notif_empty')) + '</p>' +
      '<p style="font-size:13px;color:#cbd5e1;margin-top:6px">' + esc(t('notif_hint')) + '</p></div>';
  }
}

async function markNotifRead(id, el) {
  await apiCall('PUT', '/users/notifications/' + id + '/read');
  if (el) {
    el.classList.add('read');
    const dot = el.querySelector('span[style*="border-radius:50%"]');
    if (dot) dot.remove();
  }
  loadNotificationCount();
}

async function markAllNotifRead() {
  const r = await apiCall('PUT', '/users/notifications/read-all');
  if (r.success) {
    toast(t('notif_all_read'));
    loadNotifications();
  }
}

/* ===== Map (Leaflet) ===== */

/** จัดศูนย์แผนที่ใกล้ตำแหน่งผู้ใช้ (ท่าเรือ/ทริปใกล้ฉัน) */
function tryMapCenterNearUser() {
  if (!state.mapInstance || typeof navigator === 'undefined' || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    function(pos) {
      if (!state.mapInstance) return;
      try {
        state.mapInstance.setView([pos.coords.latitude, pos.coords.longitude], 11);
        state.mapInstance.invalidateSize();
      } catch (e) {}
    },
    function() {},
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
  );
}

async function loadMap() {
  showPanel('mapPanel');
  var container = document.getElementById('mapContainer');
  if (!container) return;

  if (typeof L === 'undefined') {
    container.innerHTML = '<div style="text-align:center;padding:60px 20px">' +
      '<i class="fas fa-map-marked-alt" style="font-size:48px;color:#e2e8f0;display:block;margin-bottom:12px"></i>' +
      '<p style="font-size:15px;font-weight:600;color:#94a3b8">' + esc(t('map_title')) + '</p>' +
      '<p style="font-size:13px;color:#cbd5e1;margin-top:4px">โหลด Leaflet ไม่สำเร็จ</p></div>';
    return;
  }

  if (state.mapInstance) {
    try {
      state.mapInstance.invalidateSize();
    } catch (e) {}
    if (state.mapOpenFromExploreNav) {
      state.mapOpenFromExploreNav = false;
      tryMapCenterNearUser();
    }
    return;
  }

  container.innerHTML = '<div style="text-align:center;padding:60px 20px"><i class="fas fa-spinner fa-spin" style="font-size:32px;color:var(--ocean-600)"></i><p style="margin-top:12px;font-size:14px;color:#64748b">กำลังโหลดแผนที่...</p></div>';

  setTimeout(function doInitMap() {
    container.innerHTML = '<div id="leafletMap" style="width:100%;height:100%;min-height:300px"></div>';
    var mapEl = document.getElementById('leafletMap');
    if (!mapEl) return;

    try {
      state.mapInstance = L.map('leafletMap').setView([14.0, 100.5], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(state.mapInstance);

      apiCall('GET', '/tours/map').then(function(r) {
        if (r.success && r.data && state.mapInstance) {
          var tours = Array.isArray(r.data) ? r.data : (r.data.tours || []);
          tours.forEach(function(tour) {
            var lat = tour.latitude || tour.pier_latitude || tour.destination_lat;
            var lng = tour.longitude || tour.pier_longitude || tour.destination_lng;
            if (!lat || !lng) return;
            var name = boatName(tour);
            var img = tourImage(tour);
            var marker = L.marker([parseFloat(lat), parseFloat(lng)]).addTo(state.mapInstance);
            marker.bindPopup(
              '<div style="min-width:180px;text-align:center">' +
                '<img src="' + img + '" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:6px" onerror="this.style.display=\'none\'">' +
                '<div style="font-weight:600;font-size:13px">' + esc(name) + '</div>' +
                '<div style="color:var(--ocean-700);font-weight:700;margin:4px 0">' + formatPrice(tour.price) + '</div>' +
                '<button onclick="closePanel(\'mapPanel\');showTourDetail(' + boatId(tour) + ')" style="background:var(--ocean-600);color:#fff;border:none;padding:6px 14px;border-radius:8px;font-size:12px;cursor:pointer;margin-top:4px">' + t('detail_book_now') + '</button>' +
              '</div>'
            );
          });
        }
      });

      setTimeout(function() {
        if (state.mapInstance) state.mapInstance.invalidateSize();
        if (state.mapOpenFromExploreNav) {
          state.mapOpenFromExploreNav = false;
          tryMapCenterNearUser();
        }
      }, 350);
    } catch (e) {
      container.innerHTML = '<div style="text-align:center;padding:60px 20px">' +
        '<i class="fas fa-exclamation-triangle" style="font-size:48px;color:#f59e0b;display:block;margin-bottom:12px"></i>' +
        '<p style="font-size:15px;font-weight:600;color:#64748b">โหลดแผนที่ไม่สำเร็จ</p>' +
        '<p style="font-size:13px;color:#94a3b8;margin-top:4px">ลองรีเฟรชหน้าหรือตรวจสอบการเชื่อมต่อ</p>' +
        '<button onclick="loadMap()" style="margin-top:16px;padding:10px 20px;background:var(--ocean-600);color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:14px">ลองอีกครั้ง</button></div>';
    }
  }, 450);
}

/* ===== Search ===== */

let searchTimeout;

function handleSearch(val) {
  clearTimeout(searchTimeout);
  const v = (val || '').trim();
  if (v.length >= 2) {
    searchTimeout = setTimeout(() => {
      showPanel('toursPanel');
      state.tourFilterProvince = '';
      loadTourListing(v);
    }, 500);
  }
}

function searchTours() {
  const input = document.getElementById('tourSearchInput');
  const val = input ? input.value.trim() : '';
  showPanel('toursPanel');
  if (val) state.tourFilterProvince = '';
  loadTourListing(val || null, val ? null : (state.tourFilterProvince || null));
}

function filterByProvince(name, el) {
  const isAll = !name || name === 'all';
  state.tourFilterProvince = isAll ? '' : String(name).trim();
  const searchInput = document.getElementById('tourSearchInput');
  if (searchInput && !isAll) searchInput.value = '';
  state.tourSearchQuery = '';
  document.querySelectorAll('.filter-chip').forEach(c => {
    c.classList.remove('active');
    c.style.background = ''; c.style.color = '';
  });
  if (el) { el.classList.add('active'); el.style.background = 'var(--ocean-600)'; el.style.color = '#fff'; }
  loadTourListing(state.tourSearchQuery || null, isAll ? null : state.tourFilterProvince);
}

/* ===== Write Review ===== */

let reviewStars = 0;
let reviewFiles = [];

function showWriteReviewFromBooking(bookingId, boatId) {
  state._pendingTipBookingId = bookingId;
  showWriteReview(boatId);
}

function showWriteReview(tourId) {
  if (!requireLogin()) return;
  reviewStars = 0;
  reviewFiles = [];
  showModal('reviewModal');

  const container = document.getElementById('reviewModalContent');
  if (!container) return;

  container.innerHTML =
    '<div style="text-align:center;margin-bottom:16px"><h3 style="font-size:18px;font-weight:700">' + t('review_write') + '</h3></div>' +
    '<div id="reviewStarsInput" style="display:flex;justify-content:center;gap:8px;margin-bottom:16px">' +
      [1,2,3,4,5].map(i => '<i class="fas fa-star" data-star="' + i + '" style="font-size:28px;color:#e2e8f0;cursor:pointer;transition:color 0.15s" onclick="setReviewStar(' + i + ')"></i>').join('') +
    '</div>' +
    '<textarea id="reviewComment" rows="4" placeholder="' + esc(t('review_write')) + '..." style="width:100%;border:1px solid #e2e8f0;border-radius:10px;padding:12px;font-size:14px;resize:none;font-family:inherit;box-sizing:border-box"></textarea>' +
    '<div style="margin-top:12px">' +
      '<label style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:var(--ocean-50);border-radius:8px;cursor:pointer;font-size:13px;color:var(--ocean-700)">' +
        '<i class="fas fa-camera"></i> ' + t('review_add_photos') +
        '<input type="file" id="reviewImagesInput" accept="image/*" multiple style="display:none" onchange="handleReviewImages(this)">' +
      '</label>' +
      '<div id="reviewImagePreview" style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap"></div>' +
    '</div>' +
    '<button onclick="submitReview(' + tourId + ')" style="width:100%;margin-top:16px;padding:14px;background:var(--ocean-600);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer">' + t('review_submit') + '</button>';
}

function setReviewStar(n) {
  reviewStars = n;
  document.querySelectorAll('#reviewStarsInput .fa-star').forEach((star, i) => {
    star.style.color = i < n ? '#f59e0b' : '#e2e8f0';
  });
}

function handleReviewImages(input) {
  const files = Array.from(input.files).slice(0, 5);
  reviewFiles = files;
  const preview = document.getElementById('reviewImagePreview');
  if (!preview) return;
  preview.innerHTML = files.map((f, i) => {
    const url = URL.createObjectURL(f);
    return '<div style="position:relative"><img src="' + url + '" style="width:56px;height:56px;object-fit:cover;border-radius:8px"><button onclick="removeReviewImage(' + i + ')" style="position:absolute;top:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:#ef4444;color:#fff;border:none;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center">×</button></div>';
  }).join('');
}

function removeReviewImage(idx) {
  reviewFiles.splice(idx, 1);
  const input = document.getElementById('reviewImagesInput');
  const preview = document.getElementById('reviewImagePreview');
  if (preview) {
    preview.innerHTML = reviewFiles.map((f, i) => {
      const url = URL.createObjectURL(f);
      return '<div style="position:relative"><img src="' + url + '" style="width:56px;height:56px;object-fit:cover;border-radius:8px"><button onclick="removeReviewImage(' + i + ')" style="position:absolute;top:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:#ef4444;color:#fff;border:none;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center">×</button></div>';
    }).join('');
  }
}

async function submitReview(tourId) {
  if (reviewStars === 0) return toast(t('auth_fill_all'), 'error');
  const comment = document.getElementById('reviewComment').value.trim();

  const formData = new FormData();
  formData.append('boat_id', tourId);
  formData.append('rating', reviewStars);
  formData.append('comment', comment);
  reviewFiles.forEach((f, i) => formData.append('images[' + i + ']', f));

  try {
    const headers = {};
    if (state.token) headers['Authorization'] = 'Bearer ' + state.token;
    const resp = await fetch(API + '/reviews', { method: 'POST', headers, body: formData });
    const r = await resp.json();
    if (r.success) {
      closeModal('reviewModal');
      toast(t('review_thanks'));
      if (state.currentTour) loadTourReviews(state.currentTour.id);
      if (state.tipEnabled && reviewStars >= 4 && state._pendingTipBookingId) {
        var suggested = reviewStars >= 5 ? 50 : 20;
        var boatName = state._pendingTipBoatName || '';
        setTimeout(function() { showTipModal(state._pendingTipBookingId, suggested, boatName); }, 600);
      }
      state._pendingTipBookingId = null;
      state._pendingTipBoatName = null;
    } else {
      toast(r.message || t('error'), 'error');
    }
  } catch (e) {
    toast(t('error'), 'error');
  }
}

/* ===== Tip Modal ===== */
let tipAmount = 0;

function showTipModal(bookingId, suggestedAmount, boatName) {
  if (!requireLogin()) return;
  state._tipBookingId = bookingId;
  tipAmount = Number(suggestedAmount) || 0;
  document.querySelectorAll('.tip-preset-btn').forEach(function(btn) {
    btn.classList.toggle('selected', Number(btn.dataset.amount) === tipAmount);
  });
  var customInput = document.getElementById('tipCustomAmount');
  if (customInput) { customInput.value = tipAmount > 0 && ![20,50,100].includes(tipAmount) ? tipAmount : ''; }
  var submitBtn = document.getElementById('tipSubmitBtn');
  if (submitBtn) submitBtn.disabled = tipAmount <= 0;
  if (tipAmount > 0 && [20,50,100].includes(tipAmount)) {
    var preset = document.querySelector('.tip-preset-btn[data-amount="' + tipAmount + '"]');
    if (preset) preset.classList.add('selected');
  }
  var humanEl = document.getElementById('tipHumanConnection');
  if (humanEl) {
    if (boatName && String(boatName).trim()) {
      humanEl.textContent = 'วันนี้เรือ ' + String(boatName).trim() + ' ดูแลคุณนะครับ 🙏';
      humanEl.style.display = 'block';
    } else {
      humanEl.textContent = '';
      humanEl.style.display = 'none';
    }
  }
  var msgInp = document.getElementById('tipMessageInput');
  if (msgInp) msgInp.value = '';
  state._tipMessage = null;
  var modal = document.getElementById('tipModal');
  if (modal) modal.classList.add('tip-modal-app-grade');
  showModal('tipModal');
  applyTranslations();
}

function closeTipModal() {
  state._tipBookingId = null;
  closeModal('tipModal');
}

function setTipAmount(amount) {
  tipAmount = Number(amount) || 0;
  document.querySelectorAll('.tip-preset-btn').forEach(function(btn) {
    btn.classList.toggle('selected', Number(btn.dataset.amount) === tipAmount);
  });
  var customInput = document.getElementById('tipCustomAmount');
  if (customInput && tipAmount > 0 && ![20, 50, 100].includes(tipAmount)) customInput.value = tipAmount;
  var submitBtn = document.getElementById('tipSubmitBtn');
  if (submitBtn) submitBtn.disabled = tipAmount <= 0;
}

document.addEventListener('DOMContentLoaded', function() {
  var customInput = document.getElementById('tipCustomAmount');
  if (customInput) customInput.addEventListener('input', function() { setTipAmount(Number(this.value) || 0); });
});

async function submitTip() {
  if (tipAmount <= 0 || !state._tipBookingId) return;
  var msgEl = document.getElementById('tipMessageInput');
  state._tipMessage = (msgEl && msgEl.value) ? String(msgEl.value).trim().substring(0, 200) : '';
  try {
    var r = await fetch(API + '/tip/qr?booking_id=' + state._tipBookingId + '&amount=' + tipAmount, {
      headers: state.token ? { 'Authorization': 'Bearer ' + state.token } : {}
    });
    var j = await r.json();
    if (j.success && j.data) {
      closeModal('tipModal');
      state._tipQrData = j.data;
      state._tipAmount = tipAmount;
      var container = document.getElementById('tipQrContainer');
      if (container) {
        container.innerHTML = '<img src="' + (j.data.qr_url || '').replace(/"/g, '&quot;') + '" alt="QR" style="width:220px;height:220px;border-radius:12px">';
      }
      var amtEl = document.getElementById('tipQrAmount');
      if (amtEl) amtEl.textContent = '฿' + Number(tipAmount).toLocaleString();
      var nameEl = document.getElementById('tipQrAccountName');
      if (nameEl) nameEl.textContent = j.data.account_name || 'BOATLY';
      showModal('tipQrModal');
      applyTranslations();
    } else {
      toast(j.message || t('error'), 'error');
    }
  } catch (e) {
    toast(t('error'), 'error');
  }
}

function closeTipQrModal() {
  closeModal('tipQrModal');
  state._tipQrData = null;
}

async function confirmTipPaid() {
  if (!state._tipBookingId || !state._tipAmount) return;
  var msg = (state._tipMessage || '').trim().substring(0, 200);
  try {
    var r = await apiCall('POST', '/bookings/' + state._tipBookingId + '/tip', {
      amount: state._tipAmount,
      message: msg,
      payment_method: 'promptpay'
    });
    if (r.success) {
      closeTipQrModal();
      state._tipBookingId = null;
      state._tipAmount = null;
      state._tipMessage = null;
      var msgInp = document.getElementById('tipMessageInput');
      if (msgInp) msgInp.value = '';
      showTipThankYouAnimation();
      setTimeout(function() {
        hideTipThankYouAnimation();
        if (state.lastBookingDetailId) showBookingDetail(state.lastBookingDetailId);
      }, 2200);
    } else {
      toast(r.message || t('error'), 'error');
    }
  } catch (e) {
    toast(t('error'), 'error');
  }
}

function showTipThankYouAnimation() {
  var el = document.getElementById('tipThankYouOverlay');
  if (el) { el.style.display = 'flex'; el.classList.add('tip-thank-you-visible'); }
}
function hideTipThankYouAnimation() {
  var el = document.getElementById('tipThankYouOverlay');
  if (el) { el.style.display = 'none'; el.classList.remove('tip-thank-you-visible'); }
}

/* ===== AI แนะนำทริป (Production API) ===== */
let _aiRecommendResult = null;

/**
 * แปลความหมาย source (จาก API) เป็นภาษาไทยให้ผู้ใช้เข้าใจ
 * - destinations: ดึงชื่อสถานจากตารางจุดหมายในแพลตฟอร์ม
 * - boats: ดึงจากทริป/เรือที่ลงทะเบียน (มี matched_boat_ids)
 * - template: ยังไม่มีข้อมูลครบ → ใช้แผนตัวอย่างที่สื่อชื่อจังหวัด
 */
function aiFormatSourceForUi(source) {
  var map = {
    destinations: {
      title: 'จุดหมายในระบบ',
      hint: 'แผนนี้ประกอบด้วยชื่อสถานที่จากฐานข้อมูลจุดหมายของแพลตฟอร์ม (ตรงกับคำค้นของคุณ)'
    },
    boats: {
      title: 'ทริป / เรือในแพลตฟอร์ม',
      hint: 'ดึงชื่อทริปจากเรือที่เปิดใช้งานในระบบ และตรงกับจังหวัดหรือคำค้นของคุณ'
    },
    template: {
      title: 'แผนตัวอย่างตามจังหวัด',
      hint: 'ยังไม่มีจุดหมายหรือทริปในระบบที่ตรงพอ — ระบบสร้างเส้นทางตัวอย่างที่มีชื่อจังหวัดของคุณในข้อความ'
    }
  };
  var key = (source || '').toString().toLowerCase();
  return map[key] || { title: source || '—', hint: '' };
}

function aiRenderRecommendMeta(data) {
  var locEl = document.getElementById('aiLocationLabelRow');
  var srcEl = document.getElementById('aiSourceRow');
  var hintEl = document.getElementById('aiSourceHint');
  var idsEl = document.getElementById('aiBoatIdsRow');
  var block = document.getElementById('aiMetaBlock');
  if (!locEl || !srcEl || !idsEl) return;

  var label = (data && data.location_label) ? String(data.location_label).trim() : '';
  if (label) {
    locEl.innerHTML = '<span style="color:#64748b">พื้นที่ที่เลือก:</span> <strong>' + esc(label) + '</strong>';
    locEl.style.display = 'block';
  } else {
    locEl.innerHTML = '';
    locEl.style.display = 'none';
  }

  var src = (data && data.source) ? String(data.source) : '';
  var meta = aiFormatSourceForUi(src);
  srcEl.innerHTML = '<span style="color:#64748b">ที่มาของแผน:</span> <span style="display:inline-block;margin-top:2px;padding:2px 10px;border-radius:999px;background:#dcfce7;color:#166534;font-size:11px;font-weight:600">' + esc(meta.title) + '</span> <span style="color:#94a3b8;font-size:10px">(' + esc(src || '—') + ')</span>';
  if (hintEl) {
    hintEl.textContent = meta.hint || '';
    hintEl.style.display = meta.hint ? 'block' : 'none';
  }

  var ids = (data && data.matched_boat_ids) ? data.matched_boat_ids : [];
  if (Array.isArray(ids) && ids.length > 0) {
    idsEl.innerHTML = '<span style="color:#64748b">รหัสทริป/เรือในแพลตฟอร์ม:</span> <strong style="color:var(--ocean-700)">#' + ids.map(function(id) { return esc(String(id)); }).join(', #') + '</strong><br><span style="font-size:11px;color:#94a3b8;margin-top:4px;display:inline-block">ใช้อ้างอิงกับรายการเรือในระบบ (คลิกไปหน้าทริปจากรหัสนี้ได้ในอนาคต)</span>';
    idsEl.style.display = 'block';
  } else {
    idsEl.innerHTML = '<span style="color:#64748b">รหัสทริป/เรือที่เกี่ยวข้อง:</span> <span style="color:#94a3b8">— ไม่มี (แผนมาจากจุดหมายหรือแผนตัวอย่าง ไม่ได้ผูกกับเรือเฉพาะลำ)</span>';
    idsEl.style.display = 'block';
  }

  if (block) block.style.display = 'block';
}

function openAiRecommendModal() {
  document.getElementById('aiRecommendModal').classList.add('show');
  showAiRecommendForm();
}

function closeAiRecommendModal() {
  document.getElementById('aiRecommendModal').classList.remove('show');
}

function showAiRecommendForm() {
  document.getElementById('aiRecommendForm').style.display = 'block';
  document.getElementById('aiRecommendResult').style.display = 'none';
  loadAiInterestTopicsForModal();
}

/** โหลดหัวข้อความสนใจจากเซิร์ฟเวอร์ (แอดมินตั้งค่าได้) + เรนเดอร์เป็น chip */
async function loadAiInterestTopicsForModal() {
  var box = document.getElementById('aiInterestChips');
  if (!box) return;
  box.innerHTML = '<div class="ai-interest-loading"><i class="fas fa-spinner fa-spin"></i> กำลังโหลด...</div>';
  try {
    var r = await apiCall('GET', '/settings/ai-interests');
    var topics = (r.success && r.data && Array.isArray(r.data.topics) && r.data.topics.length)
      ? r.data.topics
      : ['วัด', 'ชิล', 'ดำน้ำ', 'อาหาร', 'ธรรมชาติ'];
    renderAiInterestChips(topics);
  } catch (e) {
    renderAiInterestChips(['วัด', 'ชิล', 'ดำน้ำ', 'อาหาร', 'ธรรมชาติ']);
  }
}

function renderAiInterestChips(topics) {
  var box = document.getElementById('aiInterestChips');
  if (!box) return;
  if (!topics || topics.length === 0) {
    topics = ['วัด', 'ชิล'];
  }
  state.aiInterestTopics = topics.slice();
  var html = topics.map(function(t, idx) {
    var pressed = idx < 2 ? 'true' : 'false';
    return '<button type="button" class="ai-interest-chip" role="checkbox" aria-checked="' + pressed + '" aria-pressed="' + pressed + '" data-value="' + escAttr(t) + '">' + esc(t) + '</button>';
  }).join('');
  box.innerHTML = html;
  box.querySelectorAll('.ai-interest-chip').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var on = btn.getAttribute('aria-pressed') === 'true';
      var next = on ? 'false' : 'true';
      btn.setAttribute('aria-pressed', next);
      btn.setAttribute('aria-checked', next);
    });
  });
}

async function submitAiRecommend() {
  var location = (document.getElementById('aiLocation').value || 'อยุธยา').trim();
  var people = parseInt(document.getElementById('aiPeople').value, 10) || 2;
  var budget = parseFloat(document.getElementById('aiBudget').value) || 3000;
  var interests = [];
  document.querySelectorAll('.ai-interest-chip[aria-pressed="true"]').forEach(function(b) {
    var v = b.getAttribute('data-value');
    if (v) interests.push(v);
  });
  if (interests.length === 0 && state.aiInterestTopics && state.aiInterestTopics.length) {
    interests = state.aiInterestTopics.slice(0, 2);
  }
  if (interests.length === 0) interests = ['วัด', 'ชิล'];

  var btn = document.getElementById('aiRecommendBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px"></i>กำลังสร้างแผน...';

  try {
    var r = await apiCall('POST', '/ai/recommend', { location: location, people: people, budget: budget, interests: interests });
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-robot" style="margin-right:6px"></i>สร้างแผนทริป';

    if (!r.success && r.message) {
      toast(r.message || 'เกิดข้อผิดพลาด', 'error');
      return;
    }
    var data = r.data || r;
    _aiRecommendResult = data;

    document.getElementById('aiRouteDisplay').textContent = (data.route || []).join(' → ');
    var timeline = data.timeline || [];
    document.getElementById('aiTimelineDisplay').innerHTML = timeline.map(function(t) {
      return '<div>' + (t.time || '') + ' ' + (t.place || '') + ' - ' + (t.activity || '') + '</div>';
    }).join('');
    document.getElementById('aiBoatTypeDisplay').textContent = data.boat_type === 'private' ? 'เรือส่วนตัว' : 'เรือรวม';
    aiRenderRecommendMeta(data);

    document.getElementById('aiRecommendForm').style.display = 'none';
    document.getElementById('aiRecommendResult').style.display = 'block';
  } catch (e) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-robot" style="margin-right:6px"></i>สร้างแผนทริป';
    toast(e.message || 'เกิดข้อผิดพลาด', 'error');
  }
}

function applyAiResultToItinerary() {
  if (!_aiRecommendResult) return;
  if (!requireLogin()) return;
  closeAiRecommendModal();
  var data = _aiRecommendResult;
  var timeline = data.timeline || [];
  var route = data.route || [];
  var loc = document.getElementById('aiLocation').value || 'อยุธยา';
  var items = timeline.length > 0 ? timeline.map(function(t) {
    return { place_name: t.place || '', activity: t.activity || '', time: t.time || '', start_time: t.time || '', end_time: '', tour_id: null, boat_id: null };
  }) : route.map(function(p) {
    return { place_name: p, activity: '', time: '', start_time: '', end_time: '', tour_id: null, boat_id: null };
  });
  var plan = {
    title: 'แผนทริป AI - ' + loc,
    location: loc,
    items: items
  };
  openItineraryModal(plan);
}

/* Match Boats API - ใช้เมื่อค้นหาเรือตาม date/time/people/location */
async function matchBoats(params) {
  var r = await apiCall('POST', '/match/boats', params);
  if (!r.success && r.message) throw new Error(r.message);
  return r.data || r;
}

/* ===== Itinerary Plan ===== */

let editingItineraryId = null;

function showItineraryPanel() {
  bottomNavSetActive(3);
  if (!requireLogin()) return;
  closeAllPanels();
  showPanel('itineraryPanel');
  if (typeof applyTranslations === 'function') applyTranslations();
  loadItineraries();
}

/** ปุ่มกลาง "จอง" — เปิดรายการทริป + โฟกัสช่องค้นหา (จองได้เร็ว) */
function openNavQuickBook() {
  state.bottomNavToursTab = 2;
  state.openToursFromQuickBook = true;
  bottomNavSetActive(2);
  closeAllPanels();
  showPanel('toursPanel');
  loadTourListing('', 'all', '');
  setTimeout(function() {
    var inp = document.getElementById('tourSearchInput');
    if (inp) {
      try {
        inp.focus();
        inp.select();
      } catch (e) {}
    }
  }, 280);
}

/** แท็บสำรวจ — เปิด "สำรวจบนแผนที่" (ท่าเรือ/ทริปใกล้ฉัน) เหมือนคาร์ดหน้าแรก */
function openNavExploreMap() {
  state.bottomNavToursTab = 4;
  bottomNavSetActive(4);
  closeAllPanels();
  state.mapOpenFromExploreNav = true;
  loadMap();
}

/** ค้นหาทริปแบบรายการ (ใช้จากที่อื่นถ้าต้องการ) */
function openNavExploreTours() {
  state.bottomNavToursTab = 4;
  bottomNavSetActive(4);
  closeAllPanels();
  showPanel('toursPanel');
  loadTourListing('', 'all', '');
}

async function loadItineraries() {
  const body = document.getElementById('itineraryListBody');
  if (!body) return;
  body.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--ocean-600)"></i>';
  try {
    const r = await apiCall('GET', '/itineraries');
    if (!r.success) throw new Error(r.message);
    const list = r.data || [];
    if (list.length === 0) {
      body.innerHTML = '<p style="color:#64748b;margin:0;text-align:center;font-size:14px;line-height:1.5">' + t('itinerary_empty_saved') + '</p>';
      return;
    }
    body.innerHTML = list.map(p => `
      <div class="card" style="margin-bottom:12px;padding:16px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.08);cursor:pointer" onclick="openItineraryDetail(${p.id})">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div style="flex:1;min-width:0">
            <h4 style="margin:0 0 4px;font-size:15px">${esc(p.title || '')}</h4>
            ${p.description ? '<p style="margin:0;font-size:12px;color:#64748b">' + esc((p.description||'').substring(0,80)) + '</p>' : ''}
            <span style="font-size:11px;color:#94a3b8;margin-top:4px;display:inline-block">${p.is_public ? '🔗 ' + t('itinerary_public').split('(')[0] : '🔒 ส่วนตัว'}</span>
          </div>
          <div class="itinerary-card-actions" style="display:flex;gap:6px;flex-shrink:0" onclick="event.stopPropagation()">
            <button class="itinerary-action-btn" onclick="event.stopPropagation();shareItineraryForPlan(${p.id})" title="${t('itinerary_share')}"><i class="fas fa-arrow-up-from-bracket"></i></button>
            <button class="itinerary-action-btn" onclick="event.stopPropagation();copyItineraryPlan(${p.id})" title="${t('itinerary_copy')}"><i class="far fa-copy"></i></button>
            <button class="itinerary-action-btn" onclick="editItinerary(${p.id})" title="${t('itinerary_edit')}"><i class="far fa-pen-to-square"></i></button>
            <button class="itinerary-action-btn action-delete" onclick="deleteItinerary(${p.id}, this.getAttribute('data-title'))" data-title="${esc(p.title||'')}" title="${t('itinerary_delete')}"><i class="far fa-trash-can"></i></button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    body.innerHTML = '<p style="color:#ef4444">' + (e.message || t('error')) + '</p>';
  }
}

function openItineraryModal(plan) {
  editingItineraryId = plan ? plan.id : null;
  document.getElementById('itineraryModalTitle').textContent = plan ? t('itinerary_edit') : t('itinerary_add');
  document.getElementById('itineraryTitle').value = plan ? (plan.title || '') : '';
  document.getElementById('itineraryDesc').value = plan ? (plan.description || '') : '';
  document.getElementById('itineraryDateStart').value = plan ? (plan.trip_date_start || '') : '';
  document.getElementById('itineraryDateEnd').value = plan ? (plan.trip_date_end || '') : '';
  document.getElementById('itineraryLocation').value = plan ? (plan.location || '') : '';
  state.planSlots = plan && plan.items && plan.items.length ? plan.items.map(function(it) {
    var isTour = !!(it.tour_id || it.boat_id);
    var t = it.time || (it.start_time && it.end_time ? it.start_time + '-' + it.end_time : it.start_time || '');
    return {
      slotType: isTour ? 'tour' : 'free',
      place_name: it.place_name || it.location || it.tour_name || it.title || '',
      lat: it.lat, lng: it.lng, time: t, activity: it.notes || it.description || it.title || '',
      tour_id: it.tour_id || it.boat_id || null,
      tour_name: it.tour_name || it.boat_name || ''
    };
  }) : [];
  renderPlanSlotsList();
  document.getElementById('itineraryModal').classList.add('show');
}

function closeItineraryModal() {
  document.getElementById('itineraryModal').classList.remove('show');
  editingItineraryId = null;
  state.planSlots = [];
}

function addPlanSlot() {
  state.planSlots.push({ slotType: 'free', place_name: '', lat: null, lng: null, time: '', activity: '', tour_id: null, tour_name: '' });
  renderPlanSlotsList();
}

function removePlanSlot(i) {
  state.planSlots.splice(i, 1);
  renderPlanSlotsList();
}

function searchLocationForSlot(slotIdx, query) {
  var inp = document.getElementById('planSlotLoc_' + slotIdx);
  if (!inp || !query || query.length < 2) return;
  if (state.locationSearchTimeout) clearTimeout(state.locationSearchTimeout);
  state.locationSearchTimeout = setTimeout(function() {
    var dd = document.getElementById('planSlotLocDropdown_' + slotIdx);
    if (dd) { dd.innerHTML = '<div style="padding:12px;font-size:13px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> กำลังค้นหา...</div>'; dd.style.display = 'block'; }
    var url = API + '/geocode?q=' + encodeURIComponent(query);
    fetch(url).then(function(r) { return r.json(); }).then(function(res) {
      var data = (res && res.success && res.data) ? res.data : [];
      dd = document.getElementById('planSlotLocDropdown_' + slotIdx);
      if (!dd) return;
      if (!data || data.length === 0) {
        dd.innerHTML = '<div style="padding:12px;font-size:13px;color:#94a3b8">ไม่พบผลลัพธ์ - ลองพิมพ์ชื่อสถานที่หรือจังหวัด</div>';
        dd.style.display = 'block';
        return;
      }
      dd.innerHTML = data.map(function(p) {
        var name = p.display_name || p.name || '';
        return '<div class="plan-slot-search-item" data-lat="' + p.lat + '" data-lng="' + p.lon + '" data-name="' + esc(name) + '" onclick="selectPlanSlotLocation(' + slotIdx + ', this.getAttribute(\'data-name\'), this.getAttribute(\'data-lat\'), this.getAttribute(\'data-lng\'))" style="padding:10px 12px;margin:2px 0;border-radius:8px;cursor:pointer;font-size:13px;background:#f8fafc">' + esc(name.substring(0, 80)) + '</div>';
      }).join('');
      dd.style.display = 'block';
    }).catch(function() {
      var dd = document.getElementById('planSlotLocDropdown_' + slotIdx);
      if (dd) { dd.innerHTML = '<div style="padding:12px;font-size:13px;color:#94a3b8">ไม่สามารถค้นหาได้</div>'; dd.style.display = 'block'; }
    });
  }, 400);
}

function selectPlanSlotLocation(slotIdx, name, lat, lng) {
  if (state.planSlots[slotIdx]) {
    state.planSlots[slotIdx].place_name = name || '';
    state.planSlots[slotIdx].lat = lat ? parseFloat(lat) : null;
    state.planSlots[slotIdx].lng = lng ? parseFloat(lng) : null;
  }
  var dd = document.getElementById('planSlotLocDropdown_' + slotIdx);
  if (dd) dd.style.display = 'none';
  renderPlanSlotsList();
}

function openMapPickForSlot(slotIdx) {
  state.planSlotMapIndex = slotIdx;
  state.planSlotMapCoords = null;
  document.getElementById('planSlotMapPickModal').classList.add('show');
  document.getElementById('planSlotMapHint').textContent = 'กดบนแผนที่เพื่อเลือกตำแหน่ง';
  setTimeout(initPlanSlotMap, 100);
}

function closePlanSlotMapPick() {
  document.getElementById('planSlotMapPickModal').classList.remove('show');
  state.planSlotMapIndex = null;
  if (state.planSlotMapInstance) {
    state.planSlotMapInstance.remove();
    state.planSlotMapInstance = null;
  }
}

function initPlanSlotMap() {
  var container = document.getElementById('planSlotMapContainer');
  if (!container || typeof L === 'undefined') return;
  container.innerHTML = '<div id="planSlotLeaflet" style="width:100%;height:100%"></div>';
  var map = L.map('planSlotLeaflet').setView([14.0, 100.5], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
  state.planSlotMapInstance = map;
  map.on('click', function(e) {
    var lat = e.latlng.lat, lng = e.latlng.lng;
    if (map._pickMarker) map._pickMarker.remove();
    map._pickMarker = L.marker([lat, lng]).addTo(map);
    state.planSlotMapCoords = { lat: lat, lng: lng };
    document.getElementById('planSlotMapHint').textContent = lat.toFixed(5) + ', ' + lng.toFixed(5);
  });
}

function confirmPlanSlotMapPick() {
  if (state.planSlotMapIndex != null && state.planSlotMapCoords && state.planSlots[state.planSlotMapIndex]) {
    var s = state.planSlots[state.planSlotMapIndex];
    if (!s.place_name) s.place_name = 'ตำแหน่งที่เลือก';
    s.lat = state.planSlotMapCoords.lat;
    s.lng = state.planSlotMapCoords.lng;
  }
  closePlanSlotMapPick();
  renderPlanSlotsList();
  document.getElementById('itineraryModal').classList.add('show');
}

function updatePlanSlotField(slotIdx, field, value) {
  if (state.planSlots[slotIdx]) state.planSlots[slotIdx][field] = value;
}

function updatePlanSlotTime(slotIdx) {
  var startEl = document.getElementById('planSlotTimeStart_' + slotIdx);
  var endEl = document.getElementById('planSlotTimeEnd_' + slotIdx);
  if (!state.planSlots[slotIdx] || !startEl) return;
  var start = (startEl.value || '').trim();
  var end = (endEl && endEl.value) ? endEl.value.trim() : '';
  var combined = start;
  if (end && end !== start) combined = start + '-' + end;
  state.planSlots[slotIdx].time = combined;
}

function switchPlanSlotTab(slotIdx, tab) {
  if (state.planSlots[slotIdx]) state.planSlots[slotIdx].slotType = tab;
  renderPlanSlotsList();
}

function searchToursForPlanSlot(slotIdx, q) {
  var container = document.getElementById('planSlotTourResults_' + slotIdx);
  if (!container) return;
  if (state.planSlotTourTimeout) clearTimeout(state.planSlotTourTimeout);
  state.planSlotTourTimeout = setTimeout(async function() {
    container.innerHTML = '<div style="text-align:center;padding:16px"><i class="fas fa-spinner fa-spin" style="font-size:20px;color:var(--ocean-600)"></i></div>';
    var url = '/tours?limit=10&page=1';
    if (q) url += '&search=' + encodeURIComponent(q);
    var r = await apiCall('GET', url);
    var tours = r.success && r.data ? (r.data.tours || r.data) : [];
    if (tours.length === 0) {
      container.innerHTML = '<p style="color:#94a3b8;font-size:12px;text-align:center;padding:12px">' + (t('no_trips') || 'ไม่พบทัวร์') + '</p>';
    } else {
      container.innerHTML = tours.map(function(tour) {
        var tid = boatId(tour);
        var name = boatName(tour) || '';
        var place = boatLocation(tour) || '';
        var lat = tour.destination_lat ?? tour.latitude ?? tour.pier_latitude ?? '';
        var lng = tour.destination_lng ?? tour.longitude ?? tour.pier_longitude ?? '';
        return '<div class="nearby-card" style="margin:0;padding:8px">' +
          '<div class="nearby-card-image" style="width:48px;height:48px"><img src="' + tourImage(tour) + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:8px"></div>' +
          '<div class="nearby-card-body" style="flex:1;min-width:0;padding:4px 0">' +
            '<div style="font-weight:600;font-size:12px">' + esc(name) + '</div>' +
            '<div style="font-size:11px;color:#94a3b8">' + esc(place) + ' · ' + formatPrice(tour.price) + '</div>' +
          '</div>' +
          '<button type="button" onclick="selectTourForPlanSlotFromEl(' + slotIdx + ',this)" data-tour-id="' + tid + '" data-tour-name="' + esc(name) + '" data-tour-place="' + esc(place) + '" data-tour-lat="' + (lat || '') + '" data-tour-lng="' + (lng || '') + '" class="btn-primary" style="padding:6px 10px;font-size:11px"><i class="fas fa-check"></i></button>' +
        '</div>';
      }).join('');
    }
  }, 300);
}

function selectTourForPlanSlotFromEl(slotIdx, btn) {
  var tourId = btn.getAttribute('data-tour-id');
  var tourName = btn.getAttribute('data-tour-name') || '';
  var place = btn.getAttribute('data-tour-place') || '';
  var lat = btn.getAttribute('data-tour-lat');
  var lng = btn.getAttribute('data-tour-lng');
  if (state.planSlots[slotIdx] && tourId) {
    state.planSlots[slotIdx].slotType = 'tour';
    state.planSlots[slotIdx].tour_id = Number(tourId);
    state.planSlots[slotIdx].tour_name = tourName || '';
    state.planSlots[slotIdx].place_name = place || tourName || '';
    state.planSlots[slotIdx].lat = lat && !isNaN(parseFloat(lat)) ? parseFloat(lat) : null;
    state.planSlots[slotIdx].lng = lng && !isNaN(parseFloat(lng)) ? parseFloat(lng) : null;
  }
  renderPlanSlotsList();
}

function renderPlanSlotsList() {
  var el = document.getElementById('planSlotsList');
  if (!el) return;
  var slots = state.planSlots || [];
  el.innerHTML = slots.map(function(s, i) {
    var slotType = s.slotType || 'free';
    var locVal = s.place_name || '';
    var timeVal = s.time || '';
    var actVal = s.activity || '';
    var isFree = slotType === 'free';
    var tabsHtml = '<div style="display:flex;gap:4px;margin-bottom:10px">' +
      '<button type="button" onclick="switchPlanSlotTab(' + i + ',\'free\')" style="flex:1;padding:6px 10px;font-size:11px;border-radius:8px;border:none;cursor:pointer;background:' + (isFree ? 'var(--ocean-600)' : '#f1f5f9') + ';color:' + (isFree ? '#fff' : '#64748b') + '">' + (t('itinerary_free_form') || 'ใส่ข้อมูลอิสระ') + '</button>' +
      '<button type="button" onclick="switchPlanSlotTab(' + i + ',\'tour\')" style="flex:1;padding:6px 10px;font-size:11px;border-radius:8px;border:none;cursor:pointer;background:' + (!isFree ? 'var(--ocean-600)' : '#f1f5f9') + ';color:' + (!isFree ? '#fff' : '#64748b') + '">' + (t('itinerary_from_tour') || 'จากทัวร์ในระบบ') + '</button>' +
    '</div>';
    var freeFormHtml = '<div style="margin-bottom:8px;position:relative">' +
        '<input type="text" id="planSlotLoc_' + i + '" value="' + esc(locVal) + '" placeholder="' + (t('itinerary_search_place') || 'พิมพ์ค้นหาสถานที่') + '" oninput="updatePlanSlotField(' + i + ',\'place_name\',this.value);searchLocationForSlot(' + i + ',this.value)" style="width:100%;height:40px;border:2px solid #e2e8f0;border-radius:10px;padding:0 12px;font-size:13px">' +
        '<button type="button" onclick="openMapPickForSlot(' + i + ')" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);border:none;background:none;color:var(--ocean-600);cursor:pointer;font-size:14px" title="เลือกบนแผนที่"><i class="fas fa-map-marker-alt"></i></button>' +
        '<div id="planSlotLocDropdown_' + i + '" style="display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:2px solid #e2e8f0;border-radius:10px;margin-top:4px;max-height:160px;overflow-y:auto;z-index:10;box-shadow:0 4px 12px rgba(0,0,0,0.1)"></div>' +
      '</div>' +
      (s.lat != null && s.lng != null ? '<div style="font-size:11px;color:#64748b;margin-bottom:6px"><i class="fas fa-map-pin"></i> ' + s.lat.toFixed(4) + ', ' + s.lng.toFixed(4) + ' <a href="https://www.google.com/maps?q=' + s.lat + ',' + s.lng + '" target="_blank" style="margin-left:8px;color:var(--ocean-600)">ดูแผนที่</a></div>' : '') +
      '<div style="margin-bottom:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:120px"><label style="font-size:11px;color:#64748b;display:block;margin-bottom:4px">เวลาเริ่ม</label><input type="time" id="planSlotTimeStart_' + i + '" value="' + (timeVal ? timeVal.split('-')[0].trim() : '') + '" onchange="updatePlanSlotTime(' + i + ')" style="width:100%;height:40px;border:2px solid #e2e8f0;border-radius:10px;padding:0 12px;font-size:13px"></div>' +
        '<div style="flex:1;min-width:120px"><label style="font-size:11px;color:#64748b;display:block;margin-bottom:4px">เวลาสิ้นสุด (ไม่บังคับ)</label><input type="time" id="planSlotTimeEnd_' + i + '" value="' + (timeVal && timeVal.indexOf('-') >= 0 ? timeVal.split('-')[1].trim() : '') + '" onchange="updatePlanSlotTime(' + i + ')" style="width:100%;height:40px;border:2px solid #e2e8f0;border-radius:10px;padding:0 12px;font-size:13px"></div>' +
      '</div>' +
      '<div><textarea rows="2" placeholder="กิจกรรม/รายละเอียด" oninput="updatePlanSlotField(' + i + ',\'activity\',this.value)" style="width:100%;border:2px solid #e2e8f0;border-radius:10px;padding:10px 12px;font-size:13px;resize:vertical">' + esc(actVal) + '</textarea></div>';
    var tourFormHtml = '<input type="text" placeholder="ค้นหาทัวร์..." oninput="searchToursForPlanSlot(' + i + ',this.value)" style="width:100%;height:40px;border:2px solid #e2e8f0;border-radius:10px;padding:0 12px;font-size:13px;margin-bottom:8px">' +
      '<div id="planSlotTourResults_' + i + '" style="max-height:180px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;margin-bottom:8px"></div>' +
      (s.tour_id ? '<div style="font-size:12px;color:var(--ocean-600);margin-bottom:6px"><i class="fas fa-ship"></i> ' + esc(s.tour_name || s.place_name || '') + '</div>' : '') +
      '<div style="margin-bottom:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:120px"><label style="font-size:11px;color:#64748b;display:block;margin-bottom:4px">เวลาเริ่ม</label><input type="time" id="planSlotTimeStart_' + i + '" value="' + (timeVal ? timeVal.split('-')[0].trim() : '') + '" onchange="updatePlanSlotTime(' + i + ')" style="width:100%;height:40px;border:2px solid #e2e8f0;border-radius:10px;padding:0 12px;font-size:13px"></div>' +
        '<div style="flex:1;min-width:120px"><label style="font-size:11px;color:#64748b;display:block;margin-bottom:4px">เวลาสิ้นสุด (ไม่บังคับ)</label><input type="time" id="planSlotTimeEnd_' + i + '" value="' + (timeVal && timeVal.indexOf('-') >= 0 ? timeVal.split('-')[1].trim() : '') + '" onchange="updatePlanSlotTime(' + i + ')" style="width:100%;height:40px;border:2px solid #e2e8f0;border-radius:10px;padding:0 12px;font-size:13px"></div>' +
      '</div>' +
      '<div><textarea rows="2" placeholder="กิจกรรม/รายละเอียด" oninput="updatePlanSlotField(' + i + ',\'activity\',this.value)" style="width:100%;border:2px solid #e2e8f0;border-radius:10px;padding:10px 12px;font-size:13px;resize:vertical">' + esc(actVal) + '</textarea></div>';
    var contentHtml = isFree ? freeFormHtml : tourFormHtml;
    return '<div class="plan-slot-card" style="padding:14px;background:#f8fafc;border-radius:12px;border:2px solid #e2e8f0">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
        '<span style="font-size:12px;font-weight:600;color:var(--ocean-600)">#' + (i+1) + '</span>' +
        '<button type="button" onclick="removePlanSlot(' + i + ')" style="border:none;background:none;color:#94a3b8;cursor:pointer;padding:4px"><i class="fas fa-times"></i></button>' +
      '</div>' +
      tabsHtml +
      contentHtml +
    '</div>';
  }).join('');
  slots.forEach(function(s, i) {
    if ((s.slotType || 'free') === 'tour') {
      setTimeout(function() { searchToursForPlanSlot(i, ''); }, 50);
    }
  });
}

async function saveItinerary() {
  var title = (document.getElementById('itineraryTitle').value || '').trim();
  if (!title) { toast(t('auth_fill_all'), 'error'); return; }
  var description = (document.getElementById('itineraryDesc').value || '').trim();
  var tripDateStart = (document.getElementById('itineraryDateStart').value || '').trim() || null;
  var tripDateEnd = (document.getElementById('itineraryDateEnd').value || '').trim() || null;
  var location = (document.getElementById('itineraryLocation').value || '').trim() || null;
  var slots = state.planSlots || [];
  var items = state.pendingAddTour ? [{ title: state.pendingAddTour.tourName || '', tour_id: Number(state.pendingAddTour.tourId), tour_name: state.pendingAddTour.tourName || '', sort_order: 0 }] : slots.map(function(s, i) {
    var isTour = s.slotType === 'tour' && s.tour_id;
    var timeVal = s.time || '';
    var startTime = ''; var endTime = '';
    if (timeVal && timeVal.indexOf('-') >= 0) {
      var p = timeVal.split('-');
      startTime = (p[0] || '').trim();
      endTime = (p[1] || '').trim();
    } else { startTime = timeVal; }
    return {
      place_name: s.place_name || '',
      location: s.place_name || '',
      lat: s.lat, lng: s.lng, time: timeVal, start_time: startTime || null, end_time: endTime || null,
      description: s.activity || '', notes: s.activity || '',
      title: s.place_name || s.tour_name || s.activity || ('รายการ ' + (i+1)),
      activity_name: s.place_name || s.tour_name || s.activity || ('รายการ ' + (i+1)),
      type: 'other', sort_order: i,
      tour_id: isTour ? s.tour_id : null,
      tour_name: isTour ? (s.tour_name || '') : null
    };
  });
  try {
    if (editingItineraryId) {
      var r = await apiCall('PUT', '/itineraries/' + editingItineraryId, { title, description, trip_date_start: tripDateStart, trip_date_end: tripDateEnd, location, items });
      if (r.success) {
        toast(t('save') || 'บันทึกแล้ว');
        closeItineraryModal();
        loadItineraries();
        if (state.currentItinerary && state.currentItinerary.id === editingItineraryId) {
          state.currentItinerary.title = title;
          state.currentItinerary.description = description;
          state.currentItinerary.trip_date_start = tripDateStart;
          state.currentItinerary.trip_date_end = tripDateEnd;
          state.currentItinerary.location = location;
          document.getElementById('tripHeaderTitle').textContent = title;
          document.getElementById('tripHeaderSubtitle').textContent = formatTripSubtitle(state.currentItinerary);
          document.getElementById('tripDetailsContent').innerHTML = formatTripDetails(state.currentItinerary);
        }
      } else toast(r.message || t('error'), 'error');
    } else {
      r = await apiCall('POST', '/itineraries', { title, description, trip_date_start: tripDateStart, trip_date_end: tripDateEnd, location, is_public: 0, items });
      if (r.success) {
        toast(t('save') || 'สร้างแผนแล้ว');
        state.pendingAddTour = null;
        closeItineraryModal();
        loadItineraries();
        if (r.data && r.data.id) openItineraryDetail(r.data.id);
      } else toast(r.message || t('error'), 'error');
    }
  } catch (e) {
    toast(e.message || t('error'), 'error');
  }
}

async function editItinerary(id) {
  try {
    const r = await apiCall('GET', '/itineraries/' + id);
    if (r.success && r.data) openItineraryModal(r.data);
    else toast(t('error'), 'error');
  } catch (e) {
    toast(t('error'), 'error');
  }
}

async function deleteItinerary(id, title) {
  if (!confirm('ลบแผน "' + title + '"?')) return;
  try {
    const r = await apiCall('DELETE', '/itineraries/' + id);
    if (r.success) { toast('ลบแล้ว'); loadItineraries(); }
    else toast(r.message || t('error'), 'error');
  } catch (e) {
    toast(t('error'), 'error');
  }
}

let shareItineraryUrl = '';
let shareItineraryTitle = '';

async function copyItineraryPlan(planId) {
  try {
    const r = await apiCall('GET', '/itineraries/' + planId);
    if (!r.success || !r.data) { toast(t('error'), 'error'); return; }
    const plan = r.data;
    const copyTitle = (plan.title || '').trim() + (t('itinerary_copy_suffix') || ' (สำเนา)');
    const items = (plan.items || []).map(function(it) {
      var reminders = (it.notes_reminders || []).map(function(r) { return { text: r.text, completed: false }; });
      return { place_name: it.place_name, lat: it.lat, lng: it.lng, time: it.time, description: it.description, title: it.title, sort_order: it.sort_order, notes: it.notes, reminder_date: it.reminder_date, reminder_time: it.reminder_time, activity_name: it.activity_name, location: it.location, start_time: it.start_time, end_time: it.end_time, type: it.type, completed: false, notes_reminders: reminders };
    });
    const res = await apiCall('POST', '/itineraries', { title: copyTitle, description: plan.description || '', is_public: 0, items });
    if (res.success) {
      loadItineraries();
      toast(t('itinerary_copied') || 'คัดลอกแผนแล้ว');
    } else toast(res.message || t('error'), 'error');
  } catch (e) {
    toast(t('error'), 'error');
  }
}

async function shareItineraryForPlan(planId) {
  try {
    let r = await apiCall('GET', '/itineraries/' + planId);
    if (!r.success || !r.data) { toast(t('error'), 'error'); return; }
    let plan = r.data;
    let token = plan.share_token;
    if (!token || !plan.is_public) {
      await apiCall('PUT', '/itineraries/' + planId, { is_public: 1 });
      r = await apiCall('GET', '/itineraries/' + planId);
      if (r.success && r.data?.share_token) {
        token = r.data.share_token;
      }
    }
    if (token) shareItinerary(token, plan.title);
  } catch (e) {
    toast(t('error'), 'error');
  }
}

async function shareItineraryFromDetail() {
  const plan = state.currentItinerary;
  if (!plan) return;
  await shareItineraryForPlan(plan.id);
}

function shareItinerary(token, title) {
  const base = APP_PATH_PREFIX;
  const publicBase = (typeof window !== 'undefined' && (window.BOATLY_PUBLIC_URL || window.BOATHUB_PUBLIC_URL)) ? String(window.BOATLY_PUBLIC_URL || window.BOATHUB_PUBLIC_URL).replace(/\/$/, '') : '';
  shareItineraryUrl = publicBase ? (publicBase + '/?itinerary=' + token) : (window.location.origin + base + '/?itinerary=' + token);
  shareItineraryTitle = title || 'BOATLY Itinerary';
  const inp = document.getElementById('shareLinkInput');
  if (inp) inp.value = shareItineraryUrl;
  var warn = document.getElementById('shareLocalhostWarn');
  if (warn) {
    var isLocal = /localhost|127\.0\.0\.1|^http:\/\/(192\.168\.|10\.)/.test(shareItineraryUrl);
    warn.style.display = isLocal ? 'block' : 'none';
  }
  const modal = document.getElementById('shareItineraryModal');
  if (modal) modal.classList.add('show');
}

function closeShareItineraryModal() {
  document.getElementById('shareItineraryModal')?.classList.remove('show');
}

function shareViaFacebook() {
  const u = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareItineraryUrl);
  window.open(u, '_blank', 'width=600,height=400');
  toast(t('itinerary_share_copied'));
}

function shareViaLine() {
  const u = 'https://line.me/R/msg/text/?' + encodeURIComponent(shareItineraryTitle + ' ' + shareItineraryUrl);
  window.open(u, '_blank', 'width=600,height=400');
  toast(t('itinerary_share_copied'));
}

function shareViaTwitter() {
  const u = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareItineraryTitle) + '&url=' + encodeURIComponent(shareItineraryUrl);
  window.open(u, '_blank', 'width=600,height=400');
  toast(t('itinerary_share_copied'));
}

function copyShareLink() {
  navigator.clipboard.writeText(shareItineraryUrl).then(() => {
    toast(t('itinerary_share_copied'));
  }).catch(() => {
    const inp = document.createElement('input');
    inp.value = shareItineraryUrl; document.body.appendChild(inp); inp.select();
    document.execCommand('copy'); document.body.removeChild(inp);
    toast(t('itinerary_share_copied'));
  });
}

/* ===== Itinerary Detail Panel ===== */

async function openItineraryDetail(id) {
  try {
    const r = await apiCall('GET', '/itineraries/' + id);
    if (!r.success || !r.data) { toast(t('error'), 'error'); return; }
    state.currentItinerary = r.data;
    document.getElementById('itineraryDetailTitle').textContent = r.data.title || '';
    document.getElementById('tripHeaderTitle').textContent = r.data.title || 'Good Morning';
    document.getElementById('tripHeaderSubtitle').textContent = formatTripSubtitle(r.data);
    document.getElementById('tripNotesInput').value = r.data.activity_content || '';
    document.getElementById('tripDetailsContent').innerHTML = formatTripDetails(r.data);
    switchTripTab('planning');
    renderItineraryItems(r.data.items || []);
    showReminderBanner(r.data.items || []);
    startReminderChecker();
    showPanel('itineraryDetailPanel');
  } catch (e) {
    toast(t('error'), 'error');
  }
}

function showReminderBanner(items) {
  var el = document.getElementById('tripReminderBanner');
  if (!el) return;
  var today = new Date().toISOString().slice(0, 10);
  var reminders = [];
  (items || []).forEach(function(it, i) {
    if (it.reminder_date && it.reminder_date === today) {
      reminders.push({ name: itineraryItemName(it, i), time: it.reminder_time || '', notes: (it.notes || '').substring(0, 80) });
    }
  });
  if (reminders.length === 0) {
    el.style.display = 'none';
    el.innerHTML = '';
    return;
  }
  el.innerHTML = '<i class="fas fa-bell"></i><div><strong>เตือนวันนี้ (' + reminders.length + ')</strong>' +
    reminders.map(function(r) {
      return '<div style="margin-top:6px;font-size:12px">' + esc(r.name) + (r.time ? ' เวลา ' + r.time : '') + (r.notes ? ' – ' + esc(r.notes) : '') + '</div>';
    }).join('') + '</div>';
  el.style.display = 'flex';
}

var reminderCheckInterval = null;

function startReminderChecker() {
  if (reminderCheckInterval) clearInterval(reminderCheckInterval);
  reminderCheckInterval = setInterval(function() {
    var plan = state.currentItinerary;
    if (!plan || !plan.items) return;
    var now = new Date();
    var today = now.toISOString().slice(0, 10);
    var currentTime = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
    var planId = (plan.id || '').toString();
    plan.items.forEach(function(it, i) {
      if (it.reminder_date === today && it.reminder_time === currentTime) {
        var key = 'bh_reminder_' + planId + '_' + i + '_' + today + '_' + (it.reminder_time || '');
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
        var name = itineraryItemName(it, i);
        var msg = name + (it.notes ? ': ' + (it.notes || '').substring(0, 60) : '');
        toast(msg, 'info');
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('เตือน: ' + name, { body: it.notes || 'ถึงเวลากิจกรรมนี้แล้ว' });
          } catch (e) {}
        }
      }
    });
  }, 60000);
}

function stopReminderChecker() {
  if (reminderCheckInterval) clearInterval(reminderCheckInterval);
  reminderCheckInterval = null;
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function formatTripSubtitle(data) {
  const parts = [];
  if (data.trip_date_start) parts.push(data.trip_date_start);
  if (data.trip_date_end && data.trip_date_end !== data.trip_date_start) parts.push(' - ' + data.trip_date_end);
  if (data.location) parts.push(' · ' + data.location);
  return parts.length ? parts.join('') : (data.description || 'We wish you have a good day!');
}

function formatTripDetails(data) {
  const lines = [];
  if (data.description) lines.push('<p><strong>รายละเอียด:</strong> ' + esc(data.description) + '</p>');
  if (data.location) lines.push('<p><strong>สถานที่:</strong> ' + esc(data.location) + '</p>');
  if (data.trip_date_start) lines.push('<p><strong>วันที่:</strong> ' + esc(data.trip_date_start) + (data.trip_date_end && data.trip_date_end !== data.trip_date_start ? ' - ' + esc(data.trip_date_end) : '') + '</p>');
  return lines.length ? lines.join('') : '<p style="color:#94a3b8">ยังไม่มีรายละเอียด</p>';
}

function switchTripTab(tab) {
  document.querySelectorAll('.trip-tab').forEach(function(b) { b.classList.toggle('active', b.dataset.tab === tab); });
  document.getElementById('tripTabPlanning').style.display = tab === 'planning' ? 'block' : 'none';
  document.getElementById('tripTabDetails').style.display = tab === 'details' ? 'block' : 'none';
  document.getElementById('tripTabNotes').style.display = tab === 'notes' ? 'block' : 'none';
}

async function saveTripNotes() {
  var plan = state.currentItinerary;
  if (!plan) return;
  var notes = (document.getElementById('tripNotesInput').value || '').trim();
  try {
    var r = await apiCall('PUT', '/itineraries/' + plan.id, { activity_content: notes });
    if (r.success) {
      state.currentItinerary.activity_content = notes;
      toast(t('save') || 'บันทึกแล้ว');
    } else toast(r.message || t('error'), 'error');
  } catch (e) {
    toast(t('error'), 'error');
  }
}

function closeItineraryDetail() {
  stopReminderChecker();
  state.currentItinerary = null;
}

function itineraryItemName(it, i) {
  return it.activity_name || it.place_name || it.title || it.tour_name || it.boat_name || ('รายการ ' + (i + 1));
}

function activityTypeIcon(type) {
  const icons = { boat_tour: 'fa-ship', temple: 'fa-landmark', restaurant: 'fa-utensils', hotel: 'fa-hotel', transport: 'fa-car', other: 'fa-map-marker-alt' };
  return icons[type] || 'fa-map-marker-alt';
}

function activityTypeLabel(type) {
  const labels = { boat_tour: 'Boat Tour', temple: 'Temple Visit', restaurant: 'Restaurant', hotel: 'Hotel', transport: 'Transport', other: 'อื่นๆ' };
  return labels[type] || type || 'อื่นๆ';
}

function sortItemsByTime(items) {
  if (!items || items.length === 0) return items;
  return items.slice().sort(function(a, b) {
    var ta = a.start_time || a.time || '';
    var tb = b.start_time || b.time || '';
    if (ta && tb) return ta.localeCompare(tb);
    if (ta) return -1;
    if (tb) return 1;
    return 0;
  });
}

function renderItineraryItems(items) {
  const el = document.getElementById('itineraryItemsList');
  const emptyEl = document.getElementById('tripEmptyState');
  if (!el) return;
  if (!items || items.length === 0) {
    el.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';
  var sorted = sortItemsByTime(items);
  el.innerHTML = sorted.map(function(it, idx) {
    var origIdx = items.indexOf(it);
    var name = itineraryItemName(it, origIdx);
    var timeVal = it.start_time || it.time || '';
    var timeEnd = it.end_time || '';
    if (timeVal && timeVal.indexOf('-') >= 0) {
      var p = timeVal.split('-');
      timeVal = (p[0] || '').trim();
      timeEnd = (p[1] || '').trim();
    }
    var timeStr = timeVal ? (timeVal + (timeEnd ? ' - ' + timeEnd : '')) : '';
    var loc = it.location || it.place_name || '';
    var type = it.type || 'other';
    var icon = activityTypeIcon(type);
    var hasReminder = !!(it.reminder_date || it.reminder_time);
    var reminderBadge = hasReminder ? '<span class="activity-reminder-badge" title="เตือน ' + (it.reminder_date || '') + ' ' + (it.reminder_time || '') + '"><i class="fas fa-bell"></i></span>' : '';
    var isDone = !!(it.completed || it.done);
    var doneClass = isDone ? ' done' : '';
    var typeClass = ' type-' + (type || 'other');
    var doneCheck = '<button type="button" class="activity-done-check' + (isDone ? ' checked' : '') + '" onclick="toggleActivityDone(' + origIdx + ')" title="' + (isDone ? 'ยกเลิก (ยังไม่จัดการ)' : 'ติ๊กเมื่อเตรียมของ/ทำเสร็จแล้ว') + '" aria-label="' + (isDone ? 'จัดการแล้ว' : 'ยังไม่จัดการ') + '">' + (isDone ? '<i class="fas fa-check"></i>' : '') + '</button>';
    var reminders = it.notes_reminders || [];
    var remindersPreview = '';
    if (reminders.length > 0) {
      var toShow = reminders.slice(0, 2);
      remindersPreview = '<div class="activity-reminders-preview">' + toShow.map(function(r) {
        var txt = (r.text || '').trim();
        if (txt.length > 24) txt = txt.substring(0, 24) + '…';
        var cls = r.completed ? ' done' : '';
        return '<span class="reminder-preview-item' + cls + '"><i class="far fa-' + (r.completed ? 'check-circle' : 'circle') + '" style="font-size:9px;margin-right:5px;opacity:.9"></i>' + esc(txt) + '</span>';
      }).join('') + '</div>';
    }
    return '<div class="timeline-item">' +
      '<div class="timeline-time">' + (timeStr ? '<i class="far fa-clock"></i> ' + esc(timeStr) : '') + '</div>' +
      '<div class="timeline-activity' + typeClass + doneClass + '">' +
        '<div style="display:flex;align-items:flex-start;gap:0">' + doneCheck + '<div style="flex:1;min-width:0"><span class="activity-type-icon"><i class="fas ' + icon + '"></i></span><h4>' + esc(name) + reminderBadge + '</h4></div></div>' +
        (loc ? '<p><i class="fas fa-map-pin"></i> ' + esc(loc) + '</p>' : '') +
        remindersPreview +
        '<div class="act-btns">' +
          '<button type="button" onclick="editItineraryItem(' + origIdx + ')"><i class="fas fa-edit"></i> Details</button>' +
          '<button type="button" onclick="openActivityNotesModal(' + origIdx + ')"><i class="fas fa-sticky-note"></i> Notes</button>' +
          '<button type="button" onclick="removeItemFromItinerary(' + origIdx + ')" style="background:rgba(255,255,255,.4);margin-left:auto"><i class="fas fa-trash"></i></button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

async function toggleActivityDone(index) {
  var plan = state.currentItinerary;
  if (!plan || !plan.items || !plan.items[index]) return;
  var items = plan.items.slice();
  var it = Object.assign({}, items[index]);
  it.completed = !it.completed;
  items[index] = it;
  try {
    var r = await apiCall('PUT', '/itineraries/' + plan.id, { items: items });
    if (r.success) {
      state.currentItinerary.items = items;
      renderItineraryItems(items);
      toast(it.completed ? 'ติ๊กแล้ว' : 'ยกเลิกติ๊ก');
    } else toast(r.message || t('error'), 'error');
  } catch (e) {
    toast(t('error'), 'error');
  }
}

async function removeItemFromItinerary(index) {
  const plan = state.currentItinerary;
  if (!plan || !plan.items) return;
  const items = [...plan.items];
  items.splice(index, 1);
  try {
    const r = await apiCall('PUT', '/itineraries/' + plan.id, { items });
    if (r.success) {
      state.currentItinerary.items = items;
      renderItineraryItems(items);
      toast(t('itinerary_remove_item') || 'ลบแล้ว');
    } else toast(r.message || t('error'), 'error');
  } catch (e) {
    toast(t('error'), 'error');
  }
}

/* ===== Add/Edit Activity in Itinerary ===== */

let addTourSearchTimeout = null;
let editingActivityIndex = null;

function openAddActivityModal(itemIndex) {
  if (!state.currentItinerary) return;
  editingActivityIndex = itemIndex;
  switchActivityTab('free');
  document.getElementById('activityPlace').value = '';
  document.getElementById('activityTimeStart').value = '';
  document.getElementById('activityTimeEnd').value = '';
  document.getElementById('activityDesc').value = '';
  var typeEl = document.getElementById('activityType');
  if (typeEl) typeEl.value = 'boat_tour';
  state.mapPickCoords = null;
  state.activityPlaceName = '';
  state.activityLat = null;
  state.activityLng = null;
  document.getElementById('activityPickedLocation').style.display = 'none';
  var dd = document.getElementById('activityLocDropdown');
  if (dd) { dd.style.display = 'none'; dd.innerHTML = ''; }
  if (itemIndex != null && state.currentItinerary.items && state.currentItinerary.items[itemIndex]) {
    var it = state.currentItinerary.items[itemIndex];
    document.getElementById('activityPlace').value = it.place_name || it.location || it.title || it.tour_name || it.boat_name || '';
    state.activityPlaceName = it.place_name || it.location || it.title || '';
    state.activityLat = it.lat;
    state.activityLng = it.lng;
    if (typeEl && it.type) typeEl.value = it.type;
    var timeVal = it.start_time || it.time || '';
    var timeEnd = it.end_time || '';
    if (timeVal && timeVal.indexOf('-') >= 0) {
      var parts = timeVal.split('-');
      document.getElementById('activityTimeStart').value = (parts[0] || '').trim();
      document.getElementById('activityTimeEnd').value = (parts[1] || '').trim();
    } else {
      document.getElementById('activityTimeStart').value = timeVal.trim();
      document.getElementById('activityTimeEnd').value = timeEnd || '';
    }
    document.getElementById('activityDesc').value = it.description || '';
    state.activityTime = it.time || '';
    if (it.lat != null && it.lng != null) {
      state.mapPickCoords = { lat: it.lat, lng: it.lng };
      document.getElementById('activityPickedLocation').textContent = it.lat.toFixed(5) + ', ' + it.lng.toFixed(5);
      document.getElementById('activityPickedLocation').style.display = 'block';
    }
  }
  document.getElementById('addActivityModal').classList.add('show');
}

function updateActivityPlace(val) {
  state.activityPlaceName = val || '';
}

function searchLocationForActivity(query) {
  if (!query || query.length < 2) return;
  if (state.locationSearchTimeout) clearTimeout(state.locationSearchTimeout);
  state.locationSearchTimeout = setTimeout(function() {
    var dd = document.getElementById('activityLocDropdown');
    if (dd) { dd.innerHTML = '<div style="padding:12px;font-size:13px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> กำลังค้นหา...</div>'; dd.style.display = 'block'; }
    var url = API + '/geocode?q=' + encodeURIComponent(query);
    fetch(url).then(function(r) { return r.json(); }).then(function(res) {
      var data = (res && res.success && res.data) ? res.data : [];
      dd = document.getElementById('activityLocDropdown');
      if (!dd) return;
      if (!data || data.length === 0) {
        dd.innerHTML = '<div style="padding:12px;font-size:13px;color:#94a3b8">ไม่พบผลลัพธ์ - ลองพิมพ์ชื่อสถานที่หรือจังหวัด</div>';
        dd.style.display = 'block';
        return;
      }
      dd.innerHTML = data.map(function(p) {
        var name = p.display_name || p.name || '';
        return '<div class="plan-slot-search-item" data-lat="' + p.lat + '" data-lng="' + p.lon + '" data-name="' + esc(name) + '" onclick="selectActivityLocation(this.getAttribute(\'data-name\'), this.getAttribute(\'data-lat\'), this.getAttribute(\'data-lng\'))" style="padding:10px 12px;margin:2px 0;border-radius:8px;cursor:pointer;font-size:13px;background:#f8fafc">' + esc(name.substring(0, 80)) + '</div>';
      }).join('');
      dd.style.display = 'block';
    }).catch(function() {
      var dd = document.getElementById('activityLocDropdown');
      if (dd) { dd.innerHTML = '<div style="padding:12px;font-size:13px;color:#94a3b8">ไม่สามารถค้นหาได้</div>'; dd.style.display = 'block'; }
    });
  }, 400);
}

function selectActivityLocation(name, lat, lng) {
  state.activityPlaceName = name || '';
  state.activityLat = lat ? parseFloat(lat) : null;
  state.activityLng = lng ? parseFloat(lng) : null;
  document.getElementById('activityPlace').value = name || '';
  var dd = document.getElementById('activityLocDropdown');
  if (dd) dd.style.display = 'none';
  if (state.activityLat != null && state.activityLng != null) {
    state.mapPickCoords = { lat: state.activityLat, lng: state.activityLng };
    document.getElementById('activityPickedLocation').textContent = state.activityLat.toFixed(5) + ', ' + state.activityLng.toFixed(5);
    document.getElementById('activityPickedLocation').style.display = 'block';
  }
}

function updateActivityTime() {
  var startEl = document.getElementById('activityTimeStart');
  var endEl = document.getElementById('activityTimeEnd');
  if (!startEl) return;
  var start = (startEl.value || '').trim();
  var end = (endEl && endEl.value) ? endEl.value.trim() : '';
  state.activityTime = start;
  if (end && end !== start) state.activityTime = start + '-' + end;
}

function closeAddActivityModal() {
  document.getElementById('addActivityModal')?.classList.remove('show');
  editingActivityIndex = null;
}

function switchActivityTab(tab) {
  const freeEl = document.getElementById('activityFreeForm');
  const tourEl = document.getElementById('activityTourForm');
  const freeBtn = document.getElementById('activityTabFree');
  const tourBtn = document.getElementById('activityTabTour');
  if (tab === 'free') {
    freeEl.style.display = 'flex';
    tourEl.style.display = 'none';
    freeBtn?.classList.add('active');
    tourBtn?.classList.remove('active');
  } else {
    freeEl.style.display = 'none';
    tourEl.style.display = 'flex';
    freeBtn?.classList.remove('active');
    tourBtn?.classList.add('active');
    document.getElementById('addTourSearchInput').value = '';
    searchToursForItinerary('');
  }
}

function editItineraryItem(index) {
  openAddActivityModal(index);
}

/* ===== Activity Notes (บันทึกเฉพาะกิจกรรม) ===== */
var editingNotesActivityIndex = null;
var stateNotesReminders = [];

function openActivityNotesModal(index) {
  var plan = state.currentItinerary;
  if (!plan || !plan.items || !plan.items[index]) return;
  editingNotesActivityIndex = index;
  var it = plan.items[index];
  var name = itineraryItemName(it, index);
  document.getElementById('activityNotesModalTitle').textContent = name;
  document.getElementById('activityNotesInput').value = it.notes || '';
  document.getElementById('activityReminderDate').value = it.reminder_date || '';
  document.getElementById('activityReminderTime').value = it.reminder_time || '';
  stateNotesReminders = Array.isArray(it.notes_reminders) ? it.notes_reminders.map(function(r) { return { text: r.text || '', completed: !!r.completed }; }) : [];
  document.getElementById('activityReminderItemInput').value = '';
  renderNotesRemindersList();
  document.getElementById('activityNotesModal').classList.add('show');
}

function renderNotesRemindersList() {
  var el = document.getElementById('activityNotesRemindersList');
  if (!el) return;
  if (stateNotesReminders.length === 0) {
    el.innerHTML = '<p style="font-size:12px;color:#94a3b8;padding:8px 0">ยังไม่มีรายการ · พิมพ์ด้านบนแล้วกด +</p>';
    return;
  }
  el.innerHTML = stateNotesReminders.map(function(r, i) {
    var cls = r.completed ? ' notes-reminder-done' : '';
    return '<div class="notes-reminder-row' + cls + '">' +
      '<button type="button" class="notes-reminder-check' + (r.completed ? ' checked' : '') + '" onclick="toggleNotesReminderItem(' + i + ')" title="ติ๊กเมื่อทำเสร็จ">' + (r.completed ? '<i class="fas fa-check"></i>' : '') + '</button>' +
      '<span class="notes-reminder-text">' + esc(r.text) + '</span>' +
      '<button type="button" class="notes-reminder-remove" onclick="removeNotesReminderItem(' + i + ')" title="ลบ"><i class="fas fa-times"></i></button>' +
    '</div>';
  }).join('');
}

function addNotesReminderItem() {
  var inp = document.getElementById('activityReminderItemInput');
  var text = (inp && inp.value || '').trim();
  if (!text) return;
  stateNotesReminders.push({ text: text, completed: false });
  if (inp) inp.value = '';
  renderNotesRemindersList();
}

function toggleNotesReminderItem(index) {
  if (!stateNotesReminders[index]) return;
  stateNotesReminders[index].completed = !stateNotesReminders[index].completed;
  renderNotesRemindersList();
}

function removeNotesReminderItem(index) {
  stateNotesReminders.splice(index, 1);
  renderNotesRemindersList();
}

function closeActivityNotesModal() {
  document.getElementById('activityNotesModal')?.classList.remove('show');
  editingNotesActivityIndex = null;
}

async function saveActivityNotes() {
  if (editingNotesActivityIndex == null) return;
  var plan = state.currentItinerary;
  if (!plan || !plan.items || !plan.items[editingNotesActivityIndex]) return;
  var notes = (document.getElementById('activityNotesInput').value || '').trim();
  var reminderDate = (document.getElementById('activityReminderDate').value || '').trim() || null;
  var reminderTime = (document.getElementById('activityReminderTime').value || '').trim() || null;
  var items = plan.items.slice();
  var it = Object.assign({}, items[editingNotesActivityIndex]);
  it.notes = notes;
  it.reminder_date = reminderDate;
  it.reminder_time = reminderTime;
  it.notes_reminders = stateNotesReminders.filter(function(r) { return (r.text || '').trim(); });
  items[editingNotesActivityIndex] = it;
  if (reminderDate || reminderTime) requestNotificationPermission();
  try {
    var r = await apiCall('PUT', '/itineraries/' + plan.id, { items: items });
    if (r.success) {
      state.currentItinerary.items = items;
      renderItineraryItems(items);
      showReminderBanner(items);
      closeActivityNotesModal();
      toast(t('save') || 'บันทึกแล้ว');
    } else toast(r.message || t('error'), 'error');
  } catch (e) {
    toast(t('error'), 'error');
  }
}

function openMapPickForActivity() {
  document.getElementById('mapPickModal').classList.add('show');
  if (!state.mapPickCoords) document.getElementById('mapPickHint').textContent = 'กดบนแผนที่เพื่อเลือกตำแหน่ง';
  else document.getElementById('mapPickHint').textContent = state.mapPickCoords.lat.toFixed(5) + ', ' + state.mapPickCoords.lng.toFixed(5);
  setTimeout(initMapPickModal, 100);
}

function closeMapPickModal() {
  document.getElementById('mapPickModal')?.classList.remove('show');
  if (state.mapPickInstance) {
    state.mapPickInstance.remove();
    state.mapPickInstance = null;
  }
  state.mapPickMarker = null;
}

function initMapPickModal() {
  const container = document.getElementById('mapPickContainer');
  if (!container || typeof L === 'undefined') return;
  container.innerHTML = '<div id="mapPickLeaflet" style="width:100%;height:100%"></div>';
  const center = state.mapPickCoords ? [state.mapPickCoords.lat, state.mapPickCoords.lng] : [14.0, 100.5];
  const map = L.map('mapPickLeaflet').setView(center, state.mapPickCoords ? 14 : 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
  state.mapPickInstance = map;
  if (state.mapPickCoords) {
    state.mapPickMarker = L.marker([state.mapPickCoords.lat, state.mapPickCoords.lng]).addTo(map);
  }
  map.on('click', function(e) {
    const { lat, lng } = e.latlng;
    if (state.mapPickMarker) state.mapPickMarker.remove();
    state.mapPickMarker = L.marker([lat, lng]).addTo(map);
    state.mapPickCoords = { lat, lng };
    document.getElementById('mapPickHint').textContent = lat.toFixed(5) + ', ' + lng.toFixed(5);
  });
}

function confirmMapPick() {
  if (state.mapPickCoords) {
    state.activityLat = state.mapPickCoords.lat;
    state.activityLng = state.mapPickCoords.lng;
    if (!state.activityPlaceName) state.activityPlaceName = 'ตำแหน่งที่เลือก';
    document.getElementById('activityPlace').value = state.activityPlaceName;
    document.getElementById('activityPickedLocation').textContent = state.mapPickCoords.lat.toFixed(5) + ', ' + state.mapPickCoords.lng.toFixed(5);
    document.getElementById('activityPickedLocation').style.display = 'block';
  }
  closeMapPickModal();
  document.getElementById('addActivityModal').classList.add('show');
}

async function saveActivityFreeForm() {
  var placeName = (document.getElementById('activityPlace').value || '').trim() || state.activityPlaceName || '';
  var activity = (document.getElementById('activityDesc').value || '').trim();
  if (!placeName && !activity) { toast(t('itinerary_activity_title') || 'กรุณากรอกสถานที่หรือกิจกรรม', 'error'); return; }
  var plan = state.currentItinerary;
  if (!plan) return;
  var timeVal = state.activityTime || '';
  var startTime = '';
  var endTime = '';
  var se = document.getElementById('activityTimeStart');
  var ee = document.getElementById('activityTimeEnd');
  if (se) startTime = (se.value || '').trim();
  if (ee && ee.value) endTime = (ee.value || '').trim();
  if (!timeVal && startTime) timeVal = startTime + (endTime && endTime !== startTime ? '-' + endTime : '');
  var typeEl = document.getElementById('activityType');
  var actType = typeEl ? typeEl.value : 'other';
  var items = plan.items ? plan.items.slice() : [];
  var existingNotes = (editingActivityIndex != null && items[editingActivityIndex]) ? (items[editingActivityIndex].notes || null) : null;
  var item = {
    activity_name: activity || placeName || ('รายการ ' + (items.length + 1)),
    title: placeName || activity || ('รายการ ' + (items.length + 1)),
    description: activity || null,
    notes: existingNotes,
    time: timeVal || null,
    start_time: startTime || null,
    end_time: endTime || null,
    place_name: placeName || null,
    location: placeName || null,
    type: actType,
    lat: state.activityLat,
    lng: state.activityLng,
    sort_order: items.length
  };
  if (editingActivityIndex != null) {
    var existing = items[editingActivityIndex] || {};
    items[editingActivityIndex] = Object.assign({}, existing, item, { sort_order: existing.sort_order != null ? existing.sort_order : editingActivityIndex });
  } else {
    items.push(item);
  }
  try {
    const r = await apiCall('PUT', '/itineraries/' + plan.id, { items });
    if (r.success) {
      state.currentItinerary.items = items;
      renderItineraryItems(items);
      closeAddActivityModal();
      toast(t('save') || 'บันทึกแล้ว');
    } else toast(r.message || t('error'), 'error');
  } catch (e) {
    toast(t('error'), 'error');
  }
}

async function searchToursForItinerary(q) {
  const container = document.getElementById('addTourSearchResults');
  if (!container) return;
  if (addTourSearchTimeout) clearTimeout(addTourSearchTimeout);
  addTourSearchTimeout = setTimeout(async () => {
    container.innerHTML = '<div style="text-align:center;padding:20px"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--ocean-600)"></i></div>';
    let url = '/tours?limit=15&page=1';
    if (q) url += '&search=' + encodeURIComponent(q);
    const r = await apiCall('GET', url);
    const tours = r.success && r.data ? (r.data.tours || r.data) : [];
    const existingIds = new Set((state.currentItinerary?.items || []).map(it => Number(it.tour_id || it.boat_id)));
    if (tours.length === 0) {
      container.innerHTML = '<p style="color:#94a3b8;font-size:13px;text-align:center;padding:20px">' + t('no_trips') + '</p>';
    } else {
      container.innerHTML = tours.map(tour => {
        const tid = boatId(tour);
        const name = boatName(tour) || '';
        const place = boatLocation(tour) || '';
        const lat = tour.destination_lat ?? tour.latitude ?? tour.pier_latitude ?? '';
        const lng = tour.destination_lng ?? tour.longitude ?? tour.pier_longitude ?? '';
        const alreadyAdded = existingIds.has(Number(tid));
        return '<div class="nearby-card" style="margin:0;opacity:' + (alreadyAdded ? 0.6 : 1) + '">' +
          '<div class="nearby-card-image" style="width:64px;height:64px"><img src="' + tourImage(tour) + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:12px"></div>' +
          '<div class="nearby-card-body" style="flex:1;min-width:0;padding:4px 0">' +
            '<div style="font-weight:600;font-size:13px">' + esc(name) + '</div>' +
            '<div style="font-size:11px;color:#94a3b8">' + esc(place) + ' · ' + formatPrice(tour.price) + '</div>' +
          '</div>' +
          (alreadyAdded ? '<span style="font-size:11px;color:#94a3b8;align-self:center">เพิ่มแล้ว</span>' :
            '<button onclick="addTourToItineraryFromEl(this)" data-tour-id="' + tid + '" data-tour-name="' + esc(name) + '" data-tour-place="' + esc(place) + '" data-tour-lat="' + (lat || '') + '" data-tour-lng="' + (lng || '') + '" class="btn-primary" style="padding:6px 12px;font-size:12px"><i class="fas fa-plus"></i></button>') +
        '</div>';
      }).join('');
    }
  }, 300);
}

function addTourToItineraryFromEl(btn) {
  const tourId = btn.getAttribute('data-tour-id');
  const tourName = btn.getAttribute('data-tour-name') || '';
  const tourPlace = btn.getAttribute('data-tour-place') || '';
  const tourLat = btn.getAttribute('data-tour-lat');
  const tourLng = btn.getAttribute('data-tour-lng');
  if (tourId) addTourToItinerary({ tourId, tourName, place: tourPlace, lat: tourLat ? parseFloat(tourLat) : null, lng: tourLng ? parseFloat(tourLng) : null });
}

async function addTourToItinerary(opts) {
  const plan = state.currentItinerary;
  if (!plan) return;
  const items = [...(plan.items || [])];
  const item = {
    title: opts.tourName || '',
    tour_id: Number(opts.tourId || 0),
    tour_name: opts.tourName || '',
    place_name: opts.place || null,
    lat: opts.lat || null,
    lng: opts.lng || null,
    sort_order: items.length
  };
  items.push(item);
  try {
    const r = await apiCall('PUT', '/itineraries/' + plan.id, { items });
    if (r.success) {
      state.currentItinerary.items = items;
      renderItineraryItems(items);
      closeAddActivityModal();
      toast(t('itinerary_add_tour') || 'เพิ่มแล้ว');
    } else toast(r.message || t('error'), 'error');
  } catch (e) {
    toast(t('error'), 'error');
  }
}

async function addCurrentTourToItinerary() {
  const tour = state.currentTour;
  if (!tour) return;
  if (!requireLogin()) return;
  const tourId = boatId(tour);
  const tourName = boatName(tour) || '';
  try {
    const r = await apiCall('GET', '/itineraries');
    const list = (r.success && r.data) ? r.data : [];
    if (list.length === 0) {
      openItineraryModal();
      document.getElementById('itineraryTitle').value = tourName || 'แผนใหม่';
      document.getElementById('itineraryDesc').value = '';
      state.pendingAddTour = { tourId, tourName };
      showPanel('itineraryPanel');
      closePanel('tourDetailPanel');
    } else {
      const div = document.createElement('div');
      div.id = 'selectPlanModal';
      div.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:20px';
      div.innerHTML = '<div style="background:#fff;border-radius:16px;padding:24px;max-width:360px;width:100%;max-height:80vh;overflow-y:auto">' +
        '<h3 style="margin:0 0 16px">' + t('itinerary_add_tour') + '</h3>' +
        '<p style="font-size:13px;color:#64748b;margin-bottom:16px">เลือกแผนที่จะเพิ่มทัวร์</p>' +
        '<div id="selectPlanList" style="display:flex;flex-direction:column;gap:8px"></div>' +
        '<button class="btn-secondary" style="width:100%;margin-top:16px" onclick="document.getElementById(\'selectPlanModal\').remove()">ยกเลิก</button></div>';
      document.body.appendChild(div);
      const listEl = document.getElementById('selectPlanList');
      listEl.innerHTML = list.map(p => '<button class="nearby-card" style="margin:0;cursor:pointer;text-align:left;border:none;font-family:inherit" onclick="addTourToPlanAndCloseEl(this)" data-plan-id="' + p.id + '" data-tour-id="' + tourId + '" data-tour-name="' + esc(tourName) + '"><div><strong>' + esc(p.title || '') + '</strong></div></button>').join('');
    }
  } catch (e) {
    toast(t('error'), 'error');
  }
}

function addTourToPlanAndCloseEl(btn) {
  const planId = btn.getAttribute('data-plan-id');
  const tourId = btn.getAttribute('data-tour-id');
  const tourName = btn.getAttribute('data-tour-name') || '';
  if (planId && tourId) addTourToPlanAndClose(planId, tourId, tourName);
}

async function addTourToPlanAndClose(planId, tourId, tourName) {
  try {
    const r = await apiCall('GET', '/itineraries/' + planId);
    if (!r.success || !r.data) throw new Error();
    const items = [...(r.data.items || [])];
    items.push({ title: tourName || '', tour_id: Number(tourId), tour_name: tourName || '', sort_order: items.length });
    const u = await apiCall('PUT', '/itineraries/' + planId, { items });
    if (u.success) {
      document.getElementById('selectPlanModal')?.remove();
      toast(t('itinerary_add_tour') || 'เพิ่มลงแผนแล้ว');
    } else toast(u.message || t('error'), 'error');
  } catch (e) {
    toast(t('error'), 'error');
  }
}

/* ===== Init ===== */

/**
 * UAT: แผงเต็มจอมักดัก hit-test ทับเมนูล่าง (กดซ้าย→ขวาไม่ติด)
 * ใช้ getComputedStyle + ตรวจโมดัลที่มองเห็น + pointerdown + touchend + กันซ้ำสั้นๆ
 */
function initBottomNavPointerFix() {
  if (window.__bnPointerFixBound) return;
  window.__bnPointerFixBound = true;
  var lastSynthAt = 0;
  var lastSynthKey = '';

  function isBlockingOverlay(el) {
    if (!el || !el.closest) return false;
    var mo = el.closest('.modal-overlay');
    if (mo) {
      var s = getComputedStyle(mo);
      if (s.display !== 'none' && s.visibility !== 'hidden') return true;
    }
    var opM = document.getElementById('opBookingDetailModal');
    if (opM && opM.contains(el)) {
      var s2 = getComputedStyle(opM);
      if (s2.display !== 'none' && s2.visibility !== 'hidden') return true;
    }
    if (el.closest('#selectPlanModal') || el.closest('#sharedItineraryModal')) return true;
    return false;
  }

  /** คืนปุ่มเมนูที่พิกัดชี้ ถ้าควรส่งคลิกแทนเลเยอร์บน (slide-panel ทับเมนู) */
  function findStealTargetButton(clientX, clientY) {
    var nav = document.getElementById('bottomNav');
    if (!nav) return null;
    var navStyle = getComputedStyle(nav);
    if (navStyle.display === 'none' || navStyle.visibility === 'hidden') return null;
    var splash = document.getElementById('splashScreen');
    if (splash && !splash.classList.contains('hide')) return null;
    var r = nav.getBoundingClientRect();
    var x = clientX;
    var y = clientY;
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
    var top = document.elementFromPoint(x, y);
    if (!top) return null;
    if (nav.contains(top)) return null;
    if (isBlockingOverlay(top)) return null;
    var customerNav = document.getElementById('bottomNavCustomer');
    var partnerNav = document.getElementById('bottomNavPartner');
    var cVis = customerNav && getComputedStyle(customerNav).display !== 'none';
    var activeWrap = cVis ? customerNav : partnerNav;
    if (!activeWrap) return null;
    var items = activeWrap.querySelectorAll('.nav-item');
    for (var i = 0; i < items.length; i++) {
      var btn = items[i];
      var br = btn.getBoundingClientRect();
      if (x >= br.left && x <= br.right && y >= br.top && y <= br.bottom) return btn;
    }
    return null;
  }

  function trySyntheticNavClick(clientX, clientY, e) {
    var btn = findStealTargetButton(clientX, clientY);
    if (!btn) return false;
    var key = (btn.id || 'navbtn') + ':' + Math.round(clientX / 8) + ':' + Math.round(clientY / 8);
    var now = Date.now();
    if (now - lastSynthAt < 380 && lastSynthKey === key) return true;
    lastSynthAt = now;
    lastSynthKey = key;
    if (e) {
      if (e.cancelable) e.preventDefault();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    }
    setTimeout(function() {
      try {
        btn.click();
      } catch (err) {
        console.error('bottomNav hit fix', err);
      }
    }, 0);
    return true;
  }

  document.addEventListener('pointerdown', function(e) {
    if (e.button != null && e.button !== 0) return;
    trySyntheticNavClick(e.clientX, e.clientY, e);
  }, { capture: true, passive: false });

  document.addEventListener('touchend', function(e) {
    var t = e.changedTouches && e.changedTouches[0];
    if (!t) return;
    trySyntheticNavClick(t.clientX, t.clientY, e);
  }, { capture: true, passive: false });
}

function initApp() {
  initBottomNavPointerFix();
  const params = new URLSearchParams(window.location.search);
  if (params.get('clear_session') === '1') {
    state.token = null;
    state.user = null;
    localStorage.removeItem('bh_token');
    localStorage.removeItem('bh_user');
    localStorage.removeItem('bh_operator_token');
    localStorage.removeItem('bh_operator_user');
    window.history.replaceState({}, '', window.location.pathname + (window.location.hash || ''));
    updateAuthUI();
  }
  const token = params.get('token');
  if (token) {
    state.token = token;
    localStorage.setItem('bh_token', token);
    window.history.replaceState({}, '', window.location.pathname + (window.location.hash || ''));
    apiCall('GET', '/auth/me').then(r => {
      if (r.success && r.data) {
        state.user = r.data;
        localStorage.setItem('bh_user', JSON.stringify(r.data));
        toast(t('auth_login_success'));
      } else {
        state.token = null;
        localStorage.removeItem('bh_token');
      }
      updateAuthUI();
      loadHome();
      if (isLoggedIn()) loadFavoriteIds();
    }).catch(() => {
      state.token = null;
      localStorage.removeItem('bh_token');
      updateAuthUI();
      loadHome();
    });
  }
  setTimeout(() => {
    const splash = document.getElementById('splashScreen');
    if (splash) splash.classList.add('hide');
  }, 1200);
  document.addEventListener('click', function(e) {
    var t = e.target;
    if (t.closest('[id^="planSlotLocDropdown_"]') || t.closest('input[id^="planSlotLoc_"]')) return;
    if (t.closest('#activityLocDropdown') || t.closest('#activityPlace')) return;
    document.querySelectorAll('[id^="planSlotLocDropdown_"]').forEach(function(el) { el.style.display = 'none'; });
    var ad = document.getElementById('activityLocDropdown');
    if (ad) ad.style.display = 'none';
  });
  applyTranslations();
  if (!token) {
    loadHome();
    updateAuthUI();
    if (isLoggedIn()) {
      if (!state.user) {
        apiCall('GET', '/auth/me').then(function(r) {
          if (r.success && r.data) {
            state.user = r.data;
            localStorage.setItem('bh_user', JSON.stringify(r.data));
            updateAuthUI();
          }
        }).catch(function() {});
      }
      loadFavoriteIds();
    }
  }
  initOAuthButtons();
  const itineraryToken = new URLSearchParams(window.location.search).get('itinerary');
  if (itineraryToken) loadSharedItinerary(itineraryToken);
}

async function loadSharedItinerary(token) {
  try {
    const r = await fetch(API + '/itineraries/shared/' + encodeURIComponent(token));
    const data = r.ok ? await r.json() : null;
    if (data && data.success && data.data) {
      const p = data.data;
      const items = p.items || [];
      const listHtml = items.length ? '<div style="margin-top:12px"><div style="font-size:12px;font-weight:600;color:#64748b;margin-bottom:8px">รายการกิจกรรม</div><ul style="margin:0;padding:0;list-style:none">' + items.map((it, i) => {
        const name = it.place_name || it.title || it.tour_name || it.boat_name || ('รายการ ' + (i+1));
        const timeStr = it.time ? ' <span style="color:var(--ocean-600);font-size:12px">' + esc(it.time) + '</span>' : '';
        const descStr = it.description ? ' <span style="color:#94a3b8;font-size:12px">· ' + esc(it.description) + '</span>' : '';
        const mapLink = (it.lat != null && it.lng != null) ? ' <a href="https://www.google.com/maps?q=' + it.lat + ',' + it.lng + '" target="_blank" style="font-size:11px;color:var(--ocean-600)">ดูแผนที่</a>' : '';
        return '<li style="margin:8px 0;padding:8px 0;border-bottom:1px solid #f1f5f9">#' + (i+1) + ' ' + esc(name) + timeStr + descStr + mapLink + '</li>';
      }).join('') + '</ul></div>' : '<p style="color:#94a3b8;font-size:13px;margin-top:8px">ยังไม่มีรายการในแผน</p>';
      const div = document.createElement('div');
      div.id = 'sharedItineraryModal';
      div.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:20px';
      div.innerHTML = '<div style="background:#fff;border-radius:16px;padding:24px;max-width:400px;width:100%;max-height:85vh;overflow-y:auto"><h3 style="margin:0 0 8px">' + esc(p.title || '') + '</h3>' + (p.description ? '<p style="color:#64748b;font-size:14px;margin:0">' + esc(p.description) + '</p>' : '') + listHtml + '<button class="btn btn-primary" style="width:100%;margin-top:20px" onclick="document.getElementById(\'sharedItineraryModal\').remove();window.history.replaceState({},\'\',location.pathname)">ปิด</button></div>';
      document.body.appendChild(div);
    }
    window.history.replaceState({}, '', window.location.pathname + (window.location.hash || ''));
  } catch (e) {}
}

function safeInit() {
  try {
    initApp();
  } catch (e) {
    console.error('initApp error:', e);
    var s = document.getElementById('splashScreen');
    if (s) s.classList.add('hide');
  }
}
setTimeout(function() {
  var s = document.getElementById('splashScreen');
  if (s && !s.classList.contains('hide')) s.classList.add('hide');
}, 2500);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  safeInit();
} else {
  window.addEventListener('load', safeInit);
}
