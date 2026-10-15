<?php

//as www-data
//cd /var/www/html/cake4/rd_cake && bin/cake fup

namespace App\Shell;

use App\Service\FupTransitionPolicy;
use Cake\Console\Shell;
use Cake\Console\ConsoleOptionParser;

use Cake\Datasource\ConnectionManager;

use Cake\I18n\FrozenTime;
use Cake\I18n\Time;
use Cake\Http\Client;
use Cake\Log\Log;

class FupShell extends Shell {

	protected $fupProfiles 	= [];
	protected $timezone		= 'Africa/Johannesburg';

	public function initialize():void{
        parent::initialize();
        $this->loadModel('Profiles');
        $this->loadModel('Radaccts');
        $this->loadModel('Radchecks');
        $this->loadModel('Vouchers');
        $this->loadModel('PermanentUsers');
        $this->loadModel('Devices');
        $this->loadModel('AppliedFupComponents');
        $this->loadModel('Clouds');
        $this->loadModel('Users');
    }

    public function main(){
        $this->findFupProfiles();
        if(!empty($this->fupProfiles)){
        	//There is FUP Profiles lets see if some are with the current active users
        	$this->testActiveConnections();
        }else{
        	$this->out("<info>No FUP Profiles - Exit</info>");
        }                 
    }
      
    private function testActiveConnections(){    
    	$e_ra = $this->{'Radaccts'}->find()->where(['Radaccts.acctstoptime IS NULL'])->all();
    	foreach($e_ra as $ra){ 
    		$this->processUsername($ra);   			
    	}      
    }  
    
    private function processUsername($ra){
    	$type = $this->find_type($ra->username);
    	$this->out("<info>".$ra->username." is of type $type</info>");
    	if($type == 'user'){  	
    		$e_pu = $this->{'PermanentUsers'}->find()->where(['PermanentUsers.username' => $ra->username])->first();
    		if($e_pu){
    			if(isset($this->fupProfiles[$e_pu->profile_id])){
    				$this->out("<info>Found FUP Profile for user</info>");
    				$billing_cycle = false;	
    				if(($e_pu->extra_name == 'BCStartDay')&&(intval($e_pu->extra_value) > 0)){
    					$billing_cycle = $e_pu->extra_value;	
    				}
    				$timezone 	= $this->getTimezone($ra->nasidentifier);
    				$profile_id = $e_pu->profile_id;
    				$profile_name = $e_pu->profile;
    				$username	= $ra->username;
                    $this->fup($username,$profile_id,$timezone,$e_pu->cloud_id,$billing_cycle,$profile_name,(int)$ra->radacctid);
    			}
    		}
    	}
    	
    	if($type == 'voucher'){  	
    		$e_v = $this->{'Vouchers'}->find()->where(['Vouchers.name' => $ra->username])->first();
    		if($e_v){
    			if(isset($this->fupProfiles[$e_v->profile_id])){
    				$this->out("<info>Found FUP Profile for voucher</info>");
    				$timezone 	= $this->getTimezone($ra->nasidentifier);
    				$profile_id = $e_v->profile_id;
    				$username	= $ra->username;
                    $this->fup($username,$profile_id,$timezone,$e_v->cloud_id,false,'',(int)$ra->radacctid);
    			}
    		}
    	}
    	
    	if($type == 'device'){  	
    		$e_d = $this->{'Devices'}->find()->where(['Devices.name' => $ra->username])->first();
    		if($e_d){
    			if(isset($this->fupProfiles[$e_d->profile_id])){
    				$this->out("<info>Found FUP Profile for device</info>");
    				$timezone 	= $this->getTimezone($ra->nasidentifier);
    				$profile_id = $e_v->profile_id;
    				$username	= $ra->username;
    				//Need to find the Permanet User
    				$e_pu_d = $this->{'PermanentUsers'}->find()->where(['PermanentUsers.id' => $e_d->permanent_user_id])->first();
    				if($e_pu_d){
                        $this->fup($username,$profile_id,$timezone,$e_pu_d->cloud_id,false,'',(int)$ra->radacctid);
    				}
    			}
    		}
    	}    	    	     
    }
    
