/* ============================================================
   EVENTS · core/utils.js
   Общие утилиты раздела «Проведение государственных мероприятий».
   Все даты в данных — «наивные» локальные ISO-строки: YYYY-MM-DDTHH:mm
   (так их понимает <input type="datetime-local">, и они не зависят
   от часового пояса сервера при будущей миграции на PostgreSQL).
   ============================================================ */
(function () {
  'use strict';
  const EV = (window.EV = window.EV || {});
  const U = (EV.U = {});
  const pad = (n) => String(n).padStart(2, '0');

  /* ── Строки / HTML ───────────────────────────────────────── */
  U.esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.uid = (p) => (p || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  U.clone = (o) => (o == null ? o : JSON.parse(JSON.stringify(o)));
  U.hash = (str) => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0);
  };
  U.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  U.uniq = (a) => Array.from(new Set(a));
  U.sum = (a, f) => a.reduce((s, x) => s + (f ? f(x) : x), 0);
  U.groupBy = (a, f) => a.reduce((m, x) => { const k = f(x); (m[k] = m[k] || []).push(x); return m; }, {});
  U.sortBy = (a, f) => a.slice().sort((x, y) => { const A = f(x), B = f(y); return A < B ? -1 : A > B ? 1 : 0; });

  /* ── Даты ────────────────────────────────────────────────── */
  U.parse = (s) => {
    if (!s) return null;
    if (s instanceof Date) return s;
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
    if (!m) { const d = new Date(s); return isNaN(d) ? null : d; }
    return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
  };
  U.toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  U.toDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  U.day = (s) => (s ? String(s).slice(0, 10) : '');
  U.nowISO = () => U.toISO(new Date());
  U.addDays = (s, n) => { const d = U.parse(s); d.setDate(d.getDate() + n); return d; };
  U.addMinutes = (s, n) => new Date(U.parse(s).getTime() + n * 60000);
  U.startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  U.locale = () => ({ ru: 'ru-RU', uz: 'uz-UZ', en: 'en-GB' }[EV.I18n ? EV.I18n.lang : 'ru'] || 'ru-RU');
  U.fmtDate = (s) => { const d = U.parse(s); return d ? `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}` : '—'; };
  U.fmtShort = (s) => { const d = U.parse(s); return d ? `${pad(d.getDate())}.${pad(d.getMonth() + 1)}` : '—'; };
  U.fmtTime = (s) => { const d = U.parse(s); return d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '—'; };
  U.fmtDT = (s) => { const d = U.parse(s); return d ? `${U.fmtShort(d)} ${U.fmtTime(d)}` : '—'; };
  U.fmtDTFull = (s) => { const d = U.parse(s); return d ? `${U.fmtDate(d)} ${U.fmtTime(d)}` : '—'; };
  U.fmtRange = (a, b) => `${U.fmtDate(a)} — ${U.fmtDate(b)}`;
  U.nights = (a, b) => {
    const x = U.startOfDay(U.parse(a)), y = U.startOfDay(U.parse(b));
    return Math.max(0, Math.round((y - x) / 86400000));
  };
  U.overlap = (a1, a2, b1, b2) => {
    const A1 = +U.parse(a1), A2 = +U.parse(a2), B1 = +U.parse(b1), B2 = +U.parse(b2);
    return A1 < B2 && B1 < A2;
  };
  U.hoursUntil = (s) => (U.parse(s) - new Date()) / 3600000;
  U.isSameDay = (a, b) => U.day(U.toISO(U.parse(a))) === U.day(U.toISO(U.parse(b)));
  U.monthName = (d, style) => new Intl.DateTimeFormat(U.locale(), { month: style || 'long' }).format(d);
  U.weekdayName = (d, style) => new Intl.DateTimeFormat(U.locale(), { weekday: style || 'short' }).format(d);
  U.relative = (s) => {
    const h = U.hoursUntil(s);
    const ah = Math.abs(h);
    const v = ah < 1 ? Math.round(ah * 60) + ' ' + EV.I18n.t('u.min') : ah < 48 ? Math.round(ah) + ' ' + EV.I18n.t('u.h') : Math.round(ah / 24) + ' ' + EV.I18n.t('u.d');
    return h < 0 ? EV.I18n.t('u.ago', { v }) : EV.I18n.t('u.in', { v });
  };

  /* ── Персональные данные / ссылки ────────────────────────── */
  U.maskPassport = (p) => {
    if (!p) return '—';
    const s = String(p);
    if (s.length <= 4) return '••••';
    return s.slice(0, 2) + '•'.repeat(Math.max(3, s.length - 4)) + s.slice(-2);
  };
  U.digits = (p) => String(p || '').replace(/[^\d+]/g, '');
  U.tel = (p) => (p ? 'tel:' + U.digits(p) : '#');
  U.telLink = (p, label) => (p ? `<a class="ev-tel" href="${U.tel(p)}">${U.esc(label || p)}</a>` : '—');
  U.navLink = (lat, lng, text) =>
    lat != null && lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text || '')}`;
  U.flag = (cc) => {
    if (!cc || cc.length !== 2) return '🏳';
    return String.fromCodePoint(...cc.toUpperCase().split('').map((c) => 127397 + c.charCodeAt(0)));
  };
  U.initials = (name) => String(name || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  /* ── Файлы ───────────────────────────────────────────────── */
  U.download = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
  };
  U.downloadText = (text, name, mime) => U.download(new Blob([text], { type: mime || 'text/plain;charset=utf-8' }), name);
  U.slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-|-$/g, '').slice(0, 40);

  /* ── Многоязычные поля данных ────────────────────────────────
     Демо-данные могут хранить {ru,uz,en}; пользовательский ввод — строка. */
  U.tx = (v) => {
    if (v == null) return '';
    if (typeof v === 'object' && !Array.isArray(v)) {
      const l = EV.I18n ? EV.I18n.lang : 'ru';
      return v[l] || v.ru || v.en || '';
    }
    return String(v);
  };
})();
