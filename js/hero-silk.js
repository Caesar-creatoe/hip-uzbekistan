/* ============================================================
   HERO-SILK.JS — главный экран «Шёлковый путь» (версия 3).

   Сцену рисует один шейдер WebGL поверх картинки:
   • объём — карта глубины (silk3-map-a.png, канал R): ближние планы
     смещаются сильнее дальних (приём «fake 3D» с картой глубины);
   • пролёт камеры — на входе камера летит за светом от Хивы
     к Чарваку и отъезжает на общий план;
   • дорога — канал G (маска дороги) и B (позиция вдоль маршрута 0…1):
     свет «зажигает» дорогу, потом по ней течёт золотой поток;
   • silk3-map-b.png: R — вода Чарвака (рябь, блики), G — снег
     Чимгана (искры), B — ореол дороги;
   • картинка берётся бикубически (чётче обычного сглаживания);
     без тумана и зерна — чистая чёткая сцена.
   Маршрут внизу — навигация по регионам с цифрами из каталога.
   Без WebGL или при «уменьшить движение» остаётся картинка.
   ============================================================ */
(function () {
  'use strict';

  const hero = document.querySelector('.silk-hero');
  if (!hero) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileMQ = window.matchMedia('(max-width: 760px)');
  const q = (s) => hero.querySelector(s);
  const qa = (s) => [...hero.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const IMG_AR = 2576 / 1438;
  const DWELL = 5200; // сколько держим регион в автотуре, мс

  /* Символы регионов: t — где на дороге, (u,v) — точка метки,
     (fu,fv,fr) — центр и радиус «подсветки», d — глубина метки. */
  const STOPS = [
    { k: 'khiva',     t: .17, u: .335, v: .690, al: 'r', fu: .30, fv: .74, fr: .15, d: .78, name: 'Хорезм',    place: 'Ичан-Кала, Хива',            test: /хорезм/i },
    { k: 'bukhara',   t: .44, u: .430, v: .545, al: 'r', fu: .44, fv: .56, fr: .11, d: .60, name: 'Бухара',    place: 'Крепость Арк',               test: /бухар/i },
    { k: 'samarkand', t: .60, u: .625, v: .575, fu: .64, fv: .66, fr: .12, d: .74, name: 'Самарканд', place: 'Комплекс Имама аль-Бухари',  test: /самарканд/i },
    { k: 'jizzakh',   t: .70, u: .858, v: .478, al: 'l', fu: .86, fv: .55, fr: .12, d: .58, name: 'Джизак',    place: 'Зомин',                      test: /джизак/i },
    { k: 'tashkent',  t: .89, u: .708, v: .245, fu: .74, fv: .28, fr: .10, d: .29, name: 'Ташкент',   place: 'Центр исламской цивилизации', test: /ташкент\s*\(город\)|^ташкент$/i },
    { k: 'toshobl',   t: .99, u: .895, v: .262, al: 'l', fu: .91, fv: .26, fr: .10, d: .20, name: 'Ташкентская обл.', place: 'Чарвак · Чимган',  test: /ташкентская/i }
  ];

  const money = (n) => {
    if (!n) return '';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1).replace('.', ',').replace(/,0$/, '') + ' млн';
    return '$' + Math.round(n / 1e3) + ' тыс.';
  };
  const plural = (n, forms) => {
    const f = forms.split('|'); const a = Math.abs(n) % 100, b = a % 10;
    return a > 10 && a < 20 ? f[2] : b > 1 && b < 5 ? f[1] : b === 1 ? f[0] : f[2];
  };

  /* ── цифры из каталога ──────────────────────────────── */
  async function loadData() {
    let list = [];
    try {
      if (window.HotelStore && typeof window.HotelStore.getAll === 'function') list = window.HotelStore.getAll() || [];
      if (!list.length) list = await (await fetch('./data/hotels.json')).json();
    } catch (e) { list = []; }
    const regions = {};
    STOPS.forEach((s) => {
      const items = list.filter((h) => s.test.test(String(h.region || '').trim()));
      const prices = items.map((h) => Number(h.economics && h.economics.askingPrice) || 0).filter(Boolean);
      regions[s.k] = { n: items.length, min: prices.length ? Math.min(...prices) : 0 };
    });
    return { count: list.length, regions };
  }
  function fill({ count, regions }) {
    STOPS.forEach((s) => {
      const r = regions[s.k], li = q(`.sx-stop[data-k="${s.k}"]`);
      s.meta = r && r.n ? `${r.n} ${plural(r.n, 'отель|отеля|отелей')}${r.min ? ' · от ' + money(r.min) : ''}` : 'Объекты готовятся';
      if (li) li.querySelector('.sx-meta').textContent = s.meta + ' →';
    });
    if (count) {
      const c = q('[data-sr="count"]'), w = q('[data-sr="count-word"]');
      if (c) c.textContent = count;
      if (w) w.textContent = plural(count, 'отель|отеля|отелей');
    }
    if (glOn && active >= 0) setMarker(active, false);
  }

  /* ── текст: слова заголовка «выезжают» из-под маски ──── */
  function splitTitle() {
    const h = q('.sx-title');
    if (!h) return;
    let i = 0;
    const wrap = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/([ \t\n]+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^[ \t\n]+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            /* неразрывный пробел держит «для инвесторов» вместе */
            const w = document.createElement('span'); w.className = 'w';
            const inner = document.createElement('span'); inner.textContent = p;
            inner.style.setProperty('--d', (0.08 * i++).toFixed(2) + 's');
            w.appendChild(inner); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) wrap(n);
      });
    };
    wrap(h);
  }

  /* ── маршрут внизу и метка ──────────────────────────── */
  const stopsEl = STOPS.map((s) => q(`.sx-stop[data-k="${s.k}"]`));
  const marker = q('.sx-marker');
  const tag = q('.sx-marker-tag');
  let active = -1, glOn = false;

  function setFill(i, f) { if (stopsEl[i]) stopsEl[i].querySelector('a').style.setProperty('--f', f.toFixed(3)); }
  function setMarker(i, swap = true) {
    const s = STOPS[i];
    tag.innerHTML = '';
    tag.append(s.name);
    const sm = document.createElement('small'); sm.textContent = s.meta ? `${s.place} · ${s.meta}` : s.place;
    tag.appendChild(sm);
    marker.dataset.al = mobileMQ.matches ? 'u' : (s.al || 'u');
    if (swap) { marker.classList.remove('is-swap'); void marker.offsetWidth; marker.classList.add('is-swap'); }
  }
  function activate(i) {
    if (i === active) return;
    active = i;
    stopsEl.forEach((el, j) => el && el.classList.toggle('is-active', j === i));
    if (glOn && i >= 0) { setMarker(i); marker.classList.add('is-on'); }
    else marker.classList.remove('is-on');
    /* на телефоне держим активный регион в зоне видимости ленты */
    const ol = q('.sx-route ol'), el = stopsEl[i];
    if (ol && el && ol.scrollWidth > ol.clientWidth + 4) ol.scrollTo({ left: el.offsetLeft - 22, behavior: reduce ? 'auto' : 'smooth' });
  }

  /* ── WebGL ──────────────────────────────────────────── */
  const canvas = q('.sx-gl');
  const img = q('.sx-img');
  const VERT = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
  const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uImg, uA, uB;
