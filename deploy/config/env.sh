#!/usr/bin/env bash

# Contexte général
DEPLOY_ENV="${DEPLOY_ENV:-local}"          # local | test | prod

TIMEZONE="${TIMEZONE:-Etc/UTC}"            # Utiliser un TZ valide, ex: Africa/Nairobi
SERVER_HOSTNAME="${SERVER_HOSTNAME:-radiusdesk}"

SERVER_FQDN="${SERVER_FQDN:-hotspot.techzone.lat}"
SERVER_IP="${SERVER_IP:-34.35.148.184}"

# Pile web
WEB_STACK="${WEB_STACK:-nginx}"

# MariaDB
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-rd}"
DB_USER="${DB_USER:-rd}"
DB_PASS="${DB_PASS:-rd}"

# FreeRADIUS
RADIUS_SECRET_DEFAULT="${RADIUS_SECRET_DEFAULT:-testing123}"
RADIUS_CLIENT_NET="${RADIUS_CLIENT_NET:-0.0.0.0/0}"

# Stockage persistant pour les uploads (logos, photos, etc.)
RD_UPLOADS_PERSIST_DIR="${RD_UPLOADS_PERSIST_DIR:-/var/local/radiusdesk-data/uploads}"

# TLS / Let's Encrypt
LE_EMAIL="${LE_EMAIL:-contact@techzone.lat}"
AUTO_LE="${AUTO_LE:-1}"                     # 1 pour lancer certbot automatiquement
