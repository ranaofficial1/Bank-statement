const { pool } = require('../config/db');

const SELECT_FIELDS = `
  id, user_id, bank_id, original_filename, stored_filename, file_path,
  file_size_bytes, mime_type, is_password_protected, status,
  created_at, updated_at
`;

async function create({
  userId,
  bankId,
  originalFilename,
  storedFilename,
  filePath,
  fileSizeBytes,
  mimeType,
  isPasswordProtected,
  status,
}) {
  const [result] = await pool.query(
    `INSERT INTO uploaded_files
       (user_id, bank_id, original_filename, stored_filename, file_path,
        file_size_bytes, mime_type, is_password_protected, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      bankId || null,
      originalFilename,
      storedFilename,
      filePath,
      fileSizeBytes,
      mimeType,
      isPasswordProtected ? 1 : 0,
      status,
    ]
  );
  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM uploaded_files WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Fetches a file only if it belongs to the given user - the standard
 * ownership check every uploads route uses before reading/mutating a
 * record, so one user can never touch another user's files.
 */
async function findByIdForUser(id, userId) {
  const file = await findById(id);
  if (!file || Number(file.user_id) !== Number(userId)) {
    return null;
  }
  return file;
}

async function updateStatus(id, status) {
  await pool.query('UPDATE uploaded_files SET status = ? WHERE id = ?', [status, id]);
  return findById(id);
}

async function remove(id) {
  await pool.query('DELETE FROM uploaded_files WHERE id = ?', [id]);
}

module.exports = { create, findById, findByIdForUser, updateStatus, remove };
