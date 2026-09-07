/* ============================================================
   HOTELS-DATA.JS — Единый источник данных гостиничных активов
   Silk Route Invest · Uzbekistan
   Каноническая схема 19 полей
   Хранилище: localStorage key "sri_hotels" + Cloud Sync (/api/hotels)
   ============================================================ */
'use strict';

/**
 * Парсинг и дедупликация удобств (amenities) без потери уникальных значений
 * Поддерживает строки с разделителями (запятая, точка с запятой, новая строка) и массивы
 */
function parseAmenities(input) {
  if (!input) return [];
  let items = [];
  if (Array.isArray(input)) {
    items = input.flatMap(i => String(i).split(/[,;\n\r]+/));
  } else if (typeof input === 'string') {
    items = input.split(/[,;\n\r]+/);
  } else {
    items = [String(input)];
  }

  const seen = new Set();
  const result = [];
  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(trimmed);
    }
  }
  return result;
}

/**
 * Конфигурация форматов сделок / финансовых моделей
 */
const DEAL_TYPES_MAP = {
  sale: { key: 'sale', label: 'Прямая продажа', shortLabel: 'Продажа', icon: '💼', badgeClass: 'deal-sale' },
  rent: { key: 'rent', label: 'Долгосрочная аренда', shortLabel: 'Аренда', icon: '🔑', badgeClass: 'deal-rent' },
  franchise: { key: 'franchise', label: 'Франшиза / Управление', shortLabel: 'Франшиза', icon: '⭐', badgeClass: 'deal-franchise' },
  invest: { key: 'invest', label: 'Соинвестирование', shortLabel: 'Соинвестирование', icon: '📈', badgeClass: 'deal-invest' }
};

function getHotelDealConfig(hotel) {
  if (!hotel) return DEAL_TYPES_MAP.sale;
  let dt = hotel.dealType ? String(hotel.dealType).toLowerCase().trim() : '';
  if (!dt) {
    const s = ((hotel.id || '') + ' ' + (hotel.hotelName || '')).toLowerCase();
    if (s.includes('bukhara') || s.includes('бухар')) dt = 'franchise';
    else if (s.includes('silk') || s.includes('charvak') || s.includes('resort') || s.includes('спа')) dt = 'rent';
    else if (s.includes('khiva') || s.includes('хива')) dt = 'invest';
    else dt = 'sale';
  } else {
    if (dt.includes('аренд') || dt === 'rent') dt = 'rent';
    else if (dt.includes('франш') || dt.includes('управ') || dt === 'franchise' || dt === 'management') dt = 'franchise';
    else if (dt.includes('инвест') || dt.includes('доля') || dt.includes('соинвест') || dt === 'invest' || dt === 'co-investment') dt = 'invest';
    else dt = 'sale';
  }
  return DEAL_TYPES_MAP[dt] || DEAL_TYPES_MAP.sale;
}
window.getHotelDealConfig = getHotelDealConfig;

/**
 * Канонический набор гостиничных объектов платформы.
 * Исключены фиктивные метрики (ADR, RevPAR, IRR, фиктивные IRI).
 * Все объекты соответствуют 19 каноническим полям.
 */
