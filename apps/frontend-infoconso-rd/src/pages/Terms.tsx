import React, { useEffect } from "react";
import "../styles/infoconso.css";

const stroke = "#2563eb";

const IconDoc = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M7 3h7l5 5v13H7z" />
    <path d="M14 3v5h5" />
  </svg>
);

const IconGlobe = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.5 3 2.5 15 0 18" />
    <path d="M12 3c-2.5 3-2.5 15 0 18" />
  </svg>
);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 6 }}>
      <div className="ic-card-title" style={{ fontSize: "1rem", marginBottom: 6 }}>{title}</div>
      <p className="ic-card-subtitle" style={{ color: "var(--ic-text)", lineHeight: 1.55 }}>{children}</p>
    </section>
  );
}

export default function Terms() {
  useEffect(() => {
    document.title = "TECHZONE · Conditions";
  }, []);

  const updated = "01 août 2024";

  return (
    <div className="infoconso-page" style={{ paddingTop: 32 }}>
      <div className="ic-shell" style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="ic-card" style={{ padding: 24 }}>
          <div className="ic-card-header" style={{ alignItems: "flex-start" }}>
            <div>
              <div className="ic-card-subtitle" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <IconDoc />
                <span>Conditions générales d'utilisation</span>
              </div>
              <div className="ic-card-title" style={{ fontSize: "1.4rem", display: "flex", alignItems: "center", gap: 8 }}>
                <IconGlobe />
                <span>Techzone IT Solution — Service Wi‑Fi</span>
              </div>
            </div>
            <span className="ic-badge muted">Mise à jour : {updated}</span>
          </div>

          <div className="ic-card-body" style={{ gap: 12 }}>
            <Section title="1. Objet">
              Les présentes Conditions Générales d’Utilisation définissent les modalités d’accès et d’utilisation des services
              Internet Wi‑Fi proposés par Techzone IT Solution (« Techzone »), couvrant les offres illimitées (famille) et les
              offres classiques (par volume de données).
            </Section>

            <Section title="2. Offres, limitations et débit">
              Offres illimitées « famille » : Économique 49 000 Ar/mois (≤3 appareils, débit jusqu’à 12 Mbps) et Premium 65 000 Ar/mois (≤8 appareils, débit jusqu’à 15–20 Mbps). Strictement réservées à un même foyer ; revente/partage à des tiers interdit. Offres classiques : prépayées par Go, nombre d’appareils non limité, usage pro/cyber autorisé. Au terme du quota, la connexion est coupée ou ralentie. Le débit peut être adapté selon la charge réseau. Débit intelligent : au‑delà des seuils (Économique 120 Go, Premium 220 Go), le débit peut être ajusté pour garantir l’équité. Remise à zéro mensuelle.
            </Section>

            <Section title="3. Fonctionnement — Starlink & réseau">
              Les connexions s’appuient sur Starlink (satellites LEO). La vitesse effective dépend de la charge, du positionnement matériel et de la météo. Des ralentissements peuvent survenir (week‑end, intempéries). Le client reste responsable de son propre matériel (routeur, câbles, capteurs).
            </Section>

            <Section title="4. Durée, engagement et renouvellement">
              Sans engagement. Illimitée : valable du paiement à la fin du mois. Classique : 30 jours à compter de l’achat (ou jusqu’à épuisement). Renouvellement possible à l’avance.
            </Section>

            <Section title="5. Utilisation normale, sécurité et restrictions">
              Usage domestique normal requis. Sont interdits : partage massif, revente, usages illicites, dépassement du nombre d’appareils, piratage. En cas d’abus : limitation, suspension ou résiliation possibles. Privilégier les sites HTTPS ; usage d’un VPN recommandé.
            </Section>

            <Section title="6. Maintenance, assistance et responsabilité">
              Assistance à distance prioritaire (Facebook, Anydesk, WhatsApp, SMS, appel). Interventions sur place si nécessaire. Le matériel client non fourni par Techzone n’est pas garanti.
            </Section>

            <Section title="7. Force majeure — 8. Modifications — 9. Acceptation">
              Aucune responsabilité en cas de force majeure. Les CGU peuvent évoluer ; une information sera diffusée (SMS, email, portail). L’utilisation du service vaut acceptation.
            </Section>

            <Section title="10. Contact">
              Techzone IT Solution — 034 66 707 66 — contact@techzone.lat
            </Section>
          </div>

          <div className="ic-link-row" style={{ marginTop: 14 }}>
            <a href="/infoconso">Retour portail</a>
            <a href="/support">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}
