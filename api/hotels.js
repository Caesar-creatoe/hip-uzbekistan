// Vercel Serverless Function: /api/hotels
// Persistent storage via GitHub API — changes are visible to ALL users worldwide

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_OWNER = 'Caesar-creatoe';
const GITHUB_REPO = 'hip-uzbekistan';
const GITHUB_FILE = 'data/hotels.json';
const GITHUB_BRANCH = 'main';
const RAW_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${GITHUB_FILE}`;
const API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`;

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

// Read hotels from GitHub API (not raw URL — raw has CDN cache up to 5 min!)
async function readFromGitHub() {
  try {
    // Use API endpoint which is NOT cached by CDN
    const resp = await fetch(API_URL, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache'
      }
    });
    if (resp.ok) {
      const fileInfo = await resp.json();
      if (fileInfo && fileInfo.content) {
        // GitHub API returns base64-encoded content
        const decoded = Buffer.from(fileInfo.content, 'base64').toString('utf8');
        const data = JSON.parse(decoded);
        if (Array.isArray(data) && data.length > 0) return data;
      }
    }
  } catch (e) {
    console.warn('GitHub API read failed:', e.message);
  }
  return null;
}

// Write hotels to GitHub (updates the shared database)
async function writeToGitHub(hotels) {
  // 1. Get current SHA of the file (required for update)
  const shaResp = await fetch(API_URL, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  let sha = null;
  if (shaResp.ok) {
    const fileInfo = await shaResp.json();
    sha = fileInfo.sha;
  }

  // 2. Encode content as base64
  const content = Buffer.from(JSON.stringify(hotels, null, 2)).toString('base64');

  // 3. Commit the updated file
  const body = {
    message: `Update hotels catalog [${new Date().toISOString()}]`,
    content,
    branch: GITHUB_BRANCH
  };
  if (sha) body.sha = sha;

  const putResp = await fetch(API_URL, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify(body)
  });

  if (!putResp.ok) {
    const err = await putResp.text();
    throw new Error(`GitHub write failed: ${putResp.status} – ${err}`);
  }
  return true;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ─── GET ─────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const hotels = await readFromGitHub();
    if (hotels) {
      return res.status(200).json({ hotels, source: 'github' });
    }
    // Fallback to canonical list
    return res.status(200).json({ hotels: CANONICAL_HOTELS, source: 'canonical' });
  }

  // ─── POST (save full list) ────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      let list = Array.isArray(data) ? data : (data && Array.isArray(data.hotels) ? data.hotels : null);

      if (!Array.isArray(list)) {
        return res.status(400).json({ error: 'Expected array of hotels or { hotels: [...] }' });
      }

      // Write to GitHub — this makes changes visible to ALL users immediately
      await writeToGitHub(list);

      return res.status(200).json({ success: true, count: list.length, hotels: list, source: 'github' });
    } catch (err) {
      console.error('POST /api/hotels error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
