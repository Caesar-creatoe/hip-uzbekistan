/* ============================================================
   EVENTS · data/data-service.js
   ЕДИНЫЙ DATA-СЛОЙ раздела.

   Весь интерфейс обращается к данным ТОЛЬКО через EV.Data.* —
   асинхронный CRUD-интерфейс (Promise), который ничего не знает о
   localStorage. Сейчас под ним «адаптер LocalStorage» (ниже), позже
   его заменяют на адаптер REST/PostgreSQL (см. README, раздел
   «Как заменить data-слой») — экраны переписывать не нужно.

   Контракт:
     Data.list(entity, {eventId, raw})  → Promise<Array>
     Data.get(entity, id)               → Promise<Object|null>
     Data.create(entity, rec, meta)     → Promise<Object>
     Data.update(entity, id, patch, meta)→ Promise<Object>
     Data.remove(entity, id, meta)      → Promise<true>
     Data.directory()                   → публичная проекция справочников
     Data.settings() / setSettings(p)
     Data.exportAll() / importAll(json) / reset()
   Каждая запись проходит через Perm.canWrite (guard), блокировку
   архива и пишется в журнал действий (кто, когда, что было → что стало).
   ============================================================ */
(function () {
  'use strict';
  const EV = (window.EV = window.EV || {});
  const U = EV.U, C = EV.C;

  /* ── Шина событий ──────────────────────────────────────── */
  EV.Bus = {
    _h: {},
    on(e, f) { (this._h[e] = this._h[e] || []).push(f); },
    emit(e, p) { (this._h[e] || []).forEach((f) => { try { f(p); } catch (x) { console.error(x); } }); },
  };

  /* ── Адаптер LocalStorage (заменяемый) ─────────────────── */
  const LocalAdapter = {
    load() { try { const raw = localStorage.getItem(C.DB_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } },
    save(db) { try { localStorage.setItem(C.DB_KEY, JSON.stringify(db)); return true; } catch (e) { console.warn('storage:', e); return false; } },
    clear() { try { localStorage.removeItem(C.DB_KEY); } catch (e) {} },
  };

  let db = null;
  const NO_EVENT_SCOPE = new Set(['events', 'vehicles', 'drivers', 'escorts', 'users', 'audit']);
  const NO_AUDIT = new Set(['notifications', 'audit']);
  const PREFIX = { events: 'ev', delegations: 'dl', guests: 'g', bookings: 'b', hotelRequests: 'rq', meetings: 'm', departures: 'dp', vehicles: 'v', drivers: 'd', transfers: 't', escorts: 's', routes: 'r', excursions: 'x', meals: 'ml', vipPlans: 'vp', tasks: 'tk', notifications: 'n', quality: 'q', audit: 'au', users: 'u' };

  const tbl = (e) => db.tables[e];
  const persist = () => LocalAdapter.save(db);
  const clean = (e, rec) => { const c = U.clone(rec); if (e === 'users') delete c.password; return EV.Perm.sanitize(e, c); };

  function labelOf(entity, rec) {
    const g = (id) => { const x = tbl('guests').find((y) => y.id === id); return x ? x.fullName : ''; };
    switch (entity) {
      case 'events': case 'delegations': case 'routes': case 'excursions': return U.tx(rec.name);
      case 'guests': return rec.fullName;
      case 'bookings': { const h = EV.Hotels && EV.Hotels.get(rec.hotelId); return [g(rec.guestId), h ? h.name : rec.hotelId].filter(Boolean).join(' · '); }
      case 'meetings': case 'departures': return g(rec.guestId);
      case 'transfers': return (rec.fromText || rec.fromRef || '') + ' → ' + (rec.toText || rec.toRef || '');
      case 'vehicles': return rec.make + ' ' + rec.plate;
      case 'drivers': case 'escorts': return rec.fullName;
      case 'users': return rec.name;
      case 'meals': return rec.kind + ' ' + rec.date;
      case 'tasks': return rec.title || rec.titleKey || rec.id;
      default: return rec.id;
    }
  }

  function writeAudit(action, entity, rec, diff, meta) {
    if (NO_AUDIT.has(entity) || meta.silent) return;
    const u = EV.Auth && EV.Auth.current();
    tbl('audit').push({
      id: U.uid('au'), ts: U.nowISO(), userId: u ? u.id : null, userName: u ? u.name : 'guest', role: u ? u.role : 'public',
      action: meta.action || action, entity, entityId: rec.id, eventId: entity === 'events' ? rec.id : rec.eventId || null,
      label: labelOf(entity, rec), diff: diff || [], note: meta.note || '',
    });
    if (tbl('audit').length > 3000) tbl('audit').splice(0, tbl('audit').length - 3000);
  }
  function logAction(action, note) {
    const u = EV.Auth && EV.Auth.current();
    tbl('audit').push({ id: U.uid('au'), ts: U.nowISO(), userId: u ? u.id : null, userName: u ? u.name : '—', role: u ? u.role : '', action, entity: 'system', entityId: '', eventId: null, label: '', diff: [], note: note || '' });
    persist();
  }

  function assertWritable(entity, rec, meta) {
    if (meta.allowArchived) return;
    const evId = entity === 'events' ? rec.id : rec.eventId;
    if (!evId) return;
    const ev = tbl('events').find((e) => e.id === evId);
    if (ev && ev.status === 'archive') throw new EV.Perm.Denied('archived');
  }

  function diffOf(before, patch) {
    const out = [];
    Object.keys(patch).forEach((k) => {
      if (k === 'updatedAt') return;
      if (JSON.stringify(before[k]) !== JSON.stringify(patch[k])) out.push({ f: k, from: before[k] === undefined ? null : before[k], to: patch[k] });
    });
    return out;
  }

  const Data = (EV.Data = {
    adapter: LocalAdapter,
    init() {
      let loaded = LocalAdapter.load();
      if (!loaded || loaded.v !== EV.Seed.VERSION || !loaded.tables) loaded = EV.Seed.build();
      db = loaded;
      persist();
      // синхронизация между вкладками
      window.addEventListener('storage', (e) => {
        if (e.key === C.DB_KEY && e.newValue) { try { db = JSON.parse(e.newValue); EV.Bus.emit('data', { entity: '*', op: 'sync' }); } catch (x) {} }
      });
    },
    __db() { return db; },

    async list(entity, opts) {
      opts = opts || {};
      let l = tbl(entity).slice();
      if (opts.eventId && !NO_EVENT_SCOPE.has(entity)) l = l.filter((r) => r.eventId === opts.eventId);
      if (!opts.raw) l = EV.Perm.filter(entity, l, db);
      return l.map((r) => clean(entity, r));
    },
    async get(entity, id) {
      const r = tbl(entity).find((x) => x.id === id);
      if (!r) return null;
      const visible = EV.Perm.filter(entity, [r], db);
      return visible.length ? clean(entity, r) : null;
    },

    async create(entity, rec, meta) {
      meta = meta || {};
      rec = Object.assign({}, rec);
      rec.id = rec.id || U.uid(PREFIX[entity] || 'id');
      const user = EV.Auth && EV.Auth.current();
      if (!meta.system) {
        const chk = EV.Perm.canWrite(entity, 'create', rec, null, db, user);
        if (!chk.ok) throw new EV.Perm.Denied(chk.reason);
      }
      assertWritable(entity, rec, meta);
      if (!rec.createdAt) rec.createdAt = U.nowISO();
      tbl(entity).push(rec);
      writeAudit('create', entity, rec, [], meta);
      persist();
      EV.Bus.emit('data', { entity, op: 'create', id: rec.id });
      return clean(entity, rec);
    },

    async update(entity, id, patch, meta) {
      meta = meta || {};
      const rec = tbl(entity).find((x) => x.id === id);
      if (!rec) throw new Error('not found: ' + entity + '/' + id);
      const user = EV.Auth && EV.Auth.current();
      patch = Object.assign({}, patch);
      if (!meta.system) {
        const chk = EV.Perm.canWrite(entity, 'update', rec, patch, db, user);
        if (!chk.ok) throw new EV.Perm.Denied(chk.reason);
        patch = chk.patch;
      }
      assertWritable(entity, rec, meta);
      const diff = diffOf(rec, patch);
      if (!diff.length && entity !== 'notifications') return clean(entity, rec);
      Object.assign(rec, patch, { updatedAt: U.nowISO() });
      writeAudit(entity === 'events' && 'status' in patch ? 'status' : 'update', entity, rec, diff, meta);
      persist();
      EV.Bus.emit('data', { entity, op: 'update', id });
      return clean(entity, rec);
    },

    async remove(entity, id, meta) {
      meta = meta || {};
      const idx = tbl(entity).findIndex((x) => x.id === id);
      if (idx < 0) return false;
      const rec = tbl(entity)[idx];
      const user = EV.Auth && EV.Auth.current();
      if (!meta.system) {
        const chk = EV.Perm.canWrite(entity, 'delete', rec, null, db, user);
        if (!chk.ok) throw new EV.Perm.Denied(chk.reason);
      }
      assertWritable(entity, rec, meta);
      tbl(entity).splice(idx, 1);
      if (entity === 'events') {
        Object.keys(db.tables).forEach((t) => { if (!NO_EVENT_SCOPE.has(t)) db.tables[t] = db.tables[t].filter((r) => r.eventId !== id); });
      }
      writeAudit('delete', entity, rec, [], meta);
      persist();
      EV.Bus.emit('data', { entity, op: 'delete', id });
      return true;
    },

    /** Публичная проекция справочников для отображения ссылок между сущностями
        (имя/телефон/номер машины) — без персональных данных гостей. */
    directory() {
      const map = (arr, f) => arr.reduce((m, x) => { m[x.id] = f(x); return m; }, {});
      return {
        users: map(tbl('users'), (u) => ({ name: u.name, phone: u.phone, role: u.role, position: u.position, hotelId: u.hotelId })),
        drivers: map(tbl('drivers'), (d) => ({ name: d.fullName, phone: d.phone })),
        escorts: map(tbl('escorts'), (e) => ({ name: e.fullName, phone: e.phone, languages: e.languages, position: e.position })),
        vehicles: map(tbl('vehicles'), (v) => ({ make: v.make, plate: v.plate, category: v.category, capacity: v.capacity, driverId: v.driverId, reserve: v.reserve })),
        delegations: map(tbl('delegations'), (d) => ({ name: d.name, country: d.country, vip: d.vip, eventId: d.eventId, escortId: d.escortId })),
        events: map(tbl('events'), (e) => ({ name: e.name, status: e.status, responsibleId: e.responsibleId })),
      };
    },

    /* ── Настройки ─────────────────────────────────────────── */
    settings() { return U.clone(db.settings); },
    async setSettings(patch) {
      if (!EV.Perm.can('settings.edit') && !EV.Perm.can('event.dictionary')) throw new EV.Perm.Denied('settings');
      Object.assign(db.settings, patch);
      persist();
      EV.Bus.emit('data', { entity: 'settings', op: 'update' });
    },
    async addEventType(rec) {
      if (!EV.Perm.can('event.dictionary')) throw new EV.Perm.Denied('event.dictionary');
      const id = rec.id || U.slug(rec.en || rec.ru || rec.uz) || U.uid('type');
      if (db.settings.eventTypes.some((t) => t.id === id)) return id;
      db.settings.eventTypes.push({ id, ru: rec.ru || rec.en, uz: rec.uz || rec.en || rec.ru, en: rec.en || rec.ru });
      logAction('dictionary', 'event type: ' + id);
      persist();
      EV.Bus.emit('data', { entity: 'settings', op: 'update' });
      return id;
    },

    /* ── Журнал системных действий (вход, экспорт, резервные копии) ── */
    log: logAction,

    /* ── Резервное копирование (демо: JSON) ────────────────── */
    exportAll() {
      if (!EV.Perm.can('backup')) throw new EV.Perm.Denied('backup');
      logAction('backup_export', '');
      return JSON.stringify({ exportedAt: U.nowISO(), app: 'events', ...db }, null, 2);
    },
    importAll(text) {
      if (!EV.Perm.can('backup')) throw new EV.Perm.Denied('backup');
      const o = JSON.parse(text);
      if (!o || !o.tables || typeof o.v !== 'number') throw new Error('invalid backup');
      Object.keys(db.tables).forEach((k) => { if (!Array.isArray(o.tables[k])) o.tables[k] = []; });
      db = { v: o.v, settings: o.settings || db.settings, tables: o.tables };
      logAction('backup_import', '');
      persist();
      EV.Bus.emit('data', { entity: '*', op: 'import' });
    },
    reset() {
      if (!EV.Perm.can('backup')) throw new EV.Perm.Denied('backup');
      db = EV.Seed.build();
      logAction('reset_demo', '');
      persist();
      EV.Bus.emit('data', { entity: '*', op: 'import' });
    },

    nextNumber(entity, prefix) {
      const n = tbl(entity).length + 1;
      return prefix + '-' + new Date().getFullYear() + '-' + String(n).padStart(3, '0');
    },
  });
})();
