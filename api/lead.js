// Vercel Serverless Function: /api/lead
// Приём заявок с сайта: заявка инвестора, запрос документов, размещение объекта.
// Доставка — в Telegram и/или на почту. Каналы включаются ключами в настройках Vercel:
//   TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID   — бот пишет в личку, группу или канал
//   RESEND_API_KEY + LEAD_EMAIL_TO (+ LEAD_EMAIL_FROM) — письмо через resend.com
// Если ни один канал не настроен, отвечаем 503 { configured:false } — сайт тогда
// предлагает посетителю отправить письмо со своей почты, заявка не теряется.

export const config = { api: { bodyParser: { sizeLimit: '4.5mb' } } };

const MAX_PHOTOS = 8;
const TYPES = {
  invest: 'Заявка инвестора',
  docs: 'Запрос документов (NDA)',
  list: 'Размещение объекта',
  question: 'Вопрос'
};

const clean = (v, n = 600) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B-\u001F]/g, '').trim().slice(0, n);
const esc = (s) => clean(s, 4000).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function normalize(body) {
  const b = body && typeof body === 'object' ? body : {};
  const type = TYPES[b.type] ? b.type : 'question';
  const f = b.fields && typeof b.fields === 'object' ? b.fields : {};
  const fields = {};
  Object.keys(f).slice(0, 30).forEach((k) => { const v = clean(f[k]); if (v) fields[clean(k, 60)] = v; });
  const photos = (Array.isArray(b.photos) ? b.photos : []).slice(0, MAX_PHOTOS)
    .map((p) => ({ name: clean(p && p.name, 80) || 'photo.jpg', data: String((p && p.data) || '') }))
    .filter((p) => /^data:image\/(jpeg|png|webp);base64,/.test(p.data));
  return {
    type,
    title: TYPES[type],
    fields,
    photos,
    page: clean(b.page, 300),
    hotel: clean(b.hotel, 200),
    lang: clean(b.lang, 8)
  };
}

/* Подписи полей по-русски — в сообщении сотруднику */
const LABELS = {
  name: 'Имя', company: 'Компания', role: 'Должность', email: 'E-mail', phone: 'Телефон', telegram: 'Telegram',
  country: 'Страна', interest: 'Интерес', budget: 'Бюджет', message: 'Сообщение',
  objectType: 'Тип объекта', objectName: 'Название объекта', region: 'Регион', city: 'Город / адрес',
  rooms: 'Номеров', stars: 'Категория', deal: 'Что нужно', price: 'Цена', year: 'Год ввода', status: 'Состояние', link: 'Ссылка на материалы'
};

function textMessage(l) {
  const lines = [`<b>${esc(l.title)}</b>${l.hotel ? ` · ${esc(l.hotel)}` : ''}`, ''];
  Object.entries(l.fields).forEach(([k, v]) => lines.push(`<b>${esc(LABELS[k] || k)}:</b> ${esc(v)}`));
  if (l.photos.length) lines.push('', `Фото: ${l.photos.length}`);
  if (l.page) lines.push('', `Страница: ${esc(l.page)}`);
  lines.push(`Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}`);
  return lines.join('\n');
}

function toBlob(dataUrl) {
  const m = /^data:(image\/[a-z]+);base64,(.*)$/.exec(dataUrl);
  return new Blob([Buffer.from(m[2], 'base64')], { type: m[1] });
}

async function sendTelegram(l) {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return null;
  const api = `https://api.telegram.org/bot${token}`;
  const r = await fetch(`${api}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text: textMessage(l).slice(0, 4000), parse_mode: 'HTML', disable_web_page_preview: true })
  });
  if (!r.ok) throw new Error('telegram ' + r.status + ' ' + (await r.text()).slice(0, 200));
  if (l.photos.length === 1) {
    const fd = new FormData();
    fd.append('chat_id', chat);
    fd.append('caption', clean(l.fields.objectName || l.title, 900));
    fd.append('photo', toBlob(l.photos[0].data), l.photos[0].name);
    const rp = await fetch(`${api}/sendPhoto`, { method: 'POST', body: fd });
    if (!rp.ok) console.warn('telegram photo', rp.status, (await rp.text()).slice(0, 200));
  } else if (l.photos.length > 1) {
    const fd = new FormData();
    fd.append('chat_id', chat);
    const media = l.photos.map((p, i) => ({ type: 'photo', media: `attach://p${i}`, caption: i === 0 ? clean(l.fields.objectName || l.title, 900) : undefined }));
    fd.append('media', JSON.stringify(media));
    l.photos.forEach((p, i) => fd.append(`p${i}`, toBlob(p.data), p.name));
    const rp = await fetch(`${api}/sendMediaGroup`, { method: 'POST', body: fd });
    if (!rp.ok) console.warn('telegram photos', rp.status, (await rp.text()).slice(0, 200));
  }
  return 'telegram';
}

async function sendEmail(l) {
  const key = process.env.RESEND_API_KEY, to = process.env.LEAD_EMAIL_TO;
  if (!key || !to) return null;
  const from = process.env.LEAD_EMAIL_FROM || 'Silk Route Invest <onboarding@resend.dev>';
  const rows = Object.entries(l.fields).map(([k, v]) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#6E6A64;vertical-align:top">${esc(LABELS[k] || k)}</td><td style="padding:6px 0">${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('');
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1D1D1F">
    <h2 style="margin:0 0 4px">${esc(l.title)}</h2>${l.hotel ? `<p style="margin:0 0 12px;color:#9A6B2F">${esc(l.hotel)}</p>` : ''}
    <table style="border-collapse:collapse">${rows}</table>
    <p style="color:#6E6A64;font-size:12px;margin-top:16px">${l.page ? `Страница: ${esc(l.page)}<br>` : ''}Фото во вложении: ${l.photos.length}</p></div>`;
  const replyTo = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(l.fields.email || '') ? l.fields.email : undefined;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from, to: to.split(',').map((s) => s.trim()).filter(Boolean),
      subject: `${l.title}${l.hotel ? ' — ' + l.hotel : l.fields.objectName ? ' — ' + l.fields.objectName : ''}`,
      html, reply_to: replyTo,
      attachments: l.photos.map((p) => ({ filename: p.name, content: p.data.split(',')[1] }))
    })
  });
  if (!r.ok) throw new Error('email ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return 'email';
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    const tg = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
    const em = !!(process.env.RESEND_API_KEY && process.env.LEAD_EMAIL_TO);
    return res.status(200).json({ configured: tg || em });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  if (body && body.website) return res.status(200).json({ ok: true }); // ловушка для ботов

  const lead = normalize(body);
  const contact = lead.fields.email || lead.fields.phone || lead.fields.telegram;
  if (!contact) return res.status(400).json({ error: 'contact required' });

  const results = await Promise.allSettled([sendTelegram(lead), sendEmail(lead)]);
  const sent = results.filter((r) => r.status === 'fulfilled' && r.value).map((r) => r.value);
  results.filter((r) => r.status === 'rejected').forEach((r) => console.error('lead delivery:', r.reason && r.reason.message));

  if (sent.length) return res.status(200).json({ ok: true, via: sent });
  const configured = results.some((r) => r.status === 'rejected');
  return res.status(configured ? 502 : 503).json({ ok: false, configured });
}
