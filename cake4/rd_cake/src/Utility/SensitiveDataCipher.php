<?php
declare(strict_types=1);

namespace App\Utility;

use Cake\Core\Configure;

class SensitiveDataCipher
{
    private const PREFIX = 'enc:v1:';
    private const CIPHER = 'aes-256-gcm';

    public static function encrypt(string $plaintext): string
    {
        if ($plaintext === '') {
            return '';
        }

        if (self::looksEncrypted($plaintext)) {
            return $plaintext;
        }

        $key = self::keyMaterial();
        $iv = random_bytes(12);
        $tag = '';

        $ciphertext = openssl_encrypt(
            $plaintext,
            self::CIPHER,
            $key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
            '',
            16
        );

        if ($ciphertext === false) {
            return $plaintext;
        }

        return self::PREFIX . base64_encode($iv . $tag . $ciphertext);
    }

    public static function decrypt(?string $value): string
    {
        if ($value === null || $value === '') {
            return '';
        }

        if (!self::looksEncrypted($value)) {
            return $value;
        }

        $encoded = substr($value, strlen(self::PREFIX));
        $raw = base64_decode($encoded, true);
        if ($raw === false || strlen($raw) < 29) {
            return '';
        }

        $iv = substr($raw, 0, 12);
        $tag = substr($raw, 12, 16);
        $ciphertext = substr($raw, 28);

        $plaintext = openssl_decrypt(
            $ciphertext,
            self::CIPHER,
            self::keyMaterial(),
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
            ''
        );

        return $plaintext === false ? '' : $plaintext;
    }

    public static function looksEncrypted(?string $value): bool
    {
        if ($value === null || $value === '') {
            return false;
        }

        return str_starts_with($value, self::PREFIX);
    }

    private static function keyMaterial(): string
    {
        $salt = (string)(Configure::read('Security.salt') ?? 'radiusdesk-default-salt');

        return hash('sha256', $salt, true);
    }
}
