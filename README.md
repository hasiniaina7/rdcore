# RadiusDesk + FreeRADIUS – Déploiement automatisé (Ubuntu 20.04/22.04/24.04)

Ce dépôt contient des scripts idempotents pour installer et configurer:
- Nginx + PHP‑FPM (pile LEMP)
- MariaDB (et comptes DB nécessaires)
- RadiusDesk (rdcore + CakePHP v4, liens, cron)
- FreeRADIUS (backend SQL, dynamic clients, config RadiusDesk officielle)
- TLS (optionnel) via Certbot

Les valeurs de configuration sont centralisées dans `deploy/config/env.sh`.

## Prérequis
- VM Ubuntu 20.04/22.04/24.04 avec accès root/sudo.
- DNS et ports ouverts selon besoin (HTTP/HTTPS/RADIUS).
- Accès réseau sortant (`apt`, `git`, `snap`).

## Structure
```
deploy/
  config/env.sh          # Variables d'env (FQDN, DB, secrets...)
  lib/common.sh          # Logging, idempotence
  scripts/               # Phases d'install (10..70)
  run-all.sh             # Orchestration complète
  run-phase.sh           # Orchestration par phase
  clean-state.sh         # Purge sélective des marqueurs d’étape
```

## Configuration (env.sh)
- `SERVER_FQDN` (ex: `hotspot.example.com`)
- `DB_NAME|DB_USER|DB_PASS` (par défaut `rd/rd/rd`)
- `RADIUS_SECRET_DEFAULT` (par défaut `testing123`)
- `RADIUS_CLIENT_NET` (CIDR des NAS: ex `10.0.0.0/24`)
- `AUTO_LE=1` pour demander automatiquement un certificat via `certbot --nginx`.

Astuce: exportez des variables à la volée avant `run-all.sh` pour override ponctuel.

## Lancer l’installation
```
chmod +x deploy/**/*.sh
sudo DEPLOY_ENV=prod SERVER_FQDN=localhost DB_PASS=rd RADIUS_SECRET_DEFAULT=testing123 \
  ./deploy/run-all.sh
```
Les logs se trouvent dans `/var/log/radiusdesk-install/*.log`.

## Phases
- `10_base_os.sh` – Mise à jour OS, utilitaires, timezone/hostname.
- `20_web_php.sh` – Nginx, PHP‑FPM, vhost RadiusDesk (réécritures CakePHP).
- `30_mariadb.sh` – MariaDB, SQL mode et event scheduler, comptes DB.
- `40_radiusdesk_app.sh` – rdcore, Composer (www-data), `app_local.php`,
  dossiers uploads, import `rd.sql` + patchs SQL `8.*.sql`, cron.
- `50_freeradius.sh` – déploiement config officielle (tar), SQL backend, dynamic clients,
  neutralisation `filter_username`, vérification `freeradius -C` et restart.
- `70_tls_certbot.sh` – installation certbot et obtention de certificat (optionnel).

## Rejouer des phases
Les scripts sont idempotents et marquent chaque étape via
`/var/local/radiusdesk-install/*.done`. Pour rejouer une phase précise:
```
sudo rm /var/local/radiusdesk-install/40_radiusdesk_app.done
sudo ./deploy/run-phase.sh 40
```

### Helper de nettoyage
`deploy/clean-state.sh` propose un nettoyage fin:
```
# Lister les marqueurs
./deploy/clean-state.sh --list

# Purger une phase (ex: 40)
./deploy/clean-state.sh --phase 40 -y

# Purger les marqueurs de patchs SQL
./deploy/clean-state.sh --patches -y

# Purger tout
./deploy/clean-state.sh --all -y
```

## Vérifications rapides
- Nginx/PHP:
  - `sudo nginx -t && systemctl is-active nginx`
  - `systemctl is-active php*-fpm`
  - `curl -I http://SERVER_FQDN/rd/` → 200
- Base de données:
  - `mysql -u rd -p${DB_PASS} rd -e 'SELECT COUNT(*) FROM users;'`
- GUI RadiusDesk:
  - `http://SERVER_FQDN/rd/build/production/Rd/` (login: `root` / `admin`)
- FreeRADIUS:
  - `sudo freeradius -C` (OK)
  - `systemctl is-active freeradius` (active)
  - `printf 'User-Name = dev@dev\nUser-Password = testing123\n' | sudo radclient -x 127.0.0.1 auth ${RADIUS_SECRET_DEFAULT}` → Access-Accept

## Particularités Nginx / Assets
Le vhost inclut des règles de réécriture pour servir correctement les assets CakePHP
et autoriser l’upload (images, logos, etc.). Les dossiers d’upload sont créés et
assignés à `www-data`:
```
/var/www/rdcore/cake4/rd_cake/webroot/img/{realms,dynamic_details,dynamic_photos,access_providers,hardwares}
/var/www/rdcore/cake4/rd_cake/webroot/files/imagecache
```

## TLS (optionnel)
Si `AUTO_LE=1` et DNS OK:
```
sudo ./deploy/run-phase.sh 70
```
Sinon exemples manuels (HTTP‑01 / DNS‑01) loggés dans `70_tls_certbot.sh`.

## Développement / Thème (ExtJS/Sencha)
- Sources UI: `/var/www/rdcore/rd` et `AmpConf`.
- Sencha Cmd recommandé (builds)
- Personnaliser SASS/ressources, puis `sencha app build` et publier sur `/var/www/html/rd/build/production/Rd` si nécessaire.

