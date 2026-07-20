/* ============================================================
   terminal.js — typed hero terminal + INTERACTIVE shell
   Types a short intro sequence, then hands control to the
   visitor: a real prompt that accepts commands (help, whoami,
   skills, neofetch, social, clear, and a few easter eggs).
   Honors reduced-motion by rendering the intro instantly.
   All visitor input is HTML-escaped before echo.
   ============================================================ */
(function () {
  'use strict';

  var body = document.getElementById('termBody');
  if (!body) return;

  var prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Intro script: typed commands + instant output ----
  var SCRIPT = [
    { type: 'cmd', text: 'whoami' },
    { type: 'out', html: 'Data Center Ops Tech III @ <span class="hl">AWS</span>' },
    { type: 'cmd', text: 'cat stack.txt' },
    { type: 'out', html: 'Linux · Networking · Python · Cybersecurity · AWS' },
    { type: 'cmd', text: 'status --availability' },
    { type: 'out', html: '<span class="hl">open</span> to new opportunities' }
  ];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function lineEl(html) {
    var d = document.createElement('div');
    d.className = 'line';
    if (html != null) d.innerHTML = html;
    return d;
  }

  function scrollBottom() { body.scrollTop = body.scrollHeight; }

  // ============================================================
  //  Interactive shell
  // ============================================================
  var term = document.getElementById('term');
  var history = [];
  var histIdx = 0;         // points one past the last entry
  var promptLine, mirror, input;

  var COMMANDS = {
    help: function () {
      return [
        'available commands:',
        '  <span class="k">help</span>       this list',
        '  <span class="k">whoami</span>     who is this',
        '  <span class="k">skills</span>     technical proficiencies',
        '  <span class="k">experience</span> work history',
        '  <span class="k">social</span>     profiles &amp; links',
        '  <span class="k">contact</span>    how to reach me',
        '  <span class="k">neofetch</span>   system summary',
        '  <span class="k">date</span>       current time',
        '  <span class="k">clear</span>      wipe the screen',
        'try tab-completion &middot; &uarr;/&darr; for history'
      ];
    },
    whoami: function () {
      return [
        'mohammadsajjad vahora',
        'Data Center Ops Tech III @ <span class="hl">Amazon Web Services</span>',
        '3+ years keeping critical cloud infra alive.'
      ];
    },
    skills: function () {
      return [
        'data center ops  [<span class="hl">█████████</span>─] expert',
        'linux            [<span class="hl">████████</span>──] advanced',
        'networking       [<span class="hl">████████</span>──] advanced',
        'aws cloud        [<span class="hl">███████</span>───] advanced',
        'cybersecurity    [<span class="hl">███████</span>───] intermediate',
        'python           [<span class="hl">██████</span>────] intermediate'
      ];
    },
    experience: function () {
      return [
        '<span class="hl">DCO Tech III</span> · AWS · <em>current</em>',
        '  critical infra, hardware deploy, high availability',
        '<span class="hl">IT Support II</span> · Amazon · <em>previous</em>',
        '  hw/sw troubleshooting, network config, end-user support',
        '<span class="hl">IT Equipment Coordinator</span> · Amazon · <em>earlier</em>',
        '  asset lifecycle, procurement, inventory, deployment'
      ];
    },
    social: function () {
      return [
        'github    <a href="https://github.com/DarkMo0101" target="_blank" rel="noopener noreferrer">github.com/DarkMo0101</a>',
        'htb       <a href="https://app.hackthebox.com/profile/SigmaDrako" target="_blank" rel="noopener noreferrer">app.hackthebox.com/SigmaDrako</a>',
        'linkedin  <a href="https://www.linkedin.com/in/sajjad-v-012335261/" target="_blank" rel="noopener noreferrer">linkedin.com/in/sajjad-v</a>',
        'tryhackme <a href="https://tryhackme.com/" target="_blank" rel="noopener noreferrer">tryhackme.com</a>'
      ];
    },
    contact: function () {
      return [
        'open to cloud infra, cybersecurity &amp; data center roles.',
        'jump to the <a href="#contact">contact panel &rsaquo;</a>'
      ];
    },
    neofetch: function () {
      var now = new Date();
      return [
        '<span class="hl">mohammadsajjad</span>@aws',
        '---------------------',
        '<span class="k">role</span>   DCO Tech III',
        '<span class="k">host</span>   Amazon Web Services',
        '<span class="k">os</span>     Linux',
        '<span class="k">focus</span>  Infra · Cybersecurity',
        '<span class="k">uptime</span> 3+ yrs',
        '<span class="k">shell</span>  ' + now.toTimeString().slice(0, 8),
        '<span class="k">status</span> <span class="hl">● online</span>'
      ];
    },
    date: function () { return [new Date().toString()]; },
    ls: function () {
      return ['experience/  skills/  profiles/  contact/  <span class="hl">secrets.txt</span>'];
    },
    echo: function (args) { return [args.length ? esc(args.join(' ')) : '']; },
    sudo: function () {
      return ['<span class="err">mohammadsajjad is not in the sudoers file. This incident will be reported. 😏</span>'];
    },
    coffee: function () {
      return ['<span class="err">HTTP 418</span> — I\'m a teapot. ☕ but the servers stay warm.'];
    },
    history: function () {
      if (!history.length) return ['(no history yet)'];
      return history.map(function (h, i) { return '  ' + (i + 1) + '  ' + esc(h); });
    },
    exit: function () { return ['there is no exit. only more uptime. 🟢']; }
  };
  // Alias
  COMMANDS.exp = COMMANDS.experience;
  COMMANDS.profiles = COMMANDS.social;
  COMMANDS.about = COMMANDS.whoami;

  var COMPLETIONS = Object.keys(COMMANDS).concat(['clear', 'matrix']).sort();

  function outLine(html, cls) {
    return lineEl('<span class="out' + (cls ? ' ' + cls : '') + '">' + html + '</span>');
  }

  function print(html, cls) {
    body.insertBefore(outLine(html, cls), promptLine);
  }

  function clearScreen() {
    var n;
    while ((n = body.firstChild) && n !== promptLine) body.removeChild(n);
  }

  // ---- Matrix easter egg: brief rain inside the terminal ----
  function matrixRain() {
    if (prefersReduced) {
      print('wake up, neo… ▓▒░ following the white rabbit ░▒▓');
      return;
    }
    var GLYPHS = 'ｱｲｳｴｵｶｷｸ01<>#$%&*+=/\\';
    var COLS = 34, ROWS = 8;
    var drops = [];
    for (var c = 0; c < COLS; c++) drops[c] = Math.floor(Math.random() * ROWS) - ROWS;
    var pre = document.createElement('pre');
    pre.className = 'matrix-rain';
    pre.setAttribute('aria-hidden', 'true');
    body.insertBefore(pre, promptLine);
    var frames = 0;
    var timer = setInterval(function () {
      var rows = [];
      for (var r = 0; r < ROWS; r++) rows[r] = '';
      for (var col = 0; col < COLS; col++) {
        var head = drops[col];
        for (var row = 0; row < ROWS; row++) {
          rows[row] += (row <= head && row > head - 3 && head >= 0 && head < ROWS + 3)
            ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
            : ' ';
        }
        drops[col] = head > ROWS + 2 ? Math.floor(Math.random() * -6) : head + 1;
      }
      pre.textContent = rows.join('\n');
      if (++frames > 26) {
        clearInterval(timer);
        pre.remove();
        print('<span class="hl">the matrix has you.</span> follow the white rabbit → <a href="https://github.com/DarkMo0101" target="_blank" rel="noopener noreferrer">github.com/DarkMo0101</a>');
        scrollBottom();
      }
      scrollBottom();
    }, 80);
  }

  function run(raw) {
    var trimmed = raw.trim();
    // echo the entered command
    body.insertBefore(
      lineEl('<span class="prompt">$</span><span class="cmd">' + esc(trimmed) + '</span>'),
      promptLine
    );
    if (trimmed) {
      history.push(trimmed);
      histIdx = history.length;
    }

    var parts = trimmed.split(/\s+/);
    var name = (parts.shift() || '').toLowerCase();

    if (!name) { /* blank line */ }
    else if (name === 'clear') { clearScreen(); }
    else if (name === 'matrix') { matrixRain(); }
    else if (COMMANDS[name]) {
      COMMANDS[name](parts).forEach(function (h) { print(h); });
    } else {
      print('command not found: ' + esc(name) + " — type <span class=\"k\">help</span>", 'err');
    }

    input.value = '';
    mirror.textContent = '';
    scrollBottom();
  }

  function complete() {
    var val = input.value.trim().toLowerCase();
    if (!val) return;
    var matches = COMPLETIONS.filter(function (c) { return c.indexOf(val) === 0; });
    if (matches.length === 1) {
      input.value = matches[0];
      mirror.textContent = matches[0];
    } else if (matches.length > 1) {
      body.insertBefore(
        lineEl('<span class="prompt">$</span><span class="cmd">' + esc(val) + '</span>'),
        promptLine
      );
      print(matches.join('  '));
      scrollBottom();
    }
  }

  function onKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      run(input.value);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx > 0) { histIdx--; input.value = history[histIdx]; mirror.textContent = input.value; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx]; }
      else { histIdx = history.length; input.value = ''; }
      mirror.textContent = input.value;
    }
  }

  function initInteractive() {
    // hidden-but-focusable input drives a visible mirrored line
    input = document.createElement('input');
    input.className = 'ti-input';
    input.type = 'text';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('aria-label', 'Interactive terminal — type a command such as help');

    promptLine = lineEl(
      '<span class="prompt">$</span><span class="cmd ti-mirror"></span><span class="cursor"></span>'
    );
    mirror = promptLine.querySelector('.ti-mirror');

    body.appendChild(promptLine);
    body.appendChild(input);
    print('interactive shell ready — type <span class="k">help</span>, or <span class="k">matrix</span> if you\'re curious.', 'hint');

    input.addEventListener('input', function () { mirror.textContent = input.value; scrollBottom(); });
    input.addEventListener('keydown', onKey);
    input.addEventListener('focus', function () { term && term.classList.remove('is-blur'); });
    input.addEventListener('blur', function () { term && term.classList.add('is-blur'); });

    // click / tap anywhere in the terminal to start typing
    if (term) {
      term.classList.add('is-blur');
      term.addEventListener('mousedown', function (e) {
        // let real links inside output work normally
        if (e.target.closest && e.target.closest('a')) return;
        e.preventDefault();
        input.focus();
      });
    }
    scrollBottom();
  }

  // ---- Intro rendering ----
  function renderInstant() {
    body.textContent = '';
    SCRIPT.forEach(function (s) {
      if (s.type === 'cmd') {
        body.appendChild(lineEl('<span class="prompt">$</span><span class="cmd">' + s.text + '</span>'));
      } else {
        body.appendChild(lineEl('<span class="out">' + s.html + '</span>'));
      }
    });
    initInteractive();
  }

  function typeRun() {
    body.textContent = '';
    var idx = 0;

    function next() {
      if (idx >= SCRIPT.length) { initInteractive(); return; }
      var step = SCRIPT[idx];

      if (step.type === 'out') {
        body.appendChild(lineEl('<span class="out">' + step.html + '</span>'));
        idx++;
        scrollBottom();
        setTimeout(next, 280);
        return;
      }

      // typed command
      var lc = lineEl('<span class="prompt">$</span><span class="cmd"></span><span class="cursor"></span>');
      body.appendChild(lc);
      var cmdSpan = lc.querySelector('.cmd');
      var cursor = lc.querySelector('.cursor');
      var chars = step.text.split('');
      var ci = 0;

      (function typeChar() {
        if (ci < chars.length) {
          cmdSpan.textContent += chars[ci++];
          scrollBottom();
          setTimeout(typeChar, 55 + Math.random() * 45);
        } else {
          if (cursor) cursor.remove();
          idx++;
          setTimeout(next, 240);
        }
      })();
    }

    next();
  }

  function start() {
    if (prefersReduced) renderInstant();
    else typeRun();
  }

  // Wait for boot to finish if it's present, otherwise start now.
  var boot = document.getElementById('boot');
  if (boot && !boot.classList.contains('is-done')) {
    window.addEventListener('msv:booted', start, { once: true });
    setTimeout(function () {
      if (body.childElementCount === 0) start();
    }, 4000);
  } else {
    start();
  }
})();
