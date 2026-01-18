import paramiko
import getpass
import os
import re
from datetime import datetime

# ==================== CONFIGURATION ====================
# Identifiants des MikroTik (modifiables si nécessaire)
MIKROTIK_USER = "christ"  # Modifier si besoin
MIKROTIK_PASSWORD = "Wifizone%fianaralink2024XX"   # Laissez vide pour demander à l'exécution

# Configuration du serveur Radius (à adapter selon votre environnement)
RADIUS_SSH_HOST = "10.5.1.1"
RADIUS_SSH_USER = "ubuntu"
PATH_TO_KEY = r"C:\Users\USER\Downloads\desk-desk.pem"

# Plage d'IP pour PPPoE (à adapter selon votre configuration)
PPPOE_IP_RANGE = "172.16."  # Début de la plage d'IP PPPoE

# Mode debug (affiche les commandes et réponses brutes)
DEBUG_MODE = False

# ==================== FONCTIONS UTILITAIRES ====================

def get_timestamp():
    """Retourne un timestamp formaté pour les logs"""
    return datetime.now().strftime("%H:%M:%S")

def print_header(title):
    """Affiche un en-tête formaté"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def print_step(step_num, description):
    """Affiche une étape formatée"""
    print(f"\n[{get_timestamp()}] [ÉTAPE {step_num}] {description}")
    print("-" * 40)

def print_success(message):
    """Affiche un message de succès"""
    print(f"✅ {get_timestamp()} - {message}")

def print_error(message):
    """Affiche un message d'erreur"""
    print(f"❌ {get_timestamp()} - {message}")

def print_info(message):
    """Affiche un message d'information"""
    print(f"ℹ️  {get_timestamp()} - {message}")

def print_warning(message):
    """Affiche un message d'avertissement"""
    print(f"⚠️  {get_timestamp()} - {message}")

def debug_print(message):
    """Affiche un message de debug si le mode debug est activé"""
    if DEBUG_MODE:
        print(f"🔍 {get_timestamp()} - DEBUG: {message}")

def is_pppoe_ip(ip_address):
    """Vérifie si l'adresse IP appartient à la plage PPPoE"""
    return ip_address.startswith(PPPOE_IP_RANGE)

def validate_ip(ip_address):
    """Valide le format d'une adresse IP"""
    pattern = r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$'
    if not re.match(pattern, ip_address):
        return False
    
    # Vérifier que chaque octet est entre 0 et 255
    parts = ip_address.split('.')
    for part in parts:
        if not 0 <= int(part) <= 255:
            return False
    
    return True

# ==================== FONCTIONS PRINCIPALES ====================

