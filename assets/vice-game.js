/* ==========================================================================
   VICE CITY 3D OCEAN DRIVE — LAZY MODULE LAUNCHER (v5)
   Keeps portfolio pages 100% lightweight & uncluttered until the user clicks
   "Play Game" or presses Shift+G, then dynamically boots the 3D WebGL engine.
   ========================================================================== */
(function () {
  if (window.__VICE_GAME_LOADER_INIT__) return;
  window.__VICE_GAME_LOADER_INIT__ = true;

  let modulePromise = null;
  let loadingEl = null;

  function showLoading() {
    if (loadingEl) return;
    loadingEl = document.createElement('div');
    loadingEl.className = 'v3-loading';
    loadingEl.innerHTML = '<span>Loading Vice City 3D Ocean Drive…</span>';
    document.body.appendChild(loadingEl);
  }

  function hideLoading() {
    if (!loadingEl) return;
    loadingEl.remove();
    loadingEl = null;
  }

  async function openViceGame() {
    if (!modulePromise) {
      showLoading();
      modulePromise = import('/assets/vice-game-3d.js?v=5').catch((err) => {
        modulePromise = null;
        hideLoading();
        console.error('[ViceCity3D] Failed to load 3D module:', err);
        return null;
      });
    }
    const mod = await modulePromise;
    hideLoading();
    if (mod && typeof mod.openViceCity3D === 'function') {
      mod.openViceCity3D();
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
