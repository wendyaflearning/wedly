export default function HeroWedream() {
  return (
    <section className="relative bg-bordeaux overflow-hidden aspect-[9/19.5] md:aspect-[16/9] md:max-h-[86vh]">
      {/* Texture tissu drapé — en attente du vrai visuel (assets/wedream-fabric-texture-only.png) */}
      <div
        role="img"
        aria-label="Tissu drapé — texture soie Wedream"
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage:
            "radial-gradient(120% 90% at 50% 10%, rgba(232,168,124,0.16) 0%, rgba(78,26,50,0) 60%), linear-gradient(180deg, rgba(41,26,16,0.22) 0%, rgba(41,26,16,0.06) 38%, rgba(41,26,16,0.4) 100%)",
        }}
      />

      {/* Cadre fin */}
      <div className="absolute inset-5 md:inset-7 border border-creme/55 flex flex-col items-center justify-between p-6 md:p-9">
        <p
          className="text-creme uppercase m-0"
          style={{ fontFamily: "var(--font-manrope-var)", fontWeight: 500, fontSize: "11px", letterSpacing: "0.3em" }}
        >
          Wedream
        </p>

        <div className="flex flex-col items-center text-center gap-3.5 md:gap-4">
          <h1
            className="text-creme m-0"
            style={{
              fontFamily: "var(--font-cormorant-var)",
              fontWeight: 300,
              fontSize: "clamp(2rem, 5vw, 2.375rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
              textShadow: "0 3px 18px rgba(41,26,16,0.3)",
            }}
          >
            Le mariage dont vous
            <br />
            avez toujours rêvé.
          </h1>
          <p
            className="text-dore m-0"
            style={{ fontFamily: "var(--font-cormorant-var)", fontStyle: "italic", fontWeight: 400, fontSize: "16px" }}
          >
            De l&apos;inspiration à la réalité en un clic.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p
            className="text-creme/75 uppercase m-0"
            style={{ fontFamily: "var(--font-manrope-var)", fontWeight: 500, fontSize: "9px", letterSpacing: "0.22em" }}
          >
            Découvrir
          </p>
          <div className="w-px h-5 bg-creme/50" />
        </div>
      </div>

      {/* Transition ondulée vers la section suivante */}
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className="absolute left-0 bottom-[-1px] w-full h-[60px] md:h-[100px]"
        aria-hidden="true"
      >
        <path
          d="M0,42 C200,72 320,10 520,38 C700,64 860,16 1060,42 C1220,64 1340,42 1440,48 L1440,100 L0,100 Z"
          fill="var(--color-creme)"
        />
      </svg>
    </section>
  );
}
