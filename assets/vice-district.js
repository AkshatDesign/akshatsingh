/* ==========================================================================
   VICE CITY DISTRICTS — UNIFIED SUBPAGE RUNTIME + DELIGHT ENGINE (v6)
   Powers across all 5 distinct case study subpages:
     1. Unified 3-Zone Vice City Fixed Navbar (mainpage logo, no "Vice City" text)
     2. ViceFX Delight Engine: Neon Spark Bursts, Web Audio Tactile Micro-SFX,
        Scroll-Choreographed Reveals, Animated Number Count-Ups, 3D Spotlight Tilt
     3. Fullscreen Lightbox for [data-zoom] media frames
     4. Exact Main-Page Bottom-Right District Popup (.vc-zone)
     5. 5-District Fast-Travel Footer Bar synced with Resident Pass stamps
     6. Exact Main-Page Car Radio (.rad) with 5 Web Audio Synth Stations
     7. Exact Main-Page Pixel Pals Cursor Companions (#tommy)
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
        { id: 'overview', label: 'Itch Wall' },
        { id: 'craft', label: 'Blueprint' },
        { id: 'gallery', label: 'Filmstrip' },
        { id: 'results', label: 'Awards' }
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
        { id: 'overview', label: 'ROI Lab' },
        { id: 'islands', label: '12 Islands' },
        { id: 'craft', label: 'RTO Radar' },
        { id: 'sky-section', label: 'Results' },
        { id: 'reflection', label: 'Voices' }
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
        { id: 'overview', label: 'System' },
        { id: 'suite', label: '3 Surfaces' },
        { id: 'build', label: 'Pipeline' },
        { id: 'responsive', label: 'Devices' },
        { id: 'results', label: 'Press' }
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
        { id: 'overview', label: 'Showcase' },
        { id: 'launches', label: '4 Unveils' },
        { id: 'process', label: '14-Day Sprint' },
        { id: 'results', label: 'Scorecard' }
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
        { id: 'problem', label: 'Chaos vs Calm' },
        { id: 'principles', label: 'Conflict Lab' },
        { id: 'decisions', label: 'Decisions' },
        { id: 'flow', label: 'Flow' },
        { id: 'screens', label: 'Prototype' }
      ]
    }
  ];

  const key = document.body && document.body.getAttribute('data-project');
  const active = DISTRICTS.find(d => d.key === key);
  if (!active) return;

  // Record Resident Pass stamp
  let visited = new Set();
  try {
    visited = new Set(JSON.parse(localStorage.getItem('vc_stamps') || '[]'));
    visited.add(active.stamp);
    localStorage.setItem('vc_stamps', JSON.stringify([...visited]));
  } catch (_) {}

  /* ========================================================================
     0. VICEFX DELIGHT ENGINE (Sparks · Micro-SFX · Reveals · Counters · Tilt)
     ======================================================================== */
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sparkCanvas = document.createElement('canvas');
  sparkCanvas.id = 'vcSparkCanvas';
  sparkCanvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(sparkCanvas);
  const sCtx = sparkCanvas.getContext('2d');
  let particles = [];
  let sparkRaf = 0;

  function resizeSpark() {
    sparkCanvas.width = innerWidth * Math.min(2, devicePixelRatio || 1);
    sparkCanvas.height = innerHeight * Math.min(2, devicePixelRatio || 1);
    sCtx.setTransform(Math.min(2, devicePixelRatio || 1), 0, 0, Math.min(2, devicePixelRatio || 1), 0, 0);
  }
  resizeSpark();
  addEventListener('resize', resizeSpark, { passive: true });

  function runSparks() {
    sCtx.clearRect(0, 0, innerWidth, innerHeight);
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22;
      p.vx *= 0.985;
      p.rot += p.vr;
      p.life -= 0.022;
      sCtx.save();
      sCtx.globalAlpha = Math.max(0, p.life);
      sCtx.translate(p.x, p.y);
      sCtx.rotate(p.rot);
      sCtx.fillStyle = p.c;
      if (p.shape === 'rect') {
        sCtx.fillRect(-p.s * 0.6, -p.s * 0.35, p.s * 1.2, p.s * 0.7);
      } else {
        sCtx.beginPath();
        sCtx.arc(0, 0, p.s * 0.48, 0, Math.PI * 2);
        sCtx.fill();
      }
      sCtx.restore();
    }
    if (particles.length) sparkRaf = requestAnimationFrame(runSparks);
    else { sparkRaf = 0; sCtx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  function burst(x, y, colors) {
    if (RM) return;
    const palette = colors || ['#FF2E88', '#21E6D1', '#FFD36B', '#FF8A2A', '#FFF5EE'];
    const cx = typeof x === 'number' ? x : innerWidth * 0.5;
    const cy = typeof y === 'number' ? y : innerHeight * 0.45;
    for (let i = 0; i < 34; i++) {
      const ang = (Math.PI * 2 * i) / 34 + (Math.random() - 0.5) * 0.35;
      const spd = 2.6 + Math.random() * 6.8;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 2.6,
        s: 4 + Math.random() * 5,
        c: palette[i % palette.length],
        rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.25,
        shape: i % 2 === 0 ? 'rect' : 'dot',
        life: 0.9 + Math.random() * 0.45
      });
    }
    if (!sparkRaf) sparkRaf = requestAnimationFrame(runSparks);
  }

  let fxAc = null;
  function beep(kind) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!fxAc) fxAc = new AC();
      if (fxAc.state === 'suspended') fxAc.resume();
      const t = fxAc.currentTime;
      const playNote = (freq, dur, delay, vol, type) => {
        const o = fxAc.createOscillator(), g = fxAc.createGain();
        o.type = type || 'triangle';
        o.frequency.setValueAtTime(freq, t + delay);
        g.gain.setValueAtTime(0.0001, t + delay);
        g.gain.linearRampToValueAtTime(vol, t + delay + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
        o.connect(g); g.connect(fxAc.destination);
        o.start(t + delay); o.stop(t + delay + dur + 0.02);
      };
      if (kind === 'success') {
        playNote(523.25, 0.14, 0, 0.06, 'triangle');
        playNote(659.25, 0.16, 0.07, 0.06, 'triangle');
        playNote(783.99, 0.24, 0.14, 0.07, 'sine');
      } else if (kind === 'stamp') {
        playNote(170, 0.11, 0, 0.09, 'sine');
        playNote(340, 0.09, 0.03, 0.05, 'triangle');
      } else if (kind === 'warn') {
        playNote(310, 0.12, 0, 0.055, 'sawtooth');
        playNote(240, 0.14, 0.08, 0.05, 'sawtooth');
      } else {
        playNote(680, 0.055, 0, 0.035, 'triangle');
      }
    } catch (_) {}
  }

  // Scroll reveals
  function initReveals() {
    const els = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!els.length) return;
    if (RM || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(ent => {
        if (!ent.isIntersecting) return;
        const d = Number(ent.target.getAttribute('data-delay') || 0);
        setTimeout(() => ent.target.classList.add('is-in'), d);
        io.unobserve(ent.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    els.forEach(el => io.observe(el));
  }

  // Animated tabular number count-ups
  function initCounters() {
    const els = Array.from(document.querySelectorAll('[data-count]'));
    if (!els.length) return;
    const run = el => {
      const target = parseFloat(el.getAttribute('data-count'));
      const prefix = el.getAttribute('data-prefix') || '';
      const suffix = el.getAttribute('data-suffix') || '';
      const decimals = (el.getAttribute('data-count') || '').includes('.') ? 2 : 0;
      if (RM || isNaN(target)) { el.textContent = prefix + el.getAttribute('data-count') + suffix; return; }
      const dur = 950;
      const t0 = performance.now();
      (function step(now) {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        el.textContent = prefix + (decimals ? val.toFixed(decimals) : Math.round(val)) + suffix;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    };
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(ent => {
        if (!ent.isIntersecting) return;
        run(ent.target);
        io.unobserve(ent.target);
      });
    }, { threshold: 0.35 });
    els.forEach(el => io.observe(el));
  }

  // 3D pointer tilt & neon spotlight
  function initTilt() {
    if (RM || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    document.querySelectorAll('[data-tilt]').forEach(card => {
      const max = parseFloat(card.getAttribute('data-tilt')) || 6;
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        const rx = (0.5 - py) * max * 2;
        const ry = (px - 0.5) * max * 2;
        card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-3px)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  // GTA-style top-right toast helper
  const toastEl = document.createElement('div');
  toastEl.className = 'vc-toast';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastEl);
  let toastT = 0;
  function toast(title, sub, ms) {
    toastEl.innerHTML = '<b>' + String(title || '').replace(/</g, '&lt;') + '</b>' + (sub ? '<span>' + String(sub).replace(/</g, '&lt;') + '</span>' : '');
    toastEl.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('on'), ms || 2600);
  }

  window.ViceFX = { burst, beep, toast, initReveals, initCounters, initTilt };
  initReveals();
  initCounters();
  initTilt();

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
  drawer.addEventListener('click', e => { if (e.target.closest('a')) setDrawer(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) setDrawer(false); });

  const targets = active.nav.map(item => ({ id: item.id, el: document.getElementById(item.id) })).filter(item => item.el);
  function updateScroll() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    if (progEl) progEl.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    let currentId = '';
    const probe = scrollY + 170;
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
     1B. FULLSCREEN MEDIA LIGHTBOX FOR [data-zoom] FRAMES
     ======================================================================== */
  (function initLightbox() {
    const lb = document.createElement('div');
    lb.className = 'cs-lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Enlarged media viewer');
    lb.innerHTML =
      `<button class="cs-lb-close" type="button" aria-label="Close image">✕</button>` +
      `<img class="cs-lb-img" alt="">` +
      `<div class="cs-lb-cap"></div>`;
    document.body.appendChild(lb);

    const imgEl = lb.querySelector('.cs-lb-img');
    const capEl = lb.querySelector('.cs-lb-cap');
    const closeBtn = lb.querySelector('.cs-lb-close');

    function syncTall() {
      const isTall = imgEl.naturalWidth > 0 && imgEl.naturalHeight > imgEl.naturalWidth * 1.65;
      lb.classList.toggle('tall-doc', isTall);
    }
    imgEl.addEventListener('load', syncTall);

    function openLb(src, alt, cap) {
      lb.classList.remove('tall-doc');
      imgEl.src = src; imgEl.alt = alt || ''; capEl.textContent = cap || alt || '';
      lb.classList.add('open');
      lb.scrollTop = 0;
      if (imgEl.complete) syncTall();
      closeBtn.focus();
    }
    function closeLb() { lb.classList.remove('open'); lb.classList.remove('tall-doc'); }

    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-zoom-src]');
      if (btn) {
        const src = btn.getAttribute('data-zoom-src');
        if (src) openLb(src, btn.getAttribute('data-zoom-cap') || '', btn.getAttribute('data-zoom-cap') || '');
        return;
      }
      const frame = e.target.closest('[data-zoom]');
      if (!frame) return;
      const img = frame.tagName === 'IMG' ? frame : frame.querySelector('img');
      if (!img || !img.src) return;
      openLb(img.src, img.alt, frame.getAttribute('data-zoom-cap') || img.alt || '');
    });
    closeBtn.addEventListener('click', closeLb);
    lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && lb.classList.contains('open')) closeLb(); });
  })();

  /* ========================================================================
     2. GTA VICE CITY BOTTOM-RIGHT AREA NAME POPUP (.vc-zone)
     ======================================================================== */
  const zone = document.createElement('div');
  zone.className = 'vc-zone';
  zone.setAttribute('aria-hidden', 'true');
  zone.textContent = active.city;
  document.body.appendChild(zone);
  requestAnimationFrame(() => requestAnimationFrame(() => zone.classList.add('on')));
  setTimeout(() => zone.classList.remove('on'), 2800);

  /* ========================================================================
     3. 5-DISTRICT FAST-TRAVEL FOOTER BAR (.vc-travel)
     ======================================================================== */
  let pkgs = new Set();
  try { pkgs = new Set(JSON.parse(localStorage.getItem('vc_packages') || '[]')); } catch (_) {}
  const pkgDone = pkgs.has(active.stamp);

  const travel = document.createElement('section');
  travel.className = 'vc-travel';
  travel.setAttribute('aria-label', 'Vice City District Fast Travel');
  travel.innerHTML =
    `<div class="vc-travel-in">` +
      `<div class="vc-travel-top">` +
        `<div>` +
          `<div class="vc-travel-eyebrow">Vice City Fast Travel · ${visited.size} / 5 Districts Cleared · <span id="vcPkgStat">${pkgs.size} / 5 Packages</span></div>` +
          `<h2 class="vc-travel-h">Explore Another District</h2>` +
        `</div>` +
        `<div class="vc-travel-acts">` +
          `<button class="vc-pkg${pkgDone ? ' found' : ''}" id="vcPkgBtn" type="button" data-interactive><span class="vc-pkg-gem" aria-hidden="true">${pkgDone ? '✓' : '★'}</span><span>${pkgDone ? 'District Package Found' : 'Grab Hidden Package'}</span></button>` +
          `<button class="vc-travel-home" id="vcCruiseBtn" type="button" data-interactive>Cruise Ride 🚗</button>` +
          `<a class="vc-travel-home" href="/#projects">← Back to Vice City</a>` +
        `</div>` +
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
  document.body.appendChild(travel);

  const pkgBtn = document.getElementById('vcPkgBtn');
  if (pkgBtn) {
    pkgBtn.addEventListener('click', e => {
      const fresh = !pkgs.has(active.stamp);
      pkgs.add(active.stamp);
      try { localStorage.setItem('vc_packages', JSON.stringify([...pkgs])); } catch (_) {}
      pkgBtn.classList.add('found');
      pkgBtn.innerHTML = '<span class="vc-pkg-gem" aria-hidden="true">✓</span><span>District Package Found</span>';
      const st = document.getElementById('vcPkgStat');
      if (st) st.textContent = pkgs.size + ' / 5 Packages';
      beep('success');
      burst(e.clientX, e.clientY, ['#FFD36B', '#21E6D1', '#FF2E88', '#FFF5EE']);
      toast(fresh ? 'Hidden Package Collected!' : 'Package Already Stashed', active.city + ' · ' + pkgs.size + ' / 5 Vice City Packages', 2800);
    });
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
          `<div class="rad-k"><div class="knob" id="radVol" role="slider" tabindex="0" aria-label="Power and volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="60"></div><small>Pwr · Vol</small></div>` +
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
    const kV = box.querySelector('#radVol'), kT = box.querySelector('#radTune');
    const fEl = box.querySelector('#radF'), nEl = box.querySelector('#radN'), nd = box.querySelector('#radNd');
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

    let savedIdx = 0, savedVol = 60;
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
      ac = new AC(); master = ac.createGain(); master.gain.value = 0;
      const comp = ac.createDynamicsCompressor(); an = ac.createAnalyser(); an.fftSize = 64;
      master.connect(comp); comp.connect(an); an.connect(ac.destination);
      delay = ac.createDelay(1); delay.delayTime.value = spb * 3;
      const fb = ac.createGain(); fb.gain.value = .38;
      const dm = ac.createGain(); dm.gain.value = .35;
      delay.connect(fb); fb.connect(delay); delay.connect(dm); dm.connect(master);
      nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return true;
    }
    function tone(type, freq, t, dur, peak, cut, send) {
      const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
      o.type = type; o.frequency.value = freq; f.type = 'lowpass'; f.frequency.value = cut;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(f); f.connect(g); g.connect(master);
      if (send) { const s = ac.createGain(); s.gain.value = send; g.connect(s); s.connect(delay); }
      o.start(t); o.stop(t + dur + .05);
    }
    function kick(t) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .14);
      g.gain.setValueAtTime(.7, t); g.gain.exponentialRampToValueAtTime(.001, t + .28);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + .3);
    }
    function hit(t, dur, peak, hp) {
      const s = ac.createBufferSource(); s.buffer = nb;
      const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
      const g = ac.createGain(); g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
      s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + .02);
    }
    function pad(t, ch, amt) {
      ch.forEach(n => {
        [-7, 7].forEach(det => {
          const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
          o.type = 'sawtooth'; o.frequency.value = mtof(n - 12); o.detune.value = det;
          f.type = 'lowpass'; f.frequency.value = 850;
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.04 * amt, t + .5);
          g.gain.linearRampToValueAtTime(.028 * amt, t + spb * 14); g.gain.linearRampToValueAtTime(0, t + spb * 16 + .3);
          o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + spb * 16 + .4);
        });
      });
    }
    function stat() {
      const t = ac.currentTime, s = ac.createBufferSource(); s.buffer = nb; s.loop = true;
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = .8;
      f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(5000, t + .3);
      const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.3, t + .04);
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
    function tick() { while (nextT < ac.currentTime + .18) { sched(step, nextT); nextT += spb; step++; } }
    function ui() {
      const S = ST[idx];
      box.classList.toggle('on', playing); box.classList.remove('hint');
      fEl.textContent = S.f; nEl.textContent = playing ? S.n : S.n + ' · paused';
      nd.style.setProperty('--np', ((+S.f - 87.5) / (108 - 87.5) * 100).toFixed(1) + '%');
      pres.forEach((b, i) => b.setAttribute('aria-pressed', String(i === idx)));
      kT.style.setProperty('--r', tr + 'deg'); kV.style.setProperty('--r', (vol * 2.7 - 135) + 'deg');
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
      playing = false; master.gain.setTargetAtTime(0, ac.currentTime, .1);
      setTimeout(() => { if (!playing) { clearInterval(timer); ac.suspend(); } }, 450);
      ui();
    }
    const power = () => { if (playing) pause(); else play(); };
    function tune(i) {
      const n = (i + ST.length) % ST.length; tr += (n - idx) * 72; idx = n; spb = 60 / ST[idx].bpm / 4;
      try { localStorage.setItem('vc_radio_idx', String(idx)); } catch (_) {}
      if (ac) delay.delayTime.setTargetAtTime(spb * 3, ac.currentTime, .05);
      if (playing) { stat(); step = 0; nextT = ac.currentTime + .32; } else play();
      ui();
      toast(ST[idx].n, 'FM ' + ST[idx].f + ' · Vice City Radio', 1800);
    }

    pres.forEach((b, i) => b.addEventListener('click', () => tune(i)));
    kT.addEventListener('click', () => tune(idx + 1));
    let wt = 0;
    kT.addEventListener('wheel', e => { e.preventDefault(); const now = performance.now(); if (now - wt < 260) return; wt = now; tune(idx + (e.deltaY > 0 ? 1 : -1)); }, { passive: false });
    kT.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tune(idx + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); tune(idx - 1); }
    });
    let drag = false, moved = 0, ly = 0;
    kV.addEventListener('pointerdown', e => { drag = true; moved = 0; ly = e.clientY; kV.setPointerCapture(e.pointerId); kV.classList.add('drag'); });
    kV.addEventListener('pointermove', e => { if (!drag) return; const dy = ly - e.clientY; ly = e.clientY; moved += Math.abs(dy); if (moved > 3) setVol(vol + dy * 1.2); });
    const end = () => { if (!drag) return; drag = false; kV.classList.remove('drag'); if (moved < 4) power(); };
    kV.addEventListener('pointerup', end); kV.addEventListener('pointercancel', () => { drag = false; kV.classList.remove('drag'); });
    kV.addEventListener('wheel', e => { e.preventDefault(); setVol(vol + (e.deltaY < 0 ? 5 : -5)); }, { passive: false });
    kV.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); power(); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); setVol(vol + 5); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); setVol(vol - 5); }
    });
    document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden && playing) ac.suspend(); else if (!document.hidden && playing) ac.resume(); });
    const arr = new Uint8Array(32);
    (function loop() {
      if (an && playing) { an.getByteFrequencyData(arr); bars.forEach((b, i) => { b.style.height = (12 + arr[i * 2 + 1] / 255 * 88) + '%'; }); }
      else bars.forEach(b => { b.style.height = '14%'; });
      requestAnimationFrame(loop);
    })();
    kV.style.setProperty('--r', (vol * 2.7 - 135) + 'deg'); kT.style.setProperty('--r', tr + 'deg');
    fEl.textContent = ST[idx].f; nd.style.setProperty('--np', ((+ST[idx].f - 87.5) / (108 - 87.5) * 100).toFixed(1) + '%');
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
    const CURSOR_ZOOM = 1, AFK_MS = 3000, AFK_CYCLE = 4000, REVERT_MS = 250, DRAG_PX = 6, SPRITE_SCALE = .68, FOLLOW_OFFSET = [12, 14], FOLLOW_EASE = .25;
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
      default: [V(1, 0, 0, 'tommy', 'Tommy idle'), V(1, 4, 2, 'tommy', 'Hands on hips'), V(1, 0, 3, 'tommy', 'Sunglasses'), V(3, 0, 2, 'lucia', 'Handcuffs'), V(3, 1, 0, 'jason', 'Hat + money bags')],
      hover: [V(1, 0, 3, 'tommy', 'Sunglasses'), V(2, 0, 2, 'tommy', 'Shades, shocked'), V(1, 0, 0, 'tommy', 'Tommy idle'), V(3, 0, 2, 'lucia', 'Handcuffs'), V(3, 1, 0, 'jason', 'Hat + money bags')],
      cool: [V(1, 0, 3, 'tommy', 'Sunglasses'), V(2, 0, 2, 'tommy', 'Shades, shocked')],
      afk: [V(2, 0, 0, 'tommy', 'Rubber duck'), V(2, 0, 1, 'tommy', 'Eating pizza'), V(2, 0, 3, 'tommy', 'Yo-yo'), V(1, 1, 1, 'tommy', 'Waiting in a chair'), V(1, 1, 2, 'tommy', 'Checking the watch'), V(3, 0, 0, 'lucia', 'Flamingo floatie'), V(3, 0, 1, 'lucia', 'Eating a taco'), V(3, 0, 2, 'lucia', 'Handcuffs'), V(3, 1, 0, 'jason', 'Hat + money bags'), V(3, 1, 1, 'jason', 'Yo-yo')],
      click: [V(2, 2, 0, 'tommy', 'Baseball bat'), V(2, 2, 1, 'tommy', 'Chainsaw', [.97, .55]), V(2, 2, 3, 'tommy', 'Molotov'), V(1, 2, 0, 'tommy', 'Punch', [.98, .46]), V(1, 2, 1, 'tommy', 'Punch 2', [.97, .46]), V(1, 2, 3, 'tommy', 'Finger gun', [.99, .37]), V(3, 2, 1, 'lucia', 'Crowbar'), V(3, 2, 3, 'jason', 'Pistol', [.99, .4]), V(3, 2, 2, 'jason', 'Punch', [.9, .5])],
      busy: [V(2, 1, 1, 'tommy', 'Brick phone'), V(2, 1, 0, 'tommy', 'Running from police'), V(2, 1, 2, 'tommy', 'Steering wheel panic'), V(1, 1, 3, 'tommy', 'Tapping the watch'), V(2, 1, 3, 'tommy', 'HELP! drowning'), V(1, 1, 0, 'tommy', 'Phone call'), V(3, 0, 3, 'lucia', 'Phone, crying'), V(3, 0, 4, 'lucia', 'Steering wheel panic'), V(3, 1, 2, 'jason', 'Rope'), V(3, 1, 3, 'jason', 'HELP! drowning'), V(3, 1, 4, 'jason', 'Driving panic')],
      error: [V(2, 3, 0, 'tommy', 'WASTED'), V(2, 3, 3, 'tommy', 'LAG'), V(2, 3, 2, 'tommy', 'Flowerpot'), V(2, 3, 1, 'tommy', 'Crying on knees'), V(1, 3, 3, 'tommy', 'Dropped pizza + phone'), V(1, 3, 1, 'tommy', 'Facepalm'), V(1, 3, 0, 'tommy', 'Panic'), V(1, 3, 2, 'tommy', 'Fall over'), V(3, 3, 0, 'lucia', 'WASTED'), V(3, 3, 2, 'lucia', 'LAG'), V(3, 3, 1, 'jason', 'Dizzy'), V(3, 3, 3, 'jason', 'LAG')],
      drag: [V(2, 4, 2, 'tommy', 'Pushing the safe'), V(2, 4, 1, 'tommy', 'Superman'), V(2, 4, 0, 'tommy', 'Wrestling the arrow'), V(1, 4, 0, 'tommy', 'Pulling back'), V(1, 4, 1, 'tommy', 'Carrying the arrow'), V(2, 4, 3, 'tommy', 'Hanging upside down'), V(1, 4, 3, 'tommy', 'Hanging by the arms'), V(3, 4, 0, 'lucia', 'Wrestling the arrow'), V(3, 4, 1, 'lucia', 'Superman'), V(3, 4, 4, 'lucia', 'Hanging upside down'), V(3, 4, 2, 'jason', 'Pushing the safe'), V(3, 4, 3, 'jason', 'Hanging upside down')]
    };
    const DATA = window.__PALS_SHEETS || {}, root = document.documentElement, POOL_OF = { blocked: 'error', pass: 'cool' }, sprites = {};
    const sid = v => v.sheet + ':' + v.row + ',' + v.col;
    const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });

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
      (o.erase || []).forEach(r => wipe(r, false)); (o.white || []).forEach(r => wipe(r, true));
      const m = new Uint8Array(N);
      for (let i = 0, p = 0; i < N; i++, p += 4) {
        const r = d[p], g = d[p + 1], b = d[p + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), mean = (r + g + b) / 3;
        m[i] = ((mx - mn) < KEY.maxSat && mean < KEY.maxMean && mean >= KEY.minMean && b >= r - KEY.blueBias) ? 0 : 1;
      }
      const rad = Math.max(2, Math.round(6 * k)), tmp = new Uint16Array(N), dl = new Uint8Array(N), ps = new Int32Array(Math.max(w, h) + 1);
      for (let yy = 0; yy < h; yy++) { ps[0] = 0; for (let xx = 0; xx < w; xx++) ps[xx + 1] = ps[xx] + m[yy * w + xx]; for (let xx = 0; xx < w; xx++) tmp[yy * w + xx] = ps[Math.min(w, xx + rad + 1)] - ps[Math.max(0, xx - rad)]; }
      for (let xx = 0; xx < w; xx++) { ps[0] = 0; for (let yy = 0; yy < h; yy++) ps[yy + 1] = ps[yy] + tmp[yy * w + xx]; for (let yy = 0; yy < h; yy++) dl[yy * w + xx] = (ps[Math.min(h, yy + rad + 1)] - ps[Math.max(0, yy - rad)]) > 0 ? 1 : 0; }
      const lab = new Int32Array(N), counts = [0], stack = new Int32Array(N); let n = 0;
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
      const big = Math.max(...counts), need = Math.max(400 * k * k, big * 0.004), kp = new Uint8Array(N);
      for (let i = 0; i < N; i++) if (m[i] && counts[lab[i]] >= need) kp[i] = 1;
      const out = new Uint8Array(N); let sp = 0;
      const seed = i => { if (!kp[i] && !out[i]) { out[i] = 1; stack[sp++] = i; } };
      for (let xx = 0; xx < w; xx++) { seed(xx); seed((h - 1) * w + xx); }
      for (let yy = 0; yy < h; yy++) { seed(yy * w); seed(yy * w + w - 1); }
      while (sp) { const q = stack[--sp], qx = q % w; if (qx > 0) seed(q - 1); if (qx < w - 1) seed(q + 1); if (q >= w) seed(q - w); if (q < N - w) seed(q + w); }
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let i = 0; i < N; i++) {
        if (!kp[i] && !out[i]) kp[i] = 1;
        if (kp[i]) { const xx = i % w, yy = (i - xx) / w; if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
        d[i * 4 + 3] = kp[i] ? 255 : 0;
      }
      if (x1 < 0) return null;
      cx.putImageData(id, 0, 0);
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      const tw = Math.max(1, Math.round(bw / (sh.artPx * k) * SPRITE_SCALE)), th = Math.max(1, Math.round(bh / (sh.artPx * k) * SPRITE_SCALE));
      const sc = document.createElement('canvas'); sc.width = tw; sc.height = th;
      const sx = sc.getContext('2d', { willReadFrequently: true });
      sx.imageSmoothingEnabled = true; sx.imageSmoothingQuality = 'high';
      sx.drawImage(cv, x0, y0, bw, bh, 0, 0, tw, th);
      const sd = sx.getImageData(0, 0, tw, th), a = sd.data;
      for (let i = 3; i < a.length; i += 4) a[i] = a[i] > 110 ? 255 : 0;
      sx.putImageData(sd, 0, 0);
      return { cv: sc, w: tw, h: th };
    }

    const el = document.createElement('div'); el.id = 'tommy'; el.setAttribute('aria-hidden', 'true');
    const cvs = document.createElement('canvas'); cvs.className = 'sp'; el.appendChild(cvs); document.body.appendChild(el);
    const g2 = cvs.getContext('2d');
    let CHAR = 'all', ready = false, cur = { state: '', v: null }, ow = 0, oh = 0;
    let px = -200, py = -200, mx = -200, my = -200, shown = false, loopOn = false;
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
    function place(snap) { if (snap) { const t = aim(); px = t[0]; py = t[1]; } if (!loopOn) { loopOn = true; requestAnimationFrame(tick); } }
    function pick(state) {
      const k = POOL_OF[state] || state, all = (CURSOR_VARIANTS[k] || []).filter(v => sprites[sid(v)]);
      let pool = CHAR === 'all' ? all : all.filter(v => v.who === CHAR);
      if (!pool.length) pool = all; if (!pool.length) return null;
      const cand = pool.length > 1 ? pool.filter(v => sid(v) !== lastId) : pool;
      return cand[Math.floor(Math.random() * cand.length)];
    }
    function render(v) {
      const s = sprites[sid(v)]; if (!s) return;
      lastId = sid(v); cvs.width = s.w; cvs.height = s.h;
      g2.imageSmoothingEnabled = false; g2.clearRect(0, 0, s.w, s.h); g2.drawImage(s.cv, 0, 0);
      cvs.style.width = (s.w * CURSOR_ZOOM) + 'px'; cvs.style.height = (s.h * CURSOR_ZOOM) + 'px';
      ow = s.w * CURSOR_ZOOM; oh = s.h * CURSOR_ZOOM; place();
    }
    function setState(s, force) {
      if (!ready) return;
      if (s === cur.state && !force) return;
      const v = pick(s); cur = { state: s, v: v || cur.v }; el.dataset.s = s;
      if (v) render(v);
      if (s !== 'afk') { clearInterval(afkI); afkI = 0; }
      if (s === 'afk' && !afkI) afkI = setInterval(() => { if (cur.state === 'afk') setState('afk', true); }, AFK_CYCLE);
      if (cur.state !== 'afk' && afkI && !afkOn) { clearInterval(afkI); afkI = 0; }
    }

    const CLICKABLE = 'a[href],button,[role="button"],[role="tab"],[role="switch"],[role="menuitem"],summary,select,label[for],input[type="button"],input[type="submit"],input[type="range"],[tabindex]:not([tabindex="-1"]),.rad-p,.knob,.rad-lcd,.vc-dcard,.cs-tab,[data-zoom],[data-interactive]';
    const BLOCKED = ':disabled,[disabled],[aria-disabled="true"],.disabled,[data-blocked]';
    const TEXT = 'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]),textarea,[contenteditable=""],[contenteditable="true"]';

    function isBusy() { if (busyFlag || document.readyState !== 'complete') return true; return !!(target && target.closest && target.closest('[aria-busy="true"],.is-loading')); }
    function resolve(force) {
      const now = performance.now(), t = target && target.closest ? target : null;
      let s = 'default';
      if (errT > now) s = 'error'; else if (drag) s = 'drag'; else if (down) s = 'click'; else if (fxT > now) s = fxState;
      else {
        if (t && t.closest(BLOCKED)) s = 'blocked'; else if (t && t.closest(CLICKABLE)) s = 'hover'; else if (isBusy()) s = 'busy';
        if (afkOn && (s === 'default' || s === 'hover')) s = 'afk';
      }
      setState(s, force);
    }
    function setTarget(t) {
      target = t;
      const tx = !!(t && t.closest && t.closest(TEXT));
      if (tx !== txt) { txt = tx; root.classList.toggle('tx', tx); el.style.visibility = tx ? 'hidden' : ''; }
      const hc = (t && t.closest) ? t.closest(CLICKABLE) : null;
      const fresh = hc && hc !== hoverEl; hoverEl = hc;
      resolve(!!fresh && !down && !drag && !(errT > performance.now()));
    }
    function wake() { afkOn = false; clearTimeout(afkT); clearInterval(afkI); afkI = 0; afkT = setTimeout(() => { afkOn = true; resolve(); }, AFK_MS); }
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
      if (e.target.closest && e.target.closest(BLOCKED)) { errT = performance.now() + 700; setTimeout(() => resolve(), 720); setTarget(e.target); resolve(true); return; }
      setTarget(e.target); resolve(true);
    }, { capture: true });
    function up() {
      if (!down) return;
      fxState = drag ? 'drag' : 'click'; fxT = performance.now() + REVERT_MS; down = false; drag = false;
      setTimeout(() => resolve(), REVERT_MS + 10); resolve();
    }
    addEventListener('pointerup', up, { capture: true }); addEventListener('pointercancel', up, { capture: true });
    addEventListener('dragstart', () => { if (down && !drag) { drag = true; resolve(true); } }, true);
    addEventListener('dragend', up, true); addEventListener('blur', up);
    document.addEventListener('mouseleave', () => { el.classList.remove('on'); shown = false; });
    document.addEventListener('mouseenter', e => { mx = e.clientX; my = e.clientY; place(true); if (ready && root.classList.contains('tc')) { el.classList.add('on'); shown = true; } });
    const flashErr = () => { errT = performance.now() + 1800; resolve(true); setTimeout(() => resolve(), 1850); };
    addEventListener('error', e => { if (e && e.target && e.target !== window) return; flashErr(); });
    addEventListener('unhandledrejection', flashErr); addEventListener('load', () => resolve());
    setInterval(() => resolve(), 400);

    const need = [], seen = {};
    Object.keys(CURSOR_VARIANTS).forEach(k => CURSOR_VARIANTS[k].forEach(v => { const i = sid(v); if (!seen[i]) { seen[i] = 1; need.push(v); } }));
    const imgs = {};
    Promise.all(Object.keys(SHEETS).map(n => DATA[n] ? loadImg(DATA[n]).then(i => { imgs[n] = i; }).catch(() => {}) : 0)).then(() => {
      let i = 0;
      (function chunk() {
        const t0 = performance.now();
        while (i < need.length && performance.now() - t0 < 14) {
          const v = need[i++], sh = SHEETS[v.sheet], im = imgs[v.sheet], c = sh && sh.cells[v.row + ',' + v.col];
          if (im && c) { try { const s = build(im, sh, c); if (s) sprites[sid(v)] = s; } catch (_) {} }
        }
        if (i < need.length) { setTimeout(chunk, 0); if (!ready && sprites[sid(CURSOR_VARIANTS.default[0])]) start(); return; }
        if (!ready) start();
      })();
    });
    function start() {
      if (ready) return;
      ready = true; setState('default', true); wake();
      if (mx > -100) { shown = true; root.classList.add('tc'); place(true); el.classList.add('on'); }
    }
    window.PixelPals = { sprites, variants: CURSOR_VARIANTS, setChar(c) { CHAR = c; setState(cur.state || 'default', true); }, state: () => cur.state, busy(v) { busyFlag = !!v; resolve(); }, error(ms) { errT = performance.now() + (ms || 1800); resolve(true); setTimeout(() => resolve(), (ms || 1800) + 50); } };
    window.TommyCursor = window.PixelPals;
  })();

  /* ========================================================================
     6. SUBPAGE ARCADE DELIGHT PACK (Ripples · Hero Zap · Magnets · Cheats)
     ======================================================================== */
  (function initSubpageDelight() {
    /* A. Neon Click Ripple on Interactive Controls */
    document.addEventListener('pointerdown', e => {
      if (RM || e.button !== 0) return;
      if (!e.target.closest('button, a, [role="tab"], [role="button"], .vc-hero-title')) return;
      const r = document.createElement('span');
      r.className = 'vc-ripple';
      r.style.left = e.clientX + 'px';
      r.style.top = e.clientY + 'px';
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 600);
    }, { passive: true });

    /* B. Interactive Hero Neon Title Zap */
    const heroTitle = document.querySelector('.vc-hero-title');
    if (heroTitle) {
      heroTitle.title = 'Tap for Miami Vice neon surge';
      heroTitle.addEventListener('click', e => {
        heroTitle.classList.remove('vc-zap');
        void heroTitle.offsetWidth;
        heroTitle.classList.add('vc-zap');
        beep('stamp');
        burst(e.clientX, e.clientY, ['#FF2E88', '#21E6D1', '#FFD36B']);
      });
    }

    /* C. Subtle Magnetic Hover Pull on Primary Buttons (Desktop) */
    if (!RM && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.querySelectorAll('.cs-btn-primary, .cs-btn-ghost, .vc-cta').forEach(btn => {
        btn.addEventListener('pointermove', e => {
          const r = btn.getBoundingClientRect();
          const dx = ((e.clientX - r.left) / r.width - 0.5) * 8;
          const dy = ((e.clientY - r.top) / r.height - 0.5) * 6;
          btn.style.transform = `translate3d(${dx.toFixed(1)}px, ${(dy - 2).toFixed(1)}px, 0)`;
        });
        btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
      });
      document.querySelectorAll('.vc-dcard').forEach(card => {
        card.addEventListener('pointerenter', () => beep('tick'));
      });
    }

    /* D. Neon Vice City Convertible Cruise Spawner */
    function launchCruise() {
      if (RM) { toast('Cruise Ride', 'Enable motion to watch the neon convertible cruise!'); return; }
      const car = document.createElement('div');
      car.className = 'vc-cruise-car';
      car.setAttribute('title', 'Click to honk!');
      car.innerHTML =
        '<svg viewBox="0 0 300 84" aria-hidden="true">' +
          '<defs><linearGradient id="vcTrail" x1="1" x2="0"><stop offset="0" stop-color="#FF2E88" stop-opacity=".95"/><stop offset="1" stop-color="#FF2E88" stop-opacity="0"/></linearGradient></defs>' +
          '<rect x="-100" y="52" width="120" height="4" fill="url(#vcTrail)"/>' +
          '<ellipse cx="150" cy="76" rx="126" ry="7" fill="#21E6D1" opacity=".4"/>' +
          '<g><path d="M8 62l4-13 48-6 40-17 62-3 36 17 66 4 24 8 4 8z" fill="#12051F" stroke="#FF2E88" stroke-width="2.2" stroke-linejoin="round"/>' +
          '<path d="M104 28l58-3 28 15H96z" fill="#3A0F5E" stroke="#FF8A2A" stroke-width="1.4"/>' +
          '<rect x="6" y="50" width="12" height="5" rx="2" fill="#FF2E88"/>' +
          '<rect x="278" y="52" width="14" height="4" rx="2" fill="#FFD36B"/></g>' +
          '<circle cx="62" cy="64" r="13" fill="#05010a" stroke="#FF2E88" stroke-width="2"/>' +
          '<circle cx="62" cy="64" r="6" fill="none" stroke="#FFD36B" stroke-width="2" stroke-dasharray="6 5"/>' +
          '<circle cx="238" cy="64" r="13" fill="#05010a" stroke="#FF2E88" stroke-width="2"/>' +
          '<circle cx="238" cy="64" r="6" fill="none" stroke="#FFD36B" stroke-width="2" stroke-dasharray="6 5"/>' +
        '</svg>';
      car.addEventListener('click', e => {
        beep('warn');
        burst(e.clientX, e.clientY, ['#FF2E88', '#FFD36B', '#21E6D1']);
        toast('BEEP BEEP!', 'Ocean Beach convertible turbo engaged', 1800);
      });
      document.body.appendChild(car);
      beep('stamp');
      toast('Cruise Engaged', 'Click the neon convertible to honk!', 2400);
      setTimeout(() => car.remove(), 6100);
    }
    const cruiseBtn = document.getElementById('vcCruiseBtn');
    if (cruiseBtn) cruiseBtn.addEventListener('click', launchCruise);

    /* E. Live GTA Vice City Cheat Codes on Every Subpage */
    let cBuf = '';
    const CHEATS = {
      hesoyam() {
        beep('success');
        burst(innerWidth * 0.25, innerHeight * 0.35, ['#FFD36B', '#21E6D1', '#FF2E88']);
        setTimeout(() => burst(innerWidth * 0.75, innerHeight * 0.35, ['#FFD36B', '#21E6D1', '#FF2E88']), 160);
        toast('Cheat Activated', 'Health, Armor & +$250,000 in ' + active.city, 3000);
      },
      cruise() { launchCruise(); },
      disco() {
        beep('success');
        document.body.classList.add('vc-disco');
        toast('Vice Disco Mode', '5 seconds of pure 1986 Miami synth prism', 2800);
        setTimeout(() => document.body.classList.remove('vc-disco'), 5000);
      }
    };
    addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      cBuf = (cBuf + e.key.toLowerCase()).slice(-18);
      for (const code in CHEATS) {
        if (cBuf.endsWith(code)) { cBuf = ''; CHEATS[code](); break; }
      }
    });
  })();
})();
