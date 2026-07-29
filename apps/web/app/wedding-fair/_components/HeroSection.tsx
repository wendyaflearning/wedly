import Image from "next/image";

export default function HeroSection() {
  return (
    <section id="hero" className="relative bg-bordeaux overflow-hidden" style={{ height: "100vh", minHeight: "600px" }}>
      {/* Mobile — un seul visuel plein cadre, les 2 photos flottantes du design desktop se chevauchent en dessous de md */}
      <div className="absolute inset-0 md:hidden">
        <Image
          src="https://res.cloudinary.com/dadvrspox/image/upload/v1785327426/inspiration_image_mkfwmc.jpg"
          alt="Détail mariage — inspiration et réalité"
          fill
          sizes="100vw"
          style={{ objectFit: "cover" }}
          priority
        />
        <div className="absolute inset-0" style={{ background: "rgba(20,10,8,0.55)" }} />
      </div>

      <div
        className="hidden md:block absolute overflow-hidden rounded"
        style={{
          left: "clamp(155px,14vw,210px)",
          top: "clamp(48px,5vw,64px)",
          width: "40%",
          height: "calc(100% - clamp(48px,5vw,64px) - clamp(48px,5vw,64px))",
        }}
      >
        <Image
          src="https://res.cloudinary.com/dadvrspox/image/upload/v1785327426/inspiration_image_mkfwmc.jpg"
          alt="Inspiration — détail mariage côté couple"
          fill
          sizes="40vw"
          style={{ objectFit: "cover" }}
          priority
        />
        <div className="absolute inset-0" style={{ background: "rgba(20,10,8,0.32)" }} />
      </div>
      <div
        className="hidden md:block absolute overflow-hidden rounded"
        style={{
          right: "clamp(145px,16vw,220px)",
          top: "clamp(90px,18vh,190px)",
          width: "clamp(220px,26vw,380px)",
          height: "clamp(380px,58vh,600px)",
        }}
      >
        <Image
          src="https://res.cloudinary.com/dadvrspox/image/upload/v1785327422/reality_image_gckrtm.jpg"
          alt="Réalité — prestataire en plein geste professionnel"
          fill
          sizes="(min-width: 768px) 26vw, 220px"
          style={{ objectFit: "cover" }}
          priority
        />
        <div className="absolute inset-0" style={{ background: "rgba(20,10,8,0.32)" }} />
      </div>

      <div
        className="absolute flex flex-col items-center justify-center text-center pointer-events-none"
        style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: "min(92%,1200px)", gap: "36px" }}
      >
        <p
          className="text-creme m-0"
          style={{
            fontFamily: "var(--font-cormorant-var)",
            fontWeight: 400,
            fontSize: "clamp(56px,9.5vw,132px)",
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            textShadow: "0 4px 32px rgba(41,26,16,0.45)",
          }}
        >
          De l&apos;inspiration à la réalité,{" "}
          <span className="italic" style={{ color: "var(--color-highlight)" }}>
            en un clic.
          </span>
        </p>
        <div className="pointer-events-auto">
          <a
            href="#observation"
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
            Découvrir le concept
          </a>
        </div>
      </div>
    </section>
  );
}
