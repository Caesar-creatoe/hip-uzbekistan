/* ============================================================
   CATALOG.JS — Рендер и фильтрация каталога из localStorage
   Silk Route Invest · Uzbekistan
   ============================================================ */
'use strict';

/* ── Хранилище (общий с admin.js) ─────────────────────────── */
const HotelStore = {
  KEY: 'sri_hotels',
  getAll() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { return []; }
  }
};

/* ── Состояние фильтров ─────────────────────────────────────── */
const activeFilters = { region: 'all', stars: 'all', model: 'all', iri: 'all' };

/* ── Escaping ──────────────────────────────────────────────── */
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function starsHtml(n) {
  const num = parseInt(n);
  if (isNaN(num)) return escHtml(n || '');
  return '★'.repeat(Math.min(num,5));
}
function amenityBadges(txt) {
  if (!txt) return '';
  const icons = {pool:'🏊',spa:'💆',ресторан:'🍽',restaurant:'🍽',лифт:'🛗',elevator:'🛗',
    сауна:'🔥',sauna:'🔥',спорт:'⚽',sport:'⚽',gym:'🏋',fitness:'🏋',конференц:'🎙',conference:'🎙',
    сад:'🌿',garden:'🌿',детск:'👶',children:'👶',каток:'⛸',бар:'🍹',bar:'🍹'};
  const parts = txt.toLowerCase().split(/[,;]+/);
  return parts.slice(0,4).map(p => {
    const icon = Object.entries(icons).find(([k]) => p.includes(k));
    return `<span class="catalog-amenity">${icon?icon[1]+' ':''}${escHtml(p.trim())}</span>`;
  }).join('');
}

/* ── Рендер карточек ────────────────────────────────────────── */
function buildCard(hotel) {
  const photo = (hotel.photos && hotel.photos[0]) ? hotel.photos[0] : './assets/hotel-hero.png';
  const stars = hotel.stars ? `<span class="hotel-card-stars">${starsHtml(hotel.stars)}</span>` : '';
  const region = hotel.region ? `<span class="hotel-card-region">📍 ${escHtml(hotel.region)}</span>` : '';
  const rooms = hotel.roomsCount ? `<span class="hotel-stat"><strong>${escHtml(hotel.roomsCount)}</strong><small>номеров</small></span>` : '';
  const places = hotel.placesCount ? `<span class="hotel-stat"><strong>${escHtml(hotel.placesCount)}</strong><small>мест</small></span>` : '';
  const floors = hotel.floors ? `<span class="hotel-stat"><strong>${escHtml(hotel.floors)}</strong><small>эт.</small></span>` : '';
  const year = hotel.yearCommissioned ? `<span class="hotel-card-year">${escHtml(hotel.yearCommissioned)}</span>` : '';

  return `
  <article class="hotel-card hotel-card--catalog appear"
           data-region="${escHtml(hotel.regionKey||'other')}"
           data-stars="${escHtml(hotel.stars||'')}"
           data-model="all"
           data-iri="all"
           data-id="${escHtml(hotel.id)}"
           role="listitem">
    <div class="hotel-card-img-wrap">
      <img src="${photo}" alt="${escHtml(hotel.hotelName)}" class="hotel-card-img" loading="lazy" />
      <div class="hotel-card-img-overlay"></div>
      <div class="hotel-card-badges">
        ${stars}
        ${hotel.hasPresentation ? '<span class="hotel-card-badge">📎 Презентация</span>' : ''}
        ${hotel.status === 'draft' ? '<span class="hotel-card-badge hotel-card-badge--draft">Черновик</span>' : ''}
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
        <span class="hotel-card-model">Инвестиционный объект</span>
        <span class="hotel-card-cta">Подробнее →</span>
      </div>
    </div>
  </article>`;
}

/* ── Основной рендер ────────────────────────────────────────── */
const grid       = document.getElementById('hotel-grid');
const emptyState = document.getElementById('empty-state');
const countEl    = document.getElementById('filter-count-num');
const shownEl    = document.getElementById('results-shown');
const totalEl    = document.querySelector('.results-total');

function renderCatalog() {
  if (!grid) return;
  const hotels = HotelStore.getAll().filter(h => h.status !== 'draft');

  if (hotels.length === 0) {
    grid.innerHTML = '';
    if (emptyState) {
      emptyState.hidden = false;
      emptyState.querySelector('.empty-state-title').textContent = 'Каталог пока пуст';
      emptyState.querySelector('.empty-state-desc').textContent = 'Добавьте отели через Admin-панель';
    }
    if (countEl) countEl.textContent = '0';
    if (shownEl) shownEl.textContent = '0';
    if (totalEl) totalEl.textContent = '0';
    // Обновить статистику
    updateHeaderStats(0, []);
    return;
  }

  grid.innerHTML = hotels.map(buildCard).join('');

  // Обновить фильтры по регионам
  updateRegionFilters(hotels);

  applyFilters();

  // Обновить заголовочные KPI
  updateHeaderStats(hotels.length, hotels);
}

