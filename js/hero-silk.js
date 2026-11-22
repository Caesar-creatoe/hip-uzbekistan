/* ============================================================
   HERO-SILK.JS — главный экран «Шёлковый путь».
   1) Свет «зажигает» золотую дорогу от Хорезма до Ташкента.
   2) Когда свет доходит до отеля — отель загорается, над ним
      появляется метка региона: сколько объектов и от какой цены.
   3) Потом по дороге раз в несколько секунд проходит «караван
      света», и метка отеля, мимо которого он идёт, раскрывается.
   Картинка — иллюстрация; цифры в метках — реальный каталог.
   ============================================================ */
(function () {
  'use strict';

  const hero = document.querySelector('.silk-hero');
  if (!hero) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const q = (s) => hero.querySelector(s);
  const qa = (s) => [...hero.querySelectorAll(s)];
  const by = (sel, k) => hero.querySelector(`${sel}[data-k="${k}"]`);

  /* где на дороге стоят отели (доля длины пути) */
  const STOPS = [
    { k: 'khiva', at: 0.19 },
    { k: 'samarkand', at: 0.55 },
    { k: 'bukhara', at: 0.78 },
    { k: 'tashkent', at: 0.995 }
  ];
  const REGION = {
    khiva: { name: 'Хорезм', test: /хорезм/i },
    samarkand: { name: 'Самарканд', test: /самарканд/i },
    bukhara: { name: 'Бухара', test: /бухар/i },
    tashkent: { name: 'Ташкент', test: /ташкент/i }
  };
  const FALLBACK = {
    khiva: { n: 4, min: 2.6e6 }, samarkand: { n: 4, min: 2.8e6 },
    bukhara: { n: 2, min: 3e6 }, tashkent: { n: 16, min: 0.9e6 }
  };

  const money = (n) => {
    if (!n) return '';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1).replace('.', ',').replace(/,0$/, '') + ' млн';
    return '$' + Math.round(n / 1e3) + ' тыс.';
  };
  const plural = (n, forms) => {
    const f = forms.split('|'); const a = Math.abs(n) % 100, b = a % 10;
    return a > 10 && a < 20 ? f[2] : b > 1 && b < 5 ? f[1] : b === 1 ? f[0] : f[2];
  };

  /* ── данные ─────────────────────────────────────────── */
  async function loadData() {
    let list = [];
    try {
      if (window.HotelStore && typeof window.HotelStore.getAll === 'function') list = window.HotelStore.getAll() || [];
      if (!list.length) list = await (await fetch('./data/hotels.json')).json();
    } catch (e) { list = []; }
    const out = {};
    Object.keys(REGION).forEach((k) => {
      const items = list.filter((h) => REGION[k].test.test(h.region || ''));
      const prices = items.map((h) => Number(h.economics && (h.economics.askingPrice || h.economics.valuation)) || 0).filter(Boolean);
      out[k] = items.length ? { n: items.length, min: prices.length ? Math.min(...prices) : 0 } : FALLBACK[k];
    });
    return { count: list.length, regions: out };
  }

  function fill({ count, regions }) {
    Object.keys(regions).forEach((k) => {
      const pin = by('.sr-pin', k), r = regions[k];
      if (!pin) return;
      pin.querySelector('.sr-pin-name').textContent = `${REGION[k].name} · ${r.n} ${plural(r.n, 'отель|отеля|отелей')}`;
      pin.querySelector('.sr-pin-meta').textContent = r.min ? `от ${money(r.min)} · смотреть объекты` : 'смотреть объекты';
    });
    if (count) {
      const c = q('[data-sr="count"]'), w = q('[data-sr="count-word"]');
      if (c) c.textContent = count;
      if (w) w.textContent = plural(count, 'отель|отеля|отелей');
    }
  }

  /* ── дорога ─────────────────────────────────────────── */
  const path = q('.sr-path');
  const reveal = q('.sr-reveal');
  const trails = qa('.sr-trail');
  const comet = q('.sr-comet'), halo = q('.sr-comet-halo');
  const roadImg = q('.sr-road-img');
  const base = q('.sr-base');
  const total = path.getTotalLength();

  /* картинка с горящей дорогой — того же размера, что выбрал браузер */
  function setRoadImage() {
    const src = (base.currentSrc || base.src).replace('silk-dim-', 'silk-');
    roadImg.setAttribute('href', src);
  }

  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const point = (f) => path.getPointAtLength(Math.max(0, Math.min(1, f)) * total);

  function head(f, alpha) {
    const p = point(f);
    comet.setAttribute('cx', p.x); comet.setAttribute('cy', p.y);
    halo.setAttribute('cx', p.x); halo.setAttribute('cy', p.y);
    comet.style.opacity = alpha;
    halo.style.opacity = alpha * .85;
  }
  function tail(f, len, alpha) {
    const end = f * 1000, start = Math.max(0, end - len);
    trails.forEach((t, i) => {
      const l = i ? len * .55 : len;
      const s = Math.max(0, end - l);
      t.style.strokeDasharray = `${end - s} 1000`;
      t.style.strokeDashoffset = -s;
      t.style.opacity = alpha * (i ? 1 : .8);
    });
    return start;
  }

  function lightHotel(k) {
    const lit = by('.sr-lit', k), glow = by('.sr-glow', k), pin = by('.sr-pin', k);
    if (lit) lit.classList.add('is-on');
    if (glow) glow.classList.add('is-on');
    if (pin) setTimeout(() => pin.classList.add('is-on'), reduce ? 0 : 350);
  }
  function hit(k) {
    qa('.sr-pin.is-active').forEach((el) => el.classList.remove('is-active'));
    const pin = by('.sr-pin', k), glow = by('.sr-glow', k);
    if (pin) pin.classList.add('is-active');
    if (glow) { glow.classList.remove('is-hit'); void glow.offsetWidth; glow.classList.add('is-hit'); }
  }

  /* 1) зажигаем дорогу */
  function intro() {
    if (reduce) {
      reveal.style.strokeDashoffset = 0;
      STOPS.forEach((s) => lightHotel(s.k));
      hit('samarkand');
      return;
    }
    const DUR = 6200;
    let t0 = null, next = 0;
    const step = (now) => {
      if (t0 === null) t0 = now;
      const t = Math.min(1, (now - t0) / DUR), f = ease(t);
      reveal.style.strokeDashoffset = 1000 - f * 1000;
      const fade = t < .06 ? t / .06 : t > .94 ? (1 - t) / .06 : 1;
      head(f, fade);
      tail(f, 70, fade);
      while (next < STOPS.length && f >= STOPS[next].at) { lightHotel(STOPS[next].k); next++; }
      if (t < 1) requestAnimationFrame(step);
      else { head(1, 0); tail(1, 0, 0); hit('tashkent'); setTimeout(caravan, 2600); }
    };
    requestAnimationFrame(step);
  }

  /* 2) «караван света» — повторяется */
  function caravan() {
    if (document.hidden) { setTimeout(caravan, 1500); return; }
    const DUR = 7600;
    let t0 = null, next = 0;
    const step = (now) => {
      if (t0 === null) t0 = now;
      const t = Math.min(1, (now - t0) / DUR), f = t;  // ровная скорость, как караван
      const fade = t < .05 ? t / .05 : t > .95 ? (1 - t) / .05 : 1;
      head(f, fade * .95);
      tail(f, 110, fade);
      while (next < STOPS.length && f >= STOPS[next].at) { hit(STOPS[next].k); next++; }
      if (t < 1) requestAnimationFrame(step);
      else { head(1, 0); tail(1, 0, 0); setTimeout(caravan, 2400); }
    };
    requestAnimationFrame(step);
  }

  /* ── золотая пыль в лучах ───────────────────────────── */
  function dust() {
    const cv = q('.sr-dust');
    if (!cv || reduce) return;
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dpr = 1, motes = [];
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = hero.clientWidth; h = hero.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(70, w * h / 16000));
      motes = Array.from({ length: n }, () => spawn(true));
    };
    const spawn = (any) => ({
      x: Math.random() * w,
      y: any ? Math.random() * h : h + 10,
      r: .6 + Math.random() * 1.8,
      vx: .08 + Math.random() * .22,
      vy: -(.06 + Math.random() * .2),
      a: .15 + Math.random() * .5,
      ph: Math.random() * Math.PI * 2
    });
    let last = 0;
    const tick = (now) => {
      requestAnimationFrame(tick);
      if (document.hidden || now - last < 30) return;
      last = now;
      ctx.clearRect(0, 0, w, h);
      motes.forEach((m, i) => {
        m.x += m.vx; m.y += m.vy; m.ph += .03;
        if (m.y < -10 || m.x > w + 10) motes[i] = Object.assign(spawn(false), { x: Math.random() * w * .8 });
        const tw = .6 + .4 * Math.sin(m.ph);
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 214, 150, ${m.a * tw})`;
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      });
    };
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(tick);
  }

  /* старт: ждём картинку, чтобы свет пошёл по уже видимой сцене */
  const start = () => { setRoadImage(); setTimeout(intro, reduce ? 0 : 700); };
  if (base.complete && base.naturalWidth) start();
  else base.addEventListener('load', start, { once: true });

  dust();
  loadData().then(fill);
})();
