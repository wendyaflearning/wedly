import Image from "next/image";

const WORD_START = 0.15;
const WORD_STEP = 0.08;

const heroLine1 = ["De", "l'inspiration", "à", "la"];
const heroLine2 = ["réalité", "en", "un", "clic."];

function AnimatedLine({ words, startIndex }: { words: string[]; startIndex: number }) {
  return (
    <span className="block">
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

export default function WedreamHero() {
  return (
    <section className="relative h-svh md:h-screen bg-creme overflow-hidden snap-start">
      <Image
        src="https://res.cloudinary.com/dadvrspox/image/upload/v1787048949/wedream_atx5zd.jpg"
        alt="Wedream"
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-creme/55 pointer-events-none" />

      <div
        className="absolute inset-x-[5%] top-[5vh] bottom-[5vh] px-[18px] py-[30px] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[min(1760px,88%)] md:top-[6vh] md:bottom-[6vh] md:px-[56px] md:py-[48px] border border-bordeaux/30 flex flex-col items-center justify-between box-border"
      >
        <p
          className="text-bordeaux uppercase m-0"
          style={{
            fontFamily: "var(--font-manrope-var)",
            fontWeight: 500,
            fontSize: "clamp(13px, 1.6vw, 25px)",
            letterSpacing: "0.32em",
          }}
        >
          Wedream
        </p>

        <div className="flex flex-col items-center text-center gap-4 md:gap-5">
          <h1
            className="text-bordeaux m-0"
            style={{
              fontFamily: "var(--font-cormorant-var)",
              fontWeight: 300,
              fontSize: "clamp(2rem, 5.4vw, 4.75rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
            }}
          >
            <AnimatedLine words={heroLine1} startIndex={0} />
            <AnimatedLine words={heroLine2} startIndex={heroLine1.length} />
          </h1>
          <p
            className="text-bordeaux m-0"
            style={{
              fontFamily: "var(--font-cormorant-var)",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(15px, 1.8vw, 22px)",
              lineHeight: 1.5,
            }}
          >
            Le mariage dont vous avez toujours rêvé.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p
            className="text-bordeaux/75 uppercase m-0"
            style={{ fontFamily: "var(--font-manrope-var)", fontWeight: 500, fontSize: "9px", letterSpacing: "0.22em" }}
          >
            Découvrir
          </p>
          <div className="scroll-line w-px h-5 md:h-[26px] bg-bordeaux/50" />
        </div>
      </div>
    </section>
  );
}
