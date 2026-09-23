/* ============================================================
   LAND.JS — Каталог земельных участков + Leaflet карта
   ============================================================ */
(async () => {
  let lots = [];
  try {
    const r = await fetch('./data/land-lots.json');
    lots = await r.json();
  } catch(e) { console.warn('land-lots.json not loaded', e); }

  const grid = document.getElementById('land-grid');
  const clusterLabels = {
    cultural:'Культурный туризм', mountain:'Горный туризм',
    eco:'Экотуризм', health:'Оздоровительный туризм',
    mice:'MICE / Деловой туризм', gastro:'Гастрономический туризм'
  };
  const transferIcons = { lease49:'📋', auction:'🏛', ppp:'🤝', direct_agreement:'✍️', privatization:'🔑' };
  const infraIcons = { electricity:'⚡', water:'💧', gas:'🔥', road:'🛣', sewage:'🚿' };
  const infraLabels = { electricity:'Электричество', water:'Водоснабжение', gas:'Газ', road:'Дорога', sewage:'Канализация' };

  function formatPrice(n) {
    if (n >= 1000000) return '$' + (n/1000000).toFixed(1) + 'M';
    if (n >= 1000) return '$' + Math.round(n/1000) + 'K';
    return '$' + n.toLocaleString();
  }

  function renderCard(lot) {
    const infraHtml = Object.entries(lot.infrastructure).map(([k, v]) =>
      `<span class="land-infra-badge ${!v ? 'land-infra-badge--off' : ''}">${infraIcons[k]} ${infraLabels[k]}</span>`
    ).join('');

    return `
    <a href="land-lot.html?id=${lot.id}" class="v-card" data-region="${lot.region}" data-transfer="${lot.transfer_type}">
      <div class="v-card__img">
        <div class="v-card__img-placeholder" style="background:var(--v-land-bg);color:var(--v-land);font-size:56px;">🗺</div>
        <div class="v-card__badges">
          <span class="rating-badge rating-badge--${lot.rating === 'A+' ? 'ap' : lot.rating === 'A' ? 'a' : lot.rating === 'B+' ? 'bp' : 'b'}">${lot.rating}</span>
          <span class="deal-badge" style="--v-active:var(--v-land);--v-active-light:var(--v-land-light);">${transferIcons[lot.transfer_type]} ${lot.transfer_label}</span>
        </div>
      </div>
      <div class="v-card__body">
        <div class="v-card__meta">
          <span class="v-card__region">${lot.region}</span>
          <span style="font-size:11px;color:var(--v-land);">${lot.cluster_label}</span>
        </div>
        <h3 class="v-card__title">${lot.name}</h3>
        <p class="v-card__desc">${lot.description.slice(0, 120)}…</p>
        <div class="land-card__infra">${infraHtml}</div>
        <div class="v-card__kpis" style="--v-active:var(--v-land);">
          <div class="v-card__kpi"><span class="v-card__kpi-val">${lot.area_ha} га</span><span class="v-card__kpi-key">Площадь</span></div>
          <div class="v-card__kpi"><span class="v-card__kpi-val">${formatPrice(lot.start_price_usd)}</span><span class="v-card__kpi-key">Нач. цена</span></div>
          <div class="v-card__kpi"><span class="v-card__kpi-val">${formatPrice(lot.investment_min_usd)}</span><span class="v-card__kpi-key">Мин. CAPEX</span></div>
        </div>
      </div>
    </a>`;
  }

  function renderAll(regionFilter = 'all', transferFilter = 'all') {
    const filtered = lots.filter(l =>
      (regionFilter === 'all' || l.region === regionFilter) &&
      (transferFilter === 'all' || l.transfer_type === transferFilter)
    );
    grid.innerHTML = filtered.length
      ? filtered.map(renderCard).join('')
      : `<div class="v-empty"><div class="v-empty__icon">🗺</div><div class="v-empty__text">Нет лотов по выбранным критериям</div></div>`;
  }

  renderAll();

  // Filters
  let regionF = 'all', transferF = 'all';
  document.querySelectorAll('[data-filter-type="region"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-type="region"]').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      regionF = btn.dataset.filter;
      renderAll(regionF, transferF);
    });
  });
  document.querySelectorAll('[data-filter-type="transfer"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-type="transfer"]').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      transferF = btn.dataset.filter;
      renderAll(regionF, transferF);
    });
  });

  // View toggle
  const listView = document.getElementById('land-list-view');
  const mapView  = document.getElementById('land-map-view');
  let mapInit = false;

  document.getElementById('view-list').addEventListener('click', function() {
    this.classList.add('is-active');
    document.getElementById('view-map').classList.remove('is-active');
    listView.style.display = '';
    mapView.style.display = 'none';
  });

  document.getElementById('view-map').addEventListener('click', function() {
    this.classList.add('is-active');
    document.getElementById('view-list').classList.remove('is-active');
    listView.style.display = 'none';
    mapView.style.display = '';
    if (!mapInit) initMap();
    mapInit = true;
  });

  function initMap() {
    if (typeof L === 'undefined') return;
    const map = L.map('uz-map').setView([41.2, 63.5], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const clusterColors = { cultural:'#8B6F4E', mountain:'#2E5E3F', eco:'#3A7A5A', health:'#5A8A6A', mice:'#1E3A6E', gastro:'#8B3A2F' };

    lots.forEach(lot => {
      if (!lot.coordinates) return;
      const color = clusterColors[lot.cluster] || '#2E5E3F';
      const icon = L.divIcon({
        html: `<div style="width:36px;height:36px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -38],
        className: ''
      });
      L.marker(lot.coordinates, { icon }).addTo(map)
        .bindPopup(`
          <div class="land-map-popup">
            <h4>${lot.name}</h4>
            <p>${lot.area_ha} га · ${lot.transfer_label}</p>
            <p style="color:#555;">${lot.region}</p>
            <a href="land-lot.html?id=${lot.id}">Открыть паспорт →</a>
          </div>
        `);
    });
  }
})();
