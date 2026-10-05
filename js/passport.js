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

  // 7b. Экономические показатели (новый блок)
  renderEconomicsSection(hotel);

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

/* ── Рендеринг секции «Экономика» ──────────────────────────── */
function renderEconomicsSection(hotel) {
  const section   = document.getElementById('economics');
  const tocLink   = document.getElementById('toc-economics');
  if (!section) return;

  const Calc = window.EconomicsCalc;
  const Fmt  = window.EconomicsFmt;
  const Schema = window.EconomicsSchema;
  if (!Calc || !Fmt || !Schema) return;

  const eco = Schema.get(hotel);
  const ecoCalc = Calc.recalcAll(eco, hotel);

  // Проверяем, есть ли хоть какие-то значимые данные
  const hasData = [
    ecoCalc.occupancy, ecoCalc.adr, ecoCalc.revpar,
    ecoCalc.ebitda, ecoCalc.valuation, ecoCalc.irr,
    ecoCalc.totalRevenue, ecoCalc.gop
  ].some(v => v !== null && v !== undefined);

  if (!hasData) {
    section.style.display = 'none';
    if (tocLink) tocLink.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  if (tocLink) tocLink.style.display = 'flex';

  // ── Период и метаданные ──
  const periodMeta = document.getElementById('eco-period-meta');
  if (periodMeta) {
    const parts = [];
    if (ecoCalc.period) parts.push(`<span class="eco-meta-item">📅 ${esc(ecoCalc.period)}</span>`);
    if (ecoCalc.dataType) parts.push(Fmt.dataTypeBadge(ecoCalc.dataType));
    if (ecoCalc.verificationStatus) parts.push(Fmt.verificationBadge(ecoCalc.verificationStatus));
    periodMeta.innerHTML = parts.join('<span class="eco-meta-sep">·</span>');
  }

  // ── KPI bar ──
  const kpiBar = document.getElementById('eco-kpi-bar');
  if (kpiBar) {
    const kpis = [];
    if (ecoCalc.occupancy !== null) kpis.push({ label: 'OCCUPANCY', val: Fmt.pct(ecoCalc.occupancy), sub: 'загрузка' });
    if (ecoCalc.adr !== null) kpis.push({ label: 'ADR', val: Fmt.usd(ecoCalc.adr), sub: 'ср. тариф / номер' });
    if (ecoCalc.revpar !== null) kpis.push({ label: 'REVPAR', val: Fmt.usd(ecoCalc.revpar, 1), sub: 'доход / доступный номер' });
    if (ecoCalc.ebitdaMargin !== null) kpis.push({ label: 'EBITDA MARGIN', val: Fmt.pct(ecoCalc.ebitdaMargin), sub: 'рентабельность' });
    if (ecoCalc.payback !== null) kpis.push({ label: 'PAYBACK', val: Fmt.years(ecoCalc.payback), sub: 'срок окупаемости' });
    if (ecoCalc.irr !== null) kpis.push({ label: 'IRR', val: Fmt.pct(ecoCalc.irr), sub: `${ecoCalc.irrHorizon || 10} лет горизонт` });

    kpiBar.innerHTML = kpis.map(k => `
      <div class="eco-kpi-item">
        <span class="eco-kpi-label">${esc(k.label)}
          ${k.label === 'REVPAR' ? '<span class="eco-tooltip-trigger" title="RevPAR = ADR × Occupancy / 100">?</span>' : ''}
          ${k.label === 'EBITDA MARGIN' ? '<span class="eco-tooltip-trigger" title="EBITDA / Total Revenue × 100">?</span>' : ''}
          ${k.label === 'PAYBACK' ? '<span class="eco-tooltip-trigger" title="Valuation / EBITDA">?</span>' : ''}
        </span>
        <span class="eco-kpi-value">${k.val}</span>
        <span class="eco-kpi-sub">${esc(k.sub)}</span>
      </div>`).join('');
  }

  // Helper для поля
  const field = (label, val, mono = true, tooltip = '') => {
    const cls = mono ? 'eco-field-value eco-field-value--mono' : 'eco-field-value';
    const tip = tooltip ? `<span class="eco-tooltip-trigger" title="${esc(tooltip)}">?</span>` : '';
    return `
      <div class="eco-field">
        <span class="eco-field-label">${esc(label)}${tip}</span>
        <span class="${cls} ${val === 'Н/Д' ? 'eco-field-value--muted' : ''}">${val}</span>
      </div>`;
  };

  // ── Операционные показатели ──
  const opFields = document.getElementById('eco-op-fields');
  const opBadge  = document.getElementById('eco-op-badge');
  if (opBadge && ecoCalc.dataType) opBadge.innerHTML = Fmt.dataTypeBadge(ecoCalc.dataType);
  if (opFields) {
    opFields.innerHTML =
      field('Occupancy', Fmt.pct(ecoCalc.occupancy)) +
      field('ADR', Fmt.usd(ecoCalc.adr), true, 'Average Daily Rate — средняя цена за занятый номер') +
      field('RevPAR', Fmt.usd(ecoCalc.revpar, 1), true, 'Revenue Per Available Room = ADR × Occupancy') +
      (ecoCalc.trevpar !== null ? field('TRevPAR', Fmt.usd(ecoCalc.trevpar, 1), true, 'Total Revenue / доступных номеро-ночей') : '') +
      (ecoCalc.alos !== null ? field('ALOS', Fmt.num(ecoCalc.alos, 1) + ' дн.', false, 'Average Length of Stay') : '');
  }

  // ── Выручка ──
  const revChart = document.getElementById('eco-revenue-chart');
  if (revChart) {
    const totalRev = ecoCalc.totalRevenue || 0;
    const rooms = +(ecoCalc.revRooms || 0);
    const fb    = +(ecoCalc.revFB || 0);
    const other = +(ecoCalc.revOther || 0);
    const hasRevDetail = rooms > 0 || fb > 0 || other > 0;

    if (totalRev > 0 || hasRevDetail) {
      const pct = v => totalRev > 0 ? Math.round(v / totalRev * 100) : 0;
      revChart.innerHTML = `
        <div class="eco-field eco-field--wide" style="margin-bottom:12px">
          <span class="eco-field-label">TOTAL REVENUE</span>
          <span class="eco-field-value eco-field-value--mono" style="font-size:1.4rem">${Fmt.money(totalRev, true)}</span>
        </div>
        ${hasRevDetail ? `
        <div class="eco-revenue-chart">
          ${rooms > 0 ? `
          <div class="eco-rev-row">
            <div class="eco-rev-row-header">
              <span>🛏 Номерной фонд</span>
              <span>${Fmt.money(rooms, true)} · ${pct(rooms)}%</span>
            </div>
            <div class="eco-rev-bar-wrap"><div class="eco-rev-bar eco-rev-bar--rooms" style="width:${pct(rooms)}%"></div></div>
          </div>` : ''}
          ${fb > 0 ? `
          <div class="eco-rev-row">
            <div class="eco-rev-row-header">
              <span>🍽 F&amp;B</span>
              <span>${Fmt.money(fb, true)} · ${pct(fb)}%</span>
            </div>
            <div class="eco-rev-bar-wrap"><div class="eco-rev-bar eco-rev-bar--fb" style="width:${pct(fb)}%"></div></div>
          </div>` : ''}
          ${other > 0 ? `
          <div class="eco-rev-row">
            <div class="eco-rev-row-header">
              <span>📦 Прочее</span>
              <span>${Fmt.money(other, true)} · ${pct(other)}%</span>
            </div>
            <div class="eco-rev-bar-wrap"><div class="eco-rev-bar eco-rev-bar--other" style="width:${pct(other)}%"></div></div>
          </div>` : ''}
        </div>` : ''}`;
    } else {
      revChart.innerHTML = '<p class="eco-field-value eco-field-value--muted">Данные не предоставлены</p>';
    }
  }

  // ── Прибыль и рентабельность ──
  const profitFields = document.getElementById('eco-profit-fields');
  if (profitFields) {
    profitFields.innerHTML =
      (ecoCalc.gop !== null ? field('GOP', Fmt.money(ecoCalc.gop, true), true, 'Gross Operating Profit = Revenue − OPEX') : '') +
      (ecoCalc.gopMargin !== null ? field('GOP Margin', Fmt.pct(ecoCalc.gopMargin), true, 'GOP / Total Revenue × 100') : '') +
      (ecoCalc.goppar !== null ? field('GOPPAR', Fmt.usd(ecoCalc.goppar, 1), true, 'GOP / Available Room Nights') : '') +
      field('EBITDA', Fmt.money(ecoCalc.ebitda, true)) +
      (ecoCalc.ebitdaMargin !== null ? field('EBITDA Margin', Fmt.pct(ecoCalc.ebitdaMargin), true, 'EBITDA / Total Revenue × 100') : '') +
      (ecoCalc.noi !== null ? field('NOI', Fmt.money(ecoCalc.noi, true), true, 'Net Operating Income') : '') +
      (ecoCalc.netIncome !== null ? field('Чистая прибыль', Fmt.money(ecoCalc.netIncome, true)) : '');
  }

  // ── Инвестиционные показатели ──
  const investFields = document.getElementById('eco-invest-fields');
  if (investFields) {
    investFields.innerHTML =
      (ecoCalc.valuation !== null ? field('Оценочная стоимость', Fmt.money(ecoCalc.valuation, true)) : '') +
      (ecoCalc.askingPrice !== null ? field('Запрашиваемая цена', Fmt.money(ecoCalc.askingPrice, true)) : '') +
      (ecoCalc.capex !== null ? `
        <div class="eco-field">
          <span class="eco-field-label">CAPEX</span>
          <span class="eco-field-value eco-field-value--mono">${Fmt.money(ecoCalc.capex, true)}</span>
          ${ecoCalc.capexDescription ? `<span class="eco-field-auto">${esc(ecoCalc.capexDescription)}</span>` : ''}
        </div>` : '') +
      (ecoCalc.pricePerKey !== null ? field('Price per Key', Fmt.money(ecoCalc.pricePerKey, true), true, 'Valuation / количество номеров') : '') +
      (ecoCalc.pricePerSqm !== null ? field('Price per m²', Fmt.money(ecoCalc.pricePerSqm, true), true, 'Valuation / площадь строения') : '') +
      (ecoCalc.payback !== null ? field('Payback', Fmt.years(ecoCalc.payback), true, 'Valuation / EBITDA') : '') +
      (ecoCalc.irr !== null ? field(`IRR (${ecoCalc.irrHorizon || 10} лет)`, Fmt.pct(ecoCalc.irr)) : '') +
      (ecoCalc.roi !== null ? field('ROI', Fmt.pct(ecoCalc.roi), true, 'EBITDA / Valuation × 100') : '') +
      (ecoCalc.capRate !== null ? field('Cap Rate', Fmt.pct(ecoCalc.capRate), true, 'NOI (или EBITDA) / Valuation × 100') : '') +
      (ecoCalc.npv !== null ? `
        <div class="eco-field">
          <span class="eco-field-label">NPV ${ecoCalc.discountRate ? '(ставка ' + ecoCalc.discountRate + '%)' : ''}</span>
          <span class="eco-field-value eco-field-value--mono">${Fmt.money(ecoCalc.npv, true)}</span>
        </div>` : '') +
      (ecoCalc.dividendYield !== null ? field('Дивид. доходность', Fmt.pct(ecoCalc.dividendYield)) : '');
  }

  // ── Условия сделки ──
  const dealCard   = document.getElementById('eco-card-deal');
  const dealFields = document.getElementById('eco-deal-fields');
  const dealConfig = typeof window.getHotelDealConfig === 'function'
    ? window.getHotelDealConfig(hotel) : null;
  const dealType = dealConfig ? dealConfig.key : 'sale';

  const hasDealData = [ecoCalc.equityOffered, ecoCalc.minInvestment, ecoCalc.leaseRate, ecoCalc.baseFee, ecoCalc.incentiveFee]
    .some(v => v !== null);
  if (dealCard && dealFields && hasDealData) {
    dealCard.style.display = 'block';
    let df = '';
    if (dealType === 'invest' && ecoCalc.equityOffered !== null) df += field('Предлагаемая доля', Fmt.pct(ecoCalc.equityOffered));
    if (ecoCalc.minInvestment !== null) df += field('Минимальный вход', Fmt.money(ecoCalc.minInvestment, true));
    if (dealType === 'rent' && ecoCalc.leaseRate !== null) df += field('Ставка аренды', Fmt.money(ecoCalc.leaseRate, true) + '/год');
    if ((dealType === 'franchise') && ecoCalc.baseFee !== null) df += field('Base fee', Fmt.pct(ecoCalc.baseFee));
    if ((dealType === 'franchise') && ecoCalc.incentiveFee !== null) df += field('Incentive fee', Fmt.pct(ecoCalc.incentiveFee));
    dealFields.innerHTML = df;
  } else if (dealCard) {
    dealCard.style.display = 'none';
  }

  // ── Сравнение с рынком ──
  const compCard   = document.getElementById('eco-card-compset');
  const compFields = document.getElementById('eco-compset-fields');
  if (compCard && compFields && (ecoCalc.rgi || ecoCalc.mpi || ecoCalc.ari)) {
    compCard.style.display = 'block';
    compFields.innerHTML =
      (ecoCalc.rgi !== null ? field('RGI (RevPAR Index)', Fmt.num(ecoCalc.rgi, 2)) : '') +
      (ecoCalc.mpi !== null ? field('MPI (Occupancy Index)', Fmt.num(ecoCalc.mpi, 2)) : '') +
      (ecoCalc.ari !== null ? field('ARI (ADR Index)', Fmt.num(ecoCalc.ari, 2)) : '') +
      (ecoCalc.compsetDescription ? `
        <div class="eco-field eco-field--wide">
          <span class="eco-field-label">Конкурентное окружение</span>
          <span class="eco-field-value" style="font-size:13px">${esc(ecoCalc.compsetDescription)}</span>
        </div>` : '');
  } else if (compCard) {
    compCard.style.display = 'none';
  }

  // ── История и динамика ──
  const histCard = document.getElementById('eco-card-history');
  const histWrap = document.getElementById('eco-history-table-wrap');
  const chartSvg = document.getElementById('eco-chart-svg');
  if (histCard && Array.isArray(ecoCalc.history) && ecoCalc.history.length >= 1) {
    histCard.style.display = 'block';
    const rows = ecoCalc.history;

    // SVG Chart (RevPAR line)
    if (chartSvg && rows.length >= 2) {
      const revpars = rows.map(r => r.revpar || 0);
      const ebitdas = rows.map(r => r.ebitda || 0);
      const W = 800, H = 140;
      const maxR = Math.max(...revpars) * 1.2 || 1;
      const maxE = Math.max(...ebitdas) * 1.2 || 1;
      const px = i => (i / (rows.length - 1)) * W;
      const pyR = v => H - (v / maxR) * H;
      const pyE = v => H - (v / maxE) * H;

      const pathR = revpars.map((v, i) => (i === 0 ? 'M' : 'L') + px(i).toFixed(1) + ',' + pyR(v).toFixed(1)).join(' ');
      const pathE = ebitdas.filter(v => v > 0).length >= 2
        ? ebitdas.map((v, i) => (i === 0 ? 'M' : 'L') + px(i).toFixed(1) + ',' + pyE(v).toFixed(1)).join(' ')
        : '';

      const areaR = `M${px(0)},${H} ${pathR.slice(1)} L${px(rows.length - 1)},${H} Z`;

      chartSvg.innerHTML = `
        <defs>
          <linearGradient id="gRevpar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#8B6F4E" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#8B6F4E" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="${areaR}" fill="url(#gRevpar)" class="eco-chart-area"/>
        <path d="${pathR}" stroke="#8B6F4E" class="eco-chart-line"/>
        ${pathE ? `<path d="${pathE}" stroke="#5a8fb8" stroke-dasharray="4,2" class="eco-chart-line"/>` : ''}
        ${rows.map((r, i) => `
          <text x="${px(i).toFixed(1)}" y="${H + 14}" text-anchor="middle" fill="#9D978E" font-size="11" font-family="Golos Text, sans-serif">${r.year || ''}</text>
        `).join('')}
      `;
    }

    // Таблица
    if (histWrap) {
      histWrap.innerHTML = `
        <table class="eco-table">
          <thead>
            <tr>
              <th>Год</th><th>Тип</th><th>Occ%</th><th>ADR</th>
              <th>RevPAR</th><th>Total Rev.</th><th>GOP</th><th>EBITDA</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => {
              const isFC = r.dataType === 'forecast' || r.dataType === 'estimate';
              const tdClass = isFC ? 'is-forecast' : '';
              return `<tr>
                <td><strong>${r.year || ''}</strong></td>
                <td>${r.dataType ? Fmt.dataTypeBadge(r.dataType) : ''}</td>
                <td class="mono ${tdClass}">${r.occupancy != null ? Fmt.pct(r.occupancy) : '—'}</td>
                <td class="mono ${tdClass}">${r.adr != null ? Fmt.usd(r.adr) : '—'}</td>
                <td class="mono ${tdClass}">${r.revpar != null ? Fmt.usd(r.revpar, 1) : '—'}</td>
                <td class="mono ${tdClass}">${r.totalRevenue != null ? Fmt.money(r.totalRevenue, true) : '—'}</td>
                <td class="mono ${tdClass}">${r.gop != null ? Fmt.money(r.gop, true) : '—'}</td>
                <td class="mono ${tdClass}">${r.ebitda != null ? Fmt.money(r.ebitda, true) : '—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>`;
    }
  } else if (histCard) {
    histCard.style.display = 'none';
  }

  // ── Метабар ──
  const metaBar = document.getElementById('eco-meta-bar');
  if (metaBar) {
    const parts = [];
    if (ecoCalc.period) parts.push(`<span class="eco-meta-item">📅 Период: <strong>${esc(ecoCalc.period)}</strong></span>`);
    parts.push(`<span class="eco-meta-item">💵 Валюта: <strong>${esc(ecoCalc.currency || 'USD')}</strong></span>`);
    parts.push(Fmt.verificationBadge(ecoCalc.verificationStatus));
    if (ecoCalc.updatedAt) parts.push(`<span class="eco-meta-item">🕒 Обновлено: ${esc(ecoCalc.updatedAt)}</span>`);
    parts.push('<span class="eco-meta-item" style="margin-left:auto;font-size:11px">Методология: STR Global / USALI</span>');
    metaBar.innerHTML = parts.join('<span class="eco-meta-sep"> · </span>');
  }
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
    '#cover, #summary, #economics, #amenities-section, #location, #gallery, #download'
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
