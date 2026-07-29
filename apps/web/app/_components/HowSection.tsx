import type { ReactNode } from "react";

interface StepRowData {
  num: string;
  title: ReactNode;
  description: string;
  icon: ReactNode;
}

const PersonIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
  </svg>
);

const CalendarIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const MatchIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
    <circle cx="8.5" cy="8" r="3.2" />
    <circle cx="16.5" cy="9" r="2.6" />
    <path d="M3 20c0-3.3 2.5-5.8 5.5-5.8s5.5 2.5 5.5 5.8" />
    <path d="M14 20c0-2.6 1.9-4.7 4.3-4.7" />
  </svg>
);

const DocumentIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
    <rect x="4" y="4" width="14" height="16" rx="1.6" />
    <path d="M7.5 8.5h7M7.5 12h7M7.5 15.5h4" />
  </svg>
);

const coupleSteps: StepRowData[] = [
  {
    num: "Étape 01",
    title: <>Parlez-nous de <em style={{ color: "var(--color-accent)" }}>votre histoire</em></>,
    description: "Quelques questions sur votre style, votre budget et vos envies. On fait le reste.",
    icon: PersonIcon,
  },
  {
    num: "Étape 02",
    title: <>Un planning <em style={{ color: "var(--color-accent)" }}>sur-mesure</em> vous attend</>,
    description: "Votre espace mariage, votre budget, vos prestataires, tous au même endroit, pensés pour vous.",
    icon: CalendarIcon,
  },
  {
    num: "Étape 03",
    title: <>Rencontrez les prestataires <em style={{ color: "var(--color-accent)" }}>faits pour vous</em></>,
    description: "On sélectionne les prestataires qui correspondent à votre univers, votre budget et votre date, pas une liste générique.",
    icon: MatchIcon,
  },
];

const vendorSteps: StepRowData[] = [
  {
    num: "Étape 01",
    title: <>Parlez-nous de <em style={{ color: "var(--color-accent)" }}>votre univers</em></>,
    description: "Quelques infos sur votre activité, votre style et vos disponibilités. On s'occupe du reste.",
    icon: PersonIcon,
  },
  {
    num: "Étape 02",
    title: <>Votre profil rencontre <em style={{ color: "var(--color-accent)" }}>les bons couples</em></>,
    description: "Visible auprès de couples qui correspondent vraiment à votre positionnement, pas une liste générique.",
    icon: MatchIcon,
  },
  {
    num: "Étape 03",
    title: <>Recevez des demandes <em style={{ color: "var(--color-accent)" }}>qualifiées</em></>,
    description: "Des couples qui connaissent déjà votre budget et votre univers avant de vous écrire.",
    icon: DocumentIcon,
  },
];

function StepRow({ num, title, description, icon, iconColor, isLast }: StepRowData & { iconColor: string; isLast: boolean }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div
          aria-hidden="true"
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-creme"
          style={{ border: "1px solid rgba(78, 26, 50, 0.18)", color: iconColor }}
        >
          {icon}
        </div>
        {!isLast && (
          <div className="w-px flex-1 my-2" style={{ background: "rgba(78, 26, 50, 0.18)" }} />
        )}
      </div>

      <div className={`flex flex-col gap-2 ${isLast ? "" : "pb-7"}`}>
        <span
          style={{
            fontFamily: "var(--font-cormorant-var)",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "13px",
            color: "var(--color-gris)",
          }}
        >
          {num}
        </span>
        <h3
          style={{
            fontFamily: "var(--font-cormorant-var)",
            fontWeight: 300,
            fontSize: "clamp(1.15rem, 1.6vw, 1.25rem)",
            lineHeight: 1.3,
            margin: 0,
            color: "var(--color-texte)",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-dm-sans-var)",
            fontSize: "13.5px",
            lineHeight: 1.55,
            margin: 0,
            color: "var(--color-gris)",
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

function StepColumn({ label, labelColor, steps, iconColor }: { label: string; labelColor: string; steps: StepRowData[]; iconColor: string }) {
  return (
    <div className="flex flex-col gap-7">
      <div
        style={{
          fontFamily: "var(--font-manrope-var)",
          fontWeight: 600,
          fontSize: "11px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: labelColor,
        }}
      >
        {label}
      </div>
      {steps.map((step, i) => (
        <StepRow key={step.num} {...step} iconColor={iconColor} isLast={i === steps.length - 1} />
      ))}
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
      <div className="max-w-5xl mx-auto mb-10 md:mb-20 text-center md:text-left">
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
          Trois temps, une promesse <br />
          <em>la vôtre, vraiment.</em>
        </h2>
      </div>

      {/* Steps — two columns: couples / prestataires */}
      <div className="max-w-5xl mx-auto flex flex-col md:grid md:grid-cols-2">
        <div className="md:pr-14 md:border-r md:border-bordeaux/10 pb-10 md:pb-0">
          <StepColumn
            label="Pour les couples"
            labelColor="var(--color-gris)"
            steps={coupleSteps}
            iconColor="var(--color-highlight)"
          />
        </div>

        <div className="md:pl-14 pt-10 md:pt-0 border-t border-gris/30 md:border-t-0">
          <StepColumn
            label="Pour les prestataires"
            labelColor="var(--color-accent)"
            steps={vendorSteps}
            iconColor="var(--color-accent)"
          />
        </div>
      </div>

    </section>
  );
}
