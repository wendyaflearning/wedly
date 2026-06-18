import type { ReactNode } from "react";

interface StepProps {
  num: string;
  title: ReactNode;
  description: string;
  icon: ReactNode;
}

function Step({ num, title, description, icon }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div
        aria-hidden="true"
        className="relative z-10 w-14 h-14 flex items-center justify-center rounded-full bg-creme shrink-0"
        style={{ border: "1px solid rgba(157, 79, 30, 0.45)", color: "var(--color-highlight)" }}
      >
        {icon}
      </div>
      <span
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
      <h3
        style={{
          fontFamily: "var(--font-cormorant-var)",
          fontWeight: 400,
          fontSize: "clamp(1.4rem, 2.2vw, 1.85rem)",
          lineHeight: 1.1,
          margin: 0,
          color: "var(--color-texte)",
        }}
      >
        {title}
      </h3>
      <p
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
      className="bg-creme px-6 md:px-20 py-20 md:py-28"
      style={{ borderTop: "1px solid rgba(158, 142, 133, 0.35)" }}
    >

      {/* Header — left aligned */}
      <div className="max-w-5xl mx-auto mb-16 md:mb-20">
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
          style={{
            fontFamily: "var(--font-cormorant-var)",
            fontWeight: 300,
            fontSize: "clamp(2rem, 4vw, 3.5rem)",
            lineHeight: 1.15,
            margin: 0,
            color: "var(--color-texte)",
          }}
        >
          Trois temps, une promesse —<br />
          <em>la vôtre, vraiment.</em>
        </h2>
      </div>

      {/* Steps — connector line + grid */}
      <div className="max-w-5xl mx-auto relative">

        {/* Connector line (desktop only) — behind the icon circles */}
        <div
          className="hidden md:block absolute top-7 inset-x-0 h-px"
          style={{ backgroundColor: "var(--color-accent)", opacity: 0.35 }}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          <Step
            num="Étape 01"
            title={<>On vous <em style={{ color: "var(--color-accent)" }}>connaît.</em></>}
            description="Vous nous parlez de vous, de votre style, de votre vision."
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
                <path d="M9 4a8 8 0 1 0 0 16 6 6 0 0 1 0-16Z" />
                <path d="M15 4a8 8 0 1 1 0 16 6 6 0 0 0 0-16Z" />
              </svg>
            }
          />

          <Step
            num="Étape 02"
            title={<>On prépare <em style={{ color: "var(--color-accent)" }}>tout.</em></>}
            description="Planning, budget, prestataires — tout est pensé autour de vous."
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
                <path d="M4 19c0-6 4-10 8-10s8 4 8 10" />
                <path d="M7 19c0-4 2.5-7 5-7s5 3 5 7" />
                <circle cx="12" cy="5" r="2" />
              </svg>
            }
          />

          <Step
            num="Étape 03"
            title={<>Vous <em style={{ color: "var(--color-accent)" }}>choisissez.</em></>}
            description="Les meilleures options vous attendent. Plus qu'à dire oui."
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
                <path d="M5 7h14v11H5z" />
                <path d="M5 7l7 6 7-6" />
                <path d="M9 16l2 1.5L15 14" />
              </svg>
            }
          />
        </div>
      </div>

    </section>
  );
}
