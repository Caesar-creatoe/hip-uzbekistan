// Vercel Serverless Function: /api/hotels
// Persistent storage via GitHub API + local static snapshot fallback
import fs from 'fs';
import path from 'path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_OWNER = 'Caesar-creatoe';
const GITHUB_REPO = 'hip-uzbekistan';
const GITHUB_FILE = 'data/hotels.json';
const GITHUB_BRANCH = 'main';
const RAW_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${GITHUB_FILE}`;
const API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`;

// Read hotels with 3-tier fallback (Raw URL -> GitHub API -> Local Bundled File)
async function readHotels() {
  // Tier 1: Fetch from GitHub Raw URL with cache-busting (never hits 1MB API limit)
  try {
    const rawHeaders = { 'User-Agent': 'Vercel-Serverless', 'Cache-Control': 'no-cache, no-store' };
    if (GITHUB_TOKEN) rawHeaders['Authorization'] = `token ${GITHUB_TOKEN}`;
    const rawResp = await fetch(RAW_URL + '?_t=' + Date.now(), { headers: rawHeaders });
    if (rawResp.ok) {
      const data = await rawResp.json();
      if (Array.isArray(data) && data.length >= 10) return data;
    }
  } catch (e) {
    console.warn('Raw GitHub read failed:', e.message);
  }

  // Tier 2: GitHub Contents API (handles download_url or content)
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Vercel-Serverless',
      'Cache-Control': 'no-cache'
    };
    if (GITHUB_TOKEN) headers['Authorization'] = `token ${GITHUB_TOKEN}`;

    const resp = await fetch(API_URL, { headers });
    if (resp.ok) {
      const fileInfo = await resp.json();
      if (fileInfo && fileInfo.content) {
        const decoded = Buffer.from(fileInfo.content, 'base64').toString('utf8');
        const data = JSON.parse(decoded);
        if (Array.isArray(data) && data.length >= 10) return data;
      } else if (fileInfo && fileInfo.download_url) {
        const dlResp = await fetch(fileInfo.download_url + '?_t=' + Date.now());
        if (dlResp.ok) {
          const data = await dlResp.json();
          if (Array.isArray(data) && data.length >= 10) return data;
        }
      }
    }
  } catch (e) {
    console.warn('GitHub API contents read failed:', e.message);
  }

  // Tier 3: Local bundled data/hotels.json from deployment filesystem (always has 32 hotels)
  try {
    const localPath = path.join(process.cwd(), 'data', 'hotels.json');
    if (fs.existsSync(localPath)) {
      const localData = JSON.parse(fs.readFileSync(localPath, 'utf8'));
      if (Array.isArray(localData) && localData.length >= 10) return localData;
    }
  } catch (e) {
    console.warn('Local file fallback read failed:', e.message);
  }

  return null;
}

// Write hotels to GitHub (updates the shared database in git)
async function writeToGitHub(hotels) {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN is not configured on server');
  }

  // 1. Get current SHA of the file (required for update)
  const shaResp = await fetch(API_URL, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Vercel-Serverless'
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
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Vercel-Serverless'
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
    const hotels = await readHotels();
    if (hotels && hotels.length > 0) {
      return res.status(200).json({ hotels, source: 'cloud', count: hotels.length });
    }
    return res.status(503).json({ error: 'Hotels data temporarily unavailable', hotels: [], source: 'error', count: 0 });
  }

  // ─── POST (save full list) ────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      let list = Array.isArray(data) ? data : (data && Array.isArray(data.hotels) ? data.hotels : null);

      if (!Array.isArray(list) || list.length === 0) {
        return res.status(400).json({ error: 'Expected non-empty array of hotels' });
      }

      // Safety guard: if new list is smaller than 10 hotels while database has 25+, require explicit confirm
      const current = await readHotels();
      if (current && current.length >= 25 && list.length < 10) {
        if (!data._confirmed) {
          return res.status(409).json({
            error: 'SAFETY_BLOCK',
            message: `Попытка сохранить всего ${list.length} отелей (в базе ${current.length}). Отклонено для защиты каталога.`,
            currentCount: current.length,
            newCount: list.length
          });
        }
      }

      await writeToGitHub(list);
      return res.status(200).json({ success: true, count: list.length, hotels: list, source: 'github' });
    } catch (err) {
      console.error('POST /api/hotels error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
