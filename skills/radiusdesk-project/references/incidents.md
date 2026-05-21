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
