/* ============================================================
   VERTICALS.JS — Сквозная логика переключателя 4 вертикалей
   Silk Route Invest · Комитет по туризму РУз
   ============================================================ */

(function () {
  'use strict';

  function detectVerticalFromPath() {
    const p = window.location.pathname.toLowerCase();
    if (p.includes('restaurant')) return 'restaurants';
    if (p.includes('land')) return 'land';
    if (p.includes('support')) return 'support';
    if (p.includes('portfolio') || p.includes('passport') || p.includes('cabinet-hotel') || p.includes('form.html')) return 'hotels';
    
    // Check existing attribute on body
    const bodyV = document.body.getAttribute('data-vertical');
    if (bodyV && ['hotels', 'restaurants', 'land', 'support'].includes(bodyV)) {
      return bodyV;
    }

    // Check sessionStorage
    try {
      const saved = sessionStorage.getItem('sri_active_vertical');
      if (saved && ['hotels', 'restaurants', 'land', 'support'].includes(saved)) {
        return saved;
      }
    } catch (e) {}

    return 'hotels';
  }

  function applyVertical(v) {
    if (!v) return;
    document.body.setAttribute('data-vertical', v);
    try {
      sessionStorage.setItem('sri_active_vertical', v);
    } catch (e) {}

    // Update switcher tabs
    document.querySelectorAll('.vs-tab').forEach(tab => {
      const tabV = tab.getAttribute('data-v');
      if (tabV === v) {
        tab.classList.add('is-active');
      } else {
        tab.classList.remove('is-active');
      }
    });

    // Update dynamic vertical tokens if needed
    const root = document.documentElement;
    root.style.setProperty('--v-current', `var(--v-${v})`);
    root.style.setProperty('--v-current-bg', `var(--v-${v}-bg)`);
    root.style.setProperty('--v-current-light', `var(--v-${v}-light)`);
  }

  function initVerticals() {
    const currentV = detectVerticalFromPath();
    applyVertical(currentV);

    // Bind clicks on vertical switcher tabs
    document.querySelectorAll('.vs-tab').forEach(tab => {
      tab.addEventListener('click', function (e) {
        const v = this.getAttribute('data-v');
        if (v) {
          try {
            sessionStorage.setItem('sri_active_vertical', v);
          } catch (err) {}
          // If tab is on the same page without navigation, update state
          if (this.getAttribute('href') === '#' || !this.getAttribute('href')) {
            e.preventDefault();
            applyVertical(v);
          }
        }
      });
    });

    // Bind clicks on 4-asset tiles on homepage
    document.querySelectorAll('.ac-tile[data-v]').forEach(tile => {
      tile.addEventListener('click', function () {
        const v = this.getAttribute('data-v');
        if (v) {
          try {
            sessionStorage.setItem('sri_active_vertical', v);
          } catch (err) {}
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVerticals);
  } else {
    initVerticals();
  }

  // Export globally for cross-module integration
  window.SRIVerticals = {
    getActive: detectVerticalFromPath,
    set: applyVertical
  };
})();
