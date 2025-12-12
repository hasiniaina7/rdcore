import React, { useEffect, useMemo, useState } from "react";
import "../styles/infoconso.css";
import { login, fetchConsumption } from "../modules/usage/api/consumption.api";
import { LoginType, ConsumptionData, LoginPayload } from "../modules/usage/types";
import { formatBytes } from "../modules/usage/utils";
import { LoginSwitcher } from "../modules/usage/components/LoginSwitcher";
import { VoucherLoginForm } from "../modules/usage/components/VoucherLoginForm";
import { UserLoginForm } from "../modules/usage/components/UserLoginForm";
import { QuotaCard } from "../modules/usage/components/QuotaCard";
import { StatusPeriodCard } from "../modules/usage/components/StatusPeriodCard";
import { RecentActivityCard } from "../modules/usage/components/RecentActivityCard";
import { PeriodsCard } from "../modules/usage/components/PeriodsCard";
import { SeriesChartCard } from "../modules/usage/components/SeriesChartCard";
import { SessionsTableCard } from "../modules/usage/components/SessionsTableCard";

function HeaderBadge({ label }: { label: string }) {
  return <span className="ic-badge muted">{label}</span>;
}

const iconStroke = "#2563eb";

const IconData = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M7 9h10" />
    <path d="M7 13h6" />
  </svg>
);