const DEFAULT_HOTELS = [
  {
    id: 'grand-tashkent',
    slug: 'grand-tashkent',
    hotelName: 'Grand Tashkent Hotel',
    legalEntity: 'ООО «Grand Tashkent Development»',
    region: 'Ташкент (город)',
    regionKey: 'tashkent',
    address: 'г. Ташкент, ул. Амира Темура, 14',
    roomsCount: 258,
    placesCount: 516,
    stars: 5,
    landArea: '1.4 га',
    buildingArea: '18 500 м²',
    floors: 14,
    yearCommissioned: 2021,
    maxRoomArea: 85,
    minRoomArea: 32,
    dealType: 'sale',
    amenities: 'Spa-комплекс, Закрытый и открытый бассейны, Панорамный ресторан, Конференц-центр, Valet-парковка, Фитнес-клуб',
    managerContact: '+998 (71) 200-11-22',
    status: 'active',
    hasPresentation: true,
    photos: [
      './assets/hotel-hero.png',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&fit=crop',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80&fit=crop'
    ],
    notes: 'Флагманский комплекс в центре столицы.'
  },
  {
    id: 'samarkand-palace',
    slug: 'samarkand-palace',
    hotelName: 'Samarkand Palace Hotel',
    legalEntity: 'СП ООО «Samarkand Tourism Holding»',
    region: 'Самаркандская область',
    regionKey: 'samarkand',
    address: 'г. Самарканд, Университетский бульвар, 5',
    roomsCount: 185,
    placesCount: 370,
    stars: 5,
    landArea: '2.1 га',
    buildingArea: '14 200 м²',
    floors: 7,
    yearCommissioned: 2022,
    maxRoomArea: 70,
    minRoomArea: 28,
    dealType: 'sale',
    amenities: 'Ресторан авторской кухни, Спа-салон, Бассейн, Конгресс-центр, Экскурсионный сервис, Парковка',
    managerContact: '+998 (66) 231-40-00',
    status: 'active',
    hasPresentation: true,
    photos: [
      'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=800&q=80&fit=crop',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80&fit=crop'
    ],
    notes: 'В пешей доступности от ансамбля Регистан.'
  },
  {
    id: 'bukhara-heritage',
    slug: 'bukhara-heritage',
    hotelName: 'Bukhara Heritage Hotel',
    legalEntity: 'ООО «Bukhara Heritage Hospitality»',
    region: 'Бухарская область',
    regionKey: 'bukhara',
    address: 'г. Бухара, ул. Бахауддина Накшбанда, 28',
    roomsCount: 120,
    placesCount: 240,
    stars: 4,
    landArea: '0.8 га',
    buildingArea: '7 900 м²',
    floors: 4,
    yearCommissioned: 2020,
    maxRoomArea: 55,
    minRoomArea: 24,
    dealType: 'franchise',
    amenities: 'Ресторан традиционной кухни, Терраса на крыше, Аутентичный хаммам, Сувенирный бутик, Чайхана',
    managerContact: '+998 (65) 224-88-10',
    status: 'active',
    hasPresentation: true,
    photos: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80&fit=crop',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80&fit=crop'
    ],
    notes: 'Историческая зона старой Бухары.'
  },
  {
    id: 'silk-road-resort',
    slug: 'silk-road-resort',
    hotelName: 'Silk Road Resort & Spa',
    legalEntity: 'ИП ООО «Charvak Lakes Hospitality»',
    region: 'Ташкентская область',
    regionKey: 'tashkent-region',
    address: 'Ташкентская обл., Бостанлыкский р-н, побережье Чарвака',
    roomsCount: 140,
    placesCount: 310,
    stars: 4,
    landArea: '3.5 га',
    buildingArea: '11 000 м²',
    floors: 5,
    yearCommissioned: 2023,
    maxRoomArea: 65,
    minRoomArea: 30,
    dealType: 'rent',
    amenities: 'Открытый и закрытый бассейны, Спа-комплекс, Частный пляж, Вертодром, Ресторан с видом на горы',
    managerContact: '+998 (71) 150-77-99',
    status: 'active',
    hasPresentation: true,
    photos: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80&fit=crop',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80&fit=crop'
    ],
    notes: 'Курортный объект на Чарвакском водохранилище.'
  },
  {
    id: 'khiva-palace',
    slug: 'khiva-palace',
    hotelName: 'Khiva Palace Hotel',
    legalEntity: 'ООО «Ichan Qala Invest»',
    region: 'Хорезмская область',
    regionKey: 'khorezm',
    address: 'г. Хива, ул. Пахлаван Махмуда, 11 (Ичан-Кала)',
    roomsCount: 74,
    placesCount: 152,
    stars: 4,
    landArea: '0.5 га',
    buildingArea: '4 800 м²',
    floors: 3,
    yearCommissioned: 2019,
    maxRoomArea: 48,
    minRoomArea: 22,
    dealType: 'invest',
    amenities: 'Внутренний восточный дворик, Чайхана, Экскурсионное бюро, Арт-галерея',
    managerContact: '+998 (62) 375-12-34',
    status: 'active',
    hasPresentation: true,
    photos: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80&fit=crop'
    ],
    notes: 'Отель в крепости Ичан-Кала.'
  },
  {
    id: 'zaamin-mountain-resort',
    slug: 'zaamin-mountain-resort',
    hotelName: 'Zaamin Mountain Resort',
    legalEntity: 'ООО «Zaamin Highlands Resort»',
    region: 'Джизакская область',
    regionKey: 'jizzakh',
    address: 'Джизакская обл., Зааминский р-н, нац. природный парк',
    roomsCount: 110,
    placesCount: 250,
    stars: 4,
    landArea: '4.0 га',
    buildingArea: '9 200 м²',
    floors: 6,
    yearCommissioned: 2024,
    maxRoomArea: 60,
    minRoomArea: 26,
    dealType: 'invest',
    amenities: 'Горнолыжный спуск, Канатная дорога, Климатолечение, Спа-центр, Панорамный ресторан',
    managerContact: '+998 (72) 226-55-40',
    status: 'active',
    hasPresentation: true,
    photos: [
      'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?w=800&q=80&fit=crop'
    ],
    notes: 'Всесезонный горный курорт в Заамине.'
  }
];

