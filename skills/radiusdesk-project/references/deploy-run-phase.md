# Deployment via installation-script (`run phase`)

Use this workflow for production deployment.

## Paths

Local workspace:
- `/home/mastershark-linux/dev/radiusdesk/installation-script`

Remote server (observed):
- installer repo: `/home/ubuntu/rdcore`
- phase runner: `/home/ubuntu/rdcore/deploy/run-phase.sh`
- app target: `/var/www/rdcore`

## Persistent custom fixes (important)

`run-phase.sh 40` does `git reset --hard origin/cake4` on `/var/www/rdcore`.
To keep project-specific fixes permanent, store patch files in:

- `/home/ubuntu/rdcore/deploy/templates/patches/*.patch`

The phase script auto-applies them after sync.

For current production, keep at least:
- `2026-05-21-rdcore-consistency-fixes.patch`
- `2026-05-21-php85-chronos-compat.patch`

## App redeploy flow (phase 40)

```bash
cd /home/ubuntu/rdcore
./deploy/clean-state.sh --phase 40 -y
sudo ./deploy/run-phase.sh 40
```

## Optional full replay

```bash
# App
sudo ./deploy/run-phase.sh 40
# FreeRADIUS
sudo ./deploy/run-phase.sh 50
```

## Post-deploy checks

```bash
sudo nginx -t
systemctl is-active nginx
systemctl is-active php8.5-fpm
systemctl is-active freeradius
```

API smoke checks:

```bash
curl -I http://127.0.0.1/rd/
curl -s "http://127.0.0.1/cake4/rd_cake/dashboard/users-items.json?cloud_id=24&token=<TOKEN>"
```
