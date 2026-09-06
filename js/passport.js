/* ============================================================
   PASSPORT.JS — Навигация и динамический рендер паспорта
   Hotel Investment Portfolio · Silk Route Invest
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────
   0. Динамическая маршрутизация и гидратация данных
   ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const hotelParam = urlParams.get('hotel') || 'grand-tashkent';

  const hotel = (window.HotelStore ? window.HotelStore.getById(hotelParam) : null) ||
                (window.DEFAULT_HOTELS ? window.DEFAULT_HOTELS.find(h => h.slug === hotelParam || h.id === hotelParam) : null) ||
                (window.DEFAULT_HOTELS ? window.DEFAULT_HOTELS[0] : null);

  if (hotel) {
    hydrateHotelPassport(hotel);
    initPassportMap(hotel);
  } else {
    initPassportMap(null);
  }
});

function hydrateHotelPassport(hotel) {
  // Title
  document.title = `${hotel.hotelName} — Инвестиционный паспорт · Silk Route Invest`;

  // Breadcrumb & Headings
  const breadcrumbCurrent = document.querySelector('.breadcrumb-current');
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = hotel.hotelName;

  const coverName = document.querySelector('.cover-hotel-name');
  if (coverName) coverName.textContent = hotel.hotelName;

  const coverLocation = document.querySelector('.cover-location');
  if (coverLocation) coverLocation.textContent = hotel.address || hotel.region;

  // Cover photo
  const coverImg = document.getElementById('passport-cover-photo');
  if (coverImg && hotel.photos && hotel.photos[0]) {
    coverImg.src = hotel.photos[0];
    coverImg.alt = `${hotel.hotelName} — фасад и архитектура`;
  }

  // IRI badges
  const iriBadges = document.querySelectorAll('#cover-iri-val, .badge-value, .hotel-card-iri');
  iriBadges.forEach(el => { el.textContent = hotel.iri || 'A'; });

  // Cover Specs
  const coverSpecs = document.querySelectorAll('.cover-spec-val');
  if (coverSpecs[0]) coverSpecs[0].textContent = hotel.roomsCount;
  if (coverSpecs[2]) coverSpecs[2].textContent = hotel.yearCommissioned || '2021';

  // Dashboard kicker & meta
  const dashKicker = document.querySelector('.dashboard-header .kicker');
  if (dashKicker) dashKicker.textContent = `${hotel.hotelName.toUpperCase()} · 2025 FY`;

  const dashMetaItems = document.querySelectorAll('.dashboard-meta-item');
  if (dashMetaItems[0]) dashMetaItems[0].textContent = `${hotel.stars} Star Hotel`;
  if (dashMetaItems[1]) dashMetaItems[1].textContent = hotel.region;
  if (dashMetaItems[2]) dashMetaItems[2].textContent = `${hotel.roomsCount} номеров`;

  // Dashboard KPIs
  const statBlocks = document.querySelectorAll('.stat-block');
  statBlocks.forEach(block => {
    const label = block.querySelector('.stat-label')?.textContent?.trim().toUpperCase();
    const num = block.querySelector('.stat-number');
    if (!num) return;

    if (label === 'ROOMS') {
      num.textContent = hotel.roomsCount;
      num.dataset.target = hotel.roomsCount;
    } else if (label === 'OCCUPANCY') {
      num.textContent = `${hotel.occupancy}%`;
      num.dataset.target = hotel.occupancy;
    } else if (label === 'ADR') {
      num.textContent = `$${hotel.adr}`;
    } else if (label === 'REVPAR') {
      const rev = hotel.revpar || (window.calculateRevPAR ? window.calculateRevPAR(hotel.adr, hotel.occupancy) : (hotel.adr * (hotel.occupancy / 100)).toFixed(1));
      num.textContent = `$${rev}`;
    } else if (label === 'EBITDA MARGIN') {
      num.textContent = `${hotel.ebitdaMargin || 35}%`;
      num.dataset.target = hotel.ebitdaMargin || 35;
    }
  });

  // Exec Summary Table
  const revEl = document.getElementById('exec-revpar-val');
  if (revEl) {
    const rev = hotel.revpar || (window.calculateRevPAR ? window.calculateRevPAR(hotel.adr, hotel.occupancy) : (hotel.adr * (hotel.occupancy / 100)).toFixed(1));
    revEl.textContent = rev;
  }
  const dashRevEl = document.getElementById('dash-revpar-val');
  if (dashRevEl) {
    const rev = hotel.revpar || (window.calculateRevPAR ? window.calculateRevPAR(hotel.adr, hotel.occupancy) : (hotel.adr * (hotel.occupancy / 100)).toFixed(1));
    dashRevEl.textContent = `$${rev}`;
  }

  // Gallery Photos
  if (hotel.photos && hotel.photos.length > 0) {
    const galleryImgs = document.querySelectorAll('.photo-masonry .photo-img');
    if (galleryImgs[0] && hotel.photos[0]) galleryImgs[0].src = hotel.photos[0];
    if (galleryImgs[1] && hotel.photos[1]) galleryImgs[1].src = hotel.photos[1];
    if (galleryImgs[2] && hotel.photos[2]) galleryImgs[2].src = hotel.photos[2];
  }
}

/* ─────────────────────────────────────────────
   TOC — активная ссылка при прокрутке
   ───────────────────────────────────────────── */
