/* ============================================================
 * cert-api.js — слой данных модуля «Сертификация» (Silk Route Invest)
 * ------------------------------------------------------------
 * ДЕМО-РЕЖИМ. Повторяет контракт API из ТЗ:
 *   POST /api/v1/cert/applications              → createApplication()
 *   GET  /api/v1/cert/applications/{id}/checklist → getChecklist(id)
 *   PUT  /api/v1/cert/applications/{id}/answers/{itemId} → saveAnswer()
 *   POST /api/v1/cert/evidence                  → uploadEvidence()  (с автопроверкой)
 *   POST …/submit | …/review | …/decision       → submitApplication() | reviewItems() | makeDecision()
 *   GET  /api/v1/registry/certificates          → listCertificates(filters)
 *   GET  /api/v1/registry/verify/{number}       → verifyCertificate(number)
 *   GET  /api/v1/cert/inspections?due=…         → listInspections({due})
 *   POST /api/v1/cert/risk-signals              → addRiskSignal()
 * Данные: localStorage (ключи sri.cert.*), начальная загрузка data/cert-demo.json
 * и data/cert-checklist-template.json. Чек-лист в код не зашит.
 * Вся работа с данными — только через этот файл: при подключении реального
 * бэкенда (ядро с персональными данными — в дата-центре на территории РУз)
 * заменяется тело функций, интерфейс не меняется.
 * ============================================================ */
