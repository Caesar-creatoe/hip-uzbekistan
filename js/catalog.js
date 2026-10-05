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
  onlyPremium: false,
  // Экономика
  hasEco: false,           // только с экономическими данными
  paybackMax: null,        // максимальный срок окупаемости (лет)
  roiMin: null,            // минимальный ROI (%)
  ecoSort: false,          // используется в сортировке
};

/* ── Состояние режима сравнения ─────────────────────── */
const compareState = {
  ids: [],
  max: 3,
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

  // Экономические чипы
  let ecoStrip = '';
  const Fmt = window.EconomicsFmt;
  const Schema = window.EconomicsSchema;
  const Calc = window.EconomicsCalc;
  if (Fmt && Schema && hotel.economics) {
    const eco = Schema.get(hotel);
    const ecoC = Calc ? Calc.recalcAll(eco, hotel) : eco;
    const chips = [];
    if (ecoC.occupancy !== null) chips.push({ label: 'OCC', val: Fmt.pct(ecoC.occupancy) });
    if (ecoC.adr !== null) chips.push({ label: 'ADR', val: Fmt.usd(ecoC.adr) });
    if (ecoC.ebitdaMargin !== null) chips.push({ label: 'EBITDA', val: Fmt.pct(ecoC.ebitdaMargin) });
    if (ecoC.payback !== null) chips.push({ label: 'PBK', val: Fmt.years(ecoC.payback) });
    if (chips.length) {
      ecoStrip = `<div class="hotel-eco-strip">${chips.map(c => `
        <div class="hotel-eco-chip">
          <span class="hotel-eco-chip-label">${escHtml(c.label)}</span>
          <span class="hotel-eco-chip-val">${c.val}</span>
        </div>`).join('')}</div>`;
    }
  }

  // Кнопка сравнения
  const isInCompare = compareState.ids.includes(hotel.id);
  const compareBtn = `<button type="button"
    class="compare-toggle-btn ${isInCompare ? 'is-selected' : ''}"
    data-compare-id="${escHtml(hotel.id)}"
    data-compare-name="${escHtml(hotel.hotelName)}"
    onclick="event.stopPropagation();event.preventDefault();toggleCompare('${escHtml(hotel.id)}','${escHtml(hotel.hotelName).replace(/'/g, '\\\'')}')"
    title="Добавить в сравнение">⇄ Сравнить</button>`;

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
        ${ecoStrip}
        <div class="hotel-card-footer">
          <span class="hotel-card-model" style="color:var(--color-text-muted);font-size:var(--text-xs)">Верифицирован в SRI</span>
          <span class="hotel-card-cta">Паспорт объекта →</span>
        </div>
      </div>
    </a>
    <div style="padding:8px 16px 12px;border-top:1px solid var(--color-border,#EDE9E2)">
      ${compareBtn}
    </div>
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

    // Фильтр: только с экономическими данными
    if (filterState.hasEco) {
      if (!hotel.economics) return false;
      const eco = hotel.economics;
      const hasData = [eco.occupancy, eco.adr, eco.ebitda, eco.valuation, eco.totalRevenue]
        .some(v => v !== null && v !== undefined);
      if (!hasData) return false;
    }

    // Фильтр: максимальный Payback
    if (filterState.paybackMax !== null && filterState.paybackMax > 0) {
      if (!hotel.economics) return false;
      const eco = hotel.economics;
      let payback = eco.payback;
      if (!payback && eco.valuation && eco.ebitda && eco.ebitda > 0) {
        payback = eco.valuation / eco.ebitda;
      }
      if (!payback || payback > filterState.paybackMax) return false;
    }

    // Фильтр: минимальный ROI %
    if (filterState.roiMin !== null && filterState.roiMin > 0) {
      if (!hotel.economics) return false;
      const eco = hotel.economics;
      let roi = eco.roi;
      if (!roi && eco.ebitda && eco.valuation && eco.valuation > 0) {
        roi = eco.ebitda / eco.valuation * 100;
      }
      if (!roi || roi < filterState.roiMin) return false;
    }

    return true;
  });

  // 2. Сортировка
  const getEco = h => {
    if (!h.economics) return null;
    if (window.EconomicsCalc) return window.EconomicsCalc.recalcAll(window.EconomicsSchema.get(h), h);
    return h.economics;
  };
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
      case 'payback-asc': {
        const eA = getEco(a); const eB = getEco(b);
        const pbA = eA ? (eA.payback || 999) : 999;
        const pbB = eB ? (eB.payback || 999) : 999;
        return pbA - pbB;
      }
      case 'roi-desc': {
        const eA = getEco(a); const eB = getEco(b);
        const rA = eA ? (eA.roi || 0) : 0;
        const rB = eB ? (eB.roi || 0) : 0;
        return rB - rA;
      }
      case 'occ-desc': {
        const eA = getEco(a); const eB = getEco(b);
        return ((eB ? eB.occupancy : 0) || 0) - ((eA ? eA.occupancy : 0) || 0);
      }
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


