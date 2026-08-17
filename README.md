# Hotel Investment Portfolio (HIP Uzbekistan)
### Цифровая платформа инвестиционных паспортов гостиничных объектов Республики Узбекистан
**Комитет по туризму Республики Узбекистан · Официальный портал**

---

## 📌 О платформе

**Hotel Investment Portfolio (HIP)** — государственная инвестиционная платформа, разработанная для стандартизации, андеррайтинга и привлечения институционального капитала в гостиничный сектор Республики Узбекистан в соответствии со стандартами **USALI 11th Edition**, **STR Global**, **IFC** и **EBRD**.

---

## 🗺️ Структура платформы (4 Тома + 4 Сервиса)

| Страница | Описание | Технологии / Модули |
|---|---|---|
| **[`index.html`](index.html)** | **Главный портальный хаб** | Платформенные KPI ($4.2B+, 150+ отелей), 4 шага работы, 6 принципов, витрина каталога |
| **[`about.html`](about.html)** | **Том I: Методические рекомендации** | Нормативный лонгрид: 7 принципов, классификация 6 категорий, глоссарий USALI, скоринг IRI (A+–C), регламент Data Room |
| **[`passport.html`](passport.html)** | **Том II: Hotel Investment Passport** | Готовый паспорт Grand Tashkent 5★: сплит-обложка, QR-код верификации, Investment Dashboard, интерактивная карта Leaflet (CartoDB Dark Matter), печать A4 PDF (`@media print`) |
| **[`form.html`](form.html)** | **Том III: Smart Investment Form** | 5-шаговый ввод 250+ параметров, Live Analytics Terminal (расчет ADR, RevPAR, EBITDA Margin, Payback, ROI, IRR, скоринг IRI), демо-заполнение, экспорт в JSON |
| **[`tech-spec.html`](tech-spec.html)** | **Том IV: Technical Specification** | Архитектура системы, ER-схема PostgreSQL, OpenAPI эндпоинты, математическая модель скоринга, безопасность Data Room (AES-256) |
| **[`tourism-types.html`](tourism-types.html)** | **Виды туризма и кластеры** | Интерактивный атлас 5 кластеров (Культурный/Зиёрат, MICE, Горный, Wellness, Эко) с аккордеонами и нишами доходности |
| **[`registries.html`](registries.html)** | **Государственные реестры** | 4 реестра: сертифицированные отели (1★–5★), инвест-лоты (земля), субсидии ПКМ № 308, аккредитованные операторы (JLL, CBRE, PwC, Marriott) |
| **[`portfolio.html`](portfolio.html)** | **Каталог объектов** | Клиентская фильтрация по регионам, категории ★, модели сделки и рейтингу готовности IRI |

---

## 🎨 Дизайн-система (Institutional Editorial Standard)

* **Цветовая палитра**: Пергамент (`#F7F4EC`), глубокий индиго (`#12213B`), самаркандская бирюза (`#1E6F7C`), бухарская терракота (`#A9673E`), тонкие hairline-границы `1px` (`#D8D2C4` / `#2C3E5A`).
* **Типографическая система**:
  * Заголовки / Display: `PT Serif`
  * Интерфейс / Body: `Golos Text`
  * Финансовые метрики / Табличные данные: `JetBrains Mono`
* **Языковые версии**: Интерактивное переключение `RU` / `UZ` / `EN` с сохранением в `localStorage`.

---

## 🚀 Быстрый запуск и деплой

### 1. Локальный просмотр
Так как проект написан на чистом нативном стеке (HTML5 / Vanilla CSS3 / Modern ES6 JS), для его работы не требуется сборка `npm run build`:
```bash
# Вариант 1: Открыть index.html напрямую в браузере
open index.html

# Вариант 2: Запустить локальный HTTP-сервер
npx serve .
# или
python3 -m http.server 8000
```

### 2. Деплой на Vercel (1 команда)
```bash
npx vercel
```

### 3. Деплой на Netlify (1 команда)
```bash
npx netlify deploy --prod --dir=.
```

### 4. Деплой на GitHub Pages
1. Создайте репозиторий на [GitHub](https://github.com/new).
2. Выполните:
```bash
git remote add origin https://github.com/ВАШ_ЛОГИН/hotel-investment-portfolio.git
git push -u origin main
```
3. В настройках репозитория (*Settings -> Pages*) выберите ветку `main` и нажмите **Save**.

---

&copy; 2026 Комитет по туризму Республики Узбекистан. Все права защищены.
