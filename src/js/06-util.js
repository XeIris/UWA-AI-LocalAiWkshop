/* ==========================================================
   SHARED HELPERS
   Three patterns that every interactive from §4 on repeats. They live
   here rather than in each feature file because the JS is concatenated
   into one IIFE — these are defined once and used throughout.
   ========================================================== */

/* ---- segmented controls ----
   One exclusive group of <button>s. Keeps .on and aria-pressed in step,
   which is the pair that got out of sync when each feature rolled its
   own. The initially-marked button wins, otherwise the first. */
function segGroup(sel, onPick) {
  var btns = Array.prototype.slice.call(document.querySelectorAll(sel + ' button'));
  if (!btns.length) return null;

  function select(btn, fire) {
    btns.forEach(function (b) {
      var on = b === btn;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (fire) onPick(btn);
  }

  btns.forEach(function (b) {
    b.addEventListener('click', function () { select(b, true); });
  });

  var start = btns.filter(function (b) { return b.classList.contains('on'); })[0] || btns[0];
  select(start, false);
  return { buttons: btns, select: select, current: function () {
    return btns.filter(function (b) { return b.classList.contains('on'); })[0];
  } };
}

/* ---- canvas sizing ----
   Returns null when the element has no layout yet — a slide that has
   never been shown measures zero, and drawing into that produces a
   stretched mess the first time it IS shown. Callers redraw on
   'deck:slide' for exactly that reason. */
function fitCanvas(cv) {
  var dpr = window.devicePixelRatio || 1;
  var w = cv.clientWidth, h = cv.clientHeight;
  if (!w || !h) return null;
  var cw = Math.round(w * dpr), ch = Math.round(h * dpr);
  if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
  var ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx: ctx, w: w, h: h };
}

/* Canvas cannot read rem, and the deck's root font size scales off
   min(vw, vh) so a projector and a 13" laptop get different pixels.
   Every canvas dimension is derived from this, never hardcoded. */
function rem() {
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

/* Canvas colours, resolved from the CSS tokens. Every canvas in the deck
   reads THEME at draw time, so this object is REFILLED IN PLACE on a
   theme change rather than replaced — a module that captured the
   reference (they all do) has to see the new values, and a fresh object
   would leave it painting yesterday's palette forever. */
var THEME = {};
function readTheme() {
  var css = getComputedStyle(document.documentElement);
  function v(name) { return css.getPropertyValue(name).trim(); }
  THEME.accent = v('--accent');  THEME.accentLo = v('--accent-lo');
  THEME.ok = v('--ok');          THEME.warn = v('--warn');
  THEME.bad = v('--bad');        THEME.ink = v('--ink');
  THEME.inkMid = v('--ink-mid'); THEME.inkDim = v('--ink-dim');
  THEME.rule = v('--rule-soft'); THEME.raise = v('--bg-raise');
  THEME.mono = v('--mono');
  THEME.artBg = v('--art-bg');
  THEME.artL0 = parseFloat(v('--art-l0'));
  THEME.artSpan = parseFloat(v('--art-span'));
  THEME.artS0 = parseFloat(v('--art-s0'));
  THEME.artSSpan = parseFloat(v('--art-sspan'));
}
readTheme();
document.addEventListener('deck:theme', readTheme);

var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Axis gridlines land on numbers a human would have chosen. Without
   this a 226 GB axis labels itself 0 / 57 / 114 / 171. */
function niceStep(raw) {
  var mag = Math.pow(10, Math.floor(Math.log(Math.max(raw, 1e-6)) / Math.LN10));
  var n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}

/* Context lengths are powers of two everywhere they appear — in the UI, in
   config files, in the model card. Dividing by 1000 renders 32768 as "33K",
   which is right and useless. K and M are binary here. */
function fmtTokens(n) {
  if (n < 1024) return Math.max(0, Math.round(n)) + '';
  if (n < 1048576) return Math.round(n / 1024) + 'K';
  var m = n / 1048576;
  return (m % 1 === 0 ? m : m.toFixed(1)) + 'M';
}
