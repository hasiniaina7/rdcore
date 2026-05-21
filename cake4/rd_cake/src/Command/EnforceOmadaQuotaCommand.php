<?php
declare(strict_types=1);

namespace App\Command;

use App\Controller\Component\KickerComponent;
use Cake\Cache\Cache;
use Cake\Console\Arguments;
use Cake\Console\Command;
use Cake\Console\ConsoleIo;
use Cake\Controller\ComponentRegistry;
use Cake\Controller\Controller;
use Cake\Datasource\ConnectionManager;
use Cake\Http\Response;
use Cake\Http\ServerRequest;
use Cake\I18n\FrozenTime;
use Cake\Log\Log;
use Cake\ORM\TableRegistry;

class EnforceOmadaQuotaCommand extends Command
{
    public static function defaultName(): string
    {
        return 'omada:enforce-quota';
    }

    public function execute(Arguments $args, ConsoleIo $io)
    {
        $windowSeconds = (int)($args->getOption('window') ?? 180);
        $retryMax = (int)($args->getOption('retry-max') ?? 3);
        $cooldownSeconds = (int)($args->getOption('cooldown') ?? 90);
        $nasFilter = (string)($args->getOption('nas-filter') ?? 'TP-Link');
        $dryRun = (bool)$args->getOption('dry-run');

        $radaccts = TableRegistry::getTableLocator()->get('Radaccts');
        $permanentUsers = TableRegistry::getTableLocator()->get('PermanentUsers');
        $now = FrozenTime::now();
        $minUpdated = $now->subSeconds($windowSeconds);
        $where = [
            'Radaccts.acctstoptime IS' => null,
            'Radaccts.acctupdatetime >=' => $minUpdated,
        ];
        if ($nasFilter !== '') {
            $where['Radaccts.nasidentifier LIKE'] = '%' . $nasFilter . '%';
        }

        $sessions = $radaccts->find()->where($where)->all();
        $kicker = $this->makeKicker();

        $checked = 0;
        $kicked = 0;
        $skipped = 0;
        foreach ($sessions as $session) {
            $checked++;
            $username = (string)$session->username;
            if ($username === '') {
                $skipped++;
                continue;
            }

            $counters = $this->findCountersForUsername($username);
            $breaches = $this->evaluateBreaches($session, $counters);
            $breaches = array_merge($breaches, $this->evaluatePermanentUserCaps($permanentUsers, $username));
            if (count($breaches) === 0) {
                continue;
            }

            $cacheKey = 'omada_quota_kick_' . (int)$session->radacctid;
            $state = Cache::read($cacheKey, 'default');
            if (!is_array($state)) {
                $state = ['attempts' => 0, 'last_try' => 0, 'last_status' => null];
            }

            $nowTs = time();
            if (($nowTs - (int)$state['last_try']) < $cooldownSeconds) {
                $skipped++;
                continue;
            }

            if ((int)$state['attempts'] >= $retryMax && ($state['last_status'] ?? '') !== 'ack') {
                $this->logQuotaAudit($session, 'retry_exhausted', $breaches, null);
                $skipped++;
                continue;
            }

            if ($dryRun) {
                $this->logQuotaAudit($session, 'dry_run_quota_exceeded', $breaches, null);
                $kicked++;
                continue;
            }

            $kick = $kicker->kick($session, 'quota-worker');
            $status = (string)($kick['status'] ?? 'stderr');
            $state = [
                'attempts' => ((int)$state['attempts']) + 1,
                'last_try' => $nowTs,
                'last_status' => $status,
            ];

            if ($status === 'ack') {
                Cache::delete($cacheKey, 'default');
            } else {
                Cache::write($cacheKey, $state, 'default');
            }

            $this->logQuotaAudit($session, $status, $breaches, $kick);
            $kicked++;
        }

        $io->success("checked={$checked} kicked={$kicked} skipped={$skipped} window={$windowSeconds}s");
        return self::CODE_SUCCESS;
    }

    protected function buildOptionParser(\Cake\Console\ConsoleOptionParser $parser): \Cake\Console\ConsoleOptionParser
    {
        $parser = parent::buildOptionParser($parser);
        $parser->addOptions([
            'window' => ['help' => 'Only evaluate sessions updated in the last N seconds', 'short' => 'w'],
            'retry-max' => ['help' => 'Maximum retries per session before cooldown skip', 'short' => 'r'],
            'cooldown' => ['help' => 'Seconds between retries per session', 'short' => 'c'],
            'nas-filter' => ['help' => 'Filter Radacct NAS-Identifier contains value', 'short' => 'n'],
            'dry-run' => ['help' => 'Only log quota breaches without disconnect', 'boolean' => true],
        ]);
        return $parser;
    }

