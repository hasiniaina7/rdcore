-- Keep FUP period lookups bounded by user/device and creation time.
-- LOCK=NONE prevents the migration from blocking live accounting writes.
DROP PROCEDURE IF EXISTS add_user_stats_period_indexes;

DELIMITER //
CREATE PROCEDURE add_user_stats_period_indexes()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'user_stats'
          AND index_name = 'idx_us_username_created'
    ) THEN
        ALTER TABLE user_stats
            ADD INDEX idx_us_username_created (username, created),
            ALGORITHM=INPLACE,
            LOCK=NONE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'user_stats'
          AND index_name = 'idx_us_username_mac_created'
    ) THEN
        ALTER TABLE user_stats
            ADD INDEX idx_us_username_mac_created (username, callingstationid, created),
            ALGORITHM=INPLACE,
            LOCK=NONE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'user_stats'
          AND index_name = 'idx_us_mac_created'
    ) THEN
        ALTER TABLE user_stats
            ADD INDEX idx_us_mac_created (callingstationid, created),
            ALGORITHM=INPLACE,
            LOCK=NONE;
    END IF;
END//
DELIMITER ;

CALL add_user_stats_period_indexes();
DROP PROCEDURE IF EXISTS add_user_stats_period_indexes;
