ALTER TABLE `omada_api_settings`
    ADD COLUMN `api_client_id` varchar(255) NOT NULL DEFAULT '' AFTER `api_password`,
    ADD COLUMN `api_client_secret` text NOT NULL AFTER `api_client_id`;