def detecter_mikrotik_cible(ip_client):
    """Se connecte au serveur Radius pour trouver le MikroTik associé à l'IP client"""
    print_step(1, f"Recherche du MikroTik pour l'IP {ip_client}")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print_info(f"Connexion SSH au Radius ({RADIUS_SSH_HOST})...")
        k = paramiko.RSAKey.from_private_key_file(PATH_TO_KEY)
        client.connect(hostname=RADIUS_SSH_HOST, username=RADIUS_SSH_USER, pkey=k, timeout=10)
        print_success("Authentification Radius réussie.")

        # Déterminer le type de connexion (hotspot ou pppoe)
        connexion_type = "PPPoE" if is_pppoe_ip(ip_client) else "Hotspot"
        print_info(f"Type de connexion détecté : {connexion_type}")

        # Requête SQL adaptée selon le type de connexion
        if connexion_type == "PPPoE":
            # Pour PPPoE, on recherche dans la table radacct avec l'IP assignée
            sub_query = f"(SELECT nasidentifier FROM radacct WHERE framedipaddress = '{ip_client}' ORDER BY radacctid DESC LIMIT 1)"
        else:
            # Pour Hotspot, requête originale
            sub_query = f"(SELECT nasidentifier FROM radacct WHERE framedipaddress = '{ip_client}' AND acctstoptime IS NULL ORDER BY acctstarttime DESC LIMIT 1)"
        
        sql_query = (
            f"SELECT nasname, nasidentifier, shortname FROM nas "
            f"WHERE nasname = {sub_query} "
            f"OR shortname = {sub_query} "
            f"OR nasidentifier = {sub_query} "
            f"LIMIT 1;"
        )
        
        print_info("Interrogation de la base RadiusDesk...")
        debug_print(f"Requête SQL : {sql_query}")
        cmd = f'sudo mysql -D rd -N -s -e "{sql_query}"'
        stdin, stdout, stderr = client.exec_command(cmd)
        resultat = stdout.read().decode().strip()
        error = stderr.read().decode().strip()

        if error:
            print_warning(f"Avertissement MySQL : {error}")

        debug_print(f"Résultat SQL brut : {resultat}")

        if not resultat:
            print_error(f"Aucun MikroTik trouvé pour l'IP {ip_client} ({connexion_type})")
            return None, None, connexion_type
        else:
            infos = resultat.split('\t')
            mkt_ip = infos[0]
            mkt_nom = infos[1] if len(infos) > 1 else "Non renseigné"
            mkt_shortname = infos[2] if len(infos) > 2 else "Non renseigné"
            
            print_header("MIKROTIK TROUVÉ")
            print(f"   Nom complet : {mkt_nom}")
            print(f"   Nom court   : {mkt_shortname}")
            print(f"   IP          : {mkt_ip}")
            print(f"   Type        : {connexion_type}")
            print("="*60)
            return mkt_ip, mkt_nom, connexion_type

    except FileNotFoundError:
        print_error(f"Fichier de clé SSH introuvable : {PATH_TO_KEY}")
        return None, None, None
    except Exception as e:
        print_error(f"ERREUR lors de la détection : {str(e)}")
        return None, None, None
    finally:
        client.close()

