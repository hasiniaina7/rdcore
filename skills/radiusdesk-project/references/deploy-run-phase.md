# Deployment via installation-script (`run phase`)

Use this workflow for production deployment.

## Paths

Local workspace:
- `/home/mastershark-linux/dev/radiusdesk/installation-script`

Remote server (observed):
- installer repo: `/home/ubuntu/installation-script-repo`
- phase runner: `/home/ubuntu/installation-script-repo/deploy/run-phase.sh`
- app target: `/var/www/rdcore`

## Persistent custom fixes (important)

`run-phase.sh 40` does `git reset --hard origin/cake4` on `/var/www/rdcore`.
To keep project-specific fixes permanent, store patch files in:

- `/home/ubuntu/installation-script-repo/deploy/templates/patches/*.patch`

The phase script auto-applies them after sync.

For current production, keep at least:
- `2026-05-21-rdcore-consistency-fixes.patch`
- `2026-05-21-php85-chronos-compat.patch`

## App redeploy flow (phase 40)

```bash
cd /home/ubuntu/installation-script-repo
sudo ./deploy/clean-state.sh --phase 40 -y
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

## Travail différé : réconcilier le clone d'installation production avec Git

**Statut : différé volontairement le 2026-08-13.** Ne pas exécuter un `git reset --hard`, un `git clean`, ou un `git pull` dans le clone production avant cette réconciliation.

Le clone `/home/ubuntu/installation-script-repo` contient des anciens patchs locaux et fichiers de sauvegarde non suivis. La revue contrôlée a établi que les correctifs métier correspondants sont déjà présents, ou remplacés par une version plus récente, dans `origin/cake4`. Les anciens patchs Omada ne doivent pas être réimportés sans réécriture : ils incluent un secret CoA codé en dur.

### Procédure à effectuer dans une fenêtre de maintenance

1. Exporter une archive horodatée, hors du dépôt, des fichiers non suivis et des diffs locaux du clone production.
2. Vérifier à nouveau les hashes et les fonctionnalités attendues contre `origin/cake4`; ne rapatrier que les écarts métier démontrés, dans des commits séparés et relus.
3. Déplacer le secret CoA hors du code applicatif vers une configuration protégée, puis vérifier le flux de déconnexion Omada.
4. Après validation, aligner le clone de production sur la branche `origin/installation-script` approuvée.
5. Rejouer uniquement la phase 40, puis vérifier syntaxe PHP, migrations SQL, API, cron et déconnexion Omada avec un échantillon contrôlé.

Les fichiers `.orig` et `.bak_*` sont des sauvegardes opérationnelles : ils ne doivent jamais être committés. Cette tâche est indépendante des déploiements phase 50/FreeRADIUS.
