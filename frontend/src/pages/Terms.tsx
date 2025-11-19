export default function Terms() {
  const updated = '01 Aout 2024';
  return (
    <article className="cp-card">
      <div className="cp-card__header">
        <div>
          <p className="cp-eyebrow">CONDITIONS GÉNÉRALES D’UTILISATION</p>
          <h1 className="cp-title">Techzone IT Solution — Service Wi‑Fi</h1>
        </div>
        <span className="cp-badge cp-badge--muted">Mise à jour : {updated}</span>
      </div>

      <section style={{ marginBottom: '1rem' }}>
        <h2 className="cp-title" style={{ fontSize: '1rem' }}>1. Objet</h2>
        <p>
          Les présentes Conditions Générales d’Utilisation définissent les modalités d’accès et d’utilisation des
          services Internet Wi‑Fi proposés par Techzone IT Solution (« Techzone »), couvrant les offres illimitées (famille)
          et les offres classiques (par volume de données).
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h2 className="cp-title" style={{ fontSize: '1rem' }}>2. Offres, limitations et débit</h2>
        <p>
          Offres illimitées « famille » : Économique 49 000 Ar/mois (≤3 appareils, débit jusqu’à 12 Mbps) et Premium 65 000 Ar/mois
          (≤8 appareils, débit jusqu’à 15–20 Mbps). Strictement réservées à un même foyer ; revente/partage à des tiers interdit.
          Offres classiques : prépayées par Go, nombre d’appareils non limité, usage pro/cyber autorisé. Au terme du quota,
          la connexion est coupée ou ralentie. Le débit peut être adapté selon la charge réseau.
        </p>
        <p>
          Débit intelligent selon l’usage : au‑delà des seuils (Économique 120 Go, Premium 220 Go), le débit peut être ajusté
          pour garantir l’équité (navigation, streaming léger, téléchargements raisonnables). Remise à zéro mensuelle.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h2 className="cp-title" style={{ fontSize: '1rem' }}>3. Fonctionnement — Starlink & réseau</h2>
        <p>
          Les connexions s’appuient sur Starlink (satellites LEO). La vitesse effective dépend de la charge, du positionnement
          matériel et de la météo. Des ralentissements peuvent survenir (week‑end, intempéries). Le client reste responsable
          de son propre matériel (routeur, câbles, capteurs).
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h2 className="cp-title" style={{ fontSize: '1rem' }}>4. Durée, engagement et renouvellement</h2>
        <p>
          Sans engagement. Illimitée : valable du paiement à la fin du mois. Classique : 30 jours à compter de l’achat
          (ou jusqu’à épuisement). Renouvellement possible à l’avance.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h2 className="cp-title" style={{ fontSize: '1rem' }}>5. Utilisation normale, sécurité et restrictions</h2>
        <p>
          Usage domestique normal requis. Sont interdits : partage massif, revente, usages illicites, dépassement du nombre
          d’appareils, piratage. En cas d’abus : limitation, suspension ou résiliation possibles. Privilégier les sites HTTPS;
          usage d’un VPN recommandé.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h2 className="cp-title" style={{ fontSize: '1rem' }}>6. Maintenance, assistance et responsabilité</h2>
        <p>
          Assistance à distance prioritaire (Facebook, Anydesk, WhatsApp, SMS, appel). Interventions sur place si nécessaire.
          Le matériel client non fourni par Techzone n’est pas garanti.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h2 className="cp-title" style={{ fontSize: '1rem' }}>7. Force majeure — 8. Modifications — 9. Acceptation</h2>
        <p>
          Aucune responsabilité en cas de force majeure. Les CGU peuvent évoluer ; une information sera diffusée (SMS, email,
          portail). L’utilisation du service vaut acceptation.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h2 className="cp-title" style={{ fontSize: '1rem' }}>10. Contact</h2>
        <p>
          Techzone IT Solution — 034 66 707 66 — contact@techzone.lat
        </p>
      </section>
    </article>
  );
}
