# Documentation Toolkit (G2.4)

## Tooling

| Command | Description |
| --- | --- |
| `npm run docs:serve` | Preview the OpenAPI spec locally via Redocly. |
| `npm run docs:lint` | Spectral governance for `docs/openapi/openapi.yaml`. |
| `npm run docs:test` | Runs Dredd against a running backend (`http://localhost:4000`) and Newman against a Postman collection generated from the OpenAPI file. |
| `npm run docs:bundle` | Produces `docs/openapi/bundle.yaml` for distribution (flattened). |

## Workflow

1. Edit `docs/openapi/openapi.yaml`.
2. `npm run docs:lint` to catch violations.
3. Start the backend (`npm run start:backend`) and run `npm run docs:test` for contract checks.
4. `npm run docs:bundle` and publish the artefact via CI.

## CI Guidance

- **lint-docs job**: run `npm ci`, `npm run docs:lint`.
- **publish-docs job**: run `npm run docs:bundle` and archive `docs/openapi/bundle.yaml` + the Redoc build output.

## Swagger / Postman

- Swagger UI/Redoc served with `npm run docs:serve` (Listens on port 8080 by default).
- Postman collection is generated transiently inside `/tmp/postman.json` during `docs:test`.
- Prism mock servers can be launched via `npx @stoplight/prism mock docs/openapi/openapi.yaml` if needed during manual QA.

## PM2 & Environment Variables

- Copy `.env.example` to `backend/.env` and `.env.frontend.example` to `frontend/.env` before building.
- Use `pm2 start ecosystem.config.js --only portal-backend --update-env` to reload backend with the new environment (PM2 injects `backend/.env` via `dotenv`).
- `scripts/deploy_backend.sh` and `scripts/deploy_frontend.sh` accept `ENV_FILE=/path/to/.env` so CI/CD can template secrets and push them prior to `pm2 startOrReload`.
