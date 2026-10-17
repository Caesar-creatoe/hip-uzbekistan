/**
 * home-v2.js — Silk Route Invest
 * Logic isolated to the home page redesign.
 * Does NOT modify any shared modules.
 */

(function () {
  'use strict';

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  /* ─── 1. IntersectionObserver для появления блоков ─── */
  function initAppear() {
    const els = document.querySelectorAll('.hv2-appear');
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ─── 2. Анимированные счётчики KPI ─── */
  function animateCounter(el) {
    const target = parseFloat(el.dataset.target || el.textContent);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const isFloat = el.dataset.float === 'true';
    const duration = 1400;
    const startTime = performance.now();

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      const current = isFloat
        ? (eased * target).toFixed(1)
        : Math.round(eased * target);
      el.textContent = prefix + current + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function initCounters() {
    const counters = document.querySelectorAll('.hv2-counter');
    if (!counters.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animateCounter(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => io.observe(c));
  }

  /* ─── 3. Marquee pause on hover (already via CSS, but ensure a11y) ─── */
  function initMarquee() {
    const track = document.querySelector('.hv2-marquee-track');
    if (!track) return;
    // Duplicate content for seamless loop
    const clone = track.cloneNode(true);
    track.parentElement.appendChild(clone);
  }

  /* ─── 4. Hero parallax (lightweight) ─── */
  function initHeroParallax() {
    const heroBg = document.querySelector('.spatial-hero__bg img, .hv2-hero__bg img');
    if (!heroBg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.scrollY;
          if (scrolled < 900) {
            heroBg.style.transform = `scale(1.02) translateY(${scrolled * 0.18}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ─── 5. Spatial Island 1 Featured Carousel (Authentic Hotels) ─── */
  function initFeaturedIsland() {
    const featuredHotels = [
      {
        counter: '01 / 32',
        title: 'Bakh Mir Palace',
        desc: 'Премиальный ансамбль в Самарканде с верифицированным USALI-аудитом и субсидиями.',
        img: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/683448160.jpg?k=a10b1d60c35f934449e75fdfd31b24689107f8e4b580effd080552b31dfb3930&o=',
        link: 'passport.html?hotel=bakh-mir'
      },
      {
        counter: '02 / 32',
        title: 'Silk Road Samarkand',
        desc: 'Масштабный конгресс-курорт международного класса, 8 отелей и экосистема MICE.',
        img: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/383184347.jpg?k=b4e4a0709b1f7d934bb61358db31df95e927cb09d3752e0081d431c3bf1a9807&o=',
        link: 'passport.html?hotel=silk-road-samarkand'
      },
      {
        counter: '03 / 32',
        title: 'Grand Tashkent Hotel',
        desc: '258 номеров, Occupancy 74%, ADR $128. Международное управление и паспорт A+.',
        img: './assets/hotel-hero.png',
        link: 'passport.html?hotel=grand-tashkent'
      }
    ];

    let currentIdx = 0;
    const titleEl = document.getElementById('featured-hotel-title');
    const descEl = document.getElementById('featured-hotel-desc');
    const imgEl = document.getElementById('featured-hotel-img');
    const linkEl = document.getElementById('featured-hotel-link');
    const counterEl = document.getElementById('featured-counter');
    const prevBtn = document.getElementById('featured-prev-btn');
    const nextBtn = document.getElementById('featured-next-btn');
    const dots = document.querySelectorAll('#featured-dots .slide-dash');

    if (!titleEl || !prevBtn || !nextBtn) return;

    function render(idx) {
      const h = featuredHotels[idx];
      titleEl.textContent = h.title;
      descEl.textContent = h.desc;
      if (imgEl) {
        imgEl.src = h.img;
        imgEl.alt = h.title;
      }
      if (linkEl) linkEl.href = h.link;
      if (counterEl) counterEl.textContent = h.counter;
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === idx);
      });
    }

    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      currentIdx = (currentIdx - 1 + featuredHotels.length) % featuredHotels.length;
      render(currentIdx);
    });

    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      currentIdx = (currentIdx + 1) % featuredHotels.length;
      render(currentIdx);
    });
  }

  /* ─── 6. Init ─── */
  function init() {
    initAppear();
    initCounters();
    initMarquee();
    initHeroParallax();
    initFeaturedIsland();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
