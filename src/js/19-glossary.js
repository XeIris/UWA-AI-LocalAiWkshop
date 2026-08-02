/* ==========================================================
   GLOSSARY
   A beginner hits eight unfamiliar nouns before §1 is over, and the
   presenter cannot stop for each one. Every term below is marked in
   the prose with a faint dotted underline and defines itself in place
   on click.

   Terms are marked BY A PASS OVER THE DOM, not by hand in the slide
   source. Thirty-odd slides written by hand would drift the moment a
   sentence was reworded, and marking is exactly the kind of work that
   should not be someone's job. The pass is deliberately timid:

     - prose containers only (see PROSE) — never a heading, a readout,
       a control or a canvas label, where an underline would read as
       part of the number;
     - one mark per definition per slide, so a slide that says
       "quantization" six times gets one dotted word, not a rash — and
       "open weights" does not mark twice under two spellings;
     - PER_SLIDE marks at most, because past half a dozen the treatment
       stops reading as faint and starts reading as a page of links;
     - longest term first, so "memory bandwidth" wins over "bandwidth"
       and "KV cache" over "cache";
     - anything inside [data-noglossary] is left alone.

   Definitions are one sentence, in the deck's own terms, and say what
   the thing IS rather than why it matters — the slide is already doing
   the second job.
   ========================================================== */

/* term -> { d: definition, s: section to jump to, vs: [[thing, how it
   differs], ...] }

   The "not the same as" list is the half people actually need. Nearly
   every wrong mental model in this room is a COLLISION between two
   neighbouring words — quantization with distillation, the context
   window with memory, fine-tuning with RAG, llama.cpp with Llama — and
   a definition that only says what a thing is leaves the collision
   intact. Where a term has a famous twin, name the twin. */
