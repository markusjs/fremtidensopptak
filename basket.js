/**
 * basket.js — Kristiania handlekurv
 * Strukturert datamodell i localStorage. Injiserer sidebar-panel.
 * Kaprer originale React «Søk nå»-knapper for campus-studier.
 */

/* ─── Constants ─── */
var BASKET_KEY = 'kristiania_basket_v2';
var EMPTY_BASKET = { programs: [], looseEmner: [] };

/* ─── Path helper ─── */
function getSokSkjemaPath() {
  var path = window.location.pathname;
  if (path.indexOf('/studier/') !== -1) return '../sok-skjema.html';
  return 'sok-skjema.html';
}

/* ─── CSS (injiseres én gang) ─── */
var BASKET_CSS = '\
.uTMhMIeN0bDXVFVIysSa::after{display:none!important}\
#sok-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1200;transition:opacity .3s;opacity:0}\
#sok-panel{display:none;position:fixed;top:0;right:0;height:100%;width:460px;max-width:100vw;background:#fff;z-index:1201;box-shadow:-4px 0 32px rgba(0,0,0,.18);transform:translateX(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);flex-direction:column;font-family:inherit;overflow:hidden}\
.hk-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;flex-shrink:0}\
.hk-header h2{font-size:20px;font-weight:800;margin:0;color:#111}\
.hk-close{background:none;border:none;cursor:pointer;padding:6px;color:#111}\
.hk-body{flex:1;overflow-y:auto;padding:12px 20px}\
.hk-card{border:1.5px solid #e5e5e5;border-radius:12px;margin-bottom:10px;overflow:hidden;background:#fff}\
.hk-card-header{display:flex;align-items:flex-start;justify-content:space-between;padding:14px 16px;gap:8px;cursor:default}\
.hk-card-meta{font-size:12px;color:#777;margin-bottom:3px}\
.hk-card-name{font-size:15px;font-weight:700;color:#111;line-height:1.3}\
.hk-card-right{display:flex;align-items:center;gap:6px;flex-shrink:0}\
.hk-badge{font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;white-space:nowrap}\
.hk-badge-sem{background:#f5e6e6;color:#6b2020}\
.hk-badge-city{background:#f5e6e6;color:#6b2020}\
.hk-badge-nett{background:none;border:1.5px solid #999;color:#555}\
.hk-trash{background:none;border:none;cursor:pointer;padding:4px;color:#aaa;transition:color .15s}\
.hk-trash:hover{color:#c00}\
.hk-chevron{background:none;border:none;cursor:pointer;padding:4px;transition:transform .2s}\
.hk-emner-list{border-top:1px solid #f0f0f0;display:none}\
.hk-emner-list.open{display:block}\
.hk-emne-row{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #f5f5f5;gap:8px}\
.hk-emne-meta{font-size:11px;color:#888}\
.hk-emne-name{font-size:13px;font-weight:600;color:#222}\
.hk-emne-right{display:flex;align-items:center;gap:6px;flex-shrink:0}\
.hk-badge-date{background:#f0f0f0;color:#555;font-size:11px;padding:3px 8px;border-radius:12px}\
.hk-section-header{display:flex;align-items:center;justify-content:space-between;padding:12px 0 8px;cursor:pointer}\
.hk-section-title{font-size:13px;color:#555}\
.hk-footer{padding:16px 20px;border-top:1px solid #e5e5e5;flex-shrink:0;display:flex;flex-direction:column;gap:10px}\
.hk-btn-outline{display:block;width:100%;text-align:center;padding:13px;border-radius:30px;font-size:14px;font-weight:600;cursor:pointer;border:1.5px solid #4e0000;color:#4e0000;background:none;font-family:inherit}\
.hk-btn-outline:hover{background:#faf5f5}\
.hk-btn-primary{display:block;width:100%;text-align:center;padding:13px;border-radius:30px;font-size:14px;font-weight:700;cursor:pointer;border:none;background:#1a3dc2;color:#fff;text-decoration:none;font-family:inherit}\
.hk-btn-primary:hover{background:#1533a8}\
.hk-empty{display:flex;flex-direction:column;align-items:center;text-align:center;gap:24px;padding:64px 16px 16px;color:#888}\
.hk-city-popover{position:fixed;z-index:1300;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.2);padding:16px;min-width:200px}\
.hk-city-popover h4{margin:0 0 12px;font-size:15px;font-weight:700;color:#111}\
.hk-city-btn{display:block;width:100%;text-align:left;padding:12px 14px;margin-bottom:6px;border:1.5px solid #ddd;border-radius:8px;background:none;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s}\
.hk-city-btn:hover{border-color:#4e0000;background:#faf5f5}\
';

