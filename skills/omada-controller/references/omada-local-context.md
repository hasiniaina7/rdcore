# Omada + FreeRADIUS Context (Remote Controller via SSH)

## SSH access
- Command:
```bash
ssh -i /home/mastershark-linux/ssh/desk-omada.pem techzone@omada.techzone.lat
```

## Services to validate on remote host
- `omada.service`: expected `active`
- `freeradius.service`: expected `active`

## Omada paths on remote host
- Controller home: `/opt/tplink/EAPController`
- Main properties: `/opt/tplink/EAPController/properties/omada.properties`
- Logs: `/opt/tplink/EAPController/logs/server.log`

## Validation commands (remote)
```bash
ssh -i /home/mastershark-linux/ssh/desk-omada.pem techzone@omada.techzone.lat \
  'systemctl status omada freeradius --no-pager'

ssh -i /home/mastershark-linux/ssh/desk-omada.pem techzone@omada.techzone.lat \
  "ss -lunp | rg '1812|1813|3799|8088|8843'"

ssh -i /home/mastershark-linux/ssh/desk-omada.pem techzone@omada.techzone.lat \
  "rg -n 'radius|acct|portal|disconnect|coa' /opt/tplink/EAPController/logs/server.log -m 200"
```

## Hard constraints
- Never copy real shared secrets into tickets/docs.
- Prefer `freeradius -X` only in maintenance windows.
- Confirm timezone consistency between Omada, FreeRADIUS, and SQL host before quota debugging.
