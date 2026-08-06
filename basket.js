/**
 * basket.js — Kristiania handlekurv
 * Strukturert datamodell i localStorage. Injiserer sidebar-panel.
 * Kaprer originale React «Søk nå»-knapper for campus-studier.
 */

/* ─── Global topbar fix ─── */
(function(){
  var s = document.createElement('style');
  s.textContent = [
    /* Skjul søk-li i topbaren (ikke wired opp i prototypen) */
    'li:has([role="search"]){display:none!important}',
    /* Skjul profil-ikon (Mitt Kristiania) – kun li med direkte barn-a til min-side */
    'li:has(> a[href$="/min-side/"]){display:none!important}',
    /* Større logo */
    'img[src*="Kristiania_logo"]{height:52px!important;width:auto!important}',
    /* Overflow visible på bokmerke-li så badge ikke klippes */
    '#topbar-bookmark-btn{overflow:visible!important}',
    'li:has(#topbar-bookmark-btn){overflow:visible!important;position:relative}'
  ].join('');
  document.head.appendChild(s);
})();

/* ─── Constants ─── */
var BASKET_KEY = 'kristiania_basket_v2';
var EMPTY_BASKET = { programs: [], looseEmner: [] };

/* ─── Path helper ─── */
function getSokSkjemaPath() {
  return '/sok-skjema.html';
}

