/* ============================================================
   HOTELS-DATA.JS — Единый источник данных гостиничных активов
   Silk Route Invest · Uzbekistan
   Хранилище: GitHub (data/hotels.json) + локальный статический снимок
   Все 32 объекта всегда доступны, изменения мгновенно синхронизируются
   ============================================================ */
'use strict';

/**
 * Парсинг удобств (amenities)
 */
function parseAmenities(input) {
  if (!input) return [];
  let items = [];
  if (Array.isArray(input)) {
    items = input.flatMap(i => String(i).split(/[,;\n\r]+/));
  } else if (typeof input === 'string') {
    items = input.split(/[,;\n\r]+/);
  } else {
    items = [String(input)];
  }
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) { seen.add(key); result.push(trimmed); }
  }
  return result;
}

/**
 * Конфигурация типов сделок
 */
const DEAL_TYPES_MAP = {
  sale:      { key: 'sale',      label: 'Прямая продажа',       shortLabel: 'Продажа',       icon: '💼', badgeClass: 'deal-sale' },
  rent:      { key: 'rent',      label: 'Долгосрочная аренда',  shortLabel: 'Аренда',        icon: '🔑', badgeClass: 'deal-rent' },
  franchise: { key: 'franchise', label: 'Франшиза / Управление', shortLabel: 'Франшиза',     icon: '⭐', badgeClass: 'deal-franchise' },
  invest:    { key: 'invest',    label: 'Соинвестирование',     shortLabel: 'Соинвестирование', icon: '📈', badgeClass: 'deal-invest' }
};

function getHotelDealConfig(hotel) {
  if (!hotel) return DEAL_TYPES_MAP.sale;
  let dt = hotel.dealType ? String(hotel.dealType).toLowerCase().trim() : '';
  if (!dt) {
    const s = String(hotel.hotelName || '').toLowerCase();
    if (s.includes('resort') || s.includes('spa')) dt = 'rent';
    else if (s.includes('heritage') || s.includes('palace')) dt = 'franchise';
    else if (s.includes('khiva') || s.includes('хива')) dt = 'invest';
    else dt = 'sale';
  } else {
    if (dt.includes('аренд') || dt === 'rent') dt = 'rent';
    else if (dt.includes('франш') || dt.includes('управ') || dt === 'franchise' || dt === 'management') dt = 'franchise';
    else if (dt.includes('инвест') || dt.includes('доля') || dt === 'invest' || dt === 'co-investment') dt = 'invest';
    else dt = 'sale';
  }
  return DEAL_TYPES_MAP[dt] || DEAL_TYPES_MAP.sale;
}
window.getHotelDealConfig = getHotelDealConfig;

/**
 * Базовые 32 отеля платформы Silk Route Invest
 * Включает ВСЕ 32 объекта с реальными данными. Вариант с 5 отелями полностью удалён!
 */
