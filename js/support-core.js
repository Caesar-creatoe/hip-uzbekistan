/* ============================================================
   SUPPORT-CORE.JS — единый модуль данных и интерфейса господдержки.
   Источник данных: ./data/support-programs.json (support_programs).
   Читают: support.html, registries.html, счётчики на всех страницах.
   Статус программ вычисляется по текущей дате автоматически.
   ============================================================ */
(function () {
  'use strict';

  const LANGS = ['ru', 'uz', 'en'];
  const DATA_URL = './data/support-programs.json';

  /* ── Словари интерфейса (RU / UZ-латиница / EN) ─────────── */
  const T = {
    ru: {
      active: 'Действует', soon: 'Скоро завершится', expired: 'Срок действия истёк',
      until: 'до', from: 'с', indefinite: 'бессрочно', period: 'Срок',
      authority: 'Орган', basis: 'Основание', conditions: 'Условия получения',
      cta: 'Связаться с Комитетом →', all: 'Все', show_expired: 'Показать завершённые',
      f_category: 'Тип', f_recipient: 'Кому', f_region: 'Регион', f_status: 'Статус',
      sum_unit: 'сум', sum_per_room: 'за номер', empty: 'Нет программ по выбранным фильтрам',
      count_word: 'мер', up_to: 'до',
      reg_tab: '03. Реестр мер господдержки', reg_title: 'Реестр мер государственной поддержки', reg_sub: 'Все опубликованные меры: субсидии, компенсации, гранты и налоговые льготы. Статус рассчитывается по текущей дате.', reg_npa_title: 'Нормативные акты о мерах поддержки',
      cat: { subsidy: 'Субсидии', compensation: 'Компенсации расходов', grant: 'Гранты', tax: 'Налоговые' },
      cat1: { subsidy: 'Субсидия', compensation: 'Компенсация расходов', grant: 'Грант', tax: 'Налоговая льгота' },
      rec: { hotel_investors: 'Инвесторам-отельерам', operators: 'Туроператорам и авиаперевозчикам', entrepreneurs: 'Предпринимателям (активный туризм)', youth: 'Молодёжи', inclusive: 'Инклюзивный туризм и кадры' },
      reg: { all: 'Вся страна', khorezm: 'Хорезм', surkhandarya: 'Сурхандарья', karakalpakstan: 'Каракалпакстан', no_hotel_districts: 'Районы без отелей' },
      auth: { MEF: 'Министерство экономики и финансов', COMMITTEE: 'Комитет по туризму' },
      doc: { PP: 'ПП-', PF: 'ПФ-', PKM: 'ПКМ ' }, dated: 'от',
      // страница
      hero_title: 'Меры государственной поддержки<br>туризма в Узбекистане',
      hero_desc: '{count} действующих мер поддержки отелей, туроператоров и предпринимателей: субсидии, компенсации расходов, гранты и налоговые льготы.',
      stat_count: 'Действующих мер', stat_max: 'Макс. субсидия на новую гостиницу (A9)', stat_max_val: 'до {max} за номер',
      badge_title: 'Реестр мер поддержки', badge_desc: 'Статус рассчитывается по текущей дате', badge_stamp: 'Комитет по туризму РУз',
      calc_kicker: 'Справочный расчёт', calc_title: 'Калькулятор господдержки',
      calc_desc: 'Укажите параметры проекта — калькулятор покажет каждую применимую программу отдельной строкой по официальным формулам.',
      npa_kicker: 'Нормативная база', npa_title: 'Законодательные акты', npa_desc: 'Нормативные акты, на основании которых действуют меры поддержки',
      npa_doc: 'Документ', npa_date: 'Дата', npa_subject: 'Предмет', npa_status: 'Статус программы',
      cta_kicker: 'Обращение', cta_title: 'Получить господдержку<br>для вашего проекта',
      cta_desc: 'Оставьте обращение в кабинете инвестора и свяжитесь с Комитетом по туризму.',
      cta_btn: 'Оставить обращение',
      // калькулятор
      mode_hotel: '🏨 Отель', mode_operator: '✈️ Туроператор',
      c_project: 'Тип проекта', c_region: 'Регион', c_stars: 'Категория', c_rooms: 'Количество номеров', c_places: 'Количество мест',
      c_floors: 'Этажность', c_modules: 'Количество модулей', c_modcat: 'Категория модульной гостиницы',
      c_brand: 'Франшиза с брендом из перечня Координационного совета', c_arrears: 'Нет налоговой задолженности и не в банкротстве или ликвидации',
      c_uplift: 'Район без категорийных гостиниц, один из первых 2 (4–5★) / 3 (3★) проектов',
      p_new: 'Новое строительство', p_upgrade: 'Перевод в 3★ (Каракалпакстан)', p_commissioned: 'Введённый в эксплуатацию отель', p_modular: 'Модульная гостиница', p_franchise: 'Франшиза',
      stars0: 'Без категории', star: '★', c_charter_flag: 'Чартерный рейс',
      o_low: 'Туристов из стран с низким турпотоком', o_charter: 'Туристов по чартерным рейсам', o_nights: 'Ночей проживания на туриста',
      o_city: 'Аэропорт прилёта', o_season: 'Период', o_regular: 'Обычный', o_winter: 'Зимний (20.11 – 20.02)',
      city_samarkand: 'Самарканд', city_bukhara: 'Бухара', city_urgench: 'Ургенч', city_other: 'Другой',
      r_applicable: 'Применимые программы', r_na: 'Не применимо', r_none: 'Нет применимых программ по указанным параметрам',
      r_formula: 'Расчёт', r_total: 'Сумма по отдельным программам', r_total_uzs: 'в сумах', r_total_usd: 'в долларах США',
      r_combo: 'Возможность совмещения программ в официальных документах не указана. Уточните в Комитете по туризму.',
      r_foot: 'Расчёт справочный, окончательный размер определяется в порядке, установленном нормативными актами.',
      r_warn: 'Срок действия до', r_a9note: 'сумма по A9; условия по размеру здания не проверялись',
      na_stars_345: 'только для категорий 3★–5★', na_rooms: 'нужно минимум {n} номеров', na_floors: 'нужно минимум 5 этажей',
      na_region_s: 'только для Сурхандарьи', na_region_k: 'только для Каракалпакстана', na_region_x: 'только для Хорезма', na_region_d: 'только для районов без гостиниц',
      na_arrears: 'подтвердите отсутствие налоговой задолженности и банкротства/ликвидации', na_stars_012: 'сумма предусмотрена для категорий без звёзд, 1★ и 2★',
      na_stars_3: 'перевод возможен только в категорию 3★', na_rooms_min10: 'нужно минимум 10 номеров', na_modules: 'нужно минимум 10 модулей', na_places: 'укажите количество мест',
      na_brand: 'нужен бренд из перечня Координационного совета', na_count: 'укажите количество туристов', na_nights: 'нужно проживание от 5 ночей',
      na_city: 'только Самарканд, Бухара, Ургенч', na_charter: 'только для чартерных рейсов', rooms_unit: 'номеров', places_unit: 'мест', tourists_unit: 'туристов', years: 'года'
    },
    uz: {
      active: 'Amalda', soon: 'Tez orada tugaydi', expired: 'Amal qilish muddati tugagan',
      until: 'gacha', from: 'dan', indefinite: 'muddatsiz', period: 'Muddat',
      authority: 'Organ', basis: 'Asos', conditions: 'Olish shartlari',
      cta: 'Qo\'mita bilan bog\'lanish →', all: 'Hammasi', show_expired: 'Tugaganlarni ko\'rsatish',
      f_category: 'Turi', f_recipient: 'Kimga', f_region: 'Hudud', f_status: 'Holat',
      sum_unit: 'so\'m', sum_per_room: 'xona uchun', empty: 'Tanlangan filtrlar bo\'yicha dasturlar yo\'q',
      count_word: 'chora', up_to: 'gacha',
      reg_tab: '03. Davlat qo\'llab-quvvatlash choralari reestri', reg_title: 'Davlat qo\'llab-quvvatlash choralari reestri', reg_sub: 'Barcha e\'lon qilingan choralar: subsidiyalar, xarajatlarni qoplash, grantlar va soliq imtiyozlari. Holat joriy sana bo\'yicha hisoblanadi.', reg_npa_title: 'Qo\'llab-quvvatlash choralari bo\'yicha me\'yoriy hujjatlar',
      cat: { subsidy: 'Subsidiyalar', compensation: 'Xarajatlarni qoplash', grant: 'Grantlar', tax: 'Soliq imtiyozlari' },
      cat1: { subsidy: 'Subsidiya', compensation: 'Xarajatlarni qoplash', grant: 'Grant', tax: 'Soliq imtiyozi' },
      rec: { hotel_investors: 'Mehmonxona investorlariga', operators: 'Turoperatorlar va aviatashuvchilarga', entrepreneurs: 'Tadbirkorlarga (faol turizm)', youth: 'Yoshlarga', inclusive: 'Inklyuziv turizm va kadrlar' },
      reg: { all: 'Butun mamlakat', khorezm: 'Xorazm', surkhandarya: 'Surxondaryo', karakalpakstan: 'Qoraqalpog\'iston', no_hotel_districts: 'Mehmonxonasiz tumanlar' },
      auth: { MEF: 'Iqtisodiyot va moliya vazirligi', COMMITTEE: 'Turizm qo\'mitasi' },
      doc: { PP: 'PQ-', PF: 'PF-', PKM: 'VMQ ' }, dated: 'sanasi',
      hero_title: 'O\'zbekistonda turizmni davlat tomonidan<br>qo\'llab-quvvatlash choralari',
      hero_desc: 'Mehmonxonalar, turoperatorlar va tadbirkorlarni qo\'llab-quvvatlashning {count} ta amaldagi chorasi: subsidiyalar, xarajatlarni qoplash, grantlar va soliq imtiyozlari.',
      stat_count: 'Amaldagi choralar', stat_max: 'Yangi mehmonxonaga maks. subsidiya (A9)', stat_max_val: 'xona uchun {max} gacha',
      badge_title: 'Qo\'llab-quvvatlash choralari reestri', badge_desc: 'Holat joriy sana bo\'yicha hisoblanadi', badge_stamp: 'O\'zR Turizm qo\'mitasi',
      calc_kicker: 'Ma\'lumot uchun hisob-kitob', calc_title: 'Davlat qo\'llab-quvvatlashi kalkulyatori',
      calc_desc: 'Loyiha parametrlarini kiriting — kalkulyator har bir mos dasturni rasmiy formulalar bo\'yicha alohida qatorda ko\'rsatadi.',
      npa_kicker: 'Me\'yoriy baza', npa_title: 'Qonun hujjatlari', npa_desc: 'Qo\'llab-quvvatlash choralari amal qiladigan me\'yoriy hujjatlar',
      npa_doc: 'Hujjat', npa_date: 'Sana', npa_subject: 'Predmet', npa_status: 'Dastur holati',
      cta_kicker: 'Murojaat', cta_title: 'Loyihangiz uchun davlat<br>qo\'llab-quvvatlashini oling',
      cta_desc: 'Investor kabinetida murojaat qoldiring va Turizm qo\'mitasi bilan bog\'laning.',
      cta_btn: 'Murojaat qoldirish',
      mode_hotel: '🏨 Mehmonxona', mode_operator: '✈️ Turoperator',
      c_project: 'Loyiha turi', c_region: 'Hudud', c_stars: 'Toifa', c_rooms: 'Xonalar soni', c_places: 'O\'rinlar soni',
      c_floors: 'Qavatlar soni', c_modules: 'Modullar soni', c_modcat: 'Modulli mehmonxona toifasi',
      c_brand: 'Turizmni rivojlantirish Muvofiqlashtiruvchi kengashi ro\'yxatidagi brend bilan franshiza', c_arrears: 'Soliq qarzdorligi yo\'q, bankrotlik yoki tugatish jarayonida emas',
      c_uplift: 'Toifali mehmonxonalar bo\'lmagan tuman, dastlabki 2 ta (4–5★) / 3 ta (3★) loyihadan biri',
      p_new: 'Yangi qurilish', p_upgrade: '3★ ga o\'tkazish (Qoraqalpog\'iston)', p_commissioned: 'Foydalanishga topshirilgan mehmonxona', p_modular: 'Modulli mehmonxona', p_franchise: 'Franshiza',
      stars0: 'Toifasiz', star: '★', c_charter_flag: 'Charter reys',
      o_low: 'Turistlar oqimi past mamlakatlardan turistlar', o_charter: 'Charter reyslar bo\'yicha turistlar', o_nights: 'Bir turistning yashash tunlari',
      o_city: 'Qo\'nish aeroporti', o_season: 'Davr', o_regular: 'Oddiy', o_winter: 'Qishki (20.11 – 20.02)',
      city_samarkand: 'Samarqand', city_bukhara: 'Buxoro', city_urgench: 'Urganch', city_other: 'Boshqa',
      r_applicable: 'Mos dasturlar', r_na: 'Mos kelmaydi', r_none: 'Kiritilgan parametrlar bo\'yicha mos dasturlar yo\'q',
      r_formula: 'Hisob', r_total: 'Alohida dasturlar bo\'yicha jami', r_total_uzs: 'so\'mda', r_total_usd: 'AQSH dollarida',
      r_combo: 'Dasturlarni birgalikda qo\'llash imkoniyati rasmiy hujjatlarda ko\'rsatilmagan. Turizm qo\'mitasidan aniqlang.',
      r_foot: 'Hisob-kitob ma\'lumot uchun, yakuniy miqdor me\'yoriy hujjatlarda belgilangan tartibda aniqlanadi.',
      r_warn: 'Amal qilish muddati', r_a9note: 'A9 bo\'yicha summa; bino o\'lchami bo\'yicha shartlar tekshirilmagan',
      na_stars_345: 'faqat 3★–5★ toifalar uchun', na_rooms: 'kamida {n} ta xona kerak', na_floors: 'kamida 5 qavat kerak',
      na_region_s: 'faqat Surxondaryo uchun', na_region_k: 'faqat Qoraqalpog\'iston uchun', na_region_x: 'faqat Xorazm uchun', na_region_d: 'faqat mehmonxonasiz tumanlar uchun',
      na_arrears: 'soliq qarzdorligi va bankrotlik/tugatish yo\'qligini tasdiqlang', na_stars_012: 'summa toifasiz, 1★ va 2★ uchun belgilangan',
      na_stars_3: 'faqat 3★ toifaga o\'tkazish mumkin', na_rooms_min10: 'kamida 10 ta xona kerak', na_modules: 'kamida 10 ta modul kerak', na_places: 'o\'rinlar sonini kiriting',
      na_brand: 'Muvofiqlashtiruvchi kengash ro\'yxatidagi brend kerak', na_count: 'turistlar sonini kiriting', na_nights: 'kamida 5 tun yashash kerak',
      na_city: 'faqat Samarqand, Buxoro, Urganch', na_charter: 'faqat charter reyslar uchun', rooms_unit: 'xona', places_unit: 'o\'rin', tourists_unit: 'turist', years: 'yil'
    },
    en: {
      active: 'Active', soon: 'Ending soon', expired: 'Expired',
      until: 'until', from: 'from', indefinite: 'indefinite', period: 'Period',
      authority: 'Authority', basis: 'Legal basis', conditions: 'Eligibility conditions',
      cta: 'Contact the Committee →', all: 'All', show_expired: 'Show expired',
      f_category: 'Type', f_recipient: 'For', f_region: 'Region', f_status: 'Status',
      sum_unit: 'UZS', sum_per_room: 'per room', empty: 'No programmes match the selected filters',
      count_word: 'measures', up_to: 'up to',
      reg_tab: '03. Register of state support measures', reg_title: 'Register of state support measures', reg_sub: 'All published measures: subsidies, cost compensation, grants and tax benefits. The status is calculated by the current date.', reg_npa_title: 'Legal acts on support measures',
      cat: { subsidy: 'Subsidies', compensation: 'Cost compensation', grant: 'Grants', tax: 'Tax benefits' },
      cat1: { subsidy: 'Subsidy', compensation: 'Cost compensation', grant: 'Grant', tax: 'Tax benefit' },
      rec: { hotel_investors: 'Hotel investors', operators: 'Tour operators and air carriers', entrepreneurs: 'Entrepreneurs (active tourism)', youth: 'Youth', inclusive: 'Inclusive tourism and staff' },
      reg: { all: 'Nationwide', khorezm: 'Khorezm', surkhandarya: 'Surkhandarya', karakalpakstan: 'Karakalpakstan', no_hotel_districts: 'Districts without hotels' },
      auth: { MEF: 'Ministry of Economy and Finance', COMMITTEE: 'Tourism Committee' },
      doc: { PP: 'PP-', PF: 'PD-', PKM: 'CMR ' }, dated: 'dated',
      hero_title: 'State support measures<br>for tourism in Uzbekistan',
      hero_desc: '{count} active support measures for hotels, tour operators and entrepreneurs: subsidies, cost compensation, grants and tax benefits.',
      stat_count: 'Active measures', stat_max: 'Max. subsidy for a new hotel (A9)', stat_max_val: 'up to {max} per room',
      badge_title: 'Register of support measures', badge_desc: 'Status is calculated by the current date', badge_stamp: 'Tourism Committee of Uzbekistan',
      calc_kicker: 'Reference calculation', calc_title: 'State support calculator',
      calc_desc: 'Enter your project parameters — the calculator shows each applicable programme as a separate line using the official formulas.',
      npa_kicker: 'Legal framework', npa_title: 'Legal acts', npa_desc: 'Legal acts under which the support measures operate',
      npa_doc: 'Document', npa_date: 'Date', npa_subject: 'Subject', npa_status: 'Programme status',
      cta_kicker: 'Enquiry', cta_title: 'Get state support<br>for your project',
      cta_desc: 'Leave an enquiry in the investor cabinet and contact the Tourism Committee.',
      cta_btn: 'Submit an enquiry',
      mode_hotel: '🏨 Hotel', mode_operator: '✈️ Tour operator',
      c_project: 'Project type', c_region: 'Region', c_stars: 'Category', c_rooms: 'Number of rooms', c_places: 'Number of places',
      c_floors: 'Number of floors', c_modules: 'Number of modules', c_modcat: 'Modular hotel category',
      c_brand: 'Franchise with a brand from the Coordination Council list', c_arrears: 'No tax arrears and not in bankruptcy or liquidation',
      c_uplift: 'District without categorised hotels, one of the first 2 (4–5★) / 3 (3★) projects',
      p_new: 'New construction', p_upgrade: 'Upgrade to 3★ (Karakalpakstan)', p_commissioned: 'Hotel put into operation', p_modular: 'Modular hotel', p_franchise: 'Franchise',
      stars0: 'No category', star: '★', c_charter_flag: 'Charter flight',
      o_low: 'Tourists from low tourist-flow countries', o_charter: 'Tourists on charter flights', o_nights: 'Nights of stay per tourist',
      o_city: 'Arrival airport', o_season: 'Period', o_regular: 'Regular', o_winter: 'Winter (20 Nov – 20 Feb)',
      city_samarkand: 'Samarkand', city_bukhara: 'Bukhara', city_urgench: 'Urgench', city_other: 'Other',
      r_applicable: 'Applicable programmes', r_na: 'Not applicable', r_none: 'No applicable programmes for the given parameters',
      r_formula: 'Calculation', r_total: 'Total of separate programmes', r_total_uzs: 'in UZS', r_total_usd: 'in US dollars',
      r_combo: 'The possibility of combining programmes is not specified in the official documents. Please check with the Tourism Committee.',
      r_foot: 'The calculation is for reference only; the final amount is determined in the manner established by the regulations.',
      r_warn: 'Valid until', r_a9note: 'amount per A9; building size conditions were not checked',
      na_stars_345: 'only for categories 3★–5★', na_rooms: 'at least {n} rooms required', na_floors: 'at least 5 floors required',
      na_region_s: 'only for Surkhandarya', na_region_k: 'only for Karakalpakstan', na_region_x: 'only for Khorezm', na_region_d: 'only for districts without hotels',
      na_arrears: 'confirm no tax arrears and no bankruptcy/liquidation', na_stars_012: 'the amount is set for no category, 1★ and 2★',
      na_stars_3: 'upgrade is possible only to the 3★ category', na_rooms_min10: 'at least 10 rooms required', na_modules: 'at least 10 modules required', na_places: 'enter the number of places',
      na_brand: 'a brand from the Coordination Council list is required', na_count: 'enter the number of tourists', na_nights: 'a stay of at least 5 nights is required',
      na_city: 'only Samarkand, Bukhara, Urgench', na_charter: 'only for charter flights', rooms_unit: 'rooms', places_unit: 'places', tourists_unit: 'tourists', years: 'years'
    }
  };

  /* ── Базовые функции ─────────────────────────────────── */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lang = () => { const l = localStorage.getItem('hip_lang'); return LANGS.includes(l) ? l : 'ru'; };
  const tx = (o, l) => (o ? (o[l || lang()] || o.ru || '') : '');
  const D = () => T[lang()];
  const parseD = (s) => (s ? new Date(s + 'T23:59:59') : null);
  const fmtDate = (s) => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${d}.${m}.${y}`; };
  const grp = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  const fmtUZS = (n) => `${grp(n)}\u00a0${D().sum_unit}`;
  const fmtUSD = (n) => `$${grp(n)}`;
  const fmtMln = (n) => { const v = n / 1e6; const s = (Number.isInteger(v) ? String(v) : String(v).replace('.', lang() === 'en' ? '.' : ',')); return `${s}\u00a0${lang() === 'ru' ? 'млн' : lang() === 'uz' ? 'mln' : 'mln'}\u00a0${D().sum_unit}`; };

  function status(p, now) {
    now = now || new Date();
    const to = parseD(p.valid_to);
    if (to && now > to) return 'expired';
    if (to) { const lim = new Date(now); lim.setMonth(lim.getMonth() + 6); if (to <= lim) return 'soon'; }
    return 'active';
  }

  function periodText(p) {
    const d = D();
    if (p.valid_from && p.valid_to) return `${fmtDate(p.valid_from)} – ${fmtDate(p.valid_to)}`;
    if (p.valid_to) return `${d.until} ${fmtDate(p.valid_to)}`;
    if (p.valid_from) return lang() === 'uz' ? `${fmtDate(p.valid_from)} ${d.from}, ${d.indefinite}` : `${d.from} ${fmtDate(p.valid_from)}, ${d.indefinite}`;
    return d.indefinite;
  }

  function docLabel(b) {
    const d = D();
    const num = `${d.doc[b.type]}${b.number}`;
    return b.date ? (lang() === 'uz' ? `${num}, ${b.date}` : `${num} ${d.dated} ${b.date}`) : num;
  }
  function legalText(p) {
    if (!p.legal_basis) return '';
    const r = tx(p.legal_basis.ref);
    return docLabel(p.legal_basis) + (r ? `, ${r}` : '');
  }
  const authorityText = (p) => (p.authority || []).map((a) => D().auth[a]).filter(Boolean).join(', ');

  /* ── Загрузка ─────────────────────────────────────────── */
  let cache = null;
  function load() {
    if (!cache) {
      cache = fetch(DATA_URL, { cache: 'no-cache' }).then((r) => r.json()).catch((e) => { console.warn('support-programs.json not loaded', e); return []; });
    }
    return cache;
  }
  const published = (all) => all.filter((p) => p.published === true);
  const live = (all) => published(all).filter((p) => status(p) !== 'expired');
  const maxPerRoom = (all) => {
    const a9 = all.find((p) => p.id === 'A9' && p.published && status(p) !== 'expired');
    return a9 && a9.amount_numeric ? a9.amount_numeric.max_per_room : null;
  };

  /* ── Счётчики на страницах ────────────────────────────── */
  function fillCounters(all) {
    const n = live(all).length;
    const mx = maxPerRoom(all);
    document.querySelectorAll('[data-support="count"]').forEach((el) => { el.textContent = n; });
    document.querySelectorAll('[data-support="max"]').forEach((el) => { el.textContent = mx ? fmtMln(mx) : ''; });
  }

  /* ── Карточки ─────────────────────────────────────────── */
  const ICON = { subsidy: '💰', compensation: '🧾', grant: '🎓', tax: '📊' };
  function badge(p) {
    const st = status(p), d = D();
    if (st === 'expired') return `<span class="sp-badge sp-badge--expired">${esc(d.expired)}</span>`;
    if (st === 'soon') return `<span class="sp-badge sp-badge--soon">${esc(d.until)} ${esc(fmtDate(p.valid_to))}</span>`;
    return `<span class="sp-badge sp-badge--active">${esc(d.active)}</span>`;
  }
  function statusBadgeFull(p) {
    const st = status(p), d = D();
    return `<span class="sp-badge sp-badge--${st}">${esc(st === 'soon' ? `${d.soon} · ${d.until} ${fmtDate(p.valid_to)}` : d[st])}</span>`;
  }

  function cardHTML(p) {
    const d = D(), st = status(p), l = lang();
    const cond = p.conditions && p.conditions[l] && p.conditions[l].length ? p.conditions[l] : null;
    const auth = authorityText(p), basis = legalText(p);
    return `
    <div class="program-card ${st === 'expired' ? 'program-card--expired' : ''}" data-id="${esc(p.id)}">
      <div class="program-card__header">
        <div class="program-card__icon">${ICON[p.category] || '🏛'}</div>
        <div>
          <div class="program-card__type">${esc(d.cat1[p.category])} · ${esc(d.rec[p.recipient])}</div>
          <h3 class="program-card__title">${esc(tx(p.title))}</h3>
        </div>
      </div>
      <div class="program-card__amount">
        <div class="program-card__amount-num program-card__amount-num--text">${esc(tx(p.amount_text))}</div>
      </div>
      <p class="program-card__short">${esc(tx(p.description))}</p>
      ${(auth || basis) ? `<div class="program-card__legal">
        ${auth ? `<div><span>${esc(d.authority)}:</span> ${esc(auth)}</div>` : ''}
        ${basis ? `<div><span>${esc(d.basis)}:</span> ${esc(basis)}</div>` : ''}
      </div>` : ''}
      ${cond ? `<details class="program-card__cond"><summary>${esc(d.conditions)}</summary><ul>${cond.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></details>` : ''}
      <div class="program-card__footer">
        <span class="program-card__duration">⏱ ${esc(periodText(p))}</span>
        ${badge(p)}
        ${st === 'expired' ? '' : `<a href="cabinet-investor.html" class="program-card__cta">${esc(d.cta)}</a>`}
      </div>
    </div>`;
  }

  /* ── Фильтры (общие для support.html и registries.html) ── */
  function initBrowser(all, opts) {
    // opts: { filtersEl, outEl, render:'cards'|'table' }
    const state = { category: 'all', recipient: 'all', region: 'all', status: 'all', expired: false };
    const pub = published(all);

    function visibleBase() {
      return pub.filter((p) => state.expired || status(p) !== 'expired');
    }
    function pill(group, val, label, count) {
      return `<button type="button" class="sp-pill ${state[group] === val ? 'is-active' : ''}" data-group="${group}" data-val="${val}">${esc(label)}${count != null ? ` <em>${count}</em>` : ''}</button>`;
    }
    function groupHTML(group, title, values, labelOf, countOf) {
      const items = values.filter((v) => countOf(v) > 0);
      if (!items.length) return '';
      return `<div class="sp-filter-group"><span class="sp-filter-label">${esc(title)}</span>
        ${pill(group, 'all', D().all)}${items.map((v) => pill(group, v, labelOf(v), countOf(v))).join('')}</div>`;
    }
    function renderFilters() {
      const d = D(), base = visibleBase();
      const cnt = (key) => (v) => base.filter((p) => p[key] === (key === 'region' && v === 'nationwide' ? 'all' : v)).length;
      const stCnt = (v) => base.filter((p) => status(p) === v).length;
      const hasExpired = pub.some((p) => status(p) === 'expired');
      opts.filtersEl.innerHTML =
        groupHTML('category', d.f_category, ['subsidy', 'compensation', 'grant', 'tax'], (v) => d.cat[v], cnt('category')) +
        groupHTML('recipient', d.f_recipient, ['hotel_investors', 'operators', 'entrepreneurs', 'youth', 'inclusive'], (v) => d.rec[v], cnt('recipient')) +
        groupHTML('region', d.f_region, ['nationwide', 'khorezm', 'surkhandarya', 'karakalpakstan', 'no_hotel_districts'], (v) => d.reg[v === 'nationwide' ? 'all' : v], cnt('region')) +
        groupHTML('status', d.f_status, ['active', 'soon'], (v) => d[v], stCnt) +
        (hasExpired ? `<label class="sp-toggle"><input type="checkbox" id="sp-show-expired" ${state.expired ? 'checked' : ''}> ${esc(d.show_expired)}</label>` : '');
    }
    function filtered() {
      return visibleBase().filter((p) =>
        (state.category === 'all' || p.category === state.category) &&
        (state.recipient === 'all' || p.recipient === state.recipient) &&
        (state.region === 'all' || p.region === (state.region === 'nationwide' ? 'all' : state.region)) &&
        (state.status === 'all' || status(p) === state.status));
    }
    function rowHTML(p) {
      const d = D();
      return `<tr class="${status(p) === 'expired' ? 'is-expired' : ''}">
        <td data-label="" class="et-key"><strong>${esc(tx(p.title))}</strong><br><span class="sp-muted">${esc(d.cat1[p.category])}</span></td>
        <td>${esc(d.rec[p.recipient])}</td>
        <td>${esc(tx(p.amount_text))}</td>
        <td>${esc(authorityText(p)) || '—'}</td>
        <td>${esc(legalText(p)) || '—'}</td>
        <td>${esc(periodText(p))}</td>
        <td>${statusBadgeFull(p)}</td></tr>`;
    }
    function renderOut() {
      const list = filtered(), d = D();
      if (opts.render === 'table') {
        opts.outEl.innerHTML = list.length ? `<div class="reg-table-wrap"><table class="editorial-table reg-table sp-reg-table"><thead><tr>
          <th class="et-key et-head">${esc(d.f_category)} / ${esc(d.npa_subject)}</th><th class="et-head">${esc(d.f_recipient)}</th><th class="et-head">${esc(sizeLabel())}</th>
          <th class="et-head">${esc(d.authority)}</th><th class="et-head">${esc(d.basis)}</th><th class="et-head">${esc(d.period)}</th><th class="et-head">${esc(d.f_status)}</th>
          </tr></thead><tbody>${list.map(rowHTML).join('')}</tbody></table></div>` : `<p class="sp-empty">${esc(d.empty)}</p>`;
      } else {
        opts.outEl.innerHTML = list.length ? list.map(cardHTML).join('') : `<p class="sp-empty">${esc(d.empty)}</p>`;
      }
    }
    const sizeLabel = () => ({ ru: 'Размер', uz: 'Miqdor', en: 'Amount' }[lang()]);
    function draw() { renderFilters(); renderOut(); }

    opts.filtersEl.addEventListener('click', (e) => {
      const b = e.target.closest('.sp-pill');
      if (!b) return;
      state[b.dataset.group] = b.dataset.val;
      draw();
    });
    opts.filtersEl.addEventListener('change', (e) => {
      if (e.target.id === 'sp-show-expired') { state.expired = e.target.checked; draw(); }
    });
    draw();
    return { redraw: draw };
  }

  /* ── Таблица НПА (из данных) ──────────────────────────── */
  function npaHTML(all, cls) {
    const d = D();
    const groups = [];
    published(all).filter((p) => p.legal_basis).forEach((p) => {
      const b = p.legal_basis, key = `${b.type}|${b.number}|${b.date}`;
      let g = groups.find((x) => x.key === key);
      if (!g) { g = { key, b, items: [] }; groups.push(g); }
      g.items.push(p);
    });
    return `<table class="${cls || 'npa-table'}"><thead><tr>
      <th>${esc(d.npa_doc)}</th><th>${esc(d.npa_date)}</th><th>${esc(d.npa_subject)}</th><th>${esc(d.npa_status)}</th></tr></thead><tbody>
      ${groups.map((g) => {
        const refs = [...new Set(g.items.map((p) => tx(p.legal_basis.ref)).filter(Boolean))].join('; ');
        return `<tr class="npa-row">
          <td><strong>${esc(d.doc[g.b.type] + g.b.number)}</strong>${refs ? `<br><span class="sp-muted">${esc(refs)}</span>` : ''}</td>
          <td>${esc(g.b.date)}</td>
          <td>${g.items.map((p) => `<div class="sp-npa-line">${esc(tx(p.title))}</div>`).join('')}</td>
          <td>${g.items.map((p) => `<div class="sp-npa-line">${statusBadgeFull(p)}</div>`).join('')}</td></tr>`;
      }).join('')}</tbody></table>`;
  }

  /* ── Статические тексты страницы (data-sp-i18n) ───────── */
  function applyStatic(all) {
    const d = D(), n = live(all).length, mx = maxPerRoom(all);
    document.querySelectorAll('[data-sp-i18n]').forEach((el) => {
      let v = d[el.dataset.spI18n];
      if (v == null) return;
      v = v.replace('{count}', n).replace('{max}', mx ? fmtMln(mx) : '');
      if (el.dataset.spHtml != null) el.innerHTML = v; else el.textContent = v;
    });
    const mxEl = document.getElementById('sp-stat-max');
    if (mxEl) mxEl.textContent = mx ? d.stat_max_val.replace('{max}', fmtMln(mx)) : '';
    document.documentElement.setAttribute('data-sp-lang', lang());
  }

  const api = { T, esc, lang, tx, D, status, periodText, legalText, authorityText, docLabel, fmtDate, grp, fmtUZS, fmtUSD, fmtMln,
    load, published, live, maxPerRoom, fillCounters, applyStatic, initBrowser, npaHTML, cardHTML, statusBadgeFull, badge };
  window.SupportData = api;

  /* Подписка на смену языка */
  const langListeners = [];
  api.onLangChange = (fn) => langListeners.push(fn);
  const fire = () => load().then((all) => { fillCounters(all); applyStatic(all); langListeners.forEach((f) => f(all)); });
  document.addEventListener('hip:lang', fire);
  window.addEventListener('storage', (e) => { if (e.key === 'hip_lang') fire(); });

  const boot = () => load().then((all) => { fillCounters(all); applyStatic(all); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
