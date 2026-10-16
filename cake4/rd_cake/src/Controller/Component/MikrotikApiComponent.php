<?php
//----------------------------------------------------------
//---- Author: Dirk van der Walt
//---- License: GPL v3
//---- Description: A component interacts with the Mikrotik Router using the API
//---- Date: 05-Dec-2022
//------------------------------------------------------------

namespace App\Controller\Component;
use Cake\Controller\Component;

use \RouterOS\Client;
use \RouterOS\Query;

class MikrotikApiComponent extends Component {

    public function test($config){    
    	$client 	= new Client($config);		
		$query 		= new Query('/system/resource/print');
		$response 	= $client->query($query)->read();
		return $response[0];  
    }
    
    public function kickPppoeId($config,$id){
    	$client 	= new Client($config);
    	$q  = new Query('/ppp/active/remove');
		$q->equal('.id', $id);
		$r  = $client->query($q)->read(); 
    }
    
    public function kickHotspotId($config,$id){
    	$client 	= new Client($config);
    	$q  = new Query('/ip/hotspot/active/remove');
		$q->equal('.id', $id);
		$r  = $client->query($q)->read(); 
    }
    
    public function kickRadius($ent,$config){
	$client 	= new Client($config);

	// Correlate the accounting row with the RouterOS active-session table.
	$called_station_id 	= $ent->calledstationid;
	$mac_minus			= $ent->callingstationid;
	$mac_colon			= str_replace("-",":",$mac_minus);
	$servicetype		= $ent->servicetype;
	$framedprotocol		= $ent->framedprotocol;

	if(($servicetype == 'Framed-User' )&&($framedprotocol == 'PPP' )){
		return $this->removeAndVerifyRadiusSessions(
			$client,
			'/ppp/active/print',
			'/ppp/active/remove',
			'caller-id',
			$mac_colon,
			'pppoe'
		);
	}

	// The hotspot called-station identifier is the reliable discriminator.
	if(preg_match('/^hotspot/',$called_station_id)){
		return $this->removeAndVerifyRadiusSessions(
			$client,
			'/ip/hotspot/active/print',
			'/ip/hotspot/active/remove',
			'mac-address',
			$mac_colon,
			'hotspot'
		);
	}

    return [
		'status' => 'not_applicable',
		'ack' => false,
		'matched' => 0,
		'removed' => 0,
		'error' => 'unsupported_radius_session_type',
    ];
    }

    /**
     * Re-apply RADIUS rate attributes without using the Hotspot active-session
     * kick. RouterOS immediately recreates a removed Hotspot host, which makes
     * the client re-authenticate without returning to the captive portal.
     */
    public function refreshRadius($ent,$config){
	$client 	= new Client($config);

	$called_station_id 	= (string)$ent->calledstationid;
	$mac_minus			= (string)$ent->callingstationid;
	$mac_colon			= str_replace('-',':',$mac_minus);
	$servicetype		= (string)$ent->servicetype;
	$framedprotocol		= (string)$ent->framedprotocol;
	$username			= (string)$ent->username;

	if(($servicetype === 'Framed-User') && ($framedprotocol === 'PPP')){
		return $this->refreshPppRadiusSession($client,$username,$mac_colon);
	}

	if(preg_match('/^hotspot/',$called_station_id)){
		return $this->refreshHotspotRadiusSession($client,$mac_colon);
	}

        return [
		'status' => 'not_applicable',
		'ack' => false,
		'matched' => 0,
		'removed' => 0,
		'mode' => 'rate_refresh',
		'error' => 'unsupported_radius_session_type',
        ];
    }

    private function refreshHotspotRadiusSession($client,$macAddress){
	$active = $this->findRadiusSessions($client,'/ip/hotspot/active/print','mac-address',$macAddress);
	if(count($active) === 0){
		return $this->missingRefreshTarget('hotspot_host_refresh','missing_hotspot_active_session');
	}

	$hosts = $this->findRadiusSessions($client,'/ip/hotspot/host/print','mac-address',$macAddress);
	if(count($hosts) === 0){
		return $this->missingRefreshTarget('hotspot_host_refresh','missing_hotspot_host');
	}

	// Verify only the old IDs: RouterOS can recreate a new host before this call returns.
	return $this->removeAndVerifyOldIds($client,'/ip/hotspot/host/print','/ip/hotspot/host/remove',$hosts,'hotspot_host_refresh');
    }

