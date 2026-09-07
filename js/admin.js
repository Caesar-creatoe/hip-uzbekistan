/* ============================================================
   ADMIN.JS — Adminка управления каталогом отелей
   Silk Route Invest · Uzbekistan
   Хранилище: единый HotelStore (localStorage key "sri_hotels")
   ============================================================ */
'use strict';

const Store = window.HotelStore;

/* ── Состояние ─────────────────────────────────────────────── */
let editingId = null;
// photoFiles хранит объекты {src: string, caption: string}
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
const photoLoading   = document.getElementById('photo-loading-status');
const photoCountInfo = document.getElementById('photo-count-info');
const photoCountText = document.getElementById('photo-count-text');
const btnPhotoUrl    = document.getElementById('btn-add-photo-url');
const fieldPhotoUrl  = document.getElementById('field-photo-url');
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
  if (authGate) authGate.style.display = 'none';
  if (adminLayout) adminLayout.style.display = 'grid';
  if (logoutBtn) logoutBtn.style.display = 'inline-block';
  renderSidebar();
  return true;
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
        ${h.photos && h.photos[0]
          ? `<img src="${typeof h.photos[0] === 'object' ? h.photos[0].src : h.photos[0]}" alt="${escHtml(h.hotelName)}" loading="lazy"/>`
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
    if (photoCountInfo) photoCountInfo.style.display = 'none';
    return;
  }
  if (photoCountInfo) {
    photoCountInfo.style.display = 'flex';
    if (photoCountText) photoCountText.textContent = `Загружено: ${photoFiles.length} из 10`;
  }
  photoPreview.innerHTML = photoFiles.map(({ src, caption }, i) => `
    <div class="photo-card" data-idx="${i}">
      <div class="photo-thumb ${i === 0 ? 'is-main' : ''}">
        <img src="${src}" alt="Фото ${i + 1}" loading="lazy"/>
        ${i === 0 ? '<span class="photo-main-badge">⭐ Главное</span>' : ''}
        <button type="button" class="photo-remove" data-idx="${i}" title="Удалить фото" aria-label="Удалить фото">✕</button>
        ${i > 0 ? `<button type="button" class="photo-make-main" data-idx="${i}">Сделать главным</button>` : ''}
      </div>
      <input type="text"
             class="photo-caption-input"
             data-idx="${i}"
             value="${escHtml(caption || '')}"
             placeholder="Подпись (Фасад, Лобби...)"
             title="Подпись к фото для паспорта объекта"
      />
    </div>`).join('');

  photoPreview.querySelectorAll('.photo-caption-input').forEach(input => {
    input.addEventListener('input', () => {
      const idx = parseInt(input.dataset.idx, 10);
      if (!isNaN(idx) && photoFiles[idx]) {
        photoFiles[idx].caption = input.value;
      }
    });
  });

  photoPreview.querySelectorAll('.photo-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx, 10);
      if (!isNaN(idx)) {
        photoFiles.splice(idx, 1);
        renderPhotoPreview();
      }
    });
  });

  photoPreview.querySelectorAll('.photo-make-main').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx, 10);
      if (!isNaN(idx) && idx > 0) {
        const item = photoFiles.splice(idx, 1)[0];
        photoFiles.unshift(item);
        renderPhotoPreview();
      }
    });
  });
}

