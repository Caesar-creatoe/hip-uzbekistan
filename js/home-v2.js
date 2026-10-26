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
    const childCards = document.querySelectorAll('.arch-gallery-card, .arch-hotel-card, .arch-step-card, .arch-metric-unit, .arch-glass-metric-tile, .arch-liquid-glass-step');

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
          if (scrolled < 850) {
            heroBg.style.transform = `scale(1.02) translateY(${scrolled * 0.1}px)`;
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

  /* ─── 5. Sticky Capsule Header visibility on scroll (Unified with megamenu.js) ─── */
  function initStickyHeader() {
    // Header visibility is now unified across all pages via megamenu.js (.site-header / .site-header--scrolled)
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

  /* ─── 7. Platform Investment Showcase (Oculus-Inspired) ─── */
  function initPlatformShowcase() {
    const cards = Array.from(document.querySelectorAll('.arch-showcase-card'));
    const row = document.getElementById('showcase-row');
    const counterCurr = document.getElementById('showcase-counter-curr');
    const detailTag = document.getElementById('detail-tag');
    const detailTitle = document.getElementById('detail-title');
    const detailDesc = document.getElementById('detail-desc');
    const detailStats = document.getElementById('detail-stats');
    const detailCta = document.getElementById('detail-cta');
    const detailCtaText = document.getElementById('detail-cta-text');
    const prevBtn = document.getElementById('showcase-prev-btn');
    const nextBtn = document.getElementById('showcase-next-btn');

    if (!cards.length) return;

    const categoryData = [
      {
        num: '01',
        tag: '01 / КАТЕГОРИЯ ПЛАТФОРМЫ',
        title: 'Гостиничные комплексы',
        desc: 'Премиальные отели, курортные комплексы и бутик-отели Узбекистана с верифицированным аудитом USALI, данными ADR и RevPAR.',
        stats: ['32 объекта в реестре', '14 регионов охвата', 'Стандарты USALI'],
        ctaText: 'Смотреть отели',
        ctaHref: 'portfolio.html'
      },
      {
        num: '02',
        tag: '02 / КАТЕГОРИЯ ПЛАТФОРМЫ',
        title: 'Ресторанные проекты',
        desc: 'Высокодоходные ресторанные концепции, панорамные заведения и гастрономические пространства в ключевых туристических центрах.',
        stats: ['Ташкент & Самарканд', 'MICE & Fine Dining', 'Аудит потоков'],
        ctaText: 'Смотреть рестораны',
        ctaHref: 'restaurants.html'
      },
      {
        num: '03',
        tag: '03 / КАТЕГОРИЯ ПЛАТФОРМЫ',
        title: 'Земельные участки',
        desc: 'Участки под строительство гостиничных и рекреационных комплексов с готовой инфраструктурой, кадастровыми паспортами и мастер-планами.',
        stats: ['Рекреационные зоны', 'СЭЗ ТР', 'Инженерные сети'],
        ctaText: 'Смотреть земельный банк',
        ctaHref: 'land.html'
      },
      {
        num: '04',
        tag: '04 / ГОСУДАРСТВЕННЫЙ СЕКТОР',
        title: 'Государственная поддержка',
        desc: 'Меры государственной поддержки туристической отрасли, субсидирование строительства номерного фонда и институциональные налоговые преференции.',
        stats: ['Минтуризма РУз', '0% таможенные пошлины', 'Льготные субсидии'],
        ctaText: 'Изучить меры поддержки',
        ctaHref: 'support.html'
      }
    ];

    let activeIndex = 0;
    const total = cards.length;
    const detailInfo = document.querySelector('.arch-showcase-detail__info');

    function setActive(index, smoothScrollMobile = false) {
      activeIndex = (index + total) % total;

      // Update Cards
      cards.forEach((card, i) => {
        const isActive = i === activeIndex;
        card.classList.toggle('is-active', isActive);
        card.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      // Update Counter
      if (counterCurr) {
        counterCurr.textContent = categoryData[activeIndex].num;
      }

      // Update Detail Area below
      const data = categoryData[activeIndex];
      if (detailInfo) {
        detailInfo.style.transition = 'opacity 0.2s ease';
        detailInfo.style.opacity = '0.3';
        setTimeout(() => {
          if (detailTag) detailTag.textContent = data.tag;
          if (detailTitle) detailTitle.textContent = data.title;
          if (detailDesc) detailDesc.textContent = data.desc;
          if (detailStats) {
            detailStats.innerHTML = data.stats
              .map((s) => `<span class="arch-stat-chip">${s}</span>`)
              .join('');
          }
          if (detailCta) detailCta.href = data.ctaHref;
          if (detailCtaText) detailCtaText.textContent = data.ctaText;
          detailInfo.style.opacity = '1';
        }, 160);
      }

      // If mobile scrollable row, scroll active card smoothly into center
      if (smoothScrollMobile && row && window.innerWidth <= 1024) {
        const activeCard = cards[activeIndex];
        if (activeCard) {
          const cardLeft = activeCard.offsetLeft;
          const cardWidth = activeCard.offsetWidth;
          const rowWidth = row.offsetWidth;
          row.scrollTo({
            left: cardLeft - (rowWidth - cardWidth) / 2,
            behavior: 'smooth'
          });
        }
      }
    }

    // Card click events
    cards.forEach((card, idx) => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        setActive(idx, true);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActive(idx, true);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setActive(activeIndex + 1, true);
          cards[activeIndex].focus();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setActive(activeIndex - 1, true);
          cards[activeIndex].focus();
        }
      });
    });

    // Arrow navigation
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        setActive(activeIndex + 1, true);
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        setActive(activeIndex - 1, true);
      });
    }

    // Initial state
    setActive(0);
  }

  /* ─── 8. Init ─── */
  function init() {
    initAppear();
    initCounters();
    initHeroParallax();
    initVideoModal();
    initStickyHeader();
    initFooterLang();
    initPlatformShowcase();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
