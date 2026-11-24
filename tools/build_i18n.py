#!/usr/bin/env python3
"""Собирает словарь английской версии js/i18n-en.js из частей tools/i18n/*.js.
Каждая часть дописывает в T (строки), H (абзацы с разметкой), P и HP (шаблоны).
Запуск: python3 tools/build_i18n.py"""
import glob, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
parts = sorted(glob.glob(os.path.join(root, 'tools', 'i18n', '*.js')) + glob.glob(os.path.join(root, 'tools', 'i18n', '*.json')), key=os.path.basename)
out = ['/* Словарь английской версии. Собирается: python3 tools/build_i18n.py — не править вручную. */',
       'window.I18N_EN = (function () {', '  var T = {}, H = {}, P = [], HP = [];']
for p in parts:
    out.append('  /* ── ' + os.path.basename(p) + ' ── */')
    src = open(p, encoding='utf-8').read()
    if p.endswith('.json'):   # *_html.json — абзацы с разметкой, остальные — строки
        src = ('Object.assign(H, ' if 'html' in os.path.basename(p) else 'Object.assign(T, ') + src.strip() + ');'
    out.append(src)
out.append('''  var norm = function (s) { return String(s).replace(/&nbsp;/g, ' ').replace(/[\\s\\u00A0\\u202F]+/g, ' ').trim(); };
  var t = {}, h = {};
  Object.keys(T).forEach(function (k) { t[norm(k)] = T[k]; });
  Object.keys(H).forEach(function (k) { h[norm(k)] = H[k]; });
  return { t: t, h: h, p: P, hp: HP };
})();''')
open(os.path.join(root, 'js', 'i18n-en.js'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print('ok', len(parts), 'parts')
