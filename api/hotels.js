// Vercel Serverless Function: /api/hotels
// Persistent storage via GitHub API + local static snapshot fallback
// POST/DELETE requires ADMIN_SECRET header for security
import fs from 'fs';
import path from 'path';

const GITHUB_TOKEN  = process.env.GITHUB_TOKEN  || '';
const ADMIN_SECRET  = process.env.ADMIN_SECRET  || '';
const GITHUB_OWNER  = 'Caesar-creatoe';
const GITHUB_REPO   = 'hip-uzbekistan';
const GITHUB_FILE   = 'data/hotels.json';
const GITHUB_BRANCH = 'main';
const RAW_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${GITHUB_FILE}`;
const GH_API  = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`;

// ─── Auth check ───────────────────────────────────────────────────────────────
function isAuthorized(req) {
  // If no ADMIN_SECRET configured on server, writes are BLOCKED for safety
  if (!ADMIN_SECRET) return false;
  const header = req.headers['x-admin-secret'] || req.headers['authorization'] || '';
  return header === ADMIN_SECRET || header === `Bearer ${ADMIN_SECRET}`;
}

// ─── Read hotels (3-tier: GitHub Raw → GitHub API → Local file) ───────────────
async function readHotels() {
  // Tier 1: GitHub Raw URL (fastest, no auth needed)
  try {
    const headers = { 'User-Agent': 'Vercel-SRI', 'Cache-Control': 'no-cache, no-store' };
    if (GITHUB_TOKEN) headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    const res = await fetch(RAW_URL + '?_t=' + Date.now(), { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length >= 10) return { hotels: data, source: 'github-raw' };
    }
  } catch (e) { console.warn('Tier1 raw failed:', e.message); }

  // Tier 2: GitHub Contents API
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Vercel-SRI',
      'Cache-Control': 'no-cache'
    };
    if (GITHUB_TOKEN) headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    const res = await fetch(GH_API, { headers });
    if (res.ok) {
      const fi = await res.json();
      if (fi && fi.content) {
        const data = JSON.parse(Buffer.from(fi.content, 'base64').toString('utf8'));
        if (Array.isArray(data) && data.length >= 10) return { hotels: data, source: 'github-api' };
      }
    }
  } catch (e) { console.warn('Tier2 API failed:', e.message); }

  // Tier 3: Bundled local file (always 32 hotels from last deploy)
  try {
    const localPath = path.join(process.cwd(), 'data', 'hotels.json');
    if (fs.existsSync(localPath)) {
      const data = JSON.parse(fs.readFileSync(localPath, 'utf8'));
      if (Array.isArray(data) && data.length >= 10) return { hotels: data, source: 'local-bundle' };
    }
  } catch (e) { console.warn('Tier3 local failed:', e.message); }

  return { hotels: null, source: 'error' };
}

// ─── Write hotels to GitHub ───────────────────────────────────────────────────
async function writeToGitHub(hotels) {
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not configured');

  // Get current SHA
  const shaRes = await fetch(GH_API, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Vercel-SRI'
    }
  });
  let sha = null;
  if (shaRes.ok) {
    const fi = await shaRes.json();
    sha = fi.sha || null;
  }

  // Encode & commit
  const content = Buffer.from(JSON.stringify(hotels, null, 2)).toString('base64');
  const body = {
    message: `Update hotels catalog [${new Date().toISOString()}]`,
    content,
    branch: GITHUB_BRANCH,
    ...(sha ? { sha } : {})
  };

  const putRes = await fetch(GH_API, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Vercel-SRI'
    },
    body: JSON.stringify(body)
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    throw new Error(`GitHub write failed: ${putRes.status} – ${err.slice(0, 200)}`);
  }
  return true;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE,PATCH');
  res.setHeader('Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, X-Admin-Secret, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET: public read ────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { hotels, source } = await readHotels();
    if (hotels && hotels.length > 0) {
      return res.status(200).json({ hotels, source, count: hotels.length });
    }
    return res.status(503).json({ error: 'Hotels data unavailable', hotels: [], source: 'error', count: 0 });
  }

  // ── POST/PUT/PATCH/DELETE: requires auth ────────────────────────────────────
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    if (!isAuthorized(req)) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'X-Admin-Secret header is required for write operations'
      });
    }

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

      // DELETE single hotel by id
      if (req.method === 'DELETE') {
        const id = body.id || (req.query && req.query.id);
        if (!id) return res.status(400).json({ error: 'id required for DELETE' });
        const { hotels: current } = await readHotels();
        if (!current) return res.status(503).json({ error: 'Cannot read current hotels' });
        const filtered = current.filter(h => h.id !== id && h.slug !== id);
        if (filtered.length === current.length) return res.status(404).json({ error: 'Hotel not found', id });
        await writeToGitHub(filtered);
        return res.status(200).json({ success: true, deleted: id, count: filtered.length });
      }

      // POST/PUT/PATCH: save full list or single hotel
      let list = Array.isArray(body) ? body : (Array.isArray(body.hotels) ? body.hotels : null);

      // Single hotel upsert
      if (!list && body.id) {
        const { hotels: current } = await readHotels();
        if (!current) return res.status(503).json({ error: 'Cannot read current hotels' });
        const idx = current.findIndex(h => h.id === body.id || h.slug === body.slug);
        if (idx !== -1) current[idx] = { ...current[idx], ...body, updatedAt: new Date().toISOString() };
        else current.push({ ...body, createdAt: new Date().toISOString() });
        list = current;
      }

      if (!Array.isArray(list) || list.length === 0) {
        return res.status(400).json({ error: 'Expected non-empty array of hotels or single hotel object with id' });
      }

      // Safety guard: don't overwrite 25+ hotels with tiny list
      const { hotels: current } = await readHotels();
      if (current && current.length >= 25 && list.length < 10 && !body._confirmed) {
        return res.status(409).json({
          error: 'SAFETY_BLOCK',
          message: `Попытка сохранить ${list.length} отелей при ${current.length} в базе. Добавьте _confirmed:true.`,
          currentCount: current.length,
          newCount: list.length
        });
      }

      await writeToGitHub(list);
      return res.status(200).json({ success: true, count: list.length, source: 'github' });

    } catch (err) {
      console.error(`${req.method} /api/hotels error:`, err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
