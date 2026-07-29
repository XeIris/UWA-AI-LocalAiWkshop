/* ==========================================================
   THE QUESTION
   Deliberately dumb: a class on the container, and a record of which
   card they picked. The teaching is in the copy, not the code — all
   this has to do is not reveal the answer too early.
   ========================================================== */
var qqHost = document.getElementById('qq');
if (qqHost) {
  var qqAnswer = document.getElementById('qqAnswer');
  var qqCaveat = document.getElementById('qqCaveat');
  var qqReset  = document.getElementById('qqReset');
  var qqCards  = Array.prototype.slice.call(qqHost.querySelectorAll('.qq-card'));

  function qqShow(picked) {
    qqHost.classList.add('revealed');
    qqCards.forEach(function (c) {
      c.classList.toggle('picked', c === picked);
      /* Once revealed the cards are a readout, not a control. */
      c.setAttribute('aria-disabled', 'true');
    });
    qqAnswer.hidden = false;
    qqCaveat.hidden = true;
  }

  function qqHide() {
    qqHost.classList.remove('revealed');
    qqCards.forEach(function (c) {
      c.classList.remove('picked');
      c.removeAttribute('aria-disabled');
    });
    qqAnswer.hidden = true;
    qqCaveat.hidden = false;
  }

  qqCards.forEach(function (c) {
    c.addEventListener('click', function () {
      if (qqHost.classList.contains('revealed')) return;
      qqShow(c);
    });
  });

  qqReset.addEventListener('click', qqHide);
}
