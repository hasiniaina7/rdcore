# FreeRADIUS Disconnect Playbook for Omada

## 1) Disconnect methods
- `Disconnect-Request` (DM): terminate session immediately on NAS.
- `CoA-Request`: modify session attributes; can also force deauth depending on NAS support/profile.

For strict cut-off on quota exceed, prefer `Disconnect-Request`.

## 2) Prerequisites checklist
- NAS (Omada AP/Gateway) accepts dynamic authorization on UDP 3799.
- Shared secret for dynamic auth matches exactly between NAS and FreeRADIUS client config.
- Session correlation keys available:
  - `Acct-Session-Id` (best)
  - `Calling-Station-Id`
  - `User-Name`
  - Optionally `NAS-Port`
- Accounting `Interim-Update` enabled with realistic interval (e.g., 60-300s).

## 3) Manual disconnect workflow
1. Identify active session in `radacct`.
2. Build request attributes (`User-Name`, `Calling-Station-Id`, `Acct-Session-Id`, optional `NAS-Port`).
3. Send request with `radclient` to NAS IP on `3799`.
4. Expect `Disconnect-ACK`; if `NAK`, inspect reason and attribute mismatch.
5. Confirm session closure in Omada client list and `radacct` stop update.

Command pattern:
```bash
scripts/send_radius_disconnect.sh disconnect <nas_ip> <secret> <user> <mac> <acct_session_id> [nas_port]
```

## 4) Automatic disconnect workflow (quota exceeded)
1. On each `Interim-Update`, compute remaining time and data.
2. If over hard limit, enqueue Disconnect-Request immediately.
3. Mark session as "disconnect_requested" to avoid duplicate flood.
4. If no ACK, retry with bounded backoff; alert after retry budget exhausted.

Minimum control loop:
- Input: live accounting packet + current quota state.
- Decision: continue / throttle / disconnect.
- Output: RADIUS reply attrs and/or dynamic auth action.

## 5) Where to implement automation in FreeRADIUS
- `unlang` + SQL counters (`sqlcounter`) for policy decisions.
- External worker (script/service) if disconnect orchestration needs queue/retry/observability.

## 6) Fast troubleshooting matrix
- No Disconnect-ACK:
  - Wrong NAS target IP (sent to controller instead of actual NAS, or inverse depending architecture).
  - Secret mismatch.
  - UDP/3799 blocked.
- ACK but user still online:
  - Session identifiers mismatched.
  - Different active session than queried.
  - NAS firmware behavior: delayed reauth/deauth.
- Quota delay too high:
  - Interim interval too long.
  - Reliance on Stop instead of Interim packets.

## 7) Non-negotiable observability
Capture and keep:
- Disconnect request timestamp
- NAS target IP
- Key attrs hash (not raw secret)
- ACK/NAK result and reason
- Session stop confirmation latency

Without these fields, disconnect reliability claims are not defensible.
