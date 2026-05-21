<?php
declare(strict_types=1);

namespace App\Command;

use Cake\Console\Arguments;
use Cake\Console\Command;
use Cake\Console\ConsoleIo;
use Cake\ORM\Table;
use Cake\ORM\TableRegistry;

class SyncOmadaRadiusSecretCommand extends Command
{
    public static function defaultName(): string
    {
        return 'omada:sync-secrets';
    }

    public function execute(Arguments $args, ConsoleIo $io)
    {
        $secret = (string)($args->getOption('secret') ?? 'testing123');
        $apply = (bool)$args->getOption('apply');
        $filter = (string)($args->getOption('nas-filter') ?? 'TP-Link');

        $nasTable = TableRegistry::getTableLocator()->get('Nas');
        $dynamicClientsTable = TableRegistry::getTableLocator()->get('DynamicClients');

        [$nasChecked, $nasChanged] = $this->syncTableSecrets($nasTable, $secret, $filter, $apply, $io);
        [$dcChecked, $dcChanged] = $this->syncTableSecrets($dynamicClientsTable, $secret, $filter, $apply, $io);

        $io->success(
            sprintf(
                'secret=%s apply=%s nas_checked=%d nas_changed=%d dynamic_checked=%d dynamic_changed=%d',
                $secret,
                $apply ? 'yes' : 'no',
                $nasChecked,
                $nasChanged,
                $dcChecked,
                $dcChanged
            )
        );

        return self::CODE_SUCCESS;
    }

    protected function buildOptionParser(\Cake\Console\ConsoleOptionParser $parser): \Cake\Console\ConsoleOptionParser
    {
        $parser = parent::buildOptionParser($parser);
        $parser->addOptions([
            'secret' => ['help' => 'Secret to enforce for Omada/TP-Link Radius clients', 'short' => 's'],
            'nas-filter' => ['help' => 'Filter by NAS-Identifier/Name containing this value', 'short' => 'n'],
            'apply' => ['help' => 'Persist changes (otherwise dry-run)', 'boolean' => true],
        ]);
        return $parser;
    }

    private function syncTableSecrets(Table $table, string $secret, string $filter, bool $apply, ConsoleIo $io): array
    {
        $schema = $table->getSchema();
        $columns = $schema->columns();
        $secretFields = array_values(array_intersect(
            ['secret', 'auth_secret', 'acct_secret', 'coa_secret'],
            $columns
        ));
        if (count($secretFields) === 0) {
            return [0, 0];
        }

        $alias = $table->getAlias();
        $query = $table->find();
        $or = [];
        if (in_array('nasidentifier', $columns, true) && $filter !== '') {
            $or[] = ["{$alias}.nasidentifier LIKE" => '%' . $filter . '%'];
        }
        if (in_array('nasname', $columns, true) && $filter !== '') {
            $or[] = ["{$alias}.nasname LIKE" => '%' . $filter . '%'];
        }
        if (in_array('type', $columns, true)) {
            $or[] = ["{$alias}.type LIKE" => '%Omada%'];
        }
        if (count($or) > 0) {
            $query->where(['OR' => $or]);
        }

        $rows = $query->all();
        $checked = 0;
        $changed = 0;
        foreach ($rows as $row) {
            $checked++;
            $dirty = false;
            foreach ($secretFields as $field) {
                if ((string)$row->{$field} !== $secret) {
                    $row->{$field} = $secret;
                    $dirty = true;
                }
            }

            if ($dirty) {
                $changed++;
                if ($apply) {
                    $table->save($row);
                } else {
                    $io->out("[dry-run] {$alias} id=" . (string)($row->id ?? 'n/a') . " secrets -> {$secret}");
                }
            }
        }

        return [$checked, $changed];
    }
}
