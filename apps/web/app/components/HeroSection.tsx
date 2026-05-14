"use client";

interface AnimatedLineProps {
  words: string[];
  startIndex: number;
  className?: string;
  style?: React.CSSProperties;
}

// Word animation: starts at 180ms, 100ms stagger between words
const WORD_START = 0.18;
const WORD_STEP = 0.1;
const WORD_DURATION = 0.4;
const TOTAL_WORDS = 10; // 3+3+4 (line1 + line2a + line2b)
const HEADLINE_END = WORD_START + (TOTAL_WORDS - 1) * WORD_STEP + WORD_DURATION; // ~1.68s

function AnimatedLine({ words, startIndex, className = "", style }: AnimatedLineProps) {
  return (
    <span className={`block ${className}`} style={style}>
      {words.map((word, i) => (
        <span
          key={i}
          className="word-animate inline-block"
          style={{ animationDelay: `${WORD_START + (startIndex + i) * WORD_STEP}s`, marginRight: "0.22em" }}
        >
          {word}
        </span>
      ))}
    </span>
  );
}

const line1 = ["Du", "mariage", "Pinterest"];
const line2a = ["à", "la", "réalité,"]; // italic texte
const line2b = ["il", "y", "a", "Wedly."]; // italic accent

export default function HeroSection() {
  const line2aStart = line1.length;
  const line2bStart = line1.length + line2a.length;

  // Reveal delays: elements appear after headline completes (+offset from reference)
  const revealStyle = (offsetMs: number): React.CSSProperties => ({
    opacity: 0,
    animation: `word-in 0.5s ease forwards`,
    animationDelay: `${HEADLINE_END + offsetMs / 1000}s`,
  });

  return (
    <section className="flex-1 bg-creme relative overflow-hidden flex items-start">

      {/* Deco — position absolue comme dans la maquette, ne consomme pas d'espace layout */}
      <div className="hidden md:block absolute inset-0 pointer-events-none" aria-hidden>
        {/* c-1 : grand cercle, ancré en haut à droite, dépasse uniquement vers la droite */}
        <div
          className="absolute rounded-full bg-bordeaux/10"
          style={{ width: 500, height: 500, top: 0, right: -160 }}
        />
        {/* ring-1 : anneau, superposé à c-1 */}
        <div
          className="absolute rounded-full border border-bordeaux/15"
          style={{ width: 320, height: 320, top: 200, right: 40 }}
        />
        {/* c-2 : cercle plein, bas droit, groupé avec c-1 */}
        <div
          className="absolute rounded-full bg-bordeaux/10"
          style={{ width: 340, height: 340, bottom: -60, right: -100 }}
        />
      </div>

      {/* Hero inner — texte sur toute la largeur gauche, z-index au dessus du deco */}
      <div className="relative z-10 w-full px-6 md:px-20 pt-12 md:pt-30 pb-16 md:pb-20">
        <div className="md:max-w-[75%] flex flex-col gap-6">

          {/* Eyebrow */}
          <p style={{ fontFamily: "var(--font-dm-sans-var)", fontSize: "11px", letterSpacing: "0.14em", color: "var(--color-accent)", textTransform: "uppercase" }}>
            Planification · Budget · Prestataires
          </p>

          {/* H1 animé — imposant, remplit l'espace */}
          <h1 style={{ fontFamily: "var(--font-cormorant-var)", fontWeight: 300, fontSize: "clamp(3rem, 6vw, 5.5rem)", lineHeight: 1.05, margin: 0 }}>
            <AnimatedLine words={line1} startIndex={0} className="text-texte" />
            {/* Ligne 2 : deux segments de couleur sur la même ligne */}
            <span className="block italic">
              {line2a.map((word, i) => (
                <span
                  key={`2a-${i}`}
                  className="word-animate inline-block text-texte"
                  style={{ animationDelay: `${WORD_START + (line2aStart + i) * WORD_STEP}s`, marginRight: "0.22em" }}
                >
                  {word}
                </span>
              ))}
              {line2b.map((word, i) => (
                <span
                  key={`2b-${i}`}
                  className="word-animate inline-block"
                  style={{ animationDelay: `${WORD_START + (line2bStart + i) * WORD_STEP}s`, marginRight: "0.22em", color: "var(--color-accent)" }}
                >
                  {word}
                </span>
              ))}
            </span>
          </h1>

          {/* Sous-titre */}
          <p className="text-[15px] md:text-[18px]" style={{ fontFamily: "var(--font-dm-sans-var)", lineHeight: 1.6, color: "rgba(41, 26, 16, 0.7)", maxWidth: "560px", fontWeight: 400, ...revealStyle(120) }}>
            Tout commence par votre histoire, votre univers, et votre budget pour vous guider à chaque étape.
          </p>

          {/* Slogan */}
          <p className="text-[14px] md:text-[17px]" style={{ fontFamily: "var(--font-cormorant-var)", fontStyle: "italic", fontWeight: 400, lineHeight: 1.5, color: "var(--color-accent)", ...revealStyle(220) }}>
            Wedly pense à tout. Vous, pensez à vous aimer.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-6" style={revealStyle(340)}>
            <a
              href="#prestataires"
              className="text-creme rounded-full hover:opacity-90 transition-opacity"
              style={{ fontFamily: "var(--font-dm-sans-var)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, backgroundColor: "var(--color-accent)", padding: "14px 28px" }}
            >
              Voir nos prestataires <span>→</span>
            </a>
            <a
              href="#how"
              style={{ fontFamily: "var(--font-cormorant-var)", fontStyle: "italic", fontSize: "15px", color: "var(--color-bordeaux)", padding: "14px 6px", textDecoration: "none" }}
            >
              Comment ça marche
            </a>
          </div>

        </div>
      </div>

    </section>
  );
}
