/* ============================================================
   PASSPORT.JS — Навигация и динамический рендер паспорта
   Hotel Investment Portfolio · Silk Route Invest
   Отображение ТОЛЬКО реальных канонических данных (19 полей)
   ============================================================ */
'use strict';

let currentHotelData = null;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const hotelParam = urlParams.get('hotel');

  // Получаем список отелей из единого HotelStore
  const store = window.HotelStore;
  let hotel = null;

  if (store && typeof store.getById === 'function' && hotelParam) {
    hotel = store.getById(hotelParam);
  }

  if (!hotel && store && typeof store.getAll === 'function') {
    const all = store.getAll();
    if (all.length > 0) {
      hotel = all[0];
    }
  }

  if (hotel) {
    currentHotelData = hotel;
    renderPassport(hotel);
    initPassportMap(hotel);
  } else {
    renderNotFound();
  }

  initTocSpy();
  initLightbox();
  initPdfButton();
});

/* ── Вспомогательные утилиты ────────────────────────────────── */
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderStars(stars) {
  const count = parseInt(stars, 10);
  if (isNaN(count) || count <= 0) {
    return `<span style="color:var(--color-accent);font-weight:600">${esc(stars || 'Без категории')}</span>`;
  }
  const full = Math.min(count, 5);
  let starsHtml = '';
  for (let i = 0; i < full; i++) {
    starsHtml += `<svg width="18" height="18" viewBox="0 0 20 20" fill="#8B6F4E" aria-hidden="true" style="margin-right:2px"><polygon points="10,1 12.5,7 19,7.5 14,12 15.5,18.5 10,15 4.5,18.5 6,12 1,7.5 7.5,7"/></svg>`;
  }
  return starsHtml;
}

function getRegionCoords(regionKey) {
  const coordsMap = {
    'tashkent': [41.2995, 69.2401],
    'tashkent-region': [41.6318, 70.0435],
    'samarkand': [39.6542, 66.9597],
    'bukhara': [39.7747, 64.4286],
    'khorezm': [41.3783, 60.3639],
    'fergana': [40.3842, 71.7843],
    'namangan': [40.9983, 71.6726],
    'andijan': [40.7821, 72.3442],
    'kashkadarya': [38.8612, 65.7847],
    'surkhandarya': [37.2242, 67.2783],
    'jizzakh': [40.1158, 67.8422],
    'syrdarya': [40.4933, 68.7844],
    'navoi': [40.0844, 65.3792],
    'karakalpakstan': [42.4602, 59.6166]
  };
  return coordsMap[regionKey] || [41.2995, 69.2401];
}

