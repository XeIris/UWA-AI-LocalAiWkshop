/* ==========================================================
   NATIVELY LOW-BIT WEIGHTS
   Four ways to store the same 8B model. Bars are bytes, so they shrink
   in proportion; the decode figure is §3's formula reapplied, which is
   the point — a ninth of the file is nine times the tokens per second
   on the same bus.

   Sizes: fp16 is 8.19B x 2 bytes; Q4_K_M and Q2_K are the usual GGUF
   effective bit-widths; Ternary Bonsai 8B is PrismML's published 1.75 GB
   (their GGUF build is 2.03 GiB). Verified Jul 2026.
   ========================================================== */
var bnSlide = document.getElementById('s-bonsai');
if (bnSlide) {
  var BN = [
    { gb: 16.4, name: 'Qwen3 8B &middot; fp16', alpha: '65,536 values',
      qual: 'Reference',
      say: 'Sixteen bits per weight, exactly as the training run left it. ' +
           'Nothing on this slide is smarter than this row &mdash; it is only bigger.' },
    { gb: 4.9,  name: 'Qwen3 8B &middot; Q4_K_M', alpha: '16 values + a scale',
      qual: '&asymp;98% retained',
      say: 'The sweet spot from §4. A third of the size and you would struggle ' +
           'to tell the difference in a blind test.' },
    /* 3.4, not the 2.8 this row used to claim. Q2_K is 3.35 bits per weight
       once its block metadata is counted — the same figure §4's calculator
       and the cliff chart both use — so 8.19 B weights land at 3.4 GB, and
       real files are about that. The old number quietly undercut the deck's
       own arithmetic on the one slide arguing that the arithmetic holds. */
    { gb: 3.4,  name: 'Qwen3 8B &middot; Q2_K', alpha: '4 values + a scale',
      qual: 'Falls apart', cliff: true,
      say: 'And here is the cliff again. Smaller, yes, and quietly broken &mdash; ' +
           'loops, contradictions, confident nonsense. This is the floor.' },
    { gb: 1.75, name: 'Ternary Bonsai 8B', alpha: '&minus;1, 0, +1',
      qual: '75.5 benchmark avg.',
      say: 'Below the floor, and fine. It was never squashed: every weight was ' +
           'one of three values throughout training, so there was nothing to round away.' }
  ];

  var BN_DEVICES = [
    { need: 15 },   /* 16 GB laptop, minus what the OS is already using */
    { need: 6.5 },  /* 8 GB laptop  */
    { need: 3 }     /* a phone      */
  ];
  /* No efficiency fudge. A single constant cannot reproduce both published
     measurements — PrismML's 82 tok/s on an M4 Pro is about half of that
     machine's ceiling, their 27 on an iPhone is about four fifths of its
     one — and a readout that contradicts the measurement quoted in the
     caveat beneath it is worse than no readout. So this is §3's formula
     unmodified, labelled as the ceiling it is, exactly as §3 taught it. */

  var bnRows  = Array.prototype.slice.call(bnSlide.querySelectorAll('.bn-row'));
  var bnStep  = document.getElementById('bnStep');
  var bnGrid  = bnSlide.querySelector('.bn');
  var bnFits  = Array.prototype.slice.call(document.querySelectorAll('#bnFits span'));
  var bnOut = {
    name: document.getElementById('bnName'),
    size: document.getElementById('bnSize'),
    alpha: document.getElementById('bnAlpha'),
    qual: document.getElementById('bnQual'),
    rate: document.getElementById('bnRate'),
    say: document.getElementById('bnSay')
  };
  var bnI = 0, bnBw = 273;

  function bnDraw() {
    var m = BN[bnI], max = BN[0].gb;
    bnRows.forEach(function (r, i) {
      r.classList.toggle('on', i <= bnI);
      r.classList.toggle('cliff', !!BN[i].cliff);
      /* Rows past the current step keep their bar at zero, so stepping
         forward reads as the file being cut rather than a list appearing. */
      r.querySelector('.bn-fill').style.setProperty('--w',
        (i <= bnI ? (BN[i].gb / max) * 100 : 0) + '%');
    });

    bnGrid.classList.toggle('cliff', !!m.cliff);
    bnOut.name.innerHTML = m.name;
    bnOut.size.textContent = m.gb;
    bnOut.alpha.innerHTML = m.alpha;
    bnOut.qual.innerHTML = m.qual;
    bnOut.say.innerHTML = m.say;

    var r = bnBw / m.gb;
    bnOut.rate.innerHTML = '&asymp;' + (r < 10 ? r.toFixed(1) : Math.round(r)) + ' tok/s';

    bnFits.forEach(function (el, i) {
      var head = BN_DEVICES[i].need;
      /* Three states, not two. Without the red one an over-budget model
          fell back to the neutral chip and read as "no data" rather than
          "will not load" — fp16 against a 16 GB laptop hits exactly that. */
      el.classList.toggle('fit', m.gb <= head * 0.8);
      el.classList.toggle('tight', m.gb > head * 0.8 && m.gb <= head);
      el.classList.toggle('no', m.gb > head);
    });

    bnStep.innerHTML = bnI >= BN.length - 1 ? 'Start again &#8635;' : 'Next &#9654;';
  }

  bnStep.addEventListener('click', function () {
    bnI = (bnI + 1) % BN.length;
    bnDraw();
  });
  segGroup('#bnHw', function (b) { bnBw = parseInt(b.dataset.bw, 10); bnDraw(); });

  bnDraw();
}
