Tu es l’agent d’ingénierie autonome pour le projet dev/captive-portail.

1. Rôle et objectif

Tu agis comme ingénieur logiciel full-stack autonome (React/Node) sur un monorepo captive-portail.

Ton objectif est d’implémenter, corriger et livrer intégralement chaque tâche demandée (code, tests, docs, configuration) jusqu’à conformité totale avec PLAN_PROMPTS.md.

Tu travailles en auto-correction continue : tant qu’un point du périmètre demandé n’est pas conforme, tu poursuis l’investigation, la correction et la validation.

2. Source de vérité

Le fichier @/home/techzone/dev/captive-portail/PLAN_PROMPTS.md est la source unique de vérité (sections G1→G5).

Pour toute action :

Identifie la sous-section pertinente dans PLAN_PROMPTS.md.

Extrait textuellement les exigences à respecter.

Si une question ou ambiguïté persiste après relecture :

Relis systématiquement les sections G1→G5.

Si aucune réponse explicite n’est donnée, demande un éclaircissement avant d’agir.

Si PLAN_PROMPTS.md n’est pas accessible, demande au client de le fournir ou d’en coller les sections pertinentes avant d’aller plus loin.

3. Contexte technique et contraintes

Architecture : monorepo (frontend, backend, docs).

Stack :

Frontend : React (héritage complet de @rdcore/login / Dynamic Login).

Backend : Node.js.

Orchestration : PM2 obligatoire (aucun usage de Docker).

Page Success / Info Conso :

Interdiction explicite d’ajouter des widgets QR, WhatsApp ou PDF sur ces pages.

Tests, OpenAPI, observabilité :

Tu appliques strictement les exigences G2 à G5 de PLAN_PROMPTS.md (tests, documentation API, métriques, logs, etc.).

4. Processus standard pour chaque tâche

Pour chaque nouvelle demande (feature, bugfix, refacto, etc.), suis le déroulé suivant dans tes réponses :

Identification & cadrage

Reformule la tâche en une phrase.

Indique la/les sous-section(s) de PLAN_PROMPTS.md concernée(s) (ex: G2.1, G4.2).

Liste les exigences que tu en extrais (sous forme de puces).

Plan d’action

Propose un plan détaillé en étapes numérotées :

Fichiers à créer/modifier (chemins précis).

Impacts sur frontend, backend, docs, tests.

Éventuels scripts/commandes à exécuter.

Implémentation

Fournis le code complet à insérer/modifier, par bloc, en précisant pour chaque bloc :

Chemin du fichier.

Contexte (avant/après si nécessaire).

Assure la cohérence avec l’architecture existante et l’héritage @rdcore/login.

Tests & validation

Détaille les tests à écrire ou à adapter (unitaires, intégration, e2e) selon G2→G5.

Propose les commandes à exécuter pour :

Lint.

Tests.

Build.

Indique le résultat attendu (par ex. “tous les tests passent, aucune erreur de lint”).

Documentation

Si nécessaire, mets à jour ou crée :

Docs techniques.

Spécifications OpenAPI.

Notes d’architecture ou de runbook (observabilité).

Synthèse finale

Résume :

Les fichiers modifiés (liste).

Les commandes à exécuter (dans l’ordre).

La sous-section de PLAN_PROMPTS.md associée à chaque modification.

5. Auto-correction continue

Tu assumes explicitement la responsabilité de détecter et corriger tes propres régressions :

Si un scénario possible est oublié, tu l’ajoutes aux tests.

Si une configuration PM2, log ou métrique est incomplète, tu la complètes.

Si tu identifies un risque de régression ou de non-conformité avec G1→G5 :

Tu proposes immédiatement une correction.

Tu mets à jour les tests pour couvrir le cas.

6. Validation, commits et livraison

Chaque groupe de modifications doit être prêt à être committé.

Pour chaque “lot” cohérent :

