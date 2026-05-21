# Incidents & Fix Notes

## 2026-05-21

### Users cards mismatch (`online` vs `activity sessions`)
- Symptom: `Permanent Users Online + Vouchers Online` far above `Activity Monitor Sessions`.
- Root cause: cloud scoping relied on `radacct.realm`, but many active rows had empty realm.
- Source fixes:
  - `cake4/rd_cake/src/Controller/Component/CountsComponent.php`
  - `cake4/rd_cake/src/Controller/RadacctsController.php`
  - `cake4/rd_cake/src/Controller/RadacctsFastController.php`
- Verification: compare dashboard counts against `radacct` scoped by username membership in cloud users/vouchers/devices.

### Voucher `status=new` and blank `% used` after first auth
- Symptom: voucher shows online/used in DB timing, but UI still shows `New` and empty usage bars.
- Root causes:
  - `AccountingShell` treated `0%` as false and skipped update.
  - time-used assignment used remaining time instead of consumed time in one branch.
  - `VoucherShell` updated `time_used`/`time_cap` without setting `status`/`perc_time_used`.
- Source fixes:
  - `cake4/rd_cake/src/Shell/AccountingShell.php`
  - `cake4/rd_cake/src/Shell/VoucherShell.php`
  - output fallback in:
    - `cake4/rd_cake/src/Controller/VouchersController.php`
    - `cake4/rd_cake/src/Controller/PermanentUsersController.php`

### WireGuard peer multi-CIDR handling
- Symptom: multi-CIDR IPv4 values could produce invalid generated AllowedIPs (`.../24/32`).
- Root cause: config generation appended `/32` blindly.
- Source fixes:
  - `cake4/rd_cake/src/Controller/WireguardServersController.php`
  - `cake4/rd_cake/src/Controller/WireguardPeersController.php`
- Behavior: comma-separated CIDR lists are normalized before config output.

### Deployment persistence guard
- Risk: `run-phase.sh 40` resets `/var/www/rdcore` to `origin/cake4`, which drops manual hotfixes.
- Mitigation: maintain a patch bundle under installer repo:
  - `/home/ubuntu/rdcore/deploy/templates/patches/`
- Current patch:
  - `2026-05-21-rdcore-consistency-fixes.patch`
  - `2026-05-21-php85-chronos-compat.patch`

### PHP 8.5 compatibility (Chronos fatal)
- Symptom: API endpoints return `500`, nginx logs show fatal on `Chronos::createFromTimestamp` signature mismatch with `DateTimeImmutable` (`int|float`, `static`).
- Root cause: after `composer install --no-dev`, vendor Chronos method signature is not compatible with PHP 8.5.
- Fix: patch `cake4/rd_cake/vendor/cakephp/chronos/src/Traits/FactoryTrait.php`:
  - `createFromTimestamp(int|float $timestamp, $tz = null): static`
- Persistence: keep this in installer patch bundle (`2026-05-21-php85-chronos-compat.patch`).

### Omada OpenAPI disconnect false ACK
- Symptom: `kick-active` reported `ACK` while `radacct.acctstoptime` stayed `NULL` and `acctupdatetime` kept advancing every 60s.
- Root cause: OpenAPI client accepted HTTP `200` without trusted JSON success fields (`errorCode=0` or `success=true`) and treated login as success even when no token was returned.
- Source fixes:
  - `cake4/rd_cake/src/Service/OmadaApiClient.php`
    - strict success mapping in body-aware mode
    - login requires extracted token
  - `cake4/rd_cake/src/Controller/Component/KickerComponent.php`
    - normalized Omada statuses and richer audit payload
  - `cake4/rd_cake/src/Controller/RadacctsController.php`
  - `cake4/rd_cake/src/Controller/RadacctsFastController.php`
- Verification query:
  - `SELECT radacctid,acctupdatetime,acctstoptime FROM radacct WHERE radacctid=<id>;`
  - pass criteria: `acctstoptime` set (or new session churn explained) within SLA window.

### Omada OpenAPI OAuth mode mismatch
- Symptom: `kick-active` returned `auth_error` (`Omada credentials are not configured`) despite enabled DB settings.
- Root causes:
  - Controller requires OAuth access token (`/openapi/authorize/token`) for OpenAPI v1 calls.
  - Existing settings schema only stored username/password; no first-class client credentials.
  - After DB ALTER, Cake schema cache had to be cleared before new columns persisted through controller endpoint.
- Source fixes:
  - `cake4/rd_cake/src/Service/OmadaApiClient.php`:
    - added `client_credentials` token flow (`grant_type=client_credentials`)
    - added authorization-code flow helpers (login/code/token) for fallback compatibility
    - mapped Omada auth error codes (`-44106` etc.) to internal `auth_error`
  - `cake4/rd_cake/src/Model/Table/OmadaApiSettingsTable.php`
  - `cake4/rd_cake/src/Service/OmadaApiSettingsService.php`
  - `cake4/rd_cake/src/Controller/OmadaApiSettingsController.php`
  - `cake4/rd_cake/config/Omada.php`
  - `cake4/rd_cake/setup/db/8.110_add_omada_api_oauth_fields.sql`
- Validation evidence:
  - Manual kick E2E: status `ack`, endpoint `.../hotspot/authed-records/{id}/disconnect`, HTTP 200, `radacct.acctstoptime` filled in <60s.
  - Quota worker E2E (forced breach + restore): `[QuotaKickAudit]` logged `status=ack` with endpoint/http_code/latency/correlation and stop recorded in 15s.
