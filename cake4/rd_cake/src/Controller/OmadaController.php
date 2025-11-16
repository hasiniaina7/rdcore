<?php

namespace App\Controller;

use App\Controller\AppController;
use Cake\Core\Configure;
use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Cookie\CookieJar;
use GuzzleHttp\Exception\GuzzleException;
use Cake\Event\EventInterface;
use Cake\Log\Log;

class OmadaController extends AppController
{
    public function initialize(): void
    {
        parent::initialize();
        $this->loadComponent('JsonErrors');
    }

    public function beforeFilter(EventInterface $event)
    {
        parent::beforeFilter($event);
        $this->Authentication->addUnauthenticatedActions(['extPortalAuth']);
    }

    /**
     * Proxy simple entre la Dynamic Login Page RadiusDesk et l’API Omada External Portal.
     *
     * POST /cake4/rd_cake/omada/ext-portal-auth.json
     *
     * Body attendu (x-www-form-urlencoded ou JSON) :
     * - username/password OU voucher
     * - clientMac, apMac/gatewayMac, ssidName/vid, radioId
     * - originUrl/redirectUrl éventuels
     */
    public function extPortalAuth()
    {
        $req = $this->request->getData();

        try {
            Configure::load('Omada', 'default');
            $cfg = Configure::read('Omada');
            if (empty($cfg['base_url']) || empty($cfg['operator']) || empty($cfg['password'])) {
                throw new \RuntimeException('Omada config incomplete (base_url/operator/password)');
            }

            $this->logOmada('Incoming request', [
                'clientMac' => $req['clientMac'] ?? null,
                'voucher' => $req['voucher'] ?? null,
                'username' => $req['username'] ?? null,
                'redirectUrl' => $req['redirectUrl'] ?? $req['originUrl'] ?? null,
            ]);

            $this->validateRadiusCredentials($req, $cfg['radius'] ?? []);

            $cookieJar = new CookieJar();

            $client = new GuzzleClient([
                'base_uri' => rtrim($cfg['base_url'], '/') . '/',
                'timeout' => 8,
                'verify' => false,
                'cookies' => $cookieJar,
            ]);

            $loginPayload = [
                'name' => $cfg['operator'],
                'password' => $cfg['password'],
            ];
            $this->logOmada('POST /api/v2/hotspot/login');
            $loginRes = $client->post(
                'api/v2/hotspot/login',
                ['json' => $loginPayload]
            );
            $loginBody = json_decode((string)$loginRes->getBody(), true);
            $this->logOmada('Login response', $loginBody);
            if (($loginBody['errorCode'] ?? 0) !== 0) {
                $msg = $loginBody['msg'] ?? 'Omada login failed';
                throw new \RuntimeException($msg);
            }
            $token = $loginBody['result']['token'] ?? null;
            if (!$token) {
                throw new \RuntimeException('Omada token missing');
            }

            $timeMicros = null;
            if (isset($req['omadaTime'])) {
                $timeMicros = (int)$req['omadaTime'];
            } elseif (isset($req['time'])) {
                $timeMicros = (int)$req['time'];
            }
            if (!$timeMicros || $timeMicros <= 0) {
                $timeMicros = (int)(microtime(true) * 1000000);
            }
            $authType = isset($req['omadaAuthType']) ? (int)$req['omadaAuthType'] : 4;
            if (!in_array($authType, [1,2,3,4], true)) {
                $authType = 4;
            }
            $accessToken = $this->coalesceCredential($req['voucher'] ?? null, $req['username'] ?? null);
            if ($accessToken === null || $accessToken === '') {
                throw new \RuntimeException('Missing username or voucher credentials');
            }

            $payload = [
                'clientMac'   => $req['clientMac'] ?? null,
                'apMac'       => $req['apMac'] ?? null,
                'gatewayMac'  => $req['gatewayMac'] ?? null,
                'site'        => $req['site'] ?? null,
                'radioId'     => isset($req['radioId']) ? (int)$req['radioId'] : 0,
                'ssidName'    => $req['ssidName'] ?? null,
                'vid'         => $req['vid'] ?? null,
                'authType'    => $authType,
                'time'        => $timeMicros,
                'accessToken' => $accessToken,
                'redirectUrl' => $req['redirectUrl'] ?? $req['originUrl'] ?? '',
            ];
            $this->logOmada('POST /api/v2/hotspot/extPortal/auth', $payload);
            $authRes = $client->post(
                'api/v2/hotspot/extPortal/auth',
                [
                    'json' => $payload,
                    'query' => ['token' => $token],
                ]
            );
            $authBody = json_decode((string)$authRes->getBody(), true);
            $this->logOmada('Auth response', $authBody);
            if (($authBody['errorCode'] ?? 0) !== 0) {
                $msg = $authBody['msg'] ?? 'Omada extPortal/auth failed';
                throw new \RuntimeException($msg);
            }

            $redirectUrl = $authBody['result']['redirectUrl'] ?? ($req['originUrl'] ?? '/');
            $errorHint = $this->extractErrorHint($redirectUrl);
            if ($errorHint !== null) {
                $this->logOmada('Auth error hint', ['errorHint' => $errorHint]);
                $this->response = $this->response->withStatus(400);
                $this->set([
                    'success' => false,
                    'message' => $this->formatErrorHint($errorHint),
                ]);
                return;
            }

            $this->logOmada('Authentication succeeded', ['redirectUrl' => $redirectUrl]);

            $this->set([
                'success' => true,
                'data'    => ['redirect_url' => $redirectUrl],
            ]);
        } catch (\Exception $e) {
            $this->logOmada('Error', ['error' => $e->getMessage()]);
            $this->response = $this->response->withStatus(500);
            $this->set([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }

        $this->viewBuilder()->setOption('serialize', ['success', 'data', 'message']);
    }

    protected function logOmada(string $message, ?array $data = null): void
    {
        $prefix = '[Omada] ' . $message;
        if (!empty($data)) {
            $prefix .= ' :: ' . json_encode($data);
        }
        Log::info($prefix);
    }

    protected function extractErrorHint(string $url): ?string
    {
        $parts = parse_url($url);
        if (empty($parts['query'])) {
            return null;
        }
        parse_str($parts['query'], $query);
        return $query['errorHint'] ?? null;
    }

    protected function formatErrorHint(string $hint): string
    {
        $text = str_replace('_', ' ', $hint);
        return ucfirst(strtolower($text));
    }

    protected function validateRadiusCredentials(array $req, array $radiusCfg): void
    {
        $username = $req['voucher'] ?? '';
        if ($username === '' || $username === null) {
            $username = $req['username'] ?? '';
        }
        $password = $req['password'] ?? '';
        if ($password === '' || $password === null) {
            $password = $req['voucher'] ?? '';
        }
        if ($username === '' || $password === '') {
            throw new \RuntimeException('Missing username or voucher credentials');
        }

        $radius = $this->resolveRadiusEndpoint($req, $radiusCfg);
        $ip     = $radius['server_ip'];
        $port   = $radius['port'] ?? 1812;
        $secret = $radius['secret'];
        $nasId  = $radius['nas_identifier'] ?? ($req['nasId'] ?? $req['nasid'] ?? 'TP-Link');
        $nasIp  = $radius['nas_ip'] ?? null;
        $ssid   = $req['ssidName'] ?? '';
        $callingStation = $this->formatMac($req['clientMac'] ?? null);

        $attributes = [
            'User-Name=' . $username,
            'User-Password=' . $password,
        ];
        if ($nasId !== null && $nasId !== '') {
            $attributes[] = 'NAS-Identifier=' . $nasId;
        }
        if ($ssid !== '') {
            $attributes[] = 'Called-Station-Id=' . $ssid;
        }
        if ($callingStation !== null && $callingStation !== '') {
            $attributes[] = 'Calling-Station-Id=' . $callingStation;
        }
        if ($nasIp && filter_var($nasIp, FILTER_VALIDATE_IP)) {
            $attributes[] = 'NAS-IP-Address=' . $nasIp;
        }
        $this->logOmada('Radius NAS resolved', [
            'server_ip' => $ip,
            'port' => $port,
            'nas_identifier' => $nasId,
        ]);
        $command = sprintf(
            'echo %s | radclient -x -r 2 -t 2 %s auth %s',
            escapeshellarg(implode(',', $attributes)),
            escapeshellarg($ip . ':' . $port),
            escapeshellarg($secret)
        );
        $output = shell_exec($command);
        $this->logOmada('Radius validation', ['command' => $command, 'output' => $output]);
        if ($output === null || strpos($output, 'Access-Accept') === false) {
            $message = $this->extractReplyMessage($output) ?? 'Invalid username or password';
            throw new \RuntimeException($message);
        }
    }

    protected function extractReplyMessage(?string $output): ?string
    {
        if ($output === null) {
            return null;
        }
        if (preg_match('/Reply-Message\s*=\s*\"(.+?)\"/m', $output, $matches)) {
            return $matches[1];
        }
        return null;
    }

    protected function resolveRadiusEndpoint(array $req, array $radiusCfg): array
    {
        $serverIp   = $radiusCfg['ip'] ?? $radiusCfg['server_ip'] ?? '127.0.0.1';
        $defaultPort = (int)($radiusCfg['port'] ?? 1812);

        $resolution = $this->matchNasRecord($req);
        if ($resolution === null) {
            throw new \RuntimeException('Unable to resolve NAS configuration for this Omada request. Please create a NAS entry in RadiusDesk that matches the controller hostname/IP.');
        }

        $nas = $resolution['nas'];
        $match = $resolution['match'];
        $secret = $nas->secret ?? $radiusCfg['secret'] ?? null;
        if ($secret === null || $secret === '') {
            throw new \RuntimeException('NAS secret is missing for ' . ($nas->nasidentifier ?: $nas->nasname));
        }

        $this->logOmada('Resolved NAS entry from DB', [
            'nas_id' => $nas->id,
            'nasname' => $nas->nasname,
            'nasidentifier' => $nas->nasidentifier,
            'match_source' => $match['source'] ?? null,
            'match_value' => $match['value'] ?? null,
        ]);

        $serverPort = (int)($nas->auth_port ?? $defaultPort);

        return [
            'server_ip' => $serverIp,
            'port' => $serverPort,
            'secret' => $secret,
            'nas_identifier' => $nas->nasidentifier ?: ($nas->shortname ?: $nas->nasname),
            'nas_ip' => filter_var($nas->nasname, FILTER_VALIDATE_IP) ? $nas->nasname : null,
        ];
    }

    protected function matchNasRecord(array $req): ?array
    {
        $candidates = $this->buildNasSearchCandidates($req);
        if (empty($candidates)) {
            return null;
        }

        $nasTable = $this->fetchTable('Nas');
        $seen = [];
        foreach ($candidates as $candidate) {
            $value = trim((string)$candidate['value']);
            if ($value === '') {
                continue;
            }
            $key = $candidate['column'] . ':' . strtolower($value);
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;

            $column = $nasTable->aliasField($candidate['column']);
            $nas = $nasTable->find()->where([$column => $value])->first();
            if ($nas) {
                return ['nas' => $nas, 'match' => $candidate];
            }
        }

        return null;
    }

    protected function buildNasSearchCandidates(array $req): array
    {
        $candidates = [];
        $add = function (string $column, ?string $value, string $source) use (&$candidates): void {
            if ($value === null) {
                return;
            }
            $value = trim((string)$value);
            if ($value === '') {
                return;
            }
            $candidates[] = [
                'column' => $column,
                'value' => $value,
                'source' => $source,
            ];
        };

        $nasIdParam = $req['nasid'] ?? $req['nasId'] ?? $req['nas_identifier'] ?? null;
        $add('nasidentifier', $nasIdParam, 'nasid');
        $add('shortname', $nasIdParam, 'nasid');
        $add('nasname', $nasIdParam, 'nasid');

        $rawTarget = $req['omadaRawTarget'] ?? $req['target'] ?? null;
        $add('nasname', $rawTarget, 'target');
        $add('shortname', $rawTarget, 'target');

        $omadaTarget = $req['omadaTarget'] ?? null;
        $add('nasname', $omadaTarget, 'omadaTarget');
        $add('shortname', $omadaTarget, 'omadaTarget');

        $controllerHost = $req['omadaControllerHost'] ?? null;
        $add('nasname', $controllerHost, 'controllerHost');
        $add('shortname', $controllerHost, 'controllerHost');

        $hostnameParam = $req['omadaHostname'] ?? $req['hostname'] ?? null;
        $add('nasname', $hostnameParam, 'hostname');
        $add('shortname', $hostnameParam, 'hostname');

        return $candidates;
    }

    protected function formatMac(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $value = trim($value);
        if ($value === '') {
            return null;
        }
        $value = str_replace(['-', '.'], '', $value);
        $value = strtoupper($value);
        if (strlen($value) === 12) {
            return implode('-', str_split($value, 2));
        }
        return $value;
    }

    protected function coalesceCredential(?string ...$values): ?string
    {
        foreach ($values as $value) {
            if ($value === null) {
                continue;
            }
            $trimmed = trim((string)$value);
            if ($trimmed !== '') {
                return $trimmed;
            }
        }
        return null;
    }

}
