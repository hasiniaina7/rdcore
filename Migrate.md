# Migration RadiusDesk

Ce guide récapitule les procédures de migration disponibles dans ce dépôt. Tous les scripts doivent être exécutés en `root` sur le serveur source. Les exemples supposent que vous vous trouvez à la racine du dépôt (`/home/.../radiusdesk_local`).

## 1. Migration complète RadiusDesk

Le script `deploy/scripts/migrate_radiusdesk.sh` réalise une migration « applicative » complète :

* dump base MySQL/MariaDB
* mise à jour des dépôts git (`rdcore`, `rd_mobile`)
* `composer install`
* application des patchs SQL `8.*.sql`
* nettoyage du cache CakePHP
* build Sencha (si `sencha` est disponible)
* remise des permissions et reload des services

### Exécution

```bash
sudo chmod +x ./deploy/scripts/migrate_radiusdesk.sh
sudo ./deploy/scripts/migrate_radiusdesk.sh
```

Variables optionnelles (à exporter avant l’exécution) :

| Variable | Rôle | Valeur par défaut |
|----------|------|-------------------|
| `MIGRATION_BACKUP_DIR` | Dossier des dumps SQL | `/var/backups/radiusdesk` |
| `SENCHA_BIN` | Chemin vers l’exécutable `sencha` | `which sencha` |

Le journal détaillé est écrit dans `/var/log/radiusdesk-install/migration_radiusdesk.log`.

## 2. Migration FreeRADIUS + MariaDB uniquement

Le script `deploy/scripts/migrate_freeradius_mariadb.sh` génère un bundle d’export contenant :

* `mariadb_dump.sql.gz` – dump complet de la base RadiusDesk
* `radacct_snapshot.csv` – export CSV des sessions (optionnel)
* `freeradius/` – configuration FreeRADIUS (`/etc`, `/var/lib`, `/var/log`)
* `radiusdesk_env.sh` – configuration RadiusDesk pour référence
* `README.txt` – rappel des étapes de restauration

### Exécution

```bash
sudo chmod +x ./deploy/scripts/migrate_freeradius_mariadb.sh
sudo ./deploy/scripts/migrate_freeradius_mariadb.sh
```

Exemple de fin d’exécution :

```
[INFO] Migration générée : /var/backups/radiusdesk-migration/radiusdesk_freeradius_mariadb_20251104-080419.tar.gz
[INFO] Dossier de travail contenant les fichiers : /var/backups/radiusdesk-migration/20251104-080419
```

À la fin, le script affiche deux chemins utiles :

- le tarball d’export : `/var/backups/radiusdesk-migration/radiusdesk_freeradius_mariadb_<horodatage>.tar.gz`
- le dossier de travail (fichiers décompressés) : `/var/backups/radiusdesk-migration/<horodatage>`

Pour consulter immédiatement les fichiers :

```bash
cd /var/backups/radiusdesk-migration/<horodatage>
ls -la
```

Variables optionnelles :

| Variable | Rôle | Valeur par défaut |
|----------|------|-------------------|
| `MIGRATION_STAGING_DIR` | Répertoire de travail/dépôt | `/var/backups/radiusdesk-migration` |
| `MIGRATION_TARGET_HOST` | Hôte distant à recevoir le tarball | (vide) |
| `MIGRATION_TARGET_USER` | Utilisateur distant pour le transfert | `root` |
| `MIGRATION_TARGET_PATH` | Destination distante (rsync) | `/root` |

Le script produit `radiusdesk_freeradius_mariadb_<horodatage>.tar.gz` dans `MIGRATION_STAGING_DIR` et, si `MIGRATION_TARGET_HOST` est défini, l’envoie via `rsync`.

Note permissions MariaDB : si l’utilisateur applicatif (`rd`) n’a pas les privilèges nécessaires pour lire toutes les tables, le script tente automatiquement un dump via `root` en socket Unix (scénario courant avec `unix_socket`). Aucune interaction n’est requise sur le serveur source.

## 3. Restauration sur un nouveau serveur

1. Copier l’archive de migration sur le nouveau serveur.
2. Installer les dépendances système nécessaires (MariaDB, FreeRADIUS, etc.).
3. Extraire l’archive :
   ```bash
   tar -xzf radiusdesk_freeradius_mariadb_<horodatage>.tar.gz
   cd <horodatage>
   ```
4. Importer la base de données :
   ```bash
   gunzip mariadb_dump.sql.gz
   mysql -u <user> -p <base> < mariadb_dump.sql
   ```
5. Restaurer la configuration FreeRADIUS (adapter les chemins si nécessaire) :
   ```bash
   rsync -a freeradius/etc_freeradius/ /etc/freeradius/
   rsync -a freeradius/var_lib_freeradius/ /var/lib/freeradius/
   rsync -a freeradius/var_log_freeradius/ /var/log/freeradius/
   chown -R freerad:freerad /etc/freeradius /var/lib/freeradius /var/log/freeradius
   ```
6. Reconfigurer `deploy/config/env.sh` si des paramètres changent (hôtes, mots de passe, secrets).
7. Relancer les services :
   ```bash
   systemctl restart mariadb
   systemctl restart freeradius
   systemctl reload nginx
   systemctl reload php*-fpm
   ```
8. Effectuer les vérifications fonctionnelles (authentification RADIUS, interface web `https://<host>/rd/`).

---

> Tous les chemins et exemples sont donnés à titre indicatif ; adaptez-les à votre environnement. Pensez à chiffrer ou à transférer de façon sécurisée les archives générées (contiennent bases et secrets).
