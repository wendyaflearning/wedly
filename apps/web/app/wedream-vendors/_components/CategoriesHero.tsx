import Image from "next/image";

const HERO_IMAGE_URL =
  "https://res.cloudinary.com/dadvrspox/image/upload/w_1600,q_auto,f_auto/v1787048949/wedream_atx5zd.jpg";

/**
 * Hero de `/wedream-vendors`, repris fidèlement de la maquette Claude Design
 * `WD-H-07-page-bubbles-hero.dc.html` : photo plein cadre + overlay clair,
 * "Chaque talent a une histoire. / La vôtre commence ici.", repère "Découvrir"
 * purement décoratif (pas un lien dans la maquette). Grille de bulles,
 * photo de clôture et citation en dessous restent inchangées.
 */
export default function CategoriesHero() {
  return (
    <section className="relative w-full min-h-[560px] md:min-h-[640px] overflow-hidden flex flex-col items-center justify-center px-6 py-24 md:py-28">
      <Image
        src={HERO_IMAGE_URL}
        alt=""
        fill
        priority
        className="object-cover"
        style={{ objectPosition: "center 62%" }}
        sizes="100vw"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(165deg, rgba(255,246,237,0.22) 0%, rgba(255,246,237,0.58) 45%, rgba(255,246,237,0.22) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 md:gap-7 max-w-[900px] text-center">
        <p
          style={{
            fontFamily: "var(--font-manrope-var)",
            fontWeight: 600,
            fontSize: "11px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--color-accent)",
          }}
        >
          Tous nos savoir-faire
        </p>

        <h1 className="flex flex-col gap-1.5">
          <span
            style={{
              fontFamily: "var(--font-cormorant-var)",
              fontWeight: 300,
              fontSize: "clamp(30px, 5vw, 44px)",
              lineHeight: 1.16,
              color: "var(--color-bordeaux)",
              letterSpacing: "-0.01em",
            }}
          >
            Chaque talent a une histoire.
          </span>
          <span
            style={{
              fontFamily: "var(--font-cormorant-var)",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(30px, 5vw, 44px)",
              lineHeight: 1.16,
              color: "var(--color-accent)",
              letterSpacing: "-0.01em",
            }}
          >
            La vôtre commence ici.
          </span>
        </h1>

        <p
          className="max-w-[520px]"
          style={{
            fontFamily: "var(--font-manrope-var)",
            fontSize: "15px",
            lineHeight: 1.5,
            color: "rgba(78,26,50,0.72)",
          }}
        >
          Des châteaux aux costumes sur-mesure, autant de savoir-faire qu&apos;il en
          faut pour dire oui.
        </p>

        <div className="mt-2 flex flex-col items-center gap-2">
          <span
            style={{
              fontFamily: "var(--font-manrope-var)",
              fontWeight: 600,
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--color-bordeaux)",
            }}
          >
            Découvrir
          </span>
          <span className="w-px h-6" style={{ background: "rgba(78,26,50,0.35)" }} />
        </div>
      </div>
    </section>
  );
}
