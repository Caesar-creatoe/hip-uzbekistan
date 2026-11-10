/* ============================================================
   PASSPORT.JS — паспорт отеля (v2, soft glass)
   Hotel Investment Portfolio · Silk Route Invest
   Показывает только реальные данные объекта из HotelStore.
   ============================================================ */
'use strict';

let currentHotelData = null;

document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('js-pp');
  const hotelParam = new URLSearchParams(window.location.search).get('hotel');
  const store = window.HotelStore;
  let hotel = null;

  if (store && typeof store.getById === 'function' && hotelParam) hotel = store.getById(hotelParam);
  if (!hotel && store && typeof store.getAll === 'function') {
    const all = store.getAll();
    if (all.length) hotel = all[0];
  }

  if (hotel) {
    currentHotelData = hotel;
    renderPassport(hotel);
    initPassportMap(hotel);
    // Свежие данные с сервера: если фото изменились — перерисовать
    window.addEventListener('sri_hotels_updated', (ev) => {
      const list = Array.isArray(ev.detail) ? ev.detail : [];
      const fresh = list.find((h) => h && h.id === hotel.id);
      if (!fresh || JSON.stringify(fresh.photos || []) === JSON.stringify(currentHotelData.photos || [])) return;
      currentHotelData.photos = fresh.photos;
      const ph = photosOf(fresh);
      const cover = $id('passport-cover-photo');
      if (cover && ph[0]) cover.src = ph[0].src;
      updatePhotoCount(ph.length);
      renderPhotoGallery(currentHotelData);
    });
  } else {
    renderNotFound();
  }

  initTocSpy();
  initLightbox();
  initPdfButton();
  initReveal();
});

/* ── Утилиты ─────────────────────────────────────────────────── */
function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
const $id = (id) => document.getElementById(id);
const has = (v) => v !== null && v !== undefined && v !== '';
function setTxt(id, val, fallback = '—') {
  const el = $id(id);
  if (el) el.textContent = has(val) ? val : fallback;
}
/* Числа в русском формате: 49,6 млн; 76%; $151 */
const ru = (n, d = 1) => Number(n).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: d });
const fmt = {
  money(v) {
    if (!has(v) || isNaN(+v)) return null;
    const n = +v, a = Math.abs(n);
    if (a >= 1e9) return '$' + ru(n / 1e9) + ' млрд';
    if (a >= 1e6) return '$' + ru(n / 1e6) + ' млн';
    if (a >= 1e3) return '$' + ru(n / 1e3, 0) + ' тыс.';
    return '$' + ru(n, 0);
  },
  usd(v, d = 0) { return has(v) && !isNaN(+v) ? '$' + ru(+v, d) : null; },
  pct(v, d = 1) { return has(v) && !isNaN(+v) ? ru(+v, d) + '%' : null; },
  num(v, d = 0) { return has(v) && !isNaN(+v) ? ru(+v, d) : null; },
  years(v) {
    if (!has(v) || isNaN(+v)) return null;
    const n = +v, i = Math.floor(n);
    const w = n !== i ? 'года' : (i % 10 === 1 && i % 100 !== 11 ? 'год' : ([2, 3, 4].includes(i % 10) && ![12, 13, 14].includes(i % 100) ? 'года' : 'лет'));
    return ru(n) + ' ' + w;
  },
  date(v) {
    const d = new Date(v);
    return isNaN(d) ? null : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  }
};
const info = (t) => (t ? `<i class="pp-info" title="${esc(t)}">i</i>` : '');
function row(label, val, tip = '', extra = '') {
  if (!has(val)) return '';
  return `<li><span class="k">${esc(label)}${info(tip)}</span><span class="v">${val}${extra}</span></li>`;
}

