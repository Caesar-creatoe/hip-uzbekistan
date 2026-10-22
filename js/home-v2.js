/**
 * home-v2.js — Silk Route Invest
 * Architectural Redesign Motion System & Interactive Logic (@kozyuk.design)
 */

(function () {
  'use strict';

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  /* ─── 1. Scroll-Triggered Reveal System with Stagger Support ─── */
  function initAppear() {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealSections = document.querySelectorAll('.arch-reveal');
    const childCards = document.querySelectorAll('.arch-gallery-card, .arch-hotel-card, .arch-step-card, .arch-metric-unit');

    if (isReduced) {
      revealSections.forEach((el) => el.classList.add('is-revealed'));
      childCards.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    // Observer for major sections
    if (revealSections.length) {
      const sectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
              sectionObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
      );

      revealSections.forEach((s) => sectionObserver.observe(s));
    }

    // Observer for cascading cards inside grids
    if (childCards.length) {
      const cardObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target;
              // Subtle stagger based on element index among siblings
              const parent = el.parentElement;
              const siblings = parent ? Array.from(parent.children) : [];
              const idx = siblings.indexOf(el);
              const delay = idx >= 0 ? Math.min(idx * 75, 300) : 0;

              setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
              }, delay);

              cardObserver.unobserve(el);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -20px 0px' }
      );

      childCards.forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(18px)';
        el.style.transition = 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)';
        cardObserver.observe(el);
      });
    }
  }

  /* ─── 2. Animated KPI Counters ─── */
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
      { threshold: 0.4 }
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
            heroBg.style.transform = `scale(1.02) translateY(${scrolled * 0.12}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ─── 4. Architectural Video Showcase Modal Interaction ─── */
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
        iframe.src = src; // Pause video by resetting source
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

  /* ─── 6. Footer Language Selector Interaction ─── */
  function initFooterLang() {
    const langBtns = document.querySelectorAll('.arch-footer__lang-btn');
    if (!langBtns.length) return;

    langBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        langBtns.forEach((b) => {
          const isTarget = b.dataset.lang === lang;
          b.classList.toggle('is-active', isTarget);
          b.classList.toggle('footer-lang-link--active', isTarget);
        });
        try {
          localStorage.setItem('sri_lang', lang);
        } catch (_) {}
      });
    });

    try {
      const saved = localStorage.getItem('sri_lang');
      if (saved) {
        langBtns.forEach((b) => {
          const isTarget = b.dataset.lang === saved;
          b.classList.toggle('is-active', isTarget);
          b.classList.toggle('footer-lang-link--active', isTarget);
        });
      }
    } catch (_) {}
  }

  /* ─── 7. Init ─── */
  function init() {
    initAppear();
    initCounters();
    initHeroParallax();
    initVideoModal();
    initStickyHeader();
    initFooterLang();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
