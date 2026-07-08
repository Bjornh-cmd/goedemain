function buttonKey(btn) {
  return btn.url.trim().toLowerCase();
}

function getAllButtons(config) {
  const seen = new Set();
  const result = [];

  for (const visitor of config.visitors) {
    for (const btn of visitor.buttons || []) {
      const key = buttonKey(btn);
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ label: btn.label, url: btn.url });
      }
    }
  }

  return result;
}

function applyExclude(buttons, exclude) {
  const excluded = new Set(
    (exclude || []).map((item) =>
      typeof item === 'string' ? item.trim().toLowerCase() : buttonKey(item)
    )
  );
  return buttons.filter((btn) => !excluded.has(buttonKey(btn)));
}

function resolveButtons(source, config) {
  const mode = source.mode || 'custom';

  if (mode === 'custom') {
    return [...(source.buttons || [])];
  }

  const all = getAllButtons(config);

  if (mode === 'all') {
    return all;
  }

  if (mode === 'allExcept') {
    return applyExclude(all, source.exclude || []);
  }

  return [...(source.buttons || [])];
}

function normalizeConfig(data) {
  delete data.guestMode;

  for (const visitor of data.visitors) {
    visitor.mode = visitor.mode || 'custom';
    visitor.buttons = visitor.buttons || [];
    visitor.exclude = visitor.exclude || [];
  }

  return data;
}

function modeLabel(mode) {
  if (mode === 'all') return 'alle knoppen';
  if (mode === 'allExcept') return 'alles behalve';
  return 'eigen knoppen';
}

module.exports = {
  buttonKey,
  getAllButtons,
  applyExclude,
  resolveButtons,
  normalizeConfig,
  modeLabel,
};