/* ─── CRUD ─── */
function getBasket() {
  try {
    var raw = localStorage.getItem(BASKET_KEY);
    if (!raw) return migrateOldBasket();
    var b = JSON.parse(raw);
    if (!b.programs) return migrateOldBasket();
    return b;
  } catch(e) { return { programs: [], looseEmner: [] }; }
}

function migrateOldBasket() {
  try {
    var old = JSON.parse(localStorage.getItem('kristiania_basket') || '[]');
    if (!Array.isArray(old) || old.length === 0) return { programs: [], looseEmner: [] };
    var b = { programs: [], looseEmner: [] };
    old.forEach(function(item) {
      if (item.type === 'nett' && item.program) {
        b.looseEmner.push({ code: item.id, name: item.name, program: item.program, pts: item.studiepoeng || 10, price: item.pricePerEmne || 6700 });
      } else {
        b.programs.push({ id: item.id, name: item.name, level: item.degree || 'Bachelor', points: '', type: item.type || 'campus', city: item.location || null, startSemester: 'Høst 26', price: item.pricePerSemester || 0 });
      }
    });
    saveBasket(b);
    localStorage.removeItem('kristiania_basket');
    return b;
  } catch(e) { return { programs: [], looseEmner: [] }; }
}

function saveBasket(b) {
  localStorage.setItem(BASKET_KEY, JSON.stringify(b));
  refreshBasketUI();
}

function addProgram(prog) {
  var b = getBasket();
  if (b.programs.find(function(p) { return p.id === prog.id; })) { openSoknaderPanel(); return; }
  b.programs.push(prog);
  saveBasket(b);
  openSoknaderPanel();
}

function addProgramWithEmner(prog) {
  var b = getBasket();
  var existing = b.programs.find(function(p) { return p.id === prog.id; });
  if (existing) {
    existing.emner = prog.emner;
    existing.name = prog.name;
  } else {
    b.programs.push(prog);
  }
  saveBasket(b);
  openSoknaderPanel();
}

function removeProgram(id) {
  var b = getBasket();
  // Find the program before removing, to sync SP
  var prog = b.programs.find(function(p) { return p.id === id; });
  b.programs = b.programs.filter(function(p) { return p.id !== id; });
  saveBasket(b);
  renderBasketPanel();
  // Sync studieplanlegger: remove all emner from SP if present
  if (prog && prog.emner && typeof spRemoveCourse === 'function') {
    prog.emner.forEach(function(e) { spRemoveCourse(e.code); });
  }
}

function removeEmne(programId, code) {
  var b = getBasket();
  var prog = b.programs.find(function(p) { return p.id === programId; });
  if (prog && prog.emner) {
    prog.emner = prog.emner.filter(function(e) { return e.code !== code; });
    if (prog.emner.length === 0) b.programs = b.programs.filter(function(p) { return p.id !== programId; });
  }
  saveBasket(b);
  renderBasketPanel();
  // Sync studieplanlegger: remove this emne from SP if present
  if (typeof spRemoveCourse === 'function') { spRemoveCourse(code); }
}

function addLooseEmne(emne) {
  var b = getBasket();
  if (b.looseEmner.find(function(e) { return e.code === emne.code; })) return;
  b.looseEmner.push(emne);
  saveBasket(b);
}

function removeLooseEmne(code) {
  var b = getBasket();
  b.looseEmner = b.looseEmner.filter(function(e) { return e.code !== code; });
  saveBasket(b);
  renderBasketPanel();
}

function clearBasket() {
  saveBasket({ programs: [], looseEmner: [] });
  renderBasketPanel();
  // Sync studieplanlegger: clear all courses
  if (typeof spCart === 'object' && typeof spRemoveCourse === 'function') {
    Object.keys(spCart).forEach(function(code) { spRemoveCourse(code); });
  }
}

function getBasketCount() {
  var b = getBasket();
  return b.programs.length + (b.looseEmner.length > 0 ? 1 : 0);
}

/* ─── UI refresh ─── */
function refreshBasketUI() {
  updateBasketCount();
  renderBasketPanel();
}

function updateBasketCount() {
  var n = getBasketCount();
  document.querySelectorAll('#topbar-basket-count').forEach(function(el) {
    el.textContent = n; el.style.display = n > 0 ? 'block' : 'none';
  });
}

