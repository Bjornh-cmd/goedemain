class DbApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'DbApiError';
    this.status = status;
    this.body = body;
  }
}

let activeBaseUrl = null;
let lastConnectionError = null;

function getDbApiPath() {
  const fromEnv = process.env.DB_API_URL || process.env.DB_API_URL_LOCAL || '';
  const pathMatch = fromEnv.match(/(\/api\/button_portal\/[^/?#]+)/);
  if (pathMatch) return pathMatch[1];
  return '/api/button_portal/oijsonsqonDWOIdwONIDWn';
}

function getDbApiUrls() {
  const urls = [];
  const apiPath = getDbApiPath();

  const add = (url) => {
    if (!url) return;
    const normalized = url.replace(/\/$/, '');
    if (!urls.includes(normalized)) urls.push(normalized);
  };

  add(process.env.DB_API_URL_LOCAL);
  add(`http://localhost:5505${apiPath}`);
  add(`http://127.0.0.1:5505${apiPath}`);

  if (!urls.length) {
    throw new Error('Lokale database-URL ontbreekt');
  }

  return urls;
}

function getDbApiUrl() {
  return activeBaseUrl || getDbApiUrls()[0];
}

function getLastConnectionError() {
  return lastConnectionError;
}

function isNetworkError(err) {
  return (
    err?.name === 'AbortError' ||
    err?.code === 'ECONNREFUSED' ||
    err?.code === 'ENOTFOUND' ||
    err?.code === 'ETIMEDOUT' ||
    err?.message === 'fetch failed'
  );
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function extractRows(result) {
  if (Array.isArray(result)) return result;
  if (result?.rows && Array.isArray(result.rows)) return result.rows;
  if (result?.data && Array.isArray(result.data)) return result.data;
  if (result?.items && Array.isArray(result.items)) return result.items;
  return [];
}

async function dbFetch(path, options = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const urls = activeBaseUrl ? [activeBaseUrl, ...getDbApiUrls().filter((u) => u !== activeBaseUrl)] : getDbApiUrls();

  let lastError = null;

  for (const base of urls) {
    const url = `${base}${normalizedPath}`;

    try {
      const res = await fetchWithTimeout(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (res.status === 204) {
        activeBaseUrl = base;
        lastConnectionError = null;
        return null;
      }

      const text = await res.text();
      let body = null;
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }

      if (res.status === 401) {
        throw new DbApiError('Ongeldige database credentials', 401, body);
      }
      if (res.status === 404) {
        throw new DbApiError('Niet gevonden', 404, body);
      }
      if (res.status === 422) {
        throw new DbApiError('Validatiefout', 422, body);
      }
      if (!res.ok) {
        const message =
          typeof body === 'string'
            ? body
            : body?.error || body?.message || `Database API fout (${res.status})`;
        throw new DbApiError(message, res.status, body);
      }

      activeBaseUrl = base;
      lastConnectionError = null;
      return body;
    } catch (err) {
      if (err instanceof DbApiError) throw err;

      lastError = err;
      if (!isNetworkError(err)) throw err;
    }
  }

  lastConnectionError = lastError?.message || 'Database niet bereikbaar';
  throw new DbApiError(
    'Database niet bereikbaar. Controleer of de database-server draait op poort 5505.',
    503,
    { cause: lastError?.message }
  );
}

async function checkDbConnection() {
  try {
    await dbFetch('/');
    return { ok: true, url: getDbApiUrl() };
  } catch (err) {
    return { ok: false, error: err.message, url: getDbApiUrl() };
  }
}

async function listRows(table, params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  const path = qs ? `/${table}?${qs}` : `/${table}`;
  const result = await dbFetch(path);
  return extractRows(result);
}

async function getRow(table, id) {
  return dbFetch(`/${table}/${id}`);
}

async function createRow(table, data) {
  return dbFetch(`/${table}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function updateRow(table, id, data) {
  return dbFetch(`/${table}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

async function deleteRow(table, id) {
  return dbFetch(`/${table}/${id}`, { method: 'DELETE' });
}

async function getDbInfo() {
  return dbFetch('/');
}

async function getTables() {
  return dbFetch('/tables');
}

module.exports = {
  DbApiError,
  getDbApiUrl,
  getDbApiUrls,
  getLastConnectionError,
  dbFetch,
  extractRows,
  checkDbConnection,
  listRows,
  getRow,
  createRow,
  updateRow,
  deleteRow,
  getDbInfo,
  getTables,
};
