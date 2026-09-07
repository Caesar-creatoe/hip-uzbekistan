/* ============================================================
   CATALOG.JS — Современный фильтр и каталог отелей
   Silk Route Invest · Uzbekistan
   Единый Glassmorphic Filter Hub (Поиск, Регион, Категория, Номера, Сортировка)
   ============================================================ */
'use strict';

const Store = window.HotelStore;

/* ── Состояние фильтрации и сортировки ─────────────────────── */
const filterState = {
  search: '',
  region: 'all',
  stars: 'all',
  rooms: 'all',
  dealType: 'all',
  sort: 'rooms-desc',
  onlyPremium: false
};

/* ── Утилиты форматирования ────────────────────────────────── */
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function starsHtml(n) {
  const num = parseInt(n, 10);
  if (isNaN(num) || num <= 0) return escHtml(n || '');
  return '★'.repeat(Math.min(num, 5));
}

function amenityBadges(txt) {
  if (!txt) return '';
  const parseFn = window.parseAmenities || function(input) {
    return String(input).split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
  };
  const list = parseFn(txt);
  return list.slice(0, 4).map(item => {
    return `<span class="catalog-amenity">${escHtml(item)}</span>`;
  }).join('');
}

function formatObjectsCountWord(n) {
  const abs = Math.abs(n) % 100;
  const rem = abs % 10;
  if (abs > 10 && abs < 20) return 'объектов';
  if (rem > 1 && rem < 5) return 'объекта';
  if (rem === 1) return 'объект';
  return 'объектов';
}

/* ── Рендер отдельной карточки отеля ────────────────────────── */
function buildCard(hotel) {
  const rawPhoto = (Array.isArray(hotel.photos) && hotel.photos.length > 0 && hotel.photos[0])
    ? hotel.photos[0]
    : './assets/hotel-hero.png';
  const photo = typeof rawPhoto === 'object' && rawPhoto !== null ? (rawPhoto.src || './assets/hotel-hero.png') : rawPhoto;

  const stars = hotel.stars ? `<span class="hotel-card-stars">${starsHtml(hotel.stars)}</span>` : '';
  const deal = typeof window.getHotelDealConfig === 'function'
    ? window.getHotelDealConfig(hotel)
    : { label: 'Прямая продажа', icon: '💼', badgeClass: 'deal-sale' };
  const dealBadge = `<span class="hotel-card-badge hotel-card-badge--deal ${deal.badgeClass}">${deal.icon} ${deal.label}</span>`;

  const region = hotel.region ? `<span class="hotel-card-region">📍 ${escHtml(hotel.region)}</span>` : '';
  const rooms = hotel.roomsCount ? `<span class="hotel-stat"><strong>${escHtml(hotel.roomsCount)}</strong><small>номеров</small></span>` : '';
  const places = hotel.placesCount ? `<span class="hotel-stat"><strong>${escHtml(hotel.placesCount)}</strong><small>мест</small></span>` : '';
  const floors = hotel.floors ? `<span class="hotel-stat"><strong>${escHtml(hotel.floors)}</strong><small>эт.</small></span>` : '';
  const year = hotel.yearCommissioned ? `<span class="hotel-card-year">${escHtml(hotel.yearCommissioned)} г.</span>` : '';
  const passportUrl = `passport.html?hotel=${encodeURIComponent(hotel.slug || hotel.id)}`;

  let statusBadge = '';
  if (hotel.status === 'pending') {
    statusBadge = '<span class="hotel-card-badge" style="background:#FFF3E0;color:#E65100;border:1px solid #FFE0B2">На проверке</span>';
  } else if (hotel.status === 'draft') {
    statusBadge = '<span class="hotel-card-badge hotel-card-badge--draft">Черновик</span>';
  }

  return `
  <article class="hotel-card hotel-card--catalog"
           data-id="${escHtml(hotel.id)}"
           role="listitem">
    <a href="${passportUrl}" class="hotel-card-link" style="text-decoration:none;color:inherit;display:block">
      <div class="hotel-card-img-wrap">
        <img src="${photo}" alt="${escHtml(hotel.hotelName)}" class="hotel-card-img" loading="lazy" onerror="this.onerror=null;this.src='./assets/hotel-hero.png'" />
        <div class="hotel-card-img-overlay"></div>
        <div class="hotel-card-badges">
          ${stars}
          ${dealBadge}
          ${statusBadge}
        </div>
      </div>
      <div class="hotel-card-body">
        <div class="hotel-card-meta">${region} ${year}</div>
        <h3 class="hotel-card-name">${escHtml(hotel.hotelName)}</h3>
        ${hotel.legalEntity ? `<p class="hotel-card-legal">${escHtml(hotel.legalEntity)}</p>` : ''}
        <div class="hotel-card-stats">${rooms}${places}${floors}</div>
        ${hotel.amenities ? `<div class="hotel-card-amenities">${amenityBadges(hotel.amenities)}</div>` : ''}
        ${hotel.managerContact ? `<div class="hotel-card-contact">📞 ${escHtml(hotel.managerContact)}</div>` : ''}
        <div class="hotel-card-footer">
          <span class="hotel-card-model" style="color:var(--color-text-muted);font-size:var(--text-xs)">Верифицирован в SRI</span>
          <span class="hotel-card-cta">Паспорт объекта →</span>
        </div>
      </div>
    </a>
  </article>`;
}