/* ── Рендеринг паспорта отеля ───────────────────────────────── */
function renderPassport(hotel) {
  const hotelName = hotel.hotelName || 'Гостиничный объект';
  document.title = `${hotelName} — Инвестиционный паспорт · Silk Route Invest`;

  // 1. Хлебные крошки и заголовок
  const breadcrumb = document.getElementById('passport-breadcrumb-name');
  if (breadcrumb) breadcrumb.textContent = hotelName;

  const titleEl = document.getElementById('passport-hotel-name');
  if (titleEl) titleEl.textContent = hotelName;

  // 2. Звёздность
  const starsEl = document.getElementById('passport-stars');
  if (starsEl) {
    starsEl.innerHTML = renderStars(hotel.stars);
  }

  // 3. Локация в шапке
  const locEl = document.getElementById('passport-location');
  if (locEl) {
    locEl.textContent = hotel.address || hotel.region || 'Республика Узбекистан';
  }

  // 4. Статус публикации
  const statusBadge = document.getElementById('passport-status-badge');
  if (statusBadge) {
    const s = (hotel.status || 'active').toLowerCase();
    if (s === 'active') {
      statusBadge.textContent = '● Активный объект';
      statusBadge.className = 'cover-status-badge cover-status-badge--active';
    } else if (s === 'pending') {
      statusBadge.textContent = '⏳ На проверке';
      statusBadge.className = 'cover-status-badge cover-status-badge--pending';
    } else {
      statusBadge.textContent = '📝 Черновик';
      statusBadge.className = 'cover-status-badge cover-status-badge--draft';
    }
  }

  // Бейдж формата сделки в обложке
  const deal = typeof window.getHotelDealConfig === 'function'
    ? window.getHotelDealConfig(hotel)
    : { label: 'Прямая продажа', icon: '💼' };
  const dealBadge = document.getElementById('passport-deal-badge');
  if (dealBadge) {
    dealBadge.textContent = `${deal.icon} ${deal.label}`;
  }

  // 5. Ключевые показатели в обложке (номера, места, этажи, год ввода)
  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = (val !== null && val !== undefined && val !== '') ? val : '—';
  };
  setTxt('cover-rooms-count', hotel.roomsCount);
  setTxt('cover-places-count', hotel.placesCount);
  setTxt('cover-floors-count', hotel.floors);
  setTxt('cover-year-commissioned', hotel.yearCommissioned);
  setTxt('cover-legal-entity', hotel.legalEntity);

  // 6. Главное фото обложки и бейджи
  const coverImg = document.getElementById('passport-cover-photo');
  if (coverImg) {
    const firstPhoto = hotel.photos && hotel.photos.length > 0
      ? (typeof hotel.photos[0] === 'object' ? hotel.photos[0].src : hotel.photos[0])
      : null;
    coverImg.src = firstPhoto || './assets/hotel-hero.png';
    coverImg.alt = `${hotelName} — фасад и архитектура`;
  }
  const coverPhotoTitle = document.getElementById('cover-photo-title');
  if (coverPhotoTitle) coverPhotoTitle.textContent = hotelName;

  const countBadge = document.getElementById('cover-photo-count-badge');
  if (countBadge) {
    const numPhotos = Array.isArray(hotel.photos) ? hotel.photos.filter(Boolean).length : 0;
    if (numPhotos > 0) {
      countBadge.innerHTML = `<span>📷 ${numPhotos} фото</span>`;
      countBadge.style.display = 'inline-flex';
    } else {
      countBadge.style.display = 'none';
    }
  }

  // 7. Карточки характеристик (NEW: взаменяет таблицу)
  renderSpecsCards(hotel);

  // 8. Раздел удобств (дедупликация и отображение чипов)
  renderAmenitiesSection(hotel);

  // 9. Блок локации
  setTxt('loc-region', hotel.region);
  setTxt('loc-address', hotel.address);
  const locContact = document.getElementById('loc-contact');
  if (locContact) {
    if (hotel.managerContact) {
      locContact.innerHTML = `<a href="tel:${esc(hotel.managerContact)}" style="color:var(--color-accent);text-decoration:none;font-weight:600">📞 ${esc(hotel.managerContact)}</a>`;
    } else {
      locContact.textContent = 'По запросу через платформу';
    }
  }
  const notesRow = document.getElementById('loc-notes-row');
  const notesEl = document.getElementById('loc-notes');
  if (notesRow && notesEl) {
    if (hotel.notes && hotel.notes.trim()) {
      notesEl.textContent = hotel.notes;
      notesRow.style.display = 'flex';
    } else {
      notesRow.style.display = 'none';
    }
  }

  const mapTagHotel = document.getElementById('map-tag-hotel-name');
  if (mapTagHotel) mapTagHotel.textContent = hotelName;
  const mapTagRegion = document.getElementById('map-tag-hotel-region');
  if (mapTagRegion) mapTagRegion.textContent = hotel.region || 'Узбекистан';

  // 10. Фотогалерея
  renderPhotoGallery(hotel);

  // Если фото было усечено квотой localStorage, подгружаем полную галерею из SriDB
  if (Array.isArray(hotel.photos) && hotel.photos.length <= 1 && window.SriDB && hotel.id) {
    window.SriDB.get('photos_' + hotel.id).then(dbPhotos => {
      if (Array.isArray(dbPhotos) && dbPhotos.length > hotel.photos.length) {
        hotel.photos = dbPhotos;
        renderPhotoGallery(hotel);
        const countBadge = document.getElementById('cover-photo-count-badge');
        if (countBadge) {
          countBadge.innerHTML = `<span>📷 ${dbPhotos.length} фото</span>`;
          countBadge.style.display = 'inline-flex';
        }
      }
    }).catch(console.warn);
  }
}

