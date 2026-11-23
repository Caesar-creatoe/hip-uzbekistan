# Возврат к прошлой версии

## Полная версия платформы (до упрощения, 23.11.2026)

Перед упрощением сайта вся прежняя версия сохранена в ветке
**`archive/full-platform`** (коммит `363f083`). В ней есть всё, что было убрано:

- кабинеты инвестора, отеля, ресторатора и Центра сертификации;
- модуль сертификации (заявка, реестр, сертификат, кабинет инспектора);
- Smart Investment Form, реестры, оценка качества KQI, «Услуги»;
- «Партнёрам» (B2B), государственные мероприятия (events-app);
- тома документации, «Виды туризма», рестораны и земельные участки;
- старая страница господдержки с калькулятором.

### Вернуть всё целиком
```bash
git checkout main
git reset --hard archive/full-platform   # или: git revert <коммиты упрощения>
git push --force-with-lease origin main
```

### Вернуть один модуль (пример — сертификация)
```bash
git checkout archive/full-platform -- certification.html certification-apply.html \
  certification-registry.html certificate.html cabinet-inspector.html \
  js/cert-api.js js/cert-ui.js css/certification.css styles/certification.css \
  data/cert-demo.json data/cert-checklist-template.json
```
После возврата страниц убрать их адреса из блока `redirects` в `vercel.json`.

## Что изменилось в упрощённой версии
- Меню: Каталог · Рынок · Льготы · Как купить · О платформе + «Разместить объект».
- Новые страницы: `market.html`, `incentives.html`; переписаны `investors.html`
  («Как купить»), `business.html` («Разместить объект»), `platform.html` («О платформе»).
- Заявки со всех форм идут в `api/lead.js` → Telegram и/или почта
  (ключи в Vercel: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `RESEND_API_KEY`, `LEAD_EMAIL_TO`).
- Старые адреса перенаправляются (`vercel.json` → `redirects`).
