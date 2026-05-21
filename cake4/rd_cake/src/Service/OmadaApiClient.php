<?php
declare(strict_types=1);

namespace App\Service;

use GuzzleHttp\Client;
use GuzzleHttp\Cookie\CookieJar;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;

class OmadaApiClient
{
    private Client $http;
    private CookieJar $cookieJar;
    private array $config;
    private ?string $token = null;
    private int $tokenExpiresAt = 0;

    public function __construct(array $config)
    {
        $this->config = $config;
        $this->cookieJar = new CookieJar();
        $this->http = new Client([
            'base_uri' => rtrim((string)($config['base_url'] ?? ''), '/') . '/',
            'timeout' => (float)($config['timeout'] ?? 8),
            'connect_timeout' => (float)($config['connect_timeout'] ?? 4),
            'verify' => false,
            'cookies' => $this->cookieJar,
        ]);
    }

    public function disconnectWithFallback(array $ctx): array
    {
        $start = microtime(true);
        $correlation = $this->correlateActiveSession($ctx);

        $clientMac = (string)($ctx['client_mac'] ?? '');
        if ($clientMac === '') {
            return $this->finalizeResult([
                'status' => 'not_found',
                'ack' => false,
                'endpoint' => null,
                'http_code' => null,
                'error' => 'Missing client MAC',
                'correlation' => $correlation,
            ], $start);
        }

        if (!empty($correlation['authed_record_id'])) {
            $path = sprintf(
                'openapi/v1/%s/sites/%s/hotspot/authed-records/%s/disconnect',
                rawurlencode((string)$this->config['omadac_id']),
                rawurlencode((string)$this->config['site_id']),
                rawurlencode((string)$correlation['authed_record_id'])
            );
            $attempt = $this->callDisconnectEndpoint($path, $correlation);
            if ($this->isTerminalStatus((string)$attempt['status'])) {
                return $this->finalizeResult($attempt, $start);
            }
        }

        $macEncoded = rawurlencode($clientMac);
        $path2 = sprintf(
            'openapi/v1/%s/sites/%s/hotspot/clients/%s/unauth',
            rawurlencode((string)$this->config['omadac_id']),
            rawurlencode((string)$this->config['site_id']),
            $macEncoded
        );
        $attempt2 = $this->callDisconnectEndpoint($path2, $correlation);
        if ($this->isTerminalStatus((string)$attempt2['status'])) {
            return $this->finalizeResult($attempt2, $start);
        }

        $path3 = sprintf(
            'openapi/v1/%s/sites/%s/clients/%s/disconnect',
            rawurlencode((string)$this->config['omadac_id']),
            rawurlencode((string)$this->config['site_id']),
            $macEncoded
        );
        $attempt3 = $this->callDisconnectEndpoint($path3, $correlation);

        return $this->finalizeResult($attempt3, $start);
    }

