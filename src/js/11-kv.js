/* ==========================================================
   KV CACHE — THE FORMULA AND THE STRAIGHT LINE
   Every term in the on-screen equation is read from the controls, so
   the formula is not an illustration of the arithmetic; it is the
   arithmetic. KV sizes use binary units throughout — 128 KB/token and
   4 GB at 32k are the figures people will meet elsewhere.

   The model buttons are TOGGLES. One model is the slide's default and
   the hero picture; two or three turn the chart into a comparison, and
   the difference between the lines is the lesson: the intercept is the
   weights, the slope is the cache. The equation and the three stats
   stay bound to ONE model — the last one switched on — because the
   arithmetic is the point of the slide and three columns of it would
   bury the one number the section is about.
   ========================================================== */
var kvSlide = document.getElementById('s-kv');
if (kvSlide) {
  var KV_MAX_CTX = 131072;                 /* chart x-axis: 0 → 128k */

  /* Model identity is a colour, and the palette rule leaves exactly
     three usable ones: cyan, the third state (filled --ink), and the
     muted grey. No warm hue appears here — nothing on this chart is a
     warning, and an amber line would say one of these models is wrong.

     The assignment is not arbitrary. 8B keeps --accent because it is
     the deck's reference model everywhere else (4.9 GB, the familiar
     128 KB/token) and it is this slide's default, so the picture the
     room sees first is unchanged. 30B takes --ink for the same reason
     §6's scale chart does: a different category, not a worse one —
     most laptops in the room cannot hold it. 1B recedes.

     THEME is read at draw time, never captured, so a theme change
     repaints in the new palette. */
  var KV_COLOUR = { xs: 'inkDim', s: 'accent', l: 'ink' };

  var kvGqaOn = true, kvBytes = 2;
  var kvHover = null;   /* context length under the pointer, or null */
  var kvGeo = null;     /* last paint's plot box, for the hover maths */

  var kvCanvas = document.getElementById('kvCanvas');
  var kvEl = {
    l: document.getElementById('kvL'), h: document.getElementById('kvH'),
    d: document.getElementById('kvD'), b: document.getElementById('kvB'),
    per: document.getElementById('kvPer'),
    perUnit: document.getElementById('kvPerUnit'),
    perK: document.getElementById('kvPerK'),
    at32: document.getElementById('kv32'),
    ratio: document.getElementById('kvRatio'),
    forName: document.getElementById('kvFor')
  };

  /* ---- the models, read off the buttons ---------------------------
     State lives in the DOM rather than being duplicated as literals up
     here: one place to be wrong instead of two. */
  var kvModels = Array.prototype.slice
    .call(document.querySelectorAll('#kvModel button'))
    .map(function (btn) {
      return {
        btn: btn, key: btn.dataset.key,
        name: btn.textContent.trim(),
        l: +btn.dataset.l, kv: +btn.dataset.kv, q: +btn.dataset.q,
        d: +btn.dataset.d, w: +btn.dataset.w
      };
    });

  /* Most recently switched on, last. The tail of this is the model the
     equation describes — "the one you just pressed" is the only rule
     that needs no explaining from the front of the room. */
  var kvOrder = kvModels.filter(function (m) { return kvIsOn(m); })
    .map(function (m) { return m.key; });

  function kvIsOn(m) { return m.btn.classList.contains('on'); }
  function kvOn() { return kvModels.filter(kvIsOn); }

  function kvPrimary() {
    var key = kvOrder[kvOrder.length - 1];
    var m = kvModels.filter(function (x) { return x.key === key; })[0];
    return m && kvIsOn(m) ? m : kvOn()[0];
  }

  function kvColour(m) { return THEME[KV_COLOUR[m.key]]; }

  function kvHeads(m) { return kvGqaOn ? m.kv : m.q; }

  /* 2 (one key, one value) × layers × KV heads × head dim × bytes. */
  function kvPerToken(m) { return 2 * m.l * kvHeads(m) * m.d * kvBytes; }

  function kvGB(m, tokens) { return tokens * kvPerToken(m) / 1073741824; }

  /* Total memory for a model at a context length: the flat part plus
     the linear part. This is the whole slide in one line. */
  function kvTotal(m, tokens) { return m.w + kvGB(m, tokens); }

  /* ---- readouts (always the primary model) ---- */
  function kvDraw() {
    var m = kvPrimary();
    var per = kvPerToken(m);
    kvEl.forName.textContent = m.name;
    kvEl.l.textContent = m.l;
    kvEl.h.textContent = kvHeads(m);
    kvEl.d.textContent = m.d;
    kvEl.b.textContent = kvBytes;

    var perKB = per / 1024;
    kvEl.per.textContent = perKB >= 1024
      ? (perKB / 1024).toFixed(1) : Math.round(perKB);
    /* Addressed by id rather than by DOM position: without GQA a 30B
       crosses into megabytes, so this label really does change, and it
       must not start pointing at whatever else lands next to it. */
    kvEl.perUnit.textContent = perKB >= 1024 ? 'MB per token' : 'KB per token';

    kvEl.perK.textContent = kvGB(m, 1000).toFixed(2) + ' GB';
    var at32 = kvGB(m, 32768);
    kvEl.at32.textContent = at32.toFixed(1) + ' GB';
    kvEl.ratio.textContent = (at32 / m.w).toFixed(1) + '×';
    kvPaint();
  }

  function kvPaint() {
    var f = fitCanvas(kvCanvas);
    if (!f) return;
    var ctx = f.ctx, W = f.w, H = f.h, R = rem();
    var padL = R * 2.8, padR = R * 0.8, padT = R * 0.8, padB = R * 1.9;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var sel = kvOn(), primary = kvPrimary();
    kvGeo = { padL: padL, plotW: plotW };

    /* The axis has to hold the tallest selected model, so adding a 30B
       visibly shrinks everything already on screen — the same move §6's
       scale chart makes, and for the same reason. */
    var top = 0;
    sel.forEach(function (m) {
      top = Math.max(top, kvTotal(m, KV_MAX_CTX), m.w * 2);
    });
    top *= 1.08;

    function X(t) { return padL + (t / KV_MAX_CTX) * plotW; }
    function Y(gb) { return padT + (1 - gb / top) * plotH; }

    ctx.font = Math.max(9, Math.round(R * 0.54)) + 'px ' + THEME.mono;

    /* ---- axes ---- */
    ctx.strokeStyle = THEME.rule; ctx.lineWidth = 1;
    ctx.fillStyle = THEME.inkDim; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    var stepGB = niceStep(top / 4);
    for (var k = 0; k * stepGB <= top; k++) {
      var g = k * stepGB;
      var y = Math.round(Y(g)) + 0.5;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      ctx.fillText((stepGB < 1 ? g.toFixed(1) : Math.round(g)) + ' GB', padL - R * 0.45, y);
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    [0, 32768, 65536, 98304, 131072].forEach(function (t) {
      ctx.fillStyle = THEME.inkDim;
      ctx.fillText(t === 0 ? '0' : fmtTokens(t), X(t), padT + plotH + R * 0.45);
    });

    var solo = sel.length === 1;

    /* ---- one model: the hero picture, unchanged ----
       The shaded wedge and the two band labels only make sense when
       there is a single pair of lines to sit between. With two models
       on screen the wedges overlap and the picture stops arguing
       anything, so the comparison drops them. */
    if (solo) {
      var m0 = sel[0], c0 = kvColour(m0);

      ctx.beginPath();
      ctx.moveTo(X(0), Y(m0.w));
      ctx.lineTo(X(KV_MAX_CTX), Y(kvTotal(m0, KV_MAX_CTX)));
      ctx.lineTo(X(KV_MAX_CTX), Y(m0.w));
      ctx.closePath();
      ctx.fillStyle = c0; ctx.globalAlpha = 0.14; ctx.fill();
      ctx.globalAlpha = 1;
    }

    /* ---- the lines ---- */
    sel.forEach(function (m) {
      var c = kvColour(m);

      /* weights: flat, and that is the point */
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = solo ? THEME.inkMid : c;
      ctx.globalAlpha = solo ? 1 : 0.55;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X(0), Y(m.w)); ctx.lineTo(X(KV_MAX_CTX), Y(m.w));
      ctx.stroke();
      ctx.restore();

      /* total: dead straight, sloping up */
      ctx.strokeStyle = c;
      ctx.lineWidth = m === primary ? 2.5 : 2;
      ctx.beginPath();
      ctx.moveTo(X(0), Y(m.w));
      ctx.lineTo(X(KV_MAX_CTX), Y(kvTotal(m, KV_MAX_CTX)));
      ctx.stroke();
    });

    /* ---- what the bands are called ----
       Both labels used to sit a few pixels above their own line, which
       on a rising line means the line climbs through the type — the two
       words the chart exists to name were the two least legible things
       on the slide. Each now sits in the band it names: WEIGHTS below
       the flat dashed line, in the block of memory that never moves,
       knocked out because the gridlines run through there; + KV CACHE
       inside the wedge itself, midway between the flat line and the
       sloping one. The wedge is never thinner than about a quarter of
       the plot at this x — check that before moving it. */
    if (solo) {
      var m1 = sel[0];
      knockLabel(ctx, 'WEIGHTS — FIXED', X(0) + R * 0.5,
        Y(m1.w) + R * 0.75, 'left', THEME.inkMid);

      var lx = KV_MAX_CTX * 0.5;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = kvColour(m1);
      ctx.fillText('+ KV CACHE', X(lx), Y(m1.w + kvGB(m1, lx) / 2));
    } else {
      /* Comparing: each line says which model it is, on the line, so
         the chart is readable without looking back at the buttons — and
         still readable if the room's projector eats the colours. */
      var nx = KV_MAX_CTX * 0.74;
      sel.forEach(function (m) {
        knockLabel(ctx, m.name.toUpperCase(), X(nx),
          Y(kvTotal(m, nx)) - R * 0.62, 'center', kvColour(m));
      });
    }

    /* ---- the 32k marker, because that is the default people ship ---- */
    var mx = X(32768);
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = THEME.rule; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(mx, padT); ctx.lineTo(mx, padT + plotH); ctx.stroke();
    ctx.restore();
    sel.forEach(function (m) {
      ctx.fillStyle = kvColour(m);
      ctx.beginPath();
      ctx.arc(mx, Y(kvTotal(m, 32768)), R * 0.2, 0, 6.284);
      ctx.fill();
    });

    if (kvHover !== null) kvPaintHover(ctx, R, sel, X, Y, padT, plotH, W, padR);
  }

  /* ---- the readout under the pointer -----------------------------
     A chart the room can only read at the five labelled ticks is a
     picture; one you can put a finger on is an instrument. The
     crosshair reports the true value at that x for every selected
     model, so "when does this stop fitting" is answered by pointing
     rather than by arithmetic. */
  function kvPaintHover(ctx, R, sel, X, Y, padT, plotH, W, padR) {
    var t = kvHover, hx = X(t);

    ctx.save();
    ctx.strokeStyle = THEME.inkMid; ctx.globalAlpha = 0.5; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(hx) + 0.5, padT);
    ctx.lineTo(Math.round(hx) + 0.5, padT + plotH);
    ctx.stroke();
    ctx.restore();

    /* Rows in the order the lines appear on screen, largest at the top,
       so the readout and the plot agree at a glance. */
    var rows = sel.map(function (m) {
      return { m: m, gb: kvTotal(m, t) };
    }).sort(function (a, b) { return b.gb - a.gb; });

    rows.forEach(function (r) {
      ctx.fillStyle = kvColour(r.m);
      ctx.beginPath(); ctx.arc(hx, Y(r.gb), R * 0.24, 0, 6.284); ctx.fill();
    });

    var lh = R * 0.95;
    var boxH = lh * (rows.length + 1) + R * 0.5;
    /* Measured, not guessed: without GQA a 30B at 128k is a six-figure
       cache and "210.1 GB" is wider than the fixed box that fitted
       "11.2 GB". A readout that clips its own number is worse than no
       readout. */
    var boxW = ctx.measureText(fmtTokens(t) + ' TOKENS').width;
    rows.forEach(function (r) {
      boxW = Math.max(boxW, ctx.measureText(r.m.name.toUpperCase()).width
        + ctx.measureText(r.gb.toFixed(1) + ' GB').width + R * 1.1);
    });
    boxW += R * 1.1;
    /* Same clipping trap as every other marker in the deck: past
       halfway the box has to hang off the other side of its own line or
       it is drawn outside the plot and simply is not there. */
    var flip = hx > (W - padR) - boxW - R * 0.6;
    var bx = flip ? hx - boxW - R * 0.55 : hx + R * 0.55;
    var by = padT + R * 0.3;

    ctx.fillStyle = THEME.panel;
    ctx.strokeStyle = THEME.rule; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(Math.round(bx) + 0.5, Math.round(by) + 0.5, boxW, boxH);
    ctx.fill(); ctx.stroke();

    var tx = bx + R * 0.55, rx = bx + boxW - R * 0.55, ty = by + R * 0.55;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left'; ctx.fillStyle = THEME.inkDim;
    ctx.fillText(fmtTokens(t) + ' TOKENS', tx, ty + lh * 0.2);

    rows.forEach(function (r, i) {
      var y = ty + lh * (i + 1.25);
      ctx.fillStyle = kvColour(r.m);
      ctx.textAlign = 'left';
      ctx.fillText(r.m.name.toUpperCase(), tx, y);
      ctx.textAlign = 'right';
      ctx.fillText(r.gb.toFixed(1) + ' GB', rx, y);
    });
  }

  /* ---- controls ---- */
  /* Toggles, with one invariant: something is always selected. An empty
     chart would leave the equation with no model to describe and the
     axis with nothing to scale to. */
  kvModels.forEach(function (m) {
    m.btn.addEventListener('click', function () {
      var on = kvIsOn(m);
      if (on && kvOn().length === 1) return;
      m.btn.classList.toggle('on', !on);
      m.btn.setAttribute('aria-pressed', on ? 'false' : 'true');
      kvOrder = kvOrder.filter(function (k) { return k !== m.key; });
      if (!on) kvOrder.push(m.key);
      kvDraw();
    });
  });

  var kvGqaSeg = segGroup('#kvGqa', function (b) { kvGqaOn = b.dataset.gqa === '1'; kvDraw(); });
  var kvPrecSeg = segGroup('#kvPrec', function (b) { kvBytes = +b.dataset.bytes; kvDraw(); });

  kvGqaOn = kvGqaSeg.current().dataset.gqa === '1';
  kvBytes = +kvPrecSeg.current().dataset.bytes;

  /* Pointer, not mouse: a trackpad and a pen both land here. Touch is
     let through untouched — swallowing it would take the slide's own
     scrolling away from anyone following along on a phone, and there is
     no hover state on a finger to report anyway. */
  kvCanvas.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch' || !kvGeo) return;
    var x = e.clientX - kvCanvas.getBoundingClientRect().left;
    var t = (x - kvGeo.padL) / kvGeo.plotW * KV_MAX_CTX;
    /* Rounded to 1k so the readout reports a context length someone
       might actually set, not 47,318 tokens. */
    t = Math.round(Math.max(0, Math.min(KV_MAX_CTX, t)) / 1024) * 1024;
    if (t !== kvHover) { kvHover = t; kvPaint(); }
  });
  function kvLeave() { if (kvHover !== null) { kvHover = null; kvPaint(); } }
  kvCanvas.addEventListener('pointerleave', kvLeave);

  kvDraw();
  window.addEventListener('resize', kvPaint);
  /* Leaving the slide with the crosshair up would bring it back on
     return, parked wherever the pointer happened to leave. */
  document.addEventListener('deck:slide', function () { kvHover = null; kvPaint(); });
}