/* Иконки (линейные, 24×24) */
const ICON = {
  star: '<svg viewBox="0 0 20 20"><path d="M10 1.5l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L1.4 7.8l6-.7z"/></svg>',
  food: '<svg viewBox="0 0 24 24"><path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5a2 2 0 0 0 2 2M9 3v5a2 2 0 0 1-2 2M17 21V3c-2 1-3.5 3.5-3.5 7v3H17"/></svg>',
  pool: '<svg viewBox="0 0 24 24"><path d="M3 18c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1M3 14c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1M8 13V5a2 2 0 0 1 4 0M16 13V5a2 2 0 0 0-4 0M8 8h8"/></svg>',
  gym: '<svg viewBox="0 0 24 24"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>',
  bar: '<svg viewBox="0 0 24 24"><path d="M7 3h10l-1 7a4 4 0 0 1-8 0L7 3zM12 14v7M8.5 21h7"/></svg>',
  club: '<svg viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>',
  casino: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
  spa: '<svg viewBox="0 0 24 24"><path d="M12 21c-5 0-8-3-8-7 3 0 6 1.5 8 4 2-2.5 5-4 8-4 0 4-3 7-8 7zM12 18c-2-3-2-7 0-11 2 4 2 8 0 11z"/></svg>',
  meeting: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.5A5 5 0 0 1 21 19"/></svg>',
  parking: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M10 17V7h3a3 3 0 0 1 0 6h-3"/></svg>',
  wifi: '<svg viewBox="0 0 24 24"><path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/></svg>',
  shop: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  kids: '<svg viewBox="0 0 24 24"><circle cx="12" cy="6" r="2.5"/><path d="M7 11l5 1 5-1M12 12v4l-3 5M12 16l3 5"/></svg>',
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  laundry: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="3"/><circle cx="12" cy="13" r="4"/><path d="M8 6.5h.01M11 6.5h.01"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z"/></svg>',
  lift: '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9.5 9L12 6.5 14.5 9M9.5 15l2.5 2.5 2.5-2.5"/></svg>',
  tour: '<svg viewBox="0 0 24 24"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  ok: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  cal: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>'
};
const AMENITY_ICONS = [
  [/рестора|restaurant|кафе|cafe|румсервис|room service|столов/i, 'food'],
  [/бассейн|pool|аквапарк|якузи|джакузи/i, 'pool'],
  [/спортзал|фитнес|gym|fitness|тренаж/i, 'gym'],
  [/бар|bar|лаунж|lounge/i, 'bar'],
  [/клуб|club|караоке|ночн/i, 'club'],
  [/казино|casino/i, 'casino'],
  [/спа|spa|саун|хамам|массаж|wellness|баня/i, 'spa'],
  [/конферен|конгресс|conference|бизнес|переговор|банкет|зал/i, 'meeting'],
  [/парков|паркинг|гараж|parking|valet/i, 'parking'],
  [/wi-?fi|ви-фи|интернет/i, 'wifi'],
  [/магазин|бутик|шопинг|shop/i, 'shop'],
  [/детск|kids/i, 'kids'],
  [/терраса|панорам|крыш|сад|открыт/i, 'sun'],
  [/прачеч|химчист|laundry/i, 'laundry'],
  [/сейф|охран|безопас/i, 'shield'],
  [/лифт/i, 'lift'],
  [/экскурс|тур|трансфер/i, 'tour']
];
function amenityIcon(text) {
  for (const [re, key] of AMENITY_ICONS) if (re.test(text)) return ICON[key];
  return ICON.check;
}
function plural(n, one, few, many) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}
function photosOf(hotel) {
  return (Array.isArray(hotel.photos) ? hotel.photos.filter(Boolean) : []).map((p) =>
    (typeof p === 'object' && p !== null && p.src) ? { src: p.src, caption: p.caption || '' } : { src: String(p), caption: '' });
}
function placeOf(hotel) {
  const m = String(hotel.address || '').match(/(?:^|[\s,])(?:г\.|город)\s*([^,]+)/i);
  if (m) return m[1].trim();
  if (hotel.city) return hotel.city;
  return hotel.region || 'Узбекистан';
}