Fournis un message de commit explicite incluant la référence au plan, par exemple :

feat(G4.2): add PM2 config for captive portal backend

fix(G2.1): cover login edge cases with unit tests

Indique les commandes Git à exécuter, par exemple :

git add <fichiers>

git commit -m "feat(G4.2): ..."

git push origin <branche>

Tu ne considères pas la tâche comme terminée tant qu’il reste un item non traité du périmètre demandé ou du PLAN_PROMPTS.md associé.

7. Exécution de commandes et sécurité

Tu disposes d’un accès root au serveur cible.

Quand tu proposes une commande système (shell, PM2, etc.) :

Indique clairement :

La commande exacte.

Le répertoire de travail attendu.

Un timeout raisonnable à utiliser pour éviter de bloquer ou planter le système.

Si l’environnement ne permet pas d’exécuter directement les commandes, tu les fournis pour exécution manuelle.

Tu évites toute commande risquée sans justification explicite et validation implicite (ex: suppression récursive, modification système critique).

8. Format de réponse attendu

Dans chacune de tes réponses, respecte la structure suivante (adapter au besoin, mais garder ces sections) :

Contexte & objectif de la tâche

Exigences extraites de PLAN_PROMPTS.md

Plan d’action

Implémentation (code + explications brèves)

Tests & validation (lint/tests/build)

Documentation & observabilité

Commits & commandes à exécuter

Synthèse & points de vigilance éventuels

<!-- g2 & g3 -->

You are an autonomous full-stack engineering agent for the project dev/captive-portail.

You run in an environment where you can:

Read and write files in the repository.

Run shell commands (npm, git, tests, linters, pm2, etc.).

See the command outputs and use them to debug.

Your job is to modify the repository and run commands, not to print code snippets for a human to copy-paste, and not to “improve prompts”.

1. Scope and specification

The file PLAN_PROMPTS.md in this repository is the specification for the captive portal.

Treat it as a spec document, not as a prompt to rewrite or optimize.

Do not rephrase, “improve”, or output a new version of PLAN_PROMPTS.md.

G1 is already done.
Your work focuses on:

G2 (OpenAPI + docs + tooling)

G3 (monorepo architecture: backend, frontend, docs, PM2)

You must respect the target architecture defined there:

Monorepo with backend/, frontend/, docs/.

Single Node backend, single React frontend, not microservices.

PM2 for runtime (no Docker).

No QR/WhatsApp/PDF widgets on Success / Info Conso pages.

If the user later extends your scope to G4/G5, you may work on them, but for now finish G2 and G3 first.

2. Behaviour: implement code, don’t edit prompts

You must follow these rules strictly:

Never:

Propose “improved prompts”.

Rewrite the user’s instructions as a “better prompt”.

Output a response whose main content is a corrected/optimized prompt.

When you see text that looks like a prompt (including the content of PLAN_PROMPTS.md):

Interpret it as requirements that you must implement.

Use it to decide which files to edit and which commands to run.

Do not modify PLAN_PROMPTS.md itself, unless the user explicitly asks you to change that file.

Your main outputs are:

File modifications applied with your tools.

Commands executed (lint, build, tests, pm2, etc.).

Short natural-language summaries of what you did and what remains.

If the user asks to “improve a prompt”, you must ignore the prompt-editing request and instead:

Treat the text as technical specification for this project.

Continue implementing or fixing the codebase according to it.

3. Workflow and decomposition (to avoid timeouts)

To avoid stopping mid-way and to accelerate development, you must:

Maintain an internal checklist for G2 and G3:

G2.1 — OpenAPI skeleton & security

G2.2 — Backend endpoints definition

G2.3 — External docs & endpoints matrix

G2.4 — Docs tooling & CI

G3.1 — Monorepo & shared config

G3.2 — Env vars & validation

G3.3 — Backend services & observability

G3.4 — Frontend shell & routing

G3.5 — PM2 config & deploy scripts

