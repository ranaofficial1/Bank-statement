/**
 * Every bank-specific parser extends this class and implements parse().
 * Phase 3 only establishes this contract and the registry around it
 * (see ./index.js) so the upload flow can already record which bank a
 * file belongs to. Phase 4 implements the first real parser(s) and
 * plugs them into PARSER_REGISTRY - nothing here fabricates data.
 */
class BaseParser {
  /**
   * @param {Buffer} pdfBuffer - raw bytes of the PDF as stored on disk
   *   (still encrypted if the file is password-protected - parsers
   *   that need to open it must accept and use options.password)
   * @param {{password?: string}} [options]
   * @returns {Promise<{transactions: Array<Object>, warnings: Array<string>}>}
   */
  // eslint-disable-next-line no-unused-vars
  async parse(pdfBuffer, options = {}) {
    throw new Error('parse() must be implemented by a bank-specific parser.');
  }
}

module.exports = BaseParser;
