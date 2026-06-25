/**
 * basket.js — Kristiania handlekurv
 * Strukturert datamodell i localStorage. Injiserer sidebar-panel.
 * Kaprer originale React «Søk nå»-knapper for campus-studier.
 */

/* ─── Global topbar fix: hide duplicate search icon ─── */
(function(){
  var s = document.createElement('style');
  s.textContent = '.BI8sYl_zzmD2PosuI83q:not(.ZK1omoN5LcHwsJ4ZoxIJ) .Q5vGRKkR4UPctsu2Dl_3 img{display:none!important}';
  document.head.appendChild(s);
})();

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
.hk-badge-sem{background:#eceae7;color:#5a5a5a}\
.hk-badge-city{background:#f8d9de;color:#7a2238}\
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
.hk-bookmark-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#FFCB05;color:#212121;border:2px solid #FFCB05;border-radius:8px;padding:14px 22px;font-size:18px;font-weight:600;font-family:inherit;cursor:pointer;line-height:1;white-space:nowrap;transition:background .15s,border-color .15s,color .15s}\
.hk-bookmark-btn:hover{background:#f0bf00;border-color:#f0bf00}\
.hk-bookmark-btn svg{display:block;flex-shrink:0}\
.hk-bookmark-btn.saved{background:#fff;border-color:#212121;color:#212121}\
.hk-bookmark-btn.saved:hover{background:#f7f7f7}\
#bm-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1400;transition:opacity .3s;opacity:0}\
#bm-panel{display:none;position:fixed;top:0;right:0;height:100%;width:460px;max-width:100vw;background:#fff;z-index:1401;box-shadow:-4px 0 32px rgba(0,0,0,.18);transform:translateX(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);flex-direction:column;font-family:inherit;overflow:hidden}\
#bm-panel .hk-header h2{display:flex;align-items:center;gap:10px}\
.bm-card{position:relative;padding-bottom:14px}\
.bm-card-top{display:flex;align-items:flex-start;justify-content:space-between;padding:14px 12px 0 16px;gap:8px}\
.bm-badges{display:flex;flex-wrap:wrap;gap:6px;padding-top:2px}\
.bm-actions{display:flex;align-items:center;gap:2px;flex-shrink:0}\
.bm-icon-btn{background:none;border:none;cursor:pointer;padding:6px;color:#555;border-radius:6px;display:flex;align-items:center;transition:background .15s,color .15s}\
.bm-icon-btn:hover{background:#f1f1f1;color:#111}\
.bm-icon-btn.bm-remove{color:#121212}\
.bm-card-name{display:block;padding:10px 16px 0;font-size:16px;font-weight:700;color:#111;text-decoration:none;border:none;line-height:1.3}\
.bm-card-name:hover{text-decoration:underline}\
.bm-card-meta{padding:3px 16px 0;font-size:13px;color:#777}\
.bm-sok-btn{display:block;width:calc(100% - 32px);box-sizing:border-box;margin:14px 16px 0;padding:13px;border-radius:28px;font-size:15px;font-weight:700;cursor:pointer;border:none;background:#2f54eb;color:#fff;font-family:inherit;transition:background .15s}\
.bm-sok-btn:hover{background:#1f3fd0}\
.bm-empty{display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;padding:40px 28px}\
.bm-empty-icon{width:72px;height:72px;border-radius:50%;background:#f4ebe6;color:#4e0000;display:flex;align-items:center;justify-content:center}\
.bm-empty-title{font-size:18px;font-weight:700;color:#121212;margin:0}\
.bm-empty-text{font-size:14px;color:#666;line-height:1.5;margin:0}\
.bm-login{padding:10px 4px 24px}\
.bm-login-heading{font-size:16px;font-weight:700;color:#121212;margin:0 0 14px}\
.bm-login-label{font-size:14px;color:#4e0000;margin:0 0 12px}\
.bm-feide-btn{display:flex;align-items:center;justify-content:center;gap:10px;border:1.5px solid #d4d8ff;background:#f5f7ff;border-radius:12px;padding:16px 24px;font-size:16px;font-weight:600;color:#121212;cursor:pointer;font-family:inherit;width:100%;transition:background .15s}\
.bm-feide-btn:hover{background:#eceffe}\
.bm-or{display:flex;align-items:center;gap:12px;margin:18px 0;color:#999;font-size:12px;letter-spacing:.1em;text-align:center}\
.bm-or::before,.bm-or::after{content:\"\";flex:1;height:1px;background:#e3e3e3}\
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

/* ─── Bokmerker ─── */
var BOOKMARK_KEY = 'kristiania_bookmarks';
var BM_OUTLINE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 4h12a1 1 0 0 1 1 1v15.5l-7-3.9-7 3.9V5a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
var BM_FILLED  = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h12a1 1 0 0 1 1 1v15.5l-7-3.9-7 3.9V5a1 1 0 0 1 1-1z"/></svg>';

function getBookmarks() {
  try {
    var arr = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch(e) { return []; }
}

function saveBookmarks(arr) {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(arr));
  updateBookmarkBadge();
}

function getBookmarkCount() { return getBookmarks().length; }

function isBookmarked(id) {
  return getBookmarks().some(function(b) { return b.id === id; });
}

/* Hvilket studie er denne siden? */
function getCurrentStudyInfo() {
  var choices = extractChoices();
  var info = { id: window.location.pathname, name: '', level: deriveLevelFromPage(),
               url: window.location.pathname, city: null, startSemester: null, points: null, duration: null };
  if (choices && choices.length) {
    var c = choices[0];
    info.id = c.studyCode || c.variantCode || info.id;
    info.name = c.name || '';
    info.city = c.variantCity || null;
    if (c.startSemester) info.startSemester = c.startSemester + ' 2026';
    if (c.points) info.points = ('' + c.points).replace(/studiepoeng/i, 'stp.').trim();
    if (c.durationInYears) info.duration = c.durationInYears + ' år';
  }
  if (!info.name) {
    var h1 = document.querySelector('h1');
    info.name = h1 ? h1.textContent.trim() : (document.title.split(/[|–-]/)[0] || '').trim();
  }
  if (!info.duration) info.duration = info.level === 'Master' ? '2 år' : (info.level === 'Bachelor' ? '3 år' : null);
  return info;
}

function toggleBookmark() {
  var info = getCurrentStudyInfo();
  var arr = getBookmarks();
  var idx = -1;
  for (var i = 0; i < arr.length; i++) { if (arr[i].id === info.id) { idx = i; break; } }
  if (idx >= 0) {
    arr.splice(idx, 1);
    saveBookmarks(arr);
    updateBookmarkButtons();
    renderBookmarkPanel();
  } else {
    arr.push(info);
    saveBookmarks(arr);
    updateBookmarkButtons();
    openBookmarkPanel();
  }
}

function removeBookmark(id) {
  var arr = getBookmarks().filter(function(b) { return b.id !== id; });
  saveBookmarks(arr);
  updateBookmarkButtons();
  renderBookmarkPanel();
}

/* Eget bokmerke-ikon i topbaren */
function injectTopbarBookmarkIcon() {
  if (document.getElementById('topbar-bookmark-btn')) return;
  var basketImg = document.querySelector('img[src*="Basket.svg"]');
  if (!basketImg) return;
  var basketBtn = basketImg.closest('button') || basketImg.closest('a');
  if (!basketBtn) return;
  var basketLi = basketBtn.closest('li');
  // Avled bokmerke-ikonets sti fra kurv-ikonet (samme topbar-mappe)
  var bmSrc = (basketImg.getAttribute('src') || '').replace('Basket.svg', 'Bookmark.svg');

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'topbar-bookmark-btn';
  btn.className = basketBtn.className;
  btn.setAttribute('aria-label', 'Bokmerker');
  btn.style.cssText = 'position:relative;background:none;border:none;cursor:pointer;padding:8px;display:inline-flex;align-items:center;justify-content:center;';
  btn.onclick = function() { openBookmarkPanel(); };
  btn.innerHTML = '<span class="SvgIcon" style="display:flex;align-items:center;"><img src="' + bmSrc + '" width="24" height="24" alt="" style="display:block;"></span>'
    + '<span id="topbar-bookmark-count" style="display:none;position:absolute;top:4px;right:4px;background:#c8233f;color:#fff;border-radius:9px;min-width:16px;height:16px;padding:0 3px;font-size:10px;font-weight:700;line-height:16px;text-align:center;box-sizing:border-box;"></span>';

  if (basketLi) {
    var li = document.createElement('li');
    li.className = basketLi.className;
    var liStyle = basketLi.getAttribute('style');
    if (liStyle) li.setAttribute('style', liStyle);
    li.appendChild(btn);
    basketLi.insertAdjacentElement('afterend', li);
  } else {
    basketBtn.insertAdjacentElement('afterend', btn);
  }
}

function updateBookmarkBadge() {
  var badge = document.getElementById('topbar-bookmark-count');
  if (!badge) return;
  var n = getBookmarkCount();
  badge.textContent = n;
  badge.style.display = n > 0 ? 'block' : 'none';
}

/* Sørg for lik ikon-rekkefølge i topbaren på alle sider:
   profil → søk → kurv → bokmerke → meny */
function normalizeTopbarOrder() {
  var basketImg = document.querySelector('img[src*="Basket.svg"]');
  if (!basketImg) return;
  var basketLi = basketImg.closest('li');
  if (!basketLi) return;
  var ul = basketLi.parentNode;
  if (!ul || ul.tagName !== 'UL') return;

  function liIn(el) {
    if (!el) return null;
    var li = el.closest('li');
    return (li && li.parentNode === ul) ? li : null;
  }
  var searchEl = document.querySelector('[role="search"]')
    || document.querySelector('img[src*="search.svg"]')
    || document.querySelector('img[src*="Search.svg"]');
  var profile  = liIn(document.querySelector('a[href$="/min-side/"]'));
  var search   = liIn(searchEl);
  var bookmark = liIn(document.getElementById('topbar-bookmark-btn'));
  var menu     = liIn(document.querySelector('img[src*="Menu.svg"]'));

  var order = [profile, search, basketLi, bookmark, menu];
  for (var i = 0; i < order.length; i++) {
    if (order[i] && order[i].parentNode === ul) ul.appendChild(order[i]);
  }
}

/* «Lagre»-knapp ved siden av «Søk nå» */
function injectBookmarkButtons() {
  var sokBtns = document.querySelectorAll('button[title="Søk nå"].yEK9biWpMxeKit4W3SEn');
  for (var i = 0; i < sokBtns.length; i++) {
    var sokBtn = sokBtns[i];
    var wrap = sokBtn.parentElement;
    if (!wrap || wrap.querySelector('.hk-bookmark-btn')) continue;
    wrap.style.display = 'flex';
    wrap.style.gap = '8px';
    wrap.style.alignItems = 'stretch';
    sokBtn.style.flex = '1 1 auto';
    var lagre = document.createElement('button');
    lagre.type = 'button';
    lagre.className = 'hk-bookmark-btn';
    lagre.setAttribute('aria-label', 'Lagre som bokmerke');
    lagre.onclick = function(e) { e.preventDefault(); e.stopPropagation(); toggleBookmark(); };
    sokBtn.insertAdjacentElement('afterend', lagre);
  }
  updateBookmarkButtons();
}

function updateBookmarkButtons() {
  var saved = isBookmarked(getCurrentStudyInfo().id);
  var btns = document.querySelectorAll('.hk-bookmark-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].innerHTML = (saved ? BM_FILLED : BM_OUTLINE) + '<span>' + (saved ? 'Lagret' : 'Lagre') + '</span>';
    btns[i].classList.toggle('saved', saved);
  }
}

/* ─── Bokmerke-panel (sidebar) ─── */
var BM_TITLE_ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h12a1 1 0 0 1 1 1v15.5l-7-3.9-7 3.9V5a1 1 0 0 1 1-1z"/></svg>';

function injectBookmarkPanel() {
  if (document.getElementById('bm-panel')) return;
  if (!document.getElementById('hk-styles')) {
    var style = document.createElement('style');
    style.id = 'hk-styles';
    style.textContent = BASKET_CSS;
    document.head.appendChild(style);
  }
  var html = '<div id="bm-backdrop" onclick="closeBookmarkPanel()"></div>'
    + '<div id="bm-panel">'
    + '<div class="hk-header"><h2>' + BM_TITLE_ICON + '<span id="bm-title">Bokmerker</span></h2>'
    + '<button class="hk-close" onclick="closeBookmarkPanel()" aria-label="Lukk">'
    + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>'
    + '</button></div>'
    + '<div class="hk-body" id="bm-body"></div>'
    + '</div>';
  document.body.insertAdjacentHTML('beforeend', html);
}

var BM_FEIDE_ICON = '<svg width="26" height="26" viewBox="0 0 32 32" fill="none"><rect x="6" y="6" width="20" height="20" rx="3" stroke="#1f2b6b" stroke-width="2"/><path d="M12 26v-7a4 4 0 0 1 8 0v7" stroke="#1f2b6b" stroke-width="2" stroke-linecap="round"/></svg>';

function bookmarkLoginHtml() {
  return '<div class="bm-login">'
    + '<h3 class="bm-login-heading">Logg inn for å lagre bokmerker</h3>'
    + '<p class="bm-login-label">Ny bruker</p>'
    + '<button class="bm-feide-btn" onclick="bookmarkLogin()">Opprett bruker</button>'
    + '<div class="bm-or">ELLER</div>'
    + '<p class="bm-login-label">Student ved Kristiania med aktiv FEIDE-bruker.</p>'
    + '<button class="bm-feide-btn" onclick="bookmarkLogin()">Fortsett med FEIDE' + BM_FEIDE_ICON + '</button>'
    + '</div>';
}

function bookmarkLogin() { window.location.href = '/min-side/'; }

function openBookmarkPanel() {
  injectBookmarkPanel();
  renderBookmarkPanel();
  var panel = document.getElementById('bm-panel');
  var backdrop = document.getElementById('bm-backdrop');
  if (!panel) return;
  panel.style.display = 'flex';
  backdrop.style.display = 'block';
  requestAnimationFrame(function() { requestAnimationFrame(function() {
    panel.style.transform = 'translateX(0)';
    backdrop.style.opacity = '1';
  }); });
}

function closeBookmarkPanel() {
  var panel = document.getElementById('bm-panel');
  var backdrop = document.getElementById('bm-backdrop');
  if (!panel) return;
  panel.style.transform = 'translateX(100%)';
  backdrop.style.opacity = '0';
  setTimeout(function() { panel.style.display = 'none'; backdrop.style.display = 'none'; }, 350);
}

function renderBookmarkPanel() {
  injectBookmarkPanel();
  var arr = getBookmarks();
  var body = document.getElementById('bm-body');
  var title = document.getElementById('bm-title');
  if (!body) return;

  if (title) title.textContent = arr.length === 0 ? 'Bokmerker' : 'Bokmerker (' + arr.length + ')';

  if (arr.length === 0) {
    body.innerHTML = '<div class="bm-empty">'
      + '<div class="bm-empty-icon">' + BM_TITLE_ICON + '</div>'
      + '<h3 class="bm-empty-title">Ingen bokmerker ennå</h3>'
      + '<p class="bm-empty-text">Trykk «Lagre» på et studie du vil se nærmere på senere, så finner du det igjen her.</p>'
      + '</div>';
    return;
  }

  var html = '';
  arr.forEach(function(bm) { html += renderBookmarkCard(bm); });
  html += bookmarkLoginHtml();
  body.innerHTML = html;
}

function renderBookmarkCard(bm) {
  var badges = '';
  if (bm.city) badges += '<span class="hk-badge hk-badge-city">' + bm.city + '</span>';
  if (bm.startSemester) badges += '<span class="hk-badge hk-badge-sem">' + bm.startSemester + '</span>';
  var meta = [];
  if (bm.points) meta.push(bm.points);
  if (bm.duration) meta.push(bm.duration);
  var safeId = ('' + bm.id).replace(/'/g, "\\'");
  return '<div class="hk-card bm-card">'
    + '<div class="bm-card-top">'
    + '<div class="bm-badges">' + badges + '</div>'
    + '<div class="bm-actions">'
    + '<button class="bm-icon-btn bm-remove" onclick="removeBookmark(\'' + safeId + '\')" aria-label="Fjern bokmerke">' + BM_FILLED + '</button>'
    + '</div></div>'
    + '<a class="bm-card-name" href="' + bm.url + '">' + bm.name + '</a>'
    + (meta.length ? '<div class="bm-card-meta">' + meta.join(' • ') + '</div>' : '')
    + '<button class="bm-sok-btn" onclick="applyBookmark(\'' + safeId + '\')">Søk nå</button>'
    + '</div>';
}

/* Legg bokmerket studie til søknaden (som «Søk nå» ellers) */
function applyBookmark(id) {
  var bm = getBookmarks().filter(function(b) { return b.id === id; })[0];
  if (!bm) return;
  closeBookmarkPanel();
  addProgram({
    id: bm.id,
    name: bm.name,
    level: bm.level || 'Bachelor',
    points: bm.points || '',
    type: 'campus',
    city: bm.city || null,
    startSemester: bm.startSemester || 'Høst 26',
    price: 0
  });
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
    + '<a href="' + getSokSkjemaPath() + '" class="hk-btn-primary">Gå videre med søknaden</a>'
    + '</div>'
    + '</div>';
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
  setTimeout(function() {
    panel.style.display = 'none';
    backdrop.style.display = 'none';
  }, 350);
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
      + '<a href="/utdanning" style="display:block;width:100%;text-align:center;padding:12px;border-radius:40px;font-size:16px;font-weight:500;cursor:pointer;border:1px solid #4e0000;color:#4e0000;background:none;font-family:inherit;text-decoration:none;">Legg til studier eller emner</a>'
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
      // Multiple cities — show selection in sidebar
      showCitySelectionInSidebar(cityMap);
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

/* ─── City selection in sidebar ─── */
function showCitySelectionInSidebar(cityMap) {
  injectSidebarPanel();
  openSoknaderPanel();
  var body = document.getElementById('hk-body');
  var footer = document.getElementById('hk-footer');
  var title = document.getElementById('hk-title');
  if (!body) return;
  if (footer) footer.style.display = 'none';
  if (title) title.textContent = 'Velg campus';

  var studyName = '';
  var firstChoice = cityMap[Object.keys(cityMap)[0]];
  if (firstChoice) studyName = firstChoice.name || '';

  var html = '<div style="padding:8px 0;">'
    + '<p style="font-size:14px;color:#666;margin:0 0 4px;">Du legger til:</p>'
    + '<p style="font-size:16px;font-weight:600;margin:0 0 20px;color:#1a1a1a;">' + studyName + '</p>'
    + '<p style="font-size:15px;font-weight:600;margin:0 0 12px;color:#1a1a1a;">Velg campus</p>';
  Object.keys(cityMap).forEach(function(city) {
    html += '<button class="hk-city-sidebar-btn" onclick="addChoiceToBasket(' + JSON.stringify(cityMap[city]).replace(/"/g, '&quot;') + ')"'
      + ' style="display:block;width:100%;text-align:left;padding:16px;margin-bottom:8px;border:1.5px solid #ddd;border-radius:8px;background:#fff;font-size:16px;font-weight:500;cursor:pointer;font-family:inherit;transition:border-color .15s,background .15s;"'
      + ' onmouseover="this.style.borderColor=\'#b71c2f\';this.style.background=\'#fdf5f5\'"'
      + ' onmouseout="this.style.borderColor=\'#ddd\';this.style.background=\'#fff\'"'
      + '>' + city + '</button>';
  });
  html += '</div>';
  body.innerHTML = html;
}

/* ─── City popover (legacy) ─── */
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
  // Normaliser vertikal justering (fjern inline-block baseline-gap)
  basketImg.style.display = 'block';
  btn.style.display = 'inline-flex';
  btn.style.alignItems = 'center';
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
  injectBookmarkPanel();
  injectBookmarkButtons();
  injectTopbarBookmarkIcon();
  normalizeTopbarOrder();
  updateBookmarkBadge();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBasket);
} else {
  initBasket();
}
