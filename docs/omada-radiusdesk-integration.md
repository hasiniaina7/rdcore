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
| Auth portail             | Hotspot ou PPPoE via RADIUS standard, rien à faire côté RouterOS (Access‑Accept suffit).           | Mode cible : **Hotspot Omada + “RADIUS Server”** avec notre FreeRADIUS/RadiusDesk comme NAS, et page d’auth personnalisée via **“Import Customized Page”** (le contrôleur reste client RADIUS et gère l’Accounting standard). Mode alternatif : “External Portal” (cf. `docs/omada-ext-portal.md`) en HTTP pur, avec des limitations possibles côté accounting. L’OpenAPI northbound ne modélise pas ces flux et n’expose pas d’endpoint `/hotspot/extPortal/*`. | Le design “parfait Mikrotik‑like” consiste à utiliser Omada comme simple NAS RADIUS (auth + accounting) avec page importée, et à réserver l’OpenAPI aux opérations de gestion (liste de clients, déconnexion), comme on le fait avec l’API Mikrotik.               |
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
  - **Mode optionnel** : External Portal Server (cf. `docs/omada-ext-portal.md`), avec une stratégie spécifique pour limiter les problèmes d’accounting.
- **Portée** :
  - Spécifier la page de portail importée côté Omada (Hotspot + RADIUS).
  - Décrire l’option External Portal et les adaptations nécessaires pour l’accounting.
  - Lister les modifications RadiusDesk (CakePHP + FreeRADIUS).
  - Lister les modifications backend du portail Node (API de connexion, usage, déconnexion).

### G6.2 Portail Hotspot + RADIUS (mode cible)

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

### G6.3 External Portal Omada (mode optionnel)

#### G6.3.1 Rappel des contraintes

- External Portal décrit dans `docs/omada-ext-portal.md` :
  - Flux HTTP `extPortal/auth` + cookie jar opérateur.
  - Omada décide d’ouvrir/fermer la session en fonction de la réponse du portail.
  - L’accounting RADIUS standard peut être **moins direct** (le NAS ne fait pas forcément la même séquence qu’en mode RADIUS Server).

#### G6.3.2 Stratégie pour préserver l’accounting

- **Objectif** : garder un `radacct` cohérent même en External Portal.
- Pistes à combiner :
  - S’assurer que le contrôleur Omada continue d’interroger FreeRADIUS pour l’authentification RADIUS (si configuration hybride possible).
  - À défaut, utiliser `extPortal/auth` uniquement pour un sous‑ensemble d’offres (ou comme fallback), et privilégier Hotspot+RADIUS pour la production.
  - Exploiter les vues Omada (OpenAPI `Client`/`Hotspot`) pour reconstruire un pseudo‑accounting complémentaire (durée de session, volume) et le rapprocher de `radacct` via `clientMac`.
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
