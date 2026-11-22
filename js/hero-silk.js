/* ============================================================
   HERO-SILK.JS — главный экран «Шёлковый путь».
   1) Свет зажигает золотую дорогу от Хивы до Чарвака.
   2) Когда свет доходит до символа региона — он загорается,
      над ним появляется метка: регион, сколько отелей, от какой цены.
   3) Потом по дороге раз в несколько секунд идёт «караван света»;
      метка региона, мимо которого он проходит, раскрывается.
   4) Перспектива: голова каравана и хвост крупнее внизу кадра.
   5) Объём: сцена чуть смещается за курсором (только мышь).
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

  /* где на дороге стоят символы регионов (доля длины пути) */
  const STOPS = [
    { k: 'khiva', at: 0.05 },
    { k: 'bukhara', at: 0.38 },
    { k: 'jizzakh', at: 0.47 },
    { k: 'samarkand', at: 0.53 },
    { k: 'tashkent', at: 0.69 },
    { k: 'kokand', at: 0.81 },
    { k: 'toshobl', at: 0.985 }
  ];
  const REGION = {
    khiva:     { name: 'Хорезм',            test: /хорезм/i },
    bukhara:   { name: 'Бухара',            test: /бухар/i },
    jizzakh:   { name: 'Джизак · Зомин',    test: /джизак/i },
    samarkand: { name: 'Самарканд',         test: /самарканд/i },
    tashkent:  { name: 'Ташкент',           test: /ташкент\s*\(город\)|^ташкент$/i },
    kokand:    { name: 'Фергана · Коканд',  test: /ферган|андижан|наманган/i },
    toshobl:   { name: 'Чимган · Чарвак',   test: /ташкентская/i }
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

  /* ── данные из каталога ─────────────────────────────── */
  async function loadData() {
    let list = [];
    try {
      if (window.HotelStore && typeof window.HotelStore.getAll === 'function') list = window.HotelStore.getAll() || [];
      if (!list.length) list = await (await fetch('./data/hotels.json')).json();
    } catch (e) { list = []; }
    const out = {};
    Object.keys(REGION).forEach((k) => {
      const items = list.filter((h) => REGION[k].test.test(String(h.region || '').trim()));
      const prices = items.map((h) => Number(h.economics && h.economics.askingPrice) || 0).filter(Boolean);
      out[k] = { n: items.length, min: prices.length ? Math.min(...prices) : 0 };
    });
    return { count: list.length, regions: out };
  }

  function fill({ count, regions }) {
    Object.keys(REGION).forEach((k) => {
      const pin = by('.sr-pin', k), r = regions[k];
      if (!pin || !r) return;
      pin.querySelector('.sr-pin-name').textContent = r.n
        ? `${REGION[k].name} · ${r.n} ${plural(r.n, 'отель|отеля|отелей')}`
        : REGION[k].name;
      pin.querySelector('.sr-pin-meta').textContent = r.n
        ? (r.min ? `от ${money(r.min)} · смотреть объекты` : 'смотреть объекты')
        : 'объекты готовятся к публикации';
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
  const VB_H = 1438;

  function setRoadImage() {
    const src = (base.currentSrc || base.src).replace('silk2-dim-', 'silk2-');
    roadImg.setAttribute('href', src);
  }

  const easeIO = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const point = (f) => path.getPointAtLength(Math.max(0, Math.min(1, f)) * total);
  /* перспектива: внизу кадра (близко) всё крупнее */
  const persp = (y) => Math.max(.22, Math.min(1, .22 + .78 * ((y - 450) / (VB_H - 450))));

  function head(f, alpha) {
    const p = point(f), s = persp(p.y);
    comet.setAttribute('cx', p.x); comet.setAttribute('cy', p.y); comet.setAttribute('r', 6 + 16 * s);
    halo.setAttribute('cx', p.x); halo.setAttribute('cy', p.y); halo.setAttribute('r', 22 + 70 * s);
    comet.style.opacity = alpha;
    halo.style.opacity = alpha * .85;
    return s;
  }
  function tail(f, len, alpha, s) {
    const end = f * 1000;
    trails.forEach((t, i) => {
      const l = i ? len * .55 : len;
      const st = Math.max(0, end - l);
      t.style.strokeDasharray = `${end - st} 1000`;
      t.style.strokeDashoffset = -st;
      t.style.strokeWidth = (i ? 5 + 9 * s : 14 + 40 * s);
      t.style.opacity = alpha * (i ? 1 : .8);
    });
  }

  function lightUp(k) {
    const lit = by('.sr-lit', k), glow = by('.sr-glow', k), pin = by('.sr-pin', k);
    if (lit) lit.classList.add('is-on');
    if (glow) glow.classList.add('is-on');
    if (pin) setTimeout(() => pin.classList.add('is-on'), reduce ? 0 : 380);
  }
  function hit(k) {
    qa('.sr-pin.is-active').forEach((el) => el.classList.remove('is-active'));
    const pin = by('.sr-pin', k), glow = by('.sr-glow', k);
    if (pin && getComputedStyle(pin).display !== 'none') pin.classList.add('is-active');
    if (glow) { glow.classList.remove('is-hit'); void glow.offsetWidth; glow.classList.add('is-hit'); }
  }

  /* 1) свет зажигает дорогу */
  function intro() {
    if (reduce) {
      reveal.style.strokeDashoffset = 0;
      STOPS.forEach((s) => lightUp(s.k));
      hit('tashkent');
      return;
    }
    const DUR = 7200;
    let t0 = null, next = 0;
    const step = (now) => {
      if (t0 === null) t0 = now;
      const t = Math.min(1, (now - t0) / DUR), f = easeIO(t);
      reveal.style.strokeDashoffset = 1000 - f * 1000;
      const fade = t < .05 ? t / .05 : t > .95 ? (1 - t) / .05 : 1;
      const s = head(f, fade);
      tail(f, 60, fade, s);
      while (next < STOPS.length && f >= STOPS[next].at) { lightUp(STOPS[next].k); next++; }
      if (t < 1) requestAnimationFrame(step);
      else { head(1, 0); tail(1, 0, 0, 0); hit('toshobl'); setTimeout(caravan, 2600); }
    };
    requestAnimationFrame(step);
  }

  /* 2) «караван света» */
  function caravan() {
    if (document.hidden) { setTimeout(caravan, 1500); return; }
    const DUR = 8200;
    let t0 = null, next = 0;
    const step = (now) => {
      if (t0 === null) t0 = now;
      const t = Math.min(1, (now - t0) / DUR);
      /* внизу кадра караван идёт быстрее (ближе к зрителю), вдали — медленнее */
      const f = 1 - Math.pow(1 - t, 1.35);
      const fade = t < .04 ? t / .04 : t > .95 ? (1 - t) / .05 : 1;
      const s = head(f, fade * .95);
      tail(f, 90, fade, s);
      while (next < STOPS.length && f >= STOPS[next].at) { hit(STOPS[next].k); next++; }
      if (t < 1) requestAnimationFrame(step);
      else { head(1, 0); tail(1, 0, 0, 0); setTimeout(caravan, 2200); }
    };
    requestAnimationFrame(step);
  }

  /* ── объём за курсором ──────────────────────────────── */
  function parallax() {
    if (reduce || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let raf = 0;
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        hero.style.setProperty('--px', (-x * 14).toFixed(1) + 'px');
        hero.style.setProperty('--py', (-y * 9).toFixed(1) + 'px');
      });
    });
    hero.addEventListener('pointerleave', () => { hero.style.setProperty('--px', '0px'); hero.style.setProperty('--py', '0px'); });
  }

  /* ── золотая пыль в лучах ───────────────────────────── */
  function dust() {
    const cv = q('.sr-dust');
    if (!cv || reduce) return;
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, motes = [];
    const spawn = (any) => ({
      x: Math.random() * w, y: any ? Math.random() * h : h + 10,
      r: .5 + Math.random() * 1.7,
      vx: .06 + Math.random() * .2, vy: -(.05 + Math.random() * .18),
      a: .12 + Math.random() * .45, ph: Math.random() * Math.PI * 2
    });
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = hero.clientWidth; h = hero.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      motes = Array.from({ length: Math.round(Math.min(60, w * h / 18000)) }, () => spawn(true));
    };
    let last = 0;
    const tick = (now) => {
      requestAnimationFrame(tick);
      if (document.hidden || now - last < 32) return;
      last = now;
      ctx.clearRect(0, 0, w, h);
      motes.forEach((m, i) => {
        m.x += m.vx; m.y += m.vy; m.ph += .03;
        if (m.y < -10 || m.x > w + 10) motes[i] = Object.assign(spawn(false), { x: Math.random() * w * .8 });
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 216, 150, ${m.a * (.6 + .4 * Math.sin(m.ph))})`;
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      });
    };
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(tick);
  }

  const start = () => { setRoadImage(); setTimeout(intro, reduce ? 0 : 1100); };
  if (base.complete && base.naturalWidth) start();
  else base.addEventListener('load', start, { once: true });

  parallax();
  dust();
  loadData().then(fill);
})();
