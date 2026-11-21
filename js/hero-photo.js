/* ============================================================
   HERO-PHOTO.JS — цифры на главном экране из каталога:
   сколько отелей, сколько регионов, минимальная цена продажи.
   ============================================================ */
(function () {
  'use strict';

  const hero = document.querySelector('.photo-hero');
  if (!hero) return;

  const plural = (n, forms) => {
    const f = forms.split('|'); const a = Math.abs(n) % 100, b = a % 10;
    return a > 10 && a < 20 ? f[2] : b > 1 && b < 5 ? f[1] : b === 1 ? f[0] : f[2];
  };
  const money = (n) => (n >= 1e6
    ? '$' + (n / 1e6).toFixed(1).replace('.', ',').replace(/,0$/, '') + ' млн'
    : '$' + Math.round(n / 1e3) + ' тыс.');
  const set = (k, v) => { const el = hero.querySelector(`[data-ph="${k}"]`); if (el && v) el.textContent = v; };

  async function load() {
    let list = [];
    try {
      if (window.HotelStore && typeof window.HotelStore.getAll === 'function') list = window.HotelStore.getAll() || [];
      if (!list.length) list = await (await fetch('./data/hotels.json')).json();
    } catch (e) { return; }
    if (!list.length) return;

    set('count', String(list.length));
    set('count-word', plural(list.length, 'отель|отеля|отелей'));

    const regions = new Set(list.map((h) => String(h.region || '').replace(/\s*(обл\.?|область|г\.)\s*/gi, '').trim()).filter(Boolean));
    if (regions.size) {
      set('regions', String(regions.size));
      const w = hero.querySelector('[data-ph="regions"] + span');
      if (w) w.textContent = plural(regions.size, 'регион|региона|регионов');
    }

    const prices = list
      .filter((h) => String(h.dealType || '').toLowerCase() === 'sale')
      .map((h) => Number(h.economics && h.economics.askingPrice) || 0)
      .filter(Boolean);
    if (prices.length) set('min', 'от ' + money(Math.min(...prices)));
  }

  load();
})();