var GLOSSARY = {
  'llm': { s: 0,
    d: 'Large language model. Given some text, it predicts what token comes next; run that over and over and you get a paragraph. Everything else — chat, summarising, code — is that one trick wrapped in a template.' },

  'local llm': { s: 0,
    d: 'A language model whose weights you hold and whose inference runs on your own hardware. No account, no request leaving the machine, and no version change unless you choose one.',
    vs: [['A smaller/dumber model', 'Local is about WHERE it runs, not how good it is. The size limit comes from your memory, not from the idea.']] },

  'weights': { s: 0,
    d: 'The numbers inside a model — billions of them, learned during training and then frozen. A model file is essentially nothing but weights, which is why its size in gigabytes is just a count of weights times the bits each one is stored in.',
    vs: [['Your data', 'Nothing you type is written back into them. The file is identical after a year of use.']] },

  'open weights': { s: 0,
    d: 'The finished weights are published for anyone to download, run, inspect and fine-tune.',
    vs: [['Open source', 'The training data and the code that produced the weights usually stay private, and the license can still restrict commercial use or outputs. Read the model card.']] },
  'open-weight': { s: 0,
    d: 'The finished weights are published for anyone to download, run, inspect and fine-tune.',
    vs: [['Open source', 'The training data and the code that produced the weights usually stay private, and the license can still restrict commercial use or outputs. Read the model card.']] },

  'inference': { s: 0,
    d: 'Running a trained model to get an answer out of it — the only half of the job your laptop is doing tonight.',
    vs: [['Training', 'Making the weights in the first place: thousands of GPUs, weeks, and millions of dollars. Nothing you do in LM Studio changes a weight.']] },

  'parameters': { s: 4,
    d: 'The weights, counted rather than described. "8B" means eight billion of them, and that count is the first half of every memory calculation in this deck.',
    vs: [['Active parameters', 'In a mixture-of-experts model only a slice runs per token. The active count sets the speed; the total still sets the memory.']] },
  'parameter': { s: 4,
    d: 'One weight. Model sizes count them: "8B" is eight billion.' },

  'token': { s: 1,
    d: 'The chunk of text a model reads and writes — roughly three quarters of a word in English, so a common word is one token and an unusual one is three or four.',
    vs: [['A word', 'Close enough for estimating, wrong for arithmetic. Context limits, speeds and prices are all counted in tokens, never words.']] },
  'tokens': { s: 1,
    d: 'The chunks of text a model reads and writes — roughly three quarters of a word in English, so a common word is one token and an unusual one is three or four.',
    vs: [['Words', 'Close enough for estimating, wrong for arithmetic. Context limits, speeds and prices are all counted in tokens, never words.']] },
  'tokenizer': { s: 1,
    d: 'The lookup table that cuts your text into tokens and turns them back afterwards. Every model ships its own, which is why a token count differs slightly between models.' },

  'temperature': { s: 1,
    d: 'The sampling knob that flattens or sharpens the probability distribution before a token is drawn from it. Near 0 it always takes the most likely token; higher, and unlikely ones get a real chance.',
    vs: [['Creativity or intelligence', 'It changes nothing about what the model knows. High temperature is not a better writer, just a less predictable one.']] },
  'top-p': { s: 1,
    d: 'Keep the most likely tokens until their probabilities add up to p, then sample from just those — so the tail gets cut, and how much of it depends on how confident the model is.',
    vs: [['Temperature', 'Temperature reshapes the whole distribution; top-p deletes part of it. They are usually used together.']] },
  'min-p': { s: 1,
    d: 'Discard any token less likely than a set fraction of the best one. Adapts to the model’s confidence: strict when it is sure, generous when it is not.' },
  'sampling': { s: 1,
    d: 'Choosing the next token from the distribution the model produced. The model never picks a word — it produces probabilities for every token in the vocabulary, and the sampler picks.' },

  'system prompt': { s: 1,
    d: 'A standing instruction placed before the conversation, setting the model’s role, tone and rules. LM Studio lets you edit it per model.',
    vs: [['The chat template', 'The system prompt is WHAT you say. The template is HOW it gets wrapped in the markers the model was trained on. A wrong template can make a perfect system prompt invisible.']] },
  'chat template': { s: 2,
    d: 'The exact markers and punctuation a model was trained to see around a conversation — who is speaking, where a turn ends, where the model should start writing. It normally lives in the GGUF’s metadata and the app applies it for you.',
    vs: [['The system prompt', 'That is the content. This is the envelope, and the wrong envelope fails silently: no error, just fluent output that stops obeying you.']] },

  'hugging face': { s: 2,
    d: 'The site nearly every open-weight model is published on. A "model card" is a repo — a folder of files, a license and some usage notes — not a product page.' },
  'gguf': { s: 2,
    d: 'The single-file model format llama.cpp reads: weights, tokenizer, chat template and metadata in one file you can copy to a USB stick. Quantized builds are distributed this way.',
    vs: [['safetensors', 'The full-precision format models are published in first. A GGUF is usually converted and quantized FROM safetensors.'],
         ['GGML', 'The older format GGUF replaced in 2023. Old links and old blog posts still say GGML; the file will not load.']] },
  'safetensors': { s: 2,
    d: 'The format models are usually published in before conversion — the full-precision original a GGUF is quantized from. What you want if you intend to fine-tune rather than just run.' },
  'llama.cpp': { s: 2,
    d: 'The C++ inference engine most local apps are built on, LM Studio and Ollama included. No dependencies, runs on anything from a Raspberry Pi to a server, and reads GGUF.',
    vs: [['Llama', 'Meta’s family of models. The engine is named after them but runs almost every open model, and you never have to touch a Llama to use it.']] },
  'mlx': { s: 2,
    d: 'Apple’s array framework, built around unified memory. Meaningfully faster than llama.cpp on Apple silicon, and useless anywhere else — it has its own model format, so you download a different file.' },
  'lm studio': { s: 1,
    d: 'The desktop app used tonight: it finds models, downloads them, and runs them through llama.cpp or MLX behind a chat window.',
    vs: [['LM Studio Bionic', 'A separate app from the same team — a local coding and document agent. It is not a newer LM Studio and does not replace the model manager. The name invites exactly the wrong guess.']] },
  'ollama': { s: 2,
    d: 'A command-line-first model runner, also built on llama.cpp. Popular for serving a model to other programs rather than chatting with it yourself.',
    vs: [['Open WebUI', 'A browser front end with no engine of its own — it needs Ollama or something like it behind it.']] },

  'quantization': { s: 4,
    d: 'Storing each weight in fewer bits — 16 down to 8, 4 or 2 — so the file shrinks and the whole model can be read from memory faster. The model gets a little worse in a way that is nearly free down to about 4 bits, and expensive below it.',
    vs: [['Distillation', 'Training a smaller model to imitate a bigger one. That makes a NEW model; quantization keeps the same one and rounds it.'],
         ['Zipping the file', 'A quantized model is smaller in memory while it runs, which is the whole point. A zip has to be unpacked back to full size first.']] },
  'quantized': { s: 4,
    d: 'Stored at reduced precision: fewer bits per weight, a smaller file, and a small loss of quality that is negligible at 4 bits and severe at 2.' },
  'quant': { s: 4,
    d: 'One quantized build of a model, named for its scheme — Q4_K_M, Q8_0, IQ4_XS. One model produces dozens of them, and picking the right one is the skill.' },
  'q4_k_m': { s: 4,
    d: 'The usual 4-bit build, and the default recommendation. "K" is the block-scale scheme, "M" the medium variant that keeps a few sensitive tensors at higher precision.',
    vs: [['Exactly 4 bits', 'It averages about 4.83 bits per weight once the per-block scales are counted — which is why the download is bigger than the napkin says.']] },
  'bits per weight': { s: 4,
    d: 'The real average storage cost of one weight, block scales and metadata included — the honest version of "4-bit", and the number that makes a download page agree with your arithmetic.' },

  'vram': { s: 3,
    d: 'The memory soldered to a discrete graphics card. Very fast, and a hard ceiling: what does not fit has to be read from system RAM instead, at roughly a tenth of the speed.',
    vs: [['System RAM', 'Plentiful and cheap, and far slower. Spilling from one to the other is the cliff you can watch on the two-machines slide.'],
         ['Unified memory', 'On a Mac there is only one pool, shared by CPU and GPU. Large capacity, no copying, and no cliff — until the pool itself is full.']] },
  'unified memory': { s: 3,
    d: 'One pool of RAM shared by CPU and GPU, as on Apple silicon and AMD APUs. Capacity a graphics card cannot match, at bandwidth a plain PC cannot match — which is why Macs punch above their weight at generation.',
    vs: [['VRAM', 'A separate pool that has to be filled by copying across the PCIe bus, and that runs out sooner.']] },
  'dram': { s: 3,
    d: 'Ordinary system RAM. Plentiful, cheap, and roughly ten times slower than a graphics card’s memory — which is exactly what a model spilling out of VRAM feels like.' },

  'memory bandwidth': { s: 3,
    d: 'How many gigabytes per second the machine can read from memory. Because every weight is read once per token, this number divided by the size of the model is the speed ceiling for generation — the one formula the whole workshop hangs off.',
    vs: [['Capacity', 'Gigabytes, not gigabytes per second. Capacity decides whether the model runs at all; bandwidth decides how fast. They are different numbers on the same spec sheet.']] },
  'bandwidth': { s: 3,
    d: 'How many gigabytes per second the machine can read from memory. Every weight is read once per token, so this divided by the model size is the speed ceiling for generation.',
    vs: [['Capacity', 'Gigabytes, not gigabytes per second. Capacity decides whether the model runs at all; bandwidth decides how fast.'],
         ['Network bandwidth', 'Nothing to do with your internet connection. This is the bus between the chip and its memory.']] },

  'prefill': { s: 3,
    d: 'The first phase: the whole prompt is read in one pass, all tokens at the same time. Limited by raw arithmetic, and it is what the pause before the first word is made of.',
    vs: [['Decode', 'The second phase, one token at a time and limited by memory bandwidth instead. A Mac is good at decode and modest at prefill; a big GPU is good at both until the model stops fitting.']] },
  'decode': { s: 3,
    d: 'The second phase: one token at a time, with every weight in the model read from memory for each one. Limited by memory bandwidth, which is why the size of the file sets the speed.',
    vs: [['Prefill', 'Reading your prompt, which happens in parallel and is limited by compute. Same model, two completely different bottlenecks.']] },
  'tok/s': { s: 3,
    d: 'Tokens per second — the rate words appear once the model has started. Roughly memory bandwidth divided by model size, and always meaningfully lower than that ceiling in practice.',
    vs: [['Time to first token', 'How long you wait before anything appears. That is prefill, and a slow prefill with fast decode still feels sluggish.']] },

  'context window': { s: 5,
    d: 'The maximum number of tokens the model can have in front of it at once: the conversation so far, anything you pasted, and the reply it is writing. Everything outside it does not exist as far as the model is concerned.',
    vs: [['Memory', 'It does not remember you between chats, and nothing in the window is learned. Close the window and it is gone.'],
         ['The KV cache', 'The window is the limit. The cache is the RAM that filling it actually costs, and it grows with every token.']] },
  'context': { s: 5,
    d: 'Everything the model can see at once: the conversation plus whatever you pasted. Measured in tokens, and it costs memory that grows as you talk.',
    vs: [['Long-term memory', 'There is none by default. A fresh chat starts from nothing, however long the last one was.']] },
  'kv cache': { s: 5,
    d: 'The saved intermediate state for every token so far, so the model does not have to re-read the whole conversation for each new word. It grows linearly with context, lives in the same RAM as the weights, and is why a long chat can push a model that fitted an hour ago out of memory.',
    vs: [['The context window', 'That is the limit in tokens; this is the memory bill for using it.'],
         ['RAG', 'Retrieval fetches passages into the prompt. The cache is just the running state of whatever is already there.']] },
  'gqa': { s: 5,
    d: 'Grouped-query attention. Several attention heads share one set of keys and values, which cuts the KV cache several-fold against the textbook formula — so a beginner computing it the old way over-estimates badly.',
    vs: [['MHA', 'The original, where every head keeps its own keys and values — much larger cache.'],
         ['MQA', 'The extreme version: one shared set for all heads. GQA sits between the two and is what nearly everything ships with now.']] },
  'overhead': { s: 4,
    d: 'Everything resident besides the weights and the cache — the runtime, compute buffers, the OS, whatever else you have open. Budget a couple of gigabytes and do not plan to use the last one.' },

  'rag': { s: 6,
    d: 'Retrieval-augmented generation: search your own files for the passages that match the question, then hand those passages to the model along with it. This is why a 1B model can answer questions about your documents far better than its size suggests.',
    vs: [['Fine-tuning', 'Fine-tuning teaches style and format by changing weights. RAG changes nothing and supplies facts at question time — for "what do my files say", RAG is almost always the right answer.'],
         ['A bigger context window', 'Pasting everything in works until it does not: the cache cost is linear and attention quality falls off long before the limit does.']] },
  'hallucination': { s: 6,
    d: 'A fluent, confident answer that is simply wrong. The failure mode of asking a model for facts it was never given, and small models reach it sooner because they were given less.',
    vs: [['Lying', 'There is no intent and no awareness. The model has no separate store of "things I know" to check an answer against.']] },
  'fine-tune': { s: 6,
    d: 'Continue training a published model on your own data to specialise it — tone, format, a domain’s vocabulary. Cheaper than training from scratch, and still not a weekend job.',
    vs: [['RAG', 'If the goal is "know about my documents", retrieval beats fine-tuning on cost, freshness and accuracy. Fine-tune for HOW it answers, retrieve for WHAT it answers with.']] },

  'mixture of experts': { s: 6,
    d: 'A model split into many sub-networks where a router runs only a few per token. Enormous total parameter counts with modest work per token — but every expert still has to be in memory, so it buys speed, not space.',
    vs: [['A dense model', 'Every weight runs for every token. Same memory rules, more compute per token.']] },
  'moe': { s: 6,
    d: 'Mixture of experts: a model split into sub-networks where only a few run per token. Fast for its size, but the whole thing still has to fit in memory.',
    vs: [['The active count', 'A 1T model with 40B active needs memory for the trillion and runs at roughly the speed of the forty billion. Both numbers matter, for different reasons.']] },
  'active parameters': { s: 6,
    d: 'In a mixture-of-experts model, the slice actually used for one token. It sets the speed; the total parameter count still sets the memory.' },

  'autoregressive': { s: 7,
    d: 'One token at a time, each conditioned on everything before it. How every model you ran tonight writes, and the reason decode is bandwidth-bound.',
    vs: [['Diffusion text models', 'They denoise a whole block of tokens in parallel over a few passes, which breaks the one-weight-read-per-token arithmetic entirely.']] },
  'diffusion': { s: 7,
    d: 'Generating text by denoising a whole block of masked tokens in parallel over a handful of steps, instead of left to right one at a time.',
    vs: [['Gemini Diffusion', 'Google’s closed research demo from 2025. DiffusionGemma is the 2026 open-weights model — at least one source online conflates the two and mis-dates it.'],
         ['Image diffusion', 'Same idea, different medium. Nothing here generates pictures.']] },

  'benchmark': { s: 6,
    d: 'A fixed test set used to score models. Useful for ranking, weak evidence for how a model will do on your particular job — and every published number was produced at a precision and context length that may not match yours.',
    vs: [['Your use case', 'The only benchmark that decides anything is running your own prompts on your own machine.']] }
};

