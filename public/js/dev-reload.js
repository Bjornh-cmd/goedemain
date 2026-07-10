(function () {
  let lastBuild = null;

  async function checkForReload() {
    try {
      const res = await fetch('/api/dev-version', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (lastBuild === null) {
        lastBuild = data.build;
        return;
      }
      if (data.build !== lastBuild) {
        window.location.reload();
      }
    } catch {
      /* dev server offline */
    }
  }

  checkForReload();
  setInterval(checkForReload, 1500);
})();