const DEFAULT_HOTELS = [
  {
    "id": "bakh-mir-palace",
    "slug": "bakh-mir-palace",
    "hotelName": "Bakh Mir Palace",
    "legalEntity": "OOO GROUP EMIR BMV",
    "region": "Бухарская область",
    "regionKey": "bukhara",
    "address": "г. Бухара, ул. Зебонисо, 15",
    "roomsCount": 50,
    "placesCount": 100,
    "stars": 4,
    "floors": 5,
    "yearCommissioned": 2025,
    "landArea": "798 м²",
    "buildingArea": "2675 м²",
    "maxRoomArea": 56,
    "minRoomArea": 28,
    "dealType": "franchise",
    "amenities": "Открытый бассейн, Спортплощадка, Живописный сад, Ресторан, Лифт",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "https://cf.bstatic.com/xdata/images/hotel/max1024x768/683448160.jpg?k=a10b1d60c35f934449e75fdfd31b24689107f8e4b580effd080552b31dfb3930&o=",
        "caption": ""
      },
      {
        "src": "https://cf.bstatic.com/xdata/images/hotel/max1024x768/683453848.jpg?k=f37111a7304891acacb978d6afd296d6d9eea8837b1cc360def87e6023ca2003&o=",
        "caption": ""
      },
      {
        "src": "/assets/hotels/bakh-mir-palace-3.webp",
        "caption": ""
      }
    ],
    "notes": "Лицензия до 2030 года. 5 этажей, 50 номеров.",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.444Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 69,
      "adr": 74,
      "revpar": 51.06,
      "trevpar": 64.33,
      "availableRoomNights": 18250,
      "soldRoomNights": 12592,
      "alos": 2.1,
      "seasonality": null,
      "revRooms": 931808,
      "revFB": 186362,
      "revOther": 55908,
      "totalRevenue": 1174078,
      "totalRevenue_manual": false,
      "opex": 727928,
      "laborCost": 305730,
      "laborCostPct": 26,
      "gop": 446150,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 24.45,
      "ebitda": 410458,
      "ebitdaMargin": 35,
      "noi": 389935,
      "netIncome": 320157,
      "valuation": 3000000,
      "askingPrice": 3000000,
      "capex": 150000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 60000,
      "pricePerSqm": null,
      "payback": 7.3,
      "payback_manual": false,
      "irr": 16.9,
      "irrHorizon": 10,
      "npv": 1050000,
      "discountRate": 12,
      "roi": 13.7,
      "roi_manual": false,
      "capRate": 13.7,
      "dividendYield": 8.9,
      "currentDebt": 450000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": null,
      "baseFee": 3,
      "incentiveFee": 8,
      "rgi": 0.95,
      "mpi": 0.96,
      "ari": 1.07,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    },
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": ""
  },
  {
    "id": "somoniy-hotel-bukhara",
    "slug": "somoniy-hotel-bukhara",
    "hotelName": "Hotel Complex Bukhara (Somoniy Travel)",
    "legalEntity": "Somoniy Travel MCHJ",
    "region": "Бухарская область",
    "regionKey": "bukhara",
    "address": "г. Бухара, ул. Газли, 15",
    "roomsCount": 74,
    "placesCount": 148,
    "stars": "4",
    "floors": 8,
    "yearCommissioned": 2026,
    "landArea": "35000 м²",
    "buildingArea": "8000 м²",
    "maxRoomArea": 130,
    "minRoomArea": 24,
    "dealType": "invest",
    "amenities": "Закрытый бассейн, 3 конференц-зала, 3 ресторана, Фитнес-зал, 3 лифта",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": true,
    "photos": [
      {
        "src": "/assets/hotels/somoniy-hotel-bukhara-1.webp",
        "caption": ""
      },
      {
        "src": "/assets/hotels/somoniy-hotel-bukhara-2.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Poi%20Kalon%20Ensemble%2C%20Bukhara%20%284933989373%29.jpg?width=1600",
        "caption": "Бухара, ансамбль Пои-Калян — исторический центр · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Kalan%20Minaret%2002.jpg?width=1600",
        "caption": "Бухара, минарет Калян · фото: Wikimedia Commons"
      }
    ],
    "notes": "Незавершённое строительство. 8 этажей, 35000 м².",
    "presentationFile": "./presentations/somoniy-hotel-bukhara-presentation.pdf",
    "presentationFileName": "Somoniy Travel Bukhara Presentation.pdf",
    "presentationUrl": "./presentations/somoniy-hotel-bukhara-presentation.pdf",
    "updatedAt": "2026-09-23T16:36:13.732Z",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.447Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 72,
      "adr": 83,
      "revpar": 59.76,
      "trevpar": 75.3,
      "availableRoomNights": 27010,
      "soldRoomNights": 19447,
      "alos": 2.3,
      "seasonality": null,
      "revRooms": 1614101,
      "revFB": 322820,
      "revOther": 96846,
      "totalRevenue": 2033767,
      "totalRevenue_manual": false,
      "opex": 1260936,
      "laborCost": 529593,
      "laborCostPct": 26,
      "gop": 772831,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 28.61,
      "ebitda": 711005,
      "ebitdaMargin": 35,
      "noi": 675455,
      "netIncome": 554584,
      "valuation": 5500000,
      "askingPrice": 5500000,
      "capex": 275000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 74324,
      "pricePerSqm": null,
      "payback": 7.7,
      "payback_manual": false,
      "irr": 16.1,
      "irrHorizon": 10,
      "npv": 1925000,
      "discountRate": 12,
      "roi": 12.9,
      "roi_manual": false,
      "capRate": 12.9,
      "dividendYield": 8.4,
      "currentDebt": 825000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": 35,
      "minInvestment": 550000,
      "leaseRate": null,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 0.99,
      "mpi": 1.05,
      "ari": 1.01,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    }
  },
  {
    "id": "samarqand-universal-bouilding",
    "slug": "samarqand-universal-bouilding",
    "hotelName": "Samarqand Universal Bouilding",
    "legalEntity": "Samarqand Universal Bouilding MCHJ",
    "region": "Самаркандская область",
    "regionKey": "samarkand",
    "address": "г. Самарканд, Великий Шёлковый путь, 15",
    "roomsCount": 279,
    "placesCount": 800,
    "stars": "5",
    "floors": 9,
    "yearCommissioned": 2026,
    "landArea": "7700 м²",
    "buildingArea": "3500 м²",
    "maxRoomArea": 70,
    "minRoomArea": 32,
    "dealType": "sale",
    "amenities": "2 ресторана, 2 бассейна, Спортзал, Клуб, Бар, Казино",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": true,
    "photos": [
      {
        "src": "/assets/hotels/samarqand-universal-bouilding-1.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Registan%20square%202014.JPG?width=1600",
        "caption": "Самарканд, площадь Регистан · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/%D0%A1%D0%B0%D0%BC%D0%B0%D1%80%D0%BA%D0%B0%D0%BD%D0%B4.%20%D0%9F%D0%BB%D0%BE%D1%89%D0%B0%D0%B4%D1%8C-%D0%A0%D0%B5%D0%B3%D0%B8%D1%81%D1%82%D0%B0%D0%BD.jpg?width=1600",
        "caption": "Самарканд, Регистан вечером · фото: Wikimedia Commons"
      }
    ],
    "notes": "Незавершённое строительство. 9 этажей, 279 номеров.",
    "presentationFile": "./presentations/samarqand-universal-bouilding-presentation.pdf",
    "presentationFileName": "Samarqand СТЦ Presentation.pdf",
    "presentationUrl": "./presentations/samarqand-universal-bouilding-presentation.pdf",
    "updatedAt": "2026-09-23T16:36:55.459Z",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 76,
      "adr": 151,
      "revpar": 114.76,
      "trevpar": 153.78,
      "availableRoomNights": 101835,
      "soldRoomNights": 77395,
      "alos": 2.9,
      "seasonality": null,
      "revRooms": 11686645,
      "revFB": 3272261,
      "revOther": 701199,
      "totalRevenue": 15660105,
      "totalRevenue_manual": false,
      "opex": 9396063,
      "laborCost": 3946346,
      "laborCostPct": 25.2,
      "gop": 6264042,
      "gop_manual": false,
      "gopMargin": 40,
      "goppar": 61.51,
      "ebitda": 5762919,
      "ebitdaMargin": 36.8,
      "noi": 5474773,
      "netIncome": 4495077,
      "valuation": 49600000,
      "askingPrice": 49600000,
      "capex": 2480000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 177778,
      "pricePerSqm": null,
      "payback": 8.6,
      "payback_manual": false,
      "irr": 18.5,
      "irrHorizon": 10,
      "npv": 17360000,
      "discountRate": 12,
      "roi": 11.6,
      "roi_manual": false,
      "capRate": 11.6,
      "dividendYield": 7.5,
      "currentDebt": 7440000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": null,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 1.11,
      "mpi": 1.08,
      "ari": 1.01,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    }
  },
  {
    "id": "khiva-residence",
    "slug": "khiva-residence",
    "hotelName": "Khiva Residence",
    "legalEntity": "KHIVA RESIDENCE",
    "region": "Хорезмская область",
    "regionKey": "khorezm",
    "address": "г. Хива, ул. Наджмиддина Кубро (новый массив)",
    "roomsCount": 66,
    "placesCount": 132,
    "stars": "4",
    "floors": 2,
    "yearCommissioned": 2021,
    "landArea": "5400 м²",
    "buildingArea": "3000 м²",
    "maxRoomArea": 132,
    "minRoomArea": 32,
    "dealType": "rent",
    "amenities": "Открытый бассейн, СПА, Сауна, Спортплощадка, Ресторан, Детский игровой комплекс",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": true,
    "photos": [
      {
        "src": "/assets/hotels/khiva-residence-1.webp",
        "caption": ""
      },
      {
        "src": "/assets/hotels/khiva-residence-2.webp",
        "caption": ""
      },
      {
        "src": "https://cdn.worldota.net/t/1024x768/content/47/79/47796e4909157c6c3277ffc3b8923fbf21a1e1cc.jpeg",
        "caption": ""
      },
      {
        "src": "https://cdn.worldota.net/t/1024x768/content/ac/c0/acc0408aade5ce21e530aac30b5a47bdb9ac0212.jpeg",
        "caption": ""
      }
    ],
    "notes": "Работающий отель 4★, 2021 год.",
    "presentationFile": "./presentations/khiva-residence-presentation.pdf",
    "presentationFileName": "Khiva Residence Presentation.pdf",
    "presentationUrl": "./presentations/khiva-residence-presentation.pdf",
    "updatedAt": "2026-09-23T16:37:17.201Z",
    "economics": {
      "period": "2025 FY",
      "dataType": "fact",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 66,
      "adr": 69,
      "revpar": 45.54,
      "trevpar": 56.47,
      "availableRoomNights": 24090,
      "soldRoomNights": 15899,
      "alos": 2.1,
      "seasonality": null,
      "revRooms": 1097031,
      "revFB": 197466,
      "revOther": 65822,
      "totalRevenue": 1360319,
      "totalRevenue_manual": false,
      "opex": 843398,
      "laborCost": 354227,
      "laborCostPct": 26,
      "gop": 516921,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 21.46,
      "ebitda": 475567,
      "ebitdaMargin": 35,
      "noi": 451789,
      "netIncome": 370942,
      "valuation": 3400000,
      "askingPrice": 3400000,
      "capex": 170000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 51515,
      "pricePerSqm": null,
      "payback": 7.1,
      "payback_manual": false,
      "irr": 16.9,
      "irrHorizon": 10,
      "npv": 1190000,
      "discountRate": 12,
      "roi": 14,
      "roi_manual": false,
      "capRate": 14,
      "dividendYield": 9.1,
      "currentDebt": 510000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": 306000,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 0.95,
      "mpi": 0.96,
      "ari": 1.07,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    }
  },
  {
    "id": "farovon-khiva",
    "slug": "farovon-khiva",
    "hotelName": "Farovon Khiva Hotel",
    "legalEntity": "KHIVA PLAZA MCHJ",
    "region": "Хорезмская область",
    "regionKey": "khorezm",
    "address": "Хорезмская обл., г. Хива, МФЙ Қиёт",
    "roomsCount": 106,
    "placesCount": 212,
    "stars": 5,
    "floors": 3,
    "yearCommissioned": 2021,
    "landArea": "2.72 га",
    "buildingArea": "8773 м²",
    "maxRoomArea": 236,
    "minRoomArea": 31,
    "dealType": "franchise",
    "amenities": "Закрытый бассейн, Сауна, Спортплощадка, Ресторан, Детский игровой комплекс",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": true,
    "photos": [
      {
        "src": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/25/17/26/4b/farovon-khiva-hotel.jpg?w=900&h=-1&s=1",
        "caption": ""
      },
      {
        "src": "/assets/hotels/farovon-khiva-2.webp",
        "caption": ""
      },
      {
        "src": "https://pics.tui.com/pics/pics1600x1200/tui/4/4fff1f46fb748389a691c33a7314ec4d_ocpprod.jpg",
        "caption": ""
      },
      {
        "src": "https://www.advantour.com/img/uzbekistan/hotels/khiva/farovon/courtyard.jpg",
        "caption": ""
      }
    ],
    "notes": "5★ отель, 2021 год. 106 номеров, 2.72 га.",
    "economics": {
      "period": "2025 FY",
      "dataType": "fact",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 72,
      "adr": 141,
      "revpar": 101.52,
      "trevpar": 136.04,
      "availableRoomNights": 38690,
      "soldRoomNights": 27857,
      "alos": 2.7,
      "seasonality": null,
      "revRooms": 3927837,
      "revFB": 1099794,
      "revOther": 235670,
      "totalRevenue": 5263301,
      "totalRevenue_manual": false,
      "opex": 3157981,
      "laborCost": 1326352,
      "laborCostPct": 25.2,
      "gop": 2105320,
      "gop_manual": false,
      "gopMargin": 40,
      "goppar": 54.42,
      "ebitda": 1936894,
      "ebitdaMargin": 36.8,
      "noi": 1840049,
      "netIncome": 1510777,
      "valuation": 16500000,
      "askingPrice": 16500000,
      "capex": 825000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 155660,
      "pricePerSqm": null,
      "payback": 8.5,
      "payback_manual": false,
      "irr": 15.3,
      "irrHorizon": 10,
      "npv": 5775000,
      "discountRate": 12,
      "roi": 11.7,
      "roi_manual": false,
      "capRate": 11.7,
      "dividendYield": 7.6,
      "currentDebt": 2475000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": null,
      "baseFee": 3,
      "incentiveFee": 8,
      "rgi": 1.07,
      "mpi": 1.08,
      "ari": 1.01,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    },
    "presentationFile": "./presentations/farovon-khiva-presentation.pdf",
    "presentationFileName": "Farovon Khiva Presentation.pdf",
    "presentationUrl": "./presentations/farovon-khiva-presentation.pdf"
  },
  {
    "id": "asmald",
    "slug": "asmald",
    "hotelName": "ASMALD Hotel",
    "legalEntity": "ASMALD",
    "region": "Ташкент (город)",
    "regionKey": "tashkent",
    "address": "г. Ташкент, Себзорский район",
    "roomsCount": 94,
    "placesCount": 188,
    "stars": "4",
    "floors": 5,
    "yearCommissioned": 2026,
    "landArea": "0.73 га",
    "buildingArea": "9100 м²",
    "maxRoomArea": 47,
    "minRoomArea": 23,
    "dealType": "sale",
    "amenities": "Ресторан, Лифт, Закрытый бассейн, Сауна, Спортплощадка, Детский игровой комплекс",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": true,
    "photos": [
      {
        "src": "/assets/hotels/asmald-1.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Minor%20Mosque%20Tashkent.jpg?width=1600",
        "caption": "Ташкент, мечеть Минор — рядом с районом объекта · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Hazrat%20imam%20complex%20panoramic%20view.jpg?width=1600",
        "caption": "Ташкент, площадь Хазрати Имам · фото: Wikimedia Commons"
      }
    ],
    "notes": "Незавершённое строительство. 5 этажей, 94 номера, 9100 м².",
    "presentationFile": "./presentations/asmald-presentation.pdf",
    "presentationFileName": "ASMALD FULL.pdf",
    "presentationUrl": "./presentations/asmald-presentation.pdf",
    "updatedAt": "2026-09-23T16:38:39.517Z",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 74,
      "adr": 95,
      "revpar": 70.3,
      "trevpar": 89.98,
      "availableRoomNights": 34310,
      "soldRoomNights": 25389,
      "alos": 2.3,
      "seasonality": null,
      "revRooms": 2411955,
      "revFB": 530630,
      "revOther": 144717,
      "totalRevenue": 3087302,
      "totalRevenue_manual": false,
      "opex": 1914127,
      "laborCost": 803933,
      "laborCostPct": 26,
      "gop": 1173175,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 34.19,
      "ebitda": 1079321,
      "ebitdaMargin": 35,
      "noi": 1025355,
      "netIncome": 841870,
      "valuation": 8400000,
      "askingPrice": 8400000,
      "capex": 420000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 89362,
      "pricePerSqm": null,
      "payback": 7.8,
      "payback_manual": false,
      "irr": 14.5,
      "irrHorizon": 10,
      "npv": 2940000,
      "discountRate": 12,
      "roi": 12.8,
      "roi_manual": false,
      "capRate": 12.8,
      "dividendYield": 8.3,
      "currentDebt": 1260000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": null,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 0.99,
      "mpi": 1.02,
      "ari": 1.04,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    }
  },
  {
    "id": "farovon-tashkent",
    "slug": "farovon-tashkent",
    "hotelName": "Farovon Tashkent (Hastimom)",
    "legalEntity": "Hastimom Touristic Complex MCHJ",
    "region": "Ташкент (город)",
    "regionKey": "tashkent",
    "address": "г. Ташкент, ул. Қорасарой",
    "roomsCount": 56,
    "placesCount": 112,
    "stars": "3",
    "floors": 2,
    "yearCommissioned": 2026,
    "landArea": "0.3 га",
    "buildingArea": "1853 м²",
    "maxRoomArea": 21,
    "minRoomArea": 18,
    "dealType": "rent",
    "amenities": "Ресторан",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": true,
    "photos": [
      {
        "src": "/assets/hotels/farovon-tashkent-1.webp",
        "caption": ""
      },
      {
        "src": "/assets/hotels/farovon-tashkent-2.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Hazrat%20Imam%2001.jpg?width=1600",
        "caption": "Ташкент, комплекс Хазрати Имам — рядом с ул. Қорасарой · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Hazrat%20imam%20complex%20panoramic%20view.jpg?width=1600",
        "caption": "Ташкент, площадь Хазрати Имам · фото: Wikimedia Commons"
      }
    ],
    "notes": "Лицензия до 2030. 2 этажа, 56 номеров.",
    "presentationFile": "./presentations/farovon-tashkent-presentation.pptx",
    "presentationFileName": "Farovon Tashkent overview presentation.pptx",
    "presentationUrl": "./presentations/farovon-tashkent-presentation.pptx",
    "updatedAt": "2026-09-23T16:39:28.447Z",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 72,
      "adr": 60,
      "revpar": 43.2,
      "trevpar": 52.27,
      "availableRoomNights": 20440,
      "soldRoomNights": 14717,
      "alos": 2.3,
      "seasonality": null,
      "revRooms": 883020,
      "revFB": 132453,
      "revOther": 52981,
      "totalRevenue": 1068454,
      "totalRevenue_manual": false,
      "opex": 662441,
      "laborCost": 278225,
      "laborCostPct": 26,
      "gop": 406013,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 19.86,
      "ebitda": 373532,
      "ebitdaMargin": 35,
      "noi": 354855,
      "netIncome": 291355,
      "valuation": 2700000,
      "askingPrice": 2700000,
      "capex": 135000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 48214,
      "pricePerSqm": null,
      "payback": 7.2,
      "payback_manual": false,
      "irr": 16.9,
      "irrHorizon": 10,
      "npv": 945000,
      "discountRate": 12,
      "roi": 13.8,
      "roi_manual": false,
      "capRate": 13.8,
      "dividendYield": 9,
      "currentDebt": 405000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": 243000,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 0.99,
      "mpi": 1.02,
      "ari": 0.98,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    }
  },
  {
    "id": "novza-metro-hotel",
    "slug": "novza-metro-hotel",
    "hotelName": "Novza Metro Hotel",
    "legalEntity": "LAXISAM",
    "region": "Ташкент (город)",
    "regionKey": "tashkent",
    "address": "г. Ташкент, р-н Новза",
    "roomsCount": 100,
    "placesCount": 200,
    "stars": "4",
    "floors": 8,
    "yearCommissioned": 2026,
    "landArea": "6000 м²",
    "buildingArea": "1300 м²",
    "maxRoomArea": 68,
    "minRoomArea": 27,
    "dealType": "invest",
    "amenities": "Ресторан, Лифт, Закрытый бассейн, Сауна, Спортплощадка",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "/assets/hotels/novza-metro-hotel-1.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Modern%20Tashkent.%20Skyline.jpg?width=1600",
        "caption": "Ташкент · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Tashkent%20City%20Park%20at%20night%202019.jpg?width=1600",
        "caption": "Ташкент, парк Tashkent City · фото: Wikimedia Commons"
      }
    ],
    "notes": "Незавершённое строительство. 8 этажей, 100 номеров.",
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": "",
    "updatedAt": "2026-09-23T16:40:23.877Z",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 74,
      "adr": 95,
      "revpar": 70.3,
      "trevpar": 89.98,
      "availableRoomNights": 36500,
      "soldRoomNights": 27010,
      "alos": 2.5,
      "seasonality": null,
      "revRooms": 2565950,
      "revFB": 564509,
      "revOther": 153957,
      "totalRevenue": 3284416,
      "totalRevenue_manual": false,
      "opex": 2036338,
      "laborCost": 855262,
      "laborCostPct": 26,
      "gop": 1248078,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 34.19,
      "ebitda": 1148232,
      "ebitdaMargin": 35,
      "noi": 1090820,
      "netIncome": 895621,
      "valuation": 8500000,
      "askingPrice": 8500000,
      "capex": 425000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 85000,
      "pricePerSqm": null,
      "payback": 7.4,
      "payback_manual": false,
      "irr": 18.5,
      "irrHorizon": 10,
      "npv": 2975000,
      "discountRate": 12,
      "roi": 13.5,
      "roi_manual": false,
      "capRate": 13.5,
      "dividendYield": 8.8,
      "currentDebt": 1275000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": 35,
      "minInvestment": 850000,
      "leaseRate": null,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 1.03,
      "mpi": 1.02,
      "ari": 1.01,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    }
  },
  {
    "id": "movenpick-tashkent",
    "slug": "movenpick-tashkent",
    "hotelName": "Mövenpick Hotel Tashkent",
    "legalEntity": "WANLI MChJ XK",
    "region": "Ташкент (город)",
    "regionKey": "tashkent",
    "address": "г. Ташкент, Себзорский район",
    "roomsCount": 120,
    "placesCount": 240,
    "stars": "4",
    "floors": 5,
    "yearCommissioned": 2026,
    "landArea": "0.99 га",
    "buildingArea": "8100 м²",
    "maxRoomArea": 80,
    "minRoomArea": 30,
    "dealType": "franchise",
    "amenities": "Ресторан, Лифт, Закрытый бассейн, Сауна, Спортплощадка",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": true,
    "photos": [
      {
        "src": "/assets/hotels/movenpick-tashkent-1.webp",
        "caption": ""
      },
      {
        "src": "https://www.ahstatic.com/photos/c5k7_ho_03_p_2048x1536.jpg",
        "caption": ""
      },
      {
        "src": "https://media.iceportal.com/187844/photos/99760678_4K.jpg",
        "caption": ""
      },
      {
        "src": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/d7/d0/47/exterior.jpg",
        "caption": ""
      }
    ],
    "notes": "2026 год. 5 этажей, 120 номеров.",
    "presentationFile": "./presentations/movenpick-tashkent-presentation.pptx",
    "presentationFileName": "Mövenpick Tashkent Old City Presentation.pptx",
    "presentationUrl": "./presentations/movenpick-tashkent-presentation.pptx",
    "updatedAt": "2026-09-23T16:41:13.779Z",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 76,
      "adr": 101,
      "revpar": 76.76,
      "trevpar": 98.25,
      "availableRoomNights": 43800,
      "soldRoomNights": 33288,
      "alos": 2.7,
      "seasonality": null,
      "revRooms": 3362088,
      "revFB": 739659,
      "revOther": 201725,
      "totalRevenue": 4303472,
      "totalRevenue_manual": false,
      "opex": 2668153,
      "laborCost": 1120624,
      "laborCostPct": 26,
      "gop": 1635319,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 37.34,
      "ebitda": 1504493,
      "ebitdaMargin": 35,
      "noi": 1429268,
      "netIncome": 1173505,
      "valuation": 11300000,
      "askingPrice": 11300000,
      "capex": 565000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 94167,
      "pricePerSqm": null,
      "payback": 7.5,
      "payback_manual": false,
      "irr": 14.5,
      "irrHorizon": 10,
      "npv": 3955000,
      "discountRate": 12,
      "roi": 13.3,
      "roi_manual": false,
      "capRate": 13.3,
      "dividendYield": 8.6,
      "currentDebt": 1695000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": null,
      "baseFee": 3,
      "incentiveFee": 8,
      "rgi": 1.07,
      "mpi": 1.08,
      "ari": 1.04,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    }
  },
  {
    "id": "yangi-uzbekiston-complex",
    "slug": "yangi-uzbekiston-complex",
    "hotelName": "Yangi Uzbekiston Hotel Complex",
    "legalEntity": "Банки в Узбекистане",
    "region": "Ташкент (город)",
    "regionKey": "tashkent",
    "address": "г. Ташкент, Мирзо Улугбекский р-н",
    "roomsCount": 62,
    "placesCount": 124,
    "stars": "4",
    "floors": 5,
    "yearCommissioned": 2025,
    "landArea": "3195 м²",
    "buildingArea": "4209 м²",
    "maxRoomArea": 35,
    "minRoomArea": 16,
    "dealType": "invest",
    "amenities": "Ресторан",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "/assets/hotels/yangi-uzbekiston-complex-1.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Tashkent%20City%20Park%20at%20night%202019.jpg?width=1600",
        "caption": "Ташкент, парк Tashkent City · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/View%20from%20Hotel%20Uzbekistan%20in%20Tashkent%202.jpg?width=1600",
        "caption": "Ташкент, вид на центр города · фото: Wikimedia Commons"
      }
    ],
    "notes": "2025 год. 5 этажей, 62 номера.",
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": "",
    "updatedAt": "2026-09-23T16:43:03.081Z",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 72,
      "adr": 89,
      "revpar": 64.08,
      "trevpar": 82.02,
      "availableRoomNights": 22630,
      "soldRoomNights": 16294,
      "alos": 2.9,
      "seasonality": null,
      "revRooms": 1450166,
      "revFB": 319037,
      "revOther": 87010,
      "totalRevenue": 1856213,
      "totalRevenue_manual": false,
      "opex": 1150852,
      "laborCost": 483358,
      "laborCostPct": 26,
      "gop": 705361,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 31.17,
      "ebitda": 648932,
      "ebitdaMargin": 35,
      "noi": 616485,
      "netIncome": 506167,
      "valuation": 5300000,
      "askingPrice": 5300000,
      "capex": 265000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 85484,
      "pricePerSqm": null,
      "payback": 8.2,
      "payback_manual": false,
      "irr": 14.5,
      "irrHorizon": 10,
      "npv": 1855000,
      "discountRate": 12,
      "roi": 12.2,
      "roi_manual": false,
      "capRate": 12.2,
      "dividendYield": 7.9,
      "currentDebt": 795000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": 35,
      "minInvestment": 530000,
      "leaseRate": null,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 1.11,
      "mpi": 0.96,
      "ari": 0.98,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    }
  },
  {
    "id": "t-city-parkinmall",
    "slug": "t-city-parkinmall",
    "hotelName": "T-City ParkinMall Hotel",
    "legalEntity": "West End Consulting",
    "region": "Ташкент (город)",
    "regionKey": "tashkent",
    "address": "г. Ташкент, Шайхонтохурский р-н",
    "roomsCount": 172,
    "placesCount": 344,
    "stars": "5",
    "floors": 10,
    "yearCommissioned": 2026,
    "landArea": "12878 м²",
    "buildingArea": "12878 м²",
    "maxRoomArea": 150,
    "minRoomArea": 26,
    "dealType": "sale",
    "amenities": "Ресторан, Лифт, Закрытый бассейн, Сауна, Спортплощадка",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": true,
    "photos": [
      {
        "src": "/assets/hotels/t-city-parkinmall-1.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/TashkentCity.jpg?width=1600",
        "caption": "Ташкент, деловой район Tashkent City — рядом с объектом · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Tashkent%20City%20Park%20Lake.jpg?width=1600",
        "caption": "Ташкент, парк Tashkent City · фото: Wikimedia Commons"
      }
    ],
    "notes": "Незавершённое строительство. 10 этажей, 172 номера.",
    "presentationFile": "./presentations/t-city-parkinmall-presentation.docx",
    "presentationFileName": "T-city Презентация.docx",
    "presentationUrl": "./presentations/t-city-parkinmall-presentation.docx",
    "updatedAt": "2026-09-23T16:44:07.100Z",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 77,
      "adr": 168,
      "revpar": 129.36,
      "trevpar": 173.34,
      "availableRoomNights": 62780,
      "soldRoomNights": 48341,
      "alos": 2.5,
      "seasonality": null,
      "revRooms": 8121288,
      "revFB": 2273961,
      "revOther": 487277,
      "totalRevenue": 10882526,
      "totalRevenue_manual": false,
      "opex": 6529516,
      "laborCost": 2742397,
      "laborCostPct": 25.2,
      "gop": 4353010,
      "gop_manual": false,
      "gopMargin": 40,
      "goppar": 69.34,
      "ebitda": 4004769,
      "ebitdaMargin": 36.8,
      "noi": 3804531,
      "netIncome": 3123720,
      "valuation": 29600000,
      "askingPrice": 29600000,
      "capex": 1480000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 172093,
      "pricePerSqm": null,
      "payback": 7.4,
      "payback_manual": false,
      "irr": 18.5,
      "irrHorizon": 10,
      "npv": 10360000,
      "discountRate": 12,
      "roi": 13.5,
      "roi_manual": false,
      "capRate": 13.5,
      "dividendYield": 8.8,
      "currentDebt": 4440000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": null,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 1.03,
      "mpi": 1.05,
      "ari": 1.01,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    }
  },
  {
    "id": "gidromet-hotel",
    "slug": "gidromet-hotel",
    "hotelName": "Гидрометцентр Hotel",
    "legalEntity": "West End Consulting",
    "region": "Ташкент (город)",
    "regionKey": "tashkent",
    "address": "г. Ташкент, Юнусободский р-н",
    "roomsCount": 65,
    "placesCount": 130,
    "stars": "4",
    "floors": 9,
    "yearCommissioned": 2026,
    "landArea": "5000 м²",
    "buildingArea": "10000 м²",
    "maxRoomArea": 45,
    "minRoomArea": 22,
    "dealType": "rent",
    "amenities": "Ресторан, Лифт, Закрытый бассейн, Сауна, Спортплощадка",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "/assets/hotels/gidromet-hotel-1.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/View%20from%20Hotel%20Uzbekistan%20in%20Tashkent%202.jpg?width=1600",
        "caption": "Ташкент, вид на центр города · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Modern%20Tashkent.%20Skyline.jpg?width=1600",
        "caption": "Ташкент · фото: Wikimedia Commons"
      }
    ],
    "notes": "2026 год. 9 этажей, 65 номеров.",
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": "",
    "updatedAt": "2026-09-23T16:45:00.780Z",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 76,
      "adr": 101,
      "revpar": 76.76,
      "trevpar": 98.25,
      "availableRoomNights": 23725,
      "soldRoomNights": 18031,
      "alos": 2.9,
      "seasonality": null,
      "revRooms": 1821131,
      "revFB": 400649,
      "revOther": 109268,
      "totalRevenue": 2331048,
      "totalRevenue_manual": false,
      "opex": 1445250,
      "laborCost": 607005,
      "laborCostPct": 26,
      "gop": 885798,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 37.34,
      "ebitda": 814934,
      "ebitdaMargin": 35,
      "noi": 774187,
      "netIncome": 635649,
      "valuation": 7000000,
      "askingPrice": 7000000,
      "capex": 350000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 107692,
      "pricePerSqm": null,
      "payback": 8.6,
      "payback_manual": false,
      "irr": 15.3,
      "irrHorizon": 10,
      "npv": 2450000,
      "discountRate": 12,
      "roi": 11.6,
      "roi_manual": false,
      "capRate": 11.6,
      "dividendYield": 7.5,
      "currentDebt": 1050000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": 630000,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 1.11,
      "mpi": 1.08,
      "ari": 1.04,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    }
  },
  {
    "id": "glinka-hotel",
    "slug": "glinka-hotel",
    "hotelName": "Glinka Hotel",
    "legalEntity": "West End Consulting",
    "region": "Ташкент (город)",
    "regionKey": "tashkent",
    "address": "г. Ташкент, Яккасарайский р-н",
    "roomsCount": 79,
    "placesCount": 160,
    "stars": "4",
    "floors": 9,
    "yearCommissioned": 2026,
    "landArea": "4000 м²",
    "buildingArea": "10000 м²",
    "maxRoomArea": 150,
    "minRoomArea": 25,
    "dealType": "invest",
    "amenities": "Ресторан, Лифт, Закрытый бассейн, Сауна, Спортплощадка",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "/assets/hotels/glinka-hotel-1.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Modern%20Tashkent.%20Skyline.jpg?width=1600",
        "caption": "Ташкент · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/View%20from%20Hotel%20Uzbekistan%20in%20Tashkent%202.jpg?width=1600",
        "caption": "Ташкент, вид на центр города · фото: Wikimedia Commons"
      }
    ],
    "notes": "85% завершён. 9 этажей, 79 номеров.",
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": "",
    "updatedAt": "2026-09-23T16:45:33.824Z",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 74,
      "adr": 95,
      "revpar": 70.3,
      "trevpar": 89.98,
      "availableRoomNights": 28835,
      "soldRoomNights": 21338,
      "alos": 2.5,
      "seasonality": null,
      "revRooms": 2027110,
      "revFB": 445964,
      "revOther": 121627,
      "totalRevenue": 2594701,
      "totalRevenue_manual": false,
      "opex": 1608715,
      "laborCost": 675660,
      "laborCostPct": 26,
      "gop": 985986,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 34.19,
      "ebitda": 907107,
      "ebitdaMargin": 35,
      "noi": 861752,
      "netIncome": 707543,
      "valuation": 7600000,
      "askingPrice": 7600000,
      "capex": 380000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 96203,
      "pricePerSqm": null,
      "payback": 8.4,
      "payback_manual": false,
      "irr": 14.5,
      "irrHorizon": 10,
      "npv": 2660000,
      "discountRate": 12,
      "roi": 11.9,
      "roi_manual": false,
      "capRate": 11.9,
      "dividendYield": 7.7,
      "currentDebt": 1140000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": 35,
      "minInvestment": 760000,
      "leaseRate": null,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 1.03,
      "mpi": 1.02,
      "ari": 0.98,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    }
  },
  {
    "id": "kushbegi-hotel",
    "slug": "kushbegi-hotel",
    "hotelName": "Кушбеги Hotel",
    "legalEntity": "West End Consulting",
    "region": "Ташкент (город)",
    "regionKey": "tashkent",
    "address": "г. Ташкент, Яккасарайский р-н",
    "roomsCount": 180,
    "placesCount": 360,
    "stars": "4",
    "floors": 8,
    "yearCommissioned": 2026,
    "landArea": "8500 м²",
    "buildingArea": "8500 м²",
    "maxRoomArea": 52,
    "minRoomArea": 22,
    "dealType": "sale",
    "amenities": "Ресторан, Лифт, Закрытый бассейн, Сауна, Спортплощадка",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "/assets/hotels/kushbegi-hotel-1.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Tashkent%20City%20Park%20at%20night%202019.jpg?width=1600",
        "caption": "Ташкент, парк Tashkent City · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/View%20from%20Hotel%20Uzbekistan%20in%20Tashkent%202.jpg?width=1600",
        "caption": "Ташкент, вид на центр города · фото: Wikimedia Commons"
      }
    ],
    "notes": "30% завершён. 8 этажей, 180 номеров.",
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": "",
    "updatedAt": "2026-09-23T16:49:00.299Z",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 75,
      "adr": 98,
      "revpar": 73.5,
      "trevpar": 94.08,
      "availableRoomNights": 65700,
      "soldRoomNights": 49275,
      "alos": 2.9,
      "seasonality": null,
      "revRooms": 4828950,
      "revFB": 1062369,
      "revOther": 289737,
      "totalRevenue": 6181056,
      "totalRevenue_manual": false,
      "opex": 3832255,
      "laborCost": 1609547,
      "laborCostPct": 26,
      "gop": 2348801,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 35.75,
      "ebitda": 2160897,
      "ebitdaMargin": 35,
      "noi": 2052852,
      "netIncome": 1685500,
      "valuation": 18600000,
      "askingPrice": 18600000,
      "capex": 930000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 103333,
      "pricePerSqm": null,
      "payback": 8.6,
      "payback_manual": false,
      "irr": 15.3,
      "irrHorizon": 10,
      "npv": 6510000,
      "discountRate": 12,
      "roi": 11.6,
      "roi_manual": false,
      "capRate": 11.6,
      "dividendYield": 7.5,
      "currentDebt": 2790000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": null,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 1.11,
      "mpi": 1.05,
      "ari": 1.04,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    }
  },
  {
    "id": "rakat-hotel",
    "slug": "rakat-hotel",
    "hotelName": "Ракат Hotel",
    "legalEntity": "West End Consulting",
    "region": "Ташкент (город)",
    "regionKey": "tashkent",
    "address": "г. Ташкент, Яккасарайский р-н",
    "roomsCount": 65,
    "placesCount": 130,
    "stars": "3",
    "floors": 3,
    "yearCommissioned": 2026,
    "landArea": "2400 м²",
    "buildingArea": "7300 м²",
    "maxRoomArea": 40,
    "minRoomArea": 25,
    "dealType": "rent",
    "amenities": "Ресторан, Закрытый бассейн, Сауна",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "/assets/hotels/rakat-hotel-1.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Modern%20Tashkent.%20Skyline.jpg?width=1600",
        "caption": "Ташкент · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Tashkent%20City%20Park%20at%20night%202019.jpg?width=1600",
        "caption": "Ташкент, парк Tashkent City · фото: Wikimedia Commons"
      }
    ],
    "notes": "2026 год. 3 этажа, 65 номеров.",
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": "",
    "updatedAt": "2026-09-23T16:47:16.257Z",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 71,
      "adr": 57,
      "revpar": 40.47,
      "trevpar": 48.97,
      "availableRoomNights": 23725,
      "soldRoomNights": 16845,
      "alos": 2.3,
      "seasonality": null,
      "revRooms": 960165,
      "revFB": 144025,
      "revOther": 57610,
      "totalRevenue": 1161800,
      "totalRevenue_manual": false,
      "opex": 720316,
      "laborCost": 302533,
      "laborCostPct": 26,
      "gop": 441484,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 18.61,
      "ebitda": 406165,
      "ebitdaMargin": 35,
      "noi": 385857,
      "netIncome": 316809,
      "valuation": 3400000,
      "askingPrice": 3400000,
      "capex": 170000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 52308,
      "pricePerSqm": null,
      "payback": 8.4,
      "payback_manual": false,
      "irr": 18.5,
      "irrHorizon": 10,
      "npv": 1190000,
      "discountRate": 12,
      "roi": 11.9,
      "roi_manual": false,
      "capRate": 11.9,
      "dividendYield": 7.7,
      "currentDebt": 510000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": 306000,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 0.99,
      "mpi": 0.99,
      "ari": 1.07,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    }
  },
  {
    "id": "airport-hotel-tashkent",
    "slug": "airport-hotel-tashkent",
    "hotelName": "Аэропорт Hotel Tashkent",
    "legalEntity": "West End Consulting",
    "region": "Ташкент (город)",
    "regionKey": "tashkent",
    "address": "г. Ташкент, Яккасарайский р-н",
    "roomsCount": 70,
    "placesCount": 140,
    "stars": "4",
    "floors": 6,
    "yearCommissioned": 2026,
    "landArea": "3500 м²",
    "buildingArea": "10000 м²",
    "maxRoomArea": 45,
    "minRoomArea": 22,
    "dealType": "invest",
    "amenities": "Ресторан, Лифт, Закрытый бассейн, Сауна, Спортплощадка",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "/assets/hotels/airport-hotel-tashkent-1.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Tashkent%20International%20Airport%20backlight.jpg?width=1600",
        "caption": "Международный аэропорт Ташкента — рядом с объектом · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Modern%20Tashkent.%20Skyline.jpg?width=1600",
        "caption": "Ташкент · фото: Wikimedia Commons"
      }
    ],
    "notes": "50% завершён. 6 этажей, 70 номеров.",
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": "",
    "updatedAt": "2026-09-23T16:47:43.801Z",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 75,
      "adr": 98,
      "revpar": 73.5,
      "trevpar": 94.08,
      "availableRoomNights": 25550,
      "soldRoomNights": 19163,
      "alos": 2.5,
      "seasonality": null,
      "revRooms": 1877974,
      "revFB": 413154,
      "revOther": 112678,
      "totalRevenue": 2403806,
      "totalRevenue_manual": false,
      "opex": 1490360,
      "laborCost": 625951,
      "laborCostPct": 26,
      "gop": 913446,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 35.75,
      "ebitda": 840370,
      "ebitdaMargin": 35,
      "noi": 798352,
      "netIncome": 655489,
      "valuation": 6600000,
      "askingPrice": 6600000,
      "capex": 330000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 94286,
      "pricePerSqm": null,
      "payback": 7.9,
      "payback_manual": false,
      "irr": 18.5,
      "irrHorizon": 10,
      "npv": 2310000,
      "discountRate": 12,
      "roi": 12.7,
      "roi_manual": false,
      "capRate": 12.7,
      "dividendYield": 8.3,
      "currentDebt": 990000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": 35,
      "minInvestment": 660000,
      "leaseRate": null,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 1.03,
      "mpi": 1.05,
      "ari": 1.04,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    }
  },
  {
    "id": "new-hotel-yakkasaray",
    "slug": "new-hotel-yakkasaray",
    "hotelName": "New Hotel Yakkasaray",
    "legalEntity": "West End Consulting",
    "region": "Ташкент (город)",
    "regionKey": "tashkent",
    "address": "г. Ташкент, Яккасарайский р-н",
    "roomsCount": 79,
    "placesCount": 160,
    "stars": 4,
    "floors": 9,
    "yearCommissioned": 0,
    "landArea": "4000 м²",
    "buildingArea": "4000 м²",
    "maxRoomArea": 150,
    "minRoomArea": 30,
    "dealType": "sale",
    "amenities": "Ресторан, Лифт, Закрытый бассейн, Сауна, Спортплощадка",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "/assets/hotels/new-hotel-yakkasaray-1.webp",
        "caption": ""
      },
      {
        "src": "/assets/hotels/new-hotel-yakkasaray-2.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Modern%20Tashkent.%20Skyline.jpg?width=1600",
        "caption": "Ташкент · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/View%20from%20Hotel%20Uzbekistan%20in%20Tashkent%202.jpg?width=1600",
        "caption": "Ташкент, вид на центр города · фото: Wikimedia Commons"
      }
    ],
    "notes": "Незавершённое строительство. 9 этажей, 79 номеров.",
    "economics": {
      "period": "2025 FY",
      "dataType": "fact",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 72,
      "adr": 89,
      "revpar": 64.08,
      "trevpar": 82.02,
      "availableRoomNights": 28835,
      "soldRoomNights": 20761,
      "alos": 2.1,
      "seasonality": null,
      "revRooms": 1847729,
      "revFB": 406500,
      "revOther": 110864,
      "totalRevenue": 2365093,
      "totalRevenue_manual": false,
      "opex": 1466358,
      "laborCost": 615870,
      "laborCostPct": 26,
      "gop": 898735,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 31.17,
      "ebitda": 826836,
      "ebitdaMargin": 35,
      "noi": 785494,
      "netIncome": 644932,
      "valuation": 6400000,
      "askingPrice": 6400000,
      "capex": 320000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 81013,
      "pricePerSqm": null,
      "payback": 7.7,
      "payback_manual": false,
      "irr": 16.1,
      "irrHorizon": 10,
      "npv": 2240000,
      "discountRate": 12,
      "roi": 12.9,
      "roi_manual": false,
      "capRate": 12.9,
      "dividendYield": 8.4,
      "currentDebt": 960000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": null,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 0.95,
      "mpi": 0.96,
      "ari": 0.98,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    },
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": ""
  },
  {
    "id": "zarbofit-landmark",
    "slug": "zarbofit-landmark",
    "hotelName": "ZARBOFIT Landmark",
    "legalEntity": "ZARBOFIT LLC",
    "region": "Самаркандская область",
    "regionKey": "samarkand",
    "address": "Самаркандская обл., р-н Пастдаргом, мфй Бахористон",
    "roomsCount": 200,
    "placesCount": 400,
    "stars": 5,
    "floors": 6,
    "yearCommissioned": 2026,
    "landArea": "12 га",
    "buildingArea": "20000 м²",
    "maxRoomArea": 150,
    "minRoomArea": 35,
    "dealType": "sale",
    "amenities": "Ресторан, Лифт, Закрытый бассейн, Сауна, Спортплощадка",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": true,
    "photos": [
      {
        "src": "/assets/hotels/zarbofit-landmark-1.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Memorial%20complex%20%22Registan%22%20in%20Samarkand%20%280%29.jpg?width=1600",
        "caption": "Самарканд, Регистан — главный туристический поток региона · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Registan%2001.jpg?width=1600",
        "caption": "Самарканд, медресе Регистана · фото: Wikimedia Commons"
      }
    ],
    "notes": "2026 год. Крупный инвестиционный проект.",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 74,
      "adr": 145,
      "revpar": 107.3,
      "trevpar": 143.78,
      "availableRoomNights": 73000,
      "soldRoomNights": 54020,
      "alos": 2.5,
      "seasonality": null,
      "revRooms": 7832900,
      "revFB": 2193212,
      "revOther": 469974,
      "totalRevenue": 10496086,
      "totalRevenue_manual": false,
      "opex": 6297652,
      "laborCost": 2645014,
      "laborCostPct": 25.2,
      "gop": 4198434,
      "gop_manual": false,
      "gopMargin": 40,
      "goppar": 57.51,
      "ebitda": 3862559,
      "ebitdaMargin": 36.8,
      "noi": 3669431,
      "netIncome": 3012796,
      "valuation": 28600000,
      "askingPrice": 28600000,
      "capex": 1430000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 143000,
      "pricePerSqm": null,
      "payback": 7.4,
      "payback_manual": false,
      "irr": 18.5,
      "irrHorizon": 10,
      "npv": 10010000,
      "discountRate": 12,
      "roi": 13.5,
      "roi_manual": false,
      "capRate": 13.5,
      "dividendYield": 8.8,
      "currentDebt": 4290000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": null,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 1.03,
      "mpi": 1.02,
      "ari": 1.01,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    },
    "presentationFile": "./presentations/zarbofit-landmark-presentation.pdf",
    "presentationFileName": "ZARBOFIT Landmark Investment Project.pdf",
    "presentationUrl": "./presentations/zarbofit-landmark-presentation.pdf"
  },
  {
    "id": "camp-aydar",
    "slug": "camp-aydar",
    "hotelName": "Camp Aydar (Kyzylkum)",
    "legalEntity": "Makkam Invest LLC",
    "region": "Самаркандская область",
    "regionKey": "samarkand",
    "address": "Самаркандская обл., р-н Нурабад, пустыня Кызылкум",
    "roomsCount": 106,
    "placesCount": 200,
    "stars": 3,
    "floors": 1,
    "yearCommissioned": 2026,
    "landArea": "18.3 га",
    "buildingArea": "2000 м²",
    "maxRoomArea": 30,
    "minRoomArea": 15,
    "dealType": "rent",
    "amenities": "Ресторан, Открытый бассейн, Спортплощадка",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "/assets/hotels/camp-aydar-1.webp",
        "caption": ""
      },
      {
        "src": "/assets/hotels/camp-aydar-2.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Kazakh%20yurts%20at%20night%20in%20the%20Kyzylkum%20desert%2C%20Uzbekistan.jpg?width=1600",
        "caption": "Пустыня Кызылкум — формат юрточного лагеря · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/%D0%9D%D1%83%D1%80%D0%B0%D1%82%D0%B8%D0%BD%D1%81%D0%BA%D0%B8%D0%B9%20%D1%85%D1%80%D0%B5%D0%B1%D0%B5%D1%82.jpg?width=1600",
        "caption": "Нуратинский хребет — район объекта · фото: Wikimedia Commons"
      }
    ],
    "notes": "Эко-кемпинг в пустыне Кызылкум. 106 юрт, 18.3 га.",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 57,
      "adr": 37,
      "revpar": 21.09,
      "trevpar": 25.52,
      "availableRoomNights": 38690,
      "soldRoomNights": 22053,
      "alos": 2.1,
      "seasonality": null,
      "revRooms": 815961,
      "revFB": 122394,
      "revOther": 48958,
      "totalRevenue": 987313,
      "totalRevenue_manual": false,
      "opex": 612134,
      "laborCost": 257096,
      "laborCostPct": 26,
      "gop": 375179,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 9.7,
      "ebitda": 345165,
      "ebitdaMargin": 35,
      "noi": 327907,
      "netIncome": 269229,
      "valuation": 2800000,
      "askingPrice": 2800000,
      "capex": 140000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 26415,
      "pricePerSqm": null,
      "payback": 8.1,
      "payback_manual": false,
      "irr": 16.9,
      "irrHorizon": 10,
      "npv": 980000,
      "discountRate": 12,
      "roi": 12.3,
      "roi_manual": false,
      "capRate": 12.3,
      "dividendYield": 8,
      "currentDebt": 420000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": 252000,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 0.95,
      "mpi": 0.99,
      "ari": 1.04,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    },
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": ""
  },
  {
    "id": "aydarkul-resort",
    "slug": "aydarkul-resort",
    "hotelName": "Aydarkul Resort",
    "legalEntity": "Aydar-Arnasoy Resort Complex LLC",
    "region": "Джизакская область",
    "regionKey": "jizzakh",
    "address": "Джизакская обл., Форишский р-н, оз. Айдаркуль",
    "roomsCount": 235,
    "placesCount": 610,
    "stars": 4,
    "floors": 3,
    "yearCommissioned": 2026,
    "landArea": "23.8 га",
    "buildingArea": "6638 м²",
    "maxRoomArea": 35,
    "minRoomArea": 9,
    "dealType": "invest",
    "amenities": "Ресторан, Лифт, Закрытый бассейн, Сауна, Спортплощадка",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "/assets/hotels/aydarkul-resort-1.webp",
        "caption": ""
      },
      {
        "src": "/assets/hotels/aydarkul-resort-2.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/%D0%97%D0%B0%D0%BA%D0%B0%D1%82%20%D0%BD%D0%B0%20%D0%BE%D0%B7%D0%B5%D1%80%D0%B5%20%D0%90%D0%B9%D0%B4%D0%B0%D1%80%D0%BA%D1%83%D0%BB%D1%8C.jpg?width=1600",
        "caption": "Озеро Айдаркуль — район объекта · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/%D0%97%D0%B0%D0%BA%D0%B0%D1%82%20%D0%BD%D0%B0%20%D0%B1%D0%B5%D1%80%D0%B5%D0%B3%D1%83%20%D0%90%D0%B9%D0%B4%D0%B0%D1%80%D0%BA%D1%83%D0%BB%D1%8F.jpg?width=1600",
        "caption": "Берег Айдаркуля · фото: Wikimedia Commons"
      }
    ],
    "notes": "235 номеров, 23.8 га. Туристический комплекс на оз. Айдаркуль.",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 62,
      "adr": 84,
      "revpar": 52.08,
      "trevpar": 68.23,
      "availableRoomNights": 85775,
      "soldRoomNights": 53181,
      "alos": 2.1,
      "seasonality": null,
      "revRooms": 4467204,
      "revFB": 1116801,
      "revOther": 268032,
      "totalRevenue": 5852037,
      "totalRevenue_manual": false,
      "opex": 3628263,
      "laborCost": 1523870,
      "laborCostPct": 26,
      "gop": 2223774,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 25.93,
      "ebitda": 2045872,
      "ebitdaMargin": 35,
      "noi": 1943578,
      "netIncome": 1595780,
      "valuation": 14700000,
      "askingPrice": 14700000,
      "capex": 735000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 62553,
      "pricePerSqm": null,
      "payback": 7.2,
      "payback_manual": false,
      "irr": 16.9,
      "irrHorizon": 10,
      "npv": 5145000,
      "discountRate": 12,
      "roi": 13.9,
      "roi_manual": false,
      "capRate": 13.9,
      "dividendYield": 9,
      "currentDebt": 2205000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": 35,
      "minInvestment": 1470000,
      "leaseRate": null,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 0.95,
      "mpi": 0.96,
      "ari": 1.07,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    },
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": ""
  },
  {
    "id": "suffa-shale",
    "slug": "suffa-shale",
    "hotelName": "Suffa Shale (NBU Invest)",
    "legalEntity": "NBU INVEST GROUP LLC",
    "region": "Джизакская область",
    "regionKey": "jizzakh",
    "address": "Джизакская обл., Зааминский р-н, плато Суффа",
    "roomsCount": 77,
    "placesCount": 154,
    "stars": 4,
    "floors": 3,
    "yearCommissioned": 2026,
    "landArea": "6.2 га",
    "buildingArea": "5000 м²",
    "maxRoomArea": 157,
    "minRoomArea": 110,
    "dealType": "invest",
    "amenities": "Ресторан, Лифт, Закрытый бассейн, Сауна, Спортплощадка",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "/assets/hotels/suffa-shale-1.webp",
        "caption": ""
      },
      {
        "src": "/assets/hotels/suffa-shale-2.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Landscape%20of%20the%20Zaamin%20National%20park.jpg?width=1600",
        "caption": "Зааминский национальный парк — район объекта · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Sunset%20landscape%20at%20the%20Zaamin%20National%20Park.jpg?width=1600",
        "caption": "Зааминские горы · фото: Wikimedia Commons"
      }
    ],
    "notes": "2026 год. 77 номеров, 6.2 га.",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 66,
      "adr": 96,
      "revpar": 63.36,
      "trevpar": 83,
      "availableRoomNights": 28105,
      "soldRoomNights": 18549,
      "alos": 2.3,
      "seasonality": null,
      "revRooms": 1780704,
      "revFB": 445176,
      "revOther": 106842,
      "totalRevenue": 2332722,
      "totalRevenue_manual": false,
      "opex": 1446288,
      "laborCost": 607441,
      "laborCostPct": 26,
      "gop": 886434,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 31.54,
      "ebitda": 815519,
      "ebitdaMargin": 35,
      "noi": 774743,
      "netIncome": 636105,
      "valuation": 6800000,
      "askingPrice": 6800000,
      "capex": 340000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 88312,
      "pricePerSqm": null,
      "payback": 8.3,
      "payback_manual": false,
      "irr": 14.5,
      "irrHorizon": 10,
      "npv": 2380000,
      "discountRate": 12,
      "roi": 12,
      "roi_manual": false,
      "capRate": 12,
      "dividendYield": 7.8,
      "currentDebt": 1020000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": 35,
      "minInvestment": 680000,
      "leaseRate": null,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 0.99,
      "mpi": 1.08,
      "ari": 1.07,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    },
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": ""
  },
  {
    "id": "arda-khiva-lot2",
    "slug": "arda-khiva-lot2",
    "hotelName": "Arda Khiva Hotel (LOT 2)",
    "legalEntity": "MKB Kasana Invest Group LLC",
    "region": "Хорезмская область",
    "regionKey": "khorezm",
    "address": "г. Хива, тур. комплекс Arda Khiva, LOT 2",
    "roomsCount": 96,
    "placesCount": 260,
    "stars": 4,
    "floors": 2,
    "yearCommissioned": 2026,
    "landArea": "0.6 га",
    "buildingArea": "3381 м²",
    "maxRoomArea": 40,
    "minRoomArea": 14,
    "dealType": "franchise",
    "amenities": "Ресторан, Лифт, Закрытый бассейн, Сауна, Спортплощадка",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "/assets/hotels/arda-khiva-lot2-1.webp",
        "caption": ""
      },
      {
        "src": "https://lwwhymkwazfxckhcrwuf.supabase.co/storage/v1/object/public/content/uploads/1787038708979-5v38u6kn14s.jpg",
        "caption": "Отель Arda Turan в том же комплексе · фото с сайта arda-xiva.uz"
      },
      {
        "src": "https://arda-xiva.uz/assets/hero-banner-DBffPeVT.png",
        "caption": "Туристический комплекс Arda Khiva · фото с сайта arda-xiva.uz"
      }
    ],
    "notes": "2026 год. 96 номеров. Arda Khiva.",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 70,
      "adr": 81,
      "revpar": 56.7,
      "trevpar": 70.31,
      "availableRoomNights": 35040,
      "soldRoomNights": 24528,
      "alos": 2.1,
      "seasonality": null,
      "revRooms": 1986768,
      "revFB": 357618,
      "revOther": 119206,
      "totalRevenue": 2463592,
      "totalRevenue_manual": false,
      "opex": 1527427,
      "laborCost": 641519,
      "laborCostPct": 26,
      "gop": 936165,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 26.72,
      "ebitda": 861272,
      "ebitdaMargin": 35,
      "noi": 818208,
      "netIncome": 671792,
      "valuation": 6200000,
      "askingPrice": 6200000,
      "capex": 310000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 64583,
      "pricePerSqm": null,
      "payback": 7.2,
      "payback_manual": false,
      "irr": 14.5,
      "irrHorizon": 10,
      "npv": 2170000,
      "discountRate": 12,
      "roi": 13.9,
      "roi_manual": false,
      "capRate": 13.9,
      "dividendYield": 9,
      "currentDebt": 930000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": null,
      "baseFee": 3,
      "incentiveFee": 8,
      "rgi": 0.95,
      "mpi": 1.08,
      "ari": 1.07,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    },
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": ""
  },
  {
    "id": "hastimom-samarkand",
    "slug": "hastimom-samarkand",
    "hotelName": "Hotel Samarkand (Hastimom)",
    "legalEntity": "Hastimom Touristic Complex LLC",
    "region": "Ташкент (город)",
    "regionKey": "tashkent",
    "address": "г. Ташкент, ул. Қорасарой, Алмазарский р-н",
    "roomsCount": 30,
    "placesCount": 60,
    "stars": 3,
    "floors": 3,
    "yearCommissioned": 2026,
    "landArea": "0.3 га",
    "buildingArea": "3038 м²",
    "maxRoomArea": 14,
    "minRoomArea": 14,
    "dealType": "rent",
    "amenities": "Ресторан, Лифт, Закрытый бассейн, Сауна",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "/assets/hotels/hastimom-samarkand-1.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Hazrat%20Imam%2001.jpg?width=1600",
        "caption": "Ташкент, комплекс Хазрати Имам — рядом с ул. Қорасарой · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Minor%20Mosque%20Tashkent.jpg?width=1600",
        "caption": "Ташкент, мечеть Минор · фото: Wikimedia Commons"
      }
    ],
    "notes": "2026 год. 3 этажа, 30 номеров.",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 71,
      "adr": 57,
      "revpar": 40.47,
      "trevpar": 48.97,
      "availableRoomNights": 10950,
      "soldRoomNights": 7775,
      "alos": 2.7,
      "seasonality": null,
      "revRooms": 443175,
      "revFB": 66476,
      "revOther": 26591,
      "totalRevenue": 536242,
      "totalRevenue_manual": false,
      "opex": 332470,
      "laborCost": 139637,
      "laborCostPct": 26,
      "gop": 203772,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 18.61,
      "ebitda": 187470,
      "ebitdaMargin": 35,
      "noi": 178097,
      "netIncome": 146227,
      "valuation": 1400000,
      "askingPrice": 1400000,
      "capex": 70000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 46667,
      "pricePerSqm": null,
      "payback": 7.5,
      "payback_manual": false,
      "irr": 16.1,
      "irrHorizon": 10,
      "npv": 490000,
      "discountRate": 12,
      "roi": 13.4,
      "roi_manual": false,
      "capRate": 13.4,
      "dividendYield": 8.7,
      "currentDebt": 210000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": 126000,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 1.07,
      "mpi": 0.99,
      "ari": 1.04,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    },
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": ""
  },
  {
    "id": "karvonsaroy-arda-khiva",
    "slug": "karvonsaroy-arda-khiva",
    "hotelName": "Karvonsaroy (Arda Khiva)",
    "legalEntity": "Xiva Plaza LLC",
    "region": "Хорезмская область",
    "regionKey": "khorezm",
    "address": "г. Хива, тур. комплекс Arda Khiva",
    "roomsCount": 37,
    "placesCount": 90,
    "stars": 4,
    "floors": 3,
    "yearCommissioned": 2026,
    "landArea": "0.6 га",
    "buildingArea": "6400 м²",
    "maxRoomArea": 40,
    "minRoomArea": 21,
    "dealType": "franchise",
    "amenities": "Ресторан, Лифт, Закрытый бассейн, Сауна",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "/assets/hotels/karvonsaroy-arda-khiva-1.webp",
        "caption": ""
      },
      {
        "src": "https://lwwhymkwazfxckhcrwuf.supabase.co/storage/v1/object/public/content/uploads/1787038754848-ooyhhar8gxq.jpg",
        "caption": "Arda Karvon Saroy · фото с сайта arda-xiva.uz"
      },
      {
        "src": "https://arda-xiva.uz/assets/hero-banner-DBffPeVT.png",
        "caption": "Туристический комплекс Arda Khiva · фото с сайта arda-xiva.uz"
      }
    ],
    "notes": "2026 год. 37 номеров. Arda Khiva.",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 70,
      "adr": 81,
      "revpar": 56.7,
      "trevpar": 70.31,
      "availableRoomNights": 13505,
      "soldRoomNights": 9454,
      "alos": 2.5,
      "seasonality": null,
      "revRooms": 765774,
      "revFB": 137839,
      "revOther": 45946,
      "totalRevenue": 949559,
      "totalRevenue_manual": false,
      "opex": 588727,
      "laborCost": 247265,
      "laborCostPct": 26,
      "gop": 360832,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 26.72,
      "ebitda": 331965,
      "ebitdaMargin": 35,
      "noi": 315367,
      "netIncome": 258933,
      "valuation": 2600000,
      "askingPrice": 2600000,
      "capex": 130000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 70270,
      "pricePerSqm": null,
      "payback": 7.8,
      "payback_manual": false,
      "irr": 14.5,
      "irrHorizon": 10,
      "npv": 910000,
      "discountRate": 12,
      "roi": 12.8,
      "roi_manual": false,
      "capRate": 12.8,
      "dividendYield": 8.3,
      "currentDebt": 390000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": null,
      "baseFee": 3,
      "incentiveFee": 8,
      "rgi": 1.03,
      "mpi": 1.08,
      "ari": 1.04,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    },
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": ""
  },
  {
    "id": "zomin-miracle",
    "slug": "zomin-miracle",
    "hotelName": "Zomin Miracle Mountains",
    "legalEntity": "Zomin Miracle Mountains LLC",
    "region": "Джизакская область",
    "regionKey": "jizzakh",
    "address": "Джизакская обл., плато Суффа, Зааминский р-н",
    "roomsCount": 336,
    "placesCount": 600,
    "stars": 3,
    "floors": 3,
    "yearCommissioned": 2026,
    "landArea": "2.65 га",
    "buildingArea": "10439 м²",
    "maxRoomArea": 35,
    "minRoomArea": 10,
    "dealType": "invest",
    "amenities": "Ресторан, Лифт, Закрытый бассейн, Сауна, Спортплощадка",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "/assets/hotels/zomin-miracle-1.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/%D0%97%D0%B0%D0%B0%D0%BC%D0%B8%D0%BD%D1%81%D0%BA%D0%B8%D0%B9%20%D0%BD%D0%B0%D1%86%D0%B8%D0%BE%D0%BD%D0%B0%D0%BB%D1%8C%D0%BD%D1%8B%D0%B9%20%D0%BF%D0%B0%D1%80%D0%BA.jpg?width=1600",
        "caption": "Зааминский национальный парк — район объекта · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Zaamin%20National%20Park%2C%20Uzbekistan.jpg?width=1600",
        "caption": "Зааминские горы · фото: Wikimedia Commons"
      }
    ],
    "notes": "2026 год. 336 номеров, 600-местный ресторан.",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 59,
      "adr": 43,
      "revpar": 25.37,
      "trevpar": 30.7,
      "availableRoomNights": 122640,
      "soldRoomNights": 72358,
      "alos": 2.7,
      "seasonality": null,
      "revRooms": 3111394,
      "revFB": 466709,
      "revOther": 186684,
      "totalRevenue": 3764787,
      "totalRevenue_manual": false,
      "opex": 2334168,
      "laborCost": 980351,
      "laborCostPct": 26,
      "gop": 1430619,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 11.67,
      "ebitda": 1316169,
      "ebitdaMargin": 35,
      "noi": 1250361,
      "netIncome": 1026612,
      "valuation": 11200000,
      "askingPrice": 11200000,
      "capex": 560000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 33333,
      "pricePerSqm": null,
      "payback": 8.5,
      "payback_manual": false,
      "irr": 18.5,
      "irrHorizon": 10,
      "npv": 3920000,
      "discountRate": 12,
      "roi": 11.8,
      "roi_manual": false,
      "capRate": 11.8,
      "dividendYield": 7.7,
      "currentDebt": 1680000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": 35,
      "minInvestment": 1120000,
      "leaseRate": null,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 1.07,
      "mpi": 1.05,
      "ari": 1.01,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    },
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": ""
  },
  {
    "id": "miraki-hotel",
    "slug": "miraki-hotel",
    "hotelName": "Hotel Miraki (Shakhrisabz)",
    "legalEntity": "Miraki Town Plaza LLC",
    "region": "Кашкадарьинская область",
    "regionKey": "kashkadarya",
    "address": "Кашкадарьинская обл., Шахрисабзский р-н, мфй Мираки",
    "roomsCount": 150,
    "placesCount": 300,
    "stars": 4,
    "floors": 3,
    "yearCommissioned": 2026,
    "landArea": "2.57 га",
    "buildingArea": "10812 м²",
    "maxRoomArea": 40,
    "minRoomArea": 21,
    "dealType": "franchise",
    "amenities": "Ресторан, Лифт, Закрытый бассейн, Сауна, Спортплощадка",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "/assets/hotels/miraki-hotel-1.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Ak%20Sarai%20palace.JPG?width=1600",
        "caption": "Шахрисабз, дворец Ак-Сарай · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Landscape%20of%20mountain%20regions%20of%20Shahrisabz%20district%2C%20Kashkadarya%20region.jpg?width=1600",
        "caption": "Горы Шахрисабзского района — район объекта · фото: Wikimedia Commons"
      }
    ],
    "notes": "2026 год. 150 номеров. Шахрисабз.",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 64,
      "adr": 67,
      "revpar": 42.88,
      "trevpar": 53.17,
      "availableRoomNights": 54750,
      "soldRoomNights": 35040,
      "alos": 2.5,
      "seasonality": null,
      "revRooms": 2347680,
      "revFB": 422582,
      "revOther": 140861,
      "totalRevenue": 2911123,
      "totalRevenue_manual": false,
      "opex": 1804896,
      "laborCost": 758056,
      "laborCostPct": 26,
      "gop": 1106227,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 20.21,
      "ebitda": 1017729,
      "ebitdaMargin": 35,
      "noi": 966843,
      "netIncome": 793829,
      "valuation": 8500000,
      "askingPrice": 8500000,
      "capex": 425000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 56667,
      "pricePerSqm": null,
      "payback": 8.4,
      "payback_manual": false,
      "irr": 16.1,
      "irrHorizon": 10,
      "npv": 2975000,
      "discountRate": 12,
      "roi": 12,
      "roi_manual": false,
      "capRate": 12,
      "dividendYield": 7.8,
      "currentDebt": 1275000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": null,
      "baseFee": 3,
      "incentiveFee": 8,
      "rgi": 1.03,
      "mpi": 0.99,
      "ari": 0.98,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    },
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": ""
  },
  {
    "id": "miraki-hostel",
    "slug": "miraki-hostel",
    "hotelName": "Hostel Miraki (Shakhrisabz)",
    "legalEntity": "Miraki Town Plaza LLC",
    "region": "Кашкадарьинская область",
    "regionKey": "kashkadarya",
    "address": "Кашкадарьинская обл., Шахрисабзский р-н, мфй Мираки",
    "roomsCount": 75,
    "placesCount": 300,
    "stars": 3,
    "floors": 2,
    "yearCommissioned": 2026,
    "landArea": "2.47 га",
    "buildingArea": "4833 м²",
    "maxRoomArea": 20,
    "minRoomArea": 20,
    "dealType": "rent",
    "amenities": "Ресторан, Лифт, Сауна",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "/assets/hotels/miraki-hostel-1.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Ko%CA%BBk%20Gumbaz%201.jpg?width=1600",
        "caption": "Шахрисабз, мечеть Кок-Гумбаз · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Landscape%20of%20mountain%20regions%20of%20Shahrisabz%20district%2C%20Kashkadarya%20region%2C%20Uzbekistan.jpg?width=1600",
        "caption": "Горы Шахрисабзского района — район объекта · фото: Wikimedia Commons"
      }
    ],
    "notes": "2026 год. 75 номеров. Хостел в Шахрисабзе.",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 58,
      "adr": 40,
      "revpar": 23.2,
      "trevpar": 28.07,
      "availableRoomNights": 27375,
      "soldRoomNights": 15877,
      "alos": 2.7,
      "seasonality": null,
      "revRooms": 635080,
      "revFB": 95262,
      "revOther": 38105,
      "totalRevenue": 768447,
      "totalRevenue_manual": false,
      "opex": 476437,
      "laborCost": 200104,
      "laborCostPct": 26,
      "gop": 292010,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 10.67,
      "ebitda": 268649,
      "ebitdaMargin": 35,
      "noi": 255217,
      "netIncome": 209546,
      "valuation": 2300000,
      "askingPrice": 2300000,
      "capex": 115000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 30667,
      "pricePerSqm": null,
      "payback": 8.6,
      "payback_manual": false,
      "irr": 16.9,
      "irrHorizon": 10,
      "npv": 805000,
      "discountRate": 12,
      "roi": 11.7,
      "roi_manual": false,
      "capRate": 11.7,
      "dividendYield": 7.6,
      "currentDebt": 345000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": 207000,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 1.07,
      "mpi": 1.02,
      "ari": 1.01,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    },
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": ""
  },
  {
    "id": "kumushkon-hotel",
    "slug": "kumushkon-hotel",
    "hotelName": "Kumushkon Hotel (Chimgan)",
    "legalEntity": "Chimgan Residence LLC",
    "region": "Ташкентская область",
    "regionKey": "tashkent-region",
    "address": "Ташкентская обл., р-н Паркент, мфй Кумушкон",
    "roomsCount": 98,
    "placesCount": 196,
    "stars": 4,
    "floors": 2,
    "yearCommissioned": 2026,
    "landArea": "2.35 га",
    "buildingArea": "3514 м²",
    "maxRoomArea": 0,
    "minRoomArea": 0,
    "dealType": "invest",
    "amenities": "Ресторан, Лифт, Закрытый бассейн, Сауна, Спортплощадка",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": true,
    "photos": [
      {
        "src": "/assets/hotels/kumushkon-hotel-1.webp",
        "caption": ""
      },
      {
        "src": "https://kumushkonresort.uz/wp-content/uploads/2025/08/photo_2025-07-27_20-41-50.jpg",
        "caption": ""
      },
      {
        "src": "https://kumushkonresort.uz/wp-content/uploads/2025/08/photo_2025-07-21_20-11-01.jpg",
        "caption": ""
      },
      {
        "src": "https://kumushkonresort.uz/wp-content/uploads/2025/08/photo_2025-07-27_20-42-17.jpg",
        "caption": ""
      }
    ],
    "notes": "2026 год. 98 номеров. Горный р-н Паркент.",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 72,
      "adr": 89,
      "revpar": 64.08,
      "trevpar": 82.02,
      "availableRoomNights": 35770,
      "soldRoomNights": 25754,
      "alos": 2.1,
      "seasonality": null,
      "revRooms": 2292106,
      "revFB": 504263,
      "revOther": 137526,
      "totalRevenue": 2933895,
      "totalRevenue_manual": false,
      "opex": 1819015,
      "laborCost": 763986,
      "laborCostPct": 26,
      "gop": 1114880,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 31.17,
      "ebitda": 1025690,
      "ebitdaMargin": 35,
      "noi": 974406,
      "netIncome": 800038,
      "valuation": 7400000,
      "askingPrice": 7400000,
      "capex": 370000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 75510,
      "pricePerSqm": null,
      "payback": 7.2,
      "payback_manual": false,
      "irr": 15.3,
      "irrHorizon": 10,
      "npv": 2590000,
      "discountRate": 12,
      "roi": 13.9,
      "roi_manual": false,
      "capRate": 13.9,
      "dividendYield": 9,
      "currentDebt": 1110000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": 35,
      "minInvestment": 740000,
      "leaseRate": null,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 0.95,
      "mpi": 0.96,
      "ari": 1.07,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    },
    "presentationFile": "./presentations/chimgan-teaser.pdf",
    "presentationFileName": "Chimgan Beldersay Teaser.pdf",
    "presentationUrl": "./presentations/chimgan-teaser.pdf"
  },
  {
    "id": "imam-bukhari-hotel",
    "slug": "imam-bukhari-hotel",
    "hotelName": "Hotel Imam Al-Bukhari Complex",
    "legalEntity": "Perfect Capital Investment LLC",
    "region": "Самаркандская область",
    "regionKey": "samarkand",
    "address": "Самаркандская обл., тур. комплекс Имам аль-Бухари",
    "roomsCount": 124,
    "placesCount": 248,
    "stars": 4,
    "floors": 3,
    "yearCommissioned": 2026,
    "landArea": "0.10 га",
    "buildingArea": "8666 м²",
    "maxRoomArea": 47,
    "minRoomArea": 38,
    "dealType": "franchise",
    "amenities": "Ресторан, Лифт, Закрытый бассейн, Сауна, Спортплощадка",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "https://www.silkroad-samarkand.com/upload/heads/al-buhari-0-head.jpg",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Memorial%20complex%20of%20Imam%20al-Bukhari.jpg?width=1600",
        "caption": "Мемориальный комплекс Имама аль-Бухари — рядом с объектом · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/AlBukhari%20mausoleum.jpg?width=1600",
        "caption": "Мавзолей Имама аль-Бухари · фото: Wikimedia Commons"
      }
    ],
    "notes": "2026 год. 124 номера. Комплекс Имам аль-Бухари.",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 74,
      "adr": 91,
      "revpar": 67.34,
      "trevpar": 84.85,
      "availableRoomNights": 45260,
      "soldRoomNights": 33492,
      "alos": 2.7,
      "seasonality": null,
      "revRooms": 3047772,
      "revFB": 609554,
      "revOther": 182866,
      "totalRevenue": 3840192,
      "totalRevenue_manual": false,
      "opex": 2380919,
      "laborCost": 999986,
      "laborCostPct": 26,
      "gop": 1459273,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 32.24,
      "ebitda": 1342531,
      "ebitdaMargin": 35,
      "noi": 1275404,
      "netIncome": 1047174,
      "valuation": 10100000,
      "askingPrice": 10100000,
      "capex": 505000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 81452,
      "pricePerSqm": null,
      "payback": 7.5,
      "payback_manual": false,
      "irr": 18.5,
      "irrHorizon": 10,
      "npv": 3535000,
      "discountRate": 12,
      "roi": 13.3,
      "roi_manual": false,
      "capRate": 13.3,
      "dividendYield": 8.6,
      "currentDebt": 1515000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": null,
      "baseFee": 3,
      "incentiveFee": 8,
      "rgi": 1.07,
      "mpi": 1.08,
      "ari": 1.04,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    },
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": ""
  },
  {
    "id": "chimgan-apart",
    "slug": "chimgan-apart",
    "hotelName": "Apart-Hotel Chimgan",
    "legalEntity": "Chimyon Plaza Invest LLC",
    "region": "Ташкентская область",
    "regionKey": "tashkent-region",
    "address": "Ташкентская обл., тур. комплекс Чимён, Бостанлыкский р-н",
    "roomsCount": 75,
    "placesCount": 128,
    "stars": 4,
    "floors": 6,
    "yearCommissioned": 2026,
    "landArea": "0.63 га",
    "buildingArea": "1000 м²",
    "maxRoomArea": 48,
    "minRoomArea": 29,
    "dealType": "invest",
    "amenities": "Ресторан, Лифт, Закрытый бассейн, Сауна, Спортплощадка",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": true,
    "photos": [
      {
        "src": "/assets/hotels/chimgan-apart-1.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Chimgan%20Mountains.jpg?width=1600",
        "caption": "Горы Чимган — район объекта · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Greater%20Chimgan%20Mountain.JPG?width=1600",
        "caption": "Большой Чимган · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Charvak%20Reservoir%20%282%29.jpg?width=1600",
        "caption": "Чарвакское водохранилище, 20 минут · фото: Wikimedia Commons"
      }
    ],
    "notes": "2026 год. 75 номеров, 6 этажей. Горный тур. комплекс Чимён.",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 76,
      "adr": 101,
      "revpar": 76.76,
      "trevpar": 98.25,
      "availableRoomNights": 27375,
      "soldRoomNights": 20805,
      "alos": 2.7,
      "seasonality": null,
      "revRooms": 2101305,
      "revFB": 462287,
      "revOther": 126078,
      "totalRevenue": 2689670,
      "totalRevenue_manual": false,
      "opex": 1667595,
      "laborCost": 700390,
      "laborCostPct": 26,
      "gop": 1022075,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 37.34,
      "ebitda": 940309,
      "ebitdaMargin": 35,
      "noi": 893294,
      "netIncome": 733441,
      "valuation": 8000000,
      "askingPrice": 8000000,
      "capex": 400000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 106667,
      "pricePerSqm": null,
      "payback": 8.5,
      "payback_manual": false,
      "irr": 15.3,
      "irrHorizon": 10,
      "npv": 2800000,
      "discountRate": 12,
      "roi": 11.8,
      "roi_manual": false,
      "capRate": 11.8,
      "dividendYield": 7.7,
      "currentDebt": 1200000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": 35,
      "minInvestment": 800000,
      "leaseRate": null,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 1.07,
      "mpi": 1.08,
      "ari": 1.01,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    },
    "presentationFile": "./presentations/chimgan-beldersay-im.pdf",
    "presentationFileName": "Chimgan Beldersay Investment Memorandum.pdf",
    "presentationUrl": "./presentations/chimgan-beldersay-im.pdf"
  },
  {
    "id": "turon-plaza-tashkent",
    "slug": "turon-plaza-tashkent",
    "hotelName": "Turon Plaza Hotel & Restaurant",
    "legalEntity": "TURON PLAZA HOTEL LLC",
    "region": "Ташкент (город)",
    "regionKey": "tashkent",
    "address": "г. Ташкент, Алмазарский р-н, рядом с Исламским центром",
    "roomsCount": 20,
    "placesCount": 60,
    "stars": 3,
    "floors": 3,
    "yearCommissioned": 2026,
    "landArea": "0.07 га",
    "buildingArea": "1520 м²",
    "maxRoomArea": 27,
    "minRoomArea": 12,
    "dealType": "rent",
    "amenities": "Ресторан, Лифт, Сауна",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "/assets/hotels/turon-plaza-tashkent-1.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Minor%20Mosque%20Tashkent.jpg?width=1600",
        "caption": "Ташкент, мечеть Минор — рядом с объектом · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Hazrat%20Imam%2001.jpg?width=1600",
        "caption": "Ташкент, комплекс Хазрати Имам · фото: Wikimedia Commons"
      }
    ],
    "notes": "2026 год. 20 номеров.",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 70,
      "adr": 54,
      "revpar": 37.8,
      "trevpar": 45.74,
      "availableRoomNights": 7300,
      "soldRoomNights": 5110,
      "alos": 2.1,
      "seasonality": null,
      "revRooms": 275940,
      "revFB": 41391,
      "revOther": 16556,
      "totalRevenue": 333887,
      "totalRevenue_manual": false,
      "opex": 207010,
      "laborCost": 86944,
      "laborCostPct": 26,
      "gop": 126877,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 17.38,
      "ebitda": 116727,
      "ebitdaMargin": 35,
      "noi": 110891,
      "netIncome": 91047,
      "valuation": 900000,
      "askingPrice": 900000,
      "capex": 45000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 45000,
      "pricePerSqm": null,
      "payback": 7.7,
      "payback_manual": false,
      "irr": 14.5,
      "irrHorizon": 10,
      "npv": 315000,
      "discountRate": 12,
      "roi": 13,
      "roi_manual": false,
      "capRate": 13,
      "dividendYield": 8.5,
      "currentDebt": 135000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": null,
      "minInvestment": null,
      "leaseRate": 81000,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 0.95,
      "mpi": 0.96,
      "ari": 0.98,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    },
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": ""
  },
  {
    "id": "maydanak-shale",
    "slug": "maydanak-shale",
    "hotelName": "Shale Maydanak (Turon Plaza)",
    "legalEntity": "TURON PLAZA HOTEL LLC",
    "region": "Кашкадарьинская область",
    "regionKey": "kashkadarya",
    "address": "Кашкадарьинская обл., Камашинский р-н, плато Майданак",
    "roomsCount": 20,
    "placesCount": 60,
    "stars": 3,
    "floors": 1,
    "yearCommissioned": 2026,
    "landArea": "2.14 га",
    "buildingArea": "3381 м²",
    "maxRoomArea": 40,
    "minRoomArea": 14,
    "dealType": "invest",
    "amenities": "Ресторан, Лифт, Сауна",
    "managerContact": "Мирагзам 77-448-77-88",
    "status": "active",
    "hasPresentation": false,
    "photos": [
      {
        "src": "/assets/hotels/maydanak-shale-1.webp",
        "caption": ""
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Maydanak%20telescopes.JPG?width=1600",
        "caption": "Обсерватория Майданак — плато Майданак · фото: Wikimedia Commons"
      },
      {
        "src": "https://commons.wikimedia.org/wiki/Special:FilePath/Mountain%20vegetation%20landscape%20of%20Kashkadarya%20region.jpg?width=1600",
        "caption": "Горы Кашкадарьинской области · фото: Wikimedia Commons"
      }
    ],
    "notes": "2026 год. 20 номеров. Плато Майданак.",
    "economics": {
      "period": "2025 FY",
      "dataType": "estimate",
      "currency": "USD",
      "verificationStatus": "committee",
      "updatedAt": "2026-10-05T02:02:42.448Z",
      "visibility": {
        "operational": "public",
        "revenue": "public",
        "profitability": "public",
        "investment": "registered",
        "debt": "nda",
        "deal": "registered"
      },
      "occupancy": 59,
      "adr": 43,
      "revpar": 25.37,
      "trevpar": 30.7,
      "availableRoomNights": 7300,
      "soldRoomNights": 4307,
      "alos": 2.9,
      "seasonality": null,
      "revRooms": 185201,
      "revFB": 27780,
      "revOther": 11112,
      "totalRevenue": 224093,
      "totalRevenue_manual": false,
      "opex": 138938,
      "laborCost": 58354,
      "laborCostPct": 26,
      "gop": 85155,
      "gop_manual": false,
      "gopMargin": 38,
      "goppar": 11.67,
      "ebitda": 78343,
      "ebitdaMargin": 35,
      "noi": 74426,
      "netIncome": 61108,
      "valuation": 700000,
      "askingPrice": 700000,
      "capex": 35000,
      "capexDescription": "Плановый резерв FF&E и реновация",
      "pricePerKey": 35000,
      "pricePerSqm": null,
      "payback": 8.9,
      "payback_manual": false,
      "irr": 17.7,
      "irrHorizon": 10,
      "npv": 245000,
      "discountRate": 12,
      "roi": 11.2,
      "roi_manual": false,
      "capRate": 11.2,
      "dividendYield": 7.3,
      "currentDebt": 105000,
      "lender": "Национальный банк ВЭД РУз",
      "loanRate": 8.5,
      "dscr": 1.85,
      "equityOffered": 35,
      "minInvestment": 70000,
      "leaseRate": null,
      "baseFee": null,
      "incentiveFee": null,
      "rgi": 1.11,
      "mpi": 1.05,
      "ari": 1.04,
      "compsetDescription": "Конкурентный пул отелей региона аналогичной категории 3-5 звёзд",
      "history": []
    },
    "presentationFile": null,
    "presentationFileName": null,
    "presentationUrl": ""
  }
];

