const loadingEl = document.getElementById('loading');
const deniedEl = document.getElementById('admin-denied');
const contentEl = document.getElementById('admin-content');
const visitorsListEl = document.getElementById('visitors-list');
const visitorDetailEl = document.getElementById('visitor-detail');
const detailTitleEl = document.getElementById('detail-title');
const detailMetaEl = document.getElementById('detail-meta');
const buttonsListEl = document.getElementById('buttons-list');
const logoutBtn = document.getElementById('logout-btn');
const addVisitorBtn = document.getElementById('add-visitor-btn');
const addButtonBtn = document.getElementById('add-button-btn');

const visitorDialog = document.getElementById('visitor-dialog');
const visitorForm = document.getElementById('visitor-form');
const visitorDialogTitle = document.getElementById('visitor-dialog-title');
const visitorNameInput = document.getElementById('visitor-name');
const visitorIdInput = document.getElementById('visitor-id');
const visitorPasswordInput = document.getElementById('visitor-password');
const visitorFormError = document.getElementById('visitor-form-error');
const visitorFormErrorText = document.getElementById('visitor-form-error-text');
const visitorCancelBtn = document.getElementById('visitor-cancel');

const buttonDialog = document.getElementById('button-dialog');
const buttonForm = document.getElementById('button-form');
const buttonDialogTitle = document.getElementById('button-dialog-title');
const buttonLabelInput = document.getElementById('button-label');
const buttonUrlInput = document.getElementById('button-url');
const buttonFormError = document.getElementById('button-form-error');
const buttonFormErrorText = document.getElementById('button-form-error-text');
const buttonCancelBtn = document.getElementById('button-cancel');

let visitors = [];
let selectedVisitorId = null;
let editingButtonIndex = null;

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Actie mislukt');
  return data;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function modeLabel(mode) {
  if (mode === 'all') return 'Alle knoppen';
  if (mode === 'allExcept') return 'Alles behalve';
  return 'Eigen knoppen';
}

function showFormError(errorEl, textEl, message) {
  textEl.textContent = message;
  errorEl.classList.remove('hidden');
}

function hideFormError(errorEl) {
  errorEl.classList.add('hidden');
}

function renderVisitors() {
  visitorsListEl.innerHTML = visitors
    .map(
      (v) => `
    <div class="admin-item ${v.id === selectedVisitorId ? 'admin-item--active' : ''}">
      <button type="button" class="admin-item-main" data-select="${escapeHtml(v.id)}">
        <strong>${escapeHtml(v.name)}</strong>
        <span class="admin-item-meta">${escapeHtml(v.id)} · ${modeLabel(v.mode)} · ${v.buttons.length} knop(pen)</span>
      </button>
      <div class="admin-item-actions">
        <button type="button" class="btn-secondary admin-btn-sm" data-edit-visitor="${escapeHtml(v.id)}">Bewerk</button>
        <button type="button" class="btn-secondary admin-btn-sm admin-btn-danger" data-delete-visitor="${escapeHtml(v.id)}">Verwijder</button>
      </div>
    </div>
  `
    )
    .join('');
}

function renderButtons(visitor) {
  if (!visitor) {
    visitorDetailEl.classList.add('hidden');
    return;
  }

  visitorDetailEl.classList.remove('hidden');
  detailTitleEl.textContent = `Knoppen — ${visitor.name}`;
  detailMetaEl.textContent = `${modeLabel(visitor.mode)} · ${visitor.buttons.length} knop(pen) in database`;

  if (!visitor.buttons.length) {
    buttonsListEl.innerHTML = '<p class="no-results">Nog geen knoppen. Voeg er een toe.</p>';
    return;
  }

  buttonsListEl.innerHTML = visitor.buttons
    .map(
      (btn, index) => `
    <div class="admin-item">
      <div class="admin-item-main admin-item-main--static">
        <strong>${escapeHtml(btn.label)}</strong>
        <span class="admin-item-meta">${escapeHtml(btn.url)}</span>
      </div>
      <div class="admin-item-actions">
        <button type="button" class="btn-secondary admin-btn-sm" data-edit-button="${index}">Bewerk</button>
        <button type="button" class="btn-secondary admin-btn-sm admin-btn-danger" data-delete-button="${index}">Verwijder</button>
      </div>
    </div>
  `
    )
    .join('');
}

function getSelectedVisitor() {
  return visitors.find((v) => v.id === selectedVisitorId) || null;
}

async function loadVisitors() {
  const data = await api('/api/admin/visitors');
  visitors = data.visitors;
  renderVisitors();
  renderButtons(getSelectedVisitor());
}

