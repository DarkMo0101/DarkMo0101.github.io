/* ============================================================
   sysmon.js — small live touches + scroll reveals
   - status bar clock
   - footer year
   - IntersectionObserver reveal animations
   No heavy canvas; keeps the microsite light.
   ============================================================ */
(function () {
  'use strict';

  // ---- Clock in status bar ----
  var clock = document.getElementById('clock');
  if (clock) {
    var tick = function () {
      var n = new Date();
      var p = function (x) { return String(x).padStart(2, '0'); };
      clock.textContent = p(n.getHours()) + ':' + p(n.getMinutes()) + ':' + p(n.getSeconds());
    };
    tick();
    setInterval(tick, 1000);
  }

  // ---- Footer year ----
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // ---- Scroll reveals ----
  var prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = document.querySelectorAll('.reveal');

  if (prefersReduced || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  items.forEach(function (el, idx) {
    // small stagger within a group
    el.style.transitionDelay = (idx % 6) * 60 + 'ms';
    io.observe(el);
  });
})();
