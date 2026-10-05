/* ============================================================
   EVENTS · data/seed.js
   Предзаполненные ДЕМО-данные (2 мероприятия, 9 делегаций, 23 гостя,
   отели из каталога платформы, транспорт, водители, сопровождающие,
   задачи, журнал). Даты строятся от «сегодня», поэтому демо всегда
   актуально. Версия VERSION меняется — данные пересоздаются.
   ============================================================ */
(function () {
  'use strict';
  const EV = (window.EV = window.EV || {});
  const U = EV.U, C = EV.C;

  const VERSION = 3;
  const P = (s) => { const a = s.split('|'); return { ru: a[0], uz: a[1] || a[2] || a[0], en: a[2] || a[0] }; };

  function build() {
    const now = new Date();
    const base = U.startOfDay(now);
    const d = (n, hm) => { const x = new Date(base); x.setDate(x.getDate() + n); const [h, m] = (hm || '00:00').split(':'); x.setHours(+h, +m, 0, 0); return U.toISO(x); };
    const hrs = (n) => U.toISO(new Date(now.getTime() + n * 3600000));
    const ago = (days, hm) => d(-days, hm);

    const T = {};
    ['events', 'delegations', 'guests', 'bookings', 'hotelRequests', 'meetings', 'departures', 'vehicles', 'drivers', 'transfers', 'escorts', 'routes', 'excursions', 'meals', 'vipPlans', 'tasks', 'notifications', 'quality', 'audit', 'users'].forEach((k) => (T[k] = []));

    /* ── Пользователи (демо-аккаунты 6 ролей) ─────────────── */
    T.users = [
      { id: 'u_admin', name: 'Алишер Рахимов', email: 'admin@events.demo', password: 'demo', role: 'admin', phone: '+998 90 100 00 01', position: 'Администратор системы' },
      { id: 'u_head', name: 'Бахтиёр Усманов', email: 'head@events.demo', password: 'demo', role: 'head', phone: '+998 90 100 00 02', position: 'Руководитель департамента' },
      { id: 'u_officer', name: 'Мадина Юсупова', email: 'officer@events.demo', password: 'demo', role: 'officer', phone: '+998 90 100 00 03', position: 'Ответственный сотрудник' },
      { id: 'u_coord', name: 'Тимур Абдуллаев', email: 'coordinator@events.demo', password: 'demo', role: 'coordinator', phone: '+998 90 100 00 04', position: 'Координатор' },
      { id: 'u_coord2', name: 'Севара Ахмедова', email: 'coordinator2@events.demo', password: 'demo', role: 'coordinator', phone: '+998 90 100 00 05', position: 'Координатор' },
      { id: 'u_hotel', name: 'Фарход Каримов', email: 'hotel@events.demo', password: 'demo', role: 'hotel', hotelId: 'movenpick-tashkent', phone: '+998 90 100 00 06', position: 'Менеджер по приёму · Mövenpick Tashkent' },
      { id: 'u_hotel2', name: 'Нигора Исмоилова', email: 'hotel2@events.demo', password: 'demo', role: 'hotel', hotelId: 'samarqand-universal-bouilding', phone: '+998 90 100 00 07', position: 'Менеджер по приёму · Samarqand Universal' },
      { id: 'u_driver', name: 'Рустам Эшонқулов', email: 'driver@events.demo', password: 'demo', role: 'field', driverId: 'd1', phone: '+998 90 111 00 01', position: 'Водитель' },
      { id: 'u_escort', name: 'Дилноза Хасанова', email: 'escort@events.demo', password: 'demo', role: 'field', escortId: 's1', phone: '+998 90 222 00 01', position: 'Сопровождающий' },
    ];

    /* ── Водители, автомобили, сопровождающие ─────────────── */
    const dn = ['Рустам Эшонқулов', 'Жасур Мирзаев', 'Олимжон Турсунов', 'Бобур Каримов', 'Азиз Нормуродов', 'Санжар Хасанов', 'Шерзод Алиев', 'Улугбек Рахматов'];
    dn.forEach((n, i) => T.drivers.push({ id: 'd' + (i + 1), fullName: n, phone: '+998 90 111 00 0' + (i + 1) }));
    const veh = [
      ['v1', 'Mercedes-Benz S 500', '01 A 777 AA', 'vip', 3, 'd1', false],
      ['v2', 'Mercedes-Benz V-Class', '01 B 701 BA', 'vip', 6, 'd2', false],
      ['v3', 'Hyundai Staria', '01 C 211 CA', 'minivan', 7, 'd3', false],
      ['v4', 'Hyundai Staria', '01 C 212 CA', 'minivan', 7, 'd4', false],
      ['v5', 'Chevrolet Malibu 2', '01 D 515 DA', 'car', 3, 'd5', false],
      ['v6', 'Yutong ZK6122H9', '01 E 450 EA', 'bus', 45, 'd6', false],
      ['v7', 'Toyota Camry', '01 F 303 FA', 'car', 3, 'd7', true],
      ['v8', 'Kia Carnival', '01 G 909 GA', 'minivan', 6, 'd8', true],
    ];
    veh.forEach((v) => T.vehicles.push({ id: v[0], make: v[1], plate: v[2], category: v[3], capacity: v[4], driverId: v[5], reserve: v[6] }));
    const esc = [
      ['s1', 'Дилноза Хасанова', 'Старший сопровождающий', ['ru', 'en', 'tr'], '+998 90 222 00 01', 'u_escort'],
      ['s2', 'Азиз Ёқубов', 'Сопровождающий, переводчик', ['en', 'zh', 'ru'], '+998 90 222 00 02'],
      ['s3', 'Нилуфар Рахимова', 'Сопровождающий, переводчик', ['en', 'ja', 'ko'], '+998 90 222 00 03'],
      ['s4', 'Саид Ахмедов', 'Сопровождающий (протокол)', ['ar', 'en', 'ru'], '+998 90 222 00 04'],
      ['s5', 'Камола Исмаилова', 'Сопровождающий, переводчик', ['de', 'en', 'fr'], '+998 90 222 00 05'],
    ];
    esc.forEach((e) => T.escorts.push({ id: e[0], fullName: e[1], position: e[2], languages: e[3], phone: e[4], userId: e[5] || null }));

    /* ── Мероприятия ───────────────────────────────────────── */
    T.events.push({
      id: 'ev1', name: P('Международный туристический форум «Шёлковый путь — 2026»|«Ipak yo‘li — 2026» xalqaro turizm forumi|International Tourism Forum “Silk Road 2026”'),
      type: 'forum', dateFrom: d(0, '09:00'), dateTo: d(4, '18:00'),
      venue: P('Конгресс-холл, Tashkent City|Toshkent Siti kongress-xolli|Congress Hall, Tashkent City'), venueRef: 'place:ven_tcity',
      participants: 420, foreignGuests: 85, responsibleId: 'u_officer', contactName: 'Мадина Юсупова', contactPhone: '+998 90 100 00 03',
      status: 'arriving',
      requirements: P('Халяль-питание для делегаций Турции и Казахстана. VIP-встреча у трапа, отдельный вход на площадку. Перевод на английский/китайский.|Turkiya va Qozog‘iston delegatsiyalari uchun halol ovqat. Trap oldida VIP kutib olish.|Halal meals for the delegations of Türkiye and Kazakhstan. VIP meeting at the aircraft steps, separate venue entrance. EN/ZH interpretation.'),
      createdAt: ago(30, '10:00'),
    });
    T.events.push({
      id: 'ev2', name: P('Официальный визит делегаций Франции и Индии в Самарканд|Fransiya va Hindiston delegatsiyalarining Samarqandga rasmiy tashrifi|Official visit of the delegations of France and India to Samarkand'),
      type: 'visit', dateFrom: d(-20, '09:00'), dateTo: d(-17, '18:00'),
      venue: P('Конгресс-центр «Вечный город», Самарканд|Samarqand kongress markazi|Eternal City Congress Centre, Samarkand'), venueRef: 'place:ven_skd',
      participants: 60, foreignGuests: 6, responsibleId: 'u_officer', contactName: 'Севара Ахмедова', contactPhone: '+998 90 100 00 05',
      status: 'completed', requirements: P('Вегетарианское меню для делегации Индии.|Hindiston delegatsiyasi uchun vegetarian menyu.|Vegetarian menu for the Indian delegation.'),
      createdAt: ago(45, '10:00'),
    });

    /* ── Делегации и гости ─────────────────────────────────── */
    const DEL = [
      { id: 'dl1', ev: 'ev1', cc: 'TR', vip: 'vip', name: 'Делегация Турции|Turkiya delegatsiyasi|Delegation of Türkiye', org: 'Министерство культуры и туризма Турции|Turkiya Madaniyat va turizm vazirligi|Ministry of Culture and Tourism of Türkiye', langs: ['tr', 'en'],
        hotel: 'movenpick-tashkent', rt: 'suite', headRt: 'suite', arr: [-1, '14:20', 'TK 366', 'apt_tas'], dep: [4, '18:30', 'TK 367', 'apt_tas'], escort: 's1', veh: 'v1', bk: 'confirmed', depVeh: 'v1',
        m: [['Mehmet Yılmaz', 'Министр культуры и туризма|Madaniyat va turizm vaziri|Minister of Culture and Tourism', 'U12345678', '+90 532 000 11 01', ['halal'], 'Отдельный вход, VIP-зал|Alohida kirish, VIP-zal|Separate entrance, VIP lounge'], ['Ayşe Demir', 'Заместитель руководителя департамента|Departament boshlig‘i o‘rinbosari|Deputy Head of Department', 'U23456789', '+90 532 000 11 02', ['halal'], ''], ['Burak Kaya', 'Пресс-секретарь|Matbuot kotibi|Press Secretary', 'U34567890', '+90 532 000 11 03', ['halal'], '']] },
      { id: 'dl2', ev: 'ev1', cc: 'KZ', vip: 'protocol', name: 'Делегация Казахстана|Qozog‘iston delegatsiyasi|Delegation of Kazakhstan', org: 'Правительство Республики Казахстан|Qozog‘iston Respublikasi Hukumati|Government of the Republic of Kazakhstan', langs: ['ru', 'kk'],
        hotel: 't-city-parkinmall', rt: 'suite', headRt: 'presidential', arr: [-1, '18:05', 'KC 891', 'apt_tas'], dep: [4, '20:15', 'KC 892', 'apt_tas'], escort: 's4', veh: 'v2', bk: 'confirmed', depVeh: 'v2',
        m: [['Aidar Nurgaliyev', 'Заместитель Премьер-министра|Bosh vazir o‘rinbosari|Deputy Prime Minister', 'N11223344', '+7 701 000 22 01', ['halal'], 'Протокольная охрана|Protokol xavfsizligi|Protocol security'], ['Dana Sadykova', 'Руководитель протокола|Protokol boshlig‘i|Head of Protocol', 'N22334455', '+7 701 000 22 02', [], ''], ['Yerlan Omarov', 'Советник|Maslahatchi|Adviser', 'N33445566', '+7 701 000 22 03', ['halal'], '']] },
      { id: 'dl3', ev: 'ev1', cc: 'CN', vip: 'none', name: 'Делегация Китая|Xitoy delegatsiyasi|Delegation of China', org: 'Китайская ассоциация туризма|Xitoy turizm assotsiatsiyasi|China Tourism Association', langs: ['zh', 'en'],
        hotel: 'movenpick-tashkent', rt: 'deluxe', headRt: 'deluxe', arr: [0, '09:40', 'CZ 6007', 'apt_tas'], dep: [5, '10:20', 'CZ 6008', 'apt_tas'], escort: 's2', veh: 'v5', bk: 'sent', depVeh: 'v5',
        m: [['Li Wei', 'Вице-председатель|Raisning o‘rinbosari|Vice Chairman', 'E55667788', '+86 138 0000 3301', ['vegetarian'], ''], ['Zhang Min', 'Директор по международным связям|Xalqaro aloqalar direktori|Director of International Relations', 'E66778899', '+86 138 0000 3302', [], ''], ['Chen Hao', 'Переводчик|Tarjimon|Interpreter', 'E77889900', '+86 138 0000 3303', [], '']] },
      { id: 'dl4', ev: 'ev1', cc: 'JP', vip: 'none', name: 'Делегация Японии|Yaponiya delegatsiyasi|Delegation of Japan', org: 'Агентство по туризму Японии|Yaponiya turizm agentligi|Japan Tourism Agency', langs: ['ja', 'en'],
        hotel: 't-city-parkinmall', rt: 'deluxe', headRt: 'deluxe', arr: [0, '15:30', 'KE 943', 'apt_tas'], dep: [5, '11:30', 'HY 74', 'apt_skd'], escort: 's3', veh: 'v3', bk: 'confirmed', depVeh: null, extra: { hotel: 'samarqand-universal-bouilding', from: 2, to: 5 },
        m: [['Takeshi Sato', 'Генеральный директор|Bosh direktor|Director General', 'TK1234567', '+81 90 0000 4401', ['allergy'], 'Аллергия на морепродукты|Dengiz mahsulotlariga allergiya|Seafood allergy'], ['Yuki Tanaka', 'Старший специалист|Katta mutaxassis|Senior Officer', 'TK2345678', '+81 90 0000 4402', [], '']] },
      { id: 'dl5', ev: 'ev1', cc: 'AE', vip: 'vip', name: 'Делегация ОАЭ|BAA delegatsiyasi|Delegation of the UAE', org: 'Министерство экономики ОАЭ|BAA Iqtisodiyot vazirligi|Ministry of Economy of the UAE', langs: ['ar', 'en'],
        hotel: 't-city-parkinmall', rt: 'suite', headRt: 'presidential', arr: [0, '21:10', 'EK 373', 'apt_tas'], dep: [4, '23:55', 'EK 374', 'apt_tas'], escort: null, veh: 'v2', bk: 'confirmed', depVeh: 'v2',
        m: [['Khalid Al Mansoori', 'Министр|Vazir|Minister', 'AE9988776', '+971 50 000 5501', ['halal'], 'Круглосуточная охрана|Sutkalik qo‘riqlash|24/7 security'], ['Fatima Al Zaabi', 'Руководитель аппарата|Apparat rahbari|Chief of Staff', 'AE8877665', '+971 50 000 5502', ['halal'], '']] },
      { id: 'dl6', ev: 'ev1', cc: 'DE', vip: 'none', name: 'Делегация Германии|Germaniya delegatsiyasi|Delegation of Germany', org: 'Немецкое национальное туристическое бюро|Germaniya milliy turizm byurosi|German National Tourist Board', langs: ['de', 'en'],
        hotel: 'asmald', rt: 'standard', headRt: 'standard', arr: [-1, '11:30', 'HY 482', 'apt_tas'], dep: [1, '06:40', 'LH 2577', 'apt_tas'], escort: 's5', veh: 'v4', bk: 'confirmed', depVeh: null,
        m: [['Thomas Becker', 'Глава делегации|Delegatsiya rahbari|Head of Delegation', 'C01X00T47', '+49 151 0000 6601', ['gluten_free'], ''], ['Julia Hoffmann', 'Менеджер по партнёрствам|Hamkorlik menejeri|Partnership Manager', 'C02Y11U58', '+49 151 0000 6602', [], '']] },
      { id: 'dl7', ev: 'ev1', cc: 'KR', vip: 'none', name: 'Делегация Республики Корея|Koreya delegatsiyasi|Delegation of the Republic of Korea', org: 'Корейская туристская организация|Koreya turizm tashkiloti|Korea Tourism Organization', langs: ['ko', 'en'],
        hotel: 'asmald', rt: 'deluxe', headRt: 'deluxe', arr: [1, '16:45', 'KE 9953', 'apt_tas'], dep: [5, '09:00', 'KE 9954', 'apt_tas'], escort: null, veh: null, bk: 'draft', depVeh: null,
        m: [['Kim Min-jun', 'Директор|Direktor|Director', 'M12345678', '+82 10 0000 7701', [], ''], ['Park Ji-woo', 'Менеджер|Menejer|Manager', 'M23456789', '+82 10 0000 7702', ['vegan'], '']] },
      { id: 'dl8', ev: 'ev2', cc: 'FR', vip: 'none', name: 'Делегация Франции|Fransiya delegatsiyasi|Delegation of France', org: 'Атаже-де-Франс / Business France|Business France|Business France', langs: ['fr', 'en'],
        hotel: 'samarqand-universal-bouilding', rt: 'deluxe', headRt: 'suite', arr: [-20, '12:10', 'HY 258', 'apt_skd'], dep: [-17, '13:00', 'HY 259', 'apt_skd'], escort: 's5', veh: 'v3', bk: 'confirmed', depVeh: 'v3', past: true,
        m: [['Pierre Lefèvre', 'Глава делегации|Delegatsiya rahbari|Head of Delegation', '19AB12345', '+33 6 00 00 88 01', [], ''], ['Camille Roux', 'Советник|Maslahatchi|Adviser', '19AB23456', '+33 6 00 00 88 02', [], ''], ['Louis Martin', 'Эксперт|Ekspert|Expert', '19AB34567', '+33 6 00 00 88 03', [], '']] },
      { id: 'dl9', ev: 'ev2', cc: 'IN', vip: 'none', name: 'Делегация Индии|Hindiston delegatsiyasi|Delegation of India', org: 'Министерство туризма Индии|Hindiston turizm vazirligi|Ministry of Tourism of India', langs: ['en', 'hi'],
        hotel: 'hastimom-samarkand', rt: 'standard', headRt: 'standard', arr: [-20, '16:20', 'HY 262', 'apt_skd'], dep: [-17, '15:30', 'HY 263', 'apt_skd'], escort: 's2', veh: 'v4', bk: 'confirmed', depVeh: 'v4', past: true,
        m: [['Rajesh Sharma', 'Объединённый секретарь|Qo‘shma kotib|Joint Secretary', 'Z1234567', '+91 98100 00001', ['vegetarian'], ''], ['Priya Nair', 'Директор|Direktor|Director', 'Z2345678', '+91 98100 00002', ['vegetarian'], ''], ['Anil Mehta', 'Советник|Maslahatchi|Adviser', 'Z3456789', '+91 98100 00003', ['vegetarian'], '']] },
    ];

    const hotelRooms = {};
    const pickRoomNo = (hotelId, type, from, to) => {
      const h = EV.Hotels && EV.Hotels.get(hotelId);
      if (!h) return '';
      const occ = EV.Hotels.occupiedRooms(hotelId, T.bookings, from, to);
      const r = EV.Hotels.rooms(h).find((x) => x.type === type && !occ.has(x.no)) || EV.Hotels.rooms(h).find((x) => !occ.has(x.no));
      return r ? r.no : '';
    };
    const hotelContact = (hid) => { const h = EV.Hotels && EV.Hotels.get(hid); return h ? { n: h.contactName, p: h.phone } : { n: '', p: '' }; };

    let gi = 0, bi = 0, mi = 0, di = 0, ti = 0;
    const eventResp = (ev) => (ev === 'ev1' ? 'u_officer' : 'u_coord2');

    DEL.forEach((dl) => {
      const arrAt = d(dl.arr[0], dl.arr[1]);
      const depAt = d(dl.dep[0], dl.dep[1]);
      const deleg = {
        id: dl.id, eventId: dl.ev, name: P(dl.name), country: dl.cc, vip: dl.vip, languages: dl.langs,
        headGuestId: null, escortId: dl.escort, notes: '', createdAt: ago(25, '11:00'),
      };
      T.delegations.push(deleg);
      const gids = [];
      dl.m.forEach((m, idx) => {
        const gid = 'g' + (++gi);
        gids.push(gid);
        if (idx === 0) deleg.headGuestId = gid;
        const arrPast = U.parse(arrAt) < now;
        const st = dl.past ? 'departed' : arrPast ? (U.parse(arrAt) < new Date(now.getTime() - 2 * 3600000) ? 'accommodated' : 'arrived') : 'expected';
        T.guests.push({
          id: gid, eventId: dl.ev, delegationId: dl.id, fullName: m[0], country: dl.cc, org: P(dl.org), position: P(m[1]),
          passport: m[2], phone: m[3], email: m[0].toLowerCase().replace(/[^a-z]+/g, '.') + '@delegation.example', vip: idx === 0 && dl.vip !== 'none' ? dl.vip : dl.vip,
          arrivalAt: arrAt, arrivalPlace: 'place:' + dl.arr[3], arrivalFlight: dl.arr[2],
          departureAt: depAt, departurePlace: 'place:' + dl.dep[3], departureFlight: dl.dep[2],
          escortId: null, requirements: P(m[5] || '|'), diets: m[4], extraServices: '', wishes: '',
          status: st,
          arrivedAt: st !== 'expected' ? arrAt : null,
          checkedInAt: st === 'accommodated' || st === 'departed' ? U.toISO(U.addMinutes(arrAt, 100)) : null,
          createdAt: ago(20, '12:00'),
        });
        if (!m[5]) T.guests[T.guests.length - 1].requirements = '';

        /* Бронь */
        const hid = dl.hotel;
        const rt = idx === 0 ? dl.headRt : dl.rt;
        const ci = U.toISO(U.addMinutes(arrAt, 0).getHours() < 14 && !dl.past ? new Date(U.parse(arrAt).getFullYear(), U.parse(arrAt).getMonth(), U.parse(arrAt).getDate(), 14, 0) : U.parse(arrAt));
        const checkIn = dl.past ? arrAt : ci;
        let checkOut = d(dl.dep[0], '12:00');
        if (dl.extra) checkOut = d(dl.extra.from, '12:00');
        const hc = hotelContact(hid);
        const roomNo = pickRoomNo(hid, rt, checkIn, checkOut);
        T.bookings.push({
          id: 'b' + (++bi), eventId: dl.ev, guestId: gid, hotelId: hid, roomType: rt, roomNo, checkIn, checkOut,
          meal: dl.vip !== 'none' ? 'FB' : 'BB', requirements: m[5] ? '' : '', contactName: hc.n, contactPhone: hc.p, status: dl.bk,
          requestId: dl.bk !== 'draft' ? 'rq_' + hid : null, confirmedAt: dl.bk === 'confirmed' ? ago(12, '15:00') : null, changeReason: '', createdAt: ago(18, '10:00'),
        });
        if (dl.extra) {
          const ex = dl.extra;
          const cin = d(ex.from, '14:00'), cout = d(ex.to, '12:00');
          const hc2 = hotelContact(ex.hotel);
          T.bookings.push({
            id: 'b' + (++bi), eventId: dl.ev, guestId: gid, hotelId: ex.hotel, roomType: rt, roomNo: pickRoomNo(ex.hotel, rt, cin, cout), checkIn: cin, checkOut: cout,
            meal: 'BB', requirements: '', contactName: hc2.n, contactPhone: hc2.p, status: 'draft', requestId: null, confirmedAt: null, changeReason: '', createdAt: ago(5, '10:00'),
          });
        }
        /* Встреча */
        const veh1 = dl.veh && T.vehicles.find((v) => v.id === dl.veh);
        const arrDone = U.parse(arrAt) < now;
        const mst = dl.past ? 'done' : arrDone ? (U.parse(arrAt) < new Date(now.getTime() - 2 * 3600000) ? 'done' : 'met') : veh1 ? 'driver_assigned' : 'planned';
        T.meetings.push({
          id: 'm' + (++mi), eventId: dl.ev, guestId: gid, placeType: 'airport', placeRef: 'place:' + dl.arr[3], placeText: '', at: arrAt, flightNo: dl.arr[2],
          vehicleId: veh1 ? veh1.id : null, driverId: veh1 ? veh1.driverId : null, escortId: dl.escort, contactName: dl.ev === 'ev1' ? 'Мадина Юсупова' : 'Севара Ахмедова',
          contactPhone: dl.ev === 'ev1' ? '+998 90 100 00 03' : '+998 90 100 00 05', status: mst, transferId: null,
        });
        /* Проводы */
        const depVeh = dl.depVeh && T.vehicles.find((v) => v.id === dl.depVeh);
        T.departures.push({
          id: 'dp' + (++di), eventId: dl.ev, guestId: gid, placeType: 'airport', placeRef: 'place:' + dl.dep[3], placeText: '', at: depAt, flightNo: dl.dep[2],
          vehicleId: depVeh ? depVeh.id : null, driverId: depVeh ? depVeh.driverId : null, escortId: dl.escort,
          status: dl.past ? 'departed' : depVeh ? 'vehicle_assigned' : 'planned', transferId: null, departedAt: dl.past ? depAt : null,
        });
      });

      /* Трансфер прибытия (одна машина на делегацию) */
      if (dl.veh) {
        const v = T.vehicles.find((x) => x.id === dl.veh);
        const tid = 't' + (++ti);
        const arrDone = U.parse(arrAt) < now;
        T.transfers.push({
          id: tid, eventId: dl.ev, kind: 'arrival', vehicleId: v.id, driverId: v.driverId, escortId: dl.escort, fromRef: 'place:' + dl.arr[3], toRef: 'hotel:' + dl.hotel, fromText: '', toText: '',
          at: arrAt, durationMin: 75, guestIds: gids.slice(), delegationId: dl.id, status: dl.past || arrDone ? 'done' : 'assigned', key: 'arrival:' + v.id + ':' + arrAt.slice(0, 13), notes: '',
        });
        T.meetings.filter((m) => gids.includes(m.guestId)).forEach((m) => (m.transferId = tid));
      }
      /* Трансфер проводов */
      if (dl.depVeh) {
        const v = T.vehicles.find((x) => x.id === dl.depVeh);
        const tid = 't' + (++ti);
        const pick = U.toISO(U.addMinutes(depAt, -210));
        T.transfers.push({
          id: tid, eventId: dl.ev, kind: 'departure', vehicleId: v.id, driverId: v.driverId, escortId: dl.escort, fromRef: 'hotel:' + dl.hotel, toRef: 'place:' + dl.dep[3], fromText: '', toText: '',
          at: pick, durationMin: 75, guestIds: gids.slice(), delegationId: dl.id, status: dl.past ? 'done' : 'assigned', key: 'departure:' + v.id + ':' + pick.slice(0, 13), notes: '',
        });
        T.departures.filter((x) => gids.includes(x.guestId)).forEach((x) => (x.transferId = tid));
      }
      /* Сопровождающий на гостей (на всю делегацию) */
    });

    /* Городские трансферы форума: автобус на площадку */
    const allEv1 = T.guests.filter((g) => g.eventId === 'ev1').map((g) => g.id);
    T.transfers.push({ id: 't' + (++ti), eventId: 'ev1', kind: 'city', vehicleId: 'v6', driverId: 'd6', escortId: null, fromRef: '', toRef: 'place:ven_tcity', fromText: 'Отели участников', toText: '', at: d(1, '08:30'), durationMin: 60, guestIds: allEv1.slice(), delegationId: null, status: 'planned', key: 'city:v6:1', notes: '' });
    T.transfers.push({ id: 't' + (++ti), eventId: 'ev1', kind: 'city', vehicleId: 'v6', driverId: 'd6', escortId: null, fromRef: '', toRef: 'place:ven_tcity', fromText: 'Отели участников', toText: '', at: d(2, '08:30'), durationMin: 60, guestIds: allEv1.slice(), delegationId: null, status: 'planned', key: 'city:v6:2', notes: '' });
    T.transfers.push({ id: 't' + (++ti), eventId: 'ev2', kind: 'city', vehicleId: 'v3', driverId: 'd3', escortId: 's5', fromRef: 'hotel:samarqand-universal-bouilding', toRef: 'place:sg_registan', fromText: '', toText: '', at: d(-19, '10:00'), durationMin: 30, guestIds: T.guests.filter((g) => g.delegationId === 'dl8').map((g) => g.id), delegationId: 'dl8', status: 'done', key: 'city:v3:ev2', notes: '' });

    /* ── Маршруты ──────────────────────────────────────────── */
    const stop = (time, title, kind, ref) => ({ time, title: P(title), kind, ref: ref || '', notes: '' });
    T.routes.push(
      { id: 'r1', eventId: 'ev1', name: P('Ташкент: исторический центр и Чорсу|Toshkent: tarixiy markaz va Chorsu|Tashkent: historic centre and Chorsu'), description: P('Обзорный маршрут по историческому Ташкенту для гостей форума.|Forum mehmonlari uchun Toshkent bo‘ylab obzor marshrut.|Sightseeing route through historic Tashkent for forum guests.'),
        type: 'cultural', date: d(1, '14:00').slice(0, 10), startTime: '14:00', endTime: '18:00', participants: 17, cost: '', delegationIds: ['dl3', 'dl6', 'dl7'], hotelIds: ['movenpick-tashkent'], restaurantIds: ['plov-centre-tashkent'], vehicleId: 'v6', guide: 'Гид: Зарина Ахмедова', escortId: 's1',
        days: [{ stops: [stop('14:00', 'Площадь Амира Темура', 'sight', 'place:sg_amir'), stop('15:00', 'Комплекс Хаст-Имам', 'sight', 'place:sg_khast'), stop('16:15', 'Рынок Чорсу', 'sight', 'place:sg_chorsu'), stop('17:15', 'Ужин: национальный центр плова', 'restaurant', 'rest:plov-centre-tashkent')] }] },
      { id: 'r2', eventId: 'ev1', name: P('Самарканд: Регистан и Шахи-Зинда (3 дня)|Samarqand: Registon va Shohi Zinda (3 kun)|Samarkand: Registan and Shah-i-Zinda (3 days)'), description: P('Многодневная программа для делегации Японии.|Yaponiya delegatsiyasi uchun ko‘p kunlik dastur.|Multi-day programme for the Japanese delegation.'),
        type: 'multiday', date: d(2, '09:00').slice(0, 10), startTime: '09:00', endTime: '18:00', participants: 2, cost: '', delegationIds: ['dl4'], hotelIds: ['samarqand-universal-bouilding'], restaurantIds: ['silk-road-restaurant-samarkand'], vehicleId: 'v3', guide: 'Гид: Шахноза Рустамова', escortId: 's3',
        days: [
          { stops: [stop('09:00', 'Площадь Регистан', 'sight', 'place:sg_registan'), stop('13:00', 'Обед в Silk Route Dining', 'restaurant', 'rest:silk-road-restaurant-samarkand'), stop('15:00', 'Мавзолей Гур-Эмир', 'sight', 'place:sg_gur')] },
          { stops: [stop('09:30', 'Некрополь Шахи-Зинда', 'sight', 'place:sg_shah'), stop('12:00', 'Мечеть Биби-Ханым', 'sight', 'place:sg_bibi')] },
          { stops: [stop('09:00', 'Свободное время / подготовка к вылету', 'other', ''), stop('11:30', 'Вылет из аэропорта Самарканда', 'other', 'place:apt_skd')] },
        ] },
      { id: 'r3', eventId: 'ev1', name: P('VIP-маршрут: Старый город|VIP-marshrut: Eski shahar|VIP route: Old Town'), description: P('Индивидуальная протокольная программа для VIP-делегаций.|VIP delegatsiyalar uchun individual protokol dasturi.|Individual protocol programme for VIP delegations.'),
        type: 'vip', date: d(3, '10:00').slice(0, 10), startTime: '10:00', endTime: '13:00', participants: 8, cost: '', delegationIds: ['dl1', 'dl2', 'dl5'], hotelIds: [], restaurantIds: [], vehicleId: 'v1', guide: 'Гид-протоколист', escortId: 's4',
        days: [{ stops: [stop('10:00', 'Комплекс Хаст-Имам', 'sight', 'place:sg_khast'), stop('11:30', 'Площадь Амира Темура', 'sight', 'place:sg_amir')] }] },
      { id: 'r4', eventId: 'ev1', name: P('Гастрономический тур: плов и самса|Gastronomik tur: osh va somsa|Gastronomic tour: plov and samsa'), description: P('Гастрономический маршрут по Ташкенту.|Toshkent bo‘ylab gastronomik marshrut.|Gastronomic route across Tashkent.'),
        type: 'gastro', date: d(2, '12:00').slice(0, 10), startTime: '12:00', endTime: '15:00', participants: 12, cost: '', delegationIds: ['dl3', 'dl4'], hotelIds: [], restaurantIds: ['plov-centre-tashkent'], vehicleId: 'v4', guide: '', escortId: 's2',
        days: [{ stops: [stop('12:00', 'Национальный центр плова', 'restaurant', 'rest:plov-centre-tashkent'), stop('14:00', 'Рынок Чорсу', 'sight', 'place:sg_chorsu')] }] },
      { id: 'r5', eventId: 'ev2', name: P('Самарканд за один день|Samarqand bir kunda|Samarkand in one day'), description: P('Обзорная экскурсия для делегаций Франции и Индии.|Fransiya va Hindiston delegatsiyalari uchun ekskursiya.|Tour for the delegations of France and India.'),
        type: 'oneday', date: d(-19, '10:00').slice(0, 10), startTime: '10:00', endTime: '17:00', participants: 6, cost: '', delegationIds: ['dl8', 'dl9'], hotelIds: ['samarqand-universal-bouilding'], restaurantIds: ['silk-road-restaurant-samarkand'], vehicleId: 'v3', guide: 'Гид: Шахноза Рустамова', escortId: 's5',
        days: [{ stops: [stop('10:00', 'Площадь Регистан', 'sight', 'place:sg_registan'), stop('12:30', 'Обед', 'restaurant', 'rest:silk-road-restaurant-samarkand'), stop('14:30', 'Некрополь Шахи-Зинда', 'sight', 'place:sg_shah')] }] }
    );

    /* ── Экскурсии и походы ────────────────────────────────── */
    T.excursions.push(
      { id: 'x1', eventId: 'ev1', name: P('Поход к Большому Чимгану|Katta Chimyonga yurish|Hike to Greater Chimgan'), place: 'place:sg_chimgan', routeId: null, date: d(3, '08:00').slice(0, 10), startTime: '08:00', durationH: 7, difficulty: 'medium', participants: 9,
        guide: 'Инструктор: Азамат Бекмуратов', escortIds: ['s2', 's3'], responsibleId: 'u_coord', vehicleId: 'v4', meal: 'Пикник-ланч (сухой паёк)', equipment: 'Треккинговая обувь, дождевик, вода 1.5 л', safety: 'Инструктаж, аптечка, спутниковая связь, страховка', backup: 'Прогулка по Чарвакскому водохранилищу', weather: 'Отмена при грозе или ветре > 15 м/с', contactName: 'Тимур Абдуллаев', contactPhone: '+998 90 100 00 04', status: 'planned' },
      { id: 'x2', eventId: 'ev1', name: P('Экскурсия: Ташкентское метро|Ekskursiya: Toshkent metrosi|Excursion: Tashkent Metro'), place: 'place:sg_amir', routeId: null, date: d(2, '16:00').slice(0, 10), startTime: '16:00', durationH: 2, difficulty: 'easy', participants: 14,
        guide: 'Гид: Зарина Ахмедова', escortIds: ['s1'], responsibleId: 'u_coord2', vehicleId: null, meal: '', equipment: '', safety: 'Сопровождение персонала метрополитена', backup: 'Музей истории Узбекистана', weather: '—', contactName: 'Севара Ахмедова', contactPhone: '+998 90 100 00 05', status: 'confirmed' },
      { id: 'x3', eventId: 'ev2', name: P('Мастер-класс по керамике в Ургуте|Urgutda kulolchilik ustaxonasi|Ceramics workshop'), place: 'place:sg_registan', routeId: null, date: d(-18, '11:00').slice(0, 10), startTime: '11:00', durationH: 3, difficulty: 'easy', participants: 6,
        guide: 'Мастер Ортиқ Холиқов', escortIds: ['s5'], responsibleId: 'u_coord2', vehicleId: 'v3', meal: 'Чай и национальные сладости', equipment: '', safety: '', backup: '', weather: '—', contactName: 'Севара Ахмедова', contactPhone: '+998 90 100 00 05', status: 'done' }
    );

    /* ── Питание ───────────────────────────────────────────── */
    const meal = (id, ev, kind, day, time, place, ref, cnt, dls, resp, st) => ({ id, eventId: ev, kind, date: d(day).slice(0, 10), time, place, restaurantRef: ref, guestsCount: cnt, delegationIds: dls, responsibleId: resp, status: st, notes: '' });
    T.meals.push(
      meal('ml1', 'ev1', 'breakfast', 1, '07:30', 'Рестораны отелей-партнёров', '', 17, [], 'u_coord', 'confirmed'),
      meal('ml2', 'ev1', 'coffee', 1, '11:00', 'Конгресс-холл, фойе', 'place:ven_tcity', 60, [], 'u_coord2', 'confirmed'),
      meal('ml3', 'ev1', 'reception', 1, '19:00', 'Grand Hall Catering', 'rest:tashkent-mice-catering', 120, [], 'u_officer', 'requested'),
      meal('ml4', 'ev1', 'national', 2, '13:00', 'Plovchi Grand', 'rest:plov-centre-tashkent', 17, [], 'u_coord', 'draft'),
      meal('ml5', 'ev1', 'special', 2, '20:00', 'Ресторан отеля, отдельный зал', 'hotel:movenpick-tashkent', 6, ['dl1', 'dl2'], 'u_coord', 'requested'),
      meal('ml6', 'ev1', 'dinner', 3, '19:30', 'Grand Hall Catering', 'rest:tashkent-mice-catering', 150, [], 'u_officer', 'draft'),
      meal('ml7', 'ev2', 'lunch', -19, '13:00', 'Silk Route Dining — Самарканд', 'rest:silk-road-restaurant-samarkand', 6, [], 'u_coord2', 'served'),
      meal('ml8', 'ev2', 'dinner', -18, '19:30', 'Silk Route Dining — Самарканд', 'rest:silk-road-restaurant-samarkand', 6, [], 'u_coord2', 'served')
    );

    /* ── VIP-планы ─────────────────────────────────────────── */
    T.vipPlans.push(
      { id: 'vp1', eventId: 'ev1', subjectType: 'delegation', subjectId: 'dl1', level: 'vip', plan: P('Встреча министра у трапа, проход через VIP-зал, кортеж из 2 автомобилей, отдельное расписание на 3-й день.|Vazirni trap oldida kutib olish, VIP-zal orqali o‘tish, 2 avtomobilli kortej.|Minister greeted at the aircraft steps, VIP lounge, 2-car convoy, separate schedule on day 3.'), vehicleId: 'v1', officerId: 's1', notes: '' },
      { id: 'vp2', eventId: 'ev1', subjectType: 'delegation', subjectId: 'dl2', level: 'protocol', plan: P('Протокольная встреча на уровне заместителя министра, усиленная координация, согласование маршрутов с охраной.|Vazir o‘rinbosari darajasida protokol kutib olish, kuchaytirilgan koordinatsiya.|Deputy-minister-level protocol greeting, enhanced coordination, routes agreed with security.'), vehicleId: 'v2', officerId: 's4', notes: '' },
      { id: 'vp3', eventId: 'ev1', subjectType: 'delegation', subjectId: 'dl5', level: 'vip', plan: P('Ночное прибытие, VIP-встреча, отдельный этаж в отеле, круглосуточный дежурный.|Tungi kelish, VIP kutib olish, mehmonxonada alohida qavat.|Night arrival, VIP greeting, dedicated hotel floor, 24/7 duty officer.'), vehicleId: 'v2', officerId: null, notes: '' }
    );

    /* ── Задачи ────────────────────────────────────────────── */
    let tk = 0;
    const task = (ev, tpl, assignee, due, prio, st, extra) => T.tasks.push(Object.assign({ id: 'tk' + (++tk), eventId: ev, delegationId: null, titleKey: 'task.tpl.' + tpl, params: {}, title: '', assigneeId: assignee, due, priority: prio, status: st, vip: false, template: tpl, createdAt: ago(10, '10:00'), remindedAt: null }, extra || {}));
    task('ev1', 'book_hotel', 'u_coord', d(-8, '18:00'), 'high', 'done');
    task('ev1', 'confirm_rooms', 'u_officer', d(0, '18:00'), 'high', 'in_progress');
    task('ev1', 'meet_delegation', 'u_escort', d(1, '06:00'), 'high', 'in_progress', { delegationId: 'dl1' });
    task('ev1', 'assign_transport', 'u_coord', d(0, '12:00'), 'normal', 'in_progress');
    task('ev1', 'assign_escort', 'u_coord2', hrs(-2), 'high', 'new', { delegationId: 'dl5' });
    task('ev1', 'assign_escort', 'u_coord2', d(0, '20:00'), 'high', 'new', { delegationId: 'dl7' });
    task('ev1', 'assign_transport', 'u_coord', d(0, '23:00'), 'normal', 'new', { delegationId: 'dl7' });
    task('ev1', 'prepare_route', 'u_coord', d(1, '12:00'), 'normal', 'in_progress');
    task('ev1', 'confirm_restaurant', 'u_coord2', d(1, '10:00'), 'normal', 'new');
    task('ev1', 'check_program', 'u_officer', d(0, '22:00'), 'critical', 'new');
    task('ev1', 'organize_departure', 'u_coord', d(3, '12:00'), 'normal', 'new');
    task('ev1', 'assign_transport', 'u_driver', d(1, '07:30'), 'normal', 'new', { delegationId: 'dl1', titleKey: '', title: 'Подтвердить время подачи автомобиля (Mercedes S)' });
    ['dl1', 'dl2', 'dl5'].forEach((dl, i) => {
      C.VIP_CHECKLIST.forEach((k, j) => task('ev1', k, i === 0 ? 'u_officer' : 'u_coord', d(i === 2 ? 0 : -1 + j, '12:00'), 'critical', i === 0 && j < 2 ? 'done' : j === 0 ? 'in_progress' : 'new', { delegationId: dl, vip: true, template: k, titleKey: 'task.vip.' + k, params: {} }));
    });
    // Название делегации в заголовке задачи подставляется при показе (Flow.taskTitle) по delegationId


    /* ── Уведомления ───────────────────────────────────────── */
    const nt = (k, p, roles, users, prio, link, hours, ev, hotel) => T.notifications.push({ id: 'n' + (T.notifications.length + 1), eventId: ev || 'ev1', k, p: p || {}, forRoles: roles || [], forUsers: users || [], hotelId: hotel || null, priority: prio || 'normal', link: link || '', createdAt: hrs(-hours), readBy: [] });
    nt('n.seed.rooms', { hotel: 'Mövenpick Hotel Tashkent' }, ['admin', 'officer', 'coordinator'], [], 'normal', '#/booking', 20);
    nt('n.seed.vipArrival', { name: 'Делегация Турции' }, ['admin', 'officer', 'coordinator', 'head'], [], 'high', '#/vip', 14);
    nt('n.seed.noEscort', { name: 'Делегация ОАЭ' }, ['admin', 'officer', 'coordinator'], [], 'high', '#/escort', 6);
    nt('n.seed.hotelReq', { n: 3 }, ['hotel'], [], 'normal', '#/booking', 10, 'ev1', 'movenpick-tashkent');
    nt('n.seed.driverTask', {}, [], ['u_driver'], 'normal', '#/my', 4);
    nt('n.seed.escortTask', {}, [], ['u_escort'], 'high', '#/my', 3);

    /* ── Контроль качества (завершённое мероприятие) ───────── */
    const q = (kind, text, rating, ago_) => T.quality.push({ id: 'q' + (T.quality.length + 1), eventId: 'ev2', kind, text, rating: rating || null, guestId: null, createdAt: ago(ago_, '18:00'), by: 'u_coord2' });
    q('service', 'Встреча, трансфер, размещение и экскурсия выполнены по плану.', null, 17);
    q('rating', 'Общая оценка обслуживания от главы делегации Франции.', 5, 17);
    q('rating', 'Оценка от делегации Индии.', 4, 17);
    q('remark', 'Задержка заселения Индийской делегации на 40 минут.', null, 18);
    q('issue', 'В одном номере не работал кондиционер — устранено за 30 минут.', null, 18);
    q('suggestion', 'Добавить меню на хинди и информацию о вегетарианских ресторанах.', null, 17);

    /* ── Журнал действий (демо) ────────────────────────────── */
    const au = (days, hm, userId, action, entity, entityId, ev, label, diff, note) => {
      const u = T.users.find((x) => x.id === userId);
      T.audit.push({ id: 'au' + (T.audit.length + 1), ts: ago(days, hm), userId, userName: u.name, role: u.role, action, entity, entityId, eventId: ev, label, diff: diff || [], note: note || '' });
    };
    au(30, '10:05', 'u_admin', 'create', 'events', 'ev1', 'ev1', 'Форум «Шёлковый путь — 2026»');
    au(26, '12:20', 'u_officer', 'status', 'events', 'ev1', 'ev1', 'Форум «Шёлковый путь — 2026»', [{ f: 'status', from: 'planned', to: 'preparation' }]);
    au(18, '10:30', 'u_coord', 'create', 'bookings', 'b1', 'ev1', 'Mehmet Yılmaz · Mövenpick');
    au(12, '15:00', 'u_hotel', 'update', 'bookings', 'b1', 'ev1', 'Mehmet Yılmaz · Mövenpick', [{ f: 'status', from: 'sent', to: 'confirmed' }]);
    au(9, '11:10', 'u_officer', 'status', 'events', 'ev1', 'ev1', 'Форум «Шёлковый путь — 2026»', [{ f: 'status', from: 'preparation', to: 'booking' }]);
    au(6, '16:40', 'u_coord', 'room_change', 'bookings', 'b4', 'ev1', 'Khalid Al Mansoori · T-City ParkinMall', [{ f: 'roomNo', from: '1101', to: '1102' }], 'Запрос охраны: номер ближе к лифту');
    au(3, '09:15', 'u_coord2', 'update', 'guests', 'g8', 'ev1', 'Takeshi Sato', [{ f: 'diets', from: [], to: ['allergy'] }]);
    au(2, '14:00', 'u_officer', 'status', 'events', 'ev1', 'ev1', 'Форум «Шёлковый путь — 2026»', [{ f: 'status', from: 'booking', to: 'arriving' }]);
    au(20, '09:00', 'u_officer', 'status', 'events', 'ev2', 'ev2', 'Визит Франции и Индии', [{ f: 'status', from: 'booking', to: 'arriving' }]);
    au(17, '19:00', 'u_officer', 'status', 'events', 'ev2', 'ev2', 'Визит Франции и Индии', [{ f: 'status', from: 'running', to: 'completed' }]);

    return {
      v: VERSION,
      settings: { eventTypes: C.EVENT_TYPES_DEFAULT.map((x) => Object.assign({}, x)), idleMin: C.IDLE_MIN_DEFAULT, reminderHours: C.REMIND_HOURS_DEFAULT, seededAt: U.toISO(now) },
      tables: T,
    };
  }

  EV.Seed = { VERSION, build };
})();
