/* ============================================================
   SUPABASE.JS — Auth client & helpers
   Hotel Investment Portfolio · Uzbekistan

   SETUP:
   1. Зайдите на supabase.com → New Project
   2. Скопируйте Project URL и anon key
   3. Вставьте ниже

   SQL для создания таблиц (выполнить в Supabase SQL Editor):
   ──────────────────────────────────────────────────────────
   CREATE TABLE public.profiles (
     id UUID REFERENCES auth.users PRIMARY KEY,
     role TEXT CHECK (role IN ('investor','hotel_manager')) NOT NULL,
     full_name TEXT,
     company TEXT,
     country TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

   CREATE TABLE public.watchlist (
     id SERIAL PRIMARY KEY,
     user_id UUID REFERENCES auth.users NOT NULL,
     hotel_name TEXT NOT NULL,
     hotel_id TEXT,
     stars INT,
     region TEXT,
     iri_score TEXT,
     added_at TIMESTAMPTZ DEFAULT NOW()
   );
   ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Own watchlist" ON public.watchlist FOR ALL USING (auth.uid() = user_id);
   ──────────────────────────────────────────────────────────
   ============================================================ */

'use strict';

/* ── КОНФИГУРАЦИЯ (ЗАМЕНИТЕ НА СВОИ ДАННЫЕ) ──────────────── */
const SUPABASE_URL  = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON = 'YOUR_ANON_KEY_HERE';

/* ── Инициализация ───────────────────────────────────────── */
let _supabase = null;

async function getSupabase() {
  if (_supabase) return _supabase;
  // Загружаем Supabase SDK из CDN при первом обращении
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

/* ── Auth helpers ────────────────────────────────────────── */
async function signUp(email, password, meta) {
  const sb = await getSupabase();
  return sb.auth.signUp({ email, password, options: { data: meta } });
}

async function signIn(email, password) {
  const sb = await getSupabase();
  return sb.auth.signInWithPassword({ email, password });
}

async function signOut() {
  const sb = await getSupabase();
  await sb.auth.signOut();
  localStorage.removeItem('hip_user');
}

async function getSession() {
  const sb = await getSupabase();
  const { data } = await sb.auth.getSession();
  return data.session;
}

async function getProfile(userId) {
  const sb = await getSupabase();
  const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
  return data;
}

async function saveProfile(userId, profileData) {
  const sb = await getSupabase();
  return sb.from('profiles').upsert({ id: userId, ...profileData });
}

/* ── Watchlist helpers ───────────────────────────────────── */
async function getWatchlist(userId) {
  const sb = await getSupabase();
  const { data } = await sb.from('watchlist').select('*').eq('user_id', userId).order('added_at', { ascending: false });
  return data || [];
}

async function addToWatchlist(userId, hotel) {
  const sb = await getSupabase();
  return sb.from('watchlist').insert({ user_id: userId, ...hotel });
}

async function removeFromWatchlist(userId, itemId) {
  const sb = await getSupabase();
  return sb.from('watchlist').delete().eq('id', itemId).eq('user_id', userId);
}

/* ── Export ──────────────────────────────────────────────── */
window.HIPAuth = { signUp, signIn, signOut, getSession, getProfile, saveProfile, getWatchlist, addToWatchlist, removeFromWatchlist, SUPABASE_URL };
