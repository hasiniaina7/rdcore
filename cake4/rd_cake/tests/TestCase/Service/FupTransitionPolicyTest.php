<?php
declare(strict_types=1);

namespace App\Test\TestCase\Service;

use App\Service\FupTransitionPolicy;
use Cake\TestSuite\TestCase;

class FupTransitionPolicyTest extends TestCase
{
    public function testNewTransitionIsDispatched(): void
    {
        $this->assertTrue(FupTransitionPolicy::shouldDispatch(0, 37, null));
    }

    public function testAcknowledgedTransitionIsNotDispatchedTwice(): void
    {
        $state = [
            'from_component_id' => 0,
            'to_component_id' => 37,
            'status' => 'ack',
        ];

        $this->assertFalse(FupTransitionPolicy::shouldDispatch(0, 37, $state));
    }

    public function testTimeoutIsNotRetriedAutomatically(): void
    {
        $state = [
            'from_component_id' => 0,
            'to_component_id' => 37,
            'status' => 'failed',
        ];

        $this->assertFalse(FupTransitionPolicy::shouldDispatch(0, 37, $state));
    }

    public function testNewTransitionAfterStateChangeCanBeDispatched(): void
    {
        $state = [
            'from_component_id' => 0,
            'to_component_id' => 37,
            'status' => 'ack',
        ];

        $this->assertTrue(FupTransitionPolicy::shouldDispatch(37, 0, $state));
    }

    public function testAcknowledgedTransitionIsReconciledAfterAccessAccept(): void
    {
        $state = [
            'from_component_id' => 0,
            'to_component_id' => 37,
            'status' => 'ack',
        ];

        $this->assertTrue(FupTransitionPolicy::shouldReconcile(37, 37, $state));
        $this->assertFalse(FupTransitionPolicy::shouldReconcile(0, 37, $state));
    }
}
