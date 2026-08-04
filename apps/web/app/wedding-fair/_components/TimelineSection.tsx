type RowPosition = "first" | "middle" | "last";

interface Dims {
  rowGap: string;
  padFirst: string;
  padMiddle: string;
  padLast: string;
  dotWrap: string;
  dotBig: string;
  dotSmall: string;
  textBig: string;
  textSmall: string;
  numberFontBig: string;
  numberFontSmall: string;
  eyebrowSize: string;
  eyebrowMB: string;
}

const DESKTOP_DIMS: Dims = {
  rowGap: "20px",
  padFirst: "0 0 28px",
  padMiddle: "28px 0",
  padLast: "28px 0 0",
  dotWrap: "40px",
  dotBig: "12px",
  dotSmall: "8px",
  textBig: "clamp(22px,2.4vw,28px)",
  textSmall: "clamp(15px,1.5vw,17px)",
  numberFontBig: "16px",
  numberFontSmall: "15px",
  eyebrowSize: "11px",
  eyebrowMB: "32px",
};

const MOBILE_DIMS: Dims = {
  rowGap: "14px",
  padFirst: "0 0 20px",
  padMiddle: "20px 0",
  padLast: "20px 0 0",
  dotWrap: "32px",
  dotBig: "10px",
  dotSmall: "7px",
  textBig: "19px",
  textSmall: "14px",
  numberFontBig: "14px",
  numberFontSmall: "13px",
  eyebrowSize: "10px",
  eyebrowMB: "22px",
};

function rowStyle(position: RowPosition, d: Dims): React.CSSProperties {
  const padding = position === "first" ? d.padFirst : position === "middle" ? d.padMiddle : d.padLast;
  return {
    gap: d.rowGap,
    padding,
    borderBottom: position === "last" ? undefined : "1px solid rgba(255,246,237,0.14)",
  };
}

function DotRow({ text, position, big, d }: { text: string; position: RowPosition; big?: boolean; d: Dims }) {
  return (
    <div className="flex items-start" style={rowStyle(position, d)}>
      <div style={{ flex: `0 0 ${d.dotWrap}`, height: d.dotWrap, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: big ? d.dotBig : d.dotSmall,
            height: big ? d.dotBig : d.dotSmall,
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
                fontSize: d.textBig,
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
                color: "var(--color-dore)",
              }
            : {
                fontFamily: "var(--font-manrope-var)",
                fontWeight: 400,
                fontSize: d.textSmall,
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
  d,
}: {
  number: string;
  text: string;
  position: RowPosition;
  active?: boolean;
  d: Dims;
}) {
  return (
    <div className="flex items-start" style={rowStyle(position, d)}>
      <div
        style={{
          flex: `0 0 ${d.dotWrap}`,
          height: d.dotWrap,
          borderRadius: "9999px",
          border: `1px solid rgba(255,246,237,${active ? 0.3 : 0.18})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-cormorant-var)",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: active ? d.numberFontBig : d.numberFontSmall,
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
                fontSize: d.textBig,
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
                color: "var(--color-dore)",
              }
            : {
                fontFamily: "var(--font-manrope-var)",
                fontWeight: 400,
                fontSize: d.textSmall,
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

function ColumnEyebrow({ label, d }: { label: string; d: Dims }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-manrope-var)",
        fontWeight: 600,
        fontSize: d.eyebrowSize,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "var(--color-dore)",
        marginBottom: d.eyebrowMB,
      }}
    >
      {label}
    </div>
  );
}

function Columns({ d }: { d: Dims }) {
  return (
    <>
      <div className="flex flex-col">
        <ColumnEyebrow label="Couple" d={d} />
        <DotRow text="5–6 septembre, Salon du Mariage" position="first" big d={d} />
        <DotRow
          text="Une nouvelle façon de choisir vos prestataires — portée par l'inspiration, dans un univers qui vous ressemble."
          position="middle"
          d={d}
        />
        <DotRow text="Laissez votre email, on vient à votre rencontre sur place." position="last" d={d} />
      </div>

      <div className="flex flex-col">
        <ColumnEyebrow label="Prestataire" d={d} />
        <NumberedRow number="01" text="Complétez le formulaire, si l'aventure vous intéresse." position="first" active d={d} />
        <NumberedRow
          number="02"
          text="Nous échangeons ensemble en visio, pour mieux connaître votre univers."
          position="middle"
          d={d}
        />
        <NumberedRow number="03" text="Vous rejoignez la plateforme et mettez en valeur votre portfolio." position="last" d={d} />
      </div>
    </>
  );
}

export default function TimelineSection() {
  return (
    <section id="timeline" className="bg-bordeaux">
      {/* Mobile — calé sur le mock 390px */}
      <div className="md:hidden flex flex-col" style={{ gap: "44px", padding: "48px 26px" }}>
        <Columns d={MOBILE_DIMS} />
      </div>

      {/* Desktop — inchangé */}
      <div
        className="hidden md:grid mx-auto"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(min(360px,100%),1fr))",
          gap: "clamp(48px,6vw,96px)",
          padding: "clamp(64px,9vw,120px) clamp(24px,7vw,100px)",
          maxWidth: "1600px",
        }}
      >
        <Columns d={DESKTOP_DIMS} />
      </div>
    </section>
  );
}
