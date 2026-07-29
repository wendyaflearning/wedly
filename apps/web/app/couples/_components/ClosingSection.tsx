export default function ClosingSection() {
  return (
    <section className="bg-creme flex flex-col items-center justify-center gap-8 md:gap-9 px-6 py-16 md:py-24 text-center">
      <p
        className="text-texte m-0"
        style={{
          fontFamily: "var(--font-cormorant-var)",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: "clamp(1.875rem, 4vw, 2.75rem)",
          lineHeight: 1.32,
          letterSpacing: "-0.01em",
        }}
      >
        Et si on commençait, à deux (à trois) ?
      </p>
      <a
        href="#"
        className="inline-flex items-center justify-center transition-opacity hover:opacity-90"
        style={{
          fontFamily: "var(--font-manrope-var)",
          fontSize: "11px",
          letterSpacing: "0.13em",
          textTransform: "uppercase",
          fontWeight: 500,
          color: "var(--color-creme)",
          backgroundColor: "var(--color-accent)",
          padding: "16px 32px",
          borderRadius: "9999px",
          textDecoration: "none",
        }}
      >
        Oui, on se lance
      </a>
    </section>
  );
}
