/* ==========================================================
   WHAT A QUANT IS
   Real absmax block quantization, computed live. The codes on screen
   are the integers that would actually be written to the file, and the
   values are what dequantizing them gives back — so the error the room
   sees is the error the format really makes.
   ========================================================== */
var qzSlide = document.getElementById('s-quant');
if (qzSlide) {
  /* One block of 24. Plausible trained weights: mostly small, a few
     outliers, because it is the outliers that set the scale. */
  var QW = [
     0.0142, -0.0871,  0.2314, -0.4025,  0.0663,  0.1508,
    -0.1937,  0.5521, -0.0284,  0.3176, -0.6842,  0.0925,
     0.4413, -0.2260,  0.1071, -0.0517,  0.2842, -0.3694,
    -0.0736,  0.1629,  0.7315, -0.1183,  0.0398, -0.2571
  ];
  var QMAXABS = QW.reduce(function (m, w) { return Math.max(m, Math.abs(w)); }, 0);
  var SCALE_BITS = 16;                      /* the block's shared fp16 multiplier */
  var DRIFT_AT = 0.02;                      /* error a viewer can actually see    */

  var qzGrid   = document.getElementById('qzGrid');
  var qzStore  = document.getElementById('qzStore');
  var qzLevels = document.getElementById('qzLevels');
  var qzErr    = document.getElementById('qzErr');
  var qzBpw    = document.getElementById('qzBpw');
  var qzModel  = document.getElementById('qzModel');
  var qzLadder = document.getElementById('qzLadder');

  var qzCells = QW.map(function () {
    var cell = document.createElement('div');
    cell.className = 'qz-cell';
    var code = document.createElement('span'); code.className = 'qz-code';
    var val  = document.createElement('span'); val.className  = 'qz-val';
    cell.appendChild(code); cell.appendChild(val);
    qzGrid.appendChild(cell);
    return { cell: cell, code: code, val: val };
  });

  var qzBits = 16;
  /* Where each dot is drawn, and where it is heading. Bits changing mid
     flight just retargets; the dot never jumps. */
  var qzPos = QW.slice(), qzTarget = QW.slice(), qzAnim = false;

  /* Symmetric absmax: one scale for the block, every weight becomes a
     signed integer index. This is the whole algorithm. */
  function quantize(bits) {
    if (bits >= 16) {
      return { scale: 0, codes: QW.map(function () { return null; }), vals: QW.slice(), qmax: 0 };
    }
    var qmax = (1 << (bits - 1)) - 1;
    var scale = QMAXABS / qmax;
    var codes = QW.map(function (w) {
      return Math.max(-qmax - 1, Math.min(qmax, Math.round(w / scale)));
    });
    return { scale: scale, codes: codes, qmax: qmax,
             vals: codes.map(function (c) { return c * scale; }) };
  }

  function drawQuant() {
    var q = quantize(qzBits);
    var n = QW.length;
    var err = 0;

    qzCells.forEach(function (c, i) {
      var d = Math.abs(QW[i] - q.vals[i]);
      err += d;
      c.code.textContent = q.codes[i] === null ? '—' : (q.codes[i] > 0 ? '+' : '') + q.codes[i];
      c.val.textContent = q.vals[i].toFixed(4);
      c.cell.classList.toggle('drift', d > DRIFT_AT);
    });

    /* A "4-bit" file is 4 bits per weight PLUS the shared scale, spread
       over the block. This is the whole reason Q4_K_M is not 4.00. */
    var bpw = qzBits >= 16 ? 16 : qzBits + SCALE_BITS / n;
    var bytes = Math.ceil(bpw * n / 8);

    qzLevels.textContent = Math.pow(2, qzBits).toLocaleString();
    qzErr.textContent = '±' + (err / n).toFixed(4);
    qzBpw.textContent = bpw.toFixed(2);
    qzModel.textContent = (30 * bpw / 8).toFixed(1) + ' GB';

    qzStore.innerHTML = qzBits >= 16
      ? '24 values &times; 16 bits = <b>' + bytes + ' bytes</b> &middot; nothing shared, nothing rounded'
      : '24 codes &times; ' + qzBits + ' bits &nbsp;+&nbsp; one shared scale (16 bits) = <b>' +
        bytes + ' bytes</b> &middot; was 48';

    qzTarget = q.vals.slice();
    if (REDUCED) { qzPos = qzTarget.slice(); paintLadder(q); }
    else if (!qzAnim) { qzAnim = true; requestAnimationFrame(stepLadder); }
    else paintLadder(q);
  }

  function stepLadder() {
    var moving = false;
    for (var i = 0; i < qzPos.length; i++) {
      var d = qzTarget[i] - qzPos[i];
      if (Math.abs(d) > 0.0004) { qzPos[i] += d * 0.22; moving = true; }
      else qzPos[i] = qzTarget[i];
    }
    paintLadder(quantize(qzBits));
    if (moving && qzSlide.classList.contains('active')) requestAnimationFrame(stepLadder);
    else { qzPos = qzTarget.slice(); paintLadder(quantize(qzBits)); qzAnim = false; }
  }

  function paintLadder(q) {
    var f = fitCanvas(qzLadder);
    if (!f) return;
    var ctx = f.ctx, W = f.w, H = f.h, R = rem();
    var pad = R * 1.1;
    var span = QMAXABS * 1.12;
    function X(v) { return pad + ((v + span) / (2 * span)) * (W - pad * 2); }

    var yTop = R * 1.5, yAxis = H - R * 2.2;

    ctx.font = Math.max(9, Math.round(R * 0.55)) + 'px ' + THEME.mono;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = THEME.inkDim;
    ctx.fillText('ACTUAL WEIGHT', pad, yTop - R * 0.7);
    ctx.fillText('WHAT THE FILE CAN STORE', pad, yAxis + R * 1.5);

    /* ---- the representable values ---- */
    ctx.strokeStyle = THEME.rule; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, yAxis + 0.5); ctx.lineTo(W - pad, yAxis + 0.5); ctx.stroke();

    if (q.scale === 0) {
      /* 65,536 levels would be denser than the screen. Drawing it as a
         continuous band is not a cheat — that is what it looks like. */
      ctx.fillStyle = THEME.accent;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(pad, yAxis - R * 0.42, W - pad * 2, R * 0.84);
      ctx.globalAlpha = 1;
    } else {
      /* Sixteen levels have to read as sixteen countable slots, so the
         ticks are taller than the dots that land on them and lit brighter
         when there are few enough to count. */
      ctx.strokeStyle = THEME.accent;
      ctx.lineWidth = q.qmax > 40 ? 1 : 1.5;
      ctx.globalAlpha = q.qmax > 40 ? 0.4 : 0.9;
      ctx.beginPath();
      for (var k = -q.qmax - 1; k <= q.qmax; k++) {
        var x = Math.round(X(k * q.scale)) + 0.5;
        if (x < pad || x > W - pad) continue;
        ctx.moveTo(x, yAxis - R * 0.62); ctx.lineTo(x, yAxis + R * 0.62);
      }
      ctx.stroke();
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
    }

    /* ---- each weight, and the drop onto its nearest level ---- */
    for (var i = 0; i < QW.length; i++) {
      var x0 = X(QW[i]), x1 = X(qzPos[i]);
      var moved = Math.abs(QW[i] - qzTarget[i]) > DRIFT_AT;

      ctx.strokeStyle = moved ? THEME.warn : THEME.accentLo;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(x0, yTop); ctx.lineTo(x1, yAxis - R * 0.62);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = THEME.inkMid; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x0, yTop, R * 0.17, 0, 6.284); ctx.stroke();

      ctx.fillStyle = moved ? THEME.warn : THEME.accent;
      ctx.beginPath(); ctx.arc(x1, yAxis, R * 0.19, 0, 6.284); ctx.fill();
    }
  }

  segGroup('#qzBits', function (btn) {
    qzBits = parseInt(btn.dataset.bits, 10);
    drawQuant();
  });

  drawQuant();
  window.addEventListener('resize', function () { paintLadder(quantize(qzBits)); });
  document.addEventListener('deck:slide', function () { paintLadder(quantize(qzBits)); });
}