/* ── DOM элементы ──────────────────────────────────────────── */
const grid             = document.getElementById('hotel-grid');
const emptyState       = document.getElementById('empty-state');
const emptyResetBtn    = document.getElementById('empty-reset');
const searchInput      = document.getElementById('catalog-search');
const searchClearBtn   = document.getElementById('catalog-search-clear');
const regionSelect     = document.getElementById('filter-region');
const starsSelect      = document.getElementById('filter-stars');
const roomsSelect      = document.getElementById('filter-rooms');
const dealSelect       = document.getElementById('filter-deal-type');
const sortSelect       = document.getElementById('catalog-sort');
const dealButtons      = document.querySelectorAll('button[data-deal]');
const tagPremBtn       = document.getElementById('tag-premium-stars');
const countNumEl       = document.getElementById('filter-count-num');
const countLabelEl     = document.getElementById('filter-count-label');
const resetBtn         = document.getElementById('filter-reset');

/* ── Главная функция фильтрации и сортировки ────────────────── */
function applyFiltersAndSort() {
  if (!grid) return;
  const allHotels = Store ? Store.getAll().filter(h => h.status !== 'draft') : [];

  const q = filterState.search.trim().toLowerCase();

  // 1. Фильтрация
  const matched = allHotels.filter(hotel => {
    // Поисковый запрос
    if (q) {
      const matchName = (hotel.hotelName || '').toLowerCase().includes(q);
      const matchRegion = (hotel.region || '').toLowerCase().includes(q);
      const matchAddress = (hotel.address || '').toLowerCase().includes(q);
      const matchAmenities = (hotel.amenities || '').toLowerCase().includes(q);
      const matchEntity = (hotel.legalEntity || '').toLowerCase().includes(q);
      if (!matchName && !matchRegion && !matchAddress && !matchAmenities && !matchEntity) {
        return false;
      }
    }

    // Регион
    if (filterState.region !== 'all') {
      const regKey = hotel.regionKey || (typeof getRegionKey === 'function' ? getRegionKey(hotel.region) : '');
      if (regKey !== filterState.region) return false;
    }

    // Звёздность
    if (filterState.stars !== 'all') {
      const s = parseInt(hotel.stars, 10) || 0;
      if (filterState.stars === '5' && s !== 5) return false;
      if (filterState.stars === '4' && s !== 4) return false;
      if (filterState.stars === '3' && s !== 3) return false;
      if (filterState.stars === '1-2' && (s < 1 || s > 2)) return false;
    }

    // Номерной фонд
    if (filterState.rooms !== 'all') {
      const r = parseInt(hotel.roomsCount, 10) || 0;
      if (filterState.rooms === 'small' && r > 50) return false;
      if (filterState.rooms === 'medium' && (r <= 50 || r > 150)) return false;
      if (filterState.rooms === 'large' && r <= 150) return false;
    }

    // Формат сделки / Инвестиционная ситуация
    if (filterState.dealType !== 'all') {
      const deal = typeof window.getHotelDealConfig === 'function'
        ? window.getHotelDealConfig(hotel)
        : null;
      if (!deal || deal.key !== filterState.dealType) return false;
    }

    // Быстрый фильтр: Премиум (4★-5★)
    if (filterState.onlyPremium) {
      const s = parseInt(hotel.stars, 10) || 0;
      if (s < 4) return false;
    }

    return true;
  });

  // 2. Сортировка
  matched.sort((a, b) => {
    switch (filterState.sort) {
      case 'rooms-asc':
        return (parseInt(a.roomsCount, 10) || 0) - (parseInt(b.roomsCount, 10) || 0);
      case 'stars-desc':
        return (parseInt(b.stars, 10) || 0) - (parseInt(a.stars, 10) || 0);
      case 'year-desc':
        return (parseInt(b.yearCommissioned, 10) || 0) - (parseInt(a.yearCommissioned, 10) || 0);
      case 'name-asc':
        return (a.hotelName || '').localeCompare(b.hotelName || '', 'ru');
      case 'rooms-desc':
      default:
        return (parseInt(b.roomsCount, 10) || 0) - (parseInt(a.roomsCount, 10) || 0);
    }
  });

  // 3. Отображение карточек или пустого состояния
  if (matched.length === 0) {
    grid.innerHTML = '';
    if (emptyState) {
      emptyState.hidden = false;
      emptyState.style.display = 'flex';
      emptyState.classList.remove('is-hidden');
      const t = emptyState.querySelector('.empty-state-title');
      const d = emptyState.querySelector('.empty-state-desc');
      if (t) t.textContent = allHotels.length === 0 ? 'Каталог пока пуст' : 'Ничего не найдено';
      if (d) d.textContent = allHotels.length === 0 ? 'Добавьте отели через панель управления' : 'Попробуйте изменить параметры поиска или сбросить фильтры';
    }
  } else {
    if (emptyState) {
      emptyState.hidden = true;
      emptyState.style.display = 'none';
      emptyState.classList.add('is-hidden');
    }
    grid.innerHTML = matched.map(buildCard).join('');
  }

  // 4. Обновление счётчиков
  if (countNumEl) countNumEl.textContent = matched.length;
  if (countLabelEl) countLabelEl.textContent = formatObjectsCountWord(matched.length);

  updateHeaderStats(matched.length, allHotels);
}

