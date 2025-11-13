# G1.2 — Cartographie des endpoints RadiusDesk utiles

Toutes les routes exposées par CakePHP se trouvent sous `https://<rd-host>/cake4/rd_cake`. Les contrôleurs `PermanentUsers`, `Vouchers` et `Radaccts` exigent un `token` (UUID Access Provider) et un `cloud_id`. Le helper `_ap_right_check()` (cf. `AppController`) vérifie le jeton, charge les droits via `AaComponent` (`checkRbaAccess`) et bloque l’appel si l’action n’est pas listée dans `config/Rba*.php`. Les paramètres `token`, `cloud_id`, `language` et les payloads JSON peuvent être passés en query string ou en corps (Cake fusionne query/data). La locale (ex: `language=fr_FR`) impacte les textes générés (emails, pays/langue d’un utilisateur).

## Permanent Users (`PermanentUsersController`)

| Action | Méthode & URI | Auth & paramètres | Réponse & champs clés | Notes |
| --- | --- | --- | --- | --- |
| `index` | `GET /permanent-users/index.json` | `token` (query), `cloud_id`, pagination `limit/page/start`, tri `sort/dir`, `filter` JSON, `language` optionnel | `{ items: [...], totalCount, success, metaData }` Chaque item contient `last_seen` (`status`, `span`), `framedipaddress`, `created_in_words`, `modified_in_words`, `update/delete` booléens. | Ajoute `Radaccts` pour enrichir `last_seen`. `only_connected` n’est pas pris en compte ici (pour Radaccts). |
| `add` | `POST /permanent-users/add.json` | `token`, `cloud_id`; corps JSON avec `username`, `password`, `realm` ou `realm_id`, `profile` ou `profile_id`, `language` (`country_language` => `country_id` + `language_id`), `active`, `from_date`, `to_date`, infos personnelles. | `{ success, items }` ou erreurs sérialisées via `JsonErrors`. | Ajoute suffixe de realm automatiquement. Vide `token` pour forcer la régénération. |
| `viewBasicInfo` | `GET /permanent-users/view-basic-info.json?token=...&cloud_id=...&user_id=UUID` | idem | `{ data: { … }, success }` | Retourne tous les champs non nuls, convertit `data_*` en unités lisibles, formate `from_date/to_date`, `last_accept_time`. |
| `viewPassword` | `GET /permanent-users/view-password.json?token=...&cloud_id=...&user_id=UUID` | idem | `{ success, value, activate, expire }` | `value` = mot de passe clair (via `Radchecks`), dates formatées `m/d/Y`. |
| `changePassword` | `POST /permanent-users/change-password.json` | `token`, `cloud_id`; body: `user_id`, `password`, optionally `from_date`, `to_date`. | `{ success: true }` ou `JsonErrors`. | Nettoie `user_id` du payload avant `save`. |
| `enableDisable` | `POST /permanent-users/enable-disable.json` | `token`, `cloud_id`; body: `rb` (`enable` \| `disable`) + `id` ou clés numériques (ex: `{ "rb":"enable","123":true }`). | `{ success: true }` | Met `active=1/0`, déclenche `IspPlumbing->disconnectIfActive`. |

### Exemple `curl`

```bash
curl -sS "https://rd.local/cake4/rd_cake/permanent-users/index.json" \
  --get \
  --data-urlencode "token=b4c6ac81-8c7c-4802-b50a-0a6380555b50" \
  --data-urlencode "cloud_id=1" \
  --data-urlencode "limit=25" \
  --data-urlencode "sort=username" \
  --data-urlencode "dir=ASC"
```

```json
{
  "success": true,
  "totalCount": 2,
  "items": [
    {
      "id": "651d...f2",
      "username": "demo@example.com",
      "realm": "default",
      "profile": "2Mbps",
      "active": 1,
      "created_in_words": "2 hours ago",
      "last_seen": { "status": "online", "span": "15m" },
      "framedipaddress": "10.0.20.14",
      "update": true,
      "delete": true
    }
  ]
}
```

## Vouchers (`VouchersController`)