/* ── Рендер ─────────────────────────────────────────────────── */
function renderPassport(hotel) {
  const name = hotel.hotelName || 'Гостиничный объект';
  document.title = `${name} — инвестиционный паспорт · Silk Route Invest`;

  setTxt('passport-breadcrumb-name', name);
  setTxt('passport-hotel-name', name);
  setTxt('passport-region-sub', placeOf(hotel));

  const stars = parseInt(hotel.stars, 10);
  const starsEl = $id('passport-stars');
  if (starsEl) {
    starsEl.innerHTML = stars > 0 ? ICON.star.repeat(Math.min(stars, 5)) : `<span>${esc(hotel.stars || 'Без категории')}</span>`;
    starsEl.setAttribute('aria-label', stars > 0 ? `${stars} звёзд` : 'Без категории');
  }
  setTxt('passport-location', hotel.address || hotel.region, 'Республика Узбекистан');

  // Статус и формат сделки
  const status = String(hotel.status || 'active').toLowerCase();
  const st = $id('passport-status-badge');
  if (st) {
    const map = { active: ['Активный объект', ''], pending: ['На проверке', 'pp-tag--pending'] };
    const [label, cls] = map[status] || ['Черновик', 'pp-tag--draft'];
    st.className = `pp-tag pp-tag--status ${cls}`.trim();
    st.innerHTML = `<i></i>${label}`;
  }
  const deal = typeof window.getHotelDealConfig === 'function' ? window.getHotelDealConfig(hotel) : { label: 'Прямая продажа' };
  setTxt('passport-deal-badge', deal.label);

  // Цифры объекта
  setTxt('cover-rooms-count', hotel.roomsCount);
  setTxt('cover-places-count', hotel.placesCount);
  setTxt('cover-floors-count', hotel.floors);
  setTxt('cover-year-commissioned', hotel.yearCommissioned);
  setTxt('cover-legal-entity', hotel.legalEntity, 'Не указан');

  // Фото обложки
  const photos = photosOf(hotel);
  const cover = $id('passport-cover-photo');
  if (cover) {
    cover.src = photos[0] ? photos[0].src : './assets/hotel-hero.png';
    cover.alt = `${name} — фасад`;
  }
  updatePhotoCount(photos.length);

  // Цена (чёрная карточка)
  const eco = hotel.economics || {};
  const price = fmt.money(eco.askingPrice || eco.valuation);
  setTxt('pp-price-label', eco.askingPrice ? 'Запрашиваемая цена' : (eco.valuation ? 'Оценочная стоимость' : 'Стоимость'));
  setTxt('pp-price-value', price, 'По запросу');
  const perKey = fmt.money(eco.pricePerKey);
  setTxt('pp-price-sub', perKey ? `${perKey} за номер · экономика объекта` : 'Смотреть экономику объекта');

  renderEconomicsSection(hotel);
  renderObject(hotel);
  renderAmenitiesSection(hotel);
  renderLocation(hotel);
  renderPhotoGallery(hotel);

  // Полная галерея из IndexedDB, если в localStorage сохранено усечённо
  if (photos.length <= 1 && window.SriDB && hotel.id) {
    window.SriDB.get('photos_' + hotel.id).then((dbPhotos) => {
      if (Array.isArray(dbPhotos) && dbPhotos.length > photos.length) {
        hotel.photos = dbPhotos;
        renderPhotoGallery(hotel);
        updatePhotoCount(dbPhotos.length);
      }
    }).catch(console.warn);
  }
}

function updatePhotoCount(n) {
  const el = $id('cover-photo-count');
  if (el) el.textContent = n ? `${n} ${plural(n, 'фото', 'фото', 'фото')}` : 'Фото';
  const sub = $id('pp-photo-sub');
  if (sub) sub.textContent = n ? `· ${n}` : 'объекта';
}

