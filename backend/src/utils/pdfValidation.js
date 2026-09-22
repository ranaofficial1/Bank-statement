const fs = require('fs');

const PDF_MAGIC = '%PDF-';

/**
 * Confirms a file actually starts with the PDF magic bytes, since a
 * client-supplied MIME type or file extension can be faked trivially.
 */
async function hasPdfMagicBytes(filePath) {
  const handle = await fs.promises.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(PDF_MAGIC.length);
    await handle.read(buffer, 0, PDF_MAGIC.length, 0);
    return buffer.toString('ascii') === PDF_MAGIC;
  } finally {
    await handle.close();
  }
}

module.exports = { hasPdfMagicBytes };