/* ── Рендеринг карточек характеристик (взаменяет renderSpecsTable) ── */
function renderSpecsCards(hotel) {
  // Большие числа
  const setTxt = (id, val, fallback) => {
    const el = document.getElementById(id);
    if (el) el.textContent = (val !== null && val !== undefined && val !== '') ? val : (fallback || '—');
  };

  setTxt('spec-rooms', hotel.roomsCount);
  setTxt('spec-places', hotel.placesCount);
  setTxt('spec-floors', hotel.floors);
  setTxt('spec-year', hotel.yearCommissioned);

  // Основная информация
  setTxt('spec-name', hotel.hotelName);
  setTxt('spec-legal', hotel.legalEntity, 'Не указано');
  setTxt('spec-region', hotel.region, 'Узбекистан');
  setTxt('spec-address', hotel.address, 'Не указан');

  // Категория
  const starsEl = document.getElementById('spec-stars');
  if (starsEl) {
    const num = parseInt(hotel.stars, 10);
    starsEl.textContent = (!isNaN(num) && num > 0) ? `${num}★` : (hotel.stars || 'Без категории');
  }

  // Статус в карточке
  const specStatusBadge = document.getElementById('spec-status-badge');
  if (specStatusBadge) {
    const s = (hotel.status || 'active').toLowerCase();
    if (s === 'active') {
      specStatusBadge.textContent = '● Активный';
      specStatusBadge.className = 'cover-status-badge cover-status-badge--active';
    } else if (s === 'pending') {
      specStatusBadge.textContent = '⏳ На проверке';
      specStatusBadge.className = 'cover-status-badge cover-status-badge--pending';
    } else {
      specStatusBadge.textContent = '📝 Черновик';
      specStatusBadge.className = 'cover-status-badge cover-status-badge--draft';
    }
  }

  // Формат сделки в карточке
  const specDealEl = document.getElementById('spec-deal-type');
  if (specDealEl) {
    const d = typeof window.getHotelDealConfig === 'function'
      ? window.getHotelDealConfig(hotel)
      : { label: 'Прямая продажа', icon: '💼' };
    specDealEl.textContent = `${d.icon} ${d.label}`;
  }

  // Презентация в карточке
  const specPresEl = document.getElementById('spec-presentation');
  if (specPresEl) {
    const hasPres = Boolean(hotel.presentationFile || hotel.presentationUrl || hotel.hasPresentation);
    if (hasPres) {
      specPresEl.innerHTML = `<button type="button" class="btn-download-trigger" style="background:none;border:none;padding:0;color:var(--color-accent);font-weight:600;text-decoration:underline;cursor:pointer;font-family:inherit;font-size:inherit;">📄 Скачать презентацию</button>`;
      specPresEl.querySelector('.btn-download-trigger')?.addEventListener('click', (e) => {
        e.preventDefault();
        downloadPresentation();
      });
    } else {
      specPresEl.textContent = 'Предоставляется по запросу';
    }
  }

  // Контакт в карточке
  const specContact = document.getElementById('spec-contact');
  if (specContact) {
    if (hotel.managerContact) {
      specContact.innerHTML = `<a href="tel:${esc(hotel.managerContact)}" style="color:var(--color-accent);font-weight:600;text-decoration:none">📞 ${esc(hotel.managerContact)}</a>`;
    } else {
      specContact.textContent = 'По запросу через платформу';
    }
  }

  // Площади
  const showOptional = (rowId, valId, val) => {
    const row = document.getElementById(rowId);
    const el = document.getElementById(valId);
    if (row && el) {
      const str = String(val || '').trim();
      if (str) {
        el.textContent = str;
        row.style.display = 'flex';
      } else {
        row.style.display = 'none';
      }
    }
  };
  showOptional('spec-land-row', 'spec-land', hotel.landArea);
  showOptional('spec-building-row', 'spec-building', hotel.buildingArea);

  const hasMin = hotel.minRoomArea !== null && hotel.minRoomArea !== undefined && hotel.minRoomArea !== '';
  const hasMax = hotel.maxRoomArea !== null && hotel.maxRoomArea !== undefined && hotel.maxRoomArea !== '';
  const roomAreaRow = document.getElementById('spec-roomarea-row');
  const roomAreaEl = document.getElementById('spec-roomarea');
  if (roomAreaRow && roomAreaEl) {
    if (hasMin && hasMax) {
      roomAreaEl.textContent = `от ${hotel.minRoomArea} до ${hotel.maxRoomArea} м²`;
      roomAreaRow.style.display = 'flex';
    } else if (hasMin) {
      roomAreaEl.textContent = `от ${hotel.minRoomArea} м²`;
      roomAreaRow.style.display = 'flex';
    } else if (hasMax) {
      roomAreaEl.textContent = `до ${hotel.maxRoomArea} м²`;
      roomAreaRow.style.display = 'flex';
    } else {
      roomAreaRow.style.display = 'none';
    }
  }
}

