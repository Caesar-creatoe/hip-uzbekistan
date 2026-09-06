/* ============================================================
   ADMIN.JS — Adminка управления каталогом отелей
   Silk Route Invest · Uzbekistan
   Хранилище: единый HotelStore (localStorage key "sri_hotels")
   ============================================================ */
'use strict';

const Store = window.HotelStore;

/* ── Состояние ─────────────────────────────────────────────── */
let editingId = null;
let photoFiles = [];

/* ── DOM ───────────────────────────────────────────────────── */
const hotelList    = document.getElementById('hotel-list');
const hotelForm    = document.getElementById('hotel-form');
const formTitle    = document.getElementById('form-title');
const newHotelBtn  = document.getElementById('btn-new-hotel');
const cancelBtn    = document.getElementById('btn-cancel');
const deleteBtn    = document.getElementById('btn-delete');
const photoInput   = document.getElementById('field-photos');
const photoPreview = document.getElementById('photo-preview');
const exportBtn    = document.getElementById('btn-export');
const totalCounter = document.getElementById('total-count');
const statusMsg    = document.getElementById('status-message');
const searchInput  = document.getElementById('sidebar-search');

/* ── Auth Guard Элементы ───────────────────────────────────── */
const authGate    = document.getElementById('admin-auth-gate');
const adminLayout = document.getElementById('admin-layout');
const loginForm   = document.getElementById('admin-login-form');
const demoBtn     = document.getElementById('btn-admin-demo');
const logoutBtn   = document.getElementById('btn-admin-logout');
const authError   = document.getElementById('admin-auth-error');

/* ── Проверка авторизации администратора ───────────────────── */
function checkAdminAuth() {
  let isAuthed = false;
  try {
    const adminSession = JSON.parse(localStorage.getItem('hip_admin_session') || 'null');
    if (adminSession && adminSession.user && adminSession.user.role === 'admin') {
      isAuthed = true;
    }
    const generalSession = JSON.parse(localStorage.getItem('hip_active_session') || 'null');
    if (generalSession && generalSession.user && (generalSession.user.role === 'admin' || generalSession.user.email === 'admin@silkroute.uz')) {
      isAuthed = true;
    }
  } catch (e) {
    console.warn('Auth check error:', e);
  }

  if (isAuthed) {
    if (authGate) authGate.style.display = 'none';
    if (adminLayout) adminLayout.style.display = 'grid';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    renderSidebar();
    return true;
  } else {
    if (authGate) authGate.style.display = 'flex';
    if (adminLayout) adminLayout.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    return false;
  }
}

function loginAdmin(email = 'admin@silkroute.uz') {
  const adminUser = {
    id: 'usr_admin_01',
    email: email.toLowerCase(),
    role: 'admin',
    full_name: 'Администратор платформы SRI',
    created_at: new Date().toISOString()
  };
  localStorage.setItem('hip_admin_session', JSON.stringify({ user: adminUser, token: 'sri_adm_token' }));
  localStorage.setItem('hip_active_session', JSON.stringify({ user: adminUser, access_token: 'sri_adm_token' }));
  checkAdminAuth();
  showStatus('Вход выполнен успешно');
}

if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('admin-email')?.value.trim();
    const pass = document.getElementById('admin-password')?.value.trim();
    if (!email || !pass) {
      if (authError) {
        authError.textContent = 'Укажите email и пароль';
        authError.style.display = 'block';
      }
      return;
    }
    loginAdmin(email);
  });
}

if (demoBtn) {
  demoBtn.addEventListener('click', () => {
    loginAdmin('admin@silkroute.uz');
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('hip_admin_session');
    localStorage.removeItem('hip_active_session');
    checkAdminAuth();
  });
}