/* ── Eco-фильтры ─────────────────────────────────────────────── */
const hasEcoBtn    = document.getElementById('filter-has-eco');
const paybackMaxEl = document.getElementById('filter-payback-max');
const roiMinEl     = document.getElementById('filter-roi-min');

if (hasEcoBtn) {
  hasEcoBtn.addEventListener('click', () => {
    filterState.hasEco = !filterState.hasEco;
    hasEcoBtn.classList.toggle('is-active', filterState.hasEco);
    hasEcoBtn.dataset.active = String(filterState.hasEco);
    applyFiltersAndSort();
  });
}
if (paybackMaxEl) {
  paybackMaxEl.addEventListener('input', () => {
    const v = parseFloat(paybackMaxEl.value);
    filterState.paybackMax = isNaN(v) ? null : v;
    applyFiltersAndSort();
  });
}
if (roiMinEl) {
  roiMinEl.addEventListener('input', () => {
    const v = parseFloat(roiMinEl.value);
    filterState.roiMin = isNaN(v) ? null : v;
    applyFiltersAndSort();
  });
}

/* ── Режим сравнения ─────────────────────────────────────────── */
function renderCompareBar() {
  let bar = document.getElementById('compare-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'compare-bar';
    bar.className = 'compare-bar';
    bar.innerHTML = `
      <span class="compare-bar-label">Сравнение</span>
      <div class="compare-slots" id="compare-slots"></div>
      <button type="button" class="btn-compare-now" id="btn-compare-now">Сравнить →</button>
      <button type="button" class="btn-compare-clear" id="btn-compare-clear">✕ Очистить</button>`;
    document.body.appendChild(bar);
    document.getElementById('btn-compare-now')?.addEventListener('click', openCompareModal);
    document.getElementById('btn-compare-clear')?.addEventListener('click', () => {
      compareState.ids = [];
      renderCompareBar();
      applyFiltersAndSort();
    });
  }
  const slots = document.getElementById('compare-slots');
  if (slots) {
    const all = Store ? Store.getAll() : [];
    slots.innerHTML = compareState.ids.map(id => {
      const h = all.find(x => x.id === id);
      return `<div class="compare-slot">
        <span>${escHtml(h ? h.hotelName : id)}</span>
        <button class="compare-slot-remove" onclick="toggleCompare('${escHtml(id)}','')">✕</button>
      </div>`;
    }).join('');
  }
  bar.classList.toggle('is-visible', compareState.ids.length >= 2);
}

function toggleCompare(id, name) {
  const idx = compareState.ids.indexOf(id);
  if (idx === -1) {
    if (compareState.ids.length >= compareState.max) compareState.ids.shift();
    compareState.ids.push(id);
  } else {
    compareState.ids.splice(idx, 1);
  }
  renderCompareBar();
  applyFiltersAndSort();
}
window.toggleCompare = toggleCompare;

