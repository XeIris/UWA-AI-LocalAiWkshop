/* ==========================================================
   SAMPLING VISUALS
   Real softmax over hand-picked logits. The numbers on screen are
   computed, not typed in, so the shapes are honest even though the
   scenario is invented.
   ========================================================== */
function softmax(logits, T) {
  var top = Math.max.apply(null, logits);
  var ex = logits.map(function (z) { return Math.exp((z - top) / T); });
  var sum = ex.reduce(function (a, b) { return a + b; }, 0);
  return ex.map(function (e) { return e / sum; });
}

/* Bars are scaled against the tallest, not against 1.0. A flattened
   distribution still fills the panel, so the SHAPE carries the
   lesson while the percentages carry the absolute values. */
var BAR_MAX = 72;

function buildBars(host, tokens) {
  host.innerHTML = '';
  return tokens.map(function (tok) {
    var bar  = document.createElement('div'); bar.className = 'sbar';
    var pct  = document.createElement('div'); pct.className = 'pct';
    var stem = document.createElement('div'); stem.className = 'stem';
    var lab  = document.createElement('div'); lab.className = 'tok'; lab.textContent = tok;
    bar.appendChild(pct); bar.appendChild(stem); bar.appendChild(lab);
    host.appendChild(bar);
    return { bar: bar, pct: pct, stem: stem, tok: lab };
  });
}

function paint(bars, probs, keptSet) {
  var peak = Math.max.apply(null, probs);
  bars.forEach(function (b, i) {
    b.stem.style.height = Math.max(1.5, (probs[i] / peak) * BAR_MAX) + '%';
    b.pct.textContent = (probs[i] * 100).toFixed(probs[i] < 0.1 ? 1 : 0) + '%';
    b.bar.classList.toggle('cut', keptSet ? !keptSet.has(i) : false);
  });
}

/* ---- temperature ---- */
var tempHost = document.getElementById('tempBars');
if (tempHost) {
  var TEMP_TOKENS = ['orange', 'red', 'pink', 'gold', 'purple', 'grey', 'green', 'blue'];
  var TEMP_LOGITS = [3.2, 2.6, 2.0, 1.5, 1.0, 0.2, -0.5, -1.0];
  var tempBars = buildBars(tempHost, TEMP_TOKENS);
  var tempSlider = document.getElementById('tempSlider');
  var tempOut = document.getElementById('tempOut');
  var tempVerdict = document.getElementById('tempVerdict');

  function drawTemp() {
    var T = tempSlider.value / 100;
    tempOut.textContent = T.toFixed(2);
    paint(tempBars, softmax(TEMP_LOGITS, T), null);
    tempVerdict.textContent =
      T < 0.35 ? 'Always the same word' :
      T < 0.8  ? 'Focused' :
      T < 1.25 ? 'Balanced' :
      T < 1.7  ? 'Loose' : 'Off the rails';
  }
  tempSlider.addEventListener('input', drawTemp);
  drawTemp();
}

/* ---- top-p vs min-p ---- */
var toppHost = document.getElementById('toppBars');
if (toppHost) {
  var SCENARIOS = {
    sure: {
      prompt: 'Prompt — “the capital of France is…”',
      tokens: ['Paris', 'Lyon', 'Nice', 'Metz', 'Brest', 'Dijon', 'Tours', 'Caen'],
      logits: [4.6, 1.5, 1.1, 0.7, 0.35, 0.0, -0.4, -0.9]
    },
    unsure: {
      prompt: 'Prompt — “she opened the door and saw a…”',
      tokens: ['man', 'room', 'light', 'dog', 'figure', 'shadow', 'box', 'girl'],
      logits: [1.75, 1.62, 1.5, 1.38, 1.25, 1.1, 0.9, 0.65]
    }
  };
  var scenario = 'sure';

  var toppBars = buildBars(toppHost, SCENARIOS.sure.tokens);
  var minpHost = document.getElementById('minpBars');
  var minpBars = buildBars(minpHost, SCENARIOS.sure.tokens);

  var minpRule = document.createElement('div');
  minpRule.className = 'rule';
  minpRule.setAttribute('data-label', 'FLOOR');
  minpHost.appendChild(minpRule);

  var toppSlider = document.getElementById('toppSlider');
  var minpSlider = document.getElementById('minpSlider');
  var toppOut = document.getElementById('toppOut');
  var minpOut = document.getElementById('minpOut');
  var toppKept = document.getElementById('toppKept');
  var minpKept = document.getElementById('minpKept');
  var cutPrompt = document.getElementById('cutPrompt');

  function drawCuts() {
    var sc = SCENARIOS[scenario];
    var probs = softmax(sc.logits, 1);
    cutPrompt.textContent = sc.prompt;

    /* top-p: walk down the ranked list until the accumulated
       probability reaches p, and keep the token that crossed it. */
    var P = toppSlider.value / 100;
    toppOut.textContent = P.toFixed(2);
    var cum = 0, keepP = new Set();
    for (var i = 0; i < probs.length; i++) {
      cum += probs[i];
      keepP.add(i);
      if (cum >= P) break;
    }
    paint(toppBars, probs, keepP);
    toppKept.textContent = keepP.size + ' kept';

    /* min-p: a height floor set as a fraction of the best token. */
    var ratio = minpSlider.value / 100;
    minpOut.textContent = ratio.toFixed(2);
    var peak = Math.max.apply(null, probs);
    var floor = peak * ratio;
    var keepM = new Set();
    probs.forEach(function (p, i) { if (p >= floor) keepM.add(i); });
    paint(minpBars, probs, keepM);
    minpKept.textContent = keepM.size + ' kept';

    var tokEl = minpHost.querySelector('.tok');
    var base = tokEl ? tokEl.offsetHeight + 7 : 24;
    minpRule.style.bottom = (base + ratio * (BAR_MAX / 100) * minpHost.clientHeight) + 'px';
  }

  function relabel() {
    var sc = SCENARIOS[scenario];
    sc.tokens.forEach(function (t, i) {
      toppBars[i].tok.textContent = t;
      minpBars[i].tok.textContent = t;
    });
  }

  toppSlider.addEventListener('input', drawCuts);
  minpSlider.addEventListener('input', drawCuts);
  Array.prototype.forEach.call(
    document.querySelectorAll('#confSeg button'),
    function (btn) {
      btn.addEventListener('click', function () {
        Array.prototype.forEach.call(
          document.querySelectorAll('#confSeg button'), function (b) {
            b.classList.remove('on');
            b.setAttribute('aria-pressed', 'false');
          });
        btn.classList.add('on');
        btn.setAttribute('aria-pressed', 'true');
        scenario = btn.dataset.conf;
        relabel();
        drawCuts();
      });
    }
  );
  relabel();
  drawCuts();
  /* Bar geometry is only measurable once the slide is laid out. */
  window.addEventListener('resize', drawCuts);
  document.addEventListener('deck:slide', drawCuts);
}
