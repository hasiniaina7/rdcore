import React, { useEffect } from "react";
import "../styles/infoconso.css";

const stroke = "#2563eb";

const IconCircleTick = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 12.5l2 2 4-4" />
  </svg>
);

const IconSatellite = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <path d="M10 3l11 11" />
    <path d="M7 21l3-3" />
  </svg>
);

const IconPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 4h4l1 5-2 1c1 2 3 4 5 5l1-2 5 1v4c0 .6-.4 1-1 1C10 19 5 14 4 5c0-.6.4-1 1-1Z" />
  </svg>
);

const IconMap = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 21s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10Z" />
    <circle cx="12" cy="11" r="2.5" />
  </svg>
);

const IconWrench = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M15 3a5 5 0 0 1-6 6L5 13l6 6 4-4a5 5 0 0 1 0-12Z" />
    <path d="M3 21l3-3" />
  </svg>
);

const IconCart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="9" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2 3h3l2 12h11l2-8H6" />
  </svg>
);

const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const IconCard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18" />
  </svg>
);

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

export default function Support() {
  useEffect(() => {
    document.title = "TECHZONE · Support";
  }, []);

  return (
    <div className="infoconso-page" style={{ paddingTop: 32 }}>
      <div className="ic-shell" style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="ic-card" style={{ padding: 24 }}>
          <div className="ic-card-header" style={{ alignItems: "flex-start" }}>
            <div>
              <div className="ic-card-subtitle" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <IconCircleTick />
                <span>Assistance client</span>
              </div>
              <div className="ic-card-title" style={{ fontSize: "1.4rem", display: "flex", alignItems: "center", gap: 8 }}>
                <IconSatellite />
                <span>Support TECHZONE</span>
              </div>
            </div>
            <span className="ic-badge" style={{ background: "rgba(37,99,235,0.08)", borderColor: "rgba(37,99,235,0.15)" }}>
              Réponse en heures ouvrées
            </span>
          </div>

          <p className="ic-card-subtitle" style={{ marginBottom: 16 }}>
            Coordonnées pour joindre l'équipe TECHZONE. Horaires en jours ouvrés.
          </p>

          <div className="ic-grid-2" style={{ marginTop: 10 }}>
            <div className="ic-card" style={{ boxShadow: "none", borderColor: "var(--ic-border)" }}>
              <div className="ic-card-title" style={{ fontSize: "1rem", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <IconPhone />
                <span>Contacts principaux</span>
              </div>
              <div className="ic-card-body">
                <div className="ic-stat-row"><span className="label"><IconMap /> Adresse</span><span>Anjoma CENTER BOX 12</span></div>
                <div className="ic-stat-row"><span className="label"><IconWrench /> Informaticien</span><span>038 66 707 66</span></div>
                <div className="ic-stat-row"><span className="label"><IconWrench /> Techniciens</span><span>038 63 707 66</span></div>
                <div className="ic-stat-row"><span className="label"><IconCart /> Commercial 1</span><span>038 64 707 66</span></div>
                <div className="ic-stat-row"><span className="label"><IconCart /> Commercial 2</span><span>034 73 777 66</span></div>
              </div>
            </div>

            <div className="ic-card" style={{ boxShadow: "none", borderColor: "var(--ic-border)" }}>
              <div className="ic-card-title" style={{ fontSize: "1rem", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <IconClock />
                <span>Paiements & horaires</span>
              </div>
              <div className="ic-card-body">
                <div className="ic-stat-row"><span className="label"><IconCard /> Mobile Money</span><span>034 73 777 66 · 033 78 609 66 · 032 79 203 48</span></div>
                <div className="ic-stat-row"><span className="label"><IconClock /> Horaires</span><span>08h00–12h00 · 14h00–17h30</span></div>
                <div className="ic-stat-row"><span className="label"><IconMail /> Email</span><span>contact@techzone.lat</span></div>
              </div>
            </div>
          </div>

          <div className="ic-link-row" style={{ marginTop: 20 }}>
            <a href="/infoconso">Retour à l'Info conso</a>
            <a href="/terms">Conditions d'utilisation</a>
          </div>
        </div>
      </div>
    </div>
  );
}
