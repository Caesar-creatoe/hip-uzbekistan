/* ============================================================
   HOTELS-DATA.JS — Единый источник данных гостиничных активов
   Silk Route Invest · Uzbekistan
   Хранилище: localStorage key "sri_hotels"
   ============================================================ */
'use strict';

/**
 * Расчёт RevPAR с единым правилом округления (1 знак после запятой)
 * RevPAR = ADR * (Occupancy / 100)
 */
function calculateRevPAR(adr, occupancy) {
  const a = parseFloat(adr) || 0;
  const occ = parseFloat(occupancy) || 0;
  const rev = a * (occ / 100);
  return Number(rev.toFixed(1));
}

/**
 * Канонический набор гостиничных объектов платформы.
 * Исключает расхождение цифр (номера, ADR, Occupancy, статус) между страницами.
 */
const DEFAULT_HOTELS = [
  {
    id: 'grand-tashkent',
    slug: 'grand-tashkent',
    hotelName: 'Grand Tashkent Hotel',
    stars: 5,
    region: 'Ташкент (город)',
    regionKey: 'tashkent',
    address: 'г. Ташкент, ул. Амира Темура, 14',
    roomsCount: 258,
    placesCount: 516,
    floors: 14,
    yearCommissioned: 2021,
    occupancy: 74,
    adr: 128,
    revpar: 94.7,
    ebitdaMargin: 38.5,
    irr: 18.4,
    iri: 'A+',
    investmentModel: 'management',
    modelLabel: 'Управление',
    regNumber: 'UZ.TR.001.2024',
    status: 'verified',
    legalEntity: 'ООО «Grand Tashkent Development»',
    managerContact: '+998 (71) 200-11-22',
    hasPresentation: true,
    amenities: 'Spa, Бассейн, Ресторан, Конференц-зал, Valet-парковка, Фитнес',
    photos: [
      './assets/hotel-hero.png',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&fit=crop',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80&fit=crop'
    ],
    coords: [41.2995, 69.2401],
    description: 'Флагманский 5-звёздочный гостиничный комплекс премиум-класса в деловом центре Ташкента. Полный аудит Big 4, сертификация Safe Tourism, высокий RevPAR и стабильный поток MICE-туристов.'
  },
  {
    id: 'samarkand-palace',
    slug: 'samarkand-palace',
    hotelName: 'Samarkand Palace Hotel',
    stars: 5,
    region: 'Самаркандская область',
    regionKey: 'samarkand',
    address: 'г. Самарканд, Университетский бульвар, 5',
    roomsCount: 185,
    placesCount: 370,
    floors: 7,
    yearCommissioned: 2022,
    occupancy: 68,
    adr: 115,
    revpar: 78.2,
    ebitdaMargin: 34.0,
    irr: 16.8,
    iri: 'A',
    investmentModel: 'sale',
    modelLabel: 'Продажа 100%',
    regNumber: 'UZ.TR.004.2024',
    status: 'verified',
    legalEntity: 'СП ООО «Samarkand Tourism Holding»',
    managerContact: '+998 (66) 231-40-00',
    hasPresentation: true,
    amenities: 'Ресторан, Спа, Бассейн, Конгресс-центр, Экскурсионный сервис',
    photos: [
      'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=800&q=80&fit=crop',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80&fit=crop'
    ],
    coords: [39.6542, 66.9597],
    description: 'Премиальный комплекс в пешей доступности от ансамбля Регистан. 185 дизайнерских номеров, конференц-возможности для международных форумов и высокая доля въездного культурного туризма.'
  },
  {
    id: 'bukhara-heritage',
    slug: 'bukhara-heritage',
    hotelName: 'Bukhara Heritage Hotel',
    stars: 4,
    region: 'Бухарская область',
    regionKey: 'bukhara',
    address: 'г. Бухара, ул. Бахауддина Накшбанда, 28',
    roomsCount: 120,
    placesCount: 240,
    floors: 4,
    yearCommissioned: 2020,
    occupancy: 62,
    adr: 90,
    revpar: 55.8,
    ebitdaMargin: 31.5,
    irr: 15.2,
    iri: 'B+',
    investmentModel: 'jv',
    modelLabel: 'Совместное предприятие (JV)',
    regNumber: 'UZ.TR.018.2023',
    status: 'verified',
    legalEntity: 'ООО «Bukhara Heritage Hospitality»',
    managerContact: '+998 (65) 224-88-10',
    hasPresentation: true,
    amenities: 'Ресторан традиционной кухни, Терраса на крыше, Хаммам, Сувенирный бутик',
    photos: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80&fit=crop',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80&fit=crop'
    ],
    coords: [39.7747, 64.4286],
    description: 'Атмосферный бутик-отель в исторической зоне древней Бухары. Архитектурный стиль шелкового пути, современный инженерный комфорт и развитая ресторанная концепция.'
  },
  {
    id: 'silk-road-resort',
    slug: 'silk-road-resort',
    hotelName: 'Silk Road Resort & Spa',
    stars: 4,
    region: 'Ташкентская область',
    regionKey: 'tashkent-region',
    address: 'Ташкентская обл., Бостанлыкский р-н, побережье Чарвака',
    roomsCount: 140,
    placesCount: 310,
    floors: 5,
    yearCommissioned: 2023,
    occupancy: 65,
    adr: 98,
    revpar: 63.7,
    ebitdaMargin: 36.2,
    irr: 17.1,
    iri: 'B+',
    investmentModel: 'franchise',
    modelLabel: 'Франчайзинг',
    regNumber: 'UZ.TR.022.2024',
    status: 'verified',
    legalEntity: 'ИП ООО «Charvak Lakes Hospitality»',
    managerContact: '+998 (71) 150-77-99',
    hasPresentation: true,
    amenities: 'Открытый и закрытый бассейны, Спа, Частный пляж, Вертодром',
    photos: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80&fit=crop',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80&fit=crop'
    ],
    coords: [41.6318, 70.0435],
    description: 'Круглогодичный курортно-оздоровительный отель на Чарвакском водохранилище в 80 км от столицы. Высокий спрос в сегменте рекреационного и семейного отдыха.'
  },
  {
    id: 'khiva-palace',
    slug: 'khiva-palace',
    hotelName: 'Khiva Palace Hotel',
    stars: 4,
    region: 'Хорезмская область',
    regionKey: 'khorezm',
    address: 'г. Хива, ул. Пахлаван Махмуда, 11 (Ичан-Кала)',
    roomsCount: 74,
    placesCount: 152,
    floors: 3,
    yearCommissioned: 2019,
    occupancy: 60,
    adr: 85,
    revpar: 51.0,
    ebitdaMargin: 32.0,
    irr: 14.5,
    iri: 'B+',
    investmentModel: 'sale',
    modelLabel: 'Продажа 100%',
    regNumber: 'UZ.TR.035.2023',
    status: 'verified',
    legalEntity: 'ООО «Ichan Qala Invest»',
    managerContact: '+998 (62) 375-12-34',
    hasPresentation: true,
    amenities: 'Внутренний восточный дворик, Чайхана, Экскурсионное бюро, Арт-галерея',
    photos: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80&fit=crop'
    ],
    coords: [41.3783, 60.3639],
    description: 'Колоритный отель у ворот крепости Ичан-Кала (объект ЮНЕСКО). Аутентичная резьба по дереву, майолика и устойчивый поток европейских и азиатских туристических групп.'
  },
  {
    id: 'zaamin-mountain-resort',
    slug: 'zaamin-mountain-resort',
    hotelName: 'Zaamin Mountain Resort',
    stars: 4,
    region: 'Джизакская область',
    regionKey: 'jizzakh',
    address: 'Джизакская обл., Зааминский р-н, нац. природный парк',
    roomsCount: 110,
    placesCount: 250,
    floors: 6,
    yearCommissioned: 2024,
    occupancy: 70,
    adr: 105,
    revpar: 73.5,
    ebitdaMargin: 35.8,
    irr: 17.5,
    iri: 'A',
    investmentModel: 'jv',
    modelLabel: 'Совместное предприятие (JV)',
    regNumber: 'UZ.TR.041.2025',
    status: 'verified',
    legalEntity: 'ООО «Zaamin Highlands Resort»',
    managerContact: '+998 (72) 226-55-40',
    hasPresentation: true,
    amenities: 'Горнолыжный спуск, Канатная дорога, Климатолечение, Спа-центр, Ресторан',
    photos: [
      'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?w=800&q=80&fit=crop'
    ],
    coords: [39.6389, 68.4981],
    description: 'Всесезонный горный курорт в узбекской Швейцарии (Зааминский национальный парк, высота 2000 м). Чистейший горный воздух, климатотерапия и современная горнолыжная инфраструктура.'
  }
];