/* ── Сжатие и обработка изображений (Canvas, до 1000x750 JPEG, ~40КБ) ─ */
function compressImage(file, maxWidth = 1000, maxHeight = 750, quality = 0.72) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(reader.result);
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        try {
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (e) {
          resolve(reader.result);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function addImageFiles(files) {
  const list = Array.from(files).filter(f => f.type && f.type.startsWith('image/'));
  if (!list.length) return;

  const remaining = 10 - photoFiles.length;
  if (remaining <= 0) {
    showStatus('⚠️ Достигнут лимит: максимум 10 фотографий на отель', 'error');
    return;
  }

  const toProcess = list.slice(0, remaining);
  if (photoLoading) photoLoading.style.display = 'flex';

  for (const file of toProcess) {
    try {
      const compressed = await compressImage(file);
      if (compressed) {
        photoFiles.push({ src: compressed, caption: '' });
      }
    } catch (err) {
      console.warn('Error compressing photo:', err);
    }
  }

  if (photoLoading) photoLoading.style.display = 'none';
  renderPhotoPreview();
  if (list.length > remaining) {
    showStatus(`Загружено ${remaining} фото (достигнут лимит 10)`, 'info');
  } else {
    showStatus(`✅ Добавлено фото: ${toProcess.length}`);
  }
}

/* ── Выбор файлов через проводник ──────────────────────────── */
if (photoInput) {
  photoInput.addEventListener('change', async () => {
    if (photoInput.files && photoInput.files.length) {
      await addImageFiles(photoInput.files);
      photoInput.value = '';
    }
  });
}

/* ── Drag & Drop и клик по зоне ────────────────────────────── */
const dropZone = document.getElementById('photo-drop-zone') || document.getElementById('photo-dropzone');
if (dropZone) {
  dropZone.addEventListener('click', () => {
    if (photoInput) photoInput.click();
  });
  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (photoInput) photoInput.click();
    }
  });
  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', async e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer && e.dataTransfer.files) {
      await addImageFiles(e.dataTransfer.files);
    }
  });
}

/* ── Добавление фото по ссылке ─────────────────────────────── */
if (btnPhotoUrl && fieldPhotoUrl) {
  const handleAddUrl = () => {
    const url = fieldPhotoUrl.value.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/')) {
      showStatus('⚠️ Введите корректный URL изображения (https://...)', 'error');
      return;
    }
    if (photoFiles.length >= 10) {
      showStatus('⚠️ Достигнут лимит: максимум 10 фотографий на отель', 'error');
      return;
    }
    photoFiles.push({ src: url, caption: '' });
    fieldPhotoUrl.value = '';
    renderPhotoPreview();
    showStatus('✅ Фото добавлено по ссылке');
  };
  btnPhotoUrl.addEventListener('click', handleAddUrl);
  fieldPhotoUrl.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddUrl();
    }
  });
}

/* ── Загрузка презентации ──────────────────────────────────── */
let presentationFileData = null;
let presentationFileName = null;

const presFileInput   = document.getElementById('field-presentation-file');
const presChooseBtn   = document.getElementById('btn-choose-presentation');
const presFileNameEl  = document.getElementById('presentation-filename');
const presRemoveBtn   = document.getElementById('btn-remove-presentation');
const presUrlInput    = document.getElementById('field-presentation-url');
const presCheckbox    = document.getElementById('field-hasPresentation');

if (presChooseBtn && presFileInput) {
  presChooseBtn.addEventListener('click', () => presFileInput.click());
  presFileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      showStatus('⚠️ Размер файла презентации превышает 20 МБ. Используйте ссылку или оптимизируйте файл.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      presentationFileData = reader.result;
      presentationFileName = file.name;
      if (presFileNameEl) presFileNameEl.textContent = `✅ ${file.name}`;
      if (presRemoveBtn) presRemoveBtn.style.display = 'inline-block';
      if (presCheckbox) presCheckbox.checked = true;
      showStatus(`✅ Презентация «${file.name}» загружена`);
    };
    reader.readAsDataURL(file);
  });
}

if (presRemoveBtn) {
  presRemoveBtn.addEventListener('click', () => {
    if (editingId && window.SriDB) {
      window.SriDB.delete('pres_' + editingId);
    }
    presentationFileData = null;
    presentationFileName = null;
    if (presFileInput) presFileInput.value = '';
    if (presFileNameEl) presFileNameEl.textContent = 'Файл не выбран';
    presRemoveBtn.style.display = 'none';
    if (!presUrlInput?.value.trim() && presCheckbox) {
      presCheckbox.checked = false;
    }
    showStatus('Файл презентации удален');
  });
}

if (presUrlInput) {
  presUrlInput.addEventListener('input', () => {
    if (presUrlInput.value.trim() && presCheckbox) {
      presCheckbox.checked = true;
    }
  });
}

