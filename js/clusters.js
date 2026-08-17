/* ============================================================
   CLUSTERS.JS — Интерактивное раскрытие карточек кластеров
   Hotel Investment Portfolio · Комитет по туризму РУз
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const clusterCards = document.querySelectorAll('.cluster-card--expandable');

  clusterCards.forEach((card) => {
    const summary = card.querySelector('.cluster-card-summary');
    const indicator = card.querySelector('.cluster-toggle-indicator');

    if (!summary) return;

    function toggleCard(e) {
      // Игнорируем клики по внутренним ссылкам и кнопкам
      if (e.target.closest('a') || e.target.closest('button')) {
        return;
      }

      const isOpen = card.classList.contains('is-open');

      if (isOpen) {
        card.classList.remove('is-open');
        summary.setAttribute('aria-expanded', 'false');
        if (indicator) indicator.textContent = '+ Подробнее';
      } else {
        card.classList.add('is-open');
        summary.setAttribute('aria-expanded', 'true');
        if (indicator) indicator.textContent = '− Свернуть';
      }
    }

    summary.addEventListener('click', toggleCard);

    // Доступность с клавиатуры (Enter / Пробел)
    summary.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCard(e);
      }
    });
  });
});