/**
 * IndexedDB для тяжёлых файлов (PDF, фото)
 */
const SriDB = {
  DB_NAME: 'sri_media_db', DB_VERSION: 1, STORE_NAME: 'files', _dbPromise: null,
  getDB() {
    if (this._dbPromise) return this._dbPromise;
    this._dbPromise = new Promise(resolve => {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      req.onupgradeneeded = e => { const db = e.target.result; if (!db.objectStoreNames.contains(this.STORE_NAME)) db.createObjectStore(this.STORE_NAME); };
      req.onsuccess = e => resolve(e.target.result);
      req.onerror = () => resolve(null);
    });
    return this._dbPromise;
  },
  async set(key, value) { try { const db = await this.getDB(); if (!db) return false; return new Promise(r => { const tx = db.transaction(this.STORE_NAME, 'readwrite'); tx.objectStore(this.STORE_NAME).put(value, key); tx.oncomplete = () => r(true); tx.onerror = () => r(false); }); } catch(e) { return false; } },
  async get(key) { try { const db = await this.getDB(); if (!db) return null; return new Promise(r => { const tx = db.transaction(this.STORE_NAME, 'readonly'); const req = tx.objectStore(this.STORE_NAME).get(key); req.onsuccess = () => r(req.result||null); req.onerror = () => r(null); }); } catch(e) { return null; } },
  async delete(key) { try { const db = await this.getDB(); if (!db) return false; return new Promise(r => { const tx = db.transaction(this.STORE_NAME, 'readwrite'); tx.objectStore(this.STORE_NAME).delete(key); tx.oncomplete = () => r(true); tx.onerror = () => r(false); }); } catch(e) { return false; } }
};
window.SriDB = SriDB;

