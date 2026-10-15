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