def recuperer_infos_client(ip_mikrotik, user, password, ip_client, connexion_type):
    """Récupère les infos réelles (IP et MAC) du client dans le MikroTik selon le type de connexion"""
    print_step(2, f"Connexion au MikroTik ({ip_mikrotik}) - Type: {connexion_type}")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(hostname=ip_mikrotik, username=user, password=password, 
                      timeout=15, look_for_keys=False, allow_agent=False)
        print_success("Connexion MikroTik réussie.")
        
        if connexion_type == "PPPoE":
            # MÉTHODE 1: Utiliser les commandes find et get (la plus fiable)
            print_info("Méthode 1: Recherche avec commandes find/get...")
            
            # Trouver l'ID de la session active
            cmd_find = f'/ppp active find where address={ip_client}'
            debug_print(f"Commande find: {cmd_find}")
            stdin, stdout, stderr = client.exec_command(cmd_find)
            session_id = stdout.read().decode().strip()
            debug_print(f"ID de session trouvé: {session_id}")
            
            if session_id and session_id != "":
                # Extraire la MAC (caller-id)
                cmd_mac = f'/ppp active get {session_id} caller-id'
                debug_print(f"Commande get MAC: {cmd_mac}")
                stdin, stdout, stderr = client.exec_command(cmd_mac)
                mac = stdout.read().decode().strip()
                
                # Extraire le nom
                cmd_name = f'/ppp active get {session_id} name'
                debug_print(f"Commande get nom: {cmd_name}")
                stdin, stdout, stderr = client.exec_command(cmd_name)
                name = stdout.read().decode().strip()
                
                debug_print(f"MAC brute: {mac}, Nom brut: {name}")
                
                if mac and len(mac) == 17 and ':' in mac:
                    print_success(f"Client PPPoE trouvé (méthode find/get):")
                    print(f"   ID Session : {session_id}")
                    print(f"   Nom        : {name if name else 'Inconnu'}")
                    print(f"   IP         : {ip_client}")
                    print(f"   MAC        : {mac.upper()}")
                    return ip_client, mac.upper(), name if name else "Client PPPoE"
            
            # MÉTHODE 2: Recherche dans les secrets PPPoE
            print_info("Méthode 2: Recherche dans les secrets PPPoE...")
            cmd_secret_find = f'/ppp secret find where remote-address={ip_client}'
            debug_print(f"Commande find secret: {cmd_secret_find}")
            stdin, stdout, stderr = client.exec_command(cmd_secret_find)
            secret_id = stdout.read().decode().strip()
            debug_print(f"ID secret trouvé: {secret_id}")
            
            if secret_id and secret_id != "":
                cmd_mac = f'/ppp secret get {secret_id} caller-id'
                stdin, stdout, stderr = client.exec_command(cmd_mac)
                mac = stdout.read().decode().strip()
                
                cmd_name = f'/ppp secret get {secret_id} name'
                stdin, stdout, stderr = client.exec_command(cmd_name)
                name = stdout.read().decode().strip()
                
                debug_print(f"MAC secrète brute: {mac}, Nom secret brut: {name}")
                
                if mac and ':' in mac:
                    print_success(f"Client PPPoE trouvé (dans les secrets):")
                    print(f"   ID Secret : {secret_id}")
                    print(f"   Nom       : {name if name else 'Inconnu'}")
                    print(f"   IP        : {ip_client}")
                    print(f"   MAC       : {mac.upper()}")
                    print(f"   Statut    : Configuré (peut être inactif)")
                    return ip_client, mac.upper(), name if name else "Client PPPoE"
            
            # MÉTHODE 3: Commande en une ligne (alternative)
            print_info("Méthode 3: Commande alternative en une ligne...")
            cmd_alt = f':local pppId [/ppp active find address="{ip_client}"]; :if ([:len $pppId] > 0) do={{\
                :local pppMac [/ppp active get $pppId caller-id];\
                :local pppName [/ppp active get $pppId name];\
                :put ("$pppName,$pppMac")\
            }} else {{\
                :local secretId [/ppp secret find remote-address="{ip_client}"];\
                :if ([:len $secretId] > 0) do={{\
                    :local secretMac [/ppp secret get $secretId caller-id];\
                    :local secretName [/ppp secret get $secretId name];\
                    :put ("$secretName,$secretMac")\
                }}\
            }}'
            
            debug_print(f"Commande alternative: {cmd_alt}")
            stdin, stdout, stderr = client.exec_command(cmd_alt)
            result = stdout.read().decode().strip()
            debug_print(f"Résultat alternative: {result}")
            
            if result and ',' in result:
                name, mac = result.split(',', 1)
                if mac and ':' in mac:
                    print_success(f"Client PPPoE trouvé (commande alternative):")
                    print(f"   Nom      : {name if name else 'Inconnu'}")
                    print(f"   IP       : {ip_client}")
                    print(f"   MAC      : {mac.upper()}")
                    return ip_client, mac.upper(), name if name else "Client PPPoE"
            
            # MÉTHODE 4: Parsing de la sortie print (fallback amélioré)
            print_info("Méthode 4: Parsing de la sortie print...")
            cmd_print = '/ppp active print'
            debug_print(f"Commande print: {cmd_print}")
            stdin, stdout, stderr = client.exec_command(cmd_print)
            all_sessions = stdout.read().decode()
            debug_print(f"Sortie print (premières 500 chars): {all_sessions[:500]}")
            
            # Chercher la ligne contenant l'IP
            for line in all_sessions.split('\n'):
                if ip_client in line:
                    debug_print(f"Ligne trouvée: {line}")
                    # Nettoyer les espaces multiples
                    line = re.sub(r'\s+', ' ', line.strip())
                    parts = line.split(' ')
                    debug_print(f"Parts: {parts}")
                    
                    # Trouver la position de la MAC (format XX:XX:XX:XX:XX:XX)
                    mac = None
                    name_parts = []
                    
                    for i, part in enumerate(parts):
                        # Vérifier si c'est une MAC (17 caractères avec :)
                        if len(part) == 17 and part.count(':') == 5:
                            mac = part
                            # Le nom est généralement avant la MAC
                            # On ignore le premier élément (numéro) et les flags (R, S, etc.)
                            for j in range(1, i):
                                if parts[j] not in ['R', 'S', 'pppoe', 'pptp', 'l2tp', 'sstp', 'ovpn']:
                                    name_parts.append(parts[j])
                            break
                    
                    if mac:
                        name = ' '.join(name_parts) if name_parts else "Inconnu"
                        print_success(f"Client PPPoE trouvé (parsing print):")
                        print(f"   Nom      : {name}")
                        print(f"   IP       : {ip_client}")
                        print(f"   MAC      : {mac.upper()}")
                        return ip_client, mac.upper(), name
            
            # MÉTHODE 5: Interface PPPoE spécifique
            print_info("Méthode 5: Recherche via interface PPPoE...")
            cmd_pppoe = f'/interface pppoe-server session print where address={ip_client}'
            debug_print(f"Commande PPPoE session: {cmd_pppoe}")
            stdin, stdout, stderr = client.exec_command(cmd_pppoe)
            pppoe_output = stdout.read().decode()
            debug_print(f"Sortie PPPoE: {pppoe_output}")
            
            if pppoe_output and 'caller-id' in pppoe_output.lower():
                # Extraire la MAC
                mac_match = re.search(r'caller-id:\s*([0-9A-Fa-f:]{17})', pppoe_output, re.IGNORECASE)
                if mac_match:
                    mac = mac_match.group(1)
                    # Extraire le nom
                    name_match = re.search(r'name:\s*([^\n]+)', pppoe_output, re.IGNORECASE)
                    name = name_match.group(1).strip() if name_match else "Inconnu"
                    
                    print_success(f"Client PPPoE trouvé (interface PPPoE):")
                    print(f"   Nom      : {name}")
                    print(f"   IP       : {ip_client}")
                    print(f"   MAC      : {mac.upper()}")
                    return ip_client, mac.upper(), name
        
        else:
            # RECHERCHE HOTSPOT
            print_info("Recherche client Hotspot...")
            
            # MÉTHODE 1: Commande en une ligne
            cmd = f':local h [/ip hotspot host find to-address={ip_client}]; :if ([:len $h] > 0) do={{\
                :local hostIP [/ip hotspot host get $h address];\
                :local hostMAC [/ip hotspot host get $h mac-address];\
                :local hostName [/ip hotspot host get $h comment];\
                :put ("$hostIP,$hostMAC,$hostName")\
            }}'
            
            debug_print(f"Commande Hotspot: {cmd}")
            stdin, stdout, stderr = client.exec_command(cmd)
            resultat = stdout.read().decode().strip()
            debug_print(f"Résultat Hotspot: {resultat}")
            
            if resultat and ',' in resultat:
                infos = resultat.split(',')
                if len(infos) >= 2:
                    print_success(f"Client Hotspot trouvé :")
                    print(f"   IP      : {infos[0]}")
                    print(f"   MAC     : {infos[1]}")
                    print(f"   Comment : {infos[2] if len(infos) > 2 else 'Non renseigné'}")
                    return infos[0], infos[1], infos[2] if len(infos) > 2 else "Client Hotspot"
            
            # MÉTHODE 2: Commande alternative
            print_info("Méthode alternative Hotspot...")
            cmd_alt = f'/ip hotspot host print where address={ip_client}'
            debug_print(f"Commande Hotspot alt: {cmd_alt}")
            stdin, stdout, stderr = client.exec_command(cmd_alt)
            resultat = stdout.read().decode()
            debug_print(f"Résultat Hotspot alt: {resultat}")
            
            if resultat and "mac-address" in resultat.lower():
                # Extraire la MAC
                mac_match = re.search(r'mac-address=([0-9A-Fa-f:]{17})', resultat, re.IGNORECASE)
                if mac_match:
                    mac = mac_match.group(1)
                    # Extraire le commentaire
                    comment_match = re.search(r'comment="?([^"\n]+)"?', resultat)
                    comment = comment_match.group(1) if comment_match else "Client Hotspot"
                    
                    print_success(f"Client Hotspot trouvé (méthode alternative):")
                    print(f"   IP      : {ip_client}")
                    print(f"   MAC     : {mac.upper()}")
                    print(f"   Comment : {comment}")
                    return ip_client, mac.upper(), comment
        
        print_error(f"Client non trouvé dans le MikroTik ({connexion_type})")
        print_info(f"Conseil: Vérifiez manuellement sur le MikroTik avec ces commandes:")
        print_info(f"  Pour PPPoE: /ppp active print where address={ip_client}")
        print_info(f"  Pour Hotspot: /ip hotspot host print where address={ip_client}")
        return None, None, None
        
    except Exception as e:
        print_error(f"ERREUR de connexion au MikroTik : {str(e)}")
        import traceback
        debug_print(f"Traceback: {traceback.format_exc()}")
        return None, None, None
    finally:
        client.close()

