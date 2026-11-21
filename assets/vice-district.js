/* ==========================================================================
   VICE CITY DISTRICTS — UNIFIED SUBPAGE RUNTIME
   Injects and powers across all 5 case study subpages:
     1. Unified 3-Zone Vice City Fixed Navbar + Scroll-Spy + Sunset Progress Bar
     2. Exact Main-Page Car Radio (.rad) with 5 Web Audio Synthesizer Stations
     3. Exact Main-Page Pixel Pals Cursor Companions (#tommy — Tommy / Lucia / Jason)
     4. Exact Main-Page Bottom-Right District Popup (.vc-zone)
     5. 5-District Fast-Travel Footer Bar synced with Resident Pass stamps
   ========================================================================== */
(function () {
  const DISTRICTS = [
    {
      key: 'fix-my-itch',
      stamp: 'fix-my-itch',
      num: '01',
      city: 'Ocean Beach',
      project: 'FixMyItch',
      color: '#FF2E88',
      url: '/fix-my-itch/',
      liveUrl: 'https://razorpay.com/m/fix-my-itch/',
      liveLabel: 'Live Site ↗',
      nav: [
        { id: 'overview', label: 'Overview' },
        { id: 'process', label: 'Process' },
        { id: 'results', label: 'Results' }
      ]
    },
    {
      key: 'magic-checkout',
      stamp: 'magic-checkout',
      num: '02',
      city: 'Starfish Island',
      project: 'Magic Checkout',
      color: '#21E6D1',
      url: '/magic-checkout/',
      liveUrl: 'https://razorpay.com/magic-checkout/',
      liveLabel: 'Live Site ↗',
      nav: [
        { id: 'overview', label: 'Overview' },
        { id: 'islands', label: 'Islands' },
        { id: 'conversion', label: 'Conversion' },
        { id: 'sky-section', label: 'Results' },
        { id: 'reflection', label: 'Reflection' }
      ]
    },
    {
      key: 'agentic-payments',
      stamp: 'razorpay-agentic-payments',
      num: '03',
      city: 'Downtown Vice',
      project: 'Agentic Payments',
      color: '#FF8A2A',
      url: '/razorpay-agentic-payments/',
      liveUrl: 'https://razorpay.com/agentic-payments/',
      liveLabel: 'Live Site ↗',
      nav: [
        { id: 'overview', label: 'Overview' },
        { id: 'suite', label: 'Suite' },
        { id: 'build', label: 'Build' },
        { id: 'responsive', label: 'Responsive' },
        { id: 'results', label: 'Results' }
      ]
    },
    {
      key: 'ai-launches',
      stamp: 'razorpay-ai-launches',
      num: '04',
      city: 'Vice Point',
      project: 'India AI Impact',
      color: '#21E6D1',
      url: '/razorpay-ai-launches/',
      liveUrl: 'https://razorpay.com/m/india-ai-impact-summit-2026-razorpay-launches/',
      liveLabel: 'Live Site ↗',
      nav: [
        { id: 'overview', label: 'Overview' },
        { id: 'process', label: 'Process' },
        { id: 'launches', label: 'Launches' },
        { id: 'results', label: 'Results' }
      ]
    },
    {
      key: 'journey',
      stamp: 'journey',
      num: '05',
      city: 'Little Havana',
      project: 'Journey',
      color: '#FFD36B',
      url: '/journey/',
      liveUrl: 'https://www.figma.com/design/xsINV0vO8eoy53lH5GeV0V/Journey-App---Multi-Travel-UI-Design---AKSHAT-SINGH?node-id=0-1&t=bRnfDkt2r72Zo9ve-1',
      liveLabel: 'Figma File ↗',
      nav: [
        { id: 'sec-01', label: 'Problem' },
        { id: 'sec-04', label: 'Principles' },
        { id: 'sec-06', label: 'Decisions' },
        { id: 'sec-08', label: 'Flow' },
        { id: 'sec-09', label: 'Screens' }
      ]
    }
  ];

  const key = document.body && document.body.getAttribute('data-project');
  const active = DISTRICTS.find(d => d.key === key);
  if (!active) return;

  // Record Resident Pass stamp for this district
  let visited = new Set();
  try {
    visited = new Set(JSON.parse(localStorage.getItem('vc_stamps') || '[]'));
    visited.add(active.stamp);
    localStorage.setItem('vc_stamps', JSON.stringify([...visited]));
  } catch (_) {}

  /* ========================================================================
     1. UNIFIED 3-ZONE VICE CITY NAVBAR + MOBILE DRAWER + SCROLL PROGRESS
     ======================================================================== */
  const header = document.createElement('header');
  header.className = 'vc-nav';
  header.setAttribute('role', 'banner');
  header.innerHTML =
    `<div class="vc-nav-in">` +
      `<a class="vc-brand" href="/#projects" aria-label="Akshat Singh — Back to portfolio"><img class="vc-logo-img" src="/assets/images/home-1.webp" alt="Akshat Singh" width="147" height="40"></a>` +
      `<nav class="vc-links" aria-label="Case study sections">` +
        active.nav.map(item => `<a href="#${item.id}" data-sec="${item.id}">${item.label}</a>`).join('') +
      `</nav>` +
      `<div class="vc-actions">` +
        `<a class="vc-cta" href="${active.liveUrl}" target="_blank" rel="noopener">${active.liveLabel}</a>` +
        `<button class="vc-burger" type="button" aria-label="Toggle section menu" aria-expanded="false"><span><b></b><b></b><b></b></span></button>` +
      `</div>` +
    `</div>` +
    `<div class="vc-prog" id="vcProg" aria-hidden="true"></div>`;

  const drawer = document.createElement('div');
  drawer.className = 'vc-drawer';
  drawer.setAttribute('aria-label', 'Mobile section navigation');
  drawer.innerHTML =
    active.nav.map(item => `<a href="#${item.id}" data-sec="${item.id}"><span>${item.label}</span><span>→</span></a>`).join('') +
    `<a href="/#projects"><span>All Projects</span><span>←</span></a>`;

  document.body.insertBefore(drawer, document.body.firstChild);
  document.body.insertBefore(header, document.body.firstChild);

  const burger = header.querySelector('.vc-burger');
  const progEl = header.querySelector('#vcProg');
  const navLinks = Array.from(document.querySelectorAll('.vc-links a, .vc-drawer a[data-sec]'));

  function setDrawer(open) {
    drawer.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  }
  burger.addEventListener('click', () => setDrawer(!drawer.classList.contains('open')));
  drawer.addEventListener('click', e => {
    if (e.target.closest('a')) setDrawer(false);
  });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) setDrawer(false);
  });

  // Scroll progress + section scroll-spy
  const targets = active.nav
    .map(item => ({ id: item.id, el: document.getElementById(item.id) }))
    .filter(item => item.el);

  function updateScroll() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    if (progEl) progEl.style.transform = 'scaleX(' + p.toFixed(4) + ')';

    let currentId = '';
    const probe = scrollY + 160;
    for (let i = 0; i < targets.length; i++) {
      const top = targets[i].el.getBoundingClientRect().top + scrollY;
      if (probe >= top) currentId = targets[i].id;
    }
    navLinks.forEach(a => a.classList.toggle('on', a.dataset.sec === currentId));
  }
  addEventListener('scroll', updateScroll, { passive: true });
  addEventListener('resize', updateScroll, { passive: true });
  updateScroll();

  /* ========================================================================
     1B. UNIFY SUBPAGE HERO HEADLINE WITH MAINPAGE MIAMI VICE NEON STYLE
     ======================================================================== */
  (function initHeroTitle() {
    const HERO_SELECTORS = {
      'fix-my-itch': '.cover-title',
      'magic-checkout': '#hero .display',
      'agentic-payments': '.hero-h1',
      'ai-launches': '.cover-title',
      'journey': 'header.hero h1'
    };
    const sel = HERO_SELECTORS[active.key];
    const el = sel ? document.querySelector(sel) : null;
    if (!el || el.classList.contains('vc-hero-title')) return;

    const rawLines = el.innerHTML.split(/<br\s*\/?>/i).map(s => s.trim()).filter(Boolean);
    if (rawLines.length) {
      el.innerHTML = rawLines.map((line, i) =>
        `<span class="vc-hero-row ${i % 2 === 1 ? 'vc-teal' : 'vc-pink'}">${line}</span>`
      ).join('');
    }
    el.classList.add('vc-hero-title');
  })();

  /* ========================================================================
     2. GTA VICE CITY BOTTOM-RIGHT AREA NAME POPUP (Exact Match to .zone)
     ======================================================================== */
  const zone = document.createElement('div');
  zone.className = 'vc-zone';
  zone.setAttribute('aria-hidden', 'true');
  zone.textContent = active.city;
  document.body.appendChild(zone);

  requestAnimationFrame(() => requestAnimationFrame(() => zone.classList.add('on')));
  setTimeout(() => zone.classList.remove('on'), 2800);

  /* ========================================================================
     3. 5-DISTRICT FAST-TRAVEL FOOTER BAR
     ======================================================================== */
  const travel = document.createElement('section');
  travel.className = 'vc-travel';
  travel.setAttribute('aria-label', 'Vice City District Fast Travel');
  travel.innerHTML =
    `<div class="vc-travel-in">` +
      `<div class="vc-travel-top">` +
        `<div>` +
          `<div class="vc-travel-eyebrow">Vice City Fast Travel · ${visited.size} / 5 Districts Cleared</div>` +
          `<h2 class="vc-travel-h">Explore Another District</h2>` +
        `</div>` +
        `<a class="vc-travel-home" href="/#projects">← Back to Vice City</a>` +
      `</div>` +
      `<div class="vc-districts">` +
        DISTRICTS.map(d => {
          const isCur = d.key === active.key;
          const isDone = visited.has(d.stamp);
          const flag = isCur ? 'Here' : (isDone ? 'Cleared ✓' : 'Enter →');
          return (
            `<a class="vc-dcard${isCur ? ' current' : ''}" href="${d.url}" style="--dc:${d.color}"${isCur ? ' aria-current="page"' : ''}>` +
              `<div class="vc-dcard-meta"><span>District ${d.num}</span><span class="vc-dcard-flag">${flag}</span></div>` +
              `<div class="vc-dcard-city">${d.city}</div>` +
              `<div class="vc-dcard-proj">${d.project}</div>` +
            `</a>`
          );
        }).join('') +
      `</div>` +
    `</div>`;

  const oldPager = document.querySelector('nav.cs-pager');
  if (oldPager && oldPager.parentNode) {
    oldPager.parentNode.replaceChild(travel, oldPager);
  } else {
    document.body.appendChild(travel);
  }

  /* ========================================================================
     4. EXACT MAIN PAGE CAR RADIO (.rad) — 5 WEB AUDIO SYNTH STATIONS
     ======================================================================== */
  (function initRadio() {
    if (document.getElementById('rad')) return;
    const box = document.createElement('div');
    box.className = 'rad hint';
    box.id = 'rad';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Car radio');
    box.innerHTML =
      `<div class="rad-in">` +
        `<div class="rad-top">` +
          `<div class="rad-k"><div class="knob" id="radVol" role="slider" tabindex="0" aria-label="Power and volume. Click to play or pause, drag or scroll for volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="60"></div><small>Pwr · Vol</small></div>` +
          `<div class="rad-lcd" aria-live="polite">` +
            `<div class="lcd-r"><span class="lcd-st">ST</span><span class="lcd-f" id="radF">--.-</span><span class="lcd-u">FM</span><span class="rad-eq" id="radEq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></div>` +
            `<div class="lcd-n" id="radN">Tap to tune in</div>` +
            `<div class="lcd-s" aria-hidden="true"><i class="nd" id="radNd"></i></div>` +
          `</div>` +
          `<div class="rad-k"><div class="knob" id="radTune" role="button" tabindex="0" aria-label="Tune: next station"></div><small>Tune</small></div>` +
        `</div>` +
        `<div class="rad-bot">` +
          `<div class="rad-pre" role="group" aria-label="Station presets">` +
            `<button class="rad-p" type="button" aria-pressed="false" aria-label="Wave 103">1</button>` +
            `<button class="rad-p" type="button" aria-pressed="false" aria-label="Emotion 98.3">2</button>` +
            `<button class="rad-p" type="button" aria-pressed="false" aria-label="Fever 105">3</button>` +
            `<button class="rad-p" type="button" aria-pressed="false" aria-label="Flash FM">4</button>` +
            `<button class="rad-p" type="button" aria-pressed="false" aria-label="V-Rock">5</button>` +
          `</div>` +
          `<div class="rad-tape" aria-hidden="true"><i class="reel"></i><i class="reel"></i></div>` +
        `</div>` +
      `</div>`;
    document.body.appendChild(box);

    const lcd = box.querySelector('.rad-lcd');
    lcd.addEventListener('click', () => { box.classList.toggle('open'); });

    const kV = box.querySelector('#radVol');
    const kT = box.querySelector('#radTune');
    const fEl = box.querySelector('#radF');
    const nEl = box.querySelector('#radN');
    const nd = box.querySelector('#radNd');
    const bars = Array.from(box.querySelectorAll('#radEq i'));
    const pres = Array.from(box.querySelectorAll('.rad-p'));

    const D = { kick: [0, 4, 8, 12], snare: [4, 12], hat: 1, bs: [0, 2, 4, 6, 8, 10, 12, 14], bw: 'sawtooth', bc: 420, pad: 1, arp: .05, lead: 'sawtooth', cut: 2300 };
    const ST = [
      { n: 'Wave 103', f: '103.0', bpm: 96, root: [45, 41, 48, 43], ch: [[57, 60, 64], [57, 60, 65], [60, 64, 67], [59, 62, 67]], pat: [0, 1, 2, 1, 0, 2, 1, 2] },
      { n: 'Emotion 98.3', f: '98.3', bpm: 72, root: [41, 48, 43, 45], ch: [[53, 57, 60], [55, 60, 64], [55, 59, 62], [57, 60, 64]], pat: [0, 1, 2, 1, 2, 1, 0, 1], lead: 'triangle', cut: 3200, pad: 1.4, kick: [0, 10], snare: [8], hat: 0, bs: [0, 6, 8, 14], arp: .1 },
      { n: 'Fever 105', f: '105.0', bpm: 112, root: [38, 43, 45, 41], ch: [[50, 53, 57], [55, 59, 62], [57, 60, 64], [53, 57, 60]], pat: [0, 2, 1, 2, 0, 2, 1, 2], lead: 'square', cut: 1800, pad: .6, bs: [0, 3, 6, 8, 11, 14], bw: 'square', bc: 600, arp: .06 },
      { n: 'Flash FM', f: '90.3', bpm: 124, root: [40, 45, 43, 38], ch: [[52, 55, 59], [57, 60, 64], [55, 59, 62], [50, 54, 57]], pat: [0, 1, 2, 1, 2, 1, 2, 0], cut: 3200, pad: .8, arp: .07 },
      { n: 'V-Rock', f: '94.8', bpm: 138, root: [40, 40, 43, 38], ch: [[52, 59, 64], [52, 59, 64], [55, 62, 67], [50, 57, 62]], pat: [0, 1, 2, 1, 0, 1, 2, 1], lead: 'square', cut: 1500, pad: 0, kick: [0, 3, 8, 10], bw: 'square', bc: 700, arp: .07 }
    ].map(s => Object.assign({}, D, s));

    let savedIdx = 0;
    let savedVol = 60;
    try {
      const si = parseInt(localStorage.getItem('vc_radio_idx') || '0', 10);
      const sv = parseInt(localStorage.getItem('vc_radio_vol') || '60', 10);
      if (!isNaN(si) && si >= 0 && si < ST.length) savedIdx = si;
      if (!isNaN(sv) && sv >= 0 && sv <= 100) savedVol = sv;
    } catch (_) {}

    let ac, master, an, delay, nb;
    let playing = false, timer = 0, nextT = 0, step = 0, idx = savedIdx, tr = savedIdx * 72, vol = savedVol;
    let spb = 60 / ST[idx].bpm / 4;
    const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

    function init() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = 0;
      const comp = ac.createDynamicsCompressor();
      an = ac.createAnalyser();
      an.fftSize = 64;
      master.connect(comp);
      comp.connect(an);
      an.connect(ac.destination);
      delay = ac.createDelay(1);
      delay.delayTime.value = spb * 3;
      const fb = ac.createGain();
      fb.gain.value = .38;
      const dm = ac.createGain();
      dm.gain.value = .35;
      delay.connect(fb);
      fb.connect(delay);
      delay.connect(dm);
      dm.connect(master);
      nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = nb.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return true;
    }

    function tone(type, freq, t, dur, peak, cut, send) {
      const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
      o.type = type; o.frequency.value = freq;
      f.type = 'lowpass'; f.frequency.value = cut;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + .006);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(f); f.connect(g); g.connect(master);
      if (send) { const s = ac.createGain(); s.gain.value = send; g.connect(s); s.connect(delay); }
      o.start(t); o.stop(t + dur + .05);
    }

    function kick(t) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(42, t + .14);
      g.gain.setValueAtTime(.7, t);
      g.gain.exponentialRampToValueAtTime(.001, t + .28);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + .3);
    }

    function hit(t, dur, peak, hp) {
      const s = ac.createBufferSource(); s.buffer = nb;
      const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
      const g = ac.createGain();
      g.gain.setValueAtTime(peak, t);
      g.gain.exponentialRampToValueAtTime(.001, t + dur);
      s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + .02);
    }

    function pad(t, ch, amt) {
      ch.forEach(n => {
        [-7, 7].forEach(det => {
          const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
          o.type = 'sawtooth'; o.frequency.value = mtof(n - 12); o.detune.value = det;
          f.type = 'lowpass'; f.frequency.value = 850;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(.04 * amt, t + .5);
          g.gain.linearRampToValueAtTime(.028 * amt, t + spb * 14);
          g.gain.linearRampToValueAtTime(0, t + spb * 16 + .3);
          o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + spb * 16 + .4);
        });
      });
    }

    function stat() {
      const t = ac.currentTime, s = ac.createBufferSource(); s.buffer = nb; s.loop = true;
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = .8;
      f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(5000, t + .3);
      const g = ac.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.3, t + .04);
      g.gain.linearRampToValueAtTime(.12, t + .18); g.gain.exponentialRampToValueAtTime(.001, t + .32);
      s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + .34);
    }

    function sched(s, t) {
      const S = ST[idx], bar = Math.floor(s / 16) % 4, st = s % 16;
      if (S.pad && st === 0) pad(t, S.ch[bar], S.pad);
      if (S.kick.includes(st)) kick(t);
      if (S.snare.includes(st)) hit(t, .18, .32, 1500);
      if (S.hat && st % 4 === 2) hit(t, .05, .11, 7500);
      if (S.bs.includes(st)) tone(S.bw, mtof(S.root[bar] + (st % 8 === 6 ? 12 : 0)), t, spb * 1.8, .2, S.bc, 0);
      tone(S.lead, mtof(S.ch[bar][S.pat[st % 8]] + 12), t, spb * 1.5, S.arp, S.cut, .5);
    }

    function tick() {
      while (nextT < ac.currentTime + .18) { sched(step, nextT); nextT += spb; step++; }
    }

    function ui() {
      const S = ST[idx];
      box.classList.toggle('on', playing);
      box.classList.remove('hint');
      fEl.textContent = S.f;
      nEl.textContent = playing ? S.n : S.n + ' · paused';
      nd.style.setProperty('--np', ((+S.f - 87.5) / (108 - 87.5) * 100).toFixed(1) + '%');
      pres.forEach((b, i) => b.setAttribute('aria-pressed', String(i === idx)));
      kT.style.setProperty('--r', tr + 'deg');
      kV.style.setProperty('--r', (vol * 2.7 - 135) + 'deg');
      kV.setAttribute('aria-valuenow', vol);
    }

    function setVol(v) {
      vol = Math.max(0, Math.min(100, Math.round(v)));
      try { localStorage.setItem('vc_radio_vol', String(vol)); } catch (_) {}
      if (playing && master) master.gain.setTargetAtTime(vol / 100 * .9, ac.currentTime, .05);
      ui();
    }

    async function play() {
      if (!ac && !init()) { nEl.textContent = 'Audio not supported'; return; }
      try { await ac.resume(); } catch (_) {}
      playing = true; step = 0; nextT = ac.currentTime + .08;
      clearInterval(timer); timer = setInterval(tick, 30);
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.setTargetAtTime(vol / 100 * .9, ac.currentTime, .35);
      ui();
    }

    function pause() {
      if (!ac) return;
      playing = false;
      master.gain.setTargetAtTime(0, ac.currentTime, .1);
      setTimeout(() => { if (!playing) { clearInterval(timer); ac.suspend(); } }, 450);
      ui();
    }

    const power = () => { if (playing) pause(); else play(); };

    function tune(i) {
      const n = (i + ST.length) % ST.length;
      tr += (n - idx) * 72;
      idx = n;
      spb = 60 / ST[idx].bpm / 4;
      try { localStorage.setItem('vc_radio_idx', String(idx)); } catch (_) {}
      if (ac) delay.delayTime.setTargetAtTime(spb * 3, ac.currentTime, .05);
      if (playing) { stat(); step = 0; nextT = ac.currentTime + .32; } else play();
      ui();
    }

    pres.forEach((b, i) => b.addEventListener('click', () => tune(i)));
    kT.addEventListener('click', () => tune(idx + 1));
    let wt = 0;
    kT.addEventListener('wheel', e => {
      e.preventDefault();
      const now = performance.now();
      if (now - wt < 260) return;
      wt = now;
      tune(idx + (e.deltaY > 0 ? 1 : -1));
    }, { passive: false });
    kT.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tune(idx + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); tune(idx - 1); }
    });

    let drag = false, moved = 0, ly = 0;
    kV.addEventListener('pointerdown', e => { drag = true; moved = 0; ly = e.clientY; kV.setPointerCapture(e.pointerId); kV.classList.add('drag'); });
    kV.addEventListener('pointermove', e => { if (!drag) return; const dy = ly - e.clientY; ly = e.clientY; moved += Math.abs(dy); if (moved > 3) setVol(vol + dy * 1.2); });
    const end = () => { if (!drag) return; drag = false; kV.classList.remove('drag'); if (moved < 4) power(); };
    kV.addEventListener('pointerup', end);
    kV.addEventListener('pointercancel', () => { drag = false; kV.classList.remove('drag'); });
    kV.addEventListener('wheel', e => { e.preventDefault(); setVol(vol + (e.deltaY < 0 ? 5 : -5)); }, { passive: false });
    kV.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); power(); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); setVol(vol + 5); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); setVol(vol - 5); }
    });

    document.addEventListener('visibilitychange', () => {
      if (!ac) return;
      if (document.hidden && playing) ac.suspend();
      else if (!document.hidden && playing) ac.resume();
    });

    const arr = new Uint8Array(32);
    (function loop() {
      if (an && playing) {
        an.getByteFrequencyData(arr);
        bars.forEach((b, i) => { b.style.height = (12 + arr[i * 2 + 1] / 255 * 88) + '%'; });
      } else {
        bars.forEach(b => { b.style.height = '14%'; });
      }
      requestAnimationFrame(loop);
    })();

    kV.style.setProperty('--r', (vol * 2.7 - 135) + 'deg');
    kT.style.setProperty('--r', tr + 'deg');
    fEl.textContent = ST[idx].f;
    nd.style.setProperty('--np', ((+ST[idx].f - 87.5) / (108 - 87.5) * 100).toFixed(1) + '%');
    pres.forEach((b, i) => b.setAttribute('aria-pressed', String(i === idx)));
    window.__vcRadio = { tune, power, stations: ST, isPlaying: () => playing, current: () => ST[idx] };
  })();

  /* ========================================================================
     5. EXACT MAIN PAGE PIXEL PALS CURSOR (Tommy / Lucia / Jason)
     ======================================================================== */
  (function initPixelPals() {
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    if (document.getElementById('tommy')) return;

    window.__PALS_SHEETS = window.__PALS_SHEETS || {
      1: '/assets/images/home-5.webp',
      2: '/assets/images/home-6.webp',
      3: '/assets/images/home-7.webp'
    };

    const CURSOR_ZOOM = 1;
    const AFK_MS = 3000;
    const AFK_CYCLE = 4000;
    const REVERT_MS = 250;
    const DRAG_PX = 6;
    const SPRITE_SCALE = .68;
    const FOLLOW_OFFSET = [12, 14];
    const FOLLOW_EASE = .25;
    const KEY = { maxSat: 38, minMean: 33, maxMean: 100, blueBias: 6, bgRGB: [37, 39, 48] };

    const SHEETS = {
      1: { w: 5082, h: 3072, artPx: 8.5, cells: {
        '0,0': [732, 41, 836, 615], '0,1': [1815, 41, 1073, 615], '0,2': [3052, 41, 826, 615], '0,3': [4187, 41, 866, 615],
        '1,0': [732, 664, 836, 578], '1,1': [1815, 664, 1073, 578], '1,2': [3052, 664, 826, 578], '1,3': [4187, 664, 866, 578],
        '2,0': [732, 1262, 836, 584], '2,1': [1815, 1262, 1073, 584], '2,2': [3052, 1262, 826, 584], '2,3': [4187, 1262, 866, 584],
        '3,0': [732, 1836, 836, 573], '3,1': [1815, 1836, 1073, 573], '3,2': [3052, 1836, 826, 573], '3,3': [4187, 1836, 866, 573],
        '4,0': [732, 2403, 836, 668], '4,1': [1815, 2403, 1073, 668], '4,2': [3052, 2403, 826, 668], '4,3': [4187, 2403, 866, 668]
      }},
      2: { w: 2752, h: 1536, artPx: 4.6, cells: {
        '0,0': [369, 15, 406, 318], '0,1': [917, 15, 453, 318], '0,2': [1550, 15, 510, 318], '0,3': [2094, 15, 431, 318],
        '1,0': [369, 336, 406, 299], '1,1': [917, 336, 453, 299], '1,2': [1550, 336, 510, 299], '1,3': [2094, 336, 431, 299],
        '2,0': [369, 635, 406, 291], '2,1': [917, 635, 453, 291], '2,2': [1550, 635, 510, 291], '2,3': [2094, 635, 431, 291],
        '3,0': [369, 926, 406, 280], '3,1': [917, 926, 453, 303], '3,2': [1550, 915, 510, 291], '3,3': [2094, 926, 431, 280],
        '4,0': [369, 1206, 406, 329], '4,1': [917, 1229, 453, 245], '4,2': [1550, 1206, 510, 329], '4,3': [2094, 1206, 431, 329]
      }},
      3: { w: 2752, h: 1536, artPx: 4.6, cells: {
        '0,0': [473, 23, 292, 313], '0,1': [1011, 23, 303, 313], '0,2': [1465, 23, 255, 313], '0,3': [1843, 23, 331, 313], '0,4': [2268, 23, 265, 313],
        '1,0': [387, 336, 360, 297], '1,1': [1011, 336, 303, 297], '1,2': [1436, 336, 312, 297], '1,3': [1833, 336, 412, 297], '1,4': [2249, 336, 369, 297],
        '2,0': [482, 639, 302, 291], '2,1': [964, 639, 359, 287], '2,2': [1489, 635, 473, 295], '2,3': [2079, 635, 520, 287],
        '3,0': [369, 968, 485, 242], '3,1': [964, 922, 359, 299], '3,2': [1616, 926, 321, 284],
        '3,3': [2089, 922, 406, 288, { erase: [[2404, 1036, 227, 189]] }],
        '4,0': [435, 1219, 406, 308, { erase: [[359, 1406, 181, 95]] }],
        '4,1': [907, 1229, 444, 236, { erase: [[900, 1232, 144, 83]] }],
        '4,2': [1489, 1210, 458, 302, { erase: [[1503, 1238, 151, 68]] }],
        '4,3': [2089, 1210, 321, 325, { erase: [[2089, 1236, 166, 68]] }],
        '4,4': [2416, 1036, 173, 499]
      }}
    };

    const V = (sheet, row, col, who, label, hot) => ({ sheet, row, col, who, label, hot });
    const CURSOR_VARIANTS = {
      default: [
        V(1, 0, 0, 'tommy', 'Tommy idle'), V(1, 4, 2, 'tommy', 'Hands on hips'), V(1, 0, 3, 'tommy', 'Sunglasses'),
        V(3, 0, 2, 'lucia', 'Handcuffs'), V(3, 1, 0, 'jason', 'Hat + money bags')
      ],
      hover: [
        V(1, 0, 3, 'tommy', 'Sunglasses'), V(2, 0, 2, 'tommy', 'Shades, shocked'), V(1, 0, 0, 'tommy', 'Tommy idle'),
        V(3, 0, 2, 'lucia', 'Handcuffs'), V(3, 1, 0, 'jason', 'Hat + money bags')
      ],
      cool: [V(1, 0, 3, 'tommy', 'Sunglasses'), V(2, 0, 2, 'tommy', 'Shades, shocked')],
      afk: [
        V(2, 0, 0, 'tommy', 'Rubber duck'), V(2, 0, 1, 'tommy', 'Eating pizza'), V(2, 0, 3, 'tommy', 'Yo-yo'),
        V(1, 1, 1, 'tommy', 'Waiting in a chair'), V(1, 1, 2, 'tommy', 'Checking the watch'),
        V(3, 0, 0, 'lucia', 'Flamingo floatie'), V(3, 0, 1, 'lucia', 'Eating a taco'), V(3, 0, 2, 'lucia', 'Handcuffs'),
        V(3, 1, 0, 'jason', 'Hat + money bags'), V(3, 1, 1, 'jason', 'Yo-yo')
      ],
      click: [
        V(2, 2, 0, 'tommy', 'Baseball bat'), V(2, 2, 1, 'tommy', 'Chainsaw', [.97, .55]), V(2, 2, 3, 'tommy', 'Molotov'),
        V(1, 2, 0, 'tommy', 'Punch', [.98, .46]), V(1, 2, 1, 'tommy', 'Punch 2', [.97, .46]), V(1, 2, 3, 'tommy', 'Finger gun', [.99, .37]),
        V(3, 2, 1, 'lucia', 'Crowbar'),
        V(3, 2, 3, 'jason', 'Pistol', [.99, .4]), V(3, 2, 2, 'jason', 'Punch', [.9, .5])
      ],
      busy: [
        V(2, 1, 1, 'tommy', 'Brick phone'), V(2, 1, 0, 'tommy', 'Running from police'), V(2, 1, 2, 'tommy', 'Steering wheel panic'),
        V(1, 1, 3, 'tommy', 'Tapping the watch'), V(2, 1, 3, 'tommy', 'HELP! drowning'), V(1, 1, 0, 'tommy', 'Phone call'),
        V(3, 0, 3, 'lucia', 'Phone, crying'), V(3, 0, 4, 'lucia', 'Steering wheel panic'),
        V(3, 1, 2, 'jason', 'Rope'), V(3, 1, 3, 'jason', 'HELP! drowning'), V(3, 1, 4, 'jason', 'Driving panic')
      ],
      error: [
        V(2, 3, 0, 'tommy', 'WASTED'), V(2, 3, 3, 'tommy', 'LAG'), V(2, 3, 2, 'tommy', 'Flowerpot'), V(2, 3, 1, 'tommy', 'Crying on knees'),
        V(1, 3, 3, 'tommy', 'Dropped pizza + phone'), V(1, 3, 1, 'tommy', 'Facepalm'), V(1, 3, 0, 'tommy', 'Panic'), V(1, 3, 2, 'tommy', 'Fall over'),
        V(3, 3, 0, 'lucia', 'WASTED'), V(3, 3, 2, 'lucia', 'LAG'),
        V(3, 3, 1, 'jason', 'Dizzy'), V(3, 3, 3, 'jason', 'LAG')
      ],
      drag: [
        V(2, 4, 2, 'tommy', 'Pushing the safe'), V(2, 4, 1, 'tommy', 'Superman'), V(2, 4, 0, 'tommy', 'Wrestling the arrow'),
        V(1, 4, 0, 'tommy', 'Pulling back'), V(1, 4, 1, 'tommy', 'Carrying the arrow'), V(2, 4, 3, 'tommy', 'Hanging upside down'), V(1, 4, 3, 'tommy', 'Hanging by the arms'),
        V(3, 4, 0, 'lucia', 'Wrestling the arrow'), V(3, 4, 1, 'lucia', 'Superman'), V(3, 4, 4, 'lucia', 'Hanging upside down'),
        V(3, 4, 2, 'jason', 'Pushing the safe'), V(3, 4, 3, 'jason', 'Hanging upside down')
      ]
    };

    const DATA = window.__PALS_SHEETS || {};
    const root = document.documentElement;
    const POOL_OF = { blocked: 'error', pass: 'cool' };
    const sprites = {};
    const sid = v => v.sheet + ':' + v.row + ',' + v.col;

    function loadImg(src) {
      return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
    }

    function build(img, sh, cell) {
      const k = img.naturalWidth / sh.w, o = cell[4] || {};
      const x = Math.max(0, Math.round(cell[0] * k)), y = Math.max(0, Math.round(cell[1] * k));
      const w = Math.min(img.naturalWidth - x, Math.round(cell[2] * k)), h = Math.min(img.naturalHeight - y, Math.round(cell[3] * k));
      if (w < 4 || h < 4) return null;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const cx = cv.getContext('2d', { willReadFrequently: true });
      cx.drawImage(img, x, y, w, h, 0, 0, w, h);
      const id = cx.getImageData(0, 0, w, h), d = id.data, N = w * h, bg = KEY.bgRGB;
      const box = r => [Math.max(0, Math.round(r[0] * k) - x), Math.max(0, Math.round(r[1] * k) - y), Math.min(w, Math.round((r[0] + r[2]) * k) - x), Math.min(h, Math.round((r[1] + r[3]) * k) - y)];
      const wipe = (r, onlyWhite) => {
        const b = box(r);
        for (let yy = b[1]; yy < b[3]; yy++) for (let xx = b[0]; xx < b[2]; xx++) {
          const p = (yy * w + xx) * 4;
          if (onlyWhite) {
            const a = d[p], b2 = d[p + 1], c = d[p + 2], hi = Math.max(a, b2, c), lo = Math.min(a, b2, c);
            if (!((a + b2 + c) / 3 > 100 && hi - lo < 40)) continue;
          }
          d[p] = bg[0]; d[p + 1] = bg[1]; d[p + 2] = bg[2];
        }
      };
      (o.erase || []).forEach(r => wipe(r, false));
      (o.white || []).forEach(r => wipe(r, true));

      const m = new Uint8Array(N);
      for (let i = 0, p = 0; i < N; i++, p += 4) {
        const r = d[p], g = d[p + 1], b = d[p + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), mean = (r + g + b) / 3;
        const isBg = (mx - mn) < KEY.maxSat && mean < KEY.maxMean && mean >= KEY.minMean && b >= r - KEY.blueBias;
        m[i] = isBg ? 0 : 1;
      }

      const rad = Math.max(2, Math.round(6 * k)), tmp = new Uint16Array(N), dl = new Uint8Array(N), ps = new Int32Array(Math.max(w, h) + 1);
      for (let yy = 0; yy < h; yy++) {
        ps[0] = 0;
        for (let xx = 0; xx < w; xx++) ps[xx + 1] = ps[xx] + m[yy * w + xx];
        for (let xx = 0; xx < w; xx++) tmp[yy * w + xx] = ps[Math.min(w, xx + rad + 1)] - ps[Math.max(0, xx - rad)];
      }
      for (let xx = 0; xx < w; xx++) {
        ps[0] = 0;
        for (let yy = 0; yy < h; yy++) ps[yy + 1] = ps[yy] + tmp[yy * w + xx];
        for (let yy = 0; yy < h; yy++) dl[yy * w + xx] = (ps[Math.min(h, yy + rad + 1)] - ps[Math.max(0, yy - rad)]) > 0 ? 1 : 0;
      }

      const lab = new Int32Array(N), counts = [0], stack = new Int32Array(N);
      let n = 0;
      for (let s = 0; s < N; s++) {
        if (!dl[s] || lab[s]) continue;
        n++; let sp = 0, c = 0; stack[sp++] = s; lab[s] = n;
        while (sp) {
          const q = stack[--sp]; if (m[q]) c++; const qx = q % w;
          if (qx > 0 && dl[q - 1] && !lab[q - 1]) { lab[q - 1] = n; stack[sp++] = q - 1; }
          if (qx < w - 1 && dl[q + 1] && !lab[q + 1]) { lab[q + 1] = n; stack[sp++] = q + 1; }
          if (q >= w && dl[q - w] && !lab[q - w]) { lab[q - w] = n; stack[sp++] = q - w; }
          if (q < N - w && dl[q + w] && !lab[q + w]) { lab[q + w] = n; stack[sp++] = q + w; }
        }
        counts.push(c);
      }

      const big = Math.max(...counts), need = Math.max(400 * k * k, big * 0.004);
      const kp = new Uint8Array(N);
      for (let i = 0; i < N; i++) if (m[i] && counts[lab[i]] >= need) kp[i] = 1;

      const out = new Uint8Array(N); let sp = 0;
      const seed = i => { if (!kp[i] && !out[i]) { out[i] = 1; stack[sp++] = i; } };
      for (let xx = 0; xx < w; xx++) { seed(xx); seed((h - 1) * w + xx); }
      for (let yy = 0; yy < h; yy++) { seed(yy * w); seed(yy * w + w - 1); }
      while (sp) {
        const q = stack[--sp], qx = q % w;
        if (qx > 0) seed(q - 1); if (qx < w - 1) seed(q + 1); if (q >= w) seed(q - w); if (q < N - w) seed(q + w);
      }

      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let i = 0; i < N; i++) {
        if (!kp[i] && !out[i]) kp[i] = 1;
        if (kp[i]) {
          const xx = i % w, yy = (i - xx) / w;
          if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy;
        }
        d[i * 4 + 3] = kp[i] ? 255 : 0;
      }
      if (x1 < 0) return null;
      cx.putImageData(id, 0, 0);

      const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      const tw = Math.max(1, Math.round(bw / (sh.artPx * k) * SPRITE_SCALE));
      const th = Math.max(1, Math.round(bh / (sh.artPx * k) * SPRITE_SCALE));
      const sc = document.createElement('canvas'); sc.width = tw; sc.height = th;
      const sx = sc.getContext('2d', { willReadFrequently: true });
      sx.imageSmoothingEnabled = true; sx.imageSmoothingQuality = 'high';
      sx.drawImage(cv, x0, y0, bw, bh, 0, 0, tw, th);
      const sd = sx.getImageData(0, 0, tw, th), a = sd.data;
      for (let i = 3; i < a.length; i += 4) a[i] = a[i] > 110 ? 255 : 0;
      sx.putImageData(sd, 0, 0);
      return { cv: sc, w: tw, h: th };
    }

    const el = document.createElement('div');
    el.id = 'tommy';
    el.setAttribute('aria-hidden', 'true');
    const cvs = document.createElement('canvas');
    cvs.className = 'sp';
    el.appendChild(cvs);
    document.body.appendChild(el);
    const g2 = cvs.getContext('2d');

    let CHAR = 'all', ready = false, cur = { state: '', v: null }, ow = 0, oh = 0;
    let px = -200, py = -200, mx = -200, my = -200, shown = false, loopOn = false;
    const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
    let target = null, hoverEl = null, down = false, drag = false, sx = 0, sy = 0;
    let fxState = '', fxT = 0, errT = 0, busyFlag = false, txt = false, afkOn = false, afkT = 0, afkI = 0, lastId = '';

    function aim() {
      let x = mx + FOLLOW_OFFSET[0], y = my + FOLLOW_OFFSET[1];
      if (x + ow > innerWidth - 4) x = mx - FOLLOW_OFFSET[0] - ow;
      if (y + oh > innerHeight - 4) y = my - FOLLOW_OFFSET[1] - oh;
      return [x, y];
    }
    function tick() {
      const t = aim(), k = RM ? 1 : FOLLOW_EASE;
      px += (t[0] - px) * k; py += (t[1] - py) * k;
      el.style.transform = 'translate3d(' + Math.round(px) + 'px,' + Math.round(py) + 'px,0)';
      if (Math.abs(t[0] - px) > .4 || Math.abs(t[1] - py) > .4) requestAnimationFrame(tick);
      else loopOn = false;
    }
    function place(snap) {
      if (snap) { const t = aim(); px = t[0]; py = t[1]; }
      if (!loopOn) { loopOn = true; requestAnimationFrame(tick); }
    }
    function pick(state) {
      const k = POOL_OF[state] || state, all = (CURSOR_VARIANTS[k] || []).filter(v => sprites[sid(v)]);
      let pool = CHAR === 'all' ? all : all.filter(v => v.who === CHAR);
      if (!pool.length) pool = all;
      if (!pool.length) return null;
      const cand = pool.length > 1 ? pool.filter(v => sid(v) !== lastId) : pool;
      return cand[Math.floor(Math.random() * cand.length)];
    }
    function render(v) {
      const s = sprites[sid(v)]; if (!s) return;
      lastId = sid(v);
      cvs.width = s.w; cvs.height = s.h;
      g2.imageSmoothingEnabled = false; g2.clearRect(0, 0, s.w, s.h); g2.drawImage(s.cv, 0, 0);
      cvs.style.width = (s.w * CURSOR_ZOOM) + 'px';
      cvs.style.height = (s.h * CURSOR_ZOOM) + 'px';
      ow = s.w * CURSOR_ZOOM; oh = s.h * CURSOR_ZOOM;
      place();
    }
    function setState(s, force) {
      if (!ready) return;
      if (s === cur.state && !force) return;
      const v = pick(s);
      cur = { state: s, v: v || cur.v };
      el.dataset.s = s;
      if (v) render(v);
      if (s !== 'afk') { clearInterval(afkI); afkI = 0; }
      if (s === 'afk' && !afkI) afkI = setInterval(() => { if (cur.state === 'afk') setState('afk', true); }, AFK_CYCLE);
      if (cur.state !== 'afk' && afkI && !afkOn) { clearInterval(afkI); afkI = 0; }
    }

    const CLICKABLE = 'a[href],button,[role="button"],[role="tab"],[role="switch"],[role="menuitem"],summary,select,label[for],input[type="button"],input[type="submit"],[tabindex]:not([tabindex="-1"]),.rad-p,.knob,.rad-lcd,.vc-dcard,.dtab,.mc-tab,.dev-tab,.process-item,.acc .head,.isl';
    const BLOCKED = ':disabled,[disabled],[aria-disabled="true"],.disabled,[data-blocked]';
    const TEXT = 'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]),textarea,[contenteditable=""],[contenteditable="true"]';

    function isBusy() {
      if (busyFlag || document.readyState !== 'complete') return true;
      return !!(target && target.closest && target.closest('[aria-busy="true"],.is-loading'));
    }
    function resolve(force) {
      const now = performance.now(), t = target && target.closest ? target : null;
      let s = 'default';
      if (errT > now) s = 'error';
      else if (drag) s = 'drag';
      else if (down) s = 'click';
      else if (fxT > now) s = fxState;
      else {
        if (t && t.closest(BLOCKED)) s = 'blocked';
        else if (t && t.closest(CLICKABLE)) s = 'hover';
        else if (isBusy()) s = 'busy';
        if (afkOn && (s === 'default' || s === 'hover')) s = 'afk';
      }
      setState(s, force);
    }
    function setTarget(t) {
      target = t;
      const tx = !!(t && t.closest && t.closest(TEXT));
      if (tx !== txt) { txt = tx; root.classList.toggle('tx', tx); el.style.visibility = tx ? 'hidden' : ''; }
      const hc = (t && t.closest) ? t.closest(CLICKABLE) : null;
      const fresh = hc && hc !== hoverEl;
      hoverEl = hc;
      resolve(!!fresh && !down && !drag && !(errT > performance.now()));
    }
    function wake() {
      afkOn = false; clearTimeout(afkT); clearInterval(afkI); afkI = 0;
      afkT = setTimeout(() => { afkOn = true; resolve(); }, AFK_MS);
    }
    function move(e) {
      mx = e.clientX; my = e.clientY; place();
      if (!shown && ready) { shown = true; root.classList.add('tc'); place(true); el.classList.add('on'); }
      if (afkOn || !afkT) wake(); else { clearTimeout(afkT); afkT = setTimeout(() => { afkOn = true; resolve(); }, AFK_MS); }
      if (afkOn === false && cur.state === 'afk') resolve();
      if (down && !drag && Math.hypot(mx - sx, my - sy) > DRAG_PX) { drag = true; resolve(true); }
      if (e.target !== target) setTarget(e.target);
    }

    addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; move(e); }, { passive: true, capture: true });
    addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      mx = e.clientX; my = e.clientY; sx = mx; sy = my; down = true; drag = false; wake();
      if (e.target.closest && e.target.closest(BLOCKED)) {
        errT = performance.now() + 700; setTimeout(() => resolve(), 720); setTarget(e.target); resolve(true); return;
      }
      setTarget(e.target); resolve(true);
    }, { capture: true });
    function up() {
      if (!down) return;
      fxState = drag ? 'drag' : 'click';
      fxT = performance.now() + REVERT_MS;
      down = false; drag = false;
      setTimeout(() => resolve(), REVERT_MS + 10);
      resolve();
    }
    addEventListener('pointerup', up, { capture: true });
    addEventListener('pointercancel', up, { capture: true });
    addEventListener('dragstart', () => { if (down && !drag) { drag = true; resolve(true); } }, true);
    addEventListener('dragend', up, true);
    addEventListener('blur', up);
    document.addEventListener('mouseleave', () => { el.classList.remove('on'); shown = false; });
    document.addEventListener('mouseenter', e => {
      mx = e.clientX; my = e.clientY; place(true);
      if (ready && root.classList.contains('tc')) { el.classList.add('on'); shown = true; }
    });
    const flashErr = () => { errT = performance.now() + 1800; resolve(true); setTimeout(() => resolve(), 1850); };
    addEventListener('error', e => { if (e && e.target && e.target !== window) return; flashErr(); });
    addEventListener('unhandledrejection', flashErr);
    addEventListener('load', () => resolve());
    setInterval(() => resolve(), 400);

    const need = [], seen = {};
    Object.keys(CURSOR_VARIANTS).forEach(k => CURSOR_VARIANTS[k].forEach(v => {
      const i = sid(v); if (!seen[i]) { seen[i] = 1; need.push(v); }
    }));
    const imgs = {};
    Promise.all(Object.keys(SHEETS).map(n => DATA[n] ? loadImg(DATA[n]).then(i => { imgs[n] = i; }).catch(() => {}) : 0)).then(() => {
      let i = 0;
      (function chunk() {
        const t0 = performance.now();
        while (i < need.length && performance.now() - t0 < 14) {
          const v = need[i++], sh = SHEETS[v.sheet], im = imgs[v.sheet], c = sh && sh.cells[v.row + ',' + v.col];
          if (im && c) {
            try { const s = build(im, sh, c); if (s) sprites[sid(v)] = s; } catch (_) {}
          }
        }
        if (i < need.length) {
          setTimeout(chunk, 0);
          if (!ready && sprites[sid(CURSOR_VARIANTS.default[0])]) start();
          return;
        }
        if (!ready) start();
      })();
    });

    function start() {
      if (ready) return;
      ready = true;
      setState('default', true);
      wake();
      if (mx > -100) { shown = true; root.classList.add('tc'); place(true); el.classList.add('on'); }
    }

    window.PixelPals = {
      sprites, variants: CURSOR_VARIANTS,
      setChar(c) { CHAR = c; setState(cur.state || 'default', true); },
      state: () => cur.state,
      busy(v) { busyFlag = !!v; resolve(); },
      error(ms) { errT = performance.now() + (ms || 1800); resolve(true); setTimeout(() => resolve(), (ms || 1800) + 50); }
    };
    window.TommyCursor = window.PixelPals;
  })();
})();
