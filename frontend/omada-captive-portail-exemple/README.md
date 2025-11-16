## Omada Captive Portal Example

Bundle statique à importer dans Omada (`Portal Customization → Import Customized Page`) lorsque le contrôleur est configuré en **Authentication Type = RADIUS Server**. Cette version reproduit une “Dynamic Login Page” Mikrotik : la page de login soumet les identifiants à Omada, et la page `success.html` (déploiement local) vient afficher l’usage RadiusDesk.

### Structure

```
omada-captive-portail-exemple/
├── index.html                # page de login
├── success.html              # page Info Conso post-auth
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── portal-utils.js   # parsing Omada + i18n + helpers
│       ├── main.js           # logique de login
│       └── success.js        # affichage usage radacct
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

1. **Paramètres Omada** : `portal-utils.js` lit `clientMac`, `ssidName`, `site`, `radioId`, `originUrl`, `link_login_only`, etc. fournis par Omada. Ces valeurs sont stockées dans `omadaContext` et rediffusées vers RadiusDesk ainsi que vers la page `success.html`.
2. **Dynamic Login RadiusDesk** : `main.js` et `success.js` sollicitent `https://rd.techzone.lat/cake4/rd_cake/dynamic-details/info-for.json?dynamic_key=omada&…` pour récupérer logo, textes, choix voucher/user et liens support. Les réponses déterminent la langue (FR/EN), les placeholders et la bannière de consentement.
3. **Soumission des credentials** : le formulaire poste vers `link_login_only` ou `/portal/radius/browserauth`. Aucun appel `radclient` n’est effectué côté navigateur. Omada contacte FreeRADIUS (via RadiusDesk) pour décider Accept/Reject.
4. **Page de succès / usage** : après Accept, `main.js` redirige vers `success.html` en conservant `username`, `clientMac`, `dynamic_key`, etc. `success.js` appelle ensuite `radaccts/get-usage.json` pour afficher temps/data consommés et un bouton “Continuer vers Internet” qui suit l’`originUrl` Omada.

### Configuration Omada / RadiusDesk requise

1. Activer **RADIUS Server** + **Accounting** vers FreeRADIUS/RadiusDesk (ports 1812/1813) et s’assurer que le NAS ID/site correspond au `dynamic_key` utilisé.
2. Importer le bundle en **Local Web Portal**, activer le portail HTTPS, et associer cette page à chaque SSID souhaité.
3. Autoriser le domaine du contrôleur Omada dans les règles CORS côté RadiusDesk (`Access-Control-Allow-Origin`) afin que `info-for.json` / `radaccts/*.json` soient accessibles depuis le navigateur du client.
4. Ajouter `rd.techzone.lat` (et le CDN éventuel des logos) dans le **Walled Garden** / pré-auth ACL afin que la page puisse charger CSS, JS et JSON avant l’authentification.

### Tests locaux rapides

```bash
cd captive-portail/frontend/omada-captive-portail-exemple
npx serve . --listen 4173
# puis dans le navigateur :
# http://localhost:4173/index.html?clientMac=AA-BB-CC-DD-EE-FF&ssidName=TEST&site=HQ&link_login_only=https://omada.local:8843/portal/radius/browserauth
```

1. Observer dans la console la récupération de `info-for.json`.
2. Soumettre des identifiants fictifs : la requête POST partira vers l’URL Omada fournie (réponse attendue en erreur en local).
3. Simuler la page de succès en ouvrant `http://localhost:4173/success.html?username=test&clientMac=AA-BB&dynamic_key=omada`.

### Fichiers clés

- `assets/js/main.js` : parsing des paramètres Omada, i18n, soumission vers `/portal/radius/browserauth`, redirection vers `success.html`.
- `assets/js/success.js` : affichage “Info Conso” + bouton de poursuite vers `originUrl`.
- `assets/js/portal-utils.js` : dictionnaire FR/EN, helpers pour `dynamic_key`, formatage temps/data.
- `assets/css/style.css` : thème Bootstrap5-like compatible captive portal (clair + sombre).
