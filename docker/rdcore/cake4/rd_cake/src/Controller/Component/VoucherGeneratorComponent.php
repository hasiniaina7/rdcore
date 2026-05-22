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
		'gueas', 'agendiez', 'cotoyiez', 'gigota', 'voutates', 'baguer', 'saunates', 'sexue', 'eduquais', 'tersions',
		'rognames', 'cohesive', 'tetrade', 'hart', 'oliban', 'retrecis', 'asperite', 'coude', 'rosissez', 'wagonlit',
		'senaux', 'chants', 'popeline', 'zigoto', 'fleurai', 'jalouser', 'louas', 'ressuai', 'alunit', 'renacles',
		'associe', 'begayait', 'sourds', 'beluga', 'fibules', 'gutta', 'courir', 'enjolons', 'decapons', 'nixe',
		'cavat', 'raffermi', 'baissoir', 'plantera', 'chassis', 'floconne', 'textural', 'musser', 'fourbue', 'ecretat',
		'figura', 'eglogue', 'hanchent', 'eludas', 'massai', 'ducasses', 'jinguais', 'profilai', 'niaisai', 'brumons',
		'avoir', 'avalisas', 'metrates', 'fluxer', 'logeurs', 'eclusai', 'mutinat', 'cramoisi', 'rissions', 'damnera',
		'bilame', 'echarpee', 'nielliez', 'lunetier', 'islamisa', 'virerent', 'chuinta', 'vocatifs', 'endiguee', 'ponceras',
		'turque', 'pianota', 'timide', 'ablatat', 'aboulait', 'trimees', 'veld', 'grelees', 'perorera', 'dits',
		'castrai', 'existons', 'languira', 'cuissot', 'tachetee', 'lassee', 'galets', 'projet', 'induline', 'attarde',
		'rablates', 'zoolatre', 'dotant', 'tarifies', 'duplexez', 'logeable', 'droguets', 'navrez', 'metras', 'crisse',
		'abonnas', 'epissat', 'pistils', 'enfleure', 'haineux', 'radeuse', 'quittiez', 'melena', 'noircira', 'altaique',
		'derayat', 'vaguat', 'toquons', 'pectique', 'corsera', 'nourris', 'retama', 'doucheur', 'pullman', 'tarotee',
		'louvoyat', 'calcaire', 'joutees', 'sait', 'tamponne', 'compisse', 'maronnas', 'dolce', 'figuier', 'serment',
		'piaffee', 'epilasse', 'evier', 'mamzelle', 'regla', 'integra', 'perinee', 'regrees', 'detalle', 'lingeai',
		'prorogee', 'grison', 'rentas', 'evases', 'gareront', 'linges', 'frolerai', 'indiciez', 'livreras', 'betes',
		'veloutes', 'recaler', 'arrogea', 'vidasse', 'clamat', 'pituite', 'edictait', 'rugir', 'derangee', 'bluterai',
		'lignage', 'palabra', 'banquez', 'vexerent', 'malaxant', 'perchis', 'lorraine', 'raffinas', 'pelas', 'fascinas',
		'issue', 'herchat', 'bombai', 'archal', 'dessales', 'pelletas', 'pagode', 'courba', 'magnant', 'stores',
		'beuglons', 'faderons', 'marchant', 'cheminee', 'dissolus', 'musquer', 'mansarde', 'geint', 'embossa', 'chaumais',
		'ether', 'spirites', 'bananier', 'butames', 'preparas', 'salopai', 'dopai', 'demones', 'bobinons', 'fregatez',
		'declaree', 'drayent', 'cigale', 'citaient', 'layerez', 'taise', 'ponciez', 'kelvins', 'deca', 'deconner',
		'cabala', 'gondes', 'astiquez', 'sucrerie', 'velait', 'apurons', 'froncant', 'empilez', 'grippons', 'costal',
		'viseras', 'evidente', 'eniellez', 'boutrime', 'jadis', 'felant', 'transies', 'odorats', 'goberges', 'decalqua',
		'dehalat', 'yoyotta', 'etendes', 'trisme', 'grivela', 'montates', 'tenterai', 'syllabus', 'liturgie', 'jodlerai',
		'renviant', 'epurais', 'orniez', 'jale', 'glosions', 'godronna', 'gourous', 'redoree', 'arcadien', 'alerta',
		'affuriez', 'tonsuree', 'agrainer', 'epointai', 'tutoyons', 'calots', 'crawlait', 'petames', 'coalisa', 'roquates',
		'rodaille', 'rembines', 'dement', 'epicait', 'croisant', 'lepiote', 'incliner', 'depavat', 'peagers', 'raquas',
		'defilez', 'erosions', 'ecossera', 'copuler', 'toisons', 'hier', 'pilotiez', 'fascises', 'layerais', 'mesusas',
		'intuite', 'embrassa', 'astraux', 'reverai', 'agendant', 'huotte', 'bruinera', 'mijota', 'enracine', 'sonnet',
		'brima', 'adjurez', 'savourat', 'bouler', 'canotees', 'evoquons', 'cureriez', 'brievete', 'arrentes', 'revivre',
		'ahanee', 'epitres', 'becotera', 'lazulite', 'geras', 'devenus', 'pardon', 'vetisses', 'degluees', 'abregeas',
		'riesling', 'rifles', 'frolee', 'empirees', 'torsadez', 'ecangue', 'douter', 'mantra', 'cherais', 'flottais',
		'flipot', 'rotacee', 'menton', 'surfais', 'rallent', 'soupat', 'pendules', 'loriot', 'peausses', 'bougnat',
		'unirait', 'amuseras', 'reversee', 'magnums', 'ebattiez', 'etonnee', 'vaudou', 'tiquions', 'solution', 'bloquee',
		'drivions', 'toutou', 'dirait', 'derodee', 'reouvre', 'dissolve', 'pagnotee', 'farfadet', 'officine', 'volition',
		'consul', 'styleras', 'mazoutez', 'rendrais', 'excisez', 'raffolas', 'nommera', 'pontions', 'leguai', 'ahurira',
		'trouerez', 'ragees', 'dediera', 'dosons', 'syrinx', 'guinchat', 'chatoyas', 'marxiser', 'rondo', 'felerai',
		'enficher', 'minorez', 'enlisa', 'solmisa', 'fondu', 'iodees', 'rosserai', 'mejuger', 'engerbat', 'trottons',
		'obvenant', 'vouvoyat', 'divaguez', 'alangui', 'ions', 'rubanes', 'burinait', 'refendu', 'cherites', 'croirai',
		'chosifia', 'vidiez', 'deplore', 'sorguons', 'rugie', 'batoille', 'bleuet', 'sanglant', 'rocha', 'laiteux',
		'eprouvee', 'evidasse', 'tronerai', 'placeurs', 'amibiase', 'miseront', 'prediqua', 'lapidait', 'pochions', 'veinules',
		'depiles', 'appater', 'brader', 'ecorcent', 'remueras', 'dinant', 'badaudez', 'routine', 'vertu', 'metrages',
		'ravinees', 'baissas', 'ferons', 'ortie', 'enduirez', 'bijou', 'redoive', 'resignez', 'bruyeres', 'vivable',
		'opererai', 'voyances', 'enviable', 'naives', 'fourres', 'deletion', 'purgees', 'luteriez', 'abusent', 'emouvez',
		'blutoir', 'revetues', 'sniffat', 'feconder', 'pacquant', 'rapes', 'ramis', 'epierrat', 'tapis', 'poecile',
		'depecais', 'reforma', 'areolee', 'malefice', 'flatter', 'typisant', 'gymkhana', 'minuter', 'avanca', 'canates',
		'listasse', 'here', 'adherat', 'fossoyes', 'loueuse', 'atomisat', 'dedierez', 'prelevee', 'charmeur', 'lardees',
		'louva', 'trucida', 'transmis', 'radoubai', 'patentee', 'celees', 'pourtour', 'freiniez', 'ligotes', 'rassura',
		'estimat', 'irrueras', 'splittez', 'visserie', 'montras', 'envoile', 'expirai', 'dardasse', 'autobus', 'retracte',
		'suicidee', 'croiseur', 'fugueuse', 'cavates', 'apanagea', 'reai', 'jouxtant', 'charcute', 'tophus', 'brayes',
		'assoyiez', 'toperai', 'prealpin', 'infiltra', 'layonnat', 'livrer', 'canetons', 'zestais', 'declinez', 'importee',
		'ripera', 'salpetra', 'liliales', 'nenies', 'chambrez', 'depotes', 'grossies', 'inegale', 'guets', 'gerbes',
		'ribosome', 'datons', 'ingeniez', 'percages', 'jacobee', 'nuancent', 'ramperas', 'larrons', 'omicron', 'deprimat',
		'poules', 'choie', 'osates', 'ruasses', 'omettait', 'arguerez', 'abattiez', 'casquee', 'batonna', 'escrimer',
		'bijectif', 'kotons', 'abregent', 'enclavai', 'bronchai', 'volleyee', 'potinera', 'placames', 'exercice', 'recrusse',
		'grasseya', 'decisive', 'mana', 'epandue', 'fluas', 'durete', 'gourant', 'egariez', 'portique', 'gabion',
		'remaniee', 'fontis', 'clonant', 'referez', 'pionnant', 'volions', 'modulat', 'gourmets', 'enjugue', 'fric',
		'verseaux', 'deluree', 'poudree', 'detectes', 'fouiniez', 'raserez', 'coltinee', 'cambree', 'piegees', 'trottas',
		'evasat', 'gales', 'intimes', 'rime', 'lingez', 'ravivees', 'chiens', 'amylacee', 'giboya', 'boxes',
		'effanees', 'rappels', 'impetres', 'indexee', 'sablas', 'ocreuses', 'bafreur', 'affaisse', 'combler', 'froueras',
		'ganga', 'faussez', 'galipote', 'macque', 'calees', 'futees', 'ghettos', 'trematai', 'gourions', 'serviez',
		'dechus', 'geolier', 'bruitee', 'byzantin', 'proceder', 'langueya', 'eboutat', 'annelat', 'fascinat', 'poireau',
		'flashas', 'depravat', 'depailla', 'errais', 'emettras', 'echappai', 'eclipsa', 'boucanez', 'nouvelle', 'cernames',
		'insanes', 'denoncas', 'chimisme', 'forez', 'langueta', 'annoncez', 'rejetait', 'formulee', 'policez', 'emacient',
		'lampez', 'refugiat', 'viderais', 'flageole', 'ebaudi', 'chinasse', 'jumelee', 'vinages', 'fifre', 'copiez',
		'clama', 'novice', 'langeat', 'flocules', 'triplets', 'tragique', 'rauquant', 'paroles', 'harcelat', 'stibie',
		'javelai', 'esquinta', 'resaliez', 'aligote', 'cigogne', 'egayons', 'crete', 'baterent', 'fougeait', 'epierrez',
		'votante', 'gemmais', 'irreelle', 'jectisse', 'agates', 'claquet', 'lavaient', 'tigrates', 'pinard', 'veneur',
		'tartre', 'rebiffe', 'morflee', 'epongez', 'paverais', 'bistrait', 'decent', 'knout', 'typo', 'sterile',
		'laxistes', 'contrit', 'humanisa', 'aubes', 'baratter', 'effluent', 'paumas', 'achalas', 'soldees', 'queteur',
		'hissiez', 'moudrais', 'viroles', 'terne', 'acon', 'anemions', 'sujettes', 'faussat', 'jodlames', 'evidais',
		'rabrouat', 'jaspas', 'moitee', 'flaupes', 'amorcera', 'decrirez', 'maillard', 'jonglera', 'cananeen', 'poilu',
		'rempoche', 'riveriez', 'moletees', 'delurait', 'glycemie', 'bastera', 'perlerai', 'gravee', 'cubique', 'capucine',
		'hivernes', 'managiez', 'vaudois', 'faucard', 'mendiait', 'percutai', 'adulee', 'defiliez', 'sertiras', 'eraflai',
		'beignet', 'entamer', 'lynchant', 'triplais', 'acquet', 'cedee', 'farineux', 'eculez', 'enduro', 'cagnames',
		'courier', 'passee', 'gradees', 'opina', 'pleurai', 'delecta', 'couchas', 'beez', 'abstenus', 'initiait',
		'menine', 'pyelite', 'verotat', 'glairez', 'nursery', 'optasses', 'irruee', 'forera', 'semons', 'urinates',
		'resalait', 'dissipes', 'tsar', 'semeras', 'paneriez', 'reduite', 'polir', 'bercais', 'rarement', 'trustat',
		'caverent', 'crantait', 'violetai', 'magnesie', 'culeront', 'decalera', 'medersa', 'pipelet', 'dropons', 'trillas',
		'coudra', 'vicinaux', 'decommit', 'refluais', 'guerdon', 'variasse', 'tirates', 'kvas', 'fanerons', 'recusait',
		'terriere', 'ancolies', 'pouparde', 'maitre', 'capera', 'frolais', 'rouillas', 'laicisee', 'quottes', 'consort',
		'lapident', 'groin', 'taxai', 'onques', 'agoniras', 'murirent', 'replat', 'fends', 'fuserent', 'mendiiez',
		'mysteres', 'auguree', 'rompait', 'typeras', 'atoxique', 'jasees', 'boettes', 'chiquent', 'decerna', 'cannone',
		'desolees', 'vieilli', 'ajoutai', 'taxera', 'ovulames', 'entubes', 'cramant', 'typha', 'tordu', 'solen',
		'crever', 'taisait', 'lapidez', 'bittiez', 'recuites', 'oxygenat', 'innomee', 'attorney', 'soudure', 'guerroye',
		'surinez', 'membre', 'campane', 'orage', 'exigez', 'piquat', 'trefilee', 'epissiez', 'juriez', 'batisse',
		'dulcites', 'croutee', 'alertees', 'reprenez', 'ouvrit', 'ovulerez', 'degota', 'avion', 'lynchees', 'reparue',
		'timbrent', 'limaient', 'scias', 'baside', 'notariat', 'bisexue', 'nouille', 'goberais', 'logeait', 'reliames',
		'serancer', 'derageat', 'anguille', 'rebaties', 'orbital', 'taches', 'codeurs', 'schappes', 'gitais', 'fastueux',
		'verifiat', 'sonate', 'surgela', 'setter', 'debattre', 'repiquez', 'touates', 'enrouler', 'cillat', 'lunches',
		'captage', 'convoya', 'peuvent', 'depurant', 'encodage', 'parlotas', 'ballants', 'palanque', 'cagnai', 'pepiees',
		'detors', 'ruinez', 'abhorre', 'adules', 'deposait', 'duodi', 'morilles', 'enfaitai', 'affairat', 'integre',
		'anaphase', 'ballates', 'texane', 'degermes', 'rougimes', 'epanchas', 'molaire', 'defiai', 'dissipa', 'vouiez',
		'epeulera', 'capeez', 'ovulaire', 'ratine', 'mecompte', 'liaisons', 'etetais', 'anisent', 'alogique', 'truand',
		'twista', 'moelles', 'glissiez', 'salesien', 'alertez', 'bittura', 'stipite', 'deferer', 'diapres', 'huilee',
		'grossir', 'bruisser', 'estampe', 'revisas', 'cryptait', 'triturez', 'sursises', 'demelat', 'penchant', 'jutaient',
		'visuel', 'deparles', 'grainiez', 'laquerez', 'desolons', 'ovoidal', 'bullasse', 'potasser', 'realesai', 'ecriames',
		'postdata', 'kotera', 'lassiez', 'porterai', 'reerons', 'zyeutera', 'celle', 'soutier', 'giclions', 'javelez',
		'edredon', 'quadrant', 'postaux', 'comateux', 'renardez', 'inherent', 'nettoyes', 'epeulas', 'oxydee', 'nordiste',
		'resaler', 'batait', 'ecrou', 'rencard', 'dotez', 'bessons', 'saurerai', 'deverdie', 'exilent', 'noyaute',
		'tambours', 'griset', 'guiperez', 'guetter', 'attitrai', 'debogage', 'discaux', 'dondon', 'commeres', 'feleriez',
		'alleluia', 'inadapte', 'vivement', 'defarder', 'diaprait', 'egrugeat', 'babils', 'depenses', 'massons', 'rira',
		'dupeurs', 'degluent', 'busquais', 'rustres', 'ricanant', 'autogene', 'male', 'chapitra', 'appatai', 'bras',
		'etonniez', 'situes', 'bouquet', 'doigte', 'tentante', 'oirai', 'tetanise', 'limace', 'fusil', 'enflant',
		'vidangee', 'cherat', 'emplume', 'ebouas', 'rasions', 'anemiiez', 'deradai', 'songent', 'album', 'remontai',
		'tarates', 'incuba', 'pises', 'tetue', 'etoilera', 'denichas', 'germain', 'calmer', 'courroux', 'titree',
		'egarames', 'enduit', 'jeunas', 'risee', 'coupoles', 'pouviez', 'patinais', 'atresie', 'stererez', 'suturent',
		'secantes', 'surannes', 'drayoir', 'dedora', 'sucriers', 'biaisa', 'caftas', 'suffise', 'cotaient', 'capside',
		'deprenne', 'houache', 'tunnels', 'oblation', 'caniveau', 'ciriere', 'crochons', 'pesas', 'guipes', 'flaquons',
		'meubles', 'erigea', 'biomasse', 'recliner', 'enkystas', 'ovalisai', 'vinsse', 'cernasse', 'axions', 'redoutai',
		'mollira', 'laperez', 'bosse', 'derogea', 'bancale', 'demeurez', 'rotangle', 'exegete', 'trematas', 'decorne',
		'toilera', 'secouat', 'arretez', 'edilite', 'primat', 'cuisons', 'pronerai', 'amas', 'radierez', 'revives',
		'bittant', 'grondiez', 'ferret', 'lacunes', 'coutee', 'ferme', 'bouquin', 'octroyee', 'gironds', 'cimenter',
		'aortite', 'bacliez', 'ebarbes', 'marmot', 'convives', 'meritais', 'surinons', 'membrane', 'cries', 'tullier',
		'busquees', 'recordas', 'rimat', 'bafrons', 'benie', 'khmere', 'capeee', 'peignes', 'emarge', 'affeage',
		'luxant', 'reboutas', 'gicleras', 'celles', 'portiere', 'dingo', 'attrapat', 'frappe', 'vallon', 'epode',
		'delovons', 'avouions', 'musaient', 'essayage', 'ajouter', 'roles', 'ratez', 'jumbo', 'clapes', 'raretes',
		'depliais', 'perfusez', 'casates', 'repayons', 'pivotees', 'leguerez', 'goulette', 'boreale', 'emulames', 'thes',
		'fauves', 'gronder', 'preserie', 'assumant', 'cheche', 'chimere', 'aplanir', 'banne', 'faites', 'teckels',
		'amome', 'lechasse', 'lochera', 'denotai', 'rameutee', 'gaza', 'plusses', 'exauces', 'anonnons', 'soulevat',
		'ruant', 'slows', 'solive', 'dodeline', 'noyates', 'plumiez', 'peinture', 'hutteau', 'knickers', 'bigarrai',
		'alitas', 'trairons', 'aboutes', 'jassons', 'eclopera', 'chaumera', 'vaudrez', 'mouchant', 'coagulas', 'deparer',
		'editant', 'crumes', 'vivante', 'bienvenu', 'couva', 'fleurees', 'envahit', 'cicero', 'filable', 'stylisat',
		'flouiez', 'impurete', 'essayait', 'tassasse', 'pincons', 'tassons', 'jouites', 'cervoise', 'chenues', 'huerez',
		'reglee', 'buvaient', 'kiferais', 'separe', 'faseyais', 'parfumai', 'boulete', 'scille', 'gemmer', 'vites',
		'pour', 'denoies', 'titrent', 'restes', 'bittates', 'hatee', 'oxyurose', 'biffent', 'lacates', 'foehn',
		'surtonte', 'exquis', 'opiacait', 'baratine', 'gambas', 'skai', 'showbiz', 'tournees', 'traitiez', 'transi',
		'ramames', 'bateaux', 'cognac', 'fondront', 'essor', 'faits', 'bifurque', 'adulent', 'canulars', 'membron',
		'sondions', 'offensai', 'pixel', 'brevetai', 'heresie', 'impers', 'radotas', 'sursis', 'remontes', 'potinons',
		'raia', 'mentisme', 'anonnait', 'cotir', 'cheires', 'ciselee', 'execre', 'plumerez', 'regliez', 'vobula',
		'empilas', 'calamine', 'jointent', 'decedas', 'initiees', 'situait', 'carreras', 'prele', 'actrices', 'juchait',
		'allumoir', 'frimeur', 'apprecia', 'maigrie', 'ganterez', 'fouinard', 'ouzbeks', 'componee', 'hantes', 'encreur',
		'pilet', 'jassa', 'iwans', 'eleverez', 'supposa', 'palets', 'brosser', 'dompter', 'pastella', 'favorisa',
		'rendons', 'deniat', 'nougat', 'degagera', 'bafrent', 'decentra', 'freejazz', 'glacat', 'toluenes', 'pilon',
		'couvres', 'brayerez', 'depilee', 'merdais', 'embreles', 'pliement', 'humons', 'geignit', 'bruirons', 'regagnez',
		'rouvrais', 'content', 'mutant', 'fautates', 'clouees', 'paisseau', 'offrande', 'guidees', 'epillets', 'veniez',
		'dilution', 'brimames', 'surfasse', 'enlever', 'louons', 'mamelle', 'brossee', 'fixement', 'eludames', 'alitee',
		'roucoule', 'amassas', 'vouvoie', 'incarner', 'alouate', 'degeler', 'alliage', 'abjurat', 'gainai', 'intitule',
		'chaines', 'armoriai', 'infirmat', 'chourees', 'etanches', 'pissait', 'revetais', 'mitees', 'cheval', 'urometre',
		'cedant', 'presuma', 'frisates', 'cawcher', 'bruitai', 'venerera', 'tenrec', 'vinez', 'satanees', 'clapis',
		'viderai', 'ulcerent', 'blindiez', 'renflera', 'degeliez', 'pommadas', 'ciseau', 'leopard', 'soutira', 'fougeais',
		'cultivez', 'balisez', 'festoyas', 'fourbons', 'adent', 'empalmai', 'vacherez', 'chouleur', 'cerdan', 'inexpiee',
		'mievres', 'tateriez', 'mages', 'insultes', 'derive', 'enfumas', 'vantai', 'denias', 'houilles', 'tillee',
		'rebutera', 'dentelas', 'ravivee', 'gercais', 'presale', 'jumperez', 'baryum', 'daterez', 'tout', 'cartant',
		'veloutai', 'deminera', 'epiames', 'ravoir', 'signes', 'votation', 'garnisse', 'picoles', 'foutent', 'maniames',
		'epepinai', 'layonne', 'ruchee', 'ayant', 'tontinai', 'alentir', 'carguees', 'clissat', 'youtsat', 'imamat',
		'planames', 'corporel', 'rampee', 'baraquee', 'arameen', 'veltee', 'agrainat', 'rechassa', 'jeuna', 'menuisas',
		'affligee', 'vaselina', 'frete', 'gater', 'repavee', 'ornieres', 'engouler', 'expia', 'abritee', 'diaspora',
		'chaumee', 'voltons', 'jambonne', 'bardage', 'olivaies', 'sacquant', 'apparia', 'rational', 'fiances', 'gonze',
		'daurades', 'refrenes', 'burinee', 'grivelle', 'caneras', 'deveines', 'bluffera', 'chiquer', 'values', 'lingeras',
		'allouons', 'mulotees', 'huera', 'cremera', 'moulants', 'lividite', 'regenere', 'remordit', 'coutura', 'estomac',
		'resiliez', 'argueras', 'quarrant', 'pelent', 'crechera', 'minute', 'decorais', 'coalisat', 'rentamas', 'billette',
		'minente', 'geoliere', 'drayames', 'immolat', 'flanquai', 'enfuirez', 'ninja', 'arrierez', 'tangent', 'bicha',
		'refendre', 'forfera', 'tomerons', 'confite', 'adoptee', 'tuerais', 'stimula', 'freluche', 'tetues', 'empirons',
		'meditas', 'chiffon', 'puisait', 'encaviez', 'copier', 'boute', 'obei', 'cirates', 'lapames', 'victime',
		'avalais', 'petree', 'fossoyas', 'mures', 'cramser', 'helaient', 'fregatai', 'laotien', 'jardes', 'culotta',
		'minent', 'pelerai', 'bitumage', 'cacarder', 'buttant', 'obturiez', 'rodiez', 'depannez', 'enhardir', 'objectee',
		'lezardat', 'vains', 'parus', 'forjetes', 'virales', 'songions', 'detecta', 'guetra', 'reboutai', 'poupons',
		'starets', 'garbure', 'gueridon', 'tarerais', 'trahimes', 'rajeunis', 'avouera', 'tests', 'caraibes', 'fonts',
	);

	private $nouns		= array(
		'yeble', 'godillas', 'degondes', 'debinent', 'canula', 'cachenez', 'banniras', 'fondates', 'mensurat', 'haploide',
		'suerais', 'sterent', 'reparle', 'babouche', 'encherie', 'elavees', 'ebahiras', 'piquiez', 'puasses', 'quarrons',
		'panama', 'demimal', 'exigea', 'ployait', 'rhino', 'grecisez', 'jetait', 'debaclat', 'machons', 'froissas',
		'planes', 'obscenes', 'goulet', 'proyer', 'acierees', 'ratinera', 'extremes', 'culera', 'arrieree', 'dedisais',
		'fendriez', 'bitumas', 'affoliez', 'rester', 'pieforts', 'nippes', 'ouillage', 'kiferons', 'reeduque', 'briderez',
		'fendue', 'tournera', 'opuntias', 'arsine', 'quassias', 'limonat', 'occulter', 'cuivras', 'boitier', 'bouzouk',
		'batent', 'veneres', 'ragoutai', 'lecteur', 'apprend', 'allegees', 'avinates', 'justice', 'harpa', 'necton',
		'canadien', 'hanteras', 'choyions', 'decapita', 'toilees', 'detirai', 'decernez', 'lachasse', 'mouvees', 'convias',
		'trouons', 'espionne', 'roderait', 'adroit', 'saborde', 'declouee', 'kibitza', 'biscuits', 'telemark', 'emmure',
		'reniflat', 'auditant', 'bleui', 'taxables', 'zoneriez', 'marbriez', 'recuses', 'gregeois', 'ovaliser', 'hurlez',
		'emerger', 'ruse', 'valetait', 'vinais', 'huileras', 'ebranlez', 'echasse', 'reserves', 'grattiez', 'sirli',
		'podium', 'coure', 'scieriez', 'cabalai', 'caquait', 'parfila', 'megotons', 'echouee', 'moisa', 'grizzli',
		'arcbouta', 'coursait', 'reniiez', 'caftames', 'chabliez', 'vomira', 'aquilin', 'stocks', 'desossai', 'larigot',
		'tintates', 'imbus', 'depiquas', 'ligoter', 'mets', 'debarrez', 'sirocco', 'nieras', 'voyoute', 'polypore',
		'routat', 'luger', 'tutrices', 'emerge', 'decele', 'couver', 'adaptat', 'fluor', 'tenu', 'bardates',
		'liftera', 'epelant', 'cureta', 'abcedera', 'lydien', 'touat', 'debottee', 'titrames', 'enrichi', 'minuteur',
		'tetas', 'dotat', 'taillera', 'crevotat', 'clonates', 'fluxerez', 'riotant', 'relavant', 'imitera', 'culerai',
		'bouffe', 'matou', 'meublee', 'boisais', 'inculpez', 'filmions', 'burette', 'cula', 'matait', 'normaux',
		'embraque', 'pansee', 'lapereau', 'xerus', 'amibe', 'quillent', 'luttames', 'humble', 'punimes', 'affermie',
		'sels', 'rouleur', 'delestez', 'egreneur', 'zoomerai', 'guete', 'victimer', 'alignait', 'oxydera', 'impiete',
		'degagees', 'statue', 'denudais', 'creer', 'rosasses', 'reverses', 'ecolatre', 'pechat', 'exagerai', 'niveles',
		'orgelet', 'vertes', 'bits', 'juter', 'fournees', 'bazardee', 'plaqueur', 'valsees', 'design', 'huames',
		'colliez', 'ventru', 'demerdat', 'voletant', 'sulfonez', 'evapore', 'oviducte', 'rimez', 'fugueur', 'pigeonna',
		'congeles', 'minutees', 'convive', 'lochiez', 'myosite', 'battra', 'detrones', 'loverons', 'reanimas', 'adjurees',
		'fidelise', 'taisez', 'situiez', 'helez', 'ebouai', 'lainier', 'rageuse', 'engommai', 'cablage', 'intimite',
		'lesine', 'talmud', 'depistas', 'pacquent', 'tontinee', 'anilisme', 'ouvrent', 'frottoir', 'biens', 'enrobait',
		'malin', 'recruta', 'enielles', 'remisses', 'lardais', 'ballait', 'peleen', 'mixez', 'rayees', 'pontille',
		'fignolat', 'haine', 'boumiez', 'bectez', 'pausant', 'vagit', 'paginez', 'egueulez', 'toquez', 'lettrai',
		'baretiez', 'orrai', 'maltant', 'lameront', 'linteau', 'brumeuse', 'altiste', 'abhorra', 'peuple', 'tentant',
		'occluent', 'ringarde', 'cuitons', 'surcout', 'effacons', 'retentai', 'vioquir', 'trempons', 'convoqua', 'sifflote',
		'pionna', 'platrees', 'refusiez', 'sampi', 'machina', 'accorant', 'devolu', 'abolit', 'dispatch', 'boss',
		'tremblez', 'gnomique', 'perche', 'debrayes', 'epeiste', 'daubent', 'ecimerai', 'ravisais', 'flutera', 'rochees',
		'degazai', 'corroyas', 'encercle', 'triestin', 'cambes', 'bottera', 'soutenir', 'dilapide', 'bechent', 'pensas',
		'ultras', 'ejecta', 'poseuse', 'effriter', 'baguera', 'renovais', 'choquait', 'becotait', 'biller', 'decodage',
		'limonite', 'soupa', 'grevez', 'lettrine', 'apatride', 'balancat', 'sonore', 'goberait', 'depute', 'pesant',
		'solea', 'ioulons', 'cuirez', 'conterai', 'annotas', 'surjales', 'secours', 'ululais', 'rochez', 'rampames',
		'fulminee', 'scrutait', 'sirote', 'raperez', 'torero', 'boheme', 'givrasse', 'legueras', 'prolepse', 'suates',
		'faderiez', 'dessolas', 'rajout', 'encriez', 'bionique', 'scions', 'itera', 'grigris', 'retissee', 'tubai',
		'decedera', 'rutilant', 'virola', 'minotier', 'parfile', 'buvotat', 'alesai', 'notaire', 'depasses', 'chuintai',
		'liberai', 'literez', 'notee', 'alevinai', 'ecrouent', 'salages', 'ilion', 'harponne', 'recolat', 'airas',
		'matelot', 'dalliez', 'cognat', 'residait', 'planisme', 'arisat', 'crabes', 'arrogent', 'estamper', 'glatisse',
		'ecussons', 'goutant', 'ravalai', 'votait', 'agent', 'vivree', 'rentres', 'etetages', 'cagibi', 'senats',
		'selenite', 'pontier', 'couvain', 'bavarois', 'neurula', 'biffes', 'hableur', 'genial', 'augurera', 'retentit',
		'filames', 'mandait', 'reggae', 'durates', 'piferas', 'trompez', 'caftasse', 'decimai', 'survenez', 'sagittee',
		'sevirai', 'cahotais', 'palisse', 'meublent', 'skipper', 'venerat', 'dehalas', 'assagira', 'coderait', 'jabotais',
		'ravises', 'appuyee', 'eploya', 'estes', 'bleuiras', 'ecorcez', 'tarifent', 'enclorez', 'bistrant', 'serpule',
		'tendons', 'generont', 'nombrer', 'sciiez', 'noues', 'coursez', 'dextrose', 'corniaud', 'port', 'pochai',
		'alignas', 'malice', 'dame', 'vaporeux', 'liquidee', 'navarque', 'talisman', 'outan', 'principe', 'innovera',
		'ixee', 'pleurer', 'grains', 'liserons', 'enligne', 'spleens', 'durcis', 'apposait', 'avocates', 'chamade',
		'nervures', 'sections', 'bramerai', 'percue', 'leguee', 'amarre', 'talion', 'entrave', 'recreais', 'barbu',
		'autostop', 'rhumee', 'scrutat', 'minutas', 'anise', 'bossoir', 'luit', 'chavirai', 'viennent', 'signames',
		'mollites', 'rude', 'datages', 'foirat', 'jupiere', 'harpon', 'decavai', 'macleras', 'encoffre', 'invitais',
		'ridames', 'touret', 'fessasse', 'pavais', 'voilasse', 'crampsez', 'prieures', 'innova', 'emises', 'resigna',
		'viseurs', 'rayonnee', 'croutais', 'murira', 'gageait', 'conjure', 'delutes', 'delesta', 'caquetas', 'venuste',
		'venant', 'razzions', 'envahie', 'plumions', 'defige', 'herbai', 'oirions', 'tommies', 'salates', 'menacent',
		'noterais', 'tronait', 'encolles', 'devasees', 'bort', 'bougions', 'fichiez', 'entat', 'galon', 'vaccinai',
		'julep', 'balisier', 'glandas', 'taperent', 'margines', 'renaclai', 'gaiment', 'criblai', 'tribunes', 'dejouee',
		'collent', 'flueront', 'dialysat', 'farter', 'tavellat', 'mule', 'habitas', 'severes', 'casas', 'lofait',
		'atteint', 'detirez', 'imite', 'resu', 'fourrons', 'felicita', 'degomme', 'redonnat', 'radote', 'pronai',
		'jaugeant', 'empuse', 'branchat', 'ferions', 'clapotes', 'kolatier', 'enlaidie', 'alunerez', 'egrappat', 'clavees',
		'glissat', 'prefacez', 'comblees', 'permutas', 'gaveras', 'penarde', 'polites', 'enlignes', 'loquai', 'deborder',
		'affute', 'nuiez', 'rivetee', 'secteur', 'carabins', 'palottes', 'prevoit', 'ondulee', 'hela', 'nagerez',
		'lamier', 'trial', 'marnee', 'marinee', 'kreuzer', 'ragotant', 'atonie', 'grumelez', 'toastent', 'peupler',
		'vireton', 'epissee', 'pissa', 'emparer', 'cajolez', 'bavassa', 'nopas', 'antilope', 'bayions', 'decote',
		'endiguer', 'peintres', 'deplumai', 'jeunions', 'tournai', 'ignorons', 'postula', 'clairets', 'surdouai', 'officiel',
		'parjura', 'draper', 'saunez', 'trousse', 'urgea', 'rible', 'poisse', 'fraisera', 'passions', 'couinat',
		'engoules', 'raclames', 'cyanosez', 'jasasse', 'cana', 'zippasse', 'alarmera', 'chatiant', 'gauchit', 'delayent',
		'braderez', 'blousera', 'rigolo', 'clarias', 'salades', 'cireur', 'historie', 'trompe', 'briffant', 'cabotas',
		'sismaux', 'racolai', 'effanait', 'denichat', 'reglable', 'cambrait', 'arcasse', 'epaulant', 'refluer', 'legers',
		'degout', 'lesinent', 'ponderas', 'tapent', 'bleuimes', 'ouillera', 'enchere', 'manageat', 'plumames', 'rotant',
		'insanite', 'reluisez', 'seisme', 'aerienne', 'lattat', 'dosat', 'partants', 'elegir', 'marcha', 'frouasse',
		'ponts', 'clore', 'luths', 'remisa', 'ragent', 'louperas', 'dedorera', 'baleina', 'rangiez', 'anosmie',
		'lotions', 'vitalisa', 'signee', 'enviates', 'cobras', 'arquerez', 'agissant', 'kiffates', 'raffolez', 'eparses',
		'piller', 'emoulent', 'renfiler', 'serties', 'valorise', 'muret', 'debondat', 'busasses', 'goyavier', 'coquais',
		'sorguez', 'niaisiez', 'datage', 'rajuster', 'tuassiez', 'expatrie', 'crussiez', 'embrayer', 'lamerons', 'casee',
		'subirai', 'occise', 'damniez', 'rabouter', 'potto', 'resinees', 'dechoies', 'onguents', 'etirerai', 'encrepes',
		'pentes', 'hebetes', 'yatagans', 'brouilla', 'regorges', 'godillai', 'bazookas', 'brun', 'deloquez', 'senile',
		'insomnie', 'dopee', 'ecure', 'spires', 'buriniez', 'tumefier', 'donnes', 'veloce', 'relouiez', 'priorise',
		'alunirai', 'repayais', 'essorait', 'nuerons', 'steppage', 'glome', 'sphaigne', 'geloses', 'digeras', 'plumera',
		'elegisse', 'etampait', 'yoyotais', 'vainques', 'badames', 'biennale', 'bloques', 'aurions', 'oisif', 'commet',
		'extraira', 'jachera', 'briffez', 'chevalee', 'modifiai', 'ramoneur', 'aneantis', 'ravise', 'coudees', 'axeriez',
		'pigeront', 'torture', 'alertee', 'gommons', 'complete', 'matina', 'crayonne', 'arretee', 'eocene', 'sonniez',
		'feries', 'capsule', 'contesta', 'debineur', 'moqueuse', 'entendez', 'orna', 'mouliere', 'liantes', 'cramsais',
		'debine', 'ouvragez', 'reunimes', 'cabotees', 'potages', 'braquer', 'fermees', 'festoies', 'gelons', 'apposai',
		'vacille', 'velasse', 'forban', 'conjura', 'hafnium', 'flouons', 'hominise', 'oiront', 'cutanees', 'poserait',
		'ragotera', 'gazage', 'alexine', 'meprise', 'ebrasees', 'tituba', 'obsedons', 'hourda', 'rasseyez', 'braie',
		'usinait', 'maneges', 'tractai', 'minime', 'sauter', 'sable', 'divisera', 'englacat', 'halbrene', 'fayard',
		'berme', 'aboyons', 'strates', 'liftai', 'debattez', 'parfaits', 'frouees', 'veillai', 'resalez', 'pend',
		'recausat', 'gagnage', 'cloriez', 'joutera', 'gemirai', 'soulevai', 'cooperas', 'noteriez', 'gorgeons', 'depoli',
		'alize', 'infectez', 'monda', 'pondrai', 'flemme', 'repenses', 'sautera', 'gourma', 'verbeuse', 'fendant',
		'tallait', 'glandons', 'jugerons', 'singez', 'horrifie', 'yoyo', 'generai', 'luxe', 'dessoude', 'abrivent',
		'preferes', 'apax', 'chomates', 'azurasse', 'poulaine', 'huasses', 'ravalee', 'renetta', 'nippez', 'couves',
		'brunchat', 'realesee', 'slogan', 'geignes', 'bachotte', 'vaire', 'lugea', 'aspecte', 'nain', 'lattages',
		'batera', 'trouames', 'tributs', 'jetee', 'cabanes', 'muent', 'fourguer', 'tissions', 'pestates', 'pepites',
		'cisoires', 'cannona', 'methode', 'semeur', 'rentriez', 'harnache', 'chindai', 'delectee', 'aerera', 'plumai',
		'zoukait', 'froncas', 'baverai', 'ornent', 'tremie', 'spitter', 'delita', 'meditees', 'dragage', 'tiserons',
		'cedasse', 'fouines', 'surdoues', 'elucubre', 'resut', 'coroner', 'capitule', 'elevez', 'boitera', 'tabulee',
		'lobasses', 'radi', 'modales', 'compotee', 'teillais', 'pietant', 'laiche', 'maldonne', 'diurnaux', 'raiponce',
		'megotiez', 'rallions', 'brayions', 'arrentez', 'darda', 'tate', 'carneau', 'ephemere', 'ontique', 'appretee',
		'remacha', 'encirez', 'ebraisez', 'nacrent', 'prendras', 'brisiez', 'platane', 'voguant', 'ongliers', 'jaffas',
		'prierent', 'borderas', 'lesiniez', 'lycene', 'reposais', 'flegmon', 'frite', 'atteste', 'affiliat', 'joncions',
		'orgasme', 'flinguez', 'brocs', 'tourte', 'tercent', 'dompteur', 'fourreur', 'bonbons', 'fourrera', 'carnages',
		'remariez', 'ermite', 'vortex', 'halite', 'chatiait', 'volerais', 'encadra', 'veltas', 'enclaves', 'enserres',
		'vouliez', 'decapiez', 'laicisat', 'cannage', 'rheostat', 'fouimes', 'voudrait', 'arasait', 'equipe', 'triplez',
		'gobions', 'hissasse', 'balourd', 'grenez', 'thesards', 'hure', 'doteront', 'moulure', 'loyer', 'entoir',
		'contumax', 'decrocha', 'dinerait', 'moitant', 'tetait', 'aboyee', 'lorgnon', 'boyautee', 'lutter', 'dragonne',
		'saturnin', 'depayser', 'maturant', 'hongrer', 'singiez', 'pouls', 'loufe', 'detonera', 'lugeront', 'loupames',
		'cabiai', 'squameux', 'pacquage', 'amene', 'otasse', 'moderee', 'nasillai', 'gondolas', 'fadees', 'toux',
		'revisera', 'devances', 'folioles', 'hoyau', 'ecula', 'viandera', 'vexant', 'duvetait', 'saoulez', 'veillant',
		'spathes', 'egayer', 'cablee', 'ragreer', 'eventera', 'vivifias', 'caillete', 'naira', 'choyait', 'drossera',
		'feces', 'composas', 'prevoyez', 'rechigna', 'arnica', 'desastre', 'revois', 'brunche', 'placage', 'reposoir',
		'formatez', 'friands', 'roqueras', 'effanera', 'assisse', 'nunataks', 'lustrais', 'serierez', 'dorerais', 'baril',
		'tendais', 'gardeuse', 'dedains', 'marinons', 'dumes', 'pavasse', 'fripasse', 'septupla', 'deroutez', 'rotors',
		'cultuel', 'decruas', 'torique', 'fixeras', 'grugeas', 'miterai', 'protome', 'liberale', 'sechage', 'dispersa',
		'transat', 'khedive', 'fayote', 'bittai', 'appeles', 'ailloli', 'ventais', 'eventais', 'virtuose', 'bruirent',
		'chausses', 'bardames', 'ascite', 'adherer', 'droppai', 'banneton', 'cupide', 'gnognote', 'tenonner', 'rires',
		'touerait', 'adulas', 'alienant', 'benzoyle', 'alitons', 'nomment', 'baisers', 'contres', 'hurleur', 'agregeas',
		'droper', 'vitulent', 'scia', 'chromate', 'abjurer', 'luttions', 'basas', 'sesame', 'raquames', 'medias',
		'enciras', 'dents', 'giclera', 'samedis', 'gorfou', 'sacquas', 'refond', 'tartuffe', 'clapasse', 'flouions',
		'mascotte', 'epurait', 'mercanti', 'vedas', 'amassez', 'factitif', 'guident', 'latterai', 'peaussez', 'editions',
		'finerie', 'egouttat', 'ehahirez', 'languies', 'surine', 'gradua', 'soul', 'caletait', 'pralins', 'empyeme',
		'zwanze', 'deboulai', 'tetant', 'accretat', 'cils', 'lochat', 'chourave', 'eduquas', 'borain', 'poulpe',
		'fieu', 'rendort', 'kirsch', 'vendras', 'pesions', 'derada', 'manquiez', 'pilees', 'deprimer', 'chinee',
		'truffant', 'lippus', 'decausa', 'refuiras', 'environs', 'peagere', 'pidgin', 'atomisa', 'campos', 'tatasses',
		'becotiez', 'mitez', 'ecremiez', 'remarcha', 'ampoules', 'airant', 'derasent', 'detaxant', 'trullo', 'abordas',
		'filmes', 'voyou', 'crabier', 'fissura', 'vengiez', 'glosais', 'erayons', 'lynchait', 'blatere', 'debattu',
		'eborgnas', 'epiat', 'obstruas', 'betail', 'verdeurs', 'herissai', 'allegez', 'diapause', 'poilee', 'cafte',
		'dominez', 'editait', 'dieppois', 'etetees', 'housser', 'paquetez', 'agraphie', 'abcedas', 'epithete', 'labiee',
		'rosaire', 'suspects', 'deballer', 'brisates', 'relusse', 'elect', 'excreta', 'memement', 'recycle', 'minat',
		'haste', 'sarraux', 'venames', 'ordre', 'piochant', 'baguent', 'ponctuee', 'severite', 'raille', 'obturent',
		'moteurs', 'moumoute', 'armerait', 'dicterez', 'gemmera', 'modus', 'consolez', 'ficelons', 'larvees', 'guet',
		'saunent', 'drivein', 'ebroues', 'satonna', 'foliotas', 'encorna', 'intailla', 'devissas', 'cremas', 'assortie',
		'obseder', 'raflera', 'obligent', 'divergee', 'tractait', 'racinez', 'etarquee', 'resine', 'faderent', 'iguanes',
		'fumerait', 'brisai', 'episser', 'allouant', 'solaires', 'pickles', 'naivete', 'surjette', 'divertit', 'gazelles',
		'affina', 'bouclees', 'recorder', 'sterilet', 'telexez', 'tempetas', 'secouas', 'vessigon', 'aviniez', 'pharaon',
		'orientee', 'salle', 'eschat', 'preste', 'mitrons', 'mourait', 'depravee', 'votres', 'accelere', 'cliviez',
		'rebrodes', 'liftant', 'pannez', 'retapee', 'emiettee', 'nacelles', 'retaper', 'pachtos', 'messers', 'cetera',
		'effilent', 'cartonne', 'charpies', 'elancais', 'remisez', 'verisme', 'picoree', 'cangue', 'rucherez', 'nubile',
		'cura', 'inoccupe', 'reinette', 'abordee', 'tapissee', 'secouent', 'faciales', 'arment', 'deputant', 'attitras',
		'polluas', 'paille', 'hoquetat', 'amplifia', 'nopee', 'gisaient', 'elinguez', 'decloses', 'reglames', 'croquees',
		'sumac', 'rocquat', 'rapporte', 'jasions', 'carenai', 'river', 'explorez', 'vibrant', 'epluches', 'sondas',
		'sechions', 'arrise', 'glacerez', 'saccadee', 'scieras', 'blatera', 'enjoncer', 'appatee', 'scheider', 'surlias',
		'remisse', 'rhetais', 'merlins', 'aichions', 'beurrais', 'piperiez', 'demontas', 'depliee', 'clonasse', 'soudasse',
		'loquant', 'debogues', 'nickelez', 'papion', 'sana', 'pilets', 'arbitre', 'engin', 'tudieu', 'cuberez',
		'clamsee', 'chialez', 'limeriez', 'entolees', 'pokers', 'campant', 'ponceux', 'mourons', 'sapajou', 'teletype',
		'saye', 'demis', 'malfaits', 'remuants', 'recale', 'resalons', 'piauler', 'concoure', 'freesia', 'cabale',
		'sene', 'gueer', 'agnelin', 'employai', 'draguais', 'assurees', 'lumes', 'fixation', 'dystocie', 'piaulees',
		'carottee', 'saugrenu', 'aererons', 'irritera', 'roser', 'renier', 'baquette', 'elbot', 'atterrit', 'sortie',
		'remmenat', 'acensant', 'redentee', 'defunte', 'enjuivai', 'radoub', 'dressant', 'rala', 'etageai', 'enrocher',
		'chinoise', 'inondera', 'vivions', 'attiger', 'embarras', 'causez', 'angevine', 'armat', 'fauverie', 'demolie',
		'emotives', 'aggraves', 'areoles', 'vandale', 'chabla', 'neon', 'finassa', 'ameuta', 'deboules', 'lunch',
		'lavee', 'sujet', 'godillez', 'ouiras', 'repends', 'sursemat', 'olive', 'accules', 'palpames', 'blesant',
		'clignee', 'rarefiai', 'animiste', 'torrefia', 'cosmos', 'crevoter', 'baffat', 'declot', 'sarment', 'debiteur',
		'spitta', 'hercules', 'chromees', 'embrasez', 'farderai', 'tachates', 'lustrera', 'rablure', 'crantent', 'baclames',
		'vespides', 'apportat', 'effrois', 'rayerent', 'decussee', 'minimale', 'occuper', 'javelais', 'reelit', 'reglure',
		'feleras', 'patinas', 'pondons', 'verrats', 'viandes', 'depecage', 'midship', 'bouviere', 'taie', 'epargnat',
		'malaxiez', 'harceler', 'ratiez', 'agreas', 'cranees', 'rompons', 'songeait', 'courber', 'madefiee', 'ravagent',
		'folatres', 'joual', 'staffes', 'employez', 'medise', 'ronchons', 'briqua', 'bistouri', 'maclerez', 'poivrant',
		'nantit', 'craqueta', 'bottier', 'galbera', 'etroites', 'nitruree', 'simuliez', 'bilabiee', 'puristes', 'frisse',
		'vareuse', 'mourras', 'eclopee', 'assola', 'transira', 'vomiras', 'sellerez', 'mucheras', 'desunir', 'notees',
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