var glossPanel = null;
var glossTerm = null;

/* Only prose. A dotted underline inside a readout or a control reads as
   part of the value, and inside a heading it reads as a typo. */
var PROSE = '.slide p, .slide li, .tile .v, .toc-w, .srow .body p, .anat-part p, .dis p';

function glossKeys() {
  return Object.keys(GLOSSARY).sort(function (a, b) { return b.length - a.length; });
}

/* \b does not do what you want next to a dot or a slash: "llama.cpp" and
   "tok/s" end at a non-word character, so the trailing \b never matches.
   Guard with explicit "not a word character" lookarounds instead. */
function glossRe(term) {
  var esc = term.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
  return new RegExp('(^|[^\\w-])(' + esc + ')(?![\\w-])', 'i');
}

var PER_SLIDE = 6;

function markSlide(slide) {
  var nodes = Array.prototype.slice.call(slide.querySelectorAll(PROSE));
  var used = {}, n = 0;
  glossKeys().forEach(function (term) {
    if (n >= PER_SLIDE) return;
    /* Two spellings of one idea share a definition and count as one. */
    var def = GLOSSARY[term].d;
    if (used[def]) return;
    var re = glossRe(term);
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].closest('[data-noglossary], button, .gl')) continue;
      if (markIn(nodes[i], re, term)) { used[def] = true; n++; return; }
    }
  });
}

