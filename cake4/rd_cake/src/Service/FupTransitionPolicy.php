<?php
declare(strict_types=1);

namespace App\Service;

class FupTransitionPolicy
{
    /**
     * A FUP block is an access decision. Every other FUP action only changes
     * policy attributes and must use a non-portal rate refresh where available.
     */
    public static function dispatchModeForAction(?string $action): string
    {
        return $action === 'block' ? 'block' : 'rate_refresh';
    }

    /**
     * A pending request is also terminal: after sending a disconnect, an
     * interrupted process must never turn uncertainty into a kick loop.
     */
    public static function shouldDispatch(int $fromComponentId, int $toComponentId, ?array $state): bool
    {
        if ($fromComponentId === $toComponentId) {
            return false;
        }

        if ($state === null) {
            return true;
        }

        $sameTransition = (int)$state['from_component_id'] === $fromComponentId
            && (int)$state['to_component_id'] === $toComponentId;
        if (!$sameTransition) {
            return true;
        }

        return !in_array((string)$state['status'], ['pending', 'ack', 'failed'], true);
    }

    public static function shouldReconcile(int $appliedComponentId, int $expectedComponentId, ?array $state): bool
    {
        return $appliedComponentId === $expectedComponentId
            && $state !== null
            && (int)$state['to_component_id'] === $expectedComponentId
            && (string)$state['status'] !== 'reconciled';
    }
}