/* ── Обновить KPI в шапке страницы ─────────────────────────── */
function updateHeaderStats(count, hotels) {
  const statNums = document.querySelectorAll('.ph-stat-num');
  if (statNums[0]) statNums[0].textContent = count;
  if (statNums[1]) {
    const regions = new Set(hotels.map(h => h.regionKey)).size;
    statNums[1].textContent = regions || 0;
  }
  if (totalEl) totalEl.textContent = count;
}

/* ── Обновить чипы регионов динамически ─────────────────────── */
function updateRegionFilters(hotels) {
  const regionMap = {
    tashkent: 'Ташкент', samarkand: 'Самарканд', bukhara: 'Бухара',
    khorezm: 'Хорезм', fergana: 'Фергана', namangan: 'Наманган',
    andijan: 'Андижан', other: 'Другие'
  };
  const usedKeys = [...new Set(hotels.map(h => h.regionKey || 'other'))];
  const container = document.querySelector('[data-filter="region"]')?.closest('.filter-chips');
  if (!container) return;
  // Сохранить чип "Все"
  const allChip = container.querySelector('[data-value="all"]');
  if (!allChip) return;
  container.innerHTML = '';
  container.appendChild(allChip);
  usedKeys.sort().forEach(key => {
    if (key === 'all') return;
    const btn = document.createElement('button');
    btn.className = 'filter-chip';
    btn.dataset.filter = 'region';
    btn.dataset.value = key;
    btn.textContent = regionMap[key] || key;
    container.appendChild(btn);
    btn.addEventListener('click', () => onChipClick(btn));
  });
}

/* ── Фильтрация ─────────────────────────────────────────────── */
function applyFilters() {
  if (!grid) return;
  const cards = grid.querySelectorAll('.hotel-card--catalog');
  let visible = 0;
  cards.forEach(card => {
    const match =
      (activeFilters.region === 'all' || activeFilters.region === card.dataset.region) &&
      (activeFilters.stars  === 'all' || activeFilters.stars  === card.dataset.stars);
    if (match) {
      card.hidden = false;
      card.classList.remove('is-hidden');
      visible++;
    } else {
      card.classList.add('is-hidden');
      setTimeout(() => { if (card.classList.contains('is-hidden')) card.hidden = true; }, 250);
    }
  });
  if (countEl) countEl.textContent = visible;
  if (shownEl) shownEl.textContent = visible;
  if (emptyState) emptyState.hidden = visible > 0;
}

function onChipClick(chip) {
  const filterType  = chip.dataset.filter;
  const filterValue = chip.dataset.value;
  document.querySelectorAll(`.filter-chip[data-filter="${filterType}"]`).forEach(c => {
    c.classList.remove('filter-chip--active');
    c.setAttribute('aria-pressed','false');
  });
  chip.classList.add('filter-chip--active');
  chip.setAttribute('aria-pressed','true');
  activeFilters[filterType] = filterValue;
  applyFilters();
}

document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => onChipClick(chip));
});

/* ── Сброс ──────────────────────────────────────────────────── */
function resetFilters() {
  Object.keys(activeFilters).forEach(k => activeFilters[k] = 'all');
  document.querySelectorAll('.filter-chip').forEach(c => {
    if (c.dataset.value === 'all') {
      c.classList.add('filter-chip--active');
      c.setAttribute('aria-pressed','true');
    } else {
      c.classList.remove('filter-chip--active');
      c.setAttribute('aria-pressed','false');
    }
  });
  applyFilters();
}
const resetBtn      = document.getElementById('filter-reset');
const emptyResetBtn = document.getElementById('empty-reset');
if (resetBtn)      resetBtn.addEventListener('click', resetFilters);
if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetFilters);

/* ── Сортировка ─────────────────────────────────────────────── */
document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('sort-btn--active'));
    btn.classList.add('sort-btn--active');
  });
});

/* ── Filter bar sticky ──────────────────────────────────────── */
const filterBar    = document.getElementById('filter-bar');
const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height'),10) || 68;
if (filterBar) {
  const stickObserver = new IntersectionObserver(
    ([e]) => filterBar.classList.toggle('is-stuck', !e.isIntersecting),
    { rootMargin: `-${headerHeight+1}px 0px 0px 0px`, threshold: 0 }
  );
  stickObserver.observe(filterBar);
}

/* ── Init ───────────────────────────────────────────────────── */
renderCatalog();

// Слушаем изменения в localStorage (обновления из другой вкладки)
window.addEventListener('storage', e => {
  if (e.key === 'sri_hotels') renderCatalog();
});
