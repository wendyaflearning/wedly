import Image from "next/image";

export default function ObservationSection() {
  return (
    <section id="observation">
      {/* Mobile — calé sur le mock 390px */}
      <div className="md:hidden" style={{ padding: "44px 26px 48px" }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "240px",
            borderRadius: "16px",
            overflow: "hidden",
            marginBottom: "28px",
          }}
        >
          <Image
            src="https://res.cloudinary.com/dadvrspox/image/upload/v1785329014/rencontre_prestataire_marie_obg9qc.jpg"
            alt="Rencontre entre un couple et un prestataire"
            fill
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
        </div>

        <p
          className="italic m-0"
          style={{
            fontFamily: "var(--font-cormorant-var)",
            fontWeight: 300,
            fontSize: "22px",
            lineHeight: 1.32,
            letterSpacing: "-0.01em",
            color: "var(--color-texte)",
            marginBottom: "16px",
          }}
        >
          Trouver le bon prestataire prend du temps et de l&apos;énergie. Être trouvé par les bons couples aussi.
        </p>
        <div style={{ width: "36px", height: "2px", background: "var(--color-highlight)", marginBottom: "20px" }} />
        <p
          className="m-0"
          style={{
            fontFamily: "var(--font-manrope-var)",
            fontWeight: 400,
            fontSize: "14px",
            lineHeight: 1.6,
            color: "var(--color-texte)",
            marginBottom: "24px",
          }}
        >
          De ce constat est née une nouvelle façon de faire les choses — présentée en avant-première au{" "}
          <span style={{ color: "var(--color-highlight)", fontWeight: 600 }}>
            Salon du Mariage, les 5 et 6 septembre 2026
          </span>
          .
        </p>
      </div>

      {/* Desktop — inchangé */}
      <div
        className="hidden md:grid mx-auto"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(min(420px,100%),1fr))",
          alignItems: "center",
          gap: "clamp(32px,5vw,64px)",
          padding: "clamp(56px,9vw,112px) clamp(24px,7vw,100px)",
          maxWidth: "1600px",
        }}
      >
        <div style={{ position: "relative", borderRadius: "24px", overflow: "hidden", height: "clamp(340px, 45vw, 620px)" }}>
          <Image
            src="https://res.cloudinary.com/dadvrspox/image/upload/v1785329014/rencontre_prestataire_marie_obg9qc.jpg"
            alt="Rencontre entre un couple et un prestataire"
            fill
            sizes="(min-width: 900px) 45vw, 100vw"
            style={{ objectFit: "cover" }}
          />
        </div>

        <div className="flex flex-col justify-center">
          <p
            className="italic text-texte m-0"
            style={{
              fontFamily: "var(--font-cormorant-var)",
              fontWeight: 300,
              fontSize: "clamp(24px,3vw,36px)",
              lineHeight: 1.32,
              letterSpacing: "-0.01em",
              maxWidth: "460px",
            }}
          >
            Trouver le bon prestataire prend du temps et de l&apos;énergie.
          </p>
          <div
            style={{
              width: "40px",
              height: "2px",
              background: "var(--color-highlight)",
              alignSelf: "center",
              margin: "20px 0",
            }}
          />
          <p
            className="italic text-texte m-0"
            style={{
              fontFamily: "var(--font-cormorant-var)",
              fontWeight: 300,
              fontSize: "clamp(24px,3vw,36px)",
              lineHeight: 1.32,
              letterSpacing: "-0.01em",
              marginLeft: "clamp(56px,14vw,140px)",
              marginBottom: "clamp(48px,6vw,72px)",
              maxWidth: "460px",
            }}
          >
            Pourtant, leur savoir-faire n&apos;attend que vous.
          </p>
          <p
            className="text-texte text-center m-0"
            style={{
              fontFamily: "var(--font-manrope-var)",
              fontWeight: 400,
              fontSize: "clamp(15px,1.5vw,17px)",
              lineHeight: 1.6,
              maxWidth: "440px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            De ce constat est née une nouvelle manière de se rencontrer, présentée en avant-première au{" "}
            <span style={{ color: "var(--color-highlight)", fontWeight: 600 }}>
              Salon du Mariage, les 5 et 6 septembre 2026
            </span>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
