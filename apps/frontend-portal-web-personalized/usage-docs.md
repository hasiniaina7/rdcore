# WiFi Usage Dashboard

This dashboard is the entry point for RadiusDesk usage data in the Omada captive portal template. The code now lives in the `Success` page (`src/pages/Success.tsx`) and is backed by the reusable helpers in `src/modules/usage`.

## API surface

The frontend talks exclusively to the local Express backend on `http://localhost:4000/api` (configure `VITE_API_BASE_URL` in `.env` for production). The following endpoints are consumed:

| Endpoint | Purpose | Frontend entrypoint |
| --- | --- | --- |
| `GET /usage` | Fetch quota (bytes/time), MAC address and depletion state. | `fetchUsageStats` |
| `GET /usage-by-username` | Aggregated usage windows (hour/day/week/month). | `fetchUsageSummary` |
| `GET /active-sessions` | Live sessions, last 25 entries. | `fetchActiveSessions` |
| `GET /inactive-sessions` | Historical sessions (last 80 entries). | `fetchInactiveSessions` |
| `POST /usage/disconnect` | Disconnect a specific `radacctid`. | `disconnectUsageSessions` |

All calls go through `src/modules/usage/api.ts`, so adding a new endpoint only requires a helper there and optional aggregation logic in `src/modules/usage/utils.ts`.

## User flow

1. **Login panel** – The success page now mimics a captive portal login: the user must provide username, password and (optionally) MAC before data is requested. Stored Omada credentials (`sessionStorage`) or URL parameters bootstrap the form.
2. **Dashboard cards** – Once authenticated, the top row shows connection status, last refresh timestamp, quota progress (data + time) and aggregate byte usage for the day/week/month.
3. **Filters** – A responsive filter bar (date range, router, MAC, minimum MB, active/inactive state) drives both the tables and the charts without an extra API call.
4. **Charts** – Daily usage renders as a line chart, while weekly/monthly data is displayed as lightweight bar charts (Recharts). No heavy charting dependencies were added.
5. **Router insights** – The router list ranks access points by total bytes and session count, useful when troubleshooting overloaded APs.
6. **Sessions table** – All active and historical sessions are merged into a single responsive table with status chips, live disconnect CTA and horizontal scrolling on narrow screens.
7. **Support & contact** – Operator contact information still lives at the bottom of the page, sourcing data from the dynamic detail payload.

## Data utilities

`src/modules/usage/utils.ts` contains the normalized helpers used across the dashboard:

- Byte and duration formatting (`bytesToHuman`, `secondsToDuration`).
- Session metadata helpers (`getSessionBytes`, `getRouterLabel`, `getMacAddress`).
- Aggregations (`aggregateByDay`, `aggregateByRouter`, `summarizePeriod`).
- Filtering pipeline (`filterSessions`, `combineSessions`).
- Select options for routers/MACs (`getRouterOptions`, `getMacOptions`).

When adding a new visualization, derive the data from these helpers instead of duplicating parsing logic.

## Testing with sample users

Use the backend fixtures/users already available on your RadiusDesk instance. Locally, `glaringboy` and `nolimit` are wired in the mocks, so you can run:

```bash
# Backend (API proxy)
npm run dev --workspace apps/backend-portal-api-rd-omada

# Frontend (Vite)
cd frontend
VITE_API_BASE_URL="http://localhost:4000/api" npm run dev
```

Then browse to `/success?username=glaringboy&password=<pass>` or `/success?username=nolimit&password=<pass>` to verify that the charts, tables and filters react to real data. The responsive layout has been verified for both 360px and 1440px viewports; keep those breakpoints in mind when adding new widgets.

## Admin console

- The `/admin` route exposes a secured workspace for operators. It consumes the new `/api/admin/*` endpoints which require a token.
- Authentication modes:
  - Static operator: set `ADMIN_STATIC_USER` / `ADMIN_STATIC_PASSWORD` and leave `ADMIN_AUTH_MODE=static` (default).
  - RadiusDesk MySQL: set `RADIUS_MYSQL_USER` / `RADIUS_MYSQL_PASSWORD` and optionally `ADMIN_AUTH_MODE=radiusmysql` to make it the default.
- Additional environment knobs live in the backend `.env` file:
  - `ADMIN_TOKEN_TTL_MINUTES` controls token lifetime (default 240 minutes).
- Once authenticated, admins can search any username to obtain:
  - Aggregated periods (hour/day/week/month), routers, MAC list.
  - Recent active and inactive sessions (no password required).
- Tokens are stored in `localStorage` on the frontend and can be revoked via the logout button.
