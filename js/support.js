/* ============================================================
   SUPPORT.JS — страница «Господдержка»: карточки, фильтры,
   калькулятор (по реальным формулам), таблица НПА.
   Все цифры берутся из data/support-programs.json через
   SupportData (js/support-core.js). Здесь цифр программ нет.
   ============================================================ */
(function () {
  'use strict';
  const SD = window.SupportData;

  /* ── Расчёт ──────────────────────────────────────────── */
  const byId = (all, id) => all.find((p) => p.id === id);

  function calcHotel(all, inp) {
    const d = SD.D();
    const res = [], na = [];
    const stars = +inp.stars;
    const rooms = +inp.rooms || 0, floors = +inp.floors || 0;
    const usable = (id) => { const p = byId(all, id); return p && p.published && SD.status(p) !== 'expired' ? p : null; };

    function add(p, formula, amount, currency, extra) {
      res.push(Object.assign({ id: p.id, name: SD.tx(p.title), formula, amount, currency, period: SD.periodText(p), basis: SD.legalText(p),
        warn: SD.status(p) === 'soon' ? `${d.r_warn} ${SD.fmtDate(p.valid_to)}` : '' }, extra || {}));
    }
    function no(p, reason) { na.push({ id: p.id, name: SD.tx(p.title), reason }); }
    const money = (n) => SD.fmtUZS(n);

    // A9 — новое строительство
    const a9 = usable('A9');
    const a9rate = (st) => { const n = a9.amount_numeric; return st === 3 ? n.rate_3 : n.rate_45; };
    if (a9 && inp.project === 'new') {
      const n = a9.amount_numeric;
      if (stars < 3) no(a9, d.na_stars_345);
      else {
        const minRooms = stars === 3 ? n.min_rooms_3 : n.min_rooms_45;
        if (rooms < minRooms) no(a9, d.na_rooms.replace('{n}', minRooms));
        else if (floors < n.min_floors) no(a9, d.na_floors);
        else {
          const up = inp.uplift ? n.uplift : 1;
          add(a9, `${SD.grp(rooms)} × ${money(a9rate(stars))}${up !== 1 ? ` × ${String(up).replace('.', ',')}` : ''}`, rooms * a9rate(stars) * up, 'UZS');
        }
      }
    }
    // A6 — Сурхандарья
    const a6 = usable('A6');
    if (a6 && inp.project === 'new') {
      if (inp.region !== 'surkhandarya') no(a6, d.na_region_s);
      else if (!inp.arrears) no(a6, d.na_arrears);
      else if (rooms < 1) no(a6, d.na_rooms.replace('{n}', 1));
      else if (stars <= 2) { const r = a6.amount_numeric.rates[stars]; add(a6, `${SD.grp(rooms)} × ${money(r)}`, rooms * r, 'UZS'); }
      else if (a9) { const r = a9rate(stars === 3 ? 3 : 45); add(a6, `${SD.grp(rooms)} × ${money(r)} (${d.r_a9note})`, rooms * r, 'UZS'); }
    }
    // A12 — Хорезм
    const a12 = usable('A12');
    if (a12 && inp.project === 'commissioned') {
      if (inp.region !== 'khorezm') no(a12, d.na_region_x);
      else if (stars > 2) no(a12, d.na_stars_012);
      else if (rooms < 1) no(a12, d.na_rooms.replace('{n}', 1));
      else { const r = a12.amount_numeric.rates[stars]; add(a12, `${SD.grp(rooms)} × ${money(r)}`, rooms * r, 'UZS'); }
    }
    // A14 — районы без гостиниц
    const a14 = usable('A14');
    if (a14 && inp.project === 'commissioned') {
      if (inp.region !== 'no_hotel_districts') no(a14, d.na_region_d);
      else {
        const tiers = a14.amount_numeric.tiers;
        if (rooms < tiers[0][0]) no(a14, d.na_rooms_min10);
        else { let r = tiers[0][1]; tiers.forEach(([min, rate]) => { if (rooms >= min) r = rate; }); add(a14, `${SD.grp(rooms)} × ${money(r)}`, rooms * r, 'UZS'); }
      }
    }
    // A7 — Каракалпакстан, перевод в 3★
    const a7 = usable('A7');
    if (a7 && inp.project === 'upgrade') {
      if (inp.region !== 'karakalpakstan') no(a7, d.na_region_k);
      else if (stars !== 3) no(a7, d.na_stars_3);
      else if (rooms < 1) no(a7, d.na_rooms.replace('{n}', 1));
      else add(a7, `${SD.grp(rooms)} × ${money(a7.amount_numeric.rate)}`, rooms * a7.amount_numeric.rate, 'UZS');
    }
    // A11 — модульные
    const a11 = usable('A11');
    if (a11 && inp.project === 'modular') {
      const n = a11.amount_numeric, places = +inp.places || 0, modules = +inp.modules || 0;
      if (modules < n.min_modules) no(a11, d.na_modules);
      else if (places < 1) no(a11, d.na_places);
      else { const r = n.rates[inp.modcat]; add(a11, `${SD.grp(places)} × ${money(r)}`, places * r, 'UZS'); }
    }
    // A10 — франшиза
    const a10 = usable('A10');
    if (a10 && (inp.project === 'franchise' || inp.brand)) {
      const n = a10.amount_numeric;
      if (!inp.brand) no(a10, d.na_brand);
      else if (stars < 3) no(a10, d.na_stars_345);
      else if (rooms < 1) no(a10, d.na_rooms.replace('{n}', 1));
      else {
        const r = n.rates[stars];
        add(a10, `${SD.grp(rooms)} × ${SD.fmtUSD(r)} × ${n.years} ${d.years}`, rooms * r * n.years, 'USD', { limitUSD: n.limit });
      }
    }
    return { res, na };
  }

  function calcOperator(all, inp) {
    const d = SD.D();
    const res = [], na = [];
    const usable = (id) => { const p = byId(all, id); return p && p.published && SD.status(p) !== 'expired' ? p : null; };
    const base = (p) => ({ id: p.id, name: SD.tx(p.title), period: SD.periodText(p), basis: SD.legalText(p), warn: SD.status(p) === 'soon' ? `${d.r_warn} ${SD.fmtDate(p.valid_to)}` : '' });
    const a1 = usable('A1'), a2 = usable('A2');
    const low = +inp.low || 0, ch = +inp.charter || 0, nights = +inp.nights || 0;
    if (a1) {
      const n = a1.amount_numeric;
      if (low < 1) na.push({ id: a1.id, name: SD.tx(a1.title), reason: d.na_count });
      else res.push(Object.assign(base(a1), { formula: `${SD.grp(low)} × ${SD.fmtUSD(n.min)} – ${SD.fmtUSD(n.max)}`, amount: low * n.min, amountMax: low * n.max, currency: 'USD' }));
    }
    if (a2) {
      const n = a2.amount_numeric;
      let reason = '';
      if (ch < 1) reason = d.na_count;
      else if (!inp.isCharter) reason = d.na_charter;
      else if (!n.cities.includes(inp.city)) reason = d.na_city;
      else if (nights < n.min_nights) reason = d.na_nights;
      if (reason) na.push({ id: a2.id, name: SD.tx(a2.title), reason });
      else { const r = inp.season === 'winter' ? n.winter_rate : n.rate; res.push(Object.assign(base(a2), { formula: `${SD.grp(ch)} × ${SD.fmtUSD(r)}`, amount: ch * r, currency: 'USD' })); }
    }
    return { res, na };
  }
  window.SupportCalc = { calcHotel, calcOperator };

  /* ── Интерфейс калькулятора ──────────────────────────── */
  const st = { mode: 'hotel', project: 'new', region: 'all', stars: 3, rooms: 100, places: 50, floors: 6, modules: 10, modcat: 'I',
    brand: false, arrears: false, uplift: false, low: 0, charter: 0, nights: 5, city: 'samarkand', season: 'regular', isCharter: true };
  let ALL = [];

  const sel = (id, label, opts, val) => `<label class="calc-field"><span>${SD.esc(label)}</span><select id="${id}">${opts.map(([v, t]) => `<option value="${v}" ${String(v) === String(val) ? 'selected' : ''}>${SD.esc(t)}</option>`).join('')}</select></label>`;
  const num = (id, label, val, min) => `<label class="calc-field"><span>${SD.esc(label)}</span><input type="number" id="${id}" min="${min || 0}" inputmode="numeric" value="${val}"></label>`;
  const chk = (id, label, val) => `<label class="calc-check"><input type="checkbox" id="${id}" ${val ? 'checked' : ''}><span>${SD.esc(label)}</span></label>`;

  function formHTML() {
    const d = SD.D();
    const tabs = `<div class="calc-choices calc-mode"><button type="button" class="calc-choice ${st.mode === 'hotel' ? 'is-selected' : ''}" data-mode="hotel">${d.mode_hotel}</button><button type="button" class="calc-choice ${st.mode === 'operator' ? 'is-selected' : ''}" data-mode="operator">${d.mode_operator}</button></div>`;
    let f = '';
    if (st.mode === 'hotel') {
      const projects = ['new', 'upgrade', 'commissioned', 'modular', 'franchise'].map((k) => [k, d['p_' + k]]);
      const regions = ['all', 'khorezm', 'surkhandarya', 'karakalpakstan', 'no_hotel_districts'].map((k) => [k, d.reg[k]]);
      const starsOpts = [[0, d.stars0]].concat([1, 2, 3, 4, 5].map((n) => [n, n + d.star]));
      f = sel('c-project', d.c_project, projects, st.project) + sel('c-region', d.c_region, regions, st.region);
      if (st.project === 'modular') {
        f += num('c-places', d.c_places, st.places, 0) + num('c-modules', d.c_modules, st.modules, 0) + sel('c-modcat', d.c_modcat, [['I', 'I'], ['II', 'II'], ['III', 'III']], st.modcat);
      } else {
        f += sel('c-stars', d.c_stars, starsOpts, st.stars) + num('c-rooms', d.c_rooms, st.rooms, 0);
        if (st.project === 'new') f += num('c-floors', d.c_floors, st.floors, 0);
      }
      f += '<div class="calc-checks">' +
        (st.project === 'new' ? chk('c-uplift', d.c_uplift, st.uplift) + chk('c-arrears', d.c_arrears, st.arrears) : '') +
        (st.project !== 'modular' ? chk('c-brand', d.c_brand, st.brand) : '') + '</div>';
    } else {
      const cities = ['samarkand', 'bukhara', 'urgench', 'other'].map((k) => [k, d['city_' + k]]);
      f = num('c-low', d.o_low, st.low, 0) + num('c-charter', d.o_charter, st.charter, 0) + num('c-nights', d.o_nights, st.nights, 0) +
        sel('c-city', d.o_city, cities, st.city) + sel('c-season', d.o_season, [['regular', d.o_regular], ['winter', d.o_winter]], st.season) +
        '<div class="calc-checks">' + chk('c-ischarter', d.c_charter_flag, st.isCharter) + '</div>';
    }
    return `${tabs}<div class="calc-form">${f}</div><div id="calc-out"></div><p class="calc-foot">${SD.esc(d.r_foot)}</p>`;
  }

  function resultsHTML() {
    const d = SD.D();
    const { res, na } = st.mode === 'hotel' ? calcHotel(ALL, st) : calcOperator(ALL, st);
    let uzs = 0, usd = 0, usdMax = 0;
    res.forEach((r) => { if (r.currency === 'UZS') uzs += r.amount; else { usd += r.amount; usdMax += (r.amountMax != null ? r.amountMax : r.amount); } });
    const amt = (r) => r.currency === 'UZS' ? SD.fmtUZS(r.amount) : (r.amountMax != null ? `${SD.fmtUSD(r.amount)} – ${SD.fmtUSD(r.amountMax)}` : SD.fmtUSD(r.amount));
    const items = res.map((r) => `<div class="calc-result-item calc-result-item--block">
        <div class="calc-result-item__main"><span class="calc-result-item__name">${SD.esc(r.name)}</span><span class="calc-result-item__val">${amt(r)}</span></div>
        <div class="calc-result-item__meta">${SD.esc(d.r_formula)}: ${SD.esc(r.formula)}</div>
        <div class="calc-result-item__meta">⏱ ${SD.esc(r.period)}${r.basis ? ` · ${SD.esc(r.basis)}` : ''}</div>
        ${r.limitUSD ? `<div class="calc-result-item__meta">≤ ${SD.fmtUSD(r.limitUSD)} (A10)</div>` : ''}
        ${r.warn ? `<div class="calc-result-item__warn">⚠ ${SD.esc(r.warn)}</div>` : ''}</div>`).join('');
    const naItems = na.map((r) => `<li><strong>${SD.esc(r.name)}</strong> — ${SD.esc(r.reason)}</li>`).join('');
    const totals = res.length ? `<div class="calc-total"><div><div class="calc-total__label">${SD.esc(d.r_total)}</div></div><div>
        ${uzs ? `<div class="calc-total__val">${SD.fmtUZS(uzs)}</div>` : ''}
        ${usd ? `<div class="calc-total__val">${usdMax !== usd ? `${SD.fmtUSD(usd)} – ${SD.fmtUSD(usdMax)}` : SD.fmtUSD(usd)}</div>` : ''}
      </div></div><p class="calc-combo">${SD.esc(d.r_combo)}</p>` : '';
    return `<div class="calc-results">
      <h4 class="calc-sub">${SD.esc(d.r_applicable)}</h4>
      ${items || `<p class="calc-empty">${SD.esc(d.r_none)}</p>`}${totals}
      ${na.length ? `<h4 class="calc-sub">${SD.esc(d.r_na)}</h4><ul class="calc-na">${naItems}</ul>` : ''}</div>`;
  }

  function readInputs() {
    const g = (id) => document.getElementById(id);
    const v = (id, key, num) => { const el = g(id); if (el) st[key] = el.type === 'checkbox' ? el.checked : (num ? +el.value : el.value); };
    v('c-project', 'project'); v('c-region', 'region'); v('c-stars', 'stars', true); v('c-rooms', 'rooms', true); v('c-floors', 'floors', true);
    v('c-places', 'places', true); v('c-modules', 'modules', true); v('c-modcat', 'modcat');
    v('c-uplift', 'uplift'); v('c-arrears', 'arrears'); v('c-brand', 'brand');
    v('c-low', 'low', true); v('c-charter', 'charter', true); v('c-nights', 'nights', true); v('c-city', 'city'); v('c-season', 'season'); v('c-ischarter', 'isCharter');
  }

  function renderCalc() {
    const root = document.getElementById('calc-wizard');
    if (!root) return;
    root.innerHTML = formHTML();
    document.getElementById('calc-out').innerHTML = resultsHTML();
  }
  function bindCalc() {
    const root = document.getElementById('calc-wizard');
    if (!root) return;
    root.addEventListener('click', (e) => { const b = e.target.closest('[data-mode]'); if (b) { st.mode = b.dataset.mode; renderCalc(); } });
    root.addEventListener('change', (e) => {
      readInputs();
      if (e.target.id === 'c-project') renderCalc(); else document.getElementById('calc-out').innerHTML = resultsHTML();
    });
    root.addEventListener('input', (e) => { if (e.target.type === 'number') { readInputs(); document.getElementById('calc-out').innerHTML = resultsHTML(); } });
  }

  /* ── Страница ────────────────────────────────────────── */
  function renderNpa() { const el = document.getElementById('npa-wrap'); if (el) el.innerHTML = SD.npaHTML(ALL); }

  SD.load().then((all) => {
    ALL = all;
    const filters = document.getElementById('sp-filters'), grid = document.getElementById('programs-grid');
    let browser = null;
    if (filters && grid) browser = SD.initBrowser(all, { filtersEl: filters, outEl: grid, render: 'cards' });
    renderCalc(); bindCalc(); renderNpa();
    SD.onLangChange(() => { if (browser) browser.redraw(); renderCalc(); renderNpa(); });
  });
})();
