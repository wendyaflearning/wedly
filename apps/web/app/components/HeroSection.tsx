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
const TOTAL_WORDS = 12; // 4+4+4 (line1 + line2 + line3)
const HEADLINE_END = WORD_START + (TOTAL_WORDS - 1) * WORD_STEP + WORD_DURATION; // ~1.68s

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

      {/* Bloc texte haut — eyebrow + titre */}
      <div className="w-full px-6 md:px-20 pt-12 md:pt-16 pb-6 md:pb-10">
        <div className="md:max-w-[75%] mx-auto text-center">

          {/* Eyebrow */}
          <p style={{ fontFamily: "var(--font-dm-sans-var)", fontSize: "11px", letterSpacing: "0.14em", color: "var(--color-accent)", textTransform: "uppercase", marginBottom: "1.5rem" }}>
            Wedplan · WedWallet · WedMatch
          </p>

          {/* H1 — 3 lignes animées */}
          <h1 style={{ fontFamily: "var(--font-cormorant-var)", fontWeight: 300, fontSize: "clamp(3rem, 6vw, 5.5rem)", lineHeight: 1.05, margin: 0 }}>
            <AnimatedLine words={line1} startIndex={0} className="text-texte" />
            <AnimatedLine words={line2} startIndex={line2Start} className="text-texte italic" />
            <AnimatedLine
              words={line3}
              startIndex={line3Start}
              wordStyle={{ color: "var(--color-accent)" }}
            />
          </h1>

        </div>
      </div>

      {/* Frise illustration — cœur visuel, pleine largeur */}
      <div className="w-full" aria-hidden>
        <img
          src="https://res.cloudinary.com/dadvrspox/image/upload/v1781796293/illustration_yaswvk.png"
          alt="Six couples enlacés, dessinés d'un seul trait continu"
          className="w-full object-cover illustration-animate"
          style={{ maxHeight: "320px", objectPosition: "center" }}
        />
      </div>

      {/* Bloc texte bas — sous-titre + slogan + CTAs */}
      <div className="w-full px-6 md:px-20 pt-8 md:pt-12 pb-16 md:pb-20">
        <div className="md:max-w-[75%] mx-auto text-center flex flex-col items-center gap-6">

          {/* Sous-titre */}
          <p className="text-[15px] md:text-[18px]" style={{ fontFamily: "var(--font-dm-sans-var)", lineHeight: 1.6, color: "rgba(41, 26, 16, 0.7)", maxWidth: "560px", fontWeight: 400, ...revealStyle(120) }}>
            Planning, budget et prestataires choisis pour votre style, votre univers, vos envies. Tout est pensé autour de vous — pas l'inverse.
          </p>

          {/* Slogan */}
          <p className="text-[14px] md:text-[17px]" style={{ fontFamily: "var(--font-cormorant-var)", fontStyle: "italic", fontWeight: 400, lineHeight: 1.5, color: "var(--color-accent)", ...revealStyle(220) }}>
            Wedly pense à tout. Vous, pensez à vous aimer.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-center md:gap-6" style={revealStyle(340)}>
            <a
              href="#couples"
              className="text-creme rounded-full hover:opacity-90 transition-opacity"
              style={{ fontFamily: "var(--font-dm-sans-var)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, backgroundColor: "var(--color-accent)", padding: "14px 28px" }}
            >
              Découvrir Wedly <span>→</span>
            </a>
            <a
              href="#how"
              style={{ fontFamily: "var(--font-cormorant-var)", fontStyle: "italic", fontSize: "15px", color: "var(--color-bordeaux)", padding: "14px 6px", textDecoration: "none" }}
            >
              Voir comment ça marche
            </a>
          </div>

        </div>
      </div>

    </section>
  );
}
