/* ============================================================
   CABINET-INVESTOR.JS — Investor Cabinet logic
   Hotel Investment Portfolio · Uzbekistan
   ============================================================ */
'use strict';

/* ── Demo mode data (used when Supabase not configured) ───── */
const DEMO_USER = {
  id: 'demo-investor-001',
  email: 'demo@hip-uzbekistan.uz',
  name: 'Demo Investor (HIP)',
  role: 'investor',
  country: 'Узбекистан',
  aum: '50-200m',
  type: 'pe_fund',
};

const DEMO_WATCHLIST = [
  { id: 1, hotel_name: 'Grand Tashkent 5★ (Hyatt)', region: 'Ташкент', stars: 5, iri_score: 'A+', added_at: '2026-08-10' },
  { id: 2, hotel_name: 'Samarkand Palace Hotel', region: 'Самарканд', stars: 5, iri_score: 'A', added_at: '2026-08-12' },
  { id: 3, hotel_name: 'Khiva Heritage Inn 4★', region: 'Хива', stars: 4, iri_score: 'B+', added_at: '2026-08-15' },
];

/* ── State ────────────────────────────────────────────────── */
let currentUser  = null;
let watchlistData = [];
let isDemoMode   = false;

/* ── Boot ────────────────────────────────────────────────────*/
document.addEventListener('DOMContentLoaded', async () => {
  // Check if Supabase is configured
  const sb = window.HIPAuth;
  const isConfigured = sb && !sb.SUPABASE_URL.includes('YOUR_PROJECT_ID');

  if (!isConfigured) {
    // Show setup banner (already visible in HTML)
    document.getElementById('setup-banner')?.style.setProperty('display', 'flex');
    document.getElementById('demo-login-btn')?.addEventListener('click', () => enterDemo());
  } else {
    document.getElementById('setup-banner')?.style.setProperty('display', 'none');
    // Try to restore session
    try {
      const session = await sb.getSession();
      if (session) {
        const profile = await sb.getProfile(session.user.id);
        currentUser = { id: session.user.id, email: session.user.email, ...profile };
        enterDashboard(currentUser);
        return;
      }
    } catch (e) { console.warn('Session restore failed:', e); }
  }

  initAuthForms(isConfigured);
});

/* ── Auth Tab Switcher ────────────────────────────────────── */
function initAuthForms(live) {
  document.querySelectorAll('.auth-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.auth-tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active'); btn.setAttribute('aria-selected', 'true');
      document.getElementById('signin-form-wrap').style.display = tab === 'signin' ? 'block' : 'none';
      document.getElementById('signup-form-wrap').style.display = tab === 'signup' ? 'block' : 'none';
    });
  });

  // Sign In
  document.getElementById('signin-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;
    const errEl = document.getElementById('signin-error');
    const btn = document.getElementById('signin-submit');

    errEl.classList.remove('visible');
    btn.textContent = 'Вход...'; btn.disabled = true;

    if (!live) { enterDemo(); return; }

    const { data, error } = await window.HIPAuth.signIn(email, password);
    if (error) {
      errEl.textContent = error.message === 'Invalid login credentials' ? 'Неверный email или пароль' : error.message;
      errEl.classList.add('visible');
    } else {
      const profile = await window.HIPAuth.getProfile(data.user.id);
      currentUser = { id: data.user.id, email: data.user.email, ...profile };
      enterDashboard(currentUser);
    }
    btn.textContent = 'Войти в кабинет'; btn.disabled = false;
  });

  // Sign Up
  document.getElementById('signup-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const country = document.getElementById('signup-country').value.trim();
    const errEl = document.getElementById('signup-error');
    const btn = document.getElementById('signup-submit');

    errEl.classList.remove('visible');
    btn.textContent = 'Создание...'; btn.disabled = true;

    if (!live) { enterDemo(); return; }

    const { data, error } = await window.HIPAuth.signUp(email, password, { full_name: name, role: 'investor' });
    if (error) {
      errEl.textContent = error.message;
      errEl.classList.add('visible');
    } else if (data.user) {
      await window.HIPAuth.saveProfile(data.user.id, { role: 'investor', full_name: name, country });
      currentUser = { id: data.user.id, email, name, role: 'investor', country };
      enterDashboard(currentUser);
    }
    btn.textContent = 'Создать аккаунт'; btn.disabled = false;
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
  document.getElementById('auth-gate').style.display = 'none';
  document.getElementById('cabinet-layout').classList.add('visible');
  document.getElementById('header-signout-btn').style.display = 'flex';
  document.getElementById('header-cta').style.display = 'flex';

  // Fill names
  const displayName = user.full_name || user.name || user.email?.split('@')[0] || 'Инвестор';
  document.getElementById('user-name').textContent = displayName;
  document.getElementById('dash-name').textContent = displayName;
  document.getElementById('user-avatar').textContent = displayName.charAt(0).toUpperCase();

  // Fill profile
  document.getElementById('p-name').value  = user.full_name || user.name || '';
  document.getElementById('p-email').value = user.email || '';
  document.getElementById('p-country').value = user.country || '';
  if (user.type) document.getElementById('p-type').value = user.type;
  if (user.aum)  document.getElementById('p-aum').value  = user.aum;

  // Load watchlist
  if (!isDemoMode && window.HIPAuth) {
    try {
      watchlistData = await window.HIPAuth.getWatchlist(user.id) || [];
    } catch { watchlistData = []; }
  }
  renderWatchlist();
  document.getElementById('kpi-watchlist').textContent = watchlistData.length;

  // Sidebar nav
  initSidebarNav();
}

