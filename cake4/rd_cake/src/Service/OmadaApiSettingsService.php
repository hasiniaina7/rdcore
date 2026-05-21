<?php
declare(strict_types=1);

namespace App\Service;

use Cake\Core\Configure;
use Cake\ORM\TableRegistry;

class OmadaApiSettingsService
{
    public function getActiveConfig(): ?array
    {
        try {
            $table = TableRegistry::get('OmadaApiSettings');
            $entity = $table->find()->order(['id' => 'ASC'])->first();
            if ($entity && (bool)$entity->enabled) {
                return [
                    'base_url' => rtrim((string)$entity->base_url, '/'),
                    'omadac_id' => (string)$entity->omadac_id,
                    'site_id' => (string)$entity->site_id,
                    'api_username' => (string)$entity->api_username,
                    'api_password' => $table->getDecryptedPassword($entity),
                    'api_client_id' => (string)($entity->api_client_id ?? ''),
                    'api_client_secret' => $table->getDecryptedClientSecret($entity),
                    'enabled' => (bool)$entity->enabled,
                    'source' => 'db',
                ];
            }
        } catch (\Throwable $e) {
            // Fallback to file config when table is not migrated yet.
        }

        Configure::load('Omada', 'default');
        $cfg = Configure::read('OmadaOpenApi') ?? [];

        if (!is_array($cfg)) {
            return null;
        }

        $enabled = (bool)($cfg['enabled'] ?? false);
        if (!$enabled) {
            return null;
        }

        return [
            'base_url' => rtrim((string)($cfg['base_url'] ?? ''), '/'),
            'omadac_id' => (string)($cfg['omadac_id'] ?? ''),
            'site_id' => (string)($cfg['site_id'] ?? ''),
            'api_username' => (string)($cfg['api_username'] ?? ''),
            'api_password' => (string)($cfg['api_password'] ?? ''),
            'api_client_id' => (string)($cfg['api_client_id'] ?? ''),
            'api_client_secret' => (string)($cfg['api_client_secret'] ?? ''),
            'enabled' => true,
            'source' => 'config',
        ];
    }
}
