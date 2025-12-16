#!/usr/bin/env python3
"""
Script pour détecter et traiter les nouveaux peers WireGuard.
S'exécute toutes les minutes via systemd timer.
"""

import mysql.connector
import json
import os
import re
from datetime import datetime

# Configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'wireguard_updater',
    'password': '<Mot_de_passe_de_l'utilisateur_wireguard_definie_auparavant',
    'database': 'rd'
}

# Fichiers dans le home de l'utilisateur
CACHE_FILE = '/home/ubuntu/.cache/wireguard_peers_cache.json'
LOG_FILE = '/home/ubuntu/logs/wireguard_updater.log'

def setup_logging():
    """Configure la journalisation"""
    log_dir = os.path.dirname(LOG_FILE)
    if not os.path.exists(log_dir):
        os.makedirs(log_dir, exist_ok=True)
    
    cache_dir = os.path.dirname(CACHE_FILE)
    if not os.path.exists(cache_dir):
        os.makedirs(cache_dir, exist_ok=True)

def log_message(message, level="INFO"):
    """Écrit un message dans le log"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_line = f"{timestamp} [{level}] {message}\n"
    
    with open(LOG_FILE, 'a') as f:
        f.write(log_line)
    
    # Affiche aussi sur stdout pour systemd journal
    print(log_line.strip())

def get_db_connection():
    """Établit une connexion à la base de données"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as err:
        log_message(f"Erreur de connexion DB: {err}", "ERROR")
        return None

def load_cache():
    """Charge le cache depuis le fichier"""
    if not os.path.exists(CACHE_FILE):
        return {
            'processed_peers': [],
            'last_id': 0,
            'last_run': None
        }
    
    try:
        with open(CACHE_FILE, 'r') as f:
            cache = json.load(f)
        
        # Initialiser les champs manquants
        if 'processed_peers' not in cache:
            cache['processed_peers'] = []
        if 'last_id' not in cache:
            cache['last_id'] = 0
        
        return cache
    except Exception as e:
        log_message(f"Erreur lecture cache: {e}", "ERROR")
        return {
            'processed_peers': [],
            'last_id': 0,
            'last_run': None
        }

def save_cache(cache):
    """Sauvegarde le cache dans le fichier"""
    cache['last_run'] = datetime.now().isoformat()
    
    try:
        with open(CACHE_FILE, 'w') as f:
            json.dump(cache, f, indent=2)
    except Exception as e:
        log_message(f"Erreur sauvegarde cache: {e}", "ERROR")

def get_new_peers(conn, cache):
    """Récupère les nouveaux peers non traités"""
    cursor = conn.cursor(dictionary=True)
    new_peers = []
    
    try:
        # Méthode 1: Par ID si la colonne existe
        last_id = cache.get('last_id', 0)
        
        cursor.execute("SHOW COLUMNS FROM wireguard_peers LIKE 'id'")
        has_id_column = cursor.fetchone()
        
        if has_id_column:
            cursor.execute("""
                SELECT id, name, ipv4_address
                FROM wireguard_peers
                WHERE id > %s
                ORDER BY id ASC
            """, (last_id,))
        else:
            # Méthode 2: Par nom (vérifier les noms non traités)
            processed_names = cache.get('processed_peers', [])
            if not processed_names:
                # Premier run: prendre tous les peers non formatés
                cursor.execute("""
                    SELECT name, ipv4_address
                    FROM wireguard_peers
                    WHERE ipv4_address NOT LIKE '%,%'
                    AND ipv4_address IS NOT NULL
                    ORDER BY name ASC
                """)
            else:
                # Prendre seulement les nouveaux noms
                placeholders = ', '.join(['%s'] * len(processed_names))
                cursor.execute(f"""
                    SELECT name, ipv4_address
                    FROM wireguard_peers
                    WHERE name NOT IN ({placeholders})
                    AND ipv4_address NOT LIKE '%,%'
                    AND ipv4_address IS NOT NULL
                    ORDER BY name ASC
                """, tuple(processed_names))
        
        new_peers = cursor.fetchall()
        
        # Ajouter des IDs factices si nécessaire
        if not has_id_column:
            for i, peer in enumerate(new_peers):
                peer['id'] = last_id + i + 1
        
    except mysql.connector.Error as err:
        log_message(f"Erreur lors de la récupération des peers: {err}", "ERROR")
    finally:
        cursor.close()
    
    return new_peers

