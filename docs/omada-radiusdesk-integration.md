**# Omada ↔️ RadiusDesk — Analyse & Plan d’intégration

Ce mémo consolide (1) l’état actuel des flux RadiusDesk/FreeRADIUS dans `rdcore`, (2) les capacités déjà livrées côté portail captif Node/React (`dev/captive-portail`), et (3) le design cible pour offrir une intégration Omada équivalente à l’intégration Mikrotik historique.

## 1. Implémentation RadiusDesk existante

| Domaine                     | Références clés                                                                                                                | Description                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentification RADIUS     | `cake4/rd_cake/src/Controller/ThirdPartyRadiusController.php` lignes 17‑120                                                    | RadiusDesk orchestre des tests PAP/CHAP/EAP via `radclient` pour valider les `PermanentUsers`, `Vouchers` ou `Devices`. Les attributs `radcheck`/`radreply`/`radgroupreply` issus des profils déterminent Accept/Reject, quotas, VLAN/IP Pool.                                                                                                                            |
| Tables SQL                  | `setup/db/rd.sql` lignes 5333‑5385 (`radacct`), 5859‑5870 (`radreply`), 5700‑5791 (`radcheck`/`radgroupcheck`/`radgroupreply`) | `radacct` stocke `acctstarttime`, `acctstoptime`, octets (`acctinputoctets`, `acctoutputoctets`), MAC (`callingstationid`) et cause de terminaison. Les tables `radcheck/radreply` fournissent les attributs renvoyés en Access‑Accept (bandwidth, VLAN, session‑timeout) et `radacct_history` archive les sessions fermées.                                              |
| Usage & sessions            | `docs/radiusdesk-endpoints.md` lignes 88‑118, `cake4/rd_cake/src/Controller/RadacctsController.php` lignes 1‑120               | `/radaccts/get-usage.json` calcule `data_used`, `time_used`, `depleted` en combinant `MacUsages` + `PermanentUsers` + `Vouchers` + profils (`Counters`). `/radaccts/index.json` sert de matrice pour l’UI et tire directement d’`radacct`.                                                                                                                                |
| CoA / Disconnect            | `cake4/rd_cake/src/Controller/Component/KickerComponent.php` lignes 17‑198                                                     | `RadacctsController::kickActive*` appelle `Kicker->kick($ent,$token)` qui discrimine le NAS (Coova, Accel, private_psk, Juniper, Mikrotik API). Pour Mikrotik, il reconstruit la connexion API et supprime la session `/ip/hotspot/active` ou `/ppp/active`. Pour Juniper/Coova il envoie des PoD (`radclient`).                                                          |
| Profils simple/advanced/FUP | `cake4/rd_cake/src/Controller/ProfilesController.php` lignes 821‑1040, 1040‑1180                                               | Les profils “simple/advanced” alimentent `Radgroupchecks/Radgroupreplies` avec des attributs propriétaires `Rd-*` (reset data/time, cap type). `ProfileFupComponents` ajoutent `Rd-Fup-Bw-Up`, `Rd-Fup-Profile-Id`, `Rd-Fup-Ip-Pool`, etc., puis `AppliedFupComponents` exécutent les bascules via un “FUP calculator” (cron) qui applique les overrides dans `radreply`. |
| Services Node existants     | `backend/src/services/radiusdeskIntegration.ts`, `usageService.ts`, `authService.ts`, `omadaIntegration.ts`                    | `radiusdeskIntegration` proxy `/dynamic-details`, `/permanent-users`, `/radaccts` pour la React app et normalise la télémétrie. `usageService` fusionne `/radaccts/get-usage` et `/radaccts/index`. `authService` vérifie les identifiants RD (permanent/voucher), génère un `requestId`, puis délègue à `omadaIntegration.authorizeClient`.                              |

**Flux complet (Accept → Accounting → CoA)** :

1. FreeRADIUS consulte `radcheck/radreply` associés à l’utilisateur (saisi via UI ou API). Les attributs `Rd-` (cap, data, FUP) sont ajoutés à `radgroupcheck`/`radgroupreply` lors des publications de profils.
2. Sur Access‑Accept, FreeRADIUS écrit une entrée `radacct` (start + updates). RadiusDesk expose ces données via `/radaccts/*.json`.
3. Les kicks manuels appellent `RadacctsController::kickActive` → `KickerComponent`, qui choisit la bonne stratégie (Mikrotik API, PoD, MQTT) pour envoyer une requête CoA/Disconnect. Les composants tiers (Accel, Meshdesk) plantent des drapeaux `disconnect_flag` ou publient des jobs MQTT.
4. Les profils FUP utilisent `ProfileFupComponents` et `AppliedFupComponents` pour pousser des overrides (ex: appliquer un profil bridé `groupname = FupAdd_<profileId>` dans `radgroupchecks`). Les tâches planifiées appliquent les nouveaux attributs ou restaurent les limites après expiration.

## 2. Mikrotik ↔ Omada : points d’intégration

