/* ============================================================
   ECONOMICS.JS — Единый модуль экономических показателей
   Silk Route Invest · Uzbekistan
   Формулы, схема данных, форматирование — один модуль для
   Admin / Passport / Catalog
   ============================================================ */
'use strict';

/* ── 1. СХЕМА ДАННЫХ — пустой объект economics ─────────────── */
window.EconomicsSchema = {
  createEmpty() {
    return {
      // Метаданные периода
      period:             '',       // '2025 FY'
      dataType:           'fact',   // 'fact' | 'forecast' | 'estimate'
      currency:           'USD',
      verificationStatus: 'unverified', // 'unverified' | 'committee' | 'audited'
      updatedAt:          '',
      visibility: {
        operational:    'public',     // 'public' | 'registered' | 'nda'
        revenue:        'public',
        profitability:  'public',
        investment:     'registered',
        debt:           'nda',
        deal:           'registered',
      },

      // 2. Операционные показатели (STR / USALI)
      occupancy:              null,  // %
      adr:                    null,  // USD
      revpar:                 null,  // авто: adr × occ/100
      revpar_manual:          false,
      trevpar:                null,  // авто: totalRevenue / availableRoomNights
      availableRoomNights:    null,  // опционально
      soldRoomNights:         null,  // опционально
      alos:                   null,  // опционально
      seasonality:            null,  // [] 12 значений или null

      // 3. Выручка (USD за период)
      revRooms:               null,
      revFB:                  null,
      revOther:               null,
      totalRevenue:           null,  // авто: sum трёх, или ручной
      totalRevenue_manual:    false,

      // 4. Расходы и прибыль (USD)
      opex:                   null,
      laborCost:              null,
      laborCostPct:           null,  // авто
      gop:                    null,  // авто: totalRevenue - opex
      gop_manual:             false,
      gopMargin:              null,  // авто
      goppar:                 null,  // авто: gop / availableRoomNights
      ebitda:                 null,
      ebitdaMargin:           null,  // авто
      noi:                    null,  // опционально
      netIncome:              null,  // опционально

      // 5. Инвестиционные показатели
      valuation:              null,  // USD
      askingPrice:            null,
      capex:                  null,
      capexDescription:       '',
      pricePerKey:            null,  // авто: valuation / roomsCount
      pricePerSqm:            null,  // авто: valuation / buildingAreaSqm
      payback:                null,  // авто: valuation / ebitda
      payback_manual:         false,
      irr:                    null,  // %
      irrHorizon:             10,
      npv:                    null,
      discountRate:           null,
      roi:                    null,  // авто: ebitda / valuation × 100
      roi_manual:             false,
      capRate:                null,  // авто: (noi || ebitda) / valuation × 100
      dividendYield:          null,

      // 6. Долг (опционально)
      currentDebt:            null,
      lender:                 '',
      loanRate:               null,
      dscr:                   null,

      // 7. Условия сделки
      equityOffered:          null,  // % для invest
      minInvestment:          null,  // USD
      leaseRate:              null,  // USD/год для rent
      baseFee:                null,  // % для franchise/HMA
      incentiveFee:           null,  // % для franchise/HMA

      // 8. Сравнение с рынком (опционально)
      rgi:                    null,
      mpi:                    null,
      ari:                    null,
      compsetDescription:     '',

      // 9. История и прогноз по годам
      history: []
      // each row: { year, occupancy, adr, revpar, totalRevenue, gop, ebitda, dataType }
    };
  },

  /** Возвращает economics отеля (создаёт пустой если нет) */
  get(hotel) {
    if (!hotel) return this.createEmpty();
    if (!hotel.economics || typeof hotel.economics !== 'object') {
      return this.createEmpty();
    }
    // Merge с пустым шаблоном для обратной совместимости
    return Object.assign(this.createEmpty(), hotel.economics);
  }
};