function markIn(el, re, term) {
  var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  var node;
  while ((node = walker.nextNode())) {
    if (node.parentNode.closest('.gl, button, code, [data-noglossary]')) continue;
    var m = re.exec(node.nodeValue);
    if (!m) continue;

    var at = m.index + m[1].length;
    var tail = node.splitText(at);
    tail.nodeValue = tail.nodeValue.slice(m[2].length);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gl';
    btn.dataset.gl = term;
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = m[2];              /* keep the sentence's own casing */
    node.parentNode.insertBefore(btn, tail);
    return true;
  }
  return false;
}

function buildGlossPanel() {
  var el = document.createElement('div');
  el.className = 'gloss';
  el.id = 'gloss';
  el.setAttribute('role', 'dialog');
  /* Without a name this announces as an unlabelled dialog. The term itself
     is the only sensible label, and it is already the first thing in it. */
  el.setAttribute('aria-labelledby', 'gloss-k');
  /* Focusable but not tabbable: it is announced and reachable when the
     panel opens, and stays out of the tab order the rest of the time. */
  el.tabIndex = -1;
  el.hidden = true;
  el.innerHTML =
    '<div class="gloss-k" id="gloss-k"></div>' +
    '<p class="gloss-d"></p>' +
    '<div class="gloss-vs" hidden><span class="gloss-vs-k">Not the same as</span>' +
    '<dl></dl></div>' +
    '<button type="button" class="gloss-go" hidden></button>';
  document.body.appendChild(el);
  return el;
}

