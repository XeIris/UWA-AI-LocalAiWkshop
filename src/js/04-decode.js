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

  /* Long on purpose. At the slow end of the slider this passage is the
     whole demonstration and the room needs time to get uncomfortable
     watching it; at the fast end it has to still be running when the
     presenter finishes the sentence about it. Roughly 300 words, which
     is about eight seconds at 41 tok/s and about two minutes at 3. */
  var PASSAGE = ('A local model runs entirely on the machine in front of you. ' +
    'No request leaves the building, no key is billed, and nothing stops working ' +
    'when the wifi does. The speed you are watching right now is not a benchmark ' +
    'result and it is not a setting anyone chose. It is arithmetic. To produce one ' +
    'token — roughly three quarters of a word — the machine has to read every ' +
    'single weight in the model out of memory, run the arithmetic, and throw the ' +
    'result away. Then it does exactly the same thing again for the next token, and ' +
    'the one after that, all the way to the end of this paragraph. Nothing is ' +
    'cached between tokens, because nothing can be: the weights are all needed ' +
    'every time. So the question is never how fast the processor is. The question ' +
    'is how fast the memory can hand the weights over, and how many gigabytes of ' +
    'them there are to hand over. Divide the second into the first and you have the ' +
    'number in the readout, which is why a bigger model is slower in almost exact ' +
    'proportion to how much bigger it is. Halve the file and you double the speed. ' +
    'Double the file and you halve it. This is also why a machine with modest ' +
    'compute but very fast memory — a Mac, for instance — writes text far quicker ' +
    'than its specification sheet suggests, and why a powerful graphics card that ' +
    'has run out of video memory suddenly feels broken: the moment part of the ' +
    'model spills into ordinary system RAM, every token has to wait on the slowest ' +
    'pool it touches. The formula does not care which machine you own. It only ' +
    'cares about bytes and bandwidth, and it has been the reason behind every ' +
    'number on the last three slides.'
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
    dkWpm.innerHTML = 'est. &asymp; ' + wpm.toLocaleString() + ' words/min &middot; ' +
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
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
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
    el.addEventListener('input', function () {
      draw(); syncPresets();
      /* Under reduced motion no tick() loop runs, so restart() would zero
         `shown` with nothing left to re-render — blanking the passage for
         the rest of the session the first time anyone drags a slider.
         Show the whole passage instead; the readout still carries the lesson. */
      if (reducedMo) { shown = PASSAGE.length; render(); }
      else restart();
    });
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
    /* The box is fixed and the script outruns it. Follow the tail, so
       what the room watches is always the words being written now. */
    dkText.scrollTop = dkText.scrollHeight;
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
