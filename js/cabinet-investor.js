/* ============================================================
   CABINET-INVESTOR.JS — Investor Cabinet logic
   Hotel Investment Portfolio · Uzbekistan
   ============================================================ */
'use strict';

/* ── Demo mode data (used when Supabase not configured) ───── */
const DEMO_USER = {
  id: 'demo-investor-001',
  email: 'investor@silkroute.uz',
  name: 'Silk Route Capital',
  role: 'investor',
  country: 'Узбекистан',
  aum: '50-200m',
  type: 'pe_fund',
};

const DEMO_WATCHLIST = [
  { id: 1, hotel_name: 'Samarqand Universal Bouilding', region: 'Самарканд', stars: 5, iri_score: 'A+', added_at: '2026-08-10' },
  { id: 2, hotel_name: 'ASMALD', region: 'Ташкент', stars: 4, iri_score: 'A', added_at: '2026-08-12' },
  { id: 3, hotel_name: 'Silk Road Resort & Spa', region: 'Чарвак', stars: 4, iri_score: 'B+', added_at: '2026-08-15' },
];

/* ── State ────────────────────────────────────────────────── */
let currentUser  = null;
let watchlistData = [];
let isDemoMode   = false;

/* ── Boot ────────────────────────────────────────────────────*/
document.addEventListener('DOMContentLoaded', async () => {
  const savedSession = localStorage.getItem('hip_active_session') || localStorage.getItem('hip_investor_session');
  let restoredUser = null;
  if (savedSession) {
    try {
      const parsed = JSON.parse(savedSession);
      restoredUser = parsed.user || parsed;
    } catch (e) {}
  }

  if (restoredUser) {
    currentUser = { ...DEMO_USER, ...restoredUser };
    enterDashboard(currentUser);
  } else {
    enterDemo();
  }

  const demoBtn = document.getElementById('demo-login-btn');
  if (demoBtn) {
    demoBtn.addEventListener('click', () => enterDemo());
  }

  initAuthForms();
});

/* ── Auth Tab Switcher ────────────────────────────────────── */
function initAuthForms() {
  document.querySelectorAll('.auth-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const signinWrap = document.getElementById('signin-form-wrap');
      const signupWrap = document.getElementById('signup-form-wrap');
      if (signinWrap) signinWrap.style.display = tab === 'signin' ? 'block' : 'none';
      if (signupWrap) signupWrap.style.display = tab === 'signup' ? 'block' : 'none';
    });
  });

  // Sign In
  document.getElementById('signin-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('signin-email')?.value.trim() || 'investor@silkroute.uz';
    const btn = document.getElementById('signin-submit');
    if (btn) btn.textContent = 'Вход...';

    currentUser = { ...DEMO_USER, email, name: email.split('@')[0] };
    localStorage.setItem('hip_investor_session', JSON.stringify({ user: currentUser }));
    localStorage.setItem('hip_active_session', JSON.stringify({ user: currentUser }));
    enterDashboard(currentUser);
    if (btn) btn.textContent = 'Войти в кабинет';
  });

  // Sign Up
  document.getElementById('signup-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('signup-name')?.value.trim() || 'Инвестор';
    const email = document.getElementById('signup-email')?.value.trim() || 'investor@hip.uz';
    const country = document.getElementById('signup-country')?.value.trim() || 'Узбекистан';
    const btn = document.getElementById('signup-submit');
    if (btn) btn.textContent = 'Создание...';

    currentUser = { id: 'usr_' + Date.now().toString(36), name, email, country, role: 'investor' };
    localStorage.setItem('hip_investor_session', JSON.stringify({ user: currentUser }));
    localStorage.setItem('hip_active_session', JSON.stringify({ user: currentUser }));
    enterDashboard(currentUser);
    if (btn) btn.textContent = 'Создать аккаунт';
  });
}

/* ── Demo mode ────────────────────────────────────────────── */
function enterDemo() {
  isDemoMode = true;
  currentUser = DEMO_USER;
  watchlistData = [...DEMO_WATCHLIST];
  enterDashboard(currentUser);
}

