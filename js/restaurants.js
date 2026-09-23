/* ============================================================
   RESTAURANTS.JS — Каталог ресторанов
   ============================================================ */
(async () => {
  let rests = [];
  try {
    const r = await fetch('./data/restaurants.json');
    rests = await r.json();
  } catch(e) { console.warn('restaurants.json not loaded', e); }

  const grid = document.getElementById('rest-grid');

  const formatLabels = { fine_dining:'Fine Dining', casual:'Casual Dining', banquet:'Банкет / MICE' };
  const cuisineIcons  = { uzbek:'🍲', fusion:'🌏', international:'🍽', european:'🥂' };

  function renderCard(r) {
    const ratingKey = r.rating === 'A+' ? 'ap' : r.rating === 'A' ? 'a' : r.rating === 'B+' ? 'bp' : 'b';
    return `
    <a href="restaurant-passport.html?id=${r.id}" class="v-card" data-format="${r.format}" data-deal="${r.deal_type_label}">
      <div class="v-card__img">
        <div class="v-card__img-placeholder" style="background:var(--v-restaurants-bg);color:var(--v-restaurants);font-size:56px;">🍽</div>
        <div class="v-card__badges">
          <span class="rating-badge rating-badge--${ratingKey}">${r.rating}</span>
          <span class="deal-badge" style="--v-active:var(--v-restaurants);--v-active-light:var(--v-restaurants-light);">${r.deal_type_label}</span>
        </div>
      </div>
      <div class="v-card__body">
        <div class="v-card__meta">
          <span class="v-card__region">${r.region}</span>
          <span style="font-size:11px;color:var(--v-restaurants);">${r.cluster_label}</span>
        </div>
        <h3 class="v-card__title">${r.name}</h3>
        <p class="v-card__desc">${r.description.slice(0,115)}…</p>
        <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
          <span style="font-size:10px;padding:2px 8px;border-radius:10px;background:var(--v-restaurants-light);color:var(--v-restaurants);font-weight:600;">${cuisineIcons[r.cuisine] || '🍴'} ${r.cuisine_label}</span>
          <span style="font-size:10px;padding:2px 8px;border-radius:10px;background:var(--color-header-bg);color:var(--color-text-muted);font-weight:600;">🪑 ${r.seats} мест</span>
          ${r.certifications.map(c => `<span style="font-size:10px;padding:2px 8px;border-radius:10px;background:var(--color-header-bg);color:var(--color-text-muted);font-weight:600;">✅ ${c}</span>`).join('')}
        </div>
        <div class="v-card__kpis" style="--v-active:var(--v-restaurants);">
          <div class="v-card__kpi"><span class="v-card__kpi-val">$${r.avg_check_usd}</span><span class="v-card__kpi-key">Ср. чек</span></div>
          <div class="v-card__kpi"><span class="v-card__kpi-val">${r.ebitda_margin_pct}%</span><span class="v-card__kpi-key">EBITDA</span></div>
          <div class="v-card__kpi"><span class="v-card__kpi-val">${r.payback_years} г</span><span class="v-card__kpi-key">Окупаемость</span></div>
        </div>
      </div>
    </a>`;
  }

  let formatF = 'all', dealF = 'all';
  function rerender() {
    const filtered = rests.filter(r =>
      (formatF === 'all' || r.format === formatF) &&
      (dealF === 'all' || r.deal_type_label === dealF)
    );
    grid.innerHTML = filtered.length
      ? filtered.map(renderCard).join('')
      : `<div class="v-empty"><div class="v-empty__icon">🍽</div><div class="v-empty__text">Нет проектов по выбранным критериям</div></div>`;
  }

  rerender();

  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      formatF = btn.dataset.filter;
      rerender();
    });
  });

  document.querySelectorAll('[data-filter-deal]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-deal]').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      dealF = btn.dataset.filterDeal;
      rerender();
    });
  });
})();