| Action | Méthode & URI | Auth & paramètres | Réponse & champs clés | Notes |
| --- | --- | --- | --- | --- |
| `index` | `GET /vouchers/index.json` | `token`, `cloud_id`, pagination comme `PermanentUsers`. | `{ items, totalCount, success }` avec `last_seen`, `framedipaddress`, `expire_in_words`, `time_valid_in_words`, `activate_on_login`. | Récupère la dernière session pour afficher état online/offline. |
| `add` | `POST /vouchers/add.json` | `token`, `cloud_id`; body: `name` (username), `password` (ou `single_field`), `realm[_id]`, `profile[_id]`, flags `activate_on_login`, `never_expire`, `expire`, `time_valid` (`days-hours-minutes`). | `{ success, data }`. | `Realms->entityBasedOnPost` et `Profiles->entityBasedOnPost` résolvent les IDs; suffix applicatif du realm ajouté si besoin. |
| `viewBasicInfo` | `GET /vouchers/view-basic-info.json?token=...&cloud_id=...&voucher_id=ID` | idem | `{ data: {...}, success }` | Retourne `realm(_id)`, `profile(_id)`, `expire`, `never_expire`, `activate_on_login`, `days_valid/hours_valid/minutes_valid`. |
| `changePassword` | `POST /vouchers/change-password.json` | `token`, `cloud_id`; body: `voucher_id` ou `name`, `password`. | `{ success }` ou erreur `Cannot change the password of a single field voucher`. |
| `emailVoucherDetails` | `POST /vouchers/email-voucher-details.json` | `token`, `cloud_id`; body: `id`, `cloud_id`, `email`, `message`. | `{ success, data }` ou `{ success:false,message:'Email Disabled / Not Configured' }`. | Utilise `MailTransport` pour récupérer la config SMTP du cloud, template `voucher_detail`. |

### Exemple `curl`

```bash
curl -sS "https://rd.local/cake4/rd_cake/vouchers/index.json" \
  --get \
  --data-urlencode "token=$TOKEN" \
  --data-urlencode "cloud_id=1" \
  --data-urlencode "limit=10"
```

```json
{
  "success": true,
  "items": [
    {
      "id": 44,
      "name": "GUEST-1001",
      "profile": "Guest-4h",
      "last_seen": { "status": "offline", "span": "3h" },
      "framedipaddress": "10.0.21.55",
      "time_valid": "00-04-00",
      "time_valid_in_words": "4 Hours",
      "expire_in_words": "Never"
    }
  ],
  "totalCount": 144
}
```

## Sessions & usage (`RadacctsController`)

| Action | Méthode & URI | Auth & paramètres | Réponse & champs clés | Notes |
| --- | --- | --- | --- | --- |
| `index` | `GET /radaccts/index.json` | `token`, `cloud_id`; options: `only_connected=true|false`, `extra_info=true` (joint `PermanentUsers`), `limit/page/start`, `sort/dir`, `filter` JSON, `timezone_id`, `username`, `callingstationid`. | `{ items, totalCount, totalIn/Out, success, metaData }`. Chaque item contient `radacctid` (copié en `id`), `online_human`, `active`, `framedipaddress`, `permanent_user` si `extra_info`. | `only_connected=true` force `acctstoptime IS NULL`. `filter` accepte opérateurs `like`, `==`, `gt/lt/eq`, `in` (user_type via `Radchecks`). `cloud_id` utilisé pour restreindre aux realms autorisés (`Aa->realmCheck`). |
| `getUsage` | `GET /radaccts/get-usage.json?username=u&mac=aa:bb:cc` | Public (pas d’auth) | `{ success, data: { data_used, data_cap, time_used, time_cap, depleted } }`. | Si aucune donnée `MacUsage`, fallback sur PermanentUsers/Vouchers/Devices puis sur `Profiles` via `Counters`. |
| `kickActiveUsername` | `GET /radaccts/kick-active-username.json?token=...&cloud_id=...&username=u` | Auth requise | `{ success, data }` | Parcourt toutes les sessions `acctstoptime IS NULL` pour `username` et appelle `Kicker->kick` (envoie CoA/Disconnect). |
| `kickActive` | `GET /radaccts/kick-active.json?token=...&cloud_id=...&123=1&456=1` | Auth requise | `{ success, data: {title,message,type} }` | Chaque clé numérique de la query est considérée comme `radacctid`. Retourne `Disconnect Sent` ou `Session Closed Already`. |
| `closeOpen` | `GET /radaccts/close-open.json?token=...&cloud_id=...&123=1` | Auth requise | `{ success:true }` | Force `acctstoptime` à `now` si null. |

