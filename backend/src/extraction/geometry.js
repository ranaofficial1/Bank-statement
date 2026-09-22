/**
 * The x position of a text item's horizontal center, rather than its
 * left edge.
 *
 * Real statement tables very often right-align numeric columns
 * (debit/credit/balance), so two values in the same column can start
 * at different x positions purely because they have different digit
 * counts (e.g. "77,391.49" vs "1,28,883.73") while ending at roughly
 * the same edge. Matching by left edge alone made column assignment
 * sensitive to that width variance - a wider number could shift left
 * enough to cross into a neighboring column's boundary and be
 * dropped or misassigned. Matching by center is far less sensitive
 * to this and is standard practice for PDF table extraction.
 */
function centerX(item) {
  return item.x + (item.width || 0) / 2;
}

/**
 * True for a text run with no digits at all - a currency symbol
 * ("₹", "Rs", "INR"), a stray dash, etc. Never true for an actual
 * amount, however it's formatted.
 */
function isDigitless(text) {
  return !/\d/.test(text);
}

/**
 * Turns a set of numeric-zone text items into cells, merging a
 * digit-less symbol into whichever number it's immediately adjacent
 * to (e.g. a "₹" rendered as a separate PDF text run right before its
 * number), and dropping any symbol that isn't adjacent to a number.
 *
 * Deliberately does NOT merge two items that both contain digits,
 * however close together they are. An earlier version of this used a
 * generic "merge anything within N units" gap threshold, which
 * seemed reasonable without real coordinate data to test against -
 * but on an actual statement it merged genuinely separate Debit and
 * Balance values whenever a real table happened to space them only a
 * few units apart, producing an unparseable blob like
 * "469.64 77,391.49" and silently destroying both values on every
 * affected row. Only ever merging symbol-into-number, never
 * number-into-number, removes that failure mode entirely: two real
 * amounts are always kept as two separate cells no matter how close
 * together the table places them.
 */
function mergeSymbolsIntoAmounts(items, { symbolGap = 6 } = {}) {
  const sorted = [...items].sort((a, b) => a.x - b.x);
  const cells = [];

  for (let i = 0; i < sorted.length; i += 1) {
    const curr = sorted[i];

    if (isDigitless(curr.text)) {
      const next = sorted[i + 1];
      const currRight = curr.x + (curr.width || 0);
      if (next && !isDigitless(next.text) && next.x - currRight <= symbolGap) {
        cells.push({
          x: curr.x,
          text: `${curr.text} ${next.text}`.trim(),
        });
        i += 1; // consumed next too
        continue;
      }
      // A symbol with no adjacent number to attach to carries no
      // usable data - drop it rather than let it occupy a cell slot.
      continue;
    }

    cells.push({ x: curr.x, text: curr.text });
  }

  return cells;
}

module.exports = { centerX, mergeSymbolsIntoAmounts };
