-- Phase 4 adds per-row validation flags so the extraction engine can
-- mark a transaction as uncertain instead of silently guessing or
-- dropping it. Phase 5's review UI will surface needs_review rows.
ALTER TABLE transactions
  ADD COLUMN needs_review TINYINT(1) NOT NULL DEFAULT 0 AFTER row_order,
  ADD COLUMN review_reason VARCHAR(255) NULL AFTER needs_review;
