/* ============================================================
   EVENTS · data/places.js
   Справочник мест: аэропорты, вокзалы, площадки мероприятий,
   туристические объекты. Координаты ПРИБЛИЗИТЕЛЬНЫЕ (демо).
   В проде — электронные карты / справочник ГИС (см. integrations).
   ============================================================ */
(function () {
  'use strict';
  const EV = (window.EV = window.EV || {});
  const P = (id, kind, ru, uz, en, lat, lng, phone) => ({ id, kind, name: { ru, uz: uz || en, en }, lat, lng, phone: phone || '' });

  const LIST = [
    // Аэропорты
    P('apt_tas', 'airport', 'Аэропорт Ташкент (TAS)', 'Toshkent aeroporti (TAS)', 'Tashkent Airport (TAS)', 41.2579, 69.2812, '+998 71 000 00 10'),
    P('apt_skd', 'airport', 'Аэропорт Самарканд (SKD)', 'Samarqand aeroporti (SKD)', 'Samarkand Airport (SKD)', 39.7005, 66.9838, '+998 66 000 00 11'),
    P('apt_bhk', 'airport', 'Аэропорт Бухара (BHK)', 'Buxoro aeroporti (BHK)', 'Bukhara Airport (BHK)', 39.775, 64.4833, '+998 65 000 00 12'),
    P('apt_ugc', 'airport', 'Аэропорт Ургенч (UGC)', 'Urganch aeroporti (UGC)', 'Urgench Airport (UGC)', 41.5842, 60.6417, '+998 62 000 00 13'),
    // Вокзалы
    P('stn_tas', 'station', 'Ж/д вокзал Ташкент (Южный)', 'Toshkent (Janubiy) vokzali', 'Tashkent (South) Railway Station', 41.2929, 69.2863, '+998 71 000 00 20'),
    P('stn_skd', 'station', 'Ж/д вокзал Самарканд', 'Samarqand temir yo‘l vokzali', 'Samarkand Railway Station', 39.6678, 66.9086, '+998 66 000 00 21'),
    P('stn_bhk', 'station', 'Ж/д вокзал Бухара', 'Buxoro temir yo‘l vokzali', 'Bukhara Railway Station', 39.7258, 64.5189, '+998 65 000 00 22'),
    // Площадки мероприятий
    P('ven_tcity', 'venue', 'Конгресс-холл, Tashkent City', 'Kongress-xoll, Tashkent City', 'Congress Hall, Tashkent City', 41.3142, 69.2516),
    P('ven_expo', 'venue', 'Выставочный комплекс «Узэкспоцентр»', 'Uzexpocentre ko‘rgazma majmuasi', 'Uzexpocentre Exhibition Complex', 41.3278, 69.3195),
    P('ven_skd', 'venue', 'Конгресс-центр «Вечный город», Самарканд', 'Samarqand kongress markazi', 'Eternal City Congress Centre, Samarkand', 39.6541, 66.9597),
    // Туристические объекты
    P('sg_amir', 'sight', 'Площадь Амира Темура', 'Amir Temur maydoni', 'Amir Temur Square', 41.311, 69.2797),
    P('sg_chorsu', 'sight', 'Рынок Чорсу', 'Chorsu bozori', 'Chorsu Bazaar', 41.3267, 69.2353),
    P('sg_khast', 'sight', 'Комплекс Хаст-Имам', 'Hazrati Imom majmuasi', 'Khast Imam Complex', 41.3369, 69.2309),
    P('sg_chimgan', 'sight', 'Большой Чимган', 'Katta Chimyon', 'Greater Chimgan', 41.5333, 70.0167),
    P('sg_registan', 'sight', 'Площадь Регистан', 'Registon maydoni', 'Registan Square', 39.6547, 66.9759),
    P('sg_gur', 'sight', 'Мавзолей Гур-Эмир', 'Go‘ri Amir maqbarasi', 'Gur-e-Amir Mausoleum', 39.6485, 66.9694),
    P('sg_shah', 'sight', 'Некрополь Шахи-Зинда', 'Shohi Zinda yodgorlik majmuasi', 'Shah-i-Zinda Necropolis', 39.6636, 66.9906),
    P('sg_bibi', 'sight', 'Мечеть Биби-Ханым', 'Bibi-Xonim masjidi', 'Bibi-Khanym Mosque', 39.6609, 66.9795),
    P('sg_ark', 'sight', 'Крепость Арк, Бухара', 'Ark qal‘asi, Buxoro', 'Ark Fortress, Bukhara', 39.7753, 64.4128),
    P('sg_kalyan', 'sight', 'Комплекс Пои-Калян', 'Poi Kalon majmuasi', 'Poi Kalyan Complex', 39.7758, 64.4144),
    P('sg_lyabi', 'sight', 'Ансамбль Ляби-Хауз', 'Labi Hovuz ansambli', 'Lyabi-Hauz Ensemble', 39.7746, 64.419),
    P('sg_ichan', 'sight', 'Ичан-Кала, Хива', 'Ichan Qal‘a, Xiva', 'Itchan Kala, Khiva', 41.3783, 60.3597),
  ];

  EV.Places = {
    all() { return LIST; },
    get(id) { return LIST.find((p) => p.id === id) || null; },
    byKind(k) { return LIST.filter((p) => p.kind === k); },
    name(id) { const p = this.get(id); return p ? EV.U.tx(p.name) : ''; },
    /** Координаты для строки-ссылки вида place:<id> | hotel:<id> | rest:<id> */
    resolve(ref) {
      if (!ref) return null;
      const [k, id] = String(ref).split(':');
      if (k === 'place') { const p = this.get(id); return p ? { name: EV.U.tx(p.name), lat: p.lat, lng: p.lng, phone: p.phone } : null; }
      if (k === 'hotel') { const h = EV.Hotels.get(id); return h ? { name: h.name, lat: h.lat, lng: h.lng, phone: h.phone } : null; }
      if (k === 'rest') { const r = EV.Restaurants.get(id); return r ? { name: r.name, lat: r.lat, lng: r.lng, phone: r.phone } : null; }
      return null;
    },
    /** Опции для выбора места (optgroup): аэропорты, вокзалы, отели, площадки, объекты, рестораны */
    options() {
      const t = EV.I18n.t;
      const g = (label, items) => ({ label, items });
      return [
        g(t('place.airport'), this.byKind('airport').map((p) => ({ v: 'place:' + p.id, l: EV.U.tx(p.name) }))),
        g(t('place.station'), this.byKind('station').map((p) => ({ v: 'place:' + p.id, l: EV.U.tx(p.name) }))),
        g(t('place.venue'), this.byKind('venue').map((p) => ({ v: 'place:' + p.id, l: EV.U.tx(p.name) }))),
        g(t('place.hotel'), EV.Hotels.all().map((h) => ({ v: 'hotel:' + h.id, l: h.name }))),
        g(t('place.sight'), this.byKind('sight').map((p) => ({ v: 'place:' + p.id, l: EV.U.tx(p.name) }))),
        g(t('place.restaurant'), EV.Restaurants.all().map((r) => ({ v: 'rest:' + r.id, l: r.name }))),
      ];
    },
  };
})();
