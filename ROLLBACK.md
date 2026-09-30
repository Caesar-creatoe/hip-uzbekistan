# ROLLBACK — Home Redesign

## Резервная копия
- Файл: `backup/index.html.bak`
- Git tag: `backup-before-home-redesign`
- Branch: `redesign-home`

## Что изменено
- `index.html` — полная визуальная переработка главной страницы
- `css/home-v2.css` — новые стили (только главная страница)
- `js/home-v2.js` — новый JS (только главная страница)

## Откат одной командой
```bash
git checkout backup-before-home-redesign -- index.html
# или
cp backup/index.html.bak index.html
```

## НЕ изменялось
- Все остальные страницы (portfolio.html, passport.html и др.)
- Общие файлы стилей (design-tokens.css, styles/*.css)
- JS файлы (js/megamenu.js, js/hotels-data.js, js/main.js, js/verticals.js)
- Логика администратора (js/admin.js, admin.html)
- API файлы (api/)
- Данные (data/hotels.json)
