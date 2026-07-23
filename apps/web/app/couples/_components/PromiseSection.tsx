const ORNAMENT_PATHS = [
  "M2,10 C10,10 14,4 22,4",
  "M2,10 C10,10 14,16 22,16",
  "M42,10 C34,10 30,4 22,4",
  "M42,10 C34,10 30,16 22,16",
];

function PapeterieOrnament() {
  return (
    <svg
      viewBox="0 0 44 20"
      fill="none"
      className="w-[34px] h-4 md:w-11 md:h-5 shrink-0 text-accent"
      aria-hidden="true"
    >
      {ORNAMENT_PATHS.map((d) => (
        <path key={d} d={d} stroke="currentColor" strokeWidth={1} strokeLinecap="round" />
      ))}
      <circle cx="22" cy="10" r="1.6" fill="currentColor" />
    </svg>
  );
}

export default function PromiseSection() {
  return (
    <section className="bg-creme">
      <div className="flex items-center justify-center px-6 md:px-20 py-20 md:py-32">
        <p
          className="text-center text-texte"
          style={{
            fontFamily: "var(--font-cormorant-var)",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: "clamp(1.8rem, 4.5vw, 3.125rem)",
            lineHeight: 1.42,
            letterSpacing: "-0.01em",
            maxWidth: "760px",
            margin: 0,
          }}
        >
          Un mariage, ça se prépare à deux.
          <br />
          On a juste ajouté un troisième complice.
        </p>
      </div>

      {/* Séparateur papeterie */}
      <div className="flex items-center gap-3.5 md:gap-6 px-7 md:px-[120px] pb-11 md:pb-16">
        <div className="flex-1 h-px bg-accent/35" />
        <PapeterieOrnament />
        <div className="flex-1 h-px bg-accent/35" />
      </div>
    </section>
  );
}
