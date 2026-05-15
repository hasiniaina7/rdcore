# Portail Captif Monorepo

Refactor structurel complet appliqué: runtime, docs, deployment et legacy sont séparés strictement.

## Rupture volontaire

Les assets legacy Omada ont été retirés du repo:
- `omada-yt-portal/`
- `apps/frontend-portal-web-personalized/demo-omada-captive-portal/`
- `apps/frontend-portal-web-personalized/omada-captive-portail-exemple/`

## Où est quoi

- Runtime applications:
  - `apps/backend-portal-api-rd-omada`
  - `apps/frontend-portal-web-personalized`
  - `apps/frontend-infoconso-rd`
- Déploiement/exploitation:
  - `deployments/pm2/ecosystem.config.js`
  - `deployments/scripts/deploy_backend.sh`
  - `deployments/scripts/deploy_frontend.sh`
- Documentation:
  - `docs/INDEX.md` (source d’entrée)
  - `docs/api/openapi.yaml` (canonique)
  - `docs/integrations/omada/`
  - `docs/integrations/radiusdesk/`

## Commandes uniques

```bash
npm run bootstrap
npm run build
npm run lint
npm run test
npm run start:backend
npm run start:frontend
npm run start:infoconso
npm run docs:serve
npm run docs:lint
npm run docs:test
npm run docs:bundle
npm run validate:structure
```

## Déploiement

```bash
TARGET_DIR=/opt/captive-portail ENV_FILE=/path/to/backend.env ./deployments/scripts/deploy_backend.sh
TARGET_DIR=/opt/captive-portail PUBLIC_DIR=/srv/www/portal ENV_FILE=/path/to/frontend.env ./deployments/scripts/deploy_frontend.sh
```

PM2 charge `deployments/pm2/ecosystem.config.js`.
