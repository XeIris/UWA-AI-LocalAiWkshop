/* ==========================================================
   §6 — THE CHAT WINDOW
   Nine scenarios, played as scripted conversations in a chat UI. A
   bulleted list can assert that a small model is good at summarising;
   only watching it read a PDF and answer makes the case.

   Each scenario is one or two LANES. A second lane appears exactly when
   the comparison is the argument: offline and unmetered put a cloud app
   beside the local one, and every "not this" case puts a frontier model
   there. Everything else is a single lane, because a comparison the
   slide is not making would only muddy it.

   Timeline model: every step carries `t`, its start time in seconds.
   A step's DOM node is created once, when the clock passes `t`, and
   only a streaming assistant message is touched after that — rebuilding
   the thread each frame is what makes a fake chat window stutter.

   Nothing here is a benchmark. The wrong answers are the failure modes
   the literature actually reports for small models — fabrication over
   abstention, and multiplicative error compounding across steps — not
   gotchas invented to make the point.
   ========================================================== */
var csSlide = document.getElementById('s-gb');
if (csSlide) {
  var csLanes  = document.getElementById('csLanes');
  var csWhy    = document.getElementById('csWhy');
  var csReplay = document.getElementById('csReplay');

  var LOCAL = { name: 'Gemma 3 1B', sub: 'on this laptop', kind: 'local' };
  /* Words/sec. 26 is about what a 1B at 30-odd tok/s actually manages
     (a token averages ~3/4 of a word), so the streaming is honest as
     well as quick. The whole slide is nine scenarios a presenter has to
     click through in a couple of minutes — every beat below is tuned so
     the answer lands within about two seconds and the scenario is done
     inside five. Nobody watches a fake chat window politely. */
  var WPS   = 26;

  /* ---- the scripts ----
     m: user | sys | ai | err | plan | done
     Times are seconds from the start of the scenario.                  */
  var CS = {

    sum: {
      why: 'The document is <em>in the prompt</em>. Nothing had to be recalled &mdash; ' +
           'only reshaped, and reshaping is what the small ones are good at.',
      lanes: [{ model: LOCAL, steps: [
        { t: 0.15, m: 'user', text: 'Summarise this for the people who missed it. Five bullets, plain English.',
          file: { name: 'club-agm-minutes.pdf', meta: '18 pages &middot; 2.4 MB' } },
        { t: 0.8, m: 'sys', text: 'Reading document &mdash; 11,240 tokens', bar: 1.0 },
        { t: 1.9, m: 'ai', pre: true, text:
          '• Membership is up 14% on last year, now 212 paid members.\n' +
          '• The Thursday workshop slot moves to 7pm from September.\n' +
          '• Treasurer reports $4,180 in hand; equipment fund approved.\n' +
          '• Two committee seats are unfilled; nominations close 30 Aug.\n' +
          '• Next AGM provisionally 24 July 2027, same venue.' }
      ] }]
    },

    fmt: {
      why: 'Dull, high&#8209;volume, and exactly repeatable. It never gets bored, ' +
           'never asks what you meant, and never sends your spreadsheet anywhere.',
      lanes: [{ model: LOCAL, steps: [
        /* Kept to four lines on purpose: the thread is 21rem and the
           instruction has to stay on screen next to the table it
           produced, or the scenario has no before-and-after. */
        { t: 0.15, m: 'user', pre: true, mono: true, text:
          'Turn these into a table — name, part, amount owed.\n' +
          'dave brought the projector, still owed 40\n' +
          'priya — snacks + drinks, 62.50, paid already\n' +
          'sam did the venue deposit 150 outstanding' },
        { t: 0.85, m: 'sys', text: 'Thinking', bar: 0.55 },
        { t: 1.5, m: 'ai', pre: true, mono: true, text:
          '| Name  | Part           | Owed    |\n' +
          '|-------|----------------|---------|\n' +
          '| Dave  | Projector      | $40.00  |\n' +
          '| Priya | Snacks, drinks | $0.00   |\n' +
          '| Sam   | Venue deposit  | $150.00 |' },
        { t: 3.9, m: 'ai', text: 'Priya is marked paid, so her balance is zero.' }
      ] }]
    },

    rag: {
      why: 'The knowledge lives in the <em>files</em>, not in the weights. This is why ' +
           'retrieval works far better than a 1&nbsp;B model has any right to.',
      lanes: [{ model: LOCAL, steps: [
        { t: 0.15, m: 'user', text: 'Which invoices from March have not been paid yet?' },
        { t: 0.75, m: 'sys', text: 'Searching 428 indexed files', bar: 0.85 },
        { t: 1.7, m: 'sys', text: '4 matches &mdash; reading', bar: 0.55 },
        { t: 2.35, m: 'ai', pre: true, text:
          'Three are still outstanding:\n\n' +
          '• INV-0312 — Hartley Signs — $840 — due 14 Apr\n' +
          '• INV-0318 — Weyland Ltd — $2,150 — overdue 26 days\n' +
          '• INV-0324 — K. Osei — $310 — due 2 May' },
        { t: 4.1, m: 'ai', text: 'INV-0316 was marked settled on 2 April, so I left it out.' }
      ] }]
    },

    priv: {
      why: 'Nothing left this machine. There is no cloud service that can offer you ' +
           'that, at any price, because the file has to arrive for them to read it.',
      net: 'private',
      lanes: [{ model: LOCAL, steps: [
        { t: 0.15, m: 'user', text: 'Explain these numbers to me in plain English. Anything I should ask about?',
          file: { name: 'blood-results-jul.pdf', meta: '3 pages &middot; private' } },
        { t: 0.8, m: 'sys', text: 'Reading document &mdash; 1,860 tokens', bar: 0.7 },
        { t: 1.6, m: 'ai', text: 'Most of the panel is inside the reference range. Two values sit just outside it, both flagged on the report itself, and both are the kind that move with recent diet or a minor infection. Worth asking your GP what they want to recheck and when — I can draft the questions.' },
        { t: 4.2, m: 'done', text: 'No request was made. 0 bytes sent.' }
      ] }]
    },

    off: {
      why: 'On a plane, in a shed, on a boat, or on club wifi at 7pm. The model does ' +
           'not know the network is gone, because it never needed it.',
      net: 'offline',
      lanes: [
        { model: { name: 'Cloud assistant', sub: 'needs a network', kind: 'cloud' }, steps: [
          { t: 0.35, m: 'user', text: 'What is a good substitute for buttermilk?' },
          { t: 0.9, m: 'sys', text: 'Connecting', bar: 1.3 },
          { t: 2.3, m: 'err', text: 'No internet connection.<br>Check your network and try again.' },
          { t: 3.1, m: 'sys', text: 'Retrying', bar: 1.3 },
          { t: 4.5, m: 'err', text: 'Request failed. You are offline.' }
        ] },
        { model: LOCAL, steps: [
          { t: 0.35, m: 'user', text: 'What is a good substitute for buttermilk?' },
          { t: 0.85, m: 'sys', text: 'Thinking', bar: 0.45 },
          { t: 1.4, m: 'ai', text: 'A cup of milk with a tablespoon of lemon juice or white vinegar, left to sit for ten minutes. Plain yoghurt thinned with a little water works too, and behaves closer to the real thing in soda bread.' },
          { t: 3.1, m: 'done', text: 'Answered with the aerial down.' }
        ] }
      ]
    },

    free: {
      why: 'Run it overnight on ten thousand documents if you like. The only meter ' +
           'that moves is the electricity one.',
      lanes: [
        { model: { name: 'Cloud assistant', sub: 'free tier', kind: 'cloud' }, steps: [
          { t: 0.2,  m: 'user', text: 'Tag these 500 support emails by topic.' },
          { t: 0.6,  m: 'sys', text: 'Batch 1 of 25', bar: 0.7 },
          { t: 1.4,  m: 'ai', text: 'Done — 20 emails tagged.' },
          { t: 2.0,  m: 'sys', text: 'Batch 2 of 25', bar: 0.7 },
          { t: 2.8,  m: 'ai', text: 'Done — 40 emails tagged.' },
          { t: 3.4,  m: 'sys', text: 'Batch 3 of 25', bar: 0.7 },
          { t: 4.2,  m: 'err', html: true, text:
            '<b>Rate limit reached.</b><br>0 of 20 requests remaining on this plan.' },
          /* The countdown is live: a static "resets in 4:37" reads as a
             screenshot, and the whole point is that you are made to wait. */
          { t: 4.2,  m: 'tick', from: 277 }
        ] },
        { model: LOCAL, steps: [
          { t: 0.2,  m: 'user', text: 'Tag these 500 support emails by topic.' },
          { t: 0.6,  m: 'sys', text: 'Working', bar: 0.6 },
          { t: 1.3,  m: 'ai', text: 'Done — all 500 tagged. Want the same run over last year’s archive?' },
          { t: 2.9,  m: 'user', text: 'Yes, and do the 12,000 in the archive too.' },
          { t: 3.4,  m: 'sys', text: 'Working', bar: 0.8 },
          { t: 4.3,  m: 'ai', text: 'Running. No queue, no quota — leave it going.' }
        ] }
      ]
    },

    /* ---------- not this ---------- */

    reason: {
      bad: true,
      why: 'It did not stall or hedge &mdash; it produced a clean, confident, wrong ' +
           'number. That is the failure mode: <em>fabrication, not omission</em>.',
      lanes: [
        { model: LOCAL, steps: [
          { t: 0.2, m: 'user', text: 'A 4 GB model runs at 60 tok/s. I swap to a model with 3× the parameters, but quantized from 8-bit to 4-bit. New speed?' },
          { t: 0.9, m: 'sys', text: 'Thinking', bar: 0.6 },
          { t: 1.6, m: 'ai', text: 'Three times the parameters means three times the memory traffic per token, so the speed drops to about 20 tok/s.' },
          { t: 3.4, m: 'verdict', bad: true, text: 'Wrong &mdash; and stated as fact' }
        ] },
        { model: { name: 'Frontier model', sub: 'cloud, ~1,000× larger', kind: 'cloud' }, steps: [
          { t: 0.2, m: 'user', text: 'A 4 GB model runs at 60 tok/s. I swap to a model with 3× the parameters, but quantized from 8-bit to 4-bit. New speed?' },
          { t: 0.9, m: 'sys', text: 'Thinking', bar: 1.4 },
          { t: 2.4, m: 'ai', pre: true, mono: true, text:
            '3× the parameters, at half the bits each:\n' +
            '3 × ½ = 1.5× the file → 6 GB.\n\n' +
            '60 ÷ 1.5 ≈ 40 tok/s.' },
          { t: 4.0, m: 'verdict', text: 'Correct' }
        ] }
      ]
    },

    agent: {
      bad: true,
      why: 'Nothing dramatic goes wrong. One step drifts, and every step after it ' +
           'trusts the step before &mdash; which is why reliability multiplies.',
      lanes: [
        { model: LOCAL, steps: [
          { t: 0.2, m: 'user', text: 'Go through the 12 supplier PDFs, pull the renewal dates, and put them in the calendar.' },
          /* 0.26s a step: fast enough to sit through, slow enough that the
             room sees them tick over one at a time rather than all at once. */
          { t: 0.9, m: 'plan', fail: 5, per: 0.26, items: [
            'Open supplier folder', 'Read 01-Hartley.pdf', 'Read 02-Weyland.pdf',
            'Read 03-Osei.pdf', 'Read 04-Brandt.pdf', 'Read 05-Ferris.pdf',
            'Read 06-Nakamura.pdf', 'Read 07-Silva.pdf', 'Read 08-Okonkwo.pdf',
            'Read 09-Petrov.pdf', 'Read 10-Marsh.pdf', 'Write 12 calendar entries'
          ] },
          { t: 4.1, m: 'ai', text: 'All done. I added 12 renewal dates to your calendar.' },
          { t: 5.0, m: 'verdict', bad: true, text: 'Four of them are wrong. It did not notice.' }
        ] },
        { model: { name: 'The arithmetic', sub: 'why this is structural', kind: 'math' }, steps: [
          { t: 0.9, m: 'math' }
        ] }
      ]
    },

    fact: {
      bad: true,
      why: 'A 1&nbsp;B model has room for the shape of language and very little else. ' +
           'Asked something it does not hold, it does not stop &mdash; it invents.',
      lanes: [
        { model: LOCAL, steps: [
          { t: 0.2, m: 'user', text: 'Who published Kimi K3, and how big is it?' },
          { t: 0.85, m: 'sys', text: 'Thinking', bar: 0.55 },
          { t: 1.5, m: 'ai', text: 'Kimi K3 is a large language model released by Baidu in early 2025. It has roughly 300 billion parameters and is available through their cloud platform.' },
          { t: 3.9, m: 'verdict', bad: true, text: 'Wrong company, wrong year, wrong by 9×. No hedge anywhere.' }
        ] },
        { model: { name: 'The answer', sub: 'from the scale slide', kind: 'truth' }, steps: [
          { t: 2.7, m: 'ai', pre: true, plain: true, text:
            'Moonshot AI, July 2026.\n' +
            '2.8 trillion parameters total,\n' +
            '104 billion active per token.\n\n' +
            'The largest open-weight release\n' +
            'to date — you saw it two slides ago.' },
          { t: 4.1, m: 'verdict', text: 'It was never going to know this. It was trained before it happened.' }
        ] }
      ]
    }
  };

  /* ---- status-bar icons ---- */
  var ICON = {
    wifi: '<path d="M2 8.5a15 15 0 0 1 20 0"/><path d="M5 12a10 10 0 0 1 14 0"/>' +
          '<path d="M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1.1" fill="currentColor"/>',
    cell: '<path d="M3 20v-5"/><path d="M8.5 20v-8"/><path d="M14 20v-11"/><path d="M19.5 20v-14"/>',
    air:  '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2' +
          'c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2' +
          'l3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>'
  };

  function icon(k, state) {
    return '<span class="cs-ic ' + state + '"><svg viewBox="0 0 24 24">' + ICON[k] +
      (state === 'cut' ? '<line class="cut" x1="3.5" y1="20.5" x2="20.5" y2="3.5"/>' : '') +
      '</svg></span>';
  }

  /* The bar is the whole argument on the offline slide, so it is always
     present — you cannot notice it change if it only appears when it
     changes. `private` differs from `offline`: the radios are on and
     working, and still nothing is sent. */
  function statusBar(net) {
    if (net === 'offline') {
      return icon('air', 'hot') + icon('wifi', 'cut') + icon('cell', 'cut') +
        '<span class="cs-net">Airplane mode</span>';
    }
    if (net === 'private') {
      return icon('air', 'off') + icon('wifi', 'on') + icon('cell', 'on') +
        '<span class="cs-net">Online &mdash; and unused</span>';
    }
    return icon('air', 'off') + icon('wifi', 'on') + icon('cell', 'on');
  }

  /* ---- lane + node construction ---- */
  function laneEl(lane, net) {
    var el = document.createElement('div');
    el.className = 'cs-lane k-' + lane.model.kind;
    var head = '<div class="cs-head"><span class="cs-av"></span>' +
      '<span class="cs-nm">' + lane.model.name + '<i>' + lane.model.sub + '</i></span>';
    /* Only the local lane carries the radio cluster: it is the machine
       whose connection state is being claimed not to matter. */
    if (lane.model.kind === 'local') head += '<span class="cs-status">' + statusBar(net) + '</span>';
    head += '</div>';
    el.innerHTML = head + '<div class="cs-thread"></div>';
    lane.thread = el.querySelector('.cs-thread');
    return el;
  }

  function bubble(cls, inner) {
    var d = document.createElement('div');
    d.className = 'cs-msg ' + cls;
    d.innerHTML = inner;
    return d;
  }

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function cls(st) { return (st.pre ? ' pre' : '') + (st.mono ? ' mono' : ''); }

  function makeNode(st, lane, verdictKind) {
    var d;
    if (st.m === 'user') {
      var f = st.file ? '<span class="cs-file"><svg viewBox="0 0 24 24">' +
        '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
        '<path d="M14 2v6h6"/></svg><b>' + st.file.name + '</b><i>' + st.file.meta +
        '</i></span>' : '';
      d = bubble('u ' + verdictKind, f + '<span class="cs-t' + cls(st) + '">' +
        esc(st.text) + '</span>');
    } else if (st.m === 'sys') {
      d = bubble('s', '<span class="cs-spin"></span><span>' + st.text +
        '</span><span class="cs-prog"><i style="--d:' + st.bar + 's"></i></span>');
    } else if (st.m === 'ai') {
      d = bubble('a' + (st.plain ? ' plain' : ''),
        '<span class="cs-t' + cls(st) + '"></span><span class="cs-caret"></span>');
      st.body = d.querySelector('.cs-t');
      st.words = st.text.split(' ');
    } else if (st.m === 'err') {
      d = bubble('e', '<svg class="cs-warn" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/>' +
        '<path d="M12 7v6"/><circle cx="12" cy="16.5" r="1.1" fill="currentColor"/></svg>' +
        '<span>' + st.text + '</span>');
    } else if (st.m === 'tick') {
      d = bubble('e tick', '<span>Resets in <b class="cs-count">4:37</b></span>');
      st.body = d.querySelector('.cs-count');
    } else if (st.m === 'done') {
      d = bubble('n', st.text);
    } else if (st.m === 'verdict') {
      d = bubble('v' + (st.bad ? ' bad' : ' ok'), st.text);
    } else if (st.m === 'plan') {
      var h = '';
      for (var i = 0; i < st.items.length; i++) {
        h += '<li><span class="cs-tick"></span>' + st.items[i] + '</li>';
      }
      d = bubble('p', '<ol class="cs-plan">' + h + '</ol>');
      st.rows = Array.prototype.slice.call(d.querySelectorAll('li'));
    } else if (st.m === 'math') {
      /* Not a chat bubble. The compounding is the point of the scenario
         and it deserves to be stated as arithmetic, not as a mood. */
      d = bubble('m',
        '<div class="cs-m-eq">success &asymp; <em>p</em><sup>n</sup></div>' +
        '<p>Every step has to be right for the run to be right, so per-step ' +
        'reliability <b>multiplies</b>. It does not average.</p>' +
        '<table class="cs-m-tab"><tr><th>Per step</th><th>12 steps</th></tr>' +
        '<tr><td>99%</td><td>89%</td></tr>' +
        '<tr><td>95%</td><td>54%</td></tr>' +
        '<tr class="hot"><td>90%</td><td>28%</td></tr>' +
        '<tr class="hot"><td>85%</td><td>14%</td></tr></table>' +
        '<p class="cs-m-note">A frontier model sits higher up this table. It is on ' +
        'the same table.</p>');
    }
    lane.thread.appendChild(d);
    return d;
  }

  /* ---- playback ---- */
  var cur = null, clock = 0, lastT = 0, playing = false;

  function load(id) {
    var sc = CS[id];
    if (!sc) return;
    cur = sc;
    csLanes.innerHTML = '';
    csLanes.className = 'cs-lanes' + (sc.lanes.length > 1 ? ' two' : '');
    sc.lanes.forEach(function (lane) {
      lane.steps.forEach(function (st) { st.node = null; });
      csLanes.appendChild(laneEl(lane, sc.net));
    });
    csWhy.innerHTML = sc.why;
    csWhy.className = 'cs-why' + (sc.bad ? ' bad' : ' good');
    clock = 0; playing = true;
    if (REDUCED) { clock = 999; playing = false; }
    step();
  }

  function fmtClock(s) {
    s = Math.max(0, s);                 /* reduced motion parks the clock
                                           past the end of the scenario */
    return Math.floor(s / 60) + ':' + ('0' + Math.floor(s % 60)).slice(-2);
  }

  function step() {
    var vk = cur.bad ? 'bad' : 'good';
    var busy = false;
    cur.lanes.forEach(function (lane) {
      lane.steps.forEach(function (st) {
        if (clock < st.t) { busy = true; return; }
        if (!st.node) st.node = makeNode(st, lane, vk);

        var el = clock - st.t;
        if (st.m === 'ai') {
          var n = REDUCED ? st.words.length : Math.floor(el * WPS);
          if (n < st.words.length) busy = true;
          st.body.innerHTML = esc(st.words.slice(0, Math.min(n, st.words.length)).join(' '));
          st.node.classList.toggle('typing', n < st.words.length);
        } else if (st.m === 'tick') {
          st.body.textContent = fmtClock(st.from - el);
          busy = true;                       /* the wait never resolves  */
        } else if (st.m === 'plan') {
          var done = Math.floor(el / st.per);
          if (done <= st.rows.length) busy = true;
          st.rows.forEach(function (r, i) {
            r.classList.toggle('on', i < done);
            r.classList.toggle('run', i === done);
            /* The drifted step ticks green like every other one while the
               run is happening. It only goes amber once the run has
               finished and the verdict lands — nothing announced it at
               the time, which is exactly what makes a long run
               untrustworthy. */
            r.classList.toggle('slip', i === st.fail && done >= st.rows.length);
          });
        }
      });
      /* Follow the tail, like any chat window. */
      lane.thread.scrollTop = lane.thread.scrollHeight;
    });
    playing = busy;
  }

  /* A timer, not requestAnimationFrame — deliberately, and unlike every
     other animated slide in this deck.

     Those slides paint canvases, so they have to be in step with the
     compositor. This one only inserts DOM nodes and grows a text run,
     which needs no paint synchronisation at all. What it does need is to
     keep running: rAF is suspended outright whenever the browser decides
     the page is not visible, and "not visible" covers cases that turn up
     in a real presentation — a mirrored or extended display the OS
     considers occluded, a backgrounded window, remote desktop. When that
     happens rAF gives you a chat window that never says anything, with
     no error and nothing to debug. A timer keeps its clock. */
  var TICK_MS = 33;
  function frame() {
    var now = performance.now();
    if (!csSlide.classList.contains('active')) { lastT = now; return; }
    var dt = Math.min(now - lastT, 250) / 1000;   /* clamp throttled gaps */
    lastT = now;
    if (!playing) return;
    clock += dt;
    step();
  }

  /* ---- tabs: two visual groups, one exclusive set ---- */
  var tabs = Array.prototype.slice.call(
    csSlide.querySelectorAll('.cs-tabs .seg button'));

  function pick(b) {
    tabs.forEach(function (o) {
      var on = o === b;
      o.classList.toggle('on', on);
      o.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    load(b.dataset.s);
  }
  tabs.forEach(function (b) { b.addEventListener('click', function () { pick(b); }); });
  csReplay.addEventListener('click', function () {
    load(tabs.filter(function (b) { return b.classList.contains('on'); })[0].dataset.s);
  });

  /* Restart on entry: a chat that is already over when the slide appears
     has thrown away the only thing it had to show. */
  document.addEventListener('deck:slide', function () {
    if (csSlide.classList.contains('active')) {
      load(tabs.filter(function (b) { return b.classList.contains('on'); })[0].dataset.s);
    }
  });

  load('sum');
  lastT = performance.now();
  setInterval(frame, TICK_MS);
}