## Conseils d’exploitation
- Sauvegarde: DB `rd` + `/var/www/rdcore` + `/etc/freeradius`.
- Journaux utiles: `journalctl -u nginx`, `journalctl -u freeradius`, `cake4/rd_cake/logs/*`.
- Mise à jour applicative (code + patches SQL): `sudo ./deploy/scripts/update_radiusdesk_app.sh [--skip-radacct-cleanup]` (git pull, restauration du build `rd/build/production/Rd` depuis git ou backups, composer install, patches locaux, application des `8.*.sql`, purge des caches, fermeture automatique des sessions orphelines sauf si l’option est spécifiée).
- Nettoyage manuel des sessions RADIUS importées: `sudo ./deploy/scripts/cleanup_stale_radacct.sh` (appelé automatiquement par les scripts 40 / update, configurable via `STALE_SESSION_GRACE_SECONDS`).

## Sécurité
- Changer `RADIUS_SECRET_DEFAULT` rapidement.
- Restreindre `RADIUS_CLIENT_NET` au strict nécessaire.
- Activer HTTPS et redirections si exposé publiquement.

## Dépannage – profils `time_cap`
Deux correctifs manuels à connaître si des vouchers avec limite de temps sont rejetés malgré un quota disponible :

1. **`Rd-Client-Timezone` facultatif**  
   - Fichier : `cake4/rd_cake/setup/radius/freeradius/3.0/policy.d/radiusdesk`
   - Section : `RADIUSdesk_set_timezone` (vers les lignes 1 009‑1 020, juste après le commentaire `#Add-On May 2022` et avant `RADIUSdesk_logintime`).
   - Remplacement exact :  
     ```
     Rd-Client-Timezone := "%{sql:SELECT IFNULL((SELECT tz.name FROM dynamic_clients c LEFT JOIN timezones tz ON tz.id = c.timezone where c.nasidentifier='%{request:NAS-Identifier}'),'timezone_not_found')}"
     ```
     doit être remplacé par :
     ```
     Rd-Client-Timezone := "%{sql:SELECT COALESCE(
         (SELECT tz.name FROM dynamic_clients c LEFT JOIN timezones tz ON tz.id = c.timezone WHERE c.nasidentifier='%{request:NAS-Identifier}'),
         (SELECT tz.name FROM user_settings us LEFT JOIN timezones tz ON tz.id = us.value WHERE us.name='timezone' AND us.user_id=-1 LIMIT 1),
         'UTC')}"
     ```
     Même chose pour le bloc `else` (lignes 1 014‑1 020) : remplacer `IFNULL(...,'timezone_not_found')` par `COALESCE(...,'UTC')`. Ainsi, même si `dynamic_clients.timezone` est vide, le fuseau global (`user_settings`) ou `UTC` est appliqué.

2. **`%{sql:...}` obligatoire pour le compteur temps**  
   - Fichier : `cake4/rd_cake/setup/radius/freeradius/3.0/policy.d/radiusdesk`
   - Section : `RADIUSdesk_time_counter`, branche “reset type = never” (vers les lignes 630‑667, juste après le commentaire `#Asumes reset type = never` et avant `RADIUSdesk_voucher_check`).
   - Remplacement exact :  
     ```
     Rd-Used-Time := "{sql:SELECT IFNULL(SUM(TIMESTAMPDIFF(SECOND, created, timestamp)), 0) FROM user_stats WHERE callingstationid='%{request:User-Name}'}"
     ```
     doit être remplacé par :
     ```
     Rd-Used-Time := "%{sql:SELECT IFNULL(SUM(TIMESTAMPDIFF(SECOND, created, timestamp)), 0) FROM user_stats WHERE callingstationid='%{request:User-Name}'}"
     ```
     puis faire la même substitution (`"{sql:` → `"%{sql:`) pour les deux lignes suivantes qui calculent `Rd-Used-Time` avec `username='%{request:User-Name}' AND callingstationid='%{request:Calling-Station-Id}'` puis uniquement `username='%{request:User-Name}'`. Le `%` est indispensable pour que FreeRADIUS exécute l’`xlat` SQL ; sinon, lorsqu’un profil a `Rd-Reset-Type-Time = "never"`, la policy retourne `fail` et la requête est rejetée.

Après modification, regénérez `freeradius-radiusdesk.tar.gz` depuis `cake4/rd_cake/setup/radius/`, déployez-le sur `/etc/freeradius/3.0` (`sudo tar xzf … --directory /etc`) puis redémarrez le service (`sudo systemctl restart freeradius`). 

Atention, la regeneration entrainera une reinitalisation , on copie avant
```
sudo -s
cp /etc/freeradius/3.0/clients.conf /home/
```
Regenerer avec : 
```
cd /var/www/rdcore/cake4/rd_cake/setup/radius
tar czf freeradius-radiusdesk.tar.gz freeradius
```
ou 
```
sudo systemctl stop freeradius
sudo tar xzf /var/www/rdcore/cake4/rd_cake/setup/radius/freeradius-radiusdesk.tar.gz --directory /etc
sudo chown -R freerad:freerad /etc/freeradius/3.0
sudo systemctl start freeradius
```


Donc il faut restaurer le fichier avec sudo apres  regeneratio.
```
sudo -s
cp /home/clients.conf  /etc/freeradius/3.0/clients.conf 
``` 

Validez enfin avec :
```
radtest afraidhot afraidhot 127.0.0.1 0 testing123
```


---
Ce guide s’adresse à des déploiements reproductibles et sûrs. Les scripts
s’arrêtent en cas de configuration manquante critique et écrivent des logs
exhaustifs pour accélérer le diagnostic.