    protected function correlateActiveSession(array $ctx): array
    {
        $clientMac = $this->normalizeMac((string)($ctx['client_mac'] ?? ''));
        $username = (string)($ctx['username'] ?? '');
        $acctSessionId = (string)($ctx['acct_session_id'] ?? '');

        $result = [
            'record_lookup' => 'not_run',
            'authed_record_id' => null,
            'client_lookup' => 'not_run',
            'client_found' => false,
        ];

        $recordsPath = sprintf(
            'openapi/v1/%s/sites/%s/hotspot/authed-records',
            rawurlencode((string)$this->config['omadac_id']),
            rawurlencode((string)$this->config['site_id'])
        );

        $recordsResp = $this->requestWithAuth('GET', $recordsPath, ['query' => ['page' => 1, 'pageSize' => 200]]);
        if ($recordsResp['status'] === 'ack') {
            $result['record_lookup'] = 'ok';
            $items = $this->extractDataItems($recordsResp['body'] ?? []);
            foreach ($items as $item) {
                $itemMac = $this->normalizeMac((string)($item['clientMac'] ?? $item['mac'] ?? ''));
                $itemUser = (string)($item['username'] ?? $item['userName'] ?? $item['accessToken'] ?? '');
                $itemSessionId = (string)($item['acctSessionId'] ?? $item['sessionId'] ?? $item['id'] ?? '');

                if ($clientMac !== '' && $itemMac !== '' && $itemMac === $clientMac) {
                    $result['authed_record_id'] = (string)($item['id'] ?? '');
                    break;
                }
                if ($username !== '' && $itemUser !== '' && strcasecmp($itemUser, $username) === 0) {
                    $result['authed_record_id'] = (string)($item['id'] ?? '');
                    break;
                }
                if ($acctSessionId !== '' && $itemSessionId !== '' && $itemSessionId === $acctSessionId) {
                    $result['authed_record_id'] = (string)($item['id'] ?? '');
                    break;
                }
            }
        } else {
            $result['record_lookup'] = (string)$recordsResp['status'];
        }

        if (!empty($result['authed_record_id'])) {
            return $result;
        }

        $clientsPath = sprintf(
            'openapi/v1/%s/sites/%s/clients',
            rawurlencode((string)$this->config['omadac_id']),
            rawurlencode((string)$this->config['site_id'])
        );
        $clientsResp = $this->requestWithAuth('GET', $clientsPath, ['query' => ['page' => 1, 'pageSize' => 200]]);

        if ($clientsResp['status'] === 'ack') {
            $result['client_lookup'] = 'ok';
            $items = $this->extractDataItems($clientsResp['body'] ?? []);
            foreach ($items as $item) {
                $itemMac = $this->normalizeMac((string)($item['mac'] ?? $item['clientMac'] ?? ''));
                if ($clientMac !== '' && $itemMac === $clientMac) {
                    $result['client_found'] = true;
                    break;
                }
            }
        } else {
            $result['client_lookup'] = (string)$clientsResp['status'];
        }

        return $result;
    }

    protected function callDisconnectEndpoint(string $path, array $correlation): array
    {
        $resp = $this->requestWithAuth('POST', $path, ['json' => (object)[]]);

        return [
            'status' => $resp['status'],
            'ack' => ($resp['status'] === 'ack'),
            'endpoint' => '/' . ltrim($path, '/'),
            'http_code' => $resp['http_code'] ?? null,
            'error' => $resp['error'] ?? null,
            'correlation' => $correlation,
            'provider_body' => $resp['body'] ?? null,
        ];
    }

    private function requestWithAuth(string $method, string $path, array $options = [], bool $retryAuth = true): array
    {
        $auth = $this->ensureSession();
        if ($auth['status'] !== 'ack') {
            return $auth;
        }

        $headers = $options['headers'] ?? [];
        if ($this->token !== null && $this->token !== '') {
            $headers['Authorization'] = 'AccessToken=' . $this->token;
        }
        $options['headers'] = $headers;

        $resp = $this->rawRequest($method, $path, $options);
        if ($retryAuth && $resp['status'] === 'auth_error') {
            $this->token = null;
            $this->tokenExpiresAt = 0;
            $authRetry = $this->ensureSession(true);
            if ($authRetry['status'] !== 'ack') {
                return $authRetry;
            }

            $headers = $options['headers'] ?? [];
            if ($this->token !== null && $this->token !== '') {
                $headers['Authorization'] = 'AccessToken=' . $this->token;
            }
            $options['headers'] = $headers;
            return $this->rawRequest($method, $path, $options);
        }

        return $resp;
    }

