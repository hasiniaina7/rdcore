<?php

//as www-data
//cd /var/www/html/cake4/rd_cake && bin/cake voucher 

namespace App\Shell;

use App\Controller\Component\KickerComponent;
use Cake\Controller\ComponentRegistry;
use Cake\Console\Shell;
use Cake\I18n\Time;
use Cake\Datasource\ConnectionManager;
use Cake\I18n\FrozenTime;
use Cake\Log\Log;
use Cake\ORM\TableRegistry;

class VoucherShell extends Shell {
    private $root_user_id = 44;
    private $kicker = null;

    //This shell runs at longer intervals (15 min) to check for two things.
    //It checks all the new and used vouchers and then see if:
   //It has **Rd-Voucher** attribute it will mark it as depleted if the time is up
   //It has **Expiration** attribute it will mark the voucher as expired if it is passed the expiration date
   
    public function initialize():void{
        parent::initialize();
        $this->loadModel('Vouchers');
        $this->loadModel('Radchecks');
        $this->loadModel('Radusergroups');
        $this->loadModel('Radgroupchecks');
        $this->loadModel('Realms');
    }
    public $tasks   = ['Usage','Counters'];

    public function main() {
        $qr = $this->{'Vouchers'}->find()
            ->where(['OR'=> [['Vouchers.status' => 'new'],['Vouchers.status' => 'used']]])
            ->all();
        foreach($qr as $i){
            $this->process_voucher($i->name);
        }
    }

    private function process_voucher($name){

        $this->out("<info>Voucher => $name</info>");
        $this->_ensureVoucherRegistered($name);
        $this->_arm_dynamic_expiration_for_voucher($name);

        //Test for depleted
		$ret_val 				= $this->Usage->time_left_from_login($name);

		$time_left_from_login 	= $ret_val[0];
		$time_avail 			= $ret_val[1];

		if($time_left_from_login){
            if($time_left_from_login == 'depleted'){
                $this->_setTerminalStatusAndKickActiveSessions($name, 'depleted', 'voucher-shell-deplete-check');
            }else{
				if($time_avail){
					$time_used 	= $time_avail - $time_left_from_login;
					$perc_time_used = 0;
					if($time_avail > 0){
					    $perc_time_used = intval(($time_used / $time_avail) * 100);
					}
					$q_r = $this->{'Vouchers'}->find()->where(['Vouchers.name' => $name])->first();
				    if($q_r){
				        $d = [];
						$d['time_cap']       = $time_avail;
						$d['time_used']      = $time_used;
						$d['perc_time_used'] = $perc_time_used;
						$d['status']         = 'used';
				        $this->{'Vouchers'}->patchEntity($q_r,$d);
                        $this->{'Vouchers'}->save($q_r);
				    }
				}
			}
        }

        //Test for expired
         $time_left_from_expire = $this->Usage->time_left_from_expire($name);
        if($time_left_from_expire){
            if($time_left_from_expire == 'expired'){
                $this->_setTerminalStatusAndKickActiveSessions($name, 'expired', 'voucher-shell-expire-check');
            }
        }

        // Keep counter-based usage coherent even when AccountingShell queue misses this voucher.
        $profile = $this->_find_user_profile($name);
        if($profile){
            $counters = $this->Counters->return_counter_data($profile,'voucher',$name);
            $q_r = $this->{'Vouchers'}->find()->where(['Vouchers.name' => $name])->first();
            if(!$q_r){
                return;
            }

            if(array_key_exists('time', $counters) && !empty($counters['time']['value'])){
                $used = $this->Usage->time_usage($counters['time'],$name,'username');
                if($used !== false){
                    $perc_used = intval(($used / $counters['time']['value']) * 100);
                    $d = [];
                    $d['time_used']      = intval($used);
                    $d['time_cap']       = $counters['time']['value'];
                    $d['perc_time_used'] = max(0, min(100, $perc_used));

                    if($q_r->status !== 'expired'){
                        $d['status'] = 'used';
                        if(
                            ($counters['time']['cap'] === 'hard') &&
                            (intval($used) >= intval($counters['time']['value']))
                        ){
                            $d['status'] = 'depleted';
                        }
                    }
                    $this->{'Vouchers'}->patchEntity($q_r,$d);
                    $this->{'Vouchers'}->save($q_r);
                    $q_r = $this->{'Vouchers'}->find()->where(['Vouchers.name' => $name])->first();
                }
            }

            if(array_key_exists('data', $counters) && !empty($counters['data']['value'])){
                $used = $this->Usage->data_usage($counters['data'],$name,'username');
                if($used !== false){
                    $perc_used = intval(($used / $counters['data']['value']) * 100);
                    $d = [];
                    $d['perc_data_used'] = max(0, min(100, $perc_used));
                    $d['data_used']      = intval($used);
                    $d['data_cap']       = $counters['data']['value'];

                    if($q_r->status !== 'expired'){
                        $d['status'] = 'used';
                        if(
                            ($counters['data']['cap'] === 'hard') &&
                            (intval($used) >= intval($counters['data']['value']))
                        ){
                            $d['status'] = 'depleted';
                        }
                    }
                    $this->{'Vouchers'}->patchEntity($q_r,$d);
                    $this->{'Vouchers'}->save($q_r);
                }
            }
        }
    }