/* ─── Sidebar inject ─── */
function injectSidebarPanel() {
  if (document.getElementById('sok-panel')) return;
  // Inject CSS
  if (!document.getElementById('hk-styles')) {
    var style = document.createElement('style');
    style.id = 'hk-styles';
    style.textContent = BASKET_CSS;
    document.head.appendChild(style);
  }
  // Inject HTML
  var html = '<div id="sok-backdrop" onclick="closeSoknaderPanel()"></div>'
    + '<div id="sok-panel">'
    + '<div class="hk-header"><h2 id="hk-title">Søknader (0)</h2>'
    + '<button class="hk-close" onclick="closeSoknaderPanel()" aria-label="Lukk">'
    + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>'
    + '</button></div>'
    + '<div class="hk-body" id="hk-body"></div>'
    + '<div class="hk-footer" id="hk-footer" style="display:none">'
    + '<button class="hk-btn-outline" onclick="alert(\'Lagret til senere!\')">Lagre til senere</button>'
    + '<a href="' + getSokSkjemaPath() + '" class="hk-btn-primary">Gå videre med søknaden</a>'
    + '</div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
}

function openSoknaderPanel() {
  injectSidebarPanel();
  renderBasketPanel();
  var panel = document.getElementById('sok-panel');
  var backdrop = document.getElementById('sok-backdrop');
  if (!panel) return;
  panel.style.display = 'flex';
  backdrop.style.display = 'block';
  requestAnimationFrame(function() { requestAnimationFrame(function() {
    panel.style.transform = 'translateX(0)';
    backdrop.style.opacity = '1';
  }); });
}

function closeSoknaderPanel() {
  var panel = document.getElementById('sok-panel');
  var backdrop = document.getElementById('sok-backdrop');
  if (!panel) return;
  panel.style.transform = 'translateX(100%)';
  backdrop.style.opacity = '0';
  setTimeout(function() { panel.style.display = 'none'; backdrop.style.display = 'none'; }, 350);
}

/* ─── Trash SVG ─── */
var TRASH_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var CHEVRON_DOWN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var CHEVRON_UP = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 15l-6-6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ─── Render ─── */
function renderBasketPanel() {
  injectSidebarPanel();
  var b = getBasket();
  var body = document.getElementById('hk-body');
  var footer = document.getElementById('hk-footer');
  var title = document.getElementById('hk-title');
  if (!body) return;

  var count = getBasketCount();
  var totalItems = b.programs.length + b.looseEmner.length;
  if (title) title.textContent = totalItems === 0 ? 'Søknader' : 'Søknader (' + count + ')';

  if (totalItems === 0) {
    body.innerHTML = '<div class="hk-empty">'
      + '<div style="background:#f4ebe6;border-radius:88px;padding:16px;display:inline-flex;align-items:center;justify-content:center;">'
      + '<svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" fill="#121212"/><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" fill="#121212"/></svg>'
      + '</div>'
      + '<a href="studietilbud _ Kristiania.html" style="display:block;width:100%;text-align:center;padding:12px;border-radius:40px;font-size:16px;font-weight:500;cursor:pointer;border:1px solid #4e0000;color:#4e0000;background:none;font-family:inherit;text-decoration:none;">Legg til studier eller emner</a>'
      + '<div style="border-top:1px solid #e3e3e3;width:100%;"></div>'
      + '<p style="font-size:16px;font-weight:500;margin:0;color:#4e0000;">Logg inn for å finne påbegynte søknader</p>'
      + '<button onclick="closeSoknaderPanel()" style="display:block;width:100%;text-align:center;padding:12px;border-radius:40px;font-size:16px;font-weight:600;cursor:pointer;border:none;background:#06f;color:#fff;font-family:inherit;">Logg inn</button>'
      + '</div>';
    if (footer) footer.style.display = 'none';
    return;
  }

  var html = '';
  b.programs.forEach(function(prog) {
    if (prog.type === 'nett' && prog.emner && prog.emner.length > 0) {
      html += renderNettCard(prog);
    } else {
      html += renderCampusCard(prog);
    }
  });

  if (b.looseEmner.length > 0) {
    html += renderLooseEmner(b.looseEmner);
  }

  body.innerHTML = html;
  if (footer) footer.style.display = 'flex';
}

function renderCampusCard(prog) {
  var badges = '';
  if (prog.startSemester) badges += '<span class="hk-badge hk-badge-sem">' + prog.startSemester + '</span>';
  if (prog.city) badges += '<span class="hk-badge hk-badge-city">' + prog.city + '</span>';
  return '<div class="hk-card"><div class="hk-card-header">'
    + '<div><div class="hk-card-meta">' + (prog.level || '') + (prog.points ? ' · ' + prog.points : '') + '</div>'
    + '<div class="hk-card-name">' + prog.name + '</div></div>'
    + '<div class="hk-card-right">' + badges
    + '<button class="hk-trash" onclick="removeProgram(\'' + prog.id + '\')" aria-label="Fjern">' + TRASH_SVG + '</button>'
    + '</div></div></div>';
}