/* restore: hand focus back to the word the panel came from. Only the
   keyboard path (Escape) asks for it. Doing it on EVERY close would be
   wrong twice over — a slide change would move focus onto a button on a
   now-hidden slide, and a focused button makes the deck's keydown guard
   hand the arrow keys to that button instead of navigating. */
function closeGloss(restore) {
  if (!glossPanel || glossPanel.hidden) return;
  glossPanel.hidden = true;
  if (glossTerm) {
    glossTerm.setAttribute('aria-expanded', 'false');
    glossTerm.removeAttribute('aria-controls');
    if (restore && glossTerm.closest('.slide.active')) glossTerm.focus();
  }
  glossTerm = null;
}

function openGloss(btn) {
  var entry = GLOSSARY[btn.dataset.gl];
  if (!entry) return;
  if (!glossPanel) glossPanel = buildGlossPanel();

  glossPanel.querySelector('.gloss-k').textContent = btn.dataset.gl;
  glossPanel.querySelector('.gloss-d').textContent = entry.d;

  /* The distinctions, where the term has a famous twin. Built as a
     definition list because that is what it is, and because a term and
     its correction have to stay visibly paired when it wraps. */
  var vs = glossPanel.querySelector('.gloss-vs');
  var dl = vs.querySelector('dl');
  dl.textContent = '';
  vs.hidden = !entry.vs;
  if (entry.vs) {
    entry.vs.forEach(function (pair) {
      var dt = document.createElement('dt');
      dt.textContent = pair[0];
      var dd = document.createElement('dd');
      dd.textContent = pair[1];
      dl.appendChild(dt);
      dl.appendChild(dd);
    });
  }

  var go = glossPanel.querySelector('.gloss-go');
  if (entry.s === null || entry.s === undefined) {
    go.hidden = true;
    go.removeAttribute('data-goto');
  } else {
    go.hidden = false;
    go.textContent = 'Section 0' + entry.s;
    /* data-goto is handled by the deck's delegated listener, so the
       jump costs nothing here — and the slide change closes this. */
    go.dataset.goto = entry.s;
  }

  glossPanel.hidden = false;
  glossTerm = btn;
  btn.setAttribute('aria-expanded', 'true');
  btn.setAttribute('aria-controls', 'gloss');
  placeGloss(btn);
  /* The panel is appended to <body>, nowhere near the word in the tab
     order, so without this a keyboard user opens a definition they then
     cannot reach. Focusing a div (not a control) also keeps the deck's
     arrow keys working while it is open. */
  glossPanel.focus();
}

