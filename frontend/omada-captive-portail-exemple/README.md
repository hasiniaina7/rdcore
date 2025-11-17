## Omada Captive Portal (Static Bundle)

Bundle statique directement dérivé de `frontend/demo-omada-captive-portal` (version TP-Link). Il conserve toute la logique d’authentification originale (`/portal/getPortalPageSetting` → `/portal/radius/auth`) et n’intercepte plus les réponses RadiusDesk. Seules les améliorations suivantes ont été ajoutées :

- **Mode clair/sombre** via le bouton `#themeToggle`.
- **Radius Voucher** pour `EXTERNAL_RADIUS` (2) et `RADIUS_ACCESS_TYPE` (8) : un sélecteur “Utilisateur / Voucher” vient se superposer aux champs username/password. En mode Voucher, le mot de passe est automatiquement égal à l’identifiant et transmis au contrôleur.
- **Habillage léger** (formulaire recentré et styles modernisés) tout en conservant l’architecture JS d’origine (jQuery + fichier `index.js`).

### Structure

```
omada-captive-portail-exemple/
├── index.html
├── assets/
│   ├── css/style.css
│   ├── img/portalLogo_picture@2x.png …
│   └── js/
│       ├── jquery.min.js
│       └── main.js (copie adaptée de demo-omada)
└── package.sh
```

### Packager

```bash
cd captive-portail/frontend/omada-captive-portail-exemple
./package.sh
```

Importer ensuite `../omada-captive-portail-exemple.zip` dans **Portal Customization → Local Web Portal → Import**.
