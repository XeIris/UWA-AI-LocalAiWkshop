/* ==========================================================
   KV CACHE — THE FORMULA AND THE STRAIGHT LINE
   Every term in the on-screen equation is read from the controls, so
   the formula is not an illustration of the arithmetic; it is the
   arithmetic. KV sizes use binary units throughout — 128 KB/token and
   4 GB at 32k are the figures people will meet elsewhere.
   ========================================================== */
var kvSlide = document.getElementById('s-kv');
if (kvSlide) {
  var KV_MAX_CTX = 131072;                 /* chart x-axis: 0 → 128k */
  var kvCfg = { l: 32, kv: 8, q: 32, d: 128, w: 4.9 };
  var kvGqaOn = true, kvBytes = 2;

  var kvCanvas = document.getElementById('kvCanvas');
  var kvEl = {
    l: document.getElementById('kvL'), h: document.getElementById('kvH'),
    d: document.getElementById('kvD'), b: document.getElementById('kvB'),
    per: document.getElementById('kvPer'),
    perUnit: document.getElementById('kvPerUnit'),
    perK: document.getElementById('kvPerK'),
    at32: document.getElementById('kv32'),
    ratio: document.getElementById('kvRatio')
  };

  function kvHeads() { return kvGqaOn ? kvCfg.kv : kvCfg.q; }

  /* 2 (one key, one value) × layers × KV heads × head dim × bytes. */
  function kvPerToken() { return 2 * kvCfg.l * kvHeads() * kvCfg.d * kvBytes; }

  function kvGB(tokens) { return tokens * kvPerToken() / 1073741824; }

  function kvDraw() {
    var per = kvPerToken();
    kvEl.l.textContent = kvCfg.l;
    kvEl.h.textContent = kvHeads();
    kvEl.d.textContent = kvCfg.d;
    kvEl.b.textContent = kvBytes;

    var perKB = per / 1024;
    kvEl.per.textContent = perKB >= 1024
      ? (perKB / 1024).toFixed(1) : Math.round(perKB);
    /* Addressed by id rather than by DOM position: without GQA a 30B
       crosses into megabytes, so this label really does change, and it
       must not start pointing at whatever else lands next to it. */
    kvEl.perUnit.textContent = perKB >= 1024 ? 'MB per token' : 'KB per token';

    kvEl.perK.textContent = kvGB(1000).toFixed(2) + ' GB';
    var at32 = kvGB(32768);
    kvEl.at32.textContent = at32.toFixed(1) + ' GB';
    kvEl.ratio.textContent = (at32 / kvCfg.w).toFixed(1) + '×';
    kvPaint();
  }

  function kvPaint() {
    var f = fitCanvas(kvCanvas);
    if (!f) return;
    var ctx = f.ctx, W = f.w, H = f.h, R = rem();
    var padL = R * 2.8, padR = R * 0.8, padT = R * 0.8, padB = R * 1.9;
    var plotW = W - padL - padR, plotH = H - padT - padB;

    var top = Math.max(kvCfg.w + kvGB(KV_MAX_CTX), kvCfg.w * 2) * 1.08;
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

    /* ---- the cache, as the gap between weights and total ---- */
    ctx.beginPath();
    ctx.moveTo(X(0), Y(kvCfg.w));
    ctx.lineTo(X(KV_MAX_CTX), Y(kvCfg.w + kvGB(KV_MAX_CTX)));
    ctx.lineTo(X(KV_MAX_CTX), Y(kvCfg.w));
    ctx.closePath();
    ctx.fillStyle = THEME.accent; ctx.globalAlpha = 0.14; ctx.fill();
    ctx.globalAlpha = 1;

    /* weights: flat, and that is the point */
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = THEME.inkMid; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(X(0), Y(kvCfg.w)); ctx.lineTo(X(KV_MAX_CTX), Y(kvCfg.w));
    ctx.stroke();
    ctx.restore();

    /* total: dead straight, sloping up */
    ctx.strokeStyle = THEME.accent; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(X(0), Y(kvCfg.w));
    ctx.lineTo(X(KV_MAX_CTX), Y(kvCfg.w + kvGB(KV_MAX_CTX)));
    ctx.stroke();

    ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = THEME.inkMid;
    ctx.fillText('WEIGHTS — FIXED', X(0) + R * 0.4, Y(kvCfg.w) - R * 0.25);
    ctx.fillStyle = THEME.accent;
    ctx.fillText('+ KV CACHE', X(KV_MAX_CTX * 0.42),
      Y(kvCfg.w + kvGB(KV_MAX_CTX * 0.42)) - R * 0.35);

    /* ---- the 32k marker, because that is the default people ship ---- */
    var mx = X(32768), my = Y(kvCfg.w + kvGB(32768));
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = THEME.accent; ctx.globalAlpha = 0.4; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx, padT + plotH); ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.fillStyle = THEME.accent;
    ctx.beginPath(); ctx.arc(mx, my, R * 0.2, 0, 6.284); ctx.fill();
  }

  function kvUseModel(btn) {
    kvCfg = {
      l: +btn.dataset.l, kv: +btn.dataset.kv, q: +btn.dataset.q,
      d: +btn.dataset.d, w: +btn.dataset.w
    };
  }

  /* State is read back off the initially-selected buttons rather than
     duplicated as literals up top — one place to be wrong instead of two. */
  var kvModelSeg = segGroup('#kvModel', function (b) { kvUseModel(b); kvDraw(); });
  var kvGqaSeg = segGroup('#kvGqa', function (b) { kvGqaOn = b.dataset.gqa === '1'; kvDraw(); });
  var kvPrecSeg = segGroup('#kvPrec', function (b) { kvBytes = +b.dataset.bytes; kvDraw(); });

  kvUseModel(kvModelSeg.current());
  kvGqaOn = kvGqaSeg.current().dataset.gqa === '1';
  kvBytes = +kvPrecSeg.current().dataset.bytes;
  kvDraw();
  window.addEventListener('resize', kvPaint);
  document.addEventListener('deck:slide', kvPaint);
}
