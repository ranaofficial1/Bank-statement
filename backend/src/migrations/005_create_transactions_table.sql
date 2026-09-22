CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversion_id BIGINT UNSIGNED NOT NULL,
  txn_date DATE NULL,
  value_date DATE NULL,
  description VARCHAR(1000) NULL,
  reference_number VARCHAR(150) NULL,
  debit DECIMAL(15, 2) NULL,
  credit DECIMAL(15, 2) NULL,
  balance DECIMAL(15, 2) NULL,
  txn_type ENUM('debit', 'credit', 'unknown') NOT NULL DEFAULT 'unknown',
  raw_row_text TEXT NULL COMMENT 'Original extracted line, kept for audit/debugging parser accuracy',
  row_order INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Preserves original statement order',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_transactions_conversion
    FOREIGN KEY (conversion_id) REFERENCES conversions(id) ON DELETE CASCADE,
  KEY idx_transactions_conversion (conversion_id),
  KEY idx_transactions_txn_date (txn_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
