/* ==========================================================
   AUTOREGRESSIVE vs DIFFUSION
   512 tokens generated twice. The left lane fills one cell per forward
   pass, strictly in order; the right lane resolves a whole 256-token
   block at once, a few more cells committing at every denoising step
   and in no particular order.

   Both lanes share one slow-motion divisor, so the 4x on screen is
   Google's published 4x. DiffusionGemma: >1,000 tok/s on a single
   H100, 256 tokens per forward pass (DeepMind, Jun 2026); the
   autoregressive baseline is the "comparable model" that claim is
   made against.
   ========================================================== */
var dfSlide = document.getElementById('s-diff');
if (dfSlide) {
  var DF_N      = 512;    /* tokens generated in both lanes   */
  var DF_BLOCK  = 256;    /* diffusion tokens per forward pass */
  /* Google publish 256 tokens per forward pass and the 4x, but NOT the
     number of denoising steps a block takes. Sixteen is this animation's
     choice, not a figure from the model card — the caveat says so, and
     the verdict copy says "a handful of passes" rather than naming it. */
  var DF_STEPS  = 16;     /* denoising steps per block — ours, not theirs */
  var DF_SLOWMO = 2.5;
  var DF_AR_RATE = 250;   /* tok/s, autoregressive baseline    */
  var DF_DF_RATE = 1000;  /* tok/s, diffusion                  */

  var dfRun = document.getElementById('dfRun');

  var DF = [
    { id: 'ar', rate: DF_AR_RATE },
    { id: 'df', rate: DF_DF_RATE }
  ];
  DF.forEach(function (l) {
    l.cv = document.getElementById('df-cv-' + l.id);
    l.el = document.getElementById('df-el-' + l.id);
    l.pa = document.getElementById('df-p-' + l.id);
  });

  /* Which denoising step each diffusion cell commits on. Shuffled once
     per run so the block resolves in scattered order — committing them
     left to right would draw exactly the picture we are contrasting
     against. */
  var dfCommit = new Uint8Array(DF_N);
  function dfShuffle() {
    for (var b = 0; b < DF_N; b += DF_BLOCK) {
      var idx = [];
      for (var i = 0; i < DF_BLOCK; i++) idx.push(i);
      for (var j = idx.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var t = idx[j]; idx[j] = idx[k]; idx[k] = t;
      }
      /* Later steps commit more cells than early ones — that is the shape
         of a real denoising schedule, and it also reads better. */
      idx.forEach(function (pos, rank) {
        var f = rank / DF_BLOCK;
        dfCommit[b + pos] = Math.min(DF_STEPS - 1, Math.floor(Math.pow(f, 0.65) * DF_STEPS));
      });
    }
  }
  dfShuffle();

  function dfSecs(l) { return DF_N / l.rate * DF_SLOWMO; }

  /* ---- painting ---- */
  function dfPaint(l, done) {
    var f = fitCanvas(l.cv);
    if (!f) return;
    var ctx = f.ctx, W = f.w, H = f.h;
    var cols = 32, rows = Math.ceil(DF_N / cols);
    var gap = Math.max(1, Math.round(rem() * 0.13));
    var cw = (W - gap * (cols - 1)) / cols;
    var ch = Math.min((H - gap * (rows - 1)) / rows, cw * 1.35);
    var top = (H - (ch * rows + gap * (rows - 1))) / 2;

    for (var i = 0; i < DF_N; i++) {
      var x = (i % cols) * (cw + gap);
      var y = top + Math.floor(i / cols) * (ch + gap);
      var st = done(i);                    /* 0 masked · 0..1 settling · 1 done */
      if (st <= 0) {
        /* Unwritten cells have to be clearly THERE. Half the point of the
           right lane is that 256 tokens exist as masked placeholders
           before any of them is decided; --bg-raise against --bg-panel is
           too close to read that. */
        ctx.fillStyle = THEME.inkDim;
        ctx.globalAlpha = 0.16;
      } else {
        ctx.fillStyle = THEME.accent;
        ctx.globalAlpha = 0.22 + 0.78 * st;
      }
      ctx.fillRect(x, y, cw, ch);
    }
    ctx.globalAlpha = 1;
  }

  /* ---- run state ---- */
  var dfT = 0, dfRunning = false, dfLast = 0, dfRaf = null;

  /* Wound on arrival, stopped on departure. The body only does work while
     a generation is playing, but the callback itself is not free. */
  function dfWind() {
    if (dfRaf === null) { dfLast = performance.now(); dfRaf = requestAnimationFrame(dfFrame); }
  }
  function dfHalt() {
    if (dfRaf !== null) { cancelAnimationFrame(dfRaf); dfRaf = null; }
  }

  function dfFrame(now) {
    dfRaf = null;
    if (!dfSlide.classList.contains('active')) return;
    dfRaf = requestAnimationFrame(dfFrame);
    var dt = Math.min(now - dfLast, 250) / 1000;
    dfLast = now;
    if (dfRunning) {
      dfT += dt;
      var longest = Math.max(dfSecs(DF[0]), dfSecs(DF[1]));
      if (dfT >= longest) { dfT = longest; dfRunning = false; dfRun.disabled = false; }
      dfRender();
    }
  }

  function dfRender() {
    DF.forEach(function (l) {
      var total = dfSecs(l);
      var t = Math.min(dfT, total);
      l.el.textContent = t.toFixed(2);

      if (l.id === 'ar') {
        var n = Math.min(DF_N, Math.floor(t * l.rate / DF_SLOWMO));
        l.pa.textContent = n.toLocaleString('en-US');
        dfPaint(l, function (i) { return i < n ? 1 : 0; });
      } else {
        /* One pass per block; within a pass, progress through the steps. */
        var perBlock = total / (DF_N / DF_BLOCK);
        var blk = Math.floor(t / perBlock);
        var within = (t - blk * perBlock) / perBlock;      /* 0..1 */
        var step = within * DF_STEPS;
        l.pa.textContent = Math.min(DF_N / DF_BLOCK, Math.ceil(t / perBlock) || 0);
        dfPaint(l, function (i) {
          var myBlk = Math.floor(i / DF_BLOCK);
          if (myBlk < blk) return 1;
          if (myBlk > blk) return 0;
          /* A cell fades in over the step it commits on rather than
             snapping, so 256 cells do not strobe together. */
          return Math.max(0, Math.min(1, step - dfCommit[i]));
        });
      }
    });
  }

  function dfStart() {
    dfShuffle();
    dfT = 0; dfRunning = true; dfRun.disabled = true;
    if (REDUCED) { dfT = Math.max(dfSecs(DF[0]), dfSecs(DF[1])); dfRunning = false; dfRun.disabled = false; }
    dfRender();
  }

  dfRun.addEventListener('click', dfStart);
  window.addEventListener('resize', dfRender);
  document.addEventListener('deck:slide', function () {
    dfRender();
    if (REDUCED) return;
    if (dfSlide.classList.contains('active')) dfWind(); else dfHalt();
  });

  dfRender();
  if (!REDUCED && dfSlide.classList.contains('active')) dfWind();
}
