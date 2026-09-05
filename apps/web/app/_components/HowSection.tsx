const STEPS = [
  {
    num: "01",
    title: "Inspirez-vous",
    desc: "Parcourez Wedream, une galerie pensée pour rêver avant de décider.",
  },
  {
    num: "02",
    title: "Rencontrez",
    desc: "Demandez une mise en relation avec les prestataires qui vous ressemblent.",
  },
  {
    num: "03",
    title: "Construisez",
    desc: "Bâtissez votre mariage avec les prestataires que vous avez choisis.",
  },
];

export default function HowSection() {
  return (
    <section id="how" className="w-full bg-creme px-6 md:px-[100px] pb-16 md:pb-24">
      <div className="w-16 h-px mb-4" style={{ background: "rgba(78,26,50,0.28)" }} />
      <p
        className="mb-9"
        style={{
          fontFamily: "var(--font-manrope-var)",
          fontSize: "11px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#9D4F1E",
        }}
      >
        Comment ça marche
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
        {STEPS.map((step) => (
          <div key={step.num} className="flex flex-col gap-2.5">
            <span
              style={{ fontFamily: "var(--font-cormorant-var)", fontWeight: 300, fontSize: "40px", color: "var(--color-accent)", lineHeight: 1 }}
            >
              {step.num}
            </span>
            <h3
              style={{ fontFamily: "var(--font-cormorant-var)", fontStyle: "italic", fontWeight: 400, fontSize: "19px", color: "var(--color-texte)" }}
            >
              {step.title}
            </h3>
            <p style={{ fontFamily: "var(--font-dm-sans-var)", fontSize: "14px", lineHeight: 1.55, color: "var(--color-gris)" }}>
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
