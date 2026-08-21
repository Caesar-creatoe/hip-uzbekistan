/* ============================================================
   QUALITY.JS — KQI Interactive Checklist + Rating Table
   Hotel Investment Portfolio · Uzbekistan
   ============================================================ */
'use strict';

/* ── Данные критериев по блокам ─────────────────────────────── */
const KQI_CRITERIA = {
  infra: [
    { id: 'i1', text: 'Номерной фонд соответствует категории ★ (площадь, мебель, оснащение)', hint: 'Мин. 16 м² для 3★, 25 м² для 4★, 40+ м² для 5★' },
    { id: 'i2', text: 'Лобби, ресепшн: зона ожидания оборудована, освещение соответствует стандарту', hint: 'Высота потолка, материалы отделки, климат-контроль' },
    { id: 'i3', text: 'Ресторан / завтрак: наличие F&B точки с меню категории ★', hint: 'Для 4–5★ — полноценный ресторан и лаунж' },
    { id: 'i4', text: 'Конференц-зал / переговорная комната', hint: 'Обязательно для MICE / Business сегмента' },
    { id: 'i5', text: 'Парковка или сервис valet', hint: 'Охраняемая парковка или контракт с ближайшей' },
    { id: 'i6', text: 'Спа / фитнес-центр (для 4–5★)', hint: 'Тренажёрный зал, сауна, бассейн' },
    { id: 'i7', text: 'Состояние фасада и прилегающей территории', hint: 'Отсутствие видимых повреждений, чистота' },
    { id: 'i8', text: 'Лифты: количество, исправность, доступность', hint: '1 лифт на 50+ номеров (4–5★)' },
  ],
  service: [
    { id: 's1', text: 'Время регистрации/выселения: check-in ≤ 10 мин, check-out ≤ 5 мин', hint: 'Измеряется при аудите методом тайного покупателя' },
    { id: 's2', text: 'Чистота номеров: ежедневная уборка, стандарт смены белья', hint: 'Ежедневная уборка — обязательно для 4–5★' },
    { id: 's3', text: 'Персонал: форменная одежда, знание иностранных языков', hint: 'Русский + английский — минимум для 3★; + дополнительный язык для 4–5★' },
    { id: 's4', text: 'Guest Satisfaction Score (GSS) ≥ 80%', hint: 'По данным Google, Booking.com, TripAdvisor' },
    { id: 's5', text: 'Служба консьержа / гостевых отношений', hint: 'Обязательно для 4–5★' },
    { id: 's6', text: 'Room Service: наличие и время работы', hint: '24/7 для 5★; 07:00–23:00 для 4★' },
    { id: 's7', text: 'Отклик на жалобы: время ответа ≤ 2 часа', hint: 'Официальный канал жалоб и учёт обращений' },
  ],
  safety: [
    { id: 'sf1', text: 'Наличие действующего заключения пожарной инспекции', hint: 'Дата последней проверки, наличие акта' },
    { id: 'sf2', text: 'Система пожаротушения и оповещения — исправность', hint: 'Спринклеры, огнетушители, эвакуационные схемы' },
    { id: 'sf3', text: 'Санитарно-эпидемиологическое заключение', hint: 'Действующий СЭС-сертификат' },
    { id: 'sf4', text: 'Система видеонаблюдения на входе и общих зонах', hint: 'CCTV в публичных зонах — обязательно для 4–5★' },
    { id: 'sf5', text: 'Безопасность данных гостей: соответствие GDPR / PDPL', hint: 'Шифрование PII, политика хранения данных' },
    { id: 'sf6', text: 'Аптечка первой помощи + обученный персонал', hint: 'Сертификат первой помощи у дежурного' },
  ],
  financial: [
    { id: 'f1', text: 'ADR в рыночном диапазоне для категории ★ и региона', hint: 'Для 5★ Ташкент: ADR ≥ $120; 4★: ≥ $80' },
    { id: 'f2', text: 'Occupancy ≥ 55% (off-peak) / ≥ 75% (peak)', hint: 'По данным PMS за последние 12 месяцев' },
    { id: 'f3', text: 'Ведение управленческого учёта по стандарту USALI', hint: 'P&L с разбивкой Rooms, F&B, Ancillary, Overhead' },
    { id: 'f4', text: 'Наличие финансовой отчётности за последние 3 года', hint: 'Аудированная отчётность по МСФО приветствуется' },
    { id: 'f5', text: 'GOP Margin ≥ 25% (для 4–5★)', hint: 'Gross Operating Profit / Total Revenue' },
  ],
  digital: [
    { id: 'd1', text: 'Объект представлен на Booking.com, Expedia, Airbnb', hint: 'Актуальный профиль с фото и отзывами' },
    { id: 'd2', text: 'Собственный сайт с функцией онлайн-бронирования', hint: 'Бронирование без посредника — прямой канал' },
    { id: 'd3', text: 'PMS (Property Management System) — наличие', hint: 'Opera, Fidelio, HKTS или иная сертифицированная PMS' },
    { id: 'd4', text: 'Wi-Fi во всех зонах (скорость ≥ 50 Мбит/с в номерах)', hint: 'Обязательно для 4–5★; проверяется speed test' },
    { id: 'd5', text: 'CRM или история гостей (returning guest recognition)', hint: 'Программа лояльности или ручная база постоянных гостей' },
    { id: 'd6', text: 'Цифровой check-in / мобильный ключ (для 5★)', hint: 'App-based или QR-code ключ' },
  ],
};

