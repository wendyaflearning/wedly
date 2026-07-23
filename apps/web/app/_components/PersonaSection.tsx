import Link from "next/link";

export default function PersonaSection() {
  return (
    <>
      <section id="bifurcation" className="flex flex-col md:flex-row">

        {/* COUPLES */}
        <div
          id="couples"
          className="relative flex-1 overflow-hidden flex flex-col gap-10 px-6 md:px-16 py-12 md:py-28"
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
          <div className="relative flex flex-col gap-5">
            <p
              style={{
                fontFamily: "var(--font-dm-sans-var)",
                fontSize: "11px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,246,237,0.55)",
                margin: 0,
              }}
            >
              Pour les couples &amp; mariés
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
              Organisez votre mariage<br />
              <em>comme vous l&apos;imaginez</em>
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
              Chaque détail pensé pour votre histoire. Planning, budget, prestataires — tout dans un seul espace dédié.
            </p>
          </div>

          {/* Spacer — desktop only, pushes CTA to bottom */}
          <div className="hidden md:block flex-1 min-h-14" />

          {/* CTA block */}
          <div className="relative flex flex-col gap-4">
            <Link
              href="/couples"
              className="inline-flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
              style={{
                fontFamily: "var(--font-dm-sans-var)",
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontWeight: 500,
                color: "var(--color-creme)",
                border: "1px solid rgba(255,246,237,0.55)",
                padding: "16px 28px",
                borderRadius: "8px",
                textDecoration: "none",
              }}
            >
              Commencer gratuitement <span>→</span>
            </Link>
            <span
              style={{
                fontFamily: "var(--font-cormorant-var)",
                fontStyle: "italic",
                fontSize: "15px",
                color: "rgba(255,246,237,0.45)",
              }}
            >
              Sans carte bancaire · Prêt en 5 min
            </span>
          </div>

          {/* Big background number (desktop) */}
          <div
            aria-hidden="true"
            className="absolute bottom-4 right-6 select-none pointer-events-none hidden md:block"
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

        {/* PRESTATAIRES */}
        <div
          id="prestataires"
          className="relative flex-1 overflow-hidden flex flex-col gap-10 px-6 md:px-16 py-12 md:py-28"
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
          <div className="relative flex flex-col gap-5">
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
              Pour les prestataires
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
              Soyez trouvés par les<br />
              <em style={{ color: "var(--color-accent)" }}>bons couples</em>
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
              Créez votre profil, montrez votre univers et recevez des demandes de couples qui vous correspondent vraiment.
            </p>
          </div>

          {/* Spacer — desktop only, pushes CTA to bottom */}
          <div className="hidden md:block flex-1 min-h-14" />

          {/* CTA block */}
          <div className="relative flex flex-col gap-4">
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
              style={{
                fontFamily: "var(--font-dm-sans-var)",
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontWeight: 500,
                color: "var(--color-creme)",
                backgroundColor: "var(--color-accent)",
                padding: "16px 28px",
                borderRadius: "8px",
                textDecoration: "none",
              }}
            >
              Rejoindre Wedly <span>→</span>
            </a>
            <span
              style={{
                fontFamily: "var(--font-cormorant-var)",
                fontStyle: "italic",
                fontSize: "15px",
                color: "rgba(41,26,16,0.5)",
              }}
            >
              Gratuit · Visible dès validation
            </span>
          </div>

          {/* Big background number (desktop) */}
          <div
            aria-hidden="true"
            className="absolute bottom-4 right-6 select-none pointer-events-none hidden md:block"
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

      {/* Footer */}
      <footer
        className="bg-creme px-6 md:px-16 py-6 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(158, 142, 133, 0.25)" }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans-var)",
            fontSize: "13px",
            color: "rgba(41, 26, 16, 0.4)",
          }}
        >
          © <em style={{ fontFamily: "var(--font-cormorant-var)", fontStyle: "italic" }}>Wedly</em> 2026 — <em style={{ fontFamily: "var(--font-cormorant-var)", fontStyle: "italic" }}>pensé en France, à deux.</em>
        </p>
        <p
          style={{
            fontFamily: "var(--font-dm-sans-var)",
            fontSize: "13px",
            color: "rgba(41, 26, 16, 0.4)",
          }}
        >
          FR · 2026
        </p>
      </footer>
    </>
  );
}
