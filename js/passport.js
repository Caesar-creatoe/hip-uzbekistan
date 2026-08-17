/* ============================================================
   PASSPORT.JS — Навигация и интерактивность паспорта
   Hotel Investment Portfolio · Комитет по туризму РУз
   ============================================================ */

'use strict';

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
   Кнопка PDF — мгновенная печать меморандума
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
document.addEventListener('DOMContentLoaded', () => {
  const mapContainer = document.getElementById('interactive-hotel-map');
  if (!mapContainer || typeof L === 'undefined') return;

  const hotelCoords = [41.2995, 69.2401];

  // Инициализация карты
  const map = L.map('interactive-hotel-map', {
    center: hotelCoords,
    zoom: 13,
    zoomControl: true,
    scrollWheelZoom: false
  });

  // Dark Matter CartoDB плитки
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // Кастомная иконка для отеля Grand Tashkent (терракотовая звезда)
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

  const hotelMarker = L.marker(hotelCoords, { icon: hotelIcon }).addTo(map);
  hotelMarker.bindPopup(`
    <div class="map-popup-card">
      <h4 class="popup-title">Grand Tashkent Hotel</h4>
      <p class="popup-sub">5★ · Luxury Business Hotel</p>
      <p class="popup-kpi">ADR $128 · RevPAR $94.7 · IRI A+</p>
    </div>
  `).openPopup();

  // Дополнительные маркеры инфраструктуры (POI)
  const pois = [
    { name: 'Международный аэропорт им. И. Каримова', coords: [41.2579, 69.2812], dist: '38 км' },
    { name: 'Центральный ж/д вокзал (Северный)', coords: [41.2922, 69.2844], dist: '4,2 км' },
    { name: 'Площадь Мустакиллик (Центр)', coords: [41.3167, 69.2667], dist: '2,1 км' },
    { name: 'МВЦ «Узэкспоцентр»', coords: [41.3411, 69.2831], dist: '6,8 км' },
    { name: 'Деловой квартал Tashkent City', coords: [41.3111, 69.2505], dist: '1,3 км' },
    { name: 'АКФА-Арена (Конференц-центр)', coords: [41.3280, 69.2310], dist: '3,5 км' },
    { name: 'Ташкентский медицинский кластер', coords: [41.3350, 69.2150], dist: '5,2 км' }
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
        <p class="popup-sub">Расстояние от отеля: <strong>${poi.dist}</strong></p>
      </div>
    `);

    poiMarkers[poi.name] = marker;
  });

  // Интерактивность таблицы расстояний: клик по строке плавно центрирует карту на объекте
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

  // Инвалидация размера карты при открытии вкладки или скролле
  setTimeout(() => map.invalidateSize(), 300);
});


