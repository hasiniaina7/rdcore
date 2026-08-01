#!/usr/bin/env bash
# TESTÉ sur Ubuntu 24.04 : en cours de validation (2025-11-03)
set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "${BASE_DIR}/config/env.sh"
source "${BASE_DIR}/lib/common.sh"

CURRENT_LOG="${LOG_DIR}/50_freeradius.log"
STEP_NAME="50_freeradius"
FORCE=0

usage() {
  cat <<'EOT'
Usage: 50_freeradius.sh [--force]

Options:
  --force   Réexécute la configuration même si l'étape est marquée comme terminée.
EOT
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force)
      FORCE=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Option inconnue: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

require_root

if already_done "$STEP_NAME" && [[ "${FORCE}" -eq 0 ]]; then
  log INFO "Étape ${STEP_NAME} déjà marquée comme faite, on saute."
  exit 0
elif already_done "$STEP_NAME"; then
  log INFO "Étape ${STEP_NAME} déjà marquée comme faite, réexécution forcée."
fi

export DEBIAN_FRONTEND=noninteractive

log INFO "Installation de FreeRADIUS et de ses modules SQL."
apt-get install -y freeradius freeradius-mysql freeradius-utils \
  libdatetime-perl libdbd-mysql-perl libdigest-hmac-perl libdatetime-format-rfc3339-perl eapoltest

systemctl enable freeradius
systemctl stop radiusdesk-radius-health.timer 2>/dev/null || true
systemctl stop freeradius || true

RAD_TAR="/var/www/rdcore/cake4/rd_cake/setup/radius/freeradius-radiusdesk.tar.gz"
if [[ ! -f "${RAD_TAR}" ]]; then
  log ERROR "Archive ${RAD_TAR} introuvable, impossible de déployer la configuration RadiusDesk."
  exit 1
fi

if [[ -d /etc/freeradius && ! -d /etc/freeradius.orig ]]; then
  log INFO "Sauvegarde de /etc/freeradius vers /etc/freeradius.orig."
  mv /etc/freeradius /etc/freeradius.orig
fi

if [[ -d /etc/freeradius ]]; then
  log INFO "Nettoyage de l'arborescence FreeRADIUS actuelle."
  rm -rf /etc/freeradius
fi

log INFO "Extraction de la configuration RadiusDesk."
tar -xzf "${RAD_TAR}" -C /etc

log INFO "Ajustement des permissions FreeRADIUS."
chown -R freerad:freerad /etc/freeradius/3.0
chown freerad:www-data /etc/freeradius
chown freerad:www-data /etc/freeradius/3.0
chown freerad:www-data /etc/freeradius/3.0/dictionary
mkdir -p /var/run/freeradius
chown freerad:freerad /var/run/freeradius

SQL_CONF="/etc/freeradius/3.0/mods-available/sql"
if [[ ! -f "${SQL_CONF}" ]]; then
  log ERROR "Configuration SQL manquante (${SQL_CONF})."
  exit 1
fi

update_sql_conf() {
  local pattern="$1"
  local replacement="$2"
  perl -0pi -e "s/${pattern}/${replacement}/" "${SQL_CONF}"
}

ensure_radiusdesk_dynamic_expiration_attrs() {
  local dict_file="/etc/freeradius/3.0/dictionary_overrides/dictionary.radiusdesk"
  if [[ ! -f "${dict_file}" ]]; then
    log WARN "Dictionnaire RadiusDesk introuvable (${dict_file}), saut du durcissement dynamic expiration."
    return
  fi

  if ! grep -q '^ATTRIBUTE[[:space:]]\+Rd-Dynamic-Expiration[[:space:]]\+84[[:space:]]\+integer$' "${dict_file}"; then
    log INFO "Ajout de l'attribut Rd-Dynamic-Expiration dans ${dict_file}."
    cat >> "${dict_file}" <<'EOF'

#__ MAY 2026 -- Dynamic voucher expiration pilot
ATTRIBUTE Rd-Dynamic-Expiration 84 integer
EOF
  fi

  if ! grep -q '^ATTRIBUTE[[:space:]]\+Rd-Expiration-Unix[[:space:]]\+85[[:space:]]\+integer$' "${dict_file}"; then
    log INFO "Ajout de l'attribut Rd-Expiration-Unix dans ${dict_file}."
    cat >> "${dict_file}" <<'EOF'
ATTRIBUTE Rd-Expiration-Unix    85 integer
EOF
  fi
}

