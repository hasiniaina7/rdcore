<?php
//----------------------------------------------------------
//---- Author: Dirk van der Walt
//---- License: GPL v3
//---- Description: A component that is used to genarate intuative voucher values
//---- Date: 08-05-2017
//------------------------------------------------------------

namespace App\Controller\Component;
use Cake\Controller\Component;
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
		'actif', 'agile', 'alerte', 'ancien', 'ardent', 'assure', 'attentif', 'audacieux',
		'beau', 'bizarre', 'bon', 'brave', 'calme', 'capable', 'certain', 'chaleureux',
		'clair', 'classe', 'compact', 'constant', 'correct', 'courant', 'court', 'cretin',
		'curieux', 'decent', 'difficile', 'discret', 'doux', 'droit', 'dur', 'efficace',
		'elegant', 'enorme', 'entier', 'epais', 'equitable', 'exact', 'fameux', 'fidele',
		'fiable', 'fin', 'fort', 'fragile', 'franc', 'frais', 'froid', 'futile',
		'gai', 'general', 'gentil', 'grand', 'grave', 'gris', 'habile', 'heureux',
		'honnorable', 'humble', 'ideal', 'immense', 'important', 'innocent', 'intense', 'juste',
		'lent', 'libre', 'limite', 'long', 'loyal', 'lucide', 'lourd', 'malin',
		'majeur', 'meilleur', 'mince', 'mobile', 'modeste', 'neuf', 'noble', 'normal',
		'obscur', 'paisible', 'patient', 'petit', 'poli', 'precieux', 'pressant', 'primaire',
		'prive', 'proche', 'propre', 'prudent', 'pur', 'rapide', 'rare', 'reel',
		'riche', 'rigide', 'rond', 'rouge', 'rude', 'sage', 'sain', 'sale',
		'sec', 'serieux', 'simple', 'sincere', 'solide', 'sombre', 'souple', 'stable',
		'strict', 'superbe', 'sur', 'tendre', 'tenu', 'terne', 'timide', 'tranquille',
		'utile', 'valide', 'vif', 'vrai'
	);

	private $nouns		= array(
		'arbre', 'atelier', 'avion', 'bagage', 'balcon', 'bateau', 'bijou', 'brique',
		'brume', 'bureau', 'cabane', 'cable', 'cadeau', 'cadran', 'canal', 'carte',
		'casque', 'chaine', 'chaise', 'champ', 'chant', 'chariot', 'chemin', 'chene',
		'chien', 'chiffre', 'chute', 'ciel', 'circuit', 'citron', 'clavier', 'cle',
		'coffre', 'colline', 'combat', 'comete', 'compte', 'corde', 'courant', 'cours',
		'crayon', 'cristal', 'croute', 'danse', 'decor', 'defi', 'depart', 'desert',
		'design', 'destin', 'dossier', 'dragon', 'eclair', 'ecole', 'ecran', 'effort',
		'elan', 'espace', 'espoir', 'etoile', 'etude', 'eventail', 'faisceau', 'famille',
		'farine', 'fichier', 'filtre', 'flambeau', 'fleur', 'forage', 'forfait', 'foret',
		'format', 'foudre', 'fraise', 'fromage', 'fusion', 'garage', 'geste', 'glace',
		'gouffre', 'grain', 'groupe', 'guide', 'guitare', 'havre', 'hiver', 'horizon',
		'image', 'impact', 'indice', 'jardin', 'jeton', 'journal', 'jungle', 'lampe',
		'legende', 'levier', 'liaison', 'lierre', 'ligne', 'livre', 'lueur', 'machine',
		'maison', 'marche', 'marin', 'masque', 'matin', 'memoire', 'mer', 'message',
		'metier', 'miroir', 'modele', 'module', 'montagne', 'mur', 'musique', 'navire',
		'neige', 'niche', 'niveau', 'nuage', 'objet', 'ocean', 'orage', 'outil',
		'panier', 'papier', 'parcours', 'parfum', 'passage', 'patin', 'paysage', 'peinture',
		'pendule', 'phare', 'pierre', 'piste', 'plaine', 'plume', 'poche', 'pont',
		'portail', 'poudre', 'prairie', 'projet', 'quartz', 'question', 'racine', 'rayon',
		'regard', 'relais', 'repere', 'reseau', 'ressort', 'retour', 'riviere', 'route',
		'sable', 'saison', 'salon', 'saveur', 'schema', 'secret', 'signal', 'silence',
		'socle', 'soleil', 'somme', 'source', 'sphere', 'spirale', 'station', 'style',
		'surface', 'table', 'talent', 'tempo', 'terrain', 'tissage', 'trace', 'trafic',
		'trait', 'transport', 'tresor', 'tribune', 'unite', 'usage', 'vallee', 'valeur',
		'vapeur', 'vecteur', 'verger', 'village', 'vision', 'vitesse', 'voyage'
	);

    public $voucherNames	= array(); //We first have an empty list which we'll populate and add to each time we generate a voucher

    public function initialize(array $config):void{
        $this->controller = $this->_registry->getController();
        $this->Radchecks  = TableRegistry::get('Radchecks'); 
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

        $duplicate_flag = true;
		while($duplicate_flag){		
			//Generate a value
			$adjective_count= (count($this->adjectives)-1);
			$noun_count     = (count($this->nouns)-1);
			$a				= rand(0,$adjective_count);
			$n				= rand(0,$noun_count);
			$v_value 	    = $this->adjectives[$a].$this->nouns[$n];
			//Test if not already taken
			if(
				(!in_array($v_value, $this->voucherNames))&&
				(strlen($v_value)<=16) //Coova does not like passwords longer than 16 Characters
			){
				$duplicate_flag = false; //Break the loop - we ar unique;
				array_push($this->voucherNames, $v_value);
			}
		}
		return $v_value; //We are unique and we added ourselves to the existing list
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