| Capability               | Mikrotik (actuel)                                                                                  | Omada (cible)                                                                                                                                                                              | Écart                                                                                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth portail             | Hotspot ou PPPoE via RADIUS standard, rien à faire côté RouterOS (Access‑Accept suffit).           | Mode cible : **Hotspot Omada + “RADIUS Server”** avec notre FreeRADIUS/RadiusDesk comme NAS, et page d’auth personnalisée via **“Import Customized Page”**. En variante, **Portal Customization = External Web Portal (HTTP/HTTPS)** avec `Authentication Type = RADIUS Server` actif : Omada continue d’interroger FreeRADIUS pour l’authentification et d’envoyer l’Accounting RADIUS standard. L’OpenAPI northbound ne modélise pas ces flux et n’expose pas d’endpoint `/hotspot/extPortal/*`. | Le design “parfait Mikrotik‑like” consiste à utiliser Omada comme simple NAS RADIUS (auth + accounting) – que la page soit importée ou externalisée – et à réserver l’OpenAPI aux opérations de gestion (liste de clients, déconnexion), comme on le fait avec l’API Mikrotik.               |
| Fonction                          | MikroTik                                                                                          | Omada SDN / Cloud                                                                                                                                                               | Impact backend                                                                                                                                              |
|-----------------------------------|---------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Détection session active          | `/ip/hotspot/active/print`, `/ppp/active/print` via `MikrotikApiComponent` (lignes 17-108).      | Utiliser l’Omada OpenAPI (**Client**) : `GET /openapi/v1/{omadacId}/sites/{siteId}/clients` (`getGridActiveClients`) + `GET /openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}` (`getClientDetail`) pour lister les clients actifs. | Prévoir un éventuel `OmadaSessionsStore` si l’on doit persister la corrélation `authCode ⇔ username` issue du portail externe (non exposée telle quelle par l’OpenAPI). |

| Fonction    | MikroTik                                                                                                                       | Omada SDN / Cloud                                                                                                                                                                                                                                                                                 | Impact backend                                                                                                                                                                                                                                              |
|------------|----------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Kick / CoA | `KickerComponent` + `MikrotikApiComponent::kickRadius` (API RouterOS) et fallback `radclient` PoD (Disconnect-Request RFC5176). | OpenAPI documente des endpoints HTTP de déconnexion : `POST /openapi/v1/{omadacId}/sites/{siteId}/hotspot/clients/{clientMac}/unauth` (`Authorized Client / cancelAuthClient`), `POST /openapi/v1/{omadacId}/sites/{siteId}/hotspot/authed-records/{id}/disconnect` (`disconnectHotspotAuthedClient`) et `POST /openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}/disconnect` (`Client / disconnectClient`). La documentation OpenAPI ne mentionne pas explicitement le support RADIUS Disconnect-Request / RFC5176 côté Omada. | Implémenter un `OmadaCoaService` qui, pour les NAS de type Omada, appelle les endpoints OpenAPI ci‑dessus (au minimum `cancelAuthClient` sur `{omadacId, siteId, clientMac}`) pour dé-authentifier le client portail. Garder `radclient` CoA/PoD comme mécanisme générique côté FreeRADIUS pour les autres NAS. |

|| Fonction       | MikroTik                                                                                                                                   | Omada SDN / Cloud                                                                                                                                                                                                                       | Impact backend                                                                                                                                                                                                                                                              |
|----------------|--------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Profils / quotas | RouterOS gère les profils (rate-limit, time/bytes quota…) et applique les limites; RadiusDesk pousse les attributs `Rd-*` dans l’Access-Accept. | L’OpenAPI Omada ne décrit ni profils RADIUS ni attributs RADIUS/WISPr individuels; elle manipule des entités métier (vouchers, Rate Limit profiles, Hotspot settings) indépendamment du détail des attributs transmis par FreeRADIUS. | Les offres commerciales (durée, volume, FUP…) restent entièrement modélisées côté RadiusDesk/FreeRADIUS via les attributs `Rd-*` et les tables `radcheck/radreply`. L’“access token” mentionné dans l’OpenAPI est le jeton OAuth2 utilisé pour authentifier les appels northbound, et ne représente pas un profil utilisateur RADIUS. |


## 3. Architecture proposée pour l’intégration Omada

### 3.0 Modes de portail Omada (Local vs External)

- **Mode Local Web Portal (page interne/importée)** :
  - Le contrôleur Omada héberge lui‑même la page de portail.
  - La personnalisation se fait via “Import Customized Page” à partir d’un bundle statique, désormais maintenu dans `frontend/omada-captive-portail-exemple`. Ce bundle reproduit une Dynamic Login Page RadiusDesk (Bootstrap 5, i18n, bloc usage) tout en conservant le flux RADIUS natif Omada.
  - Dans ce mode, notre projet `dev/captive-portail` n’héberge pas l’UI : les assets (HTML/CSS/JS) sont servis par Omada, mais ils consomment encore les endpoints publics RadiusDesk (`dynamic-details`, `radaccts`) pour le contenu dynamique/usage.
- **Mode External Web Portal (HTTP/HTTPS)** :
  - **Approche RadiusDesk native (cible actuelle)** : Omada redirige directement vers la Dynamic Login Page RadiusDesk via `https://<RD_HOST>/cake4/rd_cake/dynamic-details/omada-browser-detect?dynamic_key=<KEY>`. Le JS natif (`rdcore/login/cp/js/rdDynamic.js` + `rdConnect.js`) récupère les paramètres Omada (clientMac, ssidName, radioId…) depuis la query string, appelle `DynamicDetails::infoFor()` pour construire l’UI, puis parle directement à l’API Omada via `OmadaController::extPortalAuth()` sans passer par le portail Node/React.
  - `Authentication Type = RADIUS Server` reste actif : Omada continue d’envoyer l’authentification et l’accounting RADIUS vers FreeRADIUS/RadiusDesk, indépendamment du fait que la page soit locale ou externe.

Dans les deux modes, dès que `Authentication Type = RADIUS Server` est configuré :

- Omada agit comme NAS RADIUS (auth + accounting) pour RadiusDesk.
- `radacct` / `MacUsages` restent la source d’autorité pour l’usage, les quotas et la FUP.

#### 3.0.1 Bundle `frontend/omada-captive-portail-exemple`

- **Entrée / fichiers clés** :
  - `index.html` : deux onglets “Utilisateur” / “Voucher” totalement statiques. `assets/js/main.js` nettoie les champs à chaque changement d’onglet et poste les identifiants directement vers `/portal/radius/browserauth`.
  - `success.html` : page “Attente Info Conso” qui lit `username/password/clientMac` transmis par `main.js`. Elle effectue un compte à rebours de 15 s puis affiche un bouton + un lien vers `https://hotspot.techzone.lat/portal/success?fromOmada=1&username=...`, ce qui évite les erreurs CORS / certificats self-signés côté Omada.
  - `assets/js/portal-utils.js` : dictionnaire FR/EN et parsing de la query string (`clientMac`, `ssidName`, `infoUrl`, etc.).
  - `package.sh` : génère `omada-captive-portail-exemple.zip` (bundle importable dans l’UI Omada).