function renderNettCard(prog) {
  var emnerCount = prog.emner ? prog.emner.length : 0;
  var totalPts = 0;
  if (prog.emner) prog.emner.forEach(function(e) { totalPts += parseFloat(e.pts) || 0; });
  var ptsStr = totalPts % 1 === 0 ? totalPts : totalPts.toFixed(1).replace('.', ',');
  var meta = (prog.level || '') + ' · ' + ptsStr + ' studiepoeng · ' + emnerCount + ' emner';

  var emnerHtml = '';
  if (prog.emner) {
    prog.emner.forEach(function(e) {
      emnerHtml += '<div class="hk-emne-row">'
        + '<div><div class="hk-emne-meta">#' + (e.code || '') + ' · ' + (e.pts || 0) + ' studiepoeng</div>'
        + '<div class="hk-emne-name">' + e.name + '</div></div>'
        + '<div class="hk-emne-right">'
        + (e.startDate ? '<span class="hk-badge-date">' + e.startDate + '</span>' : '')
        + '<button class="hk-trash" onclick="removeEmne(\'' + prog.id + '\',\'' + e.code + '\')" aria-label="Fjern">' + TRASH_SVG + '</button>'
        + '</div></div>';
    });
  }

  return '<div class="hk-card"><div class="hk-card-header" onclick="toggleHkEmner(this)">'
    + '<div><div class="hk-card-meta">' + meta + '</div>'
    + '<div class="hk-card-name">' + prog.name + '</div></div>'
    + '<div class="hk-card-right">'
    + '<span class="hk-badge hk-badge-nett">Nett</span>'
    + '<button class="hk-chevron">' + CHEVRON_DOWN + '</button>'
    + '<button class="hk-trash" onclick="event.stopPropagation();removeProgram(\'' + prog.id + '\')" aria-label="Fjern">' + TRASH_SVG + '</button>'
    + '</div></div>'
    + '<div class="hk-emner-list">' + emnerHtml + '</div></div>';
}

function renderLooseEmner(emner) {
  var inner = '';
  emner.forEach(function(e) {
    inner += '<div class="hk-emne-row">'
      + '<div><div class="hk-emne-meta">' + (e.program || 'Enkeltemne') + ' · ' + (e.pts || 0) + ' stp</div>'
      + '<div class="hk-emne-name">' + e.name + '</div></div>'
      + '<div class="hk-emne-right">'
      + '<button class="hk-trash" onclick="removeLooseEmne(\'' + e.code + '\')" aria-label="Fjern">' + TRASH_SVG + '</button>'
      + '</div></div>';
  });
  return '<div class="hk-card"><div class="hk-card-header" onclick="toggleHkEmner(this)">'
    + '<div><div class="hk-section-title">Emner uten tilknytning til studieprogram</div>'
    + '<div style="font-weight:700;font-size:14px;">' + emner.length + ' emne' + (emner.length > 1 ? 'r' : '') + '</div></div>'
    + '<div class="hk-card-right"><button class="hk-chevron">' + CHEVRON_DOWN + '</button></div>'
    + '</div><div class="hk-emner-list">' + inner + '</div></div>';
}

function toggleHkEmner(headerEl) {
  var card = headerEl.closest('.hk-card');
  if (!card) return;
  var list = card.querySelector('.hk-emner-list');
  var chevBtn = card.querySelector('.hk-chevron');
  if (!list) return;
  var isOpen = list.classList.contains('open');
  list.classList.toggle('open');
  if (chevBtn) chevBtn.innerHTML = isOpen ? CHEVRON_DOWN : CHEVRON_UP;
}

/* ─── React «Søk nå» button interception ─── */
function extractChoices() {
  var props = window.__reactProps || {};
  var keys = Object.keys(props);
  for (var i = 0; i < keys.length; i++) {
    var val = props[keys[i]];
    if (val && val.admissionCallToAction && val.admissionCallToAction.choices) {
      return val.admissionCallToAction.choices;
    }
  }
  return null;
}

