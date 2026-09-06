/* ============================================================
   QUALITY.JS — KQI Interactive Checklist + Rating Table
   Hotel Investment Portfolio · Uzbekistan
   Все 8 блоков · 80 критериев · Динамический расчёт
   ============================================================ */
'use strict';

/* ── Данные критериев по блокам (ровно 80 критериев) ───────── */
const KQI_CRITERIA = {
  // Блок 1: Физическая инфраструктура (12 критериев, вес 20%)
  infra: [
    { id: 'i1', text: 'Номерной фонд соответствует категории ★ (площадь, мебель, оснащение)', hint: 'Мин. 16 м² для 3★, 25 м² для 4★, 40+ м² для 5★' },
    { id: 'i2', text: 'Лобби, ресепшн: зона ожидания оборудована, освещение соответствует стандарту', hint: 'Высота потолка, материалы отделки, климат-контроль' },
    { id: 'i3', text: 'Ресторан / завтрак: наличие F&B точки с меню категории ★', hint: 'Для 4–5★ — полноценный ресторан и лаунж' },
    { id: 'i4', text: 'Конференц-зал / переговорная комната', hint: 'Обязательно для MICE / Business сегмента' },
    { id: 'i5', text: 'Парковка или сервис valet', hint: 'Охраняемая парковка или контракт с ближайшей' },
    { id: 'i6', text: 'Спа / фитнес-центр (для 4–5★)', hint: 'Тренажёрный зал, сауна, бассейн' },
    { id: 'i7', text: 'Состояние фасада и прилегающей территории', hint: 'Отсутствие видимых повреждений, чистота, вечерняя подсветка' },
    { id: 'i8', text: 'Лифты: исправность, скорость и пассажировместимость', hint: '1 лифт на каждые 50 номеров для высотных зданий' },
    { id: 'i9', text: 'Качество сантехнического оборудования и напор воды', hint: 'Бесперебойное горячее водоснабжение 24/7' },
    { id: 'i10', text: 'Центральная или мультизональная система климат-контроля (HVAC)', hint: 'Индивидуальное регулирование температуры в каждом номере' },
    { id: 'i11', text: 'Звукоизоляция номеров и межэтажных перекрытий', hint: 'Индекс звукоизоляции Rw ≥ 52 дБ' },
    { id: 'i12', text: 'Эргономика и дизайн интерьеров (Bedding standard)', hint: 'Ортопедические матрасы, гипоаллергенное постельное бельё' },
  ],

  // Блок 2: Стандарт сервиса (15 критериев, вес 25%)
  service: [
    { id: 's1', text: 'Время регистрации/выселения: check-in ≤ 10 мин, check-out ≤ 5 мин', hint: 'Измеряется при аудите методом тайного покупателя' },
    { id: 's2', text: 'Чистота номеров: ежедневная уборка, стандарт смены белья', hint: 'Ежедневная уборка — обязательно для 4–5★' },
    { id: 's3', text: 'Персонал: форменная одежда, знание иностранных языков', hint: 'Русский + английский — минимум для 3★; + доп. язык для 4–5★' },
    { id: 's4', text: 'Guest Satisfaction Score (GSS) ≥ 80%', hint: 'По данным Google, Booking.com, TripAdvisor' },
    { id: 's5', text: 'Служба консьержа / гостевых отношений', hint: 'Обязательно для 4–5★' },
    { id: 's6', text: 'Room Service: наличие и время работы', hint: '24/7 для 5★; 07:00–23:00 для 4★' },
    { id: 's7', text: 'Отклик на жалобы: время ответа ≤ 2 часа', hint: 'Официальный канал жалоб и учёт обращений' },
    { id: 's8', text: 'Услуги прачечной и химчистки (Laundry & Dry cleaning)', hint: 'Экспресс-сервис в течение 12 часов' },
    { id: 's9', text: 'Стандарты телефонного этикета и приветствия гостей', hint: 'Ответ до 3-го гудка, обращение по имени' },
    { id: 's10', text: 'Разнообразие меню завтрака (шведский стол)', hint: 'Халяль-позиции, вегетарианские и безглютеновые блюда' },
    { id: 's11', text: 'Сервис подготовки номера ко сну (Turndown service)', hint: 'Стандарт для категории 5★' },
    { id: 's12', text: 'Организация трансферов и транспортных услуг', hint: 'Встреча в аэропорту / на вокзале' },
    { id: 's13', text: 'Программа регулярного обучения и тренингов персонала', hint: 'Не менее 40 часов тренингов на сотрудника в год' },
    { id: 's14', text: 'Укомплектованность мини-бара и чайной станции', hint: 'Бесплатная бутилированная вода, чай, кофе ежедневно' },
    { id: 's15', text: 'Служба хранения багажа (Bellboy / Luggage room)', hint: 'Безопасная маркировка и круглосуточный приём' },
  ],

  // Блок 3: Безопасность & Compliance (10 критериев, вес 15%)
  safety: [
    { id: 'sf1', text: 'Наличие действующего заключения пожарной инспекции', hint: 'Дата последней проверки, наличие акта' },
    { id: 'sf2', text: 'Система пожаротушения и оповещения — исправность', hint: 'Спринклеры, огнетушители, эвакуационные схемы' },
    { id: 'sf3', text: 'Санитарно-эпидемиологическое заключение (СЭС)', hint: 'Действующий СЭС-сертификат на номерной фонд и кухню' },
    { id: 'sf4', text: 'Система видеонаблюдения на входе и общих зонах (CCTV)', hint: 'CCTV с хранением архива от 30 суток' },
    { id: 'sf5', text: 'Безопасность данных гостей: соответствие закону о персональных данных', hint: 'Шифрование PII, политика конфиденциальности' },
    { id: 'sf6', text: 'Аптечка первой помощи + обученный персонал', hint: 'Сертификат первой помощи у дежурного администратора' },
    { id: 'sf7', text: 'Круглосуточная лицензированная охрана и контроль доступа', hint: 'Пост охраны, шлагбаум, электронные ключ-карты' },
    { id: 'sf8', text: 'Резервные источники электро- и водоснабжения', hint: 'Дизель-генератор (ДГУ), аварийный резервуар воды' },
    { id: 'sf9', text: 'Сейфы в каждом номере и сейфовые ячейки на ресепшн', hint: 'Электронные индивидуальные сейфы для ценностей' },
    { id: 'sf10', text: 'План действий при ЧС и антитеррористическая защищённость', hint: 'Инструкции, регулярные тренировки эвакуации персонала' },
  ],

  // Блок 4: Финансовые стандарты (8 критериев, вес 10%)
  financial: [
    { id: 'f1', text: 'ADR в рыночном диапазоне для категории ★ и региона', hint: 'Для 5★ Ташкент: ADR ≥ $120; 4★: ≥ $80' },
    { id: 'f2', text: 'Occupancy ≥ 55% (off-peak) / ≥ 75% (peak)', hint: 'По данным PMS за последние 12 месяцев' },
    { id: 'f3', text: 'Ведение управленческого учёта по стандарту USALI', hint: 'P&L с разбивкой Rooms, F&B, Ancillary, Overhead' },
    { id: 'f4', text: 'Наличие аудированной финансовой отчётности за последние 3 года', hint: 'Аудит Big 4 или национальных аудиторов' },
    { id: 'f5', text: 'GOP Margin ≥ 25% (для 4–5★)', hint: 'Gross Operating Profit / Total Revenue' },
    { id: 'f6', text: 'Прозрачная структура затрат и контроль энергопотребления', hint: 'Статьи затрат на номер (Cost per occupied room)' },
    { id: 'f7', text: 'Отсутствие просроченной налоговой и кредиторской задолженности', hint: 'Справка налоговых органов об отсутствии задолженностей' },
    { id: 'f8', text: 'Эффективная система ценообразования (Revenue Management)', hint: 'Динамическое ценообразование в зависимости от загрузки' },
  ],

  // Блок 5: Цифровизация & IT (10 критериев, вес 10%)
  digital: [
    { id: 'd1', text: 'Объект представлен на ключевых OTA (Booking, Expedia, Trip.com)', hint: 'Актуальный контент с высоким рейтингом' },
    { id: 'd2', text: 'Собственный сайт с модулем прямого бронирования (Direct Booking)', hint: 'Бронирование с онлайн-оплатой (Uzum, Payme, Visa, MC)' },
    { id: 'd3', text: 'PMS (Property Management System) — наличие и интеграция', hint: 'Opera, Fidelio, HKTS, Shelter или аналог' },
    { id: 'd4', text: 'Высокоскоростной Wi-Fi во всех зонах (≥ 50 Мбит/с)', hint: 'Бесшовный роуминг по технологии Wi-Fi Mesh' },
    { id: 'd5', text: 'CRM-система для профилирования и удержания гостей', hint: 'Учёт предпочтений гостей и история визитов' },
    { id: 'd6', text: 'Цифровой check-in / мобильный ключ или бесконтактный доступ', hint: 'App-based доступ или терминалы самообслуживания' },
    { id: 'd7', text: 'Channel Manager для синхронизации доступности номеров', hint: 'Исключение овербукинга между каналами продаж' },
    { id: 'd8', text: 'Интеграция с единой системой Е-mehmon (МВД РУз)', hint: 'Автоматическая регистрация иностранных туристов онлайн' },
    { id: 'd9', text: 'Электронная система управления задачами горничных (Task Management)', hint: 'Планшеты/приложения для статуса уборки в реальном времени' },
    { id: 'd10', text: 'Резервное копирование баз данных в облачное хранилище', hint: 'Ежедневные бэкапы PMS и финансовой информации' },
  ],

  // Блок 6: Экологический стандарт (10 критериев, вес 10%)
  eco: [
    { id: 'e1', text: 'Наличие программы энергосбережения (LED-освещение ≥ 90%)', hint: 'Датчики движения в коридорах и энергоэффективные лампы' },
    { id: 'e2', text: 'Система энергосберегающих ключ-карт в номерах', hint: 'Автоматическое отключение света и климата при уходе гостя' },
    { id: 'e3', text: 'Водосберегающая сантехника (аэраторы на смесителях и ду́шах)', hint: 'Расход воды в душе ≤ 9 л/мин' },
    { id: 'e4', text: 'Раздельный сбор и утилизация твёрдых бытовых отходов', hint: 'Сортировка бумаги, пластика, стекла и опасных отходов' },
    { id: 'e5', text: 'Отказ от одноразового пластика в номерах и ресторанах', hint: 'Диспенсеры для косметики, бумажные/стеклянные трубочки' },
    { id: 'e6', text: 'Использование экологичных сертифицированных моющих средств', hint: 'Биоразлагаемая химия для уборки и стирки' },
    { id: 'e7', text: 'Озеленение территории и наличие живых растений в интерьере', hint: 'Собственный сад, вертикальное озеленение или зимний сад' },
    { id: 'e8', text: 'Использование солнечных коллекторов или панелей', hint: 'Подогрев воды или частичная генерация электричества' },
    { id: 'e9', text: 'Программа повторного использования полотенец и белья по запросу гостя', hint: 'Информационные карточки «Green Stay» в ванной' },
    { id: 'e10', text: 'Закупка локальных и фермерских продуктов для ресторанов (Local Sourcing)', hint: 'Не менее 60% продуктов питания местного производства' },
  ],

  // Блок 7: Доступная среда / Inclusion (8 критериев, вес 5%)
  access: [
    { id: 'ac1', text: 'Безбарьерный въезд в здание отеля (пандус с уклоном ≤ 1:12 или подъемник)', hint: 'Широкие дверные проёмы без порогов' },
    { id: 'ac2', text: 'Специально оборудованные номера для маломобильных гостей (МГН)', hint: 'Не менее 1–2 номеров с поручнями и тревожной кнопкой' },
    { id: 'ac3', text: 'Лифты с тактильными кнопками Брайля и звуковым оповещением', hint: 'Доступность для слабовидящих и незрячих гостей' },
    { id: 'ac4', text: 'Специально оборудованные санузлы в общественных зонах', hint: 'Широкая кабина, поручни, вызов помощи' },
    { id: 'ac5', text: 'Выделенные парковочные места для инвалидов у входа', hint: 'Разметка и знак доступности' },
    { id: 'ac6', text: 'Визуальная и звуковая индикация пожарной тревоги в номерах', hint: 'Стробоскопы для гостей с нарушением слуха' },
    { id: 'ac7', text: 'Низкая стойка на ресепшн для гостей на колясках', hint: 'Высота стойки регистрации ≤ 85 см' },
    { id: 'ac8', text: 'Обученный персонал по сопровождению маломобильных гостей', hint: 'Инструкция по оказанию помощи при заезде и эвакуации' },
  ],

  // Блок 8: Документооборот и сертификация (7 критериев, вес 5%)
  docs: [
    { id: 'dc1', text: 'Действующий государственный сертификат соответствия категории ★', hint: 'Выдан уполномоченным органом по сертификации туристских услуг' },
    { id: 'dc2', text: 'Свидетельство о включении в Государственный реестр гостиниц Комитета по туризму', hint: 'Наличие присвоенного SRI / реестрового номера' },
    { id: 'dc3', text: 'Договоры на обязательное страхование гражданской ответственности', hint: 'Страхование перед третьими лицами и гостями' },
    { id: 'dc4', text: 'Оформленные трудовые договоры и медицинские книжки персонала', hint: '100% регулярный медосмотр работников пищеблока и сервиса' },
    { id: 'dc5', text: 'Паспорт антитеррористической безопасности объекта', hint: 'Согласован с Национальной гвардией и МВД РУз' },
    { id: 'dc6', text: 'Журнал регистрации инструктажей по охране труда и пожарной безопасности', hint: 'Регулярная фиксация под роспись сотрудников' },
    { id: 'dc7', text: 'Реестр договоров на вывоз ТБО и утилизацию отходов', hint: 'Контракты со специализированными коммунальными службами' },
  ]
};

