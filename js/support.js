/* ============================================================
   SUPPORT.JS — Калькулятор льгот + рендер программ
   ============================================================ */
(async () => {
  let programs = [];
  try {
    const r = await fetch('./data/support-programs.json');
    programs = await r.json();
  } catch(e) { console.warn('support-programs.json not loaded', e); }

  // ── Render program cards ──────────────────────────────────
  const grid = document.getElementById('programs-grid');
  const typeLabels = { subsidy:'Субсидия', tax:'Налоговая льгота', customs:'Таможенная льгота', land:'Земельная льгота', credit:'Кредитная льгота' };

  function renderCards(filter = 'all') {
    grid.innerHTML = programs.map(p => {
      const visible = filter === 'all' || p.type === filter;
      return `
      <div class="program-card ${p.highlight ? 'program-card--highlight' : ''}" data-type="${p.type}" ${!visible ? 'style="display:none"' : ''}>
        <div class="program-card__header">
          <div class="program-card__icon">${p.icon}</div>
          <div>
            <div class="program-card__type">${typeLabels[p.type] || p.type}</div>
            <h3 class="program-card__title">${p.title}</h3>
          </div>
        </div>
        <div class="program-card__amount">
          <div class="program-card__amount-num">${p.amount}</div>
          <div class="program-card__amount-note">${p.amount_note}</div>
        </div>
        <p class="program-card__short">${p.short}</p>
        <div class="program-card__footer">
          <span class="program-card__duration">⏱ ${p.duration}</span>
          <a href="${p.cta_url}" class="program-card__cta">Подать заявку →</a>
        </div>
      </div>`;
    }).join('');
  }

  renderCards();

  // Filters
  document.querySelectorAll('.v-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.v-filter').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const f = btn.dataset.filter;
      document.querySelectorAll('.program-card').forEach(card => {
        card.style.display = (f === 'all' || card.dataset.type === f) ? '' : 'none';
      });
    });
  });

  // ── Calculator ──────────────────────────────────────────
  const state = { step: 1, vertical: null, capex: 2000000, param: null };

  const step3Configs = {
    hotels: { desc: 'Количество номеров', choices: [20, 50, 100, 200, 300], unit: 'номеров' },
    restaurants: { desc: 'Количество посадочных мест', choices: [50, 100, 180, 300, 500], unit: 'мест' },
    land: { desc: 'Стоимость оборудования ($)', choices: [200000, 500000, 1000000, 2000000], unit: '$' }
  };

  const steps = document.querySelectorAll('.calc-step');
  const progressBar = document.getElementById('calc-progress');
  const nextBtn = document.getElementById('calc-next');
  const backBtn = document.getElementById('calc-back');

  function updateProgress() {
    progressBar.style.width = ((state.step / 4) * 100) + '%';
    backBtn.style.display = state.step > 1 ? '' : 'none';
    nextBtn.textContent = state.step === 3 ? 'Рассчитать →' : state.step === 4 ? 'Начать заново' : 'Далее →';
  }

  function showStep(n) {
    steps.forEach(s => s.classList.toggle('is-active', +s.dataset.step === n));
    state.step = n;
    updateProgress();
    if (n === 3 && state.vertical) buildStep3();
    if (n === 4) showResults();
  }

  function buildStep3() {
    const cfg = step3Configs[state.vertical];
    if (!cfg) return;
    document.getElementById('step3-desc').textContent = cfg.desc;
    document.getElementById('step3-choices').innerHTML = cfg.choices.map(v => `
      <button class="calc-choice ${state.param === v ? 'is-selected' : ''}" data-value="${v}">
        ${v.toLocaleString()} ${cfg.unit}
      </button>`).join('');
    document.querySelectorAll('#step3-choices .calc-choice').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#step3-choices .calc-choice').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        state.param = +btn.dataset.value;
      });
    });
  }

  function calcBenefits() {
    const results = [];
    let total = 0;
    programs.filter(p => p.verticals.includes(state.vertical)).forEach(p => {
      let amount = 0;
      if (p.calculator_unit === 'rooms') amount = (state.param || 50) * p.calculator_coeff;
      else if (p.calculator_unit === 'seats') amount = (state.param || 100) * p.calculator_coeff;
      else if (p.calculator_unit === 'equipment_cost') amount = state.capex * 0.3 * p.calculator_coeff;
      else if (p.calculator_unit === 'projected_profit') amount = state.capex * 0.12 * p.calculator_coeff;
      else if (p.calculator_unit === 'land_lease_annual') amount = state.capex * 0.02 * p.calculator_coeff;
      else if (p.calculator_unit === 'loan_amount') amount = state.capex * 0.5 * p.calculator_coeff;
      else if (p.calculator_unit === 'royalty_paid') amount = state.capex * 0.05 * p.calculator_coeff;
      else amount = state.capex * 0.05;
      if (amount > 0) {
        results.push({ name: p.title, amount: Math.round(amount), icon: p.icon });
        total += Math.round(amount);
      }
    });
    return { items: results, total };
  }

  function showResults() {
    const { items, total } = calcBenefits();
    const pct = ((total / state.capex) * 100).toFixed(1);
    document.getElementById('calc-results').innerHTML = `
      <div class="calc-results">
        ${items.map(i => `
          <div class="calc-result-item">
            <span class="calc-result-item__name">${i.icon} ${i.name}</span>
            <span class="calc-result-item__val">$${i.amount.toLocaleString()}</span>
          </div>`).join('')}
        <div class="calc-total">
          <div>
            <div class="calc-total__label">Совокупная экономия</div>
            <div class="calc-total__pct">${pct}% от CAPEX проекта</div>
          </div>
          <div>
            <div class="calc-total__val">$${total.toLocaleString()}</div>
            <a href="cabinet-investor.html" style="display:block;margin-top:8px;font-size:12px;color:var(--v-support-bg);text-align:right;">Подать заявку →</a>
          </div>
        </div>
      </div>`;
  }

  // Step 1 choices
  document.querySelector('[data-step="1"] .calc-choices').addEventListener('click', e => {
    const btn = e.target.closest('.calc-choice');
    if (!btn) return;
    document.querySelectorAll('[data-step="1"] .calc-choice').forEach(b => b.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    state.vertical = btn.dataset.value;
  });

  // Capex range
  const capexRange = document.getElementById('capex-range');
  const capexDisplay = document.getElementById('capex-display');
  if (capexRange) {
    capexRange.addEventListener('input', () => {
      state.capex = +capexRange.value;
      capexDisplay.textContent = '$' + (+capexRange.value).toLocaleString();
    });
  }
  document.querySelector('[data-step="2"] .calc-choices')?.addEventListener('click', e => {
    const btn = e.target.closest('.calc-choice');
    if (!btn) return;
    document.querySelectorAll('[data-step="2"] .calc-choice').forEach(b => b.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    state.capex = +btn.dataset.value;
    if (capexRange) capexRange.value = state.capex;
    if (capexDisplay) capexDisplay.textContent = '$' + state.capex.toLocaleString();
  });

  nextBtn.addEventListener('click', () => {
    if (state.step === 4) { showStep(1); return; }
    if (state.step < 4) showStep(state.step + 1);
  });
  backBtn.addEventListener('click', () => {
    if (state.step > 1) showStep(state.step - 1);
  });

  updateProgress();

  // Animate counters
  document.querySelectorAll('.js-counter').forEach(el => {
    const target = +el.dataset.target;
    const suffix = el.dataset.suffix || '';
    let current = 0;
    const step = target / 40;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current) + suffix;
      if (current >= target) clearInterval(timer);
    }, 30);
  });
})();
