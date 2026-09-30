/**
 * home-v2.js — Silk Route Invest
 * Logic isolated to the home page redesign.
 * Does NOT modify any shared modules.
 */

(function () {
  'use strict';

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
    const heroBg = document.querySelector('.hv2-hero__bg img');
    if (!heroBg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.scrollY;
          if (scrolled < 800) {
            heroBg.style.transform = `translateY(${scrolled * 0.25}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ─── 5. Init ─── */
  function init() {
    initAppear();
    initCounters();
    initMarquee();
    initHeroParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