const IconTime = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export default function InfoconsoPage() {
  const [view, setView] = useState<"login" | "dashboard">("login");
  const [loginType, setLoginType] = useState<LoginType>("voucher");
  const [voucherCode, setVoucherCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "error" | "success" | "info"; message: string } | null>(null);
  const [consumption, setConsumption] = useState<ConsumptionData | null>(null);
  const [lastLogin, setLastLogin] = useState<LoginPayload | null>(null);
  const SESSION_KEY = "infoconso-session";
  const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

  const persistSession = (payload: LoginPayload) => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ payload, ts: Date.now() }));
    } catch {
      // ignore storage errors
    }
  };

  const clearSession = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (import.meta.env.MODE === "test") return;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { payload: LoginPayload; ts: number };
      if (!parsed?.payload || !parsed?.ts) return;
      if (Date.now() - parsed.ts > SESSION_TTL_MS) {
        clearSession();
        return;
      }
      if (parsed.payload.type === "voucher") {
        setLoginType("voucher");
        setVoucherCode(parsed.payload.code);
      } else {
        setLoginType("user");
        setUsername(parsed.payload.username);
        setPassword(parsed.payload.password);
      }
      handleLogin(parsed.payload);
    } catch {
      // ignore parsing errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (directPayload?: LoginPayload) => {
    try {
      setLoading(true);
      setError(null);
      setNotice(null);

      const payload: LoginPayload =
        directPayload ??
        (loginType === "voucher" ? { type: "voucher", code: voucherCode } : { type: "user", username, password });

      if (payload.type === "user") {
        if (!payload.username || !payload.password) {
          setError("Username et mot de passe requis.");
          setLoading(false);
          return;
        }
      } else if (!payload.code) {
        setError("Veuillez saisir un code.");
        setLoading(false);
        return;
      }

      const data = await login(payload);
      setConsumption(data);
      setLastLogin(payload);
      persistSession(payload);
      setView("dashboard");
      setNotice({ type: "success", message: "Connexion réussie." });
    } catch (err) {
      const message = (err as Error).message || "Erreur inconnue";
      setError(message);
      setNotice({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  const resetAccount = () => {
    setView("login");
    setConsumption(null);
    setPassword("");
    setUsername("");
    setError(null);
    clearSession();
  };

  const disconnectSessions = (ids: number[]) => {
    setConsumption((prev) => {
      if (!prev) return prev;
      const filtered = prev.activeSessions.sessions.filter((s) => !ids.includes(s.radacctid));
      return {
        ...prev,
        activeSessions: {
          ...prev.activeSessions,
          sessions: filtered,
          totalCount: filtered.length,
          radiusdeskTotal: filtered.length,
        },
      };
    });
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      setNotice(null);
      if (lastLogin) {
        const data = await login(lastLogin);
        setConsumption(data);
        setNotice({ type: "success", message: "État actualisé." });
      } else {
        const data = await fetchConsumption();
        setConsumption(data);
        setNotice({ type: "success", message: "État actualisé (mock)." });
      }
    } catch (err) {
      setNotice({ type: "error", message: (err as Error).message });
    } finally {
      setRefreshing(false);
    }
  };

  const summary = consumption?.summary;

  const totalBytes = useMemo(() => {
    if (!consumption) return 0;
    return consumption.insights.periods.reduce((sum, p) => sum + (p.totalBytes || 0), 0);
  }, [consumption]);

  return (
    <div className="infoconso-page">
      <div className="ic-shell">
        {view === "login" && (
          <div className="ic-card" style={{ maxWidth: 520, margin: "0 auto", paddingLeft: 20, paddingRight: 20 }}>
            <div className="ic-card-header" style={{ gap: 12, alignItems: "center", justifyContent: "flex-start", flexDirection: "column", textAlign: "left" }}>
              <img src="/Logo-care-transparent.png" alt="Logo" style={{ height: 48, flexShrink: 0 }} />
              <div style={{ lineHeight: 1.25, textAlign: "center", width: "100%" }}>
                <div className="ic-card-title" style={{ fontSize: "1.35rem" }}>Info Consommation</div>
                <div className="ic-card-subtitle" style={{ marginTop: 4 }}>Portail captif — Login utilisateur ou voucher</div>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <LoginSwitcher
                value={loginType}
                onChange={(val) => {
                  setLoginType(val);
                  setError(null);
                  setNotice(null);
                }}
              />
            </div>

            {notice && (
              <div className={notice.type === "error" ? "ic-error-bar" : "ic-success-bar"} style={{ marginTop: 12 }}>
                {notice.message}
              </div>
            )}

            <div style={{ marginTop: 18 }}>
              {loginType === "voucher" ? (
                <VoucherLoginForm
                  code={voucherCode}
                  onCodeChange={setVoucherCode}
                  onSubmit={handleLogin}
                  loading={loading}
                  error={undefined}
                />
              ) : (
                <UserLoginForm
                  username={username}
                  password={password}
                  onUsernameChange={setUsername}
                  onPasswordChange={setPassword}
                  onSubmit={handleLogin}
                  loading={loading}
                  error={undefined}
                />
              )}
            </div>

            {loading && (
              <div style={{ marginTop: 16 }}>
                <div className="ic-skeleton" />
                <div className="ic-skeleton" style={{ marginTop: 8 }} />
              </div>
            )}

            <div className="ic-link-row" style={{ flexDirection: "row" }}>
              <a href="/support">Besoin d’aide ? Cliquer ici</a>
              <div>||</div>

              <a href="/terms">Lisez les conditions d’utilisation</a>
              <div style={{ fontSize: "0.8rem", color: "var(--ic-muted)", marginTop: 8, textAlign: "center" }}>
                © TECHZONE IT SOLUTION SARL ·Facebook: <a href="https://www.facebook.com/techzoneits" style={{ color: "var(--ic-primary)" }} aria-label="Facebook TECHZONE ITSolution">TECH ZONE - ITSolution</a>
              </div>
            </div>
          </div>
        )}

        {view === "dashboard" && consumption && summary && (
          <div className="ic-dashboard" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="ic-card">
              <div className="ic-card-header">
                <div>
                  <div className="ic-card-subtitle">Compte</div>
                  <div className="ic-card-title" style={{ fontSize: "1.3rem" }}>{summary.username}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                    <HeaderBadge label={`Type: ${summary.accountType}`} />
                    {summary.profile && <HeaderBadge label={`Profil: ${summary.profile}`} />}
                    {summary.status && <HeaderBadge label={`Statut: ${summary.status}`} />}
                    <HeaderBadge label={`Volume: ${formatBytes(totalBytes)}`} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="ic-button" type="button" onClick={refreshData} disabled={refreshing}>
                    {refreshing ? "Actualisation..." : "Actualiser les états"}
                  </button>
                  <button className="ic-button ghost" type="button" onClick={resetAccount}>
                    Changer de compte
                  </button>
                </div>
              </div>

              {notice && (
                <div className={notice.type === "error" ? "ic-error-bar" : "ic-success-bar"}>
                  {notice.message}
                </div>
              )}
            </div>

            <div className="ic-grid-3">
              {refreshing && (
                <div className="ic-skeleton card" style={{ gridColumn: "1 / -1", marginBottom: 4 }} aria-hidden />
              )}
              <QuotaCard
                title="Quota Data"
                cap={summary.dataCap}
                used={summary.dataUsed}
                remaining={summary.dataRemaining}
                percent={summary.percDataUsed}
                icon={<IconData />}
              />
              <QuotaCard
                title="Quota Temps"
                cap={summary.timeCap}
                used={summary.timeUsed}
                remaining={summary.timeRemaining}
                percent={summary.percTimeUsed}
                icon={<IconTime />}
              />
              <StatusPeriodCard
                isExpired={summary.isExpired}
                daysRemaining={summary.daysRemaining}
                createdAt={summary.metadata.createdAt}
                updatedAt={summary.metadata.updatedAt}
                status={summary.status}
              />
            </div>

            <div className="ic-grid-2">
              <RecentActivityCard activity={consumption.recentActivity} />
              <PeriodsCard periods={consumption.insights.periods} />
            </div>

            <SeriesChartCard buckets={consumption.insights.series.buckets} />

            <div className="ic-section">
              <SessionsTableCard
                title="Sessions actives"
                list={consumption.activeSessions}
                canDisconnect
                onDisconnect={disconnectSessions}
              />
            </div>

            <div className="ic-section">
              <SessionsTableCard title="Historique (sessions fermées)" list={consumption.inactiveSessions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
