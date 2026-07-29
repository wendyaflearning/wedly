import TallyEmbed from "./TallyEmbed";

export default function FormSection() {
  return (
    <section
      id="form"
      className="flex flex-col items-center mx-auto"
      style={{ padding: "clamp(64px,9vw,120px) clamp(24px,7vw,100px)", maxWidth: "760px" }}
    >
      <p
        className="italic text-texte text-center m-0"
        style={{
          fontFamily: "var(--font-cormorant-var)",
          fontWeight: 300,
          fontSize: "clamp(24px,3vw,32px)",
          lineHeight: 1.32,
          letterSpacing: "-0.01em",
          marginBottom: "40px",
          maxWidth: "520px",
        }}
      >
        Un premier pas, et on s&apos;occupe du reste.
      </p>

      <div
        className="w-full box-border"
        style={{
          border: "1px solid rgba(41,26,16,0.12)",
          borderRadius: "16px",
          padding: "clamp(32px,5vw,56px) clamp(24px,4vw,40px)",
          background: "rgb(246,237,226)",
        }}
      >
        <TallyEmbed />
      </div>
    </section>
  );
}
