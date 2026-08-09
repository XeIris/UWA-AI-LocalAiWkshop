/* ==========================================================
   GLOSSARY AUDIT  —  open the deck with ?audit
   (or run tools/glossary-audit.py, which does exactly that in
   headless Chrome and reads the report back out of the DOM)

   The marking pass in 21-glossary.js is deliberately quiet: it takes
   the first PER_SLIDE terms it meets and says nothing about the rest.
   That is right for a projected deck and useless for maintaining one —
   "some words are underlined and some are not" is impossible to act on
   without knowing WHICH, and why.

   So this reports, over the built deck, the three ways the glossary and
   the slides can drift apart:

     A  defined and never used     — an entry no slide's text contains.
                                     Either the sentence that used it was
                                     reworded, or the entry was written
                                     for a slide that does not exist.
     B  in prose and not marked    — the term is there, in a container
                                     the pass reads, and the slide's
                                     budget went elsewhere. Expected in
                                     small numbers; a long list means
                                     PER_SLIDE is too tight for that
                                     slide, or the slide is too dense.
     C  only outside prose         — the only occurrence is in a heading,
                                     a readout or a control, where the
                                     pass will not mark and should not.
                                     Worth a look: if a beginner meets
                                     the word first in an <h2>, the
                                     dotted version further down may
                                     never be found.
     D  used and never defined     — a word that looks like jargon (an
                                     acronym, a dotted name, or one of
                                     WATCH below) appears in prose with
                                     no entry behind it. This is the one
                                     that matters most: the audience is
                                     a hobbyist club, not a CS cohort,
                                     and the terms that need defining are
                                     not the ones that feel advanced to
                                     whoever wrote the slide.

   A and D fail the check. B and C are reports to read, not errors —
   both have legitimate instances, and turning them into failures would
   only teach whoever runs this to stop reading the output.
   ========================================================== */

/* ?audit, and deliberately not #audit: 00-deck.js reads the hash for a
   starting slide and rewrites it before this file runs, so a hash flag
   is gone by the time anything here could see it. The query string is
   untouched, and survives a slide change too. */
var AUDIT = /(^|[?&])audit\b/.test(location.search);

/* Words a beginner may not have, that no acronym or dotted-name rule
   would ever catch. Add to this list freely — an entry here costs
   nothing until the word is actually on a slide, and then it costs one
   line of output until someone decides whether it needs defining. */
var WATCH = [
  'activation', 'agent', 'agentic', 'api', 'apache 2.0', 'attention',
  'backend', 'batch', 'bit', 'byte', 'checkpoint', 'cli', 'compute',
  'context length', 'cpu', 'dgpu', 'distillation', 'embedding',
  'endpoint', 'epoch', 'fine-tuning', 'flops', 'fp16', 'gpu',
  'greedy', 'guardrails', 'head', 'inference engine', 'instruct',
  'latency', 'layer', 'license', 'lora', 'metadata', 'model card',
  'multimodal', 'neural network', 'offload', 'offloading', 'open source',
  'parallel', 'pcie', 'precision', 'prompt', 'quantize', 'ram',
  'reasoning', 'repo', 'runtime', 'soc', 'speculative decoding',
  'streaming', 'throughput', 'time to first token', 'tool calling',
  'training', 'transformer', 'unquantized', 'vector', 'vocabulary',
  'wrapper'
];

/* Not jargon, or not jargon a glossary can help with. Three kinds:
   initialisms any adult in the room already owns; units; and PRODUCT
   NAMES — a model, a card, a chip or a filename is a proper noun, and
   the slide it sits on is already saying what it is. Defining "H100"
   would be defining the example instead of the idea. */
var AUDIT_STOP = {
  ai: 1, pc: 1, usb: 1, pdf: 1, os: 1, uk: 1, us: 1, id: 1, ok: 1,
  qr: 1, url: 1, mit: 1, gb: 1, mb: 1, kb: 1, tb: 1, ms: 1, hz: 1,
  no: 1, and: 1, the: 1, a: 1, i: 1,
  gpt: 1, h100: 1, m1: 1, m2: 1, m3: 1, m4: 1, m5: 1, a4b: 1, rtx: 1,
  ddr5: 1, mha: 1, mqa: 1, qwen: 1, gemma: 1, lfm2: 1, glm: 1,
  'q1_0.gguf': 1, 'q2_0.gguf': 1, 'q2_0_g64.gguf': 1, 'pq2_0.gguf': 1
};

