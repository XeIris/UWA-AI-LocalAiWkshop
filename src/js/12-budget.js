/* ==========================================================
   THE CONTEXT CEILING
   One bar, drawn against the machine rather than against itself. When
   the total exceeds capacity the scale grows and the bar bursts past
   the capacity marker — the marker never moves to accommodate it,
   because in real life the RAM does not either.
   ========================================================== */
var bgSlide = document.getElementById('s-budget');
if (bgSlide) {
  var BG_CTX = [1024, 2048, 4096, 8192, 16384, 32768,
                65536, 131072, 262144, 524288, 1048576];
  var BG_OVERHEAD = 2;                     /* OS + runtime, GB */
  var GIB = 1073741824;

  /* ---- what a parameter count implies -----------------------------
     Both halves of the bar come off the parameter slider, and they are
     NOT the same function of it. The weights are params × bpw ÷ 8 and
     the quant buttons move them. The cache is 2 × layers × KV width ×
     bytes and the quant buttons do not touch it at all — that is the
     distinction the slide is for, and it is why the cache has a
     precision control of its own.

     Layers and KV width are interpolated in log(params) between real
     released models. The anchors are chosen so the three model classes
     on the previous slide land on exactly their published figures —
     1B → 26 KB/token, 8B → 128, 30B → 192 — and 70B closes the top end
     at Llama 3.3's 320. In between it is an estimate and the slide says
     so: the KV width of a 4B is a design choice, not a consequence of
     its size, and two 4B models can differ by half again.

     KV width is the total across the KV heads (8 heads × 128 head dim =
     1024, which is remarkably constant from about 2B upward). Only the
     small end genuinely runs narrow: Gemma 3 1B keeps one KV head, and
     Qwen2.5 0.5B two 64-wide ones.

     The table starts at 0.5B because the slider does. It used to start
     at 1B and clamp below it, which left the bottom tenth of the slider
     travel doing nothing at all — a control position that changes no
     number on screen is worse than no control.

     A caution for anyone extending this downward: the sub-1B range is
     where the "KV width is a design choice" caveat bites hardest. Qwen3
     0.6B runs the full 8 × 128 and costs 112 KB per token, more than
     four times Gemma 3 1B despite being smaller. Anchoring on it would
     make the slider run 112 → 26 → 112 KB across its first three stops,
     which reads as a broken control rather than as real variance. */
  var BG_ARCH = [
    { p: 0.5, l: 24, kw: 128 },            /* Qwen2.5 0.5B — 2 KV × 64 */
    { p: 1,  l: 26, kw: 256 },             /* Gemma 3 1B */
    { p: 2,  l: 28, kw: 1024 },            /* Qwen3 1.7B */
    { p: 8,  l: 32, kw: 1024 },            /* Llama 3.1 8B */
    { p: 30, l: 48, kw: 1024 },            /* the deck's 30B-class */
    { p: 70, l: 80, kw: 1024 }             /* Llama 3.3 70B */
  ];

  /* Rounded to things a config.json could actually say: a whole number
     of layers, and a KV width that is a multiple of one 128-wide head. */
  function bgArch(P) {
    var a = BG_ARCH[0], b = BG_ARCH[BG_ARCH.length - 1], i;
    if (P <= a.p) return { l: a.l, kw: a.kw };
    if (P >= b.p) return { l: b.l, kw: b.kw };
    for (i = 0; i < BG_ARCH.length - 1; i++) {
      if (P <= BG_ARCH[i + 1].p) { a = BG_ARCH[i]; b = BG_ARCH[i + 1]; break; }
    }
    var t = Math.log(P / a.p) / Math.log(b.p / a.p);
    return {
      l: Math.round(a.l + (b.l - a.l) * t),
      kw: Math.round((a.kw + (b.kw - a.kw) * t) / 128) * 128
    };
  }

  var bgParams = document.getElementById('bgParams');
  var bgMem = document.getElementById('bgMem');
  var bgCtx = document.getElementById('bgCtx');
  var bgBytes = 2;
  var bgBpw = 4.83;

  var bgEl = {
    memOut: document.getElementById('bgMemOut'),
    pOut:   document.getElementById('bgParamsOut'),
    wOut:   document.getElementById('bgWeightsOut'),
    ctxOut: document.getElementById('bgCtxOut'),
    perTok: document.getElementById('bgPerTok'),
    arch:   document.getElementById('bgArch'),
    bar:    document.querySelector('.bg-bar'),
    segW:   document.getElementById('bgSegW'),
    segK:   document.getElementById('bgSegK'),
    segO:   document.getElementById('bgSegO'),
    labW:   document.getElementById('bgLabW'),
    labK:   document.getElementById('bgLabK'),
    cap:    document.getElementById('bgCap'),
    capLab: document.getElementById('bgCapLab'),
    out:    document.querySelector('.bg-out'),
    total:  document.getElementById('bgTotal'),
    pct:    document.getElementById('bgPct'),
    max:    document.getElementById('bgMax'),
    verdict:document.getElementById('bgVerdict'),
    vkey:   document.getElementById('bgVKey'),
    vtext:  document.getElementById('bgVText')
  };

  /* A segment's label is hidden when the segment is too small to hold
     it — measured, not guessed at with a percentage. The old `pct < 9`
     let "6.0 GB cache" stay visible in a segment narrower than the
     words: the label overflowed its own fill and finished on top of the
     weights block, where it is --ink on solid cyan and simply cannot be
     read. Measure against the width the segment is heading for, not
     el.clientWidth, because the width transition is still running.

     trackW is passed in rather than read off el.parentNode here: reading
     a layout property immediately after writing style.width forces a
     synchronous reflow, and doing that once per segment turns one into
     three on every drag of a slider. */
  function bgSeg(el, lab, gb, scale, trackW, text) {
    var pct = gb / scale * 100;
    el.style.width = pct + '%';
    if (lab) {
      lab.textContent = text;
      el.classList.toggle('narrow', pct / 100 * trackW < lab.offsetWidth + 12);
    } else {
      el.classList.toggle('narrow', pct < 9);
    }
  }

  function bgDraw() {
    var P = bgParams.value / 10;             /* billions of parameters */
    var mem = parseFloat(bgMem.value);
    var weights = P * bgBpw / 8;
    var ctxLen = BG_CTX[parseInt(bgCtx.value, 10)];
    var arch = bgArch(P);
    /* 2 (one key, one value) × layers × KV width × bytes — the previous
       slide's equation, with the KV heads and the head dim collapsed
       into the one width they multiply out to. */
    var perTok = 2 * arch.l * arch.kw * bgBytes;
    var kv = ctxLen * perTok / GIB;
    var total = weights + kv + BG_OVERHEAD;

    bgEl.memOut.textContent = mem;
    bgEl.pOut.textContent = P.toFixed(1);
    bgEl.wOut.textContent = weights.toFixed(1);
    bgEl.ctxOut.textContent = fmtTokens(ctxLen);
    /* A 1B at 8-bit KV is 13 KB per token and a 70B at FP16 is 320 —
       three figures apart, so round rather than truncate to whole KB. */
    bgEl.perTok.textContent = Math.round(perTok / 1024) + ' KB';
    bgEl.arch.textContent = arch.l + ' layers × ' + arch.kw + ' KV width';

    var scale = Math.max(total, mem) * 1.03;
    /* Read once, before anything writes a width. */
    var trackW = bgEl.segW.parentNode.clientWidth;
    bgSeg(bgEl.segW, bgEl.labW, weights, scale, trackW, weights.toFixed(1) + ' GB');
    bgSeg(bgEl.segK, bgEl.labK, kv, scale, trackW, kv.toFixed(kv < 10 ? 1 : 0) + ' GB cache');
    bgSeg(bgEl.segO, null, BG_OVERHEAD, scale, trackW);
    var capPct = mem / scale * 100;
    bgEl.cap.style.left = capPct + '%';
    bgEl.cap.classList.toggle('flip', capPct > 55);
    bgEl.capLab.textContent = mem + ' GB installed';

    bgEl.total.textContent = total < 100 ? total.toFixed(1) : Math.round(total);
    bgEl.pct.textContent = Math.round(total / mem * 100) + '%';

    /* The headroom left for cache after the weights and the OS, turned
       back into tokens. This is the number people actually want. */
    var room = (mem - weights - BG_OVERHEAD) * GIB;
    bgEl.max.textContent = room <= 0 ? '—' : fmtTokens(Math.floor(room / perTok));

    var state = total > mem ? 'over' : (total > mem * 0.9 ? 'tight' : 'ok');
    ['tight', 'over'].forEach(function (c) {
      bgEl.bar.classList.toggle(c, state === c);
      bgEl.out.classList.toggle(c, state === c);
      bgEl.verdict.classList.toggle(c, state === c);
    });

    if (state === 'over') {
      bgEl.vkey.textContent = 'OVER BY ' + (total - mem).toFixed(0) + ' GB';
      bgEl.vtext.textContent = room <= 0
        ? 'The weights alone do not fit. The context is academic.'
        : 'Refuses to allocate, or crawls through swap until you kill it.';
    } else if (state === 'tight') {
      bgEl.vkey.textContent = 'TIGHT';
      bgEl.vtext.textContent = 'Allocates, then fights the OS for what is left.';
    } else {
      bgEl.vkey.textContent = 'FITS';
      bgEl.vtext.textContent = 'Comfortable. Keep talking.';
    }
  }

  var bgPrecSeg = segGroup('#bgPrec', function (b) { bgBytes = +b.dataset.bytes; bgDraw(); });
  bgBytes = +bgPrecSeg.current().dataset.bytes;
  var bgQuantSeg = segGroup('#bgQuant', function (b) { bgBpw = +b.dataset.bpw; bgDraw(); });
  bgBpw = +bgQuantSeg.current().dataset.bpw;

  [bgParams, bgMem, bgCtx].forEach(function (el) {
    el.addEventListener('input', bgDraw);
  });
  /* The bar is CSS, but whether a label fits inside its own fill is a
     pixel measurement, so it has to be taken again at the new width. */
  window.addEventListener('resize', bgDraw);
  bgDraw();
}