/* ── Маппинг иконок для удобств ────────────────────── */
const AMENITY_ICONS = {
  'ресторан': '🍽️', 'restaurant': '🍽️', 'бар': '🍷', 'кафе': '☕', 'кафе-бар': '🍷',
  'бассейн': '🏊', 'pool': '🏊', 'фитнес': '🏋️', 'спа': '🛀', 'spa': '🛀', 'сауна': '🧖',
  'конференц': '🏢', 'конгресс': '🏢', 'conference': '🏢', 'бизнес-центр': '🏢',
  'парков': '🅿️', 'паркинг': '🅿️', 'гараж': '🅿️', 'valet': '🚗',
  'лифт': '🔼', 'ви-фи': '📡', 'wifi': '📡', 'интернет': '🌐',
  'прачечная': '🏥', 'прачечное': '🏥',
  'шопинг': '🛍️', 'магазин': '🛍️', 'бутик': '🛍️',
  'лаундри': '🚀', 'ХИМчистка': '🚀',
  'детский': '👶', 'клуб для детей': '👶',
  'экскурсия': '🗺️', 'тур': '🗺️',
  'якузи': '🍣', 'румсервис': '🍽️',
  'терраса': '☀️', 'открытый': '☀️', 'панорам': '🌅',
  'сейф': '🛡️', 'хранение': '🛡️',
};

function getAmenityIcon(text) {
  const lower = text.toLowerCase();
  for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '✓';
}

