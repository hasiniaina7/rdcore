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

| Capability               | Mikrotik (actuel)                                                                                  | Omada (cible)                                                                                                                                                   | Écart                                                                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth portail             | Hotspot ou PPPoE via RADIUS standard, rien à faire côté RouterOS (Access‑Accept suffit).           | `POST /api/v2/hotspot/extPortal/auth?token=CSRF` (cf. `docs/omada-ext-portal.md` lignes 1‑120), piloté depuis `backend/src/services/omadaIntegration.ts`.       | Omada requiert une session opérateur (CSRF + cookies) avant chaque Accept et impose `accessToken`, `site`, `radioId`.                             |
| Fonction                          | MikroTik                                                                                          | Omada SDN / Cloud                                                                                                                                        | Impact backend                                                                                                                      |
|-----------------------------------|---------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Détection session active          | `/ip/hotspot/active/print`, `/ppp/active/print` via `MikrotikApiComponent` (lignes 17-108).      | Utiliser l’Omada OpenAPI sur `https://use1-omada-northbound.tplinkcloud.com` (endpoints **Client** type `getGridActiveClients` / `getClientDetail`) pour lister les clients actifs, plutôt qu’un scraping `extPortal/*` ou du SNMP. | Prévoir un éventuel `OmadaSessionsStore` si l’on doit persister la corrélation `authCode ⇔ username` issue du portail externe et que cette info n’est pas exposée telle quelle par l’OpenAPI. |

| Fonction    | MikroTik                                                                                                                       | Omada SDN / Cloud                                                                                                                                                                                                 | Impact backend                                                                                                                                                                              |
|------------|----------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Kick / CoA | `KickerComponent` + `MikrotikApiComponent::kickRadius` (API RouterOS) et fallback `radclient` PoD (Disconnect-Request RFC5176). | CoA officiel via **RADIUS Disconnect-Request** (activer “Disconnect Requests” dans le portail) ou via l’OpenAPI `Authorized Client / cancelAuthClient` pour dé-authentifier un client portail sans scrapper `extPortal/*`. | Implémenter un `OmadaCoaService` qui, suivant le contexte, envoie soit un Disconnect-Request RADIUS vers le contrôleur, soit un appel OpenAPI `cancelAuthClient` sur le client (MAC / clientId). |

|| Fonction       | MikroTik                                                                                                                                   | Omada SDN / Cloud                                                                                                                                                                                                                                   | Impact backend                                                                                                                                                                                                                              |
|----------------|--------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Profils / quotas | RouterOS gère les profils (rate-limit, time/bytes quota…) et applique les limites; RadiusDesk pousse les attributs `Rd-*` dans l’Access-Accept. | Omada ne publie pas de notion de “profil RADIUS” via API, mais applique les attributs RADIUS/WISPr supportés (par ex. `WISPr-Bandwidth`, `WISPr-Redirection-URL`, `WISPr-Location-ID`) pour limiter la bande passante / piloter la redirection locale. | Les offres (durée, volume, FUP…) restent modélisées côté RADIUS/radacct. Le mapping attributs ↔ profil est conservé dans RadiusDesk, qui envoie les attributs standard + WISPr vers Omada. L’`accessToken` OpenAPI reste un jeton purement technique pour appeler l’API. |


## 3. Architecture proposée pour l’intégration Omada

### 3.1 Nouveaux services côté RadiusDesk (PHP)

| Service                       | Emplacement                                                                                                                                                                                                            | Rôle                                                                                                                                                                                                                                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OmadaApiService` (component) | `cake4/rd_cake/src/Controller/Component/OmadaApiComponent.php` (nouveau)                                                                                                                                               | Wrap Axios/Cake `Http\Client` pour : `login()` (Operator), `auth()` (extPortal), `disconnect()` (si Omada expose un endpoint), `sites()` (cache). Stocke `token`, cookies et TTL (comme `backend/src/services/omadaIntegration.ts`).                                                               |
| `OmadaCoaService`             | Peut être une méthode additionnelle dans `KickerComponent`                                                                                                                                                             | Lors d’un kick `RadacctsController::kickActive*`, déterminer si le NAS correspond à Omada (nouveau type `typeOmadaPortal`). Si oui, appeler `OmadaApiComponent->disconnect(accessToken, clientMac, site)` ou, si échec, retomber sur `radclient` (Disconnect-Request) en utilisant `nasipaddress`. |
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
        'site'       => $dc->site_id,
        'radioId'    => 0,
        'accessToken'=> $ent->username, // fallback
    ];
    try {
        $this->OmadaApi->disconnect($payload);
    } catch (\Exception $ex) {
        $this->log('Omada disconnect failed, fallback radclient', 'error');
        $this->kickByDisconnectRequest($ent);
    }
}
```

