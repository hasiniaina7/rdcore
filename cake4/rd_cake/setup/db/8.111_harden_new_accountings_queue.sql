-- Harden async accounting queue to avoid drops when multiple usernames share one MAC.
-- Old schema used PRIMARY KEY(mac), which caused INSERT IGNORE collisions.

SET @db_name := DATABASE();

-- Drop legacy PRIMARY KEY(mac) if still present.
SET @pk_col_count := (
    SELECT COUNT(*) FROM information_schema.key_column_usage
    WHERE table_schema = @db_name
      AND table_name = 'new_accountings'
      AND constraint_name = 'PRIMARY'
);
SET @pk_first_col := (
    SELECT column_name FROM information_schema.key_column_usage
    WHERE table_schema = @db_name
      AND table_name = 'new_accountings'
      AND constraint_name = 'PRIMARY'
    ORDER BY ordinal_position ASC
    LIMIT 1
);
SET @sql := IF(
    @pk_col_count = 1 AND @pk_first_col = 'mac',
    'ALTER TABLE new_accountings DROP PRIMARY KEY',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add surrogate key once.
SET @has_id := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = @db_name
      AND table_name = 'new_accountings'
      AND column_name = 'id'
);
SET @sql := IF(
    @has_id = 0,
    'ALTER TABLE new_accountings ADD COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Ensure dedupe key and search indexes.
SET @has_uq := (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = @db_name
      AND table_name = 'new_accountings'
      AND index_name = 'uq_new_accountings_username_mac'
);
SET @sql := IF(
    @has_uq = 0,
    'ALTER TABLE new_accountings ADD UNIQUE KEY uq_new_accountings_username_mac (username, mac)',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx_username := (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = @db_name
      AND table_name = 'new_accountings'
      AND index_name = 'idx_new_accountings_username'
);
SET @sql := IF(
    @has_idx_username = 0,
    'ALTER TABLE new_accountings ADD KEY idx_new_accountings_username (username)',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx_mac := (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = @db_name
      AND table_name = 'new_accountings'
      AND index_name = 'idx_new_accountings_mac'
);
SET @sql := IF(
    @has_idx_mac = 0,
    'ALTER TABLE new_accountings ADD KEY idx_new_accountings_mac (mac)',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
