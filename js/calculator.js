/* Bhessty Marsham price calculator – pure logic (also usable from Node for tests). */
(function (root) {
  'use strict';
  var RATES = { standard: 35, deep: 40 }; // AED per hour
  var SERVICE_NAMES = { standard: 'Standard cleaning', deep: 'Deep cleaning (incl. vacuum & window cleaning)' };
  var PROPERTY_NAMES = { studio: 'Studio', '1br': '1 bedroom', '2br': '2 bedrooms', '3br': '3 bedrooms', villa: 'Villa', office: 'Office' };
  // Suggested starting hours by property size (editable by the customer).
  var SUGGESTED_HOURS = {
    standard: { studio: 2, '1br': 3, '2br': 4, '3br': 5, villa: 6, office: 3 },
    deep:     { studio: 3, '1br': 4, '2br': 5, '3br': 6, villa: 8, office: 4 }
  };
  var ADDONS = [
    { id: 'vanity',      name: 'Vanity Kit',        price: 8 },
    { id: 'towels',      name: 'Towel Set (8 pcs)', price: 125 },
    { id: 'tissue',      name: 'Facial Tissue',     price: 7 },
    { id: 'toiletpaper', name: 'Toilet Paper',      price: 3 },
    { id: 'shampoo',     name: 'Shampoo',           price: 5 },
    { id: 'conditioner', name: 'Conditioner',       price: 5 },
    { id: 'showergel',   name: 'Shower Gel',        price: 3 }
  ];
  var MIN_HOURS = 1, MAX_HOURS = 12, MAX_QTY = 50;

  function clampHours(h) {
    h = Number(h);
    if (!isFinite(h)) return MIN_HOURS;
    h = Math.round(h * 2) / 2; // half-hour steps
    return Math.min(MAX_HOURS, Math.max(MIN_HOURS, h));
  }
  function clampQty(q) {
    q = Math.floor(Number(q));
    if (!isFinite(q) || q < 0) return 0;
    return Math.min(MAX_QTY, q);
  }
  function suggestedHours(service, property) {
    var s = SUGGESTED_HOURS[service] || SUGGESTED_HOURS.standard;
    return s[property] != null ? s[property] : 3;
  }
  /** input: {service, hours, addons:{id:qty}} -> {rate, hours, labour, addonLines[], addonsTotal, total} */
  function calculate(input) {
    var service = RATES[input.service] ? input.service : 'standard';
    var rate = RATES[service];
    var hours = clampHours(input.hours);
    var labour = rate * hours;
    var lines = [], addonsTotal = 0, qtys = input.addons || {};
    ADDONS.forEach(function (a) {
      var q = clampQty(qtys[a.id]);
      if (q > 0) { var sub = q * a.price; addonsTotal += sub; lines.push({ id: a.id, name: a.name, qty: q, price: a.price, subtotal: sub }); }
    });
    return { service: service, rate: rate, hours: hours, labour: labour, addonLines: lines, addonsTotal: addonsTotal, total: labour + addonsTotal };
  }
  function fmt(n) { return (Math.round(n * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' AED'; }

  function buildMessage(d, r) {
    var L = [];
    L.push('Hi Bhessty Marsham, I would like to book a cleaning.');
    L.push('');
    L.push('Service: ' + SERVICE_NAMES[r.service] + ' – ' + r.rate + ' AED/hr');
    L.push('Property: ' + (PROPERTY_NAMES[d.property] || d.property));
    L.push('Hours: ' + r.hours + ' (' + fmt(r.labour) + ')');
    if (r.addonLines.length) {
      L.push('Add-ons:');
      r.addonLines.forEach(function (a) { L.push('- ' + a.name + ' x' + a.qty + ' = ' + fmt(a.subtotal)); });
    }
    L.push('Estimated total: ' + fmt(r.total) + ' (estimate – please confirm final price)');
    L.push('');
    L.push('Date: ' + d.date + (d.time ? ' (' + d.time + ')' : ''));
    if (d.area) L.push('Area: ' + d.area);
    L.push('Name: ' + d.name);
    L.push('Phone: ' + d.phone);
    return L.join('\n');
  }
  function whatsappUrl(text) { return 'https://wa.me/971524536811?text=' + encodeURIComponent(text); }

  var api = { RATES: RATES, ADDONS: ADDONS, SUGGESTED_HOURS: SUGGESTED_HOURS, PROPERTY_NAMES: PROPERTY_NAMES,
    clampHours: clampHours, clampQty: clampQty, suggestedHours: suggestedHours, calculate: calculate, fmt: fmt,
    buildMessage: buildMessage, whatsappUrl: whatsappUrl };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BMCalc = api;
})(this);
