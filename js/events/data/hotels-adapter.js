/* ============================================================
   EVENTS · data/hotels-adapter.js
   Адаптер каталога отелей платформы.
   ИСТОЧНИК ДАННЫХ — тот же HotelStore (js/hotels-data.js), что и у
   каталога объектов и админки: отели НЕ дублируются в разделе.
   Адаптер лишь нормализует поля и достраивает то, чего нет в каталоге:
     • координаты (по региону; примерные, демо)
     • инвентарь номеров по типам (расчёт от roomsCount и категории)
     • загрузка отеля (демо-оценка; в проде — PMS, см. integrations)
   ============================================================ */
(function () {
  'use strict';
  const EV = (window.EV = window.EV || {});
  const U = EV.U;

  const REGION_CENTER = {
    tashkent: [41.3111, 69.2797],
    'tashkent-region': [41.5333, 70.0167],
    samarkand: [39.6542, 66.9759],
    bukhara: [39.7681, 64.4556],
    khorezm: [41.3775, 60.3619],
    jizzakh: [40.1158, 67.8422],
    kashkadarya: [39.0578, 66.8341],
  };
  const GEO_OVERRIDE = {
    'camp-aydar': [40.9, 66.95],
    'aydarkul-resort': [40.85, 66.9],
    'zomin-miracle': [39.96, 68.4],
    'maydanak-shale': [38.95, 66.95],
    'airport-hotel-tashkent': [41.2682, 69.2805],
    'kumushkon-hotel': [41.5, 70.05],
    'chimgan-apart': [41.5333, 70.0167],
  };

  let cache = { src: null, list: null };

  function phoneOf(raw) {
    if (!raw) return '';
    const m = String(raw).match(/(\+?\d[\d\s\-()]{6,}\d)/);
    if (!m) return '';
    const d = m[1].replace(/\D/g, '');
    if (d.length === 9) return '+998 ' + d.slice(0, 2) + ' ' + d.slice(2, 5) + ' ' + d.slice(5, 7) + ' ' + d.slice(7);
    if (d.length === 12 && d.startsWith('998')) return '+' + d.slice(0, 3) + ' ' + d.slice(3, 5) + ' ' + d.slice(5, 8) + ' ' + d.slice(8, 10) + ' ' + d.slice(10);
    return m[1].trim();
  }
  function nameOf(raw) { return raw ? String(raw).replace(/(\+?\d[\d\s\-()]{6,}\d)/, '').trim() : ''; }

  function normalize(h) {
    const c = REGION_CENTER[h.regionKey] || REGION_CENTER.tashkent;
    const hs = U.hash(h.id || h.slug || h.hotelName || '');
    let lat = c[0] + (((hs % 2000) / 2000) - 0.5) * 0.04;
    let lng = c[1] + ((((hs >> 11) % 2000) / 2000) - 0.5) * 0.05;
    if (GEO_OVERRIDE[h.id]) { lat = GEO_OVERRIDE[h.id][0]; lng = GEO_OVERRIDE[h.id][1]; }
    const photos = Array.isArray(h.photos) ? h.photos : [];
    return {
      id: h.id || h.slug,
      name: h.hotelName || h.name || h.id,
      stars: parseInt(h.stars, 10) || 3,
      region: h.region || '',
      regionKey: h.regionKey || '',
      address: h.address || '',
      rooms: Math.max(1, parseInt(h.roomsCount, 10) || 20),
      floors: Math.max(1, parseInt(h.floors, 10) || 5),
      contactName: nameOf(h.managerContact),
      phone: phoneOf(h.managerContact),
      amenities: h.amenities || '',
      photo: typeof photos[0] === 'string' ? photos[0] : '',
      lat, lng,
    };
  }

  function rawList() {
    try {
      if (window.HotelStore && typeof window.HotelStore.getAll === 'function') return window.HotelStore.getAll() || [];
    } catch (e) { console.warn('HotelStore:', e); }
    return [];
  }

  const Hotels = (EV.Hotels = {
    /** Все отели каталога платформы (нормализованные). Кэш сбрасывается при обновлении каталога. */
    all() {
      const src = rawList();
      if (cache.src !== src || !cache.list) { cache = { src, list: src.map(normalize) }; roomCache.clear(); }
      return cache.list;
    },
    get(id) { return this.all().find((h) => h.id === id) || null; },
    ready() { return this.all().length > 0; },
    search(q, opts) {
      opts = opts || {};
      q = (q || '').toLowerCase().trim();
      return this.all().filter((h) =>
        (!q || (h.name + ' ' + h.region + ' ' + h.address).toLowerCase().includes(q)) &&
        (!opts.stars || h.stars === +opts.stars) &&
        (!opts.region || h.regionKey === opts.region));
    },
    regions() {
      const m = {};
      this.all().forEach((h) => { m[h.regionKey] = h.region; });
      return Object.keys(m).map((k) => ({ v: k, l: m[k] }));
    },

    /** Распределение номеров по типам (доли по категории отеля). */
    roomTypes(h) {
      const share = h.stars >= 5 ? [0.55, 0.28, 0.14, 0.03] : h.stars === 4 ? [0.65, 0.27, 0.08, 0] : [0.85, 0.15, 0, 0];
      const total = h.rooms;
      const counts = share.map((s) => Math.floor(total * s));
      if (share[3] > 0 && counts[3] === 0) counts[3] = 1;
      if (share[2] > 0 && counts[2] === 0) counts[2] = 1;
      counts[0] = total - counts[1] - counts[2] - counts[3];
      return EV.C.ROOM_TYPES.map((t, i) => ({ type: t, total: counts[i] })).filter((x) => x.total > 0);
    },

    /** Список номеров отеля: no, этаж, тип (люксы — на верхних этажах). */
    rooms(h) {
      const key = h.id + ':' + h.rooms;
      if (roomCache.has(key)) return roomCache.get(key);
      const types = this.roomTypes(h);
      const perFloor = Math.ceil(h.rooms / h.floors);
      const out = [];
      let n = 0;
      types.forEach((t) => {
        for (let i = 0; i < t.total; i++) {
          const floor = Math.floor(n / perFloor) + 1;
          const idx = (n % perFloor) + 1;
          out.push({ no: String(floor * 100 + idx), floor, type: t.type });
          n++;
        }
      });
      roomCache.set(key, out);
      return out;
    },

    /** Демо-оценка «внешней» загрузки отеля на дату (в проде — данные PMS). */
    baseLoad(h, dayISO) {
      const k = U.hash(h.id + U.day(dayISO)) % 100;
      return 0.18 + (k / 100) * 0.37; // 18–55 %
    },

    /**
     * Доступность номеров на период [from, to) с учётом броней раздела.
     * bookings — все брони (любых мероприятий) без отменённых.
     */
    availability(h, bookings, from, to) {
      const bks = bookings.filter((b) => b.hotelId === h.id && b.status !== 'cancelled' && U.overlap(b.checkIn, b.checkOut, from, to));
      const types = this.roomTypes(h);
      const midDay = U.toISO(U.addDays(from, Math.max(0, Math.floor(U.nights(from, to) / 2))));
      const load = this.baseLoad(h, midDay);
      return types.map((t) => {
        const external = Math.round(t.total * load);
        const ours = bks.filter((b) => b.roomType === t.type).length;
        return { type: t.type, total: t.total, external, booked: ours, free: Math.max(0, t.total - external - ours) };
      });
    },
    /** Занятые нашими бронями номера (по номеру) на период */
    occupiedRooms(hotelId, bookings, from, to, ignoreBookingId) {
      const s = new Set();
      bookings.forEach((b) => {
        if (b.hotelId === hotelId && b.roomNo && b.status !== 'cancelled' && b.id !== ignoreBookingId && U.overlap(b.checkIn, b.checkOut, from, to)) s.add(String(b.roomNo));
      });
      return s;
    },
    /** Подобрать свободный номер заданного типа */
    pickRoom(h, type, bookings, from, to) {
      const occ = this.occupiedRooms(h.id, bookings, from, to);
      return this.rooms(h).find((r) => r.type === type && !occ.has(r.no)) || null;
    },
  });
  const roomCache = new Map();

  /* ── Рестораны платформы (data/restaurants.json) ─────────── */
  const REST_CENTER = {
    'Ташкент (город)': [41.3111, 69.2797],
    'Самаркандская область': [39.6542, 66.9759],
    'Бухарская область': [39.7681, 64.4556],
    'Хорезмская область': [41.3775, 60.3619],
    'Ташкентская область': [41.5333, 70.0167],
  };
  let restCache = null;
  EV.Restaurants = {
    async load() {
      if (restCache) return restCache;
      try {
        const res = await fetch('./data/restaurants.json');
        const list = await res.json();
        restCache = list.map((r) => {
          const c = REST_CENTER[r.region] || REST_CENTER['Ташкент (город)'];
          const hs = U.hash(r.id);
          return {
            id: r.id, name: r.name, region: r.region, seats: r.seats, cuisine: r.cuisine_label || '',
            phone: phoneOf(r.contact), contactName: nameOf(r.contact),
            lat: c[0] + (((hs % 1000) / 1000) - 0.5) * 0.03, lng: c[1] + ((((hs >> 9) % 1000) / 1000) - 0.5) * 0.04,
          };
        });
      } catch (e) { console.warn('restaurants.json:', e); restCache = []; }
      return restCache;
    },
    all() { return restCache || []; },
    get(id) { return (restCache || []).find((r) => r.id === id) || null; },
  };
})();
