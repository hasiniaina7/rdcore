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
use Cake\Controller\ComponentRegistry; 

use Cake\Cache\Cache;
use Cake\Datasource\ConnectionManager;

use Cake\ORM\Table;
use Cake\ORM\TableRegistry;

class CountsComponent extends Component {

    protected $components 	= ['Aa'];
    
    protected $_defaultConfig = [
        // Multi-tenant defaults
        'cloudField'     => 'cloud_id',
        'systemWideId'   => -1,         // set to null to disable system-wide fallback
    ];
    
    public function __construct(ComponentRegistry $registry, array $config = [])
    {
        parent::__construct($registry, $config);
        // Use the registry from a component, not loadComponent()
        $this->CommonQueryFlat = $registry->load('CommonQueryFlat');
    }

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
    
    public function countPermanentUsers(int $cloudId): array {

        $PermanentUsers = TableRegistry::getTableLocator()->get('PermanentUsers');

        // Base scoped query (cloud, realm, etc.)
        $base = $PermanentUsers->find();
        $this->CommonQueryFlat->setConfig([
            'model'   => 'PermanentUsers',
            'sort_by' => 'PermanentUsers.username',
        ], false);
        $this->CommonQueryFlat->build_cloud_query($base, $cloudId);
        
        // Total users (under scope)
        $total = (clone $base)->count();

        // Online = users with at least one open session
        // Use DISTINCT to avoid double-counting users with multiple open sessions
        $onlineQ = (clone $base)
            ->distinct(['PermanentUsers.id'])
            ->innerJoin(
                ['Radaccts' => 'radacct'], // alias => table name
                [
                    'Radaccts.username = PermanentUsers.username',
                    'Radaccts.acctstoptime IS' => null,
                ]
            );
        $scopeExpr = $this->buildRadacctCloudScopeExpr('Radaccts', $cloudId);
        if ($scopeExpr !== false) {
            $onlineQ->where($scopeExpr);
        }
        $online = $onlineQ->count();
            
        // Suspended users
        $suspended = (clone $base)
            ->where(['PermanentUsers.admin_state' => 'suspended'])
            ->count();

        // Terminated users
        $terminated = (clone $base)
            ->where(['PermanentUsers.admin_state' => 'terminated'])
            ->count();

        return [
            'total'      => (int)$total,
            'online'     => (int)$online,
            'suspended'  => (int)$suspended,
            'terminated' => (int)$terminated,
        ];

    }
    
    public function countVouchers(int $cloudId): array {

        $PermanentUsers = TableRegistry::getTableLocator()->get('Vouchers');

        // Base scoped query (cloud, realm, etc.)
        $base = $PermanentUsers->find();
        $this->CommonQueryFlat->setConfig([
            'model'     => 'Vouchers',
            'sort_by'   => 'Vouchers.name'
        ], false);
        $this->CommonQueryFlat->build_cloud_query($base, $cloudId);
        
        // Total users (under scope)
        $total = (clone $base)->count();

        $onlineQ = (clone $base)
            ->distinct(['Vouchers.id'])
            ->innerJoin(
                ['Radaccts' => 'radacct'], // alias => table name
                [
                    'Radaccts.username = Vouchers.name',
                    'Radaccts.acctstoptime IS' => null,
                ]
            );
        $scopeExpr = $this->buildRadacctCloudScopeExpr('Radaccts', $cloudId);
        if ($scopeExpr !== false) {
            $onlineQ->where($scopeExpr);
        }
        $online = $onlineQ->count();
            
        return [
            'total'      => (int)$total,
            'online'     => (int)$online
        ];

    }
    
    public function countRadaccts(int $cloudId): int {

        $where = ['Radaccts.acctstoptime IS NULL'];
        $scopeExpr = $this->buildRadacctCloudScopeExpr('Radaccts', $cloudId);
        if ($scopeExpr === false) {
            return 0;
        }
        $where[] = $scopeExpr;

        $Radaccts   = TableRegistry::getTableLocator()->get('Radaccts');
        $base       = $Radaccts->find();
        $base->where($where);      
        $total      = (clone $base)->count();       
        return $total;  
    }

    private function buildRadacctCloudScopeExpr(string $radacctAlias, int $cloudId): string|false
    {
        $Realms = TableRegistry::getTableLocator()->get('Realms');
        $realmRows = $Realms->find()
            ->select(['id', 'name'])
            ->where(['Realms.cloud_id' => $cloudId])
            ->all();

        if ($realmRows->count() === 0) {
            $this->Aa->fail_no_rights("No Realms owned by this cloud");
            return false;
        }

        $realmNames = [];
        $realmIdByName = [];
        foreach ($realmRows as $row) {
            $name = (string)$row->name;
            $realmNames[] = $name;
            $realmIdByName[$name] = (int)$row->id;
        }

        $apRealmList = $this->Aa->realmCheck(true);
        if ($apRealmList) {
            $realmNames = array_values(array_intersect($realmNames, $apRealmList));
        }
        if (count($realmNames) === 0) {
            $this->Aa->fail_no_rights("No Realms owned by this cloud");
            return false;
        }

        $realmIds = [];
        foreach ($realmNames as $realmName) {
            if (array_key_exists($realmName, $realmIdByName)) {
                $realmIds[] = $realmIdByName[$realmName];
            }
        }
        if (count($realmIds) === 0) {
            $this->Aa->fail_no_rights("No Realms owned by this cloud");
            return false;
        }

        $conn = ConnectionManager::get('default');
        $quotedRealmNames = array_map(fn($name) => $conn->quote($name), $realmNames);
        $realmNameIn = implode(',', $quotedRealmNames);
        $realmIdIn = implode(',', array_map('intval', $realmIds));

        return "(
            {$radacctAlias}.realm IN ({$realmNameIn})
            OR {$radacctAlias}.username IN (
                SELECT pu.username
                FROM permanent_users pu
                WHERE pu.cloud_id = {$cloudId}
                  AND pu.realm_id IN ({$realmIdIn})
            )
            OR {$radacctAlias}.username IN (
                SELECT v.name
                FROM vouchers v
                WHERE v.cloud_id = {$cloudId}
                  AND v.realm_id IN ({$realmIdIn})
            )
            OR {$radacctAlias}.username IN (
                SELECT d.name
                FROM devices d
                INNER JOIN permanent_users pu2 ON pu2.id = d.permanent_user_id
                WHERE pu2.cloud_id = {$cloudId}
                  AND pu2.realm_id IN ({$realmIdIn})
            )
        )";
    }
        
}
