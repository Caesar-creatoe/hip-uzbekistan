/* ============================================================
   HERO-CITY.JS — главный экран.
   1) Отели на картинке по очереди «загораются».
   2) Над ними появляются ценники из реальных объектов каталога
      (сделка «Продажа»), один ценник по очереди раскрывается.
   Картинка — иллюстрация; к конкретным зданиям объекты не привязаны.
   ============================================================ */
(function () {
  'use strict';

  const hero = document.querySelector('.city-hero');
  if (!hero) return;

  const ORDER = ['b', 'a', 'c', 'd', 'e'];             // порядок «включения» зданий
  const PINS = ['b', 'a', 'c'];                         // над какими зданиями ценники
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (sel) => [...hero.querySelectorAll(sel)];
  const by = (sel, k) => hero.querySelector(`${sel}[data-k="${k}"]`);

  const money = (n) => {
    if (!n) return '';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1).replace('.', ',').replace(/,0$/, '') + ' млн';
    return '$' + Math.round(n / 1e3) + ' тыс.';
  };
  const plural = (n, forms) => {
    const f = forms.split('|'); const a = Math.abs(n) % 100, b = a % 10;
    return a > 10 && a < 20 ? f[2] : b > 1 && b < 5 ? f[1] : b === 1 ? f[0] : f[2];
  };
  const DEAL = { sale: 'Продажа', rent: 'Аренда', franchise: 'Франшиза', invest: 'Соинвестирование' };

  /* запасной набор — если данные не загрузились */
  const FALLBACK = [
    { price: 49.6e6, stars: 5, rooms: 279, deal: 'sale' },
    { price: 28.6e6, stars: 5, rooms: 200, deal: 'sale' },
    { price: 29.6e6, stars: 5, rooms: 172, deal: 'sale' },
    { price: 18.6e6, stars: 4, rooms: 180, deal: 'sale' },
    { price: 8.4e6, stars: 4, rooms: 94, deal: 'sale' }
  ];

  async function loadObjects() {
    let list = [];
    try {
      if (window.HotelStore && typeof window.HotelStore.getAll === 'function') list = window.HotelStore.getAll() || [];
      if (!list.length) list = await (await fetch('./data/hotels.json')).json();
    } catch (e) { list = []; }
    const count = list.length;
    const items = list
      .map((h) => ({
        price: Number(h.economics && (h.economics.askingPrice || h.economics.valuation)) || 0,
        stars: parseInt(h.stars, 10) || 0,
        rooms: parseInt(h.roomsCount, 10) || 0,
        deal: String(h.dealType || '').toLowerCase()
      }))
      .filter((x) => x.price > 0 && x.deal === 'sale')
      .sort((a, b) => b.price - a.price)
      .slice(0, PINS.length);
    return { count, items: items.length === PINS.length ? items : FALLBACK };
  }

  function fillPins(items) {
    PINS.forEach((k, i) => {
      const pin = by('.ch-pin', k), it = items[i];
      if (!pin || !it) return;
      pin.querySelector('.ch-pin-price').textContent = money(it.price);
      pin.querySelector('.ch-pin-meta').textContent =
        [DEAL[it.deal] || '', it.stars ? it.stars + '★' : '', it.rooms ? `${it.rooms} ${plural(it.rooms, 'номер|номера|номеров')}` : '']
          .filter(Boolean).join(' · ');
    });
  }

  function setCount(n) {
    if (!n) return;
    const c = hero.querySelector('[data-ch="count"]'), w = hero.querySelector('[data-ch="count-word"]');
    if (c) c.textContent = n;
    if (w) w.textContent = plural(n, 'отель|отеля|отелей');
  }

  /* 1 → свет в зданиях, 2 → ценники, 3 → по очереди раскрываем один */
  function play() {
    const step = reduce ? 0 : 650;
    ORDER.forEach((k, i) => {
      setTimeout(() => {
        const lit = by('.ch-lit', k), glow = by('.ch-glow', k);
        if (lit) lit.classList.add('is-on');
        if (glow) glow.classList.add('is-on');
      }, 600 + i * step);
    });
    PINS.forEach((k, i) => {
      setTimeout(() => {
        const pin = by('.ch-pin', k);
        if (pin) pin.classList.add('is-on');
      }, 900 + ORDER.length * step + i * (reduce ? 0 : 220));
    });

    let cur = 0;
    const activate = () => {
      $$('.ch-pin.is-active, .ch-glow.is-active').forEach((el) => el.classList.remove('is-active'));
      const k = PINS[cur % PINS.length];
      const pin = by('.ch-pin', k), glow = by('.ch-glow', k);
      if (pin) pin.classList.add('is-active');
      if (glow && !reduce) glow.classList.add('is-active');
      cur++;
    };
    setTimeout(() => {
      activate();
      if (!reduce) setInterval(() => { if (!document.hidden) activate(); }, 3200);
    }, 1500 + ORDER.length * step + PINS.length * 220);
  }

  const base = hero.querySelector('.ch-base');
  const start = () => play();
  if (base && !base.complete) base.addEventListener('load', start, { once: true });
  else start();

  loadObjects().then(({ count, items }) => { fillPins(items); setCount(count); });
})();
