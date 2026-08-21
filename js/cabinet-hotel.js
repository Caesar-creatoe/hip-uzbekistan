/* ============================================================
   CABINET-HOTEL.JS — Hotel Person Cabinet
   Hotel Investment Portfolio · Uzbekistan
   ============================================================ */
'use strict';

const DEMO_HOTEL = {
  id: 'demo-hotel-001',
  email: 'demo-hotel@hip-uzbekistan.uz',
  name: 'Grand Demo Hotel',
  stars: 5,
  address: 'ул. Навои, 1, Ташкент',
  manager: 'Demo Manager',
  role: 'hotel_manager',
};

let currentHotel = null;
let isDemoMode   = false;

document.addEventListener('DOMContentLoaded', async () => {
  const sb = window.HIPAuth;
  const isConfigured = sb && !sb.SUPABASE_URL.includes('YOUR_PROJECT_ID');

  if (!isConfigured) {
    document.getElementById('demo-login-btn')?.addEventListener('click', enterDemo);
  } else {
    document.getElementById('setup-banner')?.style.setProperty('display', 'none');
    try {
      const session = await sb.getSession();
      if (session) {
        const profile = await sb.getProfile(session.user.id);
        currentHotel = { id: session.user.id, email: session.user.email, ...profile };
        enterDashboard(currentHotel);
        return;
      }
    } catch (e) { console.warn('Session restore:', e); }
  }
  initAuthForms(isConfigured);
});

function initAuthForms(live) {
  document.querySelectorAll('.auth-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('signin-form-wrap').style.display = tab === 'signin' ? 'block' : 'none';
      document.getElementById('signup-form-wrap').style.display = tab === 'signup' ? 'block' : 'none';
    });
  });

  document.getElementById('signin-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!live) { enterDemo(); return; }
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;
    const errEl = document.getElementById('signin-error');
    const btn = document.getElementById('signin-submit');
    btn.textContent = 'Вход...'; btn.disabled = true;
    const { data, error } = await window.HIPAuth.signIn(email, password);
    if (error) {
      errEl.textContent = error.message === 'Invalid login credentials' ? 'Неверный email или пароль' : error.message;
      errEl.classList.add('visible');
    } else {
      const profile = await window.HIPAuth.getProfile(data.user.id);
      currentHotel = { id: data.user.id, email: data.user.email, ...profile };
      enterDashboard(currentHotel);
    }
    btn.textContent = 'Войти в кабинет'; btn.disabled = false;
  });

  document.getElementById('signup-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!live) { enterDemo(); return; }
    const name     = document.getElementById('signup-name').value.trim();
    const email    = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const stars    = document.getElementById('signup-stars').value;
    const errEl    = document.getElementById('signup-error');
    const btn      = document.getElementById('signup-submit');
    btn.textContent = 'Создание...'; btn.disabled = true;
    const { data, error } = await window.HIPAuth.signUp(email, password, { full_name: name, role: 'hotel_manager' });
    if (error) {
      errEl.textContent = error.message;
      errEl.classList.add('visible');
    } else if (data.user) {
      await window.HIPAuth.saveProfile(data.user.id, { role: 'hotel_manager', full_name: name });
      currentHotel = { id: data.user.id, email, name, role: 'hotel_manager', stars };
      enterDashboard(currentHotel);
    }
    btn.textContent = 'Зарегистрировать объект'; btn.disabled = false;
  });
}

function enterDemo() {
  isDemoMode = true;
  currentHotel = DEMO_HOTEL;
  enterDashboard(currentHotel);
}

function enterDashboard(hotel) {
  document.getElementById('auth-gate').style.display = 'none';
  document.getElementById('cabinet-layout').classList.add('visible');
  document.getElementById('header-signout-btn').style.display = 'flex';

  const displayName = hotel.full_name || hotel.name || hotel.email?.split('@')[0] || 'Отель';
  document.getElementById('user-name').textContent = displayName;
  document.getElementById('dash-name').textContent = displayName;
  document.getElementById('user-avatar').textContent = displayName.charAt(0).toUpperCase();

  // My object section
  document.getElementById('obj-name').textContent  = displayName;
  document.getElementById('obj-stars').textContent = hotel.stars ? '★'.repeat(parseInt(hotel.stars)) : '—';
  document.getElementById('obj-id').textContent    = `HIP-${hotel.id?.slice(-8).toUpperCase() || 'DEMO0001'}`;

  // Profile
  document.getElementById('ph-name').value    = displayName;
  document.getElementById('ph-email').value   = hotel.email || '';
  document.getElementById('ph-manager').value = hotel.manager || '';
  document.getElementById('ph-address').value = hotel.address || '';
  if (hotel.stars) document.getElementById('ph-stars').value = hotel.stars;

  // KQI from localStorage (if completed on quality page)
  const savedScore = localStorage.getItem('hip_kqi_score');
  if (savedScore) {
    document.getElementById('kpi-kqi').textContent = savedScore;
    document.getElementById('kpi-kqi-grade').textContent = `QI Score: ${savedScore}/100`;
  }

  initSidebarNav();
}

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

/* ── Actions ─────────────────────────────────────────────── */
window.approveRequest = function(btn) {
  btn.textContent = '✓ Одобрено';
  btn.classList.remove('btn--outline');
  btn.classList.add('btn--teal');
  btn.disabled = true;
  // Find status badge in same row
  const row = btn.closest('tr');
  const badge = row.querySelector('.status-badge');
  if (badge) { badge.textContent = 'Одобрено'; badge.className = 'status-badge status-badge--approved'; }

  // Update counter
  const badge2 = document.getElementById('req-badge');
  if (badge2) {
    const cnt = Math.max(0, (parseInt(badge2.textContent) || 0) - 1);
    badge2.textContent = cnt;
    if (cnt === 0) badge2.style.display = 'none';
  }
};

window.uploadDoc = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,.docx,.doc,.xlsx';
  input.onchange = () => {
    if (input.files[0]) alert(`Файл "${input.files[0].name}" добавлен в документы (демо-режим).`);
  };
  input.click();
};

window.saveHotelProfile = function() {
  const btn = document.getElementById('profile-save-btn');
  btn.textContent = '✓ Сохранено';
  setTimeout(() => btn.textContent = 'Сохранить изменения', 2000);
};

window.handleSignOut = async function() {
  if (!isDemoMode && window.HIPAuth) await window.HIPAuth.signOut().catch(() => {});
  isDemoMode = false;
  currentHotel = null;
  document.getElementById('cabinet-layout').classList.remove('visible');
  document.getElementById('auth-gate').style.display = 'flex';
  document.getElementById('header-signout-btn').style.display = 'none';
};