def format_ip_address(ip_address):
    """Formate l'adresse IP selon le schéma demandé"""
    if not ip_address:
        return ip_address
    
    ip_str = str(ip_address).strip()
    
    # Si déjà formaté, ne rien faire
    if ',' in ip_str:
        return ip_str
    
    # Vérifier le format IPv4
    ip_pattern = r'^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$'
    match = re.match(ip_pattern, ip_str)
    
    if not match:
        log_message(f"Format IP invalide: {ip_str}", "WARNING")
        return ip_str
    
    # Vérifier les octets
    try:
        octets = [int(o) for o in match.groups()]
        if any(o > 255 for o in octets):
            log_message(f"Octets IP invalides: {ip_str}", "WARNING")
            return ip_str
        
        last_octet = octets[3]
        network_address = f"172.16.{last_octet}.0/24"
        formatted_ip = f"{network_address},{ip_str}"
        
        return formatted_ip
    except ValueError:
        log_message(f"IP contient des caractères non numériques: {ip_str}", "WARNING")
        return ip_str

def update_peer(conn, peer):
    """Met à jour un peer dans la base de données"""
    cursor = conn.cursor()
    
    try:
        peer_name = peer.get('name')
        current_ip = peer.get('ipv4_address', '')
        
        # Formater l'adresse IP
        new_ip = format_ip_address(current_ip)
        
        if new_ip == current_ip:
            log_message(f"Peer {peer_name} déjà formaté ou IP invalide")
            return False
        
        # Mettre à jour dans la base
        update_query = """
            UPDATE wireguard_peers 
            SET ipv4_address = %s
            WHERE name = %s
        """
        
        cursor.execute(update_query, (new_ip, peer_name))
        
        conn.commit()
        log_message(f"✓ Peer mis à jour: {peer_name} ({current_ip} -> {new_ip})")
        return True
        
    except mysql.connector.Error as err:
        conn.rollback()
        log_message(f"✗ Erreur UPDATE pour {peer_name}: {err}", "ERROR")
        return False
    finally:
        cursor.close()

def main():
    """Fonction principale - exécutée toutes les minutes"""
    setup_logging()
    log_message("=== Début du traitement ===")
    
    # Se connecter à la base
    conn = get_db_connection()
    if not conn:
        log_message("Impossible de se connecter à la base de données", "ERROR")
        return
    
    try:
        # Charger le cache
        cache = load_cache()
        log_message(f"Cache chargé: {len(cache.get('processed_peers', []))} peers déjà traités")
        
        # Récupérer les nouveaux peers
        new_peers = get_new_peers(conn, cache)
        
        if not new_peers:
            log_message("Aucun nouveau peer à traiter")
        else:
            log_message(f"{len(new_peers)} nouveau(x) peer(s) détecté(s)")
            
            # Traiter chaque nouveau peer
            updated_count = 0
            max_id = cache.get('last_id', 0)
            
            for peer in new_peers:
                if update_peer(conn, peer):
                    updated_count += 1
                    
                    # Ajouter au cache
                    peer_name = peer.get('name')
                    if peer_name and peer_name not in cache['processed_peers']:
                        cache['processed_peers'].append(peer_name)
                    
                    # Mettre à jour le dernier ID
                    peer_id = peer.get('id', 0)
                    if peer_id > max_id:
                        max_id = peer_id
            
            # Mettre à jour le cache
            cache['last_id'] = max_id
            
            # Nettoyer le cache (garder seulement les 2000 derniers)
            if len(cache['processed_peers']) > 2000:
                cache['processed_peers'] = cache['processed_peers'][-2000:]
                log_message(f"Cache nettoyé, garde les 2000 derniers peers")
            
            log_message(f"{updated_count} peer(s) mis à jour avec succès")
        
        # Sauvegarder le cache
        save_cache(cache)
        
    except Exception as e:
        log_message(f"Erreur lors du traitement: {str(e)}", "ERROR")
    
    finally:
        conn.close()
    
    log_message("=== Fin du traitement ===")

if __name__ == "__main__":
    main()  # S'exécute une fois et s'arrête
