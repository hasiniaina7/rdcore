CREATE TABLE `omada_api_settings` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `base_url` varchar(255) NOT NULL,
    `omadac_id` varchar(128) NOT NULL,
    `site_id` varchar(128) NOT NULL DEFAULT '',
    `api_username` varchar(255) NOT NULL DEFAULT '',
    `api_password` text NOT NULL,
    `api_client_id` varchar(255) NOT NULL DEFAULT '',
    `api_client_secret` text NOT NULL,
    `enabled` tinyint(1) NOT NULL DEFAULT 0,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `omada_api_settings` (
    `base_url`,
    `omadac_id`,
    `site_id`,
    `api_username`,
    `api_password`,
    `api_client_id`,
    `api_client_secret`,
    `enabled`,
    `updated_at`
) VALUES (
    'https://167.86.71.186:8043',
    '5b6a916cf5c6ddfd396f85560f0c4d96',
    '',
    '',
    '',
    '',
    '',
    0,
    NOW()
);
