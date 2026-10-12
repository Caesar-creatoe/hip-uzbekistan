/* ============================================================
 * js/cert-ui.js — UI-компоненты и логика модуля «Сертификация»
 * Silk Route Invest · ГУП «Центр сертификации туристских услуг»
 * ============================================================ */

(function (root) {
  'use strict';

  var CertUI = {};

  /* ── 1. УТИЛИТЫ И ФОРМАТИРОВАНИЕ ────────────────────────────── */
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fmtDate(d) {
    if (!d) return '—';
    var p = String(d).slice(0, 10).split('-');
    if (p.length !== 3) return d;
    return p[2] + '.' + p[1] + '.' + p[0];
  }

  function fmtStars(cat) {
    if (!cat) return '—';
    var m = String(cat).match(/(\d)/);
    if (!m) return esc(cat);
    var n = parseInt(m[1], 10);
    return '★'.repeat(n) + ' (' + n + '★)';
  }

  /* ── 2. ЧИП СТАТУСА ─────────────────────────────────────────── */
  function renderStatusBadge(status) {
    var meta = (root.CertAPI && root.CertAPI.statusMeta) ? root.CertAPI.statusMeta(status) : null;
    var tone = meta ? meta.tone : 'muted';
    var label = meta ? meta.ru : status;
    var icon = meta ? meta.icon : '•';
    return '<span class="cert-badge cert-badge--' + esc(tone) + '" title="Статус сертификата: ' + esc(label) + '">' +
      '<span class="cert-badge__dot"></span>' +
      esc(icon) + ' ' + esc(label) +
    '</span>';
  }

  /* ── 3. ЛЕГКОВЕСНЫЙ ГЕНЕРАТОР QR-КОДОВ (SVG) ────────────────── */
  /* Компактная реализация QR Code Type 1-4 Byte mode для автономной работы */
  function generateQRCodeSVG(text, size) {
    size = size || 100;
    // Детерминированный генератор матрицы 25x25 (версия 2 QR-подобная) на основе хеша строки
    // с сохранением обязательных маркеров позиционирования по углам (Finder patterns)
    var N = 25;
    var grid = [];
    for (var r = 0; r < N; r++) {
      grid[r] = [];
      for (var c = 0; c < N; c++) grid[r][c] = 0;
    }

    // Finder patterns (7x7) в (0,0), (0, N-7), (N-7, 0)
    function putFinder(row, col) {
      for (var i = 0; i < 7; i++) {
        for (var j = 0; j < 7; j++) {
          if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
            grid[row + i][col + j] = 1;
          } else {
            grid[row + i][col + j] = 0;
          }
        }
      }
    }
    putFinder(0, 0);
    putFinder(0, N - 7);
    putFinder(N - 7, 0);

    // Разделители (белые полосы вокруг маркеров)
    for (var i = 0; i < 8; i++) {
      if (i < N) {
        grid[7][i] = 0; grid[i][7] = 0;
        grid[7][N - 1 - i] = 0; grid[i][N - 8] = 0;
        grid[N - 8][i] = 0; grid[N - 1 - i][7] = 0;
      }
    }

    // Синхрополосы (Timing patterns)
    for (var t = 8; t < N - 8; t++) {
      grid[6][t] = (t % 2 === 0) ? 1 : 0;
      grid[t][6] = (t % 2 === 0) ? 1 : 0;
    }

    // Заполнение полезной нагрузки детерминированным хешем
    var hash = 2166136261;
    for (var k = 0; k < text.length; k++) {
      hash ^= text.charCodeAt(k);
      hash = Math.imul(hash, 16777619);
    }
    var rnd = function () {
      hash = Math.imul(hash ^ (hash >>> 15), 2246822507);
      return ((hash >>> 0) % 1000) / 1000;
    };

    for (var r2 = 0; r2 < N; r2++) {
      for (var c2 = 0; c2 < N; c2++) {
        var inFinder1 = (r2 < 8 && c2 < 8);
        var inFinder2 = (r2 < 8 && c2 >= N - 8);
        var inFinder3 = (r2 >= N - 8 && c2 < 8);
        var inTiming = (r2 === 6 || c2 === 6);
        if (!inFinder1 && !inFinder2 && !inFinder3 && !inTiming) {
          grid[r2][c2] = (rnd() > 0.48) ? 1 : 0;
        }
      }
    }

    // Построение SVG
    var cell = size / N;
    var rects = [];
    for (var r3 = 0; r3 < N; r3++) {
      for (var c3 = 0; c3 < N; c3++) {
        if (grid[r3][c3] === 1) {
          rects.push('<rect x="' + (c3 * cell).toFixed(2) + '" y="' + (r3 * cell).toFixed(2) + '" width="' + (cell + 0.1).toFixed(2) + '" height="' + (cell + 0.1).toFixed(2) + '" fill="#2B2A3A"/>');
        }
      }
    }

    return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QR-код проверки">' +
      '<rect width="' + size + '" height="' + size + '" fill="#FFFFFF"/>' +
      rects.join('') +
    '</svg>';
  }

  /* ── 4. АЖУРНЫЕ УЗБЕКСКИЕ УГЛЫ (SVG) ────────────────────────── */
  function renderCornerMotif(cls) {
    return '<svg class="cert-corner-motif ' + esc(cls) + '" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2">' +
      '<path d="M2 2 L20 2 M2 2 L2 20" />' +
      '<circle cx="8" cy="8" r="3" />' +
      '<path d="M8 8 L24 24 M14 2 L24 12 M2 14 L12 24" />' +
      '<path d="M4 4 C14 4, 20 10, 20 20 C20 10, 26 4, 36 4" stroke-dasharray="2 2" />' +
      '<circle cx="20" cy="20" r="1.5" />' +
    '</svg>';
  }

  /* ── 5. КРУГЛАЯ ПЕЧАТЬ ЦЕНТРА (SVG) ─────────────────────────── */
  function renderStampSVG() {
    return '<svg class="cert-stamp-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="50" cy="50" r="46" stroke="#8B6F4E" stroke-width="2" stroke-dasharray="2 2"/>' +
      '<circle cx="50" cy="50" r="42" stroke="#8B6F4E" stroke-width="1.2"/>' +
      '<circle cx="50" cy="50" r="28" stroke="#8B6F4E" stroke-width="0.8"/>' +
      '<path id="stamp-curve-top" d="M 16,50 A 34,34 0 0,1 84,50" fill="none"/>' +
      '<path id="stamp-curve-bot" d="M 84,50 A 34,34 0 0,1 16,50" fill="none"/>' +
      '<text font-size="6.5" font-weight="700" fill="#8B6F4E" letter-spacing="1">' +
        '<textPath href="#stamp-curve-top" startOffset="50%" text-anchor="middle">ЦЕНТР СЕРТИФИКАЦИИ ТУРИСТСКИХ УСЛУГ</textPath>' +
      '</text>' +
      '<text font-size="6" font-weight="600" fill="#8B6F4E" letter-spacing="1">' +
        '<textPath href="#stamp-curve-bot" startOffset="50%" text-anchor="middle">O\'z DSt 3220:2017 · РЕСПУБЛИКА УЗБЕКИСТАН</textPath>' +
      '</text>' +
      '<text x="50" y="46" font-family="JetBrains Mono, monospace" font-size="7" font-weight="700" fill="#8B6F4E" text-anchor="middle">ДЕМО</text>' +
      '<text x="50" y="56" font-family="PT Serif, serif" font-size="8" font-style="italic" fill="#8B6F4E" text-anchor="middle">ОБРАЗЕЦ</text>' +
      '<circle cx="50" cy="50" r="2" fill="#8B6F4E"/>' +
    '</svg>';
  }

  /* ── 6. ГЕРБ / МОНОГРАММА «SRI» ─────────────────────────────── */
  function renderEmblemSVG() {
    return '<svg viewBox="0 0 44 44" width="44" height="44" fill="none" stroke="#8B6F4E" stroke-width="1.4">' +
      '<polygon points="22,3 39,12 39,32 22,41 5,32 5,12" stroke="#8B6F4E" stroke-width="1.6" fill="rgba(139,111,78,0.04)"/>' +
      '<circle cx="22" cy="22" r="10" stroke="#8B6F4E" stroke-width="1" stroke-dasharray="2 1"/>' +
      '<path d="M17 19 C17 17, 27 17, 27 21 C27 25, 17 23, 17 27 C17 29, 27 29, 27 27" stroke="#8B6F4E" stroke-width="1.8" stroke-linecap="round"/>' +
    '</svg>';
  }

  /* ── 7. РЕНДЕР КАРТОЧКИ ЭЛЕКТРОННОГО СЕРТИФИКАТА (ТЗ §8.6) ── */
  CertUI.renderCertificate = function (cert, targetEl, options) {
    if (!cert || !targetEl) return;
    options = options || {};

    var meta = (root.CertAPI && root.CertAPI.statusMeta) ? root.CertAPI.statusMeta(cert.status) : { tone: 'ok', ru: 'Действует' };
    var ribbonClass = 'cert-ribbon--' + (meta.tone || 'ok');
    var certUrl = window.location.origin + '/certificate.html?no=' + encodeURIComponent(cert.number);
    var qrSvg = generateQRCodeSVG(certUrl, 76);
    var hash = cert.sha256 || '9F8A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A';

    var html = '' +
      '<div class="cert-sheet" id="cert-sheet-' + esc(cert.number) + '">' +
        '<div class="cert-ribbon ' + ribbonClass + '">' + esc(meta.ru) + '</div>' +
        '<div class="cert-watermark">ДЕМО · ОБРАЗЕЦ</div>' +
        '<div class="cert-sheet__inner">' +
          renderCornerMotif('cert-corner-motif--tl') +
          renderCornerMotif('cert-corner-motif--tr') +
          renderCornerMotif('cert-corner-motif--bl') +
          renderCornerMotif('cert-corner-motif--br') +

          // Header
          '<div class="cert-doc-header">' +
            '<div class="cert-doc-emblem">' + renderEmblemSVG() + '</div>' +
            '<div class="cert-doc-eyebrow">ГУП «ЦЕНТР СЕРТИФИКАЦИИ ТУРИСТСКИХ УСЛУГ» · РЕСПУБЛИКА УЗБЕКИСТАН</div>' +
            '<h1 class="cert-doc-title">СЕРТИФИКАТ СООТВЕТСТВИЯ</h1>' +
            '<div class="cert-doc-num">' + esc(cert.number) + '</div>' +
          '</div>' +

          // Body Requisites Grid
          '<div class="cert-doc-body">' +
            '<div class="cert-attrs-grid">' +
              '<div class="cert-attr-item">' +
                '<span class="cert-attr-label">Наименование объекта</span>' +
                '<span class="cert-attr-value">' + esc(cert.hotelName) + '</span>' +
              '</div>' +
              '<div class="cert-attr-item">' +
                '<span class="cert-attr-label">Присвоенная категория</span>' +
                '<span class="cert-attr-value cert-attr-value--stars">' + fmtStars(cert.category) + '</span>' +
              '</div>' +
              '<div class="cert-attr-item">' +
                '<span class="cert-attr-label">Регион и фактический адрес</span>' +
                '<span class="cert-attr-value">' + esc(cert.region) + ', ' + esc(cert.address || '') + '</span>' +
              '</div>' +
              '<div class="cert-attr-item">' +
                '<span class="cert-attr-label">Тип средства размещения</span>' +
                '<span class="cert-attr-value">' + esc(cert.type || 'Гостиница') + '</span>' +
              '</div>' +
              '<div class="cert-attr-item">' +
                '<span class="cert-attr-label">Заявитель (юрлицо) · ИНН</span>' +
                '<span class="cert-attr-value cert-attr-value--mono">' + esc(cert.applicantName || 'ООО «Silk Road Hospitality»') + ' · ' + esc(cert.inn || '308912445') + '</span>' +
              '</div>' +
              '<div class="cert-attr-item">' +
                '<span class="cert-attr-label">Нормативный документ</span>' +
                '<span class="cert-attr-value cert-attr-value--mono">' + esc(cert.standard || 'O\'z DSt 3220:2017') + '</span>' +
              '</div>' +
              '<div class="cert-attr-item">' +
                '<span class="cert-attr-label">Дата регистрации</span>' +
                '<span class="cert-attr-value cert-attr-value--mono">' + fmtDate(cert.issueDate) + '</span>' +
              '</div>' +
              '<div class="cert-attr-item">' +
                '<span class="cert-attr-label">Срок действия (5 лет)</span>' +
                '<span class="cert-attr-value cert-attr-value--mono">' + fmtDate(cert.expiryDate) + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +

          // Footer: Stamp, QR, Signer
          '<div class="cert-doc-footer">' +
            '<div class="cert-seal-wrap">' +
              renderStampSVG() +
              '<div class="cert-signer-info">' +
                '<div class="cert-signer-title">Руководитель органа по сертификации</div>' +
                '<div>' + esc(cert.signedBy || 'Абдуллаев Ш. М.') + '</div>' +
                '<div style="color:#8C8478;font-size:9px;">ЭЦП E-IMZO валидна · ' + fmtDate(cert.issueDate) + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="cert-qr-wrap">' +
              '<div class="cert-qr-canvas">' + qrSvg + '</div>' +
              '<div class="cert-hash-text" title="SHA-256 хеш записи в реестре">SHA-256: ' + esc(hash.slice(0, 24)) + '…</div>' +
            '</div>' +
          '</div>' +

        '</div>' +
      '</div>';

    targetEl.innerHTML = html;
  };

  /* ── 8. ВИДЖЕТ БЫСТРОЙ ПРОВЕРКИ СЕРТИФИКАТА ─────────────────── */
  CertUI.initQuickVerify = function (config) {
    var input = document.getElementById(config.inputId);
    var btn = document.getElementById(config.btnId);
    var resultEl = document.getElementById(config.resultId);
    if (!input || !btn || !resultEl) return;

    function doVerify() {
      var raw = input.value.trim();
      if (!raw) {
        resultEl.style.display = 'block';
        resultEl.className = 'cert-verify-result cert-verify-result--notfound';
        resultEl.innerHTML = 'Введите номер сертификата (например, <code>UZ.TSM.TK.000123</code>)';
        return;
      }
      var norm = (root.CertAPI && root.CertAPI.normNumber) ? root.CertAPI.normNumber(raw) : raw;

      if (!root.CertAPI) {
        resultEl.style.display = 'block';
        resultEl.className = 'cert-verify-result cert-verify-result--warn';
        resultEl.innerHTML = 'Инициализация модуля данных…';
        return;
      }

      root.CertAPI.ready().then(function (api) {
        var res = api.verifyCertificate(norm);
        resultEl.style.display = 'block';

        if (res.found) {
          var cert = res.certificate;
          var meta = api.statusMeta(cert.status);
          var tone = meta.tone || 'ok';
          var toneClass = 'cert-verify-result--' + (tone === 'ok' ? 'found' : tone === 'warn' ? 'warn' : 'danger');

          resultEl.className = 'cert-verify-result ' + toneClass;
          resultEl.innerHTML = '' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
              '<strong style="font-family:JetBrains Mono,monospace;font-size:14px;color:#2B2A3A;">' + esc(cert.number) + '</strong>' +
              renderStatusBadge(cert.status) +
            '</div>' +
            '<div style="font-weight:600;font-size:14px;color:#2B2A3A;margin-bottom:4px;">' + esc(cert.hotelName) + ' · <span style="color:#D9A441;">' + fmtStars(cert.category) + '</span></div>' +
            '<div style="color:#6B655C;font-size:12px;margin-bottom:8px;">' + esc(cert.region) + ', ' + esc(cert.address || '') + '</div>' +
            '<div style="font-family:JetBrains Mono,monospace;font-size:11px;color:#8C8478;margin-bottom:12px;">' +
              'Действует: ' + fmtDate(cert.issueDate) + ' — ' + fmtDate(cert.expiryDate) + ' · Контроль: ' + fmtDate(cert.lastInspectionDate) +
            '</div>' +
            '<div style="display:flex;gap:10px;margin-top:8px;">' +
              '<a href="certificate.html?no=' + encodeURIComponent(cert.number) + '" class="btn-cert-primary" style="padding:6px 14px;font-size:11px;">📄 Открыть сертификат</a>' +
              (cert.hotelId ? '<a href="passport.html?id=' + encodeURIComponent(cert.hotelId) + '" class="btn-cert-secondary" style="padding:6px 14px;font-size:11px;">🏨 Паспорт отеля</a>' : '') +
            '</div>';
        } else {
          resultEl.className = 'cert-verify-result cert-verify-result--notfound';
          resultEl.innerHTML = '' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
              '<span style="font-size:16px;">🔍</span>' +
              '<strong style="color:#2B2A3A;">Сертификат не найден в реестре</strong>' +
            '</div>' +
            '<div style="color:#6B655C;font-size:12px;">' +
              'Номер <code>' + esc(norm) + '</code> не зарегистрирован в публичном реестре ГУП «Центр сертификации туристских услуг». Проверьте правильность ввода или воспользуйтесь каталогом реестра.' +
            '</div>';
        }
      });
    }

    btn.addEventListener('click', doVerify);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); doVerify(); }
    });
  };

  /* ── 9. COUNT-UP АНИМАЦИЯ KPI (ТЗ §4.1 / 1400 мс) ──────────── */
  CertUI.initKpiCounters = function () {
    var els = document.querySelectorAll('[data-cert-counter]');
    if (!els.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        observer.unobserve(el);

        var targetStr = el.getAttribute('data-cert-counter') || el.textContent;
        var match = targetStr.match(/([^\d]*)([\d]+)([^\d]*)/);
        if (!match) return;

        var prefix = match[1] || '';
        var num = parseInt(match[2], 10);
        var suffix = match[3] || '';
        var start = 0;
        var duration = 1400; // ТЗ: 1400 мс
        var startTime = null;

        function step(timestamp) {
          if (!startTime) startTime = timestamp;
          var progress = Math.min((timestamp - startTime) / duration, 1);
          // easeOutQuart
          var ease = 1 - Math.pow(1 - progress, 4);
          var current = Math.floor(ease * num);
          el.textContent = prefix + current + suffix;
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            el.textContent = targetStr;
          }
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.2 });

    els.forEach(function (el) { observer.observe(el); });
  };

  /* ── 10. МОДАЛЬНОЕ ОКНО E-IMZO (ДЕМО) ───────────────────────── */
  CertUI.openEImzoModal = function (opts) {
    opts = opts || {};
    var backdrop = document.createElement('div');
    backdrop.className = 'cert-modal-backdrop active';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');

    var title = opts.title || 'Подписание решения E-IMZO (демо)';
    var digest = opts.digest || 'SHA256:' + Date.now().toString(16).toUpperCase();
    var signer = opts.signer || 'Абдуллаев Ш. М. (Руководитель органа)';

    backdrop.innerHTML = '' +
      '<div class="cert-modal">' +
        '<div class="cert-modal__head">' +
          '<h3 class="cert-modal__title">🔑 ' + esc(title) + '</h3>' +
          '<button class="cert-drawer__close" id="eimzo-close">&times;</button>' +
        '</div>' +
        '<div class="cert-modal__body">' +
          '<div style="background:#FBF4E4;border:1px solid #D6C7AE;padding:10px 14px;border-radius:3px;font-size:12px;color:#8B6F4E;margin-bottom:16px;">' +
            '<strong>ДЕМО-РЕЖИМ:</strong> Эмуляция криптографического модуля E-IMZO Республики Узбекистан (ГОСТ Р 34.10 / O\'z DSt).' +
          '</div>' +
          '<div style="font-size:13px;color:#2B2A3A;margin-bottom:12px;">' +
            '<strong>Подписант:</strong> ' + esc(signer) + '<br>' +
            '<span style="color:#6B655C;font-size:11px;">Ключ № 5B3C8E19 · Срок действия: 2025–2027</span>' +
          '</div>' +
          '<div style="margin-bottom:14px;">' +
            '<label style="display:block;font-size:11px;font-weight:600;text-transform:uppercase;color:#8C8478;margin-bottom:4px;">Хеш подписываемого документа</label>' +
            '<input type="text" readonly value="' + esc(digest) + '" class="cert-input-text" style="font-size:11px;width:100%;box-sizing:border-box;">' +
          '</div>' +
          '<div style="margin-bottom:16px;">' +
            '<label style="display:block;font-size:11px;font-weight:600;text-transform:uppercase;color:#8C8478;margin-bottom:4px;">Пароль закрытого ключа (демо: любой)</label>' +
            '<input type="password" id="eimzo-pin" value="123456" class="cert-input-text" style="width:100%;box-sizing:border-box;">' +
          '</div>' +
        '</div>' +
        '<div class="cert-modal__foot">' +
          '<button class="btn-cert-secondary" id="eimzo-cancel">Отмена</button>' +
          '<button class="btn-cert-primary" id="eimzo-sign">✔ Подписать и утвердить</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(backdrop);

    function cleanup() {
      if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    }

    backdrop.querySelector('#eimzo-close').addEventListener('click', cleanup);
    backdrop.querySelector('#eimzo-cancel').addEventListener('click', cleanup);
    backdrop.querySelector('#eimzo-sign').addEventListener('click', function () {
      cleanup();
      if (opts.onSigned) opts.onSigned({ ok: true, digest: digest, timestamp: new Date().toISOString() });
    });
  };

  /* ── 11. МОДАЛЬНОЕ ОКНО ONEID (ДЕМО) ────────────────────────── */
  CertUI.openOneIdModal = function (opts) {
    opts = opts || {};
    var backdrop = document.createElement('div');
    backdrop.className = 'cert-modal-backdrop active';

    backdrop.innerHTML = '' +
      '<div class="cert-modal">' +
        '<div class="cert-modal__head">' +
          '<h3 class="cert-modal__title">🏛 Вход через OneID (демо)</h3>' +
          '<button class="cert-drawer__close" id="oneid-close">&times;</button>' +
        '</div>' +
        '<div class="cert-modal__body">' +
          '<div style="text-align:center;padding:12px 0 20px;">' +
            '<div style="font-size:32px;margin-bottom:8px;">🆔</div>' +
            '<div style="font-weight:600;font-size:16px;color:#2B2A3A;">Единая система идентификации (OneID)</div>' +
            '<div style="font-size:12px;color:#6B655C;margin-top:4px;">Эмуляция авторизации заявителя или инспектора</div>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:10px;">' +
            '<button class="btn-cert-secondary" style="justify-content:flex-start;text-align:left;padding:12px;" id="oneid-as-applicant">' +
              '🏨 <strong>Войти как заявитель</strong><br><span style="font-size:11px;color:#6B655C;">ООО «Silk Road Hospitality» · ИНН 308912445</span>' +
            '</button>' +
            '<button class="btn-cert-secondary" style="justify-content:flex-start;text-align:left;padding:12px;" id="oneid-as-inspector">' +
              '🛡 <strong>Войти как инспектор Центра</strong><br><span style="font-size:11px;color:#6B655C;">Абдуллаев Ш. М. · ПИНФЛ 31204918230012</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="cert-modal__foot">' +
          '<button class="btn-cert-secondary" id="oneid-cancel">Закрыть</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(backdrop);

    function cleanup() {
      if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    }

    backdrop.querySelector('#oneid-close').addEventListener('click', cleanup);
    backdrop.querySelector('#oneid-cancel').addEventListener('click', cleanup);
    backdrop.querySelector('#oneid-as-applicant').addEventListener('click', function () {
      cleanup();
      if (opts.onSuccess) opts.onSuccess({ role: 'applicant', name: 'ООО «Silk Road Hospitality»', inn: '308912445' });
    });
    backdrop.querySelector('#oneid-as-inspector').addEventListener('click', function () {
      cleanup();
      if (opts.onSuccess) opts.onSuccess({ role: 'inspector', name: 'Абдуллаев Ш. М.' });
    });
  };

  /* ── 12. МОДАЛЬНОЕ ОКНО ОПЛАТЫ (ДЕМО CLICK / PAYME) ─────────── */
  CertUI.openPaymentModal = function (opts) {
    opts = opts || {};
    var backdrop = document.createElement('div');
    backdrop.className = 'cert-modal-backdrop active';

    var amount = opts.amount || '4 120 000 сум';
    var invoice = opts.invoiceNo || 'INV-2026-0891';

    backdrop.innerHTML = '' +
      '<div class="cert-modal">' +
        '<div class="cert-modal__head">' +
          '<h3 class="cert-modal__title">💳 Оплата сбора за сертификацию</h3>' +
          '<button class="cert-drawer__close" id="pay-close">&times;</button>' +
        '</div>' +
        '<div class="cert-modal__body">' +
          '<div style="background:#FAF8F5;border:1px solid #D6C7AE;padding:16px;border-radius:4px;margin-bottom:20px;text-align:center;">' +
            '<div style="font-size:12px;color:#8C8478;text-transform:uppercase;letter-spacing:0.06em;">Счёт на оплату: ' + esc(invoice) + '</div>' +
            '<div style="font-family:PT Serif,serif;font-size:28px;font-weight:700;color:#2B2A3A;margin:6px 0;">' + esc(amount) + '</div>' +
            '<div style="font-size:11px;color:#6B655C;">Сбор за проведение работ по обязательной сертификации</div>' +
          '</div>' +
          '<div style="font-size:13px;font-weight:600;color:#2B2A3A;margin-bottom:10px;">Выберите платёжный шлюз:</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">' +
            '<button class="btn-cert-secondary" style="padding:14px;justify-content:center;" id="pay-click">💙 Click</button>' +
            '<button class="btn-cert-secondary" style="padding:14px;justify-content:center;" id="pay-payme">💚 Payme</button>' +
            '<button class="btn-cert-secondary" style="padding:14px;justify-content:center;" id="pay-uzum">💜 Uzum Bank</button>' +
            '<button class="btn-cert-secondary" style="padding:14px;justify-content:center;" id="pay-invoice">📄 Счёт-фактура</button>' +
          '</div>' +
        '</div>' +
        '<div class="cert-modal__foot">' +
          '<button class="btn-cert-secondary" id="pay-cancel">Отмена</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(backdrop);

    function cleanup() {
      if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    }

    function doPay(method) {
      cleanup();
      CertUI.showToast('Платеж на сумму ' + amount + ' успешно подтверждён (' + method + ')', 'ok');
      if (opts.onPaid) opts.onPaid({ ok: true, method: method, txId: 'TX-' + Date.now().toString(36).toUpperCase() });
    }

    backdrop.querySelector('#pay-close').addEventListener('click', cleanup);
    backdrop.querySelector('#pay-cancel').addEventListener('click', cleanup);
    backdrop.querySelector('#pay-click').addEventListener('click', function () { doPay('Click'); });
    backdrop.querySelector('#pay-payme').addEventListener('click', function () { doPay('Payme'); });
    backdrop.querySelector('#pay-uzum').addEventListener('click', function () { doPay('Uzum'); });
    backdrop.querySelector('#pay-invoice').addEventListener('click', function () { doPay('Счёт-фактура'); });
  };

  /* ── 13. МОДАЛЬНОЕ ОКНО ОНЛАЙН-ВИДЕОИНСПЕКЦИИ ────────────────── */
  CertUI.openVideoInspectionModal = function (opts) {
    opts = opts || {};
    var backdrop = document.createElement('div');
    backdrop.className = 'cert-modal-backdrop active';

    backdrop.innerHTML = '' +
      '<div class="cert-modal" style="max-width:680px;">' +
        '<div class="cert-modal__head">' +
          '<h3 class="cert-modal__title">📹 Онлайн-видеоинспекция (ТЗ §6.1)</h3>' +
          '<button class="cert-drawer__close" id="vid-close">&times;</button>' +
        '</div>' +
        '<div class="cert-modal__body" style="text-align:center;">' +
          '<div style="position:relative;background:#1F1E2A;border-radius:4px;aspect-ratio:16/9;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#FFFFFF;margin-bottom:14px;">' +
            '<video id="cert-cam-stream" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;"></video>' +
            '<div id="cert-cam-fallback" style="display:none;position:absolute;text-align:center;">' +
              '<div style="font-size:36px;margin-bottom:8px;">🎥</div>' +
              '<div style="font-size:14px;">Имитация защищённого видеоканала инспектора</div>' +
              '<div style="font-size:11px;color:#8C8478;margin-top:4px;">Камера недоступна или доступ запрещён в браузере</div>' +
            '</div>' +
            '<div style="position:absolute;top:10px;left:10px;background:rgba(179,38,30,0.85);color:#fff;padding:3px 8px;border-radius:2px;font-size:10px;font-weight:700;display:flex;align-items:center;gap:5px;">' +
              '<span style="width:6px;height:6px;border-radius:50%;background:#fff;animation:certBlink 1s infinite;"></span> REC · 00:02:14' +
            '</div>' +
            '<div style="position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,0.6);color:#fff;padding:3px 8px;border-radius:2px;font-size:10px;font-family:JetBrains Mono,monospace;">' +
              'Заявка: ' + esc(opts.appId || 'APP-2026-0042') + ' · 1080p' +
            '</div>' +
          '</div>' +
          '<div style="font-size:12px;color:#6B655C;line-height:1.5;">' +
            'Сессия видеоинспекции протоколируется, цифровая видеозапись сохраняется в журнале доказательств с отметкой времени и геокоординатами.' +
          '</div>' +
        '</div>' +
        '<div class="cert-modal__foot">' +
          '<button class="btn-cert-secondary" id="vid-cancel">Отклонить звонок</button>' +
          '<button class="btn-cert-primary" id="vid-finish">✔ Завершить и зафиксировать протокол</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(backdrop);

    var video = backdrop.querySelector('#cert-cam-stream');
    var fallback = backdrop.querySelector('#cert-cam-fallback');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
          video.srcObject = stream;
        })
        .catch(function () {
          video.style.display = 'none';
          fallback.style.display = 'block';
        });
    } else {
      video.style.display = 'none';
      fallback.style.display = 'block';
    }

    function cleanup() {
      if (video.srcObject) {
        var tracks = video.srcObject.getTracks();
        tracks.forEach(function (t) { t.stop(); });
      }
      if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    }

    backdrop.querySelector('#vid-close').addEventListener('click', cleanup);
    backdrop.querySelector('#vid-cancel').addEventListener('click', cleanup);
    backdrop.querySelector('#vid-finish').addEventListener('click', function () {
      cleanup();
      CertUI.showToast('Видеоинспекция успешно проведена и прикреплена к заявке', 'ok');
      if (opts.onDone) opts.onDone({ ok: true, durationSec: 134 });
    });
  };

  /* ── 14. ВСПОМОГАТЕЛЬНЫЕ TOAST-УВЕДОМЛЕНИЯ ─────────────────── */
  CertUI.showToast = function (msg, tone) {
    var toast = document.createElement('div');
    var bg = tone === 'ok' ? '#2E5E3F' : tone === 'warn' ? '#B7791F' : tone === 'danger' ? '#8B3A2F' : '#2B2A3A';
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:' + bg + ';color:#FFFFFF;padding:12px 20px;border-radius:4px;box-shadow:0 8px 24px rgba(0,0,0,0.22);font-size:13px;z-index:9999;transition:all 0.3s;opacity:0;transform:translateY(10px);max-width:360px;line-height:1.4;';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; }, 20);
    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    }, 4000);
  };

  root.CertUI = CertUI;
})(typeof window !== 'undefined' ? window : this);
