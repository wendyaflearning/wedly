interface PhotoPlaceholderProps {
  label: string;
  className?: string;
  style?: React.CSSProperties;
  variant?: "light" | "dark";
}

export default function PhotoPlaceholder({ label, className = "", style, variant = "light" }: PhotoPlaceholderProps) {
  const toneClasses =
    variant === "dark" ? "border-creme/25 bg-creme/5 text-creme/60" : "border-bordeaux/20 bg-bordeaux/5 text-gris";

  return (
    <div
      role="img"
      aria-label={label}
      className={`flex items-center justify-center text-center border-[1.5px] border-dashed rounded ${toneClasses} ${className}`}
      style={style}
    >
      <span className="px-4" style={{ fontFamily: "var(--font-dm-sans-var)", fontSize: "12px", lineHeight: 1.5 }}>
        {label}
      </span>
    </div>
  );
}
