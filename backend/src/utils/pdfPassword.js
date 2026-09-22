const fs = require('fs');
// The "legacy" build runs in plain Node without a DOM/canvas, which is
// all we need here: we're only opening the document to check whether
// it's encrypted and, if so, whether a given password unlocks it.
// eslint-disable-next-line import/no-unresolved
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const { PasswordResponses } = pdfjsLib;

/**
 * Attempts to open a PDF, optionally with a password.
 *
 * @returns {Promise<{ok: true} | {ok: false, reason: 'password_required'|'incorrect_password'|'invalid_pdf', message?: string}>}
 */
async function tryOpenPdf(filePath, password) {
  const fileBuffer = await fs.promises.readFile(filePath);
  const data = new Uint8Array(fileBuffer);

  const loadingTask = pdfjsLib.getDocument({
    data,
    password: password || undefined,
    isEvalSupported: false,
    useSystemFonts: false,
  });

  try {
    const doc = await loadingTask.promise;
    await doc.destroy();
    return { ok: true };
  } catch (err) {
    if (err && err.name === 'PasswordException') {
      if (err.code === PasswordResponses.NEED_PASSWORD) {
        return { ok: false, reason: 'password_required' };
      }
      if (err.code === PasswordResponses.INCORRECT_PASSWORD) {
        return { ok: false, reason: 'incorrect_password' };
      }
    }
    return { ok: false, reason: 'invalid_pdf', message: err.message };
  }
}

module.exports = { tryOpenPdf };
