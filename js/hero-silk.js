/* ============================================================
   HERO-SILK.JS — главный экран «Шёлковый путь» (версия 3).

   Сцену рисует один шейдер WebGL поверх картинки:
   • объём — карта глубины (silk4-map-a.png, канал R): ближние планы
     смещаются сильнее дальних (приём «fake 3D» с картой глубины);
   • пролёт камеры — на входе камера летит за светом от Хивы
     к Чарваку и отъезжает на общий план;
   • дорога — отдельный слой: по осевой линии дороги бегут огни
     с затухающими хвостами (как deck.gl TripsLayer), под ними золотая нить;
   • silk4-map-b.png: R — вода Чарвака (рябь, блики), G — снег
     Чимгана (искры), B — ореол дороги;
   • туман в долине, мягкая виньетка, плёночное зерно.
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

  const IMG_AR = 2752 / 1536;
  const DWELL = 5200; // сколько держим регион в автотуре, мс

  /* Символы регионов: t — где на дороге, (u,v) — точка метки,
     (fu,fv,fr) — центр и радиус «подсветки», d — глубина метки. */
  const STOPS = [
    { k: 'khiva',     t: .20, u: .150, v: .668, al: 'r', fu: .20, fv: .79, fr: .16, d: .88, name: 'Хорезм',    place: 'Ичан-Кала, Хива',            test: /хорезм/i },
    { k: 'bukhara',   t: .35, u: .270, v: .583, al: 'r', fu: .28, fv: .53, fr: .12, d: .59, name: 'Бухара',    place: 'Крепость Арк',               test: /бухар/i },
    { k: 'samarkand', t: .56, u: .556, v: .480, fu: .55, fv: .56, fr: .12, d: .66, name: 'Самарканд', place: 'Комплекс Имама аль-Бухари',  test: /самарканд/i },
    { k: 'jizzakh',   t: .78, u: .850, v: .480, al: 'l', fu: .85, fv: .53, fr: .12, d: .56, name: 'Джизак',    place: 'Зомин',                      test: /джизак/i },
    { k: 'tashkent',  t: .91, u: .556, v: .264, al: 'r', fu: .58, fv: .30, fr: .10, d: .32, name: 'Ташкент',   place: 'Центр исламской цивилизации', test: /ташкент\s*\(город\)|^ташкент$/i },
    { k: 'toshobl',   t: .99, u: .850, v: .285, al: 'l', fu: .85, fv: .30, fr: .10, d: .27, name: 'Ташкентская обл.', place: 'Чарвак · Чимган',  test: /ташкентская/i }
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
    const sm = document.createElement('small'); sm.textContent = s.place;
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
uniform vec3 uCam, uFocus;
uniform vec2 uPar;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
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
  vec3 col = texture2D(uImg, wuv).rgb;
  if (water > .01) {
    float g = pow(noise(vec2(uv.x * 620. + uTime * .4, uv.y * 2400. + uTime * 1.4)), 16.);
    col += vec3(1., .93, .8) * g * water * 1.5;
  }

  /* туман в долине слева — медленно течёт */
  float fw = smoothstep(.17, .30, uv.y) * (1. - smoothstep(.50, .68, uv.y)) * (1. - smoothstep(.40, .74, uv.x)) * (1. - d * .55);
  if (fw > .001) {
    vec2 fp = vec2(uv.x * 3.4 + uTime * .012, uv.y * 7.5);
    float fog = fbm(fp + vec2(fbm(fp * 1.6 - vec2(uTime * .025, 0.)), 0.));
    col = mix(col, vec3(.95, .85, .78), smoothstep(.45, .88, fog) * fw * .22);
  }

  /* солнце у горизонта дышит */
  vec2 sd = (uv - vec2(.06, .17)) * vec2(1.6, 5.);
  col += vec3(1., .62, .30) * exp(-dot(sd, sd) * 6.) * (.07 + .025 * sin(uTime * .35));

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

  /* экспозиция, виньетка, зерно */
  vec2 vq = s - .5;
  float l2 = dot(col, vec3(.299, .587, .114));
  col = mix(vec3(l2), col, 1.07);
  col = (col - .5) * 1.04 + .5;
  col *= uExpo * (1. - dot(vq, vq) * .32);
  col += (hash(gl_FragCoord.xy + fract(uTime) * 91.) - .5) * .018;
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
    ['uImg', 'uA', 'uB', 'uRes', 'uImgAR', 'uTime', 'uProg', 'uExpo', 'uFlow', 'uFocusR', 'uCam', 'uFocus', 'uPar'].forEach((n) => { U[n] = gl.getUniformLocation(pr, n); });
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
      camT.x = lerp(.5, s.fu, .55); camT.y = lerp(.5, s.fv, .5); camT.z = 1.16;
    } else {
      /* общий план, лёгкое «дыхание» и наклон к активному региону */
      const s = active >= 0 ? STOPS[active] : null;
      camT.x = .5 + (s ? (s.fu - .5) * .06 : 0) + .006 * Math.sin(tt * .07);
      camT.y = .5 + (s ? (s.fv - .5) * .05 : 0) + .004 * Math.sin(tt * .05);
      camT.z = 1.045 + .012 * Math.sin(tt * .045);
    }
    if (sel >= 0) { const s = STOPS[sel]; focusT.x = s.fu; focusT.y = s.fv; focusT.r = s.fr; focusT.s = hover >= 0 ? 1 : .75; }
    else focusT.s = 0;
    clampCam(camT, w, h);
  }

  function damp(a, b, k, dt) { return a + (b - a) * (1 - Math.exp(-k * dt)); }

  /* ── Дорога: световые следы ─────────────────────────────
     Приём как в deck.gl TripsLayer и «light trails» Codrops: по
     точной осевой линии дороги бегут огни с затухающим хвостом,
     под ними — ровная тонкая золотая нить. Линия и ширина дороги
     сняты с картинки и сглажены, поэтому свет идёт ровно по полотну.
     [u, v, ширина, глубина] — доли размера картинки. */
  const ROAD = [[0.4733,0.9901,0.0143,0.977],[0.4744,0.9854,0.016,0.975],[0.4755,0.9807,0.0173,0.972],[0.4767,0.9761,0.0184,0.969],[0.4779,0.9714,0.0195,0.965],[0.4791,0.9668,0.0205,0.961],[0.4804,0.9622,0.0215,0.957],[0.4816,0.9576,0.0225,0.952],[0.4829,0.9531,0.0234,0.947],[0.4843,0.9485,0.0243,0.942],[0.4856,0.944,0.0251,0.938],[0.487,0.9395,0.0259,0.933],[0.4883,0.935,0.0267,0.928],[0.4897,0.9305,0.0274,0.923],[0.4911,0.926,0.0281,0.918],[0.4924,0.9215,0.0286,0.913],[0.4937,0.9169,0.0292,0.908],[0.4949,0.9123,0.0296,0.903],[0.4961,0.9076,0.03,0.898],[0.4972,0.9029,0.0304,0.893],[0.4982,0.8981,0.0308,0.887],[0.4991,0.8933,0.0311,0.882],[0.5,0.8884,0.0314,0.876],[0.5007,0.8834,0.0317,0.871],[0.5013,0.8784,0.032,0.865],[0.5019,0.8734,0.0323,0.86],[0.5024,0.8684,0.0326,0.855],[0.5028,0.8633,0.0329,0.849],[0.5031,0.8582,0.0331,0.843],[0.5035,0.8531,0.0334,0.838],[0.5038,0.8481,0.0336,0.832],[0.5041,0.843,0.0337,0.826],[0.5044,0.8379,0.0338,0.82],[0.5047,0.8328,0.0338,0.815],[0.505,0.8277,0.0337,0.809],[0.5052,0.8226,0.0336,0.803],[0.5054,0.8175,0.0334,0.798],[0.5055,0.8124,0.0331,0.792],[0.5055,0.8073,0.0327,0.787],[0.5054,0.8021,0.0322,0.781],[0.5051,0.7971,0.0317,0.775],[0.5045,0.792,0.0311,0.769],[0.5038,0.7871,0.0304,0.764],[0.5029,0.7823,0.0297,0.758],[0.5017,0.7776,0.029,0.753],[0.5004,0.773,0.0283,0.748],[0.4989,0.7687,0.0276,0.743],[0.4973,0.7644,0.0269,0.738],[0.4956,0.7603,0.0262,0.733],[0.4938,0.7563,0.0256,0.728],[0.492,0.7524,0.025,0.724],[0.4901,0.7486,0.0244,0.72],[0.4882,0.7447,0.0239,0.715],[0.4863,0.7409,0.0234,0.711],[0.4844,0.7371,0.0229,0.707],[0.4824,0.7334,0.0225,0.702],[0.4804,0.7297,0.0222,0.698],[0.4784,0.7261,0.0218,0.694],[0.4763,0.7225,0.0215,0.69],[0.4742,0.7191,0.0212,0.686],[0.472,0.7159,0.0209,0.682],[0.4698,0.7127,0.0206,0.678],[0.4675,0.7097,0.0203,0.675],[0.4651,0.7068,0.0199,0.672],[0.4627,0.7039,0.0196,0.668],[0.4603,0.7012,0.0192,0.665],[0.4579,0.6984,0.0188,0.662],[0.4555,0.6957,0.0183,0.659],[0.4531,0.693,0.0179,0.656],[0.4507,0.6902,0.0175,0.653],[0.4483,0.6874,0.0171,0.649],[0.4459,0.6846,0.0167,0.646],[0.4435,0.6817,0.0163,0.643],[0.4412,0.6788,0.016,0.639],[0.4388,0.6759,0.0158,0.636],[0.4365,0.673,0.0157,0.633],[0.4341,0.6701,0.0157,0.629],[0.4318,0.6672,0.0158,0.626],[0.4294,0.6643,0.016,0.622],[0.4271,0.6613,0.0164,0.619],[0.4248,0.6582,0.0168,0.615],[0.4225,0.6551,0.0174,0.612],[0.4203,0.6519,0.0181,0.608],[0.4182,0.6485,0.0188,0.604],[0.4161,0.6451,0.0196,0.6],[0.414,0.6415,0.0205,0.595],[0.412,0.6378,0.0214,0.591],[0.4102,0.6339,0.0223,0.586],[0.4084,0.6299,0.0232,0.582],[0.4067,0.6258,0.0241,0.577],[0.4051,0.6215,0.025,0.572],[0.4037,0.6171,0.0259,0.567],[0.4024,0.6125,0.0267,0.561],[0.4012,0.6078,0.0274,0.556],[0.4002,0.6031,0.0281,0.55],[0.3994,0.5982,0.0286,0.544],[0.3989,0.5931,0.029,0.538],[0.3994,0.5881,0.029,0.532],[0.4011,0.584,0.0283,0.528],[0.403,0.5802,0.0276,0.523],[0.4051,0.5766,0.0268,0.519],[0.4072,0.5732,0.026,0.514],[0.4093,0.5698,0.0252,0.51],[0.4115,0.5666,0.0244,0.506],[0.4138,0.5635,0.0236,0.503],[0.4161,0.5604,0.0228,0.499],[0.4184,0.5574,0.0221,0.495],[0.4208,0.5545,0.0215,0.492],[0.4231,0.5516,0.0208,0.488],[0.4255,0.5488,0.0202,0.485],[0.4279,0.5459,0.0195,0.481],[0.4302,0.5431,0.0189,0.478],[0.4326,0.5402,0.0183,0.474],[0.435,0.5374,0.0177,0.471],[0.4374,0.5346,0.017,0.467],[0.4398,0.5318,0.0164,0.464],[0.4422,0.5291,0.0158,0.461],[0.4447,0.5265,0.0152,0.457],[0.4472,0.524,0.0146,0.454],[0.4497,0.5216,0.014,0.451],[0.4523,0.5193,0.0135,0.448],[0.4548,0.5171,0.013,0.446],[0.4574,0.5149,0.0126,0.443],[0.46,0.5129,0.0121,0.44],[0.4627,0.5108,0.0117,0.438],[0.4653,0.5089,0.0113,0.436],[0.468,0.507,0.011,0.433],[0.4706,0.5051,0.0107,0.431],[0.4733,0.5034,0.0104,0.429],[0.476,0.5016,0.0101,0.426],[0.4787,0.4999,0.0099,0.424],[0.4814,0.4983,0.0097,0.422],[0.4841,0.4967,0.0096,0.42],[0.4868,0.4951,0.0094,0.418],[0.4896,0.4936,0.0093,0.416],[0.4923,0.4921,0.0092,0.414],[0.495,0.4906,0.0092,0.413],[0.4978,0.4892,0.0091,0.411],[0.5005,0.4877,0.009,0.409],[0.5032,0.4862,0.009,0.407],[0.506,0.4847,0.0089,0.405],[0.5087,0.4832,0.0088,0.403],[0.5114,0.4817,0.0088,0.401],[0.5141,0.4801,0.0087,0.399],[0.5169,0.4785,0.0086,0.397],[0.5196,0.4769,0.0085,0.395],[0.5223,0.4753,0.0084,0.393],[0.525,0.4736,0.0083,0.391],[0.5277,0.4719,0.0083,0.389],[0.5304,0.4702,0.0082,0.387],[0.5331,0.4685,0.0081,0.385],[0.5358,0.4668,0.008,0.382],[0.5385,0.4651,0.0079,0.38],[0.5412,0.4634,0.0078,0.378],[0.5439,0.4617,0.0078,0.376],[0.5466,0.4601,0.0077,0.373],[0.5493,0.4584,0.0077,0.371],[0.552,0.4568,0.0076,0.369],[0.5547,0.4551,0.0076,0.367],[0.5574,0.4535,0.0075,0.365],[0.5601,0.4519,0.0075,0.363],[0.5628,0.4503,0.0075,0.361],[0.5655,0.4487,0.0075,0.359],[0.5682,0.4471,0.0075,0.357],[0.5709,0.4454,0.0075,0.354],[0.5737,0.4438,0.0074,0.352],[0.5764,0.4422,0.0074,0.35],[0.5791,0.4405,0.0074,0.348],[0.5818,0.4389,0.0074,0.346],[0.5845,0.4373,0.0074,0.344],[0.5872,0.4357,0.0074,0.342],[0.5899,0.4341,0.0074,0.34],[0.5926,0.4325,0.0074,0.338],[0.5954,0.4309,0.0074,0.336],[0.5981,0.4294,0.0074,0.334],[0.6008,0.4278,0.0074,0.332],[0.6035,0.4263,0.0074,0.329],[0.6063,0.4248,0.0074,0.327],[0.609,0.4232,0.0074,0.325],[0.6117,0.4217,0.0074,0.323],[0.6144,0.4201,0.0074,0.321],[0.6171,0.4185,0.0074,0.319],[0.6199,0.4169,0.0075,0.317],[0.6226,0.4154,0.0075,0.315],[0.6253,0.4138,0.0075,0.313],[0.628,0.4122,0.0075,0.311],[0.6307,0.4106,0.0075,0.309],[0.6334,0.4089,0.0075,0.307],[0.6361,0.4073,0.0075,0.305],[0.6389,0.4057,0.0075,0.302],[0.6416,0.4041,0.0075,0.3],[0.6443,0.4025,0.0076,0.298],[0.647,0.4009,0.0076,0.296],[0.6497,0.3993,0.0077,0.294],[0.6524,0.3977,0.0078,0.292],[0.6551,0.396,0.0079,0.29],[0.6578,0.3943,0.008,0.288],[0.6605,0.3926,0.0081,0.286],[0.6632,0.3909,0.0083,0.283],[0.6659,0.389,0.0085,0.281],[0.6685,0.3871,0.0087,0.278],[0.6712,0.3852,0.0089,0.275],[0.6738,0.3831,0.0092,0.272],[0.6764,0.381,0.0094,0.269],[0.6789,0.3787,0.0097,0.266],[0.6815,0.3763,0.01,0.263],[0.684,0.3739,0.0103,0.259],[0.6864,0.3712,0.0105,0.256],[0.6888,0.3684,0.0108,0.252],[0.6911,0.3654,0.0111,0.247],[0.6933,0.3621,0.0113,0.243],[0.6954,0.3587,0.0115,0.238],[0.6974,0.355,0.0116,0.233],[0.6992,0.351,0.0117,0.227],[0.7004,0.3464,0.0115,0.221],[0.6991,0.3421,0.0109,0.215],[0.6969,0.339,0.0103,0.21],[0.6945,0.3362,0.0097,0.206],[0.692,0.3337,0.0092,0.203],[0.6894,0.3314,0.0087,0.2],[0.6868,0.3294,0.0083,0.197],[0.6841,0.3275,0.0079,0.194],[0.6815,0.3256,0.0075,0.191],[0.6788,0.3239,0.0072,0.189],[0.6761,0.3221,0.0069,0.187],[0.6734,0.3205,0.0067,0.184],[0.6707,0.3188,0.0065,0.182],[0.668,0.3172,0.0063,0.18],[0.6653,0.3155,0.0062,0.178],[0.6626,0.3139,0.0061,0.175],[0.6599,0.3121,0.006,0.173],[0.6572,0.3102,0.0059,0.17],[0.6546,0.3081,0.0058,0.167],[0.6521,0.3057,0.0058,0.163],[0.6497,0.3031,0.0057,0.159],[0.6473,0.3001,0.0057,0.155],[0.6452,0.2968,0.0056,0.15],[0.6432,0.293,0.0055,0.144],[0.6421,0.2884,0.0054,0.137],[0.6442,0.2859,0.0052,0.133],[0.6471,0.286,0.005,0.133],[0.6499,0.2865,0.0049,0.134],[0.6528,0.2869,0.0047,0.135],[0.6556,0.2871,0.0046,0.135],[0.6585,0.2869,0.0045,0.135],[0.6613,0.2862,0.0043,0.134],[0.6641,0.2853,0.0042,0.132],[0.6669,0.284,0.0041,0.13],[0.6696,0.2824,0.004,0.128],[0.6723,0.2807,0.004,0.125],[0.675,0.2788,0.0039,0.122],[0.6776,0.2769,0.0038,0.119],[0.6803,0.2749,0.0038,0.116],[0.6829,0.2729,0.0038,0.113],[0.6855,0.271,0.0038,0.11],[0.6882,0.2691,0.0038,0.107],[0.6909,0.2673,0.0038,0.104],[0.6936,0.2656,0.0038,0.101],[0.6963,0.2639,0.0038,0.099],[0.699,0.2622,0.0039,0.096]];
  const RN = ROAD.length;
  const RS = (() => { const a = [0]; for (let i = 1; i < RN; i++) { const dx = (ROAD[i][0] - ROAD[i - 1][0]) * IMG_AR, dy = ROAD[i][1] - ROAD[i - 1][1]; a.push(a[i - 1] + Math.hypot(dx, dy)); } return a.map((v) => v / a[RN - 1]); })();
  const RUNNERS = [
    { ph: .00, sp: .052, L: .16 }, { ph: .27, sp: .047, L: .12 }, { ph: .48, sp: .058, L: .19 },
    { ph: .69, sp: .050, L: .11 }, { ph: .86, sp: .055, L: .15 }
  ];
  const fx = document.createElement('canvas');
  fx.className = 'sx-fx';
  canvas.after(fx);
  const g2 = fx.getContext('2d');
  /* где дорога проходит за минаретами и куполом мечети — свет прячется */
  const occl = new Image(); occl.src = 'assets/hero/silk5-road-vis.png';
  const RX = new Float32Array(RN), RY = new Float32Array(RN), RW = new Float32Array(RN);
  const edge = (s) => clamp(s / .03, 0, 1) * clamp((1 - s) / .05, 0, 1);

  function drawRoad(now, reveal, lead, runAlpha) {
    if (fx.width !== W || fx.height !== H) { fx.width = W; fx.height = H; }
    g2.clearRect(0, 0, W, H);
    const [wx, wy] = windowSize(W, H, cam.z);
    for (let i = 0; i < RN; i++) {
      const p = ROAD[i], k = p[3] - .5;
      RX[i] = ((p[0] - par.x * k - cam.x) / wx + .5) * W;
      RY[i] = ((p[1] - par.y * k - cam.y) / wy + .5) * H;
      RW[i] = Math.max(2, p[2] / wx * W);
    }
    g2.globalCompositeOperation = 'lighter';
    g2.lineCap = 'round'; g2.lineJoin = 'round';
    const tt = now / 1000;
    /* золотая нить вдоль всей дороги, «дышит» */
    const breath = .85 + .15 * Math.sin(tt * 1.1);
    const seg = (i0, i1, width, style) => {
      g2.beginPath(); g2.moveTo(RX[i0], RY[i0]);
      for (let i = i0 + 1; i <= i1; i++) g2.lineTo(RX[i], RY[i]);
      g2.lineWidth = width; g2.strokeStyle = style; g2.stroke();
    };
    const last = Math.min(RN - 1, Math.floor(reveal * (RN - 1)));
    for (let i0 = 0; i0 < last; i0 += 6) {
      const i1 = Math.min(last, i0 + 6), m = (i0 + i1) >> 1, e = edge(RS[m]) * breath;
      seg(i0, i1, RW[m] * 1.3, `rgba(255,170,70,${(.07 * e).toFixed(3)})`);
      seg(i0, i1, Math.max(1, RW[m] * .16), `rgba(255,214,140,${(.30 * e).toFixed(3)})`);
    }
    /* огни с хвостами */
    const trail = (f, L, alpha, bright) => {
      if (alpha <= .01 || f - L > 1 || f < 0) return;
      const a0 = Math.max(0, f - L), a1 = Math.min(1, f);
      let i = 0; while (i < RN - 1 && RS[i + 1] < a0) i++;
      for (; i < RN - 1 && RS[i] < a1; i++) {
        const s = RS[i], q = clamp((s - (f - L)) / L, 0, 1), a = Math.pow(q, 1.7) * alpha * edge(s);
        if (a < .01) continue;
        g2.beginPath(); g2.moveTo(RX[i], RY[i]); g2.lineTo(RX[i + 1], RY[i + 1]);
        g2.lineWidth = RW[i] * (1.15 + bright * .35); g2.strokeStyle = `rgba(255,160,60,${(a * .20).toFixed(3)})`; g2.stroke();
        g2.lineWidth = Math.max(1.2, RW[i] * (.24 + .12 * q)); g2.strokeStyle = `rgba(255,${(205 + 45 * q) | 0},${(120 + 110 * q) | 0},${(a * .95).toFixed(3)})`; g2.stroke();
      }
      /* голова огня */
      if (f <= 1) {
        let j = 0; while (j < RN - 1 && RS[j + 1] < f) j++;
        const x = RX[j], y = RY[j], r = RW[j] * (.85 + bright * .35), a = alpha * edge(RS[j]) * .9;
        const gr = g2.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, `rgba(255,248,225,${a.toFixed(3)})`);
        gr.addColorStop(.35, `rgba(255,200,110,${(a * .45).toFixed(3)})`);
        gr.addColorStop(1, 'rgba(255,160,60,0)');
        g2.fillStyle = gr; g2.beginPath(); g2.arc(x, y, r, 0, Math.PI * 2); g2.fill();
      }
    };
    if (lead >= 0) trail(lead, .22, 1, 1);
    if (runAlpha > .01) RUNNERS.forEach((r) => {
      const f = ((r.ph + tt * r.sp) % 1.3) - .1;
      trail(f, r.L, runAlpha, 0);
    });
    if (occl.complete && occl.naturalWidth) {
      const k = .6 - .5;
      g2.globalCompositeOperation = 'destination-in';
      g2.drawImage(occl, ((0 - par.x * k - cam.x) / wx + .5) * W, ((0 - par.y * k - cam.y) / wy + .5) * H, W / wx, H / wy);
    }
    g2.globalCompositeOperation = 'source-over';
  }

  /* ── запуск ─────────────────────────────────────────── */
  function boot(ctx) {
    const { gl, U } = ctx;
    const src = img.currentSrc || img.src;
    Promise.all([loadImage(src), loadImage('assets/hero/silk4-map-a.png'), loadImage('assets/hero/silk4-map-b.png')]).then(([im, ma, mb]) => {
      texture(gl, 0, im); texture(gl, 1, ma); texture(gl, 2, mb);
      gl.uniform1i(U.uImg, 0); gl.uniform1i(U.uA, 1); gl.uniform1i(U.uB, 2);
      gl.uniform1f(U.uImgAR, IMG_AR);
      glOn = true;
      run(ctx);
    }).catch(() => { introText(); finishIntro(performance.now()); });
  }

  let W = 0, H = 0, visible = true, raf = 0, last = 0, t0 = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, mobileMQ.matches ? 1.5 : 2);
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
        flow = clamp((e - 5.2) / 2.2, 0, 1);
        const [hx, hy] = headPoint(prog);
        const zk = easeIO(clamp((e - .3) / 6.8, 0, 1));
        if (mobileMQ.matches) { camT.x = hx; camT.y = .5; camT.z = lerp(1.12, 1.03, zk); }
        else { camT.x = lerp(hx, .5, zk * zk); camT.y = lerp(hy, .5, zk * zk); camT.z = lerp(1.34, 1.045, zk); }
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
      const tt = now / 1000, amp = mobileMQ.matches ? .010 : .014;
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
      drawRoad(now, introDone ? 1 : prog, introDone ? -1 : prog, flow);

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
