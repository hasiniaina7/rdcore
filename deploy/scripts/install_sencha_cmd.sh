#!/usr/bin/env bash
set -euo pipefail

SENCHA_VERSION=${SENCHA_VERSION:-7.8.0.59}
SENCHA_INSTALLER="SenchaCmd-${SENCHA_VERSION}-linux-amd64.sh"
SENCHA_URL=${SENCHA_URL:-"https://cdn.sencha.com/cmd/${SENCHA_VERSION}/${SENCHA_INSTALLER}"}

INSTALL_BASE=${INSTALL_BASE:-"$HOME/bin/Sencha"}
CMD_HOME="${INSTALL_BASE}/Cmd"
WRAPPER_PATH=${WRAPPER_PATH:-"$HOME/bin/sencha"}
OPENSSL_FIX=${OPENSSL_FIX:-/etc/ssl/openssl-phantom.cnf}

log() {
    printf '[sencha-install] %s\n' "$1"
}

ensure_dependencies() {
    local packages=(default-jre-headless nodejs npm unzip curl bzip2)
    log "Installing dependencies (${packages[*]})"
    sudo apt-get update
    sudo apt-get install -y "${packages[@]}"
}

install_sencha_cmd() {
    mkdir -p "$INSTALL_BASE"

    if [[ -x "${CMD_HOME}/sencha" ]]; then
        log "Sencha Cmd already present in ${CMD_HOME}, skipping installer"
        return
    fi

    local tmp
    tmp=$(mktemp -d)
    trap 'rm -rf "${tmp}"' EXIT

    log "Downloading Sencha Cmd ${SENCHA_VERSION}"
    curl -fsSL "$SENCHA_URL" -o "${tmp}/${SENCHA_INSTALLER}"
    chmod +x "${tmp}/${SENCHA_INSTALLER}"

    log "Running silent installer"
    "${tmp}/${SENCHA_INSTALLER}" -q -dir "$INSTALL_BASE"

    if [[ ! -x "${CMD_HOME}/sencha" ]]; then
        log "ERROR: installation did not produce ${CMD_HOME}/sencha" >&2
        exit 1
    fi
}

ensure_openssl_compat() {
    if sudo test -f "$OPENSSL_FIX"; then
        log "OpenSSL compatibility file already present (${OPENSSL_FIX})"
        return
    fi

    log "Creating OpenSSL compatibility config at ${OPENSSL_FIX}"
    sudo tee "$OPENSSL_FIX" >/dev/null <<'CFG'
# Minimal OpenSSL configuration to keep PhantomJS (OpenSSL 1.1) working on
# systems running OpenSSL 3.

openssl_conf = openssl_init

[openssl_init]
providers = provider_sect

[provider_sect]
default = default_sect

[default_sect]
activate = 1
CFG
}

install_phantomjs() {
    if command -v phantomjs >/dev/null 2>&1; then
        log "phantomjs already available"
        return
    fi

    log "Installing phantomjs-prebuilt via npm (used for theme slicing)"
    npm install -g phantomjs-prebuilt >/tmp/phantomjs-install.log 2>&1 || {
        log "ERROR: phantomjs installation failed (see /tmp/phantomjs-install.log)" >&2
        exit 1
    }
}

create_wrapper() {
    mkdir -p "$(dirname "$WRAPPER_PATH")"

    cat >"$WRAPPER_PATH" <<'WRAP'
#!/usr/bin/env bash
set -euo pipefail

export OPENSSL_CONF="${OPENSSL_CONF:-/etc/ssl/openssl-phantom.cnf}"

if command -v phantomjs >/dev/null 2>&1; then
    export SENCHA_CMD_PHANTOMJS="$(command -v phantomjs)"
fi

exec "__SENCHA_CMD_BIN__" "$@"
WRAP

    local escaped
    escaped=$(printf '%s' "${CMD_HOME}/sencha" | sed 's/[\/&]/\\&/g')
    sed -i "s#__SENCHA_CMD_BIN__#${escaped}#" "$WRAPPER_PATH"

    chmod +x "$WRAPPER_PATH"
    log "Wrapper created at ${WRAPPER_PATH}. Add it to your PATH (export PATH=\"$HOME/bin:\$PATH\")."
}

ensure_path_export() {
    local shell_rc
    for shell_rc in "$HOME/.bashrc" "$HOME/.profile"; do
        [[ -f "$shell_rc" ]] || touch "$shell_rc"
        if ! grep -Fq 'export PATH="$HOME/bin:$PATH"' "$shell_rc"; then
            log "Adding PATH export to ${shell_rc}"
            printf '\n# Ensure Sencha wrapper is on PATH\nexport PATH="$HOME/bin:$PATH"\n' >> "$shell_rc"
        fi
    done
}

main() {
    log "Installing Sencha Cmd ${SENCHA_VERSION}"
    ensure_dependencies
    install_sencha_cmd
    ensure_openssl_compat
    install_phantomjs
    create_wrapper
    ensure_path_export
    log "Installation completed. Use '${WRAPPER_PATH}' for Sencha commands."
}

main "$@"