/* Anchored under the word, clamped to the viewport, and flipped above
   when the word is low enough that the panel would sit under the rail. */
function placeGloss(btn) {
  var r = btn.getBoundingClientRect();
  var p = glossPanel.getBoundingClientRect();
  var pad = 12;

  var left = r.left + r.width / 2 - p.width / 2;
  left = Math.max(pad, Math.min(left, window.innerWidth - p.width - pad));

  var below = r.bottom + 10;
  var top = (below + p.height > window.innerHeight - 80)
    ? r.top - p.height - 10
    : below;
  top = Math.max(pad, top);

  glossPanel.style.left = Math.round(left) + 'px';
  glossPanel.style.top = Math.round(top) + 'px';
}

Array.prototype.slice.call(document.querySelectorAll('.slide')).forEach(markSlide);

document.addEventListener('click', function (e) {
  var btn = e.target.closest && e.target.closest('.gl');
  if (btn) {
    if (glossTerm === btn) closeGloss(); else openGloss(btn);
    return;
  }
  if (!e.target.closest || !e.target.closest('.gloss')) closeGloss();
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeGloss(true);
});
/* Navigating away from the word the panel is pointing at would leave it
   floating over an unrelated slide. */
document.addEventListener('deck:slide', closeGloss);
window.addEventListener('resize', closeGloss);
/* The panel is fixed and anchored once. On a narrow screen the slide itself
   scrolls, so it would otherwise drift away from its word — capture, because
   that scroll happens on the slide, not the window.

   Only a scroll that actually MOVED the word counts. Three slides auto-scroll
   a pane to follow streaming text (§3's decode passage, §2's template output,
   §6's chat threads), and those panes do not contain any marked word — but a
   blanket close treated their every frame as "the reader scrolled away" and
   shut the panel the instant it opened. §3 is where it was unmissable: its
   passage loops forever, so the scrolling never stops, while the other two
   settle once their scenario finishes. */
document.addEventListener('scroll', function (e) {
  if (!glossTerm) return;
  var t = e.target;
  if (t === document || t === document.documentElement || t === window ||
      (t.contains && t.contains(glossTerm))) closeGloss();
}, true);