uniform vec2 uRes;
uniform float uImgAR, uTime, uProg, uExpo, uFlow, uFocusR;
uniform vec2 uTexSize;
uniform vec3 uCam, uFocus;
uniform vec2 uPar;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
/* бикубическая выборка (Catmull-Rom, 9 обращений) — без «мыла» при увеличении */
vec3 sharpTex(sampler2D tex, vec2 uv, vec2 ts){
  vec2 sp = uv * ts, t1 = floor(sp - .5) + .5, f = sp - t1;
  vec2 w0 = f * (-.5 + f * (1. - .5 * f));
  vec2 w1 = 1. + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (.5 + f * (2. - 1.5 * f));
  vec2 w3 = f * f * (-.5 + .5 * f);
  vec2 w12 = w1 + w2;
  vec2 t0 = (t1 - 1.) / ts, t3 = (t1 + 2.) / ts, t12 = (t1 + w2 / w12) / ts;
  vec3 r = texture2D(tex, vec2(t0.x, t0.y)).rgb * w0.x * w0.y
         + texture2D(tex, vec2(t12.x, t0.y)).rgb * w12.x * w0.y
         + texture2D(tex, vec2(t3.x, t0.y)).rgb * w3.x * w0.y
         + texture2D(tex, vec2(t0.x, t12.y)).rgb * w0.x * w12.y
         + texture2D(tex, vec2(t12.x, t12.y)).rgb * w12.x * w12.y
         + texture2D(tex, vec2(t3.x, t12.y)).rgb * w3.x * w12.y
         + texture2D(tex, vec2(t0.x, t3.y)).rgb * w0.x * w3.y
         + texture2D(tex, vec2(t12.x, t3.y)).rgb * w12.x * w3.y
         + texture2D(tex, vec2(t3.x, t3.y)).rgb * w3.x * w3.y;
  return clamp(r, 0., 1.);
}
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 7.1; a *= .5; } return v; }

