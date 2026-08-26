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
  ].join('');
  document.head.appendChild(s);
})();

/* ─── Constants ─── */
var BASKET_KEY = 'kristiania_basket_v2';
var EMPTY_BASKET = { programs: [], looseEmner: [] };

/* Demo: studiehistorikken til den innloggede brukeren – emner som er bestått i
   et tidligere semester, gruppert på studieprogrammet de ble tatt i. Et program
   med minst ett bestått emne regnes som påbegynt, se getStartedPrograms().
   `href` må matche lenken programmet har i «Dette emnet inngår i»-listen på
   enkeltemnesidene, siden det er nøkkelen vi kobler på. */
/* Demo-studiehistorikk. `completed` er de beståtte emnene med studiepoeng,
   `localUrl` siden i prototypen kortet lenker til – med anker rett ned til
   studieplanleggeren, som er det studenten skal videre i. */
var COMPLETED_BY_PROGRAM = [
  { id: 'adm-ledelse-nett',
    name: 'Administrasjon og ledelse',
    href: '/studier/nettstudier/bachelor/administrasjon-og-ledelse/',
    localUrl: '/studier/Administrasjon og ledelse - Bachelor (nettstudie)#studieplanlegger',
    level: 'Bachelor', totalCredits: 180,
    kull: 'Kull 2024 \u2013 2027', studieform: 'Deltid',
    completed: [{ code: '6277', pts: 7.5 }, { code: '6024', pts: 7.5 },
                { code: '6340', pts: 7.5 }, { code: '6336', pts: 7.5 }] },
  { id: 'anvendt-psykologi-nett',
    name: 'Anvendt psykologi',
    href: '/studier/nettstudier/bachelor/bachelor-i-anvendt-psykologi/',
    localUrl: '/studier/Anvendt psykologi - Bachelor (nettstudie) _ Kristiania#emner-seksjon',
    level: 'Bachelor', totalCredits: 180,
    kull: 'Kull 2024 \u2013 2027', studieform: 'Deltid',
    completed: [{ code: 'ap-psyk101', pts: 15 }, { code: 'ap-psyk102', pts: 15 }] }
];

/* Utled kodelistene, så resten av koden kan fortsette å bruke .codes. */
COMPLETED_BY_PROGRAM.forEach(function(p) {
  p.codes = p.completed.map(function(e) { return e.code; });
  p.completedCredits = p.completed.reduce(function(sum, e) { return sum + e.pts; }, 0);
});

/* Flat liste over alle beståtte emnekoder, uavhengig av program. Beholdt som
   egen variabel fordi studieplanleggerne og utsjekk-flyten bruker den direkte. */
var COMPLETED_COURSE_CODES = COMPLETED_BY_PROGRAM.reduce(function(acc, p) {
  return acc.concat(p.codes);
}, []);

function isCompletedCourse(code) {
  return COMPLETED_COURSE_CODES.indexOf(String(code)) > -1;
}

/* Studieprogrammer studenten har påbegynt: har minst ett bestått emne.
   Kun relevant når brukeren er innlogget – anonyme besøkende har ingen kjent
   studiehistorikk å slå opp i. */
function getStartedPrograms() {
  if (!getAuthState()) return [];
  return COMPLETED_BY_PROGRAM.filter(function(p) { return p.codes.length > 0; });
}

/* Finn emner i kurven som allerede er bestått. Returnerer [] hvis ingen treff. */
function getCompletedConflicts() {
  var b = getBasket();
  var conflicts = [];
  (b.programs || []).forEach(function(p) {
    if (p.type === 'nett' && p.emner) {
      p.emner.forEach(function(e) {
        if (COMPLETED_COURSE_CODES.indexOf(String(e.code)) > -1) {
          conflicts.push({ code: e.code, name: e.name, source: 'program', programId: p.id });
        }
      });
    }
  });
  (b.looseEmner || []).forEach(function(e) {
    if (COMPLETED_COURSE_CODES.indexOf(String(e.code)) > -1) {
      conflicts.push({ code: e.code, name: e.name, source: 'loose' });
    }
  });
  return conflicts;
}

/* ─── Path helper ─── */
function getSokSkjemaPath() {
  return '/sok-skjema.html';
}

/* ─── Innloggingsstatus (delt globalt, uavhengig av side) ─── */
var AUTH_KEY = 'kristiania_auth_v1';

function getAuthState() {
  try {
    var raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function setAuthState(method, name) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ method: method, name: name || 'Lars Juster Eilefsen' }));
  if (typeof window._feideLoggedIn !== 'undefined') window._feideLoggedIn = (method === 'feide');
  if (typeof spApplyCompletedState === 'function') spApplyCompletedState();
  renderBasketPanel();
}

