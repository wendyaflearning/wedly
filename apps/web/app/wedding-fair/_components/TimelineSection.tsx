type RowPosition = "first" | "middle" | "last";

function rowStyle(position: RowPosition): React.CSSProperties {
  const padding = position === "first" ? "0 0 28px" : position === "middle" ? "28px 0" : "28px 0 0";
  return {
    gap: "20px",
    padding,
    borderBottom: position === "last" ? undefined : "1px solid rgba(255,246,237,0.14)",
  };
}

function DotRow({ text, position, big }: { text: string; position: RowPosition; big?: boolean }) {
  return (
    <div className="flex items-start" style={rowStyle(position)}>
      <div style={{ flex: "0 0 40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: big ? "12px" : "8px",
            height: big ? "12px" : "8px",
            borderRadius: "9999px",
            background: big ? "var(--color-highlight)" : "rgba(255,246,237,0.4)",
          }}
        />
      </div>
      <p
        className="m-0"
        style={
          big
            ? {
                fontFamily: "var(--font-cormorant-var)",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: "clamp(22px,2.4vw,28px)",
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
                color: "var(--color-dore)",
              }
            : {
                fontFamily: "var(--font-manrope-var)",
                fontWeight: 400,
                fontSize: "clamp(15px,1.5vw,17px)",
                lineHeight: 1.6,
                color: "rgba(255,246,237,0.85)",
              }
        }
      >
        {text}
      </p>
    </div>
  );
}

function NumberedRow({
  number,
  text,
  position,
  active,
}: {
  number: string;
  text: string;
  position: RowPosition;
  active?: boolean;
}) {
  return (
    <div className="flex items-start" style={rowStyle(position)}>
      <div
        style={{
          flex: "0 0 40px",
          height: "40px",
          borderRadius: "9999px",
          border: `1px solid rgba(255,246,237,${active ? 0.3 : 0.18})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-cormorant-var)",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: active ? "16px" : "15px",
          color: active ? "var(--color-dore)" : "rgba(255,246,237,0.7)",
        }}
      >
        {number}
      </div>
      <p
        className="m-0"
        style={
          active
            ? {
                fontFamily: "var(--font-cormorant-var)",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: "clamp(22px,2.4vw,28px)",
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
                color: "var(--color-dore)",
              }
            : {
                fontFamily: "var(--font-manrope-var)",
                fontWeight: 400,
                fontSize: "clamp(15px,1.5vw,17px)",
                lineHeight: 1.6,
                color: "rgba(255,246,237,0.85)",
              }
        }
      >
        {text}
      </p>
    </div>
  );
}

function ColumnEyebrow({ label }: { label: string }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-manrope-var)",
        fontWeight: 600,
        fontSize: "11px",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "var(--color-dore)",
        marginBottom: "32px",
      }}
    >
      {label}
    </div>
  );
}

export default function TimelineSection() {
  return (
    <section
      id="timeline"
      className="bg-bordeaux grid mx-auto"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(360px,1fr))",
        gap: "clamp(48px,6vw,96px)",
        padding: "clamp(64px,9vw,120px) clamp(24px,7vw,100px)",
        maxWidth: "1600px",
      }}
    >
      <div className="flex flex-col">
        <ColumnEyebrow label="Couple" />
        <DotRow text="5–6 septembre, Salon du Mariage" position="first" big />
        <DotRow
          text="Une nouvelle façon de choisir vos prestataires — portée par l'inspiration, dans un univers qui vous ressemble."
          position="middle"
        />
        <DotRow text="Laissez votre email, on vient à votre rencontre sur place." position="last" />
      </div>

      <div className="flex flex-col">
        <ColumnEyebrow label="Prestataire" />
        <NumberedRow number="01" text="Complétez le formulaire, si l'aventure vous intéresse." position="first" active />
        <NumberedRow
          number="02"
          text="Nous échangeons ensemble en visio, pour mieux connaître votre univers."
          position="middle"
        />
        <NumberedRow number="03" text="Vous rejoignez la plateforme et mettez en valeur votre portfolio." position="last" />
      </div>
    </section>
  );
}
