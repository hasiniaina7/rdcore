-- Persist the last FUP transition per cloud/user so an acknowledged or ambiguous
-- disconnect cannot be emitted again while FreeRADIUS awaits re-authentication.
DROP PROCEDURE IF EXISTS add_fup_transition_dispatches;

DELIMITER //
CREATE PROCEDURE add_fup_transition_dispatches()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name = 'fup_transition_dispatches'
    ) THEN
        CREATE TABLE fup_transition_dispatches (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            cloud_id INT NOT NULL,
            username VARCHAR(255) NOT NULL,
            from_component_id INT NOT NULL DEFAULT 0,
            to_component_id INT NOT NULL DEFAULT 0,
            radacctid BIGINT NULL,
            status ENUM('pending', 'ack', 'failed', 'reconciled') NOT NULL,
            dispatched_at DATETIME NULL,
            acknowledged_at DATETIME NULL,
            reconciled_at DATETIME NULL,
            last_error VARCHAR(255) NULL,
            created DATETIME NOT NULL,
            modified DATETIME NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uq_fup_transition_cloud_username (cloud_id, username),
            KEY idx_fup_transition_status (status, modified)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    END IF;
END//
DELIMITER ;

CALL add_fup_transition_dispatches();
DROP PROCEDURE IF EXISTS add_fup_transition_dispatches;