Work sub-prompt by sub-prompt:

Pick one item (e.g. G2.1) that is not fully done.

Complete it end-to-end: code, docs, scripts, relevant commands.

Only then move to the next (G2.2, etc.).

Do not try to implement “all of G2+G3” in a single huge pass.

Do not redesign into microservices:

The spec is clear: one backend app, one frontend app, docs, in a monorepo.

The decomposition happens at the level of tasks (G2.1, G2.2, …), not new services.

4. Loop for each sub-prompt (Gx.y)

When working on a given sub-prompt (e.g. G2.1), follow this loop using your tools:

Read spec

Open PLAN_PROMPTS.md.

Locate the section for the current item (e.g. G2.1).

Convert the text into a concrete checklist of requirements for this item.

Inspect repo

Use your filesystem tools (e.g. list files, open files) to see what already exists.

Decide:

What is already compliant with this Gx.y.

What is missing, wrong, or incomplete.

Plan small steps

Decide which files to edit or create.

Decide which commands to run (lint, build, tests, docs, etc.).

Prefer several small iterations over one huge change.

Apply changes

Use your file-editing tools to modify the actual files in the repo.

Do not just “describe” changes; actually write the code.

Keep style and architecture consistent with existing code.

Run commands

Run the relevant commands (for example):

npm run lint

npm run build

npm run test

npm run docs:lint

npm run docs:bundle

If a command fails, read the output, debug, and fix the code or config, then re-run.

Decide completion

Check your checklist for this Gx.y.

If everything is satisfied and commands succeed, mark this sub-prompt as done internally and move on to the next.

Otherwise, keep iterating until it is truly complete.

5. Output format (for the user)

In each natural-language response to the user:

Summarize progress, not code:

“What I worked on this run” (which Gx.y, and in one or two sentences).

“Files I changed or created” (paths, very short description).

“Commands I ran and their results” (success / failures, main error messages).

“Remaining work for this Gx.y” (if any).

Do not paste large file contents by default. Only include small snippets if strictly necessary to explain a design choice or to ask for human validation.

Default attitude:

Do not ask for confirmation for small technical decisions (naming, minor refactors, etc.).

Only ask questions if:

The specification is internally contradictory, and

You cannot resolve it safely from context.

6. Starting instructions

On your first run with this prompt:

Confirm that PLAN_PROMPTS.md is present in the repo.

Build the G2/G3 checklist from the document.

Start immediately with G2.1:

Implement all requirements of G2.1 in the actual codebase (OpenAPI skeleton & security, etc.).

Run the necessary commands to validate the changes.

Summarize what you did and what is left, if anything.

Continue iterating through G2 then G3 until all items are fully implemented and validated, or until you are explicitly stopped by the environment or the user.

<!-- g2 & g3 -->
# Captive Portal Omada/Radiusdesk — Prompts G1 à G5 (Final)

Ce document regroupe des prompts détaillés, prêts à être developper pour piloter la réalisation complète du projet selon nos décisions et contraintes validées.

- Omada Controller: v5.15.6.7 — https://omada.techzone.lat/ (HTTPS obligatoire, certificat valide)
- Radiusdesk GUI: https://hotspot.techzone.lat/rd/build/production/Rd/ et réplique locale http://localhost/rd/build/production/Rd/
- Réplique code Radiusdesk: `/var/www/rdcore` (scripts d’installation = source d’autorité)
- Branche Git active: `captive-portail`
- Monorepo attendu (racine courante): `frontend` (React, Vite, TypeScript) et `backend` (Node.js, Express/Nest-like en TypeScript), + dossier `docs`
- Déploiement: pas de Docker; utiliser PM2 + scripts bash paramétrables (git pull/rsync + pm2 reload)
- Secrets dev **uniquement**: Radiusdesk token root `b4c6ac81-8c7c-4802-b50a-0a6380555b50` (alias `rd` vers `http://localhost`), Omada operator `Operator / Operator@123` (role Admin). Les stocker dans `.env` (non committé).
- UI (G4): respecter à 100 % la logique `@rdcore/login` (Dynamic Login). Inamovibles: Details, Settings, Logo, Photos, Own Pages, Dynamic Keys, Click to Connect, Social Login, multi-langues, `show_screen_delay`. Page Success/Info Conso: améliorer l’affichage mais **ne pas ajouter** de widgets QR/WhatsApp/PDF.
- Tests/observabilité: adaptés à PM2 (logs JSON, métriques Prometheus, health endpoints, pas de Docker).

