# G2.3 — Endpoints Matrix

| Frontend route | Backend endpoint | RadiusDesk/Omada dependency | Notes |
| --- | --- | --- | --- |
| `/` Usage Login | `POST /api/login` | `GET /radaccts/get-usage.json` | Validates RadiusDesk credentials and issues a short-lived bearer token stored server-side (TTL configurable). |
| `/success` | `GET /api/usage`, `GET /api/usage-by-username`, `GET /api/{active,inactive}-sessions`, `POST /api/usage/disconnect` | `GET /radaccts/get-usage.json`, `GET /radaccts/index.json`, `GET /radaccts/kick-active.json` | Aggregates quota + recent sessions; all endpoints now require the usage session token from `/api/login`. |
| Connect actions | `POST /api/connect/{permanent|voucher|click|social}` | `GET /permanent-users/index.json`, `GET /vouchers/index.json`, `POST /api/v2/hotspot/extPortal/auth` | Validates credentials against RadiusDesk before pushing to Omada. |
| Social buttons | `GET /api/social/{provider}/start`, `/callback` | TBD (OAuth providers) | Stubs return state/redirect and feed `POST /connect/social`. |
| Health & Ops | `/healthz`, `/readyz`, `/metrics` | `GET /api/v2/hotspot/login`, `GET /dynamic-details/...` | `/readyz` ensures Omada CSRF + RadiusDesk cache; `/metrics` exposes prom-client counters. |

## RadiusDesk references

### Permanent users (GET `/permanent-users/index.json`)

Required query string: `token`, `cloud_id`, paging params (`limit`, `start`). Returns items with `last_seen`, `framedipaddress`, etc.

```json
{
  "success": true,
  "totalCount": 1,
  "items": [
    {
      "id": 44,
      "username": "demo@example.com",
      "profile": "Fibre-2M",
      "last_seen": { "status": "online", "span": "15m" },
      "framedipaddress": "10.0.0.12"
    }
  ]
}
```

Typical error (RBA/ACL mismatch):

```json
{ "success": false, "message": "Access denied", "status": 403 }
```

### Vouchers (GET `/vouchers/index.json`)

Used during voucher connect flows to ensure voucher is still valid.

```json
{
  "success": true,
  "items": [
    {
      "name": "GUEST-1234",
      "password": "secret",
      "time_valid": "00-04-00",
      "single_field": false
    }
  ]
}
```

Rate limiting error (`status: 429`) must propagate to frontend as a temporary failure.

### Dynamic details (GET `/dynamic-details/info-for.json`)

Used by `/api/dynamic/details` to render the React shell (Details/Settings/Pages). Request includes `key`, `clientMac`, `lang`.

### Sessions / Kick (GET `/radaccts/get-usage.json`, `/radaccts/index.json`, `/radaccts/kick-active.json`)

- `/radaccts/get-usage.json` is public (no token) and returns quotas:

```json
{
  "success": true,
  "data": { "data_used": 2048, "data_cap": 4096, "time_used": 1800, "time_cap": 7200, "depleted": false }
}
```

- `/radaccts/kick-active.json` requires `token`, `cloud_id`, plus `radacctid` keys. Success includes `{"data":{"title":"Disconnect Sent"}}`. Unauthorized returns `403`.

## Omada controller references

### Operator login (POST `/api/v2/hotspot/login`)

```json
{ "name": "Operator", "password": "Operator@123" }
```

Response:

```json
{ "errorCode": 0, "msg": "Success", "result": { "token": "751c0a2d-..." } }
```

Cookies stored: `JSESSIONID`, `Omada_Application_Id`, `csrfToken`.

### Client auth (POST `/api/v2/hotspot/extPortal/auth?token={CSRF}`)`

EAP payload example:

```json
{
  "clientMac": "AA-BB-CC-DD-EE-FF",
  "apMac": "11-22-33-44-55-66",
  "ssidName": "Guest-WiFi",
  "site": "e8f65d62-...",
  "radioId": 1,
  "authType": 4,
  "time": 1730488745123123,
  "accessToken": "user@example.com",
  "redirectUrl": "https://portal/success"
}
```

Gateway payload uses `gatewayMac` + `vid` instead of `apMac`/`ssidName`.

Error patterns expected by our backend:

- `errorCode: -2010` → session expired, re-login.
- `errorCode: 4700` → timestamp drift (client must resend).
- HTTP `500` → controller internal failure; we surface as `502` to frontend.

## Error handling alignment

- RadiusDesk RBA failure → backend returns `401` with `ApiError`.
- RadiusDesk throttling or DB failure → backend returns `500`.
- Omada controller errors bubble up through `/connect/{mode}` as `502` or `401`.

These references complement `docs/api/openapi.yaml` and guarantee the apps/frontend-portal-web-personalized/backends align with genuine upstream behaviour (permanent user lookup, voucher validation, radacct kick, Omada login/auth flows).