    private function refreshPppRadiusSession($client,$username,$macAddress){
	$active = $this->findRadiusSessions($client,'/ppp/active/print','name',$username);
	if($macAddress !== ''){
		$active = array_values(array_filter($active,function($session) use ($macAddress){
			return (string)($session['caller-id'] ?? '') === $macAddress;
		}));
	}
	if(count($active) === 0){
		return $this->missingRefreshTarget('ppp_active_refresh','missing_ppp_active_session');
	}

	return $this->removeAndVerifyOldIds($client,'/ppp/active/print','/ppp/active/remove',$active,'ppp_active_refresh');
    }

    private function missingRefreshTarget($mode,$error){
	return [
		'status' => 'target_not_found',
		'ack' => false,
		'matched' => 0,
		'removed' => 0,
		'mode' => $mode,
		'error' => $error,
	];
    }

    private function removeAndVerifyOldIds($client,$listPath,$removePath,$sessions,$mode){
	$oldIds = [];
	foreach($sessions as $session){
		if(!isset($session['.id'])){
			continue;
		}
		$oldIds[] = (string)$session['.id'];
		$remove = new Query($removePath);
		$remove->equal('.id',$session['.id']);
		$client->query($remove)->read();
	}

	if(count($oldIds) === 0){
		return $this->missingRefreshTarget($mode,'routeros_target_without_id');
	}

	// Do not require an empty table: a fresh RouterOS host/session is expected.
	$remaining = $client->query(new Query($listPath))->read();
	$remainingOldIds = array_filter($remaining,function($session) use ($oldIds){
		return isset($session['.id']) && in_array((string)$session['.id'],$oldIds,true);
	});
	$ack = count($remainingOldIds) === 0;
	return [
		'status' => $ack ? 'ack' : 'target_still_present',
		'ack' => $ack,
		'matched' => count($sessions),
		'removed' => count($oldIds),
		'mode' => $mode,
		'error' => $ack ? null : 'routeros_refresh_target_still_present',
	];
    }

    private function removeAndVerifyRadiusSessions($client,$listPath,$removePath,$field,$value,$mode){
	$active = $this->findRadiusSessions($client,$listPath,$field,$value);
	foreach($active as $session){
		if(!isset($session['.id'])){
			continue;
		}
		$remove = new Query($removePath);
		$remove->equal('.id',$session['.id']);
		$client->query($remove)->read();
	}

	// A second lookup makes a RouterOS API success meaningful for FUP state.
	$remaining = $this->findRadiusSessions($client,$listPath,$field,$value);
	$ack = count($remaining) === 0;
	return [
		'status' => $ack ? 'ack' : 'active_after_remove',
		'ack' => $ack,
		'matched' => count($active),
		'removed' => count($active),
		'mode' => $mode,
		'error' => $ack ? null : 'routeros_session_still_active',
	];
    }

    private function findRadiusSessions($client,$listPath,$field,$value){
		$query = (new Query($listPath))->where($field,$value);
		return $client->query($query)->read();
    }
    
    public function getHotspotActive($config){
    	$client 	= new Client($config);		
		$query 		= new Query('/ip/hotspot/active/print');
		$response 	= $client->query($query)->read();
		return $response;      
    }
    
    public function getPppoeActive($config){
    	$client 	= new Client($config);		
		$query 		= new Query('/ppp/active/print');
		$response 	= $client->query($query)->read();	
		return $response;      
    }
    
    public function getPppoeInterfaces($config){  
        $client 	= new Client($config);		
		$query      = new Query('/interface/print');
		$query->where('type', 'pppoe-in');
		$response 	= $client->query($query)->read();
		return $response; 
    }
    
    public function getPppoeIfStats($config,$mt_id){  
        $client 	= new Client($config);		
		$query      = new Query('/interface/print');
		$query->where('type', 'pppoe-in');
		$query->where('.id', $mt_id);
		$response 	= $client->query($query)->read();
		return $response; 
    }
    
}