def verifier_bypass_existant(ip_mikrotik, user, password, mac):
    """Vérifie si un bypass existe déjà pour cette MAC"""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(hostname=ip_mikrotik, username=user, password=password, 
                      timeout=15, look_for_keys=False, allow_agent=False)
        
        cmd_check = f'/ip hotspot ip-binding print where mac-address={mac}'
        stdin, stdout, stderr = client.exec_command(cmd_check)
        result = stdout.read().decode()
        
        return mac in result and "bypassed" in result.lower()
        
    except Exception as e:
        print_warning(f"Impossible de vérifier le bypass existant : {str(e)}")
        return False
    finally:
        client.close()

def activer_bypass(ip_mikrotik, user, password, mac, ip_client, client_name):
    """Active le bypass pour le client"""
    print_step(3, "Activation du bypass")
    
    # Vérifier si un bypass existe déjà
    existing_bypass = verifier_bypass_existant(ip_mikrotik, user, password, mac)
    if existing_bypass:
        print_warning(f"Un bypass existe déjà pour la MAC {mac}")
        reponse = input("Voulez-vous le remplacer ? (O/N) : ").strip().upper()
        if reponse != 'O':
            print_info("Annulation de l'activation")
            return False
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(hostname=ip_mikrotik, username=user, password=password, 
                      timeout=15, look_for_keys=False, allow_agent=False)
        
        # Créer un commentaire informatif
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        comment = f"SUPPORT_{timestamp}_{client_name[:20]}_{ip_client}"
        
        # Vérifier d'abord si une entrée existe avec cette MAC
        cmd_check = f'/ip hotspot ip-binding print where mac-address={mac}'
        stdin, stdout, stderr = client.exec_command(cmd_check)
        existing = stdout.read().decode()
        
        if mac in existing and "bypassed" in existing.lower():
            # Supprimer l'ancienne entrée
            cmd_remove = f'/ip hotspot ip-binding remove [find mac-address={mac}]'
            stdin, stdout, stderr = client.exec_command(cmd_remove)
            print_info("Ancien bypass supprimé")
        
        # Ajouter le nouveau bypass
        cmd_add = f'/ip hotspot ip-binding add mac-address={mac} type=bypassed comment="{comment}" disabled=no'
        debug_print(f"Commande d'ajout: {cmd_add}")
        stdin, stdout, stderr = client.exec_command(cmd_add)
        error_output = stderr.read().decode()
        
        if error_output:
            print_warning(f"Message lors de l'ajout: {error_output}")
        
        # Vérification
        cmd_verify = f'/ip hotspot ip-binding print where mac-address={mac}'
        stdin, stdout, stderr = client.exec_command(cmd_verify)
        result = stdout.read().decode()
        debug_print(f"Résultat vérification: {result}")
        
        if mac in result and "bypassed" in result.lower():
            # Extraire les infos du bypass créé
            for line in result.split('\n'):
                if mac in line:
                    parts = line.split()
                    if len(parts) > 1:
                        bypass_id = parts[0].replace('*', '')
                        print_success(f"Bypass activé avec succès !")
                        print(f"   ID Bypass : {bypass_id}")
                        print(f"   Comment   : {comment}")
                        print(f"   Statut    : Actif")
                        return True
        else:
            print_error("Échec de l'activation du bypass")
            return False
            
    except Exception as e:
        print_error(f"ERREUR lors de l'activation : {str(e)}")
        return False
    finally:
        client.close()

