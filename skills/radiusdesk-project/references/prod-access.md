# Production Access

## SSH

```bash
ssh -i "/home/mastershark-linux/ssh/key-not-for-faneva.pem" ubuntu@ec2-13-247-123-11.af-south-1.compute.amazonaws.com
```

## rdcore paths on server

- `/var/www/rdcore/cake4/rd_cake`
- `/var/www/rdcore/rd`
- `/var/www/rdcore/cake4/rd_cake/config/app_local.php`

## MySQL (production)

Configured in `app_local.php`:
- host: `127.0.0.1`
- db: `rd`
- user: `rd`
- pass: `rd`

Quick connect:

```bash
mysql -urd -prd -D rd
```

## Safety pattern for manual row edits

1. Export current row(s).

```bash
mysql -urd -prd -D rd -e "SELECT * FROM table_name WHERE id=123\\G" > /tmp/table_name_123_before_$(date +%F_%H%M%S).txt
```

2. Apply targeted `UPDATE` with strict `WHERE`.
3. Re-select and verify.

## High-value consistency checks

### Users dashboard coherence

```sql
-- Cloud 24 / Realm 20 (PROD) example
SELECT COUNT(*) FROM radacct WHERE acctstoptime IS NULL;
SELECT COUNT(*) FROM radacct WHERE acctstoptime IS NULL AND realm='PROD';

SELECT COUNT(DISTINCT pu.id)
FROM permanent_users pu
JOIN radacct ra ON ra.username=pu.username AND ra.acctstoptime IS NULL
WHERE pu.cloud_id=24 AND pu.realm_id=20;

SELECT COUNT(DISTINCT v.id)
FROM vouchers v
JOIN radacct ra ON ra.username=v.name AND ra.acctstoptime IS NULL
WHERE v.cloud_id=24 AND v.realm_id=20;
```

### Voucher status / usage sanity

```sql
SELECT id,name,status,time_used,time_cap,perc_time_used,data_used,data_cap,perc_data_used,last_accept_time
FROM vouchers
WHERE cloud_id=24
ORDER BY id DESC
LIMIT 50;
```
