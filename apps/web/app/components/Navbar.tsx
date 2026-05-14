import Image from "next/image";

export default function Navbar() {
  return (
    <header className="relative w-full bg-creme px-6 py-4 md:px-10 md:py-8 flex items-center justify-center md:justify-between">
      <a href="/" className="shrink-0" aria-label="Wedly — accueil">
        <Image src="/logo.png" alt="Wedly" width={140} height={48} priority />
      </a>

      {/* Centrage absolu pour que les liens soient toujours au milieu exact */}
      <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
        {[
          { label: "Comment ça marche", href: "#how" },
          { label: "Nos prestataires", href: "#prestataires" },
          { label: "Notre histoire", href: "#histoire" },
        ].map(({ label, href }) => (
          <a
            key={label}
            href={href}
            style={{
              fontFamily: "var(--font-dm-sans-var)",
              fontSize: "11px",
              letterSpacing: "0.12em",
              color: "rgba(41, 26, 16, 0.7)",
              textDecoration: "none",
              textTransform: "uppercase",
              fontWeight: 400,
            }}
          >
            {label}
          </a>
        ))}
      </nav>

      <p
        className="hidden md:block shrink-0"
        style={{ fontFamily: "var(--font-dm-sans-var)", fontSize: "11px", color: "rgba(41, 26, 16, 0.5)", fontStyle: "italic" }}
      >
        Lancement France · 2025 · Accès sur invitation
      </p>
    </header>
  );
}
