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
      <CategoriesHero />

      <p
        className="text-bordeaux text-center mx-auto max-w-[320px] text-[19px] px-6 pt-10 md:max-w-[640px] md:text-[clamp(20px,2.1vw,27px)] md:pt-[clamp(64px,8vw,104px)]"
        style={{ fontFamily: "var(--font-cormorant-var)", fontStyle: "italic", fontWeight: 300, lineHeight: 1.5 }}
      >
        Neuf savoir-faire, un seul objectif&nbsp;: que ce mariage vous ressemble.
      </p>

      <div className="flex flex-col gap-10 px-6 pt-11 pb-2 md:block md:mx-auto md:max-w-[1320px] md:px-[clamp(20px,4vw,40px)] md:pt-[clamp(56px,7vw,88px)] md:pb-24">
        <div className="flex flex-col items-center gap-10 md:flex-row md:justify-center md:gap-[clamp(48px,6vw,100px)] md:mb-[clamp(56px,7vw,92px)]">
          {largeBubbles.map((bubble) => (
            <CategoryBubble key={bubble.slug} href="#" {...bubble} />
          ))}
        </div>

        <div className="flex flex-col gap-10 md:gap-[clamp(40px,4.5vw,60px)]">
          <div className="grid grid-cols-2 gap-x-[22px] gap-y-9 justify-center md:hidden">
            {smallBubbles.slice(0, 6).map((bubble) => (
              <CategoryBubble key={bubble.slug} href="#" {...bubble} />
            ))}
          </div>

          <div className="hidden md:flex md:flex-col md:items-center md:gap-[clamp(40px,4.5vw,60px)]">
            {smallRows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center flex-wrap gap-[clamp(32px,4vw,64px)]">
                {row.map((bubble) => (
                  <CategoryBubble key={bubble.slug} href="#" {...bubble} />
                ))}
              </div>
            ))}
          </div>

          {finalBubble && (
            <div className="flex flex-col items-center gap-5 md:gap-[22px] md:mt-[6px]">
              <div className="w-px bg-bordeaux/20 h-[30px] md:h-[34px]" />
              <CategoryBubble href="#" {...finalBubble} />
            </div>
          )}
        </div>
      </div>

      <div className="relative w-full aspect-[4/5] mt-14 md:mt-0 md:aspect-[21/9]">
        <Image
          src={CLOSING_IMAGE_URL}
          alt="Réception en golden hour — premier bal, instant de fête"
          fill
          className="object-cover object-[30%_center] md:object-center"
          sizes="100vw"
        />
      </div>

      <p
        className="text-bordeaux text-center mx-auto max-w-[320px] text-[19px] px-6 pt-10 pb-14 md:max-w-[720px] md:text-[clamp(20px,2.1vw,28px)] md:px-6 md:pt-[clamp(48px,6vw,80px)] md:pb-[clamp(72px,8vw,110px)]"
        style={{ fontFamily: "var(--font-cormorant-var)", fontStyle: "italic", fontWeight: 300, lineHeight: 1.5 }}
      >
        Notre objectif&nbsp;: que chaque prestataire soit une évidence, pas un pari.
      </p>
    </div>
  );
}
