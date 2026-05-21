---
name: omada-controller
description: Operate and troubleshoot TP-Link Omada captive portal authentication with FreeRADIUS when the Omada controller is remote over SSH, including Access-Accept policy attributes, accounting-based quota enforcement (time and data), byte/MB/GB conversion from RADIUS octets+gigawords, and user disconnect workflows (manual and automatic via Disconnect-Request/CoA).
---

# Omada Controller (Remote SSH)

## Execution Standard
- Treat quota and disconnect claims as unproven until packet-level or DB evidence is shown.
- Reject ambiguous units. State decimal (`MB/GB`) vs binary (`MiB/GiB`) explicitly.
- Refuse to conclude "works" unless authentication, accounting, and disconnect paths are all validated.

## Workflow

### 1) Build context before changing anything
1. Read [references/omada-local-context.md](references/omada-local-context.md).
2. Confirm service health (`omada`, `freeradius`) and listening ports over SSH.
3. Identify authoritative data sources for session state (`radacct`, Omada client/session view, server logs).

### 2) Validate authentication path (captive portal)
1. Confirm Omada portal is configured in RADIUS mode for the correct SSID/site.
2. Validate Access-Request and Access-Accept exchange.
3. Verify policy attributes returned by FreeRADIUS:
   - `Session-Timeout`
   - `Idle-Timeout`
   - Any VLAN/role attributes if used
4. If auth succeeds but policy fails, prove attribute mismatch before editing policy.

### 3) Validate accounting integrity (required for quotas)
1. Ensure `Acct-Status-Type` Start/Interim/Stop are arriving.
2. Ensure interim updates are frequent enough for your SLA.
3. Compute bytes with Gigawords rollover logic from [references/radius-attributes-and-quota.md](references/radius-attributes-and-quota.md).
4. Use `scripts/bytes_quota_calc.py` to eliminate math mistakes.

Example:
```bash
scripts/bytes_quota_calc.py \
  --input-octets 123456789 \
  --output-octets 987654321 \
  --input-gigawords 1 \
  --output-gigawords 0
```

### 4) Enforce quota policy (time + volume)
1. Time quota:
   - Prefer explicit remaining-time logic from accounting deltas.
   - Use `Session-Timeout` for bounded session durations.
2. Volume quota:
   - Evaluate `total_bytes = in + out` using rollover-safe formula.
3. Decision model:
   - Under limit: allow.
   - At soft threshold: optional CoA/throttle policy.
   - At hard threshold: immediate Disconnect-Request.
4. Never rely only on `Acct-Stop` for near-real-time cut-off.

### 5) Disconnect users (manual or automatic)
Read [references/freeradius-disconnect-playbook.md](references/freeradius-disconnect-playbook.md) and then execute:

1. Correlate active session keys (`Acct-Session-Id`, `Calling-Station-Id`, `User-Name`).
2. For manual cut:
```bash
scripts/send_radius_disconnect.sh disconnect <nas_ip> <secret> <user> <mac> <acct_session_id> [nas_port]
```
3. For dynamic policy updates without hard cut, use `coa` mode.
4. Record ACK/NAK and confirm stop event latency.

## Output Contract
When asked to diagnose or configure, always return:
1. Proven facts (with command/log/db evidence).
2. Hypotheses not yet proven.
3. Exact changes to apply.
4. Validation checklist with pass/fail criteria.
5. Rollback path.

## Guardrails
- Do not expose RADIUS secrets in outputs.
- Do not change live policy without naming blast radius (which site/SSID/users).
- Do not claim quota accuracy if units, interim interval, or gigawords handling are unknown.
- Do not claim disconnect reliability without ACK/NAK evidence and post-disconnect session verification.
