<?php
declare(strict_types=1);

namespace App\Model\Table;

use App\Utility\SensitiveDataCipher;
use Cake\Event\EventInterface;
use Cake\ORM\Entity;
use Cake\ORM\Table;
use Cake\Validation\Validator;

class OmadaApiSettingsTable extends Table
{
    public function initialize(array $config): void
    {
        $this->setTable('omada_api_settings');
        $this->setPrimaryKey('id');
        $this->addBehavior('Timestamp', [
            'created' => false,
            'modified' => 'updated_at',
        ]);
    }

    public function validationDefault(Validator $validator): Validator
    {
        $validator
            ->scalar('base_url')
            ->maxLength('base_url', 255)
            ->notEmptyString('base_url', 'base_url is required')
            ->scalar('omadac_id')
            ->maxLength('omadac_id', 128)
            ->notEmptyString('omadac_id', 'omadac_id is required')
            ->scalar('site_id')
            ->maxLength('site_id', 128)
            ->allowEmptyString('site_id')
            ->scalar('api_username')
            ->maxLength('api_username', 255)
            ->allowEmptyString('api_username')
            ->scalar('api_password')
            ->allowEmptyString('api_password')
            ->scalar('api_client_id')
            ->maxLength('api_client_id', 255)
            ->allowEmptyString('api_client_id')
            ->scalar('api_client_secret')
            ->allowEmptyString('api_client_secret')
            ->boolean('enabled');

        return $validator;
    }

    public function beforeSave(EventInterface $event, Entity $entity, \ArrayObject $options): void
    {
        if ($entity->isDirty('api_password')) {
            $plain = (string)$entity->get('api_password');
            $entity->set('api_password', SensitiveDataCipher::encrypt($plain));
        }

        if ($entity->isDirty('api_client_secret')) {
            $plain = (string)$entity->get('api_client_secret');
            $entity->set('api_client_secret', SensitiveDataCipher::encrypt($plain));
        }
    }

    public function getDecryptedPassword($entity): string
    {
        return SensitiveDataCipher::decrypt((string)($entity->api_password ?? ''));
    }

    public function getDecryptedClientSecret($entity): string
    {
        return SensitiveDataCipher::decrypt((string)($entity->api_client_secret ?? ''));
    }
}
