/* ============================================================
   ADMIN.JS — Adminка управления каталогом отелей
   Silk Route Invest · Uzbekistan
   Хранилище: localStorage key "sri_hotels"
   ============================================================ */
'use strict';

/* ── Хранилище ─────────────────────────────────────────────── */
const HotelStore = {
  KEY: 'sri_hotels',
  getAll() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { return []; }
  },
  save(hotels) { localStorage.setItem(this.KEY, JSON.stringify(hotels)); },
  add(hotel) {
    const hotels = this.getAll();
    hotel.id = Date.now().toString();
    hotel.createdAt = new Date().toISOString();
    hotels.push(hotel);
    this.save(hotels);
    return hotel;
  },
  update(id, data) {
    const hotels = this.getAll();
    const idx = hotels.findIndex(h => h.id === id);
    if (idx === -1) return null;
    hotels[idx] = { ...hotels[idx], ...data, id, updatedAt: new Date().toISOString() };
    this.save(hotels);
    return hotels[idx];
  },
  delete(id) { this.save(this.getAll().filter(h => h.id !== id)); },
  getById(id) { return this.getAll().find(h => h.id === id) || null; }
};

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
  if (r.includes('ташкент')) return 'tashkent';
  if (r.includes('самарканд')) return 'samarkand';
  if (r.includes('бухар')) return 'bukhara';
  if (r.includes('хорезм') || r.includes('хива')) return 'khorezm';
  if (r.includes('ферган')) return 'fergana';
  if (r.includes('наманган')) return 'namangan';
  if (r.includes('андиж')) return 'andijan';
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
  const hotels = HotelStore.getAll();
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
const dropZone = document.getElementById('photo-drop-zone');
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
  const hotel = HotelStore.getById(id);
  if (!hotel) return;
  editingId = id;
  const fields = ['hotelName','legalEntity','region','address','roomsCount',
    'placesCount','stars','landArea','buildingArea','floors','maxRoomArea',
    'minRoomArea','yearCommissioned','amenities','managerContact','status','notes'];
  fields.forEach(name => {
    const el = document.getElementById(`field-${name}`);
    if (el && hotel[name] !== undefined) el.value = hotel[name];
  });
  const pres = document.getElementById('field-hasPresentation');
  if (pres) pres.checked = hotel.hasPresentation;
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
      roomsCount:       get('roomsCount'),
      placesCount:      get('placesCount'),
      stars:            get('stars'),
      landArea:         get('landArea'),
      buildingArea:     get('buildingArea'),
      floors:           get('floors'),
      maxRoomArea:      get('maxRoomArea'),
      minRoomArea:      get('minRoomArea'),
      yearCommissioned: get('yearCommissioned'),
      amenities:        get('amenities'),
      managerContact:   get('managerContact'),
      hasPresentation:  document.getElementById('field-hasPresentation')?.checked ?? false,
      status:           get('status') || 'active',
      notes:            get('notes'),
      photos:           [...photoFiles],
    };
    if (editingId) {
      HotelStore.update(editingId, hotel);
      showStatus('✅ Отель обновлён');
    } else {
      HotelStore.add(hotel);
      showStatus('✅ Отель добавлен в каталог');
      resetForm();
      return;
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
    const h = HotelStore.getById(editingId);
    if (!confirm(`Удалить «${h?.hotelName||editingId}»?`)) return;
    HotelStore.delete(editingId);
    showStatus('🗑️ Отель удалён');
    resetForm();
  });
}
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(HotelStore.getAll(),null,2)], {type:'application/json'});
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
resetForm();
