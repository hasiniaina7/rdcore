# Captive Portal Omada/Radiusdesk — Prompts G1 à G5 (Final)

Ce document regroupe des prompts détaillés, prêts à être copiés/collés, pour piloter la réalisation complète du projet selon nos décisions et contraintes validées.

- Omada Controller: v5.15.6.7 — https://omada.techzone.lat/ (HTTPS obligatoire, certificat valide)
- Radiusdesk GUI: https://hotspot.techzone.lat/rd/build/production/Rd/ et réplique locale http://localhost/rd/build/production/Rd/
- Réplique code Radiusdesk: `/var/www/rdcore` (scripts d’installation = source d’autorité)
- Branche Git active: `captive-portail`
- Monorepo attendu (racine courante): `frontend` (React, Vite, TypeScript) et `backend` (Node.js, Express/Nest-like en TypeScript), + dossier `docs`
- Déploiement: pas de Docker; utiliser PM2 + scripts bash paramétrables (git pull/rsync + pm2 reload)
- Secrets dev **uniquement**: Radiusdesk token root `b4c6ac81-8c7c-4802-b50a-0a6380555b50` (alias `rd` vers `http://localhost`), Omada operator `Operator / Operator@123` (role Admin). Les stocker dans `.env` (non committé).
- UI (G4): respecter à 100 % la logique `@rdcore/login` (Dynamic Login). Inamovibles: Details, Settings, Logo, Photos, Own Pages, Dynamic Keys, Click to Connect, Social Login, multi-langues, `show_screen_delay`. Page Success/Info Conso: améliorer l’affichage mais **ne pas ajouter** de widgets QR/WhatsApp/PDF.
- Tests/observabilité: adaptés à PM2 (logs JSON, métriques Prometheus, health endpoints, pas de Docker).

---

## G1 — Audit & Cadrage (exécution unique au démarrage)

### Prompt G1.1 — Audit des scripts d’installation (installation-script)
Objectif: confirmer l’orchestration, les prérequis, et comment rejouer des phases.

```
Analyse le dépôt `installation-script` et résume:
- Structure: `deploy/config/env.sh`, `lib/common.sh`, `scripts/10..70`, `run-all.sh`, `run-phase.sh`.
- Prérequis système, logs (`/var/log/radiusdesk-install`), marqueurs `.done` (`/var/local/radiusdesk-install`).
- Comment rejouer une phase, ex.: `sudo rm /var/local/radiusdesk-install/40_radiusdesk_app.done && sudo ./deploy/run-phase.sh 40`.
- Détaille chaque phase: 10 (OS), 20 (Nginx/PHP/vhost), 30 (MariaDB), 40 (rdcore + import DB + cron), 50 (FreeRADIUS config), 70 (Certbot/TLS).
- Identifie où sont créés les liens `/var/www/html/{rd,cake4,login}` et où est généré `app_local.php` (salt + credentials DB).
- Résume les scripts utilitaires (`clean-state.sh`, `update_radiusdesk_app.sh`, `cleanup_stale_radacct.sh`).
Livrable: mémo markdown `docs/installation-audit.md` avec commandes clés, risques, et recommandations rerun.
```

### Prompt G1.2 — Cartographie Radiusdesk (endpoints utiles)
Objectif: lister les routes nécessaires pour Permanent Users, Vouchers, Sessions, Dynamic Details.

```
Inspecte `rdcore/cake4/rd_cake/src/Controller` et recense:
- PermanentUsersController: index, add, viewBasicInfo, viewPassword, changePassword, enable/disable (paramètres token, cloud_id, pagination, formats).
- VouchersController: index, add, viewBasicInfo, changePassword, emailVoucherDetails, (time_valid / expire, single_field).
- RadacctsController: index, getUsage (public), kickActive, kickActiveUsername, closeOpen (filtres: only_connected, extra_info).
- DynamicDetails (info-for.json) pour les pages dynamiques.
Pour chaque endpoint: méthode, URI relative, query/body requis, structure de réponse (items/data/success/totalCount), champs utiles à l’UI (last_seen, framedipaddress, quotas). 
- Inclut aussi les paramètres `token`, `cloud_id`, `language`, logiques RBA (`_ap_right_check`), et exemples `curl`.
Livrable: `docs/radiusdesk-endpoints.md` (tableau par domaine + JSON d’exemple).
```

