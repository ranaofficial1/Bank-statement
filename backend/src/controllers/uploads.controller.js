const fs = require('fs/promises');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const uploadedFileModel = require('../models/uploadedFile.model');
const bankModel = require('../models/bank.model');
const { hasPdfMagicBytes } = require('../utils/pdfValidation');
const { tryOpenPdf } = require('../utils/pdfPassword');
const passwordCache = require('../utils/passwordCache');

/** Strips server-internal fields before a record goes to the client. */
function toPublic(file) {
  const { file_path, stored_filename, user_id, ...rest } = file;
  return rest;
}

async function safeUnlink(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

function parseFileId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid upload id.');
  }
  return id;
}

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file was uploaded. Attach a PDF under the "file" field.');
  }

  let bank = null;
  if (req.body.bankId) {
    const bankId = Number(req.body.bankId);
    if (!Number.isInteger(bankId)) {
      await safeUnlink(req.file.path);
      throw new ApiError(400, 'Invalid bank id.');
    }
    bank = await bankModel.findById(bankId);
    if (!bank) {
      await safeUnlink(req.file.path);
      throw new ApiError(400, 'Selected bank was not found.');
    }
  }

  const isRealPdf = await hasPdfMagicBytes(req.file.path);
  if (!isRealPdf) {
    await safeUnlink(req.file.path);
    throw new ApiError(400, 'The uploaded file is not a valid PDF.');
  }

  const check = await tryOpenPdf(req.file.path);
  if (!check.ok && check.reason === 'invalid_pdf') {
    await safeUnlink(req.file.path);
    throw new ApiError(400, 'The uploaded PDF appears to be corrupted and could not be read.');
  }

  const isPasswordProtected = !check.ok && check.reason === 'password_required';

  const record = await uploadedFileModel.create({
    userId: req.userId,
    bankId: bank ? bank.id : null,
    originalFilename: req.file.originalname,
    storedFilename: req.file.filename,
    filePath: req.file.path,
    fileSizeBytes: req.file.size,
    mimeType: req.file.mimetype,
    isPasswordProtected,
    status: isPasswordProtected ? 'password_required' : 'uploaded',
  });

  res.status(201).json({ success: true, file: toPublic(record) });
});

const verifyPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    throw new ApiError(400, 'Password is required.');
  }

  const fileId = parseFileId(req.params.id);
  const file = await uploadedFileModel.findByIdForUser(fileId, req.userId);
  if (!file) {
    throw new ApiError(404, 'Upload not found.');
  }
  if (file.status !== 'password_required') {
    throw new ApiError(400, 'This file is not awaiting a password.');
  }

  const result = await tryOpenPdf(file.file_path, password);
  if (!result.ok) {
    if (result.reason === 'incorrect_password') {
      throw new ApiError(401, 'Incorrect password. Please try again.');
    }
    throw new ApiError(400, 'Could not open the PDF with the provided password.');
  }

  const updated = await uploadedFileModel.updateStatus(file.id, 'uploaded');
  // Never persisted to the database - held only long enough (30 min
  // TTL) to reach the extraction step, which needs it to open the
  // still-encrypted file on disk. See utils/passwordCache.js.
  passwordCache.set(file.id, password);
  res.status(200).json({ success: true, file: toPublic(updated) });
});

const getUpload = asyncHandler(async (req, res) => {
  const fileId = parseFileId(req.params.id);
  const file = await uploadedFileModel.findByIdForUser(fileId, req.userId);
  if (!file) {
    throw new ApiError(404, 'Upload not found.');
  }
  res.status(200).json({ success: true, file: toPublic(file) });
});

const deleteUpload = asyncHandler(async (req, res) => {
  const fileId = parseFileId(req.params.id);
  const file = await uploadedFileModel.findByIdForUser(fileId, req.userId);
  if (!file) {
    throw new ApiError(404, 'Upload not found.');
  }

  await safeUnlink(file.file_path);
  await uploadedFileModel.remove(file.id);
  passwordCache.clear(file.id);
  res.status(200).json({ success: true, message: 'Upload removed.' });
});

module.exports = { uploadFile, verifyPassword, getUpload, deleteUpload };
