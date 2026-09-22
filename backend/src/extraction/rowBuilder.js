/**
 * Groups text items (each with an x/y position from the PDF) into
 * rows, based on how close their y-coordinates are - this is what
 * reconstructs "lines" from a PDF's unordered text items, without
 * assuming any particular column layout.
 *
 * The tolerance is relative to each item's own reported height
 * (font size) rather than a fixed absolute number. A fixed tolerance
 * picked without real coordinate data is fragile across different
 * PDFs' font sizes/scales - and right-aligned numeric columns (e.g.
 * Balance) very plausibly render with a slightly different vertical
 * baseline than the rest of their row (different font metrics for
 * "tabular figures"), which a too-tight fixed tolerance would split
 * into a separate row entirely.
 */
function buildRows(items, { minTolerance = 3, toleranceRatio = 0.5 } = {}) {
  // PDF y increases upward, so sorting descending gives top-to-bottom
  // reading order; within a row, ascending x gives left-to-right.
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

  const rows = [];
  for (const item of sorted) {
    const last = rows[rows.length - 1];
    const tolerance = Math.max(minTolerance, (item.height || 10) * toleranceRatio);
    if (last && Math.abs(last.y - item.y) <= tolerance) {
      last.items.push(item);
      last.y = (last.y * (last.items.length - 1) + item.y) / last.items.length;
    } else {
      rows.push({ y: item.y, items: [item] });
    }
  }

  rows.forEach((row) => row.items.sort((a, b) => a.x - b.x));

  return rows.map((row) => ({
    y: row.y,
    items: row.items,
    text: row.items
      .map((i) => i.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim(),
  }));
}

module.exports = { buildRows };