### Prompt G1.3 — Cartographie Omada (ext portal)
Objectif: formaliser les appels nécessaires au contrôleur Omada d’après la FAQ officielle.

```
À partir de la FAQ 2907 TP-Link (External Portal):
- Auth opérateur: POST `https://CONTROLLER:PORT/api/v2/hotspot/login` (body: `name`, `password`), récupérer `result.token` (CSRF) + cookies.
- Autorisation client: POST `https://CONTROLLER:PORT/api/v2/hotspot/extPortal/auth?token=CSRFToken` (payload EAP/Gateway: clientMac, apMac|gatewayMac, ssidName|vid, radioId, site, time (µs), authType=4). 
- Redirection initiale portail: GET `https://PORTAL?...` (clientMac, apMac|gatewayMac, ssidName|vid, site, t, radioId, redirectUrl).
Décris la gestion des cookies (cookiejar partagée), la persistance du token CSRF, et la stratégie de rafraîchissement en cas de 401/timeout.
Rédige exemples `curl` (login, auth EAP, auth Gateway) + séquences (login → auth), avec codes d’erreur typiques.
Livrable: `docs/omada-ext-portal.md` incluant diagramme de séquence.
```

---

## G2 — Documentation API & Swagger/OpenAPI

### Prompt G2.1 — Squelette OpenAPI et sécurité
```
Crée `docs/openapi/openapi.yaml` avec:
- info, servers (localhost, lab), tags (dynamic, auth, usage, social, omada, radiusdesk-proxy).
- securitySchemes:
  - RadiusToken: apiKey in query (`token`), param `cloud_id`.
  - OmadaSession: cookieAuth + header CSRF via query `token`.