/* A candidate that is only ever part of a term the glossary already
   defines is not undefined: "LM" comes from "LM Studio" and "KV" from
   "KV cache", and reporting them would train whoever runs this to skim
   category D, which is the one category worth reading closely. */
function auditCovered(word, keys) {
  var re = new RegExp('(^|[^\\w-])' + word.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') +
                      '(?![\\w-])', 'i');
  for (var i = 0; i < keys.length; i++) if (re.test(keys[i])) return true;
  return false;
}

function auditProse(slide) {
  return Array.prototype.slice.call(slide.querySelectorAll(PROSE))
    .filter(function (n) { return !n.closest('[data-noglossary], button, a'); });
}

/* The text of a prose node MINUS the parts the marking pass will not
   touch. Without this the closing slide's reading list reports
   "arxiv.org" as undefined jargon: the words are inside an <a>, which
   the pass skips by design, so demanding a definition for them would be
   demanding one for something that can never be marked. */
function auditProseText(node) {
  var copy = node.cloneNode(true);
  Array.prototype.slice.call(copy.querySelectorAll('a, button, code, [data-noglossary]'))
    .forEach(function (n) { n.remove(); });
  return copy.textContent;
}

/* What the pass actually produced, read back off the page rather than
   recorded on the way past — the point is to check the result, not to
   check that a counter agrees with itself. */
function auditMarked(slide) {
  var out = {};
  Array.prototype.slice.call(slide.querySelectorAll('.gl')).forEach(function (b) {
    out[b.dataset.gl] = true;
  });
  return out;
}

function auditSlides() {
  return Array.prototype.slice.call(document.querySelectorAll('.slide'));
}

function auditLabel(slide, i) {
  var sec = slide.dataset.section;
  return 'slide ' + (i < 10 ? '0' + i : i) + (sec ? '  §' + sec : '    ');
}

