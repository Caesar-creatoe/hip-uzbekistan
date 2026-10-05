/* ============================================================
   EVENTS · core/config.js
   Справочники, статусы, роли и МАТРИЦА ПРАВ — единая конфигурация.
   Права проверяются только через EV.Perm (core/permissions.js),
   который читает эту матрицу.
   ============================================================ */
(function () {
  'use strict';
  const EV = (window.EV = window.EV || {});

  const C = (EV.C = {});

  /* ── Статусы (порядок = порядок жизненного цикла) ─────────── */
  C.STATUS = {
    event: ['planned', 'preparation', 'booking', 'arriving', 'running', 'completed', 'archive'],
    booking: ['draft', 'sent', 'confirmed', 'changed', 'cancelled'],
    meeting: ['planned', 'driver_assigned', 'confirmed', 'met', 'done'],
    transfer: ['planned', 'assigned', 'dispatched', 'enroute', 'done', 'cancelled'],
    departure: ['planned', 'vehicle_assigned', 'enroute', 'departed'],
    task: ['new', 'in_progress', 'done', 'overdue'],
    meal: ['draft', 'requested', 'confirmed', 'served', 'cancelled'],
    guest: ['expected', 'arrived', 'accommodated', 'departed'],
    excursion: ['planned', 'confirmed', 'running', 'done', 'cancelled'],
  };

  /* Цвета бейджей: gray, blue, amber, teal, green, red, brown, dark, gold */
  C.COLOR = {
    event: { planned: 'gray', preparation: 'blue', booking: 'amber', arriving: 'teal', running: 'green', completed: 'brown', archive: 'dark' },
    booking: { draft: 'gray', sent: 'blue', confirmed: 'green', changed: 'amber', cancelled: 'red' },
    meeting: { planned: 'gray', driver_assigned: 'blue', confirmed: 'teal', met: 'green', done: 'dark' },
    transfer: { planned: 'gray', assigned: 'blue', dispatched: 'teal', enroute: 'amber', done: 'green', cancelled: 'red' },
    departure: { planned: 'gray', vehicle_assigned: 'blue', enroute: 'amber', departed: 'green' },
    task: { new: 'gray', in_progress: 'blue', done: 'green', overdue: 'red' },
    meal: { draft: 'gray', requested: 'blue', confirmed: 'teal', served: 'green', cancelled: 'red' },
    guest: { expected: 'gray', arrived: 'teal', accommodated: 'green', departed: 'dark' },
    excursion: { planned: 'gray', confirmed: 'blue', running: 'amber', done: 'green', cancelled: 'red' },
  };

  C.EVENT_TYPES_DEFAULT = [
    { id: 'forum', ru: 'Саммит / форум', uz: 'Sammit / forum', en: 'Summit / forum' },
    { id: 'visit', ru: 'Официальный визит', uz: 'Rasmiy tashrif', en: 'Official visit' },
    { id: 'conference', ru: 'Международная конференция', uz: 'Xalqaro konferensiya', en: 'International conference' },
    { id: 'reception', ru: 'Приём', uz: 'Qabul marosimi', en: 'Reception' },
    { id: 'cultural', ru: 'Культурно-туристическое мероприятие', uz: 'Madaniy-turistik tadbir', en: 'Cultural & tourism event' },
    { id: 'other', ru: 'Другое', uz: 'Boshqa', en: 'Other' },
  ];

  C.ROOM_TYPES = ['standard', 'deluxe', 'suite', 'presidential'];
  C.MEAL_PLANS = ['RO', 'BB', 'HB', 'FB', 'AI']; // без питания / завтрак / полупансион / полный / всё включено
  C.DIETS = ['halal', 'vegetarian', 'vegan', 'gluten_free', 'allergy'];
  C.VEHICLE_CATS = ['car', 'minivan', 'bus', 'vip'];
  C.MEAL_KINDS = ['breakfast', 'lunch', 'dinner', 'reception', 'buffet', 'coffee', 'national', 'special', 'individual'];
  C.ROUTE_TYPES = ['oneday', 'multiday', 'individual', 'group', 'vip', 'cultural', 'gastro', 'nature', 'zone'];
  C.STOP_KINDS = ['sight', 'hotel', 'restaurant', 'venue', 'other'];
  C.DIFFICULTY = ['easy', 'medium', 'hard'];
  C.PLACE_KINDS = ['airport', 'station', 'hotel', 'venue', 'other'];
  C.PRIORITIES = ['low', 'normal', 'high', 'critical'];
  C.VIP_LEVELS = ['none', 'vip', 'protocol'];
  C.QUALITY_KINDS = ['service', 'issue', 'remark', 'complaint', 'rating', 'suggestion', 'feedback'];
  C.GUEST_LANGS = ['ru', 'en', 'uz', 'tr', 'zh', 'ja', 'ko', 'de', 'fr', 'ar', 'kk', 'hi', 'az'];
  C.TASK_TEMPLATES = [
    'book_hotel', 'confirm_rooms', 'meet_delegation', 'assign_transport', 'assign_escort',
    'prepare_route', 'confirm_restaurant', 'check_program', 'organize_departure',
  ];
  C.VIP_CHECKLIST = ['vip_plan', 'vip_transport', 'vip_meeting', 'vip_security', 'vip_program'];

  /* Язык общения по умолчанию для страны гостя (подбор сопровождающего) */
  C.COUNTRY_LANGS = {
    TR: ['tr', 'en'], KZ: ['ru', 'kk'], KG: ['ru'], CN: ['zh', 'en'], JP: ['ja', 'en'], KR: ['ko', 'en'],
    AE: ['ar', 'en'], SA: ['ar', 'en'], DE: ['de', 'en'], FR: ['fr', 'en'], GB: ['en'], US: ['en'],
    IN: ['en', 'hi'], AZ: ['az', 'ru', 'tr'], RU: ['ru'], IT: ['en'], ES: ['en'], PL: ['en'], UZ: ['uz', 'ru'],
    TJ: ['ru'], TM: ['ru'], PK: ['en'], IR: ['en'], EG: ['ar', 'en'], BY: ['ru'],
  };
  C.COUNTRIES = ['UZ', 'TR', 'KZ', 'KG', 'TJ', 'TM', 'RU', 'BY', 'AZ', 'CN', 'JP', 'KR', 'IN', 'PK', 'IR', 'AE', 'SA', 'EG', 'DE', 'FR', 'GB', 'US', 'IT', 'ES', 'PL'];

  /* ── Роли ─────────────────────────────────────────────────── */
  C.ROLES = ['admin', 'head', 'officer', 'coordinator', 'hotel', 'field'];

  /* ── Модули (порядок = порядок бокового меню) ─────────────── */
  C.MODULES = [
    { id: 'my', icon: '📱', num: null },
    { id: 'dashboard', icon: '📊', num: null },
    { id: 'events', icon: '🗂', num: 1 },
    { id: 'guests', icon: '👥', num: 2 },
    { id: 'booking', icon: '🏨', num: 3 },
    { id: 'accommodation', icon: '🛏', num: 4 },
    { id: 'meeting', icon: '🛬', num: 5 },
    { id: 'transport', icon: '🚐', num: 6 },
    { id: 'routes', icon: '🧭', num: 7 },
    { id: 'excursions', icon: '⛰', num: 8 },
    { id: 'escort', icon: '🤝', num: 9 },
    { id: 'meals', icon: '🍽', num: 10 },
    { id: 'vip', icon: '⭐', num: 11 },
    { id: 'departure', icon: '🛫', num: 12 },
    { id: 'tasks', icon: '✅', num: 13 },
    { id: 'calendar', icon: '📅', num: 14 },
    { id: 'map', icon: '🗺', num: 15 },
    { id: 'reports', icon: '📈', num: 16 },
    { id: 'archive', icon: '🗄', num: 17 },
    { id: 'quality', icon: '🏅', num: null, system: true },
    { id: 'security', icon: '🛡', num: null, system: true },
  ];
  const ALL = C.MODULES.map((m) => m.id);

  /* ── Матрица видимости и редактирования модулей ───────────── */
  C.PERMS = {
    view: {
      admin: ALL,
      head: ALL.filter((m) => m !== 'my'),
      officer: ALL.filter((m) => m !== 'security'),
      coordinator: ALL.filter((m) => m !== 'security'),
      hotel: ['booking', 'accommodation', 'calendar'],
      field: ['my', 'meeting', 'transport', 'departure', 'excursions', 'tasks', 'calendar', 'map'],
    },
    edit: {
      admin: ALL,
      head: [],
      officer: ['events', 'guests', 'booking', 'accommodation', 'meeting', 'transport', 'routes', 'excursions', 'escort', 'meals', 'vip', 'departure', 'tasks', 'quality'],
      coordinator: ['guests', 'booking', 'accommodation', 'meeting', 'transport', 'routes', 'excursions', 'escort', 'meals', 'vip', 'departure', 'tasks', 'quality'],
      hotel: ['booking', 'accommodation'],   // ограничено правилами строк (только свой отель, только статус/номер)
      field: ['meeting', 'transport', 'departure', 'excursions', 'tasks'], // только свои задания, только статус
    },
  };

  /* ── Именованные действия ─────────────────────────────────── */
  C.ACTIONS = {
    'event.create': ['admin', 'officer'],
    'event.edit': ['admin', 'officer'],
    'event.status': ['admin', 'officer'],
    'event.archive': ['admin', 'officer'],
    'event.dictionary': ['admin', 'officer'],
    'passport.view': ['admin', 'officer', 'coordinator'],
    'passport.edit': ['admin', 'officer', 'coordinator'],
    'import.guests': ['admin', 'officer', 'coordinator'],
    'export.data': ['admin', 'head', 'officer', 'coordinator'],
    'booking.confirm': ['admin', 'officer', 'coordinator', 'hotel'],
    'booking.cancel': ['admin', 'officer', 'coordinator'],
    'booking.request': ['admin', 'officer', 'coordinator'],
    'audit.view': ['admin', 'head'],
    'backup': ['admin'],
    'users.manage': ['admin'],
    'settings.edit': ['admin'],
    'emergency.use': ['admin', 'head', 'officer', 'coordinator', 'hotel', 'field'],
    'notify.all': ['admin', 'head', 'officer', 'coordinator'],
  };

  /* ── Стартовый маршрут и нижняя панель по ролям ───────────── */
  C.HOME = { admin: 'dashboard', head: 'dashboard', officer: 'dashboard', coordinator: 'dashboard', hotel: 'booking', field: 'my' };
  C.TABBAR = {
    admin: ['my', 'tasks', 'calendar', 'map'],
    head: ['dashboard', 'tasks', 'calendar', 'reports'],
    officer: ['my', 'tasks', 'calendar', 'map'],
    coordinator: ['my', 'tasks', 'calendar', 'map'],
    hotel: ['booking', 'accommodation', 'calendar'],
    field: ['my', 'tasks', 'calendar', 'map'],
  };

  C.IDLE_MIN_DEFAULT = 15;
  C.REMIND_HOURS_DEFAULT = 24;
  C.DB_KEY = 'ev_db_v1';
  C.SESSION_KEY = 'hip_events_session';
})();
