# Portal Backend

Petit service Express/TypeScript qui sert les API du portail captif Radiusdesk.

## Prérequis

- Node.js 20+ et npm
- PM2 (`npm i -g pm2`) pour l'exécution en production
- Accès au dossier `captive-portail/.env` (copié depuis `.env.example`)

## Installation locale

```bash
cd captive-portail/backend
npm install
```

## Développement

```bash
cp ../.env.example ../.env      # à personnaliser selon l'environnement
npm run dev                     # recharge automatique via ts-node-dev
```

## Tests et lint

```bash
npm run lint
npm test
```

## Build

```bash
npm run build                   # génère dist/index.js
```

## Déploiement (PM2)

1. Copier/adapter les fichiers d'environnement : `cp ../.env.example ../.env`.
2. Construire l'application : `npm run build`.
3. Lancer avec PM2 depuis ce dossier :

   ```bash
   pm2 start deployments/pm2/ecosystem.config.js
   ```

4. Vérifier les logs : `pm2 logs portal-backend`.
5. Pour arrêter/supprimer le service : `pm2 delete portal-backend`.

Pensez à configurer `pm2 startup` et `pm2 save` si vous souhaitez relancer automatiquement le service au redémarrage de la machine.
