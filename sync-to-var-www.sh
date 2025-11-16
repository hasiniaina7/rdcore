#!/usr/bin/env bash
set -euo pipefail

DEST_ROOT="${1:-/var/www/rdcore}"

SRC_ROOT="$(pwd)"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$SRC_ROOT")"

ensure_dir() {
  local dir="$1"
  mkdir -p "$dir" 2>/dev/null && return 0
  if command -v sudo >/dev/null 2>&1; then
    sudo mkdir -p "$dir"
  else
    mkdir -p "$dir"
  fi
}

copy_file() {
  local src="$1"
  local dest="$2"
  cp "$src" "$dest" 2>/dev/null && return 0
  if command -v sudo >/dev/null 2>&1; then
    sudo cp "$src" "$dest"
  else
    cp "$src" "$dest"
  fi
}

# Chemin du dossier courant relatif à la racine git (ex: "rdcore", "rdcore/login")
SRC_RELPATH="$(realpath --relative-to="$REPO_ROOT" "$SRC_ROOT" 2>/dev/null || echo ".")"

echo "Source root : $SRC_ROOT"
echo "Repo root   : $REPO_ROOT"
echo "Sous-dossier: $SRC_RELPATH"
echo "Destination : $DEST_ROOT"
echo

# Fichiers suivis modifiés par rapport à HEAD
mapfile -t tracked < <(git -C "$REPO_ROOT" diff --name-only HEAD -- "$SRC_RELPATH" || true)

# Fichiers non suivis (nouveaux)
mapfile -t untracked < <(git -C "$REPO_ROOT" ls-files --others --exclude-standard -- "$SRC_RELPATH" || true)

files=()
for f in "${tracked[@]}"; do
  [[ -n "$f" ]] && files+=("$f")
done
for f in "${untracked[@]}"; do
  [[ -n "$f" ]] && files+=("$f")
done

if [[ ${#files[@]} -eq 0 ]]; then
  echo "Aucun fichier modifié dans '$SRC_RELPATH'. Rien à synchroniser."
  exit 0
fi

echo "Fichiers à copier :"
printf ' - %s\n' "${files[@]}"
echo

for rel in "${files[@]}"; do
  if [[ "$SRC_RELPATH" != "." ]]; then
    case "$rel" in
      "$SRC_RELPATH"/*) ;;
      "$SRC_RELPATH") ;; # cas racine
      *)
        continue
        ;;
    esac
  fi

  src_path="$REPO_ROOT/$rel"
  dest_path="$DEST_ROOT/$rel"

  if [[ ! -f "$src_path" ]]; then
    continue
  fi

  ensure_dir "$(dirname "$dest_path")"
  echo "Copie: $src_path -> $dest_path"
  copy_file "$src_path" "$dest_path"
done

echo
echo "Synchronisation terminée."

# Si on synchronise vers /var/www/rdcore, s'assurer que /var/www/html/login pointe dessus
if [[ "$DEST_ROOT" == "/var/www/rdcore" ]]; then
  if [[ -d "/var/www/html" && -d "/var/www/rdcore/login" ]]; then
    if [[ -L "/var/www/html/login" ]]; then
      echo "Symlink existant : /var/www/html/login -> $(readlink /var/www/html/login)"
    else
      echo "Création du symlink /var/www/html/login -> ../rdcore/login"
      sudo ln -s ../rdcore/login /var/www/html/login 2>/dev/null || ln -s ../rdcore/login /var/www/html/login
    fi
  fi
fi
