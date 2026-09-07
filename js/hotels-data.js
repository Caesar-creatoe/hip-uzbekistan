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
    id: 'samarqand-universal-bouilding',
    slug: 'samarqand-universal-bouilding',
    hotelName: 'Samarqand Universal Bouilding',
    legalEntity: 'Samarqand Universal Bouilding MCHJ',
    region: 'Самаркандская область',
    regionKey: 'samarkand',
    address: 'г. Самарканд, ул. Регистан, 18',
    roomsCount: 279,
    placesCount: 800,
    stars: 5,
    floors: 9,
    yearCommissioned: 2022,
    dealType: 'sale',
    amenities: '2 ta restoran, 2 ta basseyn, sport zali, klub',
    managerContact: '+998 (77) 448 77 88',
    status: 'active',
    hasPresentation: true,
    photos: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&fit=crop',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80&fit=crop'
    ],
    notes: 'Крупнейший инвестиционный комплекс в Самарканде.'
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
    floors: 5,
    yearCommissioned: 2023,
    dealType: 'rent',
    amenities: 'Открытый и закрытый бассейны, Спа-комплекс, Частный пляж, Вертодром',
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
    floors: 4,
    yearCommissioned: 2020,
    dealType: 'franchise',
    amenities: 'Ресторан традиционной кухни, Терраса на крыше, Аутентичный хаммам, Сувенирный бутик',
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
    floors: 3,
    yearCommissioned: 2019,
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
    id: 'asmald',
    slug: 'asmald',
    hotelName: 'ASMALD',
    legalEntity: 'СП ООО «ASMALD Hospitality»',
    region: 'Ташкент (город)',
    regionKey: 'tashkent',
    address: 'г. Ташкент, Яккасарайский р-н, ул. Мукими, 12',
    roomsCount: 96,
    placesCount: 192,
    stars: 4,
    floors: 5,
    yearCommissioned: 2023,
    dealType: 'sale',
    amenities: 'Ресторан авторской кухни, Конференц-зал, Спа-комплекс, Фитнес-центр, Парковка',
    managerContact: '+998 (71) 203-00-55',
    status: 'active',
    hasPresentation: true,
    photos: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&fit=crop',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80&fit=crop'
    ],
    notes: 'Премиальный гостиничный комплекс в Ташкенте.'
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

const API_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? 'https://hotel-investment-portfolio-uz.vercel.app/api/hotels'
  : '/api/hotels';

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
      // Гарантируем, что отель ASMALD и актуальные канонические отели всегда присутствуют в каталоге
      const existingIds = new Set(raw.map(h => (h.id || h.slug || '').toLowerCase()));
      let updated = false;
      for (const def of DEFAULT_HOTELS) {
        const defId = (def.id || def.slug || '').toLowerCase();
        if (!existingIds.has(defId)) {
          raw.push(def);
          existingIds.add(defId);
          updated = true;
        }
      }
      if (updated) {
        try {
          localStorage.setItem(this.KEY, JSON.stringify(raw));
        } catch (e) {}
      }
      return raw;
    }
    // Первичная инициализация
    try {
      localStorage.setItem(this.KEY, JSON.stringify(DEFAULT_HOTELS));
    } catch (e) {}
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

  async save(hotels, syncCloud = true) {
    const clean = this.cleanForLocalStorage(hotels);
    try {
      localStorage.setItem(this.KEY, JSON.stringify(clean));
      window.dispatchEvent(new CustomEvent('sri_hotels_updated', { detail: clean }));
    } catch (e) {
      console.warn('Quota warning in localStorage, offloading heavy data to IndexedDB:', e);
      try {
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
      } catch (innerErr) {}
    }

    if (syncCloud && typeof fetch === 'function') {
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hotels: clean })
        });
        return res.ok;
      } catch (err) {
        console.warn('Cloud sync error:', err);
        return false;
      }
    }
    return true;
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

  async add(hotel) {
    const hotels = this.getAll();
    hotel.id = hotel.id || ('sri_' + Date.now().toString(36));
    hotel.slug = hotel.slug || (hotel.hotelName ? hotel.hotelName.toLowerCase().replace(/[^a-z0-9а-яё]+/g, '-').replace(/^-|-$/g, '') : hotel.id);
    hotel.createdAt = new Date().toISOString();
    hotels.push(hotel);
    await this.save(hotels, true);
    return hotel;
  },

  async update(id, data) {
    const hotels = this.getAll();
    const idx = hotels.findIndex(h => h.id === id || h.slug === id);
    if (idx === -1) return null;
    hotels[idx] = {
      ...hotels[idx],
      ...data,
      updatedAt: new Date().toISOString()
    };
    await this.save(hotels, true);
    return hotels[idx];
  },

  async delete(id) {
    const hotels = this.getAll().filter(h => h.id !== id && h.slug !== id);
    if (window.SriDB) {
      window.SriDB.delete('pres_' + id);
      window.SriDB.delete('photos_' + id);
    }
    await this.save(hotels, true);
    return hotels;
  },

  async resetToDefaults() {
    await this.save(DEFAULT_HOTELS, true);
    return DEFAULT_HOTELS;
  },

  /**
   * Синхронизация с облачным Vercel Serverless /api/hotels
   */
  async syncWithCloud() {
    if (typeof fetch !== 'function') return false;
    try {
      const sep = API_URL.includes('?') ? '&' : '?';
      const res = await fetch(API_URL + sep + '_t=' + Date.now());
      if (!res.ok) return false;
      const data = await res.json();
      if (data && Array.isArray(data.hotels) && data.hotels.length > 0) {
        localStorage.setItem(this.KEY, JSON.stringify(data.hotels));
        window.dispatchEvent(new CustomEvent('sri_hotels_updated', { detail: data.hotels }));
        return data.hotels;
      }
    } catch (e) {
      console.debug('Cloud sync notice:', e);
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
