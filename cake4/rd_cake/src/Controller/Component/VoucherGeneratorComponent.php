<?php
//----------------------------------------------------------
//---- Author: Dirk van der Walt
//---- License: GPL v3
//---- Description: A component that is used to genarate intuative voucher values
//---- Date: 08-05-2017
//------------------------------------------------------------

namespace App\Controller\Component;
use Cake\Controller\Component;
use Cake\Core\Configure;
use Cake\ORM\TableRegistry;

class VoucherGeneratorComponent extends Component {

    private $nameType		= 'adjective_noun'; 
    
    private $startNumber   = '00001';

    private $wordPool 		= array(
		'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can', 'her',
		'was', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'fig',
		'new', 'now', 'old', 'see', 'way', 'who', 'boy', 'did', 'its', 'let', 'fin',
		'put', 'say', 'she', 'too', 'use', 'dad', 'mom', 'try',	'why', 'act', 'bar',
		'car', 'dew', 'eat', 'far', 'gym', 'hey', 'ink', 'jet',	'key', 'log', 'mad',
		'nap', 'odd', 'pal', 'ram',	'saw', 'tan', 'urn', 'vet', 'wed', 'yap', 'zoo',
		'win', 'wax', 'tee', 'tin', 'til', 'tel', 'sit', 'sin', 'rim', 'red', 'rye',
		'pin', 'pix', 'pad', 'pen', 'off', 'map', 'mas', 'lay', 'lin', 'lox', 'low',
		'kin', 'hod', 'ego', 'dog', 'die', 'dam', 'dig', 'dim', 'cat', 'cot', 'com',  
	);

	private $adjectives		= array(
		'joli','petit','grand','rapide','calme','vif','fier','doux','sage','fort',
		'brave','clair','net','fin','vrai','libre','humble','rare','jeune','simple'
	);

	private $nouns		= array(
		'chat','lion','tigre','panda','loup','aigle','renard','ours','zebre','faucon',
		'soleil','etoile','nuage','riviere','montagne','vent','ocean','feu','pierre','arbre'
	);

    public $voucherNames	= array(); //We first have an empty list which we'll populate and add to each time we generate a voucher

    public function initialize(array $config):void{
        $this->controller = $this->_registry->getController();
        $this->Radchecks  = TableRegistry::get('Radchecks'); 
        $this->_loadReadableLexicon();
    }

    private function _loadReadableLexicon(){
        try{
            Configure::load('VoucherLexicon');
            $lexicon = Configure::read('voucher_lexicon');
            if(
                is_array($lexicon) &&
                array_key_exists('adjectives', $lexicon) &&
                array_key_exists('nouns', $lexicon) &&
                is_array($lexicon['adjectives']) &&
                is_array($lexicon['nouns']) &&
                (count($lexicon['adjectives']) > 20) &&
                (count($lexicon['nouns']) > 200)
            ){
                $this->adjectives = array_values(array_unique($lexicon['adjectives']));
                $this->nouns      = array_values(array_unique($lexicon['nouns']));
            }
        }catch(\Exception $e){
            // Keep fallback defaults if lexicon cannot be loaded.
        }
    }

    public function generateVoucher(){

		if($this->nameType == 'word_number_word_number'){
			return $this->_word_number_word_number();
		}
  
		if($this->nameType == 'adjective_noun'){
			return $this->_adjective_noun();
		}

		if($this->nameType == 'random_number'){
			return $this->_random_number();
		}

        if($this->nameType == 'random_alpha_numeric'){
            return $this->_random_alpha_numeric();
        }  
    }
    
    public function generatePassword(){
        return $this->_random_alpha_numeric();
    }
    