/* ── Экономика ─────────────────────────────────────────────── */
function renderEconomicsSection(hotel) {
  const section = $id('economics');
  const toc = $id('toc-economics');
  const Calc = window.EconomicsCalc, Schema = window.EconomicsSchema;
  if (!section || !Calc || !Schema) { if (toc) toc.hidden = true; return; }

  const e = Calc.recalcAll(Schema.get(hotel), hotel);
  const any = [e.occupancy, e.adr, e.revpar, e.ebitda, e.valuation, e.irr, e.totalRevenue, e.gop].some(has);
  if (!any) { section.hidden = true; if (toc) toc.hidden = true; return; }
  section.hidden = false;
  if (toc) toc.hidden = false;

  // Период и статус данных
  const meta = $id('eco-period-meta');
  if (meta) {
    const type = { fact: ['Факт', ''], forecast: ['Прогноз', 'pp-chip--est'], estimate: ['Оценка', 'pp-chip--est'] }[e.dataType] || null;
    const ver = { committee: 'Проверено Комитетом', audited: 'Аудировано' }[e.verificationStatus];
    meta.innerHTML = [
      e.period ? `<span class="pp-chip">${ICON.cal}${esc(e.period)}</span>` : '',
      type ? `<span class="pp-chip ${type[1]}">${type[0]}</span>` : '',
      ver ? `<span class="pp-chip pp-chip--ok">${ICON.ok}${ver}</span>` : '<span class="pp-chip">Не проверено</span>'
    ].join('');
  }

  // KPI-плитки
  const kpis = [
    ['Загрузка', fmt.pct(e.occupancy, 0), 'в среднем за год', 'Occupancy — доля проданных номеро-ночей'],
    ['Средний тариф', fmt.usd(e.adr), 'ADR за ночь', 'ADR — средняя цена проданного номера'],
    ['RevPAR', fmt.usd(e.revpar, 1), 'на доступный номер', 'RevPAR = ADR × загрузка'],
    ['EBITDA', fmt.pct(e.ebitdaMargin, 1), 'рентабельность', 'EBITDA ÷ выручка × 100'],
    ['Окупаемость', fmt.years(e.payback), 'стоимость ÷ EBITDA', 'Payback = оценочная стоимость ÷ EBITDA'],
    ['IRR', fmt.pct(e.irr, 1), `горизонт ${e.irrHorizon || 10} лет`, 'Внутренняя норма доходности']
  ].filter((k) => k[1]);
  const kpiBar = $id('eco-kpi-bar');
  if (kpiBar) {
    kpiBar.innerHTML = kpis.map((k, i) => `
      <div class="pp-kpi${k[0] === 'IRR' || (i === kpis.length - 1 && !kpis.some((x) => x[0] === 'IRR')) ? ' pp-kpi--hot' : ''}">
        <span class="pp-kpi-label">${esc(k[0])}${info(k[3])}</span>
        <div><div class="pp-kpi-value">${k[1]}</div><div class="pp-kpi-sub">${esc(k[2])}</div></div>
      </div>`).join('');
    kpiBar.style.gridTemplateColumns = kpis.length < 6 && window.innerWidth > 1100 ? `repeat(${Math.max(kpis.length, 1)}, minmax(0, 1fr))` : '';
  }

  // Операции
  const op = $id('eco-op-fields');
  if (op) {
    op.innerHTML =
      row('Загрузка', fmt.pct(e.occupancy), 'Occupancy') +
      row('Средний тариф (ADR)', fmt.usd(e.adr), 'Средняя цена за проданный номер') +
      row('RevPAR', fmt.usd(e.revpar, 1), 'ADR × загрузка') +
      row('TRevPAR', fmt.usd(e.trevpar, 1), 'Вся выручка ÷ доступные номеро-ночи') +
      row('Средний срок проживания', has(e.alos) ? fmt.num(e.alos, 1) + ' дн.' : null, 'ALOS');
    $id('eco-card-operational').hidden = !op.innerHTML.trim();
  }

  // Выручка
  const rev = $id('eco-revenue-chart');
  if (rev) {
    const total = +e.totalRevenue || 0;
    const parts = [
      ['Номерной фонд', +e.revRooms || 0, '#1C1B1A'],
      ['Ресторан и бар (F&B)', +e.revFB || 0, '#FF7A1A'],
      ['Прочее', +e.revOther || 0, '#C9BBAC']
    ].filter((p) => p[1] > 0);
    const base = total || parts.reduce((s, p) => s + p[1], 0);
    if (base > 0) {
      const pct = (v) => Math.round((v / base) * 100);
      rev.innerHTML = `
        <div class="pp-total"><span>Выручка за год</span><b>${fmt.money(base)}</b></div>
        ${parts.length ? `<div class="pp-bar" aria-hidden="true">${parts.map((p) => `<i style="flex:${p[1]};background:${p[2]}"></i>`).join('')}</div>
        <ul class="pp-legend">${parts.map((p) => `<li><i style="background:${p[2]}"></i><span>${esc(p[0])}</span><b>${fmt.money(p[1])}</b><em>${pct(p[1])}%</em></li>`).join('')}</ul>` : ''}`;
    } else {
      $id('eco-card-revenue').hidden = true;
    }
  }

  // Прибыль
  const pr = $id('eco-profit-fields');
  if (pr) {
    pr.innerHTML =
      row('Валовая операционная прибыль (GOP)', fmt.money(e.gop), 'Выручка − операционные расходы') +
      row('Маржа GOP', fmt.pct(e.gopMargin), 'GOP ÷ выручка') +
      row('GOPPAR', fmt.usd(e.goppar, 1), 'GOP на доступный номер') +
      row('EBITDA', fmt.money(e.ebitda)) +
      row('Маржа EBITDA', fmt.pct(e.ebitdaMargin), 'EBITDA ÷ выручка') +
      row('Чистый операционный доход (NOI)', fmt.money(e.noi)) +
      row('Чистая прибыль', fmt.money(e.netIncome));
    $id('eco-card-profit').hidden = !pr.innerHTML.trim();
  }

  // Инвестиции
  const inv = $id('eco-invest-fields');
  if (inv) {
    inv.innerHTML =
      row('Оценочная стоимость', fmt.money(e.valuation)) +
      row('Запрашиваемая цена', fmt.money(e.askingPrice)) +
      row('CAPEX', fmt.money(e.capex), '', e.capexDescription ? `<small>${esc(e.capexDescription)}</small>` : '') +
      row('Цена за номер', fmt.money(e.pricePerKey), 'Стоимость ÷ количество номеров') +
      row('Цена за м²', fmt.money(e.pricePerSqm), 'Стоимость ÷ площадь строения') +
      row('Окупаемость', fmt.years(e.payback), 'Стоимость ÷ EBITDA') +
      row(`IRR, ${e.irrHorizon || 10} лет`, fmt.pct(e.irr)) +
      row('ROI', fmt.pct(e.roi), 'EBITDA ÷ стоимость') +
      row('Cap Rate', fmt.pct(e.capRate), 'NOI (или EBITDA) ÷ стоимость') +
      row(`NPV${e.discountRate ? `, ставка ${ru(e.discountRate)}%` : ''}`, fmt.money(e.npv)) +
      row('Дивидендная доходность', fmt.pct(e.dividendYield));
    $id('eco-card-invest').hidden = !inv.innerHTML.trim();
  }

  // Сделка
  const dealCfg = typeof window.getHotelDealConfig === 'function' ? window.getHotelDealConfig(hotel) : null;
  const dealKey = dealCfg ? dealCfg.key : 'sale';
  const df = $id('eco-deal-fields');
  if (df) {
    df.innerHTML =
      (dealKey === 'invest' ? row('Предлагаемая доля', fmt.pct(e.equityOffered)) : '') +
      row('Минимальный вход', fmt.money(e.minInvestment)) +
      (dealKey === 'rent' ? row('Ставка аренды', fmt.money(e.leaseRate) ? fmt.money(e.leaseRate) + ' в год' : null) : '') +
      (dealKey === 'franchise' ? row('Base fee', fmt.pct(e.baseFee)) + row('Incentive fee', fmt.pct(e.incentiveFee)) : '');
    $id('eco-card-deal').hidden = !df.innerHTML.trim();
  }

  // Рынок
  const cs = $id('eco-compset-fields');
  if (cs && (has(e.rgi) || has(e.mpi) || has(e.ari))) {
    const idx = (label, sub, v) => {
      if (!has(v)) return '';
      const w = Math.max(4, Math.min(100, (+v / 2) * 100));
      return `<div class="pp-index"><span class="k">${label} <small>${sub}</small></span><span class="v${+v >= 1 ? ' up' : ''}">${fmt.num(v, 2)}</span><span class="track"><i style="width:${w}%"></i><b></b></span></div>`;
    };
    cs.innerHTML =
      idx('RGI', 'по доходу на номер', e.rgi) +
      idx('MPI', 'по загрузке', e.mpi) +
      idx('ARI', 'по тарифу', e.ari) +
      (e.compsetDescription ? `<p class="pp-compset-desc">${esc(e.compsetDescription)}</p>` : '');
    $id('eco-card-compset').hidden = false;
  }

  // История
  const hist = Array.isArray(e.history) ? e.history : [];
  if (hist.length) {
    $id('eco-card-history').hidden = false;
    const t = { fact: 'Факт', forecast: 'Прогноз', estimate: 'Оценка' };
    $id('eco-history-table-wrap').innerHTML = `
      <table class="pp-table"><thead><tr><th>Год</th><th>Тип</th><th>Загрузка</th><th>ADR</th><th>RevPAR</th><th>Выручка</th><th>GOP</th><th>EBITDA</th></tr></thead>
      <tbody>${hist.map((r) => {
        const fc = r.dataType === 'forecast' || r.dataType === 'estimate' ? ' class="is-forecast"' : '';
        return `<tr><td><b>${esc(r.year || '')}</b></td><td>${t[r.dataType] || ''}</td>
          <td${fc}>${fmt.pct(r.occupancy) || '—'}</td><td${fc}>${fmt.usd(r.adr) || '—'}</td><td${fc}>${fmt.usd(r.revpar, 1) || '—'}</td>
          <td${fc}>${fmt.money(r.totalRevenue) || '—'}</td><td${fc}>${fmt.money(r.gop) || '—'}</td><td${fc}>${fmt.money(r.ebitda) || '—'}</td></tr>`;
      }).join('')}</tbody></table>`;
  }

  // Сноска
  const foot = $id('eco-meta-bar');
  if (foot) {
    const upd = fmt.date(e.updatedAt);
    foot.innerHTML = [
      `Валюта: <b>${esc(e.currency || 'USD')}</b>`,
      upd ? `обновлено ${upd}` : '',
      'методология STR Global / USALI'
    ].filter(Boolean).join(' · ');
  }
}

