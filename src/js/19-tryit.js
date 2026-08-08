/* ==========================================================
   §1 — COPY A PROMPT
   The prompts on the "say hello" slide are meant to be pasted into
   LM Studio while the download finishes, and typing them off a
   projector is exactly the friction that stops people trying.

   Two paths on purpose. navigator.clipboard is the modern one, but
   it needs a secure context and the deck's whole reason for existing
   is that it opens from a USB stick over file:// — which some
   browsers do not treat as secure. The execCommand fallback is
   deprecated and works everywhere, so it stays until the day it
   doesn't. Neither path is allowed to throw: a dead Copy button is a
   nuisance, an exception mid-slide is a broken deck.
   ========================================================== */
var hiCopyBtns = document.querySelectorAll('.hi-copy');
if (hiCopyBtns.length) {

  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    /* Off-screen rather than hidden: a display:none textarea has no
       selection for execCommand to act on. */
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    var ok = false;
    try {
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      ok = document.execCommand('copy');
    } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function flash(btn, ok) {
    btn.textContent = ok ? 'Copied' : 'Select it';
    btn.classList.toggle('done', ok);
    clearTimeout(btn._t);
    btn._t = setTimeout(function () {
      btn.textContent = 'Copy';
      btn.classList.remove('done');
    }, 1400);
  }

  Array.prototype.forEach.call(hiCopyBtns, function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.hi-p');
      var el = card && card.querySelector('.hi-p-t');
      if (!el) return;
      /* textContent, so the entities in the source arrive as the
         characters someone actually wants in the chat box. */
      var text = el.textContent.trim();

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () { flash(btn, true); },
          function () { flash(btn, legacyCopy(text)); }
        );
      } else {
        flash(btn, legacyCopy(text));
      }
    });
  });
}