    private function ensureSession(bool $force = false): array
    {
        if (!$force && $this->token !== null && time() < $this->tokenExpiresAt) {
            return ['status' => 'ack', 'ack' => true, 'http_code' => 200];
        }

        $omadacId = (string)($this->config['omadac_id'] ?? '');
        $clientId = (string)($this->config['api_client_id'] ?? '');
        $clientSecret = (string)($this->config['api_client_secret'] ?? '');
        $username = (string)($this->config['api_username'] ?? '');
        $password = (string)($this->config['api_password'] ?? '');

        if ($clientId !== '' && $clientSecret !== '' && $omadacId !== '') {
            $oauthResp = $this->requestClientCredentialsToken($omadacId, $clientId, $clientSecret);
            if ($oauthResp['status'] === 'ack') {
                return $oauthResp;
            }

            // Continue with other methods if configured.
        }

        if ($username !== '' && $password !== '' && $clientId !== '' && $clientSecret !== '' && $omadacId !== '') {
            $authCodeResp = $this->requestAuthorizationCodeToken($omadacId, $clientId, $clientSecret, $username, $password);
            if ($authCodeResp['status'] === 'ack') {
                return $authCodeResp;
            }

            // Continue with legacy login if present.
        }

        if ($username === '' || $password === '') {
            return [
                'status' => 'auth_error',
                'ack' => false,
                'http_code' => null,
                'error' => 'Omada credentials are not configured',
            ];
        }

        $loginAttempts = [
            ['path' => 'openapi/authorize/login', 'json' => ['username' => $username, 'password' => $password]],
            ['path' => 'openapi/authorize/login', 'json' => ['name' => $username, 'password' => $password]],
            ['path' => 'api/v2/hotspot/login', 'json' => ['name' => $username, 'password' => $password]],
        ];

        $lastError = 'Omada login failed';
        foreach ($loginAttempts as $attempt) {
            $resp = $this->rawRequest('POST', (string)$attempt['path'], ['json' => $attempt['json'], 'headers' => []], true);
            if ($resp['status'] === 'timeout') {
                return $resp;
            }
            if ($resp['status'] !== 'ack') {
                $lastError = (string)($resp['error'] ?? $lastError);
                continue;
            }

            $token = $this->extractToken($resp['body'] ?? []);
            if ($token === null || $token === '') {
                $lastError = 'Omada login returned no access token';
                continue;
            }
            $expiresIn = $this->extractExpiresIn($resp['body'] ?? []);

            $this->token = $token;
            $this->tokenExpiresAt = time() + $expiresIn;

            return ['status' => 'ack', 'ack' => true, 'http_code' => (int)($resp['http_code'] ?? 200)];
        }

        return [
            'status' => 'auth_error',
            'ack' => false,
            'http_code' => 401,
            'error' => $lastError,
        ];
    }

    private function requestClientCredentialsToken(string $omadacId, string $clientId, string $clientSecret): array
    {
        $path = $this->buildQueryPath('openapi/authorize/token', ['grant_type' => 'client_credentials']);
        $resp = $this->rawRequest('POST', $path, [
            'json' => [
                'omadacId' => $omadacId,
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
            ],
            'headers' => [],
        ], true);

        if ($resp['status'] !== 'ack') {
            return $resp;
        }

        $token = $this->extractToken($resp['body'] ?? []);
        if ($token === null || $token === '') {
            return [
                'status' => 'auth_error',
                'ack' => false,
                'http_code' => (int)($resp['http_code'] ?? 401),
                'error' => 'Omada token response missing access token',
            ];
        }

        $this->token = $token;
        $this->tokenExpiresAt = time() + $this->extractExpiresIn($resp['body'] ?? []);

        return ['status' => 'ack', 'ack' => true, 'http_code' => (int)($resp['http_code'] ?? 200)];
    }

