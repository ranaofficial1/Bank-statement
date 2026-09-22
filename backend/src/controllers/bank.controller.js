const asyncHandler = require('../utils/asyncHandler');
const bankModel = require('../models/bank.model');

const listBanks = asyncHandler(async (req, res) => {
  const banks = await bankModel.findAll({ search: req.query.search });
  res.status(200).json({ success: true, banks });
});

module.exports = { listBanks };