- **Flux** :
  1. L’appareil est redirigé vers `index.html?...` avec tous les paramètres Omada.
  2. `main.js` n’effectue plus aucun appel HTTP externe (pas de `dynamic-details`, donc aucun warning “Failed to fetch”). Seul le POST vers Omada est réalisé et `authType` est forcé à `2 = EXTERNAL_RADIUS` (ou `8 = RADIUS_ACCESS_TYPE` si `?authType=8` est passé dans l’URL du contrôleur) afin d’éviter l’erreur “invalid authentication type”.
  3. Après Accept, `main.js` transmet `username/password/clientMac/infoUrl` à `success.html`.
  4. `success.js` affiche un compte à rebours de 15 s (pour laisser Omada finaliser l’ouverture) puis propose un bouton + un lien qui ouvrent l’Espace Info Conso (React) déjà présent dans ce dépôt. L’URL contient `fromOmada=1`, ce qui supprime la demande de re-saisie des identifiants sur `/success`.
- **Pré-requis infra** :
  - Omada configuré en `Authentication Type = RADIUS Server` + `Accounting` vers FreeRADIUS/RadiusDesk (ports 1812/1813).
  - `Portal Customization = Local Web Portal`, import du ZIP via l’UI Omada, mode HTTPS recommandé.
  - Aucun appel AJAX n’étant effectué avant auth, seule l’URL finale de l’Espace Info Conso (`https://hotspot.techzone.lat/portal`) doit être ajoutée au walled garden si l’on souhaite autoriser l’ouverture avant levée captive.
  - Optionnel : passer `infoUrl=https://<domaine>/portal` dans la query string pour surcharger la cible de l’Espace Info Conso.
- **Validation rapide** :
  - Localement : `npx serve frontend/omada-captive-portail-exemple` puis `http://localhost:4173/index.html?clientMac=AA...&link_login_only=https://controller:8843/portal/radius/browserauth`.
  - En prod : importer `omada-captive-portail-exemple.zip`, associer au SSID, puis vérifier que les Access-Request/Accounting partent vers FreeRADIUS et qu’après 15 s la page “Info Conso” ouvre `https://hotspot.techzone.lat/portal/success?fromOmada=1&username=...`.

### 3.1 Nouveaux services côté RadiusDesk (PHP)