    private function requestAuthorizationCodeToken(
        string $omadacId,
        string $clientId,
        string $clientSecret,
        string $username,
        string $password
    ): array {
        $loginPath = $this->buildQueryPath('openapi/authorize/login', [
            'client_id' => $clientId,
            'omadac_id' => $omadacId,
        ]);

        $loginResp = $this->rawRequest('POST', $loginPath, [
            'json' => [
                'username' => $username,
                'password' => $password,
            ],
            'headers' => [],
        ], true);

        if ($loginResp['status'] !== 'ack') {
            return $loginResp;
        }

        $csrfToken = $this->extractCsrfToken($loginResp['body'] ?? []);
        $sessionId = $this->extractSessionId($loginResp['body'] ?? []);
        if ($csrfToken === null || $sessionId === null) {
            return [
                'status' => 'auth_error',
                'ack' => false,
                'http_code' => (int)($loginResp['http_code'] ?? 401),
                'error' => 'Omada login did not return csrf/session data',
            ];
        }

        $codePath = $this->buildQueryPath('openapi/authorize/code', [
            'client_id' => $clientId,
            'omadac_id' => $omadacId,
            'response_type' => 'code',
        ]);
        $codeResp = $this->rawRequest('POST', $codePath, [
            'headers' => [
                'Csrf-Token' => $csrfToken,
                'Cookie' => 'TPOMADA_SESSIONID=' . $sessionId,
            ],
            'json' => (object)[],
        ], true);

        if ($codeResp['status'] !== 'ack') {
            return $codeResp;
        }

        $authCode = $this->extractAuthCode($codeResp['body'] ?? []);
        if ($authCode === null || $authCode === '') {
            return [
                'status' => 'auth_error',
                'ack' => false,
                'http_code' => (int)($codeResp['http_code'] ?? 401),
                'error' => 'Omada authorize/code returned no auth code',
            ];
        }

        $tokenPath = $this->buildQueryPath('openapi/authorize/token', [
            'grant_type' => 'authorization_code',
            'code' => $authCode,
        ]);
        $tokenResp = $this->rawRequest('POST', $tokenPath, [
            'json' => [
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
            ],
            'headers' => [],
        ], true);

        if ($tokenResp['status'] !== 'ack') {
            return $tokenResp;
        }

        $token = $this->extractToken($tokenResp['body'] ?? []);
        if ($token === null || $token === '') {
            return [
                'status' => 'auth_error',
                'ack' => false,
                'http_code' => (int)($tokenResp['http_code'] ?? 401),
                'error' => 'Omada token response missing access token',
            ];
        }

        $this->token = $token;
        $this->tokenExpiresAt = time() + $this->extractExpiresIn($tokenResp['body'] ?? []);

        return ['status' => 'ack', 'ack' => true, 'http_code' => (int)($tokenResp['http_code'] ?? 200)];
    }

    private function buildQueryPath(string $path, array $query): string
    {
        $encoded = http_build_query($query, '', '&', PHP_QUERY_RFC3986);
        if ($encoded === '') {
            return $path;
        }

        return $path . '?' . $encoded;
    }

    private function rawRequest(string $method, string $path, array $options = [], bool $mapByBody = true): array
    {
        $start = microtime(true);

        try {
            $response = $this->http->request($method, ltrim($path, '/'), $options);
            $statusCode = $response->getStatusCode();
            $bodyRaw = (string)$response->getBody();
            $body = $this->decodeBody($bodyRaw);
            $latencyMs = (int)round((microtime(true) - $start) * 1000);

            $mapped = $this->mapResponseStatus($statusCode, $body, $mapByBody);
            $mapped['http_code'] = $statusCode;
            $mapped['body'] = $body;
            $mapped['latency_ms'] = $latencyMs;
            return $mapped;
        } catch (ConnectException $e) {
            return [
                'status' => 'timeout',
                'ack' => false,
                'http_code' => null,
                'error' => $e->getMessage(),
                'latency_ms' => (int)round((microtime(true) - $start) * 1000),
            ];
        } catch (RequestException $e) {
            $statusCode = $e->hasResponse() ? $e->getResponse()->getStatusCode() : null;
            $bodyRaw = $e->hasResponse() ? (string)$e->getResponse()->getBody() : '';
            $body = $this->decodeBody($bodyRaw);
            $mapped = $this->mapResponseStatus($statusCode, $body, $mapByBody);
            $mapped['http_code'] = $statusCode;
            $mapped['body'] = $body;
            $mapped['latency_ms'] = (int)round((microtime(true) - $start) * 1000);
            $mapped['error'] = $e->getMessage();
            return $mapped;
        } catch (\Throwable $e) {
            return [
                'status' => 'api_error',
                'ack' => false,
                'http_code' => null,
                'error' => $e->getMessage(),
                'latency_ms' => (int)round((microtime(true) - $start) * 1000),
            ];
        }
    }

