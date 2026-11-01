/* ============================================================
   INVESTORS.JS — страница «Для инвесторов»
   Все цифры берутся из тех же источников, что и каталоги:
     отели       — HotelStore (js/hotels-data.js)
     рестораны   — data/restaurants.json
     земля       — data/land-lots.json
     господдержка — SupportData (js/support-core.js)
   ============================================================ */
(function () {
  'use strict';

  document.documentElement.classList.add('js-reveal');

  /* ── Справочник регионов ─────────────────────────────────── */
  const REGIONS = {
    'tashkent':        { name: 'Ташкент',           labels: ['Ташкент (город)', 'г. Ташкент', 'Ташкент'] },
    'tashkent-region': { name: 'Ташкентская обл.',  labels: ['Ташкентская область'] },
    'samarkand':       { name: 'Самарканд',         labels: ['Самаркандская область'] },
    'bukhara':         { name: 'Бухара',            labels: ['Бухарская область'] },
    'khorezm':         { name: 'Хорезм',            labels: ['Хорезмская область'] },
    'fergana':         { name: 'Фергана',           labels: ['Ферганская область'] },
    'namangan':        { name: 'Наманган',          labels: ['Наманганская область'] },
    'andijan':         { name: 'Андижан',           labels: ['Андижанская область'] },
    'kashkadarya':     { name: 'Кашкадарья',        labels: ['Кашкадарьинская область'] },
    'surkhandarya':    { name: 'Сурхандарья',       labels: ['Сурхандарьинская область'] },
    'jizzakh':         { name: 'Джизак',            labels: ['Джизакская область'] },
    'syrdarya':        { name: 'Сырдарья',          labels: ['Сырдарьинская область'] },
    'navoi':           { name: 'Навои',             labels: ['Навоийская область'] },
    'karakalpakstan':  { name: 'Каракалпакстан',    labels: ['Республика Каракалпакстан', 'Каракалпакстан'] }
  };
  const LABEL_TO_KEY = {};
  Object.keys(REGIONS).forEach((k) => REGIONS[k].labels.forEach((l) => { LABEL_TO_KEY[l] = k; }));
  const regionKeyOf = (label) => LABEL_TO_KEY[String(label || '').trim()] || null;

  /* Фильтр каталога отелей понимает только эти ключи */
  const CATALOG_REGIONS = new Set(['tashkent', 'tashkent-region', 'samarkand', 'bukhara', 'khorezm', 'fergana', 'namangan',
    'andijan', 'kashkadarya', 'surkhandarya', 'jizzakh', 'syrdarya', 'navoi']);

  /* ── Форматирование ──────────────────────────────────────── */
  function plural(n, forms) {
    const f = forms.split('|');
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return f[2];
    if (b > 1 && b < 5) return f[1];
    if (b === 1) return f[0];
    return f[2];
  }
  function money(v) {
    const n = Number(v);
    if (!isFinite(n) || n <= 0) return null;
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(1).replace(/\.0$/, '').replace('.', ',') + ' млрд';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1).replace(/\.0$/, '').replace('.', ',') + ' млн';
    if (n >= 1e3) return '$' + Math.round(n / 1e3) + ' тыс.';
    return '$' + Math.round(n);
  }
  const fmtInt = (n) => Math.round(n).toLocaleString('ru-RU');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const stats = {};
  function setStat(key, value) {
    stats[key] = value;
    document.querySelectorAll(`[data-stat="${key}"]`).forEach((el) => { el.textContent = value; });
    if (typeof value === 'number') {
      document.querySelectorAll(`[data-of="${key}"]`).forEach((el) => { el.textContent = plural(value, el.dataset.forms); });
    }
  }

  /* ── Фото отеля ──────────────────────────────────────────── */
  /* сначала собственные (оптимизированные) фото из /assets, потом внешние ссылки */
  function photoOf(h) {
    const all = (h.photos || []).map((p) => (p && typeof p === 'object' ? p.src : p))
      .filter((src) => typeof src === 'string' && src && !src.startsWith('data:'));
    return all.find((src) => src.startsWith('/assets/') || src.startsWith('assets/') || src.startsWith('./assets/')) || all[0] || null;
  }
  const cardSrc = (src) => (src && /^\/assets\/hotels\/[^/]+\.webp$/.test(src) && !/-card\.webp$/.test(src)) ? src.replace(/\.webp$/, '-card.webp') : src;
  const priceOf = (h) => (h.economics && (Number(h.economics.askingPrice) || Number(h.economics.valuation))) || 0;
  const starsOf = (h) => parseInt(h.stars, 10) || 0;

  /* ── Загрузка данных ─────────────────────────────────────── */
  async function loadHotels() {
    try {
      if (window.HotelStore && typeof window.HotelStore.getAllAsync === 'function') {
        const list = await window.HotelStore.getAllAsync();
        if (Array.isArray(list) && list.length) return list;
      }
    } catch (e) { /* ниже — запасной путь */ }
    try { return await (await fetch('./data/hotels.json')).json(); } catch (e) { return []; }
  }
  const loadJSON = (url) => fetch(url).then((r) => r.json()).catch(() => []);
  async function loadSupport() {
    try {
      const SD = window.SupportData;
      if (!SD) return [];
      return SD.live(await SD.load());
    } catch (e) { return []; }
  }

  /* ── Отели: плитка и слайды ──────────────────────────────── */
  const PREFERRED_SLIDES = ['movenpick-tashkent', 'hastimom-samarkand', 'khiva-residence', 'farovon-khiva', 'somoniy-hotel-bukhara', 'zomin-miracle'];

  function renderHotels(hotels) {
    setStat('hotels', hotels.length);

    const regions = new Set(hotels.map((h) => h.regionKey).filter(Boolean));
    setStat('hotel-regions', regions.size);

    const rooms = hotels.reduce((s, h) => s + (parseInt(h.roomsCount, 10) || 0), 0);
    setStat('rooms', rooms ? fmtInt(rooms) : '—');

    const prices = hotels.map(priceOf).filter((n) => n > 0).sort((a, b) => a - b);
    if (prices.length) setStat('price-range', `${money(prices[0])} – ${money(prices[prices.length - 1])}`);

    const stars = hotels.map(starsOf).filter(Boolean);
    const sub = document.getElementById('hotel-sub');
    if (sub && stars.length) sub.textContent = `${Math.min(...stars)}★–${Math.max(...stars)}★ · курорты, бутик-отели, городские`;

    /* слайды — сначала узнаваемые объекты, потом остальные с фото */
    const byId = new Map(hotels.map((h) => [h.id, h]));
    const picked = PREFERRED_SLIDES.map((id) => byId.get(id)).filter((h) => h && photoOf(h));
    hotels.forEach((h) => { if (picked.length < 6 && !picked.includes(h) && photoOf(h)) picked.push(h); });
    const box = document.getElementById('hotel-slides');
    if (box && picked.length) {
      box.innerHTML = picked.map((h, i) =>
        `<img src="${esc(i === 0 ? photoOf(h) : '')}" data-src="${esc(photoOf(h))}" alt="" ${i === 0 ? 'class="is-on"' : 'loading="lazy"'} decoding="async" />`
      ).join('');
      startSlides(box);
    }
    return picked;
  }

  function startSlides(box) {
    const imgs = [...box.querySelectorAll('img')];
    if (imgs.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0, timer = null;
    const load = (img) => { if (!img.getAttribute('src')) img.src = img.dataset.src; };
    const next = () => {
      const cur = imgs[i];
      i = (i + 1) % imgs.length;
      const nxt = imgs[i];
      load(nxt);
      load(imgs[(i + 1) % imgs.length]);
      const show = () => { nxt.classList.add('is-on'); setTimeout(() => cur.classList.remove('is-on'), 1400); };
      if (nxt.complete && nxt.naturalWidth) show(); else nxt.addEventListener('load', show, { once: true });
    };
    const run = () => { if (!timer) timer = setInterval(next, 5200); };
    const stop = () => { clearInterval(timer); timer = null; };
    /* крутим только когда плитка видна */
    new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? run() : stop())), { threshold: 0.2 }).observe(box);
  }

  /* ── Рестораны, земля, поддержка ─────────────────────────── */
  function renderRestaurants(list) {
    setStat('restaurants', list.length);
    const irr = list.map((r) => Number(r.irr_pct)).filter((n) => n > 0);
    if (irr.length) setStat('rest-irr', `${Math.min(...irr)}–${Math.max(...irr)}%`);
    const inv = list.map((r) => Number(r.investment_usd)).filter((n) => n > 0);
    if (inv.length) setStat('rest-min', 'от ' + money(Math.min(...inv)));
  }

  function renderLand(list) {
    setStat('land', list.length);
    const area = list.reduce((s, l) => s + (Number(l.area_ha) || 0), 0);
    if (area) setStat('land-area', area.toFixed(1).replace('.', ',') + ' га');
    const p = list.map((l) => Number(l.start_price_usd)).filter((n) => n > 0);
    if (p.length) setStat('land-min', 'от ' + money(Math.min(...p)));
    const first = list.find((l) => Array.isArray(l.coordinates));
    const coord = document.getElementById('land-coord');
    if (first && coord) {
      const [lat, lon] = first.coordinates;
      coord.textContent = `${lat.toFixed(2)}° N · ${lon.toFixed(2)}° E · ${String(first.area_ha).replace('.', ',')} га`;
    }
  }

  const KIND = { subsidy: ['субсидия', 'субсидии', 'субсидий'], compensation: ['компенсация', 'компенсации', 'компенсаций'], grant: ['грант', 'гранта', 'грантов'], tax: ['налоговая льгота', 'налоговые льготы', 'налоговых льгот'] };
  function renderSupport(live) {
    if (!live.length) return;
    setStat('support', live.length);
    const counts = {};
    live.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
    const ul = document.getElementById('support-kinds');
    if (ul) {
      ul.innerHTML = Object.keys(KIND).filter((k) => counts[k])
        .sort((a, b) => counts[b] - counts[a])
        .map((k) => `<li><b>${counts[k]}</b>${plural(counts[k], KIND[k].join('|'))}</li>`).join('');
    }
  }

  /* ── Карта ───────────────────────────────────────────────── */
  function renderGeo(hotels, rests, lands) {
    const svg = document.querySelector('.geo-map');
    const list = document.getElementById('geo-list');
    const tip = document.getElementById('geo-tip');
    const wrap = document.getElementById('geo-map-wrap');
    if (!svg || !list) return;

    const agg = {};
    const bump = (k, f) => { if (!k) return; (agg[k] = agg[k] || { hotels: 0, rests: 0, land: 0 })[f]++; };
    hotels.forEach((h) => bump(h.regionKey || regionKeyOf(h.region), 'hotels'));
    rests.forEach((r) => bump(regionKeyOf(r.region), 'rests'));
    lands.forEach((l) => bump(regionKeyOf(l.region), 'land'));
    const keys = Object.keys(agg);
    setStat('all-regions', keys.length);

    const total = (k) => agg[k].hotels + agg[k].rests + agg[k].land;
    const level = (n) => (n >= 10 ? 4 : n >= 5 ? 3 : n >= 3 ? 2 : n >= 1 ? 1 : 0);
    svg.querySelectorAll('.geo-region').forEach((p) => {
      const k = p.dataset.region;
      p.dataset.level = agg[k] ? level(total(k)) : 0;
      p.setAttribute('tabindex', agg[k] ? '0' : '-1');
      p.setAttribute('aria-label', (REGIONS[k] ? REGIONS[k].name : k) + (agg[k] ? `: ${total(k)}` : ''));
    });

    /* проекция — те же константы, что при построении карты (tools/uzmap.py) */
    const K = +svg.dataset.k, MINX = +svg.dataset.minx, MAXY = +svg.dataset.maxy, S = +svg.dataset.s;
    const proj = (lat, lon) => [(lon * K - MINX) * S, (MAXY - lat) * S];
    const NS = 'http://www.w3.org/2000/svg';
    const pins = svg.querySelector('.geo-pins');
    let html = '';
    lands.forEach((l) => {
      if (!Array.isArray(l.coordinates)) return;
      const [x, y] = proj(l.coordinates[0], l.coordinates[1]);
      html += `<g class="geo-pin geo-pin--land" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(45)"><rect x="-6" y="-6" width="12" height="12" rx="2"/></g>`;
    });
    /* счётчики отелей и ресторанов — в центре региона; Ташкент и область разводим */
    const centers = {};
    svg.querySelectorAll('.geo-region').forEach((p) => { centers[p.dataset.region] = [+p.dataset.cx, +p.dataset.cy]; });
    if (centers['tashkent'] && centers['tashkent-region']) {
      centers['tashkent'] = [centers['tashkent'][0] - 26, centers['tashkent'][1] - 22];
      centers['tashkent-region'] = [centers['tashkent-region'][0] + 18, centers['tashkent-region'][1] + 26];
    }
    keys.forEach((k) => {
      const n = agg[k].hotels + agg[k].rests;
      if (!n || !centers[k]) return;
      const [x, y] = centers[k];
      const r = n >= 10 ? 19 : 15;
      html += `<g class="geo-count" transform="translate(${x} ${y})">` +
        (agg[k].hotels ? `<circle r="${r + 4}" fill="none" stroke="${'#C08A3E'}" stroke-width="2.5" stroke-dasharray="${agg[k].rests ? (2 * Math.PI * (r + 4) * agg[k].hotels / n).toFixed(1) + ' 999' : 'none'}" transform="rotate(-90)"/>` : '') +
        (agg[k].rests ? `<circle r="${r + 4}" fill="none" stroke="#B5523B" stroke-width="2.5" stroke-dasharray="0 ${(2 * Math.PI * (r + 4) * agg[k].hotels / n).toFixed(1)} 999" transform="rotate(-90)"/>` : '') +
        `<circle r="${r}"/><text>${n}</text></g>`;
    });
    pins.innerHTML = html;
    void NS;

    /* список регионов справа */
    const order = keys.sort((a, b) => total(b) - total(a));
    list.innerHTML = order.map((k) => {
      const a = agg[k];
      const dots = [
        a.hotels ? `<span><i class="lg-dot lg-dot--hotel"></i>${a.hotels}</span>` : '',
        a.rests ? `<span><i class="lg-dot lg-dot--rest"></i>${a.rests}</span>` : '',
        a.land ? `<span><i class="lg-dot lg-dot--land"></i>${a.land}</span>` : ''
      ].join('');
      return `<li class="geo-row" data-region="${k}" tabindex="0" role="link"><span class="geo-row-name">${esc(REGIONS[k] ? REGIONS[k].name : k)}</span><span class="geo-row-dots">${dots}</span></li>`;
    }).join('');

    const target = (k) => {
      const a = agg[k];
      if (!a) return null;
      if (a.hotels && CATALOG_REGIONS.has(k)) return `portfolio.html?region=${encodeURIComponent(k)}`;
      if (a.land >= a.rests && a.land) return 'land.html';
      if (a.rests) return 'restaurants.html';
      return 'portfolio.html';
    };

    let current = null;
    function hover(k, evt) {
      current = k;
      svg.classList.toggle('has-hover', !!k);
      svg.querySelectorAll('.geo-region').forEach((p) => p.classList.toggle('is-hover', p.dataset.region === k));
      list.querySelectorAll('.geo-row').forEach((r) => r.classList.toggle('is-hover', r.dataset.region === k));
      if (!tip) return;
      if (!k || !agg[k]) { tip.hidden = true; return; }
      const a = agg[k];
      tip.innerHTML = `<b>${esc(REGIONS[k] ? REGIONS[k].name : k)}</b>` +
        `<span>Отели <em>${a.hotels}</em></span><span>Рестораны <em>${a.rests}</em></span><span>Земельные лоты <em>${a.land}</em></span>`;
      tip.hidden = false;
      const box = wrap.getBoundingClientRect();
      let x, y;
      if (evt && evt.clientX) { x = evt.clientX - box.left; y = evt.clientY - box.top; }
      else {
        const p = svg.querySelector(`.geo-region[data-region="${k}"]`).getBoundingClientRect();
        x = p.left + p.width / 2 - box.left; y = p.top + p.height / 2 - box.top;
      }
      tip.style.left = Math.max(100, Math.min(box.width - 100, x)) + 'px';
      tip.style.top = Math.max(110, y) + 'px';
    }

    svg.addEventListener('pointermove', (e) => {
      const p = e.target.closest('.geo-region');
      const k = p && agg[p.dataset.region] ? p.dataset.region : null;
      if (k !== current || k) hover(k, e);
    });
    svg.addEventListener('pointerleave', () => hover(null));
    svg.addEventListener('click', (e) => {
      const p = e.target.closest('.geo-region');
      const url = p && target(p.dataset.region);
      if (url) location.href = url;
    });
    svg.addEventListener('keydown', (e) => {
      const p = e.target.closest('.geo-region');
      if (p && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); const url = target(p.dataset.region); if (url) location.href = url; }
    });
    svg.addEventListener('focusin', (e) => { const p = e.target.closest('.geo-region'); if (p) hover(p.dataset.region); });
    svg.addEventListener('focusout', () => hover(null));

    list.addEventListener('pointerover', (e) => { const r = e.target.closest('.geo-row'); if (r) hover(r.dataset.region); });
    list.addEventListener('pointerleave', () => hover(null));
    const go = (e) => { const r = e.target.closest('.geo-row'); const url = r && target(r.dataset.region); if (url) location.href = url; };
    list.addEventListener('click', go);
    list.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); } });
  }

  /* ── Лента объектов ──────────────────────────────────────── */
  function renderRail(hotels) {
    const rail = document.getElementById('rail');
    if (!rail) return;
    const withPhoto = hotels.filter((h) => photoOf(h));
    const priced = withPhoto.filter((h) => priceOf(h) > 0).sort((a, b) => starsOf(b) - starsOf(a) || priceOf(b) - priceOf(a));
    const rest = withPhoto.filter((h) => !priceOf(h)).sort((a, b) => starsOf(b) - starsOf(a));
    const pick = priced.concat(rest).slice(0, 9);

    const DEAL = { sale: 'Продажа', rent: 'Аренда', franchise: 'Франшиза', invest: 'Соинвестирование' };
    rail.innerHTML = pick.map((h) => {
      const price = money(priceOf(h));
      const st = starsOf(h);
      const deal = DEAL[String(h.dealType || '').toLowerCase()] || '';
      const region = REGIONS[h.regionKey] ? REGIONS[h.regionKey].name : (h.region || '');
      const rooms = parseInt(h.roomsCount, 10);
      return `<a role="listitem" class="obj" href="passport.html?hotel=${encodeURIComponent(h.slug || h.id)}">
        <img src="${esc(cardSrc(photoOf(h)))}" alt="${esc(h.hotelName)}" loading="lazy" decoding="async" />
        <div class="obj-top">
          ${st ? `<span class="obj-chip lg"><span>${'★'.repeat(st)}</span></span>` : '<span></span>'}
          ${deal ? `<span class="obj-chip lg"><span>${esc(deal)}</span></span>` : ''}
        </div>
        <div class="obj-panel lg">
          <p class="obj-price">${price ? esc(price) : 'Цена по запросу'}</p>
          <p class="obj-name">${esc(h.hotelName)}</p>
          <p class="obj-meta">${esc(region)}${rooms ? ` · ${rooms} ${plural(rooms, 'номер|номера|номеров')}` : ''}</p>
        </div>
      </a>`;
    }).join('') + (hotels.length > pick.length ? `
      <a role="listitem" class="obj obj--more" href="portfolio.html">
        <span class="more-n">+${hotels.length - pick.length}</span>
        <p>${plural(hotels.length - pick.length, 'объект|объекта|объектов')} в каталоге — с фильтрами и сравнением.</p>
        <span class="tile-go">Весь каталог</span>
      </a>` : '');

    const btns = document.querySelectorAll('[data-rail]');
    const step = () => { const c = rail.querySelector('.obj'); return c ? c.getBoundingClientRect().width + 20 : 320; };
    btns.forEach((b) => b.addEventListener('click', () => rail.scrollBy({ left: step() * Number(b.dataset.rail) * 2, behavior: 'smooth' })));
    const sync = () => {
      const max = rail.scrollWidth - rail.clientWidth - 4;
      btns.forEach((b) => { b.disabled = Number(b.dataset.rail) < 0 ? rail.scrollLeft <= 4 : rail.scrollLeft >= max; });
    };
    rail.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    window.addEventListener('resize', sync);
    sync();
    return pick;
  }

  /* ── Мини-кабинет: три объекта в «избранном» ─────────────── */
  function renderMini(pick) {
    const ul = document.getElementById('mini-fav');
    if (!ul) return;
    const three = pick.slice(0, 3);
    ul.innerHTML = three.map((h) => `<li>
      <img src="${esc(cardSrc(photoOf(h)))}" alt="" loading="lazy" />
      <span class="mini-t"><b>${esc(h.hotelName)}</b><span>${esc(money(priceOf(h)) || 'Цена по запросу')}</span></span>
      <svg class="heart" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.6 2.9 4.5 6.7 4.5c2.2 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.1-2.4 4.3-2.4 3.8 0 5.8 4.1 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>
    </li>`).join('');
    const art = document.querySelector('.tool-art--cabinet');
    const bg = pick[3] || pick[0];
    if (art && bg) art.style.backgroundImage = `url("${cardSrc(photoOf(bg))}")`;
  }

  /* ── Появление при скролле и локальная навигация ─────────── */
  function initReveal() {
    const items = document.querySelectorAll('[data-reveal], .path, .tool');
    if (!('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el) => io.observe(el));
  }

  function initSubnav() {
    const links = [...document.querySelectorAll('.inv-subnav-links a')];
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.remove('is-current'));
      const a = map.get(e.target.id);
      if (a) a.classList.add('is-current');
    }), { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ── Проверка сертификата: пустую форму не отправляем ────── */
  function initVerify() {
    const form = document.getElementById('verify-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      const v = form.no.value.trim();
      if (!v) { e.preventDefault(); form.no.focus(); return; }
      e.preventDefault();
      location.href = `certification-registry.html?no=${encodeURIComponent(v)}#verify`;
    });
  }

  /* ── Старт ───────────────────────────────────────────────── */
  async function init() {
    initReveal();
    initSubnav();
    initVerify();
    const [hotels, rests, lands, support] = await Promise.all([
      loadHotels(), loadJSON('./data/restaurants.json'), loadJSON('./data/land-lots.json'), loadSupport()
    ]);
    const H = Array.isArray(hotels) ? hotels : [];
    const R = Array.isArray(rests) ? rests : [];
    const L = Array.isArray(lands) ? lands : [];
    renderHotels(H);
    renderRestaurants(R);
    renderLand(L);
    renderSupport(support);
    renderGeo(H, R, L);
    renderMini(renderRail(H));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