/* ── Утилиты ───────────────────────────────────────────────── */
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function starsLabel(n) {
  const num = parseInt(n);
  return isNaN(num) ? (n || '') : '★'.repeat(Math.min(num,5));
}
function getRegionKey(name) {
  if (!name) return 'other';
  const r = name.toLowerCase();
  if (r.includes('город') || r === 'ташкент') return 'tashkent';
  if (r.includes('ташкентск')) return 'tashkent-region';
  if (r.includes('самарканд')) return 'samarkand';
  if (r.includes('бухар')) return 'bukhara';
  if (r.includes('хорезм') || r.includes('хива')) return 'khorezm';
  if (r.includes('ферган')) return 'fergana';
  if (r.includes('наманган')) return 'namangan';
  if (r.includes('андиж')) return 'andijan';
  if (r.includes('кашкадар')) return 'kashkadarya';
  if (r.includes('сурхандар')) return 'surkhandarya';
  if (r.includes('джизак') || r.includes('заамин')) return 'jizzakh';
  if (r.includes('сырдар')) return 'syrdarya';
  if (r.includes('навои')) return 'navoi';
  if (r.includes('каракалпак')) return 'karakalpakstan';
  return 'other';
}
function showStatus(msg, type='success') {
  if (!statusMsg) return;
  statusMsg.textContent = msg;
  statusMsg.className = `status-message status-message--${type}`;
  statusMsg.hidden = false;
  setTimeout(()=>{ statusMsg.hidden = true; }, 3500);
}

/* ── Sidebar ───────────────────────────────────────────────── */
function renderSidebar() {
  const hotels = Store.getAll();
  if (totalCounter) totalCounter.textContent = hotels.length;
  if (!hotelList) return;
  if (hotels.length === 0) {
    hotelList.innerHTML = `<div class="sidebar-empty"><span>🏨</span><p>Отелей нет.<br/>Нажмите «+ Новый отель»</p></div>`;
    return;
  }
  hotelList.innerHTML = hotels.map(h => `
    <div class="sidebar-item ${editingId===h.id?'sidebar-item--active':''}"
         data-id="${h.id}" role="button" tabindex="0">
      <div class="sidebar-item-photo">
        ${h.photos&&h.photos[0]
          ? `<img src="${h.photos[0]}" alt="${escHtml(h.hotelName)}" loading="lazy"/>`
          : `<span>📷</span>`}
      </div>
      <div class="sidebar-item-info">
        <span class="sidebar-item-name">${escHtml(h.hotelName)||'—'}</span>
        <span class="sidebar-item-region">${escHtml(h.region)||'—'}</span>
        <span class="sidebar-item-stars">${starsLabel(h.stars)}</span>
      </div>
    </div>`).join('');
  hotelList.querySelectorAll('.sidebar-item').forEach(el => {
    el.addEventListener('click', () => loadForEdit(el.dataset.id));
    el.addEventListener('keydown', e => { if(e.key==='Enter') loadForEdit(el.dataset.id); });
  });
}

/* ── Фото превью ───────────────────────────────────────────── */
function renderPhotoPreview() {
  if (!photoPreview) return;
  if (!photoFiles.length) {
    photoPreview.innerHTML = '<p class="photo-placeholder">Фото не загружены</p>';
    return;
  }
  photoPreview.innerHTML = photoFiles.map((src,i) => `
    <div class="photo-thumb">
      <img src="${src}" alt="Фото ${i+1}" loading="lazy"/>
      <button type="button" class="photo-remove" data-idx="${i}" aria-label="Удалить фото">✕</button>
    </div>`).join('');
  photoPreview.querySelectorAll('.photo-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      photoFiles.splice(parseInt(btn.dataset.idx), 1);
      renderPhotoPreview();
    });
  });
}

/* ── Загрузка файлов ───────────────────────────────────────── */
function fileToBase64(file) {
  return new Promise((res,rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
if (photoInput) {
  photoInput.addEventListener('change', async () => {
    for (const file of Array.from(photoInput.files)) {
      if (!file.type.startsWith('image/')) continue;
      if (photoFiles.length >= 10) break;
      photoFiles.push(await fileToBase64(file));
    }
    renderPhotoPreview();
    photoInput.value = '';
  });
}

/* ── Drag & Drop ───────────────────────────────────────────── */
const dropZone = document.getElementById('photo-dropzone');
if (dropZone) {
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', async e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    for (const file of Array.from(e.dataTransfer.files)) {
      if (!file.type.startsWith('image/')) continue;
      if (photoFiles.length >= 10) break;
      photoFiles.push(await fileToBase64(file));
    }
    renderPhotoPreview();
  });
  dropZone.addEventListener('click', () => photoInput && photoInput.click());
}

/* ── Сброс формы ───────────────────────────────────────────── */
function resetForm() {
  editingId = null;
  photoFiles = [];
  if (hotelForm) hotelForm.reset();
  if (photoPreview) renderPhotoPreview();
  if (formTitle) formTitle.textContent = 'Добавить новый отель';
  if (deleteBtn) deleteBtn.hidden = true;
  if (cancelBtn) cancelBtn.hidden = true;
  renderSidebar();
}

