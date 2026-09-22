// pdfjs-dist is required lazily inside extractPagesText - see there for why.

/**
 * Returns one array per page, each containing every text item on
 * that page with its position (x, y in PDF user space, origin
 * bottom-left) and approximate size. This positional data - not just
 * the plain reading-order text - is what lets the parser reconstruct
 * a table's columns regardless of the bank's layout.
 *
 * @param {Buffer} pdfBuffer
 * @param {string} [password] - required if the PDF is encrypted;
 *   pdfjs throws a PasswordException ("No password given") without it.
 *
 * pdfjs-dist is required lazily, inside this function, so that
 * everything else in ./extraction (which only needs already-extracted
 * items) can be imported and unit-tested without the dependency
 * being installed.
 */
async function extractPagesText(pdfBuffer, password) {
  // eslint-disable-next-line global-require, import/no-unresolved
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

  const data = new Uint8Array(pdfBuffer);
  const loadingTask = pdfjsLib.getDocument({
    data,
    password: password || undefined,
    isEvalSupported: false,
    useSystemFonts: false,
  });

  const doc = await loadingTask.promise;
  const pages = [];

  try {
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
      // eslint-disable-next-line no-await-in-loop
      const page = await doc.getPage(pageNum);
      // eslint-disable-next-line no-await-in-loop
      const content = await page.getTextContent();

      const items = content.items
        .filter((item) => typeof item.str === 'string' && item.str.trim().length > 0)
        .map((item) => ({
          text: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width || Math.abs(item.transform[0]) * item.str.length,
          height: item.height || Math.abs(item.transform[3]) || 10,
        }));

      pages.push(items);
    }
  } finally {
    await doc.destroy();
  }

  return pages;
}

module.exports = { extractPagesText };
