/* ============================================================
   MAIN.JS — Анимации и интерактивность
   Hotel Investment Portfolio · Комитет по туризму РУз
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────
   1. Header: scrolled-класс
   ───────────────────────────────────────────── */
const header = document.getElementById('site-header');

if (header) {
  function handleHeaderScroll() {
    header.classList.toggle('site-header--scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
}


/* ─────────────────────────────────────────────
   2. Appear: fade + rise при скролле
   Применяется ко всем элементам с классом .appear
   ───────────────────────────────────────────── */
const appearEls = document.querySelectorAll('.appear');

if (appearEls.length) {
  const appearObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger-задержка для элементов в одном контейнере
        const siblings = [...entry.target.parentElement.querySelectorAll('.appear')];
        const index = siblings.indexOf(entry.target);
        const delay = Math.min(index * 70, 280); // не больше 280ms

        setTimeout(() => {
          entry.target.classList.add('is-visible');
        }, delay);

        appearObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });

  appearEls.forEach((el) => appearObserver.observe(el));
}


/* ─────────────────────────────────────────────
   3. Count-up — для элементов с классом .js-counter
   Используется в Platform Stats (150+, 14, 250+)
   ───────────────────────────────────────────── */
/**
 * @param {HTMLElement} el
 * @param {number} target
 * @param {number} duration  мс
 */
function animateCounter(el, target, duration) {
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix !== undefined ? el.dataset.suffix : '';
  const startTime = performance.now();

  function easeOutQuart(x) {
    return 1 - Math.pow(1 - x, 4);
  }

  function step(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current  = Math.round(easeOutQuart(progress) * target);
    el.textContent = prefix + current + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = prefix + target + suffix;
  }
  requestAnimationFrame(step);
}

/* Динамическая синхронизация счетчика объектов из HotelStore */
if (window.HotelStore) {
  const heroHotelEl = document.getElementById('hero-stat-hotels');
  if (heroHotelEl) {
    const count = window.HotelStore.getAll().length;
    heroHotelEl.dataset.target = count;
    heroHotelEl.textContent = count;
  }
}

/* Наблюдаем за Platform Stats — запускаем счётчики при входе в viewport */
const counterEls = document.querySelectorAll('.js-counter');
let countersAnimated = false;

if (counterEls.length) {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !countersAnimated) {
        countersAnimated = true;
        counterEls.forEach((el, i) => {
          const target = parseInt(el.dataset.target, 10);
          if (!isNaN(target)) {
            setTimeout(() => animateCounter(el, target, 1300), i * 100);
          }
        });
        counterObserver.disconnect();
      }
    });
  }, { threshold: 0.3 });

  counterObserver.observe(counterEls[0]);
}


/* ─────────────────────────────────────────────
   4. Language switcher (RU / UZ / EN)
   ───────────────────────────────────────────── */
const langBtns = document.querySelectorAll('.lang-btn, .footer-lang-link');
const savedLang = localStorage.getItem('hip_lang') || 'ru';

function showLangToast(lang) {
  let toast = document.getElementById('lang-notice-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'lang-notice-toast';
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#3B2A20;color:#F5EFE3;border:1px solid #8B6F4E;border-radius:10px;padding:12px 18px;font-size:13px;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.3);max-width:340px;line-height:1.4;transition:opacity 0.3s';
    document.body.appendChild(toast);
  }
  const msg = lang === 'uz'
    ? "O'zbekcha versiya to'ldirilmoqda. Hozirda to'liq rasmiy ruscha asl nusxa mavjud."
    : "English localized edition is currently being compiled. Full Russian institutional documentation is active.";
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; }, 300);
  }, 4000);
}

function applyLanguage(lang, userInitiated = false) {
  langBtns.forEach((btn) => {
    const btnLang = btn.dataset.lang || btn.id.replace('lang-', '') || btn.textContent.trim().toLowerCase();
    const isTarget = btnLang === lang;
    btn.classList.toggle('lang-btn--active', isTarget);
    btn.classList.toggle('footer-lang-link--active', isTarget);
    btn.setAttribute('aria-pressed', isTarget ? 'true' : 'false');
  });
  document.documentElement.lang = lang;
  localStorage.setItem('hip_lang', lang);
  if (userInitiated && lang !== 'ru') {
    showLangToast(lang);
  }
}

langBtns.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const chosenLang = btn.dataset.lang || btn.id.replace('lang-', '') || btn.textContent.trim().toLowerCase();
    applyLanguage(chosenLang, true);
  });
});

if (savedLang) {
  applyLanguage(savedLang, false);
}



/* ─────────────────────────────────────────────
   5. Active nav link при скролле
   ───────────────────────────────────────────── */
const sections  = document.querySelectorAll('section[id], footer[id]');
const navLinks  = document.querySelectorAll('.nav-link');

if (sections.length && navLinks.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          link.classList.toggle(
            'nav-link--active',
            link.getAttribute('href') === `#${id}`
          );
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach((s) => sectionObserver.observe(s));
}
