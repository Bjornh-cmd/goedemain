function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function getInitial(label) {
  const trimmed = (label || '?').trim();
  return trimmed.charAt(0).toUpperCase();
}

function renderButtonCard(btn, index) {
  const link = document.createElement('a');
  link.href = btn.url;
  link.className = 'button-card';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.animationDelay = `${index * 0.04}s`;

  const domain = getDomain(btn.url);
  const initial = getInitial(btn.label);

  link.innerHTML = `
    <div class="button-card-top">
      <div class="button-card-icon">${initial}</div>
      <div class="button-card-arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 17L17 7"/><path d="M7 7h10v10"/>
        </svg>
      </div>
    </div>
    <span class="button-card-label"></span>
    <span class="button-card-domain"></span>
  `;

  link.querySelector('.button-card-label').textContent = btn.label;
  link.querySelector('.button-card-domain').textContent = domain;

  return link;
}

function renderButtons(gridEl, buttons, options = {}) {
  const { emptyEl, noResultsEl, searchQuery = '' } = options;
  gridEl.innerHTML = '';

  const query = searchQuery.trim().toLowerCase();
  const filtered = query
    ? buttons.filter(
        (b) =>
          b.label.toLowerCase().includes(query) ||
          b.url.toLowerCase().includes(query) ||
          getDomain(b.url).toLowerCase().includes(query)
      )
    : buttons;

  if (!buttons.length) {
    if (emptyEl) emptyEl.classList.remove('hidden');
    if (noResultsEl) noResultsEl.classList.add('hidden');
    return;
  }

  if (emptyEl) emptyEl.classList.add('hidden');

  if (!filtered.length) {
    if (noResultsEl) noResultsEl.classList.remove('hidden');
    return;
  }

  if (noResultsEl) noResultsEl.classList.add('hidden');

  filtered.forEach((btn, index) => {
    gridEl.appendChild(renderButtonCard(btn, index));
  });
}

function setupSearch(inputEl, buttons, gridEl, options = {}) {
  if (!inputEl) return;

  inputEl.addEventListener('input', () => {
    renderButtons(gridEl, buttons, {
      ...options,
      searchQuery: inputEl.value,
    });
  });
}