    private function _find_user_profile($username){
        $profile = false;
        $q_r = $this->Radchecks->find()->where([
            'Radchecks.username'  => $username,
            'Radchecks.attribute' => 'User-Profile'
        ])->first();
        if($q_r){
            $profile = $q_r->value;
        }
        return $profile;
    }

    private function _arm_dynamic_expiration_for_voucher($username){
        $user_type = $this->Radchecks->find()->where([
            'Radchecks.username'  => $username,
            'Radchecks.attribute' => 'Rd-User-Type'
        ])->first();
        if((!$user_type) || ($user_type->value !== 'voucher')){
            return;
        }

        $profile = $this->_find_user_profile($username);
        if(!$profile){
            return;
        }

        $dynamic_enabled = false;
        $q_groups = $this->Radusergroups->find()->where(['Radusergroups.username' => $profile])->all();
        foreach($q_groups as $group){
            $q_dyn = $this->Radgroupchecks->find()->where([
                'Radgroupchecks.groupname'  => $group->groupname,
                'Radgroupchecks.attribute'  => 'Rd-Dynamic-Expiration',
                'Radgroupchecks.value'      => '1'
            ])->first();
            if($q_dyn){
                $dynamic_enabled = true;
                break;
            }
        }
        if(!$dynamic_enabled){
            return;
        }

        $counters = $this->Counters->return_counter_data($profile,'voucher',$username);
        if((!array_key_exists('time', $counters)) || empty($counters['time']['value'])){
            return;
        }
        $total_time = intval($counters['time']['value']);
        if($total_time <= 0){
            return;
        }

        $conn = ConnectionManager::get('default');
        $stmt = $conn->execute("SELECT UNIX_TIMESTAMP(MIN(created)) AS first_login_ts FROM user_stats WHERE username = '$username'");
        $row = $stmt->fetch('assoc');
        if((!$row) || (!$row['first_login_ts'])){
            return;
        }
        $first_login_ts = intval($row['first_login_ts']);
        $exp_unix       = $first_login_ts + $total_time;

        $conn->execute(
            "INSERT INTO radcheck (username, attribute, op, value) ".
            "SELECT '$username', 'Rd-Expiration-Unix', ':=', '$exp_unix' FROM DUAL ".
            "WHERE NOT EXISTS (".
                "SELECT 1 FROM radcheck WHERE username = '$username' AND attribute = 'Rd-Expiration-Unix'".
            ")"
        );
    }

