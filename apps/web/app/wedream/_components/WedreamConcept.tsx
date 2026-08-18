import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "./Reveal";
import TypeReveal from "./TypeReveal";

const TILE_STAGGER_MS = 90;

function StepHeading({ children }: { children: ReactNode }) {
  return (
    <h2
      className="text-bordeaux m-0"
      style={{
        fontFamily: "var(--font-cormorant-var)",
        fontWeight: 300,
        fontSize: "clamp(34px, 6.6vw, 104px)",
        lineHeight: 1,
        letterSpacing: "-0.025em",
      }}
    >
      {children}
    </h2>
  );
}

function TagPill({ children }: { children: ReactNode }) {
  return (
    <span
      className="text-creme/90 rounded-full"
      style={{
        fontFamily: "var(--font-manrope-var)",
        fontSize: "9.5px",
        fontWeight: 600,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        background: "rgba(41,26,16,0.42)",
        border: "1px solid rgba(255,246,237,0.28)",
        padding: "6px 13px",
      }}
    >
      {children}
    </span>
  );
}

interface MosaicTileProps {
  src: string;
  alt: string;
  tags: string[];
  className: string;
  delayMs: number;
}

function MosaicTile({ src, alt, tags, className, delayMs }: MosaicTileProps) {
  return (
    <Reveal className={`relative overflow-hidden ${className}`} delayMs={delayMs}>
      <Image src={src} alt={alt} fill className="object-cover" sizes="(min-width: 768px) 33vw, 50vw" priority />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(41,26,16,0.32) 0%, transparent 50%)" }}
      />
      <div className="absolute left-3 bottom-3 flex gap-1.5 flex-wrap">
        {tags.map((tag) => (
          <TagPill key={tag}>{tag}</TagPill>
        ))}
      </div>
    </Reveal>
  );
}

export default function WedreamConcept() {
  return (
    <>
      {/* Étape 1 — Vous rêvez */}
      <div className="relative h-svh md:h-screen overflow-hidden bg-creme snap-start flex flex-col justify-center px-[3vw] md:px-[4vw] py-[4vh] md:py-[6vh] box-border">
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src="https://res.cloudinary.com/dadvrspox/image/upload/v1786974052/vous_revez_lftncc.jpg"
            alt="Photo d'ambiance — mariage"
            fill
            className="object-cover"
            sizes="94vw"
            priority
          />
          <div className="absolute inset-0 bg-creme/55 pointer-events-none" />
          <div className="absolute left-[6vw] right-[6vw] bottom-[9vh] md:bottom-[11vh]">
            <StepHeading>
              <TypeReveal text="Vous rêvez" />
            </StepHeading>
          </div>
        </div>
      </div>

      {/* Étape 2 — Vous vous inspirez */}
      <div className="relative h-svh md:h-screen overflow-hidden bg-creme snap-start flex flex-col justify-center px-[3vw] md:px-[4vw] py-[4vh] md:py-[6vh] box-border">
        <div className="relative w-full grid grid-cols-2 md:grid-cols-6 gap-1.5 md:gap-2.5 h-[90svh] md:h-[88vh]">
          <div className="absolute inset-0 bg-creme/55 pointer-events-none z-10" />

          <MosaicTile
            src="https://res.cloudinary.com/dadvrspox/image/upload/v1786974052/vous_inspirez_ceremonie_yzwqen.jpg"
            alt="Portfolio — cérémonie"
            tags={["Champêtre", "Plein air"]}
            className="[grid-column:1/3] [grid-row:1/3] md:[grid-column:1/4] md:[grid-row:1/3]"
            delayMs={0 * TILE_STAGGER_MS}
          />
          <MosaicTile
            src="https://res.cloudinary.com/dadvrspox/image/upload/v1786974052/vous_inspirez_decor_de_table_wjhviw.jpg"
            alt="Portfolio — décor de table"
            tags={["Art de la table"]}
            className="[grid-column:1/2] [grid-row:3/4] md:[grid-column:4/6] md:[grid-row:1/2]"
            delayMs={1 * TILE_STAGGER_MS}
          />
          <MosaicTile
            src="https://res.cloudinary.com/dadvrspox/image/upload/v1786974103/vous_inspirez_bouquet_rbrmoz.jpg"
            alt="Portfolio — bouquet"
            tags={["Floral"]}
            className="[grid-column:2/3] [grid-row:3/4] md:[grid-column:6/7] md:[grid-row:1/2]"
            delayMs={2 * TILE_STAGGER_MS}
          />
          <MosaicTile
            src="https://res.cloudinary.com/dadvrspox/image/upload/v1786974103/vous_inspirez_robe_qutghe.jpg"
            alt="Portfolio — robe"
            tags={["Robe"]}
            className="[grid-column:1/2] [grid-row:4/5] md:[grid-column:4/5] md:[grid-row:2/3]"
            delayMs={3 * TILE_STAGGER_MS}
          />
          <MosaicTile
            src="https://res.cloudinary.com/dadvrspox/image/upload/v1786974119/Mariage_dansant_coucher_de_soleil_bvqv2h.jpg"
            alt="Portfolio — réception au coucher du soleil"
            tags={["Golden hour", "Domaine"]}
            className="[grid-column:2/3] [grid-row:4/5] md:[grid-column:5/7] md:[grid-row:2/3]"
            delayMs={4 * TILE_STAGGER_MS}
          />

          <div className="absolute left-0 right-0 top-[58%] -translate-y-1/2 flex justify-center pointer-events-none z-20">
            <Reveal className="text-center" delayMs={5 * TILE_STAGGER_MS}>
              <StepHeading>Vous vous inspirez</StepHeading>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Étape 3 — Ça devient réel */}
      <div className="relative h-svh md:h-screen overflow-hidden bg-creme snap-start flex flex-col justify-center px-[3vw] md:px-[4vw] py-[4vh] md:py-[6vh] box-border">
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src="https://res.cloudinary.com/dadvrspox/image/upload/v1786974120/Groupe_de_personnes_dansant_jpw2mu.jpg"
            alt="Photo d'ambiance — rencontre couple / prestataire"
            fill
            className="object-cover"
            sizes="94vw"
            priority
          />
          <div className="absolute inset-0 bg-creme/55 pointer-events-none" />
          <div className="absolute left-[6vw] right-[6vw] bottom-[8vh] md:bottom-[10vh] flex flex-col items-center text-center gap-5 md:gap-6">
            <Reveal>
              <StepHeading>Ça devient réel</StepHeading>
            </Reveal>
            <Reveal delayMs={130}>
              <p
                className="text-accent m-0"
                style={{
                  fontFamily: "var(--font-cormorant-var)",
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: "clamp(15px, 1.8vw, 24px)",
                  lineHeight: 1.5,
                }}
              >
                De l&apos;inspiration à la réalité en un clic.
              </p>
            </Reveal>
            <Reveal delayMs={260} className="w-full md:w-auto">
              <Link
                href="/wedream-vendors"
                className="inline-flex items-center justify-center gap-2 md:gap-2.5 w-full md:w-auto rounded-full whitespace-nowrap transition-transform hover:-translate-y-px px-4 py-4 md:px-[38px] md:py-[17px] tracking-[0.1em] md:tracking-[0.17em] text-[11px] md:text-xs"
                style={{
                  fontFamily: "var(--font-manrope-var)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: "var(--color-creme)",
                  backgroundColor: "var(--color-accent)",
                  textDecoration: "none",
                  boxShadow: "0 14px 32px rgba(227,87,4,0.34)",
                }}
              >
                Choisir mon prestataire
                <span aria-hidden="true">→</span>
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </>
  );
}