    protected function mapResponseStatus(?int $httpCode, array $body, bool $mapByBody): array
    {
        if ($httpCode === 401 || $httpCode === 403) {
            return ['status' => 'auth_error', 'ack' => false];
        }
        if ($httpCode === 404) {
            return ['status' => 'not_found', 'ack' => false];
        }
        if ($httpCode !== null && $httpCode >= 500) {
            return ['status' => 'api_error', 'ack' => false];
        }

        if ($mapByBody) {
            if (array_key_exists('errorCode', $body)) {
                $errorCode = (int)$body['errorCode'];
                if ($errorCode === 0) {
                    return ['status' => 'ack', 'ack' => true];
                }

                if (in_array($errorCode, [-44106, -44108, -44109, -44110, -44112, -44113, -44114, -44116], true)) {
                    return ['status' => 'auth_error', 'ack' => false];
                }

                $msg = strtolower((string)($body['msg'] ?? ''));
                if (str_contains($msg, 'not found')) {
                    return ['status' => 'not_found', 'ack' => false];
                }
                if (
                    str_contains($msg, 'token') ||
                    str_contains($msg, 'auth') ||
                    str_contains($msg, 'forbidden') ||
                    str_contains($msg, 'client id') ||
                    str_contains($msg, 'client secret')
                ) {
                    return ['status' => 'auth_error', 'ack' => false];
                }

                return ['status' => 'api_error', 'ack' => false];
            }
            if ((bool)($body['success'] ?? false) === true) {
                return ['status' => 'ack', 'ack' => true];
            }

            // In strict OpenAPI mode, HTTP 2xx without machine-readable success is not trusted.
            return ['status' => 'api_error', 'ack' => false];
        }

        if ($httpCode !== null && $httpCode >= 200 && $httpCode < 300) {
            return ['status' => 'ack', 'ack' => true];
        }

        return ['status' => 'api_error', 'ack' => false];
    }

    private function extractDataItems(array $body): array
    {
        $result = $body['result'] ?? null;
        if (is_array($result)) {
            if (isset($result['data']) && is_array($result['data'])) {
                return $result['data'];
            }
            if (array_is_list($result)) {
                return $result;
            }
        }

        if (isset($body['data']) && is_array($body['data'])) {
            return $body['data'];
        }

        return [];
    }

    private function extractToken(array $body): ?string
    {
        $candidates = [
            $body['result']['accessToken'] ?? null,
            $body['result']['access_token'] ?? null,
            $body['result']['token'] ?? null,
            $body['accessToken'] ?? null,
            $body['access_token'] ?? null,
            $body['token'] ?? null,
        ];

        foreach ($candidates as $candidate) {
            if (is_string($candidate) && $candidate !== '') {
                return $candidate;
            }
        }

        return null;
    }

    private function extractCsrfToken(array $body): ?string
    {
        $candidates = [
            $body['result']['csrfToken'] ?? null,
            $body['csrfToken'] ?? null,
        ];

        foreach ($candidates as $candidate) {
            if (is_string($candidate) && $candidate !== '') {
                return $candidate;
            }
        }

        return null;
    }

    private function extractSessionId(array $body): ?string
    {
        $candidates = [
            $body['result']['sessionId'] ?? null,
            $body['sessionId'] ?? null,
        ];

        foreach ($candidates as $candidate) {
            if (is_string($candidate) && $candidate !== '') {
                return $candidate;
            }
        }

        return null;
    }

    private function extractAuthCode(array $body): ?string
    {
        $result = $body['result'] ?? null;
        if (is_string($result) && $result !== '') {
            return $result;
        }

        return null;
    }

    private function extractExpiresIn(array $body): int
    {
        $candidates = [
            $body['result']['expiresIn'] ?? null,
            $body['result']['expires_in'] ?? null,
            $body['expiresIn'] ?? null,
            $body['expires_in'] ?? null,
        ];

        foreach ($candidates as $candidate) {
            if (is_numeric($candidate)) {
                $value = (int)$candidate;
                if ($value > 30) {
                    return $value;
                }
            }
        }

        return 50 * 60;
    }

    private function decodeBody(string $raw): array
    {
        if ($raw === '') {
            return [];
        }

        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    private function normalizeMac(string $value): string
    {
        $normalized = strtoupper(trim($value));
        $normalized = str_replace(['-', ':', '.'], '', $normalized);

        return $normalized;
    }

    protected function isTerminalStatus(string $status): bool
    {
        return in_array($status, ['ack', 'auth_error', 'timeout'], true);
    }

    private function finalizeResult(array $result, float $start): array
    {
        if (!isset($result['latency_ms'])) {
            $result['latency_ms'] = (int)round((microtime(true) - $start) * 1000);
        }

        return $result;
    }
}
