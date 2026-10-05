/* ============================================================
   EVENTS · core/i18n.js
   Движок многоязычности раздела (RU / UZ / EN).
   • Словари лежат в js/events/i18n/<lang>.js и регистрируются через
     EV.I18n.register('<lang>', {...}).
   • Чтобы добавить язык: создать файл словаря, подключить его,
     добавить код в EV.I18n.LANGS и кнопку в шапке (см. README).
   • Язык хранится в localStorage под тем же ключом, что и на всём
     сайте (hip_lang) — выбор синхронизирован с остальными страницами.
   ============================================================ */
(function () {
  'use strict';
  const EV = (window.EV = window.EV || {});
  const KEY = 'hip_lang';
  const listeners = [];
  const I18n = (EV.I18n = {
    LANGS: ['ru', 'uz', 'en'],
    FALLBACK: 'ru',
    dict: {},
    lang: 'ru',

    register(lang, obj) {
      this.dict[lang] = Object.assign(this.dict[lang] || {}, obj);
    },

    /** Перевод по ключу с подстановкой {param}. Если ключа нет — fallback → сам ключ. */
    t(key, params) {
      const d = this.dict;
      let s = (d[this.lang] && d[this.lang][key]);
      if (s == null) s = d[this.FALLBACK] && d[this.FALLBACK][key];
      if (s == null) s = key;
      if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (params[k] != null ? params[k] : m));
      return s;
    },

    has(key) { return !!(this.dict[this.lang] && this.dict[this.lang][key] != null) || !!(this.dict[this.FALLBACK] && this.dict[this.FALLBACK][key] != null); },

    init() {
      let l = null;
      try { l = new URLSearchParams(location.search).get('lang') || localStorage.getItem(KEY); } catch (e) {}
      this.lang = this.LANGS.includes(l) ? l : this.FALLBACK;
      document.documentElement.lang = this.lang;
      // Подписка на кнопки RU/UZ/EN в шапке и футере (они уже есть на странице)
      document.addEventListener('click', (e) => {
        const b = e.target.closest('.lang-btn, .footer-lang-link, [data-set-lang]');
        if (!b) return;
        const lang = b.dataset.lang || b.dataset.setLang;
        if (lang && this.LANGS.includes(lang)) { e.preventDefault(); this.set(lang); }
      });
      this.apply(document);
    },

    set(lang) {
      if (!this.LANGS.includes(lang) || lang === this.lang) { this.syncButtons(); return; }
      this.lang = lang;
      try { localStorage.setItem(KEY, lang); } catch (e) {}
      document.documentElement.lang = lang;
      this.apply(document);
      listeners.forEach((fn) => { try { fn(lang); } catch (e) { console.error(e); } });
    },

    onChange(fn) { listeners.push(fn); },

    syncButtons() {
      document.querySelectorAll('.lang-btn, .footer-lang-link').forEach((b) => {
        const on = b.dataset.lang === this.lang;
        b.classList.toggle('lang-btn--active', on && b.classList.contains('lang-btn'));
        b.classList.toggle('footer-lang-link--active', on && b.classList.contains('footer-lang-link'));
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    },

    /** Применить переводы к статической разметке (data-i18n*). */
    apply(root) {
      root = root || document;
      root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = this.t(el.dataset.i18n); });
      root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = this.t(el.dataset.i18nHtml); });
      root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
        el.dataset.i18nAttr.split(';').forEach((pair) => {
          const [attr, key] = pair.split(':').map((x) => x.trim());
          if (attr && key) el.setAttribute(attr, this.t(key));
        });
      });
      if (document.title && document.body && document.body.dataset.titleKey) document.title = this.t(document.body.dataset.titleKey);
      this.syncButtons();
    },
  });
  EV.t = (k, p) => I18n.t(k, p);
})();
