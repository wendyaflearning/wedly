export default function TransitionSection() {
  return (
    <section className="w-full bg-creme px-6 md:px-[100px] py-10 md:py-14">
      <div
        className="max-w-[820px] mx-auto flex flex-col items-center gap-4 text-center py-10 md:py-14"
        style={{ borderTop: "1px solid rgba(78,26,50,0.12)", borderBottom: "1px solid rgba(78,26,50,0.12)" }}
      >
        <p
          style={{
            fontFamily: "var(--font-manrope-var)",
            fontSize: "11px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#9D4F1E",
          }}
        >
          Concept Wedream
        </p>
        <p
          style={{
            fontFamily: "var(--font-cormorant-var)",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(19px, 2.2vw, 24px)",
            lineHeight: 1.5,
            color: "var(--color-bordeaux)",
          }}
        >
          On le sait, l&apos;inspiration paraît parfois loin de la réalité. Et
          pourtant, pas à pas, elle prend forme, aussi sûrement qu&apos;un mariage se
          construit.
        </p>
        <p
          style={{
            fontFamily: "var(--font-cormorant-var)",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(19px, 2.2vw, 24px)",
            lineHeight: 1.5,
            color: "var(--color-bordeaux)",
          }}
        >
          C&apos;est tout l&apos;esprit de Wedream.
        </p>
      </div>
    </section>
  );
}
