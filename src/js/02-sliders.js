/* ==========================================================
   TICK SLIDERS
   Wraps every range input in a scale of ticks. The bulge is a
   gaussian falloff around the grip position, so the swell is smooth
   rather than a hard neighbourhood.
   ========================================================== */
var TICKS = 44, SPREAD = 3.2;

Array.prototype.forEach.call(
  document.querySelectorAll('input[type=range]'),
  function (input) {
    var wrap = document.createElement('div');
    wrap.className = 'tickslider';
    var scale = document.createElement('div');
    scale.className = 'ticks';
    scale.setAttribute('aria-hidden', 'true');

    var marks = [];
    for (var i = 0; i < TICKS; i++) {
      var m = document.createElement('span');
      m.className = 'tick';
      scale.appendChild(m);
      marks.push(m);
    }

    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(scale);
    wrap.appendChild(input);

    function paint() {
      var min = parseFloat(input.min) || 0;
      var max = parseFloat(input.max);
      var pos = ((input.value - min) / (max - min)) * (TICKS - 1);
      var grip = Math.round(pos);
      for (var i = 0; i < TICKS; i++) {
        var d = i - pos;
        var swell = Math.exp(-(d * d) / (2 * SPREAD * SPREAD));
        marks[i].style.height = (22 + 62 * swell) + '%';
        marks[i].className =
          'tick' + (i === grip ? ' grip' : (i < grip ? ' on' : ''));
      }
    }

    input.addEventListener('input', paint);
    paint();
  }
);
