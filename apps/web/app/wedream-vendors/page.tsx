import type { Metadata } from "next";
import Image from "next/image";
import CategoriesHero from "./_components/CategoriesHero";
import CategoryBubble from "./_components/CategoryBubble";
import { CATEGORY_BUBBLES } from "./_components/categories";

export const metadata: Metadata = {
  title: "Wedream — Nos prestataires | Wedly",
  description: "Neuf savoir-faire, un seul objectif : que ce mariage vous ressemble.",
};

const CLOSING_IMAGE_URL =
  "https://res.cloudinary.com/dadvrspox/image/upload/v1787060532/Marie%CC%81s_dansent_ensemble_u6wulx.jpg";

const largeBubbles = CATEGORY_BUBBLES.filter((bubble) => bubble.size === "lg");
const smallBubbles = CATEGORY_BUBBLES.filter((bubble) => bubble.size === "sm");
const smallRows = [smallBubbles.slice(0, 3), smallBubbles.slice(3, 6)];
const finalBubble = smallBubbles[6];

export default function WedreamVendorsPage() {
  return (
    <div className="bg-creme" style={{ fontFamily: "var(--font-manrope-var)" }}>
      {/* Filtre duotone partagé — reproduit le traitement photo "Teinté" (défaut) de la maquette. */}
      <svg width="0" height="0" style={{ position: "absolute", overflow: "hidden" }} aria-hidden="true">
        <defs>
          <filter id="wd-duotone" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"
            />
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.306 0.616" />
              <feFuncG type="table" tableValues="0.102 0.310" />
              <feFuncB type="table" tableValues="0.196 0.118" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      <CategoriesHero />

      <p
        className="text-bordeaux text-center mx-auto"
        style={{
          fontFamily: "var(--font-cormorant-var)",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: "clamp(20px, 2.1vw, 27px)",
          lineHeight: 1.5,
          maxWidth: "640px",
          padding: "clamp(64px, 8vw, 104px) 24px 0",
        }}
      >
        Neuf savoir-faire, un seul objectif&nbsp;: que ce mariage vous ressemble.
      </p>

      <div className="mx-auto" style={{ maxWidth: "1320px", padding: "clamp(56px, 7vw, 88px) clamp(20px, 4vw, 40px) 96px" }}>
        <div className="flex justify-center flex-wrap" style={{ gap: "clamp(48px, 6vw, 100px)", marginBottom: "clamp(56px, 7vw, 92px)" }}>
          {largeBubbles.map((bubble) => (
            <CategoryBubble key={bubble.slug} href="#" {...bubble} />
          ))}
        </div>

        <div className="flex flex-col items-center" style={{ gap: "clamp(40px, 4.5vw, 60px)" }}>
          {smallRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center flex-wrap" style={{ gap: "clamp(32px, 4vw, 64px)" }}>
              {row.map((bubble) => (
                <CategoryBubble key={bubble.slug} href="#" {...bubble} />
              ))}
            </div>
          ))}

          {finalBubble && (
            <div className="flex flex-col items-center gap-[22px]" style={{ marginTop: "6px" }}>
              <div className="w-px bg-bordeaux/20" style={{ height: "34px" }} />
              <CategoryBubble href="#" {...finalBubble} />
            </div>
          )}
        </div>
      </div>

      <div className="relative w-full aspect-[21/9]">
        <Image
          src={CLOSING_IMAGE_URL}
          alt="Réception en golden hour — premier bal, instant de fête"
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div>

      <p
        className="text-bordeaux text-center mx-auto"
        style={{
          fontFamily: "var(--font-cormorant-var)",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: "clamp(20px, 2.1vw, 28px)",
          lineHeight: 1.5,
          maxWidth: "720px",
          padding: "clamp(48px, 6vw, 80px) 24px clamp(72px, 8vw, 110px)",
        }}
      >
        Notre objectif&nbsp;: que chaque prestataire soit une évidence, pas un pari.
      </p>
    </div>
  );
}