| Service                       | Emplacement                                                                                                                                                                                                            | Rôle                                                                                                                                                                                                                                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OmadaApiService` (component) | `cake4/rd_cake/src/Controller/Component/OmadaApiComponent.php` (nouveau)                                                                                                                                               | Wrap Cake `Http\Client` pour : `login()` (OAuth2/OpenAPI), appels `GET /openapi/v1/{omadacId}/sites/{siteId}/clients*` (`getGridActiveClients`, `getClientDetail`), et opérations de déconnexion (`cancelAuthClient`, `disconnectClient`, `disconnectHotspotAuthedClient`). Gère `access_token` OAuth2, refresh et TTL. |
| `OmadaCoaService`             | Peut être une méthode additionnelle dans `KickerComponent`                                                                                                                                                             | Lors d’un kick `RadacctsController::kickActive*`, déterminer si le NAS correspond à Omada (nouveau type `typeOmadaPortal`). Si oui, appeler `OmadaApiComponent->cancelAuthClient($omadacId, $siteId, $clientMac)` (voire `disconnectClient`) et, en cas d’échec, retomber sur `radclient` (Disconnect-Request) en utilisant `nasipaddress`. |
| Hooks Controllers             | `RadacctsController`, `PermanentUsersController`, `VouchersController`, `DynamicDetailsController`                                                                                                                     | Ajouter le type `OmadaPortal` dans les `DynamicClients` pour que la page Captive sache renvoyer `site`, `radioId`, `redirectUrl`. Prévoir `connect.omada_payload_template`.                                                                                                                        |
| Cron/Jobs                     | Si Omada nécessite un refresh des sessions (pas d’API), conserver un journal `omada_sessions` (table nouvelle) alimenté par notre backend Node (voir §3.2) et exposé à RadiusDesk via une API interne pour le support. |

Pseudo-code côté CakePHP (`KickerComponent`) :

```php
// nouveau type
protected $typeOmadaPortal = 'Omada-Portal';
...
if ($dc->type == $this->typeOmadaPortal) {
    $payload = [
        'clientMac'  => $ent->callingstationid,
        'siteId'     => $dc->site_id,
        'omadacId'   => $dc->omadac_id,
    ];
    try {
        // OpenAPI "Authorized Client / cancelAuthClient"
        $this->OmadaApi->cancelAuthClient($payload['omadacId'], $payload['siteId'], $payload['clientMac']);
    } catch (\Exception $ex) {
        $this->log('Omada disconnect failed, fallback radclient', 'error');
        $this->kickByDisconnectRequest($ent);
    }
}
```

### 3.2 Évolution du backend Node (`dev/captive-portail/backend`)

1. **`omadaIntegration` refactor** : séparer `OmadaSessionStore` (login, cookies) et `OmadaPortalClient`. En **mode External Portal** (optionnel), `OmadaPortalClient` gère `extPortal/auth` comme décrit dans `docs/omada-ext-portal.md`. En **mode Hotspot+RADIUS (cible)**, Omada reste un NAS RADIUS classique : `OmadaPortalClient` n’est pas sur le chemin d’auth, seules les APIs northbound sont utilisées pour la gestion (liste/CoA HTTP).
2. **`radiusdeskIntegration` enrichi** : lorsqu’un `ConnectResult` est `accepted` (via FreeRADIUS, comme pour Mikrotik), corréler la session RADIUS (`radacct`) avec la vue Omada à partir de `clientMac`/`site` (stockés lors de la redirection portail ⇒ page importée) dans `omadaSessions` (collection en mémoire ou Redis). Cette corrélation sert à retrouver la session Omada au moment d’un `/usage/disconnect`, mais l’OpenAPI ne consomme que `{omadacId, siteId, clientMac}`.
3. **`usageService.disconnectSessions`** : s’il s’agit d’un client Omada, appeler `omadaIntegration.cancelAuthClient(omadacId, siteId, clientMac)` (OpenAPI `hotspot/clients/{clientMac}/unauth`) avant `kickSessions`. On garde un fallback sur `/radaccts/kick-active` pour les NAS non Omada, exactement comme pour Mikrotik (CoA RADIUS générique).
4. **Mapping attributs** :
   - Identifiant de session RD (`username` ou `voucherCode`) utilisé comme `accessToken` dans le flux External Portal (cf. `docs/omada-ext-portal.md`), distinct de l’`access_token` OAuth2 de l’OpenAPI.
   - `site` / `radioId` / `redirectUrl` : repris de la query string Omada (frontend `useOmadaParams`) et stockés dans `ConnectRequestContext.omada`.
   - Les informations de profil/commercial restent dans RADIUS (`Rd-*`, WISPr éventuels) et ne sont pas exposées via l’OpenAPI; la manière dont le contrôleur applique ces attributs n’est pas décrite dans cette documentation.

Pseudo-code Node (extrait d’un futur `omadaCoa.ts`, basé sur l’OpenAPI) :

```ts
export async function cancelAuthClient(omadacId: string, siteId: string, clientMac: string) {
  const sess = await ensureOmadaApiSession(); // récupère access_token OAuth2
  await omadaApiClient.post(
    `/openapi/v1/${omadacId}/sites/${siteId}/hotspot/clients/${clientMac}/unauth`,
    undefined,
    {
      headers: { Authorization: `Bearer ${sess.accessToken}` },
    },
  );
}
```

### 3.3 Interaction avec FreeRADIUS

- Conserver les attributs `Rd-*` injectés par `ProfilesController` pour le shaping/FUP. Omada ne doit pas prendre de décision sur la bande passante.
- `CoA` côté RADIUS reste utile : si l’appel OpenAPI (`cancelAuthClient`/`disconnectClient`) échoue ou si un NAS non Omada est détecté, `kickSessions()` enverra un `Disconnect-Request` (radclient).
- `MacUsages` & `radacct` restent la source d’autorité pour la page Success; même avec Omada, `/radaccts/get-usage` fournit les quotas. Aucun changement de schéma nécessaire.

## 4. Plan d’implémentation

1. **Repérer les fichiers RadiusDesk** : consolider la cartographie dans `docs/radiusdesk-endpoints.md` (déjà fait) et identifier les hooks `KickerComponent`, `ProfilesController`, `radacct`. Vérifier les `DynamicClients` Omada (type à ajouter) et la structure `radacct` (cf. `rd.sql`).
2. **Services Omada (backend Node + CakePHP)** :
   - Backend Node : extraire `OmadaSessionStore`, consigner `authCode`, exposer `disconnect`.
   - CakePHP : créer `OmadaApiComponent` mutualisant login/auth/déconnexion (`cancelAuthClient`/`disconnectClient`) pour les besoins internes (CoA, cron).
3. **Raccordement auth/radacct/CoA** :
   - Avant Access‑Accept : RD continue d’évaluer les profils, mais `authService.connect` doit enregistrer `accessToken`/`requestId`.
   - Après Accept : stocker `authCode` ← réponse Omada pour pouvoir retrouver la session (table `omada_sessions` ou Redis).
   - Kick : `RadacctsController::kickActive*` → `KickerComponent` → `OmadaApiComponent->cancelAuthClient()` (ou `disconnectClient()`) + fallback RADIUS CoA.
4. **Mapping profils simple/advanced/FUP** :
   - Continuer à pousser `Rd-*` via `ProfilesController::_doRadius` et `_doRadiusFup` comme pour Mikrotik; Omada reçoit les mêmes attributs RADIUS depuis FreeRADIUS.
   - Documenter la correspondance attributs ↔ Omada pour la partie portail (paramètres de redirection, `site`, `radioId`, etc. utilisés dans la page importée) sans tenter de modéliser des “profils Omada” dans l’OpenAPI.
5. **Tests** :
   - **Unitaires Node** : simuler `authorizeClient`, `disconnect`, `sessionStore` avec `nock`.
   - **Unitaires CakePHP** : tests PHPUnit pour `OmadaApiComponent` (login retry, disconnect fallback) + `KickerComponent` nouveau type.
   - **Intégration** : Dredd contre `/connect/:mode`, `/usage`, `/usage/disconnect`. Playwright pour click-to-connect → disconnect.
   - **Fonctionnels** : scénarios Accept/Reject (permanent & voucher), déconnexion Omada, FUP bascule, quotas épuisés.

Ce plan couvre les items demandés : analyse détaillée des flux RadiusDesk/FreeRADIUS, comparaison Mikrotik vs Omada, architecture cible (services, pseudo-code, mapping), et feuille de route pas-à-pas pour l’implémentation.

---

## G6 — Cahier des charges portail Omada Hotspot ↔ RadiusDesk

### G6.1 Contexte & objectifs

- **Objectif principal** : obtenir une intégration “Mikrotik‑like” avec Omada, où :
  - FreeRADIUS/RadiusDesk restent la source d’autorité pour l’authentification, les profils, les quotas et l’accounting.
  - Omada joue le rôle de NAS RADIUS (auth + accounting) et de plateforme de gestion Wi‑Fi.
  - Les déconnexions/Kick sont pilotées par l’API northbound Omada (OpenAPI) comme on le fait avec l’API RouterOS.
- **Modes supportés** :
  - **Mode cible** : Hotspot Omada + “RADIUS Server” (FreeRADIUS/RadiusDesk) + “Import Customized Page”.
- **Mode optionnel** : External Portal Server (cf. `docs/omada-ext-portal.md`) avec `Authentication Type = RADIUS Server` actif : la signalisation RADIUS (auth + accounting) reste gérée par Omada vers FreeRADIUS/RadiusDesk, seule la page d’auth est externalisée.
- **Portée** :
  - Spécifier la page de portail importée côté Omada (Hotspot + RADIUS).
  - Décrire l’option External Portal et les adaptations nécessaires pour l’UX et le flux HTTP, sans remettre en cause le rôle central de `radacct` / `MacUsages` pour l’accounting.
  - Lister les modifications RadiusDesk (CakePHP + FreeRADIUS).
  - Lister les modifications backend du portail Node (API de connexion, usage, déconnexion).
  - **Bundle livré** : `frontend/omada-captive-portail-exemple/` (HTML/JS/CSS prêt à zipper via `zip -r omada-captive-portail-exemple.zip .`) qui consomme `dynamic-details/info-for.json` / `radaccts/get-usage.json` et poste les identifiants vers `/portal/radius/browserauth`.

### G6.2 Portail Hotspot + RADIUS (mode optione)

#### G6.2.1 Configuration Omada cible

- **Omada Hotspot** :
  - Activer un portail Hotspot sur le/les SSID concernés.
  - Choisir le type d’authentification **“RADIUS Server”** avec :
    - `RADIUS Auth Server` = FreeRADIUS (lié à RadiusDesk).
    - `RADIUS Accounting` activé vers le même serveur.
  - Activer **“Import Customized Page”** pour la page d’authentification.
- **Rôle de la page importée** :
  - Héberger la logique UI (login/voucher) mais laisser la décision d’Accept/Reject à FreeRADIUS.
  - Transmettre au backend portail les paramètres Omada utiles : `clientMac`, `site`, `radioId`, `ssidName`/`vid`, éventuellement un identifiant de session Omada si disponible.
  - Supporter un mode “multi‑NAS” : la même page peut être importée sur plusieurs SSID/sites avec des paramètres dynamiques.

> **Remarque** : le dossier `frontend/omada-captive-portal-exemple` (lorsqu’il est présent dans l’arborescence) représente un exemple de portail local compatible Omada. Il doit être conservé comme référence technique/UX pour le mode Local Web Portal et ne doit pas être cassé par les évolutions du projet `dev/captive-portail`.

#### G6.2.2 Exigences UI/UX de la page importée

- **Formulaires** :
  - Support minimal : login par **PermanentUser** (username/password) et login par **Voucher**.
  - Compatibilité avec l’héritage @rdcore/login (Dynamic Login) : thèmes, messages d’erreur, layout responsive.
  - Gestion des messages d’erreur (auth refusée, quota épuisé, profil expiré).
- **Flux utilisateur** :
  - On affiche un formulaire unique qui :
    - Récupère les paramètres Omada (query string).
    - Envoie les identifiants à une API backend (`/connect/omada-hotspot` par exemple).
    - Redirige vers la page “Success” (Info Conso) en cas d’Accept.
  - La page Success ne doit pas contenir de QR/WhatsApp/PDF (conformité PLAN_PROMPTS).
- **Internationalisation** :
  - Texte et labels compatibles avec la stratégie i18n existante du portail.

#### G6.2.3 Exigences backend Node pour Omada Hotspot

- **Nouveaux endpoints** :
  - `POST /connect/omada-hotspot` :
    - Body : identifiants (username/password ou voucher), paramètres Omada (`clientMac`, `site`, `radioId`, `ssidName`/`vid`, identifiant AP/gateway si disponible).
    - Rôle :
      - Valider les identifiants via RadiusDesk (`authService` / `ThirdPartyRadiusController`).
      - Ne pas faire d’API HTTP vers Omada pour l’Accept (c’est FreeRADIUS qui renvoie Access‑Accept).
      - Enregistrer un `requestId` / contexte de session (comme pour Mikrotik) pour la page Success.
  - `GET /usage/omada-hotspot` :
    - Retourne les informations de consommation (temps/data) en s’appuyant sur `/radaccts/get-usage` et la corrélation `clientMac`/`radacct`.
- **Session & corrélation** :
  - Stocker la corrélation `{clientMac, site, radacctId, requestId}` dans `OmadaSessionStore`.
  - Pouvoir retrouver la session Omada à partir de `clientMac` pour déclencher un kick via OpenAPI.

### G6.3 External Portal Omada (mode cible)

#### G6.3.1 Rappel des contraintes

- External Portal décrit dans `docs/omada-ext-portal.md` :
  - Flux HTTP `extPortal/auth` + cookie jar opérateur.
  - Omada décide d’ouvrir/fermer la session en fonction de la réponse du portail.
  - Dès lors que `Authentication Type = RADIUS Server` est activé, Omada continue d’émettre les paquets RADIUS **Accounting** (Start / Interim‑Update / Stop) vers FreeRADIUS/RadiusDesk, exactement comme en mode portail local.

#### G6.3.2 Accounting et implications pour RadiusDesk

- **Constat** : en mode **Hotspot + RADIUS Server + External Web Portal**, `radacct` et `MacUsages` restent la source d’autorité pour l’usage (temps/data), comme en portail local.
- Il n’est **pas nécessaire** de reconstruire un pseudo‑accounting à partir de l’OpenAPI Omada (`Client`/`Hotspot`) tant que le contrôleur continue d’agir comme NAS RADIUS vers FreeRADIUS.
- Les profils simple/advanced/FUP, les quotas et la logique de FUP restent gérés par les attributs `Rd-*` et la pipeline RadiusDesk, sans changement de schéma pour `radacct`.
- **Exigences frontend** :
  - Adapter les Dynamic Login Pages pour :
    - Gérer le cas où Omada redirige directement vers le portail externe (`/api/v2/hotspot/extPortal/auth`).
    - Continuer à renvoyer les paramètres Omada (`clientMac`, `site`, `radioId`, `redirectUrl`).
- **Exigences backend Node** :
  - Réutiliser `OmadaPortalClient` (cf. G1.3) pour `extPortal/auth`.
  - Après succès, corréler la session (authCode, clientMac, site) à un `radacct` si présent, sinon à une entrée `omada_sessions` pour usage ultérieur (usage/kick).

### G6.4 Modifications RadiusDesk / FreeRADIUS

#### G6.4.1 DynamicClients & NAS Omada

- Ajouter un type `OmadaPortal` dans les `DynamicClients` RadiusDesk :
  - Champs nécessaires : `nasname` (IP/hostname contrôleur), `secret`, `omadac_id`, `site_id`.
  - Permettre au `KickerComponent` d’identifier un NAS Omada.

#### G6.4.2 CoA / Kick Omada

- Étendre `KickerComponent` :
  - Nouveau branchement pour `typeOmadaPortal` :
    - Récupérer `callingstationid` (MAC client) et les métadonnées de site depuis `DynamicClients`.
    - Appeler `OmadaApiComponent->cancelAuthClient($omadacId, $siteId, $clientMac)` (voire `disconnectClient`, `disconnectHotspotAuthedClient` selon le cas).
    - En cas d’échec, fallback sur le CoA RADIUS générique (`kickByDisconnectRequest`).

#### G6.4.3 Profils & quotas

- Aucun changement de logique métier sur les profils :
  - Les profils simple/advanced/FUP restent modélisés via `ProfilesController` et les attributs `Rd-*`.
  - Omada reçoit uniquement les attributs RADIUS standard + `Rd-*` via FreeRADIUS.
- S’assurer que les vues `radaccts/get-usage` couvrent les clients Omada comme les clients Mikrotik.

### G6.5 Modifications backend portail (Node)

#### G6.5.1 Services Omada côté Node

- **`OmadaSessionStore`** :
  - Stocker pour chaque session : `{requestId, username/voucher, clientMac, site, radacctId?, isOmada: true}`.
  - Expirer les entrées selon un TTL cohérent avec les sessions Hotspot.
- **`OmadaPortalClient`** :
  - En mode Hotspot+RADIUS : limité aux opérations de gestion (listes clients, déconnexion).
  - En mode External Portal : gérer `hotspot/login` et `extPortal/auth` comme décrit dans `docs/omada-ext-portal.md`.

#### G6.5.2 API publiques

- Ajouter/adapter les endpoints suivants :
  - `POST /connect/omada-hotspot` (cf. G6.2.3).
  - `POST /usage/disconnect` :
    - Si `isOmada === true` pour la session :
      - Appeler `omadaIntegration.cancelAuthClient(omadacId, siteId, clientMac)` avant de déclencher `kickSessions()` côté RadiusDesk.
    - Sinon, conserver le comportement existant (CoA RADIUS seul).

### G6.6 Tests, observabilité et documentation

- **Tests** :
  - Tests unitaires Node : couvrir `connect/omada-hotspot`, `usage/disconnect` en mode Omada, y compris les cas d’échec OpenAPI (retour sur CoA RADIUS).
  - Tests unitaires CakePHP : `OmadaApiComponent` (login OAuth2, `cancelAuthClient`) et `KickerComponent` pour le type Omada.
  - Tests d’intégration : scénarios Hotspot+RADIUS (Accept/Reject, quotas, kick), scénarios External Portal optionnels.
- **Observabilité** :
  - Ajouter des métriques de compteur pour les appels OpenAPI (`omada_api_requests_total`, labellisées par `operationId` / résultat).
  - Tracer les kicks Omada (`omada_disconnects_total` par site/issue).
- **Documentation** :
  - Compléter la documentation interne avec :
    - Guide de configuration Omada (Hotspot+RADIUS, Import Customized Page, External Portal en option).
    - Exemple de mapping entre `DynamicClients` Omada et la configuration du contrôleur.

## Prompts d’implémentation Omada Hotspot ↔ RadiusDesk

### Prompt G6.F1 — Consolidation du mode Local Web Portal

**Contexte**  
Omada est configuré en Hotspot avec `Authentication Type = RADIUS Server` et `Portal Customization = Local Web Portal` (page interne ou importée). Le bundle `frontend/omada-captive-portal-exemple` sert de base de portail local compatible Omada (voucher, local user, RADIUS, form auth…).

**Objectif**  
Consolider ce mode Local Web Portal en :
- préservant `frontend/omada-captive-portal-exemple`,
- documentant clairement son rôle et ses possibilités,
- garantissant la compatibilité avec RadiusDesk/FreeRADIUS (auth + accounting).

**Périmètre & fichiers concernés**  
- `frontend/omada-captive-portal-exemple` (structure, README, assets).  
- `docs/omada-radiusdesk-integration.md` (section modes Local/External).  
- Éventuellement `docs/` annexes si besoin (guide d’intégration Omada).

**Étapes d’implémentation**  
1. Auditer le bundle `frontend/omada-captive-portal-exemple` (types d’auth supportés, paramètres attendus, hooks Omada).  
2. Documenter son comportement dans `docs/omada-radiusdesk-integration.md` (modes supportés, limites, scénarios cibles).  
3. Vérifier que la configuration Omada “Import Customized Page” avec ce bundle fonctionne en conjonction avec `Authentication Type = RADIUS Server` (auth + accounting RADIUS vers RadiusDesk).  
4. Ajouter, si nécessaire, un guide succinct (README) dans `frontend/omada-captive-portal-exemple` expliquant comment builder et importer le bundle dans Omada.  

**Contraintes**  
- Ne pas casser le bundle existant : pas de refacto profond ni de dépendance directe avec le monorepo `frontend/`.  
- Ne pas introduire de logique spécifique RadiusDesk dans ce bundle (il doit rester générique pour Omada).  

**Critères d’acceptation / tests**  
- Un opérateur peut :  
  - builder/importer le bundle `omada-captive-portal-exemple` dans Omada,  
  - s’authentifier (voucher/local user/RADIUS) et voir ses sessions apparaître dans `radacct`.  
- La doc explique clairement comment configurer Omada pour ce mode (Hotspot + RADIUS Server + Local Web Portal).  

---

### Prompt G6.F2 — Implémenter le mode External Web Portal (HTTP/HTTPS)

**Contexte**  
Omada est configuré avec :  
- `Authentication Type = RADIUS Server` (NAS Omada → FreeRADIUS/RadiusDesk),  
- `Portal Customization = External Web Portal` vers l’URL publique du portail React/Node (`PORTAL_PUBLIC_URL`).  
Le backend dispose déjà d’un client `omadaIntegration` pour `hotspot/login` / `extPortal/auth`, et le frontend récupère les paramètres Omada via `useOmadaParams`.

**Objectif**  
Rendre le mode External Web Portal pleinement fonctionnel en :  
- orchestrant le flux complet (redirection Omada → portail → `/connect/:mode` → `extPortal/auth` → landing page),  
- tout en conservant l’accounting RADIUS standard vers RadiusDesk.

**Périmètre & fichiers concernés**  
- Backend :  
  - `backend/src/config.ts` (flag de mode External).  
  - `backend/src/services/omadaIntegration.ts` (client HTTP Omada).  
  - `backend/src/services/authService.ts` (orchestrateur connect + extPortal/auth).  
  - `backend/src/routes/connect.ts` (endpoint `/connect/:mode`).  
- Frontend :  
  - `frontend/src/hooks/useOmadaParams.ts`.  
  - `frontend/src/modules/dynamic/connectUtils.ts`.  
  - `frontend/src/modules/dynamic/ConnectPanel.tsx`.  
  - `frontend/src/pages/Home.tsx`.  
- Documentation :  
  - `docs/omada-ext-portal.md`.  
  - `docs/omada-radiusdesk-integration.md` (sections G6.2 / G6.3).
  - https://use1-omada-northbound.tplinkcloud.com/v3/api-docs 

**Étapes d’implémentation**  
1. **Configuration** :  
   - Ajouter un flag `OMADA_EXTERNAL_PORTAL_ENABLED` dans `backend/src/config.ts` (déjà présent si ce prompt a été appliqué une première fois), par défaut `true`.  
   - Documenter la variable dans `docs/omada-ext-portal.md` (section “Configuration serveur”).  
2. **Flux backend** :  
   - Dans `authService.connect`, valider les identifiants via RadiusDesk (`findPermanentUser`, `findVoucher`) et contrôler les paramètres Omada (`clientMac`, `site`, `radioId`).  
   - Si `OMADA_EXTERNAL_PORTAL_ENABLED=true`, appeler `authorizeClient()` (service `omadaIntegration`) avec le payload `extPortal/auth` construit à partir des paramètres Omada + `accessToken`.  
   - Gérer les erreurs Omada (`errorCode`, HTTP 401/4xx/5xx) en renvoyant une réponse JSON explicite au frontend.  
3. **Flux frontend** :  
   - Dans `Home.tsx`, continuer à récupérer les paramètres Omada (query) et à les injecter dans `ConnectPanel` via `omadaParams`.  
   - Dans `connectUtils.buildOmadaPayload`, s’assurer que tous les champs nécessaires à `extPortal/auth` sont présents (`clientMac`, `site`, `radioId`, `time`, `authType`, `apMac/gatewayMac`, `ssidName/vid`, `redirectUrl`).  
   - Dans `ConnectPanel`, bloquer la connexion si les paramètres Omada essentiels sont absents, afficher un message explicite, et envoyer `omada: omadaPayload` au backend.  
4. **Redirection & UX** :  
   - Côté backend, renvoyer `nextRedirect` (URL finale) dans `ConnectResult` :  
     - soit `ctx.omada.redirectUrl` (reçu d’Omada),  
     - soit `config.PORTAL_SUCCESS_URL` si on veut forcer la page Success locale.  
   - Côté frontend, appliquer `nextRedirect` en y ajoutant `username` et `mac` comme query params pour diagnostics (sans casser la redirection Omada par défaut).  
5. **Documentation** :  
   - Mettre à jour `docs/omada-ext-portal.md` avec :  
     - l’URL exacte à renseigner dans Omada (`PORTAL_PUBLIC_URL`),  
     - les paramètres attendus,  
     - l’explication que l’accounting reste RADIUS, et que `radacct` est la source d’autorité.  

**Contraintes**   
- Ne pas modifier la logique d’accounting côté RadiusDesk/FreeRADIUS (pas de pseudo‑accounting via OpenAPI).  
- Supporter à la fois `http://` (lab) et `https://` (prod) dans la configuration External Web Portal.  

