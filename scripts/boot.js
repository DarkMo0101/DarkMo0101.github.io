/* ============================================================
   boot.js — skippable boot sequence
   Runs once per browser session. Disabled under reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  var boot = document.getElementById('boot');
  var log = document.getElementById('bootLog');
  if (!boot || !log) return;

  var prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var alreadyBooted = sessionStorage.getItem('msv_booted') === '1';

  // Skip entirely: reduced motion or already seen this session.
  if (prefersReduced || alreadyBooted) {
    finish(true);
    return;
  }

  var LINES = [
    { t: '[ <span class="ok">OK</span> ] mounting /dev/profile ...', d: 90 },
    { t: '[ <span class="ok">OK</span> ] started network manager', d: 70 },
    { t: '[ <span class="ok">OK</span> ] reached target: aws.datacenter', d: 120 },
    { t: '[ <span class="ok">OK</span> ] loading modules: linux net python sec', d: 90 },
    { t: '[ <span class="warn">**</span> ] verifying credentials ...', d: 140 },
    { t: '[ <span class="ok">OK</span> ] authenticated msv@aws', d: 90 },
    { t: 'welcome, mohammadsajjad. launching portfolio ...', d: 160 }
  ];

  var i = 0;
  var timer = null;

  function step() {
    if (i >= LINES.length) {
      timer = setTimeout(function () { finish(false); }, 260);
      return;
    }
    var el = document.createElement('div');
    el.className = 'boot-line';
    el.innerHTML = LINES[i].t;
    log.appendChild(el);
    var delay = LINES[i].d;
    i++;
    timer = setTimeout(step, delay);
  }

  function finish(instant) {
    if (timer) clearTimeout(timer);
    sessionStorage.setItem('msv_booted', '1');
    boot.classList.add('is-done');
    document.removeEventListener('keydown', onKey);
    boot.removeEventListener('click', onSkip);
    // Signal the rest of the page that boot is over.
    window.dispatchEvent(new CustomEvent('msv:booted'));
    if (instant) boot.style.transition = 'none';
    setTimeout(function () {
      if (boot && boot.parentNode) boot.parentNode.removeChild(boot);
    }, 500);
  }

  function onKey(e) { if (e.key === 'Escape') finish(false); }
  function onSkip() { finish(false); }

  document.addEventListener('keydown', onKey);
  boot.addEventListener('click', onSkip);

  step();
})();
