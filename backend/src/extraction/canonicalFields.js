/**
 * Every bank names its statement columns differently. Rather than
 * hard-coding one bank's column order, the generic parser recognizes
 * a column by matching its header text against this synonym table -
 * this is what lets one engine handle many banks' naming conventions.
 */
const FIELD_SYNONYMS = {
  date: ['date', 'txn date', 'transaction date', 'value date', 'posting date'],
  description: [
    'description',
    'narration',
    'particulars',
    'transaction details',
    'details',
    'remarks',
  ],
  debit: ['debit', 'withdrawal', 'withdrawal amt', 'withdrawal amount', 'dr'],
  credit: ['credit', 'deposit', 'deposit amount', 'cr'],
  balance: ['balance', 'closing balance', 'running balance', 'available balance'],
  reference: ['chq no', 'cheque no', 'ref no', 'reference', 'chq/ref no', 'transaction id'],
};

/**
 * Normalizes a header cell's text and matches it to a canonical
 * field, or returns null if it doesn't look like a known column.
 *
 * Real column headers are short (a word or two). Transaction
 * narration text is not, and can easily be 40-80+ characters -
 * Indian UPI narrations in particular often contain literal "DR"/"CR"
 * tokens (e.g. "UPI/.../DR/Amazon/..."), which would otherwise
 * false-match the short 'dr'/'cr' synonyms below. The length guard
 * keeps those synonyms usable for genuine short header cells while
 * excluding long narration strings from ever being considered.
 */
const MAX_HEADER_CELL_LENGTH = 25;

function matchField(headerText) {
  if (!headerText || headerText.trim().length > MAX_HEADER_CELL_LENGTH) {
    return null;
  }

  const normalized = headerText
    .toLowerCase()
    .replace(/[.():]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  for (const [field, synonyms] of Object.entries(FIELD_SYNONYMS)) {
    if (synonyms.some((syn) => normalized === syn || normalized.includes(syn))) {
      return field;
    }
  }
  return null;
}

module.exports = { FIELD_SYNONYMS, matchField };
