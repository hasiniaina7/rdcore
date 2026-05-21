<?php
//----------------------------------------------------------
//---- Author: Dirk van der Walt
//---- License: GPL v3
//---- Description: 
//---- Date: 29-05-2013
//------------------------------------------------------------

namespace App\Controller\Component;

use App\Service\OmadaApiClient;
use App\Service\OmadaApiSettingsService;
use Cake\Controller\Component;
use Cake\Core\Configure;
use Cake\Log\Log;
use Cake\ORM\TableRegistry;
use Cake\Http\Client;


class KickerComponent extends Component {

    protected $radclient = 'radclient';
    protected $coaSecret = 'testing123';
    protected $coaPort = 3799;
    protected $radclientTimeout = 8;
    protected bool $omadaCoaFallbackEnabled = false;
    //protected $pod_command = '/etc/MESHdesk/pod.lua';
    protected $pod_command 	= 'chilli_query logout mac';
    protected $podMdHostapd = '/etc/MESHdesk/utils/hostapd_disconnect.lua';
    
    //--NAS TYPES--
    protected   $typeAccel      = 'AccelRadiusdesk';
    protected	$typeCoovaMd 	= 'CoovaMeshdesk';
    protected	$typeHostaMd 	= 'private_psk';
    protected   $typeJuniper    = 'Juniper';
    protected	$typeMtApi 	    = 'Mikrotik-API';


    
    protected	$node_action_add = 'http://127.0.0.1/cake4/rd_cake/node-actions/add.json';
    protected	$ap_action_add = 'http://127.0.0.1/cake4/rd_cake/ap-actions/add.json';
    
   	protected $components = ['MikrotikApi'];
    
    public function initialize(array $config):void{
        //Please Note that we assume the Controller has a JsonErrors Component Included which we can access.
        $this->DynamicClients           = TableRegistry::get('DynamicClients');
        $this->DynamicClientSettings    = TableRegistry::get('DynamicClientSettings');
        $this->Nas           			= TableRegistry::get('Nas');
        $this->NaSettings               = TableRegistry::get('NaSettings');
        $this->MeshExitCaptivePortals   = TableRegistry::get('MeshExitCaptivePortals'); 
        $this->MeshExits                = TableRegistry::get('MeshExits'); 
        $this->Nodes                    = TableRegistry::get('Nodes');
        $this->NodeActions              = TableRegistry::get('NodeActions');     
        //Accel
        $this->AccelServers             = TableRegistry::get('AccelServers');
        $this->AccelSessions            = TableRegistry::get('AccelSessions');

        $this->radclient = (string)(Configure::read('RadiusDesk.radclient_bin') ?? $this->radclient);
        $this->coaPort = (int)(Configure::read('RadiusDesk.coa_port') ?? $this->coaPort);
        Configure::load('Omada', 'default');
        $this->omadaCoaFallbackEnabled = (bool)(Configure::read('OmadaOpenApi.enable_coa_fallback') ?? false);
    }