def supprimer_bypass(ip_mikrotik, user, password, mac, ip_client):
    """Supprime le bypass pour le client"""
    print_step(4, "Suppression du bypass")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(hostname=ip_mikrotik, username=user, password=password, 
                      timeout=15, look_for_keys=False, allow_agent=False)
        
        # Lister tous les bypass pour cette MAC
        cmd_list = f'/ip hotspot ip-binding print where mac-address={mac}'
        stdin, stdout, stderr = client.exec_command(cmd_list)
        result = stdout.read().decode()
        debug_print(f"Liste des bypass: {result}")
        
        if not result or mac not in result:
            print_warning(f"Aucun bypass trouvé pour la MAC {mac}")
            return True
        
        # Compter le nombre de bypass à supprimer
        lines = [line for line in result.split('\n') if mac in line]
        count = len(lines)
        
        if count > 1:
            print_warning(f"{count} bypass trouvés pour cette MAC")
        
        # Supprimer tous les bypass pour cette MAC
        cmd_remove = f'/ip hotspot ip-binding remove [find mac-address={mac}]'
        stdin, stdout, stderr = client.exec_command(cmd_remove)
        error_output = stderr.read().decode()
        
        if error_output:
            print_warning(f"Message lors de la suppression: {error_output}")
        
        # Vérification
        cmd_check = f'/ip hotspot ip-binding print where mac-address={mac}'
        stdin, stdout, stderr = client.exec_command(cmd_check)
        result = stdout.read().decode()
        
        if not result or mac not in result:
            print_success(f"Bypass supprimé avec succès !")
            print(f"   Nombre d'entrées supprimées : {count}")
            return True
        else:
            print_error("Échec de la suppression du bypass")
            return False
            
    except Exception as e:
        print_error(f"ERREUR lors de la suppression : {str(e)}")
        return False
    finally:
        client.close()

