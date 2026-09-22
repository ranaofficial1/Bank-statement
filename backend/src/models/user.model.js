const { pool } = require('../config/db');

const PUBLIC_FIELDS = 'id, name, email, is_active, created_at, updated_at';

async function createUser({ name, email, passwordHash }) {
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash]
  );
  return findById(result.insertId);
}

async function findByEmail(email) {
  const [rows] = await pool.query(
    'SELECT id, name, email, password_hash, is_active, created_at, updated_at FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { createUser, findByEmail, findById };