/* ── Веса блоков (сумма = 1.0) ─────────────────────────────── */
const BLOCK_WEIGHTS = {
  infra:     0.20,
  service:   0.25,
  safety:    0.15,
  financial: 0.10,
  digital:   0.10,
  eco:       0.10,
  access:    0.05,
  docs:      0.05
};

const BLOCK_LABELS = {
  infra:     'Инфраструктура',
  service:   'Сервис',
  safety:    'Безопасность',
  financial: 'Финансы',
  digital:   'Цифровизация',
  eco:       'Экология',
  access:    'Доступность',
  docs:      'Документооборот'
};

/* Хранение ответов: { criterionId: 1 | 0.5 | 0 } */
const answers = {};

/* ── Инициализация чек-листа ─────────────────────────────── */
function initChecklist() {
  const totalCriteria = Object.values(KQI_CRITERIA).reduce((acc, arr) => acc + arr.length, 0);
  const totalCriteriaEl = document.getElementById('q-total-criteria');
  if (totalCriteriaEl) totalCriteriaEl.textContent = totalCriteria;

  Object.entries(KQI_CRITERIA).forEach(([blockKey, criteria]) => {
    const listEl = document.getElementById(`q-criteria-${blockKey}`);
    if (!listEl) return;
    listEl.innerHTML = '';

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

  // Клик по кнопкам опций
  const checklistBlocks = document.getElementById('q-checklist-blocks');
  if (checklistBlocks) {
    checklistBlocks.addEventListener('click', e => {
      const btn = e.target.closest('.q-option-btn');
      if (!btn) return;
      const id  = btn.dataset.id;
      const val = parseFloat(btn.dataset.val);

      // Toggle off if already selected
      if (answers[id] === val) {
        delete answers[id];
        btn.classList.remove('q-option-btn--active');
      } else {
        answers[id] = val;
        btn.closest('.q-criterion-options').querySelectorAll('.q-option-btn').forEach(b => b.classList.remove('q-option-btn--active'));
        btn.classList.add('q-option-btn--active');
      }

      recalculateQI();
    });
  }

  // Аккордеон
  document.querySelectorAll('.q-check-block-header').forEach(hdr => {
    hdr.addEventListener('click', () => {
      const isExpanded = hdr.getAttribute('aria-expanded') === 'true';
      const body = hdr.nextElementSibling;
      hdr.setAttribute('aria-expanded', !isExpanded);
      if (body) body.style.display = isExpanded ? 'none' : 'block';
    });
  });
}

/* ── Пересчёт QI Score ─────────────────────────────────────── */
function recalculateQI() {
  const totalCriteria = Object.values(KQI_CRITERIA).reduce((acc, arr) => acc + arr.length, 0);
  const answered = Object.keys(answers).length;
  const pct = totalCriteria > 0 ? Math.round((answered / totalCriteria) * 100) : 0;

  // Progress Bar
  const progressBar   = document.getElementById('q-progress-bar');
  const progressPct   = document.getElementById('q-progress-pct');
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

  // Save to localStorage for cabinet-hotel integration
  try {
    localStorage.setItem('hip_kqi_score', qiScore);
  } catch (e) {}

  // Update ring & indicators
  const scoreNum  = document.getElementById('q-score-num');
  const resultNum = document.getElementById('q-result-num');
  const arc = document.getElementById('q-score-arc');
  if (scoreNum)  scoreNum.textContent  = qiScore;
  if (resultNum) resultNum.textContent = qiScore;
  if (arc) {
    const circumference = 2 * Math.PI * 52;
    arc.style.strokeDashoffset = circumference - (circumference * qiScore / 100);
    arc.style.stroke = qiScore >= 80 ? '#3B2A20' : qiScore >= 60 ? '#8B6F4E' : '#6B655C';
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
        <span class="q-breakdown-label">${BLOCK_LABELS[block]} (${Math.round(w*100)}%)</span>
        <div class="q-breakdown-track"><div class="q-breakdown-fill" style="width:${s}%"></div></div>
        <span class="q-breakdown-pct">${s}%</span>
      </div>`;
    });
    breakdownEl.innerHTML = html;
  }
}

/* ── Быстрое автозаполнение демо ───────────────────────────── */
const autofillBtn = document.getElementById('q-autofill-demo');
if (autofillBtn) {
  autofillBtn.addEventListener('click', () => {
    Object.values(KQI_CRITERIA).flat().forEach((c, i) => {
      // 85% да, 15% частично
      answers[c.id] = (i % 7 === 0) ? 0.5 : 1;
    });

    document.querySelectorAll('.q-criterion-row').forEach(row => {
      const id = row.dataset.id;
      const val = answers[id];
      row.querySelectorAll('.q-option-btn').forEach(btn => {
        btn.classList.toggle('q-option-btn--active', parseFloat(btn.dataset.val) === val);
      });
    });

    recalculateQI();
  });
}

/* ── Сброс ──────────────────────────────────────────────────── */
const resetBtn = document.getElementById('q-reset-btn');
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    Object.keys(answers).forEach(k => delete answers[k]);
    document.querySelectorAll('.q-option-btn').forEach(btn => btn.classList.remove('q-option-btn--active'));
    recalculateQI();
  });
}

/* ── Таблица рейтинга отелей ────────────────────────────────── */
function renderRatingTable() {
  const tbody = document.getElementById('q-rating-tbody');
  if (!tbody) return;

  const hotels = window.HotelStore ? window.HotelStore.getAll() : (window.DEFAULT_HOTELS || []);
  if (!hotels.length) return;

  tbody.innerHTML = hotels.map((h, i) => {
    const score = h.iri === 'A+' ? 94 : h.iri === 'A' ? 86 : 76;
    const gradeCode = h.iri || 'A';
    const gradeCls = gradeCode.startsWith('A') ? 'A' : 'B';
    return `
      <tr>
        <td class="q-rank-num">${i + 1}</td>
        <td>
          <a href="passport.html?hotel=${h.slug || h.id}" class="q-hotel-link">
            <strong>${h.hotelName}</strong>
          </a>
          <span class="q-hotel-meta">${h.region} · ${h.stars}★</span>
        </td>
        <td><span class="q-score-pill">${score}</span></td>
        <td><span class="q-grade-badge q-grade-badge--${gradeCls}">${gradeCode}</span></td>
        <td><span class="q-badge-verified">Верифицирован</span></td>
      </tr>`;
  }).join('');
}

/* ── Init ───────────────────────────────────────────────────── */
initChecklist();
recalculateQI();
renderRatingTable();
