/* ==========================================================
   THEME TOGGLE
   Flips :root[data-theme] between the deck's dark default and the
   daylight token block. Everything drawn in CSS follows for free;
   canvases do not, so a change fires 'deck:theme' (repopulate the
   colour objects) and then 'deck:slide' (repaint with them). The
   order matters — a repaint that ran first would use the old
   palette and nothing would ask it again.
   ========================================================== */
var themeBtn = document.getElementById('themeBtn');

/* file:// is the deck's normal habitat and some browsers refuse
   storage there, so the preference is best-effort. Failing to
   remember a theme must never stop the deck from opening. */
function themeStored(value) {
  try {
    if (value === undefined) return localStorage.getItem('unplugged-theme');
    localStorage.setItem('unplugged-theme', value);
  } catch (e) { /* no storage: the toggle still works, it just forgets */ }
  return null;
}

function setTheme(name) {
  if (name === 'light') document.documentElement.setAttribute('data-theme', 'light');
  else document.documentElement.removeAttribute('data-theme');

  /* The label carries the state, so aria-pressed must not carry it too —
     both together announce as "Switch to light theme, pressed", which
     leaves a listener unable to tell which theme they are actually in.
     One signal, and it is the one that says what the button will do. */
  if (themeBtn) {
    themeBtn.setAttribute('aria-label',
      name === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
  }
  document.dispatchEvent(new CustomEvent('deck:theme'));
  document.dispatchEvent(new CustomEvent('deck:slide'));
}

setTheme(themeStored() === 'light' ? 'light' : 'dark');

if (themeBtn) {
  themeBtn.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'light'
      ? 'dark' : 'light';
    themeStored(next);
    setTheme(next);
  });
}