function openVisitorDialog(visitor = null) {
  hideFormError(visitorFormError);
  visitorDialogTitle.textContent = visitor ? 'Bezoeker bewerken' : 'Bezoeker toevoegen';
  visitorNameInput.value = visitor?.name || '';
  visitorIdInput.value = visitor?.id || '';
  visitorIdInput.disabled = Boolean(visitor);
  visitorPasswordInput.value = '';
  visitorPasswordInput.placeholder = visitor ? 'Laat leeg om niet te wijzigen' : 'Wachtwoord';
  visitorPasswordInput.required = !visitor;
  visitorForm.dataset.editId = visitor?.id || '';
  visitorDialog.showModal();
}

function openButtonDialog(button = null, index = null) {
  hideFormError(buttonFormError);
  editingButtonIndex = index;
  buttonDialogTitle.textContent = button ? 'Knop bewerken' : 'Knop toevoegen';
  buttonLabelInput.value = button?.label || '';
  buttonUrlInput.value = button?.url || '';
  buttonDialog.showModal();
}

visitorsListEl.addEventListener('click', async (e) => {
  const selectId = e.target.closest('[data-select]')?.dataset.select;
  if (selectId) {
    selectedVisitorId = selectId;
    renderVisitors();
    renderButtons(getSelectedVisitor());
    return;
  }

  const editId = e.target.closest('[data-edit-visitor]')?.dataset.editVisitor;
  if (editId) {
    openVisitorDialog(visitors.find((v) => v.id === editId));
    return;
  }

  const deleteId = e.target.closest('[data-delete-visitor]')?.dataset.deleteVisitor;
  if (deleteId) {
    const visitor = visitors.find((v) => v.id === deleteId);
    if (!confirm(`Bezoeker "${visitor.name}" verwijderen?`)) return;
    await api(`/api/admin/visitors/${encodeURIComponent(deleteId)}`, { method: 'DELETE' });
    if (selectedVisitorId === deleteId) selectedVisitorId = null;
    await loadVisitors();
  }
});

buttonsListEl.addEventListener('click', async (e) => {
  const editIndex = e.target.closest('[data-edit-button]')?.dataset.editButton;
  if (editIndex !== undefined) {
    const visitor = getSelectedVisitor();
    openButtonDialog(visitor.buttons[Number(editIndex)], Number(editIndex));
    return;
  }

  const deleteIndex = e.target.closest('[data-delete-button]')?.dataset.deleteButton;
  if (deleteIndex !== undefined) {
    const visitor = getSelectedVisitor();
    const btn = visitor.buttons[Number(deleteIndex)];
    if (!confirm(`Knop "${btn.label}" verwijderen?`)) return;
    await api(
      `/api/admin/visitors/${encodeURIComponent(selectedVisitorId)}/buttons/${deleteIndex}`,
      { method: 'DELETE' }
    );
    await loadVisitors();
  }
});

visitorForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideFormError(visitorFormError);

  const editId = visitorForm.dataset.editId;
  const body = {
    name: visitorNameInput.value.trim(),
    id: visitorIdInput.value.trim() || undefined,
    password: visitorPasswordInput.value || undefined,
  };

  try {
    if (editId) {
      await api(`/api/admin/visitors/${encodeURIComponent(editId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: body.name, password: body.password }),
      });
    } else {
      await api('/api/admin/visitors', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    }
    visitorDialog.close();
    await loadVisitors();
  } catch (err) {
    showFormError(visitorFormError, visitorFormErrorText, err.message);
  }
});

buttonForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideFormError(buttonFormError);

  const body = {
    label: buttonLabelInput.value.trim(),
    url: buttonUrlInput.value.trim(),
  };

  try {
    if (editingButtonIndex !== null) {
      await api(
        `/api/admin/visitors/${encodeURIComponent(selectedVisitorId)}/buttons/${editingButtonIndex}`,
        { method: 'PATCH', body: JSON.stringify(body) }
      );
    } else {
      await api(`/api/admin/visitors/${encodeURIComponent(selectedVisitorId)}/buttons`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    }
    buttonDialog.close();
    await loadVisitors();
  } catch (err) {
    showFormError(buttonFormError, buttonFormErrorText, err.message);
  }
});

addVisitorBtn.addEventListener('click', () => openVisitorDialog());
addButtonBtn.addEventListener('click', () => {
  if (!selectedVisitorId) {
    alert('Selecteer eerst een bezoeker.');
    return;
  }
  openButtonDialog();
});
visitorCancelBtn.addEventListener('click', () => visitorDialog.close());
buttonCancelBtn.addEventListener('click', () => buttonDialog.close());

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/';
});

async function init() {
  try {
    const meRes = await fetch('/api/me');
    if (!meRes.ok) {
      window.location.href = '/';
      return;
    }

    const me = await meRes.json();
    loadingEl.classList.add('hidden');

    if (!me.isAdmin) {
      deniedEl.classList.remove('hidden');
      return;
    }

    contentEl.classList.remove('hidden');
    await loadVisitors();
    if (visitors.length) {
      selectedVisitorId = visitors[0].id;
      renderVisitors();
      renderButtons(getSelectedVisitor());
    }
  } catch {
    window.location.href = '/';
  }
}

init();