optimize_radiusdesk_usage_queries() {
  local radius_policy="/etc/freeradius/3.0/policy.d/radiusdesk"
  local legacy_created="UNIX_TIMESTAMP(created) >= %{control:Rd-Start-Time}"
  local legacy_timestamp="UNIX_TIMESTAMP(timestamp) >= %{control:Rd-Start-Time}"
  local created_count=0
  local timestamp_count=0

  if [[ ! -f "${radius_policy}" ]]; then
    log ERROR "Policy RadiusDesk introuvable (${radius_policy}), optimisation FUP impossible."
    exit 1
  fi

  # Count exact legacy expressions so an upstream policy change cannot be patched silently.
  created_count="$(awk -v needle="${legacy_created}" 'index($0, needle) { count++ } END { print count + 0 }' "${radius_policy}")"
  timestamp_count="$(awk -v needle="${legacy_timestamp}" 'index($0, needle) { count++ } END { print count + 0 }' "${radius_policy}")"

  if [[ "${created_count}" -eq 0 && "${timestamp_count}" -eq 0 ]]; then
    if grep -qF 'created >= FROM_UNIXTIME(%{control:Rd-Start-Time})' "${radius_policy}" \
      && grep -qF 'timestamp >= FROM_UNIXTIME(%{control:Rd-Start-Time})' "${radius_policy}"; then
      log INFO "Requêtes FUP déjà compatibles avec les index dans ${radius_policy}."
      return
    fi
    log ERROR "Expressions FUP attendues absentes; refus de modifier une policy inconnue."
    exit 1
  fi

  if [[ "${created_count}" -ne 5 || "${timestamp_count}" -ne 1 ]]; then
    log ERROR "Policy FUP inattendue: ${created_count} filtres created et ${timestamp_count} filtre timestamp (attendu: 5 et 1)."
    exit 1
  fi

  log INFO "Optimisation des filtres temporels FUP pour les index MariaDB."
  perl -0pi -e '
    s/UNIX_TIMESTAMP\(created\) >= %\{control:Rd-Start-Time\}/created >= FROM_UNIXTIME(%{control:Rd-Start-Time})/g;
    s/UNIX_TIMESTAMP\(timestamp\) >= %\{control:Rd-Start-Time\}/timestamp >= FROM_UNIXTIME(%{control:Rd-Start-Time})/g;
  ' "${radius_policy}"

  if grep -qF "${legacy_created}" "${radius_policy}" || grep -qF "${legacy_timestamp}" "${radius_policy}"; then
    log ERROR "Une expression FUP non indexable subsiste dans ${radius_policy}."
    exit 1
  fi
}

optimize_radiusdesk_fup_perl_query() {
  local fup_perl="/etc/freeradius/3.0/mods-config/perl/fup.pl"
  local legacy_query='FROM user_stats WHERE username=? AND timestamp >= ?'
  local optimized_query='FROM user_stats FORCE INDEX (us_username_timestamp) WHERE username=? AND timestamp >= FROM_UNIXTIME(?)'
  local legacy_execute="\$stmt_data_used->execute(\$RAD_REQUEST{'User-Name'},\$time_start->rfc3339);"
  local optimized_execute="\$stmt_data_used->execute(\$RAD_REQUEST{'User-Name'},\$time_start->epoch);"
  local legacy_query_count=0
  local optimized_query_count=0
  local legacy_execute_count=0
  local optimized_execute_count=0

  if [[ ! -f "${fup_perl}" ]]; then
    log ERROR "Module FUP Perl introuvable (${fup_perl}), optimisation impossible."
    exit 1
  fi

  legacy_query_count="$(grep -cF "${legacy_query}" "${fup_perl}" || true)"
  optimized_query_count="$(grep -cF "${optimized_query}" "${fup_perl}" || true)"
  legacy_execute_count="$(grep -cF "${legacy_execute}" "${fup_perl}" || true)"
  optimized_execute_count="$(grep -cF "${optimized_execute}" "${fup_perl}" || true)"

  if [[ "${optimized_query_count}" -eq 1 && "${optimized_execute_count}" -eq 1 \
    && "${legacy_query_count}" -eq 0 && "${legacy_execute_count}" -eq 0 ]]; then
    log INFO "Requête du module FUP Perl déjà optimisée et compatible avec les fuseaux horaires."
    return
  fi

  # Fail closed if upstream changes either half of this prepared-statement contract.
  if [[ "${legacy_query_count}" -ne 1 || "${legacy_execute_count}" -ne 1 \
    || "${optimized_query_count}" -ne 0 || "${optimized_execute_count}" -ne 0 ]]; then
    log ERROR "Structure FUP Perl inattendue; refus d'appliquer une transformation partielle."
    exit 1
  fi

  log INFO "Optimisation de la requête FUP Perl avec epoch et index temporel dédié."
  LEGACY_QUERY="${legacy_query}" OPTIMIZED_QUERY="${optimized_query}" \
    LEGACY_EXECUTE="${legacy_execute}" OPTIMIZED_EXECUTE="${optimized_execute}" \
    perl -0pi -e '
      s/\Q$ENV{LEGACY_QUERY}\E/$ENV{OPTIMIZED_QUERY}/g;
      s/\Q$ENV{LEGACY_EXECUTE}\E/$ENV{OPTIMIZED_EXECUTE}/g;
    ' "${fup_perl}"

  if [[ "$(grep -cF "${optimized_query}" "${fup_perl}" || true)" -ne 1 \
    || "$(grep -cF "${optimized_execute}" "${fup_perl}" || true)" -ne 1 \
    || "$(grep -cF "${legacy_query}" "${fup_perl}" || true)" -ne 0 \
    || "$(grep -cF "${legacy_execute}" "${fup_perl}" || true)" -ne 0 ]]; then
    log ERROR "Validation de la requête FUP Perl optimisée échouée."
    exit 1
  fi
}

