# RADIUS Attributes, Volume Math, and Quota Enforcement

## Core attributes used for captive portal quota logic
- Authentication/authorization:
  - `User-Name`
  - `Cleartext-Password` (on server side user store)
  - `Session-Timeout` (seconds)
  - `Idle-Timeout` (seconds)
- Accounting:
  - `Acct-Status-Type` (`Start`, `Interim-Update`, `Stop`)
  - `Acct-Session-Id`
  - `Acct-Session-Time` (seconds)
  - `Acct-Input-Octets` (32-bit)
  - `Acct-Output-Octets` (32-bit)
  - `Acct-Input-Gigawords` (rollover count)
  - `Acct-Output-Gigawords` (rollover count)

## Exact byte formulas
For each direction:
- `bytes = octets + gigawords * 4294967296`

Total traffic:
- `total_bytes = input_bytes + output_bytes`

## Unit conversions (be explicit every time)
- Decimal:
  - `1 MB = 1,000,000 bytes`
  - `1 GB = 1,000,000,000 bytes`
- Binary:
  - `1 MiB = 1,048,576 bytes`
  - `1 GiB = 1,073,741,824 bytes`

## Common failure patterns to reject
- Mixing MB with MiB in policy thresholds.
- Ignoring `Gigawords` and undercounting long sessions.
- Depending only on `Stop` packets instead of `Interim-Update`.
- Assuming disconnect is instantaneous without checking Interim interval and NAS behavior.

## Practical SQL pattern (radacct)
```sql
SELECT
  username,
  acctsessionid,
  acctstarttime,
  acctsessiontime,
  (acctinputoctets + acctinputgigawords * 4294967296) AS input_bytes,
  (acctoutputoctets + acctoutputgigawords * 4294967296) AS output_bytes,
  ((acctinputoctets + acctinputgigawords * 4294967296)
   + (acctoutputoctets + acctoutputgigawords * 4294967296)) AS total_bytes
FROM radacct
WHERE username = :username
ORDER BY acctstarttime DESC;
```

## Quota model for portal mode (recommended)
- Time quota: decrement from `Acct-Session-Time` or interval deltas.
- Volume quota: decrement from total bytes formula above.
- Trigger point:
  - Soft limit: apply throttling profile (optional via CoA).
  - Hard limit: issue Disconnect-Request or set Session-Timeout low at next Access-Accept.
