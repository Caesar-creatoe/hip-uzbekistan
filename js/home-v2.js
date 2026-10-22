/**
 * home-v2.js — Silk Route Invest
 * Architectural Redesign Logic (@kozyuk.design)
 */

(function () {
  'use strict';

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  /* ─── 1. IntersectionObserver для появления блоков ─── */
  function initAppear() {
    const els = document.querySelectorAll('.arch-gallery-card, .arch-hotel-card, .arch-step-card, .arch-metric-unit');
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.style.opacity = '1';
            e.target.style.transform = 'translateY(0)';
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      io.observe(el);
    });
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
    const counters = document.querySelectorAll('.arch-counter');
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

  /* ─── 3. Hero Parallax (Lightweight & Smooth) ─── */
  function initHeroParallax() {
    const heroBg = document.querySelector('.arch-hero__bg img');
    if (!heroBg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.scrollY;
          if (scrolled < 900) {
            heroBg.style.transform = `scale(1.02) translateY(${scrolled * 0.15}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ─── 4. Video Showcase Modal Interaction ─── */
  function initVideoModal() {
    const playBtn = document.getElementById('arch-play-btn');
    const modal = document.getElementById('arch-video-modal');
    const closeBtn = document.getElementById('arch-modal-close');

    if (!playBtn || !modal) return;

    playBtn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('is-active');
      document.body.style.overflow = 'hidden';
    });

    function closeModal() {
      modal.classList.remove('is-active');
      document.body.style.overflow = '';
      const iframe = modal.querySelector('iframe');
      if (iframe) {
        const src = iframe.src;
        iframe.src = src; // Stop playback
      }
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-active')) {
        closeModal();
      }
    });
  }

  /* ─── 5. Sticky Capsule Header visibility on scroll ─── */
  function initStickyHeader() {
    const header = document.getElementById('site-header');
    const hero = document.querySelector('.arch-hero');
    if (!header) return;

    header.style.transition = 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)';

    function updateHeader() {
      if (!hero) {
        if (window.scrollY > 400) {
          header.style.opacity = '1';
          header.style.pointerEvents = 'auto';
          header.style.transform = 'translateY(0)';
        } else {
          header.style.opacity = '0';
          header.style.pointerEvents = 'none';
          header.style.transform = 'translateY(-16px)';
        }
        return;
      }

      const heroRect = hero.getBoundingClientRect();
      // Show sticky header only when hero has mostly scrolled past, preventing duplicate navigation
      if (heroRect.bottom <= 120) {
        header.style.opacity = '1';
        header.style.pointerEvents = 'auto';
        header.style.transform = 'translateY(0)';
      } else {
        header.style.opacity = '0';
        header.style.pointerEvents = 'none';
        header.style.transform = 'translateY(-16px)';
      }
    }

    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  /* ─── 6. Init ─── */
  function init() {
    initAppear();
    initCounters();
    initHeroParallax();
    initVideoModal();
    initStickyHeader();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
