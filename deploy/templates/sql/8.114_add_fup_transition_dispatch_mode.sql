-- Record whether a FUP transition was a hard block or a rate refresh.  The
-- installer may replay this file, so the schema adjustment is idempotent.
DROP PROCEDURE IF EXISTS add_fup_transition_dispatch_mode;

DELIMITER //
CREATE PROCEDURE add_fup_transition_dispatch_mode()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'fup_transition_dispatches'
          AND column_name = 'dispatch_mode'
    ) THEN
        ALTER TABLE fup_transition_dispatches
            ADD COLUMN dispatch_mode ENUM('rate_refresh', 'block') NOT NULL DEFAULT 'block'
            AFTER radacctid;
    END IF;
END//
DELIMITER ;

CALL add_fup_transition_dispatch_mode();
DROP PROCEDURE IF EXISTS add_fup_transition_dispatch_mode;
