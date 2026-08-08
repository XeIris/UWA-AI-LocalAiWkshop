/* ==========================================================
   §2 — THE NEXT-TOKEN LOOP
   The deck's first mechanical statement of what the model does, and
   the setup for the two sampling slides that follow it. Same prompt
   as the temperature slide, and deliberately the same bar chart —
   this is that picture before anyone touches a knob.

   Every step below carries its own candidate logits, and the heights
   on screen are softmax'd from them at T=1 by the shared helpers in
   01-sampling.js. So the shapes are honest even though the scenario
   is invented: a confident step really is peaked and a torn one
   really is flat, and the two steps where the sampler takes the
   RUNNER-UP (k: 1) are the reason the next slide has a slider.

   Two things the token list has to teach on its own:
     · "deeper" arrives as " deep" + "er", "drained" as " dra" +
       "ined". A word is not a token, which is the whole answer to
       the strawberry prompt on the previous slide.
     · the run ends because the model emits an end token, not
       because it ran out of things to say.

   Clock is a setInterval, for the reason spelled out at length in
   17-chat.js: this slide only inserts DOM nodes, so it gains nothing
   from rAF and would be silently frozen by it on a mirrored or
   backgrounded display. Wound on arrival, cleared on departure.
   ========================================================== */
var lpSlide = document.getElementById('s-loop');
if (lpSlide) {
  var lpToks  = document.getElementById('lpToks');
  var lpBars  = document.getElementById('lpBars');
  var lpCount = document.getElementById('lpCount');
  var lpStage = document.getElementById('lpStage');
  var lpPickL = document.getElementById('lpPick');
  var lpHint  = document.getElementById('lpHint');
  var lpPlayB = document.getElementById('lpPlay');
  var lpStepB = document.getElementById('lpStepBtn');
  var lpRepB  = document.getElementById('lpReplay');
  var lpStages = document.getElementById('lpStages');

  /* The prompt, already tokenized. sp = starts a new word. */
  var LP_PROMPT = [
    { t: 'the',    sp: 1 }, { t: 'sky',   sp: 1 }, { t: 'at', sp: 1 },
    { t: 'sunset', sp: 1 }, { t: 'turns', sp: 1 }
  ];

  /* t  the token committed        k  index of it in c
     c  candidates (6 of ~260,000) l  logits, softmax'd at T=1        */
  var LP = [
    { t: 'orange', sp: 1, k: 0, c: ['orange', 'red', 'pink', 'gold', 'grey', 'purple'],
      l: [3.2, 2.6, 2.0, 1.5, 0.6, 0.2] },
    { t: ',', sp: 0, k: 0, c: [',', 'and', '.', '—', 'in', 'before'],
      l: [2.9, 2.3, 1.7, 1.4, 0.7, 0.2] },
    /* runner-up: the sampler is sampling, not taking the maximum */
    { t: 'then', sp: 1, k: 1, c: ['and', 'then', 'before', 'fading', 'but', 'with'],
      l: [2.6, 2.5, 1.6, 1.3, 0.8, 0.4] },
    { t: 'a', sp: 1, k: 0, c: ['a', 'deep', 'red', 'the', 'into', 'slowly'],
      l: [2.8, 1.9, 1.5, 1.1, 0.7, 0.3] },
    { t: 'deep', sp: 1, k: 0, c: ['deep', 'dark', 'bruised', 'soft', 'dusty', 'rich'],
      l: [2.7, 2.1, 1.4, 1.2, 0.9, 0.6] },
    /* the split: "deeper" is two tokens */
    { t: 'er', sp: 0, k: 0, c: ['er', 'ening', 'red', 'blue', 'est', 'violet'],
      l: [2.4, 1.6, 1.5, 1.0, 0.6, 0.4] },
    { t: 'red', sp: 1, k: 0, c: ['red', 'purple', 'blue', 'crimson', 'orange', 'violet'],
      l: [3.4, 2.0, 1.5, 1.2, 0.9, 0.5] },
    { t: ',', sp: 0, k: 0, c: [',', '.', 'and', 'that', '—', 'as'],
      l: [2.7, 2.2, 1.9, 1.0, 0.9, 0.5] },
    { t: 'and', sp: 1, k: 0, c: ['and', 'until', 'before', 'then', 'with', 'as'],
      l: [2.9, 1.8, 1.6, 1.4, 0.9, 0.6] },
    { t: 'by', sp: 1, k: 0, c: ['by', 'the', 'then', 'soon', 'within', 'after'],
      l: [2.2, 2.1, 1.7, 1.3, 0.8, 0.5] },
    { t: 'the', sp: 1, k: 0, c: ['the', 'nightfall', 'dark', 'morning', 'now', 'evening'],
      l: [3.1, 1.6, 1.4, 1.0, 0.7, 0.4] },
    { t: 'time', sp: 1, k: 0, c: ['time', 'sun', 'light', 'stars', 'first', 'edge'],
      l: [2.6, 2.2, 1.9, 1.1, 0.8, 0.5] },
    { t: 'it', sp: 1, k: 0, c: ['it', 'the', 'you', 'they', 'we', 'night'],
      l: [3.0, 2.0, 1.4, 0.9, 0.7, 0.4] },
    { t: 'reaches', sp: 1, k: 0, c: ['reaches', 'gets', 'touches', 'sinks', 'falls', 'meets'],
      l: [2.5, 2.0, 1.8, 1.4, 1.0, 0.7] },
    { t: 'the', sp: 1, k: 0, c: ['the', 'those', 'our', 'its', 'a', 'distant'],
      l: [3.3, 1.5, 1.2, 1.0, 0.8, 0.5] },
    /* runner-up again, and this one is nearly a coin toss — the flat
       shape is the argument for min-p two slides later */
    { t: 'hills', sp: 1, k: 1, c: ['horizon', 'hills', 'sea', 'rooftops', 'trees', 'water'],
      l: [2.6, 2.5, 1.9, 1.5, 1.2, 0.9] },
    { t: 'the', sp: 1, k: 1, c: [',', 'the', 'it', 'everything', 'all', 'only'],
      l: [2.4, 2.3, 1.3, 1.0, 0.8, 0.5] },
    { t: 'last', sp: 1, k: 0, c: ['last', 'light', 'sky', 'colour', 'whole', 'final'],
      l: [2.8, 2.1, 1.5, 1.2, 0.9, 0.6] },
    { t: 'of', sp: 1, k: 0, c: ['of', 'light', 'bit', 'traces', 'warmth', 'embers'],
      l: [3.4, 1.4, 1.2, 0.9, 0.7, 0.5] },
    { t: 'the', sp: 1, k: 0, c: ['the', 'it', 'that', 'its', 'any', 'day'],
      l: [3.2, 1.5, 1.1, 0.9, 0.6, 0.4] },
    { t: 'light', sp: 1, k: 0, c: ['light', 'colour', 'day', 'sun', 'warmth', 'glow'],
      l: [3.0, 2.2, 1.8, 1.4, 1.1, 0.8] },
    { t: 'has', sp: 1, k: 0, c: ['has', 'drains', 'is', 'bleeds', 'slips', 'fades'],
      l: [2.4, 2.2, 1.9, 1.3, 1.0, 0.8] },
    /* the second split, and the candidate list is honestly mixed —
       a vocabulary holds word fragments and whole words side by side */
    { t: 'dra', sp: 1, k: 0, c: ['dra', 'fa', 'bled', 'gone', 'slipped', 'left'],
      l: [2.3, 1.8, 1.5, 1.3, 0.9, 0.6] },
    { t: 'ined', sp: 0, k: 0, c: ['ined', 'ins', 'ining', 'wn', 'ined,', 'ined.'],
      l: [3.1, 1.6, 1.2, 0.8, 0.6, 0.4] },
    { t: 'out', sp: 1, k: 0, c: ['out', 'away', 'from', 'off', 'down', 'into'],
      l: [2.9, 2.0, 1.6, 1.1, 0.8, 0.5] },
    { t: 'of', sp: 1, k: 0, c: ['of', 'from', 'over', 'behind', 'into', 'past'],
      l: [3.5, 1.6, 1.2, 0.9, 0.7, 0.4] },
    { t: 'the', sp: 1, k: 0, c: ['the', 'its', 'that', 'a', 'those', 'every'],
      l: [3.4, 1.3, 1.0, 0.8, 0.6, 0.4] },
    { t: 'sky', sp: 1, k: 0, c: ['sky', 'west', 'world', 'day', 'clouds', 'air'],
      l: [2.7, 2.3, 1.7, 1.4, 1.0, 0.7] },
    { t: '.', sp: 0, k: 0, c: ['.', ',', 'entirely', 'at', '…', 'and'],
      l: [3.3, 1.5, 1.3, 0.9, 0.7, 0.5] },
    /* the loop stops because a token says so */
    { t: '<end>', sp: 1, k: 0, end: 1, c: ['<end>', 'newline', 'The', 'It', 'Then', 'A'],
      l: [3.0, 1.9, 1.6, 1.2, 0.9, 0.6] }
  ];

  var lpBarSet = buildBars(lpBars, LP[0].c);

  /* A continuation token is drawn butted against the one before it, so
     "deep|er" reads as one word in two pieces without a caption. */
  function lpChip(tok, sp, cls) {
    var el = document.createElement('span');
    el.className = 'lp-tok' + (sp ? '' : ' cont') + (cls ? ' ' + cls : '');
    el.textContent = tok;
    lpToks.appendChild(el);
    return el;
  }

  function lpStageOn(name) {
    Array.prototype.forEach.call(lpStages.children, function (s) {
      s.classList.toggle('on', s.dataset.st === name);
    });
  }

  var LP_LABEL = { tok: 'Chopping into tokens', pred: 'Scoring the whole vocabulary',
                   samp: 'Drawing one', app: 'Adding it to the end' };

  /* ---- the three phases of one pass ---- */
  function lpPredict(i) {
    var s = LP[i];
    s.c.forEach(function (c, j) {
      /* A leading ellipsis marks a token that glues onto the previous
         word rather than starting a new one. */
      lpBarSet[j].tok.textContent = (s.sp ? '' : '…') + c;
    });
    paint(lpBarSet, softmax(s.l, 1), null);
    lpBarSet.forEach(function (b) { b.bar.classList.remove('pick'); });
    lpStageOn('pred');
    lpStage.textContent = LP_LABEL.pred;
    lpPickL.innerHTML = '&nbsp;';
  }
  function lpSample(i) {
    var s = LP[i];
    lpBarSet[s.k].bar.classList.add('pick');
    lpStageOn('samp');
    lpStage.textContent = LP_LABEL.samp;
    lpPickL.textContent = (s.sp ? '' : '…') + s.c[s.k];
  }
  function lpAppend(i) {
    var s = LP[i];
    var prev = lpToks.querySelector('.fresh');
    if (prev) prev.classList.remove('fresh');
    lpChip(s.t, s.sp, 'gen fresh' + (s.end ? ' end' : ''));
    lpCount.textContent = (LP_PROMPT.length + i + 1) + ' tokens';
    lpStageOn('app');
    lpStage.textContent = LP_LABEL.app;
  }

  /* ---- clock ---- */
  var LP_PHASE = [180, 160, 150];         /* predict, sample, append (ms) */
  var lpI = 0, lpPh = 0, lpAcc = 0, lpTimer = null, lpPlaying = false, lpDone = false;
  var lpReduced = window.matchMedia &&
                  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function lpEnter(ph) {
    lpPh = ph; lpAcc = 0;
    if (ph === 0) lpPredict(lpI);
    else if (ph === 1) lpSample(lpI);
    else lpAppend(lpI);
  }

  function lpAdvance() {
    if (lpPh < 2) { lpEnter(lpPh + 1); return; }
    lpI++;
    if (lpI >= LP.length) lpFinish();
    else lpEnter(0);
  }

  function lpFinish() {
    lpDone = true;
    lpSetPlaying(false);
    lpStageOn(null);
    lpStage.textContent = 'Stopped';
    lpPickL.textContent = 'end token';
    lpHint.textContent = 'It stopped because it predicted an end token — ' +
                         'nothing outside the model decided that.';
  }

  function lpFrame() {
    if (!lpPlaying) return;
    lpAcc += 30;
    if (lpAcc >= LP_PHASE[lpPh]) lpAdvance();
  }

  function lpSetPlaying(on) {
    lpPlaying = on && !lpDone;
    lpPlayB.textContent = lpPlaying ? 'Pause' : 'Play';
    lpPlayB.classList.toggle('on', lpPlaying);
  }

  function lpStart() {
    if (lpTimer) return;                 /* deck:slide fires twice on a theme change */
    lpTimer = setInterval(lpFrame, 30);
  }
  function lpStop() {
    if (!lpTimer) return;
    clearInterval(lpTimer); lpTimer = null;
  }

  function lpReset(autoplay) {
    lpToks.innerHTML = '';
    LP_PROMPT.forEach(function (p) { lpChip(p.t, p.sp, null); });
    lpCount.textContent = LP_PROMPT.length + ' tokens';
    lpI = 0; lpPh = 0; lpAcc = 0; lpDone = false;
    lpHint.textContent = 'Six candidates shown — the real list is every token in the ' +
                         'vocabulary, around 260,000 of them.';
    lpStageOn('tok');
    lpStage.textContent = LP_LABEL.tok;
    lpPickL.innerHTML = '&nbsp;';
    paint(lpBarSet, softmax(LP[0].l, 1), null);
    lpBarSet.forEach(function (b) { b.bar.classList.remove('pick'); });
    lpSetPlaying(!!autoplay);
  }

  /* ---- controls ---- */
  lpPlayB.addEventListener('click', function () {
    if (lpDone) { lpReset(true); return; }
    lpSetPlaying(!lpPlaying);
  });
  /* One whole pass, not one phase: the button says "one token" and the
     three stages of a single pass are what a token costs. */
  lpStepB.addEventListener('click', function () {
    if (lpDone) return;
    lpSetPlaying(false);
    lpPredict(lpI); lpSample(lpI); lpAppend(lpI);
    lpI++;
    if (lpI >= LP.length) lpFinish(); else lpPh = 0;
  });
  lpRepB.addEventListener('click', function () { lpReset(!lpReduced); });

  /* Restart on ARRIVAL only. deck:slide also fires on a theme change,
     and wiping a half-run generation to repaint a palette this slide
     does not paint would be pure loss. */
  var lpWasActive = false;
  document.addEventListener('deck:slide', function () {
    var on = lpSlide.classList.contains('active');
    if (on) {
      if (!lpWasActive) lpReset(!lpReduced);
      lpStart();
    } else {
      lpStop();
    }
    lpWasActive = on;
  });

  lpReset(false);
  if (lpSlide.classList.contains('active')) { lpSetPlaying(!lpReduced); lpStart(); }
}
