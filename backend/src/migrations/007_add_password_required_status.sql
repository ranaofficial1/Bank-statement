-- Phase 3 adds a distinct status for files that were uploaded but are
-- still waiting on the user to supply a PDF password before they can
-- move on to extraction.
ALTER TABLE uploaded_files
  MODIFY COLUMN status ENUM('uploaded', 'password_required', 'processing', 'processed', 'failed')
  NOT NULL DEFAULT 'uploaded';
