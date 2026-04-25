# MikroTik Maintenance Tool

Flask-based web dashboard for PPPoE and Hotspot maintenance workflows. It detects the correct MikroTik from Radius, retrieves client info, and activates or deactivates a temporary bypass.

## Features
- REST API with background SSH execution (non-blocking)
- Session tracking and status polling
- Structured logs (file + in-memory)
- Responsive dashboard UI
- Basic validation and safe defaults

## Requirements
- Python 3.10+
- Network access to Radius and MikroTik devices

## Setup
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file (see `.env.example`) and start the server:
```bash
python app.py
```

Open `http://localhost:5000`.

## Environment variables
- `SECRET_KEY`: Flask secret key
- `DEBUG`: true/false
- `MIKROTIK_USER`: default user
- `MIKROTIK_PASSWORD`: default password (optional)
- `RADIUS_SSH_HOST`: Radius host IP
- `RADIUS_SSH_USER`: Radius SSH user
- `RADIUS_SSH_KEY_PATH`: path to private key file
- `PPPOE_IP_RANGE`: prefix for PPPoE ranges
- `SSH_CONNECT_TIMEOUT`: seconds
- `SSH_COMMAND_TIMEOUT`: seconds
- `SSH_RETRIES`: retry attempts
- `SESSION_TTL_MINUTES`: cleanup TTL
- `LOG_FILE`: log file path
- `CORS_ORIGINS`: comma-separated origins

## API Endpoints
- POST `/api/detect-mikrotik`
- POST `/api/get-client-info`
- POST `/api/activate-bypass`
- POST `/api/deactivate-bypass`
- GET `/api/maintenance-status`
- POST `/api/finish-maintenance`
- GET `/api/logs`

## Notes
- Passwords are not stored client-side. Keep credentials secure.
- Log file is written to `logs/maintenance.log` by default.

## Project structure
```
mikrotik-maintenance-tool/
├── app.py
├── config.py
├── mikrotik_operations.py
├── ssh_manager.py
├── requirements.txt
├── static/
├── templates/
└── logs/
```