/* ── Sidebar Navigation ───────────────────────────────────── */
function initSidebarNav() {
  document.querySelectorAll('.cabinet-nav-item[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = btn.dataset.section;
      document.querySelectorAll('.cabinet-nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.cabinet-section').forEach(s => s.classList.remove('active'));
      document.getElementById(`section-${sec}`)?.classList.add('active');
    });
  });
}

/* ── Watchlist ────────────────────────────────────────────── */
function renderWatchlist() {
  const tbody = document.getElementById('watchlist-tbody');
  const empty = document.getElementById('watchlist-empty');
  const tableWrap = document.getElementById('watchlist-table-wrap');
  if (!tbody) return;

  if (watchlistData.length === 0) {
    empty.style.display = 'block';
    tableWrap.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  tableWrap.style.display = 'block';
  tbody.innerHTML = '';

  watchlistData.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.hotel_name}</strong></td>
      <td>${item.region || '—'}</td>
      <td>${'★'.repeat(item.stars || 0)}</td>
      <td><span class="status-badge ${item.iri_score?.startsWith('A') ? 'status-badge--approved' : 'status-badge--review'}">${item.iri_score || '—'}</span></td>
      <td style="font-family:var(--font-mono);font-size:12px">${item.added_at || '—'}</td>
      <td>
        <button class="btn btn--ghost" style="font-size:12px;padding:5px 12px" onclick="removeFromWatchlist(${item.id})">✕ Удалить</button>
      </td>`;
    tbody.appendChild(tr);
  });
  document.getElementById('kpi-watchlist').textContent = watchlistData.length;
}

async function removeFromWatchlist(id) {
  watchlistData = watchlistData.filter(i => i.id !== id);
  if (!isDemoMode && currentUser && window.HIPAuth) {
    await window.HIPAuth.removeFromWatchlist(currentUser.id, id).catch(() => {});
  }
  renderWatchlist();
}

/* ── Profile Save ────────────────────────────────────────── */
window.saveProfile = async function() {
  const profileData = {
    full_name: document.getElementById('p-name').value,
    country:   document.getElementById('p-country').value,
    role:      'investor',
  };
  if (!isDemoMode && currentUser && window.HIPAuth) {
    await window.HIPAuth.saveProfile(currentUser.id, profileData).catch(() => {});
  }
  Object.assign(currentUser, profileData);
  document.getElementById('user-name').textContent = profileData.full_name || currentUser.email;
  document.getElementById('dash-name').textContent = profileData.full_name || currentUser.email;

  const btn = document.getElementById('profile-save-btn');
  btn.textContent = '✓ Сохранено';
  setTimeout(() => btn.textContent = 'Сохранить профиль', 2000);
};

/* ── Sign Out ────────────────────────────────────────────── */
window.handleSignOut = async function() {
  if (!isDemoMode && window.HIPAuth) await window.HIPAuth.signOut().catch(() => {});
  isDemoMode = false;
  currentUser = null;
  watchlistData = [];
  document.getElementById('cabinet-layout').classList.remove('visible');
  document.getElementById('auth-gate').style.display = 'flex';
  document.getElementById('header-signout-btn').style.display = 'none';
};