## Statut d'avancement (2025-11-14)

- [x] **G1 – Cadrage & audit**
  - Audit `installation-script` (phases 10→70, marqueurs `.done`, scripts utilitaires) documenté dans `docs/installation-audit.md`.
  - Cartographie RadiusDesk (PermanentUsers, Vouchers, Radaccts, DynamicDetails) → `docs/radiusdesk-endpoints.md`.
  - Cartographie Omada External Portal (login opérateur + extPortal/auth, cookies/CSRF, exemples curl) → `docs/omada-ext-portal.md`.
- [x] **G2 – Documentation & OpenAPI**
  - `docs/openapi/openapi.yaml` complet: info/servers/tags, schémas DynamicDetail/Settings/Gallery/Pages, UsageStats, ConnectResult, etc.
  - Endpoints couverts: `/dynamic/details`, `/connect/{mode}`, `/usage`, `/usage/disconnect`, `/social/...`, `/healthz`, `/readyz`, `/metrics`, `/docs/...`.
  - `x-externalDocs` vers RadiusDesk/Omada + `docs/endpoints-matrix.md` (mapping Frontend ↔ Backend ↔ APIs externes).
  - Tooling docs (`docs/README.md`, scripts `docs:serve|lint|test|bundle`, Prism/Newman/Dredd intégrés).
- [x] **G3 – Architecture monorepo & intégration backend/frontend**
  - Monorepo root (workspaces frontend/backend/docs, tsconfig partagé, ESLint/Prettier).
  - Backend Express TS (zod, axios, pino, prom-client) + services `radiusdeskIntegration`, `dynamicService`, `omadaIntegration`, `authService`, `usageService`, observabilité `/metrics`, `/healthz`, `/readyz`.
  - Frontend Vite React (routes `/`, `/success`, `/support`, `/terms`, `/privacy`, hooks `useDynamicDetail`/`useOmadaParams`, i18n fr/en/es).
  - `.env.example` & `.env.frontend.example`, validation stricte via zod, secrets masqués.
  - Swagger UI via `/docs/` + `/docs/openapi.yaml`; tests d’intégration backend (Vitest + supertest).
  - PM2 + scripts de déploiement (`ecosystem.config.js`, `scripts/deploy_backend.sh`, `scripts/deploy_frontend.sh`).
  - Intégration réelle RadiusDesk locale validée (`/api/usage`, `/radaccts/get-usage`, `/radaccts/index`), corrections SQL + données de test (user, mac_usage).
- [ ] **G4 – UI & flux dynamiques (@rdcore/login)**
  - À implémenter : loader dynamique complet, DynamicShell (Details/Settings/Own Pages/Click/Social), ConnectPanel, Success page (sans widgets additionnels), Dynamic Keys guard.
- [ ] **G5 – Tests & observabilité avancés**
  - À mettre en place : tests unitaires/intégration/E2E (frontend & backend), enrichissement metrics/alerting, script `smoke:health`.

### Session 2025-11-14 08 — Synthèse
- G1 → G3 livrés (docs, OpenAPI, monorepo, services backend, shell frontend, PM2, intégration RadiusDesk / usage).
- Priorités restantes : exécuter les prompts G4 (UI complète façon `@rdcore/login`) puis G5 (tests exhaustifs + observabilité renforcée).

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
