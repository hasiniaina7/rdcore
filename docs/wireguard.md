# Plan d’intégration WireGuard via RADIUSdesk (OTHERS > Wireguard Servers)

## Objectifs
- Offrir un tunnel WireGuard géré depuis le GUI (« OTHERS → WIREGUARD SERVERS ») pour transporter le trafic des NAS / concentrateurs vers FreeRADIUS.
- Préparer un socle système reproductible (script `deploy/scripts/install_wireguard.sh`) utilisable plus tard dans une phase `80_wireguard.sh`.
- Documenter l’enchaînement complet : installation OS, création du serveur, ajout des peers et enregistrement côté FreeRADIUS (`clients.conf`).

## Architecture cible
1. **Serveur WireGuard** sur la même VM que RADIUSdesk (ou dédié) avec l’interface `wg-radiusdesk0`.
2. **Peering** : chaque NAS/branche devient un peer WireGuard. Le module GUI stocke les clés, IPs, keepalive.
3. **Chaînage FreeRADIUS** : chaque peer correspond à un client déclaré dans `/etc/freeradius/3.0/clients.d/wireguard.conf` (ou `clients.conf`). L’adresse du peer est l’IP interne WireGuard.
4. **Politique réseau** : NAT ou routage selon besoin ; l’interface WG redistribue vers `rdcore/cake4` via LAN.

## Étapes d’installation recommandées
1. **Prérequis OS**
   - Ubuntu 24.04 LTS (support kernel >= 6.x).
   - Ports UDP autorisés (par défaut `51820`).
   - Accès root.
2. **Script d’installation**
   - Exécuter `sudo ./deploy/scripts/install_wireguard.sh`.
   - Le script :
     1. Installe `wireguard`, `wireguard-tools`, `qrencode`.
     2. Active le module kernel + le forwarding (`/etc/sysctl.d/90-wireguard.conf`) et initialises UFW (mais sans ouvrir d’autres ports). Le trafic routé reste bloqué par défaut ; seules les règles générées pour les interfaces “NAT Enabled” sont autorisées.
     3. Déploie l’agent `/usr/local/sbin/radiusdesk-wireguard-agent` + un timer systemd.
     4. Génère `/etc/radiusdesk/wireguard-agent.env` (à adapter : MAC déclarée dans le GUI, URL publique, etc.).
   - Les interfaces et clés sont désormais fournies par le GUI ; l’agent applique le rendu (`wg-quick`) côté OS.
3. **Intégration RADIUSdesk**
   - Dans le GUI (OTHERS → Wireguard Servers) :
     1. Ajouter un “Wireguard Server” pointant vers l’hôte et l’interface générée.
     2. Renseigner clé publique (`<interface>.pub`), port, sous-réseau local.
     3. Associer le serveur au Cloud concerné.
   - Créer ensuite des “Wireguard Instances” / “Peers” :
     - Affecter une IP du sous-réseau WG.
     - Coller la clé publique du peer, MTU, keepalive, etc.
4. **Déclaration FreeRADIUS**
   - Ajouter le peer comme client dans `/etc/freeradius/3.0/clients.d/wireguard.conf` :
     ```conf
     client wg-peer-<name> {
         ipaddr = 10.255.254.10        # IP WireGuard du peer
         secret = sharedsecret
         shortname = <cloud>-wg
     }
     ```
   - Redémarrer FreeRADIUS.
5. **Ouverture firewall/NAT**
   - Exemple iptables (déjà injecté via `PostUp`/`PostDown` dans le script) ou règles nftables selon vos politiques.
6. **Vérifications**
   - `wg show` ➜ interface + `latest handshake`.
   - `curl -k https://<fqdn>/rd/#cloud/<id>/OTHER` ➜ bloc “WIREGUARD SERVERS” accessible.
   - Auth RADIUS via le peer.

## Script réutilisable
- `deploy/scripts/install_wireguard.sh` : installe les paquets, active le forwarding, déploie l’agent (`/usr/local/sbin/radiusdesk-wireguard-agent`) et un timer systemd (`radiusdesk-wireguard-agent.timer`).
- L’agent réécrit les hooks `PostUp/PostDown` pour limiter les règles `iptables/ip6tables` aux sous-réseaux déclarés et supprime les NAT « globaux », ce qui garantit que seules les interfaces marquées “NAT Enabled” obtiennent Internet.
- Le fichier `/etc/radiusdesk/wireguard-agent.env` contient les variables à ajuster :
  | Variable | Rôle | Défaut |
  |----------|------|--------|
  | `WG_AGENT_BASE_URL` | URL du backend CakePHP | `https://127.0.0.1/cake4/rd_cake` |
  | `WG_AGENT_INTERFACE` | Interface utilisée pour auto-détecter la MAC | dev route par défaut |
  | `WG_AGENT_MAC` | MAC déclarée dans *Wireguard Servers* | auto (colons → tirets) |
  | `WG_AGENT_SKIP_TLS_VERIFY` | `1` pour ignorer la vérification TLS | `1` |

L’agent appelle périodiquement `wireguard-servers/get-config-for-server.json` (avec la MAC), génère les fichiers `/etc/wireguard/<Name>.conf`, lève les interfaces via `wg-quick` puis remonte les statistiques avec `submit-report.json`. Pour un futur `80_wireguard.sh`, il suffira d’exécuter ce script puis d’approvisionner l’UI (via API ou migration).

## Points de vigilance
- **Clés privées** : stockées dans `/var/lib/radiusdesk/wireguard`, permissions `0700`.
- **Rotation** : le GUI doit gérer la rotation des clés peers, mais la clé serveur est écrite dans le fichier lors de l’installation ; la rotation nécessite une action manuelle (wg set).
- **Sauvegarde** : inclure `/etc/wireguard`, `/var/lib/radiusdesk/wireguard` et `/etc/radiusdesk/wireguard-agent.env` dans vos backups.
- **NAT par interface** : lorsque “NAT Enabled” est coché, l’agent convertit automatiquement les hooks en règles `iptables/ip6tables` ciblant uniquement le sous-réseau WireGuard concerné et en règles `ufw route` `in on <wg> out on <uplink>`. Si la case est décochée, aucune règle n’est ajoutée et le trafic routé reste bloqué.
- **Monitoring** : surveiller `wg show` pour détecter les peers inactifs et synchroniser avec le module GUI.