function interceptSokNaaButtons() {
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('button[title="Søk nå"]');
    if (!btn) return;
    if (!btn.classList.contains('yEK9biWpMxeKit4W3SEn')) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    var choices = extractChoices();
    if (!choices || choices.length === 0) return;

    // Deduplicate by city
    var cityMap = {};
    choices.forEach(function(c) { if (c.variantCity) cityMap[c.variantCity] = c; });
    var uniqueCities = Object.keys(cityMap);

    if (uniqueCities.length <= 1) {
      // Single city or no city — add directly
      addChoiceToBasket(choices[0]);
    } else {
      // Multiple cities — show popover
      showCityPopover(btn, cityMap);
    }
  }, true); // capture phase
}

function addChoiceToBasket(choice) {
  closeCityPopover();
  addProgram({
    id: choice.id || choice.variantCode,
    name: choice.name || '',
    level: deriveLevelFromPage(),
    points: choice.points || '',
    type: choice.studyItemType === 'onlineStudy' ? 'nett' : 'campus',
    city: choice.variantCity || null,
    startSemester: (choice.startSemester || 'Høst') + ' 26',
    price: choice.price || 0,
    studyFormType: choice.studyFormType || ''
  });
}

/* Derive level from study info on page or name */
function deriveLevelFromPage() {
  var props = window.__reactProps || {};
  var keys = Object.keys(props);
  for (var i = 0; i < keys.length; i++) {
    var val = props[keys[i]];
    if (val && val.admissionCallToAction && val.admissionCallToAction.choices) {
      var c = val.admissionCallToAction.choices[0];
      if (c) {
        var name = c.name || '';
        if (name.indexOf('Master') !== -1) return 'Master';
        if (name.indexOf('Fagskole') !== -1 || name.indexOf('fagskole') !== -1) return 'Fagskole';
      }
    }
    // Also check study item type name mapping
    if (val && val.studyItemType) {
      if (val.studyItemType === 'masterStudy') return 'Master';
      if (val.studyItemType === 'vocationalStudy') return 'Fagskole';
    }
  }
  // Fallback: check page title
  var title = document.title || '';
  if (title.indexOf('Master') !== -1) return 'Master';
  if (title.indexOf('Fagskole') !== -1 || title.indexOf('fagskole') !== -1) return 'Fagskole';
  return 'Bachelor';
}

/* ─── City popover ─── */
var cityPopoverEl = null;

function showCityPopover(anchorBtn, cityMap) {
  closeCityPopover();
  var rect = anchorBtn.getBoundingClientRect();
  var div = document.createElement('div');
  div.className = 'hk-city-popover';
  div.id = 'hk-city-popover';
  div.style.top = (rect.bottom + 8) + 'px';
  div.style.left = Math.max(8, rect.left) + 'px';
  var html = '<h4>Velg campus</h4>';
  Object.keys(cityMap).forEach(function(city) {
    html += '<button class="hk-city-btn" onclick="addChoiceToBasket(' + JSON.stringify(cityMap[city]).replace(/"/g, '&quot;') + ')">' + city + '</button>';
  });
  div.innerHTML = html;
  document.body.appendChild(div);
  cityPopoverEl = div;
  // Close on outside click
  setTimeout(function() {
    document.addEventListener('click', closeCityPopoverOnOutside);
  }, 10);
}

function closeCityPopover() {
  if (cityPopoverEl) { cityPopoverEl.remove(); cityPopoverEl = null; }
  document.removeEventListener('click', closeCityPopoverOnOutside);
}

function closeCityPopoverOnOutside(e) {
  if (cityPopoverEl && !cityPopoverEl.contains(e.target)) closeCityPopover();
}

/* ─── Topbar basket auto-enhancer ─── */
function enhanceTopbarBasket() {
  var basketImg = document.querySelector('img[src*="Basket.svg"]');
  if (!basketImg) return;
  var btn = basketImg.closest('button');
  if (!btn) return;
  // Add click handler if not already set
  if (!btn.getAttribute('onclick')) {
    btn.setAttribute('onclick', 'openSoknaderPanel()');
    btn.style.cursor = 'pointer';
  }
  // Add badge if missing
  if (!btn.querySelector('#topbar-basket-count')) {
    btn.style.position = 'relative';
    var badge = document.createElement('span');
    badge.id = 'topbar-basket-count';
    badge.style.cssText = 'display:none;position:absolute;top:4px;right:4px;background:#c8233f;color:#fff;border-radius:50%;width:16px;height:16px;font-size:10px;font-weight:700;line-height:16px;text-align:center;';
    btn.appendChild(badge);
  }
}

/* ─── Init ─── */
function initBasket() {
  injectSidebarPanel();
  enhanceTopbarBasket();
  refreshBasketUI();
  interceptSokNaaButtons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBasket);
} else {
  initBasket();
}