**Critères d’acceptation / tests**  
- Sur un contrôleur Omada configuré en External Web Portal :  
  - un client est redirigé vers `PORTAL_PUBLIC_URL` avec les bons paramètres,  
  - l’utilisateur saisit ses identifiants (permanent/voucher),  
  - le backend valide via RadiusDesk et appelle `extPortal/auth`,  
  - Omada autorise la session et envoie l’accounting RADIUS vers RadiusDesk (`radacct` mis à jour),  
  - la redirection finale est cohérente (landing page Omada ou page Success locale ou notre page d'infocoso d'usage comme par defaut).  
- Les erreurs Omada (auth refusée, timeout, session invalide) sont renvoyées au frontend avec un message lisible pour l’utilisateur.  

---

### Prompt G6.F3 — CoA / Kick Omada via OpenAPI + intégration RadiusDesk

**Contexte**  
Les kicks manuels dans RadiusDesk (page radaccts) doivent :  
- fermer la session du client côté Omada (Hotspot),  
- mettre à jour ou clôturer l’entrée `radacct` comme pour les autres NAS (Mikrotik, Coova…).  
L’OpenAPI Omada expose plusieurs endpoints de déconnexion (`cancelAuthClient`, `disconnectHotspotAuthedClient`, `disconnectClient`).

