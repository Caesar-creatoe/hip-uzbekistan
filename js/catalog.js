/* ============================================================
   CATALOG.JS — Рендер и фильтрация каталога из localStorage
   Silk Route Invest · Uzbekistan
   ============================================================ */
'use strict';

const Store = window.HotelStore;

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
  const passportUrl = `passport.html?hotel=${encodeURIComponent(hotel.slug || hotel.id)}`;

  return `
  <article class="hotel-card hotel-card--catalog appear"
           data-region="${escHtml(hotel.regionKey||'other')}"
           data-stars="${escHtml(hotel.stars||'')}"
           data-model="${escHtml(hotel.investmentModel||'all')}"
           data-iri="${escHtml(hotel.iri||'all')}"
           data-id="${escHtml(hotel.id)}"
           role="listitem">
    <a href="${passportUrl}" class="hotel-card-link" style="text-decoration:none;color:inherit;display:block">
      <div class="hotel-card-img-wrap">
        <img src="${photo}" alt="${escHtml(hotel.hotelName)}" class="hotel-card-img" loading="lazy" />
        <div class="hotel-card-img-overlay"></div>
        <div class="hotel-card-badges">
          ${stars}
          ${hotel.hasPresentation ? '<span class="hotel-card-badge">📎 Презентация</span>' : ''}
          ${hotel.status === 'draft' ? '<span class="hotel-card-badge hotel-card-badge--draft">Черновик</span>' : ''}
          ${hotel.iri ? `<span class="hotel-card-badge hotel-card-badge--iri">IRI ${escHtml(hotel.iri)}</span>` : ''}
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
          <span class="hotel-card-model">${escHtml(hotel.modelLabel || 'Инвестиционный объект')}</span>
          <span class="hotel-card-cta">Паспорт объекта →</span>
        </div>
      </div>
    </a>
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
  const hotels = Store ? Store.getAll().filter(h => h.status !== 'draft') : [];

  if (hotels.length === 0) {
    grid.innerHTML = '';
    if (emptyState) {
      emptyState.hidden = false;
      emptyState.querySelector('.empty-state-title').textContent = 'Каталог пока пуст';
      emptyState.querySelector('.empty-state-desc').textContent = 'Добавьте отели через панель управления';
    }
    if (countEl) countEl.textContent = '0';
    if (shownEl) shownEl.textContent = '0';
    if (totalEl) totalEl.textContent = '0';
    updateHeaderStats(0, []);
    return;
  }

  if (emptyState) emptyState.hidden = true;
  grid.innerHTML = hotels.map(buildCard).join('');
  applyFilters();
  updateHeaderStats(hotels.length, hotels);
}

/* ── Обновить KPI в шапке страницы ─────────────────────────── */
function updateHeaderStats(count, hotels) {
  const statNums = document.querySelectorAll('.ph-stat-num');
  if (statNums[0]) statNums[0].textContent = count;
  if (statNums[1]) {
    const regions = new Set(hotels.map(h => h.regionKey)).size;
    statNums[1].textContent = regions || 14;
  }
  if (totalEl) totalEl.textContent = count;
}

/* ── Фильтрация ─────────────────────────────────────────────── */
function applyFilters() {
  if (!grid) return;
  const cards = grid.querySelectorAll('.hotel-card--catalog');
  let visible = 0;
  cards.forEach(card => {
    const match =
      (activeFilters.region === 'all' || activeFilters.region === card.dataset.region) &&
      (activeFilters.stars  === 'all' || activeFilters.stars  === card.dataset.stars) &&
      (activeFilters.model  === 'all' || activeFilters.model  === card.dataset.model) &&
      (activeFilters.iri    === 'all' || activeFilters.iri    === card.dataset.iri);
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

// Слушаем изменения в localStorage (обновления из другой вкладки / админки)
window.addEventListener('storage', e => {
  if (e.key === 'sri_hotels') renderCatalog();
});
window.addEventListener('sri_hotels_updated', () => renderCatalog());