/* ─── CSS (injiseres én gang) ─── */
var BASKET_CSS = '\
.uTMhMIeN0bDXVFVIysSa::after{display:none!important}\
#sok-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1200;transition:opacity .3s;opacity:0}\
#sok-panel{display:none;position:fixed;top:0;right:0;height:100%;width:460px;max-width:100vw;background:#fff;z-index:1201;box-shadow:-4px 0 32px rgba(0,0,0,.18);transform:translateX(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);flex-direction:column;font-family:inherit;overflow:hidden}\
.hk-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;flex-shrink:0;border-bottom:1px solid #c7c8ca}\
.hk-header h2{font-size:28px;font-weight:700;margin:0;color:#4e0000;line-height:1.2}\
.hk-close{background:none;border:none;cursor:pointer;padding:6px;color:#121212}\
.hk-close svg{width:24px;height:24px}\
.hk-body{flex:1;overflow-y:auto;padding:12px 20px}\
.hk-card{border:1px solid #e2e2e2;border-radius:12px;margin-bottom:16px;overflow:hidden;background:#fff;transition:border-color .2s}\
.hk-card:has(.hk-emner-list.open){border-color:#e3b9b9}\
.hk-card-header{display:flex;align-items:flex-start;justify-content:space-between;padding:16px;gap:12px;cursor:default;transition:background .2s}\
.hk-card-header.hk-clickable{cursor:pointer}\
.hk-card:has(.hk-emner-list.open) .hk-card-header{background:#fbeee4}\
.hk-card-meta{font-size:14px;font-weight:400;color:#3f3f3f;line-height:17.5px;margin-bottom:4px}\
.hk-card-name{font-size:18px;font-weight:700;color:#000;line-height:1.3}\
.hk-card-right{display:flex;align-items:center;gap:8px;flex-shrink:0}\
.hk-badge{font-size:14px;font-weight:400;padding:6px 10px;border-radius:16777200px;white-space:nowrap;color:#101828;line-height:16px}\
.hk-badge-sem{background:#f4ebe6}\
.hk-badge-city{background:#f9ccd2}\
.hk-badge-nett{background:#f9ccd2}\
.hk-trash{background:#eef1f6;border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;color:#3b6ea8;transition:background .15s,color .15s;flex-shrink:0}\
.hk-trash:hover{background:#dde6f0;color:#254e75}\
.hk-chevron{background:none;border:none;cursor:pointer;padding:4px;transition:transform .2s;color:#121212}\
.hk-emner-list{border-top:1px solid #eee;display:none}\
.hk-emner-list.open{display:block}\
.hk-card:has(.hk-emner-list.open) .hk-emner-list{border-top-color:#f0d9d9}\
.hk-emne-row{display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid #eee;gap:8px;background:#fff}\
.hk-emne-row:last-child{border-bottom:none}\
.hk-card:has(.hk-emner-list.open) .hk-emne-row{border-bottom-color:#f0d9d9}\
.hk-emner-list{overflow:hidden}\
@keyframes hkEmneAdded{0%{background:#dbe5ff;box-shadow:inset 3px 0 0 #2f54eb}70%{background:#dbe5ff;box-shadow:inset 3px 0 0 #2f54eb}100%{background:transparent;box-shadow:inset 3px 0 0 transparent}}\
.hk-emne-row.hk-emne-added{animation:hkEmneAdded 2s ease}\
.hk-emne-meta{font-size:14px;font-weight:400;color:#3f3f3f;line-height:17.5px}\
.hk-emne-name{font-size:18px;font-weight:700;color:#000;line-height:1.3}\
.hk-emne-right{display:flex;align-items:center;gap:8px;flex-shrink:0}\
.hk-badge-date{background:#fff;color:#101828;font-size:14px;font-weight:400;padding:6px 10px;border-radius:16777200px;line-height:16px}\
.hk-section-header{display:flex;align-items:center;justify-content:space-between;padding:12px 0 8px;cursor:pointer}\
.hk-section-title{font-size:14px;font-weight:400;color:#3f3f3f}\
.hk-footer{padding:16px 20px;border-top:1px solid #c7c8ca;flex-shrink:0;display:flex;flex-direction:column;gap:10px}\
.hk-btn-outline{display:block;width:100%;text-align:center;padding:13px;border-radius:40px;font-size:16px;font-weight:600;cursor:pointer;border:1.5px solid #4e0000;color:#4e0000;background:none;font-family:inherit}\
.hk-btn-outline:hover{background:#faf5f5}\
.hk-btn-primary{display:block;width:100%;text-align:center;padding:13px;border-radius:40px;font-size:16px;font-weight:600;cursor:pointer;border:none;background:#06f;color:#fff;text-decoration:none;font-family:inherit}\
.hk-btn-primary:hover{background:#0052cc}\
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
.bm-sok-alle-btn{display:block;width:100%;box-sizing:border-box;padding:16px;border-radius:32px;font-size:16px;font-weight:700;cursor:pointer;border:none;background:#2f54eb;color:#fff;font-family:inherit;transition:background .15s}\
.bm-sok-alle-btn:hover{background:#1f3fd0}\
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
.bm-back-btn{display:inline-flex;align-items:center;gap:6px;background:none;border:none;font-size:14px;font-weight:500;color:#555;cursor:pointer;font-family:inherit;padding:0;margin-bottom:4px;}\
.bm-back-btn:hover{color:#121212}\
.bm-view{padding:16px 20px 32px}\
.bm-view-title{font-size:22px;font-weight:700;color:#121212;margin:8px 0 6px}\
.bm-view-sub{font-size:14px;color:#555;line-height:1.5;margin:0 0 20px}\
.bm-phone-row{display:flex;margin-bottom:8px}\
.bm-phone-prefix{border:1.5px solid #c7c8ca;border-right:none;border-radius:8px 0 0 8px;padding:0 14px;font-size:15px;background:#fff;display:flex;align-items:center;color:#555;white-space:nowrap}\
.bm-phone-input{flex:1;border:1.5px solid #c7c8ca;border-left:none;border-radius:0 8px 8px 0;padding:14px;font-size:15px;font-family:inherit;outline:none}\
.bm-phone-input:focus{border-color:#06f}\
.bm-sms-hint{font-size:14px;color:#4e0000;margin:0 0 16px}\
.bm-consent-row{display:flex;gap:10px;align-items:flex-start;margin-bottom:20px}\
.bm-cb{width:20px;height:20px;min-width:20px;border:1.5px solid #c7c8ca;border-radius:4px;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;margin-top:1px;transition:background .15s,border-color .15s}\
.bm-cb.checked{background:#06f;border-color:#06f}\
.bm-cb-label{font-size:14px;color:#121212;line-height:1.4}\
.bm-cb-label a{color:#06f}\
.bm-btn-primary{display:flex;align-items:center;justify-content:center;height:52px;background:#06f;color:#fff;font-family:inherit;font-size:16px;font-weight:600;border:none;border-radius:40px;cursor:pointer;width:100%;transition:background .15s}\
.bm-btn-primary:hover{background:#0052cc}\
.bm-otp-group{display:flex;gap:12px;margin-bottom:20px}\
.bm-otp-input{width:64px;height:64px;border:1.5px solid #c7c8ca;border-radius:50%;font-size:24px;font-weight:600;text-align:center;color:#121212;font-family:inherit;background:#fff;outline:none;transition:border-color .15s}\
.bm-otp-input:focus{border-color:#06f}\
.bm-tilhorighet-row{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border:1.5px solid #c7c8ca;border-radius:8px;margin-bottom:20px}\
.bm-k-avatar{width:32px;height:32px;border-radius:6px;background:#cc0000;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:15px;flex-shrink:0}\
.bm-feide-option{display:flex;align-items:center;gap:14px;width:100%;padding:16px 20px;border:1.5px solid #06f;border-radius:8px;background:#fff;font-size:15px;font-weight:500;color:#121212;cursor:pointer;font-family:inherit;transition:background .15s}\
.bm-feide-option:hover{background:#f0f7ff}\
.bm-feide-options{display:flex;flex-direction:column;gap:12px}\
.bm-hjelp-row{display:flex;align-items:center;justify-content:space-between;padding:16px 0 0;font-size:15px;font-weight:500;color:#121212;border-top:1px solid #e8e8e8;margin-top:20px}\
.bm-user-card{display:flex;align-items:center;gap:12px;background:#f5f5f5;border-radius:10px;padding:12px 14px;margin:12px 0 4px}\
.bm-user-avatar{width:38px;height:38px;border-radius:50%;background:#4e0000;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;flex-shrink:0}\
.bm-user-info{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}\
.bm-user-name{font-size:14px;font-weight:600;color:#121212;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\
.bm-user-source{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#4e0000;font-weight:500}\
.bm-logout-btn{font-size:13px;color:#888;background:none;border:none;cursor:pointer;font-family:inherit;padding:0;white-space:nowrap;flex-shrink:0}\
.bm-logout-btn:hover{color:#4e0000;text-decoration:underline}\
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
  btn.style.cssText = 'position:relative;background:none;border:none;cursor:pointer;padding:8px;display:inline-flex;align-items:center;justify-content:center;width:auto;box-sizing:content-box;';
  btn.onclick = function() { openBookmarkPanel(); };
  btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;flex-shrink:0;"><path fill-rule="evenodd" clip-rule="evenodd" d="M6 2C4.89543 2 4 2.89543 4 4V21C4 21.3729 4.20764 21.7148 4.53843 21.8866C4.86921 22.0584 5.26803 22.0319 5.57346 21.8178L12 17.3148L18.4265 21.8178C18.732 22.0319 19.1308 22.0584 19.4616 21.8866C19.7924 21.7148 20 21.3729 20 21V4C20 2.89543 19.1046 2 18 2H6ZM6 4H18V19.0813L12.5735 15.2822C12.2293 15.0411 11.7707 15.0411 11.4265 15.2822L6 19.0813V4Z" fill="#121212"/></svg>'
    + '<span id="topbar-bookmark-count" style="display:none;position:absolute;top:2px;right:2px;background:#c8233f;color:#fff;border-radius:50%;width:16px;height:16px;font-size:10px;font-weight:700;line-height:16px;text-align:center;box-sizing:border-box;"></span>';

  if (basketLi) {
    var li = document.createElement('li');
    li.className = basketLi.className;
    var liStyle = basketLi.getAttribute('style');
    if (liStyle) li.setAttribute('style', liStyle);
    // Sørg for vertikal sentrering uansett side (noen sider mangler dette på li-en)
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.minWidth = '44px';
    li.style.justifyContent = 'center';
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
    + '<div class="hk-footer" id="bm-footer" style="display:none">'
    + '<button class="bm-sok-alle-btn" onclick="applyAllBookmarks()">Legg til i søknad</button>'
    + '</div>'
    + '</div>';
  document.body.insertAdjacentHTML('beforeend', html);
}

var BM_FEIDE_ICON = '<svg width="26" height="26" viewBox="0 0 32 32" fill="none"><rect x="6" y="6" width="20" height="20" rx="3" stroke="#1f2b6b" stroke-width="2"/><path d="M12 26v-7a4 4 0 0 1 8 0v7" stroke="#1f2b6b" stroke-width="2" stroke-linecap="round"/></svg>';

function bookmarkLoginHtml() {
  return '<div style="border-top:1px solid #efefef;padding:20px 0 8px;margin-top:8px;">'
    + '<p style="font-size:14px;font-weight:600;color:#121212;margin:0 0 14px;line-height:1.4;">Logg inn eller opprett bruker for å lagre bokmerkene</p>'
    + '<button class="bm-btn-primary" onclick="showBmLoginChoice()">Gå videre</button>'
    + '</div>';
}

function bookmarkLoginChoiceHtml() {
  return '<div class="bm-view">'
    + '<button class="bm-back-btn" onclick="showBmMain()">' + BM_BACK_ICON + 'Tilbake</button>'
    + '<h3 class="bm-view-title" style="margin-bottom:20px;">Logg inn</h3>'
    + '<p class="bm-login-label">Ny bruker</p>'
    + '<button class="bm-feide-btn" onclick="showBmNewUser()">Opprett bruker</button>'
    + '<div class="bm-or">ELLER</div>'
    + '<p class="bm-login-label">Student ved Kristiania med aktiv FEIDE-bruker.</p>'
    + '<button class="bm-feide-btn" onclick="showBmFeide()">Fortsett med FEIDE' + BM_FEIDE_ICON + '</button>'
    + '</div>';
}

/* ─── Bookmark panel views ─── */
var _bmView = 'main'; // 'main' | 'newuser' | 'newuser-otp' | 'feide'
var _bmPhone = '';
var _bmLoggedIn = false;
var _bmUserName = '';

var BM_BACK_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function showBmNewUser()      { _bmView = 'newuser';       renderBmActiveView(); }
function showBmFeide()        { _bmView = 'feide';         renderBmActiveView(); }
function showBmLoginChoice()  { _bmView = 'login-choice';  renderBmActiveView(); }
function showBmMain()         { _bmView = 'main';          renderBookmarkPanel(); }

function renderBmActiveView() {
  var body = document.getElementById('bm-body');
  var title = document.getElementById('bm-title');
  if (!body) return;
  if (_bmView === 'login-choice') {
    if (title) title.textContent = 'Logg inn';
    body.innerHTML = bookmarkLoginChoiceHtml();
  } else if (_bmView === 'newuser') {
    if (title) title.textContent = 'Opprett bruker';
    body.innerHTML = bmNewUserHtml();
  } else if (_bmView === 'newuser-otp') {
    if (title) title.textContent = 'Bekreft kode';
    body.innerHTML = bmOtpHtml();
    body.querySelectorAll('.bm-otp-input')[0].focus();
  } else if (_bmView === 'feide') {
    if (title) title.textContent = 'Logg inn';
    body.innerHTML = bmFeideHtml();
  }
}

function bmNewUserHtml() {
  return '<div class="bm-view">'
    + '<button class="bm-back-btn" onclick="showBmMain()">' + BM_BACK_ICON + 'Tilbake</button>'
    + '<h3 class="bm-view-title">Opprett bruker</h3>'
    + '<div class="bm-phone-row">'
    + '<div class="bm-phone-prefix">+47</div>'
    + '<input type="tel" id="bm-telefon" class="bm-phone-input" placeholder="Telefonnummer" inputmode="numeric">'
    + '</div>'
    + '<p class="bm-sms-hint">Du får en bekreftelseskode på SMS.</p>'
    + '<div class="bm-consent-row">'
    + '<div id="bm-consent-cb" class="bm-cb" onclick="bmToggleCb(this)"></div>'
    + '<span class="bm-cb-label" onclick="bmToggleCb(document.getElementById(\'bm-consent-cb\'))">Jeg samtykker til å bli kontaktet av en studierådgiver og har lest <a href="#" onclick="event.stopPropagation()">personvernerklæringen</a>.</span>'
    + '</div>'
    + '<button class="bm-btn-primary" onclick="bmGaVidereStep1()">Gå videre</button>'
    + '</div>';
}

function bmToggleCb(el) {
  el.classList.toggle('checked');
  el.innerHTML = el.classList.contains('checked')
    ? '<svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : '';
}

function bmGaVidereStep1() {
  var inp = document.getElementById('bm-telefon');
  var tel = inp ? inp.value.replace(/\s/g, '') : '';
  if (!tel || tel.length < 8) { if (inp) inp.style.borderColor = '#b60202'; return; }
  _bmPhone = tel;
  _bmView = 'newuser-otp';
  renderBmActiveView();
}

function bmOtpHtml() {
  var fmt = _bmPhone.replace(/(\d{3})(\d{2})(\d{3})/, '$1 $2 $3');
  var inputs = [0,1,2,3].map(function(i) {
    return '<input type="tel" maxlength="1" inputmode="numeric" class="bm-otp-input"'
      + ' oninput="bmOtpNext(this,' + i + ')" onkeydown="bmOtpBack(event,' + i + ')">';
  }).join('');
  return '<div class="bm-view">'
    + '<button class="bm-back-btn" onclick="showBmNewUser()">' + BM_BACK_ICON + 'Tilbake</button>'
    + '<h3 class="bm-view-title">Bekreftelseskode</h3>'
    + '<p class="bm-view-sub">Vi har sendt deg en kode på <strong>' + fmt + '</strong>.</p>'
    + '<div class="bm-otp-group">' + inputs + '</div>'
    + '<button class="bm-btn-primary" onclick="bmBekreftKode()">Bekreft</button>'
    + '</div>';
}

function bmOtpNext(input, idx) {
  input.value = input.value.replace(/\D/g, '').slice(-1);
  var inputs = document.querySelectorAll('#bm-body .bm-otp-input');
  if (input.value && idx < 3) inputs[idx + 1].focus();
}

function bmOtpBack(e, idx) {
  var inputs = document.querySelectorAll('#bm-body .bm-otp-input');
  if (e.key === 'Backspace' && !inputs[idx].value && idx > 0) inputs[idx - 1].focus();
}

function bmBekreftKode() {
  var inputs = document.querySelectorAll('#bm-body .bm-otp-input');
  var code = Array.from(inputs).map(function(i) { return i.value; }).join('');
  if (code.length < 4) { inputs[0].focus(); return; }
  _bmLoggedIn = true;
  _bmUserName = 'Lars Juster Eilefsen';
  _bmView = 'main';
  renderBookmarkPanel();
}

function bmFeideLogin() {
  _bmLoggedIn = true;
  _bmUserName = 'Lars Juster Eilefsen';
  _bmView = 'main';
  renderBookmarkPanel();
}

function bmLogout() {
  _bmLoggedIn = false;
  _bmUserName = '';
  renderBookmarkPanel();
}

function bmLoggedInHtml() {
  var initials = _bmUserName.split(' ').map(function(w){return w[0];}).slice(0,2).join('');
  var FEIDE_LOCK = '<svg width="12" height="12" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke="#4e0000" stroke-width="2"/><rect x="11" y="15" width="10" height="8" rx="1.5" stroke="#4e0000" stroke-width="1.8"/><path d="M13 15v-3a3 3 0 016 0v3" stroke="#4e0000" stroke-width="1.8" stroke-linecap="round"/></svg>';
  return '<div class="bm-user-card">'
    + '<div class="bm-user-avatar">' + initials + '</div>'
    + '<div class="bm-user-info">'
    + '<span class="bm-user-name">' + _bmUserName + '</span>'
    + '<span class="bm-user-source">' + FEIDE_LOCK + 'Logget inn</span>'
    + '</div>'
    + '<button class="bm-logout-btn" onclick="bmLogout()">Logg ut</button>'
    + '</div>';
}

function bmFeideHtml() {
  var msIcon = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="flex-shrink:0"><rect width="9.5" height="9.5" fill="#F25022"/><rect x="10.5" width="9.5" height="9.5" fill="#7FBA00"/><rect y="10.5" width="9.5" height="9.5" fill="#00A4EF"/><rect x="10.5" y="10.5" width="9.5" height="9.5" fill="#FFB900"/></svg>';
  var idPortenIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="flex-shrink:0"><rect x="2" y="2" width="20" height="20" rx="3" stroke="#222" stroke-width="1.5"/><path d="M7 8h10M7 12h10M7 16h6" stroke="#222" stroke-width="1.5" stroke-linecap="round"/></svg>';
  return '<div class="bm-view">'
    + '<button class="bm-back-btn" onclick="showBmMain()">' + BM_BACK_ICON + 'Tilbake</button>'
    + '<h3 class="bm-view-title">Logg inn med Feide</h3>'
    + '<p class="bm-view-sub">Du må logge deg på via Feide for å få tilgang til Dataporten.</p>'
    + '<div style="font-size:13px;color:#888;margin-bottom:8px;font-weight:500;">Din tilhørighet</div>'
    + '<div class="bm-tilhorighet-row">'
    + '<div style="display:flex;align-items:center;gap:12px;"><div class="bm-k-avatar">K</div><span style="font-size:15px;font-weight:500;color:#121212;">Kristiania</span></div>'
    + '<button style="background:none;border:none;font-size:14px;color:#06f;cursor:pointer;text-decoration:underline;font-family:inherit;padding:0;">Endre tilhørighet</button>'
    + '</div>'
    + '<div class="bm-feide-options">'
    + '<button class="bm-feide-option" onclick="bmFeideLogin()">' + msIcon + 'Bruk arbeids- eller skolekonto</button>'
    + '<button class="bm-feide-option" onclick="bmFeideLogin()">' + idPortenIcon + 'Logg inn med ID-porten</button>'
    + '</div>'
    + '<div class="bm-hjelp-row"><span>Trenger du hjelp?</span><span style="font-size:22px;font-weight:300;color:#888;line-height:1;">+</span></div>'
    + '</div>';
}

function openBookmarkPanel() {
  _bmView = 'main';
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
  body.innerHTML = html;
  var footer = document.getElementById('bm-footer');
  if (footer) footer.style.display = 'block';
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

/* Legg alle bokmerkede studier til søknaden */
function applyAllBookmarks() {
  var arr = getBookmarks();
  arr.forEach(function(bm) {
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
  });
  window.location.href = getSokSkjemaPath();
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
    + '<div class="hk-header"><h2 id="hk-title">Søknader</h2>'
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
var TRASH_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
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

  var totalItems = b.programs.length + b.looseEmner.length;
  if (title) title.textContent = 'Søknader';

  if (totalItems === 0) {
    body.innerHTML = '<div class="hk-empty">'
      + '<div style="background:#f4ebe6;border-radius:88px;padding:16px;display:inline-flex;align-items:center;justify-content:center;">'
      + '<svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M22 9L12 5 2 9l10 4 10-4z" stroke="#121212" stroke-width="1.8" stroke-linejoin="round" fill="none"/><path d="M6 11v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" stroke="#121212" stroke-width="1.8" stroke-linejoin="round" fill="none"/><line x1="22" y1="9" x2="22" y2="14" stroke="#121212" stroke-width="1.8" stroke-linecap="round"/></svg>'
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
      emnerHtml += '<div class="hk-emne-row" data-code="' + (e.code || '') + '">'
        + '<div><div class="hk-emne-meta">#' + (e.code || '') + ' · ' + (e.pts || 0) + ' studiepoeng</div>'
        + '<div class="hk-emne-name">' + e.name + '</div></div>'
        + '<div class="hk-emne-right">'
        + (e.startDate ? '<span class="hk-badge-date">' + e.startDate + '</span>' : '')
        + '<button class="hk-trash" onclick="removeEmne(\'' + prog.id + '\',\'' + e.code + '\')" aria-label="Fjern">' + TRASH_SVG + '</button>'
        + '</div></div>';
    });
  }

  return '<div class="hk-card" data-prog-id="' + prog.id + '"><div class="hk-card-header hk-clickable" onclick="toggleHkEmner(this)">'
    + '<div><div class="hk-card-meta">' + meta + '</div>'
    + '<div class="hk-card-name">' + prog.name + '</div></div>'
    + '<div class="hk-card-right">'
    + '<button class="hk-chevron">' + CHEVRON_DOWN + '</button>'
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
  return '<div class="hk-card"><div class="hk-card-header hk-clickable" onclick="toggleHkEmner(this)">'
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
  var basketLi = btn.closest('li');
  if (basketLi) { basketLi.style.display = 'flex'; basketLi.style.alignItems = 'center'; }
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
    badge.style.cssText = 'display:none;position:absolute;top:2px;right:2px;background:#c8233f;color:#fff;border-radius:50%;width:16px;height:16px;font-size:10px;font-weight:700;line-height:16px;text-align:center;box-sizing:border-box;';
    btn.appendChild(badge);
  }
}

/* ─── Send basket by email (stub) ─── */
function sendBasketByEmail() {
  alert('Send på e-post – ikke implementert ennå.');
}

/* ─── Enkeltemne: «Kjøp emnet» ───
   På enkeltemne-sider skal «Kjøp emnet» legge emnet inn under en bachelorgrad.
   Hvis emnet inngår i en bachelorgrad som allerede ligger i søknaden, legges det
   rett dit. Ellers spør vi hvilken grad emnet skal inngå i (fra «Dette emnet
   inngår i»-listen nederst på siden). */

function normalizeProgName(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function slugifyProgram(s) {
  return 'emne-prog-' + (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/* Emne-data fra React-props (subject-objektet bak «Kjøp emnet») */
function extractEmneSubject() {
  var props = window.__reactProps || {};
  var keys = Object.keys(props);
  for (var i = 0; i < keys.length; i++) {
    var v = props[keys[i]];
    if (v && v.subject && v.subject.code) return v.subject;
  }
  return null;
}

function buildEmneObj(subject) {
  return {
    code: subject.code,
    name: subject.name || '',
    pts: subject.credits || 0,
    price: (subject.price && subject.price.amount) || 0
  };
}

/* Programmene emnet inngår i («Dette emnet inngår i»-listen).
   Kun bachelorprogrammer tas med (lenker med /bachelor/ i URL-en) –
   årsstudier og enkeltemner utelates. */
function getEmneIncludedPrograms() {
  var strongs = document.querySelectorAll('strong, h2, h3');
  for (var i = 0; i < strongs.length; i++) {
    if (/Dette emnet inngår i/i.test(strongs[i].textContent || '')) {
      var parent = strongs[i].parentElement;
      var links = parent ? parent.querySelectorAll('ul a') : [];
      var seen = {};
      var out = [];
      for (var j = 0; j < links.length; j++) {
        var href = links[j].getAttribute('href') || '';
        if (href.indexOf('/bachelor/') === -1) continue;
        var txt = (links[j].textContent || '').trim();
        var key = normalizeProgName(txt);
        if (txt && !seen[key]) { seen[key] = 1; out.push({ name: txt, href: href }); }
      }
      return out;
    }
  }
  return [];
}

/* Åpne riktig program-kort, scroll til den nye emne-raden og fremhev den */
function revealEmne(programId, code) {
  setTimeout(function() {
    var card = document.querySelector('#hk-body .hk-card[data-prog-id="' + programId + '"]');
    if (!card) return;
    var list = card.querySelector('.hk-emner-list');
    var chev = card.querySelector('.hk-chevron');
    if (list && !list.classList.contains('open')) {
      list.classList.add('open');
      if (chev) chev.innerHTML = CHEVRON_UP;
    }
    var row = card.querySelector('.hk-emne-row[data-code="' + code + '"]');
    if (!row) return;
    row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    // Restart animasjonen om raden allerede har klassen
    row.classList.remove('hk-emne-added');
    void row.offsetWidth;
    row.classList.add('hk-emne-added');
    setTimeout(function() { row.classList.remove('hk-emne-added'); }, 2100);
  }, 120);
}

/* Legg emnet til et eksisterende program i kurven */
function addEmneToProgram(programId, emne) {
  var b = getBasket();
  var prog = b.programs.find(function(p) { return p.id === programId; });
  if (!prog) return;
  if (!prog.emner) prog.emner = [];
  if (!prog.emner.find(function(e) { return e.code === emne.code; })) {
    prog.emner.push(emne);
  }
  if (prog.type !== 'nett') prog.type = 'nett';
  saveBasket(b);
}

/* Kjente nett-bachelorprogrammer med egen studieplanlegger – bruk samme id
   slik at emnet havner på samme kort som studieplanleggeren bruker. */
var KNOWN_PROGRAM_IDS = {
  'administrasjon og ledelse': 'adm-ledelse-nett',
  'anvendt psykologi': 'anvendt-psykologi-nett'
};

/* Opprett (eller finn) et program ut fra navn og legg emnet der */
function chooseEmneProgram(emne, programName, programId) {
  var b = getBasket();
  var norm = normalizeProgName(programName);
  if (!programId && KNOWN_PROGRAM_IDS[norm]) programId = KNOWN_PROGRAM_IDS[norm];
  var prog = b.programs.find(function(p) {
    return (programId && p.id === programId) || normalizeProgName(p.name) === norm;
  });
  if (!prog) {
    prog = { id: programId || slugifyProgram(programName), name: programName,
             level: 'Bachelor', points: '', type: 'nett', emner: [] };
    b.programs.push(prog);
  }
  if (!prog.emner) prog.emner = [];
  if (!prog.emner.find(function(e) { return e.code === emne.code; })) {
    prog.emner.push(emne);
  }
  if (prog.type !== 'nett') prog.type = 'nett';
  saveBasket(b);
  openSoknaderPanel();
  revealEmne(prog.id, emne.code);
}

/* Sidebar-valg: hvilken grad skal emnet inn i? */
var _emneChoiceState = null;

function showEmneProgramChoice(emne, programs, inCart) {
  _emneChoiceState = { emne: emne, programs: programs };
  injectSidebarPanel();
  openSoknaderPanel();
  var body = document.getElementById('hk-body');
  var footer = document.getElementById('hk-footer');
  var title = document.getElementById('hk-title');
  if (!body) return;
  if (footer) footer.style.display = 'none';
  if (title) title.textContent = 'Velg studieprogram';

  var intro = inCart
    ? '<p style="font-size:18px;font-weight:500;margin:0 0 8px;color:#121212;line-height:1.4;">Emnet inngår i flere av studiene i søknaden din.</p>'
      + '<p style="font-size:18px;font-weight:500;margin:0 0 24px;color:#121212;line-height:1.4;">Hvilken vil du legge det til i?</p>'
    : '<p style="font-size:18px;font-weight:500;margin:0 0 8px;color:#121212;line-height:1.4;">Dette emnet tilhører flere studieprogrammer.</p>'
      + '<p style="font-size:18px;font-weight:500;margin:0 0 24px;color:#121212;line-height:1.4;">Hvilket program ønsker du at emnet skal inngå i?</p>';

  var html = '<div style="padding:8px 0;">' + intro;
  programs.forEach(function(p, idx) {
    html += '<button class="hk-prog-choice" onclick="pickEmneProgram(' + idx + ')"'
      + ' style="display:block;width:100%;text-align:left;padding:20px;margin-bottom:12px;border:1px solid #c7c8ca;border-radius:12px;background:#fff;font-size:18px;font-weight:500;color:#121212;cursor:pointer;font-family:inherit;transition:border-color .15s,background .15s;"'
      + ' onmouseover="this.style.borderColor=\'#4e0000\';this.style.background=\'#faf5f5\'"'
      + ' onmouseout="this.style.borderColor=\'#c7c8ca\';this.style.background=\'#fff\'"'
      + '>' + p.name + '</button>';
  });
  html += '<div style="margin-top:12px;padding-top:20px;border-top:1px solid #e3e3e3;display:flex;flex-direction:column;align-items:center;gap:16px;">'
    + '<p style="font-size:16px;font-weight:500;margin:0;color:#4e0000;text-align:center;">Logg inn for å finne påbegynte studieprogrammer</p>'
    + '<button onclick="closeSoknaderPanel()" style="display:block;width:100%;text-align:center;padding:16px;border-radius:40px;font-size:16px;font-weight:600;cursor:pointer;border:none;background:#06f;color:#fff;font-family:inherit;">Logg inn</button>'
    + '</div></div>';
  body.innerHTML = html;
}

function pickEmneProgram(idx) {
  var st = _emneChoiceState;
  if (!st || !st.programs[idx]) return;
  var p = st.programs[idx];
  chooseEmneProgram(st.emne, p.name, p.id || null);
}

function handleKjopEmnet() {
  var subject = extractEmneSubject();
  if (!subject) return;
  var emne = buildEmneObj(subject);
  var included = getEmneIncludedPrograms();
  var includedNames = included.map(function(p) { return normalizeProgName(p.name); });

  var b = getBasket();
  var cartProgs = b.programs.filter(function(p) { return p.level === 'Bachelor'; });
  var matches = cartProgs.filter(function(p) {
    return includedNames.indexOf(normalizeProgName(p.name)) !== -1;
  });

  if (matches.length === 1) {
    addEmneToProgram(matches[0].id, emne);
    openSoknaderPanel();
    revealEmne(matches[0].id, emne.code);
  } else if (matches.length > 1) {
    showEmneProgramChoice(emne, matches.map(function(p) { return { name: p.name, id: p.id }; }), true);
  } else {
    // Emnet inngår ikke i noen bachelorgrad i kurven – spør hvilken grad
    var choices = included.length ? included : [{ name: subject.name }];
    showEmneProgramChoice(emne, choices, false);
  }
}

function interceptKjopEmnet() {
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    if (!btn.classList.contains('yEK9biWpMxeKit4W3SEn')) return;
    if ((btn.textContent || '').trim().indexOf('Kjøp emnet') === -1) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    handleKjopEmnet();
  }, true);
}

/* ─── Init ─── */
function initBasket() {
  injectSidebarPanel();
  enhanceTopbarBasket();
  refreshBasketUI();
  interceptSokNaaButtons();
  interceptKjopEmnet();
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
