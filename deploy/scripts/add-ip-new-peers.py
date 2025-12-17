#!/usr/bin/env python3
"""
Script pour attribuer une adresse IP unique au dernier peer ajouté.
Ne modifie que l'ipv4_address du nouveau peer.
"""

import mysql.connector
from mysql.connector import Error

def get_db_connection():
    """Établir la connexion à la base de données"""
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='rd',
            user='wireguard_updater',
            password='WireGuardUpdater2024!Securite'
        )
        return connection
    except Error as e:
        print(f"Erreur de connexion: {e}")
        exit(1)

def get_newest_peer(connection):
    """Récupérer le dernier peer ajouté"""
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT id, wireguard_instance_id, ipv4_address FROM wireguard_peers ORDER BY id DESC LIMIT 1")
    peer = cursor.fetchone()
    cursor.close()
    return peer

def extract_ip(ipv4_address):
    """Extraire l'adresse IP de la chaîne"""
    if not ipv4_address:
        return None
    
    # Si contient une virgule, prendre la partie après la dernière virgule
    if ',' in ipv4_address:
        return ipv4_address.split(',')[-1].strip()
    return ipv4_address.strip()

def get_all_ips(connection):
    """Récupérer toutes les IPs de la table"""
    cursor = connection.cursor()
    cursor.execute("SELECT ipv4_address FROM wireguard_peers")
    ips = []
    
    for row in cursor.fetchall():
        ip = extract_ip(row[0])
        if ip and ip.startswith('10.5.'):
            ips.append(ip)
    
    cursor.close()
    return ips

def find_available_ip(used_ips, instance_id):
    """Trouver une IP non utilisée"""
    if instance_id == 1:
        base = "10.5.0."
        start = 2
    else:  # instance_id == 2
        base = "10.5.1."
        start = 2
    
    # Chercher une IP disponible
    for i in range(start, 255):
        candidate = f"{base}{i}"
        if candidate not in used_ips:
            return candidate
    
    return None

def update_peer_ip(connection, peer_id, new_ip):
    """Mettre à jour l'IP du peer"""
    cursor = connection.cursor()
    cursor.execute(
        "UPDATE wireguard_peers SET ipv4_address = %s WHERE id = %s",
        (new_ip, peer_id)
    )
    connection.commit()
    cursor.close()

def main():
    """Script principal"""
    print("Début du script...")
    
    # Connexion DB
    conn = get_db_connection()
    
    # Récupérer le dernier peer
    peer = get_newest_peer(conn)
    if not peer:
        print("Aucun peer trouvé")
        conn.close()
        return
    
    print(f"Peer trouvé: ID={peer['id']}, Instance={peer['wireguard_instance_id']}")
    print(f"IP actuelle: {peer['ipv4_address']}")
    
    # Extraire IP actuelle
    current_ip = extract_ip(peer['ipv4_address'])
    if not current_ip:
        print("Impossible d'extraire l'IP actuelle")
        conn.close()
        return
    
    # Récupérer toutes les IPs existantes
    all_ips = get_all_ips(conn)
    print(f"Nombre d'IPs existantes: {len(all_ips)}")
    
    # Vérifier si l'IP actuelle est déjà utilisée
    if all_ips.count(current_ip) > 1:
        print(f"IP en double détectée: {current_ip}")
        
        # Trouver une IP disponible
        new_ip = find_available_ip(all_ips, peer['wireguard_instance_id'])
        if not new_ip:
            print("Aucune IP disponible")
            conn.close()
            return
        
        # Mettre à jour le peer
        update_peer_ip(conn, peer['id'], new_ip)
        print(f"Peer mis à jour avec: {new_ip}")
    else:
        print(f"IP non dupliquée: {current_ip}")
    
    # Fermer connexion
    conn.close()
    print("Script terminé")

if __name__ == "__main__":
    main()
