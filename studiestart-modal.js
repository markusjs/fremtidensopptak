/* ═══════════════════════════════════════════
   studiestart-modal.js
   "Velg studiestart" modal for emnebestilling
   ═══════════════════════════════════════════ */

(function() {

/* ── State ── */
var _ssPending = [];   // [{btn, code, name, pts, price}, …]
var _ssStyleInjected = false;
var _ssCalYear, _ssCalMonth, _ssCalSelected = null;
var _ssCalMin, _ssCalMax;

/* ── CSS injection ── */
function injectStyles() {
  if (_ssStyleInjected) return;
  _ssStyleInjected = true;
  var css = document.createElement('style');
  css.textContent = '\
.ss-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1400;opacity:0;transition:opacity .2s}\
.ss-backdrop.open{display:block;opacity:1}\
.ss-modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) scale(.96);background:#fff;border-radius:16px;width:90%;max-width:460px;max-height:90vh;overflow-y:auto;z-index:1401;opacity:0;transition:transform .25s,opacity .2s;box-shadow:0 8px 40px rgba(0,0,0,.18)}\
.ss-backdrop.open .ss-modal{transform:translate(-50%,-50%) scale(1);opacity:1}\
.ss-header{padding:20px 24px 0;display:flex;align-items:center;gap:12px}\
.ss-close{width:32px;height:32px;border-radius:50%;border:1.5px solid #c7c8ca;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#555;flex-shrink:0;transition:background .15s}\
.ss-close:hover{background:#f0f0f0}\
.ss-title{font-size:24px;font-weight:700;color:#121212;padding:16px 24px 0}\
.ss-body{padding:16px 24px 24px;display:flex;flex-direction:column;gap:16px}\
.ss-radio-group{display:flex;flex-direction:column;gap:12px}\
.ss-radio-card{border:1.5px solid #e0e0e0;border-radius:12px;padding:20px;cursor:pointer;display:flex;align-items:flex-start;gap:14px;transition:border-color .15s,background .15s}\
.ss-radio-card:hover{background:#fafafa}\
.ss-radio-card.selected{border-color:#06f;background:#f0f7ff}\
.ss-radio-dot{width:22px;height:22px;border:2px solid #c7c8ca;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:2px;transition:border-color .15s}\
.ss-radio-card.selected .ss-radio-dot{border-color:#06f}\
.ss-radio-card.selected .ss-radio-dot::after{content:"";width:12px;height:12px;background:#06f;border-radius:50%}\
.ss-radio-main{font-size:18px;font-weight:700;color:#121212}\
.ss-radio-sub{font-size:13px;color:#666;margin-top:4px;display:flex;align-items:center;gap:6px}\
.ss-radio-sub svg{flex-shrink:0}\
.ss-radio-desc{font-size:13px;color:#555;margin-top:8px;line-height:1.5}\
.ss-radio-link{color:#06f;text-decoration:underline;font-size:13px}\
.ss-calendar-wrap{display:none;padding:4px 0 0}\
.ss-calendar-wrap.open{display:block}\
.ss-date-input{width:100%;border:1.5px solid #c7c8ca;border-radius:8px;padding:14px 16px;font-size:15px;font-family:inherit;outline:none;transition:border-color .15s;cursor:pointer;box-sizing:border-box}\
.ss-date-input:focus{border-color:#06f}\
.ss-hint{font-size:13px;color:#888;margin-top:6px}\
.ss-checkbox-row{display:flex;align-items:flex-start;gap:10px;cursor:pointer}\
.ss-checkbox-box{width:22px;height:22px;border:1.5px solid #c7c8ca;border-radius:4px;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s}\
.ss-checkbox-box.checked{background:#06f;border-color:#06f}\
.ss-checkbox-label{font-size:14px;color:#121212;line-height:22px}\
.ss-warning{background:#fdf6ec;border:1px solid #f0d8a8;border-radius:10px;padding:16px;margin-top:4px}\
.ss-warning-title{font-size:12px;font-weight:700;color:#b45309;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}\
.ss-warning p{font-size:13px;color:#555;line-height:1.5;margin:0 0 8px}\
.ss-warning p:last-child{margin-bottom:0}\
.ss-warning strong{color:#121212}\
.ss-warning-email-label{font-size:13px;color:#888;margin-bottom:6px}\
.ss-warning-email{width:100%;border:1.5px solid #c7c8ca;border-radius:8px;padding:12px 14px;font-size:14px;font-family:inherit;outline:none;background:#fff;box-sizing:border-box}\
.ss-warning-email:focus{border-color:#06f}\
.ss-or-text{font-size:13px;color:#888}\
.ss-btn{display:flex;align-items:center;justify-content:center;gap:8px;height:52px;background:#111;color:#fff;font-family:inherit;font-size:16px;font-weight:600;border:none;border-radius:40px;cursor:pointer;width:100%;transition:background .15s}\
.ss-btn:hover{background:#333}\
.ss-btn:disabled{background:#ccc;cursor:not-allowed}\
.ss-btn svg{flex-shrink:0}\
.ss-cal{background:#fff;border-radius:12px;padding:16px;border:1px solid #e8e8e8}\
.ss-cal-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}\
.ss-cal-month{font-size:16px;font-weight:600;color:#121212}\
.ss-cal-arrows{display:flex;gap:4px}\
.ss-cal-arrow{width:32px;height:32px;border:none;background:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#555;font-size:18px;transition:background .15s}\
.ss-cal-arrow:hover{background:#f0f0f0}\
.ss-cal-arrow:disabled{opacity:.3;cursor:not-allowed}\
.ss-cal-arrow:disabled:hover{background:none}\
.ss-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center}\
.ss-cal-dow{font-size:12px;font-weight:600;color:#888;padding:4px 0 8px;text-transform:capitalize}\
.ss-cal-dow.ss-weekend{color:#d94040}\
.ss-cal-day{width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:50%;border:none;background:none;font-size:14px;color:#121212;cursor:pointer;margin:0 auto;transition:background .12s,color .12s;font-family:inherit}\
.ss-cal-day:hover:not(:disabled):not(.ss-cal-today){background:#f0f0f0}\
.ss-cal-day:disabled{color:#ccc;cursor:not-allowed}\
.ss-cal-day.ss-weekend{color:#d94040}\
.ss-cal-day:disabled.ss-weekend{color:#e8c0c0}\
.ss-cal-day.ss-cal-today{background:#e0edff;color:#06f;font-weight:600}\
.ss-cal-day.ss-cal-selected{background:#121212;color:#fff!important;font-weight:600}\
.ss-cal-day.ss-cal-empty{cursor:default}\
.ss-between-calendar{transition:max-height .3s ease,opacity .3s ease;overflow:hidden}\
.ss-between-warning{transition:max-height .3s ease,opacity .3s ease;overflow:hidden}\
.ss-date-row{position:relative}\
.ss-date-row .ss-date-icon{position:absolute;right:14px;top:50%;transform:translateY(-50%);color:#888;pointer-events:none}\
@media(max-width:640px){\
.ss-modal{top:auto;bottom:0;left:0;right:0;transform:translateY(20px);width:100%;max-width:100%;border-radius:16px 16px 0 0;max-height:85vh}\
.ss-backdrop.open .ss-modal{transform:translateY(0)}\
}';
  document.head.appendChild(css);
}

/* ── Date scenario logic ── */
function getStudiestartScenario() {
  var now = new Date();
  var m = now.getMonth(); // 0-based
  var d = now.getDate();
  var y = now.getFullYear();

  // Oct 16 – Jan 15: vår nærmer seg
  if ((m === 9 && d >= 16) || m === 10 || m === 11 || (m === 0 && d <= 15)) {
    var semYear = (m >= 9) ? y + 1 : y;
    var semDate = new Date(semYear, 0, 16); // Jan 16
    var endDate = new Date(semYear + 1, 0, 15); // Jan 15 next year
    return {
      id: 'approaching',
      semesterLabel: '16. januar ' + semYear,
      studierettLabel: 'Studierett til 15. januar ' + (semYear + 1),
      semesterDateStr: formatDateShort(semDate),
      loanInfo: 'Anbefalt hvis du ønsker å søke lån/stipend hos Lånekassen.',
      loanLink: 'Les mer: Lånekassen: Nettstudier og samlingsbasert'
    };
  }
  // May 16 – Aug 15: høst nærmer seg
  if ((m === 4 && d >= 16) || m === 5 || m === 6 || (m === 7 && d <= 15)) {
    var semDate2 = new Date(y, 7, 16); // Aug 16
    var endDate2 = new Date(y + 1, 7, 15); // Aug 15 next year
    return {
      id: 'approaching',
      semesterLabel: '16. august ' + y,
      studierettLabel: 'Studierett til 15. august ' + (y + 1),
      semesterDateStr: formatDateShort(semDate2),
      loanInfo: 'Anbefalt hvis du ønsker å søke lån/stipend hos Lånekassen.',
      loanLink: 'Les mer: Lånekassen: Nettstudier og samlingsbasert'
    };
  }
  // Jan 16 – May 15: mellom semestre (vår pågår)
  if ((m === 0 && d >= 16) || (m >= 1 && m <= 3) || (m === 4 && d <= 15)) {
    return {
      id: 'between',
      nextSemester: 'høstsemesteret',
      nextDate: '16. august',
      nextDateBold: '16. august',
      orderOpens: '16. mai',
      orderOpensBold: '16. mai'
    };
  }
  // Aug 16 – Oct 15: mellom semestre (høst pågår)
  return {
    id: 'between',
    nextSemester: 'vårsemesteret',
    nextDate: '16. januar',
    nextDateBold: '16. januar',
    orderOpens: '16. oktober',
    orderOpensBold: '16. oktober'
  };
}

function formatDateShort(d) {
  var dd = String(d.getDate()).padStart(2, '0');
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var yy = String(d.getFullYear()).slice(-2);
  return dd + '.' + mm + '.' + yy;
}

function getCalendarMinMax() {
  var now = new Date();
  var min = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  var max = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
  return {
    min: min.toISOString().split('T')[0],
    max: max.toISOString().split('T')[0]
  };
}

/* ── Custom calendar widget ── */
var _ssMonthNames = ['Januar','Februar','Mars','April','Mai','Juni','Juli','August','September','Oktober','November','Desember'];
var _ssDowLabels = ['Man','Tir','Ons','Tor','Fre','Lør','Søn'];

function ssRenderCalendar() {
  var container = document.getElementById('ss-cal-widget');
  if (!container) return;

  var y = _ssCalYear, m = _ssCalMonth;
  var firstDay = new Date(y, m, 1).getDay(); // 0=Sun
  // Convert to Mon-based: Mon=0 … Sun=6
  var startOffset = (firstDay === 0) ? 6 : firstDay - 1;
  var daysInMonth = new Date(y, m + 1, 0).getDate();
  var today = new Date(); today.setHours(0,0,0,0);

  var minD = new Date(_ssCalMin + 'T00:00:00');
  var maxD = new Date(_ssCalMax + 'T00:00:00');

  // Month nav
  var prevDisabled = (new Date(y, m, 0) < minD) ? ' disabled' : '';
  var nextDisabled = (new Date(y, m + 1, 1) > maxD) ? ' disabled' : '';

  var html = '<div class="ss-cal-nav">'
    + '<span class="ss-cal-month">' + _ssMonthNames[m] + ' ' + y + '</span>'
    + '<div class="ss-cal-arrows">'
    + '<button class="ss-cal-arrow" onclick="ssCalPrev()"' + prevDisabled + '>&lsaquo;</button>'
    + '<button class="ss-cal-arrow" onclick="ssCalNext()"' + nextDisabled + '>&rsaquo;</button>'
    + '</div></div>';

  html += '<div class="ss-cal-grid">';
  // Day-of-week headers
  for (var i = 0; i < 7; i++) {
    var wkend = (i >= 5) ? ' ss-weekend' : '';
    html += '<div class="ss-cal-dow' + wkend + '">' + _ssDowLabels[i] + '</div>';
  }
  // Empty cells before 1st
  for (var e = 0; e < startOffset; e++) {
    html += '<button class="ss-cal-day ss-cal-empty" disabled></button>';
  }
  // Day cells
  for (var d = 1; d <= daysInMonth; d++) {
    var dt = new Date(y, m, d);
    var dow = (startOffset + d - 1) % 7; // 0=Mon..6=Sun
    var isWeekend = dow >= 5;
    var isToday = dt.getTime() === today.getTime();
    var isSelected = _ssCalSelected && dt.getTime() === _ssCalSelected.getTime();
    var isDisabled = dt < minD || dt > maxD;

    var cls = 'ss-cal-day';
    if (isWeekend) cls += ' ss-weekend';
    if (isToday && !isSelected) cls += ' ss-cal-today';
    if (isSelected) cls += ' ss-cal-selected';

    if (isDisabled) {
      html += '<button class="' + cls + '" disabled>' + d + '</button>';
    } else {
      html += '<button class="' + cls + '" onclick="ssCalSelect(' + y + ',' + m + ',' + d + ')">' + d + '</button>';
    }
  }
  html += '</div>';
  container.innerHTML = html;
}

window.ssCalPrev = function() {
  _ssCalMonth--;
  if (_ssCalMonth < 0) { _ssCalMonth = 11; _ssCalYear--; }
  ssRenderCalendar();
};

window.ssCalNext = function() {
  _ssCalMonth++;
  if (_ssCalMonth > 11) { _ssCalMonth = 0; _ssCalYear++; }
  ssRenderCalendar();
};

window.ssCalSelect = function(y, m, d) {
  _ssCalSelected = new Date(y, m, d);
  ssRenderCalendar();
  // Enable confirm button
  var btn = document.getElementById('ss-confirm-btn');
  if (btn) btn.disabled = false;
};

function ssInitCalendarState() {
  var mm = getCalendarMinMax();
  _ssCalMin = mm.min;
  _ssCalMax = mm.max;
  var now = new Date();
  _ssCalYear = now.getFullYear();
  _ssCalMonth = now.getMonth();
  _ssCalSelected = null;
}

/* ── Build modal HTML ── */
function buildApproachingHTML(sc) {
  var mm = getCalendarMinMax();
  return '<div class="ss-header"><button class="ss-close" onclick="closeStudiestartModal()">&times;</button></div>'
    + '<h2 class="ss-title">Velg studiestart</h2>'
    + '<div class="ss-body">'
    + '<div class="ss-radio-group">'
    // Option 1: Semester date
    + '<div class="ss-radio-card selected" onclick="ssSelectRadio(this,\'semester\')">'
    + '<div class="ss-radio-dot"></div>'
    + '<div style="flex:1">'
    + '<div class="ss-radio-main">' + sc.semesterLabel + '</div>'
    + '<div class="ss-radio-sub"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#888" stroke-width="1.5"/><path d="M12 6v6l4 2" stroke="#888" stroke-width="1.5" stroke-linecap="round"/></svg> ' + sc.studierettLabel + '</div>'
    + '<p class="ss-radio-desc">' + sc.loanInfo + '</p>'
    + '<a href="https://www.lanekassen.no/nb-NO/Stipend-og-lan/Utdanning-i-Norge/nettstudier-og-samlingsbasert/" class="ss-radio-link" target="_blank" onclick="event.stopPropagation()">' + sc.loanLink + '</a>'
    + '</div></div>'
    // Option 2: Custom date
    + '<div class="ss-radio-card" onclick="ssSelectRadio(this,\'custom\')">'
    + '<div class="ss-radio-dot"></div>'
    + '<div style="flex:1">'
    + '<div class="ss-radio-main">Valgfri oppstartsdato</div>'
    + '<div class="ss-radio-sub"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#888" stroke-width="1.5"/><path d="M12 6v6l4 2" stroke="#888" stroke-width="1.5" stroke-linecap="round"/></svg> 12 måneder studierett</div>'
    + '<p class="ss-radio-desc">Du kan starte når som helst innen 3 måneder fra dagens dato.</p>'
    + '<div class="ss-calendar-wrap" id="ss-cal-wrap">'
    + '<input type="date" class="ss-date-input" id="ss-custom-date" min="' + mm.min + '" max="' + mm.max + '">'
    + '<p class="ss-hint">Du kan kun velge oppstart tre måneder frem i tid.</p>'
    + '</div>'
    + '</div></div>'
    + '</div>'
    + '<button class="ss-btn" id="ss-confirm-btn" onclick="confirmStudiestart()">'
    + 'Gå videre <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    + '</button>'
    + '</div>';
}

function buildBetweenHTML(sc) {
  var mm = getCalendarMinMax();
  return '<div class="ss-header"><button class="ss-close" onclick="closeStudiestartModal()">&times;</button></div>'
    + '<h2 class="ss-title">Velg studiestart</h2>'
    + '<div class="ss-body">'
    // Checkbox
    + '<div class="ss-checkbox-row" onclick="ssBetweenToggle()">'
    + '<div class="ss-checkbox-box" id="ss-lk-check"><svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
    + '<span class="ss-checkbox-label">Jeg planlegger å søke støtte hos Lånekassen</span>'
    + '</div>'
    // Warning banner (hidden by default)
    + '<div class="ss-between-warning" id="ss-between-warning" style="max-height:0;opacity:0">'
    + '<div class="ss-warning">'
    + '<div class="ss-warning-title">Utenfor Lånekassens semester</div>'
    + '<p>Semesteret er i gang, og oppstart nå vil muligens ikke gi støtte fra Lånekassen.</p>'
    + '<p>Neste semester (' + sc.nextSemester + ') har oppstart <strong>' + sc.nextDateBold + '</strong> og kan bestilles fra <strong>' + sc.orderOpensBold + '</strong>.</p>'
    + '<div class="ss-warning-email-label">Bli varslet når du kan bestille for ' + sc.nextSemester + '</div>'
    + '<input type="email" class="ss-warning-email" id="ss-notify-email" placeholder="mail@epost.com" onclick="event.stopPropagation()">'
    + '</div>'
    + '<p class="ss-or-text" style="margin-top:16px">Du kan likevel velge en startdato og studere uten støtte:</p>'
    + '<div class="ss-date-row">'
    + '<input type="date" class="ss-date-input" id="ss-custom-date" min="' + mm.min + '" max="' + mm.max + '" onchange="ssDateChanged()">'
    + '</div>'
    + '</div>'
    // Calendar (visible by default)
    + '<div class="ss-between-calendar" id="ss-between-calendar" style="max-height:800px;opacity:1">'
    + '<div id="ss-cal-widget" class="ss-cal"></div>'
    + '</div>'
    + '<p class="ss-hint">Du kan kun velge oppstart tre måneder frem i tid.</p>'
    + '<button class="ss-btn" id="ss-confirm-btn" onclick="confirmStudiestart()" disabled>'
    + 'Gå videre <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    + '</button>'
    + '</div>';
}

/* ── Public API ── */

window.openStudiestartModal = function(pendingCourses, scenarioOverride) {
  injectStyles();
  _ssPending = pendingCourses || [];

  // Remove existing modal if any
  var old = document.getElementById('ss-backdrop');
  if (old) old.remove();

  var sc = scenarioOverride || getStudiestartScenario();
  var html = (sc.id === 'approaching') ? buildApproachingHTML(sc) : buildBetweenHTML(sc);

  var backdrop = document.createElement('div');
  backdrop.className = 'ss-backdrop';
  backdrop.id = 'ss-backdrop';
  backdrop.innerHTML = '<div class="ss-modal" id="ss-modal">' + html + '</div>';

  // Close on backdrop click
  backdrop.addEventListener('click', function(e) {
    if (e.target === backdrop) closeStudiestartModal();
  });

  document.body.appendChild(backdrop);

  // Store scenario for later
  backdrop._ssScenario = sc;

  // Trigger open animation
  requestAnimationFrame(function() {
    backdrop.classList.add('open');
    // Init custom calendar for between scenario
    if (sc.id === 'between') {
      ssInitCalendarState();
      ssRenderCalendar();
    }
  });
};

window.closeStudiestartModal = function() {
  var backdrop = document.getElementById('ss-backdrop');
  if (!backdrop) return;
  backdrop.classList.remove('open');
  setTimeout(function() { backdrop.remove(); }, 250);
  _ssPending = [];
};

window.ssSelectRadio = function(card, value) {
  var group = card.closest('.ss-radio-group');
  group.querySelectorAll('.ss-radio-card').forEach(function(c) { c.classList.remove('selected'); });
  card.classList.add('selected');

  var calWrap = document.getElementById('ss-cal-wrap');
  var btn = document.getElementById('ss-confirm-btn');
  if (value === 'custom') {
    if (calWrap) calWrap.classList.add('open');
    // Disable confirm until date picked
    var dateInput = document.getElementById('ss-custom-date');
    if (btn) btn.disabled = !dateInput.value;
    if (dateInput) {
      dateInput.onchange = function() { if (btn) btn.disabled = !this.value; };
    }
  } else {
    if (calWrap) calWrap.classList.remove('open');
    if (btn) btn.disabled = false;
  }
};

window.ssToggleCheckbox = function(row) {
  var box = row.querySelector('.ss-checkbox-box');
  if (box) box.classList.toggle('checked');
};

window.ssBetweenToggle = function() {
  var box = document.getElementById('ss-lk-check');
  if (!box) return;
  var isChecked = box.classList.toggle('checked');

  var warning = document.getElementById('ss-between-warning');
  var calendar = document.getElementById('ss-between-calendar');
  var btn = document.getElementById('ss-confirm-btn');

  if (isChecked) {
    // Show warning + date input, hide calendar
    if (warning) { warning.style.maxHeight = '600px'; warning.style.opacity = '1'; }
    if (calendar) { calendar.style.maxHeight = '0'; calendar.style.opacity = '0'; }
    // Reset selected date from calendar
    _ssCalSelected = null;
    // Disable button until date input has value
    var dateInput = document.getElementById('ss-custom-date');
    if (btn) btn.disabled = !(dateInput && dateInput.value);
  } else {
    // Show calendar, hide warning
    if (warning) { warning.style.maxHeight = '0'; warning.style.opacity = '0'; }
    if (calendar) { calendar.style.maxHeight = '800px'; calendar.style.opacity = '1'; }
    // Re-check if calendar has selection
    if (btn) btn.disabled = !_ssCalSelected;
    // Re-render calendar
    ssRenderCalendar();
  }
};

window.ssDateChanged = function() {
  var dateInput = document.getElementById('ss-custom-date');
  var btn = document.getElementById('ss-confirm-btn');
  if (btn && dateInput) btn.disabled = !dateInput.value;
};

window.confirmStudiestart = function() {
  var backdrop = document.getElementById('ss-backdrop');
  if (!backdrop) return;
  var sc = backdrop._ssScenario;
  var dateStr = '';

  if (sc.id === 'approaching') {
    var selectedCard = document.querySelector('.ss-radio-card.selected');
    if (!selectedCard) return;
    var isSemester = selectedCard.querySelector('.ss-radio-main').textContent.indexOf('Valgfri') === -1;
    if (isSemester) {
      dateStr = sc.semesterDateStr;
    } else {
      var dateInput = document.getElementById('ss-custom-date');
      if (!dateInput || !dateInput.value) return;
      var parts = dateInput.value.split('-');
      dateStr = parts[2] + '.' + parts[1] + '.' + parts[0].slice(-2);
    }
  } else {
    // Between semesters — check if Lånekasse checkbox is checked
    var lkBox = document.getElementById('ss-lk-check');
    var lkChecked = lkBox && lkBox.classList.contains('checked');

    if (lkChecked) {
      // Date from input field
      var dateInput2 = document.getElementById('ss-custom-date');
      if (!dateInput2 || !dateInput2.value) return;
      var parts2 = dateInput2.value.split('-');
      dateStr = parts2[2] + '.' + parts2[1] + '.' + parts2[0].slice(-2);
    } else {
      // Date from calendar widget
      if (!_ssCalSelected) return;
      var dd = String(_ssCalSelected.getDate()).padStart(2, '0');
      var mm = String(_ssCalSelected.getMonth() + 1).padStart(2, '0');
      var yy = String(_ssCalSelected.getFullYear()).slice(-2);
      dateStr = dd + '.' + mm + '.' + yy;
    }
  }

  // Add all pending courses with start date
  _ssPending.forEach(function(c) {
    if (typeof spCart !== 'undefined' && !spCart[c.code]) {
      spCart[c.code] = { name: c.name, pts: c.pts, price: c.price, startDate: dateStr };
      document.querySelectorAll('.sp-course-row[data-code="' + c.code + '"] .sp-add-btn').forEach(function(b) {
        b.classList.add('added');
        b.textContent = '\u2713';
      });
    }
  });

  if (typeof spSyncToBasket === 'function') spSyncToBasket();

  closeStudiestartModal();
};

})();
