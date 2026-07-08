const { listRows, getRow, createRow, updateRow, deleteRow } = require('./db');

const TABLE = 'vlogs';

function rowToVlog(row) {
  return {
    _dbId: row.id,
    id: row.vlog_id,
    title: row.title,
    code: row.code,
  };
}

function vlogToRow(vlog) {
  return {
    vlog_id: vlog.id,
    title: vlog.title,
    code: vlog.code,
  };
}

async function listVlogRows() {
  const rows = await listRows(TABLE, { limit: 500 });
  return rows.map(rowToVlog);
}

async function getVlogRowBySlug(slug) {
  const vlogs = await listVlogRows();
  return vlogs.find((v) => v.id === slug) || null;
}

async function createVlog(vlog) {
  const row = await createRow(TABLE, vlogToRow(vlog));
  return rowToVlog(row);
}

async function updateVlog(vlog) {
  if (!vlog._dbId) {
    throw new Error(`Vlog "${vlog.id}" heeft geen database-id`);
  }
  const row = await updateRow(TABLE, vlog._dbId, vlogToRow(vlog));
  return rowToVlog(row);
}

async function deleteVlogByDbId(dbId) {
  return deleteRow(TABLE, dbId);
}

module.exports = {
  TABLE,
  rowToVlog,
  vlogToRow,
  listVlogRows,
  getVlogRowBySlug,
  createVlog,
  updateVlog,
  deleteVlogByDbId,
};
