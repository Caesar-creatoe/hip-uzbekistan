/* ============================================================
   BRANDS.JS — страница «Бренды»
   Данные: data/brands.json (реестр брендовых отелей) +
   каталог объектов (HotelStore / data/hotels.json).
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nf = (n) => Number(n || 0).toLocaleString('ru-RU').replace(/ |\s/g, ' ');
  const plural = (n, f) => { const a = n % 100, b = n % 10; return a > 10 && a < 20 ? f[2] : b > 1 && b < 5 ? f[1] : b === 1 ? f[0] : f[2]; };
  const HOT = ['отель', 'отеля', 'отелей'];
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const REGIONS = {
    'tashkent': ['Ташкент', 41.2995, 69.2401], 'tashkent-region': ['Ташкентская обл.', 41.53, 70.03], 'samarkand': ['Самаркандская обл.', 39.6542, 66.9597],
    'bukhara': ['Бухарская обл.', 39.7747, 64.4286], 'khorezm': ['Хорезм', 41.3783, 60.3639], 'fergana': ['Ферганская обл.', 40.45, 71.35],
    'namangan': ['Наманганская обл.', 40.9983, 71.6726], 'andijan': ['Андижанская обл.', 40.7821, 72.3442], 'kashkadarya': ['Кашкадарьинская обл.', 38.8612, 65.7847],
    'surkhandarya': ['Сурхандарьинская обл.', 37.2242, 67.2783], 'jizzakh': ['Джизакская обл.', 40.1158, 67.8422], 'syrdarya': ['Сырдарьинская обл.', 40.4933, 68.7844],
    'navoi': ['Навоийская обл.', 40.0844, 65.3792], 'karakalpakstan': ['Каракалпакстан', 42.4602, 59.6166]
  };
  const initials = (name) => { const w = String(name).replace(/[^A-Za-zА-Яа-я0-9 ]/g, ' ').split(/\s+/).filter(Boolean); return (w[0] || '?').charAt(0).toUpperCase() + (w[1] && /^[A-Z]/.test(w[1]) && w[0].length < 6 ? w[1].charAt(0) : ''); };
  // Логотипы сетей — файлы от владельца платформы (assets/brands). Белые логотипы — на тёмной плашке.
  const LOGO_DARK = { 'reikartz': 1, 'minyoun-hospitality-group': 1, 'sahid-hotels-resorts': 1 };
  const logo = (n, cls) => `<span class="bx-logo${LOGO_DARK[n.id] ? ' bx-logo--dark' : ''}${cls ? ' ' + cls : ''}"><img src="assets/brands/${esc(n.id)}.webp?v=1" alt="${esc(n.name)}" loading="lazy" decoding="async"></span>`;
  const starsHtml = (s) => s ? '★'.repeat(s) : '<em>не указана</em>';

  let D = null, HOTELS = [], CATALOG = [];

  /* ── Счётчики и надписи ───────────────────────────────── */
  function fill(sel, v) { $$(sel).forEach((e) => { e.textContent = v; }); }
  function summary() {
    const cities = {}; HOTELS.forEach((h) => { cities[h.city] = (cities[h.city] || 0) + h.rooms; });
    const rooms = HOTELS.reduce((s, h) => s + h.rooms, 0);
    const places = HOTELS.reduce((s, h) => s + h.places, 0);
    const tash = Math.round((cities.tashkent || 0) / rooms * 100) + '%';
    fill('[data-b="hotels"]', HOTELS.length);
    fill('[data-b="cities"]', Object.keys(cities).length);
    fill('[data-b="rooms"]', nf(rooms));
    fill('[data-b="tash-share"]', tash); fill('[data-b="tash-share2"]', tash);
    fill('[data-b="avg"]', Math.round(rooms / HOTELS.length));
    const d = D.asof.split('-'); fill('[data-b="asof"]', d[2] + '.' + d[1] + '.' + d[0]);
    const ui = $('.bx-ui-a em'); if (ui) ui.textContent = nf(places) + ' мест';
  }

  /* ── Первый экран: стеклянные шильды сетей ─────────────── */
  function plates() {
    const box = $('[data-plates]'); if (!box) return;
    const pos = [[3, 24], [55, 38], [6, 50], [52, 64]];
    const top = D.networks.slice().sort((a, b) => b.hotels - a.hotels).slice(0, 4);
    box.innerHTML = top.map((n, i) => `<div class="bx-plate bx-glass" style="left:${pos[i][0]}%;top:${pos[i][1]}%;--d:${(-i * 1.3).toFixed(1)}s">${logo(n, 'bx-logo--plate')}<b>${n.hotels} ${plural(n.hotels, HOT)}</b></div>`).join('');
  }

  function marquee() {
    const ul = $('[data-marquee]'); if (!ul) return;
    const names = D.networks.flatMap((n) => n.brands.map((b) => b.name));
    const li = (hide) => names.map((b) => `<li${hide ? ' aria-hidden="true"' : ''}>${esc(b)}</li>`).join('');
    ul.innerHTML = li(false) + li(true);
  }

  /* ── Список сетей ─────────────────────────────────────── */
  const CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  function nets() {
    const box = $('[data-nets]'); if (!box) return;
    const total = HOTELS.reduce((s, h) => s + h.rooms, 0);
    const maxR = Math.max.apply(null, D.networks.map((n) => n.rooms));
    box.innerHTML = D.networks.map((n) => {
      const share = n.rooms / total * 100;
      const brands = n.brands.map((b) => `<div class="bx-brand" data-brand>
          <div class="bx-brand__head"><h4>${esc(b.name)}</h4><span data-bcount>${b.hotels.length} ${plural(b.hotels.length, HOT)}</span></div>
          <table class="bx-tbl"><colgroup><col class="c1"><col class="c2"><col class="c3"><col class="c4"><col class="c5"><col></colgroup><thead><tr><th>Отель</th><th>Город</th><th class="n">Номеров</th><th class="n">Мест</th><th>Категория</th><th>Юридическое лицо</th></tr></thead><tbody>
          ${b.hotels.map((h) => `<tr data-city="${esc(h.city)}"><td>${esc(h.name)}</td><td>${esc(D.cities[h.city].name)}</td><td class="n">${nf(h.rooms)}</td><td class="n">${nf(h.places)}</td><td class="st">${starsHtml(h.stars)}</td><td class="lg">${esc(h.legal)}</td></tr>`).join('')}
          </tbody></table></div>`).join('');
      return `<details class="bx-net bx-glass" data-net="${esc(n.id)}" data-reveal>
        <summary>
          ${logo(n)}
          <div class="bx-net__name"><b>${esc(n.name)}</b><span class="bx-net__meta" data-meta></span><div class="bx-net__brands">${n.brands.map((b) => `<span>${esc(b.name)}</span>`).join('')}</div></div>
          <div class="bx-num"><small>Отелей</small><b data-nh>${n.hotels}</b></div>
          <div class="bx-num"><small>Номеров</small><b data-nr>${nf(n.rooms)}</b></div>
          <div class="bx-share"><small>Доля номеров <b data-ns>${share.toFixed(1).replace('.', ',')}%</b></small><i style="--w:${(n.rooms / maxR * 100).toFixed(1)}%"></i></div>
          <span class="bx-chev" aria-hidden="true">${CHEV}</span>
        </summary>
        <div class="bx-net__body">${brands}</div>
      </details>`;
    }).join('') + '<p class="bx-empty" data-empty hidden>В этом городе брендовых отелей нет.</p>';
    applyCity('all');
  }

  function cityGroups() {
    const c = {}; HOTELS.forEach((h) => { c[h.city] = (c[h.city] || 0) + 1; });
    return c;
  }
  function chips() {
    const box = $('[data-city-filter]'); if (!box) return;
    const c = cityGroups();
    const main = ['tashkent', 'samarkand', 'bukhara'];
    const other = HOTELS.filter((h) => main.indexOf(h.city) < 0).length;
    const list = [['all', 'Все', HOTELS.length]].concat(main.map((k) => [k, D.cities[k].name, c[k] || 0])).concat([['regions', 'Другие города', other]]);
    box.innerHTML = list.map((x, i) => `<button type="button" class="bx-chip" data-city="${x[0]}" aria-pressed="${i === 0}">${esc(x[1])}<small>${x[2]}</small></button>`).join('');
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-city]'); if (!b) return;
      $$('[data-city]', box).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      applyCity(b.dataset.city);
    });
  }
  function applyCity(city) {
    const main = ['tashkent', 'samarkand', 'bukhara'];
    const ok = (c) => city === 'all' || (city === 'regions' ? main.indexOf(c) < 0 : c === city);
    let shown = 0;
    $$('[data-net]').forEach((net) => {
      const n = D.networks.find((x) => x.id === net.dataset.net);
      let hotels = 0, rooms = 0;
      $$('[data-brand]', net).forEach((br) => {
        let k = 0;
        $$('tr[data-city]', br).forEach((tr) => { const on = ok(tr.dataset.city); tr.hidden = !on; if (on) k++; });
        br.hidden = !k;
        $('[data-bcount]', br).textContent = k + ' ' + plural(k, HOT);
      });
      n.brands.forEach((b) => b.hotels.forEach((h) => { if (ok(h.city)) { hotels++; rooms += h.rooms; } }));
      net.hidden = !hotels; if (hotels) shown++;
      $('[data-nh]', net).textContent = hotels;
      $('[data-nr]', net).textContent = nf(rooms);
      $('[data-meta]', net).textContent = hotels + ' ' + plural(hotels, HOT) + ' · ' + nf(rooms) + ' ном.';
    });
    const em = $('[data-empty]'); if (em) em.hidden = !!shown;
  }

  /* ── Сегменты ─────────────────────────────────────────── */
  function segments() {
    const box = $('[data-cat-pills]');
    if (box) {
      const c = { 5: 0, 4: 0, 3: 0, 0: 0 }; HOTELS.forEach((h) => { c[h.stars || 0]++; });
      const rows = [[5, '5★'], [4, '4★'], [3, '3★'], [0, 'Не указана']];
      const max = Math.max(c[5], c[4], c[3], c[0]);
      box.innerHTML = rows.map((r) => `<div class="sr-pill${r[0] === 4 ? ' sr-pill--hi' : ''}"><div class="sr-pill__bar"><i style="--h:${Math.max(18, c[r[0]] / max * 100).toFixed(0)}%"><b>${c[r[0]]}</b></i></div><span>${r[1]}</span></div>`).join('');
    }
    const bars = $('[data-net-bars]');
    if (bars) {
      const top = D.networks.slice().sort((a, b) => b.rooms - a.rooms).slice(0, 6);
      const max = top[0].rooms;
      bars.innerHTML = top.map((n, i) => `<div class="bx-bar">${logo(n, 'bx-logo--sm')}<div><b>${esc(n.name)}</b><i style="--w:${(n.rooms / max * 100).toFixed(1)}%;--dl:${i * 0.08}s"></i></div><em>${nf(n.rooms)}</em></div>`).join('');
    }
  }

  /* ── Карта и регионы без брендов ──────────────────────── */
  function gaps() {
    const list = $('[data-gap-list]'); if (!list) return;
    const brand = {}, cat = {};
    HOTELS.forEach((h) => { const r = D.cities[h.city].region; brand[r] = (brand[r] || 0) + 1; });
    CATALOG.forEach((h) => { if (h.regionKey) cat[h.regionKey] = (cat[h.regionKey] || 0) + 1; });
    const keys = Object.keys(REGIONS).filter((k) => cat[k] || !brand[k]);
    keys.sort((a, b) => ((brand[a] || 0) - (brand[b] || 0)) || ((cat[b] || 0) - (cat[a] || 0)));
    list.innerHTML = keys.map((k) => {
      const b = brand[k] || 0, c = cat[k] || 0;
      return `<div class="sr-li bx-gap"><div><b>${esc(REGIONS[k][0])}</b><span>${b ? b + ' ' + plural(b, ['брендовый отель', 'брендовых отеля', 'брендовых отелей']) : 'Брендовых отелей нет'}</span></div>
        <span class="bx-badge${b ? '' : ' bx-badge--zero'}" title="Брендовых отелей">${b}</span>
        ${c ? `<a class="bx-badge bx-badge--cat" href="portfolio.html?region=${encodeURIComponent(k)}" title="Объектов в каталоге">${c} в каталоге</a>` : '<span class="bx-badge" title="Объектов в каталоге">—</span>'}</div>`;
    }).join('');
  }

  function map() {
    const el = $('#brands-map'); if (!el || typeof L === 'undefined') return;
    try {
      const m = L.map(el, { center: [41.0, 65.2], zoom: 6, zoomControl: true, scrollWheelZoom: false, attributionControl: true, zoomSnap: 0.25 });
      m.zoomControl.setPosition('topright');
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap', maxZoom: 18 }).addTo(m);
      const by = {};
      HOTELS.forEach((h) => { const c = by[h.city] || (by[h.city] = { n: 0, r: 0, nets: {} }); c.n++; c.r += h.rooms; c.nets[h.net] = 1; });
      Object.keys(by).sort((a, b) => by[b].r - by[a].r).forEach((k) => {
        const c = D.cities[k], v = by[k];
        L.circleMarker([c.lat, c.lng], { radius: 6 + Math.sqrt(v.r) * 0.42, color: '#FFFDF9', weight: 2, fillColor: '#1D1A17', fillOpacity: 0.82 })
          .bindTooltip(`<b>${esc(c.name)}</b><br>${v.n} ${plural(v.n, HOT)} · ${nf(v.r)} номеров<br>${Object.keys(v.nets).map(esc).join(', ')}`, { className: 'bx-tip', direction: 'top', offset: [0, -6] })
          .addTo(m);
      });
      const cat = {};
      CATALOG.forEach((h) => { if (REGIONS[h.regionKey]) cat[h.regionKey] = (cat[h.regionKey] || 0) + 1; });
      Object.keys(cat).forEach((k) => {
        const r = REGIONS[k];
        const ll = k === 'tashkent' ? [41.36, 69.12] : k === 'samarkand' ? [39.56, 66.80] : k === 'bukhara' ? [39.66, 64.30] : k === 'khorezm' ? [41.50, 60.62] : k === 'tashkent-region' ? [41.40, 70.30] : k === 'fergana' ? [40.30, 71.55] : [r[1], r[2]];
        const icon = L.divIcon({ className: '', html: `<span class="bx-pin">${cat[k]}</span>`, iconSize: [26, 26], iconAnchor: [13, 13] });
        L.marker(ll, { icon, keyboard: false }).bindTooltip(`<b>${esc(r[0])}</b><br>${cat[k]} ${plural(cat[k], ['объект', 'объекта', 'объектов'])} в каталоге`, { className: 'bx-tip', direction: 'top', offset: [0, -12] }).on('click', () => { location.href = 'portfolio.html?region=' + encodeURIComponent(k); }).addTo(m);
      });
      const fit = () => m.fitBounds([[37.2, 56.0], [45.6, 73.2]], { padding: [10, 10] });
      fit(); setTimeout(() => { m.invalidateSize(); fit(); }, 400);
    } catch (e) { console.warn('Brands map:', e); }
  }

  /* ── Объекты для бренда (из каталога) ─────────────────── */
  const photo = (h) => { const p = (h.photos || []).map((x) => x && x.src).filter(Boolean); return p.find((s) => s.charAt(0) === '/' || s.indexOf('assets/') === 0) || p[0] || ''; };
  const deal = (h) => (window.getHotelDealConfig ? getHotelDealConfig(h).key : h.dealType);
  const building = (h) => { const n = String(h.notes || ''); return /незаверш[её]нное строительство/i.test(n) || /(\d{1,3})\s*%\s*заверш/i.test(n) || Number(h.yearCommissioned) >= 2026; };
  const city = (h) => { const m = String(h.address || '').match(/г\.\s*([^,]+)/); return m ? m[1].trim() : String(h.region || '').replace(' область', ' обл.'); };
  function pick(kind) {
    const box = $('[data-pick-list]'); if (!box) return;
    const f = { franchise: (h) => deal(h) === 'franchise', build: building, big: (h) => Number(h.roomsCount) >= 100 }[kind];
    const list = CATALOG.filter(f).sort((a, b) => (photo(b) ? 1 : 0) - (photo(a) ? 1 : 0) || (Number(b.roomsCount) || 0) - (Number(a.roomsCount) || 0));
    const n = $('[data-pick-n]'); if (n) n.textContent = list.length + ' ' + plural(list.length, ['объект', 'объекта', 'объектов']);
    box.innerHTML = list.slice(0, 5).map((h) => {
      const src = photo(h);
      return `<a class="sr-li" href="passport.html?hotel=${encodeURIComponent(h.slug || h.id)}">${src ? `<img class="sr-thumb" src="${esc(src)}" alt="" loading="lazy">` : '<span class="sr-mono"></span>'}<div><b>${esc(h.hotelName)}</b><span>${esc(city(h))}${h.stars ? ' · ' + h.stars + '★' : ''}</span></div><em>${h.roomsCount ? nf(h.roomsCount) + ' <small>ном.</small>' : ''}</em></a>`;
    }).join('') + (list.length > 5 ? `<a class="sr-link bx-pick__more" href="portfolio.html">Ещё ${list.length - 5} в каталоге</a>` : '') || '<p class="sr-note">Пока нет объектов.</p>';
  }

  /* ── Анимации: счёт, блик стекла ───────────────────────── */
  function countUp() {
    const els = $$('[data-count]'); if (!els.length) return;
    const run = (el) => {
      const to = +el.dataset.count; if (reduce) { el.textContent = nf(to); return; }
      const t0 = performance.now(), dur = 1400;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4); el.textContent = nf(Math.round(to * e)); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    const io = new IntersectionObserver((xs) => xs.forEach((x) => { if (x.isIntersecting) { run(x.target); io.unobserve(x.target); } }), { threshold: 0.4 });
    els.forEach((e) => { e.textContent = '0'; io.observe(e); });
  }
  function glassLight() {
    if (reduce || !window.matchMedia('(hover: hover)').matches) return;
    document.addEventListener('pointermove', (e) => {
      const g = e.target.closest && e.target.closest('.bx-glass'); if (!g) return;
      const r = g.getBoundingClientRect();
      g.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      g.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    }, { passive: true });
  }
  function reveal() { /* для элементов, добавленных скриптом после site.js */
    const els = $$('[data-reveal]:not(.is-in)');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
    const io = new IntersectionObserver((xs) => xs.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } }), { threshold: 0.15 });
    els.forEach((e) => io.observe(e));
  }

  async function loadCatalog() {
    let list = [];
    try { if (window.HotelStore) list = HotelStore.getAll() || []; } catch (e) {}
    if (!list.length) { try { list = await (await fetch('data/hotels.json')).json(); } catch (e) {} }
    return list.filter((h) => h.status !== 'draft');
  }

  async function init() {
    try { D = await (await fetch('data/brands.json', { cache: 'no-cache' })).json(); } catch (e) { console.warn('brands.json', e); return; }
    const SHORT = { 'Wyndham Hotels & Resorts': 'Wyndham', 'IHG Hotels & Resorts': 'IHG', 'Radisson Hotel Group': 'Radisson', 'Marriott International': 'Marriott', 'Lotte Hotels & Resorts': 'Lotte', 'Azimut Hotels': 'Azimut', 'Minyoun Hospitality Group': 'Minyoun', 'Sahid Hotels & Resorts': 'Sahid' };
    D.networks.forEach((n) => {
      n.short = SHORT[n.name] || n.name;
      n.hotels = 0; n.rooms = 0;
      n.brands.forEach((b) => b.hotels.forEach((h) => { h.net = n.short; n.hotels++; n.rooms += h.rooms; HOTELS.push(h); }));
    });
    summary(); plates(); marquee(); chips(); nets(); segments(); countUp(); glassLight();
    CATALOG = await loadCatalog();
    gaps(); map(); pick('franchise');
    document.addEventListener('change', (e) => { if (e.target.name === 'bxpick') pick(e.target.value); });
    reveal();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
