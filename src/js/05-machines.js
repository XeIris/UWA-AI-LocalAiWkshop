/* ==========================================================
   TWO MACHINES — FIT, SPILL, AND WHAT IT COSTS
   Every token requires reading every weight once, so a read head is
   swept across the model at the bandwidth of whichever pool it is
   currently crossing. It flies through VRAM and crawls through DRAM,
   which is the entire lesson made visible rather than asserted.

   The sweep is slowed by a single constant, so every ratio on screen
   is exactly the real ratio.
   ========================================================== */
var mxSlide = document.getElementById('s-mach');
if (mxSlide) {
  var SLOWMO   = 10;      /* wall-clock divisor, applied to both machines */
  var SCALE_GB = 64;      /* GB spanning the full canvas width            */
  var DRIFT    = 0.4;     /* token block travel, fraction of width / sec  */

  var MACHINES = {
    pc:  { pools: [{ label: 'VRAM · GDDR7',   gb: 32, bw: 1792 },
                   { label: 'System DRAM · DDR5-6000', gb: 32, bw: 96 }] },
    mac: { pools: [{ label: 'Unified memory', gb: 64, bw: 614 }] }
  };

  var css = getComputedStyle(document.documentElement);
  var C = {
    fast: css.getPropertyValue('--accent').trim(),
    slow: css.getPropertyValue('--warn').trim(),
    bad:  css.getPropertyValue('--bad').trim(),
    empty: css.getPropertyValue('--bg-raise').trim(),
    rule: css.getPropertyValue('--rule-soft').trim(),
    dim:  css.getPropertyValue('--ink-dim').trim(),
    mono: css.getPropertyValue('--mono').trim()
  };

  var paramsEl = document.getElementById('mxParams');
  var paramsOut = document.getElementById('mxParamsOut');
  var weightEl = document.getElementById('mxWeight');
  var bits = 16;

  /* ---- model size ---- */
  function weightGB() { return paramsEl.value * (bits / 8); }

  /* ---- fill pools in order, report what did not fit ---- */
  function allocate(pools, need) {
    var segs = [], rem = need;
    pools.forEach(function (p) {
      var used = Math.min(p.gb, rem);
      rem -= used;
      segs.push({ pool: p, used: used });
    });
    return { segs: segs, over: rem };
  }

  /* Time to read every weight once = the sum over pools of
     (bytes living there / that pool's bandwidth). */
  function secondsPerToken(segs) {
    return segs.reduce(function (t, s) {
      return t + (s.used > 0 ? s.used / s.pool.bw : 0);
    }, 0);
  }

  var views = ['pc', 'mac'].map(function (id) {
    return {
      id: id,
      pools: MACHINES[id].pools,
      cv: document.getElementById('cv-' + id),
      ctx: document.getElementById('cv-' + id).getContext('2d'),
      root: document.querySelector('.mach[data-mach="' + id + '"]'),
      rate: document.getElementById('rate-' + id),
      state: document.getElementById('state-' + id),
      head: 0,        /* GB read so far in the current pass */
      toks: [],       /* emitted token blocks, x in 0..1     */
      alloc: null, spt: 0
    };
  });

  function recompute() {
    var need = weightGB();
    paramsOut.textContent = paramsEl.value + 'B';
    weightEl.textContent = need.toFixed(1);

    views.forEach(function (v) {
      v.alloc = allocate(v.pools, need);
      v.spt = secondsPerToken(v.alloc.segs);

      var spilled = v.alloc.segs.length > 1 && v.alloc.segs[1].used > 0;
      var toobig = v.alloc.over > 0.001;
      v.root.classList.toggle('spilled', spilled && !toobig);
      v.root.classList.toggle('toobig', toobig);

      if (toobig) {
        v.rate.textContent = '—';
        v.state.textContent = 'Will not load — ' + v.alloc.over.toFixed(1) + ' GB short';
        v.head = 0; v.toks = [];
      } else {
        var r = 1 / v.spt;
        v.rate.textContent = r < 10 ? r.toFixed(1) : Math.round(r);
        if (spilled) {
          var pct = Math.round(v.alloc.segs[1].used / weightGB() * 100);
          v.state.textContent = pct + '% spilled to DRAM — read at 96 GB/s, not 1792';
        } else if (v.id === 'pc') {
          v.state.textContent = 'Entirely in VRAM — full 1792 GB/s';
        } else {
          v.state.textContent = 'Fits in unified memory — 614 GB/s throughout';
        }
      }
    });
  }

  /* ---- canvas ---- */
  function sizeCanvas(v) {
    var dpr = window.devicePixelRatio || 1;
    var w = v.cv.clientWidth, h = v.cv.clientHeight;
    if (!w || !h) return false;
    if (v.cv.width !== Math.round(w * dpr)) {
      v.cv.width = Math.round(w * dpr);
      v.cv.height = Math.round(h * dpr);
    }
    v.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    v.W = w; v.H = h;
    return true;
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* Canvas ignores rem, so every dimension is derived from the live root
     font size instead of hardcoded. The deck scales off min(vw,vh) for
     projector legibility and the bars have to come with it. */
  var LABEL_H, TRACK_H, ROW_GAP, STREAM_H, FONT, REM;
  function metrics() {
    REM = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    LABEL_H  = REM * 0.78;
    TRACK_H  = REM * 0.94;
    ROW_GAP  = REM * 0.50;
    STREAM_H = REM * 1.43;
    FONT     = Math.max(9, Math.round(REM * 0.55));
  }

  function drawMachine(v) {
    if (!sizeCanvas(v)) return;
    metrics();
    var ctx = v.ctx, W = v.W, H = v.H;
    ctx.clearRect(0, 0, W, H);

    var toobig = v.alloc.over > 0.001;
    var y = 0;

    v.alloc.segs.forEach(function (s, i) {
      var trackW = (s.pool.gb / SCALE_GB) * W;
      var fillW = s.pool.gb > 0 ? (s.used / s.pool.gb) * trackW : 0;
      var colour = toobig ? C.bad : (i === 0 ? C.fast : C.slow);

      ctx.font = FONT + 'px ' + C.mono;
      ctx.fillStyle = C.dim;
      ctx.textBaseline = 'top';
      ctx.fillText(s.pool.label.toUpperCase() + '  ·  ' + s.pool.gb + ' GB  ·  ' +
        s.pool.bw + ' GB/S', 0, y);

      var ty = y + LABEL_H;
      ctx.fillStyle = C.empty;
      roundRect(ctx, 0, ty, trackW, TRACK_H, REM * 0.22); ctx.fill();
      ctx.strokeStyle = C.rule; ctx.lineWidth = 1;
      roundRect(ctx, 0.5, ty + 0.5, trackW - 1, TRACK_H - 1, REM * 0.22); ctx.stroke();

      if (fillW > 0) {
        ctx.save();
        roundRect(ctx, 0, ty, Math.max(fillW, 3), TRACK_H, REM * 0.22); ctx.clip();
        ctx.fillStyle = colour;
        ctx.globalAlpha = 0.28;
        ctx.fillRect(0, ty, Math.max(fillW, 3), TRACK_H);
        ctx.globalAlpha = 1;
        /* weight blocks, so the bar reads as contents rather than a gauge */
        ctx.fillStyle = colour;
        var bw = REM * 0.28, gap = REM * 0.11;
        for (var x = REM * 0.11; x < fillW - 1; x += bw + gap) {
          ctx.globalAlpha = 0.72;
          ctx.fillRect(x, ty + TRACK_H * 0.18, Math.min(bw, fillW - 1 - x), TRACK_H * 0.64);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }
      s._ty = ty; s._trackW = trackW; s._fillW = fillW;
      y = ty + TRACK_H + ROW_GAP;
    });

    /* Unified memory has no second tier, and the empty row where the PC's
       DRAM bar sits is the architectural difference — worth drawing as an
       absence rather than leaving as blank canvas. */
    if (v.alloc.segs.length === 1) {
      ctx.font = FONT + 'px ' + C.mono;
      ctx.fillStyle = C.dim;
      ctx.globalAlpha = 0.55;
      ctx.textBaseline = 'top';
      var ghostW = (32 / SCALE_GB) * W;
      ctx.fillText('NO SEPARATE VRAM  ·  CPU AND GPU SHARE ONE POOL', 0, y);
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = C.rule; ctx.lineWidth = 1;
      ctx.strokeRect(0.5, y + LABEL_H + 0.5, ghostW - 1, TRACK_H - 1);
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    /* ---- read head ---- */
    if (!toobig && v.spt > 0) {
      var acc = 0;
      for (var i = 0; i < v.alloc.segs.length; i++) {
        var s = v.alloc.segs[i];
        if (s.used <= 0) continue;
        if (v.head <= acc + s.used) {
          var within = (v.head - acc) / s.used;         /* 0..1 of the filled part */
          var hx = within * s._fillW;
          var colour = i === 0 ? C.fast : C.slow;
          ctx.save();
          ctx.shadowColor = colour; ctx.shadowBlur = REM * 0.5;
          ctx.fillStyle = colour;
          ctx.fillRect(hx - 1, s._ty - REM * 0.17, 2, TRACK_H + REM * 0.34);
          ctx.restore();
          break;
        }
        acc += s.used;
      }
    }

    /* ---- emitted tokens ---- */
    var sy = H - STREAM_H;
    ctx.font = FONT + 'px ' + C.mono;
    ctx.fillStyle = C.dim;
    ctx.textBaseline = 'top';
    ctx.fillText('TOKENS OUT', 0, sy);

    var by = sy + REM * 0.66, bh = REM * 0.72;
    v.toks.forEach(function (t) {
      var x = t.x * W;
      if (x > W) return;
      ctx.globalAlpha = Math.max(0, 1 - t.x) * 0.75 + 0.25;
      ctx.fillStyle = toobig ? C.bad : C.fast;
      roundRect(ctx, x, by, REM * 0.5, bh, REM * 0.11); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  /* ---- animation ---- */
  var lastT = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(now - lastT, 250) / 1000;
    lastT = now;
    if (!mxSlide.classList.contains('active')) return;

    views.forEach(function (v) {
      var toobig = v.alloc.over > 0.001;
      if (!toobig) {
        /* Advance through whichever pool the head is currently inside,
           at that pool's bandwidth. This is the crawl. */
        var acc = 0, bw = 0;
        for (var i = 0; i < v.alloc.segs.length; i++) {
          var s = v.alloc.segs[i];
          if (s.used <= 0) continue;
          if (v.head <= acc + s.used) { bw = s.pool.bw; break; }
          acc += s.used;
        }
        if (!bw) bw = v.alloc.segs[0].pool.bw;
        v.head += (bw / SLOWMO) * dt;

        var total = weightGB();
        if (v.head >= total) { v.head = 0; v.toks.push({ x: 0 }); }
      }
      for (var k = v.toks.length - 1; k >= 0; k--) {
        v.toks[k].x += DRIFT * dt;
        if (v.toks[k].x > 1.05) v.toks.splice(k, 1);
      }
      drawMachine(v);
    });
  }

  /* ---- controls ---- */
  paramsEl.addEventListener('input', function () { recompute(); });
  Array.prototype.forEach.call(document.querySelectorAll('#mxBits button'),
    function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#mxBits button').forEach(function (b) {
          b.classList.remove('on');
        });
        btn.classList.add('on');
        bits = parseInt(btn.dataset.bits, 10);
        recompute();
      });
    });

  recompute();
  window.addEventListener('resize', function () { views.forEach(drawMachine); });
  document.addEventListener('deck:slide', function () { views.forEach(drawMachine); });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    views.forEach(drawMachine);
  } else {
    requestAnimationFrame(frame);
  }
}
