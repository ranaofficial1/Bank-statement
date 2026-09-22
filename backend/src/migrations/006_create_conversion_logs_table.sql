CREATE TABLE IF NOT EXISTS conversion_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversion_id BIGINT UNSIGNED NOT NULL,
  level ENUM('info', 'warning', 'error') NOT NULL DEFAULT 'info',
  message VARCHAR(1000) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_conversion_logs_conversion
    FOREIGN KEY (conversion_id) REFERENCES conversions(id) ON DELETE CASCADE,
  KEY idx_conversion_logs_conversion (conversion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
