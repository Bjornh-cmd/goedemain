const { listRows, getRow, createRow, updateRow, deleteRow } = require('./db');

const TABLE = 'visitors';

function rowToVisitor(row) {
  return {
    _dbId: row.id,
    id: row.visitor_id,
    name: row.name,
    passwordHash: row.password_hash,
    mode: row.mode || 'custom',
    buttons: parseJsonField(row.buttons, []),
    exclude: parseJsonField(row.exclude, []),
  };
}

function visitorToRow(visitor) {
  return {
    visitor_id: visitor.id,
    name: visitor.name,
    password_hash: visitor.passwordHash,
    mode: visitor.mode || 'custom',
    buttons: visitor.buttons || [],
    exclude: visitor.exclude || [],
  };
}

function parseJsonField(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

async function listVisitors() {
  const rows = await listRows(TABLE, { limit: 500 });
  return rows.map(rowToVisitor);
}

async function getVisitorByDbId(dbId) {
  const row = await getRow(TABLE, dbId);
  return rowToVisitor(row);
}

async function getVisitorBySlug(slug) {
  const visitors = await listVisitors();
  return visitors.find((v) => v.id === slug) || null;
}

async function createVisitor(visitor) {
  const row = await createRow(TABLE, visitorToRow(visitor));
  return rowToVisitor(row);
}

async function updateVisitor(visitor) {
  if (!visitor._dbId) {
    throw new Error(`Bezoeker "${visitor.id}" heeft geen database-id`);
  }
  const row = await updateRow(TABLE, visitor._dbId, visitorToRow(visitor));
  return rowToVisitor(row);
}

async function deleteVisitorByDbId(dbId) {
  return deleteRow(TABLE, dbId);
}

async function syncVisitors(visitors) {
  const existing = await listVisitors();
  const existingBySlug = new Map(existing.map((v) => [v.id, v]));
  const keptSlugs = new Set(visitors.map((v) => v.id));
  const results = [];

  for (const visitor of visitors) {
    const payload = visitorToRow(visitor);
    const current = existingBySlug.get(visitor.id);

    if (current) {
      const updated = await updateRow(TABLE, current._dbId, payload);
      results.push(rowToVisitor(updated));
    } else {
      const created = await createRow(TABLE, payload);
      results.push(rowToVisitor(created));
    }
  }

  for (const row of existing) {
    if (!keptSlugs.has(row.id)) {
      await deleteRow(TABLE, row._dbId);
    }
  }

  return results;
}

module.exports = {
  TABLE,
  rowToVisitor,
  visitorToRow,
  listVisitors,
  getVisitorByDbId,
  getVisitorBySlug,
  createVisitor,
  updateVisitor,
  deleteVisitorByDbId,
  syncVisitors,
};
