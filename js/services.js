/* ============================================================
   SERVICES.JS — страница «Услуги»
   Проверка сертификата: пустую форму не отправляем, номер
   передаём в реестр сертификатов.
   ============================================================ */
(function () {
  'use strict';

  function init() {
    const form = document.getElementById('verify-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = form.no.value.trim();
      if (!v) { form.no.focus(); return; }
      location.href = `certification-registry.html?no=${encodeURIComponent(v)}#verify`;
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