function openCompareModal() {
  document.getElementById('compare-modal-overlay')?.remove();
  const all = Store ? Store.getAll() : [];
  const hotels = compareState.ids.map(id => all.find(h => h.id === id)).filter(Boolean);
  if (!hotels.length) return;

  const Fmt = window.EconomicsFmt;
  const Schema = window.EconomicsSchema;
  const Calc = window.EconomicsCalc;
  const getEcoCalc = h => (Calc && Schema) ? Calc.recalcAll(Schema.get(h), h) : null;
  const ecos = hotels.map(getEcoCalc);

  const findBest = (vals, higherIsBetter) => {
    const nums = vals.map(v => parseFloat(String(v).replace(/[^0-9.-]/g,'')) || (higherIsBetter ? -Infinity : Infinity));
    const best = higherIsBetter ? Math.max(...nums) : Math.min(...nums);
    return nums.map(n => n === best && isFinite(n));
  };

  const fmtSafe = fn => { try { return fn(); } catch { return '—'; } };

  const rows = [
    { label: 'Звёздность',    vals: hotels.map(h => '★'.repeat(Math.min(parseInt(h.stars)||0,5))||'—'), higher: true },
    { label: 'Номеров',       vals: hotels.map(h => h.roomsCount||'—'), higher: true },
    { label: 'Год ввода',     vals: hotels.map(h => h.yearCommissioned||'—'), higher: true },
    { label: 'Occupancy',     vals: ecos.map(e => e && e.occupancy != null && Fmt ? fmtSafe(()=>Fmt.pct(e.occupancy)) : '—'), higher: true },
    { label: 'ADR',           vals: ecos.map(e => e && e.adr != null && Fmt ? fmtSafe(()=>Fmt.usd(e.adr)) : '—'), higher: true },
    { label: 'RevPAR',        vals: ecos.map(e => e && e.revpar != null && Fmt ? fmtSafe(()=>Fmt.usd(e.revpar,1)) : '—'), higher: true },
    { label: 'Total Revenue', vals: ecos.map(e => e && e.totalRevenue != null && Fmt ? fmtSafe(()=>Fmt.money(e.totalRevenue,true)) : '—'), higher: true },
    { label: 'EBITDA',        vals: ecos.map(e => e && e.ebitda != null && Fmt ? fmtSafe(()=>Fmt.money(e.ebitda,true)) : '—'), higher: true },
    { label: 'EBITDA Margin', vals: ecos.map(e => e && e.ebitdaMargin != null && Fmt ? fmtSafe(()=>Fmt.pct(e.ebitdaMargin)) : '—'), higher: true },
    { label: 'Valuation',     vals: ecos.map(e => e && e.valuation != null && Fmt ? fmtSafe(()=>Fmt.money(e.valuation,true)) : '—'), higher: false },
    { label: 'Price per Key', vals: ecos.map(e => e && e.pricePerKey != null && Fmt ? fmtSafe(()=>Fmt.money(e.pricePerKey,true)) : '—'), higher: false },
    { label: 'Payback',       vals: ecos.map(e => e && e.payback != null && Fmt ? fmtSafe(()=>Fmt.years(e.payback)) : '—'), higher: false },
    { label: 'IRR',           vals: ecos.map(e => e && e.irr != null && Fmt ? fmtSafe(()=>Fmt.pct(e.irr)) : '—'), higher: true },
    { label: 'ROI',           vals: ecos.map(e => e && e.roi != null && Fmt ? fmtSafe(()=>Fmt.pct(e.roi)) : '—'), higher: true },
    { label: 'Cap Rate',      vals: ecos.map(e => e && e.capRate != null && Fmt ? fmtSafe(()=>Fmt.pct(e.capRate)) : '—'), higher: true },
  ];

  const overlay = document.createElement('div');
  overlay.className = 'compare-modal-overlay';
  overlay.id = 'compare-modal-overlay';
  overlay.innerHTML = `
    <div class="compare-modal">
      <div class="compare-modal-header">
        <span class="compare-modal-title">Сравнение объектов (${hotels.length})</span>
        <button class="compare-modal-close" onclick="document.getElementById('compare-modal-overlay').remove()">✕</button>
      </div>
      <div class="compare-table-wrap">
        <table class="compare-table">
          <thead>
            <tr>
              <th>Показатель</th>
              ${hotels.map(h => `<th><a href="passport.html?hotel=${escHtml(h.slug||h.id)}" target="_blank" style="color:inherit;text-decoration:none">${escHtml(h.hotelName)}</a></th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => {
              const isBest = findBest(row.vals, row.higher);
              return `<tr><td>${escHtml(row.label)}</td>${row.vals.map((v,i)=>{
                const nd = v==='—';
                return `<td class="${nd?'is-nd':isBest[i]?'is-best':''}">${v}</td>`;
              }).join('')}</tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target===overlay) overlay.remove(); });
  document.addEventListener('keydown', function onEsc(e) {
    if (e.key==='Escape') { overlay.remove(); document.removeEventListener('keydown',onEsc); }
  });
}

/* ── Синхронизация и инициализация ──────────────────────────── */
window.addEventListener('sri_hotels_updated', () => { applyFiltersAndSort(); });
window.addEventListener('storage', (e) => {
  if (e.key === 'sri_hotels_cache' || e.key === 'sri_hotels_last_updated') {
    if (Store && typeof Store.reloadFromCache === 'function') Store.reloadFromCache();
    applyFiltersAndSort();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  applyFiltersAndSort();
  if (Store && typeof Store.getAllAsync === 'function') {
    Store.getAllAsync().then(() => applyFiltersAndSort());
  }
});

applyFiltersAndSort();
if (Store && typeof Store.getAllAsync === 'function') {
  Store.getAllAsync().then(() => applyFiltersAndSort());
}