    private function findFupProfiles(){    
    	$e_p = $this->{'Profiles'}->find()->contain(['ProfileFupComponents'])->all();
    	foreach($e_p as $p){
    		if(count($p->profile_fup_components)> 0){
    			$this->fupProfiles[$p->id] = $p->profile_fup_components;
    		}    	
    	}    
    }
        
    private function find_type($username){
        $type = 'unknown';
        $q_r = $this->Radchecks->find()->where(['Radchecks.username' => $username,'Radchecks.attribute' => 'Rd-User-Type'])->first();
        if($q_r){
            $type = $q_r->value;
        }
        return $type;
    }
    
    private function getTimezone($nasid){
    
    	$timezone = $this->timezone;
   		$sql_dynamic = "SELECT IFNULL((SELECT tz.name FROM dynamic_clients c LEFT JOIN timezones tz ON tz.id = c.timezone where c.nasidentifier=:nasid),'timezone_not_found') as timezone";
   		$sql_system  = "SELECT IFNULL((SELECT tz.name FROM user_settings us LEFT JOIN timezones tz ON tz.id = us.value where us.name='timezone' AND us.user_id=-1 LIMIT 1),'timezone_not_found') as timezone" ; 
   		
   		$connection = ConnectionManager::get('default');          
      	$results = $connection
    		->execute($sql_dynamic , ['nasid' => $nasid])
    		->fetchAll('assoc');
    	if($results[0]['timezone']== 'timezone_not_found'){ 
    		$results_system = $connection
    			->execute($sql_system)
    			->fetchAll('assoc');    			
    		if($results_system[0]['timezone'] !== 'timezone_not_found'){ 
    			$timezone = $results_system[0]['timezone'];
    		}    	
    	}else{
       		$timezone = $results[0]['timezone'];
    	}    	
    	return $timezone;    
    }
    
