// Vercel Serverless Function: /api/hotels
// Provides shared multi-device storage for hotels catalog
let memoryHotels = null;

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
        memoryHotels = list;

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
        if (rows && rows.length > 0 && Array.isArray(rows[0].data)) {
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

  // If no cloud data yet, return empty list
  return res.status(200).json({ hotels: [] });
}