/* ── Рендеринг удобств и инфраструктуры ───────────────── */
function renderAmenitiesSection(hotel) {
  const section = document.getElementById('amenities-section');
  const cloud = document.getElementById('passport-amenities-cloud');
  const tocLink = document.getElementById('toc-amenities');
  if (!section || !cloud) return;

  const parseFn = window.parseAmenities || function(input) {
    if (!input) return [];
    return String(input).split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
  };

  const amenitiesList = parseFn(hotel.amenities);

  if (!amenitiesList.length) {
    section.style.display = 'none';
    if (tocLink) tocLink.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  if (tocLink) tocLink.style.display = 'flex';

  // Чипы с иконками
  cloud.innerHTML = amenitiesList.map(item => {
    const icon = getAmenityIcon(item);
    return `
      <div class="amenity-chip">
        <span class="amenity-icon">${icon}</span>
        <span>${esc(item)}</span>
      </div>`;
  }).join('');

  // Заполняем боковую карточку контактов
  const contactEl = document.getElementById('amenities-contact-value');
  const regionEl = document.getElementById('amenities-region-value');
  const addressEl = document.getElementById('amenities-address-value');
  if (contactEl) {
    if (hotel.managerContact) {
      contactEl.innerHTML = `<a href="tel:${esc(hotel.managerContact)}" style="color:var(--color-accent);font-weight:600;text-decoration:none">📞 ${esc(hotel.managerContact)}</a>`;
    } else {
      contactEl.textContent = 'По запросу через платформу';
    }
  }
  if (regionEl) regionEl.textContent = hotel.region || '—';
  if (addressEl) addressEl.textContent = hotel.address || '—';
}

/* ── Рендеринг фотогалереи ────────────────────────── */
function renderPhotoGallery(hotel) {
  const masonry = document.getElementById('passport-gallery-masonry');
  if (!masonry) return;

  // Поддержка как массива строк (legacy), так и массива {src, caption}
  const rawPhotos = Array.isArray(hotel.photos) ? hotel.photos.filter(Boolean) : [];
  const photos = rawPhotos.map(p => {
    if (typeof p === 'object' && p !== null && p.src) {
      return { src: p.src, caption: p.caption || '' };
    }
    return { src: String(p), caption: '' };
  });

  if (!photos.length) {
    masonry.innerHTML = `
      <div class="photo-empty-state" style="grid-column: 1 / -1;">
        <p style="font-size:var(--text-md);margin-bottom:8px">📷 Фотоматериалы готовятся к публикации</p>
        <p style="font-size:var(--text-xs);color:var(--color-text-muted)">Фотографии гостиничного комплекса будут загружены после проведения верификации.</p>
      </div>
    `;
    return;
  }

  masonry.innerHTML = photos.map((p, idx) => {
    let itemClass = 'photo-item';
    if (idx === 0) itemClass += ' photo-item--tall';
    else if (idx === 3) itemClass += ' photo-item--wide';

    const captionHtml = p.caption && p.caption.trim()
      ? `<figcaption class="photo-caption">${esc(p.caption.trim())}</figcaption>`
      : '';

    return `
      <figure class="${itemClass}" role="listitem" data-src="${esc(p.src)}">
        <img src="${esc(p.src)}" alt="${esc(p.caption || hotel.hotelName + ' — фото ' + (idx + 1))}" class="photo-img" loading="lazy" />
        ${captionHtml}
      </figure>
    `;
  }).join('');

  // Привязка лайтбокса к кликам по фото
  masonry.querySelectorAll('.photo-item').forEach(item => {
    item.addEventListener('click', () => {
      const src = item.dataset.src;
      openLightbox(src, hotel.hotelName);
    });
  });
}

/* ── Состояние «Отель не найден» ────────────────────────────── */
function renderNotFound() {
  const main = document.querySelector('main') || document.body;
  const cover = document.getElementById('cover');
  if (cover) {
    cover.innerHTML = `
      <div style="grid-column:1/-1;padding:80px var(--grid-margin-desktop);text-align:center;">
        <h1 style="font-size:var(--text-3xl);margin-bottom:16px">🏨 Объект не найден</h1>
        <p style="color:var(--color-text-muted);margin-bottom:24px">Запрошенный паспорт отеля отсутствует в каталоге или был снят с публикации.</p>
        <a href="portfolio.html" class="btn btn--teal">Вернуться в каталог объектов</a>
      </div>
    `;
  }
  const sections = document.querySelectorAll('#summary, #amenities-section, #location, #gallery');
  sections.forEach(s => s.style.display = 'none');
}

/* ── Интерактивная карта (Leaflet.js) ────────────────────────── */
function initPassportMap(hotel) {
  const mapContainer = document.getElementById('interactive-hotel-map');
  if (!mapContainer || typeof L === 'undefined') return;

  const hotelCoords = (hotel && hotel.coords)
    ? hotel.coords
    : getRegionCoords(hotel ? hotel.regionKey : 'tashkent');

  try {
    const map = L.map('interactive-hotel-map', {
      center: hotelCoords,
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    const hotelIcon = L.divIcon({
      className: 'custom-hotel-pin',
      html: `
        <div class="hotel-pin-wrapper">
          <div class="hotel-pin-ring"></div>
          <div class="hotel-pin-core">★</div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });

    const hotelName = hotel ? hotel.hotelName : 'Гостиничный объект';
    const hotelStars = hotel ? (hotel.stars ? `${hotel.stars}★` : '') : '';
    const hotelAddress = hotel ? (hotel.address || hotel.region || '') : '';

    const hotelMarker = L.marker(hotelCoords, { icon: hotelIcon }).addTo(map);
    hotelMarker.bindPopup(`
      <div class="map-popup-card">
        <h4 class="popup-title">${esc(hotelName)}</h4>
        <p class="popup-sub">${esc(hotelStars)} · ${esc(hotel.region || '')}</p>
        <p class="popup-kpi">${esc(hotelAddress)}</p>
      </div>
    `).openPopup();

    setTimeout(() => map.invalidateSize(), 400);
  } catch (err) {
    console.warn('Map initialization note:', err);
  }
}

/* ── Lightbox для просмотра полноразмерных фото ─────────────── */
function openLightbox(src, title) {
  const lightbox = document.getElementById('passport-lightbox');
  const img = document.getElementById('passport-lightbox-img');
  if (!lightbox || !img) return;

  img.src = src;
  img.alt = title || 'Фото объекта';
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
  const lightbox = document.getElementById('passport-lightbox');
  if (!lightbox) return;
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
}

function initLightbox() {
  const lightbox = document.getElementById('passport-lightbox');
  const closeBtn = document.getElementById('btn-lightbox-close');
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}

/* ── Навигация TOC (scrollspy) ──────────────────────────────── */
function initTocSpy() {
  const tocLinks = document.querySelectorAll('.toc-link[href^="#"]');
  const passportSections = document.querySelectorAll(
    '#cover, #summary, #amenities-section, #location, #gallery, #download'
  );

  if (!tocLinks.length || !passportSections.length) return;

  const headerH = 68;
  const tocH = 44;
  const offset = headerH + tocH + 20;

  const tocObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          tocLinks.forEach((link) => {
            link.classList.toggle(
              'toc-link--active',
              link.getAttribute('href') === `#${id}`
            );
          });
        }
      });
    },
    { rootMargin: `-${offset}px 0px -55% 0px`, threshold: 0 }
  );

  passportSections.forEach((s) => tocObserver.observe(s));
}

