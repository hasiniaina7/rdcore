#!/usr/bin/env bash
set -euo pipefail

DEFAULT_DEST="/var/www/rdcore"
DEST_ROOT="$DEFAULT_DEST"
DEST_SET="false"
SYNC_ALL="false"
DIFF_DEST="false"

show_help() {
  cat <<'EOF'
Usage: ./sync-to-var-www.sh [options] [DEST]

Options:
  -a, --all        Synchronise tous les fichiers suivis par git (utile après un git pull)
  -d, --diff-dest  Compare avec DEST pour ne copier que les fichiers absents/différents
  -h, --help       Affiche cette aide

DEST par défaut: /var/www/rdcore
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -a|--all)
      SYNC_ALL="true"
      shift
      ;;
    -d|--diff-dest)
      DIFF_DEST="true"
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    -*)
      echo "Option inconnue: $1"
      show_help
      exit 1
      ;;
    *)
      if [[ "$DEST_SET" == "true" ]]; then
        echo "Trop d'arguments. Spécifiez au plus un répertoire de destination."
        exit 1
      fi
      DEST_ROOT="$1"
      DEST_SET="true"
      shift
      ;;
  esac
done

if [[ "$SYNC_ALL" == "true" && "$DIFF_DEST" == "true" ]]; then
  echo "Les options --all et --diff-dest sont incompatibles."
  exit 1
fi

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

should_sync_file() {
  local src="$1"
  local dest="$2"

  if [[ ! -e "$dest" ]]; then
    return 0
  fi

  if [[ ! -f "$dest" ]]; then
    return 0
  fi

  if cmp -s "$src" "$dest" >/dev/null 2>&1; then
    return 1
  fi

  return 0
}

# Chemin du dossier courant relatif à la racine git (ex: "rdcore", "rdcore/login")
SRC_RELPATH="$(realpath --relative-to="$REPO_ROOT" "$SRC_ROOT" 2>/dev/null || echo ".")"

echo "Source root : $SRC_ROOT"
echo "Repo root   : $REPO_ROOT"
echo "Sous-dossier: $SRC_RELPATH"
echo "Destination : $DEST_ROOT"
if [[ "$SYNC_ALL" == "true" ]]; then
  echo "Mode        : synchronisation complète (--all)"
elif [[ "$DIFF_DEST" == "true" ]]; then
  echo "Mode        : comparaison avec destination (--diff-dest)"
else
  echo "Mode        : uniquement les modifications locales"
fi
echo

files=()
if [[ "$DIFF_DEST" == "true" ]]; then
  mapfile -t candidates < <(git -C "$REPO_ROOT" ls-files -- "$SRC_RELPATH" || true)
  for rel in "${candidates[@]}"; do
    [[ -z "$rel" ]] && continue
    src_path="$REPO_ROOT/$rel"
    [[ ! -f "$src_path" ]] && continue
    dest_path="$DEST_ROOT/$rel"
    if should_sync_file "$src_path" "$dest_path"; then
      files+=("$rel")
    fi
  done
elif [[ "$SYNC_ALL" == "true" ]]; then
  mapfile -t files < <(git -C "$REPO_ROOT" ls-files -- "$SRC_RELPATH" || true)
else
  # Fichiers suivis modifiés par rapport à HEAD
  mapfile -t tracked < <(git -C "$REPO_ROOT" diff --name-only HEAD -- "$SRC_RELPATH" || true)

  # Fichiers non suivis (nouveaux)
  mapfile -t untracked < <(git -C "$REPO_ROOT" ls-files --others --exclude-standard -- "$SRC_RELPATH" || true)

  for f in "${tracked[@]}"; do
    [[ -n "$f" ]] && files+=("$f")
  done
  for f in "${untracked[@]}"; do
    [[ -n "$f" ]] && files+=("$f")
  done
fi

if [[ ${#files[@]} -eq 0 ]]; then
  if [[ "$DIFF_DEST" == "true" ]]; then
    echo "Aucune différence détectée entre source et destination dans '$SRC_RELPATH'."
  elif [[ "$SYNC_ALL" == "true" ]]; then
    echo "Aucun fichier suivi à synchroniser dans '$SRC_RELPATH'."
  else
    echo "Aucun fichier modifié dans '$SRC_RELPATH'. Rien à synchroniser."
  fi
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
