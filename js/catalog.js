/* ============================================================
   CATALOG.JS — Рендер и фильтрация каталога отелей
   Silk Route Invest · Uzbekistan
   Каноническая схема 19 полей
   ============================================================ */
'use strict';

const Store = window.HotelStore;

/* ── Состояние фильтров ─────────────────────────────────────── */
const activeFilters = { region: 'all', stars: 'all' };

/* ── Escaping ──────────────────────────────────────────────── */
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

/* ── Рендер карточек ────────────────────────────────────────── */
function buildCard(hotel) {
  const photo = (Array.isArray(hotel.photos) && hotel.photos.length > 0 && hotel.photos[0])
    ? hotel.photos[0]
    : './assets/hotel-hero.png';

  const stars = hotel.stars ? `<span class="hotel-card-stars">${starsHtml(hotel.stars)}</span>` : '';
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
           data-region="${escHtml(hotel.regionKey || 'other')}"
           data-stars="${escHtml(hotel.stars || '')}"
           data-rooms="${escHtml(hotel.roomsCount || 0)}"
           data-year="${escHtml(hotel.yearCommissioned || 0)}"
           data-id="${escHtml(hotel.id)}"
           role="listitem">
    <a href="${passportUrl}" class="hotel-card-link" style="text-decoration:none;color:inherit;display:block">
      <div class="hotel-card-img-wrap">
        <img src="${photo}" alt="${escHtml(hotel.hotelName)}" class="hotel-card-img" loading="lazy" onerror="this.onerror=null;this.src='./assets/hotel-hero.png'" />
        <div class="hotel-card-img-overlay"></div>
        <div class="hotel-card-badges">
          ${stars}
          ${hotel.hasPresentation ? '<span class="hotel-card-badge">📎 Презентация</span>' : ''}
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
      emptyState.style.display = 'flex';
      emptyState.classList.remove('is-hidden');
      const t = emptyState.querySelector('.empty-state-title');
      const d = emptyState.querySelector('.empty-state-desc');
      if (t) t.textContent = 'Каталог пока пуст';
      if (d) d.textContent = 'Добавьте отели через панель управления';
    }
    if (countEl) countEl.textContent = '0';
    if (shownEl) shownEl.textContent = '0';
    if (totalEl) totalEl.textContent = '0';
    updateHeaderStats(0, []);
    return;
  }

  if (emptyState) {
    emptyState.hidden = true;
    emptyState.style.display = 'none';
    emptyState.classList.add('is-hidden');
  }

  grid.innerHTML = hotels.map(buildCard).join('');
  applyFilters();
  updateHeaderStats(hotels.length, hotels);
}

/* ── Обновить счетчики в шапке страницы ─────────────────────── */
function updateHeaderStats(count, hotels) {
  const statNums = document.querySelectorAll('.ph-stat-num');
  if (statNums[0]) statNums[0].textContent = count;
  if (statNums[1]) {
    const regions = new Set(hotels.map(h => h.regionKey).filter(Boolean)).size;
    statNums[1].textContent = regions || (count > 0 ? 1 : 0);
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
      (activeFilters.stars  === 'all' || activeFilters.stars  === card.dataset.stars);

    if (match) {
      card.hidden = false;
      card.style.display = '';
      card.classList.remove('is-hidden');
      visible++;
    } else {
      card.classList.add('is-hidden');
      card.hidden = true;
      card.style.display = 'none';
    }
  });

  if (countEl) countEl.textContent = visible;
  if (shownEl) shownEl.textContent = visible;

  if (emptyState) {
    if (visible > 0) {
      emptyState.hidden = true;
      emptyState.style.display = 'none';
      emptyState.classList.add('is-hidden');
    } else {
      emptyState.hidden = false;
      emptyState.style.display = 'flex';
      emptyState.classList.remove('is-hidden');
      const t = emptyState.querySelector('.empty-state-title');
      const d = emptyState.querySelector('.empty-state-desc');
      if (t) t.textContent = 'По выбранным фильтрам ничего не найдено';
      if (d) d.textContent = 'Попробуйте сбросить фильтры или выбрать другой регион';
    }
  }
}

function onChipClick(chip) {
  const filterType  = chip.dataset.filter;
  const filterValue = chip.dataset.value;

  document.querySelectorAll(`.filter-chip[data-filter="${filterType}"]`).forEach(c => {
    c.classList.remove('filter-chip--active');
    c.setAttribute('aria-pressed', 'false');
  });

  chip.classList.add('filter-chip--active');
  chip.setAttribute('aria-pressed', 'true');
  activeFilters[filterType] = filterValue;
  applyFilters();
}

document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => onChipClick(chip));
});

/* ── Сброс фильтров ─────────────────────────────────────────── */
function resetFilters() {
  activeFilters.region = 'all';
  activeFilters.stars = 'all';

  document.querySelectorAll('.filter-chip').forEach(c => {
    if (c.dataset.value === 'all') {
      c.classList.add('filter-chip--active');
      c.setAttribute('aria-pressed', 'true');
    } else {
      c.classList.remove('filter-chip--active');
      c.setAttribute('aria-pressed', 'false');
    }
  });
  applyFilters();
}

const resetBtn      = document.getElementById('filter-reset');
const emptyResetBtn = document.getElementById('empty-reset');
if (resetBtn)      resetBtn.addEventListener('click', resetFilters);
if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetFilters);

/* ── Сортировка ─────────────────────────────────────────────── */
function sortCards(criteria) {
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll('.hotel-card--catalog'));
  cards.sort((a, b) => {
    if (criteria === 'stars') {
      return (parseInt(b.dataset.stars, 10) || 0) - (parseInt(a.dataset.stars, 10) || 0);
    }
    if (criteria === 'year') {
      return (parseInt(b.dataset.year, 10) || 0) - (parseInt(a.dataset.year, 10) || 0);
    }
    // По умолчанию: по количеству номеров (rooms)
    return (parseInt(b.dataset.rooms, 10) || 0) - (parseInt(a.dataset.rooms, 10) || 0);
  });
  cards.forEach(c => grid.appendChild(c));
}

const sortBtns = document.querySelectorAll('.sort-btn');
sortBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    sortBtns.forEach(b => b.classList.remove('sort-btn--active'));
    btn.classList.add('sort-btn--active');
    if (btn.id === 'sort-stars') sortCards('stars');
    else if (btn.id === 'sort-year') sortCards('year');
    else sortCards('rooms');
  });
});

/* ── Фиксация плашки фильтров при скролле ────────────────────── */
const filterBar    = document.getElementById('filter-bar');
const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height'), 10) || 68;
if (filterBar) {
  const stickObserver = new IntersectionObserver(
    ([e]) => filterBar.classList.toggle('is-stuck', !e.isIntersecting),
    { rootMargin: `-${headerHeight + 1}px 0px 0px 0px`, threshold: 0 }
  );
  stickObserver.observe(filterBar);
}

/* ── Слушатель обновления отелей ────────────────────────────── */
window.addEventListener('sri_hotels_updated', () => {
  renderCatalog();
});

/* ── Инициализация ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderCatalog();
});
renderCatalog();
