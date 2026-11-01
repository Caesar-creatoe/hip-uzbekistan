/* ============================================================
   SERVICES.JS — страница «Услуги»
   Кольцо KQI строится по реальной структуре системы (8 блоков и их
   веса, как на quality.html); рейтинг и средние — из данных отелей.
   ============================================================ */
(function () {
  'use strict';

  document.documentElement.classList.add('js-reveal');
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v, d) => String(Number(v).toFixed(d)).replace('.', ',');
  function setStat(key, value) { document.querySelectorAll(`[data-stat="${key}"]`).forEach((el) => { el.textContent = value; }); }

  /* ── KQI: 8 блоков и веса (quality.html) ─────────────────── */
  const KQI = [
    ['Инфраструктура', 20, '#A9722A'],
    ['Сервис', 20, '#C8913F'],
    ['Безопасность', 15, '#3E6034'],
    ['Финансы', 15, '#36506F'],
    ['Цифровизация', 10, '#6F8DAE'],
    ['Экология', 10, '#7A9C69'],
    ['Доступность', 5, '#D07A5D'],
    ['Документооборот', 5, '#94442D']
  ];
  function renderKqi() {
    const svg = $('kqi-ring'), legend = $('kqi-legend');
    if (!svg) return;
    const r = 80, C = 2 * Math.PI * r, gap = 3;
    let acc = 0;
    svg.innerHTML = KQI.map(([, w, c]) => {
      const len = C * w / 100 - gap;
      const out = `<circle cx="100" cy="100" r="${r}" stroke="${c}" stroke-dasharray="${len.toFixed(1)} ${(C - len).toFixed(1)}" stroke-dashoffset="${(-acc).toFixed(1)}"/>`;
      acc += C * w / 100;
      return out;
    }).join('');
    if (legend) legend.innerHTML = KQI.map(([n, w, c]) => `<li><i style="background:${c}"></i><span>${n}</span><b>${w}%</b></li>`).join('');
  }

  /* ── Рейтинг: средние и лучшие по окупаемости ────────────── */
  function photoOf(h) {
    const all = (h.photos || []).map((p) => (p && typeof p === 'object' ? p.src : p))
      .filter((src) => typeof src === 'string' && src && !src.startsWith('data:'));
    const local = all.find((src) => /^(\.?\/)?assets\//.test(src));
    return local ? local.replace(/\.webp$/, '-card.webp') : null;
  }
  async function loadHotels() {
    try {
      if (window.HotelStore && typeof window.HotelStore.getAllAsync === 'function') {
        const list = await window.HotelStore.getAllAsync();
        if (Array.isArray(list) && list.length) return list;
      }
    } catch (e) { /* запасной путь ниже */ }
    try { return await (await fetch('./data/hotels.json')).json(); } catch (e) { return []; }
  }
  function renderRating(hotels) {
    const rows = hotels.filter((h) => h.economics && Number(h.economics.payback) > 0);
    if (!rows.length) return;
    const avg = (k) => rows.reduce((s, h) => s + Number(h.economics[k] || 0), 0) / rows.length;
    setStat('avg-occ', num(avg('occupancy'), 1) + '%');
    setStat('avg-adr', '$' + Math.round(avg('adr')));
    setStat('avg-payback', num(avg('payback'), 1) + ' лет');

    const top = rows.slice().sort((a, b) => a.economics.payback - b.economics.payback).slice(0, 4);
    $('board-sort').textContent = `лучшие 4 из ${rows.length}`;
    $('board-list').innerHTML = top.map((h, i) => {
      const pb = Number(h.economics.payback);
      const st = parseInt(h.stars, 10) || 0;
      const meta = [st ? `${st}★` : '', h.region, h.economics.roi ? `ROI ${num(h.economics.roi, 1)}%` : ''].filter(Boolean).join(' · ');
      const img = photoOf(h);
      return `<li><span class="bn">${i + 1}</span>${img ? `<img src="${esc(img)}" alt="" loading="lazy" />` : '<img alt="" />'}
        <span class="bt"><b>${esc(h.hotelName)}</b><span class="bm">${esc(meta)}</span></span>
        <span class="bv">${num(pb, 1)} г.</span></li>`;
    }).join('');
    $('board-avg').innerHTML = `<span>Средняя окупаемость по реестру</span><b>${num(avg('payback'), 1)} лет</b>`;
  }

  /* ── Появление и навигация ───────────────────────────────── */
  function initReveal() {
    const items = document.querySelectorAll('[data-reveal]');
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
    renderKqi();
    renderRating(await loadHotels());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
