/* ============================================================
   PLATFORM.JS — страница «О платформе»
   Живые цифры (отели, рестораны, лоты, меры поддержки),
   поиск по восьми томам документации, появление и подменю.
   ============================================================ */
(function () {
  'use strict';

  document.documentElement.classList.add('js-reveal');
  const $ = (id) => document.getElementById(id);

  function plural(n, forms) {
    const f = forms.split('|');
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return f[2];
    if (b > 1 && b < 5) return f[1];
    if (b === 1) return f[0];
    return f[2];
  }
  function setStat(key, value) {
    document.querySelectorAll(`[data-stat="${key}"]`).forEach((el) => { el.textContent = value; });
    if (typeof value === 'number') {
      document.querySelectorAll(`[data-of="${key}"]`).forEach((el) => { el.textContent = plural(value, el.dataset.forms); });
    }
  }

  /* ── Данные ──────────────────────────────────────────────── */
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
    try {
      const SD = window.SupportData;
      if (!SD) return [];
      return SD.live(await SD.load());
    } catch (e) { return []; }
  }
  async function renderStats() {
    const [hotels, rest, land, support] = await Promise.all([
      loadHotels(), loadJSON('./data/restaurants.json'), loadJSON('./data/land-lots.json'), loadSupport()
    ]);
    const n = (x) => (Array.isArray(x) ? x.length : 0);
    if (n(rest)) setStat('restaurants', n(rest));
    if (n(land)) setStat('land', n(land));
    if (n(support)) setStat('support', n(support));
    const all = n(hotels) + n(rest) + n(land);
    if (all) setStat('all-objects', all);
  }

  /* ── Поиск по томам ──────────────────────────────────────── */
  function initSearch() {
    const q = $('docs-q'), vols = [...document.querySelectorAll('.vol')], empty = $('docs-empty');
    const tags = [...document.querySelectorAll('#docs-tags button')];
    if (!q) return;
    const norm = (s) => s.toLowerCase().replace(/ё/g, 'е').trim();
    vols.forEach((v) => { v._text = norm(v.dataset.k + ' ' + v.textContent); });

    function apply(value) {
      const words = norm(value).split(/\s+/).filter(Boolean);
      let shown = 0;
      vols.forEach((v) => {
        const ok = !words.length || words.every((w) => v._text.includes(w));
        v.hidden = !ok;
        if (ok) shown++;
      });
      empty.hidden = shown > 0;
      tags.forEach((t) => t.classList.toggle('is-on', norm(t.dataset.q) === norm(value)));
    }
    q.addEventListener('input', () => apply(q.value));
    tags.forEach((t) => t.addEventListener('click', () => { q.value = t.dataset.q; apply(q.value); }));
    apply('');
  }

  /* ── Появление и подменю ─────────────────────────────────── */
  function initReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el) => io.observe(el));
  }
  function initSubnav() {
    const links = [...document.querySelectorAll('.inv-subnav-links a')];
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.remove('is-current'));
      const a = map.get(e.target.id);
      if (a) a.classList.add('is-current');
    }), { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  function init() {
    initReveal();
    initSubnav();
    initSearch();
    renderStats();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