- components/schemas: DynamicDetail (+ sous-schemas Settings/Gallery/Pages), DynamicClientInfo, PermanentUser, Voucher, RadacctSession, UsageStats, OmadaAuthPayload, OmadaLoginResponse, ConnectResult, ApiSuccess, ApiError.
```

### Prompt G2.2 — Définition des endpoints (backend Node)
```
Documente dans OpenAPI:
- GET /dynamic/details: proxy `info-for.json` (query pass-through), réponse = DynamicDetail (cache TTL, header `x-cache`).
- POST /connect/{mode}: `mode ∈ {permanent,voucher,click,social}` → ConnectResult (status, message, nextRedirect, omadaSite, username, mac, requestId).
- GET /usage: query {username, mac} → UsageStats + sessions récentes (option `limit`, `withSessions`).
- GET /social/{provider}/start & GET /social/{provider}/callback: OAuth handshake → redirection front avec `state`.
- GET /healthz & /readyz: health checks (pings RD/Omada + caches CSRF/dynamic).
- GET /metrics: Prometheus metrics (exposé brut, content-type text/plain).
Fournis pour chaque opération: description, paramètres (path/query/header/body), codes 200/400/401/500, exemples JSON multi-modes.
```

### Prompt G2.3 — Endpoints référencés Radiusdesk/Omada
```
Ajoute en `x-externalDocs` les références vers:
- Radiusdesk: /permanent-users, /vouchers, /radaccts, /dynamic-details/info-for.json (méthodes, headers requis, exemples JSON success/erreur, champs utiles).
- Omada: /api/v2/hotspot/login, /api/v2/hotspot/extPortal/auth (payloads EAP/Gateway, cookies requis, codes d’erreur).
Inclure exemples concrets (permanent user, voucher single-field, session kick) et réponses d’erreur (403 RBA, 429, 500 Omada).
Livrable additionnel: `docs/endpoints-matrix.md` listant correspondance Frontend ↔ Backend ↔ Radiusdesk/Omada.
```

### Prompt G2.4 — Tooling & CI docs
```
Ajoute dans `docs/`:
- README.md (comment lancer swagger-ui, redoc, mocks Prism, génération Postman via openapi-to-postman, tests spectral/dredd/newman).
- Scripts npm: `docs:serve` (swagger-ui), `docs:lint` (spectral), `docs:test` (dredd+newman), `docs:bundle`.
CI: job lint-docs (spectral+format), job publish-docs (build UI), artefacts.
```

---

## G3 — Architecture & Choix Techniques (validé: React + Node, PM2)

### Prompt G3.1 — Initialiser monorepo et structure
```
Crée l’arborescence:
- frontend (Vite + React + TS, react-router, react-i18next, axios)
- backend (Express + TS, zod, axios, pino, prom-client)
- docs (OpenAPI + tooling)
Initialise npm workspaces, tsconfig partagés, scripts root (`bootstrap`, `build`, `start`, `lint`, `test`).
Ajoute ESLint + Prettier config partagée, Husky/pre-commit optionnel.
```

### Prompt G3.2 — .env et configuration
```
Définis `.env.example` pour le backend (et `.env.frontend.example` pour base URLs publiques):
- RADIUS_BASE_URL=https://localhost/cake4/rd_cake
- RADIUS_TOKEN_LOCAL=b4c6ac81-8c7c-4802-b50a-0a6380555b50
- RADIUS_CLOUD_ID=<à définir>
- OMADA_BASE_URL=https://omada.techzone.lat
- OMADA_OPERATOR=Operator
- OMADA_PASSWORD=Operator@123
- PORTAL_PUBLIC_URL=https://hotspot.techzone.lat/portal
- PORTAL_SUCCESS_URL=https://hotspot.techzone.lat/portal/success
- LOG_LEVEL=info
- ENABLE_SSE_USAGE=false
Valide au démarrage avec zod (erreur process si champ manquant) et masque les secrets dans les logs. Précise comment injecter variables via PM2.
```

### Prompt G3.3 — Services backend (modules)
```
Implémente modules:
- dynamicService: GET /dynamic/details → proxy vers /dynamic-details/info-for.json (avec token & cloud_id), cache 15s.
- radiusdeskIntegration: wrappers pour PermanentUsers, Vouchers, Radaccts, DynamicDetails, conversions unités (bytes/seconds).
- omadaIntegration: login (cookies + CSRF), extPortal/auth (payload EAP & Gateway), retry/refresh token.
- authService: orchestrations `connect/{mode}` (validation RD puis auth Omada), réponses normalisées.
- usageService: /usage agrège getUsage + sessions récentes.
- health/metrics: /healthz, /readyz, /metrics (prom-client).
Logger pino avec mapping request_id, username, mac, dynamic_key.
```

### Prompt G3.4 — Frontend Shell & routing
```
Scaffold frontend:
- Routes: / (Dynamic Login), /success, /support, /terms, /privacy.
- State: `useDynamicDetail` pour charger détail, `useOmadaParams` pour lire les query (clientMac, apMac/gatewayMac, ssidName/vid, site, radioId, redirectUrl, t).
- i18n: fr/en/es (+ fichiers de ressources).
```

### Prompt G3.5 — PM2 & déploiement
```
Créé `ecosystem.config.js`:
- apps: [{ name: "portal-backend", script: "dist/main.js", env: { NODE_ENV: "production" } }, { name: "portal-frontend", script: "serve", args: "-s build -l 3000" }]
Scripts bash `scripts/deploy_backend.sh` et `scripts/deploy_frontend.sh` (git fetch/checkout ref, build, pm2 reload), variables (TARGET_HOST, TARGET_DIR, GIT_REF, ENV_FILE).
```

---

## G4 — UI & Flux dynamiques (exclusivement basé sur @rdcore/login)

Contraintes: ne jamais perdre les fonctionnalités dynamiques existantes. Success/Info Conso: pas de widgets configurables (pas de QR/WhatsApp/PDF), mais amélioration de l’affichage des consommations et sessions.

### Prompt G4.1 — Dynamic Loader & Proxy
```
Frontend: crée `src/modules/dynamic/useDynamicDetail.ts` qui appelle `/api/dynamic/details` avec propagation intégrale de la query-string Omada (`clientMac`, `apMac`, `key`, `lang`, etc.).
Types TS: DynamicDetail, DynamicSettings, DynamicGalleryItem, DynamicClientInfo, DynamicPage.
Gestion d’erreur: si `success=false` → modal listant les clés disponibles (réplique du legacy sDynamic: titre + paires clé/valeur), plus CTA vers support; bloque les tentatives de connexion.
Backend: GET /dynamic/details → appelle `/cake4/rd_cake/dynamic-details/info-for.json` (ajoute `token`, `cloud_id`, `language` depuis env ou query), cache 15s (memoize + header `x-cache-status`).
```

### Prompt G4.2 — Shell React (Details, Settings, Own Pages, Langues)
```
Construis `DynamicShell` avec:
- Toolbar: boutons Details, Settings, Own Pages, Click to Connect, Social Login + sélecteur de langues basé sur `settings.available_languages` (affiche indicateurs drapeau via CSS `rdFlag`).
- Pane Details: rendu du contenu `detail` (nom, html_content, adresse, contact, `client_info`).
- Pane Settings: aperçu des options (show_logo, show_name, couleurs, show_screen_delay, template_style, available_languages, allow_social_login).
- Own Pages: rendu dynamique d’onglets/pages depuis `cDynamicData.pages` (HTML/MD sécurisé via DOMPurify, liens externes ouverts dans nouvel onglet).
- Side menu: reproduit `webix sidemenu` (Help/About + langues), accessible via clavier.
Respecte `settings.show_screen_delay` pour afficher le panneau de connexion après *n* secondes (min 0 / max 30, fallback 10).
```

### Prompt G4.3 — Branding & Gallery
```
BrandingBanner: affiche logo `detail.icon_file_name` si `settings.show_logo`, nom si `settings.show_name` (couleur `settings.name_colour`).
GalleryCarousel: diaporama basé sur `gallery` (images), temporisation identique au legacy; lightbox; fallback.
```

### Prompt G4.4 — Connect Panel (Click-to-Connect, Credentials dynamiques)
```
Implémente `ConnectPanel` avec 3 blocs:
- ClickToConnect: visible si `connect.click_to_connect=true` → POST /connect/click, puis redirection.
- Credentials dynamiques: génère champs (username/password ou single-field) selon `connect.forms` issu du DynamicDetail (placeholders et validations inclus).
- Messages dynamiques: erreurs RBA, compte expiré, wrong realm; états de progression; boutons retry.
Backend: POST /connect/{permanent|voucher|click} → orchestrations RD+Omada, renvoie ConnectResult (status/message/nextRedirect). Logguer request_id, dynamic_key, username/voucher.
```

### Prompt G4.5 — Social Login (start + callback)
```
Frontend: `SocialButtons` selon `social_logins` (providers). Ouvre `/api/social/{provider}/start` dans une popup, puis gère `postMessage` ou redirection finale; expose `checkSocialLoginReturn()` équivalent au legacy.
Backend: `/social/{provider}/start` et `/social/{provider}/callback` (stubs + intégration réelle ultérieure), qui renvoient ensuite vers `POST /connect/social`.
```

### Prompt G4.6 — Success / Info Conso (améliorée sans widgets supplémentaires)
```
Frontend: page `/success` affichant:
- Statut: online/offline, adresse IP (framedipaddress), site/AP/VLAN si disponibles, message personnalisé issu du DynamicDetail.
- Consommation: `data_used/data_cap`, `time_used/time_cap`, indicateur `depleted` (barres/progress), dates humanisées (last_accept/reject), unités adaptées (MB/GB, minutes/heures).
- Sessions récentes: liste `radaccts` (début/fin/durée/IP), bouton "Se déconnecter" (kickActive) et "Rafraîchir".
- Cartes profil (realm, profile, plan) et assistance (contact/email) tirées du DynamicDetail.
Backend: GET /usage?username&mac → agrège `radaccts/get-usage` + sessions (limite 10). Ajoute POST /usage/disconnect (kickActive) et support SSE/polling (30s) selon `ENABLE_SSE_USAGE`.
Note: ne pas ajouter QR/WhatsApp/PDF ni `settings.success_widgets`.
```

### Prompt G4.7 — Dynamic Keys & Guards
```
Avant soumission, vérifier que la clé dynamique présente dans l’URL correspond à la configuration (`Dynamic Keys`). Sinon, afficher la modale d’aide (comme legacy) et interdire le connect.
```

---

## G5 — Tests & Observabilité (PM2, sans Docker)

### Prompt G5.1 — Tests Frontend
```
Ajoute Vitest + React Testing Library:
- Unitaires: DynamicShell (menu/langue), BrandingBanner, GalleryCarousel, ConnectPanel (génération dynamique de champs), SuccessPage (formatage métriques). 
- Intégration: mock `useDynamicDetail` (msw) pour simuler scénarios (clé manquante, connect.click_to_connect, social).
- E2E: Playwright (parcours: dynamic key valide → click-to-connect → success; voucher expiré → erreur; social callback → success), tests responsive (mobile/desktop) et axe-core pour accessibilité.
```

### Prompt G5.2 — Tests Backend
```
Jest:
- Unitaires: radiusdeskIntegration (mapping endpoints RD + conversions d’unités), omadaIntegration (login/auth + refresh), dynamicService (cache + TTL), authService (permanent/voucher/click/social), usageService (aggregation + polling).
- Intégration: nock pour simuler RD/Omada; tests de temps de réponse et d’erreurs (timeouts, 401, token expiré, 5xx, latence > seuil).
- Contrat: Dredd/Schemathesis contre `openapi.yaml` (routes /dynamic/details, /connect/:mode, /usage, /healthz, /readyz, /metrics).
```

### Prompt G5.3 — Swagger/Postman automation
```
Scripts npm: `docs:lint` (spectral), `docs:test` (dredd + newman collection générée via openapi-to-postman), `docs:serve` (swagger-ui), `docs:bundle`.
CI: pipeline qui exécute lint + tests contractuels, puis publie l’UI de doc (artefacts) si succès.
```

### Prompt G5.4 — Observabilité (logs/metrics/traces)
```
Backend:
- Logs pino JSON: request_id, username, mac, dynamic_key, omada_site, status, latency_ms. Sortie vers fichiers surveillés par PM2 (`~/.pm2/logs`) ou `/var/log/captive-portail/*.log`. Prévoir parse JSON (Filebeat/Fluent-bit).
- Metrics Prometheus: /metrics avec counters (auth_requests_total par mode, dynamic_detail_cache_hits), histograms (radiusdesk_latency_ms, omada_latency_ms), gauges (omada_session_state, pm2_restart_count).
- Tracing OpenTelemetry (HTTP client axios) optionnel; exporter vers Jaeger/Zipkin.
- Health: /healthz (liveness) et /readyz (test RD/Omada + cache CSRF/dynamic).
Alerting minimal: cron `curl /healthz` + mail/slack; seuils Prometheus (ratio d’échecs Omada/RD, latence > 3s). Ajoute script `npm run smoke:health` exécuté après déploiement.
```

### Prompt G5.5 — PM2 config & scripts de déploiement
```
Crée `ecosystem.config.js` (apps backend + front static) et scripts:
- scripts/deploy_backend.sh: pull ref, install, build, `pm2 reload portal-backend`.
- scripts/deploy_frontend.sh: build, rsync vers `public/`, `pm2 reload portal-frontend`.
Paramètres dynamiques via variables d’environnement (hôte, dossier cible, ref git, fichier .env à copier).
```

---

## Notes & Rappels
- Toujours utiliser HTTPS pour Omada/Radiusdesk en production.
- Ne pas introduire de nouveaux widgets (QR/WhatsApp/PDF) sur la page Success/Info Conso.
- Respecter strictement les fonctionnalités dynamiques existantes du login Radiusdesk.
- Les secrets fournis ici ne doivent pas être commités en clair dans le code; utiliser `.env` et variables d’environnement.