/* ── Загрузка в форму ──────────────────────────────────────── */
function loadForEdit(id) {
  const hotel = Store.getById(id);
  if (!hotel) return;
  editingId = id;
  const fields = [
    'hotelName', 'legalEntity', 'region', 'address', 'roomsCount',
    'placesCount', 'stars', 'floors', 'conferenceHalls', 'amenities',
    'managerContact', 'status', 'adr', 'occupancy', 'model', 'iri',
    'inn', 'director', 'yearCommissioned'
  ];
  fields.forEach(name => {
    const el = document.getElementById(`field-${name}`);
    if (el && hotel[name] !== undefined) el.value = hotel[name];
  });
  const pres = document.getElementById('field-presentation');
  if (pres) pres.value = hotel.hasPresentation ? 'yes' : 'no';
  photoFiles = hotel.photos ? [...hotel.photos] : [];
  renderPhotoPreview();
  if (formTitle) formTitle.textContent = `Редактировать: ${hotel.hotelName || ''}`;
  if (deleteBtn) deleteBtn.hidden = false;
  if (cancelBtn) cancelBtn.hidden = false;
  renderSidebar();
  if (hotelForm) hotelForm.scrollIntoView({ behavior:'smooth', block:'start' });
}

/* ── Отправка формы ────────────────────────────────────────── */
if (hotelForm) {
  hotelForm.addEventListener('submit', e => {
    e.preventDefault();
    const get = id => { const el = document.getElementById(`field-${id}`); return el ? el.value.trim() : ''; };
    if (!get('hotelName')) {
      showStatus('❗ Укажите название отеля', 'error');
      document.getElementById('field-hotelName')?.focus();
      return;
    }
    const hotel = {
      hotelName:        get('hotelName'),
      legalEntity:      get('legalEntity'),
      region:           get('region'),
      regionKey:        getRegionKey(get('region')),
      address:          get('address'),
      roomsCount:       parseInt(get('roomsCount')) || 0,
      placesCount:      parseInt(get('placesCount')) || 0,
      stars:            parseInt(get('stars')) || 0,
      floors:           parseInt(get('floors')) || 0,
      conferenceHalls:  get('conferenceHalls'),
      yearCommissioned: parseInt(get('yearCommissioned')) || 2024,
      amenities:        get('amenities'),
      managerContact:   get('managerContact'),
      hasPresentation:  get('presentation') === 'yes',
      status:           get('status') || 'active',
      adr:              parseFloat(get('adr')) || 100,
      occupancy:        parseFloat(get('occupancy')) || 70,
      investmentModel:  get('model') || 'management',
      iri:              get('iri') || 'A',
      photos:           [...photoFiles],
    };
    if (editingId) {
      Store.update(editingId, hotel);
      showStatus('✅ Отель обновлён');
    } else {
      Store.add(hotel);
      showStatus('✅ Отель добавлен в каталог');
    }
    resetForm();
  });
}

/* ── Кнопки ─────────────────────────────────────────────────── */
if (newHotelBtn) newHotelBtn.addEventListener('click', resetForm);
if (cancelBtn)   cancelBtn.addEventListener('click', resetForm);
if (deleteBtn) {
  deleteBtn.addEventListener('click', () => {
    if (!editingId) return;
    const h = Store.getById(editingId);
    if (!confirm(`Удалить «${h?.hotelName||editingId}»?`)) return;
    Store.delete(editingId);
    showStatus('🗑️ Отель удалён');
    resetForm();
  });
}
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(Store.getAll(),null,2)], {type:'application/json'});
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `sri-hotels-${new Date().toISOString().slice(0,10)}.json`
    });
    a.click();
    URL.revokeObjectURL(a.href);
    showStatus('📥 Экспортировано в JSON');
  });
}

/* ── Поиск ───────────────────────────────────────────────────── */
if (searchInput) {
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    document.querySelectorAll('.sidebar-item').forEach(el => {
      const name = el.querySelector('.sidebar-item-name')?.textContent.toLowerCase()||'';
      const reg  = el.querySelector('.sidebar-item-region')?.textContent.toLowerCase()||'';
      el.hidden = q ? !(name.includes(q)||reg.includes(q)) : false;
    });
  });
}

/* ── Init ─────────────────────────────────────────────────────── */
checkAdminAuth();
resetForm();
