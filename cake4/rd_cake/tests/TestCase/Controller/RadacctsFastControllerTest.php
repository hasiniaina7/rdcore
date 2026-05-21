<?php
declare(strict_types=1);

namespace App\Test\TestCase\Controller;

use App\Controller\RadacctsFastController;
use Cake\Http\Response;
use Cake\Http\ServerRequest;
use Cake\TestSuite\TestCase;

class RadacctsFastControllerTest extends TestCase
{
    public function testBuildKickActiveResponseDataForTimeoutFailure(): void
    {
        $controller = new RadacctsFastController(new ServerRequest(), new Response());
        $stats = ['ack' => 0, 'not_found' => 0, 'api_error' => 0, 'auth_error' => 0, 'timeout' => 1, 'nak' => 0, 'stderr' => 0, 'sent' => 0, 'not_supported' => 0];
        $results = [['radacctid' => 9, 'status' => 'timeout']];

        $data = $controller->buildKickActiveResponseData(1, 0, $stats, $results);

        $this->assertSame('Disconnect Partially Failed', $data['title']);
        $this->assertSame('warn', $data['type']);
        $this->assertStringContainsString('timeout 1', $data['message']);
    }

    public function testBuildKickActiveResponseDataForAckSuccess(): void
    {
        $controller = new RadacctsFastController(new ServerRequest(), new Response());
        $stats = ['ack' => 1, 'not_found' => 0, 'api_error' => 0, 'auth_error' => 0, 'timeout' => 0, 'nak' => 0, 'stderr' => 0, 'sent' => 0, 'not_supported' => 0];
        $results = [['radacctid' => 10, 'status' => 'ack']];

        $data = $controller->buildKickActiveResponseData(1, 0, $stats, $results);

        $this->assertSame('Disconnect Completed', $data['title']);
        $this->assertSame('info', $data['type']);
        $this->assertStringContainsString('ACK 1', $data['message']);
    }
}
