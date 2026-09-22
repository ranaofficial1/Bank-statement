const { matchField } = require('./canonicalFields');
const { centerX } = require('./geometry');

/**
 * Checks whether a single row looks like a table header: it needs a
 * "date" column plus at least one amount-like column (debit, credit,
 * or balance), and at least 3 distinct recognized columns overall so
 * a stray cell that happens to say "Balance" in a summary line
 * doesn't get mistaken for the real header.
 */
function isLikelyHeaderRow(row) {
  const matches = row.items
    .map((item) => ({ item, field: matchField(item.text) }))
    .filter((m) => m.field);

  const distinctFields = new Set(matches.map((m) => m.field));
  const hasDate = distinctFields.has('date');
  const hasAmount =
    distinctFields.has('debit') || distinctFields.has('credit') || distinctFields.has('balance');

  return { isHeader: distinctFields.size >= 3 && hasDate && hasAmount, matches };
}

/** Scans rows in order and returns the first one that looks like a header. */
function detectHeader(rows) {
  for (let i = 0; i < rows.length; i += 1) {
    const { isHeader } = isLikelyHeaderRow(rows[i]);
    if (isHeader) {
      return { rowIndex: i, row: rows[i] };
    }
  }
  return null;
}

/**
 * Turns a header row into column boundaries: every value between the
 * midpoint before a header cell and the midpoint after it belongs to
 * that cell's column.
 *
 * Boundaries are computed from EVERY cell in the header row, matched
 * or not (e.g. an unrecognized leading "Sr No" column) - only
 * recognized cells become columns in the returned array, but an
 * unrecognized cell still "claims" its own slice of the row's width.
 * Without this, the nearest recognized column's boundary would
 * stretch out to cover the unrecognized cell too (a bare leftmost
 * column's left edge defaults to -Infinity), silently absorbing that
 * column's values into the wrong field - which is exactly what broke
 * extraction on a real statement with a leading, unmatched "Sr No"
 * column: its row numbers got prepended onto every date value.
 */
function buildColumns(row) {
  const tagged = [...row.items]
    .map((item) => ({ item, field: matchField(item.text), x: centerX(item) }))
    .sort((a, b) => a.x - b.x);

  const columns = [];
  tagged.forEach((entry, idx) => {
    const prevX = idx === 0 ? -Infinity : (tagged[idx - 1].x + entry.x) / 2;
    const nextX = idx + 1 < tagged.length ? (entry.x + tagged[idx + 1].x) / 2 : Infinity;
    if (entry.field) {
      columns.push({ field: entry.field, xStart: prevX, xEnd: nextX });
    }
  });

  return columns;
}

module.exports = { detectHeader, isLikelyHeaderRow, buildColumns };