    public function kick($ent,$token){
        if(!$ent){
            return [
                'strategy'   => 'none',
                'status'     => 'error',
                'ack'        => false,
                'stderr'     => 'Missing accounting entity',
                'radacctid'  => null
            ];
        }

        //---Location of radclient----
        $nasidentifier  = $ent->nasidentifier;
        $radacctid      = $ent->radacctid;
        $nasipaddress   = $ent->nasipaddress;
        $result = [
            'strategy'       => 'none',
            'status'         => 'not_supported',
            'ack'            => false,
            'stderr'         => null,
            'radacctid'      => $radacctid,
            'nasidentifier'  => $nasidentifier,
            'nasipaddress'   => $nasipaddress,
        ];

        if($this->isOmadaNas($ent)){
            return $this->kickOmadaSession($ent, 'nasidentifier');
        }
                
     	//First we try to locate the client under dynamic_clients
     	$dc = $this->DynamicClients->find()
     		->where(['DynamicClients.nasidentifier' => $nasidentifier])
     		->contain(['DynamicClientSettings'])
     		->first();
     		
     	if($dc){
            if($this->isOmadaDynamicClient($dc, $ent)){
                return $this->kickOmadaSession($ent, 'dynamic-client');
            }
     	   	    
     	    if($dc->type == $this->typeAccel){ //It is type AccelRadiusdesk -> try to locate the session and set the disconnect flag of the session
     	        $this->kickAccelSession($ent);
                return [
                    'strategy'       => 'accel-flag',
                    'status'         => 'sent',
                    'ack'            => false,
                    'stderr'         => null,
                    'radacctid'      => $radacctid,
                    'nasidentifier'  => $nasidentifier,
                    'nasipaddress'   => $nasipaddress,
                ];
     	    }
     	
     	    //--------------------
     		if($dc->type == $this->typeCoovaMd){ //It is type CoovaMeshdesk => Now try and locate AP to send command to 
     		
     			//We have a convention of nasidentifier for meshdesk => mcp_<captive_portal_id> and apdesk => ap_<ap id>_cp_<captive_portal_id>
     			if(preg_match('/^mcp_/' ,$nasidentifier)){ //MESHdesk     		
     				$this->kickMeshNodeUser($ent,$dc->cloud_id,$token);
     			}
     			
     			if(preg_match('/^ap_/' ,$nasidentifier)){ //APdesk		
     				$this->kickApUser($ent,$dc->cloud_id,$token); 			
     			}
     			sleep(1); //Give MQTT time to do its thing....  			
                return [
                    'strategy'       => 'coova-command',
                    'status'         => 'sent',
                    'ack'            => false,
                    'stderr'         => null,
                    'radacctid'      => $radacctid,
                    'nasidentifier'  => $nasidentifier,
                    'nasipaddress'   => $nasipaddress,
                ];
     		}
     		
     		//-------------------
     		if($dc->type == $this->typeHostaMd){
     		
     		    //MESHdesk / AP Profile **(m/a)** _ **id** _ **entry_id** _ **radio_number** _ **node id / ap id** 
     		    $o = $ent->operator_name;
     		
     			if(preg_match('/^m_hosta_/' ,$o)){ //MESHdesk     		
     				$this->kickMeshHostaMac($ent,$dc->cloud_id,$token);
     			}
     			
     			if(preg_match('/^a_hosta_/' ,$o)){ //APdesk		
     				$this->kickApHostaMac($ent,$dc->cloud_id,$token); 			
     			}
     			sleep(1); //Give MQTT time to do its thing....    		
                return [
                    'strategy'       => 'hostapd-command',
                    'status'         => 'sent',
                    'ack'            => false,
                    'stderr'         => null,
                    'radacctid'      => $radacctid,
                    'nasidentifier'  => $nasidentifier,
                    'nasipaddress'   => $nasipaddress,
                ];
     		}
     	
     		
     		if($dc->type == $this->typeJuniper){ //SEND IT A POD
     	        return $this->kickJuniperSession($ent);
     	    }
     		    		
     		if($dc->type == $this->typeMtApi){ 
     		
     			//We need to determine the API Connection details    		
     			$mt_data = [];
     			foreach($dc->dynamic_client_settings as $s){ 
					if(preg_match('/^mt_/',$s->name)){
						$name = preg_replace('/^mt_/','',$s->name);
						$value= $s->value;
						if($name == 'port'){
							$value = intval($value); //Requires integer 	
						}
						$mt_data[$name] = $value;				
					}			        
				}
				
				if($mt_data['proto'] == 'https'){
					$mt_data['ssl'] = true;
					if($mt_data['port'] ==8728){
						//Change it to Default SSL port 8729
						$mt_data['port'] = 8729;
					}
				}         
				unset($mt_data['proto']); 
				$this->MikrotikApi->kickRadius($ent,$mt_data);
                return [
                    'strategy'       => 'mikrotik-api',
                    'status'         => 'sent',
                    'ack'            => false,
                    'stderr'         => null,
                    'radacctid'      => $radacctid,
                    'nasidentifier'  => $nasidentifier,
                    'nasipaddress'   => $nasipaddress,
                ];
     		}     		  		   	
     	}
     	
     	//-- Try the NAS table ----
     	$nas = $this->Nas->find()
     		->where(['OR' => ['Nas.nasidentifier' => $nasidentifier,'Nas.nasname' => $nasipaddress]])
     		->contain(['NaSettings'])
     		->first();
     		
        if($nas){
            if($this->isOmadaNas($nas)){
                return $this->kickOmadaSession($ent, 'nas-table');
            }
        
            if($nas->type == $this->typeJuniper){ //SEND IT A POD
     	        return $this->kickJuniperSession($ent);
     	    }
     	    
     	    if($nas->type == $this->typeMtApi){ 
     		
     			//We need to determine the API Connection details    		
     			$mt_data = [];
     			foreach($nas->na_settings as $s){ 
					if(preg_match('/^mt_/',$s->name)){
						$name = preg_replace('/^mt_/','',$s->name);
						$value= $s->value;
						if($name == 'port'){
							$value = intval($value); //Requires integer 	
						}
						$mt_data[$name] = $value;				
					}			        
				}
				
				if($mt_data['proto'] == 'https'){
					$mt_data['ssl'] = true;
					if($mt_data['port'] ==8728){
						//Change it to Default SSL port 8729
						$mt_data['port'] = 8729;
					}
				}         
				unset($mt_data['proto']); 
				$this->MikrotikApi->kickRadius($ent,$mt_data);
                return [
                    'strategy'       => 'mikrotik-api',
                    'status'         => 'sent',
                    'ack'            => false,
                    'stderr'         => null,
                    'radacctid'      => $radacctid,
                    'nasidentifier'  => $nasidentifier,
                    'nasipaddress'   => $nasipaddress,
                ];
     		}
     	        
        }
        //--- END NAS TABLE ---
             
        return $result;       
    }
    