/* ── 2. ДВИЖОК РАСЧЁТОВ ─────────────────────────────────────── */
window.EconomicsCalc = {

  /** RevPAR = ADR × (Occupancy / 100) */
  revpar(adr, occ) {
    if (!adr || !occ || occ <= 0) return null;
    return +(adr * (occ / 100)).toFixed(2);
  },

  /** TrevPAR = TotalRevenue / AvailableRoomNights */
  trevpar(totalRevenue, availableRoomNights) {
    if (!totalRevenue || !availableRoomNights || availableRoomNights <= 0) return null;
    return +(totalRevenue / availableRoomNights).toFixed(2);
  },

  /** Total Revenue = Rooms + F&B + Other */
  totalRevenue(revRooms, revFB, revOther) {
    const r = +(revRooms || 0);
    const f = +(revFB || 0);
    const o = +(revOther || 0);
    if (r === 0 && f === 0 && o === 0) return null;
    return r + f + o;
  },

  /** Labor Cost % = LaborCost / TotalRevenue × 100 */
  laborCostPct(laborCost, totalRevenue) {
    if (!laborCost || !totalRevenue || totalRevenue <= 0) return null;
    return +(laborCost / totalRevenue * 100).toFixed(1);
  },

  /** GOP = TotalRevenue - OPEX */
  gop(totalRevenue, opex) {
    if (totalRevenue === null || opex === null) return null;
    return +totalRevenue - +opex;
  },

  /** GOP Margin = GOP / TotalRevenue × 100 */
  gopMargin(gop, totalRevenue) {
    if (gop === null || !totalRevenue || totalRevenue <= 0) return null;
    return +(gop / totalRevenue * 100).toFixed(1);
  },

  /** GOPPAR = GOP / AvailableRoomNights */
  goppar(gop, availableRoomNights) {
    if (gop === null || !availableRoomNights || availableRoomNights <= 0) return null;
    return +(gop / availableRoomNights).toFixed(2);
  },

  /** EBITDA Margin = EBITDA / TotalRevenue × 100 */
  ebitdaMargin(ebitda, totalRevenue) {
    if (ebitda === null || !totalRevenue || totalRevenue <= 0) return null;
    return +(ebitda / totalRevenue * 100).toFixed(1);
  },

  /** Price per Key = Valuation / RoomsCount */
  pricePerKey(valuation, roomsCount) {
    if (!valuation || !roomsCount || roomsCount <= 0) return null;
    return Math.round(valuation / roomsCount);
  },

  /** Price per sqm = Valuation / BuildingArea (sqm) */
  pricePerSqm(valuation, buildingAreaSqm) {
    if (!valuation || !buildingAreaSqm || buildingAreaSqm <= 0) return null;
    return Math.round(valuation / buildingAreaSqm);
  },

  /** Payback = Valuation / EBITDA (years) */
  payback(valuation, ebitda) {
    if (!valuation || !ebitda || ebitda <= 0) return null;
    return +(valuation / ebitda).toFixed(1);
  },

  /** ROI = EBITDA / Valuation × 100 */
  roi(ebitda, valuation) {
    if (ebitda === null || !valuation || valuation <= 0) return null;
    return +(ebitda / valuation * 100).toFixed(1);
  },

  /** Cap Rate = (NOI || EBITDA) / Valuation × 100 */
  capRate(noiOrEbitda, valuation) {
    if (noiOrEbitda === null || !valuation || valuation <= 0) return null;
    return +(noiOrEbitda / valuation * 100).toFixed(1);
  },

  /**
   * Полный пересчёт всех авто-полей.
   * @param {object} eco — объект economics
   * @param {object} hotel — основной объект отеля (нужны roomsCount, buildingArea)
   * @returns {object} новый объект economics с пересчитанными полями
   */
  recalcAll(eco, hotel) {
    const e = { ...eco };

    // RevPAR
    if (!e.revpar_manual) {
      e.revpar = this.revpar(e.adr, e.occupancy);
    }

    // Total Revenue
    if (!e.totalRevenue_manual) {
      e.totalRevenue = this.totalRevenue(e.revRooms, e.revFB, e.revOther);
    }

    // Labor cost pct
    e.laborCostPct = this.laborCostPct(e.laborCost, e.totalRevenue);

    // GOP
    if (!e.gop_manual) {
      e.gop = this.gop(e.totalRevenue, e.opex);
    }
    e.gopMargin = this.gopMargin(e.gop, e.totalRevenue);

    // GOPPAR
    e.goppar = this.goppar(e.gop, e.availableRoomNights);

    // TrevPAR
    e.trevpar = this.trevpar(e.totalRevenue, e.availableRoomNights);

    // EBITDA Margin
    e.ebitdaMargin = this.ebitdaMargin(e.ebitda, e.totalRevenue);

    // Price per key
    const rooms = hotel ? (parseInt(hotel.roomsCount) || 0) : 0;
    e.pricePerKey = this.pricePerKey(e.valuation, rooms);

    // Price per sqm — extract number from buildingArea string
    if (hotel && hotel.buildingArea) {
      const match = String(hotel.buildingArea).match(/[\d,\.]+/);
      const sqm = match ? parseFloat(match[0].replace(',', '.')) : 0;
      e.pricePerSqm = sqm > 0 ? this.pricePerSqm(e.valuation, sqm) : null;
    }

    // Payback
    if (!e.payback_manual) {
      e.payback = this.payback(e.valuation, e.ebitda);
    }

    // ROI
    if (!e.roi_manual) {
      e.roi = this.roi(e.ebitda, e.valuation);
    }

    // Cap Rate
    const baseForCapRate = e.noi !== null ? e.noi : e.ebitda;
    e.capRate = this.capRate(baseForCapRate, e.valuation);

    return e;
  }
};


