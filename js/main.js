(function () {
  'use strict';
  var C = window.BMCalc;
  // Mobile menu
  var btn = document.querySelector('.menu-btn'), menu = document.getElementById('menu');
  btn.addEventListener('click', function () {
    var open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open)); menu.classList.toggle('open', !open);
  });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') { btn.setAttribute('aria-expanded', 'false'); menu.classList.remove('open'); } });
  document.getElementById('year').textContent = new Date().getFullYear();

  // Calculator
  var form = document.getElementById('calc');
  if (!form || !C) return;
  var hoursEl = document.getElementById('hours'), propEl = document.getElementById('property'),
      hint = document.getElementById('hours-hint'), addonsBox = document.getElementById('addons'),
      totalEl = document.getElementById('total'), breakdown = document.getElementById('breakdown'),
      dateEl = document.getElementById('date'), errEl = document.getElementById('form-error');
  var hoursEdited = false;

  C.ADDONS.forEach(function (a) {
    var row = document.createElement('div'); row.className = 'addon';
    row.innerHTML = '<label for="ad-' + a.id + '"><span>' + a.name + '</span><small>' + a.price + ' AED each</small></label>' +
      '<div class="qty"><button type="button" class="q-btn" data-for="ad-' + a.id + '" data-d="-1" aria-label="Remove one ' + a.name + '">−</button>' +
      '<input id="ad-' + a.id + '" data-addon="' + a.id + '" type="number" min="0" max="50" step="1" value="0" inputmode="numeric">' +
      '<button type="button" class="q-btn" data-for="ad-' + a.id + '" data-d="1" aria-label="Add one ' + a.name + '">+</button></div>';
    addonsBox.appendChild(row);
  });

  var t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
  dateEl.min = t.toISOString().slice(0, 10);

  function service() { return form.querySelector('input[name=service]:checked').value; }
  function addonQtys() { var o = {}; addonsBox.querySelectorAll('input[data-addon]').forEach(function (i) { o[i.dataset.addon] = i.value; }); return o; }
  function applySuggestion() {
    var s = C.suggestedHours(service(), propEl.value);
    hint.textContent = 'Suggested: ' + s + ' hrs (you can change this)';
    if (!hoursEdited) hoursEl.value = s;
  }
  function render() {
    var r = C.calculate({ service: service(), hours: hoursEl.value, addons: addonQtys() });
    var html = '<div><span>' + (r.service === 'deep' ? 'Deep' : 'Standard') + ' cleaning · ' + r.hours + ' hrs × ' + r.rate + ' AED</span><span>' + C.fmt(r.labour) + '</span></div>';
    r.addonLines.forEach(function (a) { html += '<div><span>' + a.name + ' × ' + a.qty + '</span><span>' + C.fmt(a.subtotal) + '</span></div>'; });
    breakdown.innerHTML = html; totalEl.textContent = C.fmt(r.total);
    return r;
  }
  form.addEventListener('change', function (e) {
    if (e.target === hoursEl) { hoursEdited = true; hoursEl.value = C.clampHours(hoursEl.value); }
    if (e.target.dataset && e.target.dataset.addon) e.target.value = C.clampQty(e.target.value);
    if (e.target === propEl || e.target.name === 'service') applySuggestion();
    render();
  });
  form.addEventListener('input', function (e) {
    if (e.target.hasAttribute && e.target.hasAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid');
    if (!form.querySelector('[aria-invalid]')) errEl.hidden = true;
    render();
  });
  form.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b.type === 'submit') return;
    if (b.dataset.step) { hoursEdited = true; hoursEl.value = C.clampHours(Number(hoursEl.value) + Number(b.dataset.step)); }
    if (b.dataset.for) { var i = document.getElementById(b.dataset.for); i.value = C.clampQty(Number(i.value) + Number(b.dataset.d)); }
    render();
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = { property: propEl.value, date: dateEl.value, time: document.getElementById('time').value,
      name: document.getElementById('name').value.trim(), phone: document.getElementById('phone').value.trim(),
      area: document.getElementById('area').value.trim() };
    var missing = [];
    if (!d.date) missing.push('date'); if (!d.name) missing.push('name');
    if (!/^[+0-9 ()-]{7,20}$/.test(d.phone)) missing.push('a valid phone number');
    form.querySelectorAll('[aria-invalid]').forEach(function (x) { x.removeAttribute('aria-invalid'); });
    if (missing.length) {
      errEl.textContent = 'Please add your ' + missing.join(', ') + '.'; errEl.hidden = false;
      if (!d.date) dateEl.setAttribute('aria-invalid', 'true');
      if (!d.name) document.getElementById('name').setAttribute('aria-invalid', 'true');
      if (missing.indexOf('a valid phone number') > -1) document.getElementById('phone').setAttribute('aria-invalid', 'true');
      return;
    }
    errEl.hidden = true;
    var r = render();
    window.open(C.whatsappUrl(C.buildMessage(d, r)), '_blank', 'noopener');
  });
  applySuggestion(); render();
})();
