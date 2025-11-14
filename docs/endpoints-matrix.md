# G2.3 — Endpoints Matrix

| Frontend route | Backend endpoint | RadiusDesk/Omada dependency | Notes |
| --- | --- | --- | --- |
| `/` Dynamic Login | `GET /api/dynamic/details` | `GET /cake4/rd_cake/dynamic-details/info-for.json` | Propagates full query string `clientMac`, `key`, `lang`. Cached 15s, emits `x-cache-status`. |
| `/success` | `GET /api/usage`, `POST /api/usage/disconnect` | `GET /radaccts/get-usage.json`, `GET /radaccts/index.json`, `GET /radaccts/kick-active.json` | Aggregates quota + recent sessions; disconnect uses `kickActive`. |
| Connect actions | `POST /api/connect/{permanent|voucher|click|social}` | `GET /permanent-users/index.json`, `GET /vouchers/index.json`, `POST /api/v2/hotspot/extPortal/auth` | Validates credentials against RadiusDesk before pushing to Omada. |
| Social buttons | `GET /api/social/{provider}/start`, `/callback` | TBD (OAuth providers) | Stubs return state/redirect and feed `POST /connect/social`. |
| Health & Ops | `/healthz`, `/readyz`, `/metrics` | `GET /api/v2/hotspot/login`, `GET /dynamic-details/...` | `/readyz` ensures Omada CSRF + RadiusDesk cache; `/metrics` exposes prom-client counters. |

## External Docs Links

- **RadiusDesk**
  - `GET /permanent-users/index.json` — token + cloud_id query, returns `{items,totalCount}` with `last_seen` & `framedipaddress`.
  - `GET /vouchers/index.json` — exposes `time_valid`, `activate_on_login`, single field detection.
  - `GET /radaccts/get-usage.json` — public usage aggregator with fields `data_used`, `time_used`, `depleted`.
  - `GET /dynamic-details/info-for.json` — dynamic settings, languages, gallery, click-to-connect forms.
- **Omada Controller**
  - `POST /api/v2/hotspot/login` — body `{name,password}`, returns `{result.token}` + cookies `JSESSIONID`, `csrfToken`.
  - `POST /api/v2/hotspot/extPortal/auth?token=CSRF` — payload `clientMac`, `apMac|gatewayMac`, `ssidName|vid`, `site`, `radioId`, `time`, `authType=4`, `accessToken`. Errors: `-2010` (session expired), `4700` (timestamp drift), `4800` (unknown client).

These mappings ensure every UI component maps to a backend handler and authoritative Omada/RadiusDesk APIs referenced inside `docs/openapi/openapi.yaml`.