/* ── Объект ────────────────────────────────────────────────── */
function renderObject(hotel) {
  const rows = $id('pp-obj-rows');
  const stars = parseInt(hotel.stars, 10);
  let roomArea = null;
  if (has(hotel.minRoomArea) && has(hotel.maxRoomArea)) roomArea = `от ${hotel.minRoomArea} до ${hotel.maxRoomArea} м²`;
  else if (has(hotel.minRoomArea)) roomArea = `от ${hotel.minRoomArea} м²`;
  else if (has(hotel.maxRoomArea)) roomArea = `до ${hotel.maxRoomArea} м²`;
  const deal = typeof window.getHotelDealConfig === 'function' ? window.getHotelDealConfig(hotel).label : null;
  if (rows) {
    rows.innerHTML =
      row('Наименование', esc(hotel.hotelName)) +
      row('Собственник', has(hotel.legalEntity) ? esc(hotel.legalEntity) : '<span class="is-muted">Не указан</span>') +
      row('Категория', stars > 0 ? `${stars} ${plural(stars, 'звезда', 'звезды', 'звёзд')}` : esc(hotel.stars || 'Без категории')) +
      row('Регион', esc(hotel.region)) +
      row('Адрес', esc(hotel.address)) +
      row('Формат сделки', deal ? esc(deal) : null) +
      row('Площадь участка', esc(hotel.landArea || '')) +
      row('Площадь строения', esc(hotel.buildingArea || '')) +
      row('Площадь номеров', roomArea);
  }

  const note = $id('loc-notes-row');
  if (note) {
    const t = String(hotel.notes || '').trim();
    note.hidden = !t;
    if (t) $id('loc-notes').textContent = t;
  }

  const pres = $id('spec-presentation');
  const btn = $id('btn-obj-download');
  const hasPres = Boolean(hotel.presentationFile || hotel.presentationUrl || hotel.hasPresentation);
  if (pres) pres.textContent = hasPres ? (hotel.presentationFileName || 'Презентация объекта · PDF') : 'Предоставляется по запросу. Можно скачать печатную версию паспорта.';
  if (btn) btn.querySelector('.pp-btn-text').textContent = hasPres ? 'Скачать' : 'Печатная версия';
}

