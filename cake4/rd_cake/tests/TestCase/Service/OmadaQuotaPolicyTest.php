<?php
declare(strict_types=1);

namespace App\Test\TestCase\Service;

use App\Service\OmadaQuotaPolicy;
use Cake\TestSuite\TestCase;

class OmadaQuotaPolicyTest extends TestCase
{
    public function testFupGroupIsOwnedByFupShell(): void
    {
        $this->assertTrue(OmadaQuotaPolicy::isFupGroup('FupAdd_52'));
        $this->assertFalse(OmadaQuotaPolicy::isFupGroup('SimpleAdd_52'));
        $this->assertFalse(OmadaQuotaPolicy::isFupGroup('FupAdd_invalid'));
    }

    public function testOnlyHardPermanentCapsAreTerminal(): void
    {
        $this->assertTrue(OmadaQuotaPolicy::isHardCap('hard', 100, 100));
        $this->assertFalse(OmadaQuotaPolicy::isHardCap('soft', 100, 100));
        $this->assertFalse(OmadaQuotaPolicy::isHardCap('hard', 100, 99));
    }

    public function testAcknowledgedRadacctIsNotKickedAgain(): void
    {
        $this->assertTrue(OmadaQuotaPolicy::isAcknowledged(['last_status' => 'ack']));
        $this->assertFalse(OmadaQuotaPolicy::isAcknowledged(['last_status' => 'timeout']));
    }
}
