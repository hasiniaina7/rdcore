## Omada Captive Portal Example

Bundle statique à importer dans Omada (`Portal Customization → Import Customized Page`) lorsque le contrôleur est configuré en **Authentication Type = RADIUS Server**. La page de login reste hébergée localement sur le contrôleur Omada et envoie les identifiants directement vers `/portal/radius/browserauth`. Après acceptation RADIUS, la page `success.html` effectue un compte à rebours de 15 s puis propose un lien/bouton vers l’Espace Info Conso public (`https://hotspot.techzone.lat/portal/success`) en pré-remplissant automatiquement les identifiants (pour éviter toute reconnexion).

### Structure

```
omada-captive-portail-exemple/
├── index.html                # page de login
├── success.html              # page Info Conso post-auth
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── portal-utils.js   # parsing Omada + i18n
│       ├── main.js           # formulaires utilisateur/voucher + POST vers Omada
│       └── success.js        # compte à rebours + redirection Info Conso
├── package.sh                # helper pour générer le ZIP
└── README.md
```

### Construction du ZIP

```bash
cd captive-portail/frontend/omada-captive-portail-exemple
./package.sh                             # crée ../omada-captive-portail-exemple.zip
# ou
zip -r ../omada-captive-portail-exemple.zip .
```

Importer ensuite `omada-captive-portail-exemple.zip` dans l’interface Omada (`Portal Customization → Local Web Portal → Import Customized Page`).

### Flux fonctionnel

1. **Paramètres Omada** : `portal-utils.js` lit `clientMac`, `ssidName`, `site`, `radioId`, `originUrl`, `link_login_only`, etc. fournis par Omada. Ces valeurs servent uniquement à construire l’URL de POST (Omada) ainsi que le lien Info Conso (`infoUrl=?` optionnel dans la query string).
2. **Modes Utilisateur/Voucher** : `main.js` présente deux onglets. Chaque changement d’onglet vide les champs correspondants afin d’éviter toute confusion. En mode “Voucher”, le code est réutilisé comme `username/password` pour Omada.
3. **Soumission** : le formulaire poste vers `link_login_only` (ou `/portal/radius/browserauth`). L’attribut `authType` vaut par défaut `2` (EXTERNAL_RADIUS) mais peut être forcé via `?authType=8` (RADIUS_ACCESS_TYPE) pour coller à la configuration hotspot. Pas de requête AJAX vers RadiusDesk → aucun problème de CORS.
4. **Page de succès** : après Accept, `main.js` redirige vers `success.html` en transmettant `username/password/clientMac`. `success.js` lance un compte à rebours de 15 s, puis affiche un bouton et un lien qui ouvrent `https://hotspot.techzone.lat/portal/success?fromOmada=1&username=...&password=...`. L’Espace Info Conso (React) détecte `fromOmada=1` et affiche directement l’usage sans demander de login.

### Configuration Omada / RadiusDesk requise

1. Activer **RADIUS Server** + **Accounting** vers FreeRADIUS/RadiusDesk (ports 1812/1813) et s’assurer que le NAS ID/site correspond au `dynamic_key` utilisé.
2. Importer le bundle en **Local Web Portal**, activer le portail HTTPS, et associer cette page à chaque SSID souhaité.
3. Configurer `infoUrl` (optionnel) si vous souhaitez surcharger la cible Info Conso. Par défaut le bundle ouvre `https://hotspot.techzone.lat/portal/success`.
4. Aucun appel HTTP(s) externe n’est effectué avant authentification : il suffit donc de placer `hotspot.techzone.lat` dans le **Walled Garden** si l’accès à l’Espace Info Conso doit être autorisé avant la levée captive.

### Tests locaux rapides

```bash
cd captive-portail/frontend/omada-captive-portail-exemple
npx serve . --listen 4173
# puis dans le navigateur :
# http://localhost:4173/index.html?clientMac=AA-BB-CC-DD-EE-FF&ssidName=TEST&site=HQ&link_login_only=https://omada.local:8843/portal/radius/browserauth
```

1. Soumettre des identifiants fictifs : la requête POST partira vers l’URL Omada fournie (réponse attendue en erreur en local).
2. Simuler la page de succès en ouvrant `http://localhost:4173/success.html?username=test&password=test&clientMac=AA-BB`. Après 15 s, cliquer sur “Ouvrir l’info conso” pour vérifier l’URL générée.

### Fichiers clés

- `assets/js/main.js` : parsing des paramètres Omada, gestion des onglets Utilisateur/Voucher, POST vers `/portal/radius/browserauth`, redirection vers `success.html`.
- `assets/js/success.js` : compte à rebours (15 s) + construction du lien sécurisé `https://hotspot.techzone.lat/portal/success?fromOmada=1&username=...`.
- `assets/js/portal-utils.js` : dictionnaire FR/EN, helpers pour récupérer les paramètres Omada / `infoUrl`.
- `assets/css/style.css` : thème Bootstrap5-like compatible captive portal (clair + sombre).
