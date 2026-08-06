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
  /* 30B-class with GQA, matching the previous slide: 2 × 48 layers ×
     8 KV heads × 128 head dim = 96 KB per token per byte of precision. */
  var BG_PER_TOKEN_FP16 = 2 * 48 * 8 * 128 * 2;
  var BG_OVERHEAD = 2;                     /* OS + runtime, GB */
  var GIB = 1073741824;

  var bgMem = document.getElementById('bgMem');
  var bgW   = document.getElementById('bgWeights');
  var bgCtx = document.getElementById('bgCtx');
  var bgBytes = 2;

  var bgEl = {
    memOut: document.getElementById('bgMemOut'),
    wOut:   document.getElementById('bgWeightsOut'),
    ctxOut: document.getElementById('bgCtxOut'),
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
     el.clientWidth, because the width transition is still running. */
  function bgSeg(el, lab, gb, scale, text) {
    var pct = gb / scale * 100;
    el.style.width = pct + '%';
    if (lab) {
      lab.textContent = text;
      var room = pct / 100 * el.parentNode.clientWidth;
      el.classList.toggle('narrow', room < lab.offsetWidth + 12);
    } else {
      el.classList.toggle('narrow', pct < 9);
    }
  }

  function bgDraw() {
    var mem = parseFloat(bgMem.value);
    var weights = parseFloat(bgW.value);
    var ctxLen = BG_CTX[parseInt(bgCtx.value, 10)];
    var perTok = BG_PER_TOKEN_FP16 * (bgBytes / 2);
    var kv = ctxLen * perTok / GIB;
    var total = weights + kv + BG_OVERHEAD;

    bgEl.memOut.textContent = mem;
    bgEl.wOut.textContent = weights;
    bgEl.ctxOut.textContent = fmtTokens(ctxLen);

    var scale = Math.max(total, mem) * 1.03;
    bgSeg(bgEl.segW, bgEl.labW, weights, scale, weights.toFixed(1) + ' GB');
    bgSeg(bgEl.segK, bgEl.labK, kv, scale, kv.toFixed(kv < 10 ? 1 : 0) + ' GB cache');
    bgSeg(bgEl.segO, null, BG_OVERHEAD, scale);
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

  [bgMem, bgW, bgCtx].forEach(function (el) {
    el.addEventListener('input', bgDraw);
  });
  /* The bar is CSS, but whether a label fits inside its own fill is a
     pixel measurement, so it has to be taken again at the new width. */
  window.addEventListener('resize', bgDraw);
  bgDraw();
}
