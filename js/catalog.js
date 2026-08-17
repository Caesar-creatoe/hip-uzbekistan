/* ============================================================
   CATALOG.JS — Фильтрация и сортировка каталога объектов
   Hotel Investment Portfolio · Комитет по туризму РУз
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────
   Состояние активных фильтров
   ───────────────────────────────────────────── */
const activeFilters = {
  region: 'all',
  stars:  'all',
  model:  'all',
  iri:    'all',
};

/* ─────────────────────────────────────────────
   Элементы
   ───────────────────────────────────────────── */
const cards      = document.querySelectorAll('.hotel-card--catalog');
const emptyState = document.getElementById('empty-state');
const countEl    = document.getElementById('filter-count-num');
const shownEl    = document.getElementById('results-shown');

/* ─────────────────────────────────────────────
   Применить фильтры
   ───────────────────────────────────────────── */
function applyFilters() {
  let visible = 0;

  cards.forEach((card) => {
    const region = card.dataset.region;
    const stars  = card.dataset.stars;
    const model  = card.dataset.model;
    const iri    = card.dataset.iri;

    const match =
      (activeFilters.region === 'all' || activeFilters.region === region) &&
      (activeFilters.stars  === 'all' || activeFilters.stars  === stars)  &&
      (activeFilters.model  === 'all' || activeFilters.model  === model)  &&
      (activeFilters.iri    === 'all' || activeFilters.iri    === iri);

    if (match) {
      card.classList.remove('is-hidden');
      card.removeAttribute('hidden');
      visible++;
    } else {
      card.classList.add('is-hidden');
      // Скрываем через небольшой timeout, чтобы transition успел сработать
      setTimeout(() => {
        if (card.classList.contains('is-hidden')) card.setAttribute('hidden', '');
      }, 260);
    }
  });

  // Счётчик
  if (countEl) countEl.textContent = visible;
  if (shownEl) shownEl.textContent  = visible;

  // Пустое состояние
  if (emptyState) {
    emptyState.hidden = visible > 0;
  }
}

/* ─────────────────────────────────────────────
   Обработчики кликов по chip-ам
   ───────────────────────────────────────────── */
const filterChips = document.querySelectorAll('.filter-chip');

filterChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const filterType  = chip.dataset.filter;
    const filterValue = chip.dataset.value;

    // Деактивировать все chips той же группы
    document.querySelectorAll(`.filter-chip[data-filter="${filterType}"]`).forEach((c) => {
      c.classList.remove('filter-chip--active');
      c.setAttribute('aria-pressed', 'false');
    });

    // Активировать кликнутый
    chip.classList.add('filter-chip--active');
    chip.setAttribute('aria-pressed', 'true');

    // Обновить состояние
    activeFilters[filterType] = filterValue;
    applyFilters();
  });
});

/* ─────────────────────────────────────────────
   Сброс фильтров
   ───────────────────────────────────────────── */
function resetFilters() {
  Object.keys(activeFilters).forEach((key) => {
    activeFilters[key] = 'all';
  });

  filterChips.forEach((chip) => {
    if (chip.dataset.value === 'all') {
      chip.classList.add('filter-chip--active');
      chip.setAttribute('aria-pressed', 'true');
    } else {
      chip.classList.remove('filter-chip--active');
      chip.setAttribute('aria-pressed', 'false');
    }
  });

  applyFilters();
}

const resetBtn      = document.getElementById('filter-reset');
const emptyResetBtn = document.getElementById('empty-reset');
if (resetBtn)      resetBtn.addEventListener('click', resetFilters);
if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetFilters);

/* ─────────────────────────────────────────────
   Сортировка (визуальная)
   ───────────────────────────────────────────── */
const sortBtns = document.querySelectorAll('.sort-btn');
sortBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    sortBtns.forEach((b) => b.classList.remove('sort-btn--active'));
    btn.classList.add('sort-btn--active');
    // TODO: реальная сортировка по данным — на бэкенде
  });
});

/* ─────────────────────────────────────────────
   Filter bar: sticky-класс
   ───────────────────────────────────────────── */
const filterBar    = document.getElementById('filter-bar');
const headerHeight = parseInt(
  getComputedStyle(document.documentElement).getPropertyValue('--header-height'), 10
) || 68;

if (filterBar) {
  const stickObserver = new IntersectionObserver(
    ([entry]) => filterBar.classList.toggle('is-stuck', !entry.isIntersecting),
    { rootMargin: `-${headerHeight + 1}px 0px 0px 0px`, threshold: 0 }
  );
  stickObserver.observe(filterBar);
}

/* ─────────────────────────────────────────────
   Load more (заглушка)
   ───────────────────────────────────────────── */
const loadMoreBtn = document.getElementById('load-more-btn');
if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', () => {
    // В полной версии — AJAX-запрос или раскрытие скрытых карточек
    loadMoreBtn.textContent = 'Загрузка...';
    loadMoreBtn.disabled = true;
    setTimeout(() => {
      loadMoreBtn.textContent = 'Все объекты загружены';
      loadMoreBtn.disabled = true;
    }, 800);
  });
}

/* ─────────────────────────────────────────────
   Инициализация
   ───────────────────────────────────────────── */
applyFilters();