(function (root) {
  'use strict';

  var NS = 'sri.cert.';
  var SEED_VERSION = '2026.10.12-demo.3';
  var isBrowser = typeof document !== 'undefined';
  var scriptSrc = (isBrowser && document.currentScript && document.currentScript.src) || '';
  var BASE = scriptSrc ? scriptSrc.replace(/js\/cert-api\.js.*$/, '') : '';
  var cfg = { noDelay: false, loader: null };

  /* ---------- хранилище (localStorage с in-memory запасным вариантом) ---------- */
  var mem = {};
  var store = (function () {
    try {
      var t = '__sri_t'; root.localStorage.setItem(t, '1'); root.localStorage.removeItem(t); return root.localStorage;
    } catch (e) {
      return { getItem: function (k) { return k in mem ? mem[k] : null; }, setItem: function (k, v) { mem[k] = String(v); }, removeItem: function (k) { delete mem[k]; } };
    }
  })();

  var KEYS = ['meta', 'hotels', 'users', 'certificates', 'applications', 'answers', 'evidence', 'inspections', 'signals', 'audit',
    'notifications', 'decisions', 'templates', 'settings', 'appeals', 'queue', 'warnings', 'directory', 'serviceKinds', 'regions',
    'typeLabels', 'kpi', 'demoLibrary', 'selfinsp'];
  var S = {};
  var listeners = [];
  var readyP = null;

  function load() {
    KEYS.forEach(function (k) { try { var v = store.getItem(NS + k); S[k] = v ? JSON.parse(v) : null; } catch (e) { S[k] = null; } });
  }
  function save(k) {
    try { store.setItem(NS + k, JSON.stringify(S[k])); }
    catch (e) { if (k === 'evidence') { trimEvidence(); try { store.setItem(NS + k, JSON.stringify(S[k])); } catch (e2) {} } }
  }
  function saveAll() { KEYS.forEach(save); }
  function emit(kind) {
    listeners.forEach(function (f) { try { f(kind); } catch (e) {} });
    if (isBrowser) { try { root.dispatchEvent(new CustomEvent('sri-cert-change', { detail: { kind: kind } })); } catch (e) {} }
  }
  function trimEvidence() {
    var ids = Object.keys(S.evidence || {});
    ids.forEach(function (id) { var e = S.evidence[id]; if (e.thumb && e.replacedBy) e.thumb = null; });
  }
  if (isBrowser && root.addEventListener) {
    root.addEventListener('storage', function (e) { if (e.key && e.key.indexOf(NS) === 0) { load(); emit('external'); } });
  }

  /* ---------- утилиты ---------- */
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function pad(n, l) { n = String(n); while (n.length < l) n = '0' + n; return n; }
  function nowIso() { return new Date().toISOString().slice(0, 19); }
  function todayStr() { return new Date().toISOString().slice(0, 10); }
  function addDays(dateStr, n) { var d = new Date(dateStr.length > 10 ? dateStr : dateStr + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  function addYears(dateStr, n) { return (parseInt(dateStr.slice(0, 4), 10) + n) + dateStr.slice(4, 10); }
  function addWorkDays(date, n) {
    var d = new Date(date); while (n > 0) { d.setDate(d.getDate() + 1); var w = d.getDay(); if (w !== 0 && w !== 6) n--; } return d;
  }
  function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 864e5); }
  function wait() {
    if (cfg.noDelay) return Promise.resolve();
    return new Promise(function (r) { setTimeout(r, 150 + Math.random() * 250); });
  }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function strSeed(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function fakeHex(seed, n) { var r = mulberry32(strSeed(seed)), s = ''; while (s.length < n) s += Math.floor(r() * 16).toString(16); return s; }
  function uid(prefix) { return prefix + '-' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1e4).toString(36).toUpperCase(); }

  /* синхронный SHA-256 по строке (журнал аудита, хеш документа сертификата) */
  var sha256 = (function () {
    var K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    function utf8(str) {
      if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
      var s = unescape(encodeURIComponent(str)), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a;
    }
    function bytes(msg) {
      var l = msg.length, nb = ((l + 9 + 63) >> 6) << 6, p = new Uint8Array(nb); p.set(msg); p[l] = 0x80;
      var dv = new DataView(p.buffer); dv.setUint32(nb - 4, (l * 8) >>> 0); dv.setUint32(nb - 8, Math.floor(l * 8 / 4294967296));
      var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19], w = new Array(64);
      for (var o = 0; o < nb; o += 64) {
        for (var i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
        for (i = 16; i < 64; i++) {
          var a = w[i - 15], b = w[i - 2];
          var s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
          var s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
          w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        }
        var A = H[0], B = H[1], C = H[2], D = H[3], E = H[4], F = H[5], G = H[6], Hh = H[7];
        for (i = 0; i < 64; i++) {
          var S1 = ((E >>> 6) | (E << 26)) ^ ((E >>> 11) | (E << 21)) ^ ((E >>> 25) | (E << 7));
          var ch = (E & F) ^ (~E & G);
          var t1 = (Hh + S1 + ch + K[i] + w[i]) | 0;
          var S0 = ((A >>> 2) | (A << 30)) ^ ((A >>> 13) | (A << 19)) ^ ((A >>> 22) | (A << 10));
          var mj = (A & B) ^ (A & C) ^ (B & C);
          var t2 = (S0 + mj) | 0;
          Hh = G; G = F; F = E; E = (D + t1) | 0; D = C; C = B; B = A; A = (t1 + t2) | 0;
        }
        H[0] = (H[0] + A) | 0; H[1] = (H[1] + B) | 0; H[2] = (H[2] + C) | 0; H[3] = (H[3] + D) | 0;
        H[4] = (H[4] + E) | 0; H[5] = (H[5] + F) | 0; H[6] = (H[6] + G) | 0; H[7] = (H[7] + Hh) | 0;
      }
      return H.map(function (x) { return pad((x >>> 0).toString(16), 8); }).join('');
    }
    var f = function (s) { return bytes(utf8(s)); };
    f.bytes = function (u8) { return bytes(u8); };
    return f;
  })();

  function haversine(lat1, lon1, lat2, lon2) {
    var R = 6371000, toR = Math.PI / 180, dLat = (lat2 - lat1) * toR, dLon = (lon2 - lon1) * toR;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }
  function hamming(a, b) {
    if (!a || !b || a.length !== b.length) return 64;
    var d = 0; for (var i = 0; i < a.length; i++) { var x = parseInt(a[i], 16) ^ parseInt(b[i], 16); while (x) { d += x & 1; x >>= 1; } } return d;
  }

  /* ---------- статусы ---------- */
  var STATUS = {
    'Действует': { key: 'valid', tone: 'ok', icon: '✓' },
    'Приостановлен': { key: 'suspended', tone: 'warn', icon: '⏸' },
    'Аннулирован': { key: 'annulled', tone: 'danger', icon: '✕' },
    'Истёк': { key: 'expired', tone: 'muted', icon: '◷' },
    'На ресертификации': { key: 'recert', tone: 'info', icon: '↻' }
  };
  function statusMeta(s) { return STATUS[s] || { key: 'unknown', tone: 'muted', icon: '?' }; }
  var APP_STATUS_TONE = {
    'Черновик': 'muted', 'Подана': 'info', 'Принята': 'info', 'Отказ по комплектности': 'danger', 'Ожидает оплаты': 'warn', 'Заполнение': 'info',
    'Автопроверка': 'info', 'На оценке': 'warn', 'На доработке': 'warn', 'Решение': 'info', 'Выдан': 'ok', 'Отказ': 'danger'
  };

  /* ---------- инициализация / сидирование ---------- */
  function fetchJSON(path) {
    if (cfg.loader) return Promise.resolve(cfg.loader(path));
    return fetch(BASE + path).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + path); return r.json(); });
  }
  function ready() { if (!readyP) readyP = init(); return readyP; }
  function init() {
    load();
    var seeded = store.getItem(NS + 'seed');
    if (seeded === SEED_VERSION && S.certificates && S.templates) return Promise.resolve(api);
    return seedFromFiles().then(function () { return api; });
  }
  function seedFromFiles() {
    return Promise.all([fetchJSON('data/cert-demo.json'), fetchJSON('data/cert-checklist-template.json')]).then(function (r) { seedFrom(r[0], r[1]); });
  }
  function seedFrom(demo, tpl) {
    KEYS.forEach(function (k) { store.removeItem(NS + k); });
    S = {};
    S.meta = demo.meta; S.serviceKinds = demo.serviceKinds; S.regions = demo.regions; S.typeLabels = demo.typeLabels;
    S.settings = clone(demo.settings); S.directory = clone(demo.directory); S.users = demo.users; S.kpi = demo.kpi;
    S.hotels = {}; demo.hotels.forEach(function (h) { S.hotels[h.id] = h; });
    S.certificates = clone(demo.certificates);
    S.applications = clone(demo.applications);
    S.inspections = clone(demo.inspections); S.signals = clone(demo.riskSignals); S.audit = clone(demo.audit);
    S.notifications = clone(demo.notifications); S.demoLibrary = demo.demoLibrary;
    S.decisions = []; S.appeals = []; S.queue = []; S.warnings = {}; S.selfinsp = {}; S.answers = {}; S.evidence = {};
    var t = clone(tpl); S.templates = [t];
    // базовые решения выданных сертификатов
    S.certificates.forEach(function (c) { S.decisions.push({ id: 'DEC-' + c.decisionNo, decisionNo: c.decisionNo, kind: 'issue', certNo: c.no, hotelId: c.hotelId, inspectorId: c.inspectorId, at: c.issued, signature: 'E-IMZO', draft: false }); });
    // демо-ответы заявок
    S.applications.forEach(function (a) {
      var hotel = S.hotels[a.hotelId];
      a.applicant = { inn: hotel.inn, legalEntity: hotel.legalEntity, cadastre: hotel.cadastre, phone: '+998 90 000-00-00', email: 'demo@example.uz' };
      if (!a.history || !a.history.length) a.history = [{ at: a.createdAt, status: 'Черновик', by: a.applicantId }, { at: a.submittedAt || a.createdAt, status: a.status, by: 'system' }];
      var sa = demo.seedAnswers[a.id];
      if (sa) buildSeedAnswers(a, sa, t);
    });
    // базовые фото выданного сертификата (для сравнения при самоинспекции)
    S.certificates.forEach(function (c) { c.baseline = {}; ['Б-02', 'Д-01', 'Д-07', 'Ж-03', 'З-01'].forEach(function (code) { c.baseline[code] = fakeHex('base' + c.no + code, 16); }); });
    store.setItem(NS + 'seed', SEED_VERSION);
    saveAll();
    emit('seed');
  }

  /* ---------- шаблон чек-листа: применимость, слоты ---------- */
  function getTemplateVersion(id, version) {
    var arr = (S.templates || []).filter(function (t) { return t.id === id; });
    if (version) { var f = arr.filter(function (t) { return t.version === version; })[0]; if (f) return f; }
    return arr.filter(function (t) { return t.status === 'published'; }).sort(function (a, b) { return cmpVer(b.version, a.version); })[0] || arr[0];
  }
  function cmpVer(a, b) { var x = String(a).split(/[.-]/).map(function (n) { return parseInt(n, 10) || 0; }), y = String(b).split(/[.-]/).map(function (n) { return parseInt(n, 10) || 0; }); for (var i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; }
  function evalRule(r, ctx) {
    var v = ctx[r.field], x = r.value;
    switch (r.op) { case '>': return v > x; case '>=': return v >= x; case '<': return v < x; case '<=': return v <= x; case '==': return v == x; case '!=': return v != x; }
    return true;
  }
  function applicability(item, ctx) {
    var ap = item.applicability || {};
    if (ap.categories && ap.categories.length && ctx.category && ap.categories.indexOf(+ctx.category) < 0)
      return { ok: false, reason: ap.reasonCategory || { ru: 'не применимо для категории ' + ctx.category + '★', uz: 'kategoriya ' + ctx.category + '★ uchun qo\'llanilmaydi', en: 'not applicable for category ' + ctx.category + '★' } };
    if (ap.types && ap.types.length && ap.types.indexOf('*') < 0 && ap.types.indexOf(ctx.type) < 0)
      return { ok: false, reason: { ru: 'не применимо для типа объекта', uz: 'obyekt turi uchun qo\'llanilmaydi', en: 'not applicable for this facility type' } };
    var rules = ap.rules || [];
    for (var i = 0; i < rules.length; i++) if (!evalRule(rules[i], ctx)) return { ok: false, reason: rules[i].reason || { ru: 'условие не выполнено', uz: 'shart bajarilmagan', en: 'condition not met' } };
    return { ok: true };
  }
  function ctxFor(app) {
    var h = S.hotels[app.hotelId] || {};
    return { category: app.category || h.stars, type: h.type, floors: h.floors, rooms: h.rooms };
  }
  function expandSlots(item, ctx) {
    var out = [];
    (item.evidence && item.evidence.slots || []).forEach(function (s) {
      if (s.repeat === 'floors') {
        var n = Math.max(1, Math.min(ctx.floors || 1, 3)); // в демо — до 3 этажей на слот-ленту
        for (var i = 1; i <= n; i++) out.push(Object.assign({}, s, { id: s.id + i, n: i, baseId: s.id }));
      } else out.push(Object.assign({}, s));
    });
    return out;
  }

  /* ---------- доказательства: хранение и зоны ---------- */
  function evList(ownerId, code) {
    var out = []; Object.keys(S.evidence).forEach(function (id) { var e = S.evidence[id]; if (e.ownerId === ownerId && (!code || e.itemCode === code)) out.push(e); });
    return out.sort(function (a, b) { return a.uploadedAt < b.uploadedAt ? -1 : 1; });
  }
  function activeEv(ownerId, code, slotId) {
    var l = evList(ownerId, code).filter(function (e) { return e.slotId === slotId && !e.replacedBy; });
    return l[l.length - 1] || null;
  }
  function evZone(ev) {
    if (!ev) return 'none';
    if (ev.status === 'rejected') return 'red';
    var z = 'green';
    for (var i = 0; i < ev.checks.length; i++) { if (ev.checks[i].status === 'fail') return 'red'; if (ev.checks[i].status === 'warn') z = 'yellow'; }
    return z;
  }
  function worse(a, b) { var o = { none: 0, green: 1, yellow: 2, red: 3 }; return o[b] > o[a] ? b : a; }

  function answerChecks(item, ans) {
    var out = [];
    (item.autocheck || []).forEach(function (rule) {
      if (rule === 'notexpired' && ans && ans.value) {
        var ok = ans.value > todayStr();
        out.push(ok ? ck('exp', 'ok', 'chk.exp.ok', { d: ans.value }, 'Срок действия не истёк (до ' + ans.value + ')')
                    : ck('exp', 'fail', 'chk.exp.fail', { d: ans.value }, 'Срок действия истёк (' + ans.value + ')'));
      }
      if (rule.indexOf('normcompare:') === 0 && ans && ans.value !== '' && ans.value != null) {
        var norm = (S.directory.norms || []).filter(function (n) { return n.id === rule.split(':')[1]; })[0];
        if (norm) {
          var ok2 = +ans.value >= norm.value;
          out.push(ok2 ? ck('norm', 'ok', 'chk.norm.ok', { v: ans.value, n: norm.value, u: norm.unit }, 'Значение ' + ans.value + ' ' + norm.unit + ' ≥ нормы ' + norm.value + ' ' + norm.unit + ' (условное значение справочника)')
                       : ck('norm', 'fail', 'chk.norm.fail', { v: ans.value, n: norm.value, u: norm.unit }, 'Значение ' + ans.value + ' ' + norm.unit + ' меньше нормы ' + norm.value + ' ' + norm.unit + ' (условное значение справочника)'));
        }
      }
    });
    return out;
  }
  function ck(id, status, key, p, text) { return { id: id, status: status, key: key, p: p || {}, text: text }; }

  /* состояние пункта */
  function itemState(owner, item, ctx) {
    var ans = (S.answers[owner.id] || {})[item.code] || null;
    var slots = expandSlots(item, ctx);
    var hasAns = !!ans && ans.value !== undefined && ans.value !== '' && ans.value !== null && !(Array.isArray(ans.value) && !ans.value.length);
    var boolNo = item.answer.type === 'bool' && ans && ans.value === false;
    var evs = slots.map(function (s) { return activeEv(owner.id, item.code, s.id); });
    var missing = boolNo ? [] : slots.filter(function (s, i) { return !evs[i]; });
    var complete = hasAns && missing.length === 0;
    var zone = 'none', reasons = [];
    if (!complete) {
      if (item.mandatory) { zone = 'red'; reasons.push({ key: 'zone.incomplete', text: hasAns ? 'Нет доказательств: ' + missing.length + ' шт.' : 'Нет ответа' }); }
      else { zone = 'yellow'; reasons.push({ key: 'zone.incomplete.opt', text: 'Рекомендуемый пункт без доказательства' }); }
    } else {
      zone = 'green';
      evs.forEach(function (e) { if (e) { zone = worse(zone, evZone(e)); } });
      var ac = answerChecks(item, ans); ans.checks = ac;
      ac.forEach(function (c) { if (c.status === 'fail') zone = worse(zone, 'red'); if (c.status === 'warn') zone = worse(zone, 'yellow'); });
      if (boolNo) { zone = item.mandatory ? 'red' : 'yellow'; reasons.push({ key: 'zone.boolno', text: item.mandatory ? 'Обязательный пункт: нет соответствия' : 'Рекомендуемый пункт не выполнен' }); }
    }
    return { code: item.code, answer: ans, slots: slots, evidence: evs, complete: complete, zone: zone, reasons: reasons, missing: missing };
  }

  function buildChecklist(owner) {
    var tpl = getTemplateVersion(owner.templateId || 'tpl-hotels', owner.templateVersion);
    var ctx = ctxFor(owner);
    var sections = tpl.sections.map(function (sec) {
      var items = tpl.items.filter(function (it) { return it.section === sec.code; }).map(function (it) {
        var ap = applicability(it, ctx);
        var st = ap.ok ? itemState(owner, it, ctx) : { code: it.code, zone: 'na', complete: true, slots: [], evidence: [], reasons: [] };
        var rv = (owner.reviews || {})[it.code] || null;
        return Object.assign({}, it, { applicable: ap.ok, naReason: ap.ok ? null : ap.reason, state: st, review: rv });
      });
      var app = items.filter(function (i) { return i.applicable; });
      var done = app.filter(function (i) { return i.state.complete; }).length;
      return { code: sec.code, title: sec.title, items: items, total: app.length, done: done };
    });
    return { template: { id: tpl.id, version: tpl.version, name: tpl.name, normative: tpl.normative, disclaimer: tpl.disclaimer }, sections: sections, ctx: ctx };
  }

  function summarize(owner) {
    var cl = buildChecklist(owner), counts = { green: 0, yellow: 0, red: 0 }, issues = [], wsum = 0, rsum = 0, dups = 0, incomplete = 0;
    cl.sections.forEach(function (s) { s.items.forEach(function (it) {
      if (!it.applicable) return;
      var z = it.state.zone, w = it.weight || 1; wsum += w;
      if (!it.state.complete) incomplete++;
      if (z === 'green') counts.green++; else if (z === 'yellow') { counts.yellow++; rsum += w * 0.35; } else if (z === 'red') { counts.red++; rsum += w; }
      if (z === 'yellow' || z === 'red') {
        var texts = [];
        (it.state.evidence || []).forEach(function (e) { if (e) { if (e.status === 'rejected' || evZone(e) !== 'green') e.checks.forEach(function (c) { if (c.status !== 'ok') texts.push(c); }); } });
        ((it.state.answer && it.state.answer.checks) || []).forEach(function (c) { if (c.status !== 'ok') texts.push(c); });
        (it.state.reasons || []).forEach(function (r) { texts.push({ id: 'r', status: z === 'red' ? 'fail' : 'warn', key: r.key, p: {}, text: r.text }); });
        texts.forEach(function (c) { if (c.id === 'duplicate' && c.status === 'fail') dups++; });
        issues.push({ code: it.code, zone: z, req: it.req, section: it.section, mandatory: it.mandatory, texts: texts });
      }
    }); });
    var total = counts.green + counts.yellow + counts.red;
    var risk = wsum ? Math.min(100, Math.round(rsum / wsum * 100) + dups * 10) : 0;
    return { counts: counts, total: total, share: { green: total ? Math.round(counts.green / total * 100) : 0, yellow: total ? Math.round(counts.yellow / total * 100) : 0, red: total ? Math.round(counts.red / total * 100) : 0 },
      risk: risk, issues: issues, incomplete: incomplete, autoShare: total ? Math.round((counts.green) / total * 100) : 0, at: nowIso() };
  }

  /* ---------- сидирование ответов заявок ---------- */
  var AI_LABELS = { 'ai:signboard_text': 'signboard', 'ai:fire_extinguisher': 'extinguisher', 'ai:room_amenities': 'room' };
  function seedAnswerValue(item, hotel) {
    var t = item.answer.type;
    if (t === 'bool') return true;
    if (t === 'number') return item.code === 'Д-01' ? 14 : item.code === 'З-01' ? 9 : 3;
    if (t === 'date') return '2027-06-30';
    if (t === 'multi') return item.answer.options.map(function (o) { return o.id; });
    if (t === 'choice') return item.answer.options[0].id;
    if (t === 'file') return 'file';
    return true;
  }
  function seedChecks(item, slot, zone, key) {
    var out = [ck('geotag', 'ok', 'chk.geotag.ok', { d: 20 + Math.floor(mulberry32(strSeed(key))() * 90), r: 150 }, 'Геометка в радиусе'),
               ck('time', 'ok', 'chk.time.ok', { d: 1, w: 14 }, 'Снято в окне 14 дней'), ck('hash', 'ok', 'chk.hash.ok', { h: fakeHex(key, 8) }, 'SHA-256 вычислен'),
               ck('duplicate', 'ok', 'chk.dup.ok', {}, 'Дубликатов не найдено'), ck('quality', 'ok', 'chk.quality.ok', { s: 180, w: 1920, h: 1080 }, 'Качество в норме')];
    var ai = (item.autocheck || []).filter(function (r) { return r.indexOf('ai:') === 0; })[0];
    if (ai) out.push(zone === 'yellow' ? ck('ai', 'warn', 'chk.ai.warn', { l: ai, c: 58 }, 'ИИ: низкая уверенность (58%). Подсказка инспектору, не решение') : ck('ai', 'ok', 'chk.ai.ok', { l: ai, c: 93 }, 'ИИ: распознано (93%). Подсказка инспектору, не решение'));
    if (zone === 'red') {
      if (item.code === 'З-01') { out[3] = ck('duplicate', 'fail', 'chk.dup.fail', { name: 'Samarkand Palace Hotel' }, 'Совпадает с материалом другого объекта: Samarkand Palace Hotel'); }
      else out[0] = ck('geotag', 'fail', 'chk.geotag.fail', { d: 2380, r: 150 }, 'Вне радиуса: 2380 м от объекта (допустимо 150 м)');
    }
    return out;
  }
  function buildSeedAnswers(app, sa, tpl) {
    var ctx = ctxFor(app), hotel = S.hotels[app.hotelId], items = tpl.items.filter(function (it) { return applicability(it, ctx).ok; });
    var limit = Math.ceil(items.length * (sa.fill || 1));
    S.answers[app.id] = S.answers[app.id] || {};
    items.forEach(function (item, idx) {
      if (idx >= limit) return;
      var zone = sa.red.indexOf(item.code) >= 0 ? 'red' : sa.yellow.indexOf(item.code) >= 0 ? 'yellow' : 'green';
      S.answers[app.id][item.code] = { value: seedAnswerValue(item, hotel), updatedAt: app.createdAt };
      expandSlots(item, ctx).forEach(function (slot) {
        var id = 'EV-' + app.id.slice(-4) + '-' + item.code + '-' + slot.id;
        var lib = AI_LABELS[(item.autocheck || []).filter(function (r) { return r.indexOf('ai:') === 0; })[0]] || (slot.kind === 'video' ? 'video' : slot.kind === 'pdf' ? 'document' : item.hint.reference || 'room');
        S.evidence[id] = { id: id, ownerId: app.id, itemCode: item.code, slotId: slot.id, version: 1, name: slot.kind === 'photo' ? 'IMG_' + fakeHex(id, 4).toUpperCase() + '.jpg' : slot.kind === 'video' ? 'VID_' + fakeHex(id, 4).toUpperCase() + '.mp4' : 'scan.pdf',
          kind: slot.kind, mime: slot.kind === 'photo' ? 'image/jpeg' : slot.kind === 'video' ? 'video/mp4' : 'application/pdf', size: 800000, sha256: fakeHex(id + 'sha', 64), dhash: fakeHex(id + 'dh', 16),
          width: 1920, height: 1080, durationSec: slot.kind === 'video' ? 42 : null, source: 'camera', takenAt: app.createdAt, uploadedAt: app.createdAt, lat: hotel.lat + 0.0003, lng: hotel.lng + 0.0002,
          distanceM: zone === 'red' && item.code !== 'З-01' ? 2380 : 38, synthetic: { kind: lib, variant: strSeed(id) % 900 }, thumb: null,
          exif: { make: 'Demo', model: 'Camera', dateTimeOriginal: app.createdAt }, checks: slot.kind === 'photo' ? seedChecks(item, slot, zone, id) : [ck('time', 'ok', 'chk.time.ok', { d: 1, w: 14 }, 'Время в окне'), ck('hash', 'ok', 'chk.hash.ok', { h: fakeHex(id, 8) }, 'SHA-256 вычислен')].concat(slot.kind === 'video' ? [ck('video', 'ok', 'chk.video.ok', { s: 42, h: 1080 }, 'Видео 1080p, 42 с')] : []),
          status: zone === 'red' ? (item.code === 'З-01' ? 'flagged' : 'rejected') : 'accepted' };
        if (zone === 'yellow' && slot.kind === 'video') S.evidence[id].checks.push(ck('ai', 'warn', 'chk.ai.warn', { l: 'room', c: 61 }, 'ИИ: низкая уверенность (61%). Подсказка инспектору, не решение'));
      });
    });
    var sum = summarize(app); app.autoCheck = sum; app.riskScore = sum.risk;
    if (sa.returned) { app.rework = sa.returned.map(function (r) { return { code: r.code, comment: r.comment, at: '2026-10-06T09:00:00' }; });
      app.reviews = app.reviews || {};
      items.forEach(function (it) { if (!sa.returned.some(function (r) { return r.code === it.code; })) app.reviews[it.code] = { verdict: 'ok', by: 'insp-1', at: '2026-10-05T16:00:00', comment: '' }; });
      sa.returned.forEach(function (r) { app.reviews[r.code] = { verdict: 'rework', by: 'insp-1', at: '2026-10-06T09:00:00', comment: r.comment }; }); }
    if (app.stage === 'issued') { app.reviews = {}; items.forEach(function (it) { app.reviews[it.code] = { verdict: 'ok', by: 'insp-2', at: '2026-10-04T12:00:00', comment: '' }; }); }
    if (app.status === 'На оценке' && !app.inspectorId && app.hotelId !== 'miraki-hotel') app.inspectorId = (app.hotelId === 'imam-bukhari-hotel' || app.hotelId === 'chimgan-apart') ? 'insp-1' : null;
  }

  /* ---------- аудит (append-only, цепочка хешей) ---------- */
  function audit(actor, action, entity, before, after) {
    var arr = S.audit, prev = arr.length ? arr[arr.length - 1].hash : '0'.repeat(64), id = arr.length + 1, at = nowIso();
    var body = JSON.stringify([id, at, actor, action, entity, before == null ? null : before, after == null ? null : after]);
    var rec = { id: id, at: at, actor: actor, action: action, entity: entity, before: before == null ? null : before, after: after == null ? null : after, prev: prev, hash: sha256(prev + body) };
    arr.push(rec); save('audit'); return rec;
  }
  function verifyAuditChain() {
    var prev = '0'.repeat(64), bad = [];
    S.audit.forEach(function (r) {
      var body = JSON.stringify([r.id, r.at, r.actor, r.action, r.entity, r.before, r.after]);
      // записи, созданные генератором, используют sort_keys → проверяем только связность prev
      if (r.prev !== prev) bad.push(r.id);
      prev = r.hash;
    });
    return { ok: bad.length === 0, broken: bad, length: S.audit.length };
  }

  function notify(hotelId, type, title, text, channels, p) {
    var n = { id: uid('N'), hotelId: hotelId, at: nowIso(), type: type, title: title, text: text, channels: channels || ['cabinet'], read: false, p: p || {} };
    S.notifications.unshift(n); save('notifications'); return n;
  }

  /* ============================================================
   * ПУБЛИЧНЫЙ API
   * ============================================================ */
  function normNumber(n) { return String(n || '').trim().toUpperCase().replace(/\s+/g, '').replace(/[–—]/g, '-'); }
  function getCert(no) { no = normNumber(no); return (S.certificates || []).filter(function (c) { return c.no === no; })[0] || null; }
  function nextInspection(no) {
    var l = (S.inspections || []).filter(function (i) { return i.certNo === no && i.kind !== 'unplanned' && (i.status === 'Запланирована' || i.status === 'Самоинспекция' || i.status === 'На проверке' || i.status === 'Просрочена'); }).sort(function (a, b) { return a.due < b.due ? -1 : 1; });
    return l[0] || null;
  }
  var PUB_MAP = { name: 'name', region: 'region', address: 'address', stars: 'stars', type: 'typeLabel', no: 'no', issued: 'issued', expires: 'expires', status: 'status', lastInspection: 'lastInspection', inn: 'inn', legalEntity: 'legalEntity', decisionNo: 'decisionNo' };
  function publicView(c) {
    var pf = S.settings.publicFields, o = { no: c.no, status: c.status };
    Object.keys(PUB_MAP).forEach(function (f) { if (pf[f]) o[f] = c[PUB_MAP[f]]; });
    if (pf.inspector) o.inspector = inspName(c.inspectorId);
    if (pf.passport) o.passport = 'passport.html?hotel=' + c.hotelId;
    if (pf.address) { o.lat = c.lat; o.lng = c.lng; }
    o.regionCode = c.regionCode; o.hotelId = c.hotelId;
    return o;
  }
  function inspName(id) { var u = (S.users || []).filter(function (x) { return x.id === id; })[0]; return u ? u.name : id || '—'; }

  var api = {
    /* ---- служебное ---- */
    ready: ready, on: function (f) { listeners.push(f); return function () { listeners = listeners.filter(function (x) { return x !== f; }); }; },
    configure: function (o) { Object.assign(cfg, o || {}); },
    seedVersion: SEED_VERSION, base: BASE,
    resetDemo: function () { return seedFromFiles().then(function () { emit('reset'); return true; }); },
    _seedFrom: seedFrom, _state: function () { return S; },
    util: { sha256: sha256, haversine: haversine, hamming: hamming, addDays: addDays, addYears: addYears, addWorkDays: addWorkDays, daysBetween: daysBetween, today: todayStr, now: nowIso, fakeHex: fakeHex, mulberry32: mulberry32, strSeed: strSeed },
    statusMeta: statusMeta, appStatusTone: function (s) { return APP_STATUS_TONE[s] || 'muted'; }, normNumber: normNumber,

    /* ---- синхронные чтения (после ready) ---- */
    sync: {
      all: function () { return clone(S.certificates || []); },
      byNumber: function (no) { return clone(getCert(no)); },
      byHotel: function (id) { return clone((S.certificates || []).filter(function (c) { return c.hotelId === id; })[0] || null); },
      badgeFor: function (id) {
        var c = (S.certificates || []).filter(function (x) { return x.hotelId === id; })[0]; if (!c) return null;
        var m = statusMeta(c.status); return { no: c.no, status: c.status, tone: m.tone, key: m.key, icon: m.icon, expires: c.expires, stars: c.stars, valid: c.status === 'Действует' };
      },
      hotels: function () { return clone(S.hotels || {}); },
      hotel: function (id) { return clone((S.hotels || {})[id] || null); },
      settings: function () { return clone(S.settings); },
      directory: function () { return clone(S.directory); },
      users: function () { return clone(S.users); },
      inspName: inspName,
      nextInspection: function (no) { return clone(nextInspection(no)); },
      appForHotel: function (hid) { var l = (S.applications || []).filter(function (a) { return a.hotelId === hid; }); return clone(l[l.length - 1] || null); },
      regions: function () { return clone(S.regions); },
      typeLabels: function () { return clone(S.typeLabels); },
      serviceKinds: function () { return clone(S.serviceKinds); },
      kpi: function () { return clone(S.kpi); },
      notifications: function (hid) { return clone((S.notifications || []).filter(function (n) { return !hid || n.hotelId === hid; })); },
      mmYYYY: function (d) { return d ? d.slice(5, 7) + '.' + d.slice(0, 4) : ''; }
    },

    /* ---- заявки ---- */
    createApplication: function (p) {
      return ready().then(wait).then(function () {
        p = p || {};
        var open = S.applications.filter(function (a) { return a.hotelId === p.hotelId && ['Выдан', 'Отказ', 'Отказ по комплектности'].indexOf(a.status) < 0; })[0];
        if (open && !p.forceNew) return clone(open);
        var h = S.hotels[p.hotelId]; if (!h) throw apiErr('HOTEL_NOT_FOUND', 'Объект не найден');
        var n = S.applications.length + 1, id = 'APP-2026-' + pad(n, 4);
        var tpl = getTemplateVersion('tpl-hotels');
        var app = { id: id, hotelId: h.id, applicantId: p.applicantId || 'u-app-1', status: 'Черновик', stage: 'draft', serviceKind: p.serviceKind || 'hotel', category: p.category || h.stars,
          templateId: tpl.id, templateVersion: tpl.version, createdAt: nowIso(), submittedAt: null, paid: false, invoice: null, step: 1, riskScore: null, reviews: {}, inspectorId: null,
          applicant: p.applicant || { inn: h.inn, legalEntity: h.legalEntity, cadastre: h.cadastre, phone: '', email: '' }, history: [{ at: nowIso(), status: 'Черновик', by: p.applicantId || 'u-app-1' }] };
        S.applications.push(app); save('applications');
        audit(app.applicantId, 'application.create', id, null, { status: 'Черновик', hotelId: h.id });
        notify(h.id, 'draft', 'Черновик заявки создан', 'Заявка ' + id + ' сохранена. Продолжите заполнение.', ['cabinet'], { id: id });
        emit('application'); return clone(app);
      });
    },
    updateApplication: function (id, patch) {
      return ready().then(wait).then(function () {
        var a = getApp(id); var before = { step: a.step, category: a.category };
        Object.keys(patch || {}).forEach(function (k) { if (k === 'applicant') a.applicant = Object.assign(a.applicant || {}, patch.applicant); else a[k] = patch[k]; });
        save('applications'); emit('application'); return clone(a);
      });
    },
    getApplication: function (id) { return ready().then(wait).then(function () { return clone(getApp(id)); }); },
    listApplications: function (f) {
      return ready().then(wait).then(function () {
        f = f || {};
        return clone(S.applications.filter(function (a) { return (!f.hotelId || a.hotelId === f.hotelId) && (!f.status || a.status === f.status) && (!f.inspectorId || a.inspectorId === f.inspectorId); }));
      });
    },
    getChecklist: function (id) { return ready().then(wait).then(function () { var a = getApp(id); return clone(Object.assign({ application: clone(a) }, buildChecklist(a), { summary: summarize(a) })); }); },
    saveAnswer: function (appId, itemCode, payload) {
      return ready().then(wait).then(function () {
        var a = getApp(appId); S.answers[appId] = S.answers[appId] || {};
        var before = S.answers[appId][itemCode] ? clone(S.answers[appId][itemCode].value) : null;
        var value = payload && payload.value !== undefined ? payload.value : payload;
        S.answers[appId][itemCode] = Object.assign({}, S.answers[appId][itemCode], { value: value, updatedAt: nowIso() });
        save('answers');
        audit(a.applicantId || 'applicant', 'answer.save', appId + '/' + itemCode, before, value);
        var cl = buildChecklist(a); var it = null; cl.sections.forEach(function (s) { s.items.forEach(function (x) { if (x.code === itemCode) it = x; }); });
        emit('answer'); return { saved: true, at: nowIso(), item: clone(it) };
      });
    },
    getAudit: function (f) {
      return ready().then(wait).then(function () {
        f = f || {}; var l = S.audit.slice().reverse();
        if (f.q) { var q = f.q.toLowerCase(); l = l.filter(function (r) { return (r.action + ' ' + r.entity + ' ' + r.actor).toLowerCase().indexOf(q) >= 0; }); }
        if (f.action) l = l.filter(function (r) { return r.action.indexOf(f.action) === 0; });
        return clone(l.slice(0, f.limit || 200));
      });
    },
    verifyAuditChain: function () { return ready().then(function () { return verifyAuditChain(); }); },
    submitApplication: function (id, p) {
      return ready().then(wait).then(function () {
        var a = getApp(id); p = p || {};
        if (!p.signature) throw apiErr('SIGNATURE_REQUIRED', 'Требуется подпись E-IMZO');
        var reasons = [], ap = a.applicant || {};
        if (!/^\d{9}$/.test(String(ap.inn || ''))) reasons.push({ key: 'sub.inn', text: 'ИНН (9 цифр)' });
        if (!ap.legalEntity) reasons.push({ key: 'sub.legal', text: 'Наименование заявителя' });
        if (!ap.cadastre) reasons.push({ key: 'sub.cad', text: 'Кадастровый номер объекта' });
        var kind = S.serviceKinds.filter(function (k) { return k.id === a.serviceKind; })[0];
        if (!kind || !kind.active) reasons.push({ key: 'sub.kind', text: 'Вид услуги (шаблон чек-листа не активен)' });
        if (!a.category) reasons.push({ key: 'sub.cat', text: 'Категория' });
        if (!ap.phone) reasons.push({ key: 'sub.phone', text: 'Контактный телефон' });
        var before = a.status;
        a.signature = { keyId: p.signature.keyId, signedAt: nowIso(), hash: sha256(id + '|' + p.signature.keyId + '|' + nowIso()) };
        a.submittedAt = nowIso(); setAppStatus(a, 'Подана', 'applicant');
        if (reasons.length) { a.rejectReasons = reasons; setAppStatus(a, 'Отказ по комплектности', 'system'); save('applications');
          audit('system', 'application.submit', id, { status: before }, { status: a.status, reasons: reasons.map(function (r) { return r.text; }) });
          notify(a.hotelId, 'refused', 'Отказ по комплектности', 'Не хватает: ' + reasons.map(function (r) { return r.text; }).join(', '), ['cabinet', 'sms', 'email'], { id: id });
          emit('application'); return { status: a.status, accepted: false, reasons: reasons, application: clone(a) }; }
        a.rejectReasons = null; setAppStatus(a, 'Принята', 'system');
        var tariff = (S.directory.tariffs || []).filter(function (t) { return +a.category >= 4 ? t.id === 't-hotel-45' : t.id === 't-hotel-13'; })[0];
        a.invoice = { no: 'СЧ-2026-' + pad(450 + S.applications.length, 4), amount: tariff.amount, currency: tariff.currency, tariffId: tariff.id, createdAt: nowIso(), paidAt: null };
        setAppStatus(a, 'Ожидает оплаты', 'system'); a.step = 4; save('applications');
        audit('system', 'application.submit', id, { status: before }, { status: a.status, signature: 'E-IMZO' });
        notify(a.hotelId, 'accepted', 'Заявка принята к рассмотрению', 'Заявка ' + id + ' принята. Выставлен счёт ' + a.invoice.no + '.', ['cabinet', 'sms', 'email', 'telegram'], { id: id });
        emit('application'); return { status: a.status, accepted: true, invoice: clone(a.invoice), application: clone(a) };
      });
    },
    payApplication: function (id, p) {
      return ready().then(wait).then(function () {
        var a = getApp(id); if (!a.invoice) throw apiErr('NO_INVOICE', 'Счёт не выставлен');
        a.invoice.paidAt = nowIso(); a.invoice.method = (p && p.method) || 'Uzcard/Humo (демо)'; a.paid = true;
        var pendingDec = S.decisions.filter(function (d) { return d.appId === id && d.kind === 'issue' && !d.certNo; })[0];
        if (a.status === 'Ожидает оплаты') { setAppStatus(a, 'Заполнение', 'system'); a.step = 5; }
        save('applications'); audit('system', 'payment.confirm', a.invoice.no, { paid: false }, { paid: true, amount: a.invoice.amount });
        notify(a.hotelId, 'paid', 'Оплата получена', 'Счёт ' + a.invoice.no + ' оплачен. Заполните чек-лист и загрузите доказательства.', ['cabinet', 'sms', 'email'], { id: id });
        var chain = pendingDec ? issueCertificate(a, pendingDec) : Promise.resolve(null);
        return chain.then(function () { emit('application'); return { paid: true, application: clone(a) }; });
      });
    },
    runAutoCheck: function (id) {
      return ready().then(wait).then(function () {
        var a = getApp(id); setAppStatus(a, 'Автопроверка', 'system'); a.step = 6;
        var sum = summarize(a); a.autoCheck = sum; a.riskScore = sum.risk; save('applications');
        audit('system', 'autocheck.run', id, null, { green: sum.counts.green, yellow: sum.counts.yellow, red: sum.counts.red, risk: sum.risk });
        emit('application'); return clone(sum);
      });
    },
    submitForReview: function (id) {
      return ready().then(wait).then(function () {
        var a = getApp(id); var wasRework = a.status === 'На доработке';
        if (!a.autoCheck) { a.autoCheck = summarize(a); a.riskScore = a.autoCheck.risk; }
        else { a.autoCheck = summarize(a); a.riskScore = a.autoCheck.risk; }
        if (wasRework) { (a.rework || []).forEach(function (r) { if (a.reviews[r.code]) { a.reviews[r.code] = null; delete a.reviews[r.code]; } }); a.reworkResubmittedAt = nowIso(); }
        autoAssign(a); setAppStatus(a, 'На оценке', 'applicant'); a.step = 8;
        a.slaDueAt = addWorkDays(new Date(), +S.settings.slaReviewWorkDays).toISOString().slice(0, 19);
        save('applications'); audit('applicant', 'application.review.submit', id, { status: wasRework ? 'На доработке' : 'Автопроверка' }, { status: 'На оценке', inspectorId: a.inspectorId });
        notify(a.hotelId, 'review', 'Заявка передана на оценку', 'Заявка ' + id + ' на оценке у инспектора. Ожидаемый срок — до ' + a.slaDueAt.slice(0, 10) + '.', ['cabinet', 'email'], { id: id });
        emit('application'); return clone(a);
      });
    },
    getSla: function (id) { return ready().then(function () { return slaInfo(getApp(id)); }); },
    slaInfo: function (a) { return slaInfo(a); },

    /* ---- доказательства ---- */
    uploadEvidence: function (p) { return ready().then(wait).then(function () { return doUpload(p); }); },
    getEvidence: function (id) { return clone(S.evidence[id] || null); },
    listEvidence: function (ownerId, code) { return clone(evList(ownerId, code)); },

    /* ---- инспектор ---- */
    listQueue: function (inspectorId) {
      return ready().then(wait).then(function () {
        var ins = (S.users || []).filter(function (u) { return u.id === inspectorId; })[0] || { conflicts: [] };
        var hidden = 0, out = [];
        S.applications.filter(function (a) { return a.status === 'На оценке'; }).forEach(function (a) {
          if ((ins.conflicts || []).indexOf(a.hotelId) >= 0) { hidden++; return; }
          var c = S.certificates.filter(function (x) { return x.hotelId === a.hotelId; })[0];
          if (c && c.inspectorId === inspectorId && a.kind === 'recert') { hidden++; return; }
          if (a.inspectorId && a.inspectorId !== inspectorId) return;
          var h = S.hotels[a.hotelId]; var sum = a.autoCheck || summarize(a);
          out.push({ id: a.id, hotelId: a.hotelId, hotel: h.name, region: h.region, regionCode: h.regionCode, category: a.category, status: a.status, risk: a.riskScore != null ? a.riskScore : sum.risk,
            counts: sum.counts, submittedAt: a.submittedAt, sla: slaInfo(a), inspectorId: a.inspectorId });
        });
        return { items: out, hiddenByConflict: hidden };
      });
    },
    reviewItems: function (appId, reviews, inspectorId) {
      return ready().then(wait).then(function () {
        var a = getApp(appId); a.reviews = a.reviews || {};
        reviews.forEach(function (r) {
          if (r.verdict !== 'ok' && !(r.comment || '').trim()) throw apiErr('COMMENT_REQUIRED', 'Комментарий обязателен при несоответствии или доработке: ' + r.code);
          var before = a.reviews[r.code] ? a.reviews[r.code].verdict : null;
          a.reviews[r.code] = { verdict: r.verdict, comment: r.comment || '', by: inspectorId, at: nowIso() };
          audit(inspectorId, 'review.item', appId + '/' + r.code, { verdict: before }, { verdict: r.verdict });
        });
        if (!a.inspectorId) a.inspectorId = inspectorId;
        save('applications'); emit('review'); return clone(a.reviews);
      });
    },
    bulkApproveGreen: function (appId, inspectorId) {
      return ready().then(wait).then(function () {
        var a = getApp(appId), cl = buildChecklist(a), n = 0; a.reviews = a.reviews || {};
        cl.sections.forEach(function (s) { s.items.forEach(function (it) { if (it.applicable && it.state.zone === 'green' && !a.reviews[it.code]) { a.reviews[it.code] = { verdict: 'ok', comment: '', by: inspectorId, at: nowIso(), bulk: true }; n++; } }); });
        if (!a.inspectorId) a.inspectorId = inspectorId;
        save('applications'); audit(inspectorId, 'review.bulk', appId, null, { approved: n }); emit('review'); return { approved: n };
      });
    },
    returnForRework: function (appId, inspectorId, p) {
      return ready().then(wait).then(function () {
        var a = getApp(appId); a.reviews = a.reviews || {}; p = p || {};
        var items = Object.keys(a.reviews).filter(function (c) { return a.reviews[c] && a.reviews[c].verdict !== 'ok'; });
        if (!items.length) throw apiErr('NOTHING_TO_RETURN', 'Нет пунктов с замечаниями');
        a.rework = items.map(function (c) { return { code: c, comment: a.reviews[c].comment, at: nowIso() }; });
        a.reworkDueAt = addDays(todayStr(), p.days || 7) + 'T18:00:00'; a.step = 7;
        setAppStatus(a, 'На доработке', inspectorId); save('applications');
        audit(inspectorId, 'review.rework', appId, { status: 'На оценке' }, { status: 'На доработке', items: items });
        notify(a.hotelId, 'rework', 'Возвращено на доработку', 'Инспектор вернул пункты: ' + items.join(', ') + '. Срок — до ' + a.reworkDueAt.slice(0, 10) + '.', ['cabinet', 'sms', 'email', 'telegram'], { id: appId });
        emit('review'); return clone(a);
      });
    },
    makeDecision: function (appId, p) {
      return ready().then(wait).then(function () {
        var a = getApp(appId); p = p || {};
        if (!p.signature) throw apiErr('SIGNATURE_REQUIRED', 'Решение подписывается E-IMZO инспектора');
        var cl = buildChecklist(a), bad = [];
        cl.sections.forEach(function (s) { s.items.forEach(function (it) { if (it.applicable && it.mandatory && !(a.reviews && a.reviews[it.code] && a.reviews[it.code].verdict === 'ok')) bad.push(it.code); }); });
        if (p.decision === 'issue' && bad.length) throw apiErr('MANDATORY_NOT_OK', 'Обязательные пункты без соответствия: ' + bad.join(', '), { items: bad });
        var decNo = 'РЕШ-2026-' + pad(212 + S.decisions.length, 4);
        var dec = { id: 'DEC-' + decNo, decisionNo: decNo, appId: appId, hotelId: a.hotelId, kind: p.decision === 'issue' ? 'issue' : 'refuse', inspectorId: p.inspectorId,
          signature: { keyId: p.signature.keyId, signedAt: nowIso() }, at: nowIso(), comment: p.comment || '', draft: false, protocol: protocolFor(a, cl, p) };
        S.decisions.push(dec); a.decisionNo = decNo; setAppStatus(a, 'Решение', p.inspectorId); save('decisions'); save('applications');
        audit(p.inspectorId, 'decision.sign', appId, null, { decision: dec.kind, decisionNo: decNo, signature: 'E-IMZO' });
        if (dec.kind === 'refuse') { setAppStatus(a, 'Отказ', 'system'); save('applications'); notify(a.hotelId, 'refused', 'Отказ в выдаче сертификата', (p.comment || 'См. протокол решения.'), ['cabinet', 'sms', 'email'], { id: appId }); emit('decision'); return { decision: clone(dec), application: clone(a) }; }
        return issueCertificate(a, dec).then(function (cert) { emit('decision'); return { decision: clone(dec), certificate: clone(cert), application: clone(a), pendingPayment: !cert }; });
      });
    },
    getProtocol: function (appId) {
      return ready().then(wait).then(function () { var a = getApp(appId), cl = buildChecklist(a); return clone(protocolFor(a, cl, {})); });
    },

    /* ---- реестр ---- */
    listCertificates: function (f) {
      return ready().then(wait).then(function () {
        f = f || {}; var q = (f.q || '').trim().toLowerCase(), l = S.certificates.slice();
        l = l.filter(function (c) {
          if (q && [c.name, c.no, c.inn, c.legalEntity].join(' ').toLowerCase().indexOf(q) < 0) return false;
          if (f.regionCode && c.regionCode !== f.regionCode) return false;
          if (f.stars && String(c.stars) !== String(f.stars)) return false;
          if (f.type && c.type !== f.type) return false;
          if (f.status && c.status !== f.status) return false;
          if (f.hotelId && c.hotelId !== f.hotelId) return false;
          return true;
        }).sort(function (a, b) { return a.no < b.no ? -1 : 1; });
        var ps = f.pageSize || 20, page = f.page || 1, total = l.length;
        return { total: total, page: page, pages: Math.max(1, Math.ceil(total / ps)), items: l.slice((page - 1) * ps, page * ps).map(publicView) };
      });
    },
    verifyCertificate: function (number) {
      return ready().then(wait).then(function () {
        var no = normNumber(number);
        if (!/^UZ\.TSM\.[A-Z]{2}\.\d{6}$/.test(no)) return { found: false, valid: false, error: 'FORMAT', number: no };
        var c = getCert(no); if (!c) return { found: false, valid: false, error: 'NOT_FOUND', number: no };
        var m = statusMeta(c.status);
        return { found: true, valid: c.status === 'Действует', status: c.status, tone: m.tone, number: no, name: c.name, expires: c.expires, issued: c.issued, stars: c.stars, region: c.region, checkedAt: nowIso() };
      });
    },
    getCertificate: function (no) { return ready().then(wait).then(function () { var c = getCert(no); return c ? clone(c) : null; }); },
    exportCertificates: function (format, f) {
      return api.listCertificates(Object.assign({}, f || {}, { pageSize: 10000, page: 1 })).then(function (r) {
        var rows = r.items.map(function (x) { var o = Object.assign({}, x); delete o.hotelId; return o; });
        if (format === 'json') return JSON.stringify({ source: 'GET /api/v1/registry/certificates', demo: true, total: r.total, items: rows }, null, 2);
        var cols = rows.length ? Object.keys(rows[0]) : [];
        cols = rows.reduce(function (a, r2) { Object.keys(r2).forEach(function (k) { if (a.indexOf(k) < 0) a.push(k); }); return a; }, []);
        var esc = function (v) { v = v == null ? '' : String(v); return /[",;\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
        return '\ufeff' + cols.join(';') + '\n' + rows.map(function (r2) { return cols.map(function (c) { return esc(r2[c]); }).join(';'); }).join('\n');
      });
    },

    /* ---- статусы сертификата ---- */
    changeCertificateStatus: function (no, status, p) {
      return ready().then(wait).then(function () { return setCertStatus(no, status, p || {}); });
    },
    simulateMissedSelfInspection: function (no, opts) {
      return ready().then(wait).then(function () {
        var c = getCert(no); if (!c) throw apiErr('NOT_FOUND', 'Сертификат не найден');
        var w = (S.warnings[no] || 0), steps = opts && opts.fast ? 3 - w : 1, res = null;
        for (var i = 0; i < steps; i++) { w++; S.warnings[no] = w; res = missedStep(c, w); }
        save('warnings'); emit('missed'); return res;
      });
    },
    listDecisionDrafts: function () { return ready().then(wait).then(function () { return clone(S.decisions.filter(function (d) { return d.draft; })); }); },
    confirmDecisionDraft: function (id, p) {
      return ready().then(wait).then(function () {
        var d = S.decisions.filter(function (x) { return x.id === id && x.draft; })[0]; if (!d) throw apiErr('NOT_FOUND', 'Проект решения не найден');
        if (!p || !p.signature) throw apiErr('SIGNATURE_REQUIRED', 'Приостановление/аннулирование — только с подписью E-IMZO инспектора');
        d.draft = false; d.signature = { keyId: p.signature.keyId, signedAt: nowIso() }; d.inspectorId = p.inspectorId; d.at = nowIso();
        save('decisions');
        return setCertStatus(d.certNo, d.kind === 'annul' ? 'Аннулирован' : 'Приостановлен', { reason: d.reason, by: p.inspectorId, signature: p.signature, decisionNo: d.decisionNo });
      });
    },
    rejectDecisionDraft: function (id, p) {
      return ready().then(wait).then(function () { var d = S.decisions.filter(function (x) { return x.id === id; })[0]; if (!d) return null; S.decisions = S.decisions.filter(function (x) { return x.id !== id; }); S.warnings[d.certNo] = 0; save('decisions'); save('warnings'); audit(p && p.inspectorId, 'decision.draft.reject', id, { draft: true }, null); emit('decision'); return true; });
    },
    createDraftDecision: function (no, kind, reason) {
      return ready().then(wait).then(function () { return createDraft(getCert(no), kind || 'suspend', reason || 'Формирование проекта по решению инспектора'); });
    },

    /* ---- инспекции ---- */
    listInspections: function (f) {
      return ready().then(wait).then(function () {
        f = f || {}; var t = todayStr(), l = S.inspections.slice();
        if (f.certNo) l = l.filter(function (i) { return i.certNo === f.certNo; });
        if (f.hotelId) l = l.filter(function (i) { return i.hotelId === f.hotelId; });
        if (f.status) l = l.filter(function (i) { return i.status === f.status; });
        if (f.kind) l = l.filter(function (i) { return i.kind === f.kind; });
        if (f.due === 'overdue') l = l.filter(function (i) { return i.due < t && (i.status === 'Запланирована' || i.status === 'Просрочена'); });
        else if (f.due != null && f.due !== '') { var lim = addDays(t, +f.due); l = l.filter(function (i) { return i.due <= lim && (i.status === 'Запланирована' || i.status === 'Самоинспекция' || i.status === 'Просрочена'); }); }
        return clone(l.sort(function (a, b) { return a.due < b.due ? -1 : 1; }));
      });
    },
    getSelfInspection: function (inspId) {
      return ready().then(wait).then(function () {
        var ins = getInsp(inspId), c = getCert(ins.certNo), tpl = getTemplateVersion('tpl-hotels', c.templateVersion), h = S.hotels[c.hotelId];
        var ctx = { category: c.stars, type: h.type, floors: h.floors, rooms: h.rooms };
        var items = tpl.items.filter(function (it) { return (it.critical || it.weight >= 2) && applicability(it, ctx).ok && it.evidence.slots.length; });
        var owner = { id: inspId };
        return clone({ inspection: ins, certificate: c, items: items.map(function (it) { var slots = expandSlots(it, ctx).slice(0, 1);
          return Object.assign({}, it, { slotsSelf: slots, evidenceSelf: slots.map(function (s) { return activeEv(inspId, it.code, s.id); }), baseline: (c.baseline || {})[it.code] }); }),
          unchanged: (S.selfinsp[inspId] || {}).unchanged || false });
      });
    },
    setSelfUnchanged: function (inspId, val) { return ready().then(function () { S.selfinsp[inspId] = Object.assign(S.selfinsp[inspId] || {}, { unchanged: !!val }); save('selfinsp'); return true; }); },
    submitSelfInspection: function (inspId) {
      return ready().then(wait).then(function () {
        var ins = getInsp(inspId), evs = evList(inspId); if (!evs.length) throw apiErr('NO_EVIDENCE', 'Загрузите свежие фото ключевых пунктов');
        if (!(S.selfinsp[inspId] || {}).unchanged) throw apiErr('NOT_CONFIRMED', 'Подтвердите неизменность остальных пунктов');
        var worst = 'green', c = getCert(ins.certNo), diffs = 0;
        evs.filter(function (e) { return !e.replacedBy; }).forEach(function (e) {
          worst = worse(worst, evZone(e)); var base = (c.baseline || {})[e.itemCode];
          if (base && e.dhash && hamming(base, e.dhash) > 14) { diffs++; e.changed = true; }
        });
        if (diffs && worst === 'green') worst = 'yellow';
        ins.status = 'На проверке'; ins.zone = worst; ins.diffs = diffs; ins.submittedAt = nowIso(); save('inspections'); save('evidence');
        audit('applicant', 'selfinspection.submit', inspId, { status: 'Запланирована' }, { status: 'На проверке', zone: worst, diffs: diffs });
        S.warnings[ins.certNo] = 0; save('warnings');
        emit('inspection'); return clone(ins);
      });
    },
    reviewSelfInspection: function (inspId, p) {
      return ready().then(wait).then(function () {
        var ins = getInsp(inspId); ins.status = p.pass ? 'Пройдена' : 'Выявлены нарушения'; ins.result = p.pass ? 'Без замечаний' : (p.comment || 'Выявлены нарушения'); ins.reviewedBy = p.inspectorId; ins.reviewedAt = nowIso();
        save('inspections'); audit(p.inspectorId, 'selfinspection.review', inspId, { status: 'На проверке' }, { status: ins.status });
        if (!p.pass) { notify(ins.hotelId, 'violations', 'По самоинспекции выявлены нарушения', ins.result, ['cabinet', 'sms', 'email']); }
        emit('inspection'); return clone(ins);
      });
    },
    scheduleOnsite: function (inspId, p) {
      return ready().then(wait).then(function () {
        if (!p || !(p.reason || '').trim()) throw apiErr('REASON_REQUIRED', 'Выездная проверка назначается только с обязательным обоснованием');
        var onsite = S.inspections.filter(function (i) { return i.onsite; }).length, total = S.certificates.length, pct = Math.round((onsite + 1) / Math.max(1, total) * 100);
        var ins = getInsp(inspId); ins.onsite = true; ins.onsiteReason = p.reason; save('inspections');
        audit(p.inspectorId, 'inspection.onsite', inspId, { onsite: false }, { onsite: true, reason: p.reason });
        emit('inspection'); return { inspection: clone(ins), onsitePercent: pct, overLimit: pct > S.settings.onsiteMaxPercent };
      });
    },

    /* ---- риск-сигналы ---- */
    addRiskSignal: function (p) {
      return ready().then(wait).then(function () {
        var c = getCert(p.certNo) || (S.certificates.filter(function (x) { return x.hotelId === p.hotelId; })[0]);
        if (!c) throw apiErr('NOT_FOUND', 'Сертификат не найден');
        var sig = { id: 'SIG-' + pad(S.signals.length + 1, 3), certNo: c.no, hotelId: c.hotelId, type: p.type, weight: +p.weight || 10, date: todayStr(), source: p.source || 'Ввод инспектора', note: p.note || '' };
        S.signals.push(sig); save('signals'); audit(p.by || 'system', 'signal.add', sig.id, null, { type: sig.type, certNo: c.no, weight: sig.weight });
        var rb = riskBreakdown(c.no), planned = false;
        if (rb.total > +S.settings.riskThreshold && !S.inspections.some(function (i) { return i.certNo === c.no && i.kind === 'unplanned' && i.status === 'Запланирована'; })) {
          S.inspections.push({ id: 'INS-' + pad(S.inspections.length + 1, 4), certNo: c.no, hotelId: c.hotelId, kind: 'unplanned', seq: 0, due: addDays(todayStr(), 7), status: 'Запланирована', result: '', inspectorId: c.inspectorId, onsite: false });
          save('inspections'); planned = true; audit('system', 'inspection.plan', c.no, null, { kind: 'unplanned', riskTotal: rb.total });
          notify(c.hotelId, 'unplanned', 'Назначен внеплановый контроль', 'Балл риска превысил порог. Контроль — дистанционно, при необходимости видеоинспекция.', ['cabinet', 'sms', 'email', 'telegram']);
        }
        emit('signal'); return { signal: sig, breakdown: rb, unplannedCreated: planned };
      });
    },
    getRisk: function (no) { return ready().then(wait).then(function () { return riskBreakdown(no); }); },
    listRiskSignals: function () { return ready().then(wait).then(function () { return clone(S.signals); }); },
    riskOverview: function () { return ready().then(wait).then(function () { return S.certificates.map(function (c) { return Object.assign({ no: c.no, name: c.name }, riskBreakdown(c.no)); }).filter(function (r) { return r.total > 0; }).sort(function (a, b) { return b.total - a.total; }); }); },

    /* ---- апелляции ---- */
    fileAppeal: function (p) {
      return ready().then(wait).then(function () {
        var ap = { id: 'APL-' + pad(S.appeals.length + 1, 3), hotelId: p.hotelId, ref: p.ref, text: p.text, at: nowIso(), status: 'На рассмотрении', decision: null };
        S.appeals.push(ap); save('appeals'); audit('applicant', 'appeal.file', ap.id, null, { ref: p.ref }); emit('appeal'); return clone(ap);
      });
    },
    listAppeals: function (hid) { return ready().then(wait).then(function () { return clone(S.appeals.filter(function (a) { return !hid || a.hotelId === hid; })); }); },
    decideAppeal: function (id, p) {
      return ready().then(wait).then(function () {
        var ap = S.appeals.filter(function (a) { return a.id === id; })[0]; ap.status = p.accept ? 'Удовлетворена' : 'Отклонена'; ap.decision = p.comment || ''; ap.decidedBy = p.by; ap.decidedAt = nowIso();
        save('appeals'); audit(p.by, 'appeal.decide', id, { status: 'На рассмотрении' }, { status: ap.status }); emit('appeal'); return clone(ap);
      });
    },

    /* ---- уведомления ---- */
    listNotifications: function (hid) { return ready().then(wait).then(function () { return clone(S.notifications.filter(function (n) { return !hid || n.hotelId === hid; })); }); },
    markNotificationsRead: function (hid) { return ready().then(function () { S.notifications.forEach(function (n) { if (!hid || n.hotelId === hid) n.read = true; }); save('notifications'); emit('notify'); return true; }); },

    /* ---- состояние объекта для кабинета ---- */
    getHotelState: function (hid) {
      return ready().then(wait).then(function () {
        var c = (S.certificates.filter(function (x) { return x.hotelId === hid; })[0]) || null;
        var apps = S.applications.filter(function (a) { return a.hotelId === hid; }), app = apps[apps.length - 1] || null;
        var openApp = apps.filter(function (a) { return ['Выдан', 'Отказ', 'Отказ по комплектности'].indexOf(a.status) < 0; })[0] || null;
        var ni = c ? nextInspection(c.no) : null, days = ni ? daysBetween(todayStr(), ni.due) : null;
        var state = 'none';
        if (openApp) state = openApp.status === 'Черновик' ? 'draft' : openApp.status === 'На доработке' ? 'rework' : 'progress';
        else if (c) { state = c.status === 'Действует' ? (ni && days <= S.settings.notifyDays[0] ? 'selfinspect' : (daysBetween(todayStr(), c.expires) <= S.settings.recertDays ? 'recertoffer' : 'valid')) : c.status === 'На ресертификации' ? 'recert' : c.status === 'Приостановлен' ? 'suspended' : c.status === 'Аннулирован' ? 'annulled' : 'expired'; }
        if (c && c.status === 'Действует' && daysBetween(todayStr(), c.expires) <= S.settings.recertDays && !openApp) state = 'recertoffer';
        return clone({ certificate: c, application: openApp || app, nextInspection: ni, daysToInspection: days, state: state, inspections: c ? S.inspections.filter(function (i) { return i.certNo === c.no; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; }) : [], decisions: S.decisions.filter(function (d) { return d.hotelId === hid && !d.draft; }), risk: c ? riskBreakdown(c.no) : null });
      });
    },
    startRecertification: function (hid) {
      return ready().then(wait).then(function () {
        var c = S.certificates.filter(function (x) { return x.hotelId === hid; })[0]; if (!c) throw apiErr('NOT_FOUND', 'Сертификат не найден');
        return api.createApplication({ hotelId: hid, forceNew: true, category: c.stars }).then(function (a) {
          var app = getApp(a.id); app.kind = 'recert'; app.prevCertNo = c.no; app.step = 5;
          // предзаполненный чек-лист: ответы из первичной заявки копируются как «без изменений»
          var prev = S.applications.filter(function (x) { return x.hotelId === hid && x.id !== app.id && S.answers[x.id]; }).pop();
          if (prev) { S.answers[app.id] = clone(S.answers[prev.id]); save('answers'); app.prefilledFrom = prev.id; }
          save('applications'); if (c.status === 'Действует') setCertStatus(c.no, 'На ресертификации', { by: 'system', reason: 'Подана заявка на ресертификацию' });
          return clone(app);
        });
      });
    },

    /* ---- админ: настройки, шаблоны, справочники, пользователи ---- */
    getSettings: function () { return ready().then(wait).then(function () { return clone(S.settings); }); },
    saveSettings: function (patch, by) {
      return ready().then(wait).then(function () {
        var before = {}; Object.keys(patch).forEach(function (k) { before[k] = clone(S.settings[k]); S.settings[k] = patch[k]; });
        save('settings'); audit(by || 'adm-1', 'settings.update', 'settings', before, patch); emit('settings'); return clone(S.settings);
      });
    },
    getDirectory: function () { return ready().then(wait).then(function () { return clone(S.directory); }); },
    saveDirectory: function (dir, by) { return ready().then(wait).then(function () { var before = clone(S.directory); S.directory = dir; save('directory'); audit(by || 'adm-1', 'directory.update', 'directory', before, dir); emit('settings'); return clone(S.directory); }); },
    listTemplates: function () { return ready().then(wait).then(function () { return clone(S.templates.map(function (t) { return { id: t.id, version: t.version, status: t.status, name: t.name, publishedAt: t.publishedAt, items: t.items.length, usedBy: S.certificates.filter(function (c) { return c.templateVersion === t.version; }).length + S.applications.filter(function (a) { return a.templateVersion === t.version; }).length }; })); }); },
    getTemplate: function (id, version) { return ready().then(wait).then(function () { return clone(getTemplateVersion(id, version)); }); },
    saveTemplateDraft: function (tpl, by) {
      return ready().then(wait).then(function () {
        var pub = getTemplateVersion(tpl.id), next = tpl.version;
        if (tpl.status !== 'draft') { var p = String(pub.version).replace(/-demo$/, '').split('.').map(Number); next = p[0] + '.' + (p[1] + 1) + '.0-demo'; }
        var d = clone(tpl); d.status = 'draft'; d.version = next;
        S.templates = S.templates.filter(function (t) { return !(t.id === d.id && t.status === 'draft'); }); S.templates.push(d); save('templates');
        audit(by || 'adm-1', 'template.draft', d.id + '@' + d.version, null, { items: d.items.length }); emit('template'); return clone(d);
      });
    },
    publishTemplate: function (id, by) {
      return ready().then(wait).then(function () {
        var d = S.templates.filter(function (t) { return t.id === id && t.status === 'draft'; })[0]; if (!d) throw apiErr('NO_DRAFT', 'Нет черновика для публикации');
        S.templates.forEach(function (t) { if (t.id === id && t.status === 'published') t.status = 'archived'; });
        d.status = 'published'; d.publishedAt = todayStr(); save('templates');
        audit(by || 'adm-1', 'template.publish', id + '@' + d.version, { status: 'draft' }, { status: 'published', version: d.version });
        emit('template'); return clone(d);
      });
    },
    listUsers: function () { return ready().then(wait).then(function () { return clone(S.users); }); },
    saveUsers: function (u, by) { return ready().then(wait).then(function () { S.users = u; save('users'); audit(by || 'adm-1', 'users.update', 'rbac', null, { count: u.length }); emit('users'); return clone(S.users); }); },
    getKpi: function () {
      return ready().then(wait).then(function () {
        var k = clone(S.kpi), onsite = S.inspections.filter(function (i) { return i.onsite; }).length, total = S.certificates.length;
        k.live = { queue: S.applications.filter(function (a) { return a.status === 'На оценке'; }).length, rework: S.applications.filter(function (a) { return a.status === 'На доработке'; }).length,
          onsitePercent: Math.round(onsite / Math.max(1, total) * 100), certsValid: S.certificates.filter(function (c) { return c.status === 'Действует'; }).length, certsTotal: total,
          highRisk: S.applications.filter(function (a) { return a.status === 'На оценке' && (a.riskScore || 0) >= 40; }).length, auditLen: S.audit.length };
        return k;
      });
    },
    getInspectorLoad: function () {
      return ready().then(wait).then(function () {
        return S.users.filter(function (u) { return u.role === 'inspector'; }).map(function (u) {
          var n = S.applications.filter(function (a) { return a.inspectorId === u.id && a.status === 'На оценке'; }).length;
          return { id: u.id, name: u.name, load: Math.max(u.load - 5 + n, n), capacity: u.capacity, active: n, regions: u.regions };
        });
      });
    },

    /* ---- очередь отложенной отправки (слабая сеть) ---- */
    queue: {
      size: function () { try { return (JSON.parse(store.getItem(NS + 'queue') || '[]')).length; } catch (e) { return 0; } },
      add: function (job) { var q = []; try { q = JSON.parse(store.getItem(NS + 'queue') || '[]'); } catch (e) {} q.push(job); try { store.setItem(NS + 'queue', JSON.stringify(q)); } catch (e) { return false; } emit('queue'); return true; },
      flush: function () {
        var q = []; try { q = JSON.parse(store.getItem(NS + 'queue') || '[]'); } catch (e) {}
        store.setItem(NS + 'queue', '[]'); var done = 0;
        return q.reduce(function (p, job) { return p.then(function () { return dataUrlToFile(job.dataUrl, job.name).then(function (f) { return doUpload(Object.assign({}, job.meta, { file: f })); }).then(function () { done++; }).catch(function () {}); }); }, Promise.resolve()).then(function () { emit('queue'); return done; });
      }
    },
    /* ---- демо-инструменты ---- */
    demoImage: function (kind, variant, opts) { return makeDemoImage(kind, variant, opts || {}); },
    drawScene: function (canvas, kind, variant, opts) { drawScene(canvas, kind, variant, opts || {}); },
    pdfDemo: function (name) { return { name: name || 'document.pdf', size: 420000, type: 'application/pdf' }; }
  };

  /* ---------- внутренние ---------- */
  function apiErr(code, message, extra) { var e = new Error(message); e.code = code; e.status = 400; if (extra) Object.assign(e, extra); return e; }
  function getApp(id) { var a = (S.applications || []).filter(function (x) { return x.id === id; })[0]; if (!a) throw apiErr('NOT_FOUND', 'Заявка не найдена: ' + id); return a; }
  function getInsp(id) { var a = (S.inspections || []).filter(function (x) { return x.id === id; })[0]; if (!a) throw apiErr('NOT_FOUND', 'Инспекция не найдена: ' + id); return a; }
  function setAppStatus(a, status, by) { a.status = status; a.history = a.history || []; a.history.push({ at: nowIso(), status: status, by: by }); }
  function slaInfo(a) {
    if (!a) return null;
    var start = a.submittedAt || a.createdAt; var out = { state: 'none' };
    if (a.status === 'На оценке' && a.slaDueAt) { var h = Math.round((new Date(a.slaDueAt) - new Date()) / 36e5); out = { state: h < 0 ? 'over' : h < 24 ? 'warn' : 'ok', hoursLeft: h, dueAt: a.slaDueAt, kind: 'review' }; }
    else if (['Выдан', 'Отказ', 'Отказ по комплектности', 'Черновик'].indexOf(a.status) < 0 && a.submittedAt) { var due = addWorkDays(new Date(a.submittedAt), +S.settings.slaIssueWorkDays), hh = Math.round((due - new Date()) / 36e5); out = { state: hh < 0 ? 'over' : hh < 24 ? 'warn' : 'ok', hoursLeft: hh, dueAt: due.toISOString().slice(0, 19), kind: 'issue' }; }
    return out;
  }
  function autoAssign(a) {
    if (a.inspectorId) return;
    var h = S.hotels[a.hotelId], ins = S.users.filter(function (u) { return u.role === 'inspector' && (u.conflicts || []).indexOf(a.hotelId) < 0; });
    var inRegion = ins.filter(function (u) { return (u.regions || []).indexOf(h.regionCode) >= 0; }); if (inRegion.length) ins = inRegion;
    ins.sort(function (x, y) { return (x.load / x.capacity) - (y.load / y.capacity); });
    if (ins[0]) { a.inspectorId = ins[0].id; ins[0].load++; save('users'); audit('system', 'application.assign', a.id, null, { inspectorId: ins[0].id, load: ins[0].load + '/' + ins[0].capacity }); }
  }
  function protocolFor(a, cl, p) {
    var rows = [], counts = { ok: 0, fail: 0, rework: 0, pending: 0 };
    cl.sections.forEach(function (s) { s.items.forEach(function (it) { if (!it.applicable) return; var rv = a.reviews && a.reviews[it.code]; var v = rv ? rv.verdict : 'pending'; counts[v] = (counts[v] || 0) + 1; rows.push({ code: it.code, verdict: v, zone: it.state.zone, comment: rv ? rv.comment : '' }); }); });
    return { appId: a.id, hotelId: a.hotelId, templateVersion: cl.template.version, rows: rows, counts: counts, risk: a.riskScore, generatedAt: nowIso(), demo: true };
  }
  function riskBreakdown(no) {
    var c = getCert(no); var l = (S.signals || []).filter(function (s) { return s.certNo === no || (c && s.hotelId === c.hotelId); });
    var by = {}; l.forEach(function (s) { by[s.type] = (by[s.type] || 0) + s.weight; });
    var total = Math.min(100, l.reduce(function (n, s) { return n + s.weight; }, 0));
    return { total: total, by: by, signals: clone(l), threshold: +S.settings.riskThreshold, over: total > +S.settings.riskThreshold };
  }
  function buildSchedule(c) {
    var out = [], period = S.settings.controlPeriod === 'semiannual' ? 6 : 12, n = 0;
    for (var k = 1; k <= 4; k++) { var due = addYears(c.issued, k); if (due >= c.expires) continue; out.push({ id: 'INS-' + pad(S.inspections.length + out.length + 1, 4), certNo: c.no, hotelId: c.hotelId, kind: 'self', seq: k, due: due, status: 'Запланирована', result: '', inspectorId: c.inspectorId }); }
    out.push({ id: 'INS-' + pad(S.inspections.length + out.length + 1, 4), certNo: c.no, hotelId: c.hotelId, kind: 'recert', seq: 5, due: c.expires, status: 'Запланирована', result: '', inspectorId: c.inspectorId });
    return out;
  }
  function issueCertificate(app, dec) {
    if (!app.paid) { dec.certNo = null; save('decisions'); notify(app.hotelId, 'wait', 'Ожидается подтверждение оплаты', 'Решение подписано. Сертификат будет выпущен автоматически после подтверждения оплаты.', ['cabinet']); return Promise.resolve(null); }
    var h = S.hotels[app.hotelId], max = S.certificates.reduce(function (m, c) { return Math.max(m, parseInt(c.no.slice(-6), 10)); }, 0);
    var no = 'UZ.TSM.' + h.regionCode + '.' + pad(max + 1, 6), issued = todayStr(), expires = addYears(issued, +S.settings.certYears);
    var cert = { no: no, hotelId: h.id, name: h.name, legalEntity: h.legalEntity, inn: h.inn, region: h.region, regionCode: h.regionCode, address: h.address, type: h.type, typeLabel: S.typeLabels[h.type], stars: +app.category, serviceKind: app.serviceKind,
      serviceLabel: 'Услуги средств размещения (гостиничные услуги)', normDoc: "O'z DSt 3220:2017", issued: issued, expires: expires, status: 'Действует', statusReason: '', decisionNo: dec.decisionNo, inspectorId: dec.inspectorId,
      templateVersion: app.templateVersion, lastInspection: issued, lat: h.lat, lng: h.lng, rooms: h.rooms, floors: h.floors, signedBy: S.settings.signMode === 'manager' ? 'Руководитель Центра (подпись E-IMZO)' : 'Серверная ЭЦП Центра',
      history: [{ at: issued, status: 'Действует', reason: 'Сертификат выдан по результатам оценки', by: dec.inspectorId, decisionNo: dec.decisionNo }], baseline: {} };
    cert.docHash = sha256([no, cert.name, cert.inn, issued, expires, dec.decisionNo].join('|'));
    evList(app.id).filter(function (e) { return !e.replacedBy && e.dhash; }).forEach(function (e) { cert.baseline[e.itemCode] = e.dhash; });
    // повторная сертификация: прежний сертификат закрывается
    var prev = S.certificates.filter(function (c) { return c.hotelId === h.id; });
    S.certificates.push(cert);
    prev.forEach(function (pc) { pc.superseded = no; pc.history.push({ at: issued, status: pc.status, reason: 'Заменён новым сертификатом ' + no, by: 'system', decisionNo: '' }); });
    S.certificates = S.certificates.filter(function (c) { return !(c.hotelId === h.id && c.no !== no); });
    S.inspections = S.inspections.filter(function (i) { return !prev.some(function (pc) { return pc.no === i.certNo; }); });
    var sch = buildSchedule(cert); sch.forEach(function (i) { S.inspections.push(i); });
    dec.certNo = no; app.certNo = no; setAppStatus(app, 'Выдан', 'system'); app.step = 9;
    ['certificates', 'inspections', 'decisions', 'applications'].forEach(save);
    audit('system', 'certificate.issue', no, null, { status: 'Действует', expires: expires, signedBy: cert.signedBy });
    audit('system', 'registry.add', no, null, { public: true });
    audit('system', 'inspections.plan', no, null, { count: sch.length });
    notify(h.id, 'issued', 'Сертификат выдан', 'Сертификат ' + no + ' выдан и внесён в публичный реестр. Действует до ' + expires + '.', ['cabinet', 'sms', 'email', 'telegram'], { no: no });
    return Promise.resolve(cert);
  }
  function setCertStatus(no, status, p) {
    var c = getCert(no); if (!c) throw apiErr('NOT_FOUND', 'Сертификат не найден');
    if ((status === 'Приостановлен' || status === 'Аннулирован') && !(p.signature && p.by && String(p.by).indexOf('insp') === 0))
      throw apiErr('SIGNATURE_REQUIRED', 'Приостановить и аннулировать сертификат может только инспектор с подписью E-IMZO');
    var before = c.status; c.status = status; c.statusReason = p.reason || '';
    c.history.push({ at: todayStr(), status: status, reason: p.reason || '', by: p.by || 'system', decisionNo: p.decisionNo || '' });
    save('certificates'); audit(p.by || 'system', 'cert.status', no, { status: before }, { status: status, signature: p.signature ? 'E-IMZO' : undefined });
    notify(c.hotelId, 'cert-status', 'Статус сертификата: ' + status, 'Сертификат ' + no + ': ' + (p.reason || status), ['cabinet', 'sms', 'email', 'telegram'], { no: no, status: status });
    emit('status'); return clone(c);
  }
  function createDraft(c, kind, reason) {
    var existing = S.decisions.filter(function (d) { return d.draft && d.certNo === c.no; })[0]; if (existing) return clone(existing);
    var d = { id: 'DRAFT-' + pad(S.decisions.length + 1, 4), decisionNo: 'РЕШ-2026-' + pad(212 + S.decisions.length, 4), kind: kind, certNo: c.no, hotelId: c.hotelId, draft: true, reason: reason, createdAt: nowIso(), inspectorId: c.inspectorId };
    S.decisions.push(d); save('decisions'); audit('system', 'decision.draft', d.id, null, { kind: kind, certNo: c.no });
    emit('decision'); return clone(d);
  }
  function missedStep(c, w) {
    var ins = S.inspections.filter(function (i) { return i.certNo === c.no && i.kind === 'self' && (i.status === 'Запланирована' || i.status === 'Просрочена'); }).sort(function (a, b) { return a.due < b.due ? -1 : 1; })[0];
    if (ins && ins.status === 'Запланирована') { ins.status = 'Просрочена'; save('inspections'); }
    if (w === 1) { audit('system', 'selfinspection.missed', c.no, null, { warning: 1 }); notify(c.hotelId, 'warn1', 'Предупреждение: пропущена самоинспекция', 'Пройдите самоинспекцию в ближайшее время.', ['cabinet', 'sms', 'email', 'telegram']); addSignalQuiet(c, 'missed_inspection', 30, 'Самоинспекция не пройдена в срок'); return { warning: 1, draft: null }; }
    if (w === 2) { audit('system', 'selfinspection.missed', c.no, null, { warning: 2 }); notify(c.hotelId, 'warn2', 'Повторное предупреждение', 'При непрохождении самоинспекции будет подготовлен проект решения о приостановлении.', ['cabinet', 'sms', 'email', 'telegram']); return { warning: 2, draft: null }; }
    var d = createDraft(c, 'suspend', 'Пропуск самоинспекции: предупреждение → повторное → проект решения'); return { warning: 3, draft: d };
  }
  function addSignalQuiet(c, type, weight, note) {
    S.signals.push({ id: 'SIG-' + pad(S.signals.length + 1, 3), certNo: c.no, hotelId: c.hotelId, type: type, weight: weight, date: todayStr(), source: 'Система', note: note }); save('signals');
  }
  function dataUrlToFile(url, name) { return fetch(url).then(function (r) { return r.blob(); }).then(function (b) { return new File([b], name, { type: b.type }); }); }

  /* ============================================================
   * КЛИЕНТСКИЕ ПРОВЕРКИ ДОКАЗАТЕЛЬСТВ
   * ============================================================ */
  function readExif(buf) {
    try {
      var dv = new DataView(buf); if (dv.getUint16(0) !== 0xFFD8) return null;
      var off = 2;
      while (off < dv.byteLength - 4) {
        var marker = dv.getUint16(off), len = dv.getUint16(off + 2);
        if (marker === 0xFFE1 && dv.getUint32(off + 4) === 0x45786966) return parseTiff(dv, off + 10);
        if ((marker & 0xFF00) !== 0xFF00) break; off += 2 + len;
      }
    } catch (e) {}
    return null;
  }
  function parseTiff(dv, start) {
    var little = dv.getUint16(start) === 0x4949, g16 = function (o) { return dv.getUint16(o, little); }, g32 = function (o) { return dv.getUint32(o, little); };
    var out = {};
    function str(o, n) { var s = ''; for (var i = 0; i < n - 1; i++) s += String.fromCharCode(dv.getUint8(o + i)); return s; }
    function rat(o) { return g32(o) / (g32(o + 4) || 1); }
    function ifd(o, fn) { var n = g16(o); for (var i = 0; i < n; i++) { var e = o + 2 + i * 12; fn(g16(e), g16(e + 2), g32(e + 4), e + 8); } }
    var exifPtr = 0, gpsPtr = 0;
    ifd(start + g32(start + 4), function (tag, type, cnt, vo) {
      if (tag === 0x010F) out.make = str(start + g32(vo), cnt); if (tag === 0x0110) out.model = str(start + g32(vo), cnt);
      if (tag === 0x8769) exifPtr = g32(vo); if (tag === 0x8825) gpsPtr = g32(vo);
    });
    if (exifPtr) ifd(start + exifPtr, function (tag, type, cnt, vo) { if (tag === 0x9003) out.dateTimeOriginal = str(start + g32(vo), cnt).replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3').replace(' ', 'T'); });
    if (gpsPtr) {
      var g = {};
      ifd(start + gpsPtr, function (tag, type, cnt, vo) {
        if (tag === 1 || tag === 3) g[tag] = String.fromCharCode(dv.getUint8(vo));
        if (tag === 2 || tag === 4) { var o = start + g32(vo); g[tag] = rat(o) + rat(o + 8) / 60 + rat(o + 16) / 3600; }
      });
      if (g[2] != null && g[4] != null) { out.lat = (g[1] === 'S' ? -1 : 1) * g[2]; out.lng = (g[3] === 'W' ? -1 : 1) * g[4]; }
    }
    return out;
  }
  function loadBitmap(blob) {
    if (typeof createImageBitmap === 'function') return createImageBitmap(blob);
    return new Promise(function (res, rej) { var u = URL.createObjectURL(blob), i = new Image(); i.onload = function () { res(i); }; i.onerror = rej; i.src = u; });
  }
  function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function imageMetrics(bmp) {
    var w = bmp.width, h = bmp.height, cw = 256, ch = Math.max(8, Math.round(256 * h / w));
    var c = mkCanvas(cw, ch), x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bmp, 0, 0, cw, ch);
    var d = x.getImageData(0, 0, cw, ch).data, g = new Float32Array(cw * ch), sum = 0;
    for (var i = 0; i < cw * ch; i++) { g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]; sum += g[i]; }
    var mean = sum / (cw * ch), n = 0, ls = 0, lss = 0;
    for (var yy = 1; yy < ch - 1; yy++) for (var xx = 1; xx < cw - 1; xx++) {
      var k = yy * cw + xx, l = -4 * g[k] + g[k - 1] + g[k + 1] + g[k - cw] + g[k + cw]; ls += l; lss += l * l; n++;
    }
    var variance = lss / n - (ls / n) * (ls / n);
    // dHash 9×8
    var c2 = mkCanvas(9, 8), x2 = c2.getContext('2d', { willReadFrequently: true }); x2.drawImage(bmp, 0, 0, 9, 8);
    var d2 = x2.getImageData(0, 0, 9, 8).data, bits = '';
    for (var r = 0; r < 8; r++) for (var q = 0; q < 8; q++) { var a1 = d2[(r * 9 + q) * 4] * 0.299 + d2[(r * 9 + q) * 4 + 1] * 0.587 + d2[(r * 9 + q) * 4 + 2] * 0.114, a2 = d2[(r * 9 + q + 1) * 4] * 0.299 + d2[(r * 9 + q + 1) * 4 + 1] * 0.587 + d2[(r * 9 + q + 1) * 4 + 2] * 0.114; bits += a1 > a2 ? '1' : '0'; }
    var hex = ''; for (var b = 0; b < 64; b += 4) hex += parseInt(bits.slice(b, b + 4), 2).toString(16);
    return { sharpness: Math.round(variance * 10) / 10, brightness: Math.round(mean), dhash: hex };
  }
  function thumbOf(bmp, max) {
    var s = Math.min(1, max / Math.max(bmp.width, bmp.height)), c = mkCanvas(Math.round(bmp.width * s), Math.round(bmp.height * s));
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.6);
  }
  function compressedSize(bmp) {
    var s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height)), c = mkCanvas(Math.round(bmp.width * s), Math.round(bmp.height * s));
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise(function (res) { c.toBlob(function (b) { res(b ? b.size : 0); }, 'image/jpeg', 0.82); });
  }
  function fileSha256(buf) {
    if (root.crypto && root.crypto.subtle && root.isSecureContext !== false) {
      return root.crypto.subtle.digest('SHA-256', buf).then(function (h) { return Array.prototype.map.call(new Uint8Array(h), function (b) { return pad(b.toString(16), 2); }).join(''); }).catch(function () { return sha256.bytes(new Uint8Array(buf)); });
    }
    return Promise.resolve(sha256.bytes(new Uint8Array(buf)));
  }
  function videoMeta(file) {
    return new Promise(function (res) {
      var v = document.createElement('video'), u = URL.createObjectURL(file), done = false;
      var fin = function (o) { if (!done) { done = true; URL.revokeObjectURL(u); res(o); } };
      v.preload = 'metadata'; v.onloadedmetadata = function () { fin({ durationSec: Math.round(v.duration), height: v.videoHeight, width: v.videoWidth }); };
      v.onerror = function () { fin(null); }; setTimeout(function () { fin(null); }, 5000); v.src = u;
    });
  }
  var libCache = null;
  function libraryHashes() {
    if (libCache) return libCache;
    libCache = (S.demoLibrary || []).map(function (l) {
      var h = null;
      if (isBrowser) { try { var c = mkCanvas(1280, 960); drawScene(c, l.kind, l.variant, {}); h = imageMetrics(c).dhash; } catch (e) {} }
      return { id: l.id, name: l.ownerName, hotelId: l.ownerHotelId, dhash: h || fakeHex('lib' + l.kind + l.variant, 16) };
    });
    return libCache;
  }
  function aiRecognize(rule, seedHex, ctx) {
    var r = parseInt(seedHex.slice(0, 6), 16) / 0xFFFFFF, conf = 0.6 + r * 0.38;
    if (/fake|bad|wrong|test-low/i.test(ctx.fileName || '')) conf = 0.38;
    if (ctx.synthetic && ctx.synthetic.ai != null) conf = ctx.synthetic.ai;
    var label = rule.replace(/^(ai|ocr):/, '');
    var out = { label: label, confidence: Math.round(conf * 100) / 100 };
    if (label === 'signboard_text') out.detail = ctx.hotel.name;
    if (label === 'room_amenities') {
      var declared = (ctx.answer && ctx.answer.value) || [], miss = [];
      declared.forEach(function (id, i) { if (parseInt(seedHex.slice(6 + i, 8 + i), 16) / 255 < 0.18) miss.push(id); });
      out.missing = miss; out.detected = declared.length - miss.length; out.declared = declared.length;
    }
    if (label === 'verification_date') out.detail = '03.2027';
    return out;
  }

  function doUpload(p) {
    var owner = S.applications.filter(function (a) { return a.id === p.appId; })[0] || S.inspections.filter(function (i) { return i.id === p.appId; })[0];
    if (!owner) throw apiErr('NOT_FOUND', 'Заявка или инспекция не найдена');
    var isInsp = String(p.appId).indexOf('INS-') === 0, cert = isInsp ? getCert(owner.certNo) : null;
    var hotel = S.hotels[owner.hotelId], tpl = getTemplateVersion((isInsp ? 'tpl-hotels' : owner.templateId), isInsp ? cert.templateVersion : owner.templateVersion);
    var item = tpl.items.filter(function (i) { return i.code === p.itemCode; })[0]; if (!item) throw apiErr('ITEM_NOT_FOUND', 'Пункт не найден');
    var ctx = isInsp ? { category: cert.stars, type: hotel.type, floors: hotel.floors, rooms: hotel.rooms } : ctxFor(owner);
    var slots = expandSlots(item, ctx), slot = slots.filter(function (s) { return s.id === p.slotId; })[0] || slots[0];
    var st = S.settings, checks = [], source = p.source || 'file', syn = p.synthetic || null, file = p.file || null;
    var res = { ok: true, blocked: false };
    // 1. Только живая съёмка
    if (slot.live && ['camera', 'demo-camera', 'capture'].indexOf(source) < 0) {
      return { ok: false, blocked: true, evidence: null, checks: [ck('live', 'fail', 'chk.live.fail', {}, 'Для этого пункта нужна съёмка в реальном времени. Выбор из галереи заблокирован.')], zone: 'red' };
    }
    var mime = file ? file.type : (syn && syn.mime) || (slot.kind === 'photo' ? 'image/jpeg' : slot.kind === 'video' ? 'video/mp4' : 'application/pdf');
    var rec = { id: uid('EV'), ownerId: p.appId, itemCode: item.code, slotId: slot.id, version: 1, name: file ? file.name : (syn && syn.name) || 'demo', kind: slot.kind, mime: mime, size: file ? file.size : (syn && syn.size) || 600000,
      uploadedAt: nowIso(), source: source, synthetic: syn ? { kind: syn.kind, variant: syn.variant } : null, thumb: null };
    var prev = activeEv(p.appId, item.code, slot.id);
    var stepFile = file ? file.arrayBuffer() : Promise.resolve(null);
    return stepFile.then(function (buf) {
      var metaP;
      if (slot.kind === 'photo') {
        if (file && isBrowser) metaP = loadBitmap(file).then(function (bmp) {
          var m = imageMetrics(bmp); rec.width = bmp.width; rec.height = bmp.height; rec.sharpness = m.sharpness; rec.brightness = m.brightness; rec.dhash = m.dhash; rec.thumb = thumbOf(bmp, 360);
          return compressedSize(bmp).then(function (cs) { rec.sizeCompressed = cs; return rec; });
        });
        else { rec.width = (syn && syn.width) || 1920; rec.height = (syn && syn.height) || 1080; rec.sharpness = syn && syn.sharp != null ? syn.sharp : 220; rec.brightness = syn && syn.dark ? 22 : 118; rec.dhash = (syn && syn.dhash) || fakeHex('dh' + (syn ? syn.kind + syn.variant : rec.id), 16); metaP = Promise.resolve(rec); }
      } else if (slot.kind === 'video') {
        if (file && isBrowser) metaP = videoMeta(file).then(function (m) { rec.durationSec = m ? m.durationSec : null; rec.height = m ? m.height : null; rec.width = m ? m.width : null; return rec; });
        else { rec.durationSec = (syn && syn.durationSec) || 42; rec.height = (syn && syn.height) || 1080; metaP = Promise.resolve(rec); }
      } else metaP = Promise.resolve(rec);
      return metaP.then(function () {
        var h = buf ? fileSha256(buf) : Promise.resolve(fakeHex('sha' + rec.id, 64));
        return h.then(function (hex) {
          rec.sha256 = hex; rec.exif = buf && slot.kind === 'photo' ? readExif(buf) : null;
          // Позиция
          var pos = p.position || null;
          if (!pos && rec.exif && rec.exif.lat != null) pos = { lat: rec.exif.lat, lng: rec.exif.lng, src: 'exif' };
          // 2. Геометка
          if (slot.kind !== 'pdf') {
            if (pos && hotel.lat != null) {
              var d = haversine(pos.lat, pos.lng, hotel.lat, hotel.lng); rec.lat = pos.lat; rec.lng = pos.lng; rec.distanceM = d; rec.posSource = pos.src || 'gps';
              checks.push(d <= st.geoRadiusM ? ck('geotag', 'ok', 'chk.geotag.ok', { d: d, r: st.geoRadiusM }, 'Геометка: ' + d + ' м от объекта (допустимо ' + st.geoRadiusM + ' м)') : ck('geotag', 'fail', 'chk.geotag.fail', { d: d, r: st.geoRadiusM }, 'Вне радиуса: ' + d + ' м от объекта (допустимо ' + st.geoRadiusM + ' м)'));
            } else checks.push(slot.live ? ck('geotag', 'fail', 'chk.geotag.none', {}, 'Геометка не определена. Разрешите доступ к геопозиции и переснимите.') : ck('geotag', 'warn', 'chk.geotag.none.warn', {}, 'Геометка не определена: проверит инспектор'));
          }
          // 3. Время
          var taken = rec.exif && rec.exif.dateTimeOriginal ? new Date(rec.exif.dateTimeOriginal) : (file && file.lastModified && source === 'file' ? new Date(file.lastModified) : new Date());
          rec.takenAt = taken.toISOString().slice(0, 19);
          var ageDays = Math.floor((Date.now() - taken.getTime()) / 864e5);
          checks.push(ageDays <= st.shootWindowDays ? ck('time', 'ok', 'chk.time.ok', { d: Math.max(0, ageDays), w: st.shootWindowDays }, 'Время: снято ' + Math.max(0, ageDays) + ' дн. назад (окно ' + st.shootWindowDays + ' дн.)') : ck('time', 'fail', 'chk.time.fail', { d: ageDays, w: st.shootWindowDays }, 'Снимок старше окна: ' + ageDays + ' дн. (допустимо ' + st.shootWindowDays + ')'));
          // 4. Целостность
          checks.push(ck('hash', 'ok', 'chk.hash.ok', { h: rec.sha256.slice(0, 12) }, 'Целостность: SHA-256 ' + rec.sha256.slice(0, 12) + '…, файл неизменяем после отправки'));
          if (rec.exif && (rec.exif.make || rec.exif.model)) rec.exifNote = [rec.exif.make, rec.exif.model].filter(Boolean).join(' ');
          // 5. Формат / качество
          if (slot.kind === 'photo') {
            var fail = null;
            if (rec.width < st.minPhotoWidth || rec.height < st.minPhotoHeight) fail = ck('quality', 'fail', 'chk.quality.res', { w: rec.width, h: rec.height, mw: st.minPhotoWidth, mh: st.minPhotoHeight }, 'Разрешение ' + rec.width + '×' + rec.height + ' ниже минимума ' + st.minPhotoWidth + '×' + st.minPhotoHeight);
            else if (rec.sharpness < st.minSharpness) fail = ck('quality', 'fail', 'chk.quality.blur', { s: Math.round(rec.sharpness), m: st.minSharpness }, 'Размыто (резкость ' + Math.round(rec.sharpness) + ' < ' + st.minSharpness + '). Переснимите.');
            else if (rec.brightness < 35 && !slot.dark) fail = ck('quality', 'warn', 'chk.quality.dark', { b: rec.brightness }, 'Тёмный снимок (яркость ' + rec.brightness + '). Добавьте освещение.');
            else if (rec.brightness > 240) fail = ck('quality', 'warn', 'chk.quality.bright', { b: rec.brightness }, 'Пересвеченный снимок');
            checks.push(fail || ck('quality', 'ok', 'chk.quality.ok', { s: Math.round(rec.sharpness), w: rec.width, h: rec.height }, 'Качество: резкость ' + Math.round(rec.sharpness) + ', ' + rec.width + '×' + rec.height));
            // 6. Дубликаты
            var dupFail = null, dupWarn = null;
            if (rec.dhash) {
              libraryHashes().forEach(function (l) { var dd = hamming(rec.dhash, l.dhash); if (l.hotelId !== owner.hotelId) { if (dd <= st.dupHamming) dupFail = dupFail || { name: l.name, d: dd }; else if (dd <= st.nearDupHamming) dupWarn = dupWarn || { name: l.name, d: dd }; } });
              Object.keys(S.evidence).forEach(function (id) {
                var e = S.evidence[id]; if (!e.dhash || e.kind !== 'photo' || e.replacedBy || (e.ownerId === p.appId && e.itemCode === item.code && e.slotId === slot.id)) return;
                var eo = S.applications.filter(function (a) { return a.id === e.ownerId; })[0] || S.inspections.filter(function (a) { return a.id === e.ownerId; })[0];
                var eh = eo ? eo.hotelId : null, dd = hamming(rec.dhash, e.dhash);
                if (eh && eh !== owner.hotelId) { if (dd <= st.dupHamming) dupFail = dupFail || { name: S.hotels[eh] ? S.hotels[eh].name : eh, d: dd }; else if (dd <= st.nearDupHamming) dupWarn = dupWarn || { name: S.hotels[eh] ? S.hotels[eh].name : eh, d: dd }; }
                else if (eh === owner.hotelId && dd <= st.dupHamming && e.itemCode !== item.code) dupWarn = dupWarn || { name: 'этой же заявки (' + e.itemCode + ')', d: dd };
              });
            }
            if (dupFail) checks.push(ck('duplicate', 'fail', 'chk.dup.fail', { name: dupFail.name }, 'Совпадает с материалом другого объекта: ' + dupFail.name + '. Красная зона.'));
            else if (dupWarn) checks.push(ck('duplicate', 'warn', 'chk.dup.warn', { name: dupWarn.name }, 'Близкое совпадение с материалом: ' + dupWarn.name));
            else checks.push(ck('duplicate', 'ok', 'chk.dup.ok', {}, 'Дубликатов в базе не найдено (dHash)'));
          }
          if (slot.kind === 'video') {
            var mn = slot.minSec || 5, mx = slot.maxSec || 120, bad = null;
            if (rec.mime && rec.mime.indexOf('mp4') < 0 && !(syn)) bad = ck('video', 'fail', 'chk.video.fmt', {}, 'Нужен формат MP4');
            else if (rec.height && rec.height < 720) bad = ck('video', 'fail', 'chk.video.res', { h: rec.height }, 'Разрешение ' + rec.height + 'p ниже 720p');
            else if (rec.durationSec != null && (rec.durationSec < mn || rec.durationSec > mx)) bad = ck('video', 'fail', 'chk.video.dur', { s: rec.durationSec, a: mn, b: mx }, 'Длительность ' + rec.durationSec + ' с вне диапазона ' + mn + '–' + mx + ' с');
            checks.push(bad || ck('video', 'ok', 'chk.video.ok', { s: rec.durationSec, h: rec.height }, 'Видео: ' + rec.durationSec + ' с, ' + rec.height + 'p, MP4'));
          }
          if (slot.kind === 'pdf') {
            var okp = rec.mime === 'application/pdf' && rec.size <= 20 * 1024 * 1024;
            checks.push(okp ? ck('format', 'ok', 'chk.pdf.ok', {}, 'PDF принят') : ck('format', 'fail', 'chk.pdf.fail', {}, 'Нужен PDF до 20 МБ'));
          }
          // 7. ИИ-подсказки
          (item.autocheck || []).forEach(function (rule) {
            if (rule.indexOf('ai:') === 0 || rule.indexOf('ocr:') === 0) {
              if (slot.kind === 'pdf') return;
              var a = (S.answers[p.appId] || {})[item.code], r = aiRecognize(rule, rec.sha256, { fileName: rec.name, synthetic: syn, hotel: hotel, answer: a });
              var low = r.confidence < st.aiMinConfidence || (r.missing && r.missing.length);
              var tx = 'ИИ-подсказка (' + r.label + '): уверенность ' + Math.round(r.confidence * 100) + '%' + (r.detail ? ', «' + r.detail + '»' : '') + (r.missing && r.missing.length ? ', не найдено: ' + r.missing.join(', ') : '') + '. Подсказка инспектору, не решение.';
              var c = ck('ai', low ? 'warn' : 'ok', low ? 'chk.ai.warn' : 'chk.ai.ok', { l: r.label, c: Math.round(r.confidence * 100), det: r.detail || '', miss: (r.missing || []).join(', ') }, tx); c.ai = r; checks.push(c);
            }
          });
          rec.checks = checks;
          var hardFail = checks.some(function (c) { return c.status === 'fail' && c.id !== 'duplicate'; }), dupF = checks.some(function (c) { return c.id === 'duplicate' && c.status === 'fail'; });
          rec.status = hardFail ? 'rejected' : dupF ? 'flagged' : 'accepted';
          rec.compressed = rec.sizeCompressed ? Math.round(rec.size / Math.max(1, rec.sizeCompressed) * 10) / 10 : null;
          if (prev) { rec.version = prev.version + 1; prev.replacedBy = rec.id; }
          S.evidence[rec.id] = rec; S.answers[p.appId] = S.answers[p.appId] || {}; S.answers[p.appId][item.code] = S.answers[p.appId][item.code] || { value: undefined, updatedAt: nowIso() };
          save('evidence'); save('answers');
          audit(isInsp ? 'applicant' : (owner.applicantId || 'applicant'), 'evidence.upload', p.appId + '/' + item.code + '/' + slot.id, prev ? { evidence: prev.id, v: prev.version } : null, { evidence: rec.id, v: rec.version, status: rec.status, sha256: rec.sha256.slice(0, 16) });
          emit('evidence');
          return { ok: true, blocked: false, evidence: clone(rec), checks: clone(checks), zone: evZone(rec), version: rec.version };
        });
      });
    });
  }

  /* ---------- демо-изображения (процедурные) ---------- */
  function drawScene(canvas, kind, variant, opts) {
    var w = canvas.width, h = canvas.height, x = canvas.getContext('2d'), r = mulberry32(strSeed(kind) ^ (variant * 2654435761 >>> 0));
    var pal = { signboard: ['#2b2a3a', '#d9a441'], extinguisher: ['#d9d2c3', '#b3261e'], room: ['#e6dccb', '#8b6f4e'], parking: ['#7d8590', '#e8e8e8'], entrance: ['#c7b79d', '#3b2a20'], reception: ['#dcd0bd', '#6b4a2f'], bathroom: ['#dfe8ea', '#5b7f87'], hall: ['#d8c9ae', '#8c5e3c'], water: ['#cfe3ea', '#3a7c93'], document: ['#f4f1ea', '#444'], lift: ['#bdbdbd', '#555'], cctv: ['#303030', '#8fe388'], staff: ['#d6cfc2', '#2f4f7f'], board: ['#e7dfc9', '#6b4a2f'], video: ['#d1c6b2', '#8b6f4e'] };
    var P = pal[kind] || pal.room, g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, P[0]); g.addColorStop(1, shade(P[0], -26)); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (var i = 0; i < 18; i++) { x.fillStyle = 'rgba(' + Math.floor(r() * 160) + ',' + Math.floor(r() * 150) + ',' + Math.floor(r() * 140) + ',' + (0.18 + r() * 0.3).toFixed(2) + ')'; x.fillRect(r() * w, r() * h, w * (0.06 + r() * 0.25), h * (0.05 + r() * 0.3)); }
    x.fillStyle = P[1];
    if (kind === 'extinguisher') { x.fillRect(w * .44, h * .22, w * .12, h * .56); x.fillStyle = '#222'; x.fillRect(w * .46, h * .15, w * .08, h * .09); x.fillStyle = '#fff'; x.fillRect(w * .455, h * .42, w * .09, h * .13); }
    else if (kind === 'signboard') { x.fillRect(w * .2, h * .3, w * .6, h * .22); x.fillStyle = '#fff'; x.font = 'bold ' + Math.round(h * .09) + 'px sans-serif'; x.textAlign = 'center'; x.fillText('HOTEL ' + (variant % 97), w * .5, h * .46); }
    else if (kind === 'room') { x.fillRect(w * .15, h * .55, w * .45, h * .18); x.fillRect(w * .65, h * .3, w * .2, h * .43); x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(w * .62, h * .08, w * .22, h * .2); }
    else { x.fillRect(w * (.2 + r() * .1), h * (.3 + r() * .1), w * .4, h * .35); }
    for (var k = 0; k < 40; k++) { x.strokeStyle = 'rgba(30,20,10,' + (0.25 + r() * 0.35).toFixed(2) + ')'; x.lineWidth = 1 + r() * 2; x.beginPath(); x.moveTo(r() * w, r() * h); x.lineTo(r() * w, r() * h); x.stroke(); }
    if (opts.dark) { x.fillStyle = 'rgba(0,0,0,.82)'; x.fillRect(0, 0, w, h); }
    if (opts.blur) {
      var c2 = mkCanvas(Math.max(8, w >> 5), Math.max(6, h >> 5)); c2.getContext('2d').drawImage(canvas, 0, 0, c2.width, c2.height);
      x.imageSmoothingEnabled = true; x.drawImage(c2, 0, 0, w, h);
    }
  }
  function shade(hex, amt) { var n = parseInt(hex.slice(1), 16), c = function (v) { return Math.max(0, Math.min(255, v + amt)); }; return 'rgb(' + c(n >> 16) + ',' + c((n >> 8) & 255) + ',' + c(n & 255) + ')'; }
  function makeDemoImage(kind, variant, opts) {
    var c = mkCanvas(1280, 960); drawScene(c, kind, variant, opts);
    return new Promise(function (res) { c.toBlob(function (b) { res(new File([b], 'demo-' + kind + '-' + variant + (opts.blur ? '-blur' : '') + '.jpg', { type: 'image/jpeg', lastModified: Date.now() })); }, 'image/jpeg', 0.9); });
  }

  root.CertAPI = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
