#!/usr/bin/env python3
"""Единые шапка, мобильное меню и подвал для страниц сайта.
Запуск: python3 tools/layout.py index.html portfolio.html ...
Заменяет блоки <header class="site-header">…</header>, <div class="mobile-nav">…</div>
и <footer class="site-footer">…</footer> (кроме подвала главной), убирает плавающую
панель spatial-dock."""
import re
import sys

HEADER = '''<header class="site-header" id="site-header" role="banner">
    <div class="header-inner">
      <a href="index.html" class="header-logo" aria-label="Silk Route Invest — Главная">
        <img src="./assets/logo-icon.png" alt="Silk Route Invest" class="logo-emblem-img" width="34" height="38" />
        <div class="logo-text">
          <span class="logo-title">SILK ROUTE</span>
          <span class="logo-subtitle">INVEST</span>
        </div>
      </a>
      <nav class="header-nav" role="navigation" aria-label="Основная навигация">
        <div class="nav-item" data-page="portfolio" data-also="passport"><a href="portfolio.html" class="nav-trigger">Каталог отелей</a></div>
        <div class="nav-item" data-page="market"><a href="market.html" class="nav-trigger">Рынок</a></div>
        <div class="nav-item" data-page="brands"><a href="brands.html" class="nav-trigger">Бренды</a></div>
        <div class="nav-item" data-page="incentives"><a href="incentives.html" class="nav-trigger">Льготы</a></div>
        <div class="nav-item" data-page="investors"><a href="investors.html" class="nav-trigger">Как купить</a></div>
        <div class="nav-item" data-page="b2b"><a href="b2b.html" class="nav-trigger">B2B-встречи</a></div>
        <div class="nav-item" data-page="platform"><a href="platform.html" class="nav-trigger">О платформе</a></div>
      </nav>
      <div class="header-right">
        <a href="business.html" class="btn-login" id="header-login">
          <span>Разместить объект</span>
          <span class="btn-login-icon">→</span>
        </a>
      </div>
      <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Открыть меню" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>'''

MOBILE = '''<div class="mobile-nav" id="mobile-nav" role="navigation" aria-label="Мобильное меню">
    <div class="mobile-nav-section">
      <span class="mobile-nav-label">Инвестору</span>
      <a href="portfolio.html" class="mobile-nav-hub">Каталог отелей</a>
      <a href="market.html">Рынок Узбекистана</a>
      <a href="brands.html">Гостиничные бренды</a>
      <a href="incentives.html">Льготы для инвестора</a>
      <a href="investors.html">Как купить отель</a>
      <a href="b2b.html">B2B-встречи с владельцами</a>
    </div>
    <div class="mobile-nav-section">
      <span class="mobile-nav-label">Владельцам</span>
      <a href="business.html" class="mobile-nav-cta">Разместить объект</a>
    </div>
    <div class="mobile-nav-section">
      <span class="mobile-nav-label">Платформа</span>
      <a href="platform.html">О платформе</a>
      <a href="platform.html#method">Как считаются показатели</a>
    </div>
  </div>'''

FOOTER = '''<footer class="site-footer" role="contentinfo">
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand">
          <a href="index.html" class="header-logo footer-logo" aria-label="Главная">
            <img src="./assets/logo-icon.png" alt="Silk Route Invest" class="logo-emblem-img" width="34" height="38" />
            <div class="logo-text">
              <span class="logo-title">SILK ROUTE</span>
              <span class="logo-subtitle">INVEST</span>
            </div>
          </a>
          <p class="footer-brand-desc">
            Каталог гостиничных объектов Узбекистана для инвесторов: цена, финансовые показатели и паспорт каждого объекта.
          </p>
        </div>
        <nav class="footer-nav-grid" aria-label="Навигация в подвале">
          <div class="footer-nav-col">
            <p class="footer-nav-heading">Инвестору</p>
            <a href="portfolio.html" class="footer-nav-link">Каталог отелей</a>
            <a href="market.html" class="footer-nav-link">Рынок Узбекистана</a>
            <a href="brands.html" class="footer-nav-link">Гостиничные бренды</a>
            <a href="incentives.html" class="footer-nav-link">Льготы для инвестора</a>
            <a href="investors.html" class="footer-nav-link">Как купить отель</a>
            <a href="b2b.html" class="footer-nav-link">B2B-встречи</a>
          </div>
          <div class="footer-nav-col">
            <p class="footer-nav-heading">Владельцам</p>
            <a href="business.html" class="footer-nav-link">Разместить объект</a>
            <a href="brands.html#for-brands" class="footer-nav-link">Гостиничным сетям</a>
            <a href="platform.html#method" class="footer-nav-link">Как считаются показатели</a>
            <a href="platform.html" class="footer-nav-link">О платформе</a>
          </div>
          <div class="footer-nav-col">
            <p class="footer-nav-heading">Контакты</p>
            <p class="footer-contact-item">Комитет по туризму<br />Республики Узбекистан</p>
            <a href="mailto:info@uzbektourism.uz" class="footer-nav-link">info@uzbektourism.uz</a>
            <a href="https://uzbektourism.uz" class="footer-nav-link" target="_blank" rel="noopener">uzbektourism.uz</a>
          </div>
        </nav>
      </div>
      <div class="footer-bottom">
        <p class="footer-legal">
          &copy;&nbsp;2026 Комитет по туризму Республики Узбекистан.
          Финансовые показатели объектов&nbsp;— оценка платформы по&nbsp;методике USALI, если не&nbsp;отмечено иное.
        </p>
      </div>
    </div>
  </footer>'''


def replace_block(s, start_pat, tag, new):
    m = re.search(start_pat, s)
    if not m:
        return s, False
    i = m.start()
    # найти парный закрывающий тег с учётом вложенности
    depth, j = 0, i
    rx = re.compile(r'<(/?)%s\b' % tag)
    for t in rx.finditer(s, i):
        depth += -1 if t.group(1) else 1
        if depth == 0:
            j = s.index('>', t.end()) + 1
            break
    return s[:i] + new + s[j:], True


def apply(path):
    s = open(path, encoding='utf-8').read()
    s, h = replace_block(s, r'<header class="site-header"', 'header', HEADER)
    s, m = replace_block(s, r'<div class="mobile-nav" id="mobile-nav"', 'div', MOBILE)
    f = False
    if 'arch-footer' not in s:
        s, f = replace_block(s, r'<footer class="site-footer"', 'footer', FOOTER)
    s, d = replace_block(s, r'<aside class="spatial-dock"', 'aside', '')
    s, _ = replace_block(s, r'<nav class="vertical-switcher"', 'nav', '')
    s = re.sub(r'\s*<script src="js/support-core\.js[^"]*"></script>', '', s)
    s = re.sub(r'\s*<link rel="stylesheet" href="styles/spatial-dock\.css[^>]*>', '', s)
    open(path, 'w', encoding='utf-8').write(s)
    print(f'{path}: header={h} mobile={m} footer={f} dock={d}')


if __name__ == '__main__':
    for p in sys.argv[1:]:
        apply(p)
