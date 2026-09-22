const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// Tried in order; the first pattern that matches AND produces a
// valid calendar date wins. Covers the date formats seen across
// Indian bank statements: numeric (DD/MM/YYYY, DD-MM-YY, ISO) and
// abbreviated-month (DD-MMM-YYYY, DD-MMM-YY).
const DATE_PATTERNS = [
  {
    regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    build: (m) => new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])),
  },
  {
    regex: /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,
    build: (m) => new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])),
  },
  {
    regex: /^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/,
    build: (m) => new Date(Date.UTC(2000 + +m[3], +m[2] - 1, +m[1])),
  },
  {
    regex: /^(\d{1,2})[-\s]([A-Za-z]{3,})[-\s](\d{4})$/,
    build: (m) => {
      const month = MONTHS[m[2].toLowerCase().slice(0, 3)];
      return month === undefined ? null : new Date(Date.UTC(+m[3], month, +m[1]));
    },
  },
  {
    regex: /^(\d{1,2})[-\s]([A-Za-z]{3,})[-\s](\d{2})$/,
    build: (m) => {
      const month = MONTHS[m[2].toLowerCase().slice(0, 3)];
      return month === undefined ? null : new Date(Date.UTC(2000 + +m[3], month, +m[1]));
    },
  },
];

/** Returns a JS Date (UTC midnight) or null if nothing recognizable was found. */
function parseDate(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();

  for (const pattern of DATE_PATTERNS) {
    const match = trimmed.match(pattern.regex);
    if (!match) continue;
    const date = pattern.build(match);
    if (date && !Number.isNaN(date.getTime())) {
      return date;
    }
  }
  return null;
}

function toSqlDate(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Strips currency symbols, thousands separators and trailing Dr/Cr
 * markers, returning a plain number, or null if nothing numeric
 * remains.
 */
function parseAmount(raw) {
  if (!raw || typeof raw !== 'string') return null;

  const withoutMarkers = raw.replace(/\b(dr|cr)\b/gi, '').trim();
  const cleaned = withoutMarkers.replace(/[^\d.-]/g, '');

  if (!cleaned || cleaned === '-' || cleaned === '.') return null;

  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

module.exports = { parseDate, toSqlDate, parseAmount };
