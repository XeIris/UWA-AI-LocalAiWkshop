/* ==========================================================
   MEMORY CALCULATOR + FIT INDICATOR
   Two numbers, always both: the rule of thumb they can do in their
   head, and the file size the download page will actually show. The
   gap between them is the lesson, so it is never hidden.
   ========================================================== */
var mcSlide = document.getElementById('s-calc');
if (mcSlide) {
  /* Everything except the weights: the OS, LM Studio itself, and a KV
     cache for a short conversation. §5 is what happens when it is long. */
  var RESERVE_GB = 2.5;

  var mcParams = document.getElementById('mcParams');
  var mcMem    = document.getElementById('mcMem');
  var mcOuts = {
    params: document.getElementById('mcParamsOut'),
    mem:    document.getElementById('mcMemOut'),
    fParams: document.getElementById('mcFParams'),
    fBits:   document.getElementById('mcFBits'),
    fGb:     document.getElementById('mcFGb'),
    size:   document.getElementById('mcSize'),
    delta:  document.getElementById('mcDelta'),
    bar:    document.getElementById('mcFitBar'),
    model:  document.getElementById('mcSegModel'),
    rsv:    document.getElementById('mcSegReserve'),
    cap:    document.getElementById('mcCap'),
    verdict:document.getElementById('mcVerdict'),
    vkey:   document.getElementById('mcVKey'),
    vtext:  document.getElementById('mcVText')
  };

  var mcBits = 4, mcBpw = 4.83;

  function mcDraw() {
    var P = mcParams.value / 10;            /* billions of parameters */
    var mem = parseFloat(mcMem.value);
    var napkin = P * mcBits / 8;
    var real = P * mcBpw / 8;
    var total = real + RESERVE_GB;

    mcOuts.params.textContent = P.toFixed(1);
    mcOuts.mem.textContent = mem;
    mcOuts.fParams.textContent = P.toFixed(1);
    mcOuts.fBits.textContent = mcBits;
    mcOuts.fGb.textContent = napkin.toFixed(1);
    /* Always one decimal: the whole point of this readout is that it is
       NOT the round number the napkin gave, and rounding hides that. */
    mcOuts.size.textContent = real.toFixed(1);

    var gap = real - napkin;
    var noGap = Math.abs(gap) < 0.05;
    mcOuts.delta.textContent = noGap
      ? 'exactly what the napkin says'
      : (gap > 0 ? '+' : '−') + Math.abs(gap).toFixed(1) + ' GB vs the napkin';
    /* Amber is the surprise, so it only appears when there is one. */
    mcOuts.delta.classList.toggle('flat', noGap);

    /* The bar always shows the truth: if the model is bigger than the
       machine, the machine shrinks on screen rather than the bar lying. */
    var scale = Math.max(mem, total) * 1.04;
    mcOuts.model.style.width = (real / scale * 100) + '%';
    mcOuts.rsv.style.width = (RESERVE_GB / scale * 100) + '%';
    var capPct = mem / scale * 100;
    mcOuts.cap.style.left = capPct + '%';
    mcOuts.cap.classList.toggle('flip', capPct > 55);

    var state = total > mem ? 'over' : (total > mem * 0.85 ? 'tight' : 'ok');
    ['tight', 'over'].forEach(function (c) {
      mcOuts.bar.classList.toggle(c, state === c);
      mcOuts.verdict.classList.toggle(c, state === c);
    });

    if (state === 'over') {
      mcOuts.vkey.textContent = 'WILL NOT LOAD';
      mcOuts.vtext.textContent = 'Short by ' + (total - mem).toFixed(1) +
        ' GB. Drop a quant step, or a size class.';
    } else if (state === 'tight') {
      mcOuts.vkey.textContent = 'TIGHT';
      mcOuts.vtext.textContent = 'It fits, and nothing else does. Expect a sluggish machine.';
    } else {
      mcOuts.vkey.textContent = 'FITS';
      mcOuts.vtext.textContent = 'Room to work — and room for the context in §5.';
    }
    mcSyncPresets();
  }

  /* ---- quant scheme ---- */
  var mcBitsSeg = segGroup('#mcBits', function (btn) {
    mcBits = parseFloat(btn.dataset.bits);
    mcBpw = parseFloat(btn.dataset.bpw);
    mcDraw();
  });
  var startBits = mcBitsSeg.current();
  mcBits = parseFloat(startBits.dataset.bits);
  mcBpw = parseFloat(startBits.dataset.bpw);

  /* ---- the three that weigh the same ---- */
  var mcPresetBtns = Array.prototype.slice.call(
    document.querySelectorAll('#mcPresets button'));

  function mcSyncPresets() {
    mcPresetBtns.forEach(function (b) {
      var on = parseInt(b.dataset.p, 10) === parseInt(mcParams.value, 10) &&
               parseFloat(b.dataset.bits) === mcBits;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  mcPresetBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      mcParams.value = b.dataset.p;
      /* The tick scale repaints on 'input', so go through the event
         rather than setting .value and leaving the scale stale. */
      mcParams.dispatchEvent(new Event('input', { bubbles: true }));
      var want = mcBitsSeg.buttons.filter(function (x) {
        return x.dataset.bits === b.dataset.bits;
      })[0];
      if (want) mcBitsSeg.select(want, true);
      else mcDraw();
    });
  });

  [mcParams, mcMem].forEach(function (el) {
    el.addEventListener('input', mcDraw);
  });
  mcDraw();
}
