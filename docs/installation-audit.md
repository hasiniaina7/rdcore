# G1.1 — Audit des scripts d’installation RadiusDesk

Ce mémo résume l’orchestration du dépôt `migration/` (alias `installation-script`) conformément au prompt G1.1.

## Structure générale

| Élément | Rôle |
| --- | --- |
| `deploy/config/env.sh` | Variables d’environnement (FQDN, DB, secrets RADIUS, TTL TLS, etc.). Toutes les commandes peuvent être overrides via variables shell. |
| `deploy/lib/common.sh` | Utilitaires communs: logging (`/var/log/radiusdesk-install/*.log`), vérification root, idempotence via marqueurs `.done` dans `/var/local/radiusdesk-install`. |
| `deploy/scripts/10..70_*.sh` | Phases numérotées (OS → TLS). Chaque script charge `env.sh` et `common.sh`, écrit son propre log, puis `mark_done`. |
| `deploy/run-all.sh` | Enchaîne 10 → 70 en une seule commande (root obligatoire). |
| `deploy/run-phase.sh` | Relance uniquement la phase demandée (ex: `./deploy/run-phase.sh 40`). |
| `deploy/clean-state.sh` | Purge fine des marqueurs `.done` ou des patchs SQL. |
| `deploy/scripts/update_radiusdesk_app.sh` | Mise à jour applicative (git pull + composer + patchs SQL + backups rd/build). |
| `deploy/scripts/cleanup_stale_radacct.sh` | Ferme les sessions `radacct` orphelines (grâce configurable). |

## Prérequis, logs et rerun

- **Prérequis système**: Ubuntu 20.04/22.04/24.04, accès root/sudo, DNS/ports ouverts, accès réseau sortant.
- **Journalisation**: chaque phase écrit dans `/var/log/radiusdesk-install/<phase>.log` via `CURRENT_LOG`.
- **Marqueurs d’état**: `/var/local/radiusdesk-install/<phase>.done` (et `sql_patches/` pour les patchs). Suppression ciblée = rerun forcé.
- **Rerun d’une phase**:
  ```bash
  sudo rm /var/local/radiusdesk-install/40_radiusdesk_app.done
  sudo ./deploy/run-phase.sh 40
  ```
- **Rerun sélectif/total**: `./deploy/clean-state.sh --phase 30 -y`, `./deploy/clean-state.sh --all -y`, `./deploy/clean-state.sh --patches`.
- **Commandes utiles**:
  - Full install: `sudo ./deploy/run-all.sh`
  - Phase n: `sudo ./deploy/run-phase.sh <n>`
  - Nettoyage radacct manuel: `sudo ./deploy/scripts/cleanup_stale_radacct.sh`
  - Update code: `sudo ./deploy/scripts/update_radiusdesk_app.sh [--skip-radacct-cleanup]`

## Détail des phases

### 10 — Base OS (`deploy/scripts/10_base_os.sh`)
- Vérifie root, configure `TIMEZONE` + `SERVER_HOSTNAME`.
- `apt-get update && apt-get upgrade`, installe outils (curl, git, jq, etc.).
- Marqueur: `10_base_os.done`.

### 20 — Web/PHP (`deploy/scripts/20_web_php.sh`)
- Installe Nginx, PHP-FPM, modules PHP (gd/curl/xml/mbstring/etc.) + Composer.
- Active services `nginx` + `php<ver>-fpm`, crée `server` block `/etc/nginx/sites-available/radiusdesk.conf`.
- Ajoute règles de réécriture CakePHP, `client_max_body_size`, protège `config/tmp/logs`.
- Désactive `sites-enabled/default`, active `radiusdesk.conf`, reload Nginx.

### 30 — MariaDB (`deploy/scripts/30_mariadb.sh`)
- Installe `mariadb-server/client` + `php-mysql`.
- Ajoute `disable_strict_mode.cnf` et `enable_event_scheduler.cnf`, restart MariaDB.
- Importe les timezones MySQL, crée DB `rd`, utilisateurs (`rd`, `freeradius`) et privilèges.