    private function fup($username,$profile_id,$timezone,$cloud_id,$billing_cycle = false,$profile_name = '',$radacctid = null){
    
    	#Get the current active applied_fup_component for the user (Then compare it with the one which SHOULD apply)
    	#If different you then issue a disconnect request
    	$current_applied = 0; //Default is none applied (even if it might not be recorded)
    	$e_applied = $this->{'AppliedFupComponents'}->find()->where(['AppliedFupComponents.username' => $username])->first();
    	if($e_applied){
    		$current_applied = $e_applied->profile_fup_component_id;
    	}

		$should_apply 	= 0;
		$apply_record	= null;
		$limits			= [];
		$most_decrease 	= null;
		$least_increase = null;
  
    	foreach($this->fupProfiles[$profile_id] as $c){   	
    		if($c->if_condition == 'time_of_day'){
				$return_action = $this->check_time_of_day($c,$timezone);
				if($return_action == 'block'){
					$should_apply = $c->id;
					$apply_record = $c;
					break;				
				}
				if($return_action == 'limit'){				
					$limits[$c->id] = $c;
				}   		
    		}else{    		
    			#These are day_usage week_usage or month_usage limits
    			$return_usage = $this->check_usage($username,$c,$timezone,$billing_cycle);
    			if($return_usage == 'block'){
					$should_apply = $c->id;
					$apply_record = $c;
					break;				
				}
				if($return_usage == 'limit'){				
					$limits[$c->id] = $c;
				}     				    		
    		}   	
    	}
    	
    	if($should_apply !== 0){ //Should apply is set on a 'block' if it is set we dont have to worry about throttle calculations
    	
    		$this->out("<info>Block Active </info>");
    		
    	}else{	
			
			//Work out the biggest throttle value (if we are not blocking)  	
			foreach($limits as $val){				
				#Decrease Speed
		        if($most_decrease){
		            if($val->{'action'} == 'decrease_speed'){
		                if($val->{'action_amount'} >$most_decrease->{'action_amount'}){
		                    $most_decrease = $val;
		                } 
		            }
		        }else{
		            if($val->{'action'} == 'decrease_speed'){
		                $most_decrease = $val;
		            }
		        }

		        #Increase Speed
		        if($least_increase){
		            if($val->{'action'} == 'increase_speed'){
		                if($val->{'action_amount'} <$least_increase->{'action_amount'}){
		                    $least_increase = $val;
		                } 
		            }
		        }else{
		            if($val->{'action'} == 'increase_speed'){
		                $least_increase = $val;
		            }
		        }  	
			}		
		}
    	
		if($most_decrease){
        	$should_apply = $most_decrease->{'id'};
        	$apply_record = $most_decrease;
		}else{
		    if($least_increase){
		    	$should_apply = $least_increase->{'id'};
		    	$apply_record = $least_increase;    
		    }
		}

		$dispatch = $this->findTransitionDispatch((int)$cloud_id,(string)$username);
		if(FupTransitionPolicy::shouldReconcile($current_applied,$should_apply,$dispatch)){
			$this->reconcileTransitionDispatch((int)$cloud_id,(string)$username,$should_apply);
			$this->logTransitionAudit('reconciled',[
				'cloud_id' => (int)$cloud_id,
				'username' => (string)$username,
				'from_component_id' => (int)$current_applied,
				'to_component_id' => (int)$should_apply,
				'radacctid' => $radacctid,
			]);
		}

        if(FupTransitionPolicy::shouldDispatch($current_applied,$should_apply,$dispatch)){
            $e_cloud = $this->{'Clouds'}->find()->where(['Clouds.id' => $cloud_id])->first();
            if($e_cloud){
                $user_id = $e_cloud->user_id;
                $e_user = $this->{'Users'}->find()->where(['Users.id' => $user_id])->first();
                if($e_user){

                    $token = $e_user->token;
                    $url = 'http://127.0.0.1/cake4/rd_cake/radaccts/kick-active-username.json';
                    $request = ['cloud_id' => $cloud_id,'username' => $username,'token' => $token];
    					
    				//===================================================================	
    				//-------------------------------------------------------------------
    				//--- USE THIS BLOCK FOR CUSTOM SETUPS e.g. where you have ----------
    				//--- Two different URLs to call when blocking vs decreasing speed --
    				//--- Also when you need another URL to call when you restore things-
    				//--- e.g. remove a limit -------------------------------------------
    				//-------------------------------------------------------------------		
    			   			
    				if($should_apply !== 0){
    				
    					$ip_pool = $apply_record->ip_pool;
    				
						if($apply_record->action == 'block'){
							$this->out("<info>Action is to BLOCK</info>");
						}
						
						if($apply_record->action == 'increase_speed'){
							$this->out("<info>Action is to INCREASE SPEED $ip_pool</info>");
						}
						
						if($apply_record->action == 'decrease_speed'){
							$this->out("<info>Action is to DECREASE SPEED $ip_pool</info>");
						}
						
					}else{
						$this->out("<info>NO LIMIT TO APPLY $profile_name</info>");
									
					}
					    			
    				//---------------------------------------------------------------------
    				//=====================================================================
    			   			 				
					// Persist before the call: an interrupted process must not create a kick loop.
					$this->reserveTransitionDispatch((int)$cloud_id,(string)$username,$current_applied,$should_apply,$radacctid);
					$this->logTransitionAudit('dispatch_pending',[
						'cloud_id' => (int)$cloud_id,
						'username' => (string)$username,
						'from_component_id' => (int)$current_applied,
						'to_component_id' => (int)$should_apply,
						'radacctid' => $radacctid,
					]);

					$result = $this->requestTransitionKick($url,$request);
					$status = $result['ack'] ? 'ack' : 'failed';
					$this->completeTransitionDispatch((int)$cloud_id,(string)$username,$status,$result['error']);
                    $this->logTransitionAudit($status,[
						'cloud_id' => (int)$cloud_id,
						'username' => (string)$username,
						'from_component_id' => (int)$current_applied,
						'to_component_id' => (int)$should_apply,
						'radacctid' => $radacctid,
						'http_code' => $result['http_code'],
						'result_count' => $result['result_count'],
						'error' => $result['error'],
                    ]);
                }
            }
        }
    }

