---
name: radiusdesk-project
description: Production-safe maintenance workflow for this rdcore repository. Use when debugging RADIUSdesk inconsistencies between dashboard cards, activity monitor sessions, vouchers/permanent-user usage counters and statuses, WireGuard peer IPv4/AllowedIPs behavior, or when deploying fixes to the production EC2 with the installation-script run-phase process.
---

# RadiusDesk Project Ops

Use this skill for this repository only.

## Workflow

1. Confirm scope before changing code.
- Read target controller/shell/component files first.
- Validate the bug in production DB with read-only SQL before proposing a fix.

2. Use production access patterns from references.
- Follow [references/prod-access.md](references/prod-access.md) for SSH and MySQL commands.
- Take row-level backup extracts before any manual production update.

3. Implement durable fixes in source.
- Prefer fixing the root query/logic in `cake4/rd_cake/src`.
- If display is inconsistent but DB has data, add safe fallback logic in API output while keeping DB update paths correct.

4. Validate with data and API parity checks.
- Re-run the same SQL used to prove the bug.
- Check endpoint outputs for the same cloud and user sample.

5. Deploy using installation-script run phase.
- Follow [references/deploy-run-phase.md](references/deploy-run-phase.md).
- Use phase replay (`clean-state` + `run-phase.sh 40`) for app-only redeploy.

6. Record project-specific learnings.
- Add or update focused notes in [references/incidents.md](references/incidents.md).
- Keep entries short: date, symptom, root cause, file(s), verification query.

## Guardrails

- Never rely only on `radacct.realm` for cloud scoping when production data shows empty realm values.
- Treat `status='new'` vouchers with non-zero usage or first-auth evidence as a data coherence defect.
- For WireGuard peers, normalize comma-separated CIDR lists before generating config.
- Keep FreeRADIUS and CakePHP behavior aligned: counter updates, voucher state transitions, and UI percentages must be mutually consistent.
