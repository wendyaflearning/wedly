import type { ReactNode } from "react";
import PhotoPlaceholder from "./PhotoPlaceholder";

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div
      className="text-accent uppercase mb-4"
      style={{
        fontFamily: "var(--font-manrope-var)",
        fontWeight: 600,
        fontSize: "11px",
        letterSpacing: "0.2em",
      }}
    >
      {children}
    </div>
  );
}

function Heading({ children, size = "md" }: { children: ReactNode; size?: "md" | "sm" }) {
  return (
    <p
      className="text-texte m-0"
      style={{
        fontFamily: "var(--font-cormorant-var)",
        fontStyle: "italic",
        fontWeight: 300,
        fontSize: size === "md" ? "clamp(1.7rem, 3vw, 2.375rem)" : "clamp(1.6rem, 2.6vw, 2.25rem)",
        lineHeight: 1.35,
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </p>
  );
}

function WedreamPillar() {
  return (
    <div className="flex flex-col md:flex-row-reverse md:items-center gap-9 md:gap-16 py-14 md:py-24 px-6 md:px-[120px]">
      {/* Photos */}
      <div className="relative h-[360px] md:h-[560px] md:flex-1">
        <PhotoPlaceholder
          label="Photo Wedream"
          className="absolute top-0 right-0 w-[260px] h-[300px] md:w-[380px] md:h-[480px]"
        />
        <PhotoPlaceholder
          label="Photo Wedream (détail)"
          className="absolute bottom-0 left-0 md:left-10 w-[170px] h-[200px] md:w-[260px] md:h-[320px] shadow-[0_16px_36px_rgba(41,26,16,0.18)] md:shadow-[0_20px_50px_rgba(41,26,16,0.18)]"
        />
      </div>

      {/* Texte */}
      <div className="md:flex-none md:w-[40%]">
        <Eyebrow>01 — Wedream</Eyebrow>
        <Heading>Un coup de cœur ne s&apos;arrête jamais là.</Heading>
        <div className="w-10 md:w-12 h-0.5 bg-highlight my-4 md:my-6" />
        <p
          className="text-texte mb-6 md:mb-7 max-w-[400px]"
          style={{ fontFamily: "var(--font-manrope-var)", fontWeight: 400, fontSize: "15px", lineHeight: 1.6 }}
        >
          On s&apos;assure qu&apos;il soit toujours disponible pour vous — et si ce n&apos;est pas le cas, on vous en
          trouve un autre, tout aussi juste.
        </p>
        <a
          href="#"
          className="inline-flex items-center justify-center transition-opacity hover:opacity-90"
          style={{
            fontFamily: "var(--font-manrope-var)",
            fontSize: "11px",
            letterSpacing: "0.13em",
            textTransform: "uppercase",
            fontWeight: 500,
            color: "var(--color-creme)",
            backgroundColor: "var(--color-accent)",
            padding: "14px 28px",
            borderRadius: "9999px",
            textDecoration: "none",
          }}
        >
          Découvrir Wedream
        </a>
      </div>
    </div>
  );
}

function WedPlanPillar() {
  return (
    <div className="flex flex-col md:flex-row-reverse md:items-center gap-10 md:gap-16 py-14 md:py-24 px-6 md:px-[120px]">
      {/* Texte */}
      <div className="md:flex-1">
        <Eyebrow>02 — WedPlan</Eyebrow>
        <Heading>
          Ce n&apos;est pas une to-do list. C&apos;est votre mariage. Alors on en a fait un{" "}
          <em className="text-accent font-semibold">chemin</em> — clair, étape par étape.
        </Heading>
      </div>

      {/* Stepper */}
      <div className="flex md:flex-none md:w-[40%] items-center justify-center">
        <div className="flex flex-col items-center">
          {["1", "2", "3"].map((n, i) => (
            <div key={n} className="flex flex-col items-center">
              <div
                className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-bordeaux/18 flex items-center justify-center text-accent"
                style={{
                  fontFamily: "var(--font-cormorant-var)",
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: "17px",
                }}
              >
                {n}
              </div>
              {i < 2 && <div className="w-px h-12 md:h-16 bg-bordeaux/18" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WedWalletPillar() {
  return (
    <div className="flex flex-col md:flex-row-reverse md:items-center gap-9 md:gap-16 py-14 md:py-24 px-6 md:px-[120px]">
      {/* Photo */}
      <PhotoPlaceholder
        label="Plan large, lumière chaude — calculatrice, papier, café. Un budget serein, jamais un tableau de chiffres."
        className="w-full h-[280px] md:h-[480px] md:flex-1"
      />

      {/* Texte */}
      <div className="md:flex-none md:w-[40%]">
        <Eyebrow>03 — WedWallet</Eyebrow>
        <Heading size="sm">Ce que ça coûte vraiment, personne ne vous l&apos;a jamais dit.</Heading>
        <p
          className="text-texte mt-4 md:mt-5 max-w-[380px]"
          style={{ fontFamily: "var(--font-manrope-var)", fontWeight: 400, fontSize: "15px", lineHeight: 1.6 }}
        >
          On l&apos;a demandé au marché pour vous.
        </p>
      </div>
    </div>
  );
}

export default function PillarsSection() {
  return (
    <section className="bg-creme relative">
      {/* Ligne verticale décorative reliant les trois piliers */}
      <div className="hidden md:block absolute inset-y-0 left-14 w-px bg-bordeaux/16" aria-hidden="true" />
      <div className="md:hidden absolute inset-y-0 left-3 w-px bg-bordeaux/16" aria-hidden="true" />

      <WedreamPillar />
      <WedPlanPillar />
      <WedWalletPillar />
    </section>
  );
}
