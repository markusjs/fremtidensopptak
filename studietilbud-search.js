/**
 * studietilbud-search.js
 * Vanilla JS søk og filtre for studietilbudsiden.
 * Leser data fra React-props og rendrer fungerende kort med søk/filtre.
 */
(function() {
  'use strict';

  /* ── Data ── */
  var props = (window.__reactProps || {})['8a1a76fd-json'];
  if (!props || !props.initialResult || !props.initialResult.items) return;

  var allItems = props.initialResult.items;
  var totalCount = allItems.length;

  /* ── Mapping: linkUrl → lokale studiesider ── */
  var localPages = {
    '/studier/bachelor/cybersikkerhet/': '/studier/Cybersikkerhet - Bachelor _ Kristiania',
    '/studier/bachelor/hr-organisasjonspsykologi-ledelse/': '/studier/HR organisasjonspsykologi og ledelse - Bachelor _ Kristiania',
    '/studier/bachelor/psykologi-og-psykisk-helse/': '/studier/Psykologi og psykisk helse - Bachelor _ Kristiania',
    '/studier/bachelor/rettsvitenskap/': '/studier/Rettsvitenskap - Bachelor _ Kristiania',
    '/studier/bachelor/digital-markedsforing-og-salgsledelse/': '/studier/Digital markedsføring og salgsledelse - Bachelor _ Kristiania',
    '/studier/bachelor/okonomi-og-administrasjon/': '/studier/Økonomi og administrasjon - Bachelor _ Kristiania',
    '/studier/bachelor/design/': '/studier/Design - Bachelor _ Kristiania',
    '/studier/bachelor/informasjonsteknologi-fullstack/': '/studier/Informasjonsteknologi Fullstack - Bachelor _ Kristiania',
    '/studier/bachelor/medier-og-kommunikasjon/': '/studier/Medier og kommunikasjon - Bachelor _ Kristiania',
    '/studier/bachelor/film-tv-og-medier/': '/studier/Film TV og medier - Bachelor _ Kristiania',
    '/studier/bachelor/musikk/': '/studier/Musikk - Bachelor _ Kristiania',
    '/studier/bachelor/hr-personalledelse/': '/studier/HR og personalledelse - Bachelor _ Kristiania',
    '/studier/bachelor/computer-arts/': '/studier/Computer Arts - Bachelor _ Kristiania',
    '/studier/master/cyber-security/': '/studier/Cyber Security - Master _ Kristiania',
    '/studier/master/organisasjonspsykologi-ledelse/': '/studier/Organisasjonspsykologi og ledelse - Master _ Kristiania',
    '/studier/master/okonomi-og-ledelse/': '/studier/Økonomi og ledelse - Master _ Kristiania',
    '/studier/master/design/': '/studier/Design - Master _ Kristiania',
    '/studier/fagskole/grafisk-design/': '/studier/Grafisk design - Fagskole _ Kristiania',
    '/studier/fagskole/film/': '/studier/Film - Fagskole _ Kristiania',
    '/studier/fagskole/interiordesign/': '/studier/Interiørdesign - Fagskole _ Kristiania',
    '/studier/nettstudier/bachelor/administrasjon-og-ledelse/': '/studier/Administrasjon og ledelse - Bachelor (nettstudie)',
    '/studier/nettstudier/bachelor/bachelor-anvendt-psykologi/': '/studier/Anvendt psykologi - Bachelor (nettstudie) _ Kristiania',
    '/studier/arsstudium/frontend-utvikling/': '/studier/Frontend-utvikling - Bli frontend-utvikler på 1 år'
  };

  function getLocalUrl(item) {
    var key = item.linkUrl;
    if (localPages[key]) return localPages[key];
    // Fallback: return original kristiania.no URL
    return 'https://www.kristiania.no' + key;
  }

  /* ── CSS ── */
  var css = document.createElement('style');
  css.textContent = '\
.Page__body{background:#fff !important}\
#8a1a76fd{background:#fff;padding:40px 0;min-height:80vh}\
.sl-container{max-width:1200px;margin:0 auto;padding:0 24px}\
.sl-layout{display:flex;gap:40px;align-items:flex-start}\
.sl-main{flex:1;min-width:0}\
.sl-sidebar{width:280px;flex-shrink:0;position:sticky;top:100px}\
.sl-search{width:100%;padding:14px 18px;font-size:16px;border:1.5px solid #ddd;border-radius:8px;outline:none;font-family:inherit;margin-bottom:8px;transition:border-color .15s}\
.sl-search:focus{border-color:#888}\
.sl-count{font-size:14px;color:#666;margin:12px 0 20px}\
.sl-grid{display:flex;flex-direction:column;gap:0}\
.sl-card{display:block;padding:20px 0;border-bottom:1px solid #eee;text-decoration:none;color:inherit;transition:background .1s}\
.sl-card:hover{background:#f8f8f8;margin:0 -12px;padding:20px 12px;border-radius:8px}\
.sl-card:first-child{border-top:1px solid #eee}\
.sl-card-name{font-size:18px;font-weight:600;color:#1a1a1a;margin:0 0 8px;text-decoration:underline;text-underline-offset:3px}\
.sl-card:hover .sl-card-name{color:#b71c2f}\
.sl-card-meta{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:13px;color:#666}\
.sl-card-meta span{display:flex;align-items:center;gap:4px}\
.sl-card-meta span svg{flex-shrink:0}\
.sl-hidden{display:none}\
.sl-filter-group{margin-bottom:24px}\
.sl-filter-title{font-size:16px;font-weight:700;color:#1a1a1a;margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid #eee}\
.sl-filter-option{display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer;font-size:14px;color:#333}\
.sl-filter-option input{width:16px;height:16px;accent-color:#b71c2f;cursor:pointer}\
.sl-filter-option label{cursor:pointer}\
.sl-no-results{padding:40px 0;text-align:center;color:#888;font-size:15px}\
@media(max-width:768px){\
  .sl-layout{flex-direction:column-reverse;gap:20px}\
  .sl-sidebar{width:100%;position:static}\
}\
';
  document.head.appendChild(css);

  /* ── Build UI ── */
  var root = document.getElementById('8a1a76fd');
  if (!root) return;

  /* ── SVG Icons (matching kristiania.no) ── */
  var svgMapPin = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
  var svgGlobe = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>';
  var svgBook = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>';
  var svgActivity = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>';

  function locationIcon(item) {
    var locs = item.locations || [];
    var isOnline = item.type === 'onlineStudy' || locs.indexOf('Nettstudium') > -1;
    return isOnline ? svgGlobe : svgMapPin;
  }

  // Build filter HTML
  var filterGroups = [
    { id: 'sted', title: 'Sted', options: ['Bergen', 'Oslo', 'Nettstudium'] },
    { id: 'niva', title: 'Nivå', options: ['Bachelor', 'Master', 'Fagskole'] },
    { id: 'form', title: 'Gjennomføring', options: ['Heltid', 'Deltid'] }
  ];

  var filtersHTML = filterGroups.map(function(group) {
    var opts = group.options.map(function(opt) {
      return '<div class="sl-filter-option">'
        + '<input type="checkbox" id="sl-' + group.id + '-' + opt + '" value="' + opt + '" data-group="' + group.id + '">'
        + '<label for="sl-' + group.id + '-' + opt + '">' + opt + '</label>'
        + '</div>';
    }).join('');
    return '<div class="sl-filter-group"><div class="sl-filter-title">' + group.title + '</div>' + opts + '</div>';
  }).join('');

  root.innerHTML = '<div class="sl-container">'
    + '<div class="sl-layout">'
    + '<div class="sl-main">'
    + '<input type="text" class="sl-search" placeholder="S\u00F8k etter studie eller kurs">'
    + '<div class="sl-count">Viser <strong>' + totalCount + '</strong> av ' + totalCount + '</div>'
    + '<div class="sl-grid" id="sl-results"></div>'
    + '</div>'
    + '<div class="sl-sidebar">' + filtersHTML + '</div>'
    + '</div></div>';

  /* ── Render cards ── */
  var resultsEl = document.getElementById('sl-results');
  var searchInput = root.querySelector('.sl-search');
  var countEl = root.querySelector('.sl-count strong');

  function renderCards(items) {
    if (items.length === 0) {
      resultsEl.innerHTML = '<div class="sl-no-results">Ingen studier matcher s\u00F8ket ditt</div>';
      countEl.textContent = '0';
      return;
    }
    var html = items.map(function(item) {
      var url = getLocalUrl(item);
      var locs = (item.locations || []).join(' \\ ');
      var forms = (item.studyFormTypes || []).join(', ');
      return '<a href="' + url + '" class="sl-card">'
        + '<div class="sl-card-name">' + item.name + '</div>'
        + '<div class="sl-card-meta">'
        + (locs ? '<span>' + locationIcon(item) + ' ' + locs + '</span>' : '')
        + '<span>' + svgBook + ' ' + item.levelLabel + '</span>'
        + (forms ? '<span>' + svgActivity + ' ' + forms + '</span>' : '')
        + (item.points ? '<span>' + item.points + '</span>' : '')
        + '</div></a>';
    }).join('');
    resultsEl.innerHTML = html;
    countEl.textContent = items.length;
  }

  /* ── Filter logic ── */
  function getCheckedValues(groupId) {
    var checks = root.querySelectorAll('input[data-group="' + groupId + '"]:checked');
    var vals = [];
    checks.forEach(function(c) { vals.push(c.value); });
    return vals;
  }

  function applyFilters() {
    var query = (searchInput.value || '').toLowerCase().trim();
    var stedFilter = getCheckedValues('sted');
    var nivaFilter = getCheckedValues('niva');
    var formFilter = getCheckedValues('form');

    var filtered = allItems.filter(function(item) {
      // Text search
      if (query) {
        var searchable = (item.name + ' ' + (item.keywords || '')).toLowerCase();
        if (searchable.indexOf(query) === -1) return false;
      }
      // Sted filter (OR within group)
      if (stedFilter.length > 0) {
        var locs = item.locations || [];
        // Check if item matches any of the selected locations
        // For "Nettstudium", also match item.type === 'onlineStudy'
        var match = stedFilter.some(function(f) {
          if (f === 'Nettstudium') return locs.indexOf('Nettstudium') > -1 || item.type === 'onlineStudy';
          return locs.indexOf(f) > -1;
        });
        if (!match) return false;
      }
      // Nivå filter (OR within group)
      if (nivaFilter.length > 0) {
        if (nivaFilter.indexOf(item.levelLabel) === -1) return false;
      }
      // Gjennomføring filter (OR within group)
      if (formFilter.length > 0) {
        var forms = item.studyFormTypes || [];
        var match = formFilter.some(function(f) { return forms.indexOf(f) > -1; });
        if (!match) return false;
      }
      return true;
    });

    renderCards(filtered);
  }

  /* ── URL state ── */
  function writeStateToURL() {
    var params = new URLSearchParams();
    var q = (searchInput.value || '').trim();
    if (q) params.set('q', q);
    ['sted', 'niva', 'form'].forEach(function(g) {
      var vals = getCheckedValues(g);
      if (vals.length) params.set(g, vals.join(','));
    });
    var qs = params.toString();
    var newUrl = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
    history.replaceState(null, '', newUrl);
  }

  function restoreStateFromURL() {
    var params = new URLSearchParams(window.location.search);
    var q = params.get('q');
    if (q) searchInput.value = q;
    ['sted', 'niva', 'form'].forEach(function(g) {
      var raw = params.get(g);
      if (!raw) return;
      raw.split(',').forEach(function(v) {
        if (!v) return;
        var cb = root.querySelector('input[data-group="' + g + '"][value="' + v + '"]');
        if (cb) cb.checked = true;
      });
    });
  }

  function onFilterChange() {
    writeStateToURL();
    applyFilters();
  }

  /* ── Event listeners ── */
  searchInput.addEventListener('input', onFilterChange);
  root.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
    cb.addEventListener('change', onFilterChange);
  });
  window.addEventListener('popstate', function() {
    root.querySelectorAll('input[type="checkbox"]').forEach(function(cb) { cb.checked = false; });
    searchInput.value = '';
    restoreStateFromURL();
    applyFilters();
  });

  // Restore state from URL, then render
  restoreStateFromURL();
  applyFilters();

})();