/* ── Удобства ──────────────────────────────────────────────── */
function renderAmenitiesSection(hotel) {
  const section = $id('amenities-section');
  const cloud = $id('passport-amenities-cloud');
  const toc = $id('toc-amenities');
  if (!section || !cloud) return;
  const parse = window.parseAmenities || ((s) => (s ? String(s).split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean) : []));
  const list = parse(hotel.amenities);
  if (!list.length) { section.hidden = true; if (toc) toc.hidden = true; return; }
  cloud.innerHTML = list.map((item) => `
    <span class="pp-amen-item"><span class="pp-circle" aria-hidden="true">${amenityIcon(item)}</span>${esc(item)}</span>`).join('');
}

/* ── Локация и контакты ─────────────────────────────────────── */
function renderLocation(hotel) {
  setTxt('loc-region', hotel.region, 'Узбекистан');
  setTxt('loc-address', hotel.address, 'Адрес уточняется');
  setTxt('map-tag-hotel-name', hotel.hotelName);
  setTxt('map-tag-hotel-region', hotel.address || hotel.region, 'Узбекистан');
  const c = $id('loc-contact'), call = $id('loc-call');
  const contact = String(hotel.managerContact || '').trim();
  if (c) c.textContent = contact || 'По запросу через платформу';
  const digits = contact.replace(/[^\d+]/g, '');
  if (call && digits.replace(/\D/g, '').length >= 7) {
    const tel = digits.startsWith('+') ? digits : (digits.length === 9 ? '+998' + digits : digits);
    call.href = 'tel:' + tel;
    call.hidden = false;
  }
  const note = $id('pp-map-note');
  if (note) note.hidden = Boolean(hotel.coords);
}

