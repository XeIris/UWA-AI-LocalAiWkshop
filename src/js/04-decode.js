/* ==========================================================
   DECODE SPEED ESTIMATOR
   tok/s = bandwidth / model size, with the answer streamed at the
   rate it describes. The number is abstract; watching text arrive at
   3 tok/s is not.
   ========================================================== */
var dkSlide = document.getElementById('s-decode');
if (dkSlide) {
  var bwSlider = document.getElementById('bwSlider');
  var szSlider = document.getElementById('szSlider');
  var bwOut    = document.getElementById('bwOut');
  var szOut    = document.getElementById('szOut');
  var dkRate   = document.getElementById('dkRate');
  var dkNote   = document.getElementById('dkNote');
  var dkVerdict= document.getElementById('dkVerdict');
  var dkWpm    = document.getElementById('dkWpm');
  var dkText   = document.getElementById('dkText');

  /* A token averages about ¾ of an English word, so words/min is
     tok/s × 0.75 × 60. Adults read prose at roughly 240 wpm. */
  var WORDS_PER_TOKEN = 0.75, READING_WPM = 240;

  var PASSAGE = ('A local model runs entirely on the machine in front of you. ' +
    'No request leaves the building, no key is billed, and nothing stops working ' +
    'when the wifi does. The speed you are watching right now is not a benchmark ' +
    'result. It is arithmetic: the weights have to be read out of memory once for ' +
    'every single token, so the memory bus sets the pace and the rest is detail.'
  ).split(' ');

  function rate() {
    return (bwSlider.value / szSlider.value);
  }

  function verdict(r) {
    if (r < 2)    return 'Painful. You will watch it think.';
    if (r < 5.5)  return 'Slower than you read &mdash; you will be waiting.';
    if (r < 12)   return 'About reading speed.';
    if (r < 30)   return 'Comfortably faster than you read.';
    return 'Faster than you can follow.';
  }

  function draw() {
    var r = rate();
    bwOut.textContent = bwSlider.value;
    szOut.textContent = szSlider.value;
    dkRate.textContent = r < 10 ? r.toFixed(1) : Math.round(r);
    dkVerdict.innerHTML = verdict(r);
    var wpm = Math.round(r * WORDS_PER_TOKEN * 60);
    dkWpm.innerHTML = '&asymp; ' + wpm.toLocaleString() + ' words/min &middot; ' +
      (wpm / READING_WPM).toFixed(1) + '&times; reading speed';
  }

  /* ---- presets ---- */
  var presetBtns = Array.prototype.slice.call(
    document.querySelectorAll('#bwPresets button'));

  function syncPresets() {
    var hit = null;
    presetBtns.forEach(function (b) {
      var on = parseInt(b.dataset.bw, 10) === parseInt(bwSlider.value, 10);
      b.classList.toggle('on', on);
      if (on) hit = b;
    });
    dkNote.innerHTML = hit ? hit.dataset.note : 'Custom &mdash; drag to a real machine above';
  }

  presetBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      bwSlider.value = b.dataset.bw;
      /* Let the tick scale repaint itself; it listens for 'input'. */
      bwSlider.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  [bwSlider, szSlider].forEach(function (el) {
    el.addEventListener('input', function () { draw(); syncPresets(); restart(); });
  });

  /* ---- streaming text ---- */
  var shown = 0, acc = 0, last = 0, holding = 0;
  var HOLD_MS = 1100;                       /* pause before looping   */
  var reducedMo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function restart() { shown = 0; acc = 0; holding = 0; }

  function render() {
    var html = '';
    for (var i = 0; i < shown; i++) html += '<span class="tk">' + PASSAGE[i] + '</span> ';
    dkText.innerHTML = html + '<span class="caret"></span>';
  }

  function tick(now) {
    requestAnimationFrame(tick);
    if (!dkSlide.classList.contains('active')) { last = now; return; }
    var dt = Math.min(now - last, 250) / 1000;   /* clamp tab-switch jumps */
    last = now;

    if (holding > 0) { holding -= dt * 1000; if (holding <= 0) { restart(); render(); } return; }

    acc += rate() * dt;
    if (acc >= 1) {
      var add = Math.floor(acc);
      acc -= add;
      shown = Math.min(PASSAGE.length, shown + add);
      render();
      if (shown >= PASSAGE.length) holding = HOLD_MS;
    }
  }

  draw();
  syncPresets();
  if (reducedMo) {
    /* Static full passage: the number still teaches, the motion is optional. */
    shown = PASSAGE.length;
    render();
  } else {
    render();
    requestAnimationFrame(tick);
  }
}