harden_freeradius_resource_limits() {
  local radius_conf="/etc/freeradius/3.0/radiusd.conf"
  local override_dir="/etc/systemd/system/freeradius.service.d"
  local override_file="${override_dir}/20-radiusdesk-resource-guard.conf"

  if [[ ! -f "${radius_conf}" ]]; then
    log ERROR "Configuration FreeRADIUS introuvable (${radius_conf}), limites de ressources impossibles."
    exit 1
  fi

  # Eight workers are sufficient for two CPUs and keep Perl interpreters within 2 GiB RAM.
  perl -0pi -e '
    s/^[ \t]*start_servers[ \t]*=[ \t]*\d+[ \t]*$/\tstart_servers = 2/m;
    s/^[ \t]*max_servers[ \t]*=[ \t]*\d+[ \t]*$/\tmax_servers = 8/m;
    s/^[ \t]*min_spare_servers[ \t]*=[ \t]*\d+[ \t]*$/\tmin_spare_servers = 2/m;
    s/^[ \t]*max_spare_servers[ \t]*=[ \t]*\d+[ \t]*$/\tmax_spare_servers = 4/m;
    s/^[ \t]*#[ \t]*max_queue_size[ \t]*=[ \t]*65536[ \t]*$/\tmax_queue_size = 1024/m;
    s/^[ \t]*max_requests_per_server[ \t]*=[ \t]*\d+[ \t]*$/\tmax_requests_per_server = 5000/m;
  ' "${radius_conf}"

  for expected in \
    'start_servers = 2' \
    'max_servers = 8' \
    'min_spare_servers = 2' \
    'max_spare_servers = 4' \
    'max_queue_size = 1024' \
    'max_requests_per_server = 5000'; do
    if [[ "$(grep -cF "${expected}" "${radius_conf}")" -ne 1 ]]; then
      log ERROR "Limite FreeRADIUS absente ou ambiguë après génération: ${expected}."
      exit 1
    fi
  done

  install -d -m 0755 "${override_dir}"
  cat > "${override_file}" <<'EOF'
[Unit]
StartLimitIntervalSec=300
StartLimitBurst=5

[Service]
# Keep the normal eight-worker footprint below the throttling threshold.
# The hard cap still prevents a Perl/FUP regression from exhausting the host.
MemoryHigh=512M
MemoryMax=576M
RestartSec=15s
EOF
  chmod 0644 "${override_file}"
  systemctl daemon-reload
  log INFO "Pool FreeRADIUS borné à 8 workers; seuil souple 512 Mio et limite dure 576 Mio."
}

install_freeradius_health_monitor() {
  local monitoring_dir="${BASE_DIR}/templates/monitoring"
  local snapshot_source="${monitoring_dir}/radiusdesk-radius-health-snapshot"
  local report_source="${monitoring_dir}/radiusdesk-radius-health-report"
  local service_source="${monitoring_dir}/radiusdesk-radius-health.service"
  local timer_source="${monitoring_dir}/radiusdesk-radius-health.timer"

  for required_file in \
    "${snapshot_source}" "${report_source}" "${service_source}" "${timer_source}"; do
    if [[ ! -f "${required_file}" ]]; then
      log ERROR "Template de surveillance manquant: ${required_file}."
      exit 1
    fi
  done

  log INFO "Installation de la surveillance FreeRADIUS compacte avec rétention de 12 heures."
  install -D -m 0755 "${snapshot_source}" /usr/local/sbin/radiusdesk-radius-health-snapshot
  install -D -m 0755 "${report_source}" /usr/local/sbin/radiusdesk-radius-health-report
  install -D -m 0644 "${service_source}" /etc/systemd/system/radiusdesk-radius-health.service
  install -D -m 0644 "${timer_source}" /etc/systemd/system/radiusdesk-radius-health.timer
  install -d -m 0750 /var/log/radiusdesk-radius-health /var/lib/radiusdesk-radius-health
  systemctl daemon-reload
  systemctl enable radiusdesk-radius-health.timer
}

