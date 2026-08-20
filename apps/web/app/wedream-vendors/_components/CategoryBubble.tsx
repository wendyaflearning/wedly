import Image from "next/image";
import Link from "next/link";

interface CategoryBubbleProps {
  href: string;
  label: string;
  tagline: string;
  imageUrl: string;
  imageAlt: string;
  size: "lg" | "sm";
}

export default function CategoryBubble({ href, label, tagline, imageUrl, imageAlt, size }: CategoryBubbleProps) {
  const circleClass =
    size === "lg"
      ? "w-[200px] h-[200px] md:w-[clamp(200px,17vw,260px)] md:h-[clamp(200px,17vw,260px)]"
      : "w-[128px] h-[128px] md:w-[clamp(128px,10vw,168px)] md:h-[clamp(128px,10vw,168px)]";
  const nameClass =
    size === "lg"
      ? "text-[26px] italic md:text-[clamp(24px,2vw,30px)]"
      : "text-[17px] not-italic md:text-[clamp(17px,1.4vw,20px)]";

  return (
    <Link href={href} prefetch={false} className="group flex flex-col items-center text-center gap-4 no-underline">
      <div
        className={`relative rounded-full overflow-hidden transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1.5 ${circleClass}`}
        style={{ backgroundColor: "#EDE1D3" }}
      >
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover grayscale md:grayscale-0"
          sizes={size === "lg" ? "260px" : "168px"}
        />
      </div>
      <div>
        <h3
          className={`text-bordeaux m-0 ${nameClass}`}
          style={{ fontFamily: "var(--font-cormorant-var)", fontWeight: 300, letterSpacing: "-0.01em" }}
        >
          {label}
        </h3>
        <p
          className="text-gris m-0 mx-auto mt-1 max-w-[170px] min-h-[35px] md:mt-1.5 md:max-w-[190px]"
          style={{ fontFamily: "var(--font-manrope-var)", fontSize: "12px", lineHeight: 1.45 }}
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
    </Link>
  );
}