    private function kickAccelSession($ent){
    
        $sid    = $ent->acctsessionid;    
        $e_srv  = $this->{'AccelSessions'}->find()->where(['AccelSessions.sid' => $sid])->first(); //Short and sweet :-)
        if($e_srv){
            $e_srv->disconnect_flag = 1;
            $e_srv->setDirty('modified', true);
            $this->{'AccelSessions'}->save($e_srv);
        }    
    }
    
    private function kickJuniperSession($ent){  
        $attributes = [
            'Acct-Session-Id' => (string)$ent->acctsessionid,
            'User-Name'       => (string)$ent->username,
            'NAS-IP-Address'  => (string)$ent->nasipaddress
        ];
        return $this->sendRadclientDisconnect(
            (string)$ent->nasipaddress,
            $attributes,
            $this->coaSecret,
            'juniper_disconnect'
        );
    } 
         
    private function kickMeshNodeUser($ent,$cloud_id,$token){      
  		$cp = $this->MeshExitCaptivePortals->find()->where(['MeshExitCaptivePortals.radius_nasid' => $ent->nasidentifier])->first();            
        if($cp){
            $exit_id = $cp->mesh_exit_id;
            $exit = $this->MeshExits->find()->where(['MeshExits.id' => $exit_id])->first();
            if($exit){
                $mesh_id    = $exit->mesh_id;
                $gw_nodes   = $this->Nodes->find()->where(['Nodes.gateway !=' => 'none','Nodes.mesh_id' => $mesh_id])->all();
                foreach($gw_nodes as $node){
                    $node_id 	= $node->id;
                    $command 	= $this->pod_command.' '.$ent->callingstationid;
                    $a_data 	= [
                    	'node_id' 	=> $node_id,
                    	'command' 	=> $command, 
                    	'action'	=> 'execute',
						'cloud_id'	=> $cloud_id,
						'token'		=> $token,
						'sel_language'	=> '4_4'
                  	];                  	
                  	$http 		= new Client();
					$response 	= $http->post(
					  $this->node_action_add,
					  json_encode($a_data),
					  ['type' => 'json']
					);                  	                   
                }
            }              
        }       
    }
    
    private function kickApUser($ent,$cloud_id,$token){  
    	//The nasidentifier will be in the format of ap_<ap id>_cp_<cp number>
    	//We just care about the ap id since we will send the logout command to that ap
    	$command 	= $this->pod_command.' '.$ent->callingstationid;
    	$nasid		= $ent->nasidentifier;
    	//remove the _cp_<number>
    	$ap_id      = preg_replace("/_cp_.*/",'', $nasid);
    	//remove the ap_
    	$ap_id      = preg_replace("/^ap_/",'', $ap_id);
    	if($ap_id){
    		$command 	= $this->pod_command.' '.$ent->callingstationid;
            $a_data 	= [
            	'ap_id' 	=> $ap_id,
            	'command' 	=> $command, 
            	'action'	=> 'execute',
				'cloud_id'	=> $cloud_id,
				'token'		=> $token,
				'sel_language'	=> '4_4'
          	];                  	
          	$http 		= new Client();
			$response 	= $http->post(
			  $this->ap_action_add,
			  json_encode($a_data),
			  ['type' => 'json']
			);   	
    	}      
    }
    
