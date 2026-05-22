# Dynamic Expiration Pilot Ops (Vouchers)

## Scope
- Pilot applies to vouchers only.
- Profile flag stored in `radgroupcheck`:
  - `attribute='Rd-Dynamic-Expiration'`
  - `value='1'`
- Runtime precise expiry stored per voucher in `radcheck`:
  - `attribute='Rd-Expiration-Unix'`

## Find target profile-component groupname
```sql
SELECT id,name,CONCAT('SimpleAdd_',id) AS groupname
FROM profiles
WHERE name='001-Basique-2G0-1jour'
   OR name LIKE '002%'
   OR name LIKE '003%'
   OR name LIKE '004%'
ORDER BY name;
```

## Enable on one profile-component
```sql
INSERT INTO radgroupcheck (groupname,attribute,op,value,comment)
SELECT 'SimpleAdd_53','Rd-Dynamic-Expiration',':=','1','manual-enable'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM radgroupcheck
  WHERE groupname='SimpleAdd_53'
    AND attribute='Rd-Dynamic-Expiration'
);
```

## Disable on one profile-component
```sql
DELETE FROM radgroupcheck
WHERE groupname='SimpleAdd_53'
  AND attribute='Rd-Dynamic-Expiration';
```

## Verify enabled flags
```sql
SELECT groupname,attribute,value,comment
FROM radgroupcheck
WHERE attribute='Rd-Dynamic-Expiration'
  AND groupname IN ('SimpleAdd_53','SimpleAdd_54','SimpleAdd_55','SimpleAdd_56')
ORDER BY groupname;
```

## Verify runtime arming on vouchers
```sql
SELECT rc.username,rc.value AS exp_unix,FROM_UNIXTIME(rc.value) AS exp_at
FROM radcheck rc
JOIN radcheck rt ON rt.username=rc.username AND rt.attribute='Rd-User-Type' AND rt.value='voucher'
WHERE rc.attribute='Rd-Expiration-Unix'
ORDER BY rc.id DESC
LIMIT 50;
```

## Idempotency check
```sql
SELECT username,COUNT(*) AS cnt
FROM radcheck
WHERE attribute='Rd-Expiration-Unix'
GROUP BY username
HAVING COUNT(*) > 1;
```

