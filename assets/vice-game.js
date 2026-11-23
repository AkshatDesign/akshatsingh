/* ==========================================================================
   VICE CITY 3D OCEAN DRIVE — LAZY MODULE LAUNCHER (v5)
   Keeps portfolio pages 100% lightweight & uncluttered until the user clicks
   "Play Game" or presses Shift+G, then dynamically boots the 3D WebGL engine.
   ========================================================================== */
(function () {
  if (window.__VICE_GAME_LOADER_INIT__) return;
  window.__VICE_GAME_LOADER_INIT__ = true;

  const scriptEl = document.currentScript;
  const moduleUrl = scriptEl && scriptEl.src
    ? new URL('./vice-game-3d.js?v=20', scriptEl.src).href
    : '/assets/vice-game-3d.js?v=20';

  let modulePromise = null;
  let loadingEl = null;

  function showLoading(msg) {
    if (!loadingEl) {
      loadingEl = document.createElement('div');
      loadingEl.className = 'v3-loading';
      document.body.appendChild(loadingEl);
    }
    loadingEl.innerHTML = '<span>' + (msg || 'Loading Vice City 3D Ocean Drive…') + '</span>';
  }

  function showLoadError(err) {
    console.error('[ViceCity3D] Failed to load or initialize 3D game:', err);
    if (!loadingEl) {
      loadingEl = document.createElement('div');
      loadingEl.className = 'v3-loading';
      document.body.appendChild(loadingEl);
    }
    const detail = err && err.message ? String(err.message).replace(/[<>&]/g, '') : '';
    loadingEl.innerHTML =
      '<span>Could not launch 3D engine on this browser.</span>' +
      (detail ? '<span style="opacity:0.62;font-size:10px;max-width:460px;text-align:center;text-transform:none;letter-spacing:0.02em;">' + detail + '</span>' : '') +
      '<div style="display:flex;gap:10px;margin-top:8px;">' +
      '<button type="button" data-v3-retry style="padding:8px 16px;border-radius:8px;border:1px solid #21E6D1;background:rgba(33,230,209,0.16);color:#21E6D1;font:700 12px/1 \'JetBrains Mono\',monospace;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;">Retry</button>' +
      '<button type="button" data-v3-dismiss style="padding:8px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.28);background:transparent;color:#FFF5EE;font:700 12px/1 \'JetBrains Mono\',monospace;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;">Close</button>' +
      '</div>';
    const retryBtn = loadingEl.querySelector('[data-v3-retry]');
    const dismissBtn = loadingEl.querySelector('[data-v3-dismiss]');
    if (retryBtn) retryBtn.addEventListener('click', () => { modulePromise = null; openViceGame(); });
    if (dismissBtn) dismissBtn.addEventListener('click', () => hideLoading());
  }

  function hideLoading() {
    if (!loadingEl) return;
    loadingEl.remove();
    loadingEl = null;
  }

  async function openViceGame() {
    document.body.classList.add('vice-game-open');
    if (typeof window.__stopMainWebsiteRadio === 'function') window.__stopMainWebsiteRadio();
    window.dispatchEvent(new CustomEvent('vice:game-open'));
    document.querySelectorAll('audio, video').forEach((m) => { try { m.pause(); } catch (_) {} });
    if (!modulePromise) {
      showLoading();
      modulePromise = import(moduleUrl).catch((err) => {
        modulePromise = null;
        document.body.classList.remove('vice-game-open');
        showLoadError(err);
        return null;
      });
    }
    const mod = await modulePromise;
    if (!mod) return;
    try {
      if (typeof mod.openViceCity3D === 'function') {
        mod.openViceCity3D();
      }
      hideLoading();
    } catch (err) {
      modulePromise = null;
      showLoadError(err);
    }
  }

  window.openViceGame = openViceGame;

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open-game]');
    if (!trigger) return;
    e.preventDefault();
    openViceGame();
  });

  window.addEventListener('keydown', (e) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.shiftKey && (e.key === 'G' || e.key === 'g')) {
      e.preventDefault();
      openViceGame();
    }
  });
})();
