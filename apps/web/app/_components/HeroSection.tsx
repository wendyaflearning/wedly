"use client";

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

export default function HeroSection() {
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

          {/* Mobile eyebrow */}
          <p
            className="block md:hidden"
            style={{
              fontFamily: "var(--font-dm-sans-var)",
              fontSize: "11px",
              letterSpacing: "0.14em",
              color: "rgba(41, 26, 16, 0.5)",
              textTransform: "uppercase",
              marginBottom: "1.25rem",
            }}
          >
            Planification · Budget · Prestataires
          </p>

          {/* Desktop eyebrow */}
          <p
            className="hidden md:block"
            style={{
              fontFamily: "var(--font-dm-sans-var)",
              fontSize: "11px",
              letterSpacing: "0.14em",
              color: "var(--color-accent)",
              textTransform: "uppercase",
              marginBottom: "1.5rem",
            }}
          >
            Wedplan · WedWallet · WedMatch
          </p>

          {/* H1 */}
          <h1 style={{ fontFamily: "var(--font-cormorant-var)", fontWeight: 300, fontSize: "clamp(2.6rem, 6vw, 5.5rem)", lineHeight: 1.05, margin: 0 }}>
            <AnimatedLine words={line1} startIndex={0} className="text-texte" />
            <AnimatedLine
              words={line2}
              startIndex={line2Start}
              className="italic"
              wordStyle={{ color: "var(--color-accent)" }}
            />
            <AnimatedLine words={line3} startIndex={line3Start} className="text-texte" />
          </h1>

        </div>
      </div>

      {/* Bottom block — subtitle + CTAs */}
      <div className="w-full px-6 md:px-20 pt-6 md:pt-12 pb-14 md:pb-20 order-3">
        <div className="md:max-w-[75%] mx-auto md:text-center flex flex-col md:items-center gap-6">

          {/* Subtitle */}
          <p
            className="text-[15px] md:text-[18px]"
            style={{
              fontFamily: "var(--font-dm-sans-var)",
              lineHeight: 1.65,
              color: "rgba(41, 26, 16, 0.7)",
              maxWidth: "560px",
              fontWeight: 400,
              ...revealStyle(120),
            }}
          >
            Planning, budget et prestataires choisis pour votre style, votre univers, vos envies. Tout est pensé autour de vous.
          </p>

          {/* Mobile CTA — single full-width button */}
          <a
            href="#couples"
            className="block md:hidden w-full text-center"
            style={{
              fontFamily: "var(--font-dm-sans-var)",
              fontSize: "11px",
              letterSpacing: "0.13em",
              textTransform: "uppercase",
              fontWeight: 500,
              backgroundColor: "var(--color-accent)",
              color: "var(--color-creme)",
              padding: "18px 24px",
              borderRadius: "12px",
              textDecoration: "none",
              ...revealStyle(200),
            }}
          >
            Découvrir Wedly →
          </a>

          {/* Desktop CTAs — button + text link */}
          <div
            className="hidden md:flex flex-col items-center gap-4 md:flex-row md:justify-center md:gap-6"
            style={revealStyle(340)}
          >
            <a
              href="#couples"
              className="text-creme rounded-full hover:opacity-90 transition-opacity"
              style={{
                fontFamily: "var(--font-dm-sans-var)",
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontWeight: 500,
                backgroundColor: "var(--color-accent)",
                padding: "14px 28px",
                textDecoration: "none",
              }}
            >
              Découvrir Wedly <span>→</span>
            </a>
            <a
              href="#how"
              style={{
                fontFamily: "var(--font-cormorant-var)",
                fontStyle: "italic",
                fontSize: "15px",
                color: "var(--color-bordeaux)",
                padding: "14px 6px",
                textDecoration: "none",
              }}
            >
              Voir comment ça marche
            </a>
          </div>

        </div>
      </div>

    </section>
  );
}
