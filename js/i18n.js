/* ============================================================
   I18N.JS — русская и английская версии сайта.
   Подключается в <head> первым скриптом.
   • Язык: ?lang=en|ru в адресе → выбор посетителя (localStorage) → русский.
   • В английской версии подгружается словарь js/i18n-en.js и
     переводится всё на странице: исходная вёрстка, тексты, которые
     дорисовывают скрипты (каталог, паспорта, формы), подсказки,
     alt/placeholder/aria-label, заголовок вкладки и мета-теги.
   • Словарь: I18N_EN.t — строки целиком, I18N_EN.h — абзацы с
     разметкой внутри (ссылки, выделения), I18N_EN.p — шаблоны
     с числами. Строки сравниваются без учёта лишних пробелов.
   ============================================================ */
(function () {
  'use strict';
  var KEY = 'hip_lang';
  var VER = 'en_1';

  function pick() {
    var q = null;
    try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
    if (q === 'en' || q === 'ru') { try { localStorage.setItem(KEY, q); } catch (e) {} return q; }
    var s = null;
    try { s = localStorage.getItem(KEY); } catch (e) {}
    return s === 'en' ? 'en' : 'ru';
  }
  var lang = pick();
  var root = document.documentElement;
  root.lang = lang;
  window.SITE_LANG = lang;
  window.setSiteLang = function (l) {
    try { localStorage.setItem(KEY, l); } catch (e) {}
    var u = new URL(location.href);
    if (u.searchParams.has('lang')) u.searchParams.set('lang', l);
    location.replace(u.toString());
  };
  // t() для скриптов: в русской версии возвращает строку как есть
  window.t = function (s) { return s; };
  if (lang !== 'en') return;

  root.classList.add('lang-en', 'i18n-wait');
  var src = (document.currentScript && document.currentScript.src) || 'js/i18n.js';
  var dictUrl = src.replace(/i18n\.js(\?.*)?$/, 'i18n-en.js?v=' + VER);
  document.write('<style id="i18n-wait">html.i18n-wait body{visibility:hidden}</style>');
  document.write('<script src="' + dictUrl + '"><\/script>');
  document.write('<script>window.__i18nInit && window.__i18nInit();<\/script>');

  var CYR = /[А-Яа-яЁё]/;
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, svg: 1, SVG: 1, PRE: 1 };
  var INLINE = { A: 1, B: 1, STRONG: 1, EM: 1, I: 1, SPAN: 1, SMALL: 1, SUP: 1, SUB: 1, BR: 1, ABBR: 1, U: 1, S: 1, MARK: 1, NOBR: 1, TIME: 1, Q: 1, BDI: 1 };
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'data-tip', 'data-label'];
  var D = null, T = {}, H = {}, P = [], HP = [];
  var miss = window.__i18nMiss = {};
  var piece = window.__i18nPiece = {};
  var busy = false;

  function norm(s) { return String(s).replace(/&nbsp;/g, ' ').replace(/[\s  ]+/g, ' ').trim(); }
  function note(kind, k) { if (!miss[k]) miss[k] = kind; }

  // Числа по-английски: 6 909 → 6,909; 21,5 → 21.5
  function numfix(s) {
    if (/\+\s?\d|tel:|\d{2}:\d{2}/.test(s)) return s;   // телефоны и время не трогаем
    return s
      .replace(/(\d),(\d{1,2})(?!\d)/g, '$1.$2')
      .replace(/(\d)[   ](?=\d{3}(?!\d))/g, '$1,')
      .replace(/(\d)[   ](?=\d{3}(?!\d))/g, '$1,');
  }

  var SEPS = [' · ', ' — ', ' – ', ' | ', ' / ', ', ', ': ', '; '];
  function tr(s, depth) {
    var k = norm(s);
    if (!k) return s;
    if (!CYR.test(k)) return numfix(k);
    if (Object.prototype.hasOwnProperty.call(T, k)) return T[k];
    var k2 = k;
    for (var i = 0; i < P.length; i++) { P[i][0].lastIndex = 0; k2 = k2.replace(P[i][0], P[i][1]); }
    if (k2 !== k) {
      if (!CYR.test(k2)) return numfix(k2);
      if (Object.prototype.hasOwnProperty.call(T, k2)) return T[k2];
    }
    if ((depth || 0) < 3) {
      for (var j = 0; j < SEPS.length; j++) {
        var sep = SEPS[j];
        if (k.indexOf(sep) < 0) continue;
        var parts = k.split(sep), ok = true;
        for (var m = 0; m < parts.length; m++) {
          var r = tr(parts[m], (depth || 0) + 1);
          if (r === null) { ok = false; break; }
          parts[m] = r;
        }
        if (ok) return parts.join(sep);
      }
      // разделитель в начале или конце куска: «· текст», «текст ·»
      var em = k.match(/^([·—–,:;|\/]\s*)?(.*?)(\s*[·—–,:;|\/])?$/);
      if (em && (em[1] || em[3]) && em[2]) { var core = tr(em[2], depth + 1); if (core !== null) return (em[1] || '') + core + (em[3] || ''); }
      // «Слово (уточнение)» и «Текст.» — переводим части
      var pm = k.match(/^(.*?)\s*\(([^()]+)\)$/);
      if (pm) { var a = tr(pm[1], depth + 1), b = tr(pm[2], depth + 1); if (a !== null && b !== null) return a + ' (' + b + ')'; }
    }
    return null;
  }

  function textNode(n, quiet) {
    var v = n.nodeValue;
    if (!v || !/\S/.test(v)) return;
    var hasCyr = CYR.test(v);
    if (!hasCyr && !/\d[\s  ,]\d/.test(v)) return;
    var out = tr(v, 0);
    if (out === null) { if (!quiet) note('t', norm(v)); return; }
    var lead = v.match(/^\s*/)[0], tail = v.match(/\s*$/)[0];
    var nv = lead + out + tail;
    if (nv !== v) n.nodeValue = nv;
  }

  function attrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i], v = el.getAttribute && el.getAttribute(a);
      if (v && CYR.test(v)) { var o = tr(v, 0); if (o === null) note('a', norm(v)); else if (o !== v && o !== norm(v)) el.setAttribute(a, o); }
    }
    if (el.tagName === 'INPUT' && (el.type === 'submit' || el.type === 'button') && CYR.test(el.value || '')) {
      var ov = tr(el.value, 0); if (ov === null) note('a', norm(el.value)); else if (ov !== el.value) el.value = ov;
    }
    if (el.tagName === 'META' && /^(description|og:title|og:description|twitter:title|twitter:description)$/.test(el.getAttribute('name') || el.getAttribute('property') || '')) {
      var c = el.getAttribute('content');
      if (c && CYR.test(c)) { var oc = tr(c, 0); if (oc === null) note('a', norm(c)); else if (oc !== c) el.setAttribute('content', oc); }
    }
  }

  function inlineDeep(el) {
    for (var c = el.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 1) { if (!INLINE[c.tagName] || !inlineDeep(c)) return false; }
      else if (c.nodeType !== 3 && c.nodeType !== 8) return false;
    }
    return true;
  }
  // Абзац с разметкой внутри: есть собственный текст и только строчные теги
  function isUnit(el) {
    var hasEl = false, hasText = false;
    for (var c = el.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 1) { if (!INLINE[c.tagName] || !inlineDeep(c)) return false; if (c.tagName !== 'BR') hasEl = true; }
      else if (c.nodeType === 3 && /\S/.test(c.nodeValue)) hasText = true;
    }
    return hasEl && hasText && CYR.test(el.textContent);
  }
  function unit(el) {
    var k = norm(el.innerHTML);
    var v = Object.prototype.hasOwnProperty.call(H, k) ? H[k] : null;
    if (v === null) {
      for (var i = 0; i < HP.length; i++) { HP[i][0].lastIndex = 0; if (HP[i][0].test(k)) { HP[i][0].lastIndex = 0; v = k.replace(HP[i][0], HP[i][1]); break; } }
    }
    if (v === null) return false;
    el.innerHTML = v;
    return true;
  }

  function walk(n, quiet) {
    if (n.nodeType === 3) { textNode(n, quiet); return; }
    if (n.nodeType !== 1 || SKIP[n.tagName] || n.isContentEditable || (n.hasAttribute && n.hasAttribute('data-i18n-skip'))) return;
    attrs(n);
    if (n.tagName === 'TITLE') { var tt = n.textContent; if (CYR.test(tt)) { var o = tr(tt, 0); if (o === null) note('t', norm(tt)); else if (o !== tt) n.textContent = o; } return; }
    var q = quiet;
    if (isUnit(n)) {
      if (unit(n)) { var all = n.getElementsByTagName('*'); for (var i = 0; i < all.length; i++) attrs(all[i]); return; }
      var key = norm(n.innerHTML);
      var kids0 = Array.prototype.slice.call(n.childNodes);
      for (var j0 = 0; j0 < kids0.length; j0++) walk(kids0[j0], true);   // по частям
      if (!quiet && CYR.test(n.textContent)) note('h', key);             // в пропуски — абзац целиком
      else if (!quiet) piece[key] = n.innerHTML;                            // для проверки порядка слов
      return;
    }
    var kids = Array.prototype.slice.call(n.childNodes);
    for (var j = 0; j < kids.length; j++) walk(kids[j], q);
  }

  function nearestUnit(n) {
    var el = n.nodeType === 1 ? n : n.parentNode;
    while (el && el.nodeType === 1 && INLINE[el.tagName]) {
      var p = el.parentNode;
      if (p && p.nodeType === 1 && isUnit(p)) return p;
      el = p;
    }
    if (el && el.nodeType === 1 && isUnit(el)) return el;
    return null;
  }

  function onMut(list) {
    if (busy) return;
    busy = true;
    try {
      for (var i = 0; i < list.length; i++) {
        var r = list[i];
        if (r.type === 'childList') {
          for (var j = 0; j < r.addedNodes.length; j++) {
            var a = r.addedNodes[j];
            if (!a.isConnected) continue;
            var u = nearestUnit(a);
            if (u) walk(u); else walk(a);
          }
        } else if (r.type === 'characterData') {
          var u2 = nearestUnit(r.target);
          if (u2) walk(u2); else textNode(r.target);
        } else if (r.type === 'attributes' && r.target.nodeType === 1) {
          attrs(r.target);
        }
      }
    } finally { busy = false; }
  }

  // В английской версии числа и даты из toLocaleString('ru-RU') — по-английски
  var nativeLS = Number.prototype.toLocaleString;
  Number.prototype.toLocaleString = function (loc, opt) {
    if (loc === 'ru-RU' || loc === 'ru') loc = 'en-US';
    return nativeLS.call(this, loc, opt);
  };

  function ready() {
    walk(document.head);
    walk(document.body);
    var mo = new MutationObserver(onMut);
    mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    root.classList.remove('i18n-wait');
  }

  window.__i18nInit = function () {
    D = window.I18N_EN || {};
    T = D.t || {};
    H = D.h || {};
    P = (D.p || []).map(function (x) { return [x[0], x[1]]; });
    HP = (D.hp || []).map(function (x) { return [x[0], x[1]]; });
    // перевод для скриптов: t('строка')
    window.t = function (s) { var o = tr(s, 0); return o === null ? s : o; };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
    else ready();
  };
  // страховка: страница не должна оставаться скрытой
  setTimeout(function () { root.classList.remove('i18n-wait'); }, 2500);
})();
