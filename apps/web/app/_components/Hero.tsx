"use client";
import Link from "next/link";
import { useState } from "react";

interface AnimatedLineProps {
  words: string[];
  startIndex: number;
  className?: string;
  style?: React.CSSProperties;
  wordStyle?: React.CSSProperties;
}

const WORD_START = 0.18;
const WORD_STEP = 0.1;
const WORD_DURATION = 0.4;
const TOTAL_WORDS = 11; // 4+3+4
const HEADLINE_END = WORD_START + (TOTAL_WORDS - 1) * WORD_STEP + WORD_DURATION;

function AnimatedLine({ words, startIndex, className = "", style, wordStyle }: AnimatedLineProps) {
  return (
    <span className={`block ${className}`} style={style}>
      {words.map((word, i) => (
        <span
          key={i}
          className="word-animate inline-block"
          style={{
            animationDelay: `${WORD_START + (startIndex + i) * WORD_STEP}s`,
            marginRight: "0.22em",
            ...wordStyle,
          }}
        >
          {word}
        </span>
      ))}
    </span>
  );
}

const line1 = ["Le", "grand", "jour", "mérite"];
const line2 = ["plus", "qu'une", "checklist"];
const line3 = ["il", "vous", "mérite,", "vous."];

type Audience = "couple" | "prestataire";

const COPY: Record<Audience, { subtext: string; ctaLabel: string; ctaHref: string }> = {
  couple: {
    subtext: "Votre univers servi par les meilleurs.",
    ctaLabel: "Commencer mon mariage",
    ctaHref: "/couple-onboarding",
  },
  prestataire: {
    subtext: "Votre talent est vu avant même de vous rencontrer.",
    ctaLabel: "Rejoindre Wedly",
    ctaHref: "/devenir-prestataire",
  },
};

export default function Hero() {
  const [audience, setAudience] = useState<Audience>("couple");
  const isCouple = audience === "couple";
  const copy = COPY[audience];

  const line2Start = line1.length;
  const line3Start = line1.length + line2.length;

  const revealStyle = (offsetMs: number): React.CSSProperties => ({
    opacity: 0,
    animation: `word-in 0.5s ease forwards`,
    animationDelay: `${HEADLINE_END + offsetMs / 1000}s`,
  });

  return (
    <section className="flex-1 bg-creme flex flex-col overflow-hidden">

      {/* Illustration — first on mobile, second on desktop */}
      <div className="w-full order-first md:order-2" aria-hidden>
        <img
          src="https://res.cloudinary.com/dadvrspox/image/upload/v1781796293/illustration_yaswvk.png"
          alt="Six couples enlacés, dessinés d'un seul trait continu"
          className="w-full object-cover illustration-animate"
          style={{ maxHeight: "260px", objectPosition: "center" }}
        />
      </div>

      {/* Text block — eyebrow + H1 */}
      <div className="w-full px-6 md:px-20 pt-8 md:pt-16 pb-4 md:pb-10 order-2 md:order-1">
        <div className="md:max-w-[75%] mx-auto md:text-center">

          {/* Eyebrow — mêmes 3 mots sur mobile et desktop */}
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
            Inspiration · Expérience · Qualité
          </p>

          {/* H1 — bordeaux plutôt que le noir d'origine */}
          <h1 style={{ fontFamily: "var(--font-cormorant-var)", fontWeight: 300, fontSize: "clamp(2.6rem, 6vw, 5.5rem)", lineHeight: 1.05, margin: 0 }}>
            <AnimatedLine words={line1} startIndex={0} wordStyle={{ color: "var(--color-bordeaux)" }} />
            <AnimatedLine
              words={line2}
              startIndex={line2Start}
              className="italic"
              wordStyle={{ color: "var(--color-accent)" }}
            />
            <AnimatedLine words={line3} startIndex={line3Start} wordStyle={{ color: "var(--color-bordeaux)" }} />
          </h1>

        </div>
      </div>

      {/* Bottom block — toggle couple/prestataire + CTA (reprend la mécanique de /devenir-prestataire et /wedream-vendors) */}
      <div className="w-full px-6 md:px-20 pt-6 md:pt-12 pb-14 md:pb-20 order-3">
        <div className="md:max-w-[75%] mx-auto md:text-center flex flex-col md:items-center gap-6">

          <div className="flex items-stretch gap-2.5 w-full md:w-auto" style={revealStyle(120)}>
            <button
              type="button"
              onClick={() => setAudience("couple")}
              className="cursor-pointer flex-1 md:flex-none text-center"
              style={{
                fontFamily: "var(--font-dm-sans-var)",
                fontWeight: 500,
                fontSize: "11px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                padding: "12px 14px",
                borderRadius: "8px",
                backgroundColor: "var(--color-bordeaux)",
                color: "var(--color-creme)",
                opacity: isCouple ? 1 : 0.55,
              }}
            >
              Je suis un couple
            </button>
            <button
              type="button"
              onClick={() => setAudience("prestataire")}
              className="cursor-pointer flex-1 md:flex-none text-center"
              style={{
                fontFamily: "var(--font-dm-sans-var)",
                fontWeight: 600,
                fontSize: "11px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                padding: "12px 14px",
                borderRadius: "8px",
                backgroundColor: "var(--color-accent)",
                color: "var(--color-creme)",
                opacity: !isCouple ? 1 : 0.55,
              }}
            >
              Je suis prestataire
            </button>
          </div>

          <p
            className="text-[15px] md:text-[18px]"
            style={{
              fontFamily: "var(--font-cormorant-var)",
              fontStyle: "italic",
              fontWeight: 300,
              lineHeight: 1.5,
              color: "rgba(41, 26, 16, 0.7)",
              ...revealStyle(220),
            }}
          >
            {copy.subtext}
          </p>

          <Link
            href={copy.ctaHref}
            className="text-creme hover:opacity-90 transition-opacity self-center inline-flex items-center justify-center"
            style={{
              fontFamily: "var(--font-dm-sans-var)",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 500,
              backgroundColor: "var(--color-accent)",
              padding: "14px 28px",
              borderRadius: "8px",
              textDecoration: "none",
              width: "fit-content",
              ...revealStyle(340),
            }}
          >
            {copy.ctaLabel} <span>→</span>
          </Link>

        </div>
      </div>

    </section>
  );
}
