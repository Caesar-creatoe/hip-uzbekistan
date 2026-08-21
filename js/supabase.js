/* ============================================================
   SUPABASE.JS — Universal Auth & Data Client (Supabase + Local Sync)
   Hotel Investment Portfolio · Uzbekistan
   ============================================================ */

'use strict';

/* ── CONFIG ──────────────────────────────────────────────── */
const SUPABASE_URL  = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON = 'YOUR_ANON_KEY_HERE';

const isLiveSupabase = SUPABASE_URL && !SUPABASE_URL.includes('YOUR_PROJECT_ID');
let _supabase = null;

async function getSupabase() {
  if (!isLiveSupabase) return null;
  if (_supabase) return _supabase;
  if (!window.supabase) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  return _supabase;
}

/* ── Storage Helpers (Local Fallback & Sync) ─────────────── */
function getLocalUsers() {
  try { return JSON.parse(localStorage.getItem('hip_users') || '[]'); } catch { return []; }
}

function saveLocalUsers(users) {
  localStorage.setItem('hip_users', JSON.stringify(users));
}

function getLocalSession() {
  try { return JSON.parse(localStorage.getItem('hip_active_session') || 'null'); } catch { return null; }
}

function setLocalSession(session) {
  if (session) {
    localStorage.setItem('hip_active_session', JSON.stringify(session));
  } else {
    localStorage.removeItem('hip_active_session');
  }
}

/* ── Auth API ────────────────────────────────────────────── */
async function signUp(email, password, meta = {}) {
  if (isLiveSupabase) {
    try {
      const sb = await getSupabase();
      const res = await sb.auth.signUp({ email, password, options: { data: meta } });
      if (res.error) throw res.error;
      return res;
    } catch (e) {
      console.warn('Supabase remote signup failed, using local auth engine:', e);
    }
  }

  // Local Engine
  const users = getLocalUsers();
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return { error: { message: 'Пользователь с таким email уже зарегистрирован' }, data: null };
  }

  const newUser = {
    id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    email: email.toLowerCase(),
    password, // Demo/local mode
    role: meta.role || 'investor',
    full_name: meta.full_name || email.split('@')[0],
    country: meta.country || '',
    company: meta.company || '',
    stars: meta.stars || 5,
    created_at: new Date().toISOString()
  };

  users.push(newUser);
  saveLocalUsers(users);

  const session = { user: newUser, access_token: 'local_token_' + newUser.id };
  setLocalSession(session);
  return { data: { user: newUser, session }, error: null };
}

async function signIn(email, password) {
  if (isLiveSupabase) {
    try {
      const sb = await getSupabase();
      const res = await sb.auth.signInWithPassword({ email, password });
      if (res.error) throw res.error;
      return res;
    } catch (e) {
      console.warn('Supabase remote signin failed, using local auth engine:', e);
    }
  }

  // Local Engine
  const users = getLocalUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    return { error: { message: 'Неверный email или пароль' }, data: null };
  }

  const session = { user, access_token: 'local_token_' + user.id };
  setLocalSession(session);
  return { data: { user, session }, error: null };
}

async function signOut() {
  if (isLiveSupabase) {
    try {
      const sb = await getSupabase();
      await sb.auth.signOut();
    } catch (e) { /* ignore */ }
  }
  setLocalSession(null);
}

async function getSession() {
  if (isLiveSupabase) {
    try {
      const sb = await getSupabase();
      const { data } = await sb.auth.getSession();
      if (data?.session) return data.session;
    } catch (e) { /* fallback to local */ }
  }
  return getLocalSession();
}

async function getProfile(userId) {
  if (isLiveSupabase) {
    try {
      const sb = await getSupabase();
      const { data, error } = await sb.from('profiles').select('*').eq('id', userId).single();
      if (!error && data) return data;
    } catch (e) { /* fallback */ }
  }

  const users = getLocalUsers();
  return users.find(u => u.id === userId) || null;
}

async function saveProfile(userId, profileData) {
  if (isLiveSupabase) {
    try {
      const sb = await getSupabase();
      await sb.from('profiles').upsert({ id: userId, ...profileData });
    } catch (e) { /* fallback */ }
  }

  const users = getLocalUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...profileData };
    saveLocalUsers(users);
  }
  const session = getLocalSession();
  if (session && session.user.id === userId) {
    session.user = { ...session.user, ...profileData };
    setLocalSession(session);
  }
}

/* ── Watchlist Helpers ───────────────────────────────────── */
async function getWatchlist(userId) {
  if (isLiveSupabase) {
    try {
      const sb = await getSupabase();
      const { data } = await sb.from('watchlist').select('*').eq('user_id', userId).order('added_at', { ascending: false });
      if (data) return data;
    } catch (e) { /* fallback */ }
  }

  try {
    const all = JSON.parse(localStorage.getItem('hip_watchlist_' + userId) || '[]');
    return all;
  } catch { return []; }
}

async function addToWatchlist(userId, hotel) {
  if (isLiveSupabase) {
    try {
      const sb = await getSupabase();
      await sb.from('watchlist').insert({ user_id: userId, ...hotel });
    } catch (e) { /* fallback */ }
  }

  const list = await getWatchlist(userId);
  const newItem = {
    id: Date.now(),
    user_id: userId,
    ...hotel,
    added_at: new Date().toISOString().split('T')[0]
  };
  list.unshift(newItem);
  localStorage.setItem('hip_watchlist_' + userId, JSON.stringify(list));
  return newItem;
}

async function removeFromWatchlist(userId, itemId) {
  if (isLiveSupabase) {
    try {
      const sb = await getSupabase();
      await sb.from('watchlist').delete().eq('id', itemId).eq('user_id', userId);
    } catch (e) { /* fallback */ }
  }

  let list = await getWatchlist(userId);
  list = list.filter(i => i.id !== itemId);
  localStorage.setItem('hip_watchlist_' + userId, JSON.stringify(list));
}

/* ── Export ──────────────────────────────────────────────── */
window.HIPAuth = {
  signUp,
  signIn,
  signOut,
  getSession,
  getProfile,
  saveProfile,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  isLiveSupabase,
  SUPABASE_URL
};