/* Веса блоков */
const BLOCK_WEIGHTS = { infra: 0.20, service: 0.20, safety: 0.15, financial: 0.15, digital: 0.10 };
const BLOCK_LABELS  = { infra: 'Инфраструктура', service: 'Сервис', safety: 'Безопасность', financial: 'Финансы', digital: 'Цифровизация' };

/* Хранение ответов: { criterionId: 1 | 0.5 | 0 } */
const answers = {};

/* ── Инициализация чек-листа ─────────────────────────────── */
function initChecklist() {
  Object.entries(KQI_CRITERIA).forEach(([blockKey, criteria]) => {
    const listEl = document.getElementById(`q-criteria-${blockKey}`);
    if (!listEl) return;

    criteria.forEach(c => {
      const row = document.createElement('div');
      row.className = 'q-criterion-row';
      row.dataset.id = c.id;
      row.dataset.block = blockKey;
      row.innerHTML = `
        <div class="q-criterion-text">
          ${c.text}
          ${c.hint ? `<span class="q-criterion-hint">${c.hint}</span>` : ''}
        </div>
        <div class="q-criterion-options" role="group" aria-label="Оценка">
          <button class="q-option-btn" data-val="1"    data-id="${c.id}" aria-label="Соответствует">✓ Да</button>
          <button class="q-option-btn" data-val="0.5"  data-id="${c.id}" aria-label="Частично">~ Частично</button>
          <button class="q-option-btn" data-val="0"    data-id="${c.id}" aria-label="Не соответствует">✗ Нет</button>
        </div>`;
      listEl.appendChild(row);
    });
  });

  // Delegate click on all option buttons
  document.getElementById('q-checklist-blocks').addEventListener('click', e => {
    const btn = e.target.closest('.q-option-btn');
    if (!btn) return;
    const id  = btn.dataset.id;
    const val = parseFloat(btn.dataset.val);
    const row = btn.closest('.q-criterion-row');

    // Toggle selection style
    row.querySelectorAll('.q-option-btn').forEach(b => {
      b.classList.remove('selected-yes', 'selected-partial', 'selected-no');
    });
    if (val === 1)   btn.classList.add('selected-yes');
    if (val === 0.5) btn.classList.add('selected-partial');
    if (val === 0)   btn.classList.add('selected-no');

    answers[id] = val;
    updateScore();
  });
}

/* ── Accordion ───────────────────────────────────────────── */
function initAccordion() {
  document.querySelectorAll('.q-check-block-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const bodyId   = btn.id.replace('-btn', '-body');
      const body     = document.getElementById(bodyId);
      if (!body) return;

      btn.setAttribute('aria-expanded', !expanded);
      body.style.display = expanded ? 'none' : 'block';
    });
  });
}

