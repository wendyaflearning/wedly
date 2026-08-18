import Image from "next/image";
import { DUOTONE_FILTER } from "./categories";

const COUPLE_IMAGE_URL =
  "https://res.cloudinary.com/dadvrspox/image/upload/v1787060519/Ajith_Kumar_Photo_o4gyai.jpg";
const ARTISAN_IMAGE_URL =
  "https://res.cloudinary.com/dadvrspox/image/upload/v1787060488/hero_wedream_vendors_csntjc.jpg";

export default function CategoriesHero() {
  return (
    <div className="flex flex-col md:grid md:grid-cols-[45fr_55fr] md:h-[88vh] bg-creme">
      <div className="order-2 md:order-1 flex flex-col items-center text-center box-border px-6 md:px-16 pt-10 pb-14 md:pt-[88px] md:pb-0">
        <p
          className="text-gris uppercase m-0"
          style={{
            fontFamily: "var(--font-manrope-var)",
            fontWeight: 600,
            fontSize: "11px",
            letterSpacing: "0.22em",
            marginBottom: "22px",
          }}
        >
          Wedream · Prestataires
        </p>
        <h1
          className="text-texte m-0"
          style={{
            fontFamily: "var(--font-cormorant-var)",
            fontWeight: 300,
            fontSize: "clamp(38px, 4.6vw, 62px)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Le rêve,
          <br />
          c&apos;était vous.
          <br />
          <span className="text-accent italic inline-block" style={{ marginTop: "6px" }}>
            La suite, c&apos;est eux.
          </span>
        </h1>
        <div
          className="relative overflow-hidden border-creme mt-7 md:mt-auto"
          style={{
            width: "clamp(120px, 30vw, 150px)",
            height: "clamp(160px, 40vw, 200px)",
            borderWidth: "6px",
            borderStyle: "solid",
            boxShadow: "0 18px 40px rgba(41,26,16,0.2)",
            borderTopLeftRadius: "clamp(60px, 15vw, 75px)",
            borderTopRightRadius: "clamp(60px, 15vw, 75px)",
          }}
        >
          <Image
            src={COUPLE_IMAGE_URL}
            alt="Couple — instant volé, non posé"
            fill
            className="object-cover"
            style={{ filter: DUOTONE_FILTER }}
            sizes="150px"
            priority
          />
        </div>
      </div>

      <div className="order-1 md:order-2 relative overflow-hidden aspect-[4/5] md:aspect-auto md:h-full" style={{ backgroundColor: "#EDE1D3" }}>
        <Image
          src={ARTISAN_IMAGE_URL}
          alt="Mains d'un artisan en plein geste — fleuriste, traiteur ou couturière"
          fill
          className="object-cover"
          style={{ filter: DUOTONE_FILTER }}
          sizes="(min-width: 768px) 55vw, 100vw"
          priority
        />
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: "38%",
            background: "linear-gradient(180deg, rgba(41,26,16,0) 0%, rgba(41,26,16,0.32) 100%)",
          }}
        />
      </div>
    </div>
  );
}
