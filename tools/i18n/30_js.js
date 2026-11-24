/* ── Строки из скриптов: редкие состояния (ошибки, пустые списки, подсказки) ── */
Object.assign(T, {
  'На аудите': 'Under audit', 'Сертифицирован': 'Certified', 'Стандарт': 'Standard', 'Добавьте отели через панель управления': 'Add hotels via the admin panel',
  'Звёздность': 'Star rating', 'Гостиничный объект': 'Hotel property', 'Прогноз': 'Forecast', 'Аудировано': 'Audited', 'Оценка': 'Estimate', 'Факт': 'Actual',
  'Адрес уточняется': 'Address to be confirmed', 'Фотографии объекта появятся после проверки паспорта.': 'Property photos will appear after the passport is verified.',
  'Н/Д': 'N/A', 'Не проверено': 'Not verified', 'Верифицировано Комитетом': 'Verified by the Committee',
  'Occupancy должен быть от 0 до 100%': 'Occupancy must be between 0 and 100%', 'EBITDA не может превышать Total Revenue': 'EBITDA cannot exceed Total Revenue',
  'GOP не может превышать Total Revenue': 'GOP cannot exceed Total Revenue', 'IRR должен быть от 0 до 100%': 'IRR must be between 0 and 100%',
  'Cap Rate должен быть от 0 до 100%': 'Cap Rate must be between 0 and 100%',
  'Запрос документов': 'Document request', 'Запрос документов (NDA)': 'Document request (NDA)', 'Размещение объекта': 'Property listing', 'Вопрос': 'Question',
  'Запрос от гостиничной сети': 'Request from a hotel chain', 'Онлайн-отправка сейчас недоступна.': 'Online submission is unavailable right now.',
  'Отправьте заявку письмом': 'Send the request by email', '— текст уже заполнен': '— the text is already filled in', 'Пока нет объектов.': 'No properties yet.',
  'Национальный банк ВЭД РУз': 'National Bank of Uzbekistan (NBU)',
  '01 / КАТЕГОРИЯ ПЛАТФОРМЫ': '01 / PLATFORM CATEGORY', '02 / КАТЕГОРИЯ ПЛАТФОРМЫ': '02 / PLATFORM CATEGORY', '03 / КАТЕГОРИЯ ПЛАТФОРМЫ': '03 / PLATFORM CATEGORY',
  '04 / ГОСУДАРСТВЕННЫЙ СЕКТОР': '04 / PUBLIC SECTOR', 'Гостиничные комплексы': 'Hotel complexes',
  'Отели, курортные комплексы и бутик-отели Узбекистана: цена, номерной фонд, расчёт доходности и паспорт объекта.': 'Hotels, resort complexes and boutique hotels of Uzbekistan: price, room inventory, yield calculation and a property passport.',
  '4 формата сделки': '4 deal formats', 'Ресторанные проекты': 'Restaurant projects',
  'Высокодоходные ресторанные концепции, панорамные заведения и гастрономические пространства в ключевых туристических центрах.': 'High-yield restaurant concepts, panoramic venues and gastronomic spaces in key tourist centers.',
  '6 проектов': '6 projects', 'Ташкент и Самарканд': 'Tashkent and Samarkand', 'Продажа, франшиза, аренда': 'Sale, franchise, lease', 'Смотреть рестораны': 'View restaurants',
  'Земельные участки': 'Land plots', 'Участки под строительство гостиничных и рекреационных комплексов с готовой инфраструктурой, кадастровыми паспортами и мастер-планами.': 'Plots for building hotel and recreation complexes with ready infrastructure, cadastral passports and master plans.',
  '8 лотов': '8 lots', 'Аренда до 49 лет': 'Lease for up to 49 years', 'Под туристические объекты': 'For tourism properties', 'Смотреть земельный банк': 'View the land bank',
  'Государственная поддержка': 'State support', 'Меры государственной поддержки туристической отрасли, субсидирование строительства номерного фонда и институциональные налоговые преференции.': 'State support measures for the tourism industry, subsidies for building room inventory and institutional tax preferences.',
  '16 мер поддержки': '16 support measures', 'Субсидии и компенсации': 'Subsidies and compensation', 'Калькулятор на сайте': 'Calculator on the website', 'Изучить меры поддержки': 'Explore support measures',
  'Ичан-Кала, Хива': 'Ichan-Kala, Khiva', 'Крепость Арк': 'Ark Fortress', 'Комплекс Имама аль-Бухари': 'Imam al-Bukhari Complex', 'Центр исламской цивилизации': 'Center of Islamic Civilization',
  'Объекты готовятся': 'Properties are being prepared', 'Комплекс Имам аль-Бухари': 'Imam al-Bukhari Complex', 'Зомин': 'Zomin'
});
P.push(
  [/^(\d+) отел(ь|я|ей) в каталоге$/g, function (m, n) { return n + ' ' + pl(n, 'hotel', 'hotels') + ' in the catalog'; }],
  [/(\d+) фотографи(я|и|й)/g, function (m, n) { return n + ' ' + pl(n, 'photo', 'photos'); }],
  [/(\d+) мер(ы)? поддержки/g, '$1 support measures'],
  [/Сумма статей выручки \(([^)]*)\) не совпадает с Total Revenue \(([^)]*)\)/g, 'The sum of revenue items ($1) does not match Total Revenue ($2)']
);
Object.assign(T, {
  'проданные номеро-ночи ÷ доступные': 'room-nights sold ÷ available', 'выручка от номеров ÷ проданные ночи': 'room revenue ÷ nights sold', 'ADR × загрузка': 'ADR × occupancy',
  'выручка − операционные расходы': 'revenue − operating expenses', 'GOP − управленческие и постоянные расходы': 'GOP − management and fixed costs',
  'цена объекта ÷ EBITDA': 'property price ÷ EBITDA', 'EBITDA ÷ цена объекта': 'EBITDA ÷ property price', 'NOI (или EBITDA) ÷ цена': 'NOI (or EBITDA) ÷ price',
  'потоки на 10 лет с продажей в конце': '10-year cash flows with a sale at the end', 'потоки на 10 лет, ставка обычно 12%': '10-year cash flows, rate usually 12%'
});
Object.assign(T, { 'Отели Узбекистана для инвесторов': 'Uzbekistan hotels for investors' });
Object.assign(T, { 'отеля международных брендов: Hilton, Wyndham, Accor, Hyatt, Marriott': 'international brand hotels: Hilton, Wyndham, Accor, Hyatt, Marriott' });