/* ── Score calculation ───────────────────────────────────── */
function updateScore() {
  const totalCriteria = Object.values(KQI_CRITERIA).flat().length;
  const answered = Object.keys(answers).length;

  // Progress
  const pct = Math.round((answered / totalCriteria) * 100);
  const progressBar = document.getElementById('q-progress-bar');
  const progressPct = document.getElementById('q-progress-pct');
  const answeredCount = document.getElementById('q-answered-count');
  if (progressBar) { progressBar.style.width = pct + '%'; progressBar.setAttribute('aria-valuenow', pct); }
  if (progressPct) progressPct.textContent = pct + '%';
  if (answeredCount) answeredCount.textContent = answered;

  // Block scores
  const blockScores = {};
  Object.entries(KQI_CRITERIA).forEach(([block, criteria]) => {
    const total = criteria.length;
    const sum   = criteria.reduce((acc, c) => acc + (answers[c.id] ?? 0), 0);
    blockScores[block] = total > 0 ? (sum / total) * 100 : 0;

    // Update block score display
    const scoreEl = document.getElementById(`q-score-${block}`);
    if (scoreEl) {
      const got = criteria.filter(c => answers[c.id] !== undefined).length;
      scoreEl.textContent = `${Math.round(blockScores[block])}% (${got}/${total})`;
    }
  });

  // Weighted total
  let weightedSum = 0;
  let totalWeight = 0;
  Object.entries(BLOCK_WEIGHTS).forEach(([block, w]) => {
    if (blockScores[block] !== undefined) {
      weightedSum += blockScores[block] * w;
      totalWeight += w;
    }
  });
  const qiScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  // Update hero ring
  const scoreNum  = document.getElementById('q-score-num');
  const resultNum = document.getElementById('q-result-num');
  const arc = document.getElementById('q-score-arc');
  if (scoreNum)  scoreNum.textContent  = qiScore;
  if (resultNum) resultNum.textContent = qiScore;
  if (arc) {
    const circumference = 2 * Math.PI * 52;
    arc.style.strokeDashoffset = circumference - (circumference * qiScore / 100);
    arc.style.stroke = qiScore >= 80 ? '#4dd68a' : qiScore >= 60 ? '#1E6F7C' : qiScore >= 40 ? '#e6c040' : '#e0706a';
  }

  // Grade
  const grade = qiScore >= 90 ? { code: 'A+', label: 'Превосходно' }
              : qiScore >= 80 ? { code: 'A',  label: 'Отлично' }
              : qiScore >= 70 ? { code: 'B+', label: 'Хорошо' }
              : qiScore >= 60 ? { code: 'B',  label: 'Удовлетворительно' }
              : qiScore >= 40 ? { code: 'C',  label: 'Требует улучшений' }
              : answered > 0  ? { code: 'D',  label: 'Не соответствует стандарту' }
              : { code: 'Н/Д', label: 'Начните оценку' };

  const gradeCls = grade.code.startsWith('A') ? 'A' : grade.code.startsWith('B') ? 'B' : grade.code.startsWith('C') ? 'C' : grade.code === 'Н/Д' ? 'nd' : 'D';
  ['q-score-grade', 'q-result-grade'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<span class="q-grade-badge q-grade-badge--${gradeCls}">${grade.code}</span><span class="q-grade-text">${grade.label}</span>`;
  });

  // Result breakdown
  const breakdownEl = document.getElementById('q-result-breakdown');
  if (breakdownEl) {
    let html = '<h4 class="q-result-breakdown-title">Разбивка по блокам:</h4>';
    Object.entries(BLOCK_WEIGHTS).forEach(([block, w]) => {
      const s = Math.round(blockScores[block] || 0);
      html += `<div class="q-breakdown-bar">
        <span class="q-breakdown-label">${BLOCK_LABELS[block]}</span>
        <div class="q-breakdown-track"><div class="q-breakdown-fill" style="width:${s}%"></div></div>
        <span class="q-breakdown-pct">${s}%</span>
      </div>`;
    });
    breakdownEl.innerHTML = html;
  }
}

/* ── Rating Table ────────────────────────────────────────── */
const RATING_DATA = [
  { rank: 1, name: 'Grand Tashkent 5★ (Hyatt)', addr: 'ул. Навои, 1, Ташкент', region: 'tashkent', stars: 5, score: 94, date: '2026-03-15' },
  { rank: 2, name: 'Wyndham Tashkent', addr: 'пр. Мустакиллик, 7, Ташкент', region: 'tashkent', stars: 5, score: 91, date: '2026-04-02' },
  { rank: 3, name: 'Samarkand Palace Hotel', addr: 'ул. Регистан, 3, Самарканд', region: 'samarkand', stars: 5, score: 89, date: '2026-02-28' },
  { rank: 4, name: 'Hilton Tashkent City', addr: 'Tashkent City Mall, Ташкент', region: 'tashkent', stars: 5, score: 88, date: '2026-03-22' },
  { rank: 5, name: 'Khiva Palace Heritage', addr: 'Ичан-Кала, Хива', region: 'khiva', stars: 4, score: 86, date: '2026-01-20' },
  { rank: 6, name: 'Bukhara Royal Hotel', addr: 'ул. Накшбанда, 12, Бухара', region: 'bukhara', stars: 4, score: 84, date: '2026-02-10' },
  { rank: 7, name: 'Hampton Inn Tashkent', addr: 'ул. Амира Тимура, 108', region: 'tashkent', stars: 4, score: 82, date: '2026-04-18' },
  { rank: 8, name: 'Millennium Hotel Samarkand', addr: 'пр. Шахрисабз, 21', region: 'samarkand', stars: 4, score: 79, date: '2026-03-05' },
  { rank: 9, name: 'Ichan-Kala Guest House', addr: 'ул. Пахлавана Махмуда, 8, Хива', region: 'khiva', stars: 3, score: 74, date: '2026-01-30' },
  { rank: 10, name: 'Bukhara City Hotel', addr: 'ул. Муллакандова, 5, Бухара', region: 'bukhara', stars: 3, score: 71, date: '2026-02-22' },
];

function gradeFromScore(s) {
  if (s >= 90) return { code: 'A+', cls: 'A' };
  if (s >= 80) return { code: 'A',  cls: 'A' };
  if (s >= 70) return { code: 'B+', cls: 'B' };
  if (s >= 60) return { code: 'B',  cls: 'B' };
  if (s >= 40) return { code: 'C',  cls: 'C' };
  return { code: 'D', cls: 'D' };
}

function renderRatingTable(data) {
  const tbody = document.getElementById('q-rating-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  data.forEach((h, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
    const g = gradeFromScore(h.score);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${medal ? `<span class="q-rank-medal">${medal}</span>` : `<span class="q-rank-num">${h.rank}</span>`}</td>
      <td><span class="q-hotel-name">${h.name}</span><span class="q-hotel-addr">${h.addr}</span></td>
      <td>${h.region === 'tashkent' ? 'Ташкент' : h.region === 'samarkand' ? 'Самарканд' : h.region === 'bukhara' ? 'Бухара' : 'Хива'}</td>
      <td>${'★'.repeat(h.stars)}</td>
      <td class="q-score-cell">${h.score}</td>
      <td><span class="q-grade-badge q-grade-badge--${g.cls}">${g.code}</span></td>
      <td style="font-size:12px;color:var(--color-ink-muted)">${h.date}</td>`;
    tbody.appendChild(tr);
  });
}

function initRatingTable() {
  renderRatingTable(RATING_DATA);

  const regionFilter = document.getElementById('q-region-filter');
  const starFilter   = document.getElementById('q-star-filter');

  function applyFilters() {
    const region = regionFilter?.value || 'all';
    const stars  = starFilter?.value  || 'all';
    const filtered = RATING_DATA.filter(h =>
      (region === 'all' || h.region === region) &&
      (stars  === 'all' || h.stars  === parseInt(stars))
    );
    renderRatingTable(filtered);
  }

  regionFilter?.addEventListener('change', applyFilters);
  starFilter?.addEventListener('change', applyFilters);
}

/* ── Reset ───────────────────────────────────────────────── */
function initReset() {
  document.getElementById('q-reset-form')?.addEventListener('click', () => {
    Object.keys(answers).forEach(k => delete answers[k]);
    document.querySelectorAll('.q-option-btn').forEach(btn =>
      btn.classList.remove('selected-yes', 'selected-partial', 'selected-no')
    );
    document.querySelectorAll('.q-check-block-score').forEach(el => el.textContent = '0%');
    updateScore();
  });
}

/* ── Boot ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initChecklist();
  initAccordion();
  updateScore();
  initRatingTable();
  initReset();
});
