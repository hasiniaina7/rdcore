<?php
//----------------------------------------------------------
//---- Author: Dirk van der Walt
//---- License: GPL v3
//---- Description: A component used to return totals of Items based on the CloudId
//---- Date: 12-OCT-2025
//------------------------------------------------------------
declare(strict_types=1);

namespace App\Controller\Component;

use Cake\Controller\Component;
use Cake\Cache\Cache;
use Cake\ORM\Table;
use Cake\ORM\TableRegistry;

class CountsComponent extends Component
{
    protected $_defaultConfig = [
        // Multi-tenant defaults
        'cloudField'     => 'cloud_id',
        'systemWideId'   => -1,         // set to null to disable system-wide fallback
    ];

    /**
     * Resolve a Table from a name or pass-through a Table instance.
     */
    public function table(string|Table $table): Table
    {
        return $table instanceof Table
            ? $table
            : TableRegistry::getTableLocator()->get($table);
    }

    /**
     * Count rows for a given cloud, including system-wide (-1) by default.
     *
     * @param string|Table $table Table name or instance
     * @param int $cloudId Cloud id for tenant scoping
     * @param array $extra Extra conditions (auto-qualified with alias where possible)
     * @param array $opts  Per-call overrides for component config
     */
    public function countForCloud(string|Table $table, int $cloudId, array $extra = [], array $opts = []): int
    {
        $cfg   = array_replace_recursive($this->getConfig(), $opts);
        $Table = $this->table($table);
        $alias = $Table->getAlias();

        // Build base conditions
        $cloudField = "{$alias}.{$cfg['cloudField']}";
        $cloudVals  = [$cloudId];
        if ($cfg['systemWideId'] !== null) {
            $cloudVals[] = $cfg['systemWideId'];
        }

        $conds = [
            "{$cloudField} IN" => $cloudVals
        ];

        return (int)$Table->find()->where($conds)->count();
    }

    
    /**
     * Bulk helper for multiple totals (great for your tiles).
     * Spec: [['table'=>'DynamicClients','key'=>'clients','extra'=>['active'=>1]], ...]
     */
    public function totals(array $specs, int $cloudId, array $opts = []): array
    {
        $out = [];
        foreach ($specs as $s) {
            $key   = $s['key']   ?? $s['table'];
            $table = $s['table'] ?? null;
            $extra = $s['extra'] ?? [];
            $out[$key] = $this->countForCloud($table, $cloudId, $extra, $opts);
        }
        return $out;
    }
}
