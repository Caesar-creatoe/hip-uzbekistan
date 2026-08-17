/* ============================================================
   FORM.JS — Smart Investment Form Engine (Том III)
   Hotel Investment Portfolio · Комитет по туризму РУз
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────────────
     1. STEPPER NAVIGATION & TAB SWITCHING
     ───────────────────────────────────────────── */
  const stepBtns = document.querySelectorAll('.step-nav-item');
  const stepPanels = document.querySelectorAll('.form-step-panel');
  const nextBtns = document.querySelectorAll('.btn--next');
  const prevBtns = document.querySelectorAll('.btn--prev');

  function goToStep(stepNumber) {
    const targetStep = parseInt(stepNumber, 10);
    if (isNaN(targetStep) || targetStep < 1 || targetStep > 5) return;

    // Switch panels
    stepPanels.forEach((panel) => {
      const panelStep = parseInt(panel.dataset.stepPanel, 10);
      panel.classList.toggle('form-step-panel--active', panelStep === targetStep);
    });

    // Update stepper tabs
    stepBtns.forEach((btn) => {
      const btnStep = parseInt(btn.dataset.step, 10);
      btn.classList.toggle('step-nav-item--active', btnStep === targetStep);
      btn.classList.toggle('step-nav-item--completed', btnStep < targetStep);
    });

    // Scroll to top of form smoothly if below header
    const workspace = document.getElementById('form-workspace');
    if (workspace && window.scrollY > 200) {
      workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Trigger full calculation on step change
    recalculateAll();
  }

  stepBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      goToStep(btn.dataset.step);
    });
  });

  nextBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      goToStep(btn.dataset.nextStep);
    });
  });

  prevBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      goToStep(btn.dataset.prevStep);
    });
  });


  /* ─────────────────────────────────────────────
     2. FORM INPUT ELEMENTS & DOM CACHE
     ───────────────────────────────────────────── */
  const elStandard      = document.getElementById('rooms_standard');
  const elDeluxe        = document.getElementById('rooms_deluxe');
  const elJunior        = document.getElementById('rooms_junior');
  const elSuite         = document.getElementById('rooms_suite');
  const elPres          = document.getElementById('rooms_presidential');
  const elRoomsTotal    = document.getElementById('rooms_total');

  const elRevRooms      = document.getElementById('revenue_rooms');
  const elRevFb         = document.getElementById('revenue_fb');
  const elRevOther      = document.getElementById('revenue_other');
  const elTotalRevenue  = document.getElementById('total_revenue');

  const elOccupancy     = document.getElementById('occupancy_rate');
  const elAdr           = document.getElementById('adr_value');
  const elRevparCalc    = document.getElementById('revpar_calc');
  const elEbitda        = document.getElementById('ebitda_value');
  const elEbitdaMargin  = document.getElementById('ebitda_margin_calc');
  const elValuation     = document.getElementById('property_valuation');
  const elCapex         = document.getElementById('capex_required');
  const elPaybackCalc   = document.getElementById('payback_calc');
  const elIrrCalc       = document.getElementById('irr_calc');
  const elRoiCalc       = document.getElementById('roi_calc');

  // Dock UI Elements
  const dockGrade       = document.getElementById('dock-grade');
  const dockGradeText   = document.getElementById('dock-grade-text');
  const dockPoints      = document.getElementById('dock-points');
  const dockProgress    = document.getElementById('dock-progress-fill');
  const dockRooms       = document.getElementById('dock-kpi-rooms');
  const dockOcc         = document.getElementById('dock-kpi-occ');
  const dockAdr         = document.getElementById('dock-kpi-adr');
  const dockRevpar      = document.getElementById('dock-kpi-revpar');
  const dockEbitdaM     = document.getElementById('dock-kpi-ebitda-m');
  const dockPayback     = document.getElementById('dock-kpi-payback');
  const dockIrr         = document.getElementById('dock-kpi-irr');
  const dockRoi         = document.getElementById('dock-kpi-roi');

  // Step 5 Result Breakdown elements
  const scoreFinalGrade = document.getElementById('scoring-final-grade');
  const scoreFin        = document.getElementById('score-fin');
  const scoreLaw        = document.getElementById('score-law');
  const scoreKpi        = document.getElementById('score-kpi');
  const scoreFfe        = document.getElementById('score-ffe');
  const scoreBrand      = document.getElementById('score-brand');
  const scoreLoc        = document.getElementById('score-loc');
  const scoreTotal      = document.getElementById('score-total');


  /* ─────────────────────────────────────────────
     3. REACTIVE CALCULATION ENGINE
     ───────────────────────────────────────────── */

  function parseVal(el, fallback = 0) {
    if (!el) return fallback;
    const v = parseFloat(el.value);
    return isNaN(v) ? fallback : v;
  }

  function recalculateAll() {
    // 1. Rooms calculation
    const standard = parseVal(elStandard, 0);
    const deluxe   = parseVal(elDeluxe, 0);
    const junior   = parseVal(elJunior, 0);
    const suite    = parseVal(elSuite, 0);
    const pres     = parseVal(elPres, 0);
    const totalRooms = standard + deluxe + junior + suite + pres;
    if (elRoomsTotal) elRoomsTotal.value = totalRooms;
    if (dockRooms) dockRooms.textContent = totalRooms.toString();

    // 2. Revenue calculation
    const revRooms = parseVal(elRevRooms, 0);
    const revFb    = parseVal(elRevFb, 0);
    const revOther = parseVal(elRevOther, 0);
    const totalRev = revRooms + revFb + revOther;
    if (elTotalRevenue) elTotalRevenue.value = totalRev;

    // 3. Operational KPIs (Occupancy, ADR, RevPAR)
    const occ = parseVal(elOccupancy, 70);
    const adr = parseVal(elAdr, 100);
    const revpar = (adr * (occ / 100));

    if (elRevparCalc) elRevparCalc.value = revpar.toFixed(1);
    if (dockOcc) dockOcc.textContent = occ.toFixed(1) + '%';
    if (dockAdr) dockAdr.textContent = '$' + Math.round(adr);
    if (dockRevpar) dockRevpar.textContent = '$' + revpar.toFixed(1);

    // 4. EBITDA & Margins
    const ebitda = parseVal(elEbitda, 0);
    let ebitdaMargin = 0;
    if (totalRev > 0) {
      ebitdaMargin = (ebitda / totalRev) * 100;
    } else {
      ebitdaMargin = 30.0;
    }
    if (elEbitdaMargin) elEbitdaMargin.value = ebitdaMargin.toFixed(1);
    if (dockEbitdaM) dockEbitdaM.textContent = ebitdaMargin.toFixed(1) + '%';

    // 5. Valuation, Payback, ROI, IRR
    const valuation = parseVal(elValuation, 40000000);
    let payback = 0;
    if (ebitda > 0) {
      payback = valuation / ebitda;
    }
    if (elPaybackCalc) elPaybackCalc.value = payback.toFixed(1);
    if (dockPayback) dockPayback.textContent = payback.toFixed(1) + ' лет';

    let roi = 0;
    if (valuation > 0) {
      roi = (ebitda / valuation) * 100;
    }
    if (elRoiCalc) elRoiCalc.value = roi.toFixed(1);
    if (dockRoi) dockRoi.textContent = roi.toFixed(1) + '%';

    // Estimated IRR (10Y cash flow model heuristic)
    let irr = 0;
    if (payback > 0) {
      irr = Math.max(8, Math.min(26, (100 / payback) * 1.25));
    }
    if (elIrrCalc) elIrrCalc.value = irr.toFixed(1);
    if (dockIrr) dockIrr.textContent = irr.toFixed(1) + '%';

    // 6. Investment Readiness Index (IRI) Composite Score
    calculateIRI({
      ebitdaMargin,
      occ,
      adr,
      revpar,
      totalRooms,
      payback,
      roi
    });
  }

  function calculateIRI(kpis) {
    // 6 criteria scores (0-100 each)
    // 1. Financial Transparency & Audit (Weight 20%)
    let scoreFinVal = 95;
    if (kpis.ebitdaMargin < 20) scoreFinVal -= 15;
    if (kpis.ebitdaMargin > 28) scoreFinVal = Math.min(100, scoreFinVal + 3);

    // 2. Legal clarity (Weight 20%)
    const elEncumbrance = document.getElementById('legal_encumbrance');
    let scoreLawVal = 100;
    if (elEncumbrance && elEncumbrance.value === 'pledge_bank') scoreLawVal = 75;
    if (elEncumbrance && elEncumbrance.value === 'dispute') scoreLawVal = 35;

    // 3. Operational KPI Health (Weight 20%)
    let scoreKpiVal = 70;
    if (kpis.occ >= 70) scoreKpiVal += 15;
    else if (kpis.occ >= 60) scoreKpiVal += 8;
    if (kpis.revpar >= 90) scoreKpiVal += 10;
    else if (kpis.revpar >= 70) scoreKpiVal += 5;
    scoreKpiVal = Math.min(100, scoreKpiVal);

    // 4. Physical state & FF&E (Weight 15%)
    const elRenov = document.getElementById('year_renovation');
    const renovYear = elRenov ? parseInt(elRenov.value, 10) : 2024;
    let scoreFfeVal = 80;
    if (renovYear >= 2023) scoreFfeVal = 92;
    else if (renovYear < 2018) scoreFfeVal = 65;

    // 5. Brand Readiness (Weight 15%)
    let scoreBrandVal = 75;
    if (kpis.totalRooms >= 200) scoreBrandVal += 15;
    else if (kpis.totalRooms >= 100) scoreBrandVal += 10;
    scoreBrandVal = Math.min(100, scoreBrandVal);

    // 6. Location & Demand generators (Weight 10%)
    const elRegion = document.getElementById('hotel_region');
    let scoreLocVal = 85;
    if (elRegion && (elRegion.value === 'tashkent_city' || elRegion.value === 'samarkand')) {
      scoreLocVal = 97;
    } else if (elRegion && elRegion.value === 'bukhara') {
      scoreLocVal = 92;
    }

    // Weighted composite
    const composite = (
      (scoreFinVal * 0.20) +
      (scoreLawVal * 0.20) +
      (scoreKpiVal * 0.20) +
      (scoreFfeVal * 0.15) +
      (scoreBrandVal * 0.15) +
      (scoreLocVal * 0.10)
    );

    const roundedComposite = Math.round(composite * 10) / 10;

    // Grade determine
    let grade = 'C';
    let gradeLabel = 'Базовый уровень';
    let gradeColor = '#9BAABB';

    if (roundedComposite >= 90) {
      grade = 'A+';
      gradeLabel = 'Наивысшая готовность';
      gradeColor = 'var(--color-accent-terracotta)';
    } else if (roundedComposite >= 80) {
      grade = 'A';
      gradeLabel = 'Высокая готовность';
      gradeColor = '#1A5C3A';
    } else if (roundedComposite >= 70) {
      grade = 'B+';
      gradeLabel = 'Хорошая готовность';
      gradeColor = '#2C3E5A';
    } else if (roundedComposite >= 60) {
      grade = 'B';
      gradeLabel = 'Удовлетворительно';
      gradeColor = '#4A4A48';
    }

    // Update Dock
    if (dockGrade) {
      dockGrade.textContent = grade;
      dockGrade.style.color = gradeColor;
    }
    if (dockGradeText) dockGradeText.textContent = gradeLabel;
    if (dockPoints) dockPoints.textContent = roundedComposite.toFixed(1) + ' / 100';
    if (dockProgress) {
      dockProgress.style.width = Math.min(100, roundedComposite) + '%';
      dockProgress.style.backgroundColor = gradeColor;
    }

    // Update Step 5 Breakdown
    if (scoreFinalGrade) {
      scoreFinalGrade.textContent = grade;
      scoreFinalGrade.style.color = gradeColor;
    }
    if (scoreFin) scoreFin.textContent = scoreFinVal + ' / 100';
    if (scoreLaw) scoreLaw.textContent = scoreLawVal + ' / 100';
    if (scoreKpi) scoreKpi.textContent = scoreKpiVal + ' / 100';
    if (scoreFfe) scoreFfe.textContent = scoreFfeVal + ' / 100';
    if (scoreBrand) scoreBrand.textContent = scoreBrandVal + ' / 100';
    if (scoreLoc) scoreLoc.textContent = scoreLocVal + ' / 100';
    if (scoreTotal) scoreTotal.textContent = roundedComposite.toFixed(1) + ' / 100';
  }


  /* ─────────────────────────────────────────────
     4. EVENT LISTENERS FOR REACTIVE INPUTS
     ───────────────────────────────────────────── */
  const calcInputs = document.querySelectorAll(
    '.calc-rooms, .calc-rev, .calc-trigger, #hotel_region, #legal_encumbrance, #year_renovation'
  );

  calcInputs.forEach((input) => {
    input.addEventListener('input', recalculateAll);
    input.addEventListener('change', recalculateAll);
  });


  /* ─────────────────────────────────────────────
     5. AUTO-FILL DEMO (GRAND TASHKENT 5★)
     ───────────────────────────────────────────── */
  const btnAutofill = document.getElementById('btn-autofill-demo');

  if (btnAutofill) {
    btnAutofill.addEventListener('click', () => {
      // Step 1
      const hotelName = document.getElementById('hotel_name');
      if (hotelName) hotelName.value = 'Grand Tashkent Hotel';

      const hotelRegion = document.getElementById('hotel_region');
      if (hotelRegion) hotelRegion.value = 'tashkent_city';

      const hotelDistrict = document.getElementById('hotel_district');
      if (hotelDistrict) hotelDistrict.value = 'Мирзо-Улугбекский район';

      const hotelAddress = document.getElementById('hotel_address');
      if (hotelAddress) hotelAddress.value = 'проспект Амира Темура, д. 45';

      const hotelStars = document.getElementById('hotel_stars');
      if (hotelStars) hotelStars.value = '5';

      const hotelBrand = document.getElementById('hotel_brand');
      if (hotelBrand) hotelBrand.value = 'Независимый отель (International 5★ standard)';

      const ownership = document.getElementById('ownership_type');
      if (ownership) ownership.value = 'private_100';

      const dealModel = document.getElementById('deal_model');
      if (dealModel) dealModel.value = 'management';

      const cadastre = document.getElementById('cadastre_number');
      if (cadastre) cadastre.value = '10:04:02:01:04:0124';

      const encumbrance = document.getElementById('legal_encumbrance');
      if (encumbrance) encumbrance.value = 'none';

      // Step 2
      if (elStandard) elStandard.value = 196;
      if (elDeluxe) elDeluxe.value = 38;
      if (elJunior) elJunior.value = 12;
      if (elSuite) elSuite.value = 10;
      if (elPres) elPres.value = 2;

      const totalArea = document.getElementById('total_area');
      if (totalArea) totalArea.value = 28500;

      const landArea = document.getElementById('land_area');
      if (landArea) landArea.value = 1.8;

      const yearBuilt = document.getElementById('year_built');
      if (yearBuilt) yearBuilt.value = 2018;

      const yearRenov = document.getElementById('year_renovation');
      if (yearRenov) yearRenov.value = 2024;

      const floors = document.getElementById('floors_count');
      if (floors) floors.value = 14;

      const mice = document.getElementById('mice_capacity');
      if (mice) mice.value = 300;

      const rest = document.getElementById('restaurants_count');
      if (rest) rest.value = 3;

      const spa = document.getElementById('spa_area');
      if (spa) spa.value = 850;

      const parking = document.getElementById('parking_spaces');
      if (parking) parking.value = 120;

      // Step 3
      if (elOccupancy) elOccupancy.value = 74;
      if (elAdr) elAdr.value = 128;
      if (elRevRooms) elRevRooms.value = 8920000;
      if (elRevFb) elRevFb.value = 3400000;
      if (elRevOther) elRevOther.value = 1230000;
      if (elEbitda) elEbitda.value = 4200000;
      if (elValuation) elValuation.value = 45000000;
      if (elCapex) elCapex.value = 12000000;

      // Recalculate
      recalculateAll();

      // Visual feedback on button
      btnAutofill.textContent = '✓ Заполнено';
      btnAutofill.style.backgroundColor = 'rgba(26, 92, 58, 0.15)';
      btnAutofill.style.borderColor = '#1A5C3A';
      btnAutofill.style.color = '#1A5C3A';

      setTimeout(() => {
        btnAutofill.textContent = 'Заполнить демо-данными';
        btnAutofill.style.backgroundColor = '';
        btnAutofill.style.borderColor = '';
        btnAutofill.style.color = '';
      }, 2000);
    });
  }


  /* ─────────────────────────────────────────────
     6. EXPORT / GENERATE STUB
     ───────────────────────────────────────────── */
  const btnDownloadXml = document.getElementById('btn-download-xml');
  if (btnDownloadXml) {
    btnDownloadXml.addEventListener('click', () => {
      const data = {
        hotel_name: document.getElementById('hotel_name')?.value || 'Grand Tashkent Hotel',
        region: document.getElementById('hotel_region')?.value || 'tashkent_city',
        total_rooms: elRoomsTotal?.value || '258',
        occupancy: elOccupancy?.value + '%' || '74%',
        adr_usd: elAdr?.value || '128',
        revpar_usd: elRevparCalc?.value || '94.7',
        ebitda_usd: elEbitda?.value || '4200000',
        valuation_usd: elValuation?.value || '45000000',
        iri_score: dockPoints?.textContent || '91.7 / 100',
        iri_grade: dockGrade?.textContent || 'A+',
        timestamp: new Date().toISOString()
      };

      const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", jsonStr);
      downloadAnchor.setAttribute("download", "smart_form_export_grand_tashkent.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  // Initial calculation on load
  recalculateAll();

});