/* ── 3. ФОРМАТИРОВАНИЕ ──────────────────────────────────────── */
window.EconomicsFmt = {

  /** Форматирует число в денежный вид: $1,250,000 или $1.25M */
  money(val, compact = false) {
    if (val === null || val === undefined || isNaN(+val)) return 'Н/Д';
    const n = +val;
    if (compact) {
      if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(1) + ' млрд';
      if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(1) + ' млн';
      if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(0) + ' тыс.';
    }
    return '$' + n.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
  },

  /** Форматирует процент: 74.3% */
  pct(val, decimals = 1) {
    if (val === null || val === undefined || isNaN(+val)) return 'Н/Д';
    return (+val).toFixed(decimals) + '%';
  },

  /** Форматирует число: 1,234 или 1,234.56 */
  num(val, decimals = 0) {
    if (val === null || val === undefined || isNaN(+val)) return 'Н/Д';
    return (+val).toLocaleString('ru-RU', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  /** Форматирует USD с символом: $128 */
  usd(val, decimals = 0) {
    if (val === null || val === undefined || isNaN(+val)) return 'Н/Д';
    return '$' + (+val).toFixed(decimals);
  },

  /** Форматирует годы: 7.3 лет */
  years(val) {
    if (val === null || val === undefined || isNaN(+val)) return 'Н/Д';
    return (+val).toFixed(1) + ' лет';
  },

  /** Бейдж типа данных */
  dataTypeBadge(dataType) {
    const map = {
      fact:     { label: 'Факт',    cls: 'eco-badge--fact' },
      forecast: { label: 'Прогноз', cls: 'eco-badge--forecast' },
      estimate: { label: 'Оценка',  cls: 'eco-badge--estimate' },
    };
    const t = map[dataType] || map.fact;
    return `<span class="eco-badge ${t.cls}">${t.label}</span>`;
  },

  /** Бейдж статуса верификации */
  verificationBadge(status) {
    const map = {
      unverified: { label: 'Не проверено',              cls: 'eco-verify--none',      icon: '○' },
      committee:  { label: 'Верифицировано Комитетом',  cls: 'eco-verify--committee', icon: '✓' },
      audited:    { label: 'Аудировано',                cls: 'eco-verify--audited',   icon: '✓✓' },
    };
    const s = map[status] || map.unverified;
    return `<span class="eco-verify ${s.cls}">${s.icon} ${s.label}</span>`;
  }
};


/* ── 4. ВАЛИДАЦИЯ ───────────────────────────────────────────── */
window.EconomicsValidate = {
  /** Проверяет объект economics, возвращает массив строк с предупреждениями */
  warnings(eco) {
    const w = [];
    if (!eco) return w;

    if (eco.occupancy !== null && (eco.occupancy < 0 || eco.occupancy > 100)) {
      w.push('Occupancy должен быть от 0 до 100%');
    }
    if (eco.ebitda !== null && eco.totalRevenue !== null && eco.totalRevenue > 0) {
      if (eco.ebitda > eco.totalRevenue) {
        w.push('EBITDA не может превышать Total Revenue');
      }
    }
    if (eco.gop !== null && eco.totalRevenue !== null && eco.totalRevenue > 0) {
      if (eco.gop > eco.totalRevenue) {
        w.push('GOP не может превышать Total Revenue');
      }
    }
    if (eco.totalRevenue !== null && eco.revRooms !== null && eco.revFB !== null && eco.revOther !== null) {
      const autoSum = (eco.revRooms || 0) + (eco.revFB || 0) + (eco.revOther || 0);
      if (Math.abs(autoSum - eco.totalRevenue) > 1) {
        w.push(`Сумма статей выручки (${Math.round(autoSum)}) не совпадает с Total Revenue (${Math.round(eco.totalRevenue)})`);
      }
    }
    if (eco.irr !== null && (eco.irr < 0 || eco.irr > 100)) {
      w.push('IRR должен быть от 0 до 100%');
    }
    if (eco.capRate !== null && (eco.capRate < 0 || eco.capRate > 100)) {
      w.push('Cap Rate должен быть от 0 до 100%');
    }

    return w;
  }
};

/* Экспорт для совместимости */
window.calculateRevPAR = window.EconomicsCalc.revpar.bind(window.EconomicsCalc);