**Objectif**  
Mettre en place un `OmadaCoaService` CakePHP + un raccord backend Node pour :  
- déclencher les déconnexions Omada via OpenAPI,  
- garder un fallback CoA RADIUS générique (`Disconnect-Request`) pour les cas d’échec.

**Périmètre & fichiers concernés**  
- CakePHP / RadiusDesk :  
  - `cake4/rd_cake/src/Controller/Component/KickerComponent.php`.  
  - `cake4/rd_cake/src/Controller/Component/OmadaApiComponent.php` (nouveau).  
  - Tables `DynamicClients`.  
- Backend Node :  
  - `backend/src/services/radiusdeskIntegration.ts` (`kickSessions`).  
  - Éventuels endpoints internes si nécessaire pour instrumenter les kicks.  
- Doc :  
  - `docs/omada-radiusdesk-integration.md` (section CoA).  

**Étapes d’implémentation**  
1. Ajouter dans RadiusDesk un type `OmadaPortal` dans les `DynamicClients` (avec `omadac_id`, `site_id`).  
2. Créer `OmadaApiComponent` (CakePHP) pour encapsuler :  
   - login OAuth2/OpenAPI,  
   - appels `cancelAuthClient`, `disconnectHotspotAuthedClient`, `disconnectClient`.  
