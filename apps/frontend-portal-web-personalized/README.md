# Portal Frontend

Interface React/Vite qui affiche le portail captif Radiusdesk et consomme l'API du backend.

## Prérequis

- Node.js 20+ et npm
- Accès au backend (URL/API et variables d'environnement partagées)

## Installation

```bash
cd /home/mastershark-linux/dev/radiusdesk/captive-portail/frontend
npm install
```

## Configuration de l'environnement (.env)

Ce frontend lit ses variables dans `apps/frontend-portal-web-personalized/.env`. Créez-le à partir de l'exemple :

```bash
cp .env.frontend.example .env
```

Remplacez ensuite les valeurs par celles de votre environnement :

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
npm run build                  # génère apps/frontend-portal-web-personalized/dist
npm run preview                # sert le build en local
```

## Déploiement (statique + PM2)

1. S'assurer que `.env` contient les bonnes URLs du backend.
2. Construire le bundle : `npm run build`.
3. Servir les fichiers statiques générés dans `apps/frontend-portal-web-personalized/dist` (Nginx, CDN, etc.). Pour un test rapide :

   ```bash
   npx serve -s dist -l 3000
   ```

4. Pour garder ce serveur en ligne avec PM2 :

   ```bash
   pm2 start \"npx serve -s dist -l 3000\" --name portal-frontend
   pm2 logs portal-frontend
   ```

Adaptez le port et la commande de service selon votre stack (reverse proxy, Docker, etc.). Pensez aussi à `pm2 save` pour la relance automatique.
