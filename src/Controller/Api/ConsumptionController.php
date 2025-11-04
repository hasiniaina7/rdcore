<?php

declare(strict_types=1);

namespace App\Controller\Api;

use App\Controller\AppController;
use Cake\Auth\DefaultPasswordHasher;
use Cake\Http\Exception\BadRequestException;
use Cake\Http\Exception\UnauthorizedException;
use Cake\I18n\FrozenTime;

/**
 * API endpoint exposing consumption metrics for permanent users and vouchers.
 */
class ConsumptionController extends AppController
{
    private const API_KEY = 'b4c6ac81-8c7c-4802-b50a-0a6380555b50';

    public function initialize(): void
    {
        parent::initialize();
        $this->request->allowMethod(['post']);
        $this->loadModel('Users');
        $this->loadModel('Radchecks');
        $this->loadModel('Radaccts');
        $this->loadModel('Vouchers');
    }

    public function usage()
    {
        $apiKey = $this->request->getHeaderLine('X-Api-Key');
        if ($apiKey !== self::API_KEY) {
            throw new UnauthorizedException(__('Invalid API key.'));
        }

        $payload = $this->request->getData();
        if (empty($payload)) {
            $payload = $this->request->input('json_decode', true) ?? [];
        }

        $type = strtolower((string)($payload['type'] ?? ''));
        if (!in_array($type, ['user', 'voucher'], true)) {
            throw new BadRequestException(__('Authentication type must be "user" or "voucher".'));
        }

        if ($type === 'user') {
            $identity = $this->authenticatePermanentUser($payload);
        } else {
            $identity = $this->authenticateVoucher($payload);
        }

        $usage = $this->Radaccts->find()
            ->select([
                'total_input' => $this->Radaccts->find()->func()->sum('Radaccts.acctinputoctets'),
                'total_output' => $this->Radaccts->find()->func()->sum('Radaccts.acctoutputoctets'),
                'total_time' => $this->Radaccts->find()->func()->sum('Radaccts.acctsessiontime'),
                'total_sessions' => $this->Radaccts->find()->func()->count('*'),
            ])
            ->where(['Radaccts.username' => $identity['username']])
            ->enableHydration(false)
            ->first() ?? [];

        $lastSession = $this->Radaccts->find()
            ->select([
                'acctstarttime',
                'acctstoptime',
                'nasipaddress',
            ])
            ->where(['Radaccts.username' => $identity['username']])
            ->orderDesc('Radaccts.radacctid')
            ->enableHydration(false)
            ->first();

        $inputBytes = (float)($usage['total_input'] ?? 0);
        $outputBytes = (float)($usage['total_output'] ?? 0);
        $timeSeconds = (int)($usage['total_time'] ?? 0);
        $sessions = (int)($usage['total_sessions'] ?? 0);
        $totalBytes = $inputBytes + $outputBytes;

        $lastSessionSummary = null;
        if ($lastSession) {
            $start = $lastSession['acctstarttime'] ? FrozenTime::parse($lastSession['acctstarttime']) : null;
            $stop = $lastSession['acctstoptime'] ? FrozenTime::parse($lastSession['acctstoptime']) : null;
            $lastSessionSummary = [
                'start' => $start ? $start->i18nFormat('yyyy-MM-dd HH:mm') : null,
                'stop' => $stop ? $stop->i18nFormat('yyyy-MM-dd HH:mm') : null,
                'nas_ip' => $lastSession['nasipaddress'] ?? null,
            ];
        }

        $other = [
            'traffic' => [
                'title' => __('Trafic en direct'),
                'description' => __('Flux upstream/downstream monitorés à 5s près pour détecter instantanément les dépassements de seuil.'),
                'color' => '#ff002b',
            ],
            'qos' => [
                'title' => __('Qualité de service'),
                'description' => __('Profil QoS appliqué : shaping adaptatif avec alerte rouge si la latence dépasse 120 ms ou si le jitter explose.'),
                'color' => '#ff1744',
            ],
        ];

        $this->set([
            'success' => true,
            'data' => [
                'identity' => $identity,
                'usage' => [
                    'total_input_bytes' => $inputBytes,
                    'total_output_bytes' => $outputBytes,
                    'total_combined_bytes' => $totalBytes,
                    'total_input_mb' => $this->bytesToMb($inputBytes),
                    'total_output_mb' => $this->bytesToMb($outputBytes),
                    'total_combined_mb' => $this->bytesToMb($totalBytes),
                    'total_time_seconds' => $timeSeconds,
                    'total_sessions' => $sessions,
                    'average_session_seconds' => $sessions > 0 ? (int)round($timeSeconds / $sessions) : 0,
                ],
                'last_session' => $lastSessionSummary,
            ],
            'other' => $other,
            '_serialize' => ['success', 'data', 'other'],
        ]);
    }

    private function authenticatePermanentUser(array $payload): array
    {
        $username = trim((string)($payload['username'] ?? ''));
        $password = (string)($payload['password'] ?? '');
        if ($username === '' || $password === '') {
            throw new BadRequestException(__('Username and password are required.'));
        }

        $user = $this->Users->find()
            ->where(['Users.username' => $username])
            ->first();

        if (!$user) {
            throw new UnauthorizedException(__('Invalid credentials.'));
        }

        $hasher = new DefaultPasswordHasher();
        if (!$hasher->check($password, (string)$user->password)) {
            throw new UnauthorizedException(__('Invalid credentials.'));
        }

        return [
            'type' => 'permanent',
            'username' => $user->username,
            'display' => trim(($user->name ?? '') . ' ' . ($user->surname ?? '')) ?: $user->username,
        ];
    }

    private function authenticateVoucher(array $payload): array
    {
        $voucherName = trim((string)($payload['voucher'] ?? ''));
        $password = $payload['password'] ?? null;
        if ($voucherName === '') {
            throw new BadRequestException(__('Voucher code is required.'));
        }

        $radcheck = $this->Radchecks->find()
            ->where([
                'Radchecks.username' => $voucherName,
                'Radchecks.attribute' => 'Cleartext-Password',
            ])
            ->first();

        if (!$radcheck) {
            throw new UnauthorizedException(__('Voucher not found.'));
        }

        $expectedSecret = (string)$radcheck->value;
        if ($password !== null && $password !== $expectedSecret) {
            throw new UnauthorizedException(__('Voucher authentication failed.'));
        }

        $voucher = $this->Vouchers->find()
            ->where(['Vouchers.name' => $voucherName])
            ->first();

        $label = $voucher->name ?? $voucherName;
        if (!empty($voucher->profile)) {
            $label .= ' – ' . $voucher->profile;
        }
        return [
            'type' => 'voucher',
            'username' => $voucherName,
            'display' => $label,
        ];
    }

    private function bytesToMb(float $bytes): float
    {
        return round($bytes / 1048576, 2);
    }
}