function runGlossAudit() {
  var slides = auditSlides();
  var keys = glossKeys();
  var lines = [];
  var everywhere = {};          /* term -> used anywhere in any slide text */
  var unmarked = [];            /* B */
  var outside = [];             /* C */
  var perSlide = [];            /* E */
  var marks = 0;

  slides.forEach(function (slide, i) {
    var prose = auditProse(slide);
    var proseText = prose.map(auditProseText).join('\n');
    var allText = slide.textContent;
    var marked = auditMarked(slide);
    var here = Object.keys(marked);
    marks += here.length;
    perSlide.push(auditLabel(slide, i) + '  ' + (here.length || '-') +
                  (here.length ? '   ' + here.join(', ') : '   (nothing marked)'));

    var missB = [], missC = [];
    keys.forEach(function (term) {
      var re = GLOSS_RE[term];
      if (!re.test(allText)) return;
      everywhere[term] = true;
      if (marked[term]) return;
      /* An alias counts as marked: "open weights" and "open-weight" share
         a definition, and marking either one answers the question. */
      var def = GLOSSARY[term].d, twin = false;
      Object.keys(marked).forEach(function (m) {
        if (GLOSSARY[m] && GLOSSARY[m].d === def) twin = true;
      });
      if (twin) return;
      (re.test(proseText) ? missB : missC).push(term);
    });
    if (missB.length) unmarked.push(auditLabel(slide, i) + '  ' + missB.join(', '));
    if (missC.length) outside.push(auditLabel(slide, i) + '  ' + missC.join(', '));
  });

  /* A — defined, never used. By DEFINITION, not by key: aliases share
     one definition on purpose, and "context window" earning its place
     because the slides say "context length" is the mechanism working,
     not a miss. */
  var liveDef = {};
  keys.forEach(function (t) { if (everywhere[t]) liveDef[GLOSSARY[t].d] = true; });
  var dead = keys.filter(function (t) {
    return !everywhere[t] && !liveDef[GLOSSARY[t].d];
  }).sort();

  /* D — used, never defined. Three catchers: all-caps initialisms,
     dotted names (llama.cpp, artificialanalysis.ai), and WATCH. */
  var proseAll = slides.map(function (s) {
    return auditProse(s).map(auditProseText).join('\n');
  });
  var defined = {};
  keys.forEach(function (t) { defined[t] = true; });

  var found = {};                        /* candidate -> [slide indices] */
  function note(word, i) {
    var k = word.toLowerCase();
    if (defined[k] || AUDIT_STOP[k] || auditCovered(k, keys)) return;
    (found[k] = found[k] || []).push(i);
  }
  proseAll.forEach(function (text, i) {
    var m, acro = /\b[A-Z][A-Z0-9]{1,6}\b/g;
    while ((m = acro.exec(text))) note(m[0], i);
    var dot = /\b[a-z][\w-]*\.[a-z]{2,4}\b/gi;
    while ((m = dot.exec(text))) note(m[0], i);
    WATCH.forEach(function (w) {
      if (glossRe(w).test(text)) note(w, i);
    });
  });
  var undefd = Object.keys(found).sort(function (a, b) {
    return found[b].length - found[a].length || a.localeCompare(b);
  });

  /* ---- the report ---- */
  lines.push('GLOSSARY AUDIT  ·  ' + slides.length + ' slides  ·  ' +
             keys.length + ' entries  ·  ' + marks + ' marks placed  ·  ' +
             'PER_SLIDE ' + PER_SLIDE);
  lines.push('');

  lines.push('A · DEFINED, NEVER USED  (' + dead.length + ')   [fails]');
  lines.push(dead.length
    ? '    ' + dead.join(', ')
    : '    none — every entry is a word that is actually on a slide.');
  lines.push('');

  lines.push('D · USED, NEVER DEFINED  (' + undefd.length + ')   [fails]');
  if (!undefd.length) lines.push('    none.');
  undefd.forEach(function (w) {
    var at = found[w].filter(function (v, k, arr) { return arr.indexOf(v) === k; });
    lines.push('    ' + (w + '                    ').slice(0, 22) +
               '×' + found[w].length + '   slides ' + at.join(' '));
  });
  lines.push('');

  lines.push('B · IN PROSE, BUDGET SPENT ELSEWHERE  (' + unmarked.length +
             ' slides)   [report]');
  if (!unmarked.length) lines.push('    none.');
  unmarked.forEach(function (l) { lines.push('    ' + l); });
  lines.push('');

  lines.push('C · ONLY IN A HEADING OR READOUT  (' + outside.length +
             ' slides)   [report]');
  if (!outside.length) lines.push('    none.');
  outside.forEach(function (l) { lines.push('    ' + l); });
  lines.push('');

  lines.push('E · WHAT EACH SLIDE MARKED   [report]');
  perSlide.forEach(function (l) { lines.push('    ' + l); });
  lines.push('');

  var fails = dead.length + undefd.length;
  lines.push('AUDIT: ' + fails + ' issue' + (fails === 1 ? '' : 's') +
             ' (A ' + dead.length + ', D ' + undefd.length + ')');
  return lines.join('\n');
}

if (AUDIT) {
  var auditText = runGlossAudit();
  /* Both outlets on purpose: the console is where a person reads it, the
     <pre> is where headless Chrome's --dump-dom can reach it. */
  if (window.console && console.log) console.log(auditText);
  var auditBox = document.createElement('div');
  auditBox.className = 'audit';
  var auditPre = document.createElement('pre');
  auditPre.id = 'gloss-audit';
  auditPre.textContent = auditText;
  var auditClose = document.createElement('button');
  auditClose.type = 'button';
  auditClose.className = 'audit-x';
  auditClose.textContent = 'close';
  auditClose.addEventListener('click', function () { auditBox.remove(); });
  auditBox.appendChild(auditClose);
  auditBox.appendChild(auditPre);
  document.body.appendChild(auditBox);
}
