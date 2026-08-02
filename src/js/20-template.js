/* ==========================================================
   §2 — THE CHAT TEMPLATE GOTCHA
   One model (Gemma 3 1B), one prompt, six wrappings. The left panel
   shows the literal string handed to the model, token by token; the
   right panel plays what comes back.

   The point being taught is that five of the six produce NO error.
   So the failures are graded, not uniform — each preset breaks a
   different part of the contract:

     chatml/llama  markers that are not in this model's vocabulary, so
                   they shred into ordinary text and the turn structure
                   disappears — instructions stop being obeyed;
     mistral       markers that tokenize perfectly well as plain ASCII,
                   so they are read as part of the question;
     none          no generation prompt, so the model completes your
                   sentence instead of answering it;
     stop          the right template with a foreign stop string, so
                   nothing halts the generation and it writes both
                   sides of the conversation.

   Outputs are illustrations of those classes, not transcripts, and the
   slide says so on its face.

   Clock is a setInterval for the same reason §6's is — see the long
   note at the bottom of 17-chat.js. This module only inserts DOM.
   ========================================================== */
var tpSlide = document.getElementById('s-tmpl');
if (tpSlide) {
  var tpWire = document.getElementById('tpWire');
  var tpOut = document.getElementById('tpOut');
  var tpMeta = document.getElementById('tpMeta');
  var tpTag = document.getElementById('tpTag');
  var tpVerdict = document.getElementById('tpVerdict');
  var tpReplay = document.getElementById('tpReplay');

  var SYS = 'Answer in exactly three bullets. No preamble.';
  var ASK = 'What should I check before club night?';

  /* Wire segments: ['tok', s] a real special token of THIS model,
     ['bad', s] a marker this model has no token for, ['txt', s] your
     own words. The colouring is the argument — one glance says whether
     the structure is something the weights have ever seen. */
  var TP = {
    gemma: {
      ok: true,
      tag: 'CORRECT &middot; FROM THE GGUF METADATA',
      wire: [['tok', '<start_of_turn>'], ['txt', 'user\n' + SYS + '\n\n' + ASK],
             ['tok', '<end_of_turn>'], ['txt', '\n'],
             ['tok', '<start_of_turn>'], ['txt', 'model\n']],
      meta: 'Stop token <b>&lt;end_of_turn&gt;</b> &middot; 2 special tokens, both in the vocabulary' +
            '<span>Gemma has no system role at all &mdash; the app folds your system prompt into the first user turn.</span>',
      out: [{ t: 0.5, m: 'ai', text:
        '• Charge the projector and pack the HDMI adapter.\n' +
        '• Print six spare name badges.\n' +
        '• Confirm the room is booked until 9pm.' },
        { t: 3.4, m: 'stop', text: '&lt;end_of_turn&gt; &mdash; generation ends here' }],
      v: ['ok', 'Three bullets, no preamble, and it stopped by itself. This is the baseline everything below is measured against.']
    },

    chatml: {
      tag: 'CHATML &middot; QWEN, MANY OTHERS',
      wire: [['bad', '<|im_start|>'], ['txt', 'system\n' + SYS], ['bad', '<|im_end|>'],
             ['txt', '\n'], ['bad', '<|im_start|>'], ['txt', 'user\n' + ASK],
             ['bad', '<|im_end|>'], ['txt', '\n'], ['bad', '<|im_start|>'], ['txt', 'assistant\n']],
      meta: 'None of these are tokens to Gemma &middot; <b>&lt;|im_start|&gt;</b> becomes 7 ordinary pieces of punctuation' +
            '<span>The turn structure is now just text in the middle of your question.</span>',
      out: [{ t: 0.5, m: 'ai', text:
        'Sure! Happy to help you get ready. There are quite a few things worth ' +
        'thinking about before a club night, so let me walk you through them. ' +
        'First, the venue itself — it is always worth confirming the booking, ' +
        'and while you are at it, checking whether anyone needs a key…' },
        { t: 5.2, m: 'note', text: 'System prompt ignored. Not three bullets. No error.' }],
      v: ['bad', 'The invisible one. Fluent, confident, and no longer following your instructions — the failure people spend an evening blaming on the model.']
    },

    llama: {
      tag: 'LLAMA 3 &middot; META',
      wire: [['bad', '<|begin_of_text|><|start_header_id|>'], ['txt', 'system'],
             ['bad', '<|end_header_id|>'], ['txt', '\n\n' + SYS], ['bad', '<|eot_id|>'],
             ['bad', '<|start_header_id|>'], ['txt', 'user'], ['bad', '<|end_header_id|>'],
             ['txt', '\n\n' + ASK], ['bad', '<|eot_id|>'],
             ['bad', '<|start_header_id|>'], ['txt', 'assistant'], ['bad', '<|end_header_id|>']],
      meta: 'Four different foreign markers &middot; all shredded into plain text' +
            '<span>The model has no idea these ever meant &ldquo;a turn starts here&rdquo;.</span>',
      out: [{ t: 0.5, m: 'ai', text:
        'assistant\n\nHere is what I would check before club night: the projector, ' +
        'the badges, and the room booking. <|eot_id|><|start_header_id|>user' },
        { t: 4.6, m: 'note', text: 'It is copying the shape of your markers back at you.' }],
      v: ['bad', 'A model imitates whatever pattern is in front of it. Seeing marker-shaped text, it writes marker-shaped text — they were never tokens to it.']
    },

    mistral: {
      tag: 'MISTRAL &middot; PLAIN ASCII MARKERS',
      wire: [['tok', '<s>'], ['bad', '[INST]'], ['txt', ' ' + SYS + '\n\n' + ASK + ' '],
             ['bad', '[/INST]']],
      meta: '<b>[INST]</b> is ordinary ASCII &middot; it tokenizes cleanly and looks like text you typed' +
            '<span>Nothing about it is special, so nothing about it is treated as special.</span>',
      out: [{ t: 0.5, m: 'ai', text:
        'I am not sure what [INST] refers to — is it a form you need to fill in? ' +
        'Before club night I would check the projector, the badges and the room ' +
        'booking, but let me know what INST is and I can include it.' },
        { t: 5.0, m: 'note', text: 'The wrapper became part of the question.' }],
      v: ['bad', 'The most literal version of the mistake: you did not frame the conversation, you added two words to it.']
    },

    none: {
      tag: 'NO TEMPLATE &middot; RAW COMPLETION',
      wire: [['txt', SYS + '\n' + ASK]],
      meta: 'No roles, no markers &mdash; and crucially <b>no generation prompt</b>' +
            '<span>Nothing in the string says &ldquo;your turn now&rdquo;, so it does what a language model does by default.</span>',
      out: [{ t: 0.5, m: 'ai', text:
        'And is anyone bringing the urn this time? Last month we ran out of hot ' +
        'water by eight and the side door key was still with Marcus, so someone ' +
        'should probably…' },
        { t: 4.8, m: 'note', text: 'It continued your message. It never replied to it.' }],
      v: ['bad', 'Underneath the chat window it is still a text predictor. The template is the only thing that makes it a conversation.']
    },

    stop: {
      tag: 'RIGHT TEMPLATE &middot; FOREIGN STOP STRING',
      wire: [['tok', '<start_of_turn>'], ['txt', 'user\n' + SYS + '\n\n' + ASK],
             ['tok', '<end_of_turn>'], ['txt', '\n'],
             ['tok', '<start_of_turn>'], ['txt', 'model\n']],
      meta: 'Markup correct &middot; stop string overridden to <b class="no">&lt;|im_end|&gt;</b>' +
            '<span>The model emits &lt;end_of_turn&gt; on time. Nobody is listening for it.</span>',
      out: [{ t: 0.5, m: 'ai', text:
        '• Charge the projector and pack the HDMI adapter.\n' +
        '• Print six spare name badges.\n' +
        '• Confirm the room is booked until 9pm.\n' +
        '<end_of_turn>\n<start_of_turn>user\n' +
        'Thanks! And what about parking?<end_of_turn>\n<start_of_turn>model\n' +
        'Parking is free after 6pm in the north lot, though…' },
        { t: 7.0, m: 'note', text: 'Still going. It will stop at the token limit, and not before.' }],
      v: ['bad', 'The answer was right and finished in the first three lines. Everything after it is the model politely playing both parts.']
    }
  };

  /* ---- rendering ---- */
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function paintWire(sc) {
    tpTag.innerHTML = sc.tag;
    tpTag.className = 'tp-tag' + (sc.ok ? ' ok' : ' bad');
    tpWire.innerHTML = sc.wire.map(function (seg) {
      return '<span class="w-' + seg[0] + '">' + esc(seg[1]) + '</span>';
    }).join('');
    tpMeta.innerHTML = sc.meta;
  }

  /* ---- playback ---- */
  var tpCur = null, tpClock = 0, tpLast = 0, tpPlaying = false;
  var TP_WPS = 24;

  function tpLoad(id) {
    var sc = TP[id];
    if (!sc) return;
    tpCur = sc;
    paintWire(sc);
    tpOut.innerHTML = '';
    sc.out.forEach(function (st) { st.node = null; });
    tpVerdict.textContent = ' ';
    tpVerdict.className = 'tp-v';
    tpClock = 0; tpPlaying = true;
    if (REDUCED) { tpClock = 999; tpPlaying = false; }
    tpStep();
  }

  function tpNode(st) {
    var d = document.createElement('div');
    if (st.m === 'ai') {
      d.className = 'tp-msg';
      d.innerHTML = '<span class="tp-t"></span><span class="tp-caret"></span>';
      st.body = d.querySelector('.tp-t');
      st.words = st.text.split(' ');
    } else if (st.m === 'stop') {
      d.className = 'tp-stop';
      d.innerHTML = st.text;
    } else {
      d.className = 'tp-note';
      d.innerHTML = st.text;
    }
    tpOut.appendChild(d);
    return d;
  }

  function tpStep() {
    var busy = false;
    tpCur.out.forEach(function (st) {
      if (tpClock < st.t) { busy = true; return; }
      if (!st.node) st.node = tpNode(st);
      if (st.m !== 'ai') return;
      var n = REDUCED ? st.words.length : Math.floor((tpClock - st.t) * TP_WPS);
      if (n < st.words.length) busy = true;
      st.body.textContent = st.words.slice(0, Math.min(n, st.words.length)).join(' ');
      st.node.classList.toggle('typing', n < st.words.length);
    });
    tpOut.scrollTop = tpOut.scrollHeight;
    /* The verdict is the punchline and lands only once the output has
       finished arriving — reading it first gives the answer away. */
    if (!busy && tpPlaying) {
      tpVerdict.textContent = tpCur.v[1];
      tpVerdict.className = 'tp-v ' + tpCur.v[0];
    }
    if (REDUCED) {
      tpVerdict.textContent = tpCur.v[1];
      tpVerdict.className = 'tp-v ' + tpCur.v[0];
    }
    tpPlaying = busy;
  }

  /* Wound only while the slide is on screen — see the matching note in
     17-chat.js. Timer rather than rAF for the reason given there; not
     running at all on the other 37 slides for the reason given here. */
  var tpTimer = null;
  function tpStart() {
    if (tpTimer) return;              /* deck:slide can arrive twice */
    tpLast = performance.now();
    tpTimer = setInterval(tpFrame, 33);
  }
  function tpStop() {
    if (!tpTimer) return;
    clearInterval(tpTimer);
    tpTimer = null;
  }

  function tpFrame() {
    var now = performance.now();
    var dt = Math.min(now - tpLast, 250) / 1000;
    tpLast = now;
    if (!tpPlaying) return;
    tpClock += dt;
    tpStep();
  }

  var tpTabs = Array.prototype.slice.call(
    tpSlide.querySelectorAll('.tp-tabs .seg button'));

  function tpPick(b) {
    tpTabs.forEach(function (o) {
      var on = o === b;
      o.classList.toggle('on', on);
      o.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    tpLoad(b.dataset.s);
  }
  tpTabs.forEach(function (b) {
    b.addEventListener('click', function () { tpPick(b); });
  });
  function tpCurrent() {
    return tpTabs.filter(function (b) { return b.classList.contains('on'); })[0];
  }
  tpReplay.addEventListener('click', function () { tpLoad(tpCurrent().dataset.s); });

  document.addEventListener('deck:slide', function () {
    if (tpSlide.classList.contains('active')) {
      tpLoad(tpCurrent().dataset.s);
      tpStart();
    } else {
      tpStop();
    }
  });

  tpLoad('gemma');
  if (tpSlide.classList.contains('active')) tpStart();
}
