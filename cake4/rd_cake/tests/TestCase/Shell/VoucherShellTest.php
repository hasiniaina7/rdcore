<?php
declare(strict_types=1);

namespace App\Test\TestCase\Shell;

use App\Shell\VoucherShell;
use Cake\TestSuite\TestCase;

class VoucherShellTest extends TestCase
{
    public function voucherStatusCases(): array
    {
        return [
            'new without evidence and zero usage' => ['new', false, 0, false],
            'new after access accept' => ['new', true, 0, true],
            'new after accounting row' => ['new', true, 0, true],
            'new with positive usage' => ['new', false, 1, true],
            'used remains used' => ['used', false, 0, true],
            'depleted remains terminal' => ['depleted', true, 10, false],
            'expired remains terminal' => ['expired', true, 10, false],
        ];
    }

    /**
     * @dataProvider voucherStatusCases
     */
    public function testCanMarkVoucherUsed(
        string $currentStatus,
        bool $hasPositiveEvidence,
        int $usage,
        bool $expected
    ): void {
        $shell = new TestableVoucherShell();

        $this->assertSame(
            $expected,
            $shell->canMarkVoucherUsed($currentStatus, $hasPositiveEvidence, $usage)
        );
    }
}

class TestableVoucherShell extends VoucherShell
{
    public function canMarkVoucherUsed(
        string $currentStatus,
        bool $hasPositiveEvidence,
        int $usage
    ): bool {
        return $this->_canMarkVoucherUsed($currentStatus, $hasPositiveEvidence, $usage);
    }
}
