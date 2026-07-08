const { normalizeConfig } = require('./buttons');
const { isLocalMode } = require('./local-mode');
const { loadConfigFromFile, saveConfigToFile } = require('./config-file');
const { listVisitors, syncVisitors } = require('./db-visitors');

function stripInternalFields(visitor) {
  const { _dbId, ...rest } = visitor;
  return rest;
}

async function loadConfig() {
  if (isLocalMode()) {
    return loadConfigFromFile();
  }

  const visitors = await listVisitors();
  return normalizeConfig({
    visitors: visitors.map(stripInternalFields),
  });
}

async function loadConfigWithMeta() {
  if (isLocalMode()) {
    return loadConfigFromFile();
  }

  const visitors = await listVisitors();
  return normalizeConfig({ visitors });
}

async function saveConfig(data) {
  if (isLocalMode()) {
    return saveConfigToFile(data);
  }

  const normalized = normalizeConfig(data);
  const synced = await syncVisitors(normalized.visitors);
  return normalizeConfig({
    visitors: synced.map(stripInternalFields),
  });
}

async function saveConfigWithMeta(data) {
  if (isLocalMode()) {
    return saveConfigToFile(data);
  }

  const normalized = normalizeConfig(data);
  const synced = await syncVisitors(normalized.visitors);
  return normalizeConfig({ visitors: synced });
}

module.exports = { loadConfig, loadConfigWithMeta, saveConfig, saveConfigWithMeta };
