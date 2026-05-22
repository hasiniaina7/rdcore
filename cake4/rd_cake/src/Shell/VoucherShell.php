<?php

//as www-data
//cd /var/www/html/cake4/rd_cake && bin/cake voucher 

namespace App\Shell;

use Cake\Console\Shell;
use Cake\I18n\Time;
use Cake\Datasource\ConnectionManager;
use Cake\I18n\FrozenTime;

class VoucherShell extends Shell {

    //This shell runs at longer intervals (15 min) to check for two things.
    //It checks all the new and used vouchers and then see if:
   //It has **Rd-Voucher** attribute it will mark it as depleted if the time is up
   //It has **Expiration** attribute it will mark the voucher as expired if it is passed the expiration date
   
    public function initialize():void{
        parent::initialize();
        $this->loadModel('Vouchers');
        $this->loadModel('Radchecks');
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

        //Test for depleted
		$ret_val 				= $this->Usage->time_left_from_login($name);

		$time_left_from_login 	= $ret_val[0];
		$time_avail 			= $ret_val[1];

		if($time_left_from_login){
            if($time_left_from_login == 'depleted'){
                //Mark time usage as 100% and voucher as depleted
                $q_r = $this->{'Vouchers'}->find()->where(['Vouchers.name' => $name])->first();
                if($q_r){
                    $d = [];
                    $d['perc_time_used'] = 100;
                    $d['status']         = 'depleted';
					if($time_avail){
						$d['time_cap']       = $time_avail;
						$d['time_used']      = $time_avail; //Make them equal
					}
                    $this->{'Vouchers'}->patchEntity($q_r,$d);
                    $this->{'Vouchers'}->save($q_r);
                }
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
                //Mark time usage as 100% and voucher as expired
                $q_r = $this->{'Vouchers'}->find()->where(['Vouchers.name' => $name])->first();
                if($q_r){
                    $d = [];
                    $d['perc_time_used'] = 100;
                    $d['status']         = 'expired';
                    $this->{'Vouchers'}->patchEntity($q_r,$d);
                    $this->{'Vouchers'}->save($q_r);
                }
            }
        }

        // Keep data counters coherent even when AccountingShell queue misses this voucher.
        $profile = $this->_find_user_profile($name);
        if($profile){
            $counters = $this->Counters->return_counter_data($profile,'voucher',$name);
            if(array_key_exists('data', $counters) && !empty($counters['data']['value'])){
                $used = $this->Usage->data_usage($counters['data'],$name,'username');
                if($used !== false){
                    $perc_used = intval(($used / $counters['data']['value']) * 100);
                    $q_r = $this->{'Vouchers'}->find()->where(['Vouchers.name' => $name])->first();
                    if($q_r){
                        $d = [];
                        $d['status']         = 'used';
                        $d['perc_data_used'] = $perc_used;
                        $d['data_used']      = intval($used);
                        $d['data_cap']       = $counters['data']['value'];
                        $this->{'Vouchers'}->patchEntity($q_r,$d);
                        $this->{'Vouchers'}->save($q_r);
                    }
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
}

?>