def afficher_resume_action(ip_client, ip_reelle, mac_reelle, client_name, mkt_nom, connexion_type, action="activation"):
    """Affiche un résumé de l'action à effectuer"""
    print_header(f"RÉSUMÉ DE L'ACTION ({action.upper()})")
    print(f"   Client          : {client_name}")
    print(f"   IP demandée     : {ip_client}")
    print(f"   IP réelle       : {ip_reelle}")
    print(f"   MAC Address     : {mac_reelle}")
    print(f"   Type connexion  : {connexion_type}")
    print(f"   MikroTik cible  : {mkt_nom}")
    print("="*60)

def tester_commande_mikrotik(ip_mikrotik, user, password, commande):
    """Teste une commande sur le MikroTik et retourne le résultat"""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(hostname=ip_mikrotik, username=user, password=password, 
                      timeout=10, look_for_keys=False, allow_agent=False)
        
        stdin, stdout, stderr = client.exec_command(commande)
        result = stdout.read().decode().strip()
        error = stderr.read().decode().strip()
        
        return result, error
    except Exception as e:
        return None, str(e)
    finally:
        client.close()

# ==================== FLUX PRINCIPAL ====================

def main():
    print_header("SYSTÈME DE MAINTENANCE HOTSPOT/PPPOE AUTOMATISÉ")
    print_info(f"Mode debug: {'ACTIVÉ' if DEBUG_MODE else 'DÉSACTIVÉ'}")
    
    # 1. Saisie de l'IP client
    print_step(0, "Saisie des informations initiales")
    
    while True:
        ip_client = input("🔎 Entrez l'IP du client à traiter : ").strip()
        
        # Validation de l'IP
        if validate_ip(ip_client):
            break
        else:
            print_error("Format d'IP invalide. Exemple: 192.168.1.100 ou 172.16.3.4")
            print_info("L'IP doit être au format XXX.XXX.XXX.XXX avec chaque octet entre 0 et 255")
    
    # 2. Détection automatique du MikroTik
    input("\n>>> Appuyez sur ENTREE pour lancer la détection...")
    ip_mikrotik, nom_mikrotik, connexion_type = detecter_mikrotik_cible(ip_client)
    
    if not ip_mikrotik:
        print_error("Impossible de continuer sans MikroTik cible.")
        
        # Demander l'IP du MikroTik manuellement
        print_info("Veuillez entrer manuellement l'IP du MikroTik :")
        ip_mikrotik = input("IP du MikroTik : ").strip()
        if not ip_mikrotik or not validate_ip(ip_mikrotik):
            print_error("IP invalide. Arrêt du script.")
            return
        
        nom_mikrotik = "Manuel"
        connexion_type = "PPPoE" if is_pppoe_ip(ip_client) else "Hotspot"
        print_info(f"Type de connexion déterminé: {connexion_type}")
    
    # 3. Demande des identifiants MikroTik si non configurés
    user_mt = MIKROTIK_USER
    pass_mt = MIKROTIK_PASSWORD
    
    if not pass_mt:
        print_step("CONFIG", "Identifiants MikroTik requis")
        user_mt = input(f"👤 User SSH ({MIKROTIK_USER}) : ").strip() or MIKROTIK_USER
        pass_mt = getpass.getpass("🔑 Password SSH : ")
    
    # Test de connexion au MikroTik
    print_info("Test de connexion au MikroTik...")
    test_result, test_error = tester_commande_mikrotik(ip_mikrotik, user_mt, pass_mt, "/system resource print")
    
    if test_result:
        print_success(f"Connexion test réussie au MikroTik {nom_mikrotik}")
    else:
        print_error(f"Échec de connexion test: {test_error}")
        print_warning("La connexion au MikroTik pourrait échouer.")
        reponse = input("Continuer malgré tout ? (O/N) : ").strip().upper()
        if reponse != 'O':
            print_info("Arrêt du script.")
            return
    
    # 4. Récupération des infos du client
    input(f"\n>>> Appuyez sur ENTREE pour rechercher le client sur {nom_mikrotik} ({ip_mikrotik})...")
    ip_reelle, mac_reelle, client_name = recuperer_infos_client(ip_mikrotik, user_mt, pass_mt, ip_client, connexion_type)
    
    if not ip_reelle or not mac_reelle:
        print_error("Impossible de récupérer les informations du client.")
        
        # Option manuelle
        print_info("\nOption manuelle :")
        print_info("Vous pouvez entrer manuellement l'adresse MAC du client")
        mac_manuelle = input("Adresse MAC (format: XX:XX:XX:XX:XX:XX) : ").strip().upper()
        
        if mac_manuelle and len(mac_manuelle) == 17 and mac_manuelle.count(':') == 5:
            mac_reelle = mac_manuelle
            ip_reelle = ip_client
            client_name = input("Nom du client (optionnel) : ").strip() or f"Client {connexion_type}"
            print_info(f"Informations manuelles enregistrées:")
            print_info(f"  Nom: {client_name}, IP: {ip_reelle}, MAC: {mac_reelle}")
        else:
            print_error("Format MAC invalide. Arrêt du script.")
            return
    
    # 5. Activation du bypass
    afficher_resume_action(ip_client, ip_reelle, mac_reelle, client_name, nom_mikrotik, connexion_type, "activation")
    
    print("\n⚠️  AVERTISSEMENT IMPORTANT :")
    print("   Cette action permettra au client de contourner l'authentification Radius.")
    print("   Le client aura un accès Internet COMPLET sans restrictions.")
    print("   Assurez-vous que c'est nécessaire pour une maintenance légitime.")
    print("   ⚠️  NE LAISSEZ PAS LE BYPASS ACTIVÉ PLUS LONGTEMPS QUE NÉCESSAIRE ⚠️")
    
    reponse = input("\n>>> Confirmer l'activation du bypass ? (O/N) : ").strip().upper()
    
    if reponse == 'O':
        if activer_bypass(ip_mikrotik, user_mt, pass_mt, mac_reelle, ip_reelle, client_name):
            print_header("MAINTENANCE PRÊTE")
            print("✅ Le client peut maintenant accéder librement au routeur.")
            print("⚠️  ATTENTION: Le client contourne maintenant l'authentification Radius")
            print("⚠️  Rappel: Supprimez le bypass dès que la maintenance est terminée")
            print("-" * 60)
            
            # 6. Attente pendant la maintenance
            print("\n" + "="*60)
            print("MAINTENANCE EN COURS - BYPASS ACTIF")
            print("="*60)
            print(f"Client: {client_name}")
            print(f"MAC: {mac_reelle}")
            print(f"IP: {ip_reelle}")
            print(f"Début: {get_timestamp()}")
            print("-" * 60)
            print("Le client a maintenant un accès Internet complet.")
            print("Une fois la maintenance terminée, appuyez sur ENTREE")
            print("pour supprimer le bypass et restaurer l'authentification Radius.")
            print("="*60)
            
            input("\n>>> Appuyez sur ENTREE pour supprimer le bypass...")
            
            # 7. Suppression du bypass
            afficher_resume_action(ip_client, ip_reelle, mac_reelle, client_name, nom_mikrotik, connexion_type, "suppression")
            
            reponse_fin = input("\n>>> Confirmer la suppression du bypass ? (O/N) : ").strip().upper()
            if reponse_fin == 'O':
                if supprimer_bypass(ip_mikrotik, user_mt, pass_mt, mac_reelle, ip_reelle):
                    print_header("MAINTENANCE TERMINÉE")
                    print("✅ Le client est de nouveau sous contrôle Radius.")
                    print("✅ L'accès nécessite à nouveau une authentification.")
                    print(f"✅ Fin: {get_timestamp()}")
                else:
                    print_error("Maintenance terminée, mais erreur lors du nettoyage.")
                    print_warning("⚠️  VÉRIFIEZ MANUELLEMENT LE BYPASS SUR LE MIKROTIK !")
                    print_warning(f"Commande à exécuter: /ip hotspot ip-binding remove [find mac-address={mac_reelle}]")
            else:
                print_warning("Suppression annulée par l'utilisateur.")
                print("⚠️  ATTENTION: Le bypass reste actif !")
                print("⚠️  N'OUBLIEZ PAS de le supprimer manuellement plus tard.")
                print(f"Commande: /ip hotspot ip-binding remove [find mac-address={mac_reelle}]")
        else:
            print_error("Échec de l'activation. Maintenance annulée.")
    else:
        print_info("Activation annulée par l'utilisateur.")
    
    print_header("FIN DE SESSION")
    print(f"Résumé :")
    print(f"  - Client       : {client_name}")
    print(f"  - IP           : {ip_reelle}")
    print(f"  - MAC          : {mac_reelle}")
    print(f"  - MikroTik     : {nom_mikrotik}")
    print(f"  - Type         : {connexion_type}")
    print(f"  - Heure fin    : {get_timestamp()}")
    
    # Sauvegarder un log
    try:
        log_entry = f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - Client: {client_name}, IP: {ip_reelle}, MAC: {mac_reelle}, MikroTik: {nom_mikrotik}, Type: {connexion_type}\n"
        with open("hotspot_maintenance.log", "a", encoding="utf-8") as f:
            f.write(log_entry)
        print_info("Log sauvegardé dans hotspot_maintenance.log")
    except Exception as e:
        print_warning(f"Impossible de sauvegarder le log: {e}")

# ==================== EXÉCUTION ====================

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Script interrompu par l'utilisateur (Ctrl+C).")
    except Exception as e:
        print(f"\n❌ ERREUR INATTENDUE : {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        input("\nAppuyez sur ENTREE pour quitter...")