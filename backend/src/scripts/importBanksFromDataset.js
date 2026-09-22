const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

/**
 * Grows the `banks` table from a real, publicly-sourced bank list -
 * this is the intended way to go from the ~60-bank starter set
 * (src/seed/seedBanks.js) to full coverage, instead of hand-typing
 * hundreds of rows.
 *
 * Recommended source: the Razorpay `ifsc` dataset
 * (https://github.com/razorpay/ifsc), MIT-licensed code with a
 * public-domain dataset compiled from RBI's NEFT/RTGS bank lists and
 * NPCI's member lists - it covers ~1,400 Indian banks including
 * cooperative and regional rural banks. Download `banknames.json`
 * (or the `IFSC.csv` release) from that repo's `src/` directory or
 * its Releases page, then run:
 *
 *   node src/scripts/importBanksFromDataset.js path/to/banknames.json
 *
 * Accepted input shapes:
 *   1. { "HDFC": "HDFC Bank", "PUNB": "Punjab National Bank", ... }
 *      (bank-code -> name map, e.g. banknames.json as-is)
 *   2. [{ "name": "HDFC Bank", "code": "HDFC" }, ...]
 *   3. A CSV with a header row containing a "name" (or "bank"/"BANK")
 *      column - one bank name per row (duplicates by slug are
 *      skipped via ON DUPLICATE KEY).
 *
 * Every imported bank gets parser_key = 'generic' so it's
 * immediately usable through the GenericStatementParser - no code
 * changes needed to make a newly-imported bank selectable and
 * convertible.
 */

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseJson(content) {
  const data = JSON.parse(content);

  if (Array.isArray(data)) {
    return data
      .map((entry) => (typeof entry === 'string' ? entry : entry.name || entry.bank || entry.BANK))
      .filter(Boolean);
  }

  // Object shape: { CODE: "Bank Name", ... }
  return Object.values(data).filter((v) => typeof v === 'string');
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const nameIndex = header.findIndex((h) => h === 'name' || h === 'bank');
  if (nameIndex === -1) {
    throw new Error('CSV must have a "name" or "bank" column in its header row.');
  }

  return lines.slice(1).map((line) => line.split(',')[nameIndex]?.trim()).filter(Boolean);
}

async function importBanks(filePath) {
  const resolved = path.resolve(filePath);
  const content = fs.readFileSync(resolved, 'utf8');
  const ext = path.extname(resolved).toLowerCase();

  const names = ext === '.csv' ? parseCsv(content) : parseJson(content);
  const uniqueNames = [...new Set(names.map((n) => n.trim()).filter(Boolean))];

  const connection = await pool.getConnection();
  let inserted = 0;
  let updated = 0;

  try {
    for (const name of uniqueNames) {
      const slug = slugify(name);
      if (!slug) continue;

      const [result] = await connection.query(
        `INSERT INTO banks (name, slug, parser_key)
         VALUES (?, ?, 'generic')
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [name, slug]
      );
      // affectedRows is 1 for a fresh insert, 2 for an update that
      // actually changed a row under ON DUPLICATE KEY UPDATE.
      if (result.affectedRows === 1) inserted += 1;
      else updated += 1;
    }
  } finally {
    connection.release();
  }

  return { total: uniqueNames.length, inserted, updated };
}

if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node src/scripts/importBanksFromDataset.js <path-to-json-or-csv>');
    process.exit(1);
  }

  importBanks(filePath)
    .then(({ total, inserted, updated }) => {
      console.log(`Processed ${total} bank names: ${inserted} inserted, ${updated} already present/updated.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Import failed:', err.message);
      process.exit(1);
    })
    .finally(() => {
      pool.end().catch(() => {});
    });
}

module.exports = { importBanks, slugify };