    private function findTransitionDispatch($cloudId,$username){
        $connection = ConnectionManager::get('default');
        $row = $connection->execute(
            'SELECT from_component_id,to_component_id,status FROM fup_transition_dispatches WHERE cloud_id=:cloud_id AND username=:username LIMIT 1',
            ['cloud_id' => $cloudId,'username' => $username]
        )->fetch('assoc');
        return $row ?: null;
    }

    private function reserveTransitionDispatch($cloudId,$username,$fromComponentId,$toComponentId,$radacctid){
        $connection = ConnectionManager::get('default');
        $connection->execute(
            "INSERT INTO fup_transition_dispatches (cloud_id,username,from_component_id,to_component_id,radacctid,status,dispatched_at,created,modified)
             VALUES (:cloud_id,:username,:from_component_id,:to_component_id,:radacctid,'pending',NOW(),NOW(),NOW())
             ON DUPLICATE KEY UPDATE from_component_id=VALUES(from_component_id),to_component_id=VALUES(to_component_id),radacctid=VALUES(radacctid),status='pending',dispatched_at=NOW(),acknowledged_at=NULL,reconciled_at=NULL,last_error=NULL,modified=NOW()",
            ['cloud_id' => $cloudId,'username' => $username,'from_component_id' => $fromComponentId,'to_component_id' => $toComponentId,'radacctid' => $radacctid]
        );
    }

    private function completeTransitionDispatch($cloudId,$username,$status,$error){
        $connection = ConnectionManager::get('default');
        $connection->execute(
            "UPDATE fup_transition_dispatches
             SET status=:status, acknowledged_at=IF(:status = 'ack',NOW(),NULL), last_error=:last_error, modified=NOW()
             WHERE cloud_id=:cloud_id AND username=:username",
            ['status' => $status,'last_error' => $error,'cloud_id' => $cloudId,'username' => $username]
        );
    }

    private function reconcileTransitionDispatch($cloudId,$username,$componentId){
        $connection = ConnectionManager::get('default');
        $connection->execute(
            "UPDATE fup_transition_dispatches
             SET status='reconciled', reconciled_at=NOW(), modified=NOW()
             WHERE cloud_id=:cloud_id AND username=:username AND to_component_id=:component_id AND status <> 'reconciled'",
            ['cloud_id' => $cloudId,'username' => $username,'component_id' => $componentId]
        );
    }

    private function requestTransitionKick($url,$request){
        try {
            $http = new Client();
            $response = $http->get($url,$request,['type' => 'json']);
            $httpCode = $response->getStatusCode();
            $payload = json_decode($response->getStringBody(),true);
            $results = is_array($payload['results'] ?? null) ? $payload['results'] : [];
            $ack = $httpCode >= 200 && $httpCode < 300 && ($payload['success'] ?? false) === true && count($results) > 0;
            foreach($results as $result){
                $strategy = $result['strategy'] ?? null;
                // Omada and RouterOS are queried after the removal, so FUP advances
                // only when the session disappearance has been confirmed.
                $requiresVerifiedAck = in_array($strategy,['omada-openapi-v1','mikrotik-api'],true);
                $accepted = $requiresVerifiedAck
                    ? (($result['status'] ?? null) === 'ack' && ($result['ack'] ?? false) === true)
                    : in_array(($result['status'] ?? null),['ack','sent'],true);
                if(!$accepted){
                    $ack = false;
                    break;
                }
            }
            return [
                'ack' => $ack,
                'http_code' => $httpCode,
                'result_count' => count($results),
                'error' => $ack ? null : 'kick_not_acknowledged',
            ];
        } catch (\Throwable $exception) {
            return [
                'ack' => false,
                'http_code' => null,
                'result_count' => 0,
                'error' => substr($exception->getMessage(),0,255),
            ];
        }
    }

    private function logTransitionAudit($event,$details){
        $payload = array_merge(['timestamp' => gmdate('c'),'event' => $event],$details);
        Log::info('[FupTransitionAudit] '.json_encode($payload,JSON_UNESCAPED_SLASHES));
    }
    
