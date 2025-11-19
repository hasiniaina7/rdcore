# Fichiers d'environnement à protéger

Cette liste recense les fichiers `.env` qui contiennent des secrets opérationnels et qui ne doivent **jamais** être suivis par Git. Conservez-les uniquement en local ou dans un gestionnaire de secrets et utilisez les variantes `*.example` pour documenter la structure.

| Chemin | Description | Conseils |
| --- | --- | --- |
| `.env` | Paramètres racine partagés (raccourcis scripts, proxies locaux). | Ignorer avec `.gitignore` et stocker les valeurs dans un coffre-fort d'équipe. |
| `backend/.env` | Secrets backend (tokens RadiusDesk, accès Omada, identifiants admin statiques). | Ne jamais pousser sur Git; synchroniser via gestionnaire sécurisé. |
| `frontend/.env` | Variables spécifiques au frontend (URL API, clés SSO publiques). | Utiliser uniquement pour le build local; pour la CI/CD passer par des variables chiffrées. |
| `.env.frontend.local` | Overrides Vite pour les démos ou tests. | Garder local, nettoyer avant partage. |

## Bonnes pratiques
- Utiliser les fichiers `*.example` pour documenter les clés attendues sans y mettre de secrets.
- Ajouter tout nouveau fichier `.env*` au `.gitignore` par défaut.
- Chiffrer les archives contenant des `.env` avant de les partager.
- Régénérer régulièrement les identifiants stockés dans ces fichiers.

## Sessions d'usage (frontend sécurisé)

Le backend stocke désormais les identifiants usage côté serveur et émet un jeton temporaire pour les appels `/api/usage`. Deux variables contrôlent ce comportement dans `.env.example` :

- `USAGE_SESSION_TTL_MINUTES` : durée de vie (minutes) d’un jeton usage (par défaut 30 min).
- `USAGE_SESSION_CACHE_SIZE` : capacité maximale du cache LRU côté serveur.

Ajustez ces valeurs selon vos contraintes de charge (ex: hotspots très fréquentés) et redémarrez PM2 pour appliquer les modifications.
