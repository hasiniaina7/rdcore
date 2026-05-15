# Documentation Toolkit

Point d’entrée: `docs/INDEX.md`.

## Tooling

- `npm run docs:serve` preview de `docs/api/openapi.yaml`
- `npm run docs:lint` validation Spectral
- `npm run docs:test` Dredd + Newman
- `npm run docs:bundle` bundle vers `docs/api/bundle.yaml`

## Workflow

1. Modifier `docs/api/openapi.yaml`
2. Lancer `npm run docs:lint`
3. Lancer backend puis `npm run docs:test`
4. Bundler via `npm run docs:bundle`

## Runtime docs access

- Swagger UI: `http://localhost:4000/docs`
- Raw OpenAPI YAML: `http://localhost:4000/docs/openapi.yaml`

## PM2 and deployment

- PM2 file: `deployments/pm2/ecosystem.config.js`
- Scripts: `deployments/scripts/deploy_backend.sh`, `deployments/scripts/deploy_frontend.sh`
