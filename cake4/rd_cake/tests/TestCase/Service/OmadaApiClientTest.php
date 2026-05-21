<?php
declare(strict_types=1);

namespace App\Test\TestCase\Service;

use App\Service\OmadaApiClient;
use Cake\TestSuite\TestCase;

class OmadaApiClientTest extends TestCase
{
    public function testFallbackFromAuthedRecordToUnauth(): void
    {
        $client = new ScriptedOmadaApiClient([
            'base_url' => 'https://127.0.0.1:8043',
            'omadac_id' => 'omadac',
            'site_id' => 'site',
        ]);
        $client->correlation = [
            'authed_record_id' => 'r-1',
            'client_found' => true,
        ];
        $client->responses = [
            ['status' => 'not_found', 'ack' => false, 'http_code' => 404],
            ['status' => 'ack', 'ack' => true, 'http_code' => 200],
        ];

        $result = $client->disconnectWithFallback(['client_mac' => 'AA-BB-CC-DD-EE-FF']);

        $this->assertSame('ack', $result['status']);
        $this->assertStringContainsString('/hotspot/clients/', (string)$result['endpoint']);
        $this->assertStringEndsWith('/unauth', (string)$result['endpoint']);
    }

    public function testFallbackToClientDisconnectAsLastStep(): void
    {
        $client = new ScriptedOmadaApiClient([
            'base_url' => 'https://127.0.0.1:8043',
            'omadac_id' => 'omadac',
            'site_id' => 'site',
        ]);
        $client->correlation = [
            'authed_record_id' => 'r-2',
            'client_found' => true,
        ];
        $client->responses = [
            ['status' => 'api_error', 'ack' => false, 'http_code' => 500],
            ['status' => 'not_found', 'ack' => false, 'http_code' => 404],
            ['status' => 'ack', 'ack' => true, 'http_code' => 200],
        ];

        $result = $client->disconnectWithFallback(['client_mac' => 'AA-BB-CC-DD-EE-FF']);

        $this->assertSame('ack', $result['status']);
        $this->assertStringContainsString('/clients/', (string)$result['endpoint']);
        $this->assertStringEndsWith('/disconnect', (string)$result['endpoint']);
    }

    public function testMapResponseStatus(): void
    {
        $client = new ScriptedOmadaApiClient([
            'base_url' => 'https://127.0.0.1:8043',
            'omadac_id' => 'omadac',
            'site_id' => 'site',
        ]);

        $this->assertSame('ack', $client->mapStatus(200, ['errorCode' => 0], true)['status']);
        $this->assertSame('not_found', $client->mapStatus(404, [], true)['status']);
        $this->assertSame('auth_error', $client->mapStatus(401, [], true)['status']);
        $this->assertSame('auth_error', $client->mapStatus(200, ['errorCode' => -44106, 'msg' => 'The Client Id Or Client Secret is Invalid.'], true)['status']);
        $this->assertSame('api_error', $client->mapStatus(200, ['errorCode' => -1, 'msg' => 'Internal error'], true)['status']);
    }
}

class ScriptedOmadaApiClient extends OmadaApiClient
{
    public array $responses = [];
    public array $correlation = [
        'authed_record_id' => null,
        'client_found' => false,
    ];

    protected function correlateActiveSession(array $ctx): array
    {
        return $this->correlation;
    }

    protected function callDisconnectEndpoint(string $path, array $correlation): array
    {
        $response = array_shift($this->responses) ?? ['status' => 'api_error', 'ack' => false, 'http_code' => 500];
        $response['endpoint'] = '/' . ltrim($path, '/');
        $response['correlation'] = $correlation;
        $response['error'] = $response['error'] ?? null;

        return $response;
    }

    public function mapStatus(?int $httpCode, array $body, bool $mapByBody): array
    {
        return $this->mapResponseStatus($httpCode, $body, $mapByBody);
    }
}
