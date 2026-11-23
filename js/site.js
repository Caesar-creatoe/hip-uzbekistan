/* ============================================================
   SITE.JS — общие функции обновлённого сайта Silk Route Invest
   1) Заявки: любая форма с data-lead="invest|docs|list|question"
      отправляется в /api/lead (Telegram и/или почта).
      Если каналы ещё не настроены или нет сети — посетителю
      предлагается отправить то же самое письмом, заявка не теряется.
   2) Модальное окно заявки: SRILead.open({ type, hotel }) или кнопки
      с атрибутом data-lead-open="invest|docs".
   3) Фото к заявке: сжатие в браузере до 1600 px, до 8 штук.
   4) Плавное появление блоков и анимация диаграмм.
   ============================================================ */
(function () {
  'use strict';

  /* Куда писать, если онлайн-отправка недоступна */
  const CONTACT = { email: 'info@uzbektourism.uz' };
  const MAX_PHOTOS = 8;
  const MAX_TOTAL = 3.6 * 1024 * 1024; // лимит запроса Vercel — 4,5 МБ

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ── Фото: сжатие ─────────────────────────────────────── */
  function compress(file, max = 1600, q = 0.8) {
    return new Promise((resolve) => {
      if (!/^image\//.test(file.type)) return resolve(null);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth, h = img.naturalHeight;
        const k = Math.min(1, max / Math.max(w, h));
        w = Math.round(w * k); h = Math.round(h * k);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve({ name: file.name.replace(/\.[^.]+$/, '') + '.jpg', data: c.toDataURL('image/jpeg', q) });
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  function bindPhotos(form) {
    const input = $('input[type="file"][data-photos]', form);
    if (!input) return null;
    const drop = input.closest('.pg-drop');
    const thumbs = $('.pg-thumbs', form);
    const list = [];
    const render = () => {
      thumbs.innerHTML = list.map((p, i) => `<div class="pg-thumb"><img src="${p.data}" alt=""><button type="button" data-rm="${i}" aria-label="Убрать фото">×</button></div>`).join('');
    };
    thumbs.addEventListener('click', (e) => {
      const b = e.target.closest('[data-rm]');
      if (b) { list.splice(+b.dataset.rm, 1); render(); }
    });
    input.addEventListener('change', async () => {
      const files = [...input.files].slice(0, MAX_PHOTOS - list.length);
      for (const f of files) { const p = await compress(f); if (p) list.push(p); }
      // держим общий объём в пределах лимита: при необходимости ужимаем сильнее
      let total = list.reduce((s, p) => s + p.data.length, 0);
      if (total > MAX_TOTAL) {
        for (let i = 0; i < list.length; i++) {
          const img = await new Promise((r) => { const im = new Image(); im.onload = () => r(im); im.src = list[i].data; });
          const c = document.createElement('canvas'); const k = Math.min(1, 1200 / Math.max(img.width, img.height));
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          list[i].data = c.toDataURL('image/jpeg', 0.72);
        }
      }
      input.value = '';
      render();
    });
    if (drop) {
      ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, () => drop.classList.add('is-over')));
      ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, () => drop.classList.remove('is-over')));
    }
    return list;
  }

  /* ── Отправка ─────────────────────────────────────────── */
  function collect(form) {
    const fields = {};
    $$('input, select, textarea', form).forEach((el) => {
      if (!el.name || el.type === 'file' || el.name === 'website') return;
      if ((el.type === 'radio' || el.type === 'checkbox') && !el.checked) return;
      const v = String(el.value || '').trim();
      if (!v) return;
      fields[el.name] = fields[el.name] ? fields[el.name] + ', ' + v : v;
    });
    return fields;
  }

  function validate(form) {
    let ok = true, first = null;
    $$('.pg-field', form).forEach((f) => f.classList.remove('is-invalid'));
    $$('[required]', form).forEach((el) => {
      const bad = el.type === 'radio' ? !$$(`[name="${el.name}"]`, form).some((r) => r.checked) : !String(el.value || '').trim();
      if (bad) { ok = false; const f = el.closest('.pg-field'); if (f) f.classList.add('is-invalid'); first = first || el; }
    });
    const email = $('[name="email"]', form), phone = $('[name="phone"]', form);
    const ev = email && email.value.trim(), pv = phone && phone.value.trim();
    if (email && ev && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ev)) { ok = false; email.closest('.pg-field').classList.add('is-invalid'); first = first || email; }
    if (!ev && !pv) {
      ok = false;
      [email, phone].forEach((el) => el && el.closest('.pg-field').classList.add('is-invalid'));
      first = first || email || phone;
    }
    if (first) first.focus({ preventScroll: false });
    return ok;
  }

  function mailtoLink(type, fields, hotel) {
    const titles = { invest: 'Заявка инвестора', docs: 'Запрос документов', list: 'Размещение объекта', question: 'Вопрос' };
    const body = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n') + (hotel ? `\nОбъект: ${hotel}` : '');
    return `mailto:${CONTACT.email}?subject=${encodeURIComponent((titles[type] || 'Заявка') + (hotel ? ' — ' + hotel : ''))}&body=${encodeURIComponent(body)}`;
  }

  function bindForm(form) {
    if (form.__bound) return; form.__bound = true;
    const photos = bindPhotos(form);
    const status = $('.pg-form__status', form);
    const btn = $('[type="submit"]', form);
    form.addEventListener('input', (e) => { const f = e.target.closest('.pg-field'); if (f) f.classList.remove('is-invalid'); });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (status) { status.textContent = ''; status.className = 'pg-form__status'; }
      if (!validate(form)) {
        if (status) { status.className = 'pg-form__status is-error'; status.textContent = 'Заполните отмеченные поля и укажите телефон или e-mail.'; }
        return;
      }
      const type = form.dataset.lead || 'question';
      const hotel = form.dataset.hotel || '';
      const fields = collect(form);
      const payload = {
        type, hotel, fields, page: location.href.split('#')[0],
        photos: photos ? photos.slice() : [],
        website: ($('[name="website"]', form) || {}).value || ''
      };
      const label = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Отправляем…'; }
      let ok = false;
      try {
        const r = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        ok = r.ok;
      } catch (err) { ok = false; }
      if (btn) { btn.disabled = false; btn.innerHTML = label; }
      if (ok) {
        form.classList.add('is-sent');
        const s = $('.pg-success', form); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (status) {
        status.className = 'pg-form__status is-error';
        status.innerHTML = `Онлайн-отправка сейчас недоступна. <a href="${esc(mailtoLink(type, fields, hotel))}">Отправьте заявку письмом</a> — текст уже заполнен${photos && photos.length ? ', фото приложите к письму' : ''}.`;
      }
    });
  }

  /* ── Модальное окно ───────────────────────────────────── */
  const MODAL_TEXT = {
    invest: { title: 'Заявка на объект', sub: 'Оставьте контакты — специалист платформы свяжется с вами, ответит на вопросы и организует показ.', btn: 'Отправить заявку' },
    docs: { title: 'Запросить документы', sub: 'Финансовую модель, документы на объект и данные о долге мы передаём после подписания соглашения о конфиденциальности (NDA).', btn: 'Запросить документы' },
    question: { title: 'Задать вопрос', sub: 'Напишите, что вас интересует, — ответим в течение рабочего дня.', btn: 'Отправить' }
  };
  let modal = null;
  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'lead-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'lead-modal-title');
    modal.innerHTML = `<div class="lead-modal__card sx-page" style="background:#FBF9F5">
      <button type="button" class="lead-modal__close" aria-label="Закрыть">×</button>
      <span class="pg-tag pg-tag--gold lead-modal__obj" hidden></span>
      <h2 id="lead-modal-title"></h2>
      <p class="lead-modal__sub"></p>
      <form class="pg-form" novalidate></form></div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('.lead-modal__close')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open')) close(); });
    return modal;
  }
  let lastFocus = null;
  function open(opts = {}) {
    const type = MODAL_TEXT[opts.type] ? opts.type : 'invest';
    const t = MODAL_TEXT[type];
    const m = ensureModal();
    lastFocus = document.activeElement;
    $('#lead-modal-title', m).textContent = opts.title || t.title;
    $('.lead-modal__sub', m).textContent = opts.sub || t.sub;
    const tag = $('.lead-modal__obj', m);
    tag.hidden = !opts.hotel; tag.textContent = opts.hotel || '';
    const old = $('form', m);
    const form = old.cloneNode(false);
    old.replaceWith(form);
    form.dataset.lead = type;
    form.dataset.hotel = opts.hotel || '';
    form.innerHTML = `
      <div class="pg-form__row">
        <label class="pg-field"><span>Имя <i>*</i></span><input name="name" autocomplete="name" required></label>
        <label class="pg-field"><span>Компания</span><input name="company" autocomplete="organization"></label>
      </div>
      <div class="pg-form__row">
        <label class="pg-field"><span>Телефон или WhatsApp</span><input name="phone" type="tel" autocomplete="tel" placeholder="+998 …"></label>
        <label class="pg-field"><span>E-mail</span><input name="email" type="email" autocomplete="email" placeholder="name@company.com"></label>
      </div>
      ${type === 'invest' ? `<div class="pg-field"><span>Что интересует</span><div class="pg-choice">
        ${['Покупка', 'Доля / соинвестирование', 'Аренда', 'Франшиза / управление', 'Пока изучаю'].map((v, i) => `<label><input type="radio" name="interest" value="${v}" ${i === 0 ? 'checked' : ''}><span>${v}</span></label>`).join('')}
      </div></div>` : ''}
      ${type === 'docs' ? `<label class="pg-field"><span>Страна</span><input name="country" autocomplete="country-name"></label>` : ''}
      <label class="pg-field"><span>Комментарий</span><textarea name="message" rows="3" placeholder="${type === 'docs' ? 'Какие документы нужны в первую очередь' : 'Вопросы, удобное время для звонка'}"></textarea></label>
      <input class="pg-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="pg-form__status" role="status" aria-live="polite"></div>
      <div class="pg-form__foot">
        <button type="submit" class="pg-btn pg-btn--dark">${t.btn}</button>
        <p class="pg-note">Укажите телефон или e-mail. Контакты получит только команда платформы.</p>
      </div>
      <div class="pg-success" role="status">
        <div class="pg-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
        <h3>Заявка отправлена</h3>
        <p>Спасибо! Мы свяжемся с вами в течение рабочего дня.</p>
      </div>`;
    bindForm(form);
    m.classList.add('is-open');
    document.documentElement.classList.add('lead-lock');
    setTimeout(() => { const f = $('input[name="name"]', form); if (f) f.focus(); }, 60);
  }
  function close() {
    if (!modal) return;
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('lead-lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  window.SRILead = { open, close, bindForm };

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lead-open]');
    if (!b) return;
    e.preventDefault();
    const nameEl = document.getElementById('passport-hotel-name');
    const hotel = b.dataset.hotel || window.SRI_CURRENT_HOTEL || (nameEl ? nameEl.textContent.replace(/\s+/g, ' ').trim() : '');
    open({ type: b.dataset.leadOpen, hotel });
  });

  /* ── Появление и диаграммы ────────────────────────────── */
  function reveal() {
    const els = $$('[data-reveal], .pg-bars');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => { e.classList.add('is-in'); e.classList.remove('is-hidden'); }); return; }
    const io = new IntersectionObserver((ent) => ent.forEach((x) => {
      if (!x.isIntersecting) return;
      x.target.classList.add('is-in'); x.target.classList.remove('is-hidden'); io.unobserve(x.target);
    }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((e) => { if (e.classList.contains('pg-bars')) e.classList.add('is-hidden'); io.observe(e); });
  }

  function init() {
    $$('form[data-lead]').forEach(bindForm);
    reveal();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