    private function makeKicker(): KickerComponent
    {
        $controller = new Controller(new ServerRequest(), new Response());
        $registry = new ComponentRegistry($controller);
        return new KickerComponent($registry);
    }

    private function findCountersForUsername(string $username): array
    {
        $radusergroups = TableRegistry::getTableLocator()->get('Radusergroups');
        $radgroupchecks = TableRegistry::getTableLocator()->get('Radgroupchecks');
        $radchecks = TableRegistry::getTableLocator()->get('Radchecks');

        $counterInfo = [];
        $groups = $radusergroups->find()
            ->where(['Radusergroups.username' => $username])
            ->order(['Radusergroups.priority ASC'])
            ->all();

        foreach ($groups as $group) {
            $checks = $radgroupchecks->find()->where(['Radgroupchecks.groupname' => $group->groupname])->all();
            foreach ($checks as $check) {
                $counterInfo[(string)$check->attribute] = (string)$check->value;
            }
        }

        $counters = [];
        if (($counterInfo['Rd-Cap-Type-Time'] ?? '') === 'hard') {
            $timeValue = $counterInfo['Rd-Total-Time'] ?? null;
            if ($timeValue === null || $timeValue === '') {
                $row = $radchecks->find()->where(['Radchecks.username' => $username, 'Radchecks.attribute' => 'Rd-Total-Time'])->first();
                if ($row) {
                    $timeValue = $row->value;
                }
            }
            if ($timeValue !== null && $timeValue !== '') {
                $counters['time'] = [
                    'cap' => 'hard',
                    'value' => (int)$timeValue,
                    'reset' => (string)($counterInfo['Rd-Reset-Type-Time'] ?? 'never'),
                    'reset_interval' => (int)($counterInfo['Rd-Reset-Interval-Time'] ?? 0),
                    'mac_counter' => (($counterInfo['Rd-Mac-Counter-Time'] ?? '0') === '1'),
                ];
            }
        }

        if (($counterInfo['Rd-Cap-Type-Data'] ?? '') === 'hard') {
            $dataValue = $counterInfo['Rd-Total-Data'] ?? null;
            if ($dataValue === null || $dataValue === '') {
                $row = $radchecks->find()->where(['Radchecks.username' => $username, 'Radchecks.attribute' => 'Rd-Total-Data'])->first();
                if ($row) {
                    $dataValue = $row->value;
                }
            }
            if ($dataValue !== null && $dataValue !== '') {
                $counters['data'] = [
                    'cap' => 'hard',
                    'value' => (int)$dataValue,
                    'reset' => (string)($counterInfo['Rd-Reset-Type-Data'] ?? 'never'),
                    'reset_interval' => (int)($counterInfo['Rd-Reset-Interval-Data'] ?? 0),
                    'mac_counter' => (($counterInfo['Rd-Mac-Counter-Data'] ?? '0') === '1'),
                ];
            }
        }

        return $counters;
    }

    private function evaluateBreaches($session, array $counters): array
    {
        $breaches = [];
        $username = (string)$session->username;
        $mac = (string)$session->callingstationid;

        if (isset($counters['time'])) {
            $used = $this->queryTimeUsage($username, $counters['time'], $counters['time']['mac_counter'] ? $mac : null);
            if ($used >= (int)$counters['time']['value']) {
                $breaches[] = [
                    'type' => 'time',
                    'used' => $used,
                    'cap' => (int)$counters['time']['value'],
                ];
            }
        }

        if (isset($counters['data'])) {
            $used = $this->queryDataUsage($username, $counters['data'], $counters['data']['mac_counter'] ? $mac : null);
            if ($used >= (int)$counters['data']['value']) {
                $breaches[] = [
                    'type' => 'data',
                    'used' => $used,
                    'cap' => (int)$counters['data']['value'],
                ];
            }
        }

        return $breaches;
    }

    private function evaluatePermanentUserCaps($permanentUsers, string $username): array
    {
        $breaches = [];
        $pu = $permanentUsers->find()->where(['PermanentUsers.username' => $username])->first();
        if (!$pu) {
            return $breaches;
        }

        $dataCap = (int)($pu->data_cap ?? 0);
        $dataUsed = (int)($pu->data_used ?? 0);
        if ($dataCap > 0 && $dataUsed >= $dataCap) {
            $breaches[] = [
                'type' => 'data',
                'used' => $dataUsed,
                'cap' => $dataCap,
                'source' => 'permanent_users'
            ];
        }

        $timeCap = (int)($pu->time_cap ?? 0);
        $timeUsed = (int)($pu->time_used ?? 0);
        if ($timeCap > 0 && $timeUsed >= $timeCap) {
            $breaches[] = [
                'type' => 'time',
                'used' => $timeUsed,
                'cap' => $timeCap,
                'source' => 'permanent_users'
            ];
        }

        return $breaches;
    }