/* ── Фото ──────────────────────────────────────────────────── */
function renderPhotoGallery(hotel) {
  const box = $id('passport-gallery-masonry');
  if (!box) return;
  const photos = photosOf(hotel);
  box.dataset.n = String(Math.min(photos.length, 4));
  if (!photos.length) {
    box.innerHTML = '<div class="pp-empty lg2">Фотографии объекта появятся после проверки паспорта.</div>';
    return;
  }
  const item = (p, i, cls = '') => `
    <figure class="pp-photo ${cls}" role="listitem" data-src="${esc(p.src)}" tabindex="0">
      <img src="${esc(p.src)}" alt="${esc(p.caption || `${hotel.hotelName} — фото ${i + 1}`)}" loading="lazy" />
      ${p.caption && p.caption.trim() ? `<figcaption>${esc(p.caption.trim())}</figcaption>` : ''}
    </figure>`;
  const infoCard = (n) => `
    <div class="pp-photo-info lg2">
      <div><b>${n}</b><span>${plural(n, 'фотография', 'фотографии', 'фотографий')} от владельца</span><p>Полный фотоотчёт, планировки и документы — в презентации объекта.</p></div>
      <div class="pp-actions"><button type="button" class="pp-btn" data-download>
        <span class="pp-btn-text">Презентация</span><span class="pp-btn-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5v12M6 12l6 6 6-6"/></svg></span>
      </button></div>
    </div>`;
  if (photos.length <= 2) {
    box.innerHTML = photos.map((p, i) => item(p, i)).join('') + infoCard(photos.length);
  } else {
    box.innerHTML = photos.map((p, i) => item(p, i, i === 0 && photos.length > 3 ? 'pp-photo--lead' : '')).join('');
  }
  box.querySelectorAll('.pp-photo').forEach((el) => {
    const open = () => openLightbox(el.dataset.src, hotel.hotelName);
    el.addEventListener('click', open);
    el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') open(); });
  });
  box.querySelectorAll('[data-download]').forEach(attachDownload);
}

/* ── Не найден ─────────────────────────────────────────────── */
function renderNotFound() {
  const hero = $id('cover');
  if (hero) {
    hero.innerHTML = `
      <div class="pp-hero-copy" style="grid-column:1/-1;align-items:flex-start;padding:60px 0">
        <h1 class="pp-title">Объект не найден<span class="pp-title-sub">или снят с публикации</span></h1>
        <a href="portfolio.html" class="pp-btn"><span class="pp-btn-text">В каталог объектов</span><span class="pp-btn-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span></a>
      </div>`;
  }
  document.querySelectorAll('#economics, #summary, #amenities-section, #location, #gallery, #download, #passport-toc').forEach((s) => { s.hidden = true; });
}