/* ── Сброс формы ───────────────────────────────────────────── */
function resetForm() {
  editingId = null;
  photoFiles = [];
  presentationFileData = null;
  presentationFileName = null;
  if (presFileInput) presFileInput.value = '';
  if (presFileNameEl) presFileNameEl.textContent = 'Файл не выбран';
  if (presRemoveBtn) presRemoveBtn.style.display = 'none';
  if (presUrlInput) presUrlInput.value = '';
  const dealSelect = document.getElementById('field-dealType');
  if (dealSelect) dealSelect.value = 'sale';
  if (hotelForm) hotelForm.reset();
  if (photoPreview) renderPhotoPreview();
  if (formTitle) formTitle.textContent = 'Добавить новый отель';
  if (deleteBtn) deleteBtn.hidden = true;
  if (cancelBtn) cancelBtn.hidden = true;
  renderSidebar();
}

/* ── Загрузка в форму ──────────────────────────────────────── */
async function loadForEdit(id) {
  const hotel = Store.getById(id);
  if (!hotel) return;
  editingId = id;
  const fields = [
    'hotelName', 'legalEntity', 'region', 'address', 'roomsCount',
    'placesCount', 'stars', 'landArea', 'buildingArea', 'floors',
    'yearCommissioned', 'maxRoomArea', 'minRoomArea', 'amenities',
    'managerContact', 'dealType', 'status', 'notes'
  ];
  fields.forEach(name => {
    const el = document.getElementById(`field-${name}`);
    if (el) {
      if (name === 'amenities' && Array.isArray(hotel[name])) {
        el.value = hotel[name].join(', ');
      } else {
        el.value = hotel[name] !== undefined && hotel[name] !== null ? hotel[name] : '';
      }
    }
  });

  // Загрузка презентации (из объекта или из SriDB IndexedDB)
  presentationFileData = hotel.presentationFile || null;
  presentationFileName = hotel.presentationFileName || null;
  if (presUrlInput) presUrlInput.value = hotel.presentationUrl || '';

  if (!presentationFileData && window.SriDB && hotel.id) {
    try {
      const presDoc = await window.SriDB.get('pres_' + hotel.id);
      if (presDoc && presDoc.data) {
        presentationFileData = presDoc.data;
        if (!presentationFileName) presentationFileName = presDoc.name || 'Презентация.pdf';
      }
    } catch (e) {
      console.warn('Error fetching presentation from SriDB:', e);
    }
  }

  if (presentationFileData || presentationFileName) {
    if (presFileNameEl) presFileNameEl.textContent = `✅ ${presentationFileName || 'Презентация загружена'}`;
    if (presRemoveBtn) presRemoveBtn.style.display = 'inline-block';
  } else {
    if (presFileNameEl) presFileNameEl.textContent = 'Файл не выбран';
    if (presRemoveBtn) presRemoveBtn.style.display = 'none';
  }

  if (presCheckbox) {
    presCheckbox.checked = Boolean(hotel.hasPresentation || presentationFileData || hotel.presentationUrl);
  }

  // Загружаем фото: поддержка как legacy массива строк, так и нового {src, caption}
  let photos = Array.isArray(hotel.photos) ? [...hotel.photos] : [];
  if (photos.length <= 1 && window.SriDB && hotel.id) {
    try {
      const dbPhotos = await window.SriDB.get('photos_' + hotel.id);
      if (Array.isArray(dbPhotos) && dbPhotos.length > photos.length) {
        photos = dbPhotos;
      }
    } catch (e) {
      console.warn('Error fetching photos from SriDB:', e);
    }
  }

  photoFiles = photos.filter(Boolean).map(p => {
    if (typeof p === 'object' && p !== null && p.src) {
      return { src: p.src, caption: p.caption || '' };
    }
    return { src: String(p), caption: '' };
  });
  renderPhotoPreview();
  if (formTitle) formTitle.textContent = `Редактировать: ${hotel.hotelName || ''}`;
  if (deleteBtn) deleteBtn.hidden = false;
  if (cancelBtn) cancelBtn.hidden = false;
  renderSidebar();
  if (hotelForm) hotelForm.scrollIntoView({ behavior:'smooth', block:'start' });
}

