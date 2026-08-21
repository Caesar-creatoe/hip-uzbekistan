/* ============================================================
   MEGAMENU.JS — Интерактивность нового мегаменю
   Hotel Investment Portfolio · Uzbekistan
   ============================================================ */

(function () {
  'use strict';

  /* ── Scroll behaviour ───────────────────────────────────── */
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('site-header--scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Мегаменю: hover на desktop ─────────────────────────── */
  document.querySelectorAll('.nav-item[data-mega]').forEach(item => {
    let leaveTimer;
    item.addEventListener('mouseenter', () => {
      clearTimeout(leaveTimer);
      item.classList.add('open');
    });
    item.addEventListener('mouseleave', () => {
      leaveTimer = setTimeout(() => item.classList.remove('open'), 120);
    });
  });

  /* ── Мобильное меню ─────────────────────────────────────── */
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  if (mobileBtn && mobileNav) {
    mobileBtn.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      mobileBtn.setAttribute('aria-expanded', open);
    });
    // Закрыть при клике вне
    document.addEventListener('click', e => {
      if (!mobileBtn.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('open');
        mobileBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── Языковой переключатель ─────────────────────────────── */
  const langBtns = document.querySelectorAll('.lang-btn');
  const savedLang = localStorage.getItem('hip_lang') || 'ru';

  function applyLang(lang) {
    langBtns.forEach(btn => {
      btn.classList.toggle('lang-btn--active', btn.dataset.lang === lang);
      btn.setAttribute('aria-pressed', btn.dataset.lang === lang);
    });
    localStorage.setItem('hip_lang', lang);
  }

  langBtns.forEach(btn => {
    btn.addEventListener('click', () => applyLang(btn.dataset.lang));
  });
  applyLang(savedLang);

  /* ── Активный пункт навигации ───────────────────────────── */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    const active = item.dataset.page;
    if (active && currentPath.startsWith(active)) {
      item.classList.add('active');
    }
  });
})();