localize_radiusdesk_reply_messages() {
  local radius_policy="/etc/freeradius/3.0/policy.d/radiusdesk"
  local perl_dir="/etc/freeradius/3.0/mods-config/perl"

  if [[ ! -f "${radius_policy}" ]]; then
    log WARN "Policy RadiusDesk introuvable (${radius_policy}), localisation Reply-Message ignoree."
    return
  fi

  log INFO "Localisation en francais des Reply-Message RadiusDesk."

  perl -0pi -e '
    s/Reply-Message := "NAS-Identifier %\{request:NAS-Identifier\} is disabled"/Reply-Message := "NAS-Identifier %\{request:NAS-Identifier\} est desactive"/g;
    s/Reply-Message := "Called-Station-Id %\{request:Called-Station-Id\} is disabled"/Reply-Message := "Called-Station-Id %\{request:Called-Station-Id\} est desactive"/g;
    s/Reply-Message := "RADIUS client not allowed\. Contact server administrator"/Reply-Message := "Client RADIUS non autorise. Contactez l administrateur du serveur"/g;
    s/Reply-Message := "The time for voucher %\{request:User-Name\} is depleted"/Reply-Message := "Le temps du voucher %\{request:User-Name\} est epuise"/g;
    s/Reply-Message := "User %\{request:User-Name\} belongs to realm %\{control:Rd-Realm\} which cannot connect to %\{request:NAS-Identifier\}"/Reply-Message := "L utilisateur %\{request:User-Name\} appartient au realm %\{control:Rd-Realm\}, non autorise sur %\{request:NAS-Identifier\}"/g;
    s/Reply-Message := "User %\{request:User-Name\} belongs to realm %\{control:Rd-Realm\} which cannot connect to %\{request:NAS-IP-Address\}"/Reply-Message := "L utilisateur %\{request:User-Name\} appartient au realm %\{control:Rd-Realm\}, non autorise sur %\{request:NAS-IP-Address\}"/g;
    s/Reply-Message := "User %\{request:User-Name\} has not permission to connect through SSID: %\{control:Rd-Ssid-Value\}"/Reply-Message := "L utilisateur %\{request:User-Name\} n est pas autorise a se connecter via le SSID : %\{control:Rd-Ssid-Value\}"/g;
    s/Reply-Message := "No SSID available to evaluate SSID restriction"/Reply-Message := "Aucun SSID disponible pour evaluer la restriction SSID"/g;
    s/Reply-Message := "User %\{request:User-Name\} account disabled"/Reply-Message := "Compte %\{request:User-Name\} desactive"/g;
    s/Reply-Message := "User %\{request:User-Name\} account suspended"/Reply-Message := "Compte %\{request:User-Name\} suspendu"/g;
    s/Reply-Message := "User %\{request:User-Name\} account terminated"/Reply-Message := "Compte %\{request:User-Name\} resilie"/g;
    s/Reply-Message := "User %\{request:User-Name\} invalid admin state: %\{control:Rd-Admin-State\}"/Reply-Message := "Etat administratif invalide pour %\{request:User-Name\} : %\{control:Rd-Admin-State\}"/g;
    s/Reply-Message := "User %\{request:User-Name\} not registered"/Reply-Message := "Utilisateur %\{request:User-Name\} non enregistre"/g;
    s/Reply-Message := "User %\{request:User-Name\} are not allowed to connect with a device containing MAC %\{request:Calling-Station-Id\}"/Reply-Message := "L utilisateur %\{request:User-Name\} n est pas autorise a se connecter avec l appareil MAC %\{request:Calling-Station-Id\}"/g;
    s/Reply-Message := "Max Daily Sessions Reached"/Reply-Message := "Nombre maximal de sessions journalieres atteint"/g;
    s/Reply-Message := "Max Monthly Sessions Reached"/Reply-Message := "Nombre maximal de sessions mensuelles atteint"/g;
    s/Reply-Message := "Most likely PEAP failure\. Run in debug"/Reply-Message := "Echec PEAP probable. Lancez FreeRADIUS en mode debug"/g;
    s/Reply-Message := "Simultaneous connections limited to %\{control:Simultaneous-Use\}"/Reply-Message := "Connexions simultanees limitees a %\{control:Simultaneous-Use\}"/g;
  ' "${radius_policy}" \
    /etc/freeradius/3.0/sites-available/radiusdesk-default \
    /etc/freeradius/3.0/sites-available/radiusdesk-plain

  for perl_file in \
    "${perl_dir}/client_check_usage.pl" \
    "${perl_dir}/logintime.pl" \
    "${perl_dir}/check_usage_time.pl" \
    "${perl_dir}/client_check_usage_data.pl" \
    "${perl_dir}/check_usage.pl" \
    "${perl_dir}/check_usage_data.pl" \
    "${perl_dir}/check_activation.pl" \
    "${perl_dir}/fup.pl" \
    "${perl_dir}/ppsk.pl"; do
    [[ -f "${perl_file}" ]] || continue
    perl -0pi -e '
      my @pairs = (
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Sorry.. the router has reached its monthly data limit";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Le routeur a atteint sa limite mensuelle de donnees";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Not Available To Use On " . $dt->day_name . " at " . $dt->hms('\'':'\'');!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Non disponible le " . $dt->day_name . " a " . $dt->hms('\'':'\'');!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Not Available To Use On ".$dt->day_name." at ".$dt->hms('\'':'\'');!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Non disponible le ".$dt->day_name." a ".$dt->hms('\'':'\'');!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Maximum $RAD_CHECK{'\''Rd-Reset-Type-Time'\''} usage exceeded";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Quota temps $RAD_CHECK{'\''Rd-Reset-Type-Time'\''} atteint";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Maximum $RAD_CHECK{'\''Rd-Reset-Type-Data'\''} usage exceeded";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Quota donnees $RAD_CHECK{'\''Rd-Reset-Type-Data'\''} atteint";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Maximum $RAD_CHECK{'\''Rd-Reset-Type'\''} usage exceeded";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Quota $RAD_CHECK{'\''Rd-Reset-Type'\''} atteint";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Maximum usage exceeded";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Quota d utilisation atteint";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Sorry... you have used your  $RAD_CHECK{'\''Rd-Reset-Type-Data'\''} data allowance";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Quota de donnees $RAD_CHECK{'\''Rd-Reset-Type-Data'\''} utilise";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Sorry... you have used all your data allowance ";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Vous avez utilise tout votre quota de donnees";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Account activate on ".$RAD_CHECK{'\''Rd-Account-Activation-Time'\''};!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Compte actif a partir de ".$RAD_CHECK{'\''Rd-Account-Activation-Time'\''};!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Denied access by rlm_perl function";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Acces refuse par la fonction rlm_perl";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "$row->{'\''if_condition'\''} of $row->{'\''data_amount'\''}$row->{'\''data_unit'\''} reached";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Limite ".$row->{'\''if_condition'\''}." de ".$row->{'\''data_amount'\''}.$row->{'\''data_unit'\''}." atteinte";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Required Request Attributes Missing";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Attributs obligatoires de la requete manquants";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Missing SSID in Called-Station-Id";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "SSID manquant dans Called-Station-Id";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "No PPSK Match Found";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Aucune correspondance PPSK trouvee";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Missing Cleartext Password For $row->{'\''username'\''}";!,
        q!$RAD_REPLY{'\''Reply-Message'\''} = "Mot de passe Cleartext manquant pour $row->{'\''username'\''}";!,
      );
      while (@pairs) {
        my $from = shift @pairs;
        my $to = shift @pairs;
        s/\Q$from\E/$to/g;
      }
    ' "${perl_file}"
  done
}

