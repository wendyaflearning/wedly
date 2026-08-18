import Image from "next/image";
import { DUOTONE_FILTER } from "./categories";

interface CategoryBubbleProps {
  href: string;
  label: string;
  tagline: string;
  imageUrl: string;
  imageAlt: string;
  size: "lg" | "sm";
}

export default function CategoryBubble({ href, label, tagline, imageUrl, imageAlt, size }: CategoryBubbleProps) {
  const circleSize = size === "lg" ? "clamp(200px, 17vw, 260px)" : "clamp(128px, 10vw, 168px)";
  const nameFontSize = size === "lg" ? "clamp(24px, 2vw, 30px)" : "clamp(17px, 1.4vw, 20px)";

  return (
    // Écran 2 (sous-taxonomie par métier, maquette "Wedream Page Spécialités.dc.html")
    // hors scope WED-57 v4 — lien laissé en ancre en attendant ce futur ticket.
    <a href={href} className="group flex flex-col items-center text-center gap-4 no-underline">
      <div
        className="relative rounded-full overflow-hidden transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1.5"
        style={{ width: circleSize, height: circleSize, backgroundColor: "#EDE1D3" }}
      >
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover"
          style={{ filter: DUOTONE_FILTER }}
          sizes={size === "lg" ? "260px" : "168px"}
        />
      </div>
      <div>
        <h3
          className="text-bordeaux m-0"
          style={{
            fontFamily: "var(--font-cormorant-var)",
            fontWeight: 300,
            fontStyle: size === "lg" ? "italic" : "normal",
            fontSize: nameFontSize,
            letterSpacing: "-0.01em",
          }}
        >
          {label}
        </h3>
        <p
          className="text-gris m-0 mx-auto"
          style={{
            fontFamily: "var(--font-manrope-var)",
            fontSize: "12px",
            lineHeight: 1.45,
            marginTop: "6px",
            maxWidth: "190px",
          }}
        >
          {tagline}
        </p>
        <div className="w-5 h-5 rounded-full border border-bordeaux flex items-center justify-center mx-auto mt-2.5">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12H19M19 12L13 6M19 12L13 18"
              stroke="var(--color-bordeaux)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </a>
  );
}
