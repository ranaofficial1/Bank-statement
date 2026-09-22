const BaseParser = require('./BaseParser');

/**
 * Used for any bank whose parser_key has no entry in PARSER_REGISTRY
 * yet. Fails loudly and clearly instead of returning fake or
 * best-guess transaction data.
 */
class NotImplementedParser extends BaseParser {
  async parse() {
    throw new Error(
      'No parser has been implemented for this bank yet. Real extraction is built bank-by-bank starting in Phase 4.'
    );
  }
}

module.exports = NotImplementedParser;