    //--- HOSTAPD ----
    //---ubus call hostapd.three1 del_client "{'addr':'0c:c6:fd:7b:8b:aa', 'reason':5, 'deauth':true, 'ban_time':0}"
    //---
    private function kickMeshHostaMac($ent,$cloud_id,$token){
        //m_ <id> _ <entry_id> _ <radio_number> _ <node id>
        $node_id  = preg_replace("/^m_hosta_(\d+)_(\d+)_(\d+)_/",'', $ent->operator_name);
        $entry_id = preg_replace("/^m_hosta_(\d+)_/",'', $ent->operator_name); 
        $entry_id = preg_replace("/_(\d+)_(\d+)/",'', $entry_id);    
        
        if($node_id){
    		$command 	= $this->podMdHostapd.' '.$ent->callingstationid.' '.$entry_id;
            $a_data 	= [
            	'node_id' 	=> $node_id,
            	'command' 	=> $command, 
            	'action'	=> 'execute',
				'cloud_id'	=> $cloud_id,
				'token'		=> $token,
				'sel_language'	=> '4_4'
          	];                  	
          	$http 		= new Client();
			$response 	= $http->post(
			  $this->node_action_add,
			  json_encode($a_data),
			  ['type' => 'json']
			);   	
    	}   
    }
        
    private function kickApHostaMac($ent,$cloud_id,$token){
        //a_ <id> _ <entry_id> _ <radio_number> _ <ap id>
        $ap_id   = preg_replace("/^a_hosta_(\d+)_(\d+)_(\d+)_/",'', $ent->operator_name);
        $entry_id = preg_replace("/^a_hosta_(\d+)_/",'', $ent->operator_name); 
        $entry_id = preg_replace("/_(\d+)_(\d+)/",'', $entry_id);      
        if($ap_id){
    		$command 	= $this->podMdHostapd.' '.$ent->callingstationid.' '.$entry_id;
            $a_data 	= [
            	'ap_id' 	=> $ap_id,
            	'command' 	=> $command, 
            	'action'	=> 'execute',
				'cloud_id'	=> $cloud_id,
				'token'		=> $token,
				'sel_language'	=> '4_4'
          	];                  	
          	$http 		= new Client();
			$response 	= $http->post(
			  $this->ap_action_add,
			  json_encode($a_data),
			  ['type' => 'json']
			);   	
    	}   
    }

    public function isOmadaNas($nas): bool
    {
        $identifier = (string)($nas->nasidentifier ?? '');
        $type = (string)($nas->type ?? '');
        $name = (string)($nas->nasname ?? '');

        return $this->isOmadaIdentifier($identifier)
            || $this->isOmadaIdentifier($name)
            || stripos($type, 'omada') !== false;
    }

    public function isOmadaDynamicClient($dc, $ent = null): bool
    {
        $type = (string)($dc->type ?? '');
        $identifier = (string)($dc->nasidentifier ?? '');
        if (stripos($type, 'omada') !== false || $this->isOmadaIdentifier($identifier)) {
            return true;
        }

        if ($ent) {
            return $this->isOmadaNas($ent);
        }

        return false;
    }

    public function buildOmadaDisconnectAttributes($ent): array
    {
        $attributes = [
            'User-Name'          => (string)($ent->username ?? ''),
            'Calling-Station-Id' => (string)($ent->callingstationid ?? ''),
            'Acct-Session-Id'    => (string)($ent->acctsessionid ?? ''),
        ];

        $nasPort = $ent->nasportid ?? $ent->nasport ?? null;
        if ($nasPort !== null && $nasPort !== '') {
            $attributes['NAS-Port'] = (string)$nasPort;
        }

        return $attributes;
    }

    public function parseDisconnectResult(string $stdout, int $exitCode): array
    {
        $status = 'stderr';
        $ack = false;

        if (stripos($stdout, 'Disconnect-ACK') !== false) {
            $status = 'ack';
            $ack = true;
        } elseif (stripos($stdout, 'Disconnect-NAK') !== false) {
            $status = 'nak';
        } elseif (
            $exitCode === 124
            || stripos($stdout, 'No reply from server') !== false
            || stripos($stdout, 'no response') !== false
            || stripos($stdout, 'timed out') !== false
        ) {
            $status = 'timeout';
        }

        return [
            'status' => $status,
            'ack'    => $ack
        ];
    }

