/* ==========================================================================
   VICE CITY 3D OCEAN DRIVE — LAZY MODULE LAUNCHER (v6)
   Keeps portfolio pages 100% lightweight & uncluttered until the user clicks
   "Play Game" or presses Shift+G, plays the full-screen Vice intro loading
   video while the 3D WebGL engine boots in the background, then seamlessly
   transitions into Ocean Drive.
   ========================================================================== */
(function () {
  if (window.__VICE_GAME_LOADER_INIT__) return;
  window.__VICE_GAME_LOADER_INIT__ = true;

  const INTRO_VIDEO_SRC = '/assets/aistudio/video-output-48E6302F-A817-4C11-AA9E-976B53580E70-1_23a49bf0.MP4';

  const scriptEl = document.currentScript;
  const moduleUrl = scriptEl && scriptEl.src
    ? new URL('./vice-game-3d.js?v=49', scriptEl.src).href
    : '/assets/vice-game-3d.js?v=49';

  function isMobileViewport() {
    try {
      return window.matchMedia('(max-width: 900px), (hover: none) and (pointer: coarse)').matches;
    } catch (_) {
      return window.innerWidth <= 900;
    }
  }

  let modulePromise = null;
  let loadingEl = null;
  let activeLaunchCleanup = null;
  let isLaunching = false;

  function focusGameStage() {
    try {
      const stage = document.querySelector('.v3-stage');
      if (document.activeElement && document.activeElement !== stage && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      if (typeof window.focus === 'function') window.focus();
      if (stage && typeof stage.focus === 'function') {
        stage.focus({ preventScroll: true });
      }
    } catch (_) {}
  }

  function cleanupActiveLaunch() {
    if (typeof activeLaunchCleanup === 'function') {
      try { activeLaunchCleanup(); } catch (_) {}
      activeLaunchCleanup = null;
    }
    isLaunching = false;
  }

  function hideLoading(fadeOut) {
    if (!loadingEl) return;
    const el = loadingEl;
    loadingEl = null;
    const vid = el.querySelector('video');
    if (vid) {
      try { vid.pause(); } catch (_) {}
    }
    if (fadeOut) {
      el.classList.add('v3-loading-fade');
      window.setTimeout(() => {
        try { el.remove(); } catch (_) {}
        focusGameStage();
      }, 500);
    } else {
      el.remove();
      focusGameStage();
    }
  }

  function showLoadError(err) {
    cleanupActiveLaunch();
    console.error('[ViceCity3D] Failed to load or initialize 3D game:', err);
    if (!loadingEl) {
      loadingEl = document.createElement('div');
      loadingEl.className = 'v3-loading';
      document.body.appendChild(loadingEl);
    }
    loadingEl.classList.remove('v3-loading-fade', 'v3-loading-ready');
    const detail = err && err.message ? String(err.message).replace(/[<>&]/g, '') : '';
    loadingEl.innerHTML =
      '<div class="v3-loading-error">' +
      '<span>Could not launch 3D engine on this browser.</span>' +
      (detail ? '<span style="opacity:0.68;font-size:10px;max-width:460px;text-align:center;text-transform:none;letter-spacing:0.02em;">' + detail + '</span>' : '') +
      '<div style="display:flex;gap:10px;margin-top:8px;">' +
      '<button type="button" data-v3-retry style="padding:8px 16px;border-radius:8px;border:1px solid #21E6D1;background:rgba(33,230,209,0.16);color:#21E6D1;font:700 12px/1 \'JetBrains Mono\',monospace;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;">Retry</button>' +
      '<button type="button" data-v3-dismiss style="padding:8px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.28);background:transparent;color:#FFF5EE;font:700 12px/1 \'JetBrains Mono\',monospace;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;">Close</button>' +
      '</div></div>';
    const retryBtn = loadingEl.querySelector('[data-v3-retry]');
    const dismissBtn = loadingEl.querySelector('[data-v3-dismiss]');
    if (retryBtn) retryBtn.addEventListener('click', () => { modulePromise = null; hideLoading(false); openViceGame(); });
    if (dismissBtn) dismissBtn.addEventListener('click', () => { document.body.classList.remove('vice-game-open'); hideLoading(false); });
  }

  function createVideoLoadingScreen() {
    hideLoading(false);
    const wrap = document.createElement('div');
    wrap.className = 'v3-loading';
    wrap.innerHTML =
      '<video class="v3-loading-video" playsinline preload="auto"></video>' +
      '<div class="v3-loading-vignette"></div>' +
      '<div class="v3-loading-hud">' +
        '<div class="v3-loading-status">' +
          '<div class="v3-loading-row">' +
            '<span class="v3-loading-dot"></span>' +
            '<span data-v3-status-text>Loading Vice City 3D…</span>' +
          '</div>' +
          '<div class="v3-loading-bar"><div class="v3-loading-bar-fill" data-v3-bar></div></div>' +
        '</div>' +
      '</div>';

    const video = wrap.querySelector('video');
    video.src = INTRO_VIDEO_SRC;
    video.muted = false;
    video.volume = 0.92;
    document.body.appendChild(wrap);
    loadingEl = wrap;

    return {
      wrap,
      video,
      statusText: wrap.querySelector('[data-v3-status-text]'),
      barFill: wrap.querySelector('[data-v3-bar]')
    };
  }

  async function openViceGame() {
    if (isMobileViewport()) return;
    if (isLaunching) return;
    isLaunching = true;

    try {
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      if (typeof window.focus === 'function') window.focus();
    } catch (_) {}

    document.body.classList.add('vice-game-open');
    if (typeof window.__stopMainWebsiteRadio === 'function') window.__stopMainWebsiteRadio();
    window.dispatchEvent(new CustomEvent('vice:game-open'));
    document.querySelectorAll('audio, video').forEach((m) => { try { m.pause(); } catch (_) {} });

    // Unlock Web Audio AudioContext synchronously inside the Play Game click gesture so the car engine & synth radio start immediately after the loading video
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const ac = (window.__VICE_UNLOCKED_AC__ && window.__VICE_UNLOCKED_AC__.state !== 'closed')
          ? window.__VICE_UNLOCKED_AC__
          : new AC();
        window.__VICE_UNLOCKED_AC__ = ac;
        if (ac.state === 'suspended') ac.resume().catch(() => {});
        const silentBuf = ac.createBuffer(1, 1, 22050);
        const silentSrc = ac.createBufferSource();
        silentSrc.buffer = silentBuf;
        silentSrc.connect(ac.destination);
        silentSrc.start(0);
      }
    } catch (_) {}

    // Pre-warm Special Intro RJ synchronously inside the user click gesture so autoplay never blocks after the intro video finishes
    try {
      const introAudio = new Audio('/assets/aistudio/Intro-RJ_902dec53.mp3');
      introAudio.preload = 'auto';
      introAudio.volume = 0.001;
      introAudio.__claimed = false;
      window.__VICE_INTRO_RJ_AUDIO__ = introAudio;
      const p = introAudio.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          if (!introAudio.__claimed) {
            try { introAudio.pause(); introAudio.currentTime = 0; } catch (_) {}
          }
        }).catch(() => {});
      }
    } catch (_) {}

    // Mount and play the fullscreen loading video immediately inside the click gesture
    const ui = createVideoLoadingScreen();
    const { wrap, video, statusText, barFill } = ui;

    let engineMod = null;
    let engineReady = false;
    let videoDone = false;
    let finished = false;
    let preloadTimer = 0;
    let safetyTimer = 0;

    const enterGameIfReady = () => {
      if (finished) return;
      if (!engineReady || !engineMod || !videoDone) return;

      finished = true;
      cleanupActiveLaunch();
      try {
        video.pause();
      } catch (_) {}
      try {
        if (typeof engineMod.openViceCity3D === 'function') {
          engineMod.openViceCity3D();
        }
        hideLoading(true);
        focusGameStage();
      } catch (err) {
        modulePromise = null;
        showLoadError(err);
      }
    };

    const onTimeUpdate = () => {
      if (!barFill) return;
      const dur = video.duration;
      if (dur && isFinite(dur) && dur > 0) {
        const pct = Math.min(100, Math.max(12, Math.round((video.currentTime / dur) * 100)));
        barFill.style.width = pct + '%';
      }
    };

    const onVideoEnded = () => {
      videoDone = true;
      if (barFill) barFill.style.width = '100%';
      enterGameIfReady();
    };

    const onVideoError = () => {
      videoDone = true;
      enterGameIfReady();
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onVideoEnded);
    video.addEventListener('error', onVideoError);

    // Fallback safety timer in case the browser stalls video playback indefinitely
    safetyTimer = window.setTimeout(() => {
      if (!finished && !videoDone && video.currentTime < 0.25) {
        videoDone = true;
        enterGameIfReady();
      }
    }, 6500);

    activeLaunchCleanup = () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onVideoEnded);
      video.removeEventListener('error', onVideoError);
      if (preloadTimer) window.clearTimeout(preloadTimer);
      if (safetyTimer) window.clearTimeout(safetyTimer);
    };

    // Start playing with sound first; gracefully fallback to muted if autoplay policy blocks unmuted playback
    try {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch(() => {
          video.muted = true;
          video.play().catch(() => {
            videoDone = true;
            enterGameIfReady();
          });
        });
      }
    } catch (_) {
      videoDone = true;
    }

    // Load the 3D engine in the background while the intro video plays
    if (!modulePromise) {
      modulePromise = import(moduleUrl).catch((err) => {
        modulePromise = null;
        document.body.classList.remove('vice-game-open');
        showLoadError(err);
        return null;
      });
    }

    const mod = await modulePromise;
    if (!mod || finished) return;
    engineMod = mod;

    // Wait briefly so the video begins playing smoothly before running synchronous Three.js world setup
    const finalizePreload = () => {
      if (finished) return;
      try {
        if (typeof engineMod.preloadViceCity3D === 'function') {
          engineMod.preloadViceCity3D();
        }
        engineReady = true;
        if (wrap) wrap.classList.add('v3-loading-ready');
        if (statusText) statusText.textContent = 'Vice City Ready';
        enterGameIfReady();
      } catch (err) {
        modulePromise = null;
        showLoadError(err);
      }
    };

    preloadTimer = window.setTimeout(finalizePreload, 360);
  }

  window.openViceGame = openViceGame;

  document.addEventListener('click', (e) => {
    if (isMobileViewport()) return;
    const trigger = e.target.closest('[data-open-game]');
    if (!trigger) return;
    e.preventDefault();
    openViceGame();
  });

  window.addEventListener('keydown', (e) => {
    if (isMobileViewport()) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.shiftKey && (e.key === 'G' || e.key === 'g')) {
      e.preventDefault();
      openViceGame();
    }
  });
})();