    private function _setTerminalStatusAndKickActiveSessions($username, $status, $source){
        $q_r = $this->{'Vouchers'}->find()->where(['Vouchers.name' => $username])->first();
        if(!$q_r){
            Log::warning("[voucher-terminal-kick] Voucher not found for $username ($source)");
            return;
        }

        if($q_r->status === $status){
            Log::info("[voucher-terminal-kick] Status already $status for $username; retrying active-session kick ($source)");
            $this->_kickActiveSessionsByUsername($username, $source.'-retry');
            return;
        }

        $previous_status = (string)$q_r->status;
        $d = [];
        $d['perc_time_used'] = 100;
        $d['status'] = $status;
        $this->{'Vouchers'}->patchEntity($q_r, $d);
        if(!$this->{'Vouchers'}->save($q_r)){
            Log::error("[voucher-terminal-kick] Failed to persist $status status for $username ($source)");
            return;
        }

        Log::info("[voucher-terminal-kick] Status transition $username: $previous_status -> $status ($source)");
        $this->_kickActiveSessionsByUsername($username, $source);
    }

    private function _kickActiveSessionsByUsername($username, $source){
        $Radaccts = TableRegistry::get('Radaccts');
        $Users = TableRegistry::get('Users');

        $root_user = $Users->find()->where(['Users.id' => $this->root_user_id])->first();
        if((!$root_user) || (empty($root_user->token))){
            Log::error("[voucher-terminal-kick] Missing root token for kick of $username ($source)");
            return;
        }

        $sessions = $Radaccts->find()->where([
            'Radaccts.username' => $username,
            'Radaccts.acctstoptime IS NULL'
        ])->all();

        foreach($sessions as $session){
            $result = $this->_kicker()->kick($session, $root_user->token);
            Log::info('[voucher-terminal-kick] '.json_encode([
                'username'  => $username,
                'source'    => $source,
                'radacctid' => $session->radacctid ?? null,
                'nas'       => $session->nasipaddress ?? null,
                'result'    => $result
            ]));
        }
    }

    private function _kicker(){
        if($this->kicker === null){
            $this->kicker = new KickerComponent(new ComponentRegistry());
            $this->kicker->initialize([]);
        }
        return $this->kicker;
    }

    private function _ensureVoucherRegistered($username){
        $existing = $this->Radchecks->find()->where([
            'Radchecks.username' => $username
        ])->count();
        if($existing > 0){
            return;
        }

        $voucher = $this->Vouchers->find()->where(['Vouchers.name' => $username])->first();
        if(!$voucher){
            return;
        }

        $realmName = (string)$voucher->realm;
        if(!empty($voucher->realm_id)){
            $realm = $this->Realms->find()->where(['Realms.id' => $voucher->realm_id])->first();
            if($realm && !empty($realm->name)){
                $realmName = (string)$realm->name;
            }
        }

        $checks = [
            ['attribute' => 'User-Profile', 'value' => (string)$voucher->profile],
            ['attribute' => 'Rd-Realm', 'value' => $realmName],
            ['attribute' => 'Cleartext-Password', 'value' => (string)$voucher->password],
            ['attribute' => 'Rd-User-Type', 'value' => 'voucher']
        ];

        if(!empty($voucher->expire)){
            $expireTs = strtotime((string)$voucher->expire);
            if($expireTs){
                $checks[] = ['attribute' => 'Expiration', 'value' => date('j M Y', $expireTs)];
            }
        }

        if(!empty($voucher->time_valid)){
            $checks[] = ['attribute' => 'Rd-Voucher', 'value' => (string)$voucher->time_valid];
        }

        foreach($checks as $item){
            $entity = $this->Radchecks->newEntity([
                'username'  => $username,
                'attribute' => $item['attribute'],
                'op'        => ':=',
                'value'     => $item['value']
            ]);
            $this->Radchecks->save($entity);
        }

        if($voucher->realm !== $realmName){
            $voucher->realm = $realmName;
            $this->Vouchers->save($voucher);
        }

        Log::warning("[voucher-auto-register] Rebuilt missing radcheck rows for voucher {$username}");
    }
}

?>
