/* ============================================================
   REGISTRIES.JS — Поиск, фильтрация и вкладки реестров
   Hotel Investment Portfolio · Комитет по туризму РУз
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────────────
     1. TAB SWITCHER
     ───────────────────────────────────────────── */
  const tabBtns = document.querySelectorAll('.reg-tab-btn');
  const tabPanels = document.querySelectorAll('.reg-tab-panel');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;

      tabBtns.forEach(b => b.classList.remove('reg-tab-btn--active'));
      tabPanels.forEach(p => p.classList.remove('reg-tab-panel--active'));

      btn.classList.add('reg-tab-btn--active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('reg-tab-panel--active');
      }
    });
  });


  /* ─────────────────────────────────────────────
     2. LIVE SEARCH & FILTER FOR HOTELS REGISTRY
     ───────────────────────────────────────────── */
  const searchInput = document.getElementById('hotels-search-input');
  const categoryFilter = document.getElementById('hotels-category-filter');
  const tableRows = document.querySelectorAll('#hotels-table tbody tr');

  function filterHotels() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedCat = categoryFilter ? categoryFilter.value : 'all';

    tableRows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      const cat = row.dataset.cat;

      const matchesQuery = query === '' || text.includes(query);
      const matchesCat = selectedCat === 'all' || cat === selectedCat;

      row.style.display = (matchesQuery && matchesCat) ? '' : 'none';
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterHotels);
  }
  if (categoryFilter) {
    categoryFilter.addEventListener('change', filterHotels);
  }

});