    private function queryTimeUsage(string $username, array $counter, ?string $mac = null): int
    {
        $conn = ConnectionManager::get('default');
        $params = ['username' => $username];
        $types = ['username' => 'string'];
        $conditions = "username = :username";
        if ($mac !== null && $mac !== '') {
            $conditions .= " AND callingstationid = :mac";
            $params['mac'] = $mac;
            $types['mac'] = 'string';
        }

        $startTs = $this->findResetStartUnix((string)$counter['reset'], (int)$counter['reset_interval']);
        if ($startTs === null) {
            $sql = "SELECT IFNULL(SUM(GREATEST(UNIX_TIMESTAMP(`timestamp`) - UNIX_TIMESTAMP(created), 0)), 0) AS used
                    FROM user_stats
                    WHERE {$conditions}";
            $row = $conn->execute($sql, $params, $types)->fetch('assoc');
            return (int)($row['used'] ?? 0);
        }

        $sql = "SELECT IFNULL(SUM(GREATEST(UNIX_TIMESTAMP(`timestamp`) - GREATEST(UNIX_TIMESTAMP(created), :start_ts), 0)), 0) AS used
                FROM user_stats
                WHERE {$conditions}
                  AND UNIX_TIMESTAMP(`timestamp`) > :start_ts";
        $params['start_ts'] = $startTs;
        $types['start_ts'] = 'integer';
        $row = $conn->execute($sql, $params, $types)->fetch('assoc');
        return (int)($row['used'] ?? 0);
    }

    private function queryDataUsage(string $username, array $counter, ?string $mac = null): int
    {
        $conn = ConnectionManager::get('default');
        $params = ['username' => $username];
        $types = ['username' => 'string'];
        $conditions = "username = :username";
        if ($mac !== null && $mac !== '') {
            $conditions .= " AND callingstationid = :mac";
            $params['mac'] = $mac;
            $types['mac'] = 'string';
        }

        $startTs = $this->findResetStartUnix((string)$counter['reset'], (int)$counter['reset_interval']);
        if ($startTs === null) {
            $sql = "SELECT IFNULL(SUM(acctinputoctets) + SUM(acctoutputoctets), 0) AS used
                    FROM user_stats
                    WHERE {$conditions}";
            $row = $conn->execute($sql, $params, $types)->fetch('assoc');
            return (int)($row['used'] ?? 0);
        }

        $sql = "SELECT IFNULL(SUM(acctinputoctets) + SUM(acctoutputoctets), 0) AS used
                FROM user_stats
                WHERE {$conditions}
                  AND created > FROM_UNIXTIME(:start_ts)";
        $params['start_ts'] = $startTs;
        $types['start_ts'] = 'integer';
        $row = $conn->execute($sql, $params, $types)->fetch('assoc');
        return (int)($row['used'] ?? 0);
    }

    private function findResetStartUnix(string $reset, int $interval): ?int
    {
        if ($reset === '' || $reset === 'never') {
            return null;
        }

        if ($reset === 'daily') {
            return (int)mktime(0, 0, 0, (int)date('m'), (int)date('d'), (int)date('Y'));
        }
        if ($reset === 'weekly') {
            return (int)(mktime(0, 0, 0, (int)date('n'), (int)date('j'), (int)date('Y')) - ((int)date('N') - 1) * 86400);
        }
        if ($reset === 'monthly') {
            return (int)mktime(0, 0, 0, (int)date('m'), 1, (int)date('Y'));
        }
        if ($reset === 'dynamic') {
            return time() - max($interval, 0);
        }

        return null;
    }

    private function logQuotaAudit($session, string $status, array $breaches, ?array $kick): void
    {
        $omada = is_array($kick['omada'] ?? null) ? $kick['omada'] : [];
        $payload = [
            'timestamp' => gmdate('c'),
            'radacctid' => (int)$session->radacctid,
            'username' => (string)$session->username,
            'nas' => (string)$session->nasidentifier,
            'nas_ip' => (string)$session->nasipaddress,
            'acct_session_id' => (string)$session->acctsessionid,
            'status' => $status,
            'breaches' => $breaches,
            'endpoint' => $omada['endpoint'] ?? null,
            'http_code' => $omada['http_code'] ?? null,
            'latency_ms' => $kick['latency_ms'] ?? null,
            'correlation' => $omada['correlation'] ?? null,
            'kick' => $kick,
        ];
        Log::info('[QuotaKickAudit] ' . json_encode($payload, JSON_UNESCAPED_SLASHES));
    }
}
