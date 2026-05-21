<?php
declare(strict_types=1);

namespace App\Test\TestCase\Controller\Component;

use App\Controller\Component\KickerComponent;
use App\Service\OmadaApiClient;
use Cake\Controller\ComponentRegistry;
use Cake\Controller\Controller;
use Cake\Http\Response;
use Cake\Http\ServerRequest;
use Cake\TestSuite\TestCase;

class KickerComponentTest extends TestCase
{
    public function testKickRoutesTpLinkToOmadaOpenApiAndReturnsAck(): void
    {
        $component = new TestableKickerComponent(
            new ComponentRegistry(new Controller(new ServerRequest(), new Response()))
        );
        $component->fakeApiResult = [
            'status' => 'ack',
            'ack' => true,
            'endpoint' => '/openapi/v1/x/sites/y/hotspot/authed-records/77/disconnect',
            'http_code' => 200,
            'latency_ms' => 13,
            'correlation' => ['authed_record_id' => '77', 'client_found' => true],
        ];

        $ent = (object)[
            'radacctid' => 55,
            'nasidentifier' => 'TP-Link',
            'nasipaddress' => '10.10.10.10',
            'username' => 'alice',
            'callingstationid' => 'AA-BB-CC-DD-EE-FF',
            'acctsessionid' => 'session-1',
        ];

        $result = $component->kick($ent, 'token-1');

        $this->assertSame('ack', $result['status']);
        $this->assertSame('omada-openapi-v1', $result['strategy']);
        $this->assertSame('/openapi/v1/x/sites/y/hotspot/authed-records/77/disconnect', $result['omada']['endpoint']);
        $this->assertSame(200, $result['omada']['http_code']);
    }

    public function testKickOmadaReturnsApiErrorWhenConfigMissing(): void
    {
        $component = new TestableKickerComponent(
            new ComponentRegistry(new Controller(new ServerRequest(), new Response()))
        );
        $component->settings = null;

        $ent = (object)[
            'radacctid' => 56,
            'nasidentifier' => 'TP-Link',
            'nasipaddress' => '10.10.10.10',
            'username' => 'bob',
            'callingstationid' => '11-22-33-44-55-66',
            'acctsessionid' => 'session-2',
        ];

        $result = $component->kick($ent, 'token-1');

        $this->assertSame('api_error', $result['status']);
        $this->assertSame('omada-openapi-v1', $result['strategy']);
        $this->assertFalse($result['ack']);
    }

    public function testParseDisconnectResult(): void
    {
        $component = new KickerComponent(
            new ComponentRegistry(new Controller(new ServerRequest(), new Response()))
        );

        $ack = $component->parseDisconnectResult('Received Disconnect-ACK', 0);
        $nak = $component->parseDisconnectResult('Received Disconnect-NAK', 0);
        $timeout = $component->parseDisconnectResult('No reply from server', 1);

        $this->assertSame('ack', $ack['status']);
        $this->assertTrue($ack['ack']);
        $this->assertSame('nak', $nak['status']);
        $this->assertFalse($nak['ack']);
        $this->assertSame('timeout', $timeout['status']);
        $this->assertFalse($timeout['ack']);
    }
}

class TestableKickerComponent extends KickerComponent
{
    public ?array $settings = [
        'base_url' => 'https://127.0.0.1:8043',
        'omadac_id' => 'x',
        'site_id' => 'y',
        'api_username' => 'u',
        'api_password' => 'p',
        'enabled' => true,
        'source' => 'test',
    ];

    public array $fakeApiResult = [
        'status' => 'ack',
        'ack' => true,
        'endpoint' => '/openapi/v1/x/sites/y/clients/AA/disconnect',
        'http_code' => 200,
        'latency_ms' => 5,
        'correlation' => ['client_found' => true],
    ];

    protected function resolveOmadaApiSettings(): ?array
    {
        return $this->settings;
    }

    protected function buildOmadaApiClient(array $settings): OmadaApiClient
    {
        return new TestOmadaApiClient($settings, $this->fakeApiResult);
    }
}

class TestOmadaApiClient extends OmadaApiClient
{
    private array $result;

    public function __construct(array $config, array $result)
    {
        parent::__construct($config);
        $this->result = $result;
    }

    public function disconnectWithFallback(array $ctx): array
    {
        return $this->result;
    }
}
