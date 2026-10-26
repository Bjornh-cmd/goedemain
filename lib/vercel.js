const VERCEL_API = 'https://api.vercel.com';

function getVercelToken() {
  return process.env.VERCEL_TOKEN || process.env.VERCEL_ACCESS_TOKEN || '';
}

function getVercelTeamId() {
  return process.env.VERCEL_TEAM_ID || '';
}

function isVercelConfigured() {
  return Boolean(getVercelToken());
}

function getVercelStatus() {
  return {
    configured: isVercelConfigured(),
    hasTeamId: Boolean(getVercelTeamId()),
  };
}

async function vercelFetch(path, params = {}) {
  const token = getVercelToken();
  if (!token) {
    throw new Error('VERCEL_TOKEN ontbreekt in .env');
  }

  const url = new URL(`${VERCEL_API}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const teamId = getVercelTeamId();
  if (teamId && !url.searchParams.has('teamId')) {
    url.searchParams.set('teamId', teamId);
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const text = await res.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message =
      (typeof body === 'object' && (body.error?.message || body.message)) ||
      `Vercel API fout (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return body;
}

function pickProjectUrl(project) {
  const aliases = project?.targets?.production?.alias;
  if (Array.isArray(aliases) && aliases.length) {
    const host = aliases.find((a) => typeof a === 'string' && a && !a.includes('vercel.app')) || aliases[0];
    if (host) return host.startsWith('http') ? host : `https://${host}`;
  }

  if (project?.alias && typeof project.alias === 'string') {
    return project.alias.startsWith('http') ? project.alias : `https://${project.alias}`;
  }

  if (project?.name) {
    return `https://${project.name}.vercel.app`;
  }

  return null;
}

function mapProject(project) {
  const url = pickProjectUrl(project);
  return {
    id: project.id,
    name: project.name,
    framework: project.framework || null,
    url,
    updatedAt: project.updatedAt || null,
  };
}

async function listVercelProjects({ limit = 100 } = {}) {
  const projects = [];
  let from = undefined;

  while (projects.length < limit) {
    const pageLimit = Math.min(50, limit - projects.length);
    const data = await vercelFetch('/v10/projects', { limit: pageLimit, from });
    const batch = Array.isArray(data?.projects) ? data.projects : [];
    projects.push(...batch.map(mapProject).filter((p) => p.url));

    const next = data?.pagination?.next;
    if (!next || !batch.length) break;
    from = next;
  }

  return projects.sort((a, b) => a.name.localeCompare(b.name, 'nl'));
}

module.exports = {
  isVercelConfigured,
  getVercelStatus,
  listVercelProjects,
};