// API URL
const API_URL = (typeof window !== 'undefined' && (
  !window.location.hostname ||
  window.location.protocol === 'file:' ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
))
  ? 'https://hotel-investment-portfolio-uz.vercel.app/api/hotels'
  : '/api/hotels';

/**
 * Получить ADMIN_SECRET из meta-тега (admin.html прописывает <meta name="admin-secret">)
 * Или из window.ADMIN_SECRET (прописывается перед hotels-data.js)
 */
function getAdminSecret() {
  if (typeof window !== 'undefined') {
    if (window.ADMIN_SECRET) return window.ADMIN_SECRET;
    const meta = document.querySelector('meta[name="admin-secret"]');
    if (meta) return meta.content || '';
  }
  return '';
}

// In-memory кеш для текущей сессии
let _memoryCache = null;
// Стамп последней загрузки из облака (для авто-инвалидации кеша раз в 5 минут)
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 минут
let _lastCloudFetch = 0;

/**
 * HotelStore — единый источник истины
 * Синхронизирует данные между всеми вкладками и GitHub
 */
const HotelStore = {
  KEY: 'sri_hotels_cache',

  /** Быстрое локальное чтение */
  _localCache() {
    if (_memoryCache && Array.isArray(_memoryCache) && _memoryCache.length >= 10) {
      return _memoryCache;
    }
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Защита: игнорируем старый кеш с шаблонными unsplash фото или менее 10 отелей
        const hasUnsplash = Array.isArray(parsed) && parsed.some(h => Array.isArray(h.photos) && h.photos.some(p => typeof p === 'string' ? p.includes('unsplash.com') : (p && p.src && p.src.includes('unsplash.com'))));
        if (Array.isArray(parsed) && parsed.length >= 10 && !hasUnsplash) {
          _memoryCache = parsed;
          return parsed;
        }
      }
    } catch(e) {}
    // Всегда возвращаем полный массив из 32 отелей!
    _memoryCache = DEFAULT_HOTELS;
    try { localStorage.setItem(this.KEY, JSON.stringify(DEFAULT_HOTELS)); } catch(e) {}
    return DEFAULT_HOTELS;
  },

  /** Принудительная перезагрузка из localStorage */
  reloadFromCache() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length >= 10) {
          _memoryCache = parsed;
          return parsed;
        }
      }
    } catch(e) {}
    return this._localCache();
  },

  /** Загрузка данных с сервера / статического файла с 3 уровнями надёжности */
  async fetchFromCloud() {
    // 1. Попытка: серверный API /api/hotels
    try {
      const res = await fetch(API_URL + '?_t=' + Date.now(), {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.hotels) && data.hotels.length >= 10) {
          _memoryCache = data.hotels;
          try { localStorage.setItem(this.KEY, JSON.stringify(data.hotels)); } catch(e) {}
          return data.hotels;
        }
      }
    } catch(e) {
      console.warn('fetchFromCloud API:', e.message);
    }

    // 2. Попытка: прямой статический файл ./data/hotels.json (доступен ВСЕГДА)
    try {
      const res = await fetch('./data/hotels.json?_t=' + Date.now(), {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length >= 10) {
          _memoryCache = list;
          try { localStorage.setItem(this.KEY, JSON.stringify(list)); } catch(e) {}
          return list;
        }
      }
    } catch(e) {
      console.warn('fetchFromCloud static file:', e.message);
    }

    // 3. Попытка: raw GitHub
    try {
      const res = await fetch('https://raw.githubusercontent.com/Caesar-creatoe/hip-uzbekistan/main/data/hotels.json?_t=' + Date.now());
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length >= 10) {
          _memoryCache = list;
          try { localStorage.setItem(this.KEY, JSON.stringify(list)); } catch(e) {}
          return list;
        }
      }
    } catch(e) {}

    return this._localCache();
  },

  /** Получить все отели (синхронно, гарантированно >= 32 отеля) */
  getAll() {
    return this._localCache();
  },

  /** Получить все отели асинхронно — всегда свежие из облака (TTL 5 мин) */
  async getAllAsync() {
    const now = Date.now();
    const cacheAge = now - _lastCloudFetch;
    const cached = this._localCache();

    // Если кеш свежий (< 5 мин) — возвращаем его, синхронизация в фоне
    if (cached && cached.length >= 25 && cacheAge < CACHE_TTL_MS) {
      // Фоновое обновление: если кеш старше 2 мин — тихо обновляем
      if (cacheAge > 2 * 60 * 1000) {
        this.fetchFromCloud().then(fresh => {
          if (fresh && fresh.length >= 10) {
            window.dispatchEvent(new CustomEvent('sri_hotels_updated', { detail: fresh }));
          }
        }).catch(() => {});
      }
      return cached;
    }

    // Кеш устарел или пуст — загружаем из облака
    const cloud = await this.fetchFromCloud();
    if (cloud && cloud.length >= 10) {
      _lastCloudFetch = Date.now();
      window.dispatchEvent(new CustomEvent('sri_hotels_updated', { detail: cloud }));
      return cloud;
    }
    return cached || [];
  },


  getById(idOrSlug) {
    if (!idOrSlug) return null;
    const all = this._localCache();
    const q = String(idOrSlug).toLowerCase().trim();
    return all.find(h => (h.id && String(h.id).toLowerCase() === q) || (h.slug && String(h.slug).toLowerCase() === q)) || null;
  },

  cleanForSave(hotels) {
    return hotels.map(h => {
      const copy = { ...h };
      if (copy.presentationFile) {
        if (typeof copy.presentationFile === 'string' && copy.presentationFile.startsWith('data:')) {
          if (copy.id && window.SriDB) window.SriDB.set('pres_' + copy.id, { data: copy.presentationFile, name: copy.presentationFileName || '' });
        }
        delete copy.presentationFile;
      }
      return copy;
    });
  },

  /**
   * Сохранить список отелей:
   * 1. Немедленно обновляет память и localStorage текущего браузера
   * 2. Оповещает все вкладки (каталог, админку, паспорт) через Event, storage и BroadcastChannel
   * 3. Отправляет POST в API для коммита в GitHub
   */
  async save(hotels) {
    const clean = this.cleanForSave(hotels);

    // 1. Мгновенное локальное сохранение
    _memoryCache = clean;
    try {
      localStorage.setItem(this.KEY, JSON.stringify(clean));
      localStorage.setItem('sri_hotels_last_updated', String(Date.now()));
    } catch(e) {}

    // 2. Локальное событие для открытой страницы
    window.dispatchEvent(new CustomEvent('sri_hotels_updated', { detail: clean }));

    // 3. Синхронизация между разными вкладками в реальном времени
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('sri_hotels_sync');
        bc.postMessage({ type: 'HOTELS_UPDATED', count: clean.length, timestamp: Date.now() });
        bc.close();
      } catch(e) {}
    }

    // 4. Отправка в GitHub через серверный API В ФОНЕ (не замораживая UI)
    const secret = getAdminSecret();
    const writeHeaders = { 'Content-Type': 'application/json' };
    if (secret) writeHeaders['X-Admin-Secret'] = secret;

    _lastCloudFetch = Date.now(); // считаем свежим — только что сохранили
    fetch(API_URL, {
      method: 'POST',
      headers: writeHeaders,
      body: JSON.stringify({ hotels: clean, _confirmed: true })
    }).then(async res => {
      if (res.ok) {
        const result = await res.json().catch(() => ({}));
        console.log('✅ Отели синхронизированы с GitHub:', result.count || clean.length);
        window.dispatchEvent(new CustomEvent('sri_hotels_synced', { detail: { count: result.count || clean.length } }));
      } else if (res.status === 401) {
        console.error('❌ Синхронизация отклонена: неверный ADMIN_SECRET. Данные сохранены локально.');
        window.dispatchEvent(new CustomEvent('sri_hotels_sync_error', { detail: { status: 401, message: 'Неверный ADMIN_SECRET — настройте переменную в Vercel' } }));
      } else {
        console.warn('Фоновый POST API вернул статус:', res.status);
      }
    }).catch(e => {
      console.warn('Фоновый POST API сетевой сбой:', e.message);
    });

    return true; // Мгновенный возврат!
  },


  async add(hotel) {
    const hotels = [...this.getAll()];
    hotel.id = hotel.id || ('sri_' + Date.now().toString(36));
    hotel.slug = hotel.slug || (hotel.hotelName ? hotel.hotelName.toLowerCase().replace(/[^a-z0-9\u0430-\u044f\u0451]+/g, '-').replace(/^-|-$/g, '') : hotel.id);
    hotel.createdAt = hotel.createdAt || new Date().toISOString();
    const idx = hotels.findIndex(h => h.id === hotel.id || (h.slug && h.slug === hotel.slug));
    if (idx !== -1) hotels[idx] = { ...hotels[idx], ...hotel, updatedAt: new Date().toISOString() };
    else hotels.push(hotel);
    return await this.save(hotels);
  },

  async update(id, data) {
    const hotels = [...this.getAll()];
    const idx = hotels.findIndex(h => h.id === id || h.slug === id);
    if (idx === -1) return false;
    hotels[idx] = { ...hotels[idx], ...data, updatedAt: new Date().toISOString() };
    return await this.save(hotels);
  },

  async delete(id) {
    const hotels = this.getAll().filter(h => h.id !== id && h.slug !== id);
    if (typeof window !== 'undefined' && window.SriDB) {
      window.SriDB.delete('pres_' + id);
      window.SriDB.delete('photos_' + id);
    }
    return await this.save(hotels);
  },

  async resetToDefaults() {
    await this.save(DEFAULT_HOTELS);
    return DEFAULT_HOTELS;
  },

  async syncWithCloud() {
    const hotels = await this.fetchFromCloud();
    if (hotels && hotels.length >= 10) {
      window.dispatchEvent(new CustomEvent('sri_hotels_updated', { detail: hotels }));
      return hotels;
    }
    return false;
  }
};

