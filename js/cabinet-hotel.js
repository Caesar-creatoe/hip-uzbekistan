/* ============================================================
   CABINET-HOTEL.JS — Hotel Person Cabinet
   Hotel Investment Portfolio · Uzbekistan
   ============================================================ */
'use strict';

const DEMO_HOTEL = {
  id: 'demo-hotel-001',
  email: 'manager@asmald.uz',
  name: 'ASMALD Hospitality',
  stars: 4,
  address: 'г. Ташкент, Яккасарайский р-н, ул. Мукими, 12',
  manager: 'Управляющий отелем ASMALD',
  role: 'hotel_manager',
};

let currentHotel = null;
let isDemoMode   = false;

document.addEventListener('DOMContentLoaded', async () => {
  // Проверяем сохраненную сессию или сразу авторизуем
  const savedSession = localStorage.getItem('hip_active_session') || localStorage.getItem('hip_hotel_session');
  let restoredUser = null;
  if (savedSession) {
    try {
      const parsed = JSON.parse(savedSession);
      restoredUser = parsed.user || parsed;
    } catch (e) {}
  }

  // Если есть сессия отеля — сразу открываем дашборд
  if (restoredUser) {
    currentHotel = { ...DEMO_HOTEL, ...restoredUser };
    enterDashboard(currentHotel);
  } else {
    // Вход по умолчанию в демонстрационном режиме, чтобы интерфейс был сразу доступен
    enterDemo();
  }

  // Инициализация кнопок и форм
  const demoBtn = document.getElementById('demo-login-btn');
  if (demoBtn) {
    demoBtn.addEventListener('click', enterDemo);
  }

  initAuthForms();
});

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

  document.getElementById('signin-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('signin-email')?.value.trim() || 'manager@hotel.uz';
    const password = document.getElementById('signin-password')?.value || '';
    const btn = document.getElementById('signin-submit');
    if (btn) btn.textContent = 'Вход...';

    currentHotel = {
      ...DEMO_HOTEL,
      email: email,
      name: email.split('@')[0] || DEMO_HOTEL.name
    };
    localStorage.setItem('hip_hotel_session', JSON.stringify({ user: currentHotel }));
    localStorage.setItem('hip_active_session', JSON.stringify({ user: currentHotel }));
    enterDashboard(currentHotel);
    if (btn) btn.textContent = 'Войти в кабинет';
  });

  document.getElementById('signup-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('signup-name')?.value.trim() || 'Отель';
    const email = document.getElementById('signup-email')?.value.trim() || 'hotel@hip.uz';
    const stars = document.getElementById('signup-stars')?.value || '4';
    const btn = document.getElementById('signup-submit');
    if (btn) btn.textContent = 'Создание...';

    currentHotel = {
      id: 'hotel_' + Date.now().toString(36),
      name: name,
      email: email,
      stars: parseInt(stars, 10) || 4,
      role: 'hotel_manager'
    };
    localStorage.setItem('hip_hotel_session', JSON.stringify({ user: currentHotel }));
    localStorage.setItem('hip_active_session', JSON.stringify({ user: currentHotel }));
    enterDashboard(currentHotel);
    if (btn) btn.textContent = 'Зарегистрировать объект';
  });
}

function enterDemo() {
  isDemoMode = true;
  currentHotel = DEMO_HOTEL;
  enterDashboard(currentHotel);
}

function enterDashboard(hotel) {
  const authGate = document.getElementById('auth-gate');
  if (authGate) authGate.style.display = 'none';

  const cabLayout = document.getElementById('cabinet-layout');
  if (cabLayout) cabLayout.classList.add('visible');

  const signoutBtn = document.getElementById('header-signout-btn');
  if (signoutBtn) signoutBtn.style.display = 'flex';

  const displayName = hotel.full_name || hotel.name || (hotel.email ? hotel.email.split('@')[0] : 'Отель');
  const uName = document.getElementById('user-name');
  if (uName) uName.textContent = displayName;

  const dName = document.getElementById('dash-name');
  if (dName) dName.textContent = displayName;

  const uAvatar = document.getElementById('user-avatar');
  if (uAvatar) uAvatar.textContent = displayName.charAt(0).toUpperCase();

  // My object section
  const oName = document.getElementById('obj-name');
  if (oName) oName.textContent = displayName;

  const oStars = document.getElementById('obj-stars');
  if (oStars) oStars.textContent = hotel.stars ? '★'.repeat(parseInt(hotel.stars, 10)) : '★★★★';

  const oId = document.getElementById('obj-id');
  if (oId) oId.textContent = `HIP-${hotel.id ? hotel.id.slice(-8).toUpperCase() : 'ASMALD01'}`;

  // Profile fields
  const phName = document.getElementById('ph-name');
  if (phName) phName.value = displayName;

  const phEmail = document.getElementById('ph-email');
  if (phEmail) phEmail.value = hotel.email || '';

  const phManager = document.getElementById('ph-manager');
  if (phManager) phManager.value = hotel.manager || '';

  const phAddress = document.getElementById('ph-address');
  if (phAddress) phAddress.value = hotel.address || '';

  const phStars = document.getElementById('ph-stars');
  if (phStars && hotel.stars) phStars.value = hotel.stars;

  // KQI from localStorage
  const savedScore = localStorage.getItem('hip_kqi_score');
  if (savedScore) {
    const kpiKqi = document.getElementById('kpi-kqi');
    if (kpiKqi) kpiKqi.textContent = savedScore;
    const kpiGrade = document.getElementById('kpi-kqi-grade');
    if (kpiGrade) kpiGrade.textContent = `QI Score: ${savedScore}/100`;
  }

  initSidebarNav();
}

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

/* ── Actions ─────────────────────────────────────────────── */
window.approveRequest = function(btn) {
  if (!btn) return;
  btn.textContent = '✓ Одобрено';
  btn.classList.remove('btn--outline');
  btn.classList.add('btn--primary');
  btn.disabled = true;

  const row = btn.closest('tr');
  const badge = row ? row.querySelector('.status-badge') : null;
  if (badge) {
    badge.textContent = 'Одобрено';
    badge.className = 'status-badge status-badge--approved';
  }

  const badge2 = document.getElementById('req-badge');
  if (badge2) {
    const cnt = Math.max(0, (parseInt(badge2.textContent, 10) || 0) - 1);
    badge2.textContent = cnt;
    if (cnt === 0) badge2.style.display = 'none';
  }
};

window.uploadDoc = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,.docx,.doc,.xlsx';
  input.onchange = () => {
    if (input.files && input.files[0]) {
      alert(`Файл "${input.files[0].name}" добавлен в документы.`);
    }
  };
  input.click();
};

window.saveHotelProfile = function() {
  const btn = document.getElementById('profile-save-btn');
  if (btn) {
    btn.textContent = '✓ Сохранено';
    setTimeout(() => { btn.textContent = 'Сохранить изменения'; }, 2000);
  }
};

window.handleSignOut = async function() {
  if (!isDemoMode && window.HIPAuth) {
    await window.HIPAuth.signOut().catch(() => {});
  }
  isDemoMode = false;
  currentHotel = null;
  localStorage.removeItem('hip_hotel_session');
  localStorage.removeItem('hip_active_session');

  const cabLayout = document.getElementById('cabinet-layout');
  if (cabLayout) cabLayout.classList.remove('visible');

  const authGate = document.getElementById('auth-gate');
  if (authGate) authGate.style.display = 'flex';

  const signoutBtn = document.getElementById('header-signout-btn');
  if (signoutBtn) signoutBtn.style.display = 'none';
};
