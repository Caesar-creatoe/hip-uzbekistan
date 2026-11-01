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
  onlyCertified: false,
  hasPresentation: false,  // только с инвестиционной презентацией
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

/* ── Определение цветовой гаммы карточки на основе фото / типа объекта / локации (по референсу) ── */
function getHotelPalette(hotel) {
  const name = String(hotel.hotelName || '').toLowerCase();
  const regKey = String(hotel.regionKey || '').toLowerCase();
  const reg = String(hotel.region || '').toLowerCase();
  const address = String(hotel.address || '').toLowerCase();
  const deal = String(hotel.dealType || '').toLowerCase();

  // 1. Оазис / Водоём / Озеро / SPA / Релакс (Глубокий обсидиановый океан / тил)
  if (name.includes('aydarkul') || name.includes('айдаркуль') || name.includes('charvak') || name.includes('чарвак') || name.includes('lake') || name.includes('озер') || name.includes('spa') || name.includes('спа') || name.includes('aqua')) {
    return {
      theme: 'teal',
      rgb: '26, 42, 46',
      accentRgb: '160, 215, 210'
    };
  }

  // 2. Природа / Горные ландшафты / Лес (Глубокий лесной мох / олива, строго как правая карточка в референсе)
  if (regKey === 'jizzakh' || regKey === 'tashkent-region' || name.includes('zomin') || name.includes('зомин') || name.includes('zaamin') || name.includes('заамин') || name.includes('chimgan') || name.includes('чимган') || name.includes('beldersay') || name.includes('бельдерсай') || name.includes('mountain') || name.includes('resort') || name.includes('резорт') || name.includes('eco') || name.includes('эко') || name.includes('garden')) {
    return {
      theme: 'moss',
      rgb: '40, 49, 34',
      accentRgb: '185, 205, 165'
    };
  }

  // 3. Великий Шёлковый путь / Терракота / Песок / Исторический кирпич (Тёплый эспрессо-амбер, золотистый песок)
  if (regKey === 'bukhara' || regKey === 'khorezm' || name.includes('bukhara') || name.includes('бухара') || name.includes('khiva') || name.includes('хива') || name.includes('bakh mir') || name.includes('heritage') || name.includes('palace') || name.includes('дворец') || name.includes('orient') || name.includes('caravan') || name.includes('караван') || name.includes('registan') || name.includes('регистан') || name.includes('emir') || name.includes('эмир')) {
    return {
      theme: 'amber',
      rgb: '46, 36, 28',
      accentRgb: '225, 190, 145'
    };
  }

  // 4. Современные городские башни / Деловой центр / Небоскрёбы (Глубокий сланцевый индиго-нэви, как левая карточка в референсе)
  if (name.includes('wyndham') || name.includes('виндхам') || name.includes('hyatt') || name.includes('хаятт') || name.includes('hilton') || name.includes('radisson') || name.includes('qushbegi') || name.includes('кушбеги') || name.includes('business') || name.includes('tower') || name.includes('башня') || name.includes('city') || regKey === 'tashkent') {
    return {
      theme: 'slate',
      rgb: '31, 41, 53',
      accentRgb: '165, 195, 225'
    };
  }

  // 5. Самарканд / Царский люкс
  if (regKey === 'samarkand' || name.includes('samarkand') || name.includes('самарканд')) {
    return {
      theme: 'amber',
      rgb: '46, 36, 28',
      accentRgb: '225, 190, 145'
    };
  }

  // 6. Базовый благородный тёмный титан (Universal Refined Titanium)
  return {
    theme: 'graphite',
    rgb: '34, 31, 35',
    accentRgb: '210, 205, 200'
  };
}

/* ── Форматирование цены: 49600000 → «$49,6 млн» ────────────── */
function fmtPriceShort(val) {
  const n = Number(val);
  if (!isFinite(n) || n <= 0) return null;
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1).replace(/\.0$/, '').replace('.', ',') + ' млрд';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1).replace(/\.0$/, '').replace('.', ',') + ' млн';
  if (n >= 1e3) return '$' + Math.round(n / 1e3) + ' тыс.';
  return '$' + Math.round(n);
}

function fmtDec(n, d = 1) {
  return Number(n).toFixed(d).replace(/\.0$/, '').replace('.', ',');
}

