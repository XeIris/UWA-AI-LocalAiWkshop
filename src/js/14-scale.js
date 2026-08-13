/* ==========================================================
   SENSE OF SCALE
   Parameter counts, revealed one model at a time so the axis has to
   keep rescaling and everything already on screen visibly shrinks.
   That collapse is the slide: it is very hard to feel "a thousand
   times bigger" from a table.

   Every figure is order-of-magnitude. Open-weight totals are published
   by their vendors; the closed ones are inference and are drawn as
   ranges, because the two public attempts to estimate them from the
   outside disagree by about 6x (arXiv 2604.24827 vs the LessWrong
   re-analysis of it). Params are in BILLIONS throughout.
   ========================================================== */
var scSlide = document.getElementById('s-scale');
if (scSlide) {

  /* kind: 'local'  — a laptop can hold it
           'open'   — weights published, but not on your hardware
           'closed' — no public weights; `lo`/`hi` mark an estimate range
     act:  active params per token for a sparse (MoE) model            */
  var SC_MODELS = [
    { n: 'Gemma 3 1B',       p: 1,     kind: 'local',
      say: 'The one you downloaded. One billion parameters, about 700&nbsp;MB on ' +
           'disk, and it answered you in a second.' },
    { n: 'Qwen3 4B',         p: 4,     kind: 'local',
      say: 'The one worth taking home. Four times the parameters, still ' +
           'comfortable on an 8&nbsp;GB laptop.' },
    { n: 'Qwen3.6 27B',      p: 27.8,  kind: 'local',
      say: 'About the ceiling for a good laptop &mdash; roughly 17&nbsp;GB at ' +
           '4&#8209;bit. Hold this one in mind; it comes back in the next section.' },
    { n: 'GPT&#8209;3.5',    p: 175,   kind: 'closed',
      say: 'The model that started the fuss, in 2022. The last OpenAI flagship ' +
           'whose size we actually know &mdash; and six times bigger than your ' +
           'laptop&rsquo;s ceiling today.' },
    { n: 'DeepSeek V4 Flash', p: 284,  act: 13, kind: 'open',
      say: 'Open weights, and the small one of its family. 284&nbsp;B total, but ' +
           'only 13&nbsp;B fire per token &mdash; that is what sparse means.' },
    { n: 'GLM&#8209;5.2',    p: 753,   act: 40, kind: 'open',
      say: 'MIT licensed. You could legally download this today. You would need ' +
           'about 400&nbsp;GB of memory to run it.' },
    { n: 'MiMo V2.5 Pro',    p: 1020,  act: 42, kind: 'open',
      say: 'A trillion parameters, published openly, by a phone manufacturer. ' +
           'That sentence would have been nonsense two years ago.' },
    { n: 'DeepSeek V4 Pro',  p: 1600,  act: 49, kind: 'open',
      say: 'Open weights at 1.6&nbsp;trillion &mdash; the scale of the biggest ' +
           'closed model anyone has ever managed to confirm.' },
    { n: 'GPT&#8209;4',      p: 1800,  kind: 'closed',
      say: 'Never officially disclosed; roughly 1.8&nbsp;trillion according to the ' +
           '2023 leak. Note who has now caught up to it in the open.' },
    { n: 'Kimi K3',          p: 2800,  act: 104, kind: 'open',
      say: 'The largest open-weight model ever released. 2.8&nbsp;trillion ' +
           'parameters that anyone can download &mdash; and nobody in this room can run.' },
    { n: 'Frontier 2026',    p: 9700,  lo: 1500, hi: 9700, kind: 'closed',
      say: 'GPT&#8209;5.6, Claude Opus 5, Gemini. Nobody outside those labs knows. ' +
           'The published estimates span this whole bar &mdash; and its <em>floor</em> ' +
           'is still a thousand times your download.' }
  ];

  /* Time view is a fixed picture, not a reveal — the point is when the
     closed labs stopped publishing, which needs every point at once.
     `lo`/`hi` again mark an estimate. `la` hand-places the label:
     six models land inside eight weeks of each other in 2026, and no
     automatic rule untangles that column. 2025 is empty, so the open
     cluster labels itself leftwards into that gap. */
  var SC_TIME = [
    { n: 'GPT&#8209;3.5',      y: 2022.92, p: 175,  kind: 'closed', la: 'above' },
    { n: 'GPT&#8209;4',        y: 2023.21, p: 1800, kind: 'closed', la: 'above' },
    { n: 'Llama 3.1 405B',     y: 2024.58, p: 405,  kind: 'open',   la: 'below' },
    { n: 'DeepSeek V3',        y: 2024.96, p: 671,  act: 37, kind: 'open', la: 'above' },
    { n: 'GPT&#8209;5',        y: 2025.60, p: 2000, lo: 800, hi: 5000, kind: 'closed', la: 'above' },
    { n: 'Qwen3.6 27B',        y: 2026.31, p: 27.8, kind: 'local',  la: 'left' },
    { n: 'DeepSeek V4 Pro',    y: 2026.31, p: 1600, act: 49, kind: 'open', la: 'left' },
    { n: 'GLM&#8209;5.2',      y: 2026.45, p: 753,  act: 40, kind: 'open', la: 'left' },
    { n: 'GPT&#8209;5.6 Sol',  y: 2026.52, p: 3800, lo: 1500, hi: 9700, kind: 'closed', la: 'above' },
    /* Kimi's dot sits mid-way up Sol's range bar, so its label goes right;
       Anthropic's needs an extra drop to clear GLM-5.2's. */
    { n: 'Kimi K3',            y: 2026.55, p: 2800, act: 104, kind: 'open', la: 'right' },
    { n: 'Opus 5 / Fable 5',   y: 2026.56, p: 2400, lo: 1100, hi: 5300, kind: 'closed', la: 'below', ldy: 2.1 }
  ];

  var LAPTOP_CEILING = 32;      /* B params a 4-bit model can reach in ~24 GB */

  var scCanvas = document.getElementById('scCanvas');
  var scAdd    = document.getElementById('scAdd');
  var scReset  = document.getElementById('scReset');
  var scEmpty  = document.getElementById('scEmpty');
  var scMaxEl  = document.getElementById('scMax');
  var scRatio  = document.getElementById('scRatio');
  var scSay    = document.getElementById('scSay');
  var scAxisCtrl = document.querySelector('.sc-axis-ctrl');

  var shownN = 0;               /* how many SIZE-view models are revealed */
  var view   = 'size';
  var axis   = 'lin';
  var axNow  = 4;               /* eased axis maximum, in billions        */

  function scFmt(b) {
    if (b < 1000) return (b < 10 && b % 1 ? b.toFixed(1) : Math.round(b)) + 'B';
    var t = b / 1000;
    return (t < 10 ? t.toFixed(1).replace(/\.0$/, '') : Math.round(t)) + 'T';
  }

  /* ---- reveal state ---- */
  function scTargetMax() {
    var m = 4;
    for (var i = 0; i < shownN; i++) m = Math.max(m, SC_MODELS[i].p);
    return m;
  }

  function scSync() {
    var last = SC_MODELS[shownN - 1];
    scAdd.disabled = shownN >= SC_MODELS.length;
    scAdd.textContent = shownN >= SC_MODELS.length
      ? 'That is all of them' : 'Add the next model ▶';
    /* The time view is never empty, so the prompt must not reappear over
       it — this used to run before the early return below and did. */
    scEmpty.classList.toggle('gone', view === 'time' || shownN > 0);

    if (view === 'time') {
      scMaxEl.textContent = '10T';
      scRatio.innerHTML = 'Disclosure stopped in 2023';
      scSay.innerHTML = 'The closed labs published parameter counts up to the ' +
        'GPT&#8209;3 generation, then stopped. Everything solid after 2023 is open weights &mdash; ' +
        'which is the only reason we can draw this chart at all.';
      return;
    }
    var mx = scTargetMax();
    scMaxEl.textContent = scFmt(mx);
    scRatio.innerHTML = shownN < 2 ? '&nbsp;'
      : Math.round(mx / SC_MODELS[0].p).toLocaleString() +
        '&times; your download';
    if (last) scSay.innerHTML = last.say;
  }

  /* ---- axis helpers ---- */
  var LOG_MIN = 0.5;
  function scPos(v, max) {
    if (axis === 'log') {
      var a = Math.log(LOG_MIN) / Math.LN10, b = Math.log(Math.max(max, 10)) / Math.LN10;
      return Math.max(0, (Math.log(Math.max(v, LOG_MIN)) / Math.LN10 - a) / (b - a));
    }
    return Math.max(0, v / max);
  }

  function scStroke(ctx, kind) {
    return kind === 'closed' ? THEME.ink : THEME.accent;
  }

  /* ---- SIZE view ---- */
  function scDrawSize(ctx, W, H, R) {
    var padL = R * 8.4, padR = R * 5.2, padT = R * 0.6, padB = R * 1.9;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var rows = SC_MODELS.slice(0, shownN).sort(function (a, b) { return b.p - a.p; });
    var lane = plotH / Math.max(rows.length, 1);
    var barH = Math.min(lane * 0.56, R * 1.15);
    var small = Math.max(9, Math.round(R * 0.55));
    ctx.font = small + 'px ' + THEME.mono;

    /* ---- axis ticks ---- */
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    var ticks = [];
    if (axis === 'log') {
      for (var d = 1; d <= 10000; d *= 10) if (d <= axNow * 1.2) ticks.push(d);
    } else {
      var st = niceStep(axNow / 5);
      for (var t = st; t <= axNow * 1.001; t += st) ticks.push(t);
    }
    ticks.forEach(function (v) {
      var x = Math.round(padL + scPos(v, axNow) * plotW) + 0.5;
      ctx.strokeStyle = THEME.rule; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
      ctx.fillStyle = THEME.inkDim;
      ctx.fillText(scFmt(v), x, padT + plotH + R * 0.35);
    });
    /* baseline */
    ctx.strokeStyle = THEME.rule; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL + 0.5, padT); ctx.lineTo(padL + 0.5, padT + plotH); ctx.stroke();

    rows.forEach(function (m, i) {
      var cy = padT + lane * (i + 0.5);
      var y  = Math.round(cy - barH / 2);
      var full = scPos(m.p, axNow) * plotW;
      /* A 1B bar against a 10T axis is a third of a pixel. Keep a sliver
         so the row still reads as present-but-invisible, which is the
         whole point of the linear view. */
      var w = Math.max(full, 2);
      var col = scStroke(ctx, m.kind);

      /* label gutter */
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillStyle = m.kind === 'local' ? THEME.accent : THEME.inkMid;
      ctx.font = small + 'px ' + THEME.mono;
      scLabel(ctx, m.n, padL - R * 0.55, cy);

      /* bar: solid for local, hollow for open, filled white for closed */
      if (m.kind === 'open') {
        ctx.fillStyle = col; ctx.globalAlpha = 0.16;
        ctx.fillRect(padL, y, w, barH); ctx.globalAlpha = 1;
        ctx.strokeStyle = col; ctx.lineWidth = 1.25;
        ctx.strokeRect(padL + 0.5, y + 0.5, Math.max(w - 1, 1), barH - 1);
      } else if (m.lo) {
        /* An estimate range reads as certainty that runs out: solid up to
           the lowest published figure, faded across the disputed span. */
        var xlo = Math.max(scPos(m.lo, axNow) * plotW, 2);
        ctx.fillStyle = col;
        ctx.fillRect(padL, y, xlo, barH);
        ctx.globalAlpha = 0.3;
        ctx.fillRect(padL + xlo, y, Math.max(w - xlo, 0), barH);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = col;
        ctx.fillRect(padL, y, w, barH);
      }

      /* active-parameter marker — the slice that actually moves per token */
      if (m.act) {
        var xa = padL + scPos(m.act, axNow) * plotW;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(xa, cy, Math.max(2, R * 0.2), 0, 6.284); ctx.fill();
      }

      /* value */
      ctx.textAlign = 'left';
      ctx.fillStyle = m.kind === 'closed' ? THEME.ink : THEME.accent;
      ctx.fillText(m.lo ? scFmt(m.lo) + '–' + scFmt(m.hi) : scFmt(m.p),
        padL + w + R * 0.45, cy);
    });
  }

  /* ---- TIME view ---- */
  function scDrawTime(ctx, W, H, R) {
    var padL = R * 2.7, padR = R * 3.4, padT = R * 1.4, padB = R * 1.9;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var Y0 = 2022.6, Y1 = 2026.95, P0 = 10, P1 = 12000;
    var small = Math.max(9, Math.round(R * 0.55));
    ctx.font = small + 'px ' + THEME.mono;

    function X(y) { return padL + (y - Y0) / (Y1 - Y0) * plotW; }
    function Y(p) {
      var a = Math.log(P0) / Math.LN10, b = Math.log(P1) / Math.LN10;
      return padT + (1 - (Math.log(Math.max(p, P0)) / Math.LN10 - a) / (b - a)) * plotH;
    }

    /* the band a laptop can actually reach — everything else is above it */
    var ceilY = Y(LAPTOP_CEILING);
    ctx.fillStyle = THEME.accent; ctx.globalAlpha = 0.06;
    ctx.fillRect(padL, ceilY, plotW, padT + plotH - ceilY);
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.setLineDash([4, 4]); ctx.strokeStyle = THEME.accent; ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.moveTo(padL, ceilY); ctx.lineTo(padL + plotW, ceilY); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = THEME.accent; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('WHAT A LAPTOP HOLDS', padL + R * 0.4, ceilY + R * 0.25);

    /* y gridlines, one per decade */
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    [10, 100, 1000, 10000].forEach(function (p) {
      var y = Math.round(Y(p)) + 0.5;
      ctx.strokeStyle = THEME.rule; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      ctx.fillStyle = THEME.inkDim; ctx.fillText(scFmt(p), padL - R * 0.35, y);
    });

    /* x labels */
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    [2023, 2024, 2025, 2026].forEach(function (yr) {
      ctx.fillStyle = THEME.inkDim;
      ctx.fillText(yr, X(yr), padT + plotH + R * 0.35);
    });

    SC_TIME.forEach(function (m) {
      var x = X(m.y), col = scStroke(ctx, m.kind);
      if (m.lo) {
        /* a range, not a point — the honest shape for a guess */
        ctx.strokeStyle = col; ctx.globalAlpha = 0.5; ctx.lineWidth = Math.max(3, R * 0.34);
        ctx.beginPath(); ctx.moveTo(x, Y(m.lo)); ctx.lineTo(x, Y(m.hi)); ctx.stroke();
        ctx.globalAlpha = 1;
        [m.lo, m.hi].forEach(function (v) {
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x - R * 0.28, Math.round(Y(v)) + 0.5);
          ctx.lineTo(x + R * 0.28, Math.round(Y(v)) + 0.5);
          ctx.stroke();
        });
      } else {
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(x, Y(m.p), Math.max(3, R * 0.26), 0, 6.284); ctx.fill();
      }
      /* Above and below anchor to the END of a range, not its middle —
         a label parked halfway up a 1.5-to-9.7T bar looks like a reading. */
      var lx = x, ly = Y(m.p);
      ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      if (m.la === 'left')       { ctx.textAlign = 'right'; lx = x - R * 0.5; }
      else if (m.la === 'right') { ctx.textAlign = 'left';  lx = x + R * 0.5; }
      else if (m.la === 'below') { ly = Y(m.lo || m.p) + R * (m.ldy || 0.85); }
      else                       { ly = Y(m.hi || m.p) - R * 0.8; }
      ctx.fillStyle = m.kind === 'local' ? THEME.accent
                    : m.kind === 'closed' ? THEME.ink : THEME.inkMid;
      scLabel(ctx, m.n, lx, ly);
    });
  }

  /* Canvas has no entity parser and the model names carry &nbsp; and
     non-breaking hyphens so they wrap correctly in HTML. Decode once,
     here, rather than keeping two spellings of every name. */
  var scDec = document.createElement('textarea');
  function scLabel(ctx, html, x, y) {
    scDec.innerHTML = html;
    ctx.fillText(scDec.value, x, y);
  }

  function scPaint() {
    var f = fitCanvas(scCanvas);
    if (!f) return;
    if (view === 'time') scDrawTime(f.ctx, f.w, f.h, rem());
    else if (shownN) scDrawSize(f.ctx, f.w, f.h, rem());
  }

  /* ---- axis easing ---- */
  var scRaf = 0;
  function scAnimate() {
    var target = scTargetMax();
    if (REDUCED || view === 'time') { axNow = target; scPaint(); return; }
    cancelAnimationFrame(scRaf);
    var last = 0;
    (function step(now) {
      var dt = last ? Math.min(now - last, 100) / 1000 : 0;
      last = now;
      /* Exponential approach in LOG space: a linear ease from 4B to
         9700B spends most of its time in territory nothing occupies. */
      var la = Math.log(axNow), lt = Math.log(target);
      la += (lt - la) * Math.min(1, dt * 5.5);
      axNow = Math.exp(la);
      scPaint();
      if (Math.abs(lt - Math.log(axNow)) > 0.002) scRaf = requestAnimationFrame(step);
      else { axNow = target; scPaint(); }
    }(performance.now()));
  }

  scAdd.addEventListener('click', function () {
    if (shownN >= SC_MODELS.length) return;
    shownN++;
    scSync(); scAnimate();
  });
  scReset.addEventListener('click', function () {
    /* An ease scheduled by scAnimate holds the old target in its closure,
       so without this the axis crawls back up after a mid-animation reset. */
    cancelAnimationFrame(scRaf);
    shownN = 0; axNow = 4;
    scSync(); scPaint();
  });

  segGroup('#scView', function (b) {
    view = b.dataset.v;
    scAxisCtrl.classList.toggle('off', view === 'time');
    scSync(); scAnimate();
  });
  segGroup('#scAxis', function (b) { axis = b.dataset.a; scPaint(); });

  window.addEventListener('resize', scPaint);
  document.addEventListener('deck:slide', scPaint);
  scSync(); scPaint();
}
