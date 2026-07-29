/* ==========================================================
   THE QUANTIZATION QUALITY CLIFF
   Two curves, plotted on a categorical axis so 16-bit does not squash
   everything interesting into the left margin. The numbers are shaped
   from published perplexity/benchmark behaviour, not measured here —
   the slide says so, and so does this comment.
   ========================================================== */
var clSlide = document.getElementById('s-cliff');
if (clSlide) {
  var CL_BITS  = [2, 3, 4, 5, 6, 8, 16];
  var CL_BPW   = [3.35, 3.91, 4.83, 5.68, 6.56, 8.5, 16];   /* real GGUF cost */
  var CL_BIG   = [72, 93, 98, 99, 99.5, 99.8, 100];
  var CL_SMALL = [48, 82, 94.5, 97, 98.5, 99.5, 100];
  var CL_SAY = [
    'Broken in ways that are hard to spot. Loops, contradictions, invented facts.',
    'Noticeably duller. Only if literally nothing else fits.',
    'The sweet spot. Where almost everyone should live.',
    'Excellent. Worth the extra gigabytes if you have them.',
    'Indistinguishable from the original, and you are paying for it.',
    'Lossless for practical purposes. Twice the file, no more model.',
    'Full precision. Four times the memory for a rounding error.'
  ];
  var CL_Y0 = 40;                      /* axis floor — labelled on the chart */

  var clSlider  = document.getElementById('clSlider');
  var clCanvas  = document.getElementById('clCanvas');
  var clSide    = clCanvas.closest('.cl').querySelector('.cl-side');
  var clOut = {
    bits: document.getElementById('clBits'),
    size: document.getElementById('clSize'),
    qual: document.getElementById('clQual'),
    verdict: document.getElementById('clVerdict')
  };

  function clDraw() {
    var i = parseInt(clSlider.value, 10);
    clOut.bits.textContent = CL_BITS[i];
    clOut.size.textContent = (30 * CL_BPW[i] / 8).toFixed(1) + ' GB';
    clOut.qual.textContent = CL_BIG[i].toFixed(CL_BIG[i] % 1 ? 1 : 0) + '%';
    clOut.verdict.textContent = CL_SAY[i];
    clSide.classList.toggle('warn', CL_BITS[i] === 3);
    clSide.classList.toggle('bad', CL_BITS[i] === 2);
    clPaint(i);
  }

  function clPaint(sel) {
    var f = fitCanvas(clCanvas);
    if (!f) return;
    var ctx = f.ctx, W = f.w, H = f.h, R = rem();
    var padL = R * 2.6, padR = R * 0.9, padT = R * 1.2, padB = R * 2.2;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var n = CL_BITS.length;

    function X(i) { return padL + (i / (n - 1)) * plotW; }
    function Y(q) { return padT + (1 - (q - CL_Y0) / (100 - CL_Y0)) * plotH; }

    ctx.font = Math.max(9, Math.round(R * 0.56)) + 'px ' + THEME.mono;

    /* ---- below the floor is a hazard zone, and it is the only red ---- */
    var floorX = X(CL_BITS.indexOf(4));
    ctx.fillStyle = THEME.bad;
    ctx.globalAlpha = 0.07;
    ctx.fillRect(padL, padT, floorX - padL, plotH);
    ctx.globalAlpha = 1;

    /* ---- grid + y labels ---- */
    ctx.strokeStyle = THEME.rule; ctx.lineWidth = 1;
    ctx.fillStyle = THEME.inkDim; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    [50, 75, 100].forEach(function (q) {
      var y = Math.round(Y(q)) + 0.5;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      ctx.fillText(q + '%', padL - R * 0.5, y);
    });

    /* ---- x labels ---- */
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    CL_BITS.forEach(function (b, i) {
      ctx.fillStyle = i === sel ? THEME.accent : THEME.inkDim;
      ctx.fillText(b + '-BIT', X(i), H - padB + R * 0.55);
    });

    /* ---- the sweet-spot marker ---- */
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = THEME.ok; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(floorX, padT); ctx.lineTo(floorX, padT + plotH); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = THEME.ok; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('SWEET SPOT', floorX + R * 0.35, padT + R * 0.1);

    /* ---- curves ---- */
    function curve(data, colour, dashed) {
      ctx.save();
      if (dashed) ctx.setLineDash([5, 4]);
      ctx.strokeStyle = colour; ctx.lineWidth = 2;
      ctx.beginPath();
      data.forEach(function (q, i) { i ? ctx.lineTo(X(i), Y(q)) : ctx.moveTo(X(i), Y(q)); });
      ctx.stroke();
      ctx.restore();
      data.forEach(function (q, i) {
        ctx.fillStyle = i === sel ? colour : THEME.raise;
        ctx.strokeStyle = colour; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(X(i), Y(q), R * (i === sel ? 0.26 : 0.17), 0, 6.284);
        ctx.fill(); ctx.stroke();
      });
    }
    curve(CL_SMALL, THEME.inkMid, true);
    curve(CL_BIG, THEME.accent, false);

    /* ---- the scrubber ---- */
    ctx.strokeStyle = THEME.accent; ctx.globalAlpha = 0.35; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X(sel), padT); ctx.lineTo(X(sel), padT + plotH); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  clSlider.addEventListener('input', clDraw);
  window.addEventListener('resize', clDraw);
  document.addEventListener('deck:slide', clDraw);
  clDraw();
}