function starsWord(n) {
  if (n === 1) return 'звезда';
  if (n >= 2 && n <= 4) return 'звезды';
  return 'звёзд';
}

/* ── Цвет подложки карточки, снятый с самой фотографии ───────────
   Берём нижнюю половину кадра, усредняем, приглушаем и затемняем —
   так текст ложится на цвет, который «вытекает» из фото (как в референсе).
   Для внешних фото без CORS canvas недоступен — остаётся палитра по типу объекта. */
const tintCache = new Map();

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const hue = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)].map(v => Math.round(v * 255));
}

function extractTint(img) {
  try {
    const W = 24, H = 24;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, W, H);
    const d = ctx.getImageData(0, H / 2, W, H / 2).data;
    // Пиксели с более «живым» цветом весят больше: серое небо и асфальт
    // не должны забивать оттенок зелени, кирпича или воды.
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      const chroma = (Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2])) / 255;
      const w = 0.12 + chroma * chroma * 6;
      r += d[i] * w; g += d[i + 1] * w; b += d[i + 2] * w; n += w;
    }
    if (!n) return null;
    const [h, s] = rgbToHsl(r / n, g / n, b / n);
    const [R, G, B] = hslToRgb(h, Math.min(Math.max(s * 1.5, 0.12), 0.34), 0.2);
    return `${R}, ${G}, ${B}`;
  } catch (e) {
    return null; // tainted canvas (внешнее фото без CORS)
  }
}

function applyTint(img) {
  const card = img.closest('.hcard');
  if (!card) return;
  const id = card.dataset.id;
  let rgb = tintCache.get(id);
  if (!rgb) {
    rgb = extractTint(img);
    if (!rgb) return;
    tintCache.set(id, rgb);
  }
  card.style.setProperty('--tint-rgb', rgb);
  card.classList.add('is-tinted');
}

/* Для оптимизированных фото (assets/hotels/*.webp) в карточке берём
   облегчённую версию «-card» — она рассчитана на размер карточки на Retina */
