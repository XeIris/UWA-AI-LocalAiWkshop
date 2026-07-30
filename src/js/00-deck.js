var SECTIONS = [
  ['00', 'Why bother?'],
  ['01', 'First win'],
  ['02', 'Under the hood'],
  ['03', 'Hardware + formula'],
  ['04', 'Quantization'],
  ['05', 'Context / KV'],
  ['06', 'Good at / bad at'],
  ['07', 'Horizon']
];

var slides  = Array.prototype.slice.call(document.querySelectorAll('.slide'));
var rail    = document.getElementById('rail');
var counter = document.getElementById('counter');
var index   = 0;

/* ---- section rail ---- */
SECTIONS.forEach(function (s, i) {
  var b = document.createElement('button');
  b.className = 'rail-item';
  b.innerHTML = '<span class="bar"></span><span class="txt">' + s[0] + ' &nbsp;' + s[1] + '</span>';
  b.addEventListener('click', function () { goToSection(i); });
  rail.appendChild(b);
});
var railItems = Array.prototype.slice.call(rail.children);

/* A clicked button keeps focus, and the keydown guard below then hands it
   the arrow keys — so after clicking the rail (or any segmented control)
   the deck stopped responding to arrows until you clicked elsewhere.
   Drop focus for pointer clicks only: keyboard activation reports
   detail 0 and must keep focus so tab order still works. */
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('button');
  if (b && e.detail > 0) b.blur();
});

/* Anything anywhere in the deck can be a jump target — the contents slide
   uses it, and the rail is really the same control in another shape.
   Delegated, so a slide that adds one later needs no JS at all. */
document.addEventListener('click', function (e) {
  var t = e.target.closest && e.target.closest('[data-goto]');
  if (t) goToSection(parseInt(t.dataset.goto, 10));
});

function pad(n) { return (n < 10 ? '0' : '') + n; }

function render() {
  slides.forEach(function (s, i) { s.classList.toggle('active', i === index); });

  var sec = parseInt(slides[index].dataset.section, 10);
  railItems.forEach(function (it, i) {
    it.classList.toggle('current', i === sec);
    it.classList.toggle('seen', i <= sec);
  });

  counter.textContent = pad(index + 1) + ' / ' + pad(slides.length);
  /* Some browsers throw SecurityError on replaceState from a file:// URL,
     and the deck has to run from file://. An uncaught throw here would
     abort render() before the dispatch below, leaving every canvas and
     bar interactive un-measured — so the deep link is best-effort only. */
  try {
    if (history.replaceState) history.replaceState(null, '', '#' + (index + 1));
  } catch (e) { /* deep linking unavailable; navigation still works */ }
  /* Interactives that measure their own geometry need to re-measure
     once their slide is actually laid out. */
  document.dispatchEvent(new CustomEvent('deck:slide'));
}

var hint = document.querySelector('.hint');
var started = false;

function goTo(i) {
  index = Math.max(0, Math.min(slides.length - 1, i));
  if (started && hint) hint.classList.add('gone');
  render();
}

/* Jump to a section's landing slide. Normally that is simply the first
   slide carrying the section number — but §0 owns the cover and the
   orientation slide before its section card, so "00 · Why bother?"
   navigated BACKWARDS to the cover. A slide can mark itself the landing
   point with data-anchor; without one the first match still wins, so
   every other section needs no attribute at all. */
function goToSection(n) {
  var first = -1;
  for (var i = 0; i < slides.length; i++) {
    if (parseInt(slides[i].dataset.section, 10) !== n) continue;
    if (first < 0) first = i;
    if (slides[i].dataset.anchor !== undefined) { goTo(i); return; }
  }
  if (first >= 0) goTo(first);
}

document.addEventListener('keydown', function (e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  /* A focused slider owns its arrow keys — otherwise dragging a
     sampling control with the keyboard would flip the slide instead. */
  var t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'BUTTON' || t.tagName === 'SELECT')) {
    if (e.key !== 'Escape') return;
    t.blur();
  }
  var k = e.key;
  if (k === 'ArrowRight' || k === 'ArrowDown' || k === ' ' || k === 'PageDown') {
    goTo(index + 1); e.preventDefault();
  } else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp') {
    goTo(index - 1); e.preventDefault();
  } else if (k === 'Home') { goTo(0); e.preventDefault(); }
  else if (k === 'End')    { goTo(slides.length - 1); e.preventDefault(); }
  else if (k >= '0' && k <= '7') { goToSection(parseInt(k, 10)); e.preventDefault(); }
  else if (k === 'f') {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }
});

var start = parseInt((location.hash || '').replace('#', ''), 10);
goTo(isNaN(start) ? 0 : start - 1);
started = true;
