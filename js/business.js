/* ============================================================
   BUSINESS.JS — страница «Для бизнеса»
   Данные: отели (HotelStore), рестораны (data/restaurants.json),
   господдержка (SupportData), инструменты партнёра (data/products.json).
   Макеты паспортов заполняются реальными объектами из реестра.
   ============================================================ */
(function () {
  'use strict';

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
  const $ = (id) => document.getElementById(id);

  function setStat(key, value) {
    document.querySelectorAll(`[data-stat="${key}"]`).forEach((el) => { el.textContent = value; });
    if (typeof value === 'number') {
      document.querySelectorAll(`[data-of="${key}"]`).forEach((el) => { el.textContent = plural(value, el.dataset.forms); });
    }
  }

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

  /* ── Калькулятор выручки номеров ─────────────────────────── */
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
      $('calc-cmp').textContent = reg && reg.revpar ? `в среднем по реестру $${Math.round(reg.revpar)}` : 'цена × загрузка';
    };
    [rooms, adr, occ].forEach((el) => el.addEventListener('input', run));
    run();
  }

  async function init() {
    const [hotels, rests, support] = await Promise.all([loadHotels(), loadJSON('./data/restaurants.json'), loadSupport()]);
    const H = Array.isArray(hotels) ? hotels : [];
    if (H.length) setStat('hotels', H.length);
    if (Array.isArray(rests) && rests.length) setStat('restaurants', rests.length);
    if (support.length) setStat('support', support.length);
    const ec = H.map((h) => h.economics).filter((x) => x && x.adr && x.occupancy);
    if (ec.length) {
      const avg = (k) => ec.reduce((s, x) => s + Number(x[k] || 0), 0) / ec.length;
      initCalc({ adr: avg('adr'), occ: avg('occupancy'), revpar: avg('revpar') });
    } else initCalc(null);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