/* ── Скачивание презентации объекта ────────────────────────── */
async function downloadPresentation() {
  const hotel = currentHotelData;
  if (!hotel) return;

  let file = hotel.presentationFile || hotel.presentationUrl;
  let filename = hotel.presentationFileName || `${hotel.hotelName || 'hotel'}-presentation.pdf`;

  // Проверяем наличие файла в IndexedDB (SriDB)
  if ((!file || !file.startsWith('data:')) && window.SriDB && hotel.id) {
    try {
      const doc = await window.SriDB.get('pres_' + hotel.id);
      if (doc && doc.data) {
        file = doc.data;
        if (doc.name) filename = doc.name;
      }
    } catch (err) {
      console.warn('Error reading presentation from SriDB:', err);
    }
  }

  if (file) {
    const a = document.createElement('a');
    a.href = file;
    a.download = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
    if (!file.startsWith('data:')) {
      a.target = '_blank';
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Fallback: формирование официального инвестиционного паспорта через печать браузера
  window.print();
}

function initPdfButton() {
  const btnPdf = document.getElementById('btn-download-pdf');
  const btnCover = document.getElementById('btn-cover-download');

  const attachDownload = (btn) => {
    if (!btn) return;
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const origHtml = btn.innerHTML;
      btn.innerHTML = '<span>⏳ Загрузка...</span>';
      btn.disabled = true;
      try {
        await downloadPresentation();
      } catch (err) {
        console.warn('Download error:', err);
      } finally {
        setTimeout(() => {
          btn.innerHTML = origHtml;
          btn.disabled = false;
        }, 800);
      }
    });
  };

  attachDownload(btnPdf);
  attachDownload(btnCover);
}
