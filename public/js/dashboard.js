const nameEl = document.getElementById('visitor-name');
const gridEl = document.getElementById('buttons-grid');
const emptyEl = document.getElementById('empty-message');
const noResultsEl = document.getElementById('no-results');
const logoutBtn = document.getElementById('logout-btn');
const adminLink = document.getElementById('admin-link');
const loadingEl = document.getElementById('loading');
const contentEl = document.getElementById('dashboard-content');
const countEl = document.getElementById('button-count');
const searchEl = document.getElementById('search');

let allButtons = [];

function updateCount(count) {
  countEl.textContent = count === 1 ? '1 knop' : `${count} knoppen`;
}

async function loadDashboard() {
  try {
    const meRes = await fetch('/api/me');
    if (!meRes.ok) {
      window.location.href = '/';
      return;
    }

    const me = await meRes.json();
    nameEl.textContent = me.name;

    const isAdmin =
      me.isAdmin === true ||
      String(me.id || '').toLowerCase() === 'bjorn' ||
      String(me.name || '').toLowerCase() === 'bjorn';

    if (isAdmin && adminLink) {
      adminLink.classList.remove('hidden');
      adminLink.removeAttribute('hidden');
    }

    const buttonsRes = await fetch('/api/buttons');
    if (!buttonsRes.ok) {
      window.location.href = '/';
      return;
    }

    const { buttons } = await buttonsRes.json();
    allButtons = buttons;

    loadingEl.classList.add('hidden');
    contentEl.classList.remove('hidden');

    updateCount(buttons.length);
    renderButtons(gridEl, buttons, { emptyEl, noResultsEl });
    setupSearch(searchEl, allButtons, gridEl, { emptyEl, noResultsEl });
  } catch {
    window.location.href = '/';
  }
}

logoutBtn.addEventListener('click', async () => {
  logoutBtn.disabled = true;
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/';
});

loadDashboard();