/* ── Обновление сводных показателей в Hero ──────────────────── */
function updateHeaderStats(count, allHotels) {
  const statNums = document.querySelectorAll('.ph-stat-num');
  if (statNums[0]) statNums[0].textContent = count;
  if (statNums[1]) {
    const regions = new Set(allHotels.map(h => h.regionKey).filter(Boolean)).size;
    statNums[1].textContent = regions || (allHotels.length > 0 ? 1 : 0);
  }
}

/* ── Полный сброс параметров ────────────────────────────────── */
function resetAllFilters() {
  filterState.search = '';
  filterState.region = 'all';
  filterState.stars = 'all';
  filterState.rooms = 'all';
  filterState.dealType = 'all';
  filterState.sort = 'rooms-desc';
  filterState.onlyPremium = false;

  if (searchInput) searchInput.value = '';
  if (searchClearBtn) searchClearBtn.hidden = true;
  if (regionSelect) regionSelect.value = 'all';
  if (starsSelect) starsSelect.value = 'all';
  if (roomsSelect) roomsSelect.value = 'all';
  if (dealSelect) dealSelect.value = 'all';
  if (sortSelect) sortSelect.value = 'rooms-desc';

  const dealBtns = document.querySelectorAll('button[data-deal]');
  dealBtns.forEach(b => {
    b.classList.toggle('is-active', b.dataset.deal === 'all');
  });

  if (tagPremBtn) {
    tagPremBtn.classList.remove('is-active');
    tagPremBtn.dataset.active = 'false';
  }

  applyFiltersAndSort();
}

/* ── Подключение слушателей событий ─────────────────────────── */
if (searchInput) {
  searchInput.addEventListener('input', () => {
    filterState.search = searchInput.value;
    if (searchClearBtn) searchClearBtn.hidden = !searchInput.value;
    applyFiltersAndSort();
  });
}

if (searchClearBtn) {
  searchClearBtn.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    searchClearBtn.hidden = true;
    filterState.search = '';
    applyFiltersAndSort();
  });
}

if (regionSelect) {
  regionSelect.addEventListener('change', () => {
    filterState.region = regionSelect.value;
    applyFiltersAndSort();
  });
}

if (starsSelect) {
  starsSelect.addEventListener('change', () => {
    filterState.stars = starsSelect.value;
    applyFiltersAndSort();
  });
}

if (roomsSelect) {
  roomsSelect.addEventListener('change', () => {
    filterState.rooms = roomsSelect.value;
    applyFiltersAndSort();
  });
}

if (dealSelect) {
  dealSelect.addEventListener('change', () => {
    filterState.dealType = dealSelect.value;
    const dealBtns = document.querySelectorAll('button[data-deal]');
    dealBtns.forEach(b => {
      b.classList.toggle('is-active', b.dataset.deal === filterState.dealType);
    });
    applyFiltersAndSort();
  });
}

document.querySelectorAll('button[data-deal]').forEach(btn => {
  btn.addEventListener('click', () => {
    const val = btn.dataset.deal || 'all';
    filterState.dealType = val;
    if (dealSelect) dealSelect.value = val;
    document.querySelectorAll('button[data-deal]').forEach(b => {
      b.classList.toggle('is-active', b.dataset.deal === val);
    });
    applyFiltersAndSort();
  });
});

if (sortSelect) {
  sortSelect.addEventListener('change', () => {
    filterState.sort = sortSelect.value;
    applyFiltersAndSort();
  });
}

if (tagPremBtn) {
  tagPremBtn.addEventListener('click', () => {
    filterState.onlyPremium = !filterState.onlyPremium;
    tagPremBtn.classList.toggle('is-active', filterState.onlyPremium);
    tagPremBtn.dataset.active = String(filterState.onlyPremium);
    applyFiltersAndSort();
  });
}

if (resetBtn) resetBtn.addEventListener('click', resetAllFilters);
if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetAllFilters);

/* ── Синхронизация и инициализация ──────────────────────────── */
window.addEventListener('sri_hotels_updated', () => {
  applyFiltersAndSort();
});

document.addEventListener('DOMContentLoaded', () => {
  applyFiltersAndSort();
});

applyFiltersAndSort();