/**
 * SriDB — IndexedDB хранилище для тяжелых файлов (PDF презентации, тяжелые фото).
 * Снимает 5МБ лимит localStorage раз и навсегда.
 */
const SriDB = {
  DB_NAME: 'sri_media_db',
  DB_VERSION: 1,
  STORE_NAME: 'files',
  _dbPromise: null,

  getDB() {
    if (this._dbPromise) return this._dbPromise;
    this._dbPromise = new Promise((resolve) => {
      if (typeof indexedDB === 'undefined') {
        return resolve(null);
      }
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = () => resolve(null);
    });
    return this._dbPromise;
  },

  async set(key, value) {
    try {
      const db = await this.getDB();
      if (!db) return false;
      return new Promise((resolve) => {
        const tx = db.transaction(this.STORE_NAME, 'readwrite');
        tx.objectStore(this.STORE_NAME).put(value, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch (e) {
      return false;
    }
  },

  async get(key) {
    try {
      const db = await this.getDB();
      if (!db) return null;
      return new Promise((resolve) => {
        const tx = db.transaction(this.STORE_NAME, 'readonly');
        const req = tx.objectStore(this.STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  },

  async delete(key) {
    try {
      const db = await this.getDB();
      if (!db) return false;
      return new Promise((resolve) => {
        const tx = db.transaction(this.STORE_NAME, 'readwrite');
        tx.objectStore(this.STORE_NAME).delete(key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch (e) {
      return false;
    }
  }
};
window.SriDB = SriDB;

/**
 * Единый менеджер хранилища отелей (localStorage + Cloud Sync)
 */
const HotelStore = {
  KEY: 'sri_hotels',

  getAllRaw() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading sri_hotels from localStorage:', e);
    }
    return [];
  },

  getAll() {
    const raw = this.getAllRaw();
    if (raw.length > 0) {
      return raw;
    }
    // Автоматическая инициализация каноническими отелями
    this.save(DEFAULT_HOTELS);
    return DEFAULT_HOTELS;
  },

  cleanForLocalStorage(hotels) {
    return hotels.map(h => {
      const copy = { ...h };
      // Если файл презентации в base64 переносим в IndexedDB и удаляем из localStorage
      if (copy.presentationFile) {
        if (typeof copy.presentationFile === 'string' && copy.presentationFile.startsWith('data:')) {
          if (copy.id && window.SriDB) {
            window.SriDB.set('pres_' + copy.id, { data: copy.presentationFile, name: copy.presentationFileName || '' });
          }
        }
        delete copy.presentationFile;
      }
      return copy;
    });
  },

  save(hotels) {
    try {
      const clean = this.cleanForLocalStorage(hotels);
      localStorage.setItem(this.KEY, JSON.stringify(clean));
      window.dispatchEvent(new CustomEvent('sri_hotels_updated', { detail: clean }));

      // Асинхронная фоновая синхронизация с облачным API Vercel
      if (typeof fetch === 'function') {
        fetch('/api/hotels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hotels: clean })
        }).catch(err => {
          console.debug('Cloud sync notice:', err);
        });
      }
      return true;
    } catch (e) {
      console.warn('Quota warning in localStorage, offloading heavy data to IndexedDB:', e);
      try {
        // Автоматически отделяем тяжелые фото в IndexedDB, предотвращая любые QuotaExceededError
        const compactHotels = hotels.map(h => {
          const copy = { ...h };
          delete copy.presentationFile;
          if (Array.isArray(copy.photos) && copy.photos.length > 1 && window.SriDB && copy.id) {
            window.SriDB.set('photos_' + copy.id, copy.photos);
            copy.photos = copy.photos.slice(0, 1);
          }
          return copy;
        });
        localStorage.setItem(this.KEY, JSON.stringify(compactHotels));
        window.dispatchEvent(new CustomEvent('sri_hotels_updated', { detail: compactHotels }));
        return true;
      } catch (innerErr) {
        console.error('Final fallback error saving hotels:', innerErr);
        return false;
      }
    }
  },

  getById(idOrSlug) {
    if (!idOrSlug) return null;
    const all = this.getAll();
    const query = String(idOrSlug).toLowerCase().trim();
    return all.find(h =>
      (h.id && String(h.id).toLowerCase() === query) ||
      (h.slug && String(h.slug).toLowerCase() === query)
    ) || null;
  },

  add(hotel) {
    const hotels = this.getAll();
    hotel.id = hotel.id || ('sri_' + Date.now().toString(36));
    hotel.slug = hotel.slug || (hotel.hotelName ? hotel.hotelName.toLowerCase().replace(/[^a-z0-9а-яё]+/g, '-').replace(/^-|-$/g, '') : hotel.id);
    hotel.createdAt = new Date().toISOString();
    hotels.push(hotel);
    this.save(hotels);
    return hotel;
  },

  update(id, data) {
    const hotels = this.getAll();
    const idx = hotels.findIndex(h => h.id === id || h.slug === id);
    if (idx === -1) return null;
    hotels[idx] = {
      ...hotels[idx],
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.save(hotels);
    return hotels[idx];
  },

  delete(id) {
    const hotels = this.getAll().filter(h => h.id !== id && h.slug !== id);
    if (window.SriDB) {
      window.SriDB.delete('pres_' + id);
      window.SriDB.delete('photos_' + id);
    }
    this.save(hotels);
    return hotels;
  },

  resetToDefaults() {
    this.save(DEFAULT_HOTELS);
    return DEFAULT_HOTELS;
  },

  /**
   * Синхронизация с облачным Vercel Serverless /api/hotels
   */
  async syncWithCloud() {
    if (typeof fetch !== 'function') return false;
    try {
      const res = await fetch('/api/hotels');
      if (!res.ok) return false;
      const data = await res.json();
      if (data && Array.isArray(data.hotels) && data.hotels.length > 0) {
        const local = this.getAllRaw();
        const cloudMap = new Map(data.hotels.map(h => [h.id, h]));
        const merged = [...data.hotels];
        for (const h of local) {
          if (!cloudMap.has(h.id)) {
            merged.push(h);
          }
        }
        localStorage.setItem(this.KEY, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('sri_hotels_updated', { detail: merged }));
        return true;
      } else {
        // Если облако пока пустое, инициализируем его текущими локальными отелями
        const local = this.getAll();
        if (local && local.length > 0) {
          await fetch('/api/hotels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hotels: local })
          });
        }
      }
    } catch (e) {
      console.debug('Cloud sync unavailable:', e);
    }
    return false;
  }
};

// Экспорт в глобальную область видимости
if (typeof window !== 'undefined') {
  window.parseAmenities = parseAmenities;
  window.DEFAULT_HOTELS = DEFAULT_HOTELS;
  window.HotelStore = HotelStore;

  // Запуск фоновой синхронизации с облаком при загрузке скрипта
  setTimeout(() => {
    HotelStore.syncWithCloud();
  }, 100);
}
