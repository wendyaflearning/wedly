export default function BifurcationSection() {
  return (
    <section id="bifurcation" className="flex flex-col md:flex-row">

      {/* 01 — COUPLES */}
      <div
        id="couples"
        className="relative flex-1 overflow-hidden flex flex-col justify-between gap-12 px-10 md:px-16 py-20 md:py-28"
        style={{ backgroundColor: "var(--color-bordeaux)" }}
      >
        {/* Decorative rings */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 340, height: 340, left: -120, top: -120, border: "1px solid rgba(255,246,237,0.1)" }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 160, height: 160, left: 60, bottom: 80, border: "1px solid rgba(255,246,237,0.1)" }}
        />

        {/* Text block */}
        <div className="relative flex flex-col gap-6">
          <p
            style={{
              fontFamily: "var(--font-dm-sans-var)",
              fontSize: "11px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,246,237,0.5)",
              margin: 0,
            }}
          >
            01 — Couples &amp; mariés
          </p>
          <h2
            style={{
              fontFamily: "var(--font-cormorant-var)",
              fontWeight: 300,
              fontSize: "clamp(2rem, 3.5vw, 3.2rem)",
              lineHeight: 1.1,
              margin: 0,
              color: "var(--color-creme)",
            }}
          >
            Organisez votre<br />
            <em>mariage idéal.</em>
          </h2>
          <p
            style={{
              fontFamily: "var(--font-dm-sans-var)",
              fontSize: "15px",
              lineHeight: 1.65,
              margin: 0,
              color: "rgba(255,246,237,0.62)",
              maxWidth: "360px",
            }}
          >
            Trouvez les prestataires qui vous ressemblent, suivez chaque étape, gérez votre budget — en toute sérénité.
          </p>
        </div>

        {/* CTA block */}
        <div className="relative flex flex-col gap-5">
          <div>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-full transition-opacity hover:opacity-80"
              style={{
                fontFamily: "var(--font-dm-sans-var)",
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontWeight: 500,
                color: "var(--color-creme)",
                border: "1px solid rgba(255,246,237,0.55)",
                padding: "14px 28px",
                textDecoration: "none",
              }}
            >
              Commencer <span>→</span>
            </a>
          </div>
          <div className="flex flex-col gap-1">
            <span
              style={{
                fontFamily: "var(--font-cormorant-var)",
                fontStyle: "italic",
                fontSize: "15px",
                color: "rgba(255,246,237,0.55)",
              }}
            >
              On s'occupe du reste.
            </span>
            <span
              style={{
                fontFamily: "var(--font-dm-sans-var)",
                fontSize: "11px",
                letterSpacing: "0.08em",
                color: "rgba(255,246,237,0.35)",
              }}
            >
              Sans carte bancaire · Prêt en 5 min
            </span>
          </div>
        </div>

        {/* Big background number */}
        <div
          aria-hidden="true"
          className="absolute bottom-4 right-6 select-none pointer-events-none"
          style={{
            fontFamily: "var(--font-cormorant-var)",
            fontWeight: 300,
            fontSize: "clamp(8rem, 12vw, 14rem)",
            lineHeight: 1,
            color: "rgba(255,246,237,0.07)",
          }}
        >
          01
        </div>
      </div>

      {/* 02 — PRESTATAIRES */}
      <div
        id="prestataires"
        className="relative flex-1 overflow-hidden flex flex-col justify-between gap-12 px-10 md:px-16 py-20 md:py-28"
        style={{ backgroundColor: "var(--color-creme)" }}
      >
        {/* Decorative rings */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 300, height: 300, right: -80, top: -100, border: "1px solid rgba(78,26,50,0.1)" }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 140, height: 140, right: 120, bottom: 60, border: "1px solid rgba(78,26,50,0.1)" }}
        />

        {/* Text block */}
        <div className="relative flex flex-col gap-6">
          <p
            style={{
              fontFamily: "var(--font-dm-sans-var)",
              fontSize: "11px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
              margin: 0,
            }}
          >
            02 — Prestataires
          </p>
          <h2
            style={{
              fontFamily: "var(--font-cormorant-var)",
              fontWeight: 300,
              fontSize: "clamp(2rem, 3.5vw, 3.2rem)",
              lineHeight: 1.1,
              margin: 0,
              color: "var(--color-texte)",
            }}
          >
            Développez votre<br />
            <em style={{ color: "var(--color-accent)" }}>activité.</em>
          </h2>
          <p
            style={{
              fontFamily: "var(--font-dm-sans-var)",
              fontSize: "15px",
              lineHeight: 1.65,
              margin: 0,
              color: "rgba(41,26,16,0.65)",
              maxWidth: "360px",
            }}
          >
            Chez Wedly, les couples qui arrivent jusqu'à vous sont déjà convaincus.
          </p>
        </div>

        {/* CTA block */}
        <div className="relative flex flex-col gap-5">
          <div>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-full transition-opacity hover:opacity-90"
              style={{
                fontFamily: "var(--font-dm-sans-var)",
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontWeight: 500,
                color: "var(--color-creme)",
                backgroundColor: "var(--color-accent)",
                padding: "14px 28px",
                textDecoration: "none",
              }}
            >
              Créer mon profil <span>→</span>
            </a>
          </div>
          <div className="flex flex-col gap-1">
            <span
              style={{
                fontFamily: "var(--font-cormorant-var)",
                fontStyle: "italic",
                fontSize: "15px",
                color: "rgba(41,26,16,0.5)",
              }}
            >
              Les bons couples vous attendent.
            </span>
            <span
              style={{
                fontFamily: "var(--font-dm-sans-var)",
                fontSize: "11px",
                letterSpacing: "0.08em",
                color: "rgba(41,26,16,0.35)",
              }}
            >
              Gratuit · Visible dès validation
            </span>
          </div>
        </div>

        {/* Big background number */}
        <div
          aria-hidden="true"
          className="absolute bottom-4 right-6 select-none pointer-events-none"
          style={{
            fontFamily: "var(--font-cormorant-var)",
            fontWeight: 300,
            fontSize: "clamp(8rem, 12vw, 14rem)",
            lineHeight: 1,
            color: "rgba(78,26,50,0.06)",
          }}
        >
          02
        </div>
      </div>

    </section>
  );
}