function clearAuthState() {
  localStorage.removeItem(AUTH_KEY);
  if (typeof window._feideLoggedIn !== 'undefined') window._feideLoggedIn = false;
  if (typeof spApplyCompletedState === 'function') spApplyCompletedState();
  renderBasketPanel();
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
.hk-card:has(.hk-emner-list) .hk-card-header{background:#fbeee4}\
.hk-card-meta{font-size:14px;font-weight:400;color:#3f3f3f;line-height:17.5px;margin-bottom:4px}\
.hk-card-name{font-size:18px;font-weight:700;color:#000;line-height:1.3}\
.hk-card-right{display:flex;align-items:center;gap:8px;flex-shrink:0}\
.hk-badge{font-size:14px;font-weight:500;padding:5px 12px;border-radius:16777200px;white-space:nowrap;line-height:16px;border:1px solid transparent}\
.hk-badge-sem{background:#fdf3f4;border-color:#8a1c2b;color:#8a1c2b}\
.hk-badge-city{background:#f6faff;border-color:#1a6dff;color:#1a6dff}\
.hk-badge-nett{background:#f8f4fe;border-color:#9a5cf0;color:#9a5cf0}\
.hk-trash{background:#eef1f6;border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;color:#3b6ea8;transition:background .15s,color .15s;flex-shrink:0}\
.hk-trash:hover{background:#dde6f0;color:#254e75}\
.hk-chevron{background:none;border:none;cursor:pointer;padding:4px;transition:transform .2s;color:#121212}\
.hk-emner-list{border-top:1px solid #eee;display:none}\
.hk-emner-list.open{display:block}\
.hk-card:has(.hk-emner-list.open) .hk-emner-list{border-top-color:#f0d9d9}\
.hk-emne-row{display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid #eee;gap:8px;background:#fff}\
.hk-emne-left{flex:1;min-width:0}\
.hk-emne-oppstart{font-size:14px;font-weight:400;color:#3f3f3f;line-height:17.5px;margin-top:2px}\
.hk-emne-oppstart strong{font-weight:700;color:#121212}\
/* Nett-merket ligger i venstre kolonne, ikke ved slettknappen \u2013 da f\u00e5r\
   emnetittelen hele radbredden. Emnetitlene er lange: en tredjedel av dem\
   er over 30 tegn. */\
.hk-emne-nett{display:inline-flex;margin-top:10px}\
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
.hk-footer{padding:16px 20px;border-top:1px solid #c7c8ca;flex-shrink:0;display:flex;flex-direction:column;gap:10px;position:sticky;bottom:0;background:#fff;z-index:2}\
.hk-auth-row{display:flex;align-items:center;justify-content:space-between;gap:12px}\
.hk-studying{margin:-16px -20px 0;border-bottom:1px solid #e6e6e6}\
.hk-studying-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 20px;background:none;cursor:pointer;font-family:inherit;border:none;width:100%;text-align:left}\
.hk-studying-bar b{font-size:15px;font-weight:700;color:#121212}\
.hk-studying-bar span.hk-studying-count{font-size:15px;font-weight:400;color:#6b5b52}\
.hk-studying-bar span.hk-studying-toggle{font-size:14px;font-weight:500;color:#121212;white-space:nowrap}\
.hk-studying-list{display:none;padding:0 20px 4px;max-height:230px;overflow-y:auto}\
.hk-studying-list.open{display:block}\
.hk-auth-row-loggedin{background:#f5f5f5;border-radius:10px;padding:10px 12px}\
.hk-auth-prompt{font-size:14px;font-weight:500;color:#4e0000;flex:1;margin:0}\
.hk-auth-identity{display:flex;align-items:center;gap:10px;min-width:0}\
.hk-auth-avatar{width:36px;height:36px;border-radius:50%;background:#d8d8d8;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:#333;flex-shrink:0}\
.hk-auth-info{display:flex;flex-direction:column;gap:2px;min-width:0}\
.hk-auth-name{font-size:14px;font-weight:500;color:#121212;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\
.hk-auth-source{display:inline-flex;align-items:center;gap:4px;font-size:12px;color:#4e0000;font-weight:500}\
.hk-btn-small{display:inline-block !important;width:auto !important;padding:8px 16px !important;font-size:13px !important;white-space:nowrap;flex-shrink:0;text-decoration:none}\
.hk-btn-outline{display:block;width:100%;text-align:center;padding:13px;border-radius:40px;font-size:16px;font-weight:600;cursor:pointer;border:1.5px solid #4e0000;color:#4e0000;background:none;font-family:inherit}\
.hk-btn-outline:hover{background:#faf5f5}\
.hk-btn-primary{display:block;width:100%;text-align:center;padding:13px;border-radius:40px;font-size:16px;font-weight:600;cursor:pointer;border:none;background:#06f;color:#fff;text-decoration:none;font-family:inherit}\
.hk-btn-primary:hover{background:#0052cc}\
.hk-empty{display:flex;flex-direction:column;align-items:center;text-align:center;gap:24px;padding:64px 16px 16px;color:#888}\
.hk-save-card{background:#fbeee4;border:1px solid #f0dfd2;border-radius:12px;margin-bottom:16px;overflow:hidden}\
.hk-save-card .hk-card-header{padding:16px;align-items:center}\
.hk-save-title{font-size:16px;font-weight:700;color:#121212;margin:0}\
.hk-save-body{padding:0 16px 20px}\
.hk-radio-group{display:flex;gap:20px;flex-wrap:wrap;margin-bottom:14px}\
.hk-radio-option{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:15px;color:#121212}\
.hk-radio-option input{position:absolute;opacity:0;width:0;height:0}\
.hk-radio-dot{position:relative;width:20px;height:20px;border-radius:50%;border:1.5px solid #06f;background:#fff;flex-shrink:0;box-sizing:border-box}\
.hk-radio-dot::after{content:"";position:absolute;top:50%;left:50%;width:10px;height:10px;border-radius:50%;background:transparent;transform:translate(-50%,-50%)}\
.hk-radio-option input:checked + .hk-radio-dot::after{background:#06f}\
.hk-save-consent-row{display:flex;gap:10px;align-items:flex-start;margin-bottom:16px}\
.hk-save-cb{width:20px;height:20px;min-width:20px;border:1.5px solid #c7c8ca;border-radius:4px;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;margin-top:1px;transition:background .15s,border-color .15s}\
.hk-save-cb.checked{background:#06f;border-color:#06f}\
.hk-save-cb-label{font-size:14px;color:#121212;line-height:1.4;cursor:pointer}\
.hk-save-input-row{display:flex;gap:10px}\
.hk-save-input{flex:1;min-width:0;border:1.5px solid #c7c8ca;border-radius:8px;padding:12px 14px;font-size:15px;font-family:inherit;outline:none;background:#fff}\
.hk-save-input:focus{border-color:#06f}\
.hk-save-send-btn{background:#06f;color:#fff;border:none;border-radius:8px;padding:0 22px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap}\
.hk-save-send-btn:hover{background:#0052cc}\
.hk-save-privacy{font-size:13px;color:#3f3f3f;line-height:1.5;margin:14px 0 0}\
.hk-save-privacy a{color:#121212}\
.hk-save-success-row{display:flex;gap:10px;align-items:flex-start}\
.hk-save-success{font-size:15px;color:#121212;font-weight:400;margin:0;line-height:1.5}\
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

/* Sørg for lik ikon-rekkefølge i topbaren på alle sider:
   profil → søk → kurv → meny */
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
  var menu     = liIn(document.querySelector('img[src*="Menu.svg"]'));

  var order = [profile, search, basketLi, menu];
  for (var i = 0; i < order.length; i++) {
    if (order[i] && order[i].parentNode === ul) ul.appendChild(order[i]);
  }
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
    + '<div class="hk-footer" id="hk-footer">'
    + '<div id="hk-studying-slot"></div>'
    + '<div id="hk-auth-slot"></div>'
    // Fra handlekurven er studievalget allerede gjort → hopp rett til innlogging
    + '<a href="' + getSokSkjemaPath() + '?steg=login" id="hk-cta-btn" class="hk-btn-primary" style="display:none;">Gå videre</a>'
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
var LOCK_SVG_SMALL = '<svg width="11" height="11" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke="#4e0000" stroke-width="2.2"/><rect x="11" y="15" width="10" height="7" rx="1.5" stroke="#4e0000" stroke-width="1.8"/><path d="M13 15v-2.5a3 3 0 016 0V15" stroke="#4e0000" stroke-width="1.8" stroke-linecap="round"/><circle cx="16" cy="19" r="1.2" fill="#4e0000"/></svg>';

/* Innloggingsrad i bunnen av Søknader-panelet — vises alltid, uansett kurvinnhold */
function buildAuthFooterRow(awaitingChoice, variant) {
  var auth = getAuthState();
  if (!auth) {
    /* P\u00e5 kull-niv\u00e5et er innlogging det som finner kullet ditt \u2013 ikke
       de p\u00e5begynte programmene. */
    var prompt = variant === 'kull'
      ? 'Logg inn, s\u00e5 finner vi kullet ditt'
      : 'Logg inn for \u00e5 finne p\u00e5begynte studieprogrammer';
    /* Venter panelet på et programvalg, skal «Logg inn» logge inn på stedet og
       vurdere valget på nytt – ikke sende brukeren inn i søknadsskjemaet og
       forlate emnet. Det er også det fotnoten lover. */
    var loginBtn = awaitingChoice
      ? '<button class="hk-btn-outline hk-btn-small" onclick="hkLoginAndRetryChoice()">Logg inn</button>'
      : '<a href="' + getSokSkjemaPath() + '?steg=login" class="hk-btn-outline hk-btn-small">Logg inn</a>';
    return '<div class="hk-auth-row">'
      + '<p class="hk-auth-prompt">' + prompt + '</p>'
      + loginBtn
      + '</div>';
  }
  var parts = (auth.name || '').trim().split(/\s+/);
  var initials = ((parts[0] || '')[0] || '') + ((parts[parts.length - 1] || '')[0] || '');
  var methodLabel = auth.method === 'feide' ? 'Innlogget med FEIDE' : 'Innlogget';
  return '<div class="hk-auth-row hk-auth-row-loggedin">'
    + '<div class="hk-auth-identity">'
    + '<div class="hk-auth-avatar">' + initials.toUpperCase() + '</div>'
    + '<div class="hk-auth-info"><span class="hk-auth-name">' + auth.name + '</span>'
    + '<span class="hk-auth-source">' + LOCK_SVG_SMALL + methodLabel + '</span></div>'
    + '</div>'
    + '<button class="hk-btn-outline hk-btn-small" onclick="clearAuthState()">Logg ut</button>'
    + '</div>';
}
var CHEVRON_DOWN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var CHEVRON_UP = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 15l-6-6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ─── «Lagre og fortsett senere» — send søknaden til seg selv på e-post/SMS ─── */
var _hkSaveOpen = false;
var _hkSaveMethod = 'epost'; // 'epost' | 'sms'
var _hkSaveConsent = false;

function hkSaveBoxHtml() {
  var isEpost = _hkSaveMethod === 'epost';
  var body = '';
  if (_hkSaveOpen) {
    body = '<div class="hk-save-body">'
      + '<div class="hk-radio-group">'
      + '<label class="hk-radio-option"><input type="radio" name="hk-save-method"' + (isEpost ? ' checked' : '') + ' onchange="setHkSaveMethod(\'epost\')"><span class="hk-radio-dot"></span>Send på e-post</label>'
      + '<label class="hk-radio-option"><input type="radio" name="hk-save-method"' + (!isEpost ? ' checked' : '') + ' onchange="setHkSaveMethod(\'sms\')"><span class="hk-radio-dot"></span>Send på SMS</label>'
      + '</div>'
      + '<div class="hk-save-consent-row">'
      + '<div id="hk-save-cb" class="hk-save-cb' + (_hkSaveConsent ? ' checked' : '') + '" onclick="hkToggleSaveConsent()">' + (_hkSaveConsent ? CHECK_SVG_SMALL : '') + '</div>'
      + '<span class="hk-save-cb-label" onclick="hkToggleSaveConsent()">En studierådgiver kan ta kontakt for å hjelpe meg med studievalg (valgfritt).</span>'
      + '</div>'
      + '<div class="hk-save-input-row">'
      + '<input type="' + (isEpost ? 'email' : 'tel') + '" id="hk-save-input" class="hk-save-input" placeholder="' + (isEpost ? 'Din e-postadresse' : 'Ditt mobilnummer') + '">'
      + '<button class="hk-save-send-btn" onclick="sendBasketSave()">Send</button>'
      + '</div>'
      + '<p class="hk-save-privacy">Vi behandler opplysningene dine i tråd med <a href="#">personvernerklæringen</a>.</p>'
      + '</div>';
  }
  return '<div class="hk-card hk-save-card" id="hk-save-box">'
    + '<div class="hk-card-header hk-clickable" onclick="toggleHkSaveBox()">'
    + '<p class="hk-save-title">Lagre og fortsett senere</p>'
    + '<button class="hk-chevron">' + (_hkSaveOpen ? CHEVRON_UP : CHEVRON_DOWN) + '</button>'
    + '</div>'
    + body
    + '</div>';
}

var CHECK_SVG_SMALL = '<svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var CHECK_SVG_DARK = '<svg width="16" height="12" viewBox="0 0 16 12" fill="none" style="flex-shrink:0;margin-top:3px"><path d="M1 6l4.5 4.5L15 1" stroke="#121212" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function toggleHkSaveBox() {
  _hkSaveOpen = !_hkSaveOpen;
  var box = document.getElementById('hk-save-box');
  if (box) box.outerHTML = hkSaveBoxHtml();
}

function hkToggleSaveConsent() {
  _hkSaveConsent = !_hkSaveConsent;
  var cb = document.getElementById('hk-save-cb');
  if (cb) {
    cb.classList.toggle('checked', _hkSaveConsent);
    cb.innerHTML = _hkSaveConsent ? CHECK_SVG_SMALL : '';
  }
}

function setHkSaveMethod(method) {
  _hkSaveMethod = method;
  var box = document.getElementById('hk-save-box');
  if (box) box.outerHTML = hkSaveBoxHtml();
}

function sendBasketSave() {
  var input = document.getElementById('hk-save-input');
  if (!input) return;
  var val = input.value.trim();
  var valid = _hkSaveMethod === 'epost'
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
    : val.replace(/\s/g, '').length >= 8;
  if (!valid) { input.style.borderColor = '#b60202'; input.focus(); return; }
  var body = input.closest('.hk-save-body');
  if (!body) return;
  var safeVal = val.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  body.innerHTML = '<div class="hk-save-success-row">' + CHECK_SVG_DARK
    + '<p class="hk-save-success">En lenke har blitt sendt til «' + safeVal + '». Bruk den for å fortsette søknaden senere.</p>'
    + '</div>';
}

/* ─── Render ─── */
/* Fyller innloggingsraden + viser/skjuler "Gå videre"-knappen. Kalles av alle
   visninger i #sok-panel (søknadsliste, velg-studieprogram, velg-campus) slik
   at bunnraden alltid er synlig og konsistent, uansett hva som vises i body. */
/* awaitingChoice: panelet venter på at brukeren velger studieprogram for et
   emne. Da skal «Gå videre» skjules – ellers kan man gå videre og
   miste emnet som er i ferd med å bli lagt til. Innloggingsraden beholdes,
   siden innlogging er en del av valget (den finner påbegynte program). */
function refreshSokPanelFooter(awaitingChoice, variant) {
  var authSlot = document.getElementById('hk-auth-slot');
  if (authSlot) authSlot.innerHTML = buildAuthFooterRow(awaitingChoice, variant);
  var studyingSlot = document.getElementById('hk-studying-slot');
  if (studyingSlot) studyingSlot.innerHTML = buildStudyingNowHtml();
  var ctaBtn = document.getElementById('hk-cta-btn');
  if (ctaBtn) {
    var b = getBasket();
    var totalItems = (b.programs || []).length + (b.looseEmner || []).length;
    ctaBtn.style.display = (!awaitingChoice && totalItems > 0) ? 'block' : 'none';
  }
  var footer = document.getElementById('hk-footer');
  if (footer) footer.style.display = 'flex';
}

var CHEVRON_RIGHT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* Studieprogrammene studenten har påbegynt, som kort i samme stil som resten av
   panelet. Vises bare innlogget – utlogget har vi ingen studiehistorikk. Hvert
   kort lenker inn til studiesiden; de har ingen slett-knapp, siden dette er
   pågående studier og ikke noe man har lagt i søknaden. */
/* «Du studerer nå» – sammenleggbar stripe øverst i foten av panelet, over
   innloggingsraden. Ligger i foten og ikke i kroppen, fordi kroppen handler om
   søknaden man fyller ut nå; de påbegynte studiene er kontekst. */
function buildStudyingNowHtml() {
  var started = getStartedPrograms();
  if (!started.length) return '';
  return '<div class="hk-studying">'
    + '<button type="button" class="hk-studying-bar" aria-expanded="false"'
    + ' onclick="hkToggleStudyingNow(this)">'
    + '<span><b>Du studerer nå</b> <span class="hk-studying-count">· ' + started.length
    + ' program</span></span>'
    + '<span class="hk-studying-toggle">Vis &#9662;</span>'
    + '</button>'
    + '<div class="hk-studying-list">' + buildStartedProgramCards() + '</div>'
    + '</div>';
}

function hkToggleStudyingNow(btn) {
  var wrap = btn.parentElement;
  var list = wrap ? wrap.querySelector('.hk-studying-list') : null;
  var label = btn.querySelector('.hk-studying-toggle');
  if (!list) return;
  var open = list.classList.toggle('open');
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (label) label.innerHTML = open ? 'Skjul &#9652;' : 'Vis &#9662;';
}

function buildStartedProgramCards() {
  var started = getStartedPrograms();
  if (!started.length) return '';
  var cards = started.map(function(p) {
    /* border:0 nullstiller Kristiania-CSS-ens understrek på <a>. */
    return '<a class="hk-card" href="' + p.localUrl + '"'
      + ' style="border:1px solid #e2e2e2;display:block;text-decoration:none;color:inherit;">'
      + '<div class="hk-card-header">'
      /* Studiepoengene studenten har tatt så langt – det sier mer om et
         påbegynt studium enn programmets totale omfang. */
      + '<div><div class="hk-card-meta">' + (p.level || '')
      + (p.completedCredits ? ' · ' + p.completedCredits + ' stp.' : '') + '</div>'
      + '<div class="hk-card-name">' + p.name + '</div></div>'
      + '<div class="hk-card-right">'
      + '<span class="hk-badge hk-badge-nett">Nett</span>'
      + '<span style="display:flex;align-items:center;color:#121212;">' + CHEVRON_RIGHT + '</span>'
      + '</div></div></a>';
  }).join('');
  return cards;
}

function renderBasketPanel() {
  injectSidebarPanel();
  var b = getBasket();
  var body = document.getElementById('hk-body');
  var title = document.getElementById('hk-title');
  if (!body) return;

  var totalItems = b.programs.length + b.looseEmner.length;
  if (title) title.textContent = 'Søknad';
  refreshSokPanelFooter();

  if (totalItems === 0) {
    body.innerHTML = '<div class="hk-empty">'
      + '<div style="background:#f4ebe6;border-radius:88px;padding:16px;display:inline-flex;align-items:center;justify-content:center;">'
      + '<svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M22 9L12 5 2 9l10 4 10-4z" stroke="#121212" stroke-width="1.8" stroke-linejoin="round" fill="none"/><path d="M6 11v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" stroke="#121212" stroke-width="1.8" stroke-linejoin="round" fill="none"/><line x1="22" y1="9" x2="22" y2="14" stroke="#121212" stroke-width="1.8" stroke-linecap="round"/></svg>'
      + '</div>'
      + '<a href="/utdanning" style="display:block;width:100%;text-align:center;padding:12px;border-radius:40px;font-size:16px;font-weight:500;cursor:pointer;border:1px solid #4e0000;color:#4e0000;background:none;font-family:inherit;text-decoration:none;">Legg til studier eller emner</a>'
      + '</div>';
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

  if (!getAuthState()) html += hkSaveBoxHtml();

  body.innerHTML = html;
}

/* Fjerning fra Søknader-panelet må også oppdatere søknadsskjemaet bak panelet,
   ellers står den siden med utdatert innhold. Funksjonene finnes bare der. */
function refreshSoknadsskjemaOmTilstede() {
  var steg = (typeof _currentStep !== 'undefined') ? _currentStep : null;
  if (steg === 0 && typeof renderStep0 === 'function') renderStep0();
  if (steg === 4 && typeof renderPaymentStep === 'function') renderPaymentStep();
  if (typeof renderSidebar === 'function') renderSidebar();
}

function hkRemoveProgram(id) {
  removeProgram(id);
  refreshSoknadsskjemaOmTilstede();
}

function hkRemoveEmne(programId, code) {
  removeEmne(programId, code);
  refreshSoknadsskjemaOmTilstede();
}

function hkRemoveLooseEmne(code) {
  removeLooseEmne(code);
  refreshSoknadsskjemaOmTilstede();
}

/* «180 studiepoeng» -> «180 stp.». Stedsstudier henter denne som fritekst fra
   studiesiden, så forkortingen må skje ved rendring. */
function shortPts(str) {
  return String(str || '').replace(/studiepoeng/gi, 'stp.');
}

function renderCampusCard(prog) {
  var badges = '';
  if (prog.startSemester) badges += '<span class="hk-badge hk-badge-sem">' + prog.startSemester + '</span>';
  if (prog.city) badges += '<span class="hk-badge hk-badge-city">' + prog.city + '</span>';
  return '<div class="hk-card"><div class="hk-card-header">'
    + '<div><div class="hk-card-meta">' + (prog.level || '') + (prog.points ? ' · ' + shortPts(prog.points) : '') + '</div>'
    + '<div class="hk-card-name">' + prog.name + '</div></div>'
    + '<div class="hk-card-right">' + badges
    + '<button class="hk-trash" onclick="hkRemoveProgram(\'' + prog.id + '\')" aria-label="Fjern">' + TRASH_SVG + '</button>'
    + '</div></div></div>';
}

function renderNettCard(prog) {
  var emnerCount = prog.emner ? prog.emner.length : 0;
  var totalPts = 0;
  if (prog.emner) prog.emner.forEach(function(e) { totalPts += parseFloat(e.pts) || 0; });
  var ptsStr = totalPts % 1 === 0 ? totalPts : totalPts.toFixed(1).replace('.', ',');
  var meta = (prog.level || '') + ' · ' + ptsStr + ' stp. · ' + emnerCount + ' emner';

  var emnerHtml = '';
  if (prog.emner) {
    prog.emner.forEach(function(e) {
      emnerHtml += '<div class="hk-emne-row" data-code="' + (e.code || '') + '">'
        + '<div class="hk-emne-left"><div class="hk-emne-meta">#' + (e.code || '') + ' · ' + (e.pts || 0) + ' stp.</div>'
        + '<div class="hk-emne-name">' + e.name + '</div>'
        + (e.startDate ? '<div class="hk-emne-oppstart">Oppstart: <strong>' + e.startDate + '</strong></div>' : '')
        + '<span class="hk-badge hk-badge-nett hk-emne-nett">Nett</span></div>'
        + '<div class="hk-emne-right">'
        + '<button class="hk-trash" onclick="hkRemoveEmne(\'' + prog.id + '\',\'' + e.code + '\')" aria-label="Fjern">' + TRASH_SVG + '</button>'
        + '</div></div>';
    });
  }

  return '<div class="hk-card" data-prog-id="' + prog.id + '"><div class="hk-card-header hk-clickable" onclick="toggleHkEmner(this)">'
    + '<div><div class="hk-card-meta">' + meta + '</div>'
    + '<div class="hk-card-name">' + prog.name + '</div></div>'
    + '<div class="hk-card-right">'
    + '<button class="hk-chevron">' + CHEVRON_DOWN + '</button>'
    + '<button class="hk-trash" onclick="event.stopPropagation();hkRemoveProgram(\'' + prog.id + '\')" aria-label="Fjern hele studieprogrammet">' + TRASH_SVG + '</button>'
    + '</div></div>'
    + '<div class="hk-emner-list">' + emnerHtml + '</div></div>';
}

function renderLooseEmner(emner) {
  var inner = '';
  emner.forEach(function(e) {
    inner += '<div class="hk-emne-row">'
      + '<div class="hk-emne-left"><div class="hk-emne-meta">' + (e.program || 'Enkeltemne') + ' · ' + (e.pts || 0) + ' stp.</div>'
      + '<div class="hk-emne-name">' + e.name + '</div>'
      + (e.startDate ? '<div class="hk-emne-oppstart">Oppstart: <strong>' + e.startDate + '</strong></div>' : '')
      + '<span class="hk-badge hk-badge-nett hk-emne-nett">Nett</span></div>'
      + '<div class="hk-emne-right">'
      + '<button class="hk-trash" onclick="hkRemoveLooseEmne(\'' + e.code + '\')" aria-label="Fjern">' + TRASH_SVG + '</button>'
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
  var title = document.getElementById('hk-title');
  if (!body) return;
  refreshSokPanelFooter();
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

/* ─── Enkeltemne: «Kjøp emnet» ───
   På enkeltemne-sider skal «Kjøp emnet» legge emnet inn under en bachelorgrad.
   Hvis emnet inngår i en bachelorgrad som allerede ligger i søknaden, legges det
   rett dit. Ellers spør vi hvilken grad emnet skal inngå i (fra «Dette emnet
   inngår i»-listen nederst på siden). */

function normalizeProgName(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/* Identiteten til et studieprogram = stien i lenken (uten domene og
   etterfølgende skråstrek). Brukes til å slå sammen dubletter i
   «Dette emnet inngår i»-listen. */
function programKeyFromHref(href) {
  return (href || '')
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '')
    .toLowerCase();
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
        /* Dedupliser på programmet lenken peker til, ikke på lenketeksten:
           kristiania.no lister samme bachelorgrad under flere navn (f.eks.
           «HR, ledelse og organisasjon» og «HR og personalledelse» peker
           begge på /bachelor/hr-ledelse-og-organisasjon/). Første navn vinner. */
        var key = programKeyFromHref(href);
        if (txt && !seen[key]) { seen[key] = 1; out.push({ name: txt, href: href }); }
      }
      return out;
    }
  }
  return [];
}

/* Studieprogrammer studenten har påbegynt OG som dette emnet inngår i.
   `included` er listen fra getEmneIncludedPrograms(). Kobling skjer på
   program-stien, ikke på navnet, siden samme grad opptrer under flere navn. */
function getStartedProgramsForEmne(included) {
  var keys = included.map(function(p) { return programKeyFromHref(p.href); });
  return getStartedPrograms().filter(function(sp) {
    return keys.indexOf(programKeyFromHref(sp.href)) !== -1;
  });
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
function chooseEmneProgram(emne, programName, programId, opts) {
  opts = opts || {};
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
  /* Kull og studieform hører til studieprogrammet, ikke til emnet. */
  if (opts.kull) prog.kull = opts.kull;
  if (opts.studieform) prog.studieform = opts.studieform;
  if (opts.code) prog.programCode = opts.code;
  if (!prog.emner) prog.emner = [];
  if (!prog.emner.find(function(e) { return e.code === emne.code; })) {
    prog.emner.push(emne);
  }
  if (prog.type !== 'nett') prog.type = 'nett';
  saveBasket(b);
  openSoknaderPanel();
  revealEmne(prog.id, emne.code);
}

/* Studieform og kull pr. studieprogram. Nøkkelen er program-stien, samme nøkkel
   som programKeyFromHref() gir – da treffer «Dette emnet inngår i»-lenkene
   direkte. Heltid ligger først og er alltid forvalgt. */
var STUDIEFORM = {
  heltid: { label: 'Heltid', note: '30 studiepoeng hvert semester. Estimert 7,5 timer hver dag, 5 dager i uka.' },
  deltid: { label: 'Deltid', note: '15 studiepoeng hvert semester. Estimert 3\u20134 timer hver dag, 5 dager i uka.' }
};

var PROGRAM_DETAILS = {
  '/studier/nettstudier/bachelor/administrasjon-og-ledelse': { code: 'BA-ADM', kull: [
    { id: '2026-2029', label: 'Kull 2026 \u2013 2029', note: 'Gjelder deg som starter n\u00e5' } ] },
  '/studier/nettstudier/bachelor/hr-ledelse-og-organisasjon': { code: 'BA-HR', kull: [
    { id: '2026-2029', label: 'Kull 2026 \u2013 2029', note: 'Gjelder deg som starter n\u00e5' },
    { id: '2023-2026', label: 'Kull 2023 \u2013 2026', note: 'Utg\u00e5ende kull \u00b7 siste opptak h\u00f8sten 2023' } ] },
  '/studier/nettstudier/bachelor/markedsforing': { code: 'BA-MF', kull: [
    { id: '2026-2029', label: 'Kull 2026 \u2013 2029', note: 'Gjelder deg som starter n\u00e5' },
    { id: '2024-2027', label: 'Kull 2024 \u2013 2027', note: 'For deg som startet h\u00f8sten 2024' },
    { id: '2023-2026', label: 'Kull 2023 \u2013 2026', note: 'Utg\u00e5ende kull \u00b7 siste opptak h\u00f8sten 2023' } ] },
  '/studier/nettstudier/bachelor/bachelor-i--pedagogikk': { code: 'BA-PED', kull: [
    { id: '2026-2029', label: 'Kull 2026 \u2013 2029', note: 'Gjelder deg som starter n\u00e5' },
    { id: '2024-2027', label: 'Kull 2024 \u2013 2027', note: 'For deg som startet h\u00f8sten 2024' } ] },
  '/studier/nettstudier/bachelor/bachelor-i-anvendt-psykologi': { code: 'BA-PSY', kull: [
    { id: '2026-2029', label: 'Kull 2026 \u2013 2029', note: 'Gjelder deg som starter n\u00e5' },
    { id: '2024-2027', label: 'Kull 2024 \u2013 2027', note: 'For deg som startet h\u00f8sten 2024' } ] },
  '/studier/nettstudier/bachelor/okonomi-og-administrasjon-profilering-regnskapsforer': { code: 'BA-\u00d8KA', kull: [
    { id: '2026-2029', label: 'Kull 2026 \u2013 2029', note: 'Gjelder deg som starter n\u00e5' },
    { id: '2023-2026', label: 'Kull 2023 \u2013 2026', note: 'Utg\u00e5ende kull \u00b7 siste opptak h\u00f8sten 2023' } ] },
  '/studier/nettstudier/bachelor/spesialpedagogikk': { code: 'BA-SPED', kull: [
    { id: '2026-2029', label: 'Kull 2026 \u2013 2029', note: 'Gjelder deg som starter n\u00e5' } ] },
  '/studier/nettstudier/bachelor/bachelor-i-rettsvitenskap': { code: 'BA-JUS', kull: [
    { id: '2026-2029', label: 'Kull 2026 \u2013 2029', note: 'Gjelder deg som starter n\u00e5' } ] }
};

/* Programdetaljer for et valg i panelet. Faller tilbake til ett kull, så flyten
   aldri stopper for et program vi ikke har data på. */
function getProgramDetails(p) {
  var d = (p && p.href) ? PROGRAM_DETAILS[programKeyFromHref(p.href)] : null;
  if (d) return d;
  return { code: null, kull: [{ id: '2026-2029', label: 'Kull 2026 \u2013 2029',
                               note: 'Gjelder deg som starter n\u00e5' }] };
}


/* Sidebar-valg: hvilken grad skal emnet inn i? */
var _emneChoiceState = null;

function showEmneProgramChoice(emne, programs, mode) {
  _emneChoiceState = { emne: emne, programs: programs, mode: mode };
  injectSidebarPanel();
  openSoknaderPanel();
  var body = document.getElementById('hk-body');
  var title = document.getElementById('hk-title');
  if (!body) return;
  refreshSokPanelFooter(true);
  if (title) title.textContent = programs.length ? 'Velg studieprogram' : 'Legg til emne';

  var intro;
  if (programs.length === 0) {
    intro = hkChoiceLine('Dette emnet inng\u00e5r ikke i noen av bachelorgradene p\u00e5 nett.', false)
          + hkChoiceLine('Du kan ta det som et frittst\u00e5ende enkeltemne.', true);
  } else if (mode === 'started') {
    intro = hkChoiceLine('Du har startet p\u00e5 flere studieprogram som dette emnet inng\u00e5r i.', false)
          + hkChoiceLine('Hvilket vil du legge det til i?', true);
  } else if (mode === 'cart' || mode === true) {
    intro = hkChoiceLine('Emnet inng\u00e5r i flere av studiene i s\u00f8knaden din.', false)
          + hkChoiceLine('Hvilken vil du legge det til i?', true);
  } else {
    intro = hkChoiceLine('Dette emnet tilh\u00f8rer flere studieprogrammer.', false)
          + hkChoiceLine('Hvilket program \u00f8nsker du at emnet skal inng\u00e5 i?', true);
  }

  var started = getStartedPrograms();
  function isStartedProgram(p) {
    return started.some(function(sp) {
      return (p.href && programKeyFromHref(p.href) === programKeyFromHref(sp.href))
          || normalizeProgName(p.name) === normalizeProgName(sp.name);
    });
  }

  var html = '<div style="padding:8px 0;">' + intro
    + (programs.length ? hkInfoAccordion('hk-info-prog', 'Kan jeg endre studieprogram senere?', INFO_ENDRE_PROGRAM) : '');
  programs.forEach(function(p, idx) {
    html += hkChoiceButton('openEmneProgramDetail(' + idx + ')', p.name, null,
                           isStartedProgram(p) ? '\u2713 Du har startet p\u00e5 dette studieprogrammet' : null);
  });
  /* Frittst\u00e5ende er et annet slags valg enn \u00e5 knytte emnet til en grad,
     og skilles derfor ut. */
  if (programs.length) html += hkOrDivider();
  html += hkChoiceButton('pickEmneAsLoose()', 'Som et frittst\u00e5ende enkeltemne',
                         'Ta faget uten \u00e5 starte p\u00e5 et helt studieprogram', null);
  html += '</div>';
  body.innerHTML = html;
}

/* ─── Byggeklosser for valgpanelet ─── */

function hkChoiceLine(text, last) {
  return '<p style="font-size:18px;font-weight:500;margin:0 0 ' + (last ? '24px' : '8px')
    + ';color:#121212;line-height:1.4;">' + text + '</p>';
}

/* Hvilket emne handler dette om – står øverst så konteksten ikke forsvinner
   n\u00e5r man g\u00e5r ett niv\u00e5 ned i programvalget. */
function hkEmneContextCard(emne) {
  if (!emne) return '';
  var pts = emne.pts ? ' \u00b7 ' + String(emne.pts).replace('.', ',') + ' stp.' : '';
  return '<div style="background:#f6ece3;border-radius:10px;padding:12px 16px;margin:0 0 20px;">'
    + '<div style="font-size:12.5px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:#7a6a6a;">Emne</div>'
    + '<div style="font-size:16px;font-weight:700;color:#121212;margin-top:2px;">'
    + emne.name + (emne.code ? ' (' + emne.code + ')' : '') + pts + '</div></div>';
}

var HK_CHOICE_STYLE = 'display:flex;align-items:center;gap:12px;width:100%;text-align:left;'
  + 'padding:18px 20px;margin-bottom:12px;border:1px solid #c7c8ca;border-radius:12px;background:#fff;'
  + 'cursor:pointer;font-family:inherit;transition:border-color .15s,background .15s;';

function hkOrDivider() {
  return '<div style="display:flex;align-items:center;gap:14px;margin:20px 0;">'
    + '<span style="flex:1;height:1px;background:#dcdcdc;"></span>'
    + '<span style="font-size:12.5px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:#7a6a6a;">Eller</span>'
    + '<span style="flex:1;height:1px;background:#dcdcdc;"></span>'
    + '</div>';
}

function hkChoiceButton(onclick, name, sub, startedNote) {
  return '<button class="hk-prog-choice" onclick="' + onclick + '" style="' + HK_CHOICE_STYLE + '"'
    + ' onmouseover="this.style.borderColor=\'#4e0000\';this.style.background=\'#faf5f5\'"'
    + ' onmouseout="this.style.borderColor=\'#c7c8ca\';this.style.background=\'#fff\'">'
    + '<span style="flex:1;min-width:0;">'
    + '<span style="display:block;font-size:18px;font-weight:500;color:#121212;line-height:1.3;">' + name + '</span>'
    + (sub ? '<span style="display:block;font-size:15px;font-weight:400;color:#3f3f3f;margin-top:4px;line-height:1.4;">' + sub + '</span>' : '')
    + (startedNote ? '<span style="display:block;font-size:15px;font-weight:400;color:#5c1a1a;margin-top:4px;line-height:1.4;">' + startedNote + '</span>' : '')
    + '</span>'
    + '</button>';
}

/* ─── Utvidbar infoboks i valgpanelet ─── */
function hkInfoAccordion(id, question, bodyHtml) {
  return '<div style="background:#fdf3f0;border:1px solid #f0dcd6;border-radius:10px;margin:0 0 20px;overflow:hidden;">'
    + '<button type="button" id="' + id + '-btn" aria-expanded="false" onclick="hkToggleInfo(\'' + id + '\')"'
    + ' style="display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:14px 16px;'
    + 'background:none;border:none;cursor:pointer;font-family:inherit;font-size:16px;font-weight:500;color:#121212;">'
    + '<span style="flex:1;min-width:0;line-height:1.35;">' + question + '</span>'
    + '<span id="' + id + '-chev" style="flex-shrink:0;display:flex;color:#4e0000;">' + CHEVRON_DOWN + '</span>'
    + '</button>'
    + '<div id="' + id + '-body" style="display:none;padding:0 16px 16px;font-size:15px;color:#3f3f3f;line-height:1.55;">'
    + bodyHtml + '</div></div>';
}

function hkToggleInfo(id) {
  var body = document.getElementById(id + '-body');
  var btn = document.getElementById(id + '-btn');
  var chev = document.getElementById(id + '-chev');
  if (!body) return;
  var open = body.style.display === 'none';
  body.style.display = open ? 'block' : 'none';
  if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (chev) chev.innerHTML = open ? CHEVRON_UP : CHEVRON_DOWN;
}

var INFO_ENDRE_PROGRAM = '<p style="margin:0 0 10px;">Ja. Emnet knyttes til studieprogrammet i s\u00f8knaden, '
  + 'men du kan endre det s\u00e5 lenge s\u00f8knaden ikke er sendt inn. Har du allerede begynt p\u00e5 et program, '
  + 'kan du ta kontakt med studieveileder for \u00e5 flytte emnet.</p>'
  + '<p style="margin:0;">Emnet du tar, blir uansett med deg \u2013 studiepoengene g\u00e5r ikke tapt om du bytter.</p>';

var INFO_GJENNOMFORING = '<p style="margin:0 0 10px;">Hvis du studerer p\u00e5 fulltid, tar du 30 studiepoeng '
  + 'eller mer i semesteret. Studerer du p\u00e5 deltid, tar du mindre, ofte halvparten.</p>'
  + '<p style="margin:0 0 12px;">Graden du ender opp med, vil v\u00e6re den samme \u2013 den tar bare lengre tid '
  + '\u00e5 fullf\u00f8re. Du f\u00e5r ogs\u00e5 st\u00f8tte fra L\u00e5nekassen som deltidsstudent, men ikke s\u00e5 mye som om '
  + 'du hadde studert p\u00e5 heltid.</p>'
  + '<a href="https://www.kristiania.no/nettstudier/" style="font-size:15px;font-weight:500;color:#4e0000;">'
  + 'Les mer om gjennomf\u00f8ring</a>';

/* ─── Niv\u00e5 2: gjennomf\u00f8ring, og niv\u00e5 3: kull ─── */
var _emneProgramView = null;

function openEmneProgramDetail(idx) {
  var st = _emneChoiceState;
  if (!st || !st.programs[idx]) return;
  var p = st.programs[idx];
  _emneProgramView = { idx: idx, program: p, details: getProgramDetails(p), studieform: null };
  renderGjennomforingStep();
}

/* Gjennomf\u00f8ring er et eget steg \u2013 heltid og deltid som likestilte valg,
   med forklaringen tilgjengelig uten \u00e5 forlate panelet. */
function renderGjennomforingStep() {
  var v = _emneProgramView;
  if (!v) return;
  var body = document.getElementById('hk-body');
  var title = document.getElementById('hk-title');
  if (!body) return;
  refreshSokPanelFooter(true);
  if (title) title.textContent = 'Velg gjennomf\u00f8ring';

  var html = '<div style="padding:8px 0;">'
    + hkInfoAccordion('hk-info-gjf', 'Hva er forskjellen p\u00e5 \u00e5 ta et emne p\u00e5 heltid/deltid?', INFO_GJENNOMFORING)
    + hkChoiceButton("hkPickStudieform('heltid')", STUDIEFORM.heltid.label, null, null)
    + hkChoiceButton("hkPickStudieform('deltid')", STUDIEFORM.deltid.label, null, null)
    + hkOrDivider()
    + hkChoiceButton('pickEmneAsLoose()', 'Som et frittst\u00e5ende enkeltemne',
                     'Ta faget uten \u00e5 starte p\u00e5 et helt studieprogram', null)
    + hkBackLink('backToEmneProgramList()', 'Tilbake til programmene')
    + '</div>';
  body.innerHTML = html;
}

function hkBackLink(onclick, text) {
  return '<button onclick="' + onclick + '" style="background:none;border:none;padding:0;margin:20px 0 0;'
    + 'cursor:pointer;font-family:inherit;font-size:15px;font-weight:500;color:#4e0000;">\u2190 ' + text + '</button>';
}

function hkPickStudieform(form) {
  if (!_emneProgramView) return;
  _emneProgramView.studieform = form;
  renderKullStep();
}

function renderKullStep() {
  var v = _emneProgramView;
  if (!v) return;
  var body = document.getElementById('hk-body');
  var title = document.getElementById('hk-title');
  if (!body) return;
  refreshSokPanelFooter(true, 'kull');
  if (title) title.textContent = 'Velg kull';

  var kull = v.details.kull.map(function(k) {
    return hkChoiceButton("hkPickKull('" + k.id + "')", k.label, k.note, null);
  }).join('');

  body.innerHTML = '<div style="padding:8px 0;">'
    + hkInfoAccordion('hk-info-kull', 'Hva betyr det hvilket kull jeg f\u00f8lger?',
        '<p style="margin:0;">Emneplanen kan endre seg fra kull til kull. Velger du kullet du '
        + 'faktisk f\u00f8lger, f\u00e5r du emnet slik det er satt opp for deg \u2013 med riktig pensum og '
        + 'riktig rekkef\u00f8lge i studiel\u00f8pet.</p>')
    + '<p style="font-size:18px;font-weight:500;margin:0 0 20px;color:#121212;line-height:1.4;">'
    + 'Velg kullet du f\u00f8lger.</p>'
    + kull
    + hkBackLink('renderGjennomforingStep()', 'Tilbake til gjennomf\u00f8ring')
    + '</div>';
}

function backToEmneProgramList() {
  var st = _emneChoiceState;
  _emneProgramView = null;
  if (st) showEmneProgramChoice(st.emne, st.programs, st.mode);
}

function hkPickKull(kullId) {
  var v = _emneProgramView, st = _emneChoiceState;
  if (!v || !st) return;
  var k = v.details.kull.filter(function(x) { return x.id === kullId; })[0];
  _emneProgramView = null;
  chooseEmneProgram(st.emne, v.program.name, v.program.id || null,
    { kull: k ? k.label : null, studieform: STUDIEFORM[v.studieform].label, code: v.details.code });
}

/* Emnet er allerede bestått – vis beskjed i sidepanelet i stedet for å legge
   det til. Samme ordlyd som konflikt-varselet i søknadsskjemaet. */
function showEmneAlreadyCompleted(emne, program) {
  injectSidebarPanel();
  openSoknaderPanel();
  var body = document.getElementById('hk-body');
  var title = document.getElementById('hk-title');
  if (!body) return;
  refreshSokPanelFooter();
  if (title) title.textContent = 'Allerede bestått';

  var iProgram = program
    ? ' i <strong>' + program.name + '</strong>'
    : '';

  body.innerHTML = '<div style="padding:8px 0;">'
    + '<div style="background:#f6ece3;border-radius:12px;padding:18px 20px;">'
    + '<div style="display:flex;align-items:flex-start;gap:10px;">'
    + '<span style="color:#5c1a1a;font-size:15px;font-weight:700;flex-shrink:0;margin-top:2px;">&#10003;</span>'
    + '<p style="font-size:15px;font-weight:700;color:#5c1a1a;margin:0;">Du har allerede bestått ' + emne.name + '</p>'
    + '</div>'
    + '<p style="font-size:13.5px;color:#555;margin:10px 0 0;line-height:1.55;padding-left:25px;">'
    + 'Emnet ble tatt' + iProgram + ' og kan ikke tas om igjen, så vi har ikke lagt det til. '
    + 'Stemmer ikke dette, ta kontakt på <a href="mailto:opptaknettstudier@kristiania.no" style="color:#06f;">opptaknettstudier@kristiania.no</a> eller 21 09 30 00.'
    + '</p>'
    + '</div></div>';
}


/* Logg inn uten å forlate valget, og kjør vurderingen på nytt: har studenten
   påbegynt et program emnet inngår i, legges det rett dit – ellers kommer samme
   panel tilbake, nå med de påbegynte programmene. */
function hkLoginAndRetryChoice() {
  setAuthState('feide', 'Lars Juster Eilefsen');
  if (typeof handleKjopEmnet === 'function' && extractEmneSubject()) {
    handleKjopEmnet();
  }
}

/* Legg emnet i søknaden uten tilknytning til et studieprogram. Havner under
   «Emner uten tilknytning til studieprogram» i søknadspanelet. */
function pickEmneAsLoose() {
  var st = _emneChoiceState;
  if (!st || !st.emne) return;
  addLooseEmne(st.emne);
  openSoknaderPanel();
  renderBasketPanel();
}

function handleKjopEmnet() {
  var subject = extractEmneSubject();
  if (!subject) return;
  var emne = buildEmneObj(subject);
  var included = getEmneIncludedPrograms();
  var includedNames = included.map(function(p) { return normalizeProgName(p.name); });

  /* Innlogget og emnet er allerede bestått → det kan ikke tas om igjen. */
  if (getAuthState() && isCompletedCourse(emne.code)) {
    var owner = COMPLETED_BY_PROGRAM.filter(function(p) {
      return p.codes.indexOf(String(emne.code)) > -1;
    })[0];
    showEmneAlreadyCompleted(emne, owner);
    return;
  }

  /* Innlogget og emnet inngår i et studieprogram studenten allerede har
     bestått emner i → vi antar at de vil fortsette på det programmet, og
     legger emnet rett dit uten å spørre. Treffer flere påbegynte program,
     må studenten velge. */
  var startedMatches = getStartedProgramsForEmne(included);
  if (startedMatches.length === 1) {
    /* Studenten er allerede i et kull p\u00e5 dette programmet \u2013 da skal vi ikke
       spørre om det, vi vet det. */
    var sp = startedMatches[0];
    chooseEmneProgram(emne, sp.name, sp.id,
      { kull: sp.kull, studieform: sp.studieform,
        code: (PROGRAM_DETAILS[programKeyFromHref(sp.href)] || {}).code });
    return;
  }
  if (startedMatches.length > 1) {
    showEmneProgramChoice(emne, startedMatches.map(function(p) {
      return { name: p.name, id: p.id, href: p.href };
    }), 'started');
    return;
  }

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
    showEmneProgramChoice(emne, matches.map(function(p) { return { name: p.name, id: p.id }; }), 'cart');
  } else {
    /* Emnet inngår ikke i noen bachelorgrad i søknaden – spør hvilken grad det
       skal inn i. Er det ikke del av noen nett-bachelor i det hele tatt, står
       bare frittstående igjen, og showEmneProgramChoice sier det rett ut. */
    showEmneProgramChoice(emne, included, 'all');
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
  normalizeTopbarOrder();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBasket);
} else {
  initBasket();
}