### 3.2 Évolution du backend Node (`dev/captive-portail/backend`)

1. **`omadaIntegration` refactor** : séparer `OmadaSessionStore` (login, cookies) et `OmadaPortalClient` (auth, disconnect, heartbeat). Publier un événement `authSuccess` contenant `requestId`, `username`, `mac`, `site`, `authCode`.
2. **`radiusdeskIntegration` enrichi** : lorsqu’un `ConnectResult` est `accepted`, enregistrer `authCode` + `accessToken` dans `omadaSessions` (collection en mémoire ou Redis) avec TTL et radacctId (quand connu). Cela servira pour `/usage/disconnect`.
3. **`usageService.disconnectSessions`** : s’il s’agit d’un client Omada, appeler `omadaIntegration.disconnect(authCode || clientMac)` avant `kickSessions`. On garde un fallback sur `/radaccts/kick-active`.
4. **Mapping attributs** :
   - `accessToken` = `username` ou `voucherCode` (valeur stable) pour pouvoir rechercher la session côté RD.
   - `site` / `radioId` / `redirectUrl` : repris de la query string Omada (frontend `useOmadaParams`) et stockés dans `ConnectRequestContext.omada`.
   - `profile` info : rester dans RADIUS; Omada n’expose pas de notion d’override.

Pseudo-code Node (extrait d’un futur `omadaCoa.ts`) :

```ts
export async function disconnect(authCode: string, context: OmadaPortalPayload) {
  const sess = await ensureSession();
  const payload = { ...context, authCode };
  try {
    await omadaClient.post('/api/v2/hotspot/extPortal/disconnect', payload, {
      params: { token: sess.token },
    });
    omadaDisconnectsTotal.inc({ site: context.site, status: 'success' });
  } catch (error) {
    omadaDisconnectsTotal.inc({ site: context.site, status: 'error' });
    throw mapOmadaError(error);
  }
}
```

### 3.3 Interaction avec FreeRADIUS

- Conserver les attributs `Rd-*` injectés par `ProfilesController` pour le shaping/FUP. Omada ne doit pas prendre de décision sur la bande passante.
- `CoA` côté RADIUS reste utile : si `OmadaApi.disconnect` échoue ou si un NAS non Omada est détecté, `kickSessions()` enverra un `Disconnect-Request` (radclient).
- `MacUsages` & `radacct` restent la source d’autorité pour la page Success; même avec Omada, `/radaccts/get-usage` fournit les quotas. Aucun changement de schéma nécessaire.

## 4. Plan d’implémentation

1. **Repérer les fichiers RadiusDesk** : consolider la cartographie dans `docs/radiusdesk-endpoints.md` (déjà fait) et identifier les hooks `KickerComponent`, `ProfilesController`, `radacct`. Vérifier les `DynamicClients` Omada (type à ajouter) et la structure `radacct` (cf. `rd.sql`).
2. **Services Omada (backend Node + CakePHP)** :
   - Backend Node : extraire `OmadaSessionStore`, consigner `authCode`, exposer `disconnect`.
   - CakePHP : créer `OmadaApiComponent` mutualisant login/auth/disconnect pour les besoins internes (CoA, cron).
3. **Raccordement auth/radacct/CoA** :
   - Avant Access‑Accept : RD continue d’évaluer les profils, mais `authService.connect` doit enregistrer `accessToken`/`requestId`.
   - Après Accept : stocker `authCode` ← réponse Omada pour pouvoir retrouver la session (table `omada_sessions` ou Redis).
   - Kick : `RadacctsController::kickActive*` → `KickerComponent` → `OmadaApiComponent->disconnect()` + fallback RADIUS CoA.
4. **Mapping profils simple/advanced/FUP** :
   - Continuer à pousser `Rd-*` via `ProfilesController::_doRadius` et `_doRadiusFup`.
   - Documenter la correspondance attributs ↔ Omada (`accessToken`, `site`, `authType`, `redirectUrl`) pour les dynamic keys.
5. **Tests** :
   - **Unitaires Node** : simuler `authorizeClient`, `disconnect`, `sessionStore` avec `nock`.
   - **Unitaires CakePHP** : tests PHPUnit pour `OmadaApiComponent` (login retry, disconnect fallback) + `KickerComponent` nouveau type.
   - **Intégration** : Dredd contre `/connect/:mode`, `/usage`, `/usage/disconnect`. Playwright pour click-to-connect → disconnect.
   - **Fonctionnels** : scénarios Accept/Reject (permanent & voucher), déconnexion Omada, FUP bascule, quotas épuisés.

Ce plan couvre les items demandés : analyse détaillée des flux RadiusDesk/FreeRADIUS, comparaison Mikrotik vs Omada, architecture cible (services, pseudo-code, mapping), et feuille de route pas-à-pas pour l’implémentation.
**