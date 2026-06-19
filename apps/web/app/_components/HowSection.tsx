import type { ReactNode } from "react";

interface StepProps {
  num: string;
  title: ReactNode;
  description: string;
  icon: ReactNode;
}

function Step({ num, title, description, icon }: StepProps) {
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      {/* Icon + label: row on mobile (label beside icon), icon alone on desktop (label below separately) */}
      <div className="flex items-center gap-4">
        <div
          aria-hidden="true"
          className="shrink-0 w-14 h-14 flex items-center justify-center rounded-full bg-creme relative"
          style={{ border: "1px solid rgba(157, 79, 30, 0.45)", color: "var(--color-highlight)" }}
        >
          {icon}
        </div>
        {/* Label next to icon on mobile only */}
        <span
          className="md:hidden"
          style={{
            fontFamily: "var(--font-cormorant-var)",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "15px",
            color: "var(--color-gris)",
          }}
        >
          {num}
        </span>
      </div>

      {/* Step label — desktop only: below icon so connector line doesn't cross text */}
      <span
        className="hidden md:block"
        style={{
          fontFamily: "var(--font-cormorant-var)",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: "15px",
          color: "var(--color-gris)",
        }}
      >
        {num}
      </span>

      {/* Heading */}
      <h3
        style={{
          fontFamily: "var(--font-cormorant-var)",
          fontWeight: 400,
          fontSize: "clamp(1.6rem, 2.2vw, 1.85rem)",
          lineHeight: 1.1,
          margin: 0,
          color: "var(--color-texte)",
        }}
      >
        {title}
      </h3>

      {/* Description — indented on mobile to align under "Étape" label */}
      <p
        className="pl-[72px] md:pl-0"
        style={{
          fontFamily: "var(--font-dm-sans-var)",
          fontSize: "15px",
          lineHeight: 1.65,
          margin: 0,
          color: "rgba(41, 26, 16, 0.65)",
        }}
      >
        {description}
      </p>
    </div>
  );
}

export default function HowSection() {
  return (
    <section
      id="how"
      className="bg-creme px-6 md:px-20 py-10 md:py-28"
      style={{ borderTop: "1px solid rgba(158, 142, 133, 0.35)" }}
    >

      {/* Header */}
      <div className="max-w-5xl mx-auto mb-10 md:mb-20">
        <p
          style={{
            fontFamily: "var(--font-dm-sans-var)",
            fontSize: "11px",
            letterSpacing: "0.14em",
            color: "var(--color-accent)",
            textTransform: "uppercase",
            marginBottom: "1.5rem",
          }}
        >
          Comment ça marche
        </p>
        <h2
          className="hidden md:block"
          style={{
            fontFamily: "var(--font-cormorant-var)",
            fontWeight: 300,
            fontSize: "clamp(2rem, 4vw, 3.5rem)",
            lineHeight: 1.15,
            margin: 0,
            color: "var(--color-texte)",
          }}
        >
          Trois temps, une promesse <br />
          <em>la vôtre, vraiment.</em>
        </h2>
      </div>

      {/* Steps */}
      <div className="max-w-5xl mx-auto relative">

        {/* Connector line (desktop only) */}
        <div
          className="hidden md:block absolute top-7 inset-x-0 h-px"
          style={{ backgroundColor: "var(--color-accent)", opacity: 0.55 }}
        />

        <div className="flex flex-col md:grid md:grid-cols-3 md:gap-16">

          <div className="py-8 md:py-0">
            <Step
              num="Étape 01"
              title={<>Parlez-nous de <em style={{ color: "var(--color-accent)" }}>votre histoire</em></>}
              description="Quelques questions sur votre style, votre budget et vos envies. On fait le reste."
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              }
            />
          </div>

          <div className="py-8 md:py-0 border-t border-gris/30 md:border-t-0">
            <Step
                num="Étape 02"
                title={<>Un planning <em style={{ color: "var(--color-accent)" }}>sur-mesure</em> vous attend</>}
                description="Votre espace mariage, votre budget, vos prestataires — tous au même endroit, pensés pour vous."
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                }
              />
          </div>

          <div className="py-8 md:py-0 border-t border-gris/30 md:border-t-0">
            <Step
                num="Étape 03"
                title={<>Rencontrez les prestataires <em style={{ color: "var(--color-accent)", fontStyle: "italic" }}>faits pour vous</em></>}
                description="On sélectionne les prestataires qui correspondent à votre univers, votre budget et votre date — pas une liste générique."
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
                    <circle cx="9" cy="7" r="3" />
                    <circle cx="17" cy="8" r="3" />
                    <path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" />
                    <path d="M17 14c2.5 0 5 1.5 5 4" />
                  </svg>
                }
              />
          </div>

        </div>
      </div>

    </section>
  );
}
