/**
 * ============================================================
 * /lib/hotel-metrics.js
 * Silk Route Invest — Shared Hotel Metrics Library
 * Pure calculation functions, no DOM dependencies.
 * Used by: form.js, passport.js, /tools/product.html (P6)
 * ============================================================
 */

'use strict';

const HotelMetrics = (() => {

  // ─── CORE KPI FUNCTIONS ─────────────────────────────────────

  function calculateRevPAR(adr, occupancy) {
    if (!adr || !occupancy) return 0;
    return Math.round((adr * (occupancy / 100)) * 10) / 10;
  }

  function calculateEBITDAMargin(ebitda, revenue) {
    if (!revenue || revenue === 0) return 30.0;
    return Math.round((ebitda / revenue) * 1000) / 10;
  }

  function calculatePayback(investment, ebitda) {
    if (!ebitda || ebitda <= 0) return 0;
    return Math.round((investment / ebitda) * 10) / 10;
  }

  function calculateROI(ebitda, investment) {
    if (!investment || investment <= 0) return 0;
    return Math.round((ebitda / investment) * 1000) / 10;
  }

  function calculateIRR(payback) {
    if (!payback || payback <= 0) return 0;
    return Math.round(Math.max(8, Math.min(26, (100 / payback) * 1.25)) * 10) / 10;
  }

  function calculateRoomRevenue(rooms, adr, occupancy) {
    return Math.round(rooms * adr * (occupancy / 100) * 365);
  }

  function estimateGOP(revenue, stars) {
    const margins = { 5: 0.40, 4: 0.34, 3: 0.26, 2: 0.20 };
    const margin = margins[Math.min(5, Math.max(2, stars))] || 0.30;
    return Math.round(revenue * margin);
  }

  // ─── IRI — INVESTMENT READINESS INDEX ───────────────────────

  function calculateIRI(params) {
    const {
      ebitdaMargin = 30, occupancy = 60, adr = 80, revpar = 50,
      totalRooms = 50, payback = 8, roi = 12,
      legalStatus = 'clear', renovationYear = 2022, region = 'other'
    } = params;

    let scoreFin = 95;
    if (ebitdaMargin < 20) scoreFin -= 15;
    if (ebitdaMargin < 15) scoreFin -= 10;
    if (ebitdaMargin > 28) scoreFin = Math.min(100, scoreFin + 3);

    const legalMap = { clear: 100, pledge_bank: 75, dispute: 35 };
    const scoreLaw = legalMap[legalStatus] ?? 85;

    let scoreKpi = 70;
    if (occupancy >= 70) scoreKpi += 15;
    else if (occupancy >= 60) scoreKpi += 8;
    if (revpar >= 90) scoreKpi += 10;
    else if (revpar >= 70) scoreKpi += 5;
    scoreKpi = Math.min(100, scoreKpi);

    let scoreFfe = 80;
    const yr = parseInt(renovationYear, 10) || 2018;
    if (yr >= 2023) scoreFfe = 92;
    else if (yr < 2018) scoreFfe = 65;

    let scoreBrand = 75;
    if (totalRooms >= 200) scoreBrand += 15;
    else if (totalRooms >= 100) scoreBrand += 10;
    scoreBrand = Math.min(100, scoreBrand);

    let scoreLoc = 85;
    if (['tashkent','tashkent_city','samarkand'].includes(region)) scoreLoc = 97;
    else if (['bukhara','khiva','khorezm'].includes(region)) scoreLoc = 92;

    const score = Math.round((
      scoreFin*0.20 + scoreLaw*0.20 + scoreKpi*0.20 +
      scoreFfe*0.15 + scoreBrand*0.15 + scoreLoc*0.10
    ) * 10) / 10;

    let grade = 'C', label = 'Базовый уровень';
    if (score >= 90)      { grade = 'A+'; label = 'Наивысшая готовность'; }
    else if (score >= 80) { grade = 'A';  label = 'Высокая готовность'; }
    else if (score >= 70) { grade = 'B+'; label = 'Хорошая готовность'; }
    else if (score >= 60) { grade = 'B';  label = 'Удовлетворительно'; }

    return { score, grade, label, breakdown: { scoreFin, scoreLaw, scoreKpi, scoreFfe, scoreBrand, scoreLoc } };
  }

  // ─── FORECAST ENGINE ────────────────────────────────────────

  function generateForecast(base, years = 10) {
    const { rooms, adr, occupancy, stars, investment } = base;
    const scenarios = {
      optimistic:   { adrGrowth: 0.07, occGrowth: 0.02, maxOcc: 85 },
      base:         { adrGrowth: 0.04, occGrowth: 0.01, maxOcc: 75 },
      conservative: { adrGrowth: 0.02, occGrowth: 0.00, maxOcc: 65 }
    };
    const result = {};
    for (const [name, s] of Object.entries(scenarios)) {
      result[name] = [];
      let cAdr = adr, cOcc = Math.min(occupancy, s.maxOcc);
      for (let yr = 1; yr <= years; yr++) {
        if (yr > 1) { cAdr *= (1 + s.adrGrowth); cOcc = Math.min(s.maxOcc, cOcc + s.occGrowth * 100); }
        const roomRev = calculateRoomRevenue(rooms, cAdr, cOcc);
        const totalRev = Math.round(roomRev * 1.22);
        const gop = estimateGOP(totalRev, stars);
        const ebitda = Math.round(gop * 0.85);
        const cashFlow = ebitda;
        const cumulativeCF = result[name].reduce((s,y) => s + y.cashFlow, 0) + cashFlow;
        result[name].push({
          year: yr, adr: Math.round(cAdr), occupancy: Math.round(cOcc*10)/10,
          revpar: calculateRevPAR(cAdr, cOcc), roomRev, totalRev, gop, ebitda,
          ebitdaMargin: Math.round((ebitda/totalRev)*1000)/10,
          cashFlow, cumulativeCF,
          roi: calculateROI(ebitda, investment),
          payback: calculatePayback(investment, ebitda)
        });
      }
    }
    return result;
  }

  function calculateBreakevenOccupancy(fixedCosts, rooms, adr, variableCostRatio = 0.35) {
    const contrib = adr * 365 * (1 - variableCostRatio);
    if (contrib <= 0 || rooms <= 0) return 0;
    return Math.round(Math.min(100, (fixedCosts / rooms / contrib) * 100) * 10) / 10;
  }

  function estimateValuation(noi, stars) {
    const rates = { 5:{low:0.10,mid:0.09,high:0.08}, 4:{low:0.12,mid:0.11,high:0.10}, 3:{low:0.15,mid:0.13,high:0.12}, 2:{low:0.18,mid:0.16,high:0.14} };
    const r = rates[Math.min(5, Math.max(2, stars))] || rates[4];
    return { low: Math.round(noi/r.low), mid: Math.round(noi/r.mid), high: Math.round(noi/r.high) };
  }

  // ─── FORMATTING ─────────────────────────────────────────────
  function fmtUSD(n, compact=false) {
    if (compact && n >= 1e6) return '$' + (n/1e6).toFixed(1) + 'M';
    if (compact && n >= 1e3) return '$' + (n/1e3).toFixed(0) + 'K';
    return '$' + Math.round(n).toLocaleString('en-US');
  }
  function fmtPct(n) { return (Math.round(n*10)/10).toFixed(1) + '%'; }
  function fmtYrs(n) { return (Math.round(n*10)/10).toFixed(1) + ' лет'; }

  return {
    calculateRevPAR, calculateEBITDAMargin, calculatePayback, calculateROI,
    calculateIRR, calculateRoomRevenue, estimateGOP, calculateIRI,
    generateForecast, calculateBreakevenOccupancy, estimateValuation,
    fmt: { usd: fmtUSD, pct: fmtPct, yrs: fmtYrs }
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = HotelMetrics;
if (typeof window !== 'undefined') {
  window.HotelMetrics = HotelMetrics;
  window.calculateRevPAR = HotelMetrics.calculateRevPAR; // legacy alias for form.js
}