    public function generateUsernameForVoucher($prefix, $suffix){
    
        $like_statement = '[0-9][0-9][0-9][0-9][0-9]'; //FIXME if you want the vouchers to hve more numbers also add here
        if($suffix !== ''){
            $like_statement = $like_statement.'@'.$suffix;
        }
        if($prefix !==''){
            $like_statement = $prefix.'-'.$like_statement;
        }    
    
        $q_r = $this->Radchecks->find()
            ->where(['Radchecks.username REGEXP' => $like_statement])
            ->order(['Radchecks.username' => 'DESC'])
            ->first();
        if($q_r){
            $username = $q_r->username;
            $username = preg_replace('/^\w+-/', '', $username);//Remove prefix
            $username = preg_replace('/@\w+$/', '', $username);//Remove sufix
            $next_number = (int)$username+1;
            $next_number = sprintf('%05d', $next_number);
        }else{ 
            $next_number = $this->startNumber;
        }
        
        if($suffix !== ''){
            $next_number = $next_number.'@'.$suffix;
        }
        
        if($prefix !==''){
            $next_number = $prefix.'-'.$next_number;
        }
        return $next_number;
    }

    private function _word_number_word_number(){

        $duplicate_flag = true;
		while($duplicate_flag){		
			//Generate a value
			$pool_count = (count($this->wordPool)-1);
			$d1 		= rand (1,9);
			$d2 		= rand (1,9);
			$w1			= rand(0,$pool_count);
			$w2			= rand(0,$pool_count);
			$v_value 	= $this->wordPool[$w1].$d1.$this->wordPool[$w2].$d2;
			//Test if not already taken
			if(!in_array($v_value, $this->voucherNames)){
				$duplicate_flag = false; //Break the loop - we ar unique;
				array_push($this->voucherNames, $v_value);
			}
		}
		return $v_value; //We are unique and we added ourselves to the existing list
    }

	private function _adjective_noun(){

        // Keep max length for Coova compatibility.
        $maxLen = 16;
        $tries  = 0;

        while($tries < 600){
            $tries++;

            $a = $this->adjectives[array_rand($this->adjectives)];
            $n = $this->nouns[array_rand($this->nouns)];

            // Increase combinations while preserving readability.
            if(rand(0,1) === 0){
                $base = $a.'-'.$n; // adjective-noun
            }else{
                $base = $n.'-'.$a; // noun-adjective
            }

            $v_value = $base;
            if($tries > 200){
                // Collision fallback: add short numeric suffix if needed.
                $suffix = '-'.str_pad((string)rand(0,99), 2, '0', STR_PAD_LEFT);
                $v_value = $base;
                if((strlen($v_value) + strlen($suffix)) > $maxLen){
                    $v_value = substr($v_value, 0, $maxLen - strlen($suffix));
                }
                $v_value .= $suffix;
            }

            if(
                (!in_array($v_value, $this->voucherNames)) &&
                (strlen($v_value) <= $maxLen)
            ){
                array_push($this->voucherNames, $v_value);
                return $v_value;
            }
        }

        // Final deterministic fallback (still readable enough).
        $fallback = 'code-'.str_pad((string)rand(0,9999), 4, '0', STR_PAD_LEFT);
        if(strlen($fallback) > $maxLen){
            $fallback = substr($fallback, 0, $maxLen);
        }
        if(!in_array($fallback, $this->voucherNames)){
            array_push($this->voucherNames, $fallback);
        }
        return $fallback;
    }

	private function _random_number(){
		$duplicate_flag = true;
		while($duplicate_flag){		
			$v_value = rand ( 1000,999999);
			if(!in_array($v_value, $this->voucherNames)){
				$duplicate_flag = false; //Break the loop - we ar unique;
				array_push($this->voucherNames, $v_value);
			}
		}
		return $v_value; //We are unique and we added ourselves to the existing list
	}

    private function _random_alpha_numeric($length = 6){
        // start with a blank password
        $v_value = "";
        // define possible characters
       // $possible = "!#$%^&*()+=?0123456789bBcCdDfFgGhHjJkmnNpPqQrRstTvwxyz";
        $possible = "0123456789bBcCdDfFgGhHjJkmnNpPqQrRstTvwxyz";
        // set up a counter
        $i = 0; 
        // add random characters to $password until $length is reached
        while ($i < $length) { 
            // pick a random character from the possible ones
            $char = substr($possible, mt_rand(0, strlen($possible)-1), 1);
            // we don't want this character if it's already in the password
            if (!strstr($v_value, $char)) { 
                $v_value .= $char;
                $i++;
            }
        }
        return $v_value;
    }

}
