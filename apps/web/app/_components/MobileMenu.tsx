"use client";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

const items = [
  { icon: <ClockIcon />, label: "Comment ça marche", sub: "Découvrez notre approche", href: "#how" },
  { icon: <HeartIcon />, label: "Pour les couples", sub: "Planification & prestataires", href: "#couples" },
  { icon: <BriefcaseIcon />, label: "Pour les prestataires", sub: "Visibilité & demandes qualifiées", href: "#prestataires" },
  { icon: <PersonIcon />, label: "À propos", sub: "Notre mission & équipe", href: "#histoire" },
];

export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(41, 26, 16, 0.45)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative bg-creme rounded-t-3xl modal-enter" style={{ paddingBottom: "env(safe-area-inset-bottom, 24px)" }}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "rgba(158, 142, 133, 0.45)" }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(158, 142, 133, 0.25)" }}
        >
          <span style={{ fontFamily: "var(--font-cormorant-var)", fontStyle: "italic", fontSize: "22px", color: "var(--color-texte)", fontWeight: 400 }}>
            Menu
          </span>
          <button onClick={onClose} aria-label="Fermer le menu" className="p-1" style={{ color: "var(--color-texte)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" width={22} height={22}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu items */}
        <ul className="px-4">
          {items.map(({ icon, label, sub, href }) => (
            <li key={label} style={{ borderBottom: "1px solid rgba(158, 142, 133, 0.2)" }}>
              <a
                href={href}
                onClick={onClose}
                className="flex items-center gap-4 py-4 px-2"
                style={{ textDecoration: "none" }}
              >
                <div
                  className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(157, 79, 30, 0.1)", color: "var(--color-accent)" }}
                >
                  {icon}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span style={{ fontFamily: "var(--font-cormorant-var)", fontSize: "20px", color: "var(--color-texte)", fontWeight: 400 }}>
                    {label}
                  </span>
                  <span style={{ fontFamily: "var(--font-dm-sans-var)", fontSize: "13px", color: "var(--color-gris)", fontWeight: 400 }}>
                    {sub}
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="flex gap-3 px-6 pt-5 pb-6">
          <a
            href="#couples"
            onClick={onClose}
            className="flex-1 flex items-center justify-center"
            style={{
              fontFamily: "var(--font-dm-sans-var)",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 500,
              backgroundColor: "var(--color-bordeaux)",
              color: "var(--color-creme)",
              padding: "15px 16px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            Commencer →
          </a>
          <a
            href="/login"
            onClick={onClose}
            className="flex-1 flex items-center justify-center"
            style={{
              fontFamily: "var(--font-dm-sans-var)",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 500,
              color: "var(--color-texte)",
              border: "1px solid rgba(41, 26, 16, 0.3)",
              padding: "15px 16px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            Se connecter
          </a>
        </div>
      </div>
    </div>
  );
}