3. Étendre `KickerComponent` :  
   - pour les entrées `radacct` appartenant à un NAS de type Omada,  
   - appeler `OmadaApiComponent->cancelAuthClient($omadacId, $siteId, $clientMac)` (puis éventuellement d’autres variantes),  
   - en cas d’échec, retomber sur `kickByDisconnectRequest` (CoA RADIUS générique).  
4. Instrumenter les kicks (métriques + logs) côté backend Node et/ou RadiusDesk (compteurs Prometheus, journaux).  

**Contraintes**  
- Ne pas modifier le comportement de kick pour les autres NAS (Mikrotik, Coova, Juniper…).  
- Gérer proprement les erreurs OpenAPI (site inexistant, client introuvable, contrôleur indisponible…).  

**Critères d’acceptation / tests**  
- Depuis l’interface RadiusDesk (radaccts), déclencher un “kick” sur un client Omada :  
  - la session est coupée côté Omada,  
  - l’entrée `radacct` est mise à jour/fermée,  
  - les métriques/logs de kick Omada sont visibles.  
- Les kicks continuent de fonctionner pour les autres types de NAS sans régression.  

---

### Prompt G6.F4 — Tests et observabilité Omada ↔ RadiusDesk

**Contexte**  
L’intégration Omada ↔ RadiusDesk implique plusieurs couches : RADIUS, OpenAPI, portail HTTP, backend Node, front React. Il est nécessaire d’avoir une couverture de tests et une observabilité suffisantes pour diagnostiquer les incidents (auth, accounting, CoA…).