harden_radiusdesk_voucher_data_never_counter() {
  local radius_policy="/etc/freeradius/3.0/policy.d/radiusdesk"
  local marker="#__ JUNE 2026 -- Voucher never data quota uses user_stats"

  if [[ ! -f "${radius_policy}" ]]; then
    log WARN "Policy RadiusDesk introuvable (${radius_policy}), durcissement quota data voucher ignore."
    return
  fi

  if grep -qF "${marker}" "${radius_policy}"; then
    log INFO "Durcissement quota data voucher deja present dans ${radius_policy}."
    return
  fi

  log INFO "Application du durcissement quota data voucher reset=never dans ${radius_policy}."

  perl -0pi -e "$(cat <<'PERL'
    my $replacement = <<'RADIUSDESK_POLICY';
        # Avoid reset-time helpers for "never"; always use total historical usage.
        #__ JUNE 2026 -- Voucher never data quota uses user_stats
        if(&control:Rd-Reset-Type-Data == 'never'){
            if(&control:Rd-User-Type == 'voucher'){
                if((&control:Rd-Mac-Counter-Data)&&(&request:Calling-Station-Id)){
                    update control {
                        Rd-Used-Data := "%{sql:SELECT IFNULL(SUM(acctinputoctets + acctoutputoctets), 0) FROM user_stats WHERE username='%{request:User-Name}' AND callingstationid='%{request:Calling-Station-Id}'}"
                    }
                }
                else{
                    update control {
                        Rd-Used-Data := "%{sql:SELECT IFNULL(SUM(acctinputoctets + acctoutputoctets), 0) FROM user_stats WHERE username='%{request:User-Name}'}"
                    }
                }
            }
            else{
                #Get the total usage of the user
                if(&control:Rd-Tmp-Avail-Data){ #This indicates it it a device!
                    update control {
                        Rd-Used-Data := "%{sql:SELECT IFNULL(SUM(acctinputoctets)+SUM(acctoutputoctets),0) FROM radacct_history WHERE callingstationid='%{request:User-Name}'}"
                    }
                }
                else{
                    if((&control:Rd-Mac-Counter-Data)&&(&request:Calling-Station-Id)){
                        update control {
                            Rd-Used-Data := "%{sql:SELECT IFNULL(SUM(acctinputoctets)+SUM(acctoutputoctets),0) FROM radacct_history WHERE username='%{request:User-Name}' AND callingstationid='%{request:Calling-Station-Id}'}"
                        }
                    }
                    else{
                        update control {
                            Rd-Used-Data := "%{sql:SELECT IFNULL(SUM(acctinputoctets)+SUM(acctoutputoctets),0) FROM radacct_history WHERE username='%{request:User-Name}'}"
                        }
                    }
                }
            }
        } else {
RADIUSDESK_POLICY
    my $count = s{        \# Avoid reset-time helpers for "never"; always use total historical usage\.\n        if\(&control:Rd-Reset-Type-Data == 'never'\)\{\n            \#Get the total usage of the user\n            if\(&control:Rd-Tmp-Avail-Data\)\{ \#This indicates it it a device!\n                update control \{\n                    Rd-Used-Data := "%\{sql:SELECT IFNULL\(SUM\(acctinputoctets\)\+SUM\(acctoutputoctets\),0\) FROM radacct_history WHERE callingstationid='%\{request:User-Name\}'\}"\n                \}\n            \}\n            else\{\n                if\(\(&control:Rd-Mac-Counter-Data\)&&\(&request:Calling-Station-Id\)\)\{\n                    update control \{\n                        Rd-Used-Data := "%\{sql:SELECT IFNULL\(SUM\(acctinputoctets\)\+SUM\(acctoutputoctets\),0\) FROM radacct_history WHERE username='%\{request:User-Name\}' AND callingstationid='%\{request:Calling-Station-Id\}'\}"\n                    \}\n                \}\n                else\{\n                    update control \{\n                        Rd-Used-Data := "%\{sql:SELECT IFNULL\(SUM\(acctinputoctets\)\+SUM\(acctoutputoctets\),0\) FROM radacct_history WHERE username='%\{request:User-Name\}'\}"\n                    \}\n                \}\n            \}\n        \} else \{\n}{$replacement};
    die "RADIUSdesk_data_counter reset=never block not found\n" unless $count == 1;
PERL
  )" "${radius_policy}" || {
    log ERROR "Echec du durcissement quota data voucher dans ${radius_policy}."
    exit 1
  }
}

