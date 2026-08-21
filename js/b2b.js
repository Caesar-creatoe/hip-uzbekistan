/* ============================================================
   B2B.JS — B2B Cooperation: фильтр партнёров + форма
   Hotel Investment Portfolio · Uzbekistan
   ============================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ── Partner Filter ─────────────────────────────────────── */
  const filterBtns = document.querySelectorAll('.b2b-filter-btn');
  const partnerCards = document.querySelectorAll('.b2b-partner-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      filterBtns.forEach(b => b.classList.remove('b2b-filter-btn--active'));
      btn.classList.add('b2b-filter-btn--active');

      partnerCards.forEach(card => {
        const cat = card.dataset.category;
        if (filter === 'all' || cat === filter) {
          card.classList.remove('hidden');
          card.style.animation = 'fadeInUp 0.3s ease';
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  /* ── Pre-fill tier from tier card CTAs ─────────────────── */
  document.querySelectorAll('.b2b-tier-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const tier = btn.dataset.tier;
      const tierSelect = document.getElementById('b2b-tier-select');
      if (tierSelect) tierSelect.value = tier;
      document.getElementById('b2b-apply')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ── B2B Application Form ───────────────────────────────── */
  const form = document.getElementById('b2b-application-form');
  const successMsg = document.getElementById('b2b-form-success');

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      // Basic validation
      const required = form.querySelectorAll('[required]');
      let valid = true;
      required.forEach(el => {
        el.classList.remove('b2b-input-error');
        if (!el.value.trim() || (el.type === 'checkbox' && !el.checked)) {
          el.classList.add('b2b-input-error');
          valid = false;
        }
      });
      if (!valid) return;

      const submitBtn = document.getElementById('b2b-submit');
      submitBtn.textContent = 'Отправка...';
      submitBtn.disabled = true;

      // Collect data
      const data = {
        company: document.getElementById('b2b-company')?.value,
        type: document.getElementById('b2b-type')?.value,
        name: document.getElementById('b2b-name')?.value,
        position: document.getElementById('b2b-position')?.value,
        email: document.getElementById('b2b-email')?.value,
        phone: document.getElementById('b2b-phone')?.value,
        country: document.getElementById('b2b-country')?.value,
        aum: document.getElementById('b2b-aum')?.value,
        tier: document.getElementById('b2b-tier-select')?.value,
        message: document.getElementById('b2b-message')?.value,
        submittedAt: new Date().toISOString(),
      };

      // Save to localStorage as pending application
      const pending = JSON.parse(localStorage.getItem('hip_b2b_applications') || '[]');
      pending.push(data);
      localStorage.setItem('hip_b2b_applications', JSON.stringify(pending));

      // Simulate network delay
      await new Promise(r => setTimeout(r, 1200));

      // Show success
      form.style.opacity = '0.4';
      form.style.pointerEvents = 'none';
      successMsg.classList.add('visible');
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      submitBtn.textContent = 'Отправить заявку';
      submitBtn.disabled = false;
    });
  }

  /* ── Smooth scroll for in-page anchors ─────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});
