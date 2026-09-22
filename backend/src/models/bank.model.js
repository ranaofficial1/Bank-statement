const { pool } = require('../config/db');

async function findAll({ search } = {}) {
  if (search && search.trim()) {
    const like = `%${search.trim()}%`;
    const [rows] = await pool.query(
      `SELECT id, name, slug, parser_key, logo_url
       FROM banks
       WHERE is_active = 1 AND name LIKE ?
       ORDER BY name ASC`,
      [like]
    );
    return rows;
  }

  const [rows] = await pool.query(
    `SELECT id, name, slug, parser_key, logo_url
     FROM banks
     WHERE is_active = 1
     ORDER BY name ASC`
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT id, name, slug, parser_key, logo_url, is_active
     FROM banks WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { findAll, findById };