    private function check_time_of_day($row,$timezone) {
    
    	$dt  		= new FrozenTime();
    	$dt			= $dt->setTimezone($timezone);
    	
    	$dt_start  	= new FrozenTime();
    	$dt_start  	= $dt_start->setTimezone($timezone);
    	
    	$dt_end  	= new FrozenTime();
    	$dt_end  	= $dt_end->setTimezone($timezone);
    	
    	$time_start = explode(':', $row->time_start);
    	$dt_start   = $dt_start->hour($time_start[0])->minute($time_start[1])->second(00);

		$time_end 	= explode(':', $row->time_end);
		$dt_end     = $dt_end->hour($time_end[0])->minute($time_end[1])->second(00);

		//$this->out("<info>".$dt_start->nice()."</info>");
		//$this->out("<info>".$dt->nice()."</info>");
		//$this->out("<info>".$dt_end->nice()."</info>");
		if(($dt >= $dt_start)&&($dt <= $dt_end)){
			if($row->{'action'} == 'block'){
				//$this->out("<info>BLOCK</info>");
				return 'block';
			}else{
				//$this->out("<info>LIMIT</info>");			
				return 'limit';
			}
		}
		return 'noop';
	}
	
	private function check_usage($username,$row,$timezone, $billing_cycle=false){

    	$time_start = $this->get_start_of($row->{'if_condition'},$timezone,$billing_cycle);
    	$nice = $time_start->toIso8601String();
    	$this->out("<info>TIME START $nice </info>");
    	$sql_usage 	= "SELECT IFNULL(SUM(acctinputoctets)+SUM(acctoutputoctets),0) AS data_used FROM user_stats WHERE username=:username AND timestamp >=:timestamp";
    	$connection = ConnectionManager::get('default');          
      	$results = $connection
    		->execute($sql_usage , ['username' => $username,'timestamp' => $nice])
    		->fetchAll('assoc');
    	$data_used 	= $results[0]['data_used'];
    	$this->out("<info>DATA USED $data_used</info>");
   		$trigger  	= $row->{'data_amount'};
		if($row->{'data_unit'} == 'mb'){
		    $trigger = $trigger * 1024 * 1024;
		}
		if($row->{'data_unit'} == 'gb'){
		    $trigger = $trigger * 1024 * 1024 * 1024;
		}

		if($data_used > $trigger){
		    if($row->{'action'} == 'block'){
		        return 'block';
		    }
		    return 'limit';
		}
    	return 'noop';  
	}

	private function get_start_of($when,$timezone, $billing_cycle=false){
		#'day_usage' is default of current day
		$dt = new FrozenTime();
    	$dt = $dt->setTimezone($timezone);
    	$dt = $dt->hour(00)->minute(00)->second(00);
		if($when == 'week_usage'){
		    $dt = $dt->startOfWeek();
		}

		if($when == 'month_usage'){
			if($billing_cycle){
				$dt = $this->findBillingCycleStart($timezone,$billing_cycle);	
			}else{
		    	$dt = $dt->startOfMonth();
		   	}
		}		
		return $dt;
	}
	
	private function findBillingCycleStart($timezone,$bc_day){

    	$dt 		= new FrozenTime();
    	$dt 		= $dt->setTimezone($timezone);
    	$day_now 	= $dt->day;
    	
    	if(($bc_day > $day_now)&&($day_now < 28)){
    		$bc_start = $dt->subMonth(1);
			$bc_start = $bc_start->setDateTime($bc_start->year,$bc_start->month,$bc_day,0,0,0);   		
    	}else{
    		if($day_now > 28){ //Roll over to next month after 28th (29,30,31 will use this)
    			$bc_start = $dt->setDateTime($dt->year,$dt->month,29,0,0,0);	
    		}else{
    			$bc_start = $dt->setDateTime($dt->year,$dt->month,$bc_day,0,0,0);
    		}
    	}
    	//$this->out("<info>Billing Cycle Start Time IS $bc_start</info>");   	
    	return $bc_start;  
    }
	     		
}

?>