### Exemple `curl`

```bash
curl -sS "https://rd.local/cake4/rd_cake/radaccts/get-usage.json" \
  --get \
  --data-urlencode "username=demo@example.com" \
  --data-urlencode "mac=AA:BB:CC:DD:EE:FF"
```

```json
{
  "success": true,
  "data": {
    "data_used": 2147483648,
    "data_cap": 4294967296,
    "time_used": 1800,
    "time_cap": 7200,
    "depleted": false
  }
}
```

## Dynamic Details (`DynamicDetailsController`)

| Action | Méthode & URI | Auth | Paramètres | Réponse | Notes |
| --- | --- | --- | --- | --- | --- |
| `infoFor` | `GET /dynamic-details/info-for.json` | Public (`allowUnauthenticated`) | soit `dynamic_id=<id>` soit toute combinaison de paires `?key=value` correspondant aux `DynamicPairs` (ex: `mac`, `ssid`, `nasid`, `dynamic_key`, `lang`, `site`). | `{ success, data }` où `data` contient `detail`, `settings`, `photos`, `pages`, `mobile_app`, `client_info`. | Trie les `DynamicPairs` par `priority`. `settings.available_languages` renvoie `[{value,id}]`. `settings.social_login` inclut `temp_username/password` et liste `items`. `settings.click_to_connect` contient la définition des formulaires dynamiques. |
| `idMe` | `GET /dynamic-details/id-me.json` | Public | — | `{ data: { userAgent, isMobile, ... }, success }` | Utilitaire pour détecter l’appareil. |

### Exemple `curl`

```bash
curl -sS "https://rd.local/cake4/rd_cake/dynamic-details/info-for.json" \
  --get \
  --data-urlencode "dynamic_key=hotel-lobby" \
  --data-urlencode "clientMac=AA-BB-CC-DD-EE-FF" \
  --data-urlencode "lang=fr_FR"
```

```json
{
  "success": true,
  "data": {
    "detail": {
      "name": "Techzone Hotel",
      "email": "support@example.com",
      "icon_file_name": "/rd_cake/img/dynamic_details/logo.png"
    },
    "settings": {
      "show_logo": true,
      "show_name": true,
      "show_screen_delay": 5,
      "available_languages": [
        { "value": "Français", "id": "fr_FR" },
        { "value": "English", "id": "en_GB" }
      ],
      "social_login": {
        "active": true,
        "temp_username": "social-temp",
        "temp_password": "******",
        "items": [{ "name": "facebook" }, { "name": "google" }]
      },
      "click_to_connect": {
        "connect_to_profile": "Guest-10M",
        "button_title": "Se connecter"
      }
    },
    "photos": [
      { "file_name": "/rd_cake/img/dynamic_photos/1.jpg", "layout": "landscape" }
    ],
    "pages": [
      { "title": "À propos", "content": "<p>...</p>" }
    ],
    "client_info": { "userAgent": "Mozilla/5.0 ...", "isMobile": true }
  }
}
```

## Paramètres communs & erreurs

- `token`: UUID (36 chars) issu de l’utilisateur `Access Provider`. Obligatoire sauf `getUsage` et `dynamic-details`.
- `cloud_id`: identifiant numérique du tenant RadiusDesk. Utilisé pour scoper les requêtes SQL (`CommonQueryFlat`, `_build_common_query`).
- `language`: lors des créations/updates (`PermanentUsersController::add`), le code lit `language` et découpe `country_language` (`fr_FR`) en `country_id` + `language_id`. Si absent, fallback sur `Configure::read('language.default')`.
- `filter`: JSON ExtJS `[{"property":"username","operator":"like","value":"foo"}]`.
- Erreurs RBA: `_ap_right_check()` renvoie `{success:false,message:"Access denied"}` si l’action n’est pas autorisée.
- Model validation: `JsonErrors` sérialise `errors` par champ (`{success:false,message:"Could not create item",errors:{username:["duplicate"]}}`).

Ces informations couvrent l’ensemble des endpoints demandés (Permanent Users, Vouchers, Radaccts, Dynamic Details) et incluent paramètres `token/cloud_id/language`, logique RBA, structures de réponses et exemples `curl`/JSON pour faciliter l’intégration UI.
