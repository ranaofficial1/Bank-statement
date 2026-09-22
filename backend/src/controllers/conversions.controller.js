const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const fs = require('fs/promises');

const uploadedFileModel = require('../models/uploadedFile.model');
const conversionModel = require('../models/conversion.model');
const conversionLogModel = require('../models/conversionLog.model');
const transactionModel = require('../models/transaction.model');
const { getParserForBank } = require('../parsers');
const passwordCache = require('../utils/passwordCache');

// A file can be converted from a fresh upload, or re-converted after
// a previous attempt failed (e.g. once the underlying issue is
// fixed) - 'failed' is included so a bad attempt never permanently
// blocks retrying the same upload.
const CONVERTIBLE_STATUSES = ['uploaded', 'failed'];

function parseId(raw, label = 'id') {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `Invalid ${label}.`);
  }
  return id;
}

const startConversion = asyncHandler(async (req, res) => {
  const uploadedFileId = parseId(req.body.uploadedFileId, 'uploadedFileId');

  const file = await uploadedFileModel.findByIdForUser(uploadedFileId, req.userId);
  if (!file) {
    throw new ApiError(404, 'Upload not found.');
  }
  if (!CONVERTIBLE_STATUSES.includes(file.status)) {
    throw new ApiError(
      400,
      file.status === 'password_required'
        ? 'This file still needs its password verified before it can be converted.'
        : `This file cannot be converted right now (status: ${file.status}).`
    );
  }

  // The file on disk is still the original encrypted PDF - verifying
  // the password earlier only checked it, it was never persisted.
  // Extraction needs it again here, from the short-lived cache set
  // at verification time.
  let password;
  if (file.is_password_protected) {
    password = passwordCache.get(file.id);
    if (!password) {
      throw new ApiError(
        400,
        'Password verification has expired for this file. Please re-enter the PDF password and try again.'
      );
    }
  }

  const conversion = await conversionModel.create({
    userId: req.userId,
    uploadedFileId: file.id,
    bankId: file.bank_id,
  });
  await uploadedFileModel.updateStatus(file.id, 'processing');

  const parserKey = req.body.parserKeyOverride || 'generic';
  const parser = getParserForBank(parserKey);

  try {
    const pdfBuffer = await fs.readFile(file.file_path);
    const { transactions, warnings } = await parser.parse(pdfBuffer, { password });

    await transactionModel.bulkCreate(conversion.id, transactions);
    for (const warning of warnings) {
      // eslint-disable-next-line no-await-in-loop
      await conversionLogModel.log(conversion.id, 'warning', warning);
    }
    await conversionLogModel.log(
      conversion.id,
      'info',
      `Extracted ${transactions.length} transaction(s) using the '${parserKey}' parser.`
    );

    const updatedConversion = await conversionModel.markCompleted(conversion.id, transactions.length);
    await uploadedFileModel.updateStatus(file.id, 'processed');

    res.status(201).json({ success: true, conversion: updatedConversion });
  } catch (err) {
    await conversionLogModel.log(conversion.id, 'error', err.message);
    const failedConversion = await conversionModel.markFailed(conversion.id, err.message);
    await uploadedFileModel.updateStatus(file.id, 'failed');

    // This is a real extraction failure (unsupported layout, corrupt
    // data, low confidence) - report it clearly rather than as a
    // generic 500, but don't pretend it succeeded.
    res.status(422).json({ success: false, message: err.message, conversion: failedConversion });
  }
});

const listConversions = asyncHandler(async (req, res) => {
  const conversions = await conversionModel.findAllForUser(req.userId);
  res.status(200).json({ success: true, conversions });
});

const getConversion = asyncHandler(async (req, res) => {
  const conversionId = parseId(req.params.id);
  const conversion = await conversionModel.findByIdForUser(conversionId, req.userId);
  if (!conversion) {
    throw new ApiError(404, 'Conversion not found.');
  }

  const [transactions, logs] = await Promise.all([
    transactionModel.findByConversion(conversion.id),
    conversionLogModel.findByConversion(conversion.id),
  ]);

  res.status(200).json({ success: true, conversion, transactions, logs });
});

module.exports = { startConversion, listConversions, getConversion };
