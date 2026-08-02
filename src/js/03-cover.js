/* ==========================================================
   COVER ART
   The three configurations of the flagship example. As
   parameter count rises the weight grid gets denser; as
   precision falls it gets coarser; the footprint bar below
   never moves. That invariance IS the lesson.
   ========================================================== */
var CONFIGS = [
  { label: '7.5B · 16-bit', gb: '15.0 GB', params: 7.5,  shades: 26 },
  { label: '15B · 8-bit',   gb: '15.0 GB', params: 15,   shades: 11 },
  { label: '30B · 4-bit',   gb: '15.0 GB', params: 30,   shades: 5  }
];

/* Guarded like every other module: all the JS files share one IIFE, so an
   unguarded getContext() throw here would abort the rest of the bundle and
   the decode/machines interactives would silently never initialise. The
   guard also block-scopes this file's draw(), so it cannot collide with a
   top-level draw() in another module. */
var cv = document.getElementById('art');
if (cv) {
var ctx = cv.getContext('2d');
var coverSlide = document.getElementById('cover');
var cfgEl = document.getElementById('artCfg');
var gbEl  = document.getElementById('artGb');
var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

var W = cv.width, H = cv.height;
var ci = 0, t0 = performance.now(), fade = 1, swapped = false;
var HOLD = 3400, XFADE = 620;

function field(wx, wy, t) {
  var v = Math.sin(wx * 1.9 + t * 0.45)
        + Math.sin(wy * 2.3 - t * 0.31)
        + Math.sin((wx + wy) * 1.25 + t * 0.19)
        + 0.6 * Math.sin((wx - wy * 1.4) * 3.1 - t * 0.24);
  return (v / 3.6 + 1) / 2;                       /* -> 0..1 */
}

function draw(now) {
  /* ~2000 fillRects a frame; no reason to pay that for the 18 slides where
     the cover is not on screen. Hold t0 so the cycle resumes, not jumps. */
  if (coverSlide && !coverSlide.classList.contains('active')) {
    t0 = now; requestAnimationFrame(draw); return;
  }
  var elapsed = now - t0;
  if (elapsed > HOLD + XFADE) { t0 = now; elapsed = 0; swapped = false; }

  /* crossfade near the end of the hold; swap the config at the darkest point */
  if (elapsed > HOLD) {
    var p = (elapsed - HOLD) / XFADE;
    fade = Math.abs(p - 0.5) * 2;                 /* 1 -> 0 -> 1 */
    if (p >= 0.5 && !swapped) {
      swapped = true;
      ci = (ci + 1) % CONFIGS.length;
      cfgEl.textContent = CONFIGS[ci].label;
      gbEl.textContent  = CONFIGS[ci].gb;
    }
  } else { fade = 1; }

  var cfg  = CONFIGS[ci];
  var cell = 74 / Math.sqrt(cfg.params);          /* denser as params grow */
  var cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
  var t    = reduced ? 0 : now / 1000;

  ctx.fillStyle = THEME.artBg;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.15 + 0.85 * fade;

  for (var y = 0; y < rows; y++) {
    for (var x = 0; x < cols; x++) {
      var wx = (x * cell) / W, wy = (y * cell) / H;
      var v  = field(wx * 6, wy * 6, t);
      /* posterize to the configuration's shade count */
      var q  = Math.round(v * (cfg.shades - 1)) / (cfg.shades - 1);
      /* One hue, one ramp, two directions: the light theme's span is
         negative, so a heavy weight is dark ink rather than bright glass. */
      var l  = THEME.artL0 + q * THEME.artSpan;
      var s  = THEME.artS0 + q * THEME.artSSpan;
      ctx.fillStyle = 'hsl(187, ' + s + '%, ' + l + '%)';
      ctx.fillRect(x * cell, y * cell, cell - 1, cell - 1);
    }
  }
  ctx.globalAlpha = 1;
  /* Reduced motion gets one static frame, not an endless redraw of it. */
  if (!reduced) requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

/* A running loop repaints itself on the next frame anyway. Reduced motion
   drew exactly one frame and would otherwise keep the old palette — but
   only that case may schedule here, or the deck ends up with two loops.

   Registered ONCE, here at module level. This block briefly lived inside
   draw() as well, which under reduced motion added a listener per repaint
   and turned every later theme toggle into a growing burst of frames. */
if (reduced) {
  document.addEventListener('deck:theme', function () {
    requestAnimationFrame(draw);
  });
}
}