/* ── Enter Dashboard ─────────────────────────────────────── */
async function enterDashboard(user) {
  const authGate = document.getElementById('auth-gate');
  if (authGate) authGate.style.display = 'none';

  const cabLayout = document.getElementById('cabinet-layout');
  if (cabLayout) cabLayout.classList.add('visible');

  const signoutBtn = document.getElementById('header-signout-btn');
  if (signoutBtn) signoutBtn.style.display = 'flex';

  const headerCta = document.getElementById('header-cta');
  if (headerCta) headerCta.style.display = 'flex';

  // Fill names
  const displayName = user.full_name || user.name || (user.email ? user.email.split('@')[0] : 'Инвестор');
  const uName = document.getElementById('user-name');
  if (uName) uName.textContent = displayName;

  const dName = document.getElementById('dash-name');
  if (dName) dName.textContent = displayName;

  const uAvatar = document.getElementById('user-avatar');
  if (uAvatar) uAvatar.textContent = displayName.charAt(0).toUpperCase();

  // Fill profile
  const pName = document.getElementById('p-name');
  if (pName) pName.value = user.full_name || user.name || '';

  const pEmail = document.getElementById('p-email');
  if (pEmail) pEmail.value = user.email || '';

  const pCountry = document.getElementById('p-country');
  if (pCountry) pCountry.value = user.country || '';

  const pType = document.getElementById('p-type');
  if (pType && user.type) pType.value = user.type;

  const pAum = document.getElementById('p-aum');
  if (pAum && user.aum) pAum.value = user.aum;

  // Load watchlist
  if (watchlistData.length === 0) {
    watchlistData = [...DEMO_WATCHLIST];
  }
  renderWatchlist();
  const kpiWl = document.getElementById('kpi-watchlist');
  if (kpiWl) kpiWl.textContent = watchlistData.length;

  // Sidebar nav
  initSidebarNav();
}

/* ── Sidebar Navigation ───────────────────────────────────── */
function initSidebarNav() {
  document.querySelectorAll('.cabinet-nav-item[data-section]').forEach(btn => {
    btn.onclick = () => {
      const sec = btn.dataset.section;
      document.querySelectorAll('.cabinet-nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.cabinet-section').forEach(s => s.classList.remove('active'));
      const targetSec = document.getElementById(`section-${sec}`);
      if (targetSec) targetSec.classList.add('active');
    };
  });
}

/* ── Watchlist ────────────────────────────────────────────── */
function renderWatchlist() {
  const tbody = document.getElementById('watchlist-tbody');
  const empty = document.getElementById('watchlist-empty');
  const tableWrap = document.getElementById('watchlist-table-wrap');
  if (!tbody) return;

  if (watchlistData.length === 0) {
    if (empty) empty.style.display = 'block';
    if (tableWrap) tableWrap.style.display = 'none';
    return;
  }

  if (empty) empty.style.display = 'none';
  if (tableWrap) tableWrap.style.display = 'block';

  tbody.innerHTML = watchlistData.map(item => `
    <tr>
      <td><strong>${item.hotel_name}</strong></td>
      <td>${item.region || '—'}</td>
      <td>${item.stars ? '★'.repeat(item.stars) : '—'}</td>
      <td><span class="status-badge status-badge--active">${item.iri_score || 'A'}</span></td>
      <td>${item.added_at || '—'}</td>
      <td>
        <button class="btn btn--outline" style="font-size:11px;padding:4px 10px;" onclick="removeFromWatchlist(${item.id})">Удалить</button>
      </td>
    </tr>
  `).join('');
}

window.removeFromWatchlist = function(id) {
  watchlistData = watchlistData.filter(i => i.id !== id);
  renderWatchlist();
  const kpiWl = document.getElementById('kpi-watchlist');
  if (kpiWl) kpiWl.textContent = watchlistData.length;
};

window.saveProfile = function() {
  const btn = document.getElementById('profile-save-btn');
  if (btn) {
    btn.textContent = '✓ Сохранено';
    setTimeout(() => { btn.textContent = 'Сохранить профиль'; }, 2000);
  }
};

/* ── Sign Out ────────────────────────────────────────────── */
window.handleSignOut = async function() {
  if (!isDemoMode && window.HIPAuth) {
    await window.HIPAuth.signOut().catch(() => {});
  }
  isDemoMode = false;
  currentUser = null;
  localStorage.removeItem('hip_investor_session');
  localStorage.removeItem('hip_active_session');

  const cabLayout = document.getElementById('cabinet-layout');
  if (cabLayout) cabLayout.classList.remove('visible');

  const authGate = document.getElementById('auth-gate');
  if (authGate) authGate.style.display = 'flex';
};
