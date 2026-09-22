/**
 * Holds a PDF password only long enough to get from "verified" to
 * "used for extraction" - it is never written to the database. This
 * closes the gap where verify-password only checked the password
 * and then discarded it, leaving extraction with no way to open the
 * still-encrypted file on disk.
 *
 * In-memory and per-process: fine for this project's current single
 * instance. If this app ever runs multiple backend instances behind
 * a load balancer, this needs to move to a shared store (e.g. Redis)
 * - noted here so it isn't forgotten later.
 */
const TTL_MS = 30 * 60 * 1000; // 30 minutes

const cache = new Map(); // fileId -> { password, expiresAt }

function set(fileId, password) {
  cache.set(Number(fileId), { password, expiresAt: Date.now() + TTL_MS });
}

function get(fileId) {
  const entry = cache.get(Number(fileId));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(Number(fileId));
    return null;
  }
  return entry.password;
}

function clear(fileId) {
  cache.delete(Number(fileId));
}

module.exports = { set, get, clear };
