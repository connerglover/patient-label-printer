// Runs before first paint so dark-mode users never see a flash of the light
// theme. Kept as its own file because the Content-Security-Policy in
// public/_headers disallows inline scripts.
(function () {
  try {
    var stored = localStorage.getItem('glp-theme');
    var dark =
      stored === 'dark' ||
      (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {
    /* Private mode with storage disabled: fall back to the light theme. */
  }
})();