**Objectif**  
Mettre en place une stratégie de tests et d’observabilité couvrant :  
- les flux de connexion (Local & External Web Portal),  
- l’accounting (radacct, MacUsages),  
- les déconnexions (CoA RADIUS + OpenAPI Omada),  
- les erreurs et timeouts.

**Périmètre & fichiers concernés**  
- Backend :  
  - tests unitaires/integration (`backend/tests` ou équivalent).  
  - instrumentation metrics/logs (`backend/src/utils/metrics.ts`, logger).  
- Frontend :  
  - tests unitaires (Vitest) sur `ConnectPanel`, `useOmadaParams`, pages `Home`/`Success`.  
  - tests e2e (Playwright) pour les scénarios Omada.  
- RadiusDesk :  
  - tests PHPUnit ciblés sur `KickerComponent`, `OmadaApiComponent`.  
- Docs :  
  - `docs/omada-radiusdesk-integration.md` (section G6.6).  

**Étapes d’implémentation**  
1. Définir les scénarios de test clés (connexion OK/KO, quota atteint, FUP actif, kick Omada, erreur OpenAPI).  
2. Implémenter les tests unitaires backend (Node) pour les services `authService`, `omadaIntegration`, `radiusdeskIntegration`.  
3. Implémenter les tests unitaires frontend (React) pour `ConnectPanel` et `useOmadaParams` en simulant des URLs Omada.  
4. Ajouter ou compléter des tests e2e Playwright simulant un parcours Omada (redirection → login → succès → déconnexion).  
5. Ajouter des métriques Prometheus pertinentes (latence des appels OpenAPI/RADIUS, compteurs de succès/erreur, kicks, etc.) et s’assurer qu’elles sont exposées dans les endpoints de metrics.  

**Contraintes**  
- Ne pas rendre les tests dépendants d’un contrôleur Omada réel : utiliser des mocks/stubs pour l’API Omada.  
- Garder les tests rapides et reproductibles en CI.  

**Critères d’acceptation / tests**  
- La suite de tests (backend + frontend) passe sans erreur (`npm test`, `npm run test` côté frontend).  
- Les scénarios Omada essentiels sont couverts par au moins un test automatisé (unitaire ou e2e).  
- Les métriques/logs permettent de diagnostiquer un échec de connexion ou de déconnexion Omada sans instrumentation manuelle supplémentaire.  
