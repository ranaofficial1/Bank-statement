const { pool } = require('../config/db');

/**
 * A starter set of real, correctly-named Indian banks, covering all
 * public sector banks, the major private/old-private banks, the
 * foreign banks with an Indian retail presence, small finance banks,
 * payments banks, and a few large urban cooperative banks.
 *
 * IMPORTANT: this list intentionally stays well short of the ~1,400
 * banks in the full RBI/NPCI-sourced dataset (see
 * scripts/importBanksFromDataset.js) because every name here is one
 * that could be verified rather than guessed. Do NOT hand-extend this
 * file to "add more banks" - run the importer against a real dataset
 * instead; see README.md, "Growing the bank list".
 *
 * parser_key is 'generic' for all of them: the GenericStatementParser
 * (Phase 4) is the default extraction engine for every bank unless a
 * specific override is registered in parsers/config or a fully
 * custom parser is registered in parsers/index.js.
 */
const BANKS = [
  // --- Public sector banks ---
  ['State Bank of India', 'sbi'],
  ['Punjab National Bank', 'pnb'],
  ['Bank of Baroda', 'bank-of-baroda'],
  ['Canara Bank', 'canara-bank'],
  ['Union Bank of India', 'union-bank-of-india'],
  ['Bank of India', 'bank-of-india'],
  ['Indian Bank', 'indian-bank'],
  ['Central Bank of India', 'central-bank-of-india'],
  ['Indian Overseas Bank', 'indian-overseas-bank'],
  ['UCO Bank', 'uco-bank'],
  ['Bank of Maharashtra', 'bank-of-maharashtra'],
  ['Punjab & Sind Bank', 'punjab-and-sind-bank'],

  // --- Private sector banks ---
  ['HDFC Bank', 'hdfc-bank'],
  ['ICICI Bank', 'icici-bank'],
  ['Axis Bank', 'axis-bank'],
  ['Kotak Mahindra Bank', 'kotak-mahindra-bank'],
  ['IndusInd Bank', 'indusind-bank'],
  ['Yes Bank', 'yes-bank'],
  ['IDFC First Bank', 'idfc-first-bank'],
  ['Federal Bank', 'federal-bank'],
  ['South Indian Bank', 'south-indian-bank'],
  ['Karnataka Bank', 'karnataka-bank'],
  ['Karur Vysya Bank', 'karur-vysya-bank'],
  ['City Union Bank', 'city-union-bank'],
  ['Tamilnad Mercantile Bank', 'tamilnad-mercantile-bank'],
  ['DCB Bank', 'dcb-bank'],
  ['RBL Bank', 'rbl-bank'],
  ['Bandhan Bank', 'bandhan-bank'],
  ['CSB Bank', 'csb-bank'],
  ['Dhanlaxmi Bank', 'dhanlaxmi-bank'],
  ['Jammu & Kashmir Bank', 'jammu-and-kashmir-bank'],
  ['Nainital Bank', 'nainital-bank'],

  // --- Foreign banks with Indian retail operations ---
  ['HSBC Bank', 'hsbc-bank'],
  ['Standard Chartered Bank', 'standard-chartered-bank'],
  ['Citibank', 'citibank'],
  ['Deutsche Bank', 'deutsche-bank'],
  ['DBS Bank India', 'dbs-bank-india'],
  ['Barclays Bank', 'barclays-bank'],

  // --- Small finance banks ---
  ['AU Small Finance Bank', 'au-small-finance-bank'],
  ['Equitas Small Finance Bank', 'equitas-small-finance-bank'],
  ['Ujjivan Small Finance Bank', 'ujjivan-small-finance-bank'],
  ['ESAF Small Finance Bank', 'esaf-small-finance-bank'],
  ['Suryoday Small Finance Bank', 'suryoday-small-finance-bank'],
  ['Utkarsh Small Finance Bank', 'utkarsh-small-finance-bank'],
  ['Jana Small Finance Bank', 'jana-small-finance-bank'],
  ['North East Small Finance Bank', 'north-east-small-finance-bank'],
  ['Capital Small Finance Bank', 'capital-small-finance-bank'],
  ['Shivalik Small Finance Bank', 'shivalik-small-finance-bank'],
  ['Unity Small Finance Bank', 'unity-small-finance-bank'],

  // --- Payments banks ---
  ['Paytm Payments Bank', 'paytm-payments-bank'],
  ['Airtel Payments Bank', 'airtel-payments-bank'],
  ['India Post Payments Bank', 'india-post-payments-bank'],
  ['Fino Payments Bank', 'fino-payments-bank'],
  ['NSDL Payments Bank', 'nsdl-payments-bank'],
  ['Jio Payments Bank', 'jio-payments-bank'],

  // --- Major urban cooperative banks ---
  ['Saraswat Co-operative Bank', 'saraswat-co-operative-bank'],
  ['Cosmos Co-operative Bank', 'cosmos-co-operative-bank'],
  ['Shamrao Vithal Co-operative Bank', 'shamrao-vithal-co-operative-bank'],
  ['Abhyudaya Co-operative Bank', 'abhyudaya-co-operative-bank'],
  ['TJSB Sahakari Bank', 'tjsb-sahakari-bank'],
  ['NKGSB Co-operative Bank', 'nkgsb-co-operative-bank'],
];

async function seedBanks() {
  const connection = await pool.getConnection();
  try {
    for (const [name, slug] of BANKS) {
      await connection.query(
        `INSERT INTO banks (name, slug, parser_key)
         VALUES (?, ?, 'generic')
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [name, slug]
      );
    }
    console.log(`Seeded ${BANKS.length} banks (starter set - see scripts/importBanksFromDataset.js to grow this).`);
  } finally {
    connection.release();
  }
}

if (require.main === module) {
  seedBanks()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding banks failed:', err.message);
      process.exit(1);
    })
    .finally(() => {
      pool.end().catch(() => {});
    });
}

module.exports = { seedBanks, BANKS };
