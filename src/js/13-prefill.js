/* ==========================================================
   PREFILL — TIME TO FIRST TOKEN, TWO MACHINES
   Both lanes run on the wall clock, unscaled. Prefill is a rate in
   tokens/sec and so is decode, so the whole thing is two stopwatches
   and there is nothing to fudge: if the Mac takes nine seconds to read
   a chapter, the room waits nine seconds.

   Rates are for an 8B model at 4-bit. The 5090 figures are measured
   llama.cpp runs; the M5 Max prefill is the conservative end of a wide
   range, because MLX exploits the M5's neural accelerators and
   llama.cpp does not yet. The slide says so on its face.
   ========================================================== */
var pfSlide = document.getElementById('s-prefill');
if (pfSlide) {
  /* Tokens of answer. Long enough that the decode phase is watchable in
     its own right after prefill ends — at 120 the faster lane finished
     writing in half a second and the 2.2x decode gap the verdict claims
     was over before anyone saw it. */
  var PF_REPLY = 260;

  var PF = [
    { id: 'pc',  pp: 10400, tg: 186 },
    { id: 'mac', pp: 900,   tg: 85  }
  ];

  var pfSend = document.getElementById('pfSend');
  var pfPrompt = 2000;

  PF.forEach(function (m) {
    m.root   = pfSlide.querySelector('.pf-lane[data-m="' + m.id + '"]');
    m.fill   = document.getElementById('pf-fill-' + m.id);
    m.state  = document.getElementById('pf-state-' + m.id);
    m.read   = document.getElementById('pf-read-' + m.id);
    m.ttft   = document.getElementById('pf-ttft-' + m.id);
    m.el     = document.getElementById('pf-el-' + m.id);
    m.stream = document.getElementById('pf-stream-' + m.id);
    document.getElementById('pf-pp-' + m.id).textContent = m.pp.toLocaleString('en-US');
    document.getElementById('pf-tg-' + m.id).textContent = m.tg;
    /* The blocks exist from the start and are only switched on. Appending
       nodes inside the animation frame is what makes a stream stutter. */
    m.blocks = [];
    for (var i = 0; i < PF_REPLY; i++) {
      var b = document.createElement('i');
      m.stream.appendChild(b);
      m.blocks.push(b);
    }
  });

  function pfSecs(m) {
    return { pre: pfPrompt / m.pp, dec: PF_REPLY / m.tg };
  }

  /* ---- paint one lane at a given elapsed time ---- */
  function pfPaint(m, t) {
    var s = pfSecs(m);
    var reading = Math.min(t, s.pre);
    var done = Math.min(Math.max(t - s.pre, 0) * m.tg, PF_REPLY);

    m.fill.style.width = (reading / s.pre * 100) + '%';
    m.read.textContent = Math.round(reading * m.pp).toLocaleString('en-US') +
      ' / ' + pfPrompt.toLocaleString('en-US') + ' read';
    m.el.textContent = Math.min(t, s.pre + s.dec).toFixed(2);

    var phase = t < s.pre ? 'read' : (done < PF_REPLY ? 'write' : 'done');
    m.root.classList.toggle('reading', phase === 'read');
    m.root.classList.toggle('writing', phase === 'write');
    m.state.textContent = phase === 'read' ? 'Reading the prompt — compute bound'
      : phase === 'write' ? 'Writing — bandwidth bound'
      : 'Done';
    m.ttft.textContent = t < s.pre ? '—' : s.pre.toFixed(2);

    var n = Math.floor(done);
    if (n !== m.lit) {
      for (var i = 0; i < PF_REPLY; i++) m.blocks[i].classList.toggle('on', i < n);
      m.lit = n;
    }
  }

  function pfReset() {
    PF.forEach(function (m) { m.lit = -1; pfPaint(m, 0); });
  }

  /* ---- the run ----
     Every run carries an id. Starting a new one (a preset click, or
     landing on the slide again) invalidates the frames still queued from
     the last, which otherwise keep painting the same lanes from a
     different t0 — two clocks writing the same readout. The active check
     stops a run that was queued a frame before the deck moved on. */
  var pfT0 = 0, pfRunning = false, pfRunId = 0;

  function pfFrame(now, id) {
    if (!pfRunning || id !== pfRunId || !pfSlide.classList.contains('active')) return;
    var t = (now - pfT0) / 1000;
    var longest = 0;
    PF.forEach(function (m) {
      var s = pfSecs(m);
      longest = Math.max(longest, s.pre + s.dec);
      pfPaint(m, t);
    });
    if (t >= longest) { pfRunning = false; return; }
    requestAnimationFrame(function (next) { pfFrame(next, id); });
  }

  function pfRun() {
    var id = ++pfRunId;
    pfRunning = false;
    pfReset();
    if (REDUCED) {                       /* jump to the finished state */
      PF.forEach(function (m) { pfPaint(m, 1e6); });
      return;
    }
    requestAnimationFrame(function (now) {
      if (id !== pfRunId || !pfSlide.classList.contains('active')) return;
      pfT0 = now; pfRunning = true;
      requestAnimationFrame(function (next) { pfFrame(next, id); });
    });
  }

  /* ---- the ratio, spelled out ---- */
  var pfVerdict = document.getElementById('pfVerdict');
  function pfSay() {
    var pc = PF[0], mac = PF[1];
    pfVerdict.innerHTML = 'The Mac is <b>' + (pc.tg / mac.tg).toFixed(1) +
      '&times;</b> behind on writing — and <b>' + (pc.pp / mac.pp).toFixed(1) +
      '&times;</b> behind on reading.';
  }
  pfSay();

  segGroup('#pfLen', function (btn) {
    pfPrompt = parseInt(btn.dataset.n, 10);
    pfRun();
  });
  pfSend.addEventListener('click', pfRun);

  /* Landing on this slide should show the thing, not a dead diagram the
     presenter has to remember to start. The deck fires its first
     'deck:slide' while running goTo() at the bottom of deck.js — before
     this file exists — so a deep link straight to this slide has to be
     caught here rather than by the listener. */
  document.addEventListener('deck:slide', function () {
    if (pfSlide.classList.contains('active')) pfRun();
    else pfRunning = false;
  });
  if (pfSlide.classList.contains('active')) pfRun();
  else pfReset();
}
