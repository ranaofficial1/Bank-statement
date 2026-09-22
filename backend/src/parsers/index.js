const NotImplementedParser = require('./NotImplementedParser');
const GenericStatementParser = require('../extraction/GenericStatementParser');

/**
 * Maps a bank's parser_key (see banks.parser_key) to its parser
 * class. 'generic' - the default for every bank in the seed/import
 * data - resolves to GenericStatementParser, the header-driven engine
 * that handles the common case across banks without bank-specific
 * code. A bank with a genuinely unique layout can get either a small
 * config override (see ./config) fed into GenericStatementParser, or,
 * for real outliers, its own full parser class registered here.
 */
const PARSER_REGISTRY = {
  generic: GenericStatementParser,
};

function getParserForBank(parserKey) {
  const ParserClass = PARSER_REGISTRY[parserKey] || NotImplementedParser;
  return new ParserClass();
}

module.exports = { getParserForBank, PARSER_REGISTRY };