const tocLinks = document.querySelectorAll('.toc-link[href^="#"]');
const passportSections = document.querySelectorAll(
  '#cover, #summary, #dashboard, #location, #gallery, #iri, #download'
);

if (tocLinks.length && passportSections.length) {
  const headerH = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--header-height'), 10
  ) || 68;
  const tocH = 44;
  const offset = headerH + tocH + 20;

  const tocObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          tocLinks.forEach((link) => {
            link.classList.toggle(
              'toc-link--active',
              link.getAttribute('href') === `#${id}`
            );
          });
        }
      });
    },
    { rootMargin: `-${offset}px 0px -55% 0px`, threshold: 0 }
  );

  passportSections.forEach((s) => tocObserver.observe(s));
}

/* ─────────────────────────────────────────────
   Sticky TOC: тень при скролле
   ───────────────────────────────────────────── */
const passportToc = document.getElementById('passport-toc');
if (passportToc) {
  window.addEventListener('scroll', () => {
    passportToc.classList.toggle('is-stuck', window.scrollY > 100);
  }, { passive: true });
}

/* ─────────────────────────────────────────────
   Кнопка PDF — печать меморандума
   ───────────────────────────────────────────── */
const btnPdf = document.getElementById('btn-download-pdf');
if (btnPdf) {
  btnPdf.addEventListener('click', () => {
    btnPdf.textContent = 'Подготовка меморандума...';
    btnPdf.disabled = true;
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        btnPdf.textContent = 'Скачать PDF-паспорт';
        btnPdf.disabled = false;
      }, 1500);
    }, 300);
  });
}

/* ─────────────────────────────────────────────
   Интерактивная карта (Leaflet.js)
   ───────────────────────────────────────────── */
function initPassportMap(hotel) {
  const mapContainer = document.getElementById('interactive-hotel-map');
  if (!mapContainer || typeof L === 'undefined') return;

  const hotelCoords = (hotel && hotel.coords) ? hotel.coords : [41.2995, 69.2401];

  const map = L.map('interactive-hotel-map', {
    center: hotelCoords,
    zoom: 13,
    zoomControl: true,
    scrollWheelZoom: false
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  const hotelIcon = L.divIcon({
    className: 'custom-hotel-pin',
    html: `
      <div class="hotel-pin-wrapper">
        <div class="hotel-pin-ring"></div>
        <div class="hotel-pin-core">★</div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });

  const hotelName = hotel ? hotel.hotelName : 'Grand Tashkent Hotel';
  const hotelStars = hotel ? hotel.stars : 5;
  const hotelRegion = hotel ? hotel.region : 'г. Ташкент';
  const hotelAdr = hotel ? hotel.adr : 128;
  const hotelRevpar = hotel ? (hotel.revpar || 94.7) : 94.7;
  const hotelIri = hotel ? hotel.iri : 'A+';

  const hotelMarker = L.marker(hotelCoords, { icon: hotelIcon }).addTo(map);
  hotelMarker.bindPopup(`
    <div class="map-popup-card">
      <h4 class="popup-title">${hotelName}</h4>
      <p class="popup-sub">${hotelStars}★ · ${hotelRegion}</p>
      <p class="popup-kpi">ADR $${hotelAdr} · RevPAR $${hotelRevpar} · IRI ${hotelIri}</p>
    </div>
  `).openPopup();

  // Дополнительные маркеры инфраструктуры (POI)
  const pois = [
    { name: 'Международный аэропорт им. И. Каримова', coords: [41.2579, 69.2812], dist: '3,8 км' },
    { name: 'Центральный ж/д вокзал', coords: [41.2922, 69.2844], dist: '4,2 км' },
    { name: 'Деловой квартал Tashkent City', coords: [41.3111, 69.2505], dist: '1,3 км' },
    { name: 'Конгресс-центр', coords: [41.3280, 69.2310], dist: '3,5 км' }
  ];

  const poiMarkers = {};

  pois.forEach((poi) => {
    const poiIcon = L.divIcon({
      className: 'custom-poi-pin',
      html: `<div class="poi-dot"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -8]
    });

    const marker = L.marker(poi.coords, { icon: poiIcon }).addTo(map);
    marker.bindPopup(`
      <div class="map-popup-card map-popup-card--poi">
        <h4 class="popup-title">${poi.name}</h4>
        <p class="popup-sub">Расстояние: <strong>${poi.dist}</strong></p>
      </div>
    `);

    poiMarkers[poi.name] = marker;
  });

  const tableRows = document.querySelectorAll('.loc-table-row');
  tableRows.forEach((row) => {
    row.addEventListener('click', () => {
      const lat = parseFloat(row.dataset.lat);
      const lng = parseFloat(row.dataset.lng);
      const name = row.dataset.name;

      if (!isNaN(lat) && !isNaN(lng)) {
        map.flyTo([lat, lng], 14, { duration: 1.2 });
        tableRows.forEach(r => r.classList.remove('loc-table-row--active'));
        row.classList.add('loc-table-row--active');

        if (poiMarkers[name]) {
          setTimeout(() => poiMarkers[name].openPopup(), 1250);
        }
      }
    });
  });

  setTimeout(() => map.invalidateSize(), 300);
}
