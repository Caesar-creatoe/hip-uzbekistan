/* ============================================================
   METHODOLOGY.JS — Scrollspy & Interactivity (Том I)
   Hotel Investment Portfolio · Комитет по туризму РУз
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────────────
     1. SCROLLSPY TOC OBSERVER
     ───────────────────────────────────────────── */
  const tocLinks = document.querySelectorAll('.sidebar-nav-link');
  const docSections = document.querySelectorAll('.doc-section');

  if (tocLinks.length && docSections.length) {
    const headerHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--header-height'), 10
    ) || 68;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          tocLinks.forEach((link) => {
            const href = link.getAttribute('href').replace('#', '');
            link.classList.toggle('sidebar-nav-link--active', href === id);
          });
        }
      });
    }, {
      rootMargin: `-${headerHeight + 20}px 0px -60% 0px`,
      threshold: 0
    });

    docSections.forEach((section) => observer.observe(section));
  }

  /* ─────────────────────────────────────────────
     2. DOWNLOAD PDF BUTTON STUB
     ───────────────────────────────────────────── */
  const btnDownloadTom1 = document.getElementById('btn-download-tom1');
  if (btnDownloadTom1) {
    btnDownloadTom1.addEventListener('click', () => {
      btnDownloadTom1.textContent = 'Формирование PDF...';
      btnDownloadTom1.disabled = true;
      setTimeout(() => {
        btnDownloadTom1.textContent = '✓ Загрузка начнется автоматически';
        window.print();
        setTimeout(() => {
          btnDownloadTom1.textContent = 'Скачать Том I (PDF)';
          btnDownloadTom1.disabled = false;
        }, 3000);
      }, 800);
    });
  }

});
