// Vercel Serverless Function: /api/hotels
// Provides shared multi-device storage for hotels catalog

const CANONICAL_HOTELS = [
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

let memoryHotels = [...CANONICAL_HOTELS];

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Supabase sync if credentials provided in environment
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (req.method === 'POST') {
    try {
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const list = Array.isArray(data) ? data : (data && Array.isArray(data.hotels) ? data.hotels : null);

      if (Array.isArray(list)) {
        // Гарантируем, что канонические отели не теряются при сохранении
        const merged = [...list];
        const existingIds = new Set(merged.map(h => (h.id || h.slug || '').toLowerCase()));
        for (const def of CANONICAL_HOTELS) {
          const defId = (def.id || def.slug || '').toLowerCase();
          if (!existingIds.has(defId)) {
            merged.push(def);
            existingIds.add(defId);
          }
        }

        memoryHotels = merged;

        if (supabaseUrl && supabaseKey) {
          try {
            await fetch(`${supabaseUrl}/rest/v1/hotels_store`, {
              method: 'POST',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
              },
              body: JSON.stringify({ id: 'catalog', data: memoryHotels, updated_at: new Date().toISOString() })
            });
          } catch (sbErr) {
            console.warn('Supabase sync error in API:', sbErr);
          }
        }

        return res.status(200).json({ success: true, count: memoryHotels.length, hotels: memoryHotels });
      }
      return res.status(400).json({ error: 'Expected array of hotels or { hotels: [...] }' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // GET method
  if (supabaseUrl && supabaseKey) {
    try {
      const sbRes = await fetch(`${supabaseUrl}/rest/v1/hotels_store?id=eq.catalog&select=data`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      if (sbRes.ok) {
        const rows = await sbRes.json();
        if (rows && rows.length > 0 && Array.isArray(rows[0].data) && rows[0].data.length > 0) {
          memoryHotels = rows[0].data;
          return res.status(200).json({ hotels: memoryHotels });
        }
      }
    } catch (sbErr) {
      console.warn('Supabase read error:', sbErr);
    }
  }

  if (memoryHotels && Array.isArray(memoryHotels) && memoryHotels.length > 0) {
    return res.status(200).json({ hotels: memoryHotels });
  }

  // Fallback: всегда возвращаем канонический список отелей (включая ASMALD)
  memoryHotels = [...CANONICAL_HOTELS];
  return res.status(200).json({ hotels: memoryHotels });
}