ensure_mikrotik_burst_policy() {
  local perl_dir="/etc/freeradius/3.0/mods-config/perl"
  local mods_available="/etc/freeradius/3.0/mods-available"
  local mods_enabled="/etc/freeradius/3.0/mods-enabled"
  local radius_policy="/etc/freeradius/3.0/policy.d/radiusdesk"
  local default_site="/etc/freeradius/3.0/sites-available/radiusdesk-default"
  local plain_site="/etc/freeradius/3.0/sites-available/radiusdesk-plain"
  local fup_file="${perl_dir}/fup.pl"

  mkdir -p "${perl_dir}" "${mods_available}" "${mods_enabled}"

  log INFO "Activation du burst Mikrotik derive des attributs WISPr, sans modifier Omada."

  cat > "${mods_available}/pl_mikrotik_burst" <<'EOF'
perl pl_mikrotik_burst {
	filename = ${modconfdir}/perl/mikrotik_burst.pl
}
EOF

  cat > "${perl_dir}/mikrotik_burst.pl" <<'EOF'
use strict;
use warnings;

use constant RLM_MODULE_OK => 2;
use constant RLM_MODULE_NOOP => 7;

our (%RAD_REQUEST, %RAD_REPLY, %RAD_CHECK);

my $DEFAULT_BURST_LIMIT_PERCENT = 100;
my $DEFAULT_BURST_THRESHOLD_PERCENT = 100;
my $DEFAULT_BURST_TIME = 30;

sub authorize { return RLM_MODULE_NOOP; }
sub authenticate { return RLM_MODULE_NOOP; }
sub accounting { return RLM_MODULE_NOOP; }
sub preacct { return RLM_MODULE_NOOP; }
sub detach { return RLM_MODULE_OK; }

sub post_auth {
    return RLM_MODULE_NOOP if defined $RAD_REPLY{'Mikrotik-Rate-Limit'};
    return RLM_MODULE_NOOP if !defined $RAD_CHECK{'Tmp-String-0'};
    return RLM_MODULE_NOOP if $RAD_CHECK{'Tmp-String-0'} ne 'Mikrotik-API';
    return RLM_MODULE_NOOP if !defined $RAD_REPLY{'WISPr-Bandwidth-Max-Up'};
    return RLM_MODULE_NOOP if !defined $RAD_REPLY{'WISPr-Bandwidth-Max-Down'};

    my $up_bps = int($RAD_REPLY{'WISPr-Bandwidth-Max-Up'});
    my $down_bps = int($RAD_REPLY{'WISPr-Bandwidth-Max-Down'});
    return RLM_MODULE_NOOP if $up_bps <= 0 || $down_bps <= 0;

    my ($up_value, $up_suffix) = _format_mikrotik_rate($up_bps);
    my ($down_value, $down_suffix) = _format_mikrotik_rate($down_bps);

    my $burst_up = int($up_value + ($up_value * ($DEFAULT_BURST_LIMIT_PERCENT / 100)));
    my $burst_down = int($down_value + ($down_value * ($DEFAULT_BURST_LIMIT_PERCENT / 100)));
    my $threshold_up = int($up_value * ($DEFAULT_BURST_THRESHOLD_PERCENT / 100));
    my $threshold_down = int($down_value * ($DEFAULT_BURST_THRESHOLD_PERCENT / 100));

    $RAD_REPLY{'Mikrotik-Rate-Limit'} =
        "$up_value$up_suffix/$down_value$down_suffix " .
        "$burst_up$up_suffix/$burst_down$down_suffix " .
        "$threshold_up$up_suffix/$threshold_down$down_suffix " .
        "$DEFAULT_BURST_TIME/$DEFAULT_BURST_TIME";

    return RLM_MODULE_OK;
}

sub _format_mikrotik_rate {
    my ($bps) = @_;
    my $value = int($bps);
    my $suffix = '';

    if (($value / 1024) >= 1) {
        $value = $value / 1024;
        $suffix = 'k';
    }
    if (($value / 1024) >= 1) {
        $value = $value / 1024;
        $suffix = 'M';
    }

    return (int($value), $suffix);
}
EOF

  ln -sf ../mods-available/pl_mikrotik_burst "${mods_enabled}/pl_mikrotik_burst"

  if [[ -f "${fup_file}" ]]; then
    perl -0pi -e "$(cat <<'PERL'
      s/SELECT type FROM dynamic_clients WHERE nasidentifier=\?/SELECT type FROM dynamic_clients WHERE nasidentifier=?\n        UNION\n        SELECT type FROM nas WHERE (nasidentifier=? AND nasidentifier <> '') OR nasname=?\n        LIMIT 1/g;
      s/\$client_type = 'Mikrotik-API'; \#Maybe future feature to decide what to reply .../\$client_type = 'other';/g;
      s/\$stmt_nas_type->execute\(\$RAD_REQUEST\{'NAS-Identifier'\}\);\n        my \$r_nas_type = \$stmt_nas_type->fetchrow_hashref\(\);\n        if\(\$r_nas_type\)\{\n            \$client_type = \$r_nas_type->\{'type'\};\n        \}   /\$stmt_nas_type->execute\(\$RAD_REQUEST\{'NAS-Identifier'\}, \$RAD_REQUEST\{'NAS-Identifier'\}, \$RAD_REQUEST\{'NAS-IP-Address'\} \/\/ ''\);\n        my \$r_nas_type = \$stmt_nas_type->fetchrow_hashref\(\);\n        if\(\$r_nas_type\)\{\n            \$client_type = \$r_nas_type->\{'type'\};\n        \}   /g;
      s/(\n    if \(defined \$RAD_REQUEST\{'NAS-Identifier'\} && length \$RAD_REQUEST\{'NAS-Identifier'\} > 0\) \{\n        _ensure_dbh\(\) or return RLM_MODULE_FAIL;\n        \$stmt_nas_type->execute\(\$RAD_REQUEST\{'NAS-Identifier'\}, \$RAD_REQUEST\{'NAS-Identifier'\}, \$RAD_REQUEST\{'NAS-IP-Address'\} \/\/ ''\);\n        my \$r_nas_type = \$stmt_nas_type->fetchrow_hashref\(\);\n        if\(\$r_nas_type\)\{\n            \$client_type = \$r_nas_type->\{'type'\};\n        \}   \n    \})/$1\n    elsif (defined \$RAD_REQUEST{'NAS-IP-Address'} && length \$RAD_REQUEST{'NAS-IP-Address'} > 0) {\n        _ensure_dbh() or return RLM_MODULE_FAIL;\n        \$stmt_nas_type->execute('', '', \$RAD_REQUEST{'NAS-IP-Address'});\n        my \$r_nas_type = \$stmt_nas_type->fetchrow_hashref();\n        if(\$r_nas_type){\n            \$client_type = \$r_nas_type->{'type'};\n        }\n    }/s unless /elsif \(defined \$RAD_REQUEST\{'NAS-IP-Address'\}/;
      s/if\(\$RAD_CONFIG\{'Rd-Fup-Burst-Limit'\}\)\{/if(1){/g;
      s/my \$burst_down = int\(\$down_value\+\(\$down_value\*\(\$RAD_CONFIG\{'Rd-Fup-Burst-Limit'\}\/100\)\)\);\n            my \$burst_up   = int\(\$up_value\+\(\$up_value\*\(\$RAD_CONFIG\{'Rd-Fup-Burst-Limit'\}\/100\)\)\);/my \$burst_limit = \$RAD_CONFIG{'Rd-Fup-Burst-Limit'} \/\/ 100;\n            my \$burst_threshold = \$RAD_CONFIG{'Rd-Fup-Burst-Threshold'} \/\/ 100;\n            my \$burts_time = \$RAD_CONFIG{'Rd-Fup-Burst-Time'} \/\/ 30;\n            my \$burst_down = int\(\$down_value+\(\$down_value*\(\$burst_limit\/100\)\)\);\n            my \$burst_up   = int\(\$up_value+\(\$up_value*\(\$burst_limit\/100\)\)\);/g;
      s/my \$burst_up_th= int\(\$down_value\+\(\$down_value\*\(\$RAD_CONFIG\{'Rd-Fup-Burst-Threshold'\}\/100\)\)\);/my \$burst_up_th= int\(\$up_value*\(\$burst_threshold\/100\)\);/g;
      s/my \$burst_down_th= int\(\$up_value\+\(\$up_value\*\(\$RAD_CONFIG\{'Rd-Fup-Burst-Threshold'\}\/100\)\)\);/my \$burst_down_th= int\(\$down_value*\(\$burst_threshold\/100\)\);/g;
      s/my \$burst_up_th= int\(\$up_value\*\(\$RAD_CONFIG\{'Rd-Fup-Burst-Threshold'\}\/100\)\);/my \$burst_up_th= int\(\$up_value*\(\$burst_threshold\/100\)\);/g;
      s/my \$burst_down_th= int\(\$down_value\*\(\$RAD_CONFIG\{'Rd-Fup-Burst-Threshold'\}\/100\)\);/my \$burst_down_th= int\(\$down_value*\(\$burst_threshold\/100\)\);/g;
      s/\n            my \$burts_time = \$RAD_CONFIG\{'Rd-Fup-Burst-Time'\};//g;
      s/\$RAD_REPLY\{'Mikrotik-Rate-Limit'\} = "\$up_value\$up_suffix\/\$down_value\$down_suffix \$burst_up\$up_suffix\/\$burst_down\$up_suffix \$burst_up_th\$up_suffix\/\$burst_down_th\$up_suffix \$burts_time\/\$burts_time";/\$RAD_REPLY\{'Mikrotik-Rate-Limit'\} = "\$up_value\$up_suffix\/\$down_value\$down_suffix \$burst_up\$up_suffix\/\$burst_down\$down_suffix \$burst_up_th\$up_suffix\/\$burst_down_th\$down_suffix \$burts_time\/\$burts_time";/g;
PERL
    )" "${fup_file}"
  fi

  if [[ -f "${radius_policy}" ]]; then
    if ! grep -q 'RADIUSdesk_mikrotik_burst' "${radius_policy}"; then
      perl -0pi -e 's/(RADIUSdesk_auto_devices_check\n)/$1    RADIUSdesk_mikrotik_burst\n/' "${radius_policy}"
      perl -0pi -e 's/\n\nRADIUSdesk_preacct \{/\n\nRADIUSdesk_mikrotik_burst {\n    if((&reply:WISPr-Bandwidth-Max-Up)&&(&reply:WISPr-Bandwidth-Max-Down)&&(!&reply:Mikrotik-Rate-Limit)){\n        update control {\n            Tmp-String-0 := "%{sql:SELECT IFNULL((SELECT type FROM nas WHERE (nasidentifier='\''%{request:NAS-Identifier}'\'' AND nasidentifier <> '\'''\'') OR nasname='\''%{request:NAS-IP-Address}'\'' LIMIT 1),'\'''\'')}"\n        }\n        pl_mikrotik_burst\n    }\n}\n\nRADIUSdesk_preacct {/s' "${radius_policy}"
    fi
  else
    log WARN "Policy RadiusDesk introuvable (${radius_policy}), burst Mikrotik non insere dans la policy."
  fi

  if [[ -f "${default_site}" ]] && ! grep -q '^[[:space:]]*pl_mikrotik_burst[[:space:]]*$' "${default_site}"; then
    perl -0pi -e 's/(\n\s*RADIUSdesk\n\n\s*#\n\s*#  Access-Reject)/\n\tRADIUSdesk\n\tpl_mikrotik_burst\n\n\t#\n\t#  Access-Reject/s' "${default_site}"
  fi
  if [[ -f "${plain_site}" ]] && ! grep -q '^[[:space:]]*pl_mikrotik_burst[[:space:]]*$' "${plain_site}"; then
    perl -0pi -e 's/(\n\s*RADIUSdesk\s*\n\s*Post-Auth-Type REJECT)/\n        RADIUSdesk       \n        pl_mikrotik_burst\n        Post-Auth-Type REJECT/s' "${plain_site}"
  fi
}