/* ── Карта (Leaflet + открытые тайлы OpenStreetMap) ──────────── */
function getRegionCoords(key) {
  const m = {
    'tashkent': [41.2995, 69.2401], 'tashkent-region': [41.6318, 70.0435], 'samarkand': [39.6542, 66.9597],
    'bukhara': [39.7747, 64.4286], 'khorezm': [41.3783, 60.3639], 'fergana': [40.3842, 71.7843],
    'namangan': [40.9983, 71.6726], 'andijan': [40.7821, 72.3442], 'kashkadarya': [38.8612, 65.7847],
    'surkhandarya': [37.2242, 67.2783], 'jizzakh': [40.1158, 67.8422], 'syrdarya': [40.4933, 68.7844],
    'navoi': [40.0844, 65.3792], 'karakalpakstan': [42.4602, 59.6166]
  };
  return m[key] || m.tashkent;
}
function initPassportMap(hotel) {
  const el = $id('interactive-hotel-map');
  if (!el || typeof L === 'undefined') return;
  const coords = hotel.coords || getRegionCoords(hotel.regionKey);
  try {
    const map = L.map(el, { center: coords, zoom: hotel.coords ? 15 : 12, zoomControl: true, scrollWheelZoom: false, attributionControl: true });
    map.zoomControl.setPosition('topright');
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap', maxZoom: 19
    }).addTo(map);
    const icon = L.divIcon({ className: '', html: '<div class="pp-pin"></div>', iconSize: [44, 44], iconAnchor: [22, 22] });
    L.marker(coords, { icon, title: hotel.hotelName || '' }).addTo(map);
    setTimeout(() => map.invalidateSize(), 400);
  } catch (err) {
    console.warn('Map init:', err);
  }
}

/* ── Лайтбокс ──────────────────────────────────────────────── */
function openLightbox(src, title) {
  const lb = $id('passport-lightbox'), img = $id('passport-lightbox-img');
  if (!lb || !img) return;
  img.src = src;
  img.alt = title || 'Фото объекта';
  lb.classList.add('is-open');
  lb.setAttribute('aria-hidden', 'false');
}
function closeLightbox() {
  const lb = $id('passport-lightbox');
  if (!lb) return;
  lb.classList.remove('is-open');
  lb.setAttribute('aria-hidden', 'true');
}
function initLightbox() {
  const lb = $id('passport-lightbox');
  $id('btn-lightbox-close')?.addEventListener('click', closeLightbox);
  lb?.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
}

/* ── Навигация по разделам ─────────────────────────────────── */
function initTocSpy() {
  const links = [...document.querySelectorAll('.pp-tabs .toc-link[href^="#"]')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const bar = document.querySelector('.pp-tabs-inner');
  const setActive = (id) => links.forEach((a) => {
    const on = a.getAttribute('href') === '#' + id;
    a.classList.toggle('toc-link--active', on);
    if (on && bar) {
      const l = a.offsetLeft - (bar.clientWidth - a.offsetWidth) / 2;
      bar.scrollTo({ left: l, behavior: 'smooth' });
    }
  });
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) setActive(en.target.id);
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((a) => { const s = document.querySelector(a.getAttribute('href')); if (s) io.observe(s); });
}

/* ── Появление блоков ──────────────────────────────────────── */
function initReveal() {
  const els = document.querySelectorAll('.pp-section > *, .pp-docs-stage');
  els.forEach((el) => el.classList.add('pp-reveal'));
  if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: 0.08 });
  els.forEach((el) => io.observe(el));
}

/* ── Скачивание презентации ─────────────────────────────────── */
async function downloadPresentation() {
  const hotel = currentHotelData;
  if (!hotel) return;
  let file = hotel.presentationFile || hotel.presentationUrl;
  let filename = hotel.presentationFileName || `${hotel.hotelName || 'hotel'}-presentation.pdf`;
  if ((!file || !file.startsWith('data:')) && window.SriDB && hotel.id) {
    try {
      const doc = await window.SriDB.get('pres_' + hotel.id);
      if (doc && doc.data) { file = doc.data; if (doc.name) filename = doc.name; }
    } catch (err) { console.warn('SriDB:', err); }
  }
  if (file) {
    const a = document.createElement('a');
    a.href = file;
    a.download = /\.(pdf|pptx|docx|zip|rar)$/i.test(filename) ? filename : `${filename}.pdf`;
    if (!file.startsWith('data:')) a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }
  window.print();
}
function attachDownload(btn) {
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = '1';
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const t = btn.querySelector('.pp-btn-text');
    const orig = t ? t.textContent : '';
    if (t) t.textContent = 'Загрузка…';
    btn.disabled = true;
    try { await downloadPresentation(); } catch (err) { console.warn(err); }
    finally { setTimeout(() => { if (t) t.textContent = orig; btn.disabled = false; }, 800); }
  });
}
function initPdfButton() {
  ['btn-download-pdf', 'btn-cover-download', 'btn-obj-download'].forEach((id) => attachDownload($id(id)));
}