/* ── Отправка формы ────────────────────────────────────────── */
if (hotelForm) {
  hotelForm.addEventListener('submit', async e => {
    e.preventDefault();
    const get = id => { const el = document.getElementById(`field-${id}`); return el ? el.value.trim() : ''; };
    if (!get('hotelName')) {
      showStatus('❗ Укажите название отеля', 'error');
      document.getElementById('field-hotelName')?.focus();
      return;
    }

    // Дедупликация удобств без потери данных
    const rawAmenities = get('amenities');
    const parsedAmenitiesList = typeof window.parseAmenities === 'function'
      ? window.parseAmenities(rawAmenities)
      : rawAmenities.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    const sanitizedAmenities = parsedAmenitiesList.join(', ');

    const hasPresValue = Boolean(
      document.getElementById('field-hasPresentation')?.checked ||
      presentationFileData ||
      (presUrlInput && presUrlInput.value.trim())
    );

    const targetId = editingId || ('sri_' + Date.now().toString(36));

    // Если есть файл презентации, сразу безопасно пишем в IndexedDB (SriDB)
    if (presentationFileData && window.SriDB) {
      await window.SriDB.set('pres_' + targetId, {
        data: presentationFileData,
        name: presentationFileName || 'Презентация.pdf'
      });
    }

    const hotel = {
      id:               targetId,
      hotelName:        get('hotelName'),
      legalEntity:      get('legalEntity'),
      region:           get('region'),
      regionKey:        getRegionKey(get('region')),
      address:          get('address'),
      roomsCount:       parseInt(get('roomsCount'), 10) || 0,
      placesCount:      parseInt(get('placesCount'), 10) || 0,
      stars:            get('stars') || '0',
      landArea:         get('landArea') || null,
      buildingArea:     get('buildingArea') || null,
      floors:           parseInt(get('floors'), 10) || 0,
      yearCommissioned: parseInt(get('yearCommissioned'), 10) || (new Date().getFullYear()),
      maxRoomArea:      get('maxRoomArea') ? parseFloat(get('maxRoomArea')) : null,
      minRoomArea:      get('minRoomArea') ? parseFloat(get('minRoomArea')) : null,
      amenities:        sanitizedAmenities,
      managerContact:   get('managerContact'),
      dealType:         get('dealType') || 'sale',
      status:           get('status') || 'active',
      hasPresentation:  hasPresValue,
      presentationFile: presentationFileData,
      presentationFileName: presentationFileName,
      presentationUrl:  presUrlInput ? presUrlInput.value.trim() : '',
      notes:            get('notes') || '',
      photos:           photoFiles.map(p => ({
        src: typeof p === 'object' ? (p.src || '') : String(p),
        caption: typeof p === 'object' ? (p.caption || '') : ''
      })),
    };

    showStatus('⏳ Сохранение в облако...', 'info');
    if (editingId) {
      await Store.update(editingId, hotel);
      showStatus('✅ Отель успешно обновлён и опубликован в сети');
    } else {
      await Store.add(hotel);
      showStatus('✅ Отель добавлен в каталог и опубликован в сети');
    }
    resetForm();
  });
}

/* ── Кнопки ─────────────────────────────────────────────────── */
if (newHotelBtn) newHotelBtn.addEventListener('click', resetForm);
if (cancelBtn)   cancelBtn.addEventListener('click', resetForm);
if (deleteBtn) {
  deleteBtn.addEventListener('click', async () => {
    if (!editingId) return;
    const h = Store.getById(editingId);
    if (!confirm(`Удалить «${h?.hotelName||editingId}»?`)) return;
    showStatus('⏳ Удаление из облачной базы...', 'info');
    if (window.SriDB) {
      window.SriDB.delete('pres_' + editingId);
      window.SriDB.delete('photos_' + editingId);
    }
    await Store.delete(editingId);
    showStatus('🗑️ Отель удалён на всех устройствах');
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

// Слушаем синхронизацию из облака (в реальном времени)
window.addEventListener('sri_hotels_updated', () => {
  renderSidebar();
});

// Первичная загрузка актуальной базы с сервера
if (Store && typeof Store.syncWithCloud === 'function') {
  Store.syncWithCloud().then(() => {
    renderSidebar();
  });
}