function cardPhotoSrc(src) {
  if (typeof src !== 'string') return src;
  const m = src.match(/^(\/?assets\/hotels\/[^?#]+?)(?<!-card)\.webp$/);
  return m ? `${m[1]}-card.webp` : src;
}

/* ── Иконки карточки ─────────────────────────────────────────── */
const ICON_STAR = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.75l2.2 4.6 5.05.62-3.72 3.48.95 5-4.48-2.47-4.48 2.47.95-5L2.75 7.97l5.05-.62L10 2.75z" fill="currentColor"/></svg>';
const ICON_COMPARE = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 7h11M12 4l3 3-3 3M16 13H5M8 10l-3 3 3 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_DOWNLOAD = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3.5v9M6.5 9l3.5 3.5L13.5 9M4.5 16h11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ── Рендер карточки отеля (по референсу: фото → цвет, цена крупно) ── */
function buildCard(hotel, index) {
  const rawPhoto = (Array.isArray(hotel.photos) && hotel.photos.length > 0 && hotel.photos[0])
    ? hotel.photos[0]
    : './assets/hotel-hero.png';
  const photo = cardPhotoSrc(typeof rawPhoto === 'object' && rawPhoto !== null ? (rawPhoto.src || './assets/hotel-hero.png') : rawPhoto);

  const passportUrl = `passport.html?hotel=${encodeURIComponent(hotel.slug || hotel.id)}`;
  const palette = getHotelPalette(hotel);
  const tint = tintCache.get(hotel.id) || palette.rgb;

  // Бейдж категории (белое матовое стекло, как «Prime Pick» в референсе)
  const starsNum = parseInt(hotel.stars, 10);
  let pillText;
  if (hotel.status === 'pending') pillText = 'На аудите';
  else if (starsNum >= 1 && starsNum <= 5) pillText = `${starsNum} ${starsWord(starsNum)}`;
  else if (hotel.certified) pillText = 'Сертифицирован';
  else pillText = 'Без категории';

  const deal = typeof window.getHotelDealConfig === 'function'
    ? window.getHotelDealConfig(hotel)
    : { label: 'Прямая продажа', shortLabel: 'Продажа' };

  // Главная цифра карточки — цена (как «List: $250,000»)
  const eco = hotel.economics || {};
  const priceStr = fmtPriceShort(eco.askingPrice || eco.valuation);
  const priceHtml = priceStr
    ? `<span class="hcard-price-lbl">Цена:</span> ${priceStr}`
    : `<span class="hcard-price-lbl">Цена</span> по запросу`;

  const locText = hotel.city || hotel.address || hotel.region || 'Узбекистан';

  // Две метрики справа: номерной фонд + экономика
  const roomsVal = hotel.roomsCount || '—';
  let ecoVal = 'USALI', ecoLbl = 'Стандарт';
  if (eco.payback) { ecoVal = `${fmtDec(eco.payback)} года`; ecoLbl = 'Окупаемость'; }
  else if (eco.roi) { ecoVal = `${fmtDec(eco.roi)}%`; ecoLbl = 'ROI'; }
  else if (eco.adr) { ecoVal = `$${Math.round(eco.adr)}`; ecoLbl = 'ADR'; }
  else if (hotel.placesCount) { ecoVal = `${hotel.placesCount}`; ecoLbl = 'Мест'; }

  const year = hotel.yearCommissioned ? ` · ввод ${escHtml(hotel.yearCommissioned)}` : '';

  const isInCompare = compareState.ids.includes(hotel.id);
  const presUrl = hotel.presentationUrl || hotel.presentationFile;
  const presBtn = presUrl
    ? `<a href="${escHtml(presUrl)}" target="_blank" rel="noopener" download="${escHtml(hotel.presentationFileName || 'presentation')}"
         class="hcard-tool" title="Скачать презентацию" aria-label="Скачать презентацию: ${escHtml(hotel.hotelName)}">${ICON_DOWNLOAD}</a>`
    : '';

  return `
  <article class="hcard" data-id="${escHtml(hotel.id)}" role="listitem"
           style="--tint-rgb: ${tint}; --i: ${Math.min(index || 0, 11)};">
    <a href="${passportUrl}" class="hcard-link" aria-label="${escHtml(hotel.hotelName)} — открыть паспорт объекта">
      <div class="hcard-media" aria-hidden="true">
        <img src="${photo}" alt="" class="hcard-img" loading="${index < 8 ? 'eager' : 'lazy'}" decoding="async"
             onerror="this.onerror=null;this.src='./assets/hotel-hero.png'" />
        <div class="hcard-blur"></div>
        <div class="hcard-shade"></div>
      </div>

      <span class="hcard-pill">${ICON_STAR}${escHtml(pillText)}</span>

      <div class="hcard-body">
        <p class="hcard-price">${priceHtml}</p>
        <h3 class="hcard-name" title="${escHtml(hotel.hotelName)}">${escHtml(hotel.hotelName)}</h3>
        <div class="hcard-row">
          <p class="hcard-loc" title="${escHtml(locText)}">${escHtml(locText)}</p>
          <dl class="hcard-stats">
            <div><dt>Номеров</dt><dd>${escHtml(roomsVal)}</dd></div>
            <div><dt>${escHtml(ecoLbl)}</dt><dd>${escHtml(ecoVal)}</dd></div>
          </dl>
        </div>
        <div class="hcard-foot">
          <span class="hcard-deal">${escHtml(deal.label)}${year}</span>
          <span class="hcard-cta">Паспорт<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 8.5l5-5M4.5 3.5h4v4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        </div>
      </div>
    </a>

    <div class="hcard-tools">
      ${presBtn}
      <button type="button" class="hcard-tool hcard-compare ${isInCompare ? 'is-selected' : ''}"
              data-compare-id="${escHtml(hotel.id)}" aria-pressed="${isInCompare}"
              title="Добавить к сравнению" aria-label="Сравнить: ${escHtml(hotel.hotelName)}">${ICON_COMPARE}</button>
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

    // Фильтр: только сертифицированные (ТЗ §4.7)
    if (filterState.onlyCertified) {
      if (!hotel.stars && !hotel.certified) return false;
    }

    // Фильтр: только с презентацией
    if (filterState.hasPresentation) {
      const pUrl = hotel.presentationUrl || hotel.presentationFile;
      if (!pUrl && !hotel.hasPresentation) return false;
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
    hydrateCards();
  }

  // 4. Обновление счётчиков
  if (countNumEl) countNumEl.textContent = matched.length;
  if (countLabelEl) countLabelEl.textContent = formatObjectsCountWord(matched.length);

  updateHeaderStats(matched.length, allHotels);
  syncFilterUi();
}

/* ── Hero: живые факты и распределение по регионам ────────────── */
const REGION_COLORS = ['#2B2420', '#8B6F4E', '#C2A47A', '#5E6B4E', '#4A5A6E', '#A0705A', '#D9C9AE', '#77706A'];

function regionLabel(key) {
  const opt = regionSelect ? regionSelect.querySelector(`option[value="${key}"]`) : null;
  return opt ? opt.textContent.replace(/\s*\(город\)/, '') : key;
}

function updateHeaderStats(count, allHotels) {
  const facts = document.getElementById('cat-facts');
  if (facts && allHotels.length) {
    const set = (k, v) => { const el = facts.querySelector(`[data-fact="${k}"]`); if (el) el.textContent = v; };
    set('count', allHotels.length);
    const rooms = allHotels.reduce((a, h) => a + (parseInt(h.roomsCount, 10) || 0), 0);
    set('rooms', rooms ? rooms.toLocaleString('ru-RU') : '—');
    const prices = allHotels
      .map(h => h.economics && (h.economics.askingPrice || h.economics.valuation))
      .filter(v => Number(v) > 0).map(Number);
    if (prices.length) {
      set('price', `${fmtPriceShort(Math.min(...prices))} — ${fmtPriceShort(Math.max(...prices))}`);
    }
  }
  renderRegionStrip(allHotels);
  renderAmbient(allHotels);
}

let regionStripKey = '';
function renderRegionStrip(allHotels) {
  const bar = document.getElementById('cat-regions-bar');
  const list = document.getElementById('cat-regions-list');
  const total = document.getElementById('cat-regions-total');
  if (!bar || !list) return;

  const counts = new Map();
  allHotels.forEach(h => {
    const k = h.regionKey || (typeof getRegionKey === 'function' ? getRegionKey(h.region) : '') || 'other';
    counts.set(k, (counts.get(k) || 0) + 1);
  });
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const sum = rows.reduce((a, r) => a + r[1], 0) || 1;
  const key = rows.map(r => r.join(':')).join('|') + '#' + filterState.region;
  if (key === regionStripKey) return;
  regionStripKey = key;

  if (total) total.textContent = `${rows.length} ${rows.length % 10 === 1 && rows.length !== 11 ? 'регион' : (rows.length % 10 >= 2 && rows.length % 10 <= 4 && (rows.length < 12 || rows.length > 14) ? 'региона' : 'регионов')}`;

  const active = filterState.region;
  bar.innerHTML = rows.map(([k, n], i) =>
    `<span class="cat-regions-seg${active !== 'all' && active !== k ? ' is-dim' : ''}" style="flex:${n};background:${REGION_COLORS[i % REGION_COLORS.length]}" title="${escHtml(regionLabel(k))}: ${n}"></span>`
  ).join('');

  list.innerHTML = rows.map(([k, n], i) => `
    <li>
      <button type="button" class="cat-region${active === k ? ' is-active' : ''}${active !== 'all' && active !== k ? ' is-dim' : ''}" data-region="${escHtml(k)}" aria-pressed="${active === k}">
        <span class="cat-region-dot" style="background:${REGION_COLORS[i % REGION_COLORS.length]}"></span>
        <span class="cat-region-name">${escHtml(regionLabel(k))}</span>
        <span class="cat-region-n">${n}</span>
      </button>
    </li>`).join('');
}

/* Мягкий цветной фон hero, собранный из фотографий самих отелей */
let ambientDone = false;
function renderAmbient(allHotels) {
  if (ambientDone) return;
  const box = document.getElementById('cat-hero-ambient');
  if (!box || !allHotels.length) return;
  const pick = allHotels
    .map(h => { const p = h.photos && h.photos[0]; return cardPhotoSrc(typeof p === 'object' && p ? p.src : p); })
    .filter(Boolean).slice(0, 3);
  if (!pick.length) return;
  box.innerHTML = pick.map((src, i) => `<img src="${src}" alt="" class="amb amb-${i}" decoding="async" />`).join('');
  ambientDone = true;
}

/* ── Состояние элементов панели: бегунок сегментов, «Сбросить» ── */
function moveSegThumb() {
  const seg = document.getElementById('cat-seg');
  if (!seg) return;
  const thumb = seg.querySelector('.cat-seg-thumb');
  const active = seg.querySelector('button.is-active') || seg.querySelector('button');
  if (!thumb || !active) return;
  thumb.style.width = active.offsetWidth + 'px';
  thumb.style.transform = `translateX(${active.offsetLeft}px)`;
  // держим активный сегмент в зоне видимости на мобильных
  if (seg.scrollWidth > seg.clientWidth) {
    const l = active.offsetLeft - 12, r = active.offsetLeft + active.offsetWidth + 12;
    if (l < seg.scrollLeft || r > seg.scrollLeft + seg.clientWidth) seg.scrollTo({ left: l, behavior: 'smooth' });
  }
}

function hasActiveFilters() {
  return Boolean(filterState.search.trim()) || filterState.region !== 'all' || filterState.stars !== 'all' ||
    filterState.rooms !== 'all' || filterState.dealType !== 'all' || filterState.onlyPremium ||
    filterState.onlyCertified || filterState.hasPresentation || filterState.hasEco ||
    filterState.paybackMax !== null || filterState.roiMin !== null;
}

function syncFilterUi() {
  moveSegThumb();
  const section = document.getElementById('catalog-filter-section');
  if (section) section.classList.toggle('has-filters', hasActiveFilters());
  if (tagPremBtn) tagPremBtn.setAttribute('aria-pressed', String(filterState.onlyPremium));
  document.querySelectorAll('.cat-select select').forEach(sel => {
    const def = sel.id === 'catalog-sort' ? 'rooms-desc' : 'all';
    sel.closest('.cat-select').classList.toggle('is-set', sel.value !== def);
  });
}

/* ── Карточки после рендера: цвет из фото, сравнение, блик ─────── */
let firstPaint = true;
function hydrateCards() {
  if (!grid) return;
  if (firstPaint) {
    grid.classList.add('is-entering');
    setTimeout(() => grid.classList.remove('is-entering'), 1400);
    firstPaint = false;
  }
  grid.querySelectorAll('.hcard-img').forEach(img => {
    if (img.complete && img.naturalWidth) applyTint(img);
  });
}

function syncCompareButtons() {
  document.querySelectorAll('.hcard-compare').forEach(btn => {
    const on = compareState.ids.includes(btn.dataset.compareId);
    btn.classList.toggle('is-selected', on);
    btn.setAttribute('aria-pressed', String(on));
  });
}

function initCardInteractions() {
  if (!grid || grid.dataset.wired) return;
  grid.dataset.wired = '1';

  // Цвет подложки — когда фото загрузилось
  grid.addEventListener('load', e => {
    if (e.target.classList && e.target.classList.contains('hcard-img')) applyTint(e.target);
  }, true);

  // Кнопка сравнения
  grid.addEventListener('click', e => {
    const btn = e.target.closest('.hcard-compare');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    toggleCompare(btn.dataset.compareId, '');
  });

  // Световой блик стекла, следующий за курсором
  if (window.matchMedia('(hover: hover)').matches) {
    let raf = 0, last = null;
    grid.addEventListener('pointermove', e => {
      last = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const card = last.target.closest('.hcard');
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((last.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((last.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    }, { passive: true });
  }

  // Клик по региону в hero
  const regionList = document.getElementById('cat-regions-list');
  if (regionList) {
    regionList.addEventListener('click', e => {
      const btn = e.target.closest('[data-region]');
      if (!btn || !regionSelect) return;
      const k = btn.dataset.region;
      const next = filterState.region === k ? 'all' : k;
      regionSelect.value = regionSelect.querySelector(`option[value="${next}"]`) ? next : 'all';
      filterState.region = next;
      applyFiltersAndSort();
      const fs = document.getElementById('catalog-filter-section');
      if (fs && window.scrollY < fs.offsetTop - 120) {
        window.scrollTo({ top: fs.offsetTop - 96, behavior: 'smooth' });
      }
    });
  }

  window.addEventListener('resize', moveSegThumb, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveSegThumb);
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
  filterState.onlyCertified = false;
  filterState.hasPresentation = false;
  filterState.hasEco = false;
  filterState.paybackMax = null;
  filterState.roiMin = null;

  ['filter-has-eco', 'filter-certified-only'].forEach(id => {
    const b = document.getElementById(id);
    if (b) { b.classList.remove('is-active'); b.dataset.active = 'false'; }
  });
  ['filter-payback-max', 'filter-roi-min'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const presTagBtn = document.getElementById('filter-has-presentation');
  if (presTagBtn) {
    presTagBtn.classList.remove('is-active');
    presTagBtn.dataset.active = 'false';
  }

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
const certOnlyBtn  = document.getElementById('filter-certified-only');
const presOnlyBtn  = document.getElementById('filter-has-presentation');
const paybackMaxEl = document.getElementById('filter-payback-max');
const roiMinEl     = document.getElementById('filter-roi-min');

if (certOnlyBtn) {
  certOnlyBtn.addEventListener('click', () => {
    filterState.onlyCertified = !filterState.onlyCertified;
    certOnlyBtn.classList.toggle('is-active', filterState.onlyCertified);
    certOnlyBtn.dataset.active = String(filterState.onlyCertified);
    applyFiltersAndSort();
  });
}

if (presOnlyBtn) {
  presOnlyBtn.addEventListener('click', () => {
    filterState.hasPresentation = !filterState.hasPresentation;
    presOnlyBtn.classList.toggle('is-active', filterState.hasPresentation);
    presOnlyBtn.dataset.active = String(filterState.hasPresentation);
    applyFiltersAndSort();
  });
}

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
      syncCompareButtons();
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
  syncCompareButtons();
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

/* ── Управление компактным состоянием панели фильтров при скролле ──
   Панель сжимается ровно в момент «прилипания» к шапке. Чтобы сетка
   не прыгала вверх, секция сохраняет прежнюю высоту (прозрачная часть
   не перехватывает клики — см. pointer-events в catalog.css). */
function initStickyFilterController() {
  const filterSection = document.getElementById('catalog-filter-section');
  if (!filterSection || filterSection.dataset.wired) return;
  filterSection.dataset.wired = '1';

  const toggleBtn = document.getElementById('filter-advanced-toggle');
  const ecoPanel = document.getElementById('glass-filter-eco');

  const collapseAdvanced = () => {
    filterSection.classList.remove('is-expanded');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.classList.remove('is-active');
    }
    if (ecoPanel) ecoPanel.hidden = true;
  };

  if (toggleBtn && ecoPanel) {
    toggleBtn.addEventListener('click', () => {
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
      toggleBtn.classList.toggle('is-active', !isExpanded);
      filterSection.classList.toggle('is-expanded', !isExpanded);
      ecoPanel.hidden = isExpanded;
      requestAnimationFrame(moveSegThumb);
    });
  }

  // Точка прилипания: где секция стоит в потоке минус её sticky-top
  let stickAt = Infinity;
  const measure = () => {
    if (filterSection.classList.contains('is-sticky-compact')) return;
    const cs = getComputedStyle(filterSection);
    if (cs.position !== 'sticky') { stickAt = Infinity; return; }
    const top = parseFloat(cs.top) || 0;
    stickAt = filterSection.getBoundingClientRect().top + window.scrollY - top - 2;
  };

  let ticking = false;
  const updateStickyState = () => {
    ticking = false;
    const compact = filterSection.classList.contains('is-sticky-compact');
    if (!compact && window.scrollY >= stickAt) {
      filterSection.style.setProperty('--fs-h', filterSection.offsetHeight + 'px');
      collapseAdvanced();
      filterSection.classList.add('is-sticky-compact');
    } else if (compact && window.scrollY < stickAt) {
      filterSection.classList.remove('is-sticky-compact');
      collapseAdvanced();
      requestAnimationFrame(moveSegThumb);
    }
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateStickyState);
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (filterSection.classList.contains('is-sticky-compact')) {
      filterSection.classList.remove('is-sticky-compact');
      collapseAdvanced();
    }
    measure();
    updateStickyState();
  }, { passive: true });

  measure();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); updateStickyState(); });
  updateStickyState();
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
  initCardInteractions();
  applyFiltersAndSort();
  initStickyFilterController();
  if (Store && typeof Store.getAllAsync === 'function') {
    Store.getAllAsync().then(() => applyFiltersAndSort());
  }
});

initCardInteractions();
applyFiltersAndSort();
initStickyFilterController();
if (Store && typeof Store.getAllAsync === 'function') {
  Store.getAllAsync().then(() => applyFiltersAndSort());
}

