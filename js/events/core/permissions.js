/* ============================================================
   EVENTS · core/permissions.js
   ЕДИНСТВЕННОЕ МЕСТО проверки прав (guard).
   Интерфейс и data-слой обращаются только сюда:
     Perm.canView(module) / canEdit(module) / can(action)   — видимость и действия
     Perm.filter(entity, list, db, user)                    — строковый доступ (RLS)
     Perm.sanitize(entity, rec, user)                       — маскирование ПДн
     Perm.canWrite(entity, op, rec, patch, db, user)        — запись (серверная проверка)
   При переходе на реальный бэкенд эти правила переносятся 1-в-1
   в middleware / политики PostgreSQL Row-Level Security.
   ============================================================ */
(function () {
  'use strict';
  const EV = (window.EV = window.EV || {});
  const C = EV.C;

  class Denied extends Error {
    constructor(reason) { super(reason || 'denied'); this.name = 'Denied'; this.reason = reason; }
  }

  const ENTITY_MODULE = {
    events: 'events', delegations: 'guests', guests: 'guests', bookings: 'booking', hotelRequests: 'booking',
    meetings: 'meeting', departures: 'departure', vehicles: 'transport', drivers: 'transport', transfers: 'transport',
    escorts: 'escort', routes: 'routes', excursions: 'excursions', meals: 'meals', vipPlans: 'vip', tasks: 'tasks',
    quality: 'quality', users: 'security',
  };

  const T = (db, n) => (db.tables && db.tables[n]) || [];

  const Perm = (EV.Perm = {
    Denied,
    user() { return EV.Auth ? EV.Auth.current() : null; },
    role(u) { u = u || this.user(); return u ? u.role : null; },

    canView(mod, u) { u = u || this.user(); return !!u && (C.PERMS.view[u.role] || []).includes(mod); },
    canEdit(mod, u) { u = u || this.user(); return !!u && (C.PERMS.edit[u.role] || []).includes(mod); },
    can(action, u) { u = u || this.user(); return !!u && (C.ACTIONS[action] || []).includes(u.role); },

    /** 'driver' | 'escort' | null — подтип роли «Водитель / Сопровождающий» */
    fieldKind(u) { u = u || this.user(); if (!u || u.role !== 'field') return null; return u.driverId ? 'driver' : 'escort'; },

    allowedModules(u) { u = u || this.user(); return C.MODULES.filter((m) => this.canView(m.id, u)); },
    home(u) { u = u || this.user(); const h = C.HOME[u.role]; return this.canView(h, u) ? h : (this.allowedModules(u)[0] || {}).id; },

    /* ── Строковый доступ ───────────────────────────────────── */
    scope(db, u) {
      // Предвычисленные множества для ролей с ограниченным доступом
      if (u.role === 'hotel') {
        const bk = T(db, 'bookings').filter((b) => b.hotelId === u.hotelId);
        const guestIds = new Set(bk.map((b) => b.guestId).filter(Boolean));
        const guests = T(db, 'guests').filter((g) => guestIds.has(g.id));
        return { bk, guestIds, delegIds: new Set(guests.map((g) => g.delegationId)), eventIds: new Set(bk.map((b) => b.eventId)) };
      }
      if (u.role === 'field') {
        const me = u.driverId || u.escortId;
        const isDriver = !!u.driverId;
        const mine = (r) => (isDriver ? r.driverId === me : r.escortId === me);
        const guestsAll = T(db, 'guests');
        const delegAll = T(db, 'delegations');
        const myDeleg = new Set(delegAll.filter((d) => !isDriver && d.escortId === me).map((d) => d.id));
        let guestIds = new Set();
        if (!isDriver) guestsAll.forEach((g) => { if (g.escortId === me || myDeleg.has(g.delegationId)) guestIds.add(g.id); });
        const meetings = T(db, 'meetings').filter((r) => mine(r) || guestIds.has(r.guestId));
        const departures = T(db, 'departures').filter((r) => mine(r) || guestIds.has(r.guestId));
        const transfers = T(db, 'transfers').filter((r) => mine(r) || (!isDriver && (r.guestIds || []).some((id) => guestIds.has(id))));
        [meetings, departures].forEach((a) => a.forEach((r) => guestIds.add(r.guestId)));
        transfers.forEach((t) => (t.guestIds || []).forEach((id) => guestIds.add(id)));
        const delegIds = new Set(guestsAll.filter((g) => guestIds.has(g.id)).map((g) => g.delegationId));
        myDeleg.forEach((d) => delegIds.add(d));
        const excursions = T(db, 'excursions').filter((x) => !isDriver && (x.escortIds || []).includes(me));
        const routes = T(db, 'routes').filter((r) => !isDriver && (r.escortId === me || (r.delegationIds || []).some((d) => delegIds.has(d))));
        const eventIds = new Set([...meetings, ...departures, ...transfers, ...excursions, ...routes].map((r) => r.eventId));
        T(db, 'tasks').filter((t) => t.assigneeId === u.id).forEach((t) => eventIds.add(t.eventId));
        return { me, isDriver, guestIds, delegIds, meetings, departures, transfers, excursions, routes, eventIds };
      }
      return null;
    },

    filter(entity, list, db, u) {
      u = u || this.user();
      if (!u) return [];
      if (entity === 'notifications') {
        return list.filter((n) => (n.forUsers || []).includes(u.id) ||
          ((n.forRoles || []).includes(u.role) && (!n.hotelId || n.hotelId === u.hotelId) && (u.role !== 'field' || !n.forUsers)));
      }
      if (entity === 'audit') return this.can('audit.view', u) ? list : [];
      if (entity === 'users') return this.can('users.manage', u) || this.can('audit.view', u) ? list : list.filter((x) => x.id === u.id);
      if (u.role !== 'hotel' && u.role !== 'field') return list;
      const sc = this.scope(db, u);
      const ids = (arr) => new Set(arr.map((x) => x.id));
      if (u.role === 'hotel') {
        switch (entity) {
          case 'bookings': return list.filter((b) => b.hotelId === u.hotelId);
          case 'hotelRequests': return list.filter((r) => r.hotelId === u.hotelId);
          case 'guests': return list.filter((g) => sc.guestIds.has(g.id));
          case 'delegations': return list.filter((d) => sc.delegIds.has(d.id));
          case 'events': return list.filter((e) => sc.eventIds.has(e.id));
          case 'tasks': return list.filter((t) => t.assigneeId === u.id);
          default: return [];
        }
      }
      // field
      switch (entity) {
        case 'meetings': { const s = ids(sc.meetings); return list.filter((r) => s.has(r.id)); }
        case 'departures': { const s = ids(sc.departures); return list.filter((r) => s.has(r.id)); }
        case 'transfers': { const s = ids(sc.transfers); return list.filter((r) => s.has(r.id)); }
        case 'excursions': { const s = ids(sc.excursions); return list.filter((r) => s.has(r.id)); }
        case 'routes': { const s = ids(sc.routes); return list.filter((r) => s.has(r.id)); }
        case 'guests': return list.filter((g) => sc.guestIds.has(g.id));
        case 'delegations': return list.filter((d) => sc.delegIds.has(d.id));
        case 'events': return list.filter((e) => sc.eventIds.has(e.id));
        case 'tasks': return list.filter((t) => t.assigneeId === u.id);
        case 'vehicles': { const vs = new Set(sc.transfers.map((t) => t.vehicleId).concat(sc.meetings.map((m) => m.vehicleId))); return list.filter((v) => vs.has(v.id) || (sc.isDriver && v.driverId === sc.me)); }
        case 'drivers': { const ds = new Set(sc.transfers.map((t) => t.driverId).concat(sc.meetings.map((m) => m.driverId), sc.departures.map((m) => m.driverId))); return list.filter((d) => d.id === sc.me || ds.has(d.id)); }
        case 'escorts': return list.filter((e) => e.id === sc.me || (!sc.isDriver ? false : sc.transfers.some((t) => t.escortId === e.id)));
        case 'bookings': return sc.isDriver ? [] : list.filter((b) => sc.guestIds.has(b.guestId));
        default: return [];
      }
    },

    /* ── Маскирование персональных данных ───────────────────── */
    sanitize(entity, rec, u) {
      u = u || this.user();
      if (!rec) return rec;
      if (entity === 'guests' && !this.can('passport.view', u)) {
        rec.passport = EV.U.maskPassport(rec.passport);
        rec.passportMasked = true;
      }
      return rec;
    },

    /* ── Проверка записи (аналог серверной авторизации) ─────── */
    canWrite(entity, op, rec, patch, db, u) {
      u = u || this.user();
      if (!u) {
        if (entity === 'quality' && op === 'create' && rec && rec.kind === 'feedback') return { ok: true, patch };
        return { ok: false, reason: 'auth' };
      }
      if (entity === 'notifications') return { ok: true, patch };           // отметка «прочитано» своих уведомлений
      if (entity === 'users') return { ok: this.can('users.manage', u), reason: 'users.manage', patch };
      const mod = ENTITY_MODULE[entity];
      if (!mod) return { ok: false, reason: 'entity' };
      if (!this.canEdit(mod, u)) return { ok: false, reason: 'module.edit', patch };

      let out = patch ? Object.assign({}, patch) : patch;
      if (entity === 'events') {
        if (op === 'create' && !this.can('event.create', u)) return { ok: false, reason: 'event.create' };
        if (op === 'update' && out && 'status' in out && !this.can('event.status', u)) return { ok: false, reason: 'event.status' };
        if (op === 'update' && out && !('status' in out) && !this.can('event.edit', u)) return { ok: false, reason: 'event.edit' };
        if (op === 'delete' && u.role !== 'admin') return { ok: false, reason: 'event.delete' };
      }
      if (entity === 'guests' && out && 'passport' in out && !this.can('passport.edit', u)) delete out.passport;
      if (entity === 'guests' && op === 'create' && rec && rec.passport && !this.can('passport.edit', u)) rec.passport = '';

      if (u.role === 'hotel') {
        const sc = this.scope(db, u);
        if (op !== 'update') return { ok: false, reason: 'hotel.readonly' };
        if (entity === 'bookings') {
          if (rec.hotelId !== u.hotelId) return { ok: false, reason: 'hotel.own' };
          const allowed = ['status', 'roomNo', 'roomType', 'hotelNote', 'confirmedAt', 'changeReason'];
          if (Object.keys(out).some((k) => !allowed.includes(k))) return { ok: false, reason: 'hotel.fields' };
          if ('status' in out && !['confirmed', 'changed'].includes(out.status)) return { ok: false, reason: 'hotel.status' };
        } else if (entity === 'guests') {
          if (!sc.guestIds.has(rec.id)) return { ok: false, reason: 'hotel.own' };
          const allowed = ['status', 'arrivedAt', 'checkedInAt', 'extraServices', 'wishes'];
          if (Object.keys(out).some((k) => !allowed.includes(k))) return { ok: false, reason: 'hotel.fields' };
        } else return { ok: false, reason: 'hotel.entity' };
      }

      if (u.role === 'field') {
        const sc = this.scope(db, u);
        if (op !== 'update') return { ok: false, reason: 'field.readonly' };
        const allowed = ['status', 'startedAt', 'dispatchedAt', 'departedAt', 'doneAt', 'metAt', 'arrivedAt', 'checkedInAt', 'note'];
        if (Object.keys(out).some((k) => !allowed.includes(k))) return { ok: false, reason: 'field.fields' };
        const own = (list) => list.some((x) => x.id === rec.id);
        if (entity === 'meetings' && !own(sc.meetings)) return { ok: false, reason: 'field.own' };
        else if (entity === 'transfers' && !own(sc.transfers)) return { ok: false, reason: 'field.own' };
        else if (entity === 'departures' && !own(sc.departures)) return { ok: false, reason: 'field.own' };
        else if (entity === 'excursions' && !own(sc.excursions)) return { ok: false, reason: 'field.own' };
        else if (entity === 'tasks' && rec.assigneeId !== u.id) return { ok: false, reason: 'field.own' };
        else if (!['meetings', 'transfers', 'departures', 'excursions', 'tasks'].includes(entity)) return { ok: false, reason: 'field.entity' };
      }
      return { ok: true, patch: out };
    },
  });
})();
