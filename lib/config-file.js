const fs = require('fs');
const path = require('path');
const { normalizeConfig } = require('./buttons');

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'config.json');

function loadConfigFromFile() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data.visitors)) {
    throw new Error('config.json: "visitors" moet een array zijn');
  }
  return normalizeConfig(data);
}

function saveConfigToFile(data) {
  const normalized = normalizeConfig(data);
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(normalized, null, 2) + '\n', 'utf8');
  return normalized;
}

module.exports = { loadConfigFromFile, saveConfigToFile, CONFIG_PATH };