    private function kickOmadaSession($ent, string $route): array
    {
        $apiResult = $this->kickOmadaSessionViaApi($ent, $route);
        if ($apiResult !== null) {
            return $apiResult;
        }

        if (!$this->omadaCoaFallbackEnabled) {
            return [
                'strategy' => 'omada-openapi-v1',
                'status' => 'api_error',
                'ack' => false,
                'stderr' => 'Omada API configuration missing or disabled',
                'radacctid' => $ent->radacctid ?? null,
                'nasidentifier' => $ent->nasidentifier ?? null,
                'nasipaddress' => $ent->nasipaddress ?? null,
                'route' => $route,
                'omada' => [
                    'endpoint' => null,
                    'http_code' => null,
                    'correlation' => null,
                ],
            ];
        }

        $nasIp = (string)($ent->nasipaddress ?? '');
        $attributes = $this->buildOmadaDisconnectAttributes($ent);
        $result = $this->sendRadclientDisconnect($nasIp, $attributes, $this->coaSecret, 'omada_disconnect_coa_fallback');
        $legacyStatus = (string)($result['status'] ?? 'stderr');
        if ($legacyStatus === 'ack') {
            $result['status'] = 'ack';
        } elseif ($legacyStatus === 'timeout') {
            $result['status'] = 'timeout';
        } else {
            $result['status'] = 'api_error';
        }
        $result['route'] = $route;
        $result['request'] = [
            'target' => "{$nasIp}:{$this->coaPort}",
            'attributes' => $attributes
        ];
        $result['omada'] = [
            'fallback' => 'coa',
            'endpoint' => null,
            'http_code' => null,
            'correlation' => null,
        ];

        return $result;
    }

    protected function kickOmadaSessionViaApi($ent, string $route): ?array
    {
        $settings = $this->resolveOmadaApiSettings();
        if ($settings === null) {
            return null;
        }

        if (empty($settings['base_url']) || empty($settings['omadac_id']) || empty($settings['site_id'])) {
            return [
                'strategy' => 'omada-openapi-v1',
                'status' => 'api_error',
                'ack' => false,
                'stderr' => 'Omada API configuration incomplete (base_url/omadac_id/site_id)',
                'radacctid' => $ent->radacctid ?? null,
                'nasidentifier' => $ent->nasidentifier ?? null,
                'nasipaddress' => $ent->nasipaddress ?? null,
                'route' => $route,
                'omada' => [
                    'endpoint' => null,
                    'http_code' => null,
                    'correlation' => null,
                ],
            ];
        }

        $ctx = [
            'client_mac' => (string)($ent->callingstationid ?? ''),
            'username' => (string)($ent->username ?? ''),
            'acct_session_id' => (string)($ent->acctsessionid ?? ''),
        ];

        $client = $this->buildOmadaApiClient($settings);
        $result = $client->disconnectWithFallback($ctx);
        $status = (string)($result['status'] ?? 'api_error');

        $kick = [
            'strategy' => 'omada-openapi-v1',
            'status' => $status,
            'ack' => ((bool)($result['ack'] ?? false) || $status === 'ack'),
            'stderr' => $status === 'ack' ? null : (string)($result['error'] ?? 'Omada API request failed'),
            'radacctid' => $ent->radacctid ?? null,
            'nasidentifier' => $ent->nasidentifier ?? null,
            'nasipaddress' => $ent->nasipaddress ?? null,
            'latency_ms' => (int)($result['latency_ms'] ?? 0),
            'route' => $route,
            'omada' => [
                'endpoint' => $result['endpoint'] ?? null,
                'http_code' => $result['http_code'] ?? null,
                'correlation' => $result['correlation'] ?? null,
                'source' => $settings['source'] ?? 'unknown',
            ],
        ];

        $this->logOmadaKickAudit($kick, $ent);

        return $kick;
    }

    protected function resolveOmadaApiSettings(): ?array
    {
        $service = new OmadaApiSettingsService();
        return $service->getActiveConfig();
    }

    protected function buildOmadaApiClient(array $settings): OmadaApiClient
    {
        return new OmadaApiClient($settings);
    }

