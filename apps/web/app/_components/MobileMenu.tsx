"use client";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  links: { label: string; href: string }[];
}

export default function MobileMenu({ open, onClose, links }: MobileMenuProps) {
  if (!open) return null;

  return (
    // z-[80] : même palier que AccountCreationModal, au-dessus du badge de
    // gestes en attente (z-50) qui reste sinon visible par-dessus le menu.
    <div className="fixed inset-0 z-[80] flex flex-col justify-end md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(41, 26, 16, 0.45)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative bg-creme rounded-t-3xl modal-enter" style={{ paddingBottom: "env(safe-area-inset-bottom, 24px)" }}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "rgba(158, 142, 133, 0.45)" }} />
        </div>

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

        <ul className="px-4">
          {links.map(({ label, href }) => (
            <li key={label} style={{ borderBottom: "1px solid rgba(158, 142, 133, 0.2)" }}>
              <a
                href={href}
                onClick={onClose}
                className="flex items-center py-4 px-2"
                style={{
                  textDecoration: "none",
                  fontFamily: "var(--font-cormorant-var)",
                  fontSize: "20px",
                  color: "var(--color-texte)",
                  fontWeight: 400,
                }}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex gap-3 px-6 pt-5 pb-6">
          <a
            href="/couple-onboarding"
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
            Inscription
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
            Connexion
          </a>
        </div>
      </div>
    </div>
  );
}