void main(){
  vec2 s = vec2(vUv.x, 1. - vUv.y);
  float ar = uRes.x / uRes.y;
  vec2 win = ar > uImgAR ? vec2(1., uImgAR / ar) : vec2(ar / uImgAR, 1.);
  win /= uCam.z;
  vec2 uv0 = uCam.xy + (s - .5) * win;

  /* объём: ближнее смещается сильнее (две итерации — без «разрывов») */
  float d = texture2D(uA, uv0).r;
  vec2 uv = uv0 + uPar * (d - .5);
  d = texture2D(uA, uv).r;
  uv = uv0 + uPar * (d - .5);

  vec4 A = texture2D(uA, uv);
  vec4 B = texture2D(uB, uv);
  float core = A.g, t = A.b, water = B.r, snow = B.g, glow = B.b;

  /* Чарвак: рябь и блики */
  vec2 wuv = uv;
  if (water > .01) {
    wuv.x += (noise(vec2(uv.x * 160., uv.y * 900. - uTime * .9)) - .5) * .0022 * water;
    wuv.y += (noise(vec2(uv.x * 90. + uTime * .25, uv.y * 520.)) - .5) * .0010 * water;
  }
  vec3 col = sharpTex(uImg, wuv, uTexSize);
  if (water > .01) {
    float g = pow(noise(vec2(uv.x * 620. + uTime * .4, uv.y * 2400. + uTime * 1.4)), 16.);
    col += vec3(1., .93, .8) * g * water * 1.5;
  }

  /* солнце у горизонта дышит */
  vec2 sd = (uv - vec2(.06, .17)) * vec2(1.6, 5.);
  col += vec3(1., .62, .30) * exp(-dot(sd, sd) * 6.) * (.07 + .025 * sin(uTime * .35));

  /* дорога: незажжённая часть — тусклый песок */
  float lit = 1. - smoothstep(uProg - .006, uProg + .006, t);
  float lum = dot(col, vec3(.299, .587, .114));
  vec3 unlit = vec3(lum) * vec3(.64, .53, .45) * .82;
  col = mix(col, unlit, core * (1. - lit) * .92);

  /* голова света во время «зажигания» */
  float head = exp(-pow((t - uProg) / .012, 2.)) * (1. - step(.999, uProg));
  col += vec3(1., .74, .34) * (glow * .55 + core * 1.1) * head * 1.35;

  /* золотой поток: длинные мазки света идут от Хивы к Чарваку */
  float f = 1. - fract(t * 9. - uTime * .5);
  float streak = smoothstep(0., .04, f) * (1. - smoothstep(.04, .5, f));
  float shimmer = .55 + .45 * noise(vec2(t * 300. - uTime * 7., uv.y * 40.));
  col += vec3(1., .80, .42) * (core * .62 + glow * .16) * streak * shimmer * lit * uFlow;
  col += vec3(1., .66, .30) * glow * .11 * lit * uFlow * (.7 + .3 * sin(uTime * 1.2 - t * 24.));

  /* снег Чимгана искрится */
  if (snow > .05) {
    vec2 sg = floor(uv * vec2(1100., 620.));
    float n = hash(sg);
    float tw = step(.965, n) * pow(.5 + .5 * sin(uTime * 2.2 + n * 60.), 10.);
    col += vec3(1.) * snow * tw * .55;
  }

  /* подсветка выбранного региона */
  if (uFocus.z > .001) {
    vec2 dv = (uv - uFocus.xy) * vec2(uImgAR, 1.);
    float fl = exp(-dot(dv, dv) / (uFocusR * uFocusR));
    col *= mix(1., .87 + .25 * fl, uFocus.z);
    col += vec3(1., .78, .5) * fl * uFocus.z * .045;
  }

  /* экспозиция и виньетка */
  vec2 vq = s - .5;
  float l2 = dot(col, vec3(.299, .587, .114));
  col = mix(vec3(l2), col, 1.07);
  col = (col - .5) * 1.04 + .5;
  col *= uExpo * (1. - dot(vq, vq) * .32);
  gl_FragColor = vec4(col, 1.);
}`;

  function makeGL() {
    if (reduce || !canvas) return null;
    let gl = null;
    try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' }); } catch (e) { gl = null; }
    if (!gl) return null;
    const sh = (type, src) => {
      const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o);
      if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.warn('hero shader:', gl.getShaderInfoLog(o)); return null; }
      return o;
    };
    const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {};
    ['uImg', 'uA', 'uB', 'uRes', 'uTexSize', 'uImgAR', 'uTime', 'uProg', 'uExpo', 'uFlow', 'uFocusR', 'uCam', 'uFocus', 'uPar'].forEach((n) => { U[n] = gl.getUniformLocation(pr, n); });
    return { gl, U };
  }

  function loadImage(src) {
    return new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
  }
  function texture(gl, unit, image) {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  /* ── камера ─────────────────────────────────────────── */
  const cam = { x: .32, y: .70, z: 1.32 }, camT = { x: .5, y: .5, z: 1.04 };
  const par = { x: 0, y: 0 }, mouse = { x: 0, y: 0 };
  const focus = { x: .5, y: .5, s: 0, r: .12 }, focusT = { x: .5, y: .5, s: 0, r: .12 };
  let prog = reduce ? 1 : 0, expo = reduce ? 1 : .5, flow = reduce ? 1 : 0;
  let hover = -1, introDone = reduce, tourAt = 0, holdUntil = 0;

  function windowSize(w, h, z) {
    const ar = w / h;
    const win = ar > IMG_AR ? [1, IMG_AR / ar] : [ar / IMG_AR, 1];
    return [win[0] / z, win[1] / z];
  }
  function clampCam(c, w, h) {
    const [wx, wy] = windowSize(w, h, c.z), m = .01;
    c.x = wx >= 1 - 2 * m ? .5 : clamp(c.x, wx / 2 + m, 1 - wx / 2 - m);
    c.y = wy >= 1 - 2 * m ? .5 : clamp(c.y, wy / 2 + m, 1 - wy / 2 - m);
  }
  /* точка картинки → пиксели на экране (для метки) */
  function toScreen(u, v, d, w, h) {
    const [wx, wy] = windowSize(w, h, cam.z);
    const su = u - par.x * (d - .5), sv = v - par.y * (d - .5);
    return [((su - cam.x) / wx + .5) * w, ((sv - cam.y) / wy + .5) * h];
  }
  /* куда смотрит камера, пока свет идёт по дороге */
  function headPoint(p) {
    if (p <= STOPS[0].t) return [STOPS[0].fu, STOPS[0].fv];
    for (let i = 1; i < STOPS.length; i++) {
      if (p <= STOPS[i].t) {
        const a = STOPS[i - 1], b = STOPS[i], k = (p - a.t) / (b.t - a.t);
        return [lerp(a.fu, b.fu, k), lerp(a.fv, b.fv, k)];
      }
    }
    const l = STOPS[STOPS.length - 1]; return [l.fu, l.fv];
  }

  function targets(now, w, h) {
    const mobile = mobileMQ.matches;
    const tt = now / 1000;
    const sel = hover >= 0 ? hover : active;
    if (!introDone) return;
    if (mobile) {
      /* телефон: камера переезжает от символа к символу */
      const s = STOPS[Math.max(0, sel)];
      camT.x = s.fu; camT.y = .5; camT.z = 1.03;
    } else if (hover >= 0) {
      const s = STOPS[hover];
      camT.x = lerp(.5, s.fu, .55); camT.y = lerp(.5, s.fv, .5); camT.z = 1.12;
    } else {
      /* общий план, лёгкое «дыхание» и наклон к активному региону */
      const s = active >= 0 ? STOPS[active] : null;
      camT.x = .5 + (s ? (s.fu - .5) * .06 : 0) + .004 * Math.sin(tt * .07);
      camT.y = .5 + (s ? (s.fv - .5) * .05 : 0) + .003 * Math.sin(tt * .05);
      camT.z = 1.018 + .006 * Math.sin(tt * .045);
    }
    if (sel >= 0) { const s = STOPS[sel]; focusT.x = s.fu; focusT.y = s.fv; focusT.r = s.fr; focusT.s = hover >= 0 ? 1 : .75; }
    else focusT.s = 0;
    clampCam(camT, w, h);
  }

  function damp(a, b, k, dt) { return a + (b - a) * (1 - Math.exp(-k * dt)); }

  /* ── запуск ─────────────────────────────────────────── */
  function boot(ctx) {
    const { gl, U } = ctx;
    const src = img.currentSrc || img.src;
    Promise.all([loadImage(src), loadImage('assets/hero/silk3-map-a.png'), loadImage('assets/hero/silk3-map-b.png')]).then(([im, ma, mb]) => {
      texture(gl, 0, im); texture(gl, 1, ma); texture(gl, 2, mb);
      gl.uniform1i(U.uImg, 0); gl.uniform1i(U.uA, 1); gl.uniform1i(U.uB, 2);
      gl.uniform1f(U.uImgAR, IMG_AR);
      gl.uniform2f(U.uTexSize, im.naturalWidth, im.naturalHeight);
      glOn = true;
      run(ctx);
    }).catch(() => { introText(); finishIntro(performance.now()); });
  }

  let W = 0, H = 0, visible = true, raf = 0, last = 0, t0 = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
  }

  function introText() { hero.classList.add('is-in'); }
  function finishIntro(now) {
    introDone = true; prog = 1; flow = 1;
    STOPS.forEach((s, i) => { setFill(i, 0); stopsEl[i] && stopsEl[i].classList.add('is-lit'); });
    tourAt = now + 900;
  }

  function run({ gl, U }) {
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }, { threshold: 0 }).observe(hero);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !raf) { last = 0; raf = requestAnimationFrame(frame); } });

    const mobile = mobileMQ.matches;
    if (mobile) { cam.x = STOPS[0].fu; cam.y = .5; cam.z = 1.12; }
    t0 = performance.now();
    setTimeout(introText, 900);

    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = last ? Math.min(.05, (now - last) / 1000) : .016;
      last = now;
      const rect = canvas.getBoundingClientRect(), w = rect.width, h = rect.height;

      if (!introDone) {
        /* вступление: 0.5 с тишины, 6.4 с — свет идёт от Хивы до Чарвака */
        const e = (now - t0) / 1000;
        const k = clamp((e - .5) / 6.4, 0, 1);
        prog = easeIO(k);
        expo = lerp(.5, 1, easeOut(clamp(e / 3.2, 0, 1)));
        flow = clamp((e - 4.5) / 2.5, 0, 1);
        const [hx, hy] = headPoint(prog);
        const zk = easeIO(clamp((e - .3) / 6.8, 0, 1));
        if (mobileMQ.matches) { camT.x = hx; camT.y = .5; camT.z = lerp(1.12, 1.03, zk); }
        else { camT.x = lerp(hx, .5, zk * zk); camT.y = lerp(hy, .5, zk * zk); camT.z = lerp(1.26, 1.018, zk); }
        clampCam(camT, w, h);
        STOPS.forEach((s, i) => {
          const lo = i ? STOPS[i - 1].t : 0;
          setFill(i, clamp((prog - lo) / (s.t - lo), 0, 1));
          if (prog >= s.t && stopsEl[i] && !stopsEl[i].classList.contains('is-lit')) stopsEl[i].classList.add('is-lit');
        });
        if (k >= 1) finishIntro(now);
      } else {
        /* автотур по регионам, пока посетитель не выбрал сам */
        if (hover < 0 && now > holdUntil && now >= tourAt) {
          activate((active + 1) % STOPS.length);
          tourAt = now + DWELL;
        }
        STOPS.forEach((s, i) => {
          const f = i < active ? 1 : i > active ? 0 : (hover >= 0 || now < holdUntil ? 1 : clamp(1 - (tourAt - now) / DWELL, 0, 1));
          setFill(i, f);
        });
      }

      targets(now, w, h);
      const kc = introDone ? 2.2 : 3.2;
      cam.x = damp(cam.x, camT.x, kc, dt); cam.y = damp(cam.y, camT.y, kc, dt); cam.z = damp(cam.z, camT.z, kc, dt);
      focus.x = damp(focus.x, focusT.x, 4, dt); focus.y = damp(focus.y, focusT.y, 4, dt);
      focus.s = damp(focus.s, focusT.s, 3, dt); focus.r = damp(focus.r, focusT.r, 4, dt);
      /* объём: медленный «облёт» + мышь */
      const tt = now / 1000, amp = mobileMQ.matches ? .006 : .008;
      par.x = damp(par.x, amp * Math.sin(tt * .23) * .6 + mouse.x * amp, 3, dt);
      par.y = damp(par.y, amp * Math.cos(tt * .19) * .35 + mouse.y * amp * .6, 3, dt);

      gl.viewport(0, 0, W, H);
      gl.uniform2f(U.uRes, W, H);
      gl.uniform1f(U.uTime, tt % 1000);
      gl.uniform1f(U.uProg, prog);
      gl.uniform1f(U.uExpo, expo);
      gl.uniform1f(U.uFlow, flow);
      gl.uniform3f(U.uCam, cam.x, cam.y, cam.z);
      gl.uniform2f(U.uPar, par.x, par.y);
      gl.uniform3f(U.uFocus, focus.x, focus.y, focus.s);
      gl.uniform1f(U.uFocusR, focus.r);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!hero.classList.contains('is-gl')) hero.classList.add('is-gl');

      /* метка следует за символом */
      const sel = hover >= 0 ? hover : active;
      if (sel >= 0) {
        const s = STOPS[sel];
        const [x, y] = toScreen(s.u, s.v, s.d, w, h);
        const ox = rect.left - hero.getBoundingClientRect().left, oy = rect.top - hero.getBoundingClientRect().top;
        marker.style.transform = `translate3d(${(x + ox).toFixed(1)}px, ${(y + oy).toFixed(1)}px, 0)`;
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }

  /* ── взаимодействие ─────────────────────────────────── */
  function bindUI(hasGL) {
    stopsEl.forEach((el, i) => {
      if (!el) return;
      const a = el.querySelector('a');
      const on = () => {
        if (!introDone) return;
        hover = i; activate(i);
        if (!hasGL) setFill(i, 1);
      };
      const off = () => { if (hover === i) { hover = -1; holdUntil = performance.now() + 2600; tourAt = holdUntil; } };
      a.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') on(); });
      a.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') off(); });
      a.addEventListener('focus', on);
      a.addEventListener('blur', off);
    });
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        mouse.x = ((e.clientX - r.left) / r.width - .5) * 2;
        mouse.y = ((e.clientY - r.top) / r.height - .5) * 2;
      });
      hero.addEventListener('pointerleave', () => { mouse.x = 0; mouse.y = 0; });
    }
  }

  /* ── старт ──────────────────────────────────────────── */
  hero.classList.add('sx-js');
  splitTitle();
  const ctx = makeGL();
  bindUI(!!ctx);
  loadData().then(fill);

  if (!ctx) {
    /* статичный вариант: картинка, текст и маршрут без пролёта */
    introDone = true;
    requestAnimationFrame(() => requestAnimationFrame(introText));
    STOPS.forEach((s, i) => { stopsEl[i] && stopsEl[i].classList.add('is-lit'); });
    return;
  }
  const go = () => boot(ctx);
  if (img.complete && img.naturalWidth) go();
  else img.addEventListener('load', go, { once: true });
})();
