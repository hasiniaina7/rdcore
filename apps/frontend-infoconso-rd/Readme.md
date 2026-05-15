# Portal Frontend

Interface React/Vite qui affiche le portail captif Radiusdesk et consomme l'API du backend.

## Prérequis

- Node.js 20+ et npm
- Accès au backend (URL/API et variables d'environnement partagées)

## Installation

```bash
cd /home/mastershark-linux/dev/radiusdesk/captive-portail/infoconso
npm install
```

## Configuration de l'environnement (.env)

Ce frontend lit ses variables dans un fichier `.env` à la racine du projet (`captive-portail/apps/frontend-infoconso-rd/.env`).

Créez ce fichier puis adaptez les valeurs à votre environnement, par exemple :

```bash
VITE_API_BASE_URL=https://portal.example.com/api
VITE_API_TIMEOUT_MS=15000
VITE_DEFAULT_LANGUAGE=fr
VITE_DEFAULT_DYNAMIC_KEY=default
VITE_APP_BASENAME=/
```

Description des variables disponibles :

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | URL publique de l'API backend (ex : `https://portal.example.com/api`). |
| `VITE_API_TIMEOUT_MS` | Timeout (ms) des requêtes HTTP vers l'API (15000 = 15 s par défaut). |
| `VITE_DEFAULT_LANGUAGE` | Langue affichée par défaut (`fr`, `en`, ...). Doit correspondre aux traductions disponibles. |
| `VITE_DEFAULT_DYNAMIC_KEY` | Clé de campagne/portail utilisée lorsqu'aucune donnée dynamique n'est fournie par Omada. |
| `VITE_APP_BASENAME` | Chemin de base si l'app est servie sous un sous-dossier (laisser `/` pour la racine). |

Le fichier `.env` n'est pas versionné : gardez vos secrets hors du dépôt.

## Développement

```bash
npm run dev                    # serveur Vite (http://localhost:5173 par défaut)
```

## Tests et qualité

```bash
npm run lint
npm test
npm run test:e2e               # Playwright
```

## Build et prévisualisation

```bash
npm run build                  # génère dist
npm run preview                # sert le build en local
```

## Déploiement en production

L'application Infoconso est un frontend statique construit avec Vite. En production, le flux recommandé est le suivant :

1. Préparer l'environnement sur le serveur
   - Installer Node.js 20+ et `npm`.
   - Cloner ce dépôt ou récupérer l'artefact généré par votre CI/CD.
   - Créer et remplir `.env` avec les bonnes valeurs (voir section précédente), en particulier `VITE_API_BASE_URL` qui doit pointer vers l'API backend exposée en HTTPS.

2. Construire le bundle frontend

   ```bash
   cd /home/mastershark-linux/dev/radiusdesk/captive-portail/infoconso
   npm install
   npm run build
   ```

   Le build génère les fichiers statiques dans `dist/`.

3. Servir les fichiers statiques derrière un reverse proxy (recommandé)
   - Copier le contenu de `dist/` vers un dossier servi par votre serveur web (ex : `/var/www/infoconso`).
   - Exemple minimal de configuration Nginx :

     ```nginx
     server {
       listen 80;
       server_name infoconso.example.com;

       root /var/www/infoconso;
       index index.html;

       location / {
         try_files $uri /index.html;
       }
     }
     ```

   - Ajouter ensuite la terminaison HTTPS (Let’s Encrypt / Certbot, ou équivalent).
   - Si l'application est servie sous un sous-dossier (ex : `/infoconso`), ajuster `VITE_APP_BASENAME` en conséquence, rebuilder puis redéployer `dist/`.

4. Alternative : servir directement via Node + PM2

   Pour un déploiement rapide ou sans Nginx, vous pouvez servir le contenu de `dist/` avec `serve` et superviser le process avec PM2 :

   ```bash
   cd /home/mastershark-linux/dev/radiusdesk/captive-portail/infoconso
   npx serve -s dist -l 3000
   ```

   En production, utilisez PM2 pour garder ce serveur en ligne et le relancer automatiquement au redémarrage de la machine :

   ```bash
   pm2 start "npx serve -s dist -l 3000" --name infoconso-frontend
   pm2 save
   pm2 startup   # exécuter la commande affichée en root
   pm2 logs infoconso-frontend
   ```

   Vous pouvez ensuite placer un reverse proxy (Nginx, Traefik, etc.) devant `http://127.0.0.1:3000` pour exposer l'application sur votre domaine.
