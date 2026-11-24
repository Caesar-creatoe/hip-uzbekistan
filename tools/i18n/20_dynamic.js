/* ── Даты, мелкие подписи и абзацы, где числа подставляет скрипт ── */
var MONTHS = { 'января': 'January', 'февраля': 'February', 'марта': 'March', 'апреля': 'April', 'мая': 'May', 'июня': 'June', 'июля': 'July', 'августа': 'August', 'сентября': 'September', 'октября': 'October', 'ноября': 'November', 'декабря': 'December' };
P.unshift([/(\d{1,2}) (января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря) (\d{4})( г\.| года)?/g, function (m, d, mo, y) { return d + ' ' + MONTHS[mo] + ' ' + y; }]);
P.push([/^обновлено (.+)$/g, 'updated $1']);
Object.assign(T, {
  'Валюта:': 'Currency:', 'методология STR Global / USALI': 'STR Global / USALI methodology', 'Активный объект': 'Active property',
  'по тарифу': 'by rate', 'по загрузке': 'by occupancy', 'по доходу на номер': 'by revenue per room', 'и документы': 'and documents', 'и сервисы': 'and services',
  'и контакты': 'and contacts', 'Удобства': 'Amenities', 'Локация': 'Location', 'Объект': 'Property', 'Цена': 'Price', 'по запросу': 'on request',
  'Маржа GOP': 'GOP margin', 'Средний срок проживания': 'Average length of stay', 'Масштабные проекты': 'Large-scale projects', 'нового поколения': 'of a new generation',
  'Район без категорийных гостиниц': 'District without rated hotels', '+50% к субсидии за номер': '+50% to the per-room subsidy', 'Цена за м²': 'Price per m²',
  'Цена за m²': 'Price per m²', 'Цена за номер': 'Price per room', 'средние значения': 'average values', 'как считаем': 'how we calculate', 'Как считаем': 'How we calculate',
  'Средний тариф': 'Average rate', 'Средний тариф (ADR)': 'Average rate (ADR)', 'Договор франшизы с международным брендом': 'Franchise agreement with an international brand',
  'доплата за номер в течение 3 лет': 'co-payment per room for 3 years', 'Плановый резерв FF&E и реновация': 'Planned FF&E reserve and renovation',
  'Плановый резерв FF&amp;E и реновация': 'Planned FF&E reserve and renovation', 'Источник:': 'Source:', 'Госкомстат через Trend': 'Statistics Agency via Trend',
  'Госкомстат': 'Statistics Agency', 'Завершение: внутренняя отделка, инженерия номеров, мебель и оборудование (оценка владельца)': 'Completion: interior finishing, room utilities, furniture and equipment (owner estimate)',
  'Достройка: кровля, фасад, инженерия, отделка (оценка владельца). Всего с покупкой ~$49 млн': 'Completion: roof, facade, utilities, finishing (owner estimate). ~$49M in total including the purchase',
  'Объём услуг проживания и питания.': 'Volume of accommodation and food services.', 'Статистика': 'Statistics'
});
Object.assign(H, {
  'Встречи с владельцами — <a href="b2b.html">на инвестфоруме или онлайн</a>': 'Meetings with owners — <a href="b2b.html">at the investment forum or online</a>',
  'Не выбраны — <a href="#pick">отметьте в списке</a> или опишите в комментарии': 'None selected — <a href="#pick">tick them in the list</a> or describe in the comment',
  'Данные Госкомстата и Комитета по туризму. <a href="market.html">Источники и подробности</a>.': 'Statistics Agency and Tourism Committee data. <a href="market.html">Sources and details</a>.',
  'Субсидия за номер, доплата за бренд, −90% налога на землю и имущество. <a href="incentives.html">Все меры</a>': 'Per-room subsidy, a brand co-payment, −90% land and property tax. <a href="incentives.html">All measures</a>',
  'Государство доплачивает за международную франшизу: <a href="incentives.html">$200–600 за номер в год, 3 года</a>': 'The state co-pays for an international franchise: <a href="incentives.html">$200–600 per room per year, 3 years</a>',
  'Субсидии на строительство и оснащение номеров, доплата за международную франшизу, сниженные налоги на землю и имущество. <a href="incentives.html">Все меры поддержки</a>.': 'Subsidies for building and equipping rooms, a co-payment for an international franchise, reduced land and property taxes. <a href="incentives.html">All support measures</a>.',
  'У каждого показателя указан тип: «факт» — по отчётности объекта, «оценка» — расчёт платформы по данным объекта и рынка. Подтверждённые цифры передаём после NDA. <a href="platform.html#method">Как считаем</a>.': 'Each metric shows its type: “actual” — from the property\'s reports, “estimate” — the platform\'s calculation based on property and market data. Confirmed figures are shared after NDA. <a href="platform.html#method">How we calculate</a>.'
});
/* Абзацы, где числа меняет скрипт: шаблоны по всему абзацу */
HP.push(
  [/^<span data-b="cities">(\d+)<\/span> город\S*, больше половины — в Ташкенте\.$/, '<span data-b="cities">$1</span> cities, more than half in Tashkent.'],
  [/^([\d\s,]+) мест\. В среднем <span data-b="avg">(\d+)<\/span> номер\S* на отель\.$/, function (m, a, b) { return a.replace(/\s/g, ',') + ' beds. On average <span data-b="avg">' + b + '</span> rooms per hotel.'; }],
  [/^<span data-b="hotels">(\d+)<\/span> брендов\S* отел\S* в <span data-b="cities">(\d+)<\/span> город\S*$/, '<span data-b="hotels">$1</span> branded hotels in <span data-b="cities">$2</span> cities'],
  [/^Действующие отели по данным Центра сертификации туристских услуг на <span data-b="asof">([\d.]+)<\/span>\.$/, 'Operating hotels according to the Certification Center for Tourism Services as of <span data-b="asof">$1</span>.'],
  [/^<b><span data-sr="count">(\d+)<\/span> <span data-sr="count-word">\S+<\/span><\/b> из государственного реестра — с ценой и финансовыми показателями\.$/, '<b><span data-sr="count">$1</span> <span data-sr="count-word">hotels</span></b> from the state registry — with a price and financial metrics.'],
  [/^<span data-m="count2">(\d+)<\/span> <span data-m="w-objects">\S+<\/span> в <span data-m="regions">(\d+)<\/span> регион\S* — с ценой, загрузкой и окупаемостью\.$/, '<span data-m="count2">$1</span> <span data-m="w-objects">properties</span> in <span data-m="regions">$2</span> regions — with price, occupancy and payback.'],
  [/^<span data-b="tash-share2">(\d+%)<\/span> брендовых номеров — в Ташкенте\. (.*)$/, '<span data-b="tash-share2">$1</span> of branded rooms are in Tashkent. In the regions where tourist flow is growing there is no international hotel yet, or just one. For a chain it is an open market; for an owner, a chance to be first.'],
  [/^Объём услуг проживания и питания\. <a href="([^"]+)" target="_blank" rel="noopener">Госкомстат<\/a>$/, 'Volume of accommodation and food services. <a href="$1" target="_blank" rel="noopener">Statistics Agency</a>'],
  [/^Источник: Центр сертификации туристских услуг при Комитете по туризму, данные на <span data-b="asof">([\d.]+)<\/span>\. (.*)$/, 'Source: Certification Center for Tourism Services under the Tourism Committee, data as of <span data-b="asof">$1</span>. Chain and brand names are given for information and belong to their owners; the chains are not partners of the platform.'],
  [/^Для всех объектов — одни формулы по стандарту отельной отчётности USALI\. «Факт» — из отчётности объекта за полный год \(так отмечено <b data-p="fact">(\d+)<\/b> из <b data-p="count3">(\d+)<\/b> объектов\)\. «Оценка» — расчёт платформы по номерному фонду, категории и рынку региона\.$/, 'The same formulas based on the USALI hotel reporting standard apply to all properties. “Actual” comes from the property\'s reports for a full year (<b data-p="fact">$1</b> of <b data-p="count3">$2</b> properties are marked this way). “Estimate” is the platform\'s calculation based on room inventory, category and the regional market.']
);
Object.assign(H, {
  'Экономика <span>объекта</span>': 'Property <span>economics</span>',
  'Фото <span id="pp-photo-sub">объекта</span>': 'Photos <span id="pp-photo-sub">of the property</span>'
});
/* Заголовки в две строки: переводим целиком, чтобы не сбился порядок слов */
Object.assign(H, {
  'Презентация<br>объекта': 'Property<br>presentation',
  'Встреча, за которой<br>стоит государство': 'A meeting backed<br>by the state',
  'Четыре способа<br>войти в проект': 'Four ways<br>to enter a project',
  'Как считаются<br>показатели': 'How the metrics<br>are calculated',
  'Как проходит<br>встреча': 'How the meeting<br>works',
  'Двенадцать сетей,<br>тридцать два бренда': 'Twelve chains,<br>thirty-two brands',
  'Какие отели<br>выбирают сети': 'Which hotels<br>chains choose',
  'Три меры, которые<br>меняют окупаемость': 'Three measures that<br>change the payback',
  'Дальние рынки<br>растут быстрее всех': 'Long-haul markets<br>grow fastest',
  'Кто приезжает<br>и куда едет': 'Who comes<br>and where they go',
  'Между владельцем<br>и инвестором': 'Between the owner<br>and the investor',
  '2026 год: рост<br>продолжается': '2026: growth<br>continues',
  'Налоги для гостиниц<br>и турбизнеса': 'Taxes for hotels<br>and tourism business',
  'Отели, открытые<br><em>для инвестиций</em>': 'Hotels open<br><em>for investment</em>'
});