update_sql_conf 'server = "[^"]*"' "server = \"${DB_HOST}\""
if [[ "${DB_PORT}" != "3306" ]]; then
  if grep -q '^\s*#\s*port = 3306' "${SQL_CONF}"; then
    perl -0pi -e "s/^\s*#\s*port = 3306/    port = ${DB_PORT}/" "${SQL_CONF}"
  elif grep -q '^\s*port = ' "${SQL_CONF}"; then
    update_sql_conf 'port = [0-9]+' "port = ${DB_PORT}"
  else
    perl -0pi -e "s/(server = \"${DB_HOST}\")/\$1\n    port = ${DB_PORT}/" "${SQL_CONF}"
  fi
fi
update_sql_conf 'login = "[^"]*"' "login = \"${DB_USER}\""
update_sql_conf 'password = "[^"]*"' "password = \"${DB_PASS}\""
update_sql_conf 'radius_db = "[^"]*"' "radius_db = \"${DB_NAME}\""

ln -sf "${SQL_CONF}" /etc/freeradius/3.0/mods-enabled/sql

DYN_CLIENTS="/etc/freeradius/3.0/sites-available/dynamic-clients"
if [[ -f "${DYN_CLIENTS}" ]]; then
  perl -0pi -e "s/(&FreeRADIUS-Client-Secret = \")[^\"]*(\")/\$1${RADIUS_SECRET_DEFAULT}\$2/" "${DYN_CLIENTS}"
  perl -0pi -e 's/(&FreeRADIUS-Client-Require-MA = )\w+/\1yes/' "${DYN_CLIENTS}"
  if [[ "${RADIUS_CLIENT_NET}" != "0.0.0.0/0" ]]; then
    if grep -q '^\s*#\s*ipaddr = 192\.0\.2\.0/24' "${DYN_CLIENTS}"; then
      perl -0pi -e "s/^\s*#\s*ipaddr = 192\.0\.2\.0\/24/ipaddr = ${RADIUS_CLIENT_NET}/" "${DYN_CLIENTS}"
    elif grep -q '^\s*ipaddr = ' "${DYN_CLIENTS}"; then
      perl -0pi -e "s/^\s*ipaddr = .*/    ipaddr = ${RADIUS_CLIENT_NET}/" "${DYN_CLIENTS}"
    fi
  fi