/**
 * Единый менеджер хранилища отелей (с авто-инициализацией)
 */
const HotelStore = {
  KEY: 'sri_hotels',

  getAll() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading sri_hotels from localStorage:', e);
    }
    // Автоматическая инициализация каноническими отелями
    this.save(DEFAULT_HOTELS);
    return DEFAULT_HOTELS;
  },

  save(hotels) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(hotels));
      window.dispatchEvent(new CustomEvent('sri_hotels_updated', { detail: hotels }));
      return true;
    } catch (e) {
      console.error('Error saving sri_hotels:', e);
      if (typeof window !== 'undefined' && (e.name === 'QuotaExceededError' || e.code === 22)) {
        alert('⚠️ Недостаточно места в памяти браузера для сохранения данных. Попробуйте удалить старые объекты или уменьшить количество фото.');
      }
      return false;
    }
  },

  getById(idOrSlug) {
    if (!idOrSlug) return null;
    const all = this.getAll();
    return all.find(h => h.id === idOrSlug || h.slug === idOrSlug) || null;
  },

  add(hotel) {
    const hotels = this.getAll();
    hotel.id = hotel.id || ('sri_' + Date.now().toString(36));
    hotel.slug = hotel.slug || (hotel.hotelName ? hotel.hotelName.toLowerCase().replace(/[^a-z0-9а-яё]+/g, '-').replace(/^-|-$/g, '') : hotel.id);
    hotel.revpar = calculateRevPAR(hotel.adr || 0, hotel.occupancy || 0);
    hotel.createdAt = new Date().toISOString();
    hotels.push(hotel);
    this.save(hotels);
    return hotel;
  },

  update(id, data) {
    const hotels = this.getAll();
    const idx = hotels.findIndex(h => h.id === id || h.slug === id);
    if (idx === -1) return null;
    const adr = data.adr !== undefined ? data.adr : hotels[idx].adr;
    const occ = data.occupancy !== undefined ? data.occupancy : hotels[idx].occupancy;
    hotels[idx] = {
      ...hotels[idx],
      ...data,
      revpar: calculateRevPAR(adr, occ),
      updatedAt: new Date().toISOString()
    };
    this.save(hotels);
    return hotels[idx];
  },

  delete(id) {
    const hotels = this.getAll().filter(h => h.id !== id && h.slug !== id);
    this.save(hotels);
    return hotels;
  },

  resetToDefaults() {
    this.save(DEFAULT_HOTELS);
    return DEFAULT_HOTELS;
  }
};

// Экспорт в глобальную область видимости
if (typeof window !== 'undefined') {
  window.calculateRevPAR = calculateRevPAR;
  window.DEFAULT_HOTELS = DEFAULT_HOTELS;
  window.HotelStore = HotelStore;
}