### 40 — Application RadiusDesk (`deploy/scripts/40_radiusdesk_app.sh`)
- Installe dépendances (php-imagick, php-redis, redis-server).
- Clone/maj `/var/www/rdcore` (branche `cake4`) et `/var/www/rd_mobile`.
- Chown `www-data`, exécute `composer install` en sudo -u www-data.
- **Liens /var/www/html**: crée/actualise `rd` (ExtJS UI), `cake4` (API), `login` (Dynamic Login), `rd_mobile`, `conf_dev`, `reporting`.
- **`app_local.php`**: regénère `/var/www/rdcore/cake4/rd_cake/config/app_local.php` en réutilisant un `Security.salt` stocké dans `/var/local/radiusdesk-install/cakephp_salt`.
- Prépare dossiers `logs`, `tmp/cache`, `tmp/sessions`, `webroot/files/imagecache`, `webroot/img/{realms,...}` et applique `www-data`.
- **Base SQL**: `ensure_rd_database_schema()` crée DB si besoin, importe `rd.sql`, applique tous les `8.*.sql`, vérifie `passpoint_uplinks`.
- Lance `cleanup_stale_radacct.sh` si dispo, copie `cron4` vers `/etc/cron.d/cron4_radiusdesk`.
- Reload PHP-FPM (`php<ver>-fpm`) et marque `40_radiusdesk_app.done`.

### 50 — FreeRADIUS (`deploy/scripts/50_freeradius.sh`)
- Installe `freeradius`, modules SQL, dépendances Perl, `eapoltest`.
- Remplace `/etc/freeradius` par l’archive officielle `freeradius-radiusdesk.tar.gz`.
- Ajuste permissions (`freerad:www-data`), configure `mods-available/sql` (serveur DB, login, mot de passe, DB, port optionnel).
- Active `dynamic-clients` (`FreeRADIUS-Client-Secret = RADIUS_SECRET_DEFAULT`, `ipaddr = RADIUS_CLIENT_NET`), neutralise `filter_username` dans `default`/`inner-tunnel`, force `require_message_authenticator`.
- `freeradius -C` de validation puis restart, marqueur `50_freeradius.done`.

### 70 — TLS / Certbot (`deploy/scripts/70_tls_certbot.sh`)
- Installe `snapd`, `certbot`.
- Si `AUTO_LE=1`: lance `certbot --nginx -d $SERVER_FQDN -m $LE_EMAIL --redirect --non-interactive`.
- Sinon, loggue les commandes exemples HTTP-01/DNS-01.
- `70_tls_certbot.done`.

## Liens et fichiers générés clés

- `/var/www/html/{rd,cake4,login,rd_mobile,conf_dev,reporting}` créés dans la phase 40.
- `/var/www/rdcore/cake4/rd_cake/config/app_local.php` généré/re-généré en 40 avec `Security.salt`, paramètres DB (`DB_HOST/PORT/NAME/USER/PASS`) et `EmailTransport`.
- `cron4_radiusdesk` déployé pour les tâches périodiques RADIUSdesk.

## Scripts utilitaires

| Script | Description / Usage |
| --- | --- |
| `deploy/clean-state.sh` | Lister/purger les marqueurs `.done` (ex: `./deploy/clean-state.sh --phase 40 -y`). Peut cibler `--patches` (marqueurs SQL). |
| `deploy/scripts/update_radiusdesk_app.sh` | Sécurise une mise à jour: backup `rd/build`, git pull (rdcore + rd_mobile), composer install, re-application des patchs locaux et `8.*.sql` (marques `STATE_DIR/sql_patches`), purge cache Cake, relance cleanup radacct (débrayable). |
| `deploy/scripts/cleanup_stale_radacct.sh` | Ferme les sessions radacct sans `acctstoptime` après un délai (`STALE_SESSION_GRACE_SECONDS`, 900s par défaut). Ajoute automatiquement les colonnes IPv6 manquantes dans `radacct_history`. |

## Risques & recommandations

- **Root obligatoire**: tous les scripts vérifient `id -u`, l’exécution partielle échoue sinon.
- **Git upstream**: `40` force un `reset --hard origin/cake4` → toute personnalisation locale doit passer par `templates/patches/*.patch`.
- **Secrets**: `env.sh` contient des valeurs par défaut (rd/rd) – à override via variables d’environnement ou en éditant avant install.
- **Certbot**: en mode `AUTO_LE=1`, nécessite que `SERVER_FQDN` pointe déjà vers l’instance et que le port 80 soit ouvert.
- **Rejeu d’une phase**: supprimer le `.done` associé et relancer via `run-phase.sh` pour préserver l’idempotence; vérifier les markers SQL si vous devez rejouer seulement les patchs (`STATE_DIR/sql_patches`).
- **Surveillance post-install**: lire `journalctl -u nginx`, `journalctl -u freeradius`, `mysql -u rd -p${DB_PASS} rd -e 'SHOW TABLES;'`, et `curl http://SERVER_FQDN/rd/` pour confirmer.

Ces éléments couvrent les exigences du prompt G1.1 (structure, prérequis/logs/markers, détail phases 10→70, création des liens `/var/www/html` et `app_local.php`, scripts utilitaires et rerun). 
