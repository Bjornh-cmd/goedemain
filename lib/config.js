const { normalizeConfig } = require('./buttons');
const { loadConfigFromFile, saveConfigToFile } = require('./config-file');

async function loadConfig() {
  return loadConfigFromFile();
}

async function loadConfigWithMeta() {
  return loadConfigFromFile();
}

async function saveConfig(data) {
  return saveConfigToFile(data);
}

async function saveConfigWithMeta(data) {
  return saveConfigToFile(data);
}

module.exports = { loadConfig, loadConfigWithMeta, saveConfig, saveConfigWithMeta };