else
  log WARN "Fichier dynamic-clients introuvable, vérifiez l'archive."
fi

ln -sf ../sites-available/dynamic-clients /etc/freeradius/3.0/sites-enabled/dynamic-clients

DEFAULT_SITE="/etc/freeradius/3.0/sites-available/default"
INNER_TUNNEL="/etc/freeradius/3.0/sites-available/inner-tunnel"
for site in "${DEFAULT_SITE}" "${INNER_TUNNEL}"; do
  if [[ -f "${site}" ]]; then
    perl -0pi -e 's/^(\s*)filter_username/\1# filter_username/m' "${site}" || true
    ln -sf "${site}" "/etc/freeradius/3.0/sites-enabled/$(basename "${site}")"
  fi
done

CLIENTS_CONF="/etc/freeradius/3.0/clients.conf"
if [[ -f "${CLIENTS_CONF}" ]]; then
  perl -0pi -e 's/(client\s+localhost\s*\{[^}]*?require_message_authenticator\s*=\s*)\w+/\1yes/si' "${CLIENTS_CONF}"
fi

ensure_radiusdesk_dynamic_expiration_attrs
optimize_radiusdesk_usage_queries
optimize_radiusdesk_fup_perl_query
harden_freeradius_resource_limits
install_freeradius_health_monitor
localize_radiusdesk_reply_messages
harden_radiusdesk_voucher_data_never_counter
ensure_mikrotik_burst_policy

mkdir -p /var/log/freeradius/sqltrace
chown -R freerad:freerad /var/log/freeradius

log INFO "Vérification de la configuration FreeRADIUS."
freeradius -C || { log ERROR "freeradius -C a échoué."; exit 1; }

log INFO "Redémarrage de FreeRADIUS."
systemctl restart freeradius

log INFO "Activation et validation de la surveillance FreeRADIUS."
systemctl enable --now radiusdesk-radius-health.timer
systemctl start radiusdesk-radius-health.service
systemctl is-active --quiet radiusdesk-radius-health.timer \
  || { log ERROR "Timer de surveillance FreeRADIUS inactif."; exit 1; }
[[ -s /var/log/radiusdesk-radius-health/samples.tsv ]] \
  || { log ERROR "Premier échantillon de surveillance absent."; exit 1; }

mark_done "$STEP_NAME"
log INFO "Étape ${STEP_NAME} terminée."
