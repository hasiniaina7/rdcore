<?php
declare(strict_types=1);

namespace App\Controller;

use Cake\Core\Configure;

class OmadaApiSettingsController extends AppController
{
    protected string $main_model = 'OmadaApiSettings';

    public function initialize(): void
    {
        parent::initialize();
        $this->loadModel($this->main_model);
        $this->loadComponent('JsonErrors');
    }

    public function view()
    {
        if (!$this->Aa->admin_check($this)) {
            return;
        }

        $entity = $this->{$this->main_model}->find()->order(['id' => 'ASC'])->first();

        if (!$entity) {
            Configure::load('Omada', 'default');
            $fallback = Configure::read('OmadaOpenApi') ?? [];

            $data = [
                'id' => null,
                'base_url' => (string)($fallback['base_url'] ?? ''),
                'omadac_id' => (string)($fallback['omadac_id'] ?? ''),
                'site_id' => (string)($fallback['site_id'] ?? ''),
                'api_username' => (string)($fallback['api_username'] ?? ''),
                'api_password_set' => ((string)($fallback['api_password'] ?? '') !== ''),
                'api_client_id' => (string)($fallback['api_client_id'] ?? ''),
                'api_client_secret_set' => ((string)($fallback['api_client_secret'] ?? '') !== ''),
                'enabled' => (bool)($fallback['enabled'] ?? false),
                'source' => 'config',
            ];
        } else {
            $data = [
                'id' => (int)$entity->id,
                'base_url' => (string)$entity->base_url,
                'omadac_id' => (string)$entity->omadac_id,
                'site_id' => (string)$entity->site_id,
                'api_username' => (string)$entity->api_username,
                'api_password_set' => ((string)$entity->api_password !== ''),
                'api_client_id' => (string)($entity->api_client_id ?? ''),
                'api_client_secret_set' => ((string)($entity->api_client_secret ?? '') !== ''),
                'enabled' => (bool)$entity->enabled,
                'source' => 'db',
                'updated_at' => $entity->updated_at,
            ];
        }

        $this->set([
            'success' => true,
            'data' => $data,
        ]);
        $this->viewBuilder()->setOption('serialize', true);
    }

    public function edit()
    {
        if (!$this->request->is(['post', 'put', 'patch'])) {
            throw new \Cake\Http\Exception\MethodNotAllowedException();
        }
        if (!$this->Aa->admin_check($this)) {
            return;
        }

        $req = $this->request->getData();
        $entity = $this->{$this->main_model}->find()->order(['id' => 'ASC'])->first();
        if (!$entity) {
            $entity = $this->{$this->main_model}->newEmptyEntity();
        }

        $patch = [
            'base_url' => rtrim((string)($req['base_url'] ?? ''), '/'),
            'omadac_id' => (string)($req['omadac_id'] ?? ''),
            'site_id' => (string)($req['site_id'] ?? ''),
            'api_username' => (string)($req['api_username'] ?? ''),
            'api_client_id' => (string)($req['api_client_id'] ?? ''),
            'enabled' => (bool)($req['enabled'] ?? false),
        ];

        if (array_key_exists('api_password', $req) && (string)$req['api_password'] !== '') {
            $patch['api_password'] = (string)$req['api_password'];
        }

        if (array_key_exists('api_client_secret', $req) && (string)$req['api_client_secret'] !== '') {
            $patch['api_client_secret'] = (string)$req['api_client_secret'];
        }

        $entity = $this->{$this->main_model}->patchEntity($entity, $patch);
        if (!$this->{$this->main_model}->save($entity)) {
            $this->JsonErrors->entityErros($entity, __('Could not update Omada API settings'));
            return;
        }

        $this->set([
            'success' => true,
            'data' => [
                'id' => (int)$entity->id,
                'base_url' => (string)$entity->base_url,
                'omadac_id' => (string)$entity->omadac_id,
                'site_id' => (string)$entity->site_id,
                'api_username' => (string)$entity->api_username,
                'api_password_set' => ((string)$entity->api_password !== ''),
                'api_client_id' => (string)($entity->api_client_id ?? ''),
                'api_client_secret_set' => ((string)($entity->api_client_secret ?? '') !== ''),
                'enabled' => (bool)$entity->enabled,
            ],
        ]);
        $this->viewBuilder()->setOption('serialize', true);
    }
}