    protected function logOmadaKickAudit(array $kick, $ent): void
    {
        $payload = [
            'timestamp' => gmdate('c'),
            'radacctid' => (int)($ent->radacctid ?? 0),
            'username' => (string)($ent->username ?? ''),
            'status' => (string)($kick['status'] ?? 'api_error'),
            'strategy' => (string)($kick['strategy'] ?? 'omada-openapi-v1'),
            'endpoint' => $kick['omada']['endpoint'] ?? null,
            'http_code' => $kick['omada']['http_code'] ?? null,
            'latency_ms' => (int)($kick['latency_ms'] ?? 0),
            'correlation' => $kick['omada']['correlation'] ?? null,
        ];
        Log::info('[KickAudit] ' . json_encode($payload, JSON_UNESCAPED_SLASHES));
    }

    protected function sendRadclientDisconnect(string $nasIp, array $attributes, string $secret, string $strategy): array
    {
        $base = [
            'strategy'      => $strategy,
            'status'        => 'error',
            'ack'           => false,
            'stderr'        => null,
            'nasipaddress'  => $nasIp,
            'port'          => $this->coaPort,
        ];

        if ($nasIp === '') {
            $base['stderr'] = 'Missing NAS IP';
            return $base;
        }

        $payload = $this->buildRadclientPayload($attributes);
        if ($payload === '') {
            $base['stderr'] = 'Missing disconnect attributes';
            return $base;
        }

        $tmp = tempnam(sys_get_temp_dir(), 'rd-coa-');
        if ($tmp === false) {
            $base['stderr'] = 'Unable to create temporary request file';
            return $base;
        }

        $start = microtime(true);
        $output = '';
        $exitCode = 1;

        try {
            file_put_contents($tmp, $payload . PHP_EOL);
            $target = $nasIp . ':' . $this->coaPort;
            $command = sprintf(
                'timeout %d %s -x -r 1 -t 3 %s disconnect %s < %s 2>&1',
                $this->radclientTimeout,
                escapeshellcmd($this->radclient),
                escapeshellarg($target),
                escapeshellarg($secret),
                escapeshellarg($tmp)
            );

            $lines = [];
            exec($command, $lines, $exitCode);
            $output = trim(implode("\n", $lines));
        } finally {
            @unlink($tmp);
        }

        $parsed = $this->parseDisconnectResult($output, $exitCode);
        $latencyMs = (int)round((microtime(true) - $start) * 1000);

        $audit = [
            'timestamp'    => gmdate('c'),
            'nas_target'   => $nasIp . ':' . $this->coaPort,
            'session_id'   => (string)($attributes['Acct-Session-Id'] ?? ''),
            'username'     => (string)($attributes['User-Name'] ?? ''),
            'status'       => $parsed['status'],
            'latency_ms'   => $latencyMs,
            'exit_code'    => $exitCode,
        ];
        Log::info('[KickAudit] ' . json_encode($audit, JSON_UNESCAPED_SLASHES));

        return [
            'strategy'      => $strategy,
            'status'        => $parsed['status'],
            'ack'           => $parsed['ack'],
            'stderr'        => ($parsed['status'] === 'stderr' || $parsed['status'] === 'timeout' || $parsed['status'] === 'nak')
                ? $output
                : null,
            'stdout'        => $output,
            'nasipaddress'  => $nasIp,
            'port'          => $this->coaPort,
            'latency_ms'    => $latencyMs,
            'exit_code'     => $exitCode,
        ];
    }

    protected function buildRadclientPayload(array $attributes): string
    {
        $lines = [];
        foreach ($attributes as $key => $value) {
            if ($value === null || $value === '') {
                continue;
            }
            if ($key === 'NAS-Port' && is_numeric($value)) {
                $lines[] = $key . ' = ' . (int)$value;
                continue;
            }
            $escaped = str_replace(['\\', '"'], ['\\\\', '\"'], (string)$value);
            $lines[] = $key . ' = "' . $escaped . '"';
        }

        $lines[] = 'Message-Authenticator = 0x00';
        return implode(PHP_EOL, $lines);
    }

    private function isOmadaIdentifier(string $value): bool
    {
        if ($value === '') {
            return false;
        }

        return stripos($value, 'tp-link') !== false
            || stripos($value, 'omada') !== false
            || stripos($value, 'tplink') !== false;
    }

}
