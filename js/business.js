/* ============================================================
   BUSINESS.JS — страница «Для бизнеса»
   Данные: отели (HotelStore), рестораны (data/restaurants.json),
   господдержка (SupportData), инструменты партнёра (data/products.json).
   Макеты паспортов заполняются реальными объектами из реестра.
   ============================================================ */
(function () {
  'use strict';

  document.documentElement.classList.add('js-reveal');

  /* ── Утилиты ─────────────────────────────────────────────── */
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
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (id) => document.getElementById(id);

  function setStat(key, value) {
    document.querySelectorAll(`[data-stat="${key}"]`).forEach((el) => { el.textContent = value; });
    if (typeof value === 'number') {
      document.querySelectorAll(`[data-of="${key}"]`).forEach((el) => { el.textContent = plural(value, el.dataset.forms); });
    }
  }

  function photoOf(h) {
    const all = (h.photos || []).map((p) => (p && typeof p === 'object' ? p.src : p))
      .filter((src) => typeof src === 'string' && src && !src.startsWith('data:'));
    return all.find((src) => /^(\.?\/)?assets\//.test(src)) || null;
  }
  const cardSrc = (src) => (src && /\.webp$/.test(src) && !/-card\.webp$/.test(src)) ? src.replace(/\.webp$/, '-card.webp') : src;

  /* ── Загрузка ────────────────────────────────────────────── */
  async function loadHotels() {
    try {
      if (window.HotelStore && typeof window.HotelStore.getAllAsync === 'function') {
        const list = await window.HotelStore.getAllAsync();
        if (Array.isArray(list) && list.length) return list;
      }
    } catch (e) { /* запасной путь ниже */ }
    try { return await (await fetch('./data/hotels.json')).json(); } catch (e) { return []; }
  }
  const loadJSON = (url) => fetch(url).then((r) => r.json()).catch(() => []);
  async function loadSupport() {
    try { const SD = window.SupportData; return SD ? SD.live(await SD.load()) : []; } catch (e) { return []; }
  }

  /* ── Отели: герой, роль, паспорт, калькулятор ────────────── */
  const HERO_PICK = ['movenpick-tashkent', 'hastimom-samarkand', 'khiva-residence', 'bakh-mir-palace'];

  function renderHotels(hotels) {
    setStat('hotels', hotels.length);
    const withPhoto = hotels.filter((h) => photoOf(h) && h.economics);
    if (!withPhoto.length) return;
    const byId = new Map(withPhoto.map((h) => [h.id, h]));
    const hero = HERO_PICK.map((id) => byId.get(id)).find(Boolean) || withPhoto[0];

    /* макет паспорта в hero (если блок есть на странице) */
    if ($('hero-pass-name')) {
    const e = hero.economics || {};
    const st = parseInt(hero.stars, 10) || 0;
    const rooms = parseInt(hero.roomsCount, 10) || 0;
    $('hero-pass-photo').style.backgroundImage = `url("${cardSrc(photoOf(hero))}")`;
    $('hero-pass-name').textContent = hero.hotelName;
    $('hero-pass-meta').textContent = [st ? `${st}★` : '', rooms ? `${rooms} ${plural(rooms, 'номер|номера|номеров')}` : ''].filter(Boolean).join(' · ');
    $('hero-pass-kpi').innerHTML = [
      ['ADR', e.adr ? '$' + Math.round(e.adr) : '—'],
      ['Загрузка', e.occupancy ? Math.round(e.occupancy) + '%' : '—'],
      ['RevPAR', e.revpar ? '$' + Math.round(e.revpar) : '—'],
      ['EBITDA', e.ebitdaMargin ? Math.round(e.ebitdaMargin) + '%' : '—']
    ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    $('hero-pass-period').textContent = e.period ? `Данные ${e.period}` : 'Данные объекта';
    if (e.verificationStatus !== 'committee') $('hero-pass-ver').querySelector('b').textContent = 'На проверке';
    else $('hero-pass-ver').querySelector('b').textContent = 'Проверено комитетом';
    }

    /* фото в карточке «Отель» — другой объект */
    const roleImg = $('role-hotel-img');
    const roleHotel = withPhoto.find((h) => h !== hero && /khiva|farovon|somoniy/.test(h.id)) || withPhoto[1] || hero;
    if (roleImg) roleImg.src = photoOf(roleHotel);

    /* паспорт отеля: объект с полной экономикой */
    if ($('pass-hotel')) {
    const ph = withPhoto.find((h) => h.economics.askingPrice && h.economics.irr && h !== hero) || hero;
    const pe = ph.economics;
    const pst = parseInt(ph.stars, 10) || 0;
    const prooms = parseInt(ph.roomsCount, 10) || 0;
    $('pass-hotel').href = `passport.html?hotel=${encodeURIComponent(ph.slug || ph.id)}`;
    $('ph-img').src = cardSrc(photoOf(ph));
    $('ph-name').textContent = ph.hotelName;
    $('ph-meta').textContent = [pst ? `${pst}★` : '', ph.region, prooms ? `${prooms} ${plural(prooms, 'номер|номера|номеров')}` : ''].filter(Boolean).join(' · ');
    $('ph-kpi').innerHTML = [
      ['ADR', pe.adr ? '$' + Math.round(pe.adr) : '—'],
      ['Загрузка', pe.occupancy ? Math.round(pe.occupancy) + '%' : '—'],
      ['RevPAR', pe.revpar ? '$' + Math.round(pe.revpar) : '—'],
      ['GOP', pe.gopMargin ? Math.round(pe.gopMargin) + '%' : '—'],
      ['IRR', pe.irr ? String(pe.irr).replace('.', ',') + '%' : '—'],
      ['Окупаемость', pe.payback ? String(pe.payback).replace('.', ',') + ' г.' : '—']
    ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    $('ph-price').textContent = money(pe.askingPrice || pe.valuation) || 'по запросу';
    }

    /* средние по реестру — для калькулятора */
    const ec = hotels.map((h) => h.economics).filter((x) => x && x.adr && x.occupancy);
    if (ec.length) {
      const avg = (k) => ec.reduce((s, x) => s + Number(x[k] || 0), 0) / ec.length;
      initCalc({ adr: avg('adr'), occ: avg('occupancy'), revpar: avg('revpar') });
    } else initCalc(null);

    /* финальное фото — тоже реальный объект */
    const fin = $('biz-final-img');
    if (fin && hero) fin.src = photoOf(hero);
  }

  /* ── Калькулятор RevPAR ──────────────────────────────────── */
  function initCalc(reg) {
    const rooms = $('calc-rooms'), adr = $('calc-adr'), occ = $('calc-occ');
    if (!rooms) return;
    if (reg) {
      adr.value = Math.round(reg.adr / 5) * 5;
      occ.value = Math.round(reg.occ);
    }
    const run = () => {
      const r = +rooms.value, a = +adr.value, o = +occ.value;
      $('calc-rooms-out').textContent = r;
      $('calc-adr-out').textContent = a;
      $('calc-occ-out').textContent = o;
      const revpar = a * o / 100;
      $('calc-revpar').textContent = '$' + revpar.toFixed(revpar < 100 ? 1 : 0).replace('.', ',').replace(/,0$/, '');
      $('calc-rev').textContent = money(revpar * r * 365) || '$0';
      if (reg && reg.revpar) {
        const d = Math.round((revpar / reg.revpar - 1) * 100);
        $('calc-cmp').textContent = `в среднем по реестру $${Math.round(reg.revpar)}` + (Math.abs(d) >= 1 ? ` · у вас ${d > 0 ? '+' : ''}${d}%` : '');
      } else $('calc-cmp').textContent = 'цена × загрузка';
    };
    [rooms, adr, occ].forEach((el) => el.addEventListener('input', run));
    run();
  }

  /* ── Рестораны ───────────────────────────────────────────── */
  function renderRestaurants(list) {
    setStat('restaurants', list.length);
    const r = list.find((x) => x.rating === 'A+') || list[0];
    if (!r || !$('pass-rest')) return;
    $('pass-rest').href = `restaurant-passport.html?id=${encodeURIComponent(r.id)}`;
    $('pr-rating').textContent = r.rating || '—';
    $('pr-name').textContent = r.name;
    $('pr-meta').textContent = [r.region, r.cuisine_label].filter(Boolean).join(' · ');
    $('pr-kpi').innerHTML = [
      ['Посадок', r.seats || '—'],
      ['Средний чек', r.avg_check_usd ? '$' + r.avg_check_usd : '—'],
      ['EBITDA', r.ebitda_margin_pct ? r.ebitda_margin_pct + '%' : '—'],
      ['IRR', r.irr_pct ? r.irr_pct + '%' : '—'],
      ['Окупаемость', r.payback_years ? String(r.payback_years).replace('.', ',') + ' г.' : '—'],
      ['Оборот стола', r.table_turns_day ? r.table_turns_day + '/день' : '—']
    ].map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
    $('pr-price').textContent = money(r.investment_usd) || 'по запросу';
  }

  /* ── Господдержка и партнёр ─────────────────────────────── */
  const KIND = { subsidy: 'субсидия|субсидии|субсидий', compensation: 'компенсация|компенсации|компенсаций', grant: 'грант|гранта|грантов', tax: 'налоговая льгота|налоговые льготы|налоговых льгот' };
  function renderSupport(live) {
    if (!live.length) return;
    setStat('support', live.length);
    const c = {};
    live.forEach((p) => { c[p.category] = (c[p.category] || 0) + 1; });
    const ul = $('support-kinds');
    if (ul) ul.innerHTML = Object.keys(KIND).filter((k) => c[k]).sort((a, b) => c[b] - c[a])
      .map((k) => `<li><b>${c[k]}</b>${plural(c[k], KIND[k])}</li>`).join('');
  }
  function renderPartner(products) {
    const ul = $('partner-list');
    if (!ul || !Array.isArray(products) || !products.length) return;
    ul.innerHTML = products.slice(0, 4).map((p) => `<li>${esc(p.name)}</li>`).join('') +
      (products.length > 4 ? `<li>+${products.length - 4}</li>` : '');
  }

  /* ── Появление и локальная навигация ─────────────────────── */
  function initReveal() {
    const items = document.querySelectorAll('[data-reveal], .path');
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

  async function init() {
    initReveal();
    initSubnav();
    const [hotels, rests, support, products] = await Promise.all([
      loadHotels(), loadJSON('./data/restaurants.json'), loadSupport(), loadJSON('./data/products.json')
    ]);
    renderHotels(Array.isArray(hotels) ? hotels : []);
    renderRestaurants(Array.isArray(rests) ? rests : []);
    renderSupport(support);
    renderPartner(products);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