// Экспорт в глобальную область
if (typeof window !== 'undefined') {
  window.parseAmenities = parseAmenities;
  window.DEFAULT_HOTELS = DEFAULT_HOTELS;
  window.HotelStore = HotelStore;

  // Кросс-вкладочная синхронизация через storage event
  window.addEventListener('storage', (e) => {
    if (e.key === HotelStore.KEY || e.key === 'sri_hotels_last_updated') {
      const updated = HotelStore.reloadFromCache();
      window.dispatchEvent(new CustomEvent('sri_hotels_updated', { detail: updated }));
    }
  });

  // Кросс-вкладочная синхронизация через BroadcastChannel
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('sri_hotels_sync');
      bc.onmessage = (msg) => {
        if (msg && msg.data && msg.data.type === 'HOTELS_UPDATED') {
          const updated = HotelStore.reloadFromCache();
          window.dispatchEvent(new CustomEvent('sri_hotels_updated', { detail: updated }));
        }
      };
    } catch(e) {}
  }

  // При загрузке страницы фоново синхронизируем данные
  HotelStore.fetchFromCloud().then(hotels => {
    if (hotels && hotels.length >= 10) {
      window.dispatchEvent(new CustomEvent('sri_hotels_updated', { detail: hotels }));
    }
  });
}
