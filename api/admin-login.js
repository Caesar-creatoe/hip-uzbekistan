// Vercel Serverless Function: /api/admin-login
// Verifies admin password against ADMIN_PASSWORD env var
// Returns ADMIN_SECRET token on success (for X-Admin-Secret header)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
  const ADMIN_SECRET   = process.env.ADMIN_SECRET   || '';

  if (!ADMIN_PASSWORD || !ADMIN_SECRET) {
    // Env vars not configured — block login entirely
    return res.status(503).json({
      error: 'Admin login not configured',
      message: 'Добавьте ADMIN_PASSWORD и ADMIN_SECRET в настройки Vercel'
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { password } = body;

    if (!password) {
      return res.status(400).json({ error: 'password required' });
    }

    if (password !== ADMIN_PASSWORD) {
      // Небольшая задержка против brute-force
      await new Promise(r => setTimeout(r, 500));
      return res.status(401).json({ error: 'Неверный пароль' });
    }

    // Успешный вход — возвращаем ADMIN_SECRET для использования в X-Admin-Secret
    return res.status(200).json({
      success: true,
      token: ADMIN_SECRET,
      message: 'Авторизация успешна'
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
